import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/engineering-project-budget-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The BUDGET_PACK_READY manifest, copied from the Python
// oracle tests.
const COMPLETE: Record<string, unknown> = {
  entity: "Substation 12kV Switchgear Replacement",
  basis: {
    document_present: true,
    scope_of_estimate_stated: true,
    assumptions_stated: true,
    exclusions_stated: true,
    quote_validity_stated: true,
    fx_escalation_stated: true,
    estimator_named: true,
  },
  build: {
    labor_costed_rate_times_hours: true,
    indirects_included: true,
  },
  line_items: [
    { label: "feeder cable", category: "material",
      pricing_basis: "quote_based",
      quantity: 1000, unit_rate: 12, declared_amount: 12000 },
    { label: "installation labor", category: "labor",
      pricing_basis: "allowance",
      quantity: 400, unit_rate: 95, declared_amount: 38000 },
    { label: "testing subcontract", category: "subcontract",
      pricing_basis: "quote_based",
      quantity: 1, unit_rate: 25000, declared_amount: 25000 },
    { label: "crane rental", category: "rentals",
      pricing_basis: "allowance",
      quantity: 4, unit_rate: 3000, declared_amount: 12000 },
    { label: "freight and permits", category: "indirects",
      pricing_basis: "allowance",
      quantity: 1, unit_rate: 8000, declared_amount: 8000 },
  ],
  contingency: {
    risks_listed_for_contingency: true,
    management_reserve_held_separately: true,
    padding_buried_in_estimate: false,
  },
  totals: {
    declared_subtotal: 95000,
    contingency_percent: 10,
    declared_contingency_amount: 9500,
    declared_management_reserve_amount: 5000,
    declared_total_budget: 109500,
    declared_total_change_impact: 4500,
    declared_revised_budget: 114000,
  },
  approval: {
    approval_recorded: true,
    baseline_from_approved_amount: true,
    revisions_reapproved: true,
    work_without_approved_estimate_or_po: false,
  },
  changes: {
    log_maintained: true,
    verbal_change_orders_used: false,
  },
  change_entries: [
    { label: "added cable tray scope", cost_impact: 6000,
      impact_statement_present: true, approved_before_work: true },
    { label: "descoped spare breaker", cost_impact: -1500,
      impact_statement_present: true, approved_before_work: true },
  ],
  tracking: {
    commitments_vs_actuals_tracked: true,
    invoice_reconciliation_against_delivery: true,
    monthly_report_issued: true,
    variance_reported_with_reasons: true,
    commitments_amount: 80000,
    actuals_amount: 70000,
    forecast_to_complete_amount: 38000,
    declared_total_forecast_amount: 108000,
    declared_forecast_variance_amount: -6000,
  },
  closeout: {
    final_cost_reconciled: true,
    variance_explained: true,
    lessons_captured: true,
    contingency_disposition_stated: true,
    unspent_contingency_released_explicitly: true,
    declared_final_cost: 112000,
    declared_final_variance_amount: -2000,
    contingency_used_amount: 7000,
    declared_unspent_contingency_amount: 2500,
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
  assert.equal(v.verdict, "BUDGET_PACK_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 42);
  assert.equal(v.line_items_evaluated, 5);
  assert.equal(v.computed_subtotal, "95000.000000");
  assert.equal(v.subtotal_difference, "0.000000");
  assert.equal(v.change_entries_evaluated, 2);
  assert.equal(v.computed_change_impact_total, "4500.000000");
  assert.equal(v.change_impact_difference, "0.000000");
  assert.equal(v.computed_contingency_amount, "9500.000000");
  assert.equal(v.contingency_difference, "0.000000");
  assert.equal(v.computed_total_budget, "109500.000000");
  assert.equal(v.total_budget_difference, "0.000000");
  assert.equal(v.computed_revised_budget, "114000.000000");
  assert.equal(v.revised_budget_difference, "0.000000");
  assert.equal(v.computed_total_forecast, "108000.000000");
  assert.equal(v.total_forecast_difference, "0.000000");
  assert.equal(v.computed_forecast_variance, "-6000.000000");
  assert.equal(v.forecast_variance_difference, "0.000000");
  assert.equal(v.computed_final_variance, "-2000.000000");
  assert.equal(v.final_variance_difference, "0.000000");
  assert.equal(v.computed_unspent_contingency, "2500.000000");
  assert.equal(v.unspent_contingency_difference, "0.000000");
});

test("test_basis_document_absent_fails", () => {
  const m = clone(COMPLETE) as any;
  m.basis.document_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_PACK_NOT_READY");
  assert.equal(v.sections["basis_document"], "fail");
});

test("test_basis_estimator_not_named_fails", () => {
  const m = clone(COMPLETE) as any;
  m.basis.estimator_named = false;
  assert.equal(evaluate(m).verdict, "BUDGET_PACK_NOT_READY");
});

test("test_line_amount_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.line_items[0].declared_amount = 11000;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_PACK_NOT_READY");
  assert.equal(
    checkStatus(v, "line_item_amounts_match_quantity_times_rate"), "fail");
});

test("test_subtotal_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_subtotal = 94000;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "subtotal_matches_sum_of_line_items"), "fail");
  assert.equal(v.subtotal_difference, "-1000.000000");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_unstated_pricing_basis_fails", () => {
  const m = clone(COMPLETE) as any;
  m.line_items[1].pricing_basis = "guess";
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_PACK_NOT_READY");
  assert.equal(checkStatus(v, "line_item_pricing_basis_marked"), "fail");
});

test("test_each_stated_pricing_basis_passes", () => {
  for (const basis of ["quote_based", "allowance"]) {
    const m = clone(COMPLETE) as any;
    for (const item of m.line_items) item.pricing_basis = basis;
    assert.equal(evaluate(m).verdict, "BUDGET_PACK_READY");
  }
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
  assert.equal(v.line_items_evaluated, 4);
  assert.equal(v.computed_subtotal, null);
});

test("test_contingency_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_contingency_amount = 9000;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_PACK_NOT_READY");
  assert.equal(
    checkStatus(v, "contingency_amount_matches_subtotal_times_percent"),
    "fail");
  assert.equal(v.contingency_difference, "-500.000000");
});

test("test_contingency_at_other_percent_passes", () => {
  const m = clone(COMPLETE) as any;
  m.totals.contingency_percent = 20;
  m.totals.declared_contingency_amount = 19000;
  m.totals.declared_total_budget = 119000;
  m.totals.declared_revised_budget = 123500;
  m.tracking.declared_forecast_variance_amount = -15500;
  m.closeout.declared_final_variance_amount = -11500;
  m.closeout.contingency_used_amount = 17000;
  m.closeout.declared_unspent_contingency_amount = 2000;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_PACK_READY");
  assert.equal(v.computed_contingency_amount, "19000.000000");
});

test("test_total_budget_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_total_budget = 109000;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v,
      "total_budget_matches_subtotal_plus_contingency_plus_reserve"),
    "fail");
  assert.equal(v.total_budget_difference, "-500.000000");
});

test("test_buried_padding_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contingency.padding_buried_in_estimate = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_PACK_NOT_READY");
  assert.equal(checkStatus(v, "no_padding_buried_in_estimate"), "fail");
});

test("test_reserve_not_separate_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contingency.management_reserve_held_separately = false;
  assert.equal(evaluate(m).verdict, "BUDGET_PACK_NOT_READY");
});

test("test_work_without_approval_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.approval.work_without_approved_estimate_or_po = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_PACK_NOT_READY");
  assert.equal(
    checkStatus(v, "no_work_without_approved_estimate_or_po"), "fail");
  assert.equal(v.sections["approval_and_baseline"], "fail");
});

test("test_revisions_drifted_fails", () => {
  const m = clone(COMPLETE) as any;
  m.approval.revisions_reapproved = false;
  assert.equal(evaluate(m).verdict, "BUDGET_PACK_NOT_READY");
});

test("test_change_without_impact_statement_fails", () => {
  const m = clone(COMPLETE) as any;
  m.change_entries[0].impact_statement_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_PACK_NOT_READY");
  assert.equal(
    checkStatus(v, "all_changes_have_impact_statements"), "fail");
});

test("test_change_not_approved_before_work_fails", () => {
  const m = clone(COMPLETE) as any;
  m.change_entries[1].approved_before_work = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_PACK_NOT_READY");
  assert.equal(
    checkStatus(v, "all_changes_approved_before_work"), "fail");
});

test("test_change_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_total_change_impact = 4000;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "change_impact_total_matches_sum_of_entries"), "fail");
  assert.equal(v.change_impact_difference, "-500.000000");
});

test("test_revised_budget_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_revised_budget = 113000;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v,
      "revised_budget_matches_total_budget_plus_change_impact"), "fail");
  assert.equal(v.revised_budget_difference, "-1000.000000");
});

test("test_verbal_change_orders_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.changes.verbal_change_orders_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_PACK_NOT_READY");
  assert.equal(checkStatus(v, "no_verbal_change_orders"), "fail");
});

test("test_missing_change_entries_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.change_entries;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.change_entries_evaluated, 0);
  assert.equal(v.computed_change_impact_total, null);
  assert.equal(v.computed_revised_budget, "114000.000000");
});

test("test_incomplete_change_entry_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.change_entries[0].cost_impact;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "change_entries_complete"), "missing");
  assert.equal(v.change_entries_evaluated, 1);
  assert.equal(v.computed_change_impact_total, null);
});

test("test_total_forecast_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tracking.declared_total_forecast_amount = 107000;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v,
      "total_forecast_matches_actuals_plus_forecast_to_complete"), "fail");
  assert.equal(v.total_forecast_difference, "-1000.000000");
});

test("test_forecast_variance_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tracking.declared_forecast_variance_amount = -5000;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v,
      "forecast_variance_matches_total_forecast_minus_revised_budget"),
    "fail");
  assert.equal(v.forecast_variance_difference, "1000.000000");
});

test("test_variance_without_reasons_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tracking.variance_reported_with_reasons = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_PACK_NOT_READY");
  assert.equal(v.sections["change_control_and_tracking"], "fail");
});

test("test_missing_tracking_number_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.tracking.actuals_amount;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_total_forecast, null);
  assert.equal(v.computed_forecast_variance, "-6000.000000");
});

test("test_final_variance_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.closeout.declared_final_variance_amount = -1000;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v,
      "final_variance_matches_final_cost_minus_revised_budget"), "fail");
  assert.equal(v.final_variance_difference, "1000.000000");
});

test("test_unspent_contingency_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.closeout.declared_unspent_contingency_amount = 2000;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "unspent_contingency_matches_contingency_minus_used"),
    "fail");
  assert.equal(v.unspent_contingency_difference, "-500.000000");
});

test("test_unspent_not_released_fails", () => {
  const m = clone(COMPLETE) as any;
  m.closeout.unspent_contingency_released_explicitly = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "BUDGET_PACK_NOT_READY");
  assert.equal(
    v.sections["closeout_and_contingency_disposition"], "fail");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.closeout;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    v.sections["closeout_and_contingency_disposition"],
    "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.line_items_evaluated, 0);
  assert.equal(v.change_entries_evaluated, 0);
  assert.equal(v.computed_subtotal, null);
  assert.equal(v.computed_total_budget, null);
  assert.equal(v.computed_revised_budget, null);
  assert.equal(v.computed_unspent_contingency, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: BUDGET_PACK_READY"));
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

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.basis.assumptions_stated = "yes";
  assert.throws(() => evaluate(m), fieldError("basis.assumptions_stated"));
});

test("malformed: line items as object rejected", () => {
  const m = clone(COMPLETE) as any;
  m.line_items = { label: "cable" };
  assert.throws(() => evaluate(m), fieldError("line_items"));
});

test("malformed: line item entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.line_items[0] = "cable";
  assert.throws(() => evaluate(m), fieldError("line_items[0]"));
});

test("malformed: line item numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.line_items[1].quantity = "400";
  assert.throws(() => evaluate(m), fieldError("line_items[1].quantity"));
});

test("malformed: line item pricing basis as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.line_items[0].pricing_basis = 7;
  assert.throws(
    () => evaluate(m), fieldError("line_items[0].pricing_basis"));
});

test("malformed: change entries as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.change_entries = "added tray scope";
  assert.throws(() => evaluate(m), fieldError("change_entries"));
});

test("malformed: change entry boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.change_entries[0].approved_before_work = "yes";
  assert.throws(
    () => evaluate(m),
    fieldError("change_entries[0].approved_before_work"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.totals.declared_subtotal = "95000";
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
  .filter((f) => f.startsWith("engineering-project-budget-pack--") && f.endsWith(".json"))
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
