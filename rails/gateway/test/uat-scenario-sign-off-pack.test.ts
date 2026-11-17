import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/uat-scenario-sign-off-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  uat_round_title: "checkout-release-uat-round-3",
  scope: { criteria_source_recorded: true,
           scope_defined_before_execution: true,
           no_silent_scope_edits_during_uat: true },
  acceptance_criteria: [
    { criterion_id: "crit-1", description: "Buyer can check out end to end" },
    { criterion_id: "crit-2", description: "Buyer receives an order confirmation" },
  ],
  scenarios: [
    { scenario_id: "scen-1", criterion_ids: ["crit-1"],
      steps_recorded: true, expected_outcome: "Checkout completes",
      timeboxed: true, result: "passed" },
    { scenario_id: "scen-2", criterion_ids: ["crit-1", "crit-2"],
      steps_recorded: true, expected_outcome: "Confirmation is received",
      timeboxed: true, result: "passed" },
  ],
  environment: { staging_mirrors_production: true, test_data_realistic: true,
                 production_data_used: true, test_data_anonymized: true },
  people: { business_owner_owns_uat: true, business_owner_executes_uat: true,
            supporting_team_assigned: true, scribe_assigned: true },
  execution: { execution_window_completed: true,
               deviations_logged_as_defects: true },
  defects: [
    { defect_id: "def-1", scenario_id: "scen-2", severity: "minor",
      disposition: "accept_with_note",
      disposition_note: "Accepted: confirmation wording noted",
      defer_until: "", resolved: true },
    { defect_id: "def-2", scenario_id: "scen-1", severity: "blocker",
      disposition: "fix_now", disposition_note: "",
      defer_until: "", resolved: true },
  ],
  triage: { triage_held_daily: true },
  required_sign_off_roles: ["business_owner", "product_owner"],
  sign_offs: [
    { role: "business_owner", signer_name: "A. Buyer", signed: true },
    { role: "product_owner", signer_name: "P. Owner", signed: true },
  ],
  sign_off: { outcome: "pass", conditional_open_items_listed: false,
              conditional_owner_named: false },
  retest: { uat_fixes_made: true, changed_scenarios_retested: true,
            touched_flows_regression_completed: true,
            retest_results_recorded: true },
  declared_totals: { acceptance_criteria_count: 2, scenarios_count: 2,
                     executed_scenarios_count: 2, defects_count: 2,
                     sign_off_roles_count: 2 },
  red_lines: { production_data_used_without_anonymization_present: false,
               passed_while_blocker_defects_open_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "UAT_SIGN_OFF_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 56);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.uat_acceptance_criteria_count, 2);
  assert.equal(v.uat_scenarios_count, 2);
  assert.equal(v.uat_executed_scenarios_count, 2);
  assert.equal(v.uat_defects_count, 2);
  assert.equal(v.uat_required_sign_off_roles_count, 2);
  assert.equal(v.uat_criterion_coverage_ratio, "1.000000");
  assert.equal(v.uat_scenario_execution_ratio, "1.000000");
  assert.equal(v.uat_scenario_pass_ratio, "1.000000");
  assert.equal(v.uat_defect_disposition_ratio, "1.000000");
  assert.equal(v.uat_sign_off_completion_ratio, "1.000000");
  assert.deepEqual(v.uat_open_blocker_defect_ids, []);
});

test("test_uncovered_criterion_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[1].criterion_ids = ["crit-1"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_uat_acceptance_criterion_covered_by_scenario"), "fail");
  assert.deepEqual(v.uat_criteria_not_covered_by_any_scenario, ["crit-2"]);
  assert.equal(v.uat_criterion_coverage_ratio, "0.500000");
});

test("test_duplicate_scenario_id_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[1].scenario_id = "scen-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_uat_scenario_id_unique"), "fail");
  assert.deepEqual(v.duplicate_uat_scenario_ids, ["scen-1"]);
});

test("test_scenario_unknown_criterion_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[0].criterion_ids = ["crit-99"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_uat_scenario_criterion_reference_declared_criterion"), "fail");
  assert.deepEqual(v.uat_scenarios_with_unknown_criterion_reference, ["scen-1"]);
});

test("test_absent_criteria_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.acceptance_criteria;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "uat_acceptance_criteria_list_declared"), "missing");
  assert.equal(v.uat_acceptance_criteria_count, null);
  assert.equal(v.computed_status, null);
});

test("test_empty_criteria_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.acceptance_criteria = [];
  assert.equal(checkStatus(evaluate(m), "uat_acceptance_criteria_list_declared"), "fail");
});

test("test_declared_count_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.declared_totals.scenarios_count = 5;
  assert.equal(checkStatus(evaluate(m), "uat_declared_scenarios_count_matches_rows"), "fail");
});

test("test_production_data_without_anonymization_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.environment.test_data_anonymized = false;
  assert.equal(checkStatus(evaluate(m), "uat_production_data_anonymized_where_production_data_used"), "fail");
});

test("test_no_production_data_passes_gated_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.environment.production_data_used = false;
  m.environment.test_data_anonymized = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "uat_production_data_anonymized_where_production_data_used"), "pass");
  assert.equal(v.verdict, "UAT_SIGN_OFF_SOUND");
});

test("test_scenario_not_run_fails_execution", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[1].result = "not_run";
  m.declared_totals.executed_scenarios_count = 1;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_uat_scenario_result_recorded_as_executed"), "fail");
  assert.deepEqual(v.uat_scenarios_not_executed, ["scen-2"]);
  assert.equal(v.uat_scenario_execution_ratio, "0.500000");
});

test("test_scenario_invalid_result_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[0].result = "mostly_ok";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_uat_scenario_result_recognised"), "fail");
  assert.deepEqual(v.uat_scenarios_with_invalid_result, ["scen-1"]);
});

test("test_failed_scenario_without_defect_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[0].result = "failed";
  m.defects = m.defects.filter((d: any) => d.scenario_id !== "scen-1");
  m.declared_totals.defects_count = 1;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_uat_failed_or_blocked_scenario_has_defect_record"), "fail");
  assert.deepEqual(v.uat_failed_or_blocked_scenarios_without_defect, ["scen-1"]);
});

test("test_empty_defects_list_passes_when_no_failures", () => {
  const m = clone(COMPLETE) as any;
  m.defects = [];
  m.declared_totals.defects_count = 0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "uat_defects_list_declared"), "pass");
  assert.equal(v.verdict, "UAT_SIGN_OFF_SOUND");
  assert.equal(v.uat_defect_disposition_ratio, null);
});

test("test_defect_invalid_disposition_fails", () => {
  const m = clone(COMPLETE) as any;
  m.defects[0].disposition = "ignore";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_uat_defect_disposition_recognised"), "fail");
  assert.deepEqual(v.uat_defects_with_invalid_disposition, ["def-1"]);
});

test("test_accepted_defect_without_note_fails", () => {
  const m = clone(COMPLETE) as any;
  m.defects[0].disposition_note = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_uat_accepted_defect_disposition_note_declared"), "fail");
  assert.deepEqual(v.uat_accepted_defects_without_note, ["def-1"]);
});

test("test_deferred_defect_without_date_fails", () => {
  const m = clone(COMPLETE) as any;
  m.defects[0].disposition = "defer_with_date";
  m.defects[0].defer_until = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_uat_deferred_defect_disposition_date_declared"), "fail");
  assert.deepEqual(v.uat_deferred_defects_without_date, ["def-1"]);
});

test("test_defect_unknown_scenario_fails", () => {
  const m = clone(COMPLETE) as any;
  m.defects[0].scenario_id = "scen-99";
  assert.equal(checkStatus(evaluate(m), "every_uat_defect_scenario_reference_declared_scenario"), "fail");
});

test("test_unsigned_required_role_fails_sign_off", () => {
  const m = clone(COMPLETE) as any;
  m.sign_offs[1].signed = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_uat_required_role_signed_off"), "fail");
  assert.deepEqual(v.uat_required_roles_without_signed_sign_off, ["product_owner"]);
  assert.equal(v.uat_sign_off_completion_ratio, "0.500000");
});

test("test_sign_off_unknown_role_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sign_offs[0].role = "observer";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_uat_sign_off_role_declared_required"), "fail");
  assert.deepEqual(v.uat_sign_offs_with_unknown_role, ["observer"]);
});

test("test_invalid_sign_off_outcome_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sign_off.outcome = "verbal_ok";
  assert.equal(checkStatus(evaluate(m), "uat_sign_off_outcome_recognised"), "fail");
});

test("test_conditional_pass_without_open_items_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sign_off.outcome = "conditional_pass";
  m.sign_off.conditional_open_items_listed = false;
  m.sign_off.conditional_owner_named = true;
  assert.equal(checkStatus(evaluate(m), "uat_conditional_sign_off_open_items_listed_where_conditional"), "fail");
});

test("test_conditional_pass_complete_is_sound", () => {
  const m = clone(COMPLETE) as any;
  m.sign_off.outcome = "conditional_pass";
  m.sign_off.conditional_open_items_listed = true;
  m.sign_off.conditional_owner_named = true;
  assert.equal(evaluate(m).verdict, "UAT_SIGN_OFF_SOUND");
});

test("test_pass_while_blocker_open_fails_computed", () => {
  const m = clone(COMPLETE) as any;
  m.defects[1].resolved = false;
  m.defects[1].disposition = "accept_with_note";
  m.defects[1].disposition_note = "Noted";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "uat_sign_off_not_pass_while_blocker_defect_open"), "fail");
  assert.deepEqual(v.uat_open_blocker_defect_ids, ["def-2"]);
});

test("test_fix_now_unresolved_fails_retest_section", () => {
  const m = clone(COMPLETE) as any;
  m.defects[1].resolved = false;
  m.sign_off.outcome = "conditional_pass";
  m.sign_off.conditional_open_items_listed = true;
  m.sign_off.conditional_owner_named = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_uat_fix_now_defect_marked_resolved"), "fail");
  assert.deepEqual(v.uat_fix_now_defects_unresolved, ["def-2"]);
});

test("test_no_fixes_passes_retest_gates_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.retest.uat_fixes_made = false;
  m.retest.changed_scenarios_retested = false;
  m.retest.touched_flows_regression_completed = false;
  m.retest.retest_results_recorded = false;
  m.defects = [];
  m.declared_totals.defects_count = 0;
  assert.equal(evaluate(m).sections["retest_and_regression_after_fixes"], "pass");
});

test("test_fixes_without_regression_fails", () => {
  const m = clone(COMPLETE) as any;
  m.retest.touched_flows_regression_completed = false;
  assert.equal(checkStatus(evaluate(m), "uat_touched_flows_regression_completed_where_fixes_made"), "fail");
});

test("test_red_line_production_data_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.production_data_used_without_anonymization_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "UAT_SIGN_OFF_NOT_SOUND");
});

test("test_red_line_passed_with_blockers_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.passed_while_blocker_defects_open_present = true;
  assert.equal(checkStatus(evaluate(m), "uat_free_of_passed_while_blockers_open"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.sign_offs;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["sign_off_record"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.uat_scenarios_count, null);
  assert.equal(v.uat_criterion_coverage_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: UAT_SIGN_OFF_SOUND"));
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
  m.uat_round_title = 12345;
  assert.throws(() => evaluate(m), fieldError("uat_round_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ scope: "should-be-an-object" }), fieldError("scope"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ scenarios: { scenario_id: "scen-1" } }), fieldError("scenarios"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ defects: ["def-1"] }), fieldError("defects[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.people.scribe_assigned = "yes";
  assert.throws(() => evaluate(m), fieldError("people.scribe_assigned"));
});

test("malformed: string list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.scenarios[0].criterion_ids = [42];
  assert.throws(() => evaluate(m), fieldError("scenarios[0].criterion_ids[0]"));
});

test("malformed: number field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.declared_totals.defects_count = "2";
  assert.throws(() => evaluate(m), fieldError("declared_totals.defects_count"));
});

test("malformed: number field as bool rejected", () => {
  const m = clone(COMPLETE) as any;
  m.declared_totals.defects_count = true;
  assert.throws(() => evaluate(m), fieldError("declared_totals.defects_count"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sign_off = null;
  assert.throws(() => evaluate(m), fieldError("sign_off"));
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
  .filter((f) => f.startsWith("uat-scenario-sign-off-pack--") && f.endsWith(".json"))
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
