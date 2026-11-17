import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/local-llm-serving-setup.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  setup: "fleet-router-box",
  workload: { tasks_defined: true,
              context_lengths_defined: true,
              concurrency_defined: true,
              compute_and_vram_ram_budget_computed: true,
              kv_cache_growth_accounted_and_headroom_left: true,
              quantization_chosen_deliberately_with_tradeoffs: true },
  model_selection: { model_size_matched_to_task: true },
  models: [
    { name: "router-7b", vram_ram_and_context_budget_documented: true,
      version_pinned_and_checksum_recorded: true,
      license_vetted_for_commercial_use: true,
      performance_measured_at_realistic_context: true,
      golden_task_eval_recorded: true },
    { name: "reasoner-14b", vram_ram_and_context_budget_documented: true,
      version_pinned_and_checksum_recorded: true,
      license_vetted_for_commercial_use: true,
      performance_measured_at_realistic_context: true,
      golden_task_eval_recorded: true },
    { name: "summary-3b", vram_ram_and_context_budget_documented: true,
      version_pinned_and_checksum_recorded: true,
      license_vetted_for_commercial_use: true,
      performance_measured_at_realistic_context: true,
      golden_task_eval_recorded: true },
  ],
  serving: { stack_fits_host_and_workload: true,
             runs_daemonless_under_supervisor_with_auto_restart: true,
             bound_to_loopback_only_verified: true,
             remote_access_only_via_authenticated_tunnel: true,
             unauthenticated_inference_port_exposure_present: false },
  performance: {
    tokens_per_second_and_ttft_measured_at_realistic_context: true,
    offload_layers_and_parallelism_tuned: true,
    vram_overcommit_present: false },
  operations: { health_endpoint_present: true,
                structured_logs_present: true,
                model_catalog_pinned: true,
                disk_space_for_weights_monitored: true,
                upgrade_path_backup_swap_verify_rollback_present: true },
  fallback: {
    fallback_chain_declared_local_primary_secondary_provider: true,
    model_swaps_behind_stable_openai_compatible_api: true,
    each_failover_tested_deliberately_including_primary_failure: true },
  evaluation: { golden_task_suite_run_per_model_change: true,
                quality_and_speed_recorded_before_promotion: true,
                silent_model_swaps_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "LOCAL_LLM_SERVING_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 32);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.models_count, 3);
  assert.deepEqual(v.models_without_budget_documentation, []);
  assert.equal(v.budget_coverage, "1.000000");
  assert.deepEqual(v.models_without_pinned_version_and_checksum, []);
  assert.deepEqual(v.models_without_vetted_license, []);
  assert.deepEqual(v.models_without_performance_measurement, []);
  assert.equal(v.performance_coverage, "1.000000");
  assert.deepEqual(v.models_without_golden_task_eval, []);
  assert.equal(v.golden_eval_coverage, "1.000000");
});

test("test_no_kv_headroom_fails_workload_section", () => {
  const m = clone(COMPLETE) as any;
  m.workload.kv_cache_growth_accounted_and_headroom_left = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_LLM_SERVING_NOT_SOUND");
  assert.equal(v.sections["workload_and_memory_budget"], "fail");
  assert.equal(checkStatus(v, "kv_cache_growth_accounted_and_headroom_left"), "fail");
});

test("test_default_quantization_fails", () => {
  const m = clone(COMPLETE) as any;
  m.workload.quantization_chosen_deliberately_with_tradeoffs = false;
  assert.equal(evaluate(m).verdict, "LOCAL_LLM_SERVING_NOT_SOUND");
});

test("test_model_without_budget_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.models[0].vram_ram_and_context_budget_documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_LLM_SERVING_NOT_SOUND");
  assert.equal(checkStatus(v, "every_model_vram_ram_and_context_budget_documented"), "fail");
  assert.deepEqual(v.models_without_budget_documentation, ["router-7b"]);
  assert.equal(v.budget_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_model_missing_budget_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.models[1].vram_ram_and_context_budget_documented;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_model_vram_ram_and_context_budget_documented"), "missing");
  assert.deepEqual(v.models_without_budget_documentation, []);
});

test("test_unpinned_model_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.models[2].version_pinned_and_checksum_recorded = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_model_version_pinned_and_checksum_recorded"), "fail");
  assert.deepEqual(v.models_without_pinned_version_and_checksum, ["summary-3b"]);
});

test("test_unvetted_license_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.models[1].license_vetted_for_commercial_use = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_LLM_SERVING_NOT_SOUND");
  assert.equal(v.sections["model_selection_and_provenance"], "fail");
  assert.equal(checkStatus(v, "every_model_license_vetted_for_commercial_use"), "fail");
  assert.deepEqual(v.models_without_vetted_license, ["reasoner-14b"]);
});

test("test_model_size_not_matched_fails", () => {
  const m = clone(COMPLETE) as any;
  m.model_selection.model_size_matched_to_task = false;
  assert.equal(evaluate(m).verdict, "LOCAL_LLM_SERVING_NOT_SOUND");
});

test("test_non_loopback_binding_fails_serving_section", () => {
  const m = clone(COMPLETE) as any;
  m.serving.bound_to_loopback_only_verified = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_LLM_SERVING_NOT_SOUND");
  assert.equal(v.sections["serving_stack_and_exposure"], "fail");
});

test("test_unauthenticated_exposure_is_red_line_fail", () => {
  const m = clone(COMPLETE) as any;
  m.serving.unauthenticated_inference_port_exposure_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unauthenticated_inference_port_exposure"), "fail");
  assert.equal(v.sections["serving_stack_and_exposure"], "fail");
});

test("test_no_supervisor_auto_restart_fails", () => {
  const m = clone(COMPLETE) as any;
  m.serving.runs_daemonless_under_supervisor_with_auto_restart = false;
  assert.equal(evaluate(m).verdict, "LOCAL_LLM_SERVING_NOT_SOUND");
});

test("test_vram_overcommit_fails_performance_section", () => {
  const m = clone(COMPLETE) as any;
  m.performance.vram_overcommit_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_vram_overcommit"), "fail");
  assert.equal(v.sections["performance_and_operations"], "fail");
});

test("test_model_without_performance_measurement_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.models[0].performance_measured_at_realistic_context = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_model_performance_measured_at_realistic_context"), "fail");
  assert.deepEqual(v.models_without_performance_measurement, ["router-7b"]);
  assert.equal(v.performance_coverage, "0.666667");
});

test("test_no_health_endpoint_fails", () => {
  const m = clone(COMPLETE) as any;
  m.operations.health_endpoint_present = false;
  assert.equal(evaluate(m).verdict, "LOCAL_LLM_SERVING_NOT_SOUND");
});

test("test_no_rollback_path_fails", () => {
  const m = clone(COMPLETE) as any;
  m.operations.upgrade_path_backup_swap_verify_rollback_present = false;
  assert.equal(evaluate(m).verdict, "LOCAL_LLM_SERVING_NOT_SOUND");
});

test("test_empty_models_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.models = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "models_declared"), "fail");
  assert.equal(v.models_count, 0);
  assert.equal(v.budget_coverage, null);
  assert.equal(v.performance_coverage, null);
  assert.equal(v.golden_eval_coverage, null);
});

test("test_untested_fallback_chain_fails", () => {
  const m = clone(COMPLETE) as any;
  m.fallback.each_failover_tested_deliberately_including_primary_failure = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "fallback_chain_tested_by_failing_primary_deliberately"), "fail");
  assert.equal(v.sections["fallback_chains_and_evaluation"], "fail");
});

test("test_silent_model_swaps_is_red_line_fail", () => {
  const m = clone(COMPLETE) as any;
  m.evaluation.silent_model_swaps_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_silent_model_swaps"), "fail");
  assert.equal(v.sections["fallback_chains_and_evaluation"], "fail");
});

test("test_model_without_golden_eval_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.models[2].golden_task_eval_recorded = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_model_golden_task_eval_recorded"), "fail");
  assert.deepEqual(v.models_without_golden_task_eval, ["summary-3b"]);
  assert.equal(v.golden_eval_coverage, "0.666667");
});

test("test_model_missing_golden_eval_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.models[2].golden_task_eval_recorded;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_model_golden_task_eval_recorded"), "missing");
  assert.deepEqual(v.models_without_golden_task_eval, []);
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.workload;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["workload_and_memory_budget"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.models_count, null);
  assert.equal(v.models_without_budget_documentation, null);
  assert.equal(v.budget_coverage, null);
  assert.equal(v.models_without_pinned_version_and_checksum, null);
  assert.equal(v.models_without_vetted_license, null);
  assert.equal(v.models_without_performance_measurement, null);
  assert.equal(v.performance_coverage, null);
  assert.equal(v.models_without_golden_task_eval, null);
  assert.equal(v.golden_eval_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: LOCAL_LLM_SERVING_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.setup = 12345;
  assert.throws(() => evaluate(m), fieldError("setup"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ workload: "should-be-an-object" }), fieldError("workload"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ models: { name: "router-7b" } }), fieldError("models"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ models: ["router-7b"] }), fieldError("models[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.workload.tasks_defined = "yes";
  assert.throws(() => evaluate(m), fieldError("workload.tasks_defined"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.models[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("models[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.models[1].golden_task_eval_recorded = "yes";
  assert.throws(() => evaluate(m), fieldError("models[1].golden_task_eval_recorded"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.serving = null;
  assert.throws(() => evaluate(m), fieldError("serving"));
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
  .filter((f) => f.startsWith("local-llm-serving-setup--") && f.endsWith(".json"))
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
