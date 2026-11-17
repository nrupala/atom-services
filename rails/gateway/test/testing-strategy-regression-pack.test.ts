import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/testing-strategy-regression-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  plan_title: "checkout-service-testing-strategy",
  scoping: { scope_declared: true, risks_identified_before_planning: true,
             p0_flows_identified: true, test_plan_document_present: true,
             test_plan_states_exclusions: true },
  risk_rows: [
    { risk_id: "risk-1", description: "Payment journey breaks", is_p0: true },
    { risk_id: "risk-2", description: "Cart totals miscalculated", is_p0: false },
    { risk_id: "risk-3", description: "Session expiry mishandled", is_p0: false },
  ],
  level_planning: { pyramid_applied: true, logic_tested_at_unit_level: true,
                    boundaries_tested_at_integration_level: true,
                    critical_journeys_tested_at_e2e_level: true,
                    tricky_edge_cases_tested_at_unit_level: true },
  test_level_rows: [
    { level_row_id: "lr-1", risk_id: "risk-1", test_level: "unit" },
    { level_row_id: "lr-2", risk_id: "risk-1", test_level: "integration" },
    { level_row_id: "lr-3", risk_id: "risk-1", test_level: "e2e" },
    { level_row_id: "lr-4", risk_id: "risk-2", test_level: "unit" },
    { level_row_id: "lr-5", risk_id: "risk-2", test_level: "integration" },
    { level_row_id: "lr-6", risk_id: "risk-3", test_level: "unit" },
  ],
  regression_planning: { regression_test_written_before_defect_fix: true,
                         regression_tests_kept_permanently: true,
                         every_fixed_bug_has_regression_test: true },
  declared_changes: [
    { change_id: "ch-1", change_kind: "feature", description: "Add saved payment method" },
    { change_id: "ch-2", change_kind: "defect_fix", description: "Fix double-charge on retry" },
    { change_id: "ch-3", change_kind: "refactor", description: "Extract pricing module" },
  ],
  regression_rows: [
    { regression_id: "reg-1", change_id: "ch-1", kept_permanently: true },
    { regression_id: "reg-2", change_id: "ch-2", kept_permanently: true },
    { regression_id: "reg-3", change_id: "ch-3", kept_permanently: true },
  ],
  fixtures: { no_shared_mutable_state: true, explicit_seed_data_used: true,
              time_controlled: true, randomness_controlled: true,
              fixtures_declared_for_suites: true },
  flake_policy: { known_flakes_present: true, flakes_quarantined_immediately: true,
                  flakes_fixed_within_a_week_or_deleted_consciously: true,
                  no_quarantined_test_without_tracked_ticket: true,
                  quarantine_ticket_recorded: true },
  negative_testing: { invalid_input_tested: true, timeouts_tested: true,
                      partial_failures_tested: true, retries_tested: true,
                      sane_failure_asserted: true },
  entry_exit_and_reporting: { entry_criteria_declared: true,
                              exit_criteria_declared: true,
                              full_suite_green_before_handoff: true,
                              report_states_what_ran: true,
                              report_states_what_passed: true,
                              report_states_what_not_covered: true,
                              coverage_gaps_stated_explicitly: true },
  red_lines: { tests_depend_on_production_systems_present: false,
               tests_depend_on_live_data_present: false,
               assertion_weakened_to_fix_test_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "TESTING_STRATEGY_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 58);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.risk_rows_count, 3);
  assert.equal(v.test_level_rows_count, 6);
  assert.equal(v.declared_changes_count, 3);
  assert.equal(v.regression_rows_count, 3);
  assert.equal(v.unit_level_row_count, 3);
  assert.equal(v.integration_level_row_count, 2);
  assert.equal(v.e2e_level_row_count, 1);
  assert.deepEqual(v.duplicate_risk_ids, []);
  assert.equal(v.risk_level_coverage_ratio, "1.000000");
  assert.equal(v.p0_e2e_coverage_ratio, "1.000000");
  assert.equal(v.change_regression_coverage_ratio, "1.000000");
  assert.equal(v.defect_regression_coverage_ratio, "1.000000");
});

test("test_scope_not_declared_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.scoping.scope_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TESTING_STRATEGY_NOT_SOUND");
  assert.equal(v.sections["scope_and_risk_declaration"], "fail");
  assert.equal(checkStatus(v, "testing_strategy_scope_declared"), "fail");
});

test("test_duplicate_risk_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.risk_rows[1].risk_id = "risk-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_testing_strategy_risk_id_unique"), "fail");
  assert.deepEqual(v.duplicate_risk_ids, ["risk-1"]);
});

test("test_empty_risk_description_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.risk_rows[0].description = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_testing_strategy_risk_description_declared"), "fail");
  assert.deepEqual(v.risks_without_description, ["risk-1"]);
});

test("test_risk_missing_p0_status_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.risk_rows[0].is_p0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_testing_strategy_risk_p0_status_declared"), "missing");
  assert.deepEqual(v.risks_without_p0_status, ["risk-1"]);
});

test("test_absent_risk_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.risk_rows;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "testing_strategy_risk_rows_list_declared"), "missing");
  assert.equal(v.risk_rows_count, null);
  assert.equal(v.computed_status, null);
});

test("test_empty_level_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.test_level_rows = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "testing_strategy_test_level_rows_list_declared"), "fail");
  assert.equal(v.test_level_rows_count, 0);
});

test("test_level_row_unknown_risk_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.test_level_rows[0].risk_id = "risk-99";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_testing_strategy_test_level_row_risk_reference_resolves"), "fail");
  assert.deepEqual(v.test_level_rows_with_unknown_risk_reference, ["lr-1"]);
});

test("test_risk_without_level_row_fails", () => {
  const m = clone(COMPLETE) as any;
  m.test_level_rows = m.test_level_rows.filter((r: any) => r.risk_id !== "risk-3");
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_testing_strategy_declared_risk_covered_by_level_row"), "fail");
  assert.deepEqual(v.declared_risks_without_test_level_row, ["risk-3"]);
  assert.equal(v.risk_level_coverage_ratio, "0.666667");
});

test("test_p0_risk_without_e2e_fails", () => {
  const m = clone(COMPLETE) as any;
  m.test_level_rows[2].test_level = "unit";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_testing_strategy_p0_risk_covered_by_e2e_row"), "fail");
  assert.deepEqual(v.p0_risks_without_e2e_row, ["risk-1"]);
  assert.equal(v.p0_e2e_coverage_ratio, "0.000000");
});

test("test_invalid_level_fails", () => {
  const m = clone(COMPLETE) as any;
  m.test_level_rows[0].test_level = "manual";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_testing_strategy_test_level_row_level_recognised"), "fail");
  assert.deepEqual(v.test_level_rows_with_invalid_level, ["lr-1"]);
});

test("test_pyramid_inverted_fails", () => {
  const m = clone(COMPLETE) as any;
  const lvls = ["e2e", "e2e", "e2e", "unit", "integration", "integration"];
  m.test_level_rows.forEach((r: any, i: number) => { r.test_level = lvls[i]; });
  const v = evaluate(m);
  assert.equal(checkStatus(v, "testing_strategy_pyramid_level_counts_in_declared_order"), "fail");
});

test("test_change_without_regression_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.regression_rows = m.regression_rows.filter((r: any) => r.change_id !== "ch-2");
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_regression_pack_declared_change_covered_by_regression_row"), "fail");
  assert.deepEqual(v.declared_changes_without_regression_row, ["ch-2"]);
  assert.deepEqual(v.defect_changes_without_regression_row, ["ch-2"]);
  assert.equal(v.defect_regression_coverage_ratio, "0.000000");
  assert.equal(v.change_regression_coverage_ratio, "0.666667");
});

test("test_regression_row_unknown_change_fails", () => {
  const m = clone(COMPLETE) as any;
  m.regression_rows[0].change_id = "ch-99";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_regression_pack_regression_row_change_reference_resolves"), "fail");
  assert.deepEqual(v.regression_rows_with_unknown_change_reference, ["reg-1"]);
});

test("test_regression_row_not_permanent_fails", () => {
  const m = clone(COMPLETE) as any;
  m.regression_rows[1].kept_permanently = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_regression_pack_regression_row_kept_permanently"), "fail");
  assert.deepEqual(v.regression_rows_not_declared_permanent, ["reg-2"]);
});

test("test_change_invalid_kind_fails", () => {
  const m = clone(COMPLETE) as any;
  m.declared_changes[0].change_kind = "spike";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_regression_pack_change_kind_recognised"), "fail");
  assert.deepEqual(v.declared_changes_with_invalid_kind, ["ch-1"]);
});

test("test_duplicate_change_id_fails", () => {
  const m = clone(COMPLETE) as any;
  m.declared_changes[1].change_id = "ch-1";
  assert.deepEqual(evaluate(m).duplicate_change_ids, ["ch-1"]);
});

test("test_fixtures_shared_state_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.fixtures.no_shared_mutable_state = false;
  assert.equal(evaluate(m).sections["fixtures_and_determinism"], "fail");
});

test("test_flake_not_quarantined_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.flake_policy.flakes_quarantined_immediately = false;
  assert.equal(evaluate(m).sections["flake_policy"], "fail");
});

test("test_flakes_present_without_ticket_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.flake_policy.quarantine_ticket_recorded = false;
  assert.equal(checkStatus(evaluate(m), "testing_strategy_quarantine_ticket_recorded_where_flakes_present"), "fail");
});

test("test_no_flakes_passes_gated_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.flake_policy.known_flakes_present = false;
  m.flake_policy.quarantine_ticket_recorded = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "testing_strategy_quarantine_ticket_recorded_where_flakes_present"), "pass");
  assert.equal(v.verdict, "TESTING_STRATEGY_SOUND");
});

test("test_negative_retries_not_tested_fails_section6", () => {
  const m = clone(COMPLETE) as any;
  m.negative_testing.retries_tested = false;
  assert.equal(evaluate(m).sections["negative_testing"], "fail");
});

test("test_suite_not_green_fails_section7", () => {
  const m = clone(COMPLETE) as any;
  m.entry_exit_and_reporting.full_suite_green_before_handoff = false;
  assert.equal(evaluate(m).sections["entry_exit_and_reporting"], "fail");
});

test("test_production_dependency_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.tests_depend_on_production_systems_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "TESTING_STRATEGY_NOT_SOUND");
});

test("test_weakened_assertion_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.assertion_weakened_to_fix_test_present = true;
  assert.equal(checkStatus(evaluate(m), "testing_strategy_free_of_assertion_weakened_to_fix_test"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.negative_testing;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["negative_testing"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.risk_rows_count, null);
  assert.equal(v.risk_level_coverage_ratio, null);
});

test("test_no_p0_risks_p0_ratio_is_null_and_check_passes", () => {
  const m = clone(COMPLETE) as any;
  m.risk_rows.forEach((r: any) => { r.is_p0 = false; });
  const v = evaluate(m);
  assert.equal(v.p0_e2e_coverage_ratio, null);
  assert.equal(checkStatus(v, "every_testing_strategy_p0_risk_covered_by_e2e_row"), "pass");
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: TESTING_STRATEGY_SOUND"));
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
  m.plan_title = 12345;
  assert.throws(() => evaluate(m), fieldError("plan_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ scoping: "should-be-an-object" }), fieldError("scoping"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ risk_rows: { risk_id: "risk-1" } }), fieldError("risk_rows"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ declared_changes: ["ch-1"] }), fieldError("declared_changes[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.fixtures.time_controlled = "yes";
  assert.throws(() => evaluate(m), fieldError("fixtures.time_controlled"));
});

test("malformed: nested list entry bool field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.risk_rows[0].is_p0 = "true";
  assert.throws(() => evaluate(m), fieldError("risk_rows[0].is_p0"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.flake_policy = null;
  assert.throws(() => evaluate(m), fieldError("flake_policy"));
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
  .filter((f) => f.startsWith("testing-strategy-regression-pack--") && f.endsWith(".json"))
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
