import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/budget-design-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The BUDGET_DESIGN_SOUND manifest, copied from the Python tests.
const COMPLETE: Record<string, unknown> = {
  budget: "FY2027 operating budget — small company",
  scope: {
    budget_type: "operating",
    entity_named: true,
    currency_stated: true,
    governs_stated: true,
    exclusions_stated: true,
  },
  lines: [
    {
      name: "Engineering headcount", owner: "Priya",
      approach: "zero_based", driver_documented: true,
      driver_quantity: 10, driver_unit_cost: 12000, amount: 120000,
    },
    {
      name: "Cloud usage", owner: "Sam",
      approach: "incremental", driver_documented: true,
      driver_quantity: 5000, driver_unit_cost: 4, amount: 20000,
    },
    {
      name: "Contingency", owner: "Priya",
      approach: "zero_based", driver_documented: true,
      driver_quantity: 1, driver_unit_cost: 10000, amount: 10000,
    },
  ],
  totals: { declared_total: 150000, expected_income: 200000 },
  revenue: { linked_to_forecast: true },
  contingency: {
    explicit_line_present: true,
    sized_to_identified_risks: true,
    hidden_padding_present: false,
  },
  approval: {
    baseline_approved_and_locked: true,
    approval_thresholds_documented: true,
    revisions_reapproved: true,
  },
  monitoring: {
    monthly_variance_process_running: true,
    variance_thresholds_trigger_explanations: true,
    variance_actions_tracked: true,
    rolling_forecast_cadence_set: true,
    rolling_horizon_months: 12,
  },
  close: {
    annual_true_up_done: true,
    carry_over_rules_decided: true,
    lessons_carried_to_next_cycle: true,
    silent_reallocations_made: false,
    actuals_edited_without_annotation: false,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "BUDGET_DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 29);
  assert.equal(v.lines_evaluated, 3);
  assert.deepEqual(v.ownerless_line_indexes, []);
  assert.equal(v.computed_total, "150000.00");
  assert.equal(v.total_difference, "0.00");
});

test("test_capital_and_personal_types_pass", () => {
  for (const kind of ["capital", "personal"]) {
    const m = clone(COMPLETE) as any;
    m.scope.budget_type = kind;
    assert.equal(evaluate(m).verdict, "BUDGET_DESIGN_SOUND");
  }
});

test("test_unstated_budget_type_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scope.budget_type = "project";
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "budget_type_is_stated_kind"), "fail");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_missing_budget_type_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.scope.budget_type;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "budget_type_is_stated_kind"), "missing");
});

test("test_currency_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scope.currency_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(v.sections["scope"], "fail");
});

test("test_exclusions_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scope.exclusions_stated = false;
  assert.equal(evaluate(m).verdict, "BUDGET_DESIGN_NOT_SOUND");
});

test("test_empty_lines_fail", () => {
  const m = clone(COMPLETE) as any;
  m.lines = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "lines_present"), "fail");
  assert.equal(v.lines_evaluated, 0);
  assert.deepEqual(v.ownerless_line_indexes, []);
  assert.equal(v.computed_total, null);
});

test("test_absent_lines_are_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.lines;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "lines_present"), "missing");
  assert.equal(v.lines_evaluated, null);
  assert.equal(v.ownerless_line_indexes, null);
});

test("test_line_without_owner_fails", () => {
  const m = clone(COMPLETE) as any;
  m.lines[1].owner = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "every_line_has_named_owner"), "fail");
  assert.deepEqual(v.ownerless_line_indexes, [1]);
});

test("test_line_owner_key_absent_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.lines[0].owner;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_line_has_named_owner"), "missing");
  assert.deepEqual(v.ownerless_line_indexes, [0]);
});

test("test_unstated_approach_fails", () => {
  const m = clone(COMPLETE) as any;
  m.lines[0].approach = "flat_percentage";
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(
    checkStatus(v, "every_line_approach_is_stated_kind"), "fail");
});

test("test_approach_key_absent_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.lines[2].approach;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "every_line_approach_is_stated_kind"), "missing");
});

test("test_driver_not_documented_fails", () => {
  const m = clone(COMPLETE) as any;
  m.lines[1].driver_documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(
    checkStatus(v, "drivers_documented_for_every_line"), "fail");
});

test("test_amount_disagreeing_with_driver_product_fails", () => {
  const m = clone(COMPLETE) as any;
  m.lines[0].amount = 100000;
  m.totals.declared_total = 130000;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(
    checkStatus(v, "line_amounts_match_driver_products"), "fail");
  assert.equal(
    checkStatus(v, "declared_total_matches_line_sum"), "pass");
});

test("test_missing_driver_number_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.lines[0].driver_unit_cost;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "line_amounts_match_driver_products"), "missing");
});

test("test_declared_total_disagreeing_with_sum_fails", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_total = 140000;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(
    checkStatus(v, "declared_total_matches_line_sum"), "fail");
  assert.equal(v.computed_total, "150000.00");
  assert.equal(v.total_difference, "-10000.00");
});

test("test_missing_declared_total_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.totals.declared_total;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "declared_total_matches_line_sum"), "missing");
  assert.equal(v.computed_total, "150000.00");
  assert.equal(v.total_difference, null);
});

test("test_total_above_expected_income_fails_balance", () => {
  const m = clone(COMPLETE) as any;
  m.totals.expected_income = 100000;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(
    checkStatus(v, "budget_balances_against_expected_income"), "fail");
});

test("test_total_equal_to_expected_income_passes_balance", () => {
  const m = clone(COMPLETE) as any;
  m.totals.expected_income = 150000;
  assert.equal(evaluate(m).verdict, "BUDGET_DESIGN_SOUND");
});

test("test_revenue_not_linked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.revenue.linked_to_forecast = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(v.sections["revenue_and_contingency"], "fail");
});

test("test_hidden_padding_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.contingency.hidden_padding_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "no_hidden_padding"), "fail");
});

test("test_contingency_not_explicit_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contingency.explicit_line_present = false;
  assert.equal(evaluate(m).verdict, "BUDGET_DESIGN_NOT_SOUND");
});

test("test_contingency_not_sized_to_risks_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contingency.sized_to_identified_risks = false;
  assert.equal(evaluate(m).verdict, "BUDGET_DESIGN_NOT_SOUND");
});

test("test_baseline_not_locked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.approval.baseline_approved_and_locked = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(v.sections["approval_and_baseline"], "fail");
});

test("test_thresholds_not_documented_fails", () => {
  const m = clone(COMPLETE) as any;
  m.approval.approval_thresholds_documented = false;
  assert.equal(evaluate(m).verdict, "BUDGET_DESIGN_NOT_SOUND");
});

test("test_revisions_drifted_fail", () => {
  const m = clone(COMPLETE) as any;
  m.approval.revisions_reapproved = false;
  assert.equal(evaluate(m).verdict, "BUDGET_DESIGN_NOT_SOUND");
});

test("test_monthly_variance_not_running_fails", () => {
  const m = clone(COMPLETE) as any;
  m.monitoring.monthly_variance_process_running = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(v.sections["monitoring_and_close"], "fail");
});

test("test_rolling_horizon_not_twelve_fails", () => {
  const m = clone(COMPLETE) as any;
  m.monitoring.rolling_horizon_months = 6;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(
    checkStatus(v, "rolling_forecast_covers_twelve_months"), "fail");
});

test("test_missing_rolling_horizon_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.monitoring.rolling_horizon_months;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "rolling_forecast_covers_twelve_months"), "missing");
  assert.equal(v.computed_status, null);
});

test("test_silent_reallocations_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.close.silent_reallocations_made = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "no_silent_reallocations"), "fail");
});

test("test_unannotated_actual_edits_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.close.actuals_edited_without_annotation = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "no_unannotated_actual_edits"), "fail");
});

test("test_lessons_not_carried_fail", () => {
  const m = clone(COMPLETE) as any;
  m.close.lessons_carried_to_next_cycle = false;
  assert.equal(evaluate(m).verdict, "BUDGET_DESIGN_NOT_SOUND");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.approval;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["approval_and_baseline"],
    "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.lines_evaluated, null);
  assert.equal(v.ownerless_line_indexes, null);
  assert.equal(v.computed_total, null);
  assert.equal(v.total_difference, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: BUDGET_DESIGN_SOUND"));
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
  m.budget = 2027;
  assert.throws(() => evaluate(m), fieldError("budget"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ scope: "should-be-an-object" }),
    fieldError("scope"),
  );
});

test("malformed: lines as object rejected", () => {
  const m = clone(COMPLETE) as any;
  m.lines = { name: "not-a-list" };
  assert.throws(() => evaluate(m), fieldError("lines"));
});

test("malformed: line entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.lines = ["not-an-object"];
  assert.throws(() => evaluate(m), fieldError("lines[0]"));
});

test("malformed: line string leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.lines[0].owner = 42;
  assert.throws(() => evaluate(m), fieldError("lines[0].owner"));
});

test("malformed: line numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.lines[1].amount = "20000";
  assert.throws(() => evaluate(m), fieldError("lines[1].amount"));
});

test("malformed: line numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.lines[0].driver_quantity = true;
  assert.throws(
    () => evaluate(m), fieldError("lines[0].driver_quantity"));
});

test("malformed: line boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.lines[0].driver_documented = "yes";
  assert.throws(
    () => evaluate(m), fieldError("lines[0].driver_documented"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.scope.entity_named = "yes";
  assert.throws(() => evaluate(m), fieldError("scope.entity_named"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_total = "150000";
  assert.throws(() => evaluate(m), fieldError("totals.declared_total"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.monitoring.rolling_horizon_months = true;
  assert.throws(
    () => evaluate(m), fieldError("monitoring.rolling_horizon_months"));
});

test("malformed: vocabulary leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.scope.budget_type = 1;
  assert.throws(() => evaluate(m), fieldError("scope.budget_type"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.totals = null;
  assert.throws(() => evaluate(m), fieldError("totals"));
});

test("malformed: null line entry rejected", () => {
  const m = clone(COMPLETE) as any;
  m.lines[1] = null;
  assert.throws(() => evaluate(m), fieldError("lines[1]"));
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
  .filter((f) => f.startsWith("budget-design-review--") && f.endsWith(".json"))
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
