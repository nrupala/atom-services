import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/cost-estimate-preparation.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The COST_ESTIMATE_READY manifest, copied from the Python
// oracle tests.
const COMPLETE: Record<string, unknown> = {
  entity: "Harbor Pumping Station Upgrade",
  basis: {
    document_present: true,
    estimate_class: "budget",
    method: "bottom_up",
    assumptions_documented: true,
    exclusions_documented: true,
    estimator_identified: true,
  },
  elements: {
    breakdown_not_lump_sum: true,
    labor_burden_included: true,
    hidden_padding_in_rates: false,
  },
  line_items: [
    { label: "structural steel", category: "material",
      quantity: 10, unit_rate: 5000, declared_amount: 50000 },
    { label: "installation labor", category: "labor",
      quantity: 200, unit_rate: 150, declared_amount: 30000 },
    { label: "crane hire", category: "equipment",
      quantity: 5, unit_rate: 4000, declared_amount: 20000 },
    { label: "controls subcontract", category: "subcontract",
      quantity: 1, unit_rate: 25000, declared_amount: 25000 },
    { label: "delivery freight", category: "freight",
      quantity: 2, unit_rate: 2500, declared_amount: 5000 },
    { label: "site indirects", category: "indirects",
      quantity: 1, unit_rate: 10000, declared_amount: 10000 },
  ],
  uncertainty: {
    ranges_stated_for_material_uncertainty: true,
    items: [
      { label: "ground conditions", optimistic: 8000, likely: 10000,
        pessimistic: 15000, declared_expected_value: 10500,
        declared_spread: 7000 },
      { label: "switchgear lead time", optimistic: 2000, likely: 3000,
        pessimistic: 6000, declared_expected_value: 3500,
        declared_spread: 4000 },
    ],
    expected_values_stated: true,
    single_number_precision_on_uncertain_scope: false,
  },
  totals: {
    declared_subtotal: 140000,
    contingency_percent: 10,
    declared_contingency_amount: 14000,
    escalation_percent: 5,
    declared_escalation_amount: 7000,
    declared_grand_total: 161000,
    escalation_impacts_stated: true,
    currency_impacts_stated: true,
    quote_validity_dates_captured: true,
  },
  should_cost: {
    benchmark_built_for_big_items: true,
    vendor_quote_amount: 55000,
    should_cost_amount: 50000,
    declared_variance_percent: 10,
    quote_compared_to_benchmark: true,
    divergences_explained: true,
    quote_exclusions_reviewed: true,
    quote_assumptions_reviewed: true,
    validity_period_respected: true,
    quote_accepted_without_scope_review: false,
  },
  feedback: {
    estimate_vs_actual_tracked_per_item: true,
    rates_updated_from_actuals: true,
    variance_lessons_published: true,
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
  assert.equal(v.verdict, "COST_ESTIMATE_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 35);
  assert.equal(v.line_items_evaluated, 6);
  assert.equal(v.computed_subtotal, "140000.000000");
  assert.equal(v.subtotal_difference, "0.000000");
  assert.equal(v.uncertainty_items_evaluated, 2);
  assert.equal(v.computed_total_spread, "11000.000000");
  assert.equal(v.total_spread_difference, "0.000000");
  assert.equal(v.computed_contingency_amount, "14000.000000");
  assert.equal(v.contingency_difference, "0.000000");
  assert.equal(v.computed_escalation_amount, "7000.000000");
  assert.equal(v.escalation_difference, "0.000000");
  assert.equal(v.computed_grand_total, "161000.000000");
  assert.equal(v.grand_total_difference, "0.000000");
  assert.equal(v.computed_quote_variance_percent, "10.000000");
  assert.equal(v.quote_variance_difference, "0.000000");
});

test("test_each_stated_class_passes", () => {
  for (const cls of ["concept_rom", "budget", "definitive"]) {
    const m = clone(COMPLETE) as any;
    m.basis.estimate_class = cls;
    assert.equal(evaluate(m).verdict, "COST_ESTIMATE_READY");
  }
});

test("test_unstated_class_fails", () => {
  const m = clone(COMPLETE) as any;
  m.basis.estimate_class = "rough_guess";
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(checkStatus(v, "estimate_class_in_stated_classes"), "fail");
  assert.equal(v.sections["basis_and_class"], "fail");
});

test("test_each_stated_method_passes", () => {
  for (const meth of ["bottom_up", "parametric", "analogous"]) {
    const m = clone(COMPLETE) as any;
    m.basis.method = meth;
    assert.equal(evaluate(m).verdict, "COST_ESTIMATE_READY");
  }
});

test("test_unstated_method_fails", () => {
  const m = clone(COMPLETE) as any;
  m.basis.method = "guesswork";
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(checkStatus(v, "method_in_stated_methods"), "fail");
});

test("test_missing_class_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.basis.estimate_class;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "estimate_class_in_stated_classes"), "missing");
  assert.equal(v.computed_status, null);
});

test("test_basis_document_absent_fails", () => {
  const m = clone(COMPLETE) as any;
  m.basis.document_present = false;
  assert.equal(evaluate(m).verdict, "COST_ESTIMATE_NOT_READY");
});

test("test_line_amount_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.line_items[0].declared_amount = 49000;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(
    checkStatus(v, "line_item_amounts_match_quantity_times_rate"), "fail");
});

test("test_line_amount_at_other_values_passes", () => {
  const m = clone(COMPLETE) as any;
  m.line_items[1].quantity = 100;
  m.line_items[1].declared_amount = 15000;
  m.totals.declared_subtotal = 125000;
  m.totals.declared_contingency_amount = 12500;
  m.totals.declared_escalation_amount = 6250;
  m.totals.declared_grand_total = 143750;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_READY");
  assert.equal(v.computed_subtotal, "125000.000000");
});

test("test_subtotal_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_subtotal = 139000;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "subtotal_matches_sum_of_line_items"), "fail");
  assert.equal(v.subtotal_difference, "-1000.000000");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_missing_line_items_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.line_items;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.line_items_evaluated, 0);
  assert.equal(v.computed_subtotal, null);
  assert.equal(checkStatus(v, "subtotal_matches_sum_of_line_items"), "missing");
});

test("test_empty_line_items_is_missing", () => {
  const m = clone(COMPLETE) as any;
  m.line_items = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "line_item_entries_complete"), "missing");
});

test("test_incomplete_line_item_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.line_items[2].unit_rate;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "line_item_entries_complete"), "missing");
  assert.equal(v.line_items_evaluated, 5);
  assert.equal(v.computed_subtotal, null);
});

test("test_hidden_padding_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.elements.hidden_padding_in_rates = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(checkStatus(v, "no_hidden_padding_in_rates"), "fail");
});

test("test_labor_burden_not_included_fails", () => {
  const m = clone(COMPLETE) as any;
  m.elements.labor_burden_included = false;
  assert.equal(evaluate(m).verdict, "COST_ESTIMATE_NOT_READY");
});

test("test_spread_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.uncertainty.items[0].declared_spread = 6000;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(
    checkStatus(v,
      "three_point_spreads_match_pessimistic_minus_optimistic"), "fail");
  assert.equal(v.total_spread_difference, "-1000.000000");
});

test("test_three_point_ordering_invalid_fails", () => {
  const m = clone(COMPLETE) as any;
  m.uncertainty.items[1].likely = 7000;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(checkStatus(v, "three_point_ordering_valid"), "fail");
  assert.equal(
    checkStatus(v,
      "three_point_spreads_match_pessimistic_minus_optimistic"), "pass");
});

test("test_expected_value_is_presence_only", () => {
  const m = clone(COMPLETE) as any;
  m.uncertainty.items[0].declared_expected_value = 99999;
  assert.equal(evaluate(m).verdict, "COST_ESTIMATE_READY");
});

test("test_missing_uncertainty_items_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.uncertainty.items;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.uncertainty_items_evaluated, 0);
  assert.equal(v.computed_total_spread, null);
});

test("test_incomplete_uncertainty_item_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.uncertainty.items[0].pessimistic;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "uncertainty_entries_complete"), "missing");
  assert.equal(v.uncertainty_items_evaluated, 1);
  assert.equal(v.computed_total_spread, null);
});

test("test_single_number_precision_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.uncertainty.single_number_precision_on_uncertain_scope = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(
    checkStatus(v, "no_single_number_precision_on_uncertain_scope"), "fail");
});

test("test_contingency_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_contingency_amount = 10000;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(
    checkStatus(v, "contingency_amount_matches_subtotal_times_percent"),
    "fail");
  assert.equal(v.contingency_difference, "-4000.000000");
});

test("test_contingency_at_other_percent_passes", () => {
  const m = clone(COMPLETE) as any;
  m.totals.contingency_percent = 25;
  m.totals.declared_contingency_amount = 35000;
  m.totals.declared_grand_total = 182000;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_READY");
  assert.equal(v.computed_contingency_amount, "35000.000000");
});

test("test_escalation_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_escalation_amount = 8000;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "escalation_amount_matches_subtotal_times_percent"),
    "fail");
  assert.equal(v.escalation_difference, "1000.000000");
});

test("test_grand_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_grand_total = 160000;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(
    checkStatus(v,
      "grand_total_matches_subtotal_plus_contingency_plus_escalation"),
    "fail");
  assert.equal(v.grand_total_difference, "-1000.000000");
});

test("test_missing_totals_number_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.totals.contingency_percent;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_contingency_amount, null);
  assert.equal(v.computed_grand_total, "161000.000000");
});

test("test_quote_variance_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.should_cost.declared_variance_percent = 5;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(
    checkStatus(v, "quote_variance_percent_matches_rederived"), "fail");
  assert.equal(v.quote_variance_difference, "-5.000000");
});

test("test_quote_below_benchmark_negative_variance_passes", () => {
  const m = clone(COMPLETE) as any;
  m.should_cost.vendor_quote_amount = 45000;
  m.should_cost.declared_variance_percent = -10;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_READY");
  assert.equal(v.computed_quote_variance_percent, "-10.000000");
});

test("test_zero_benchmark_fails_variance", () => {
  const m = clone(COMPLETE) as any;
  m.should_cost.should_cost_amount = 0;
  m.should_cost.declared_variance_percent = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(v.computed_quote_variance_percent, null);
  assert.equal(v.quote_variance_difference, null);
});

test("test_missing_variance_number_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.should_cost.declared_variance_percent;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_quote_variance_percent, "10.000000");
  assert.equal(v.quote_variance_difference, null);
});

test("test_quote_accepted_without_scope_review_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.should_cost.quote_accepted_without_scope_review = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(v.sections["should_cost_and_quotes"], "fail");
});

test("test_quote_exclusions_not_reviewed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.should_cost.quote_exclusions_reviewed = false;
  assert.equal(evaluate(m).verdict, "COST_ESTIMATE_NOT_READY");
});

test("test_feedback_not_tracked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.feedback.estimate_vs_actual_tracked_per_item = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "COST_ESTIMATE_NOT_READY");
  assert.equal(v.sections["feedback_loop"], "fail");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.feedback;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["feedback_loop"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.line_items_evaluated, 0);
  assert.equal(v.uncertainty_items_evaluated, 0);
  assert.equal(v.computed_subtotal, null);
  assert.equal(v.computed_grand_total, null);
  assert.equal(v.computed_quote_variance_percent, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: COST_ESTIMATE_READY"));
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
    () => evaluate({ basis: "should-be-an-object" }),
    fieldError("basis"),
  );
});

test("malformed: class field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.basis.estimate_class = 2;
  assert.throws(() => evaluate(m), fieldError("basis.estimate_class"));
});

test("malformed: line items as object rejected", () => {
  const m = clone(COMPLETE) as any;
  m.line_items = { label: "steel" };
  assert.throws(() => evaluate(m), fieldError("line_items"));
});

test("malformed: line item entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.line_items[0] = "steel";
  assert.throws(() => evaluate(m), fieldError("line_items[0]"));
});

test("malformed: line item numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.line_items[1].quantity = "200";
  assert.throws(() => evaluate(m), fieldError("line_items[1].quantity"));
});

test("malformed: line item label as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.line_items[0].label = 7;
  assert.throws(() => evaluate(m), fieldError("line_items[0].label"));
});

test("malformed: uncertainty items as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.uncertainty.items = "ground conditions";
  assert.throws(() => evaluate(m), fieldError("uncertainty.items"));
});

test("malformed: uncertainty numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.uncertainty.items[0].optimistic = "8000";
  assert.throws(
    () => evaluate(m), fieldError("uncertainty.items[0].optimistic"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.basis.assumptions_documented = "yes";
  assert.throws(
    () => evaluate(m), fieldError("basis.assumptions_documented"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_subtotal = "140000";
  assert.throws(() => evaluate(m), fieldError("totals.declared_subtotal"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.totals.contingency_percent = true;
  assert.throws(() => evaluate(m), fieldError("totals.contingency_percent"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.totals = null;
  assert.throws(() => evaluate(m), fieldError("totals"));
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
  .filter((f) => f.startsWith("cost-estimate-preparation--") && f.endsWith(".json"))
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
