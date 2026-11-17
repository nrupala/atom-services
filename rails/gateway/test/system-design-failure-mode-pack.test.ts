import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/system-design-failure-mode-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  design_name: "notification-system-no-duplicates",
  design_context: { requirement_stated: true, data_flow_described: true,
                    analysis_performed_before_build: true,
                    component_boundaries_clear: true,
                    single_responsibility_per_component_declared: true,
                    loose_coupling_declared: true,
                    layer_failure_independence_declared: true },
  components: [
    { component_id: "comp-1", responsibility: "Accept send requests",
      contract_declared: true },
    { component_id: "comp-2", responsibility: "Deliver notifications",
      contract_declared: true },
  ],
  failure_modes: [
    { failure_id: "fm-1", component_id: "comp-1",
      failure_mode: "Duplicate request accepted on retry",
      effect: "Duplicate notification sent", severity: 8, occurrence: 3,
      detection: 4, rpn_declared: 96, mitigation_id: "mit-1" },
    { failure_id: "fm-2", component_id: "comp-2",
      failure_mode: "Delivery worker crashes mid-send",
      effect: "Notification lost", severity: 9, occurrence: 2,
      detection: 5, rpn_declared: 90, mitigation_id: "mit-2" },
  ],
  mitigations: [
    { mitigation_id: "mit-1", description: "Idempotency key per request",
      residual_risk_stated: true },
    { mitigation_id: "mit-2", description: "At-least-once queue with dead letters",
      residual_risk_stated: true },
  ],
  mitigation_work: { mitigations_considered_before_build: true,
                     residual_risk_acceptance_stated: true },
  state_and_reliability: {
    source_of_truth_identified: true,
    distributed_state_minimized_declared: true,
    idempotency_for_retryable_operations_declared: true,
    cap_tradeoffs_stated_explicitly: true, timeouts_declared: true,
    retries_with_jitter_declared: true, circuit_breakers_declared: true,
    graceful_degradation_declared: true,
    readiness_vs_liveness_distinguished: true,
    slow_unreliable_work_behind_queue_declared: true },
  queues: { queues_used: true,
            at_least_once_delivery_with_idempotent_consumers_declared: true,
            queue_backpressure_declared: true,
            dead_letter_handling_declared: true },
  observability_scaling_security: {
    structured_logs_declared: true, metrics_declared: true,
    traces_declared: true, bottleneck_identified_before_scaling: true,
    measure_before_scaling_declared: true,
    stateless_horizontal_scaling_where_scaled_declared: true,
    zero_trust_boundaries_declared: true, least_privilege_declared: true,
    secrets_management_declared: true, external_trust_boundary_stated: true },
  caching: { caching_used: true, cache_invalidation_stated: true },
  red_lines: { distributed_monolith_present: false,
               shared_mutable_state_present: false,
               retries_without_idempotency_or_backpressure_present: false,
               design_without_observability_present: false,
               premature_microservices_present: false,
               strong_consistency_assumed_without_tradeoff_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "FAILURE_MODE_PACK_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 56);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.failure_mode_components_count, 2);
  assert.equal(v.failure_modes_count, 2);
  assert.equal(v.failure_mode_mitigations_count, 2);
  assert.deepEqual(v.duplicate_failure_mode_component_ids, []);
  assert.deepEqual(v.duplicate_failure_mode_ids, []);
  assert.deepEqual(v.duplicate_failure_mode_mitigation_ids, []);
  assert.equal(v.component_contract_ratio, "1.000000");
  assert.equal(v.component_failure_coverage_ratio, "1.000000");
  assert.equal(v.rpn_recompute_ratio, "1.000000");
  assert.equal(v.mitigation_resolution_ratio, "1.000000");
});

test("test_requirement_not_stated_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.design_context.requirement_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FAILURE_MODE_PACK_NOT_SOUND");
  assert.equal(v.sections["design_framing_and_boundaries"], "fail");
  assert.equal(checkStatus(v, "failure_mode_pack_requirement_stated"), "fail");
});

test("test_duplicate_component_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.components[1].component_id = "comp-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_failure_mode_pack_component_id_unique"), "fail");
  assert.deepEqual(v.duplicate_failure_mode_component_ids, ["comp-1"]);
});

test("test_empty_responsibility_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.components[0].responsibility = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_failure_mode_pack_component_responsibility_declared"), "fail");
  assert.deepEqual(v.failure_mode_components_without_responsibility, ["comp-1"]);
});

test("test_component_without_contract_fails", () => {
  const m = clone(COMPLETE) as any;
  m.components[1].contract_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_failure_mode_pack_component_contract_declared"), "fail");
  assert.deepEqual(v.failure_mode_components_without_contract, ["comp-2"]);
  assert.equal(v.component_contract_ratio, "0.500000");
});

test("test_absent_components_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.components;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "failure_mode_pack_components_list_declared"), "missing");
  assert.equal(v.failure_mode_components_count, null);
  assert.equal(v.computed_status, null);
});

test("test_empty_failure_modes_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "failure_mode_pack_failure_modes_list_declared"), "fail");
  assert.equal(v.failure_modes_count, 0);
});

test("test_failure_with_unknown_component_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[0].component_id = "comp-99";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_failure_mode_pack_failure_component_referenced"), "fail");
  assert.deepEqual(v.failure_modes_with_unknown_component_reference, ["fm-1"]);
});

test("test_component_without_failure_mode_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[1].component_id = "comp-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_failure_mode_pack_component_covered_by_failure_mode"), "fail");
  assert.deepEqual(v.failure_mode_components_without_failure_mode, ["comp-2"]);
  assert.equal(v.component_failure_coverage_ratio, "0.500000");
});

test("test_rpn_mismatch_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[0].rpn_declared = 95;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_failure_mode_pack_failure_rpn_recomputes"), "fail");
  assert.deepEqual(v.failure_modes_with_rpn_mismatch, ["fm-1"]);
  assert.equal(v.rpn_recompute_ratio, "0.500000");
});

test("test_nonpositive_rating_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[0].severity = 0;
  m.failure_modes[0].rpn_declared = 0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_failure_mode_pack_failure_ratings_positive"), "fail");
  assert.deepEqual(v.failure_modes_with_nonpositive_rating, ["fm-1"]);
});

test("test_failure_missing_severity_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.failure_modes[0].severity;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_failure_mode_pack_failure_ratings_positive"), "missing");
});

test("test_empty_effect_fails", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[1].effect = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_failure_mode_pack_failure_effect_declared"), "fail");
  assert.deepEqual(v.failure_modes_without_effect, ["fm-2"]);
});

test("test_unknown_mitigation_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[0].mitigation_id = "mit-99";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_failure_mode_pack_failure_mitigation_referenced"), "fail");
  assert.deepEqual(v.failure_modes_with_unknown_mitigation_reference, ["fm-1"]);
  assert.equal(v.mitigation_resolution_ratio, "0.500000");
});

test("test_mitigation_without_residual_risk_fails", () => {
  const m = clone(COMPLETE) as any;
  m.mitigations[1].residual_risk_stated = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_failure_mode_pack_mitigation_residual_risk_stated"), "fail");
  assert.deepEqual(v.failure_mode_mitigations_without_residual_risk, ["mit-2"]);
});

test("test_timeouts_not_declared_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.state_and_reliability.timeouts_declared = false;
  assert.equal(evaluate(m).sections["state_reliability_and_queues"], "fail");
});

test("test_queue_without_backpressure_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.queues.queue_backpressure_declared = false;
  assert.equal(checkStatus(evaluate(m), "failure_mode_pack_queue_backpressure_declared_where_queues_used"), "fail");
});

test("test_no_queues_passes_queue_gates_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.queues.queues_used = false;
  m.queues.queue_backpressure_declared = false;
  m.queues.dead_letter_handling_declared = false;
  m.queues.at_least_once_delivery_with_idempotent_consumers_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "failure_mode_pack_queue_backpressure_declared_where_queues_used"), "pass");
  assert.equal(v.verdict, "FAILURE_MODE_PACK_SOUND");
});

test("test_cache_without_invalidation_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.caching.cache_invalidation_stated = false;
  assert.equal(checkStatus(evaluate(m), "failure_mode_pack_cache_invalidation_stated_where_caching_used"), "fail");
});

test("test_no_caching_passes_cache_gate_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.caching.caching_used = false;
  m.caching.cache_invalidation_stated = false;
  assert.equal(checkStatus(evaluate(m), "failure_mode_pack_cache_invalidation_stated_where_caching_used"), "pass");
});

test("test_distributed_monolith_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.distributed_monolith_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "FAILURE_MODE_PACK_NOT_SOUND");
});

test("test_shared_mutable_state_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.shared_mutable_state_present = true;
  assert.equal(checkStatus(evaluate(m), "failure_mode_pack_free_of_shared_mutable_state"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.state_and_reliability;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["state_reliability_and_queues"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.failure_modes_count, null);
  assert.equal(v.rpn_recompute_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: FAILURE_MODE_PACK_SOUND"));
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
  m.design_name = 12345;
  assert.throws(() => evaluate(m), fieldError("design_name"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ design_context: "should-be-an-object" }), fieldError("design_context"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ components: { component_id: "comp-1" } }), fieldError("components"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ failure_modes: ["fm-1"] }), fieldError("failure_modes[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.state_and_reliability.timeouts_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("state_and_reliability.timeouts_declared"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[0].severity = "high";
  assert.throws(() => evaluate(m), fieldError("failure_modes[0].severity"));
});

test("malformed: number leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.failure_modes[0].occurrence = true;
  assert.throws(() => evaluate(m), fieldError("failure_modes[0].occurrence"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.queues = null;
  assert.throws(() => evaluate(m), fieldError("queues"));
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
  .filter((f) => f.startsWith("system-design-failure-mode-pack--") && f.endsWith(".json"))
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
