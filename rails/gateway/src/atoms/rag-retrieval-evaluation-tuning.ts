// RAG retrieval evaluation & tuning — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/rag-retrieval-evaluation-tuning/src/
// rag_retrieval_evaluation_tuning.py (evaluate() + stamp()). No logic
// changes: every verdict, section outcome, per-check status, evidence
// string, computed metric string and the summary string are
// byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// relevance_grades is an object keyed by caller-chosen doc ids, so
// its spec is the empty object: the container type is validated,
// its entries are the caller's own judgments (the spec DSL names
// documented subfields only).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  system: "string",
  corpus: {
    inventory_declared: "boolean",
    freshness_requirements_declared: "boolean",
    dedup_rules_declared: "boolean",
    per_document_provenance_tracked: "boolean",
  },
  chunking: {
    semantic_units: "boolean",
    overlap_discipline_declared: "boolean",
    stable_chunk_ids: "boolean",
  },
  retrieval: {
    lexical_used: "boolean",
    vector_used: "boolean",
    scores_combined_with_declared_weights: "boolean",
    embedding_model_version_pinned: "boolean",
    reindex_plan_for_model_change: "boolean",
  },
  reranking: {
    applied: "boolean",
    reranker_budget_declared: "boolean",
    context_top_n_bounded: "boolean",
    filters_applied_before_ranking: "boolean",
    scope_leakage_tested: "boolean",
    context_token_budget: "number",
  },
  index: {
    incremental_updates_with_tombstones: "boolean",
    full_rebuild_drill_done: "boolean",
    size_quota_budgets_monitored: "boolean",
    embedding_model_and_index_versioned: "boolean",
  },
  evaluation: {
    golden_queries_labeled: "boolean",
    thresholds_declared: "boolean",
    evals_run_in_regression: "boolean",
    real_queries_logged_privacy_scoped: "boolean",
    tuning_performed: "boolean",
    evals_run_before_tuning: "boolean",
  },
  queries: [{
    name: "string",
    k: "number",
    relevant_doc_ids: ["string"],
    retrieved_doc_ids: ["string"],
    relevance_grades: {},
    forbidden_doc_ids: ["string"],
    context_tokens: "number",
    min_recall_at_k: "number",
    min_mrr: "number",
    min_ndcg_at_k: "number",
  }],
  serving: {
    latency_budgets_per_stage_declared: "boolean",
    latency_budget_measured: "boolean",
    hot_queries_cached: "boolean",
    lexical_only_fallback_exists: "boolean",
  },
  privacy: {
    query_time_access_scopes_enforced: "boolean",
    sensitive_content_excluded_or_encrypted: "boolean",
    private_corpus: "boolean",
    local_embeddings_for_private_corpus: "boolean",
  },
};

export const SECTIONS = [
  "corpus_and_chunking",
  "hybrid_retrieval",
  "reranking_and_filters",
  "index_hygiene",
  "evaluation",
  "serving_and_privacy",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Metrics {
  queries_total: number;
  queries_meeting_thresholds: number;
  mean_recall_at_k: string | null;
  mean_mrr: string | null;
  mean_ndcg_at_k: string | null;
  leaked_doc_count: number;
}

export interface Verdict {
  service: string;
  atom_version: string;
  system: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  metrics: Metrics;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pyTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPyDict(value)) return Object.keys(value).length > 0;
  return Boolean(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function getFrom(
  obj: Record<string, unknown>,
  key: string,
): [unknown, boolean] {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) return [null, false];
  return [obj[key], true];
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

function isStrList(value: unknown): boolean {
  return Array.isArray(value) &&
    value.every((item) => typeof item === "string");
}

interface QueryMetrics {
  recall: number;
  reciprocal: number;
  ndcg: number;
  thresholds: number[];
}

function queryMetrics(query: unknown): QueryMetrics | null {
  if (!isPyDict(query)) return null;
  const [kRaw, hasK] = getFrom(query, "k");
  const [relevant, hasRel] = getFrom(query, "relevant_doc_ids");
  const [retrieved, hasRet] = getFrom(query, "retrieved_doc_ids");
  const [grades, hasGrades] = getFrom(query, "relevance_grades");
  const thresholds: number[] = [];
  for (const field of ["min_recall_at_k", "min_mrr", "min_ndcg_at_k"]) {
    const [value, hasValue] = getFrom(query, field);
    if (!(hasValue && isNumber(value))) return null;
    thresholds.push(value as number);
  }
  if (!(hasK && isNumber(kRaw) && (kRaw as number) >= 1 &&
        Number.isInteger(kRaw))) {
    return null;
  }
  if (!(hasRel && isStrList(relevant) &&
        (relevant as string[]).length > 0)) {
    return null;
  }
  if (!(hasRet && isStrList(retrieved))) return null;
  if (hasGrades) {
    if (!isPyDict(grades)) return null;
    for (const grade of Object.values(grades)) {
      if (!isNumber(grade) || (grade as number) < 0) return null;
    }
  }
  const k = kRaw as number;
  const relevantSet = new Set(relevant as string[]);
  const retrievedList = retrieved as string[];
  const topK = retrievedList.slice(0, k);
  const topKSet = new Set(topK);
  let hits = 0;
  for (const doc of relevantSet) if (topKSet.has(doc)) hits += 1;
  const recall = hits / relevantSet.size;
  let reciprocal = 0;
  for (let idx = 0; idx < retrievedList.length; idx++) {
    if (relevantSet.has(retrievedList[idx])) {
      reciprocal = 1 / (idx + 1);
      break;
    }
  }
  const gradeOf = (doc: string): number => {
    if (hasGrades) {
      const g = (grades as Record<string, unknown>)[doc];
      return typeof g === "number" ? g : 0;
    }
    return relevantSet.has(doc) ? 1 : 0;
  };
  let dcg = 0;
  for (let idx = 0; idx < topK.length; idx++) {
    dcg += (Math.pow(2, gradeOf(topK[idx])) - 1) / Math.log2(idx + 2);
  }
  let pool: number[];
  if (hasGrades) {
    pool = Object.values(grades as Record<string, unknown>)
      .filter((g): g is number => typeof g === "number" && g > 0)
      .sort((a, b) => b - a);
  } else {
    pool = Array.from({ length: relevantSet.size }, () => 1);
  }
  let idcg = 0;
  const poolTop = pool.slice(0, k);
  for (let idx = 0; idx < poolTop.length; idx++) {
    idcg += (Math.pow(2, poolTop[idx]) - 1) / Math.log2(idx + 2);
  }
  if (idcg === 0) return null;
  return { recall, reciprocal, ndcg: dcg / idcg, thresholds };
}

function metricsCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): Metrics {
  const [queries, hasQueries] = getPath(manifest, "queries");
  const empty: Metrics = {
    queries_total: 0, queries_meeting_thresholds: 0,
    mean_recall_at_k: null, mean_mrr: null, mean_ndcg_at_k: null,
    leaked_doc_count: 0,
  };
  if (!hasQueries || !Array.isArray(queries) || queries.length === 0) {
    check(results, "evaluation", "golden_metrics_meet_declared_thresholds",
      queries, false, false, "no golden queries declared");
    return empty;
  }
  let incomplete = false;
  let violating = false;
  let meeting = 0;
  const recalls: number[] = [];
  const reciprocals: number[] = [];
  const ndcgs: number[] = [];
  for (const query of queries) {
    const computed = queryMetrics(query);
    if (computed === null) {
      incomplete = true;
      continue;
    }
    recalls.push(computed.recall);
    reciprocals.push(computed.reciprocal);
    ndcgs.push(computed.ndcg);
    if (computed.thresholds.some((t) => t < 0 || t > 1)) {
      violating = true;
      continue;
    }
    if (computed.recall >= computed.thresholds[0] &&
        computed.reciprocal >= computed.thresholds[1] &&
        computed.ndcg >= computed.thresholds[2]) {
      meeting += 1;
    } else {
      violating = true;
    }
  }
  const metrics: Metrics = {
    queries_total: queries.length,
    queries_meeting_thresholds: meeting,
    mean_recall_at_k: null, mean_mrr: null, mean_ndcg_at_k: null,
    leaked_doc_count: 0,
  };
  if (incomplete) {
    check(results, "evaluation", "golden_metrics_meet_declared_thresholds",
      queries, false, false,
      "a golden query is missing its k, labeled relevant docs, retrieved list, or declared thresholds, or has no positive relevance grade");
    return metrics;
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  metrics.mean_recall_at_k = fmt4(mean(recalls));
  metrics.mean_mrr = fmt4(mean(reciprocals));
  metrics.mean_ndcg_at_k = fmt4(mean(ndcgs));
  check(results, "evaluation", "golden_metrics_meet_declared_thresholds",
    queries, true, !violating,
    "evaluation before tuning: golden queries with labeled relevant docs; computed recall@k / MRR / nDCG@k per query against that query's declared thresholds");
  return metrics;
}

function leakageCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
  metrics: Metrics,
): void {
  const [queries, hasQueries] = getPath(manifest, "queries");
  if (!hasQueries || !Array.isArray(queries) || queries.length === 0) {
    check(results, "evaluation", "no_scope_leakage_in_retrieved_results",
      queries, false, false, "no golden queries declared");
    return;
  }
  let incomplete = false;
  let leaked = 0;
  for (const query of queries) {
    if (!isPyDict(query)) {
      incomplete = true;
      continue;
    }
    const [forbidden, hasForbidden] = getFrom(query, "forbidden_doc_ids");
    const [retrieved, hasRet] = getFrom(query, "retrieved_doc_ids");
    if (!(hasForbidden && isStrList(forbidden) && hasRet &&
          isStrList(retrieved))) {
      incomplete = true;
      continue;
    }
    const retrievedSet = new Set(retrieved as string[]);
    for (const doc of new Set(forbidden as string[])) {
      if (retrievedSet.has(doc)) leaked += 1;
    }
  }
  metrics.leaked_doc_count = leaked;
  if (incomplete) {
    check(results, "evaluation", "no_scope_leakage_in_retrieved_results",
      queries, false, false,
      "a golden query is missing its forbidden_doc_ids or retrieved list");
  } else {
    check(results, "evaluation", "no_scope_leakage_in_retrieved_results",
      queries, true, leaked === 0,
      "skill red line: no cross-scope leakage — no retrieved doc is in its query's declared forbidden (filtered / out-of-scope) set");
  }
}

function contextCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): void {
  const [queries, hasQueries] = getPath(manifest, "queries");
  const [budget, hasBudget] = getPath(manifest, "reranking",
    "context_token_budget");
  if (!hasQueries || !Array.isArray(queries) || queries.length === 0) {
    check(results, "reranking_and_filters",
      "context_within_declared_token_budget",
      queries, false, false, "no golden queries declared");
    return;
  }
  let incomplete = !(hasBudget && isNumber(budget));
  let violating = hasBudget && isNumber(budget) && (budget as number) < 0;
  for (const query of queries) {
    if (!isPyDict(query)) {
      incomplete = true;
      continue;
    }
    const [tokens, hasTokens] = getFrom(query, "context_tokens");
    if (!(hasTokens && isNumber(tokens))) {
      incomplete = true;
      continue;
    }
    if ((tokens as number) < 0) violating = true;
    else if (hasBudget && isNumber(budget) &&
             (tokens as number) > (budget as number)) {
      violating = true;
    }
  }
  if (incomplete) {
    check(results, "reranking_and_filters",
      "context_within_declared_token_budget",
      queries, false, false,
      "a golden query is missing its context_tokens, or reranking.context_token_budget is not declared as a number");
  } else {
    check(results, "reranking_and_filters",
      "context_within_declared_token_budget",
      queries, true, !violating,
      "skill red line: no unbounded context dumps to models — every query's context_tokens within the declared context_token_budget");
  }
}

function tuningCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): void {
  const [tuned, hasTuned] = getPath(manifest, "evaluation",
    "tuning_performed");
  const [evalsFirst, hasEvals] = getPath(manifest, "evaluation",
    "evals_run_before_tuning");
  if (hasTuned && pyTruthy(tuned)) {
    check(results, "evaluation", "no_tuning_without_evals",
      evalsFirst, hasEvals, evalsFirst === true,
      "skill red line: no tuning without evals — evals ran before tuning");
  } else {
    check(results, "evaluation", "no_tuning_without_evals",
      tuned, hasTuned, true, "no tuning declared");
  }
}

function localEmbeddingsCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): void {
  const [priv, hasPrivate] = getPath(manifest, "privacy", "private_corpus");
  const [local, hasLocal] = getPath(manifest, "privacy",
    "local_embeddings_for_private_corpus");
  if (hasPrivate && pyTruthy(priv)) {
    check(results, "serving_and_privacy",
      "local_embeddings_for_private_corpus",
      local, hasLocal, local === true,
      "prefer local embeddings for private corpora");
  } else {
    check(results, "serving_and_privacy",
      "local_embeddings_for_private_corpus",
      priv, hasPrivate, true, "no private corpus declared");
  }
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: corpus_and_chunking (skill method 1) ----
  boolCheck(results, "corpus_and_chunking", "corpus_inventory_declared",
    manifest, ["corpus", "inventory_declared"],
    "corpus first: what's indexed is declared");
  boolCheck(results, "corpus_and_chunking",
    "freshness_requirements_declared", manifest,
    ["corpus", "freshness_requirements_declared"],
    "freshness requirements declared");
  boolCheck(results, "corpus_and_chunking", "dedup_rules_declared",
    manifest, ["corpus", "dedup_rules_declared"], "dedup rules declared");
  boolCheck(results, "corpus_and_chunking",
    "per_document_provenance_tracked", manifest,
    ["corpus", "per_document_provenance_tracked"],
    "per-document provenance tracked");
  boolCheck(results, "corpus_and_chunking", "chunking_uses_semantic_units",
    manifest, ["chunking", "semantic_units"],
    "chunking strategy: semantic units — chunking is 80% of RAG quality");
  boolCheck(results, "corpus_and_chunking",
    "chunking_overlap_discipline_declared", manifest,
    ["chunking", "overlap_discipline_declared"],
    "chunking overlap discipline declared");
  boolCheck(results, "corpus_and_chunking", "stable_chunk_ids",
    manifest, ["chunking", "stable_chunk_ids"], "stable chunk ids");

  // ---- Section 2: hybrid_retrieval (skill method 2) ----
  boolCheck(results, "hybrid_retrieval", "lexical_retrieval_used",
    manifest, ["retrieval", "lexical_used"],
    "hybrid retrieval: BM25/lexical for exact terms (codes, names, numbers)");
  boolCheck(results, "hybrid_retrieval", "vector_retrieval_used",
    manifest, ["retrieval", "vector_used"],
    "hybrid retrieval: vector kNN for meaning");
  boolCheck(results, "hybrid_retrieval",
    "hybrid_scores_combined_with_declared_weights", manifest,
    ["retrieval", "scores_combined_with_declared_weights"],
    "lexical and vector scores combined with tuned weights");
  boolCheck(results, "hybrid_retrieval", "embedding_model_version_pinned",
    manifest, ["retrieval", "embedding_model_version_pinned"],
    "embed model version pinned");
  boolCheck(results, "hybrid_retrieval", "reindex_plan_for_model_change",
    manifest, ["retrieval", "reindex_plan_for_model_change"],
    "reindex plan for any embedding model change");

  // ---- Section 3: reranking_and_filters (skill method 3) ----
  boolCheck(results, "reranking_and_filters", "reranking_applied",
    manifest, ["reranking", "applied"],
    "rerank with budget: top-K through a reranker to top-N for context");
  boolCheck(results, "reranking_and_filters", "reranker_budget_declared",
    manifest, ["reranking", "reranker_budget_declared"],
    "reranker token budget declared");
  boolCheck(results, "reranking_and_filters", "context_top_n_bounded",
    manifest, ["reranking", "context_top_n_bounded"],
    "context top-N is bounded");
  boolCheck(results, "reranking_and_filters",
    "filters_applied_before_ranking", manifest,
    ["reranking", "filters_applied_before_ranking"],
    "filters (time, type, access scope) applied before ranking or hard-enforced in queries");
  boolCheck(results, "reranking_and_filters", "scope_leakage_tested",
    manifest, ["reranking", "scope_leakage_tested"],
    "quality gate: filters enforced pre-rank; scope leakage tested");
  contextCheck(results, manifest);

  // ---- Section 4: index_hygiene (skill method 4 + quality gate) ----
  boolCheck(results, "index_hygiene",
    "incremental_updates_with_tombstones", manifest,
    ["index", "incremental_updates_with_tombstones"],
    "index hygiene: incremental updates + tombstones");
  boolCheck(results, "index_hygiene", "full_rebuild_drill_done",
    manifest, ["index", "full_rebuild_drill_done"],
    "quality gate: periodic full rebuild drill done");
  boolCheck(results, "index_hygiene",
    "index_size_quota_budgets_monitored", manifest,
    ["index", "size_quota_budgets_monitored"],
    "index size/quota budgets monitored");
  boolCheck(results, "index_hygiene",
    "embedding_model_and_index_versioned", manifest,
    ["index", "embedding_model_and_index_versioned"],
    "quality gate: embedding model + index versioned");

  // ---- Section 5: evaluation (skill method 5 + quality gate) ----
  boolCheck(results, "evaluation",
    "golden_queries_with_labeled_relevant_docs", manifest,
    ["evaluation", "golden_queries_labeled"],
    "evaluation before tuning: golden queries with labeled relevant docs");
  boolCheck(results, "evaluation", "thresholds_declared_for_golden_set",
    manifest, ["evaluation", "thresholds_declared"],
    "quality gate: golden-set evals with thresholds");
  boolCheck(results, "evaluation", "evals_run_in_regression",
    manifest, ["evaluation", "evals_run_in_regression"],
    "quality gate: golden-set evals run in CI/regression — regression gates on every index/pipeline change");
  boolCheck(results, "evaluation", "real_queries_logged_privacy_scoped",
    manifest, ["evaluation", "real_queries_logged_privacy_scoped"],
    "log real queries (privacy-scoped) to find gaps");
  const metrics = metricsCheck(results, manifest);
  leakageCheck(results, manifest, metrics);
  tuningCheck(results, manifest);

  // ---- Section 6: serving_and_privacy (skill methods 6-7 + gate) ----
  boolCheck(results, "serving_and_privacy",
    "latency_budgets_per_stage_declared", manifest,
    ["serving", "latency_budgets_per_stage_declared"],
    "serving: latency budgets per stage (embed, search, rerank)");
  boolCheck(results, "serving_and_privacy", "latency_budget_measured",
    manifest, ["serving", "latency_budget_measured"],
    "quality gate: latency budget measured");
  boolCheck(results, "serving_and_privacy", "hot_queries_cached",
    manifest, ["serving", "hot_queries_cached"], "cache hot queries");
  boolCheck(results, "serving_and_privacy",
    "lexical_only_fallback_exists", manifest,
    ["serving", "lexical_only_fallback_exists"],
    "quality gate: degradation path (lexical-only fallback) when vectors are unavailable exists");
  boolCheck(results, "serving_and_privacy",
    "query_time_access_scopes_enforced", manifest,
    ["privacy", "query_time_access_scopes_enforced"],
    "privacy: query-time access scopes enforced");
  boolCheck(results, "serving_and_privacy",
    "sensitive_content_excluded_or_encrypted_at_rest", manifest,
    ["privacy", "sensitive_content_excluded_or_encrypted"],
    "sensitive content excluded or encrypted-at-rest unless explicitly indexed");
  localEmbeddingsCheck(results, manifest);

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "RAG_EVALUATION_UNSOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "RAG_EVALUATION_SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "rag-retrieval-evaluation-tuning",
    atom_version: "0.1.0",
    system: manifest["system"] ?? null,
    verdict,
    sections,
    checks: results,
    metrics,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "RAG RETRIEVAL EVALUATION TUNING",
    `system: ${pyStr(verdict.system ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(24)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
