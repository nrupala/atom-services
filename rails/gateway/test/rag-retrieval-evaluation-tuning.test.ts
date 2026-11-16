import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/rag-retrieval-evaluation-tuning.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  system: "example-rag",
  corpus: { inventory_declared: true, freshness_requirements_declared: true,
            dedup_rules_declared: true,
            per_document_provenance_tracked: true },
  chunking: { semantic_units: true, overlap_discipline_declared: true,
              stable_chunk_ids: true },
  retrieval: { lexical_used: true, vector_used: true,
               scores_combined_with_declared_weights: true,
               embedding_model_version_pinned: true,
               reindex_plan_for_model_change: true },
  reranking: { applied: true, reranker_budget_declared: true,
               context_top_n_bounded: true,
               filters_applied_before_ranking: true,
               scope_leakage_tested: true, context_token_budget: 4000 },
  index: { incremental_updates_with_tombstones: true,
           full_rebuild_drill_done: true,
           size_quota_budgets_monitored: true,
           embedding_model_and_index_versioned: true },
  evaluation: { golden_queries_labeled: true, thresholds_declared: true,
                evals_run_in_regression: true,
                real_queries_logged_privacy_scoped: true,
                tuning_performed: true, evals_run_before_tuning: true },
  serving: { latency_budgets_per_stage_declared: true,
             latency_budget_measured: true, hot_queries_cached: true,
             lexical_only_fallback_exists: true },
  privacy: { query_time_access_scopes_enforced: true,
             sensitive_content_excluded_or_encrypted: true,
             private_corpus: true,
             local_embeddings_for_private_corpus: true },
  queries: [
    { name: "q1", k: 2, relevant_doc_ids: ["d1", "d2"],
      retrieved_doc_ids: ["d1", "d2", "d3"],
      relevance_grades: { d1: 2, d2: 1 }, forbidden_doc_ids: ["x1"],
      context_tokens: 1200, min_recall_at_k: 0.9, min_mrr: 0.9,
      min_ndcg_at_k: 0.9 },
    { name: "q2", k: 2, relevant_doc_ids: ["d4"],
      retrieved_doc_ids: ["d4", "d5"], forbidden_doc_ids: [],
      context_tokens: 800, min_recall_at_k: 0.5, min_mrr: 0.5,
      min_ndcg_at_k: 0.5 },
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 21 Python VerdictTests, ported ----

test("test_sound_manifest_is_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "RAG_EVALUATION_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 36);
  assert.equal(v.metrics.queries_total, 2);
  assert.equal(v.metrics.queries_meeting_thresholds, 2);
  assert.equal(v.metrics.mean_recall_at_k, "1.0000");
  assert.equal(v.metrics.mean_mrr, "1.0000");
  assert.equal(v.metrics.mean_ndcg_at_k, "1.0000");
  assert.equal(v.metrics.leaked_doc_count, 0);
});

test("test_metrics_computed_for_partial_retrieval", () => {
  const m = clone(SOUND) as any;
  m.queries[0].retrieved_doc_ids = ["d3", "d1", "d2"];
  m.queries[0].min_recall_at_k = 0.4;
  m.queries[0].min_mrr = 0.4;
  m.queries[0].min_ndcg_at_k = 0.4;
  const v = evaluate(m);
  assert.equal(v.verdict, "RAG_EVALUATION_SOUND");
  assert.equal(v.metrics.mean_recall_at_k, "0.7500");
  assert.equal(v.metrics.mean_mrr, "0.7500");
});

test("test_query_below_declared_threshold_fails_evaluation", () => {
  const m = clone(SOUND) as any;
  m.queries[0].retrieved_doc_ids = ["d3", "d9"];
  const v = evaluate(m);
  assert.equal(v.verdict, "RAG_EVALUATION_UNSOUND");
  assert.equal(v.sections["evaluation"], "fail");
  assert.equal(checkStatus(v, "golden_metrics_meet_declared_thresholds"), "fail");
  assert.equal(v.metrics.queries_meeting_thresholds, 1);
});

test("test_threshold_out_of_range_fails", () => {
  const m = clone(SOUND) as any;
  m.queries[0].min_recall_at_k = 1.5;
  assert.equal(evaluate(m).verdict, "RAG_EVALUATION_UNSOUND");
});

test("test_scope_leakage_is_a_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.queries[0].retrieved_doc_ids = ["d1", "d2", "x1"];
  const v = evaluate(m);
  assert.equal(v.verdict, "RAG_EVALUATION_UNSOUND");
  assert.equal(checkStatus(v, "no_scope_leakage_in_retrieved_results"), "fail");
  assert.equal(v.metrics.leaked_doc_count, 1);
});

test("test_context_over_budget_is_a_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.queries[1].context_tokens = 9000;
  const v = evaluate(m);
  assert.equal(v.verdict, "RAG_EVALUATION_UNSOUND");
  assert.equal(v.sections["reranking_and_filters"], "fail");
  assert.equal(checkStatus(v, "context_within_declared_token_budget"), "fail");
});

test("test_tuning_without_evals_is_a_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.evaluation.evals_run_before_tuning = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RAG_EVALUATION_UNSOUND");
  assert.equal(checkStatus(v, "no_tuning_without_evals"), "fail");
});

test("test_no_tuning_declared_passes_tuning_check", () => {
  const m = clone(SOUND) as any;
  m.evaluation.tuning_performed = false;
  delete m.evaluation.evals_run_before_tuning;
  assert.equal(evaluate(m).verdict, "RAG_EVALUATION_SOUND");
});

test("test_filters_after_ranking_fails", () => {
  const m = clone(SOUND) as any;
  m.reranking.filters_applied_before_ranking = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RAG_EVALUATION_UNSOUND");
  assert.equal(v.sections["reranking_and_filters"], "fail");
});

test("test_no_fallback_fails_serving", () => {
  const m = clone(SOUND) as any;
  m.serving.lexical_only_fallback_exists = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RAG_EVALUATION_UNSOUND");
  assert.equal(v.sections["serving_and_privacy"], "fail");
});

test("test_private_corpus_without_local_embeddings_fails", () => {
  const m = clone(SOUND) as any;
  m.privacy.local_embeddings_for_private_corpus = false;
  assert.equal(evaluate(m).verdict, "RAG_EVALUATION_UNSOUND");
});

test("test_no_private_corpus_passes_local_embeddings_as_na", () => {
  const m = clone(SOUND) as any;
  m.privacy.private_corpus = false;
  delete m.privacy.local_embeddings_for_private_corpus;
  assert.equal(evaluate(m).verdict, "RAG_EVALUATION_SOUND");
});

test("test_query_missing_threshold_is_insufficient", () => {
  const m = clone(SOUND) as any;
  delete m.queries[0].min_mrr;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "golden_metrics_meet_declared_thresholds"), "missing");
  assert.equal(v.metrics.mean_recall_at_k, null);
});

test("test_query_missing_forbidden_list_is_insufficient", () => {
  const m = clone(SOUND) as any;
  delete m.queries[0].forbidden_doc_ids;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_scope_leakage_in_retrieved_results"), "missing");
});

test("test_query_missing_context_tokens_is_insufficient", () => {
  const m = clone(SOUND) as any;
  delete m.queries[0].context_tokens;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "context_within_declared_token_budget"), "missing");
});

test("test_no_queries_declared_is_insufficient", () => {
  const m = clone(SOUND) as any;
  delete m.queries;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.metrics.queries_total, 0);
  assert.equal(v.metrics.mean_mrr, null);
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.index;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["index_hygiene"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.metrics.queries_total, 0);
});

test("test_binary_grades_used_when_grades_not_declared", () => {
  const m = clone(SOUND) as any;
  delete m.queries[0].relevance_grades;
  const v = evaluate(m);
  assert.equal(v.verdict, "RAG_EVALUATION_SOUND");
  assert.equal(v.metrics.mean_ndcg_at_k, "1.0000");
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(SOUND))).includes("VERDICT: RAG_EVALUATION_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types (external verification
// Wave 1) — the Python MalformedTypeTests, ported. A documented
// field present with the wrong JSON type raises FieldTypeError
// naming the field — never a verdict over garbage.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: recorded external case rejected", () => {
  assert.throws(
    () => evaluate({ corpus: "this-should-be-an-object" }),
    fieldError("corpus"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.corpus.inventory_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("corpus.inventory_declared"));
});

test("malformed: token budget as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.reranking.context_token_budget = "4000";
  assert.throws(() => evaluate(m), fieldError("reranking.context_token_budget"));
});

test("malformed: queries as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.queries = "q1";
  assert.throws(() => evaluate(m), fieldError("queries"));
});

test("malformed: query k as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.queries[0].k = "2";
  assert.throws(() => evaluate(m), fieldError("queries[0].k"));
});

test("malformed: doc id entry as number rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.queries[0].relevant_doc_ids = ["d1", 42];
  assert.throws(() => evaluate(m), fieldError("queries[0].relevant_doc_ids[1]"));
});

test("malformed: relevance grades as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.queries[0].relevance_grades = "high";
  assert.throws(() => evaluate(m), fieldError("queries[0].relevance_grades"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.reranking = null;
  assert.throws(() => evaluate(m), fieldError("reranking"));
});

// ---- Golden-fixture parity against the Python oracle ----

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "fixtures",
);

interface Fixture {
  name: string;
  manifest: unknown;
  expected: unknown;
}

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.startsWith("rag-retrieval-evaluation-tuning--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
