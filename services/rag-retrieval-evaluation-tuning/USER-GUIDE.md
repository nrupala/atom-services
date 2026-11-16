# RAG retrieval evaluation & tuning — user guide

## What it does

You run a retrieval-augmented generation (RAG) system. This atom reads
a short evidence manifest describing how that system is built and
evaluated — corpus and chunking, hybrid retrieval, reranking and
filters, index hygiene, evaluation practice, and serving/privacy — and
returns one deterministic verdict across 36 checks in six sections:
**RAG_EVALUATION_SOUND**, **RAG_EVALUATION_UNSOUND**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Three checks are computed from the
golden queries you submit: recall@k, MRR and nDCG@k against the
thresholds you declare per query, scope leakage (a forbidden doc
retrieved), and the context-token budget. Everything else is your
declared posture, audited — the atom does not crawl your corpus or run
queries against a live index. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "rag-retrieval-evaluation-tuning"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/rag-retrieval-evaluation-tuning`
  — tool name `rag_retrieval_evaluation_tuning`; `tools/call`
  arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/rag-retrieval-evaluation-tuning`
  — body = the manifest object; same `Authorization` header.

## Input — the retrieval-evaluation evidence manifest

All fields are booleans unless noted.

| Field | Meaning |
|---|---|
| `system` | system name (string; carried into the output, not itself checked) |
| `corpus.inventory_declared`, `corpus.freshness_requirements_declared`, `corpus.dedup_rules_declared`, `corpus.per_document_provenance_tracked` | corpus discipline |
| `chunking.semantic_units`, `chunking.overlap_discipline_declared`, `chunking.stable_chunk_ids` | chunking discipline |
| `retrieval.lexical_used`, `retrieval.vector_used`, `retrieval.scores_combined_with_declared_weights`, `retrieval.embedding_model_version_pinned`, `retrieval.reindex_plan_for_model_change` | hybrid retrieval |
| `reranking.applied`, `reranking.reranker_budget_declared`, `reranking.context_top_n_bounded`, `reranking.filters_applied_before_ranking`, `reranking.scope_leakage_tested`, `reranking.context_token_budget` (number) | reranking & filters |
| `index.incremental_updates_with_tombstones`, `index.full_rebuild_drill_done`, `index.size_quota_budgets_monitored`, `index.embedding_model_and_index_versioned` | index hygiene |
| `evaluation.golden_queries_labeled`, `evaluation.thresholds_declared`, `evaluation.evals_run_in_regression`, `evaluation.real_queries_logged_privacy_scoped`, `evaluation.tuning_performed`, `evaluation.evals_run_before_tuning` | evaluation practice (tuning without evals first is a red line) |
| `queries[]` | golden queries: `{name, k, relevant_doc_ids, retrieved_doc_ids, relevance_grades (optional object mapping doc id → grade; unlisted = 0), forbidden_doc_ids, context_tokens, min_recall_at_k, min_mrr, min_ndcg_at_k}` |
| `serving.latency_budgets_per_stage_declared`, `serving.latency_budget_measured`, `serving.hot_queries_cached`, `serving.lexical_only_fallback_exists` | serving |
| `privacy.query_time_access_scopes_enforced`, `privacy.sensitive_content_excluded_or_encrypted`, `privacy.private_corpus`, `privacy.local_embeddings_for_private_corpus` | privacy (local embeddings required when the corpus is private) |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false, a computed metric
below its declared threshold, a leaked forbidden doc, or a context
over budget = the check fails (counts toward RAG_EVALUATION_UNSOUND).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/rag-retrieval-evaluation-tuning`:

```json
{
  "system": "production-search-v1",
  "corpus": {"inventory_declared": true, "freshness_requirements_declared": true, "dedup_rules_declared": true, "per_document_provenance_tracked": true},
  "chunking": {"semantic_units": true, "overlap_discipline_declared": true, "stable_chunk_ids": true},
  "retrieval": {"lexical_used": true, "vector_used": true, "scores_combined_with_declared_weights": true, "embedding_model_version_pinned": true, "reindex_plan_for_model_change": true},
  "reranking": {"applied": true, "reranker_budget_declared": true, "context_top_n_bounded": true, "filters_applied_before_ranking": true, "scope_leakage_tested": true, "context_token_budget": 500},
  "index": {"incremental_updates_with_tombstones": true, "full_rebuild_drill_done": true, "size_quota_budgets_monitored": true, "embedding_model_and_index_versioned": true},
  "evaluation": {"golden_queries_labeled": true, "thresholds_declared": true, "evals_run_in_regression": true, "real_queries_logged_privacy_scoped": true, "tuning_performed": false, "evals_run_before_tuning": true},
  "queries": [{"name": "q1", "k": 1, "relevant_doc_ids": ["doc1"], "retrieved_doc_ids": ["doc1"], "relevance_grades": {"doc1": 1}, "forbidden_doc_ids": [], "context_tokens": 100, "min_recall_at_k": 1.0, "min_mrr": 1.0, "min_ndcg_at_k": 1.0}],
  "serving": {"latency_budgets_per_stage_declared": true, "latency_budget_measured": true, "hot_queries_cached": true, "lexical_only_fallback_exists": true},
  "privacy": {"query_time_access_scopes_enforced": true, "sensitive_content_excluded_or_encrypted": true, "private_corpus": false, "local_embeddings_for_private_corpus": true}
}
```

Response — HTTP 200 (trimmed; the full response carries all 36 checks
and a text stamp of the verdict):

```json
{
  "service": "rag-retrieval-evaluation-tuning",
  "atom_version": "0.1.0",
  "system": "production-search-v1",
  "verdict": "RAG_EVALUATION_SOUND",
  "sections": {"corpus_and_chunking": "pass", "hybrid_retrieval": "pass", "reranking_and_filters": "pass", "index_hygiene": "pass", "evaluation": "pass", "serving_and_privacy": "pass"},
  "metrics": {"queries_total": 1, "queries_meeting_thresholds": 1, "mean_recall_at_k": "1.0000", "mean_mrr": "1.0000", "mean_ndcg_at_k": "1.0000", "leaked_doc_count": 0},
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections."
}
```

Mean metrics are strings with exactly four decimals (`null` when no
golden query could be scored).

## Verdicts

- **RAG_EVALUATION_SOUND** — every check passes, including the computed
  golden-set metrics against your own declared thresholds.
- **RAG_EVALUATION_UNSOUND** — at least one check fails; the failing
  checks name the breached section.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing;
  the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
