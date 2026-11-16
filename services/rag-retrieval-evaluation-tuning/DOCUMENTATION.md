# Rag retrieval evaluation tuning — full documentation

**Rag retrieval evaluation tuning** · slug `rag-retrieval-evaluation-tuning` · deliverable type: EVALUATION · atom version 0.1.0 · status: **live — release candidate (one-week RC soak to 2026-11-22)**

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (worked example 1 below reproduces its request and response verbatim).

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the full flow is in the how-to below). Every call sends the key as `Authorization: Bearer <key>`.

**Step 2 — build the manifest.** The caller assembles one JSON manifest naming the subject in `system` (`"production-search-v1"`) and declaring the evidence the atom checks, group by group (the input reference below lists every field and its type). In the recorded run, every checked field is supplied.

**Step 3 — call the REST endpoint.** `POST https://atoms.pipavia.com/v1/rag-retrieval-evaluation-tuning` with the manifest as the body and the `Authorization` header set.

**Step 4 — read the verdict.** The recorded response came back HTTP 200 with verdict `RAG_EVALUATION_SOUND`. Its summary: "36 pass, 0 fail, 0 missing of 36 checks across six sections." Every section reports `pass` (corpus_and_chunking, hybrid_retrieval, reranking_and_filters, index_hygiene, evaluation, serving_and_privacy) and every check in the `checks` array reports `pass` — that array, with its per-check evidence strings, is the deliverable's reasoning, not decoration.

**Step 5 — trust but verify.** The same manifest submitted twice returned byte-identical REST responses, and the MCP face returned a structurally identical result — both properties are recorded in the evidence (`determinism_byte_identical`, `parity_structured_equal`). Same input in, same deliverable out.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "rag-retrieval-evaluation-tuning"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. `POST https://atoms.pipavia.com/v1/rag-retrieval-evaluation-tuning` — body = the manifest object; same `Authorization` header. HTTP 200 returns the deliverable as JSON.

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/rag-retrieval-evaluation-tuning`
- Tool name: `rag_retrieval_evaluation_tuning` — `tools/call` arguments = the manifest object (the same object you would POST to REST).
- Send the same `Authorization: Bearer <key>` header. The MCP result's structured content is the same deliverable the REST face returns (parity is recorded in the evidence).

### Read a failing verdict and fix the manifest

The recorded violations run (worked example 2) returned HTTP 200 with verdict `RAG_EVALUATION_UNSOUND`: "0 pass, 3 fail, 33 missing of 36 checks across six sections." Read a failing response in this order:

1. **`verdict` + `summary`** — the counts tell you how many checks fail vs are missing. Fail and missing are different problems: a fail means your manifest *declares evidence against you*; missing means you *did not declare the evidence at all*.
2. **`checks` with `status: "fail"`** — in the recorded run:
   - `context_within_declared_token_budget` (section `reranking_and_filters`) — evidence: "skill red line: no unbounded context dumps to models — every query's context_tokens within the declared context_token_budget"
   - `golden_metrics_meet_declared_thresholds` (section `evaluation`) — evidence: "evaluation before tuning: golden queries with labeled relevant docs; computed recall@k / MRR / nDCG@k per query against that query's declared thresholds"
   - `no_scope_leakage_in_retrieved_results` (section `evaluation`) — evidence: "skill red line: no cross-scope leakage — no retrieved doc is in its query's declared forbidden (filtered / out-of-scope) set"
   Fix = change the underlying practice or record so the declaration becomes true, then resubmit. Editing the manifest to claim what is not true defeats the deliverable — the atom checks declared evidence, and its value is that the declaration is yours.
3. **`checks` with `status: "missing"`** — 33 in the recorded run; supply the absent fields named by those checks and resubmit.

### Handle a 422 invalid_input

A type-violating manifest is rejected before any verdict is computed. The recorded malformed run (worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "corpus",
  "detail": "corpus must be an object"
}
```

Read `field` for the offending field and `detail` for the expected shape — here, `corpus`: "corpus must be an object". Fix the type at that field (per the input reference below) and resubmit. A 422 is never a verdict and is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/rag-retrieval-evaluation-tuning` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/rag-retrieval-evaluation-tuning` — tool name `rag_retrieval_evaluation_tuning`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Support: info@pipavia.com

### Input reference

Every field, grouped as SERVICE.md groups them, with its type. All fields are booleans unless a type is noted.

**Group: —**

| Field | Type | Notes |
|---|---|---|
| `system` | string | carried into the output, not itself checked |

**Group: `corpus_and_chunking`**

| Field | Type | Notes |
|---|---|---|
| `corpus.inventory_declared` | see SERVICE.md note |  |
| `corpus.freshness_requirements_declared` | see SERVICE.md note |  |
| `corpus.dedup_rules_declared` | see SERVICE.md note |  |
| `corpus.per_document_provenance_tracked` | see SERVICE.md note |  |
| `chunking.semantic_units` | see SERVICE.md note |  |
| `chunking.overlap_discipline_declared` | see SERVICE.md note |  |
| `chunking.stable_chunk_ids` | see SERVICE.md note |  |

**Group: `hybrid_retrieval`**

| Field | Type | Notes |
|---|---|---|
| `retrieval.lexical_used` | see SERVICE.md note |  |
| `retrieval.vector_used` | see SERVICE.md note |  |
| `retrieval.scores_combined_with_declared_weights` | see SERVICE.md note |  |
| `retrieval.embedding_model_version_pinned` | see SERVICE.md note |  |
| `retrieval.reindex_plan_for_model_change` | see SERVICE.md note |  |

**Group: `reranking_and_filters`**

| Field | Type | Notes |
|---|---|---|
| `reranking.applied` | see SERVICE.md note |  |
| `reranking.reranker_budget_declared` | see SERVICE.md note |  |
| `reranking.context_top_n_bounded` | see SERVICE.md note |  |
| `reranking.filters_applied_before_ranking` | see SERVICE.md note |  |
| `reranking.scope_leakage_tested` | see SERVICE.md note |  |

**Group: `reranking_and_filters (computed context check)`**

| Field | Type | Notes |
|---|---|---|
| `reranking.context_token_budget` | number | number |

**Group: `index_hygiene`**

| Field | Type | Notes |
|---|---|---|
| `index.incremental_updates_with_tombstones` | see SERVICE.md note |  |
| `index.full_rebuild_drill_done` | see SERVICE.md note |  |
| `index.size_quota_budgets_monitored` | see SERVICE.md note |  |
| `index.embedding_model_and_index_versioned` | see SERVICE.md note |  |

**Group: `evaluation`**

| Field | Type | Notes |
|---|---|---|
| `evaluation.golden_queries_labeled` | see SERVICE.md note |  |
| `evaluation.thresholds_declared` | see SERVICE.md note |  |
| `evaluation.evals_run_in_regression` | see SERVICE.md note |  |
| `evaluation.real_queries_logged_privacy_scoped` | see SERVICE.md note |  |
| `evaluation.tuning_performed` | gates the tuning red line below: required only when true |  |
| `evaluation.evals_run_before_tuning` | see SERVICE.md note |  |

**Group: `evaluation + reranking_and_filters`**

| Field | Type | Notes |
|---|---|---|
| `queries[]` | list of golden queries | see below |

**Group: `serving_and_privacy`**

| Field | Type | Notes |
|---|---|---|
| `serving.latency_budgets_per_stage_declared` | see SERVICE.md note |  |
| `serving.latency_budget_measured` | see SERVICE.md note |  |
| `serving.hot_queries_cached` | see SERVICE.md note |  |
| `serving.lexical_only_fallback_exists` | see SERVICE.md note |  |
| `privacy.query_time_access_scopes_enforced` | see SERVICE.md note |  |
| `privacy.sensitive_content_excluded_or_encrypted` | see SERVICE.md note |  |
| `privacy.private_corpus` | gates the local-embeddings check below: required only when true |  |
| `privacy.local_embeddings_for_private_corpus` | see SERVICE.md note |  |

**Group: queries[] entry**

| Field | Type | Notes |
|---|---|---|
| `queries[].name` | string | Golden-query identifier. |
| `queries[].k` | number | Cut-off k for recall@k / nDCG@k. |
| `queries[].relevant_doc_ids` | list of strings | Caller-labelled relevant doc ids. |
| `queries[].retrieved_doc_ids` | list of strings | Retrieved doc ids, in rank order. |
| `queries[].relevance_grades` | object (doc id → grade); optional | Declared relevance grades; unlisted = 0. When not declared, binary relevant/not is used. |
| `queries[].forbidden_doc_ids` | list of strings | Filtered / out-of-scope doc ids — retrieval of any one is scope leakage. |
| `queries[].context_tokens` | number | Context tokens this query consumed; compared against the declared budget. |
| `queries[].min_recall_at_k` | number | Caller's own declared threshold for this query. |
| `queries[].min_mrr` | number | Caller's own declared threshold for this query. |
| `queries[].min_ndcg_at_k` | number | Caller's own declared threshold for this query. |

### Checks

Every check the atom runs — 36 in total, exactly as named in the recorded full-pass response, grouped by section. For each check: what it requires to pass (the recorded evidence text states the requirement), and the status semantics that follow the table.

**Section: `corpus_and_chunking`**

| Check | Requires to pass | Notes |
|---|---|---|
| `corpus_inventory_declared` | corpus first: what's indexed is declared |  |
| `freshness_requirements_declared` | freshness requirements declared |  |
| `dedup_rules_declared` | dedup rules declared |  |
| `per_document_provenance_tracked` | per-document provenance tracked |  |
| `chunking_uses_semantic_units` | chunking strategy: semantic units — chunking is 80% of RAG quality |  |
| `chunking_overlap_discipline_declared` | chunking overlap discipline declared |  |
| `stable_chunk_ids` | stable chunk ids |  |
**Section: `hybrid_retrieval`**

| Check | Requires to pass | Notes |
|---|---|---|
| `lexical_retrieval_used` | hybrid retrieval: BM25/lexical for exact terms (codes, names, numbers) |  |
| `vector_retrieval_used` | hybrid retrieval: vector kNN for meaning |  |
| `hybrid_scores_combined_with_declared_weights` | lexical and vector scores combined with tuned weights |  |
| `embedding_model_version_pinned` | embed model version pinned |  |
| `reindex_plan_for_model_change` | reindex plan for any embedding model change |  |
**Section: `reranking_and_filters`**

| Check | Requires to pass | Notes |
|---|---|---|
| `reranking_applied` | rerank with budget: top-K through a reranker to top-N for context |  |
| `reranker_budget_declared` | reranker token budget declared |  |
| `context_top_n_bounded` | context top-N is bounded |  |
| `filters_applied_before_ranking` | filters (time, type, access scope) applied before ranking or hard-enforced in queries |  |
| `scope_leakage_tested` | quality gate: filters enforced pre-rank; scope leakage tested |  |
| `context_within_declared_token_budget` | skill red line: no unbounded context dumps to models — every query's context_tokens within the declared context_token_budget | Computed (red line): every query's `context_tokens` must be within the declared `reranking.context_token_budget`. |
**Section: `index_hygiene`**

| Check | Requires to pass | Notes |
|---|---|---|
| `incremental_updates_with_tombstones` | index hygiene: incremental updates + tombstones |  |
| `full_rebuild_drill_done` | quality gate: periodic full rebuild drill done |  |
| `index_size_quota_budgets_monitored` | index size/quota budgets monitored |  |
| `embedding_model_and_index_versioned` | quality gate: embedding model + index versioned |  |
**Section: `evaluation`**

| Check | Requires to pass | Notes |
|---|---|---|
| `golden_queries_with_labeled_relevant_docs` | evaluation before tuning: golden queries with labeled relevant docs |  |
| `thresholds_declared_for_golden_set` | quality gate: golden-set evals with thresholds |  |
| `evals_run_in_regression` | quality gate: golden-set evals run in CI/regression — regression gates on every index/pipeline change |  |
| `real_queries_logged_privacy_scoped` | log real queries (privacy-scoped) to find gaps |  |
| `golden_metrics_meet_declared_thresholds` | evaluation before tuning: golden queries with labeled relevant docs; computed recall@k / MRR / nDCG@k per query against that query's declared thresholds | Computed: per query, recall@k, MRR and nDCG@k are recomputed and must meet that query's declared `min_*` thresholds. |
| `no_scope_leakage_in_retrieved_results` | skill red line: no cross-scope leakage — no retrieved doc is in its query's declared forbidden (filtered / out-of-scope) set | Computed (red line): no retrieved doc id may appear in its query's `forbidden_doc_ids`. |
| `no_tuning_without_evals` | no tuning declared | Conditional: binds only when `evaluation.tuning_performed` is true; with no tuning declared it passes as not applicable. |
**Section: `serving_and_privacy`**

| Check | Requires to pass | Notes |
|---|---|---|
| `latency_budgets_per_stage_declared` | serving: latency budgets per stage (embed, search, rerank) |  |
| `latency_budget_measured` | quality gate: latency budget measured |  |
| `hot_queries_cached` | cache hot queries |  |
| `lexical_only_fallback_exists` | quality gate: degradation path (lexical-only fallback) when vectors are unavailable exists |  |
| `query_time_access_scopes_enforced` | privacy: query-time access scopes enforced |  |
| `sensitive_content_excluded_or_encrypted_at_rest` | sensitive content excluded or encrypted-at-rest unless explicitly indexed |  |
| `local_embeddings_for_private_corpus` | no private corpus declared | Conditional: binds only when `privacy.private_corpus` is true; with no private corpus declared it passes as not applicable. |

**Per-check status semantics:** `pass` — the requirement is met on the declared evidence (a conditional check whose gate does not bind also reports `pass`, with its evidence text saying why it does not bind, e.g. "no conveyor drives declared"); `fail` — the field is present but false/invalid, a red line is crossed, or a computed comparison fails; `missing` — the field (or a value a computed check needs) is absent. There is no separate not-applicable status value in the recorded responses: not-applicable is expressed as `pass` with explanatory evidence.

### Output format

A successful call returns one JSON object. The recorded full-pass response carries these top-level keys, in order: `service`, `atom_version`, `system`, `verdict`, `sections`, `checks`, `metrics`, `summary`, `stamp`. It always includes `service` and `atom_version`, the subject echo where the manifest names one, the verdict/status, a human-readable `summary`, and a text `stamp` restating the result.

The response carries a `metrics` object: `mean_recall_at_k`, `mean_mrr`, `mean_ndcg_at_k` (strings, exactly four decimal places — round half up to 4dp by the fixed rule; comparisons use unrounded values) plus counts (`queries_total` / `queries_meeting_thresholds` / `leaked_doc_count`), a `summary` and a text `stamp`.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `RAG_EVALUATION_SOUND` | All 36 checks pass, including the three computed checks over the declared golden queries. |
| `RAG_EVALUATION_UNSOUND` | At least one check fails — a declared boolean is false, or a computed check fails (a query misses its own declared threshold, a forbidden doc is retrieved, or a query's context exceeds the declared budget). |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but evidence is missing (absent fields, no golden queries, or a query with no positive relevance grade, whose nDCG is not definable). |
| section status `pass` | Every check in the section passes (including not-applicable passes). |
| section status `fail` | At least one check in the section fails. |
| section status `insufficient_evidence` | No check in the section fails, but at least one is missing. |
| check status `pass` / `fail` / `missing` | See the status semantics under Checks. |

### Errors

Only the shapes evidenced in the gateway code and the recorded battery are documented here:

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | Missing, malformed, unknown or revoked key (REST face shape, from the gateway call path). |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the <namespace> scope; issue it for this atom first"}` | The key is valid but was never issued for this atom — issue it for `rag-retrieval-evaluation-tuning` and retry. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "corpus", "detail": "corpus must be an object"}` (recorded verbatim in worked example 3) | The manifest violates a field type; `field` and `detail` name the problem. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for rag-retrieval-evaluation-tuning exceeded"}` (a per-day variant names the 10000/day limit) | Rate limit exceeded; the call is not metered. |

### Rate limits and pricing status

- Rate limits (contract.yaml, SPEC default): **60 calls/minute and 10000 calls/day per key** for this atom.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is null and `rate_status` is pending — **Free during trial — rate pending.** Prices are set only from measured production cost per unit, per the billing protocol in the contract.

## Explanation

This atom sells its deliverable — a bounded evaluation artifact — never the underlying knowledge itself. teams and agents working in Engineering & code who need this evaluation on demand and would rather buy it per use than build or staff the capability themselves. House self-use: **Fixing product search and RAG**.

**How the verdict is decided.** Deterministic core (byte-identical repeats and REST/MCP parity recorded). Most checks read one declared boolean each. Three checks are computed over the caller's declared golden queries, using only the metrics the bound skill names and only the caller's own per-query thresholds: golden metrics (recall@k = |relevant ∩ retrieved[:k]| / |relevant| with distinct ids; reciprocal rank = 1 / rank of the first relevant doc in the full retrieved list, 0 when none; nDCG@k = DCG@k / IDCG@k with DCG@k = Σ (2^grade − 1) / log2(rank + 1) over retrieved[:k], grade from declared `relevance_grades` or binary relevance when grades are not declared); scope leakage (no retrieved id may appear in its query's `forbidden_doc_ids`); and the context budget (every query's `context_tokens` ≤ declared `reranking.context_token_budget`). Absent = missing; present-but-false or a failed computed comparison = fail. Two checks are conditional: the tuning red line binds only when tuning is declared performed, and the local-embeddings check binds only when a private corpus is declared.

**What it does NOT do.**

- Declared, not measured: it does not crawl a corpus, run queries against a live index, time any pipeline stage, or inspect an embedding model. It computes over the retrieved lists and relevance judgments the caller submits, and audits the posture the caller declares.
- Metrics are exactly the three the skill names — recall@k, MRR, nDCG@k. Precision, F1, MAP and latency percentiles are excluded.
- No threshold is the atom's: every threshold compared is declared per query in the manifest itself.
- Relevance judgments are the caller's; a query with no positive relevance grade counts as missing evidence, not as a zero score.
- Tuning itself, index building, reranker execution and query serving are the caller's systems.

## Role views

### For integrators (Users)

One manifest in, one deliverable out, over REST or MCP with the same key. Start with the tutorial, keep the input reference beside your manifest builder, and treat the response's verdict/status, summary and per-item detail as the product. Rate: free during trial — rate pending; limits 60/min, 10000/day per key. Support: info@pipavia.com.

### For developers

Manifest authoring: field names, groupings and types are exactly as in the input reference — a type violation is a 422 before any computation, and an absent field is a deliberate signal (missing evidence), not a default. Determinism: the core is deterministic — the recorded battery proves byte-identical repeat REST responses and REST/MCP structured parity for this atom, so golden-file testing against the worked examples below is sound. Implementation: `services/rag-retrieval-evaluation-tuning/src/rag_retrieval_evaluation_tuning.py` (Python 3, stdlib only; `evaluate(manifest)`), tests: `services/rag-retrieval-evaluation-tuning/tests/test_rag_retrieval_evaluation_tuning.py` (21 tests, per contract.yaml). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract R1 rule).

### For ops

Endpoints: REST `POST /v1/rag-retrieval-evaluation-tuning` and MCP `POST /mcp/rag-retrieval-evaluation-tuning` (tool `rag_retrieval_evaluation_tuning`) on https://atoms.pipavia.com. Key scope: per user, per atom — a key never verifies for another atom; 403 means the scope was never issued. Rate limits: 60/min, 10000/day per key (429, not metered). Error monitoring: watch the 401 (unauthorized) / 403 (scope_required) / 422 (invalid_input, with field+detail) / 429 (rate_limit) shapes in the errors table. Status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:55:44.081438+00:00 against gateway v1.1.0, external verification lane, source `verification/work/rag-retrieval-evaluation-tuning/evidence.json`. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — verified mechanically against the evidence after writing).

### Example 1 — full-pass (recorded HTTP 200)

Recorded case note: All booleans true, metrics meet thresholds. computed_spot_checks: mean_recall_at_k=1.0000, mean_mrr=1.0000, mean_ndcg_at_k=1.0000 [CORRECTED by tester: relevance_grades as object {doc: grade} per SERVICE.md "unlisted = 0" / atom metric shape; originally designed as a list.]

Input:

```json
{
  "system": "production-search-v1",
  "corpus": {
    "inventory_declared": true,
    "freshness_requirements_declared": true,
    "dedup_rules_declared": true,
    "per_document_provenance_tracked": true
  },
  "chunking": {
    "semantic_units": true,
    "overlap_discipline_declared": true,
    "stable_chunk_ids": true
  },
  "retrieval": {
    "lexical_used": true,
    "vector_used": true,
    "scores_combined_with_declared_weights": true,
    "embedding_model_version_pinned": true,
    "reindex_plan_for_model_change": true
  },
  "reranking": {
    "applied": true,
    "reranker_budget_declared": true,
    "context_top_n_bounded": true,
    "filters_applied_before_ranking": true,
    "scope_leakage_tested": true,
    "context_token_budget": 500
  },
  "index": {
    "incremental_updates_with_tombstones": true,
    "full_rebuild_drill_done": true,
    "size_quota_budgets_monitored": true,
    "embedding_model_and_index_versioned": true
  },
  "evaluation": {
    "golden_queries_labeled": true,
    "thresholds_declared": true,
    "evals_run_in_regression": true,
    "real_queries_logged_privacy_scoped": true,
    "tuning_performed": false,
    "evals_run_before_tuning": true
  },
  "queries": [
    {
      "name": "q1",
      "k": 1,
      "relevant_doc_ids": [
        "doc1"
      ],
      "retrieved_doc_ids": [
        "doc1"
      ],
      "relevance_grades": {
        "doc1": 1
      },
      "forbidden_doc_ids": [],
      "context_tokens": 100,
      "min_recall_at_k": 1.0,
      "min_mrr": 1.0,
      "min_ndcg_at_k": 1.0
    }
  ],
  "serving": {
    "latency_budgets_per_stage_declared": true,
    "latency_budget_measured": true,
    "hot_queries_cached": true,
    "lexical_only_fallback_exists": true
  },
  "privacy": {
    "query_time_access_scopes_enforced": true,
    "sensitive_content_excluded_or_encrypted": true,
    "private_corpus": false,
    "local_embeddings_for_private_corpus": true
  }
}
```

Response (REST):

```json
{
  "service": "rag-retrieval-evaluation-tuning",
  "atom_version": "0.1.0",
  "system": "production-search-v1",
  "verdict": "RAG_EVALUATION_SOUND",
  "sections": {
    "corpus_and_chunking": "pass",
    "hybrid_retrieval": "pass",
    "reranking_and_filters": "pass",
    "index_hygiene": "pass",
    "evaluation": "pass",
    "serving_and_privacy": "pass"
  },
  "checks": [
    {
      "section": "corpus_and_chunking",
      "check": "corpus_inventory_declared",
      "status": "pass",
      "evidence": "corpus first: what's indexed is declared"
    },
    {
      "section": "corpus_and_chunking",
      "check": "freshness_requirements_declared",
      "status": "pass",
      "evidence": "freshness requirements declared"
    },
    {
      "section": "corpus_and_chunking",
      "check": "dedup_rules_declared",
      "status": "pass",
      "evidence": "dedup rules declared"
    },
    {
      "section": "corpus_and_chunking",
      "check": "per_document_provenance_tracked",
      "status": "pass",
      "evidence": "per-document provenance tracked"
    },
    {
      "section": "corpus_and_chunking",
      "check": "chunking_uses_semantic_units",
      "status": "pass",
      "evidence": "chunking strategy: semantic units — chunking is 80% of RAG quality"
    },
    {
      "section": "corpus_and_chunking",
      "check": "chunking_overlap_discipline_declared",
      "status": "pass",
      "evidence": "chunking overlap discipline declared"
    },
    {
      "section": "corpus_and_chunking",
      "check": "stable_chunk_ids",
      "status": "pass",
      "evidence": "stable chunk ids"
    },
    {
      "section": "hybrid_retrieval",
      "check": "lexical_retrieval_used",
      "status": "pass",
      "evidence": "hybrid retrieval: BM25/lexical for exact terms (codes, names, numbers)"
    },
    {
      "section": "hybrid_retrieval",
      "check": "vector_retrieval_used",
      "status": "pass",
      "evidence": "hybrid retrieval: vector kNN for meaning"
    },
    {
      "section": "hybrid_retrieval",
      "check": "hybrid_scores_combined_with_declared_weights",
      "status": "pass",
      "evidence": "lexical and vector scores combined with tuned weights"
    },
    {
      "section": "hybrid_retrieval",
      "check": "embedding_model_version_pinned",
      "status": "pass",
      "evidence": "embed model version pinned"
    },
    {
      "section": "hybrid_retrieval",
      "check": "reindex_plan_for_model_change",
      "status": "pass",
      "evidence": "reindex plan for any embedding model change"
    },
    {
      "section": "reranking_and_filters",
      "check": "reranking_applied",
      "status": "pass",
      "evidence": "rerank with budget: top-K through a reranker to top-N for context"
    },
    {
      "section": "reranking_and_filters",
      "check": "reranker_budget_declared",
      "status": "pass",
      "evidence": "reranker token budget declared"
    },
    {
      "section": "reranking_and_filters",
      "check": "context_top_n_bounded",
      "status": "pass",
      "evidence": "context top-N is bounded"
    },
    {
      "section": "reranking_and_filters",
      "check": "filters_applied_before_ranking",
      "status": "pass",
      "evidence": "filters (time, type, access scope) applied before ranking or hard-enforced in queries"
    },
    {
      "section": "reranking_and_filters",
      "check": "scope_leakage_tested",
      "status": "pass",
      "evidence": "quality gate: filters enforced pre-rank; scope leakage tested"
    },
    {
      "section": "reranking_and_filters",
      "check": "context_within_declared_token_budget",
      "status": "pass",
      "evidence": "skill red line: no unbounded context dumps to models — every query's context_tokens within the declared context_token_budget"
    },
    {
      "section": "index_hygiene",
      "check": "incremental_updates_with_tombstones",
      "status": "pass",
      "evidence": "index hygiene: incremental updates + tombstones"
    },
    {
      "section": "index_hygiene",
      "check": "full_rebuild_drill_done",
      "status": "pass",
      "evidence": "quality gate: periodic full rebuild drill done"
    },
    {
      "section": "index_hygiene",
      "check": "index_size_quota_budgets_monitored",
      "status": "pass",
      "evidence": "index size/quota budgets monitored"
    },
    {
      "section": "index_hygiene",
      "check": "embedding_model_and_index_versioned",
      "status": "pass",
      "evidence": "quality gate: embedding model + index versioned"
    },
    {
      "section": "evaluation",
      "check": "golden_queries_with_labeled_relevant_docs",
      "status": "pass",
      "evidence": "evaluation before tuning: golden queries with labeled relevant docs"
    },
    {
      "section": "evaluation",
      "check": "thresholds_declared_for_golden_set",
      "status": "pass",
      "evidence": "quality gate: golden-set evals with thresholds"
    },
    {
      "section": "evaluation",
      "check": "evals_run_in_regression",
      "status": "pass",
      "evidence": "quality gate: golden-set evals run in CI/regression — regression gates on every index/pipeline change"
    },
    {
      "section": "evaluation",
      "check": "real_queries_logged_privacy_scoped",
      "status": "pass",
      "evidence": "log real queries (privacy-scoped) to find gaps"
    },
    {
      "section": "evaluation",
      "check": "golden_metrics_meet_declared_thresholds",
      "status": "pass",
      "evidence": "evaluation before tuning: golden queries with labeled relevant docs; computed recall@k / MRR / nDCG@k per query against that query's declared thresholds"
    },
    {
      "section": "evaluation",
      "check": "no_scope_leakage_in_retrieved_results",
      "status": "pass",
      "evidence": "skill red line: no cross-scope leakage — no retrieved doc is in its query's declared forbidden (filtered / out-of-scope) set"
    },
    {
      "section": "evaluation",
      "check": "no_tuning_without_evals",
      "status": "pass",
      "evidence": "no tuning declared"
    },
    {
      "section": "serving_and_privacy",
      "check": "latency_budgets_per_stage_declared",
      "status": "pass",
      "evidence": "serving: latency budgets per stage (embed, search, rerank)"
    },
    {
      "section": "serving_and_privacy",
      "check": "latency_budget_measured",
      "status": "pass",
      "evidence": "quality gate: latency budget measured"
    },
    {
      "section": "serving_and_privacy",
      "check": "hot_queries_cached",
      "status": "pass",
      "evidence": "cache hot queries"
    },
    {
      "section": "serving_and_privacy",
      "check": "lexical_only_fallback_exists",
      "status": "pass",
      "evidence": "quality gate: degradation path (lexical-only fallback) when vectors are unavailable exists"
    },
    {
      "section": "serving_and_privacy",
      "check": "query_time_access_scopes_enforced",
      "status": "pass",
      "evidence": "privacy: query-time access scopes enforced"
    },
    {
      "section": "serving_and_privacy",
      "check": "sensitive_content_excluded_or_encrypted_at_rest",
      "status": "pass",
      "evidence": "sensitive content excluded or encrypted-at-rest unless explicitly indexed"
    },
    {
      "section": "serving_and_privacy",
      "check": "local_embeddings_for_private_corpus",
      "status": "pass",
      "evidence": "no private corpus declared"
    }
  ],
  "metrics": {
    "queries_total": 1,
    "queries_meeting_thresholds": 1,
    "mean_recall_at_k": "1.0000",
    "mean_mrr": "1.0000",
    "mean_ndcg_at_k": "1.0000",
    "leaked_doc_count": 0
  },
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections.",
  "stamp": "RAG RETRIEVAL EVALUATION TUNING\nsystem: production-search-v1\nVERDICT: RAG_EVALUATION_SOUND\n  corpus_and_chunking      pass\n  hybrid_retrieval         pass\n  reranking_and_filters    pass\n  index_hygiene            pass\n  evaluation               pass\n  serving_and_privacy      pass\n36 pass, 0 fail, 0 missing of 36 checks across six sections."
}
```

### Example 2 — violations (recorded HTTP 200)

Recorded case note: Triggers scope leakage (forbidden doc found) and context budget violation (2000 > 500).

Input:

```json
{
  "queries": [
    {
      "name": "q_fail",
      "k": 1,
      "relevant_doc_ids": [
        "doc1"
      ],
      "retrieved_doc_ids": [
        "forbidden_doc"
      ],
      "forbidden_doc_ids": [
        "forbidden_doc"
      ],
      "context_tokens": 2000,
      "min_recall_at_k": 1.0,
      "min_mrr": 1.0,
      "min_ndcg_at_k": 1.0
    }
  ],
  "reranking": {
    "context_token_budget": 500
  }
}
```

Response (REST):

```json
{
  "service": "rag-retrieval-evaluation-tuning",
  "atom_version": "0.1.0",
  "system": null,
  "verdict": "RAG_EVALUATION_UNSOUND",
  "sections": {
    "corpus_and_chunking": "insufficient_evidence",
    "hybrid_retrieval": "insufficient_evidence",
    "reranking_and_filters": "fail",
    "index_hygiene": "insufficient_evidence",
    "evaluation": "fail",
    "serving_and_privacy": "insufficient_evidence"
  },
  "checks": [
    {
      "section": "corpus_and_chunking",
      "check": "corpus_inventory_declared",
      "status": "missing",
      "evidence": "corpus first: what's indexed is declared"
    },
    {
      "section": "corpus_and_chunking",
      "check": "freshness_requirements_declared",
      "status": "missing",
      "evidence": "freshness requirements declared"
    },
    {
      "section": "corpus_and_chunking",
      "check": "dedup_rules_declared",
      "status": "missing",
      "evidence": "dedup rules declared"
    },
    {
      "section": "corpus_and_chunking",
      "check": "per_document_provenance_tracked",
      "status": "missing",
      "evidence": "per-document provenance tracked"
    },
    {
      "section": "corpus_and_chunking",
      "check": "chunking_uses_semantic_units",
      "status": "missing",
      "evidence": "chunking strategy: semantic units — chunking is 80% of RAG quality"
    },
    {
      "section": "corpus_and_chunking",
      "check": "chunking_overlap_discipline_declared",
      "status": "missing",
      "evidence": "chunking overlap discipline declared"
    },
    {
      "section": "corpus_and_chunking",
      "check": "stable_chunk_ids",
      "status": "missing",
      "evidence": "stable chunk ids"
    },
    {
      "section": "hybrid_retrieval",
      "check": "lexical_retrieval_used",
      "status": "missing",
      "evidence": "hybrid retrieval: BM25/lexical for exact terms (codes, names, numbers)"
    },
    {
      "section": "hybrid_retrieval",
      "check": "vector_retrieval_used",
      "status": "missing",
      "evidence": "hybrid retrieval: vector kNN for meaning"
    },
    {
      "section": "hybrid_retrieval",
      "check": "hybrid_scores_combined_with_declared_weights",
      "status": "missing",
      "evidence": "lexical and vector scores combined with tuned weights"
    },
    {
      "section": "hybrid_retrieval",
      "check": "embedding_model_version_pinned",
      "status": "missing",
      "evidence": "embed model version pinned"
    },
    {
      "section": "hybrid_retrieval",
      "check": "reindex_plan_for_model_change",
      "status": "missing",
      "evidence": "reindex plan for any embedding model change"
    },
    {
      "section": "reranking_and_filters",
      "check": "reranking_applied",
      "status": "missing",
      "evidence": "rerank with budget: top-K through a reranker to top-N for context"
    },
    {
      "section": "reranking_and_filters",
      "check": "reranker_budget_declared",
      "status": "missing",
      "evidence": "reranker token budget declared"
    },
    {
      "section": "reranking_and_filters",
      "check": "context_top_n_bounded",
      "status": "missing",
      "evidence": "context top-N is bounded"
    },
    {
      "section": "reranking_and_filters",
      "check": "filters_applied_before_ranking",
      "status": "missing",
      "evidence": "filters (time, type, access scope) applied before ranking or hard-enforced in queries"
    },
    {
      "section": "reranking_and_filters",
      "check": "scope_leakage_tested",
      "status": "missing",
      "evidence": "quality gate: filters enforced pre-rank; scope leakage tested"
    },
    {
      "section": "reranking_and_filters",
      "check": "context_within_declared_token_budget",
      "status": "fail",
      "evidence": "skill red line: no unbounded context dumps to models — every query's context_tokens within the declared context_token_budget"
    },
    {
      "section": "index_hygiene",
      "check": "incremental_updates_with_tombstones",
      "status": "missing",
      "evidence": "index hygiene: incremental updates + tombstones"
    },
    {
      "section": "index_hygiene",
      "check": "full_rebuild_drill_done",
      "status": "missing",
      "evidence": "quality gate: periodic full rebuild drill done"
    },
    {
      "section": "index_hygiene",
      "check": "index_size_quota_budgets_monitored",
      "status": "missing",
      "evidence": "index size/quota budgets monitored"
    },
    {
      "section": "index_hygiene",
      "check": "embedding_model_and_index_versioned",
      "status": "missing",
      "evidence": "quality gate: embedding model + index versioned"
    },
    {
      "section": "evaluation",
      "check": "golden_queries_with_labeled_relevant_docs",
      "status": "missing",
      "evidence": "evaluation before tuning: golden queries with labeled relevant docs"
    },
    {
      "section": "evaluation",
      "check": "thresholds_declared_for_golden_set",
      "status": "missing",
      "evidence": "quality gate: golden-set evals with thresholds"
    },
    {
      "section": "evaluation",
      "check": "evals_run_in_regression",
      "status": "missing",
      "evidence": "quality gate: golden-set evals run in CI/regression — regression gates on every index/pipeline change"
    },
    {
      "section": "evaluation",
      "check": "real_queries_logged_privacy_scoped",
      "status": "missing",
      "evidence": "log real queries (privacy-scoped) to find gaps"
    },
    {
      "section": "evaluation",
      "check": "golden_metrics_meet_declared_thresholds",
      "status": "fail",
      "evidence": "evaluation before tuning: golden queries with labeled relevant docs; computed recall@k / MRR / nDCG@k per query against that query's declared thresholds"
    },
    {
      "section": "evaluation",
      "check": "no_scope_leakage_in_retrieved_results",
      "status": "fail",
      "evidence": "skill red line: no cross-scope leakage — no retrieved doc is in its query's declared forbidden (filtered / out-of-scope) set"
    },
    {
      "section": "evaluation",
      "check": "no_tuning_without_evals",
      "status": "missing",
      "evidence": "no tuning declared"
    },
    {
      "section": "serving_and_privacy",
      "check": "latency_budgets_per_stage_declared",
      "status": "missing",
      "evidence": "serving: latency budgets per stage (embed, search, rerank)"
    },
    {
      "section": "serving_and_privacy",
      "check": "latency_budget_measured",
      "status": "missing",
      "evidence": "quality gate: latency budget measured"
    },
    {
      "section": "serving_and_privacy",
      "check": "hot_queries_cached",
      "status": "missing",
      "evidence": "cache hot queries"
    },
    {
      "section": "serving_and_privacy",
      "check": "lexical_only_fallback_exists",
      "status": "missing",
      "evidence": "quality gate: degradation path (lexical-only fallback) when vectors are unavailable exists"
    },
    {
      "section": "serving_and_privacy",
      "check": "query_time_access_scopes_enforced",
      "status": "missing",
      "evidence": "privacy: query-time access scopes enforced"
    },
    {
      "section": "serving_and_privacy",
      "check": "sensitive_content_excluded_or_encrypted_at_rest",
      "status": "missing",
      "evidence": "sensitive content excluded or encrypted-at-rest unless explicitly indexed"
    },
    {
      "section": "serving_and_privacy",
      "check": "local_embeddings_for_private_corpus",
      "status": "missing",
      "evidence": "no private corpus declared"
    }
  ],
  "metrics": {
    "queries_total": 1,
    "queries_meeting_thresholds": 0,
    "mean_recall_at_k": "0.0000",
    "mean_mrr": "0.0000",
    "mean_ndcg_at_k": "0.0000",
    "leaked_doc_count": 1
  },
  "summary": "0 pass, 3 fail, 33 missing of 36 checks across six sections.",
  "stamp": "RAG RETRIEVAL EVALUATION TUNING\nsystem: None\nVERDICT: RAG_EVALUATION_UNSOUND\n  corpus_and_chunking      insufficient_evidence\n  hybrid_retrieval         insufficient_evidence\n  reranking_and_filters    fail\n  index_hygiene            insufficient_evidence\n  evaluation               fail\n  serving_and_privacy      insufficient_evidence\n0 pass, 3 fail, 33 missing of 36 checks across six sections."
}
```

### Example 3 — malformed (recorded HTTP 422)

Recorded case note: Type violation: corpus field expects object, received string.

Input:

```json
{
  "corpus": "this-should-be-an-object"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "corpus",
  "detail": "corpus must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Y — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Integrators Y · Developers Y · Ops Y · Regulators N/A (an engineering evaluation of a retrieval system; privacy posture is one section of the manifest, but the verdict is not itself compliance or audit evidence for a regulated domain.) |
| Checks named count vs recorded count | 36 / 36 — every check in the recorded full-pass response is documented |
| Verdict vocabulary complete | Y — 3 verdict values plus section/per-item statuses documented |
| Input reference typed | Y — 48 field rows, each with a type (SERVICE.md field table + recorded input schema) |
| Worked examples verbatim-verified | Y — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/rag-retrieval-evaluation-tuning/evidence.json` |

