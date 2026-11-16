import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/data-ml-pipeline-engineering.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The DATA_ML_PIPELINE_READY manifest, copied from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  entity: "Acme Orders ML Pipeline",
  sources: {
    datasets: [{ name: "orders", rows: 600 }, { name: "events", rows: 400 }],
    declared_total_rows: 1000,
    schemas_and_expectations_declared_for_all_inputs_and_outputs: true,
    validation_on_arrival: true,
    bad_data_refused_loudly: true,
    silent_coercion_present: false,
  },
  pipeline: {
    steps_rerunnable_idempotently: true,
    exactly_once_effects_at_sinks: true,
    backfill_tested_once: true,
    explicit_step_dependencies: true,
    schedules_documented: true,
    failures_alert_and_retry: true,
    unrecorded_manual_reruns_present: false,
  },
  quality: {
    row_count_checks_between_stages: true,
    freshness_checks_between_stages: true,
    null_uniqueness_distribution_checks_between_stages: true,
    bad_partitions_quarantined: true,
    pipeline_health_dashboard_present: true,
  },
  lineage: {
    source_to_transform_to_sink_tracked: true,
    code_versioned: true,
    config_versioned: true,
    data_snapshots_versioned: true,
    same_inputs_produce_same_outputs_verified: true,
  },
  training: { reproducible_with_seeds_and_pinned_env: true },
  features: {
    feature_definitions_declared: true,
    label_definition_declared: true,
    feature_store_only_when_justified: true,
  },
  splits: {
    train_rows: 700,
    eval_rows: 150,
    test_rows: 150,
    declared_total_rows: 1000,
    leakage_checks_cover_time_target_and_cross_splits: true,
    split_by_time_or_user_when_temporal: true,
    class_balance_assessed: true,
  },
  privacy: { pii_in_training_data_without_lawful_basis: false },
  lifecycle: {
    eval_suites_versioned_with_model: true,
    model_registry_entry_exists: true,
    model_card_covers_data_metrics_and_limits: true,
    offline_eval_completed_before_prod: true,
    rollout_plan_present_before_prod: true,
  },
  serving: {
    deployment_pattern_declared: true,
    estimated_latency_ms: 120,
    latency_budget_ms: 250,
    estimated_monthly_cost: 800,
    monthly_cost_budget: 1000,
  },
  monitoring: {
    input_drift_monitored: true,
    output_drift_monitored: true,
    performance_decay_monitored_vs_baselines: true,
    alert_thresholds_set: true,
    thresholds_tied_to_retraining_policy: true,
    retraining_is_a_pipeline: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "DATA_ML_PIPELINE_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 46);
  assert.equal(v.sources_evaluated, 2);
  assert.equal(v.computed_total_rows, "1000.000000");
  assert.equal(v.total_rows_difference, "0.000000");
  assert.equal(v.computed_split_total_rows, "1000.000000");
  assert.equal(v.split_total_difference, "0.000000");
  assert.equal(v.latency_headroom_ms, "130.000000");
  assert.equal(v.monthly_cost_headroom, "200.000000");
});

test("test_values_at_other_scales_pass", () => {
  const m = clone(COMPLETE) as any;
  m.sources.datasets = [{ name: "a", rows: 5 }];
  m.sources.declared_total_rows = 5;
  Object.assign(m.splits, {
    train_rows: 3, eval_rows: 1, test_rows: 1, declared_total_rows: 5,
  });
  Object.assign(m.serving, {
    estimated_latency_ms: 250, estimated_monthly_cost: 1000,
  });
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_ML_PIPELINE_READY");
  assert.equal(v.latency_headroom_ms, "0.000000");
  assert.equal(v.monthly_cost_headroom, "0.000000");
});

test("test_source_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sources.declared_total_rows = 900;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_ML_PIPELINE_NOT_READY");
  assert.equal(v.sections["contracts_and_ingestion"], "fail");
  assert.equal(
    checkStatus(v, "total_rows_matches_sum_of_source_rows"), "fail");
  assert.equal(v.total_rows_difference, "-100.000000");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_missing_datasets_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.sources.datasets;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "source_entries_complete"), "missing");
  assert.equal(v.sources_evaluated, 0);
  assert.equal(v.computed_total_rows, null);
  assert.equal(v.computed_status, null);
});

test("test_empty_datasets_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  m.sources.datasets = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "total_rows_matches_sum_of_source_rows"), "missing");
});

test("test_incomplete_dataset_entry_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.sources.datasets[1].rows;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "source_entries_complete"), "missing");
  assert.equal(v.sources_evaluated, 1);
  assert.equal(v.computed_total_rows, null);
});

test("test_dataset_entry_without_name_still_totals", () => {
  const m = clone(COMPLETE) as any;
  delete m.sources.datasets[0].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "source_entries_complete"), "missing");
  assert.equal(
    checkStatus(v, "total_rows_matches_sum_of_source_rows"), "pass");
  assert.equal(v.computed_total_rows, "1000.000000");
});

test("test_missing_declared_source_total_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.sources.declared_total_rows;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_total_rows, null);
});

test("test_silent_coercion_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.sources.silent_coercion_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_ML_PIPELINE_NOT_READY");
  assert.equal(checkStatus(v, "no_silent_coercion"), "fail");
});

test("test_split_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.splits.declared_total_rows = 1100;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_ML_PIPELINE_NOT_READY");
  assert.equal(
    checkStatus(v, "split_total_matches_sum_of_split_rows"), "fail");
  assert.equal(v.split_total_difference, "100.000000");
  assert.equal(v.computed_split_total_rows, "1000.000000");
});

test("test_any_split_ratio_passes_when_total_consistent", () => {
  const m = clone(COMPLETE) as any;
  Object.assign(m.splits, {
    train_rows: 100, eval_rows: 400, test_rows: 500,
  });
  assert.equal(evaluate(m).verdict, "DATA_ML_PIPELINE_READY");
});

test("test_missing_split_part_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.splits.eval_rows;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_split_total_rows, null);
  assert.equal(v.split_total_difference, null);
});

test("test_missing_split_declared_total_is_missing_but_sum_known", () => {
  const m = clone(COMPLETE) as any;
  delete m.splits.declared_total_rows;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_split_total_rows, "1000.000000");
  assert.equal(v.split_total_difference, null);
});

test("test_leakage_checks_absent_section_fails", () => {
  const m = clone(COMPLETE) as any;
  m.splits.leakage_checks_cover_time_target_and_cross_splits = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_ML_PIPELINE_NOT_READY");
  assert.equal(v.sections["ml_hygiene_and_splits"], "fail");
});

test("test_pii_without_lawful_basis_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.privacy.pii_in_training_data_without_lawful_basis = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_ML_PIPELINE_NOT_READY");
  assert.equal(
    checkStatus(v, "no_pii_in_training_data_without_lawful_basis"),
    "fail");
});

test("test_latency_over_caller_budget_fails", () => {
  const m = clone(COMPLETE) as any;
  m.serving.estimated_latency_ms = 300;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_ML_PIPELINE_NOT_READY");
  assert.equal(
    checkStatus(v, "latency_within_caller_declared_budget"), "fail");
  assert.equal(v.latency_headroom_ms, "-50.000000");
});

test("test_latency_exactly_at_budget_passes", () => {
  const m = clone(COMPLETE) as any;
  m.serving.estimated_latency_ms = 250;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "latency_within_caller_declared_budget"), "pass");
  assert.equal(v.verdict, "DATA_ML_PIPELINE_READY");
});

test("test_cost_over_caller_budget_fails", () => {
  const m = clone(COMPLETE) as any;
  m.serving.monthly_cost_budget = 700;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_ML_PIPELINE_NOT_READY");
  assert.equal(
    checkStatus(v, "cost_within_caller_declared_budget"), "fail");
  assert.equal(v.monthly_cost_headroom, "-100.000000");
});

test("test_missing_latency_budget_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.serving.latency_budget_ms;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.latency_headroom_ms, null);
  assert.equal(v.monthly_cost_headroom, "200.000000");
});

test("test_missing_cost_estimate_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.serving.estimated_monthly_cost;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.monthly_cost_headroom, null);
});

test("test_unrecorded_manual_reruns_fail", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.unrecorded_manual_reruns_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_ML_PIPELINE_NOT_READY");
  assert.equal(v.sections["idempotency_and_orchestration"], "fail");
});

test("test_no_offline_eval_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.lifecycle.offline_eval_completed_before_prod = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATA_ML_PIPELINE_NOT_READY");
  assert.equal(v.sections["lifecycle_and_serving"], "fail");
});

test("test_each_section_can_fail", () => {
  const cases: Record<string, [string, string]> = {
    contracts_and_ingestion: ["sources", "validation_on_arrival"],
    idempotency_and_orchestration:
      ["pipeline", "steps_rerunnable_idempotently"],
    quality_gates: ["quality", "bad_partitions_quarantined"],
    lineage_and_reproducibility: ["lineage", "code_versioned"],
    ml_hygiene_and_splits: ["splits", "class_balance_assessed"],
    lifecycle_and_serving: ["lifecycle", "model_registry_entry_exists"],
    monitoring_and_drift: ["monitoring", "input_drift_monitored"],
  };
  for (const [section, [top, field]] of Object.entries(cases)) {
    const m = clone(COMPLETE) as any;
    m[top][field] = false;
    const v = evaluate(m);
    assert.equal(v.verdict, "DATA_ML_PIPELINE_NOT_READY", section);
    assert.equal(v.sections[section], "fail", section);
  }
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.monitoring;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["monitoring_and_drift"],
    "insufficient_evidence");
});

test("test_sparse_manifest_is_insufficient_evidence", () => {
  const v = evaluate({ entity: "Only A Name" });
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(Object.values(v.sections)
    .every((s) => s === "insufficient_evidence"));
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.sources_evaluated, 0);
  assert.equal(v.computed_total_rows, null);
  assert.equal(v.computed_split_total_rows, null);
  assert.equal(v.latency_headroom_ms, null);
  assert.equal(v.monthly_cost_headroom, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: DATA_ML_PIPELINE_READY"));
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

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.entity = 12345;
  assert.throws(() => evaluate(m), fieldError("entity"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ sources: "should-be-an-object" }),
    fieldError("sources"),
  );
});

test("malformed: datasets list as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sources.datasets = "orders,events";
  assert.throws(() => evaluate(m), fieldError("sources.datasets"));
});

test("malformed: dataset entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sources.datasets[0] = "orders";
  assert.throws(() => evaluate(m), fieldError("sources.datasets[0]"));
});

test("malformed: dataset name as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sources.datasets[0].name = 1;
  assert.throws(
    () => evaluate(m), fieldError("sources.datasets[0].name"));
});

test("malformed: dataset rows as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sources.datasets[1].rows = "400";
  assert.throws(
    () => evaluate(m), fieldError("sources.datasets[1].rows"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sources.validation_on_arrival = "yes";
  assert.throws(
    () => evaluate(m), fieldError("sources.validation_on_arrival"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.splits.train_rows = "700";
  assert.throws(() => evaluate(m), fieldError("splits.train_rows"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.serving.estimated_latency_ms = true;
  assert.throws(
    () => evaluate(m), fieldError("serving.estimated_latency_ms"));
});

test("malformed: nested boolean leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.monitoring.alert_thresholds_set = 1;
  assert.throws(
    () => evaluate(m), fieldError("monitoring.alert_thresholds_set"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.quality = null;
  assert.throws(() => evaluate(m), fieldError("quality"));
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
  .filter((f) => f.startsWith("data-ml-pipeline-engineering--") && f.endsWith(".json"))
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
