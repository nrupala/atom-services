# Rag retrieval evaluation tuning — `rag-retrieval-evaluation-tuning`

**Deliverable type:** EVALUATION. This atom sells the evaluation it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build search & RAG that answers — indexing, hybrid retrieval, reranking, retrieval evals, access-scoped filters.

A caller submits the inputs the bound skill works on and receives one evaluation back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this evaluation on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Fixing product search and RAG**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the retrieval-evaluation evidence manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`RAG_EVALUATION_UNSOUND`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `system` (string; carried into the output, not itself checked) | — |
| `corpus.inventory_declared` | corpus_and_chunking |
| `corpus.freshness_requirements_declared` | corpus_and_chunking |
| `corpus.dedup_rules_declared` | corpus_and_chunking |
| `corpus.per_document_provenance_tracked` | corpus_and_chunking |
| `chunking.semantic_units` | corpus_and_chunking |
| `chunking.overlap_discipline_declared` | corpus_and_chunking |
| `chunking.stable_chunk_ids` | corpus_and_chunking |
| `retrieval.lexical_used` | hybrid_retrieval |
| `retrieval.vector_used` | hybrid_retrieval |
| `retrieval.scores_combined_with_declared_weights` | hybrid_retrieval |
| `retrieval.embedding_model_version_pinned` | hybrid_retrieval |
| `retrieval.reindex_plan_for_model_change` | hybrid_retrieval |
| `reranking.applied` | reranking_and_filters |
| `reranking.reranker_budget_declared` | reranking_and_filters |
| `reranking.context_top_n_bounded` | reranking_and_filters |
| `reranking.filters_applied_before_ranking` | reranking_and_filters |
| `reranking.scope_leakage_tested` | reranking_and_filters |
| `reranking.context_token_budget` (number) | reranking_and_filters (computed context check) |
| `index.incremental_updates_with_tombstones` | index_hygiene |
| `index.full_rebuild_drill_done` | index_hygiene |
| `index.size_quota_budgets_monitored` | index_hygiene |
| `index.embedding_model_and_index_versioned` | index_hygiene |
| `evaluation.golden_queries_labeled` | evaluation |
| `evaluation.thresholds_declared` | evaluation |
| `evaluation.evals_run_in_regression` | evaluation |
| `evaluation.real_queries_logged_privacy_scoped` | evaluation |
| `evaluation.tuning_performed` (gates the tuning red line below: required only when true) | evaluation |
| `evaluation.evals_run_before_tuning` | evaluation |
| `queries[]` (list of golden queries, see below) | evaluation + reranking_and_filters |
| `serving.latency_budgets_per_stage_declared` | serving_and_privacy |
| `serving.latency_budget_measured` | serving_and_privacy |
| `serving.hot_queries_cached` | serving_and_privacy |
| `serving.lexical_only_fallback_exists` | serving_and_privacy |
| `privacy.query_time_access_scopes_enforced` | serving_and_privacy |
| `privacy.sensitive_content_excluded_or_encrypted` | serving_and_privacy |
| `privacy.private_corpus` (gates the local-embeddings check below: required only when true) | serving_and_privacy |
| `privacy.local_embeddings_for_private_corpus` | serving_and_privacy |

Each `queries[]` entry is `{name, k, relevant_doc_ids,
retrieved_doc_ids, relevance_grades (optional), forbidden_doc_ids,
context_tokens, min_recall_at_k, min_mrr, min_ndcg_at_k}`. Three
checks are computed over these declared values — the only metrics the
skill names, with no threshold imported from outside (every threshold
is the caller's own, declared per query):

- **Golden metrics** — per query: recall@k = |relevant ∩
  retrieved[:k]| / |relevant| (distinct ids); reciprocal rank = 1 /
  rank of the first relevant doc in the full retrieved list (0 when
  none); nDCG@k = DCG@k / IDCG@k with DCG@k = Σ (2^grade − 1) /
  log2(rank + 1) over retrieved[:k] (rank 1-based; grade = the
  declared `relevance_grades` value, unlisted = 0, or binary
  relevant/not when grades are not declared; IDCG@k is the same sum
  over the positive grades sorted descending, truncated to k). The
  check passes only when every query's computed values meet that
  query's declared `min_*` thresholds.
- **Scope leakage (red line)** — no retrieved doc id may appear in
  its query's `forbidden_doc_ids` (the filtered / out-of-scope set).
- **Context budget (red line)** — every query's `context_tokens`
  must be within `reranking.context_token_budget`.

Computed floats (the output's `metrics.mean_recall_at_k`,
`mean_mrr`, `mean_ndcg_at_k`) are serialized as strings with exactly
four decimal places by a fixed rule shared by the Python and
TypeScript implementations: round half up to 4dp — floor(v × 10000 +
0.5) / 10000 — then format with exactly four decimals. Comparisons
use the unrounded values. The output also carries `metrics`
counts (queries_total / queries_meeting_thresholds /
leaked_doc_count).

The verdict is one of `RAG_EVALUATION_SOUND` (all 36 checks pass),
`RAG_EVALUATION_UNSOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: corpus_and_chunking, hybrid_retrieval,
reranking_and_filters, index_hygiene, evaluation,
serving_and_privacy.

## Honest scoping — declared vs measured, named exclusions

- **Declared, not measured.** Everything except the three computed
  checks is the caller's declaration: this atom does not crawl a
  corpus, run queries against a live index, time any pipeline stage,
  or inspect an embedding model. It computes over the retrieved lists
  and relevance judgments the caller submits, and audits the posture
  the caller declares.
- **Metrics are exactly the three the skill names** — recall@k, MRR,
  nDCG@k. Precision, F1, MAP and latency percentiles are **excluded**:
  the skill does not name them, so this atom does not invent them.
- **No threshold is the atom's.** The skill requires golden-set
  evals "with thresholds" but states no numbers; every threshold
  compared here is declared per query in the manifest itself.
- **Relevance judgments are the caller's.** A query with no positive
  relevance grade has no definable nDCG and counts as missing
  evidence, not as a zero score.
- Tuning itself, index building, reranker execution and query
  serving are the caller's systems — this atom evaluates their
  declared evidence and submitted retrieval results only.

## Status

Tier A · status: **built-locally** — deterministic core, Python
oracle, TypeScript port and golden fixtures are built and verified
locally; no endpoint is live. Release happens one by one, by the
owner's GO, per the approved queue.

## Named doubt (from the register)

Golden-set scores are checkable deliverable
