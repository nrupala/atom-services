#!/usr/bin/env python3
"""RAG retrieval evaluation & tuning — deterministic core.

Built from the bound skill `retrieval-engineering` (v1): "Build
search & RAG that answers — indexing, hybrid retrieval, reranking,
retrieval evals, access-scoped filters"; "evaluate before tuning —
always."

The caller submits a retrieval-system evidence manifest (a dict, or
JSON on the CLI). Every posture check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Three checks are computed, not declared, using ONLY the metrics and
comparisons the skill itself states, over values the caller declares
— no outside threshold is imported (every threshold below is
caller-declared per query):

- golden-set metrics (skill method 5: "golden queries with labeled
  relevant docs; measure recall@k / MRR / nDCG"): for each declared
  query, over its declared relevant_doc_ids and ranked
  retrieved_doc_ids —
    recall@k = |relevant ∩ retrieved[:k]| / |relevant| (distinct ids)
    reciprocal rank = 1 / (rank of the first relevant doc in the
      full retrieved list), 0 when no relevant doc is retrieved
    nDCG@k = DCG@k / IDCG@k, where DCG@k sums
      (2**grade - 1) / log2(rank + 1) over retrieved[:k] (rank is
      1-based); the grade is the caller's declared relevance_grades
      value for the doc (unlisted = 0) when grades are declared, and
      binary (1 if the doc is relevant, else 0) when they are not;
      IDCG@k is the same sum over the positive grades sorted
      descending, truncated to k
  Each query's three computed values must meet that query's own
  declared thresholds (min_recall_at_k / min_mrr / min_ndcg_at_k).
- scope leakage (skill method 3 + red line: "filters ... applied
  before ranking or hard-enforced in queries — never leak filtered
  documents"; "no cross-scope leakage"): no retrieved doc id may
  appear in that query's declared forbidden_doc_ids.
- context budget (red line: "no unbounded context dumps to models —
  budget the tokens"): every query's declared context_tokens must be
  within the declared reranking.context_token_budget.

Computed mean metrics (mean_recall_at_k, mean_mrr, mean_ndcg_at_k)
are reported as strings with exactly four decimal places, produced
in both implementations by the same fixed rule: round half up to
4dp — floor(v * 10000 + 0.5) / 10000 — then format with exactly four
decimals. Comparisons use the unrounded values. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

Verdict:
- any fail             -> RAG_EVALUATION_UNSOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> RAG_EVALUATION_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "corpus_and_chunking",
    "hybrid_retrieval",
    "reranking_and_filters",
    "index_hygiene",
    "evaluation",
    "serving_and_privacy",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# relevance_grades is an object keyed by caller-chosen doc ids, so
# its spec is the empty object: the container type is validated,
# its entries are the caller's own judgments (the spec DSL names
# documented subfields only).
MANIFEST_SPEC = {
    "system": "string",
    "corpus": {
        "inventory_declared": "boolean",
        "freshness_requirements_declared": "boolean",
        "dedup_rules_declared": "boolean",
        "per_document_provenance_tracked": "boolean",
    },
    "chunking": {
        "semantic_units": "boolean",
        "overlap_discipline_declared": "boolean",
        "stable_chunk_ids": "boolean",
    },
    "retrieval": {
        "lexical_used": "boolean",
        "vector_used": "boolean",
        "scores_combined_with_declared_weights": "boolean",
        "embedding_model_version_pinned": "boolean",
        "reindex_plan_for_model_change": "boolean",
    },
    "reranking": {
        "applied": "boolean",
        "reranker_budget_declared": "boolean",
        "context_top_n_bounded": "boolean",
        "filters_applied_before_ranking": "boolean",
        "scope_leakage_tested": "boolean",
        "context_token_budget": "number",
    },
    "index": {
        "incremental_updates_with_tombstones": "boolean",
        "full_rebuild_drill_done": "boolean",
        "size_quota_budgets_monitored": "boolean",
        "embedding_model_and_index_versioned": "boolean",
    },
    "evaluation": {
        "golden_queries_labeled": "boolean",
        "thresholds_declared": "boolean",
        "evals_run_in_regression": "boolean",
        "real_queries_logged_privacy_scoped": "boolean",
        "tuning_performed": "boolean",
        "evals_run_before_tuning": "boolean",
    },
    "queries": [{
        "name": "string",
        "k": "number",
        "relevant_doc_ids": ["string"],
        "retrieved_doc_ids": ["string"],
        "relevance_grades": {},
        "forbidden_doc_ids": ["string"],
        "context_tokens": "number",
        "min_recall_at_k": "number",
        "min_mrr": "number",
        "min_ndcg_at_k": "number",
    }],
    "serving": {
        "latency_budgets_per_stage_declared": "boolean",
        "latency_budget_measured": "boolean",
        "hot_queries_cached": "boolean",
        "lexical_only_fallback_exists": "boolean",
    },
    "privacy": {
        "query_time_access_scopes_enforced": "boolean",
        "sensitive_content_excluded_or_encrypted": "boolean",
        "private_corpus": "boolean",
        "local_embeddings_for_private_corpus": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _is_str_list(value):
    return isinstance(value, list) and all(
        isinstance(item, str) for item in value)


def _query_metrics(query):
    """Compute (recall@k, reciprocal_rank, ndcg@k) for one query.

    Returns None when the query's metric evidence is incomplete:
    not an object, k not a positive integer, relevant_doc_ids not a
    non-empty list of strings, retrieved_doc_ids not a list of
    strings, a threshold missing / non-numeric, or relevance_grades
    present but not an object of non-negative numbers / no positive
    grade (IDCG@k would be zero).
    """
    if not isinstance(query, dict):
        return None
    k, has_k = _get(query, "k")
    relevant, has_rel = _get(query, "relevant_doc_ids")
    retrieved, has_ret = _get(query, "retrieved_doc_ids")
    grades, has_grades = _get(query, "relevance_grades")
    thresholds = []
    for field in ("min_recall_at_k", "min_mrr", "min_ndcg_at_k"):
        value, has_value = _get(query, field)
        if not (has_value and _is_number(value)):
            return None
        thresholds.append(value)
    if not (has_k and _is_number(k) and k >= 1 and k == int(k)):
        return None
    if not (has_rel and _is_str_list(relevant) and relevant):
        return None
    if not (has_ret and _is_str_list(retrieved)):
        return None
    if has_grades:
        if not isinstance(grades, dict):
            return None
        for grade in grades.values():
            if not _is_number(grade) or grade < 0:
                return None
    k = int(k)
    relevant_set = set(relevant)
    top_k = retrieved[:k]
    recall = len(relevant_set & set(top_k)) / len(relevant_set)
    reciprocal = 0.0
    for idx, doc in enumerate(retrieved):
        if doc in relevant_set:
            reciprocal = 1.0 / (idx + 1)
            break

    def grade_of(doc):
        if has_grades:
            return grades.get(doc, 0)
        return 1 if doc in relevant_set else 0

    dcg = 0.0
    for idx, doc in enumerate(top_k):
        dcg += (2 ** grade_of(doc) - 1) / math.log2(idx + 2)
    if has_grades:
        pool = sorted(
            (grade for grade in grades.values() if grade > 0),
            reverse=True)
    else:
        pool = [1] * len(relevant_set)
    idcg = 0.0
    for idx, grade in enumerate(pool[:k]):
        idcg += (2 ** grade - 1) / math.log2(idx + 2)
    if idcg == 0:
        return None
    return recall, reciprocal, dcg / idcg, thresholds


def _metrics_check(results, manifest):
    """Computed golden-set check; returns the metrics dict."""
    queries, has_queries = _get(manifest, "queries")
    empty = {"queries_total": 0, "queries_meeting_thresholds": 0,
             "mean_recall_at_k": None, "mean_mrr": None,
             "mean_ndcg_at_k": None, "leaked_doc_count": 0}
    if not has_queries or not isinstance(queries, list) or not queries:
        _check(results, "evaluation",
               "golden_metrics_meet_declared_thresholds",
               queries, False, False, "no golden queries declared")
        return empty
    incomplete = False
    violating = False
    meeting = 0
    recalls, reciprocals, ndcgs = [], [], []
    for query in queries:
        computed = _query_metrics(query)
        if computed is None:
            incomplete = True
            continue
        recall, reciprocal, ndcg, thresholds = computed
        recalls.append(recall)
        reciprocals.append(reciprocal)
        ndcgs.append(ndcg)
        if any(t < 0 or t > 1 for t in thresholds):
            violating = True
            continue
        if (recall >= thresholds[0] and reciprocal >= thresholds[1]
                and ndcg >= thresholds[2]):
            meeting += 1
        else:
            violating = True
    metrics = {"queries_total": len(queries),
               "queries_meeting_thresholds": meeting,
               "mean_recall_at_k": None, "mean_mrr": None,
               "mean_ndcg_at_k": None, "leaked_doc_count": 0}
    if incomplete:
        _check(results, "evaluation",
               "golden_metrics_meet_declared_thresholds",
               queries, False, False,
               "a golden query is missing its k, labeled relevant "
               "docs, retrieved list, or declared thresholds, or has "
               "no positive relevance grade")
        return metrics
    metrics["mean_recall_at_k"] = _fmt4(sum(recalls) / len(recalls))
    metrics["mean_mrr"] = _fmt4(sum(reciprocals) / len(reciprocals))
    metrics["mean_ndcg_at_k"] = _fmt4(sum(ndcgs) / len(ndcgs))
    _check(results, "evaluation",
           "golden_metrics_meet_declared_thresholds",
           queries, True, not violating,
           "evaluation before tuning: golden queries with labeled "
           "relevant docs; computed recall@k / MRR / nDCG@k per query "
           "against that query's declared thresholds")
    return metrics


def _leakage_check(results, manifest, metrics):
    """Computed red-line check: no forbidden doc is retrieved."""
    queries, has_queries = _get(manifest, "queries")
    if not has_queries or not isinstance(queries, list) or not queries:
        _check(results, "evaluation",
               "no_scope_leakage_in_retrieved_results",
               queries, False, False, "no golden queries declared")
        return
    incomplete = False
    leaked = 0
    for query in queries:
        if not isinstance(query, dict):
            incomplete = True
            continue
        forbidden, has_forbidden = _get(query, "forbidden_doc_ids")
        retrieved, has_ret = _get(query, "retrieved_doc_ids")
        if not (has_forbidden and _is_str_list(forbidden)
                and has_ret and _is_str_list(retrieved)):
            incomplete = True
            continue
        leaked += len(set(forbidden) & set(retrieved))
    metrics["leaked_doc_count"] = leaked
    if incomplete:
        _check(results, "evaluation",
               "no_scope_leakage_in_retrieved_results",
               queries, False, False,
               "a golden query is missing its forbidden_doc_ids or "
               "retrieved list")
    else:
        _check(results, "evaluation",
               "no_scope_leakage_in_retrieved_results",
               queries, True, leaked == 0,
               "skill red line: no cross-scope leakage — no retrieved "
               "doc is in its query's declared forbidden (filtered / "
               "out-of-scope) set")


def _context_check(results, manifest):
    """Computed red-line check: context tokens within budget."""
    queries, has_queries = _get(manifest, "queries")
    budget, has_budget = _get(manifest, "reranking",
                              "context_token_budget")
    if not has_queries or not isinstance(queries, list) or not queries:
        _check(results, "reranking_and_filters",
               "context_within_declared_token_budget",
               queries, False, False, "no golden queries declared")
        return
    incomplete = not (has_budget and _is_number(budget))
    violating = has_budget and _is_number(budget) and budget < 0
    for query in queries:
        if not isinstance(query, dict):
            incomplete = True
            continue
        tokens, has_tokens = _get(query, "context_tokens")
        if not (has_tokens and _is_number(tokens)):
            incomplete = True
            continue
        if tokens < 0:
            violating = True
        elif has_budget and _is_number(budget) and tokens > budget:
            violating = True
    if incomplete:
        _check(results, "reranking_and_filters",
               "context_within_declared_token_budget",
               queries, False, False,
               "a golden query is missing its context_tokens, or "
               "reranking.context_token_budget is not declared as a "
               "number")
    else:
        _check(results, "reranking_and_filters",
               "context_within_declared_token_budget",
               queries, True, not violating,
               "skill red line: no unbounded context dumps to models "
               "— every query's context_tokens within the declared "
               "context_token_budget")


def _tuning_check(results, manifest):
    """Red line: no tuning without evals (required only if tuned)."""
    tuned, has_tuned = _get(manifest, "evaluation", "tuning_performed")
    evals_first, has_evals = _get(manifest, "evaluation",
                                  "evals_run_before_tuning")
    if has_tuned and tuned:
        _check(results, "evaluation", "no_tuning_without_evals",
               evals_first, has_evals, evals_first is True,
               "skill red line: no tuning without evals — evals ran "
               "before tuning")
    else:
        _check(results, "evaluation", "no_tuning_without_evals",
               tuned, has_tuned, True, "no tuning declared")


def _local_embeddings_check(results, manifest):
    """Local embeddings required only for a private corpus."""
    private, has_private = _get(manifest, "privacy", "private_corpus")
    local, has_local = _get(manifest, "privacy",
                            "local_embeddings_for_private_corpus")
    if has_private and private:
        _check(results, "serving_and_privacy",
               "local_embeddings_for_private_corpus",
               local, has_local, local is True,
               "prefer local embeddings for private corpora")
    else:
        _check(results, "serving_and_privacy",
               "local_embeddings_for_private_corpus",
               private, has_private, True, "no private corpus declared")


def evaluate(manifest):
    """Return the verdict dict for a retrieval-evaluation manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: corpus_and_chunking (skill method 1) ----
    _bool_check(results, "corpus_and_chunking", "corpus_inventory_declared",
                manifest, ("corpus", "inventory_declared"),
                "corpus first: what's indexed is declared")
    _bool_check(results, "corpus_and_chunking",
                "freshness_requirements_declared", manifest,
                ("corpus", "freshness_requirements_declared"),
                "freshness requirements declared")
    _bool_check(results, "corpus_and_chunking", "dedup_rules_declared",
                manifest, ("corpus", "dedup_rules_declared"),
                "dedup rules declared")
    _bool_check(results, "corpus_and_chunking",
                "per_document_provenance_tracked", manifest,
                ("corpus", "per_document_provenance_tracked"),
                "per-document provenance tracked")
    _bool_check(results, "corpus_and_chunking",
                "chunking_uses_semantic_units", manifest,
                ("chunking", "semantic_units"),
                "chunking strategy: semantic units — chunking is 80% "
                "of RAG quality")
    _bool_check(results, "corpus_and_chunking",
                "chunking_overlap_discipline_declared", manifest,
                ("chunking", "overlap_discipline_declared"),
                "chunking overlap discipline declared")
    _bool_check(results, "corpus_and_chunking", "stable_chunk_ids",
                manifest, ("chunking", "stable_chunk_ids"),
                "stable chunk ids")

    # ---- Section 2: hybrid_retrieval (skill method 2) ----
    _bool_check(results, "hybrid_retrieval", "lexical_retrieval_used",
                manifest, ("retrieval", "lexical_used"),
                "hybrid retrieval: BM25/lexical for exact terms "
                "(codes, names, numbers)")
    _bool_check(results, "hybrid_retrieval", "vector_retrieval_used",
                manifest, ("retrieval", "vector_used"),
                "hybrid retrieval: vector kNN for meaning")
    _bool_check(results, "hybrid_retrieval",
                "hybrid_scores_combined_with_declared_weights", manifest,
                ("retrieval", "scores_combined_with_declared_weights"),
                "lexical and vector scores combined with tuned weights")
    _bool_check(results, "hybrid_retrieval",
                "embedding_model_version_pinned", manifest,
                ("retrieval", "embedding_model_version_pinned"),
                "embed model version pinned")
    _bool_check(results, "hybrid_retrieval",
                "reindex_plan_for_model_change", manifest,
                ("retrieval", "reindex_plan_for_model_change"),
                "reindex plan for any embedding model change")

    # ---- Section 3: reranking_and_filters (skill method 3) ----
    _bool_check(results, "reranking_and_filters", "reranking_applied",
                manifest, ("reranking", "applied"),
                "rerank with budget: top-K through a reranker to "
                "top-N for context")
    _bool_check(results, "reranking_and_filters",
                "reranker_budget_declared", manifest,
                ("reranking", "reranker_budget_declared"),
                "reranker token budget declared")
    _bool_check(results, "reranking_and_filters", "context_top_n_bounded",
                manifest, ("reranking", "context_top_n_bounded"),
                "context top-N is bounded")
    _bool_check(results, "reranking_and_filters",
                "filters_applied_before_ranking", manifest,
                ("reranking", "filters_applied_before_ranking"),
                "filters (time, type, access scope) applied before "
                "ranking or hard-enforced in queries")
    _bool_check(results, "reranking_and_filters", "scope_leakage_tested",
                manifest, ("reranking", "scope_leakage_tested"),
                "quality gate: filters enforced pre-rank; scope "
                "leakage tested")
    _context_check(results, manifest)

    # ---- Section 4: index_hygiene (skill method 4 + quality gate) --
    _bool_check(results, "index_hygiene",
                "incremental_updates_with_tombstones", manifest,
                ("index", "incremental_updates_with_tombstones"),
                "index hygiene: incremental updates + tombstones")
    _bool_check(results, "index_hygiene", "full_rebuild_drill_done",
                manifest, ("index", "full_rebuild_drill_done"),
                "quality gate: periodic full rebuild drill done")
    _bool_check(results, "index_hygiene",
                "index_size_quota_budgets_monitored", manifest,
                ("index", "size_quota_budgets_monitored"),
                "index size/quota budgets monitored")
    _bool_check(results, "index_hygiene",
                "embedding_model_and_index_versioned", manifest,
                ("index", "embedding_model_and_index_versioned"),
                "quality gate: embedding model + index versioned")

    # ---- Section 5: evaluation (skill method 5 + quality gate) ----
    _bool_check(results, "evaluation",
                "golden_queries_with_labeled_relevant_docs", manifest,
                ("evaluation", "golden_queries_labeled"),
                "evaluation before tuning: golden queries with "
                "labeled relevant docs")
    _bool_check(results, "evaluation", "thresholds_declared_for_golden_set",
                manifest, ("evaluation", "thresholds_declared"),
                "quality gate: golden-set evals with thresholds")
    _bool_check(results, "evaluation", "evals_run_in_regression",
                manifest, ("evaluation", "evals_run_in_regression"),
                "quality gate: golden-set evals run in CI/regression "
                "— regression gates on every index/pipeline change")
    _bool_check(results, "evaluation",
                "real_queries_logged_privacy_scoped", manifest,
                ("evaluation", "real_queries_logged_privacy_scoped"),
                "log real queries (privacy-scoped) to find gaps")
    metrics = _metrics_check(results, manifest)
    _leakage_check(results, manifest, metrics)
    _tuning_check(results, manifest)

    # ---- Section 6: serving_and_privacy (skill methods 6-7 + gate) -
    _bool_check(results, "serving_and_privacy",
                "latency_budgets_per_stage_declared", manifest,
                ("serving", "latency_budgets_per_stage_declared"),
                "serving: latency budgets per stage (embed, search, "
                "rerank)")
    _bool_check(results, "serving_and_privacy", "latency_budget_measured",
                manifest, ("serving", "latency_budget_measured"),
                "quality gate: latency budget measured")
    _bool_check(results, "serving_and_privacy", "hot_queries_cached",
                manifest, ("serving", "hot_queries_cached"),
                "cache hot queries")
    _bool_check(results, "serving_and_privacy",
                "lexical_only_fallback_exists", manifest,
                ("serving", "lexical_only_fallback_exists"),
                "quality gate: degradation path (lexical-only "
                "fallback) when vectors are unavailable exists")
    _bool_check(results, "serving_and_privacy",
                "query_time_access_scopes_enforced", manifest,
                ("privacy", "query_time_access_scopes_enforced"),
                "privacy: query-time access scopes enforced")
    _bool_check(results, "serving_and_privacy",
                "sensitive_content_excluded_or_encrypted_at_rest",
                manifest,
                ("privacy", "sensitive_content_excluded_or_encrypted"),
                "sensitive content excluded or encrypted-at-rest "
                "unless explicitly indexed")
    _local_embeddings_check(results, manifest)

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "RAG_EVALUATION_UNSOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "RAG_EVALUATION_SOUND"

    return {
        "service": "rag-retrieval-evaluation-tuning",
        "atom_version": "0.1.0",
        "system": manifest.get("system"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "metrics": metrics,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "RAG RETRIEVAL EVALUATION TUNING",
        f"system: {verdict.get('system')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<24} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: rag_retrieval_evaluation_tuning.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "RAG_EVALUATION_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
