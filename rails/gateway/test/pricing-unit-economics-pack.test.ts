import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/pricing-unit-economics-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  product: "widget-suite",
  revenue_model: {
    model_kind: "subscription",
    bookings_billings_and_recognized_revenue_kept_distinct: true,
    recognition_timing_documented: true,
    accountant_alignment_on_recognition_declared: true },
  pricing: { value_based_anchor_documented: true,
             good_better_best_tiers_declared: true,
             price_change_grandfathering_plan_present: true,
             pricing_reviewed_annually_declared: true },
  tiers: [
    { name: "basic", price: 50, variable_cost_per_unit: 20,
      units: 100, declared_revenue: 5000, declared_contribution: 3000 },
    { name: "pro", price: 100, variable_cost_per_unit: 35,
      units: 40, declared_revenue: 4000, declared_contribution: 2600 },
    { name: "enterprise", price: 250, variable_cost_per_unit: 90,
      units: 10, declared_revenue: 2500, declared_contribution: 1600 },
  ],
  discount_policy: { approval_matrix_present: true,
                     floor_prices_set: true,
                     deal_desk_for_exceptions_present: true,
                     refund_and_credit_policy_present: true,
                     failed_payment_dunning_process_present: true,
                     fraud_and_dispute_basics_present: true },
  discounts: [
    { label: "launch-10", reason: "launch promotion" },
    { label: "annual-prepay", reason: "prepayment" },
  ],
  unit_economics: {
    assumptions_stated: true,
    assumptions_conservative_declared: true,
    unit_economics_updated_quarterly_declared: true,
    price_per_unit: 100, variable_cost_per_unit: 40,
    fixed_costs: 12000, units_sold: 500,
    declared_contribution_margin_ratio: 0.6,
    declared_break_even_units: 200,
    declared_total_contribution: 30000 },
  churn: { gross_and_net_churn_kept_distinct: true,
           cohort_curves_used_not_single_period_averages: true,
           expansion_revenue_tracked: true },
  mrr_bridge: { opening_mrr: 10000, new_mrr: 2000,
                expansion_mrr: 500, contraction_mrr: 300,
                churned_mrr: 200, declared_closing_mrr: 12000 },
  reporting: {
    cash_collection_and_recognized_revenue_kept_distinct: true,
    forecast_inputs_handed_over_with_ranges_declared: true },
  red_lines: { bookings_presented_as_revenue_present: false,
               unrecorded_discounts_present: false,
               improvised_recognition_decisions_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "PRICING_UNIT_ECONOMICS_PACK_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 37);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.tiers_count, 3);
  assert.deepEqual(v.duplicate_tier_names, []);
  assert.deepEqual(v.tiers_mismatching_revenue, []);
  assert.deepEqual(v.tiers_mismatching_contribution, []);
  assert.equal(v.total_declared_tier_revenue, "11500.000000");
  assert.equal(v.total_declared_tier_contribution, "7200.000000");
  assert.equal(v.tier_contribution_margin, "0.626087");
  assert.equal(v.discounts_count, 2);
  assert.deepEqual(v.discounts_without_reason, []);
  assert.deepEqual(v.duplicate_discount_labels, []);
  assert.equal(v.discount_reason_coverage, "1.000000");
  assert.equal(v.computed_contribution_margin_ratio, "0.600000");
  assert.equal(v.contribution_margin_difference, "0.000000");
  assert.equal(v.computed_break_even_units, "200.000000");
  assert.equal(v.break_even_difference, "0.000000");
  assert.equal(v.computed_total_contribution, "30000.000000");
  assert.equal(v.total_contribution_difference, "0.000000");
  assert.equal(v.computed_closing_mrr, "12000.000000");
  assert.equal(v.closing_mrr_difference, "0.000000");
});

test("test_empty_tier_and_discount_lists_are_valid_declarations", () => {
  const m = clone(COMPLETE) as any;
  m.tiers = [];
  m.discounts = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "PRICING_UNIT_ECONOMICS_PACK_READY");
  assert.equal(v.tiers_count, 0);
  assert.equal(v.total_declared_tier_revenue, "0.000000");
  assert.equal(v.total_declared_tier_contribution, "0.000000");
  assert.equal(v.tier_contribution_margin, null);
  assert.equal(v.discounts_count, 0);
  assert.equal(v.discount_reason_coverage, null);
  assert.equal(checkStatus(v, "price_tiers_declared"), "pass");
  assert.equal(checkStatus(v, "every_discount_names_reason"), "pass");
});

test("test_unstated_model_kind_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.revenue_model.model_kind = "freemium";
  const v = evaluate(m);
  assert.equal(v.verdict, "PRICING_UNIT_ECONOMICS_PACK_NOT_READY");
  assert.equal(v.sections["revenue_model_and_recognition"], "fail");
  assert.equal(checkStatus(v, "revenue_model_kind_is_stated_kind"), "fail");
});

test("test_each_stated_model_kind_passes", () => {
  for (const kind of ["one_time", "subscription", "usage", "hybrid"]) {
    const m = clone(COMPLETE) as any;
    m.revenue_model.model_kind = kind;
    assert.equal(checkStatus(evaluate(m), "revenue_model_kind_is_stated_kind"), "pass");
  }
});

test("test_bookings_conflated_with_revenue_fails", () => {
  const m = clone(COMPLETE) as any;
  m.revenue_model.bookings_billings_and_recognized_revenue_kept_distinct = false;
  assert.equal(evaluate(m).verdict, "PRICING_UNIT_ECONOMICS_PACK_NOT_READY");
});

test("test_no_value_anchor_fails_section2", () => {
  const m = clone(COMPLETE) as any;
  m.pricing.value_based_anchor_documented = false;
  assert.equal(evaluate(m).sections["pricing_and_packaging"], "fail");
});

test("test_tier_revenue_mismatch_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tiers[0].declared_revenue = 5001;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "tier_revenue_matches_price_times_units"), "fail");
  assert.deepEqual(v.tiers_mismatching_revenue, ["basic"]);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_tier_contribution_mismatch_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tiers[1].declared_contribution = 2500;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "tier_contribution_matches_unit_contribution_times_units"), "fail");
  assert.deepEqual(v.tiers_mismatching_contribution, ["pro"]);
});

test("test_tier_missing_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.tiers[0].declared_revenue;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_price_tier_entry_complete"), "missing");
  assert.equal(checkStatus(v, "tier_revenue_matches_price_times_units"), "missing");
  assert.equal(v.total_declared_tier_revenue, null);
});

test("test_tier_empty_name_fails_completeness", () => {
  const m = clone(COMPLETE) as any;
  m.tiers[0].name = "";
  assert.equal(checkStatus(evaluate(m), "every_price_tier_entry_complete"), "fail");
});

test("test_duplicate_tier_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tiers[2].name = "basic";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_price_tier_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_tier_names, ["basic"]);
});

test("test_absent_tiers_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.tiers;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "price_tiers_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.tiers_count, null);
  assert.equal(v.duplicate_tier_names, null);
  assert.equal(v.tiers_mismatching_revenue, null);
  assert.equal(v.total_declared_tier_revenue, null);
  assert.equal(v.tier_contribution_margin, null);
});

test("test_no_floor_prices_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.discount_policy.floor_prices_set = false;
  assert.equal(evaluate(m).sections["discount_and_payment_guardrails"], "fail");
});

test("test_discount_without_reason_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.discounts[0].reason = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_discount_names_reason"), "fail");
  assert.deepEqual(v.discounts_without_reason, ["launch-10"]);
  assert.equal(v.discount_reason_coverage, "0.500000");
});

test("test_discount_missing_reason_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.discounts[0].reason;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_discount_names_reason"), "missing");
  assert.deepEqual(v.discounts_without_reason, []);
});

test("test_duplicate_discount_label_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.discounts[1].label = "launch-10";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_discount_label_duplicated"), "fail");
  assert.deepEqual(v.duplicate_discount_labels, ["launch-10"]);
});

test("test_margin_ratio_mismatch_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.unit_economics.declared_contribution_margin_ratio = 0.5;
  const v = evaluate(m);
  assert.equal(v.sections["unit_economics"], "fail");
  assert.equal(checkStatus(v, "contribution_margin_ratio_matches_price_and_variable_cost"), "fail");
  assert.equal(v.contribution_margin_difference, "-0.100000");
});

test("test_break_even_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.unit_economics.declared_break_even_units = 201;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "break_even_units_matches_fixed_costs_over_unit_contribution"), "fail");
  assert.equal(v.break_even_difference, "1.000000");
});

test("test_total_contribution_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.unit_economics.declared_total_contribution = 29999;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "total_contribution_matches_units_sold_times_unit_contribution"), "fail");
  assert.equal(v.total_contribution_difference, "-1.000000");
});

test("test_zero_price_makes_ratio_check_fail_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.unit_economics.price_per_unit = 0;
  m.unit_economics.variable_cost_per_unit = 0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "contribution_margin_ratio_matches_price_and_variable_cost"), "fail");
  assert.equal(v.computed_contribution_margin_ratio, null);
});

test("test_zero_unit_contribution_makes_break_even_fail", () => {
  const m = clone(COMPLETE) as any;
  m.unit_economics.variable_cost_per_unit = 100;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "break_even_units_matches_fixed_costs_over_unit_contribution"), "fail");
  assert.equal(v.computed_break_even_units, null);
});

test("test_missing_unit_economics_figure_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.unit_economics.fixed_costs;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_break_even_units, null);
  assert.equal(v.break_even_difference, null);
});

test("test_mrr_bridge_not_closing_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.mrr_bridge.declared_closing_mrr = 11999;
  const v = evaluate(m);
  assert.equal(v.sections["churn_retention_and_reporting"], "fail");
  assert.equal(checkStatus(v, "mrr_bridge_closes_on_declared_figures"), "fail");
  assert.equal(v.closing_mrr_difference, "-1.000000");
  assert.equal(v.computed_closing_mrr, "12000.000000");
});

test("test_partial_mrr_bridge_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.mrr_bridge.churned_mrr;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "mrr_bridge_closes_on_declared_figures"), "missing");
  assert.equal(v.computed_closing_mrr, null);
});

test("test_single_period_average_churn_fails", () => {
  const m = clone(COMPLETE) as any;
  m.churn.cohort_curves_used_not_single_period_averages = false;
  assert.equal(evaluate(m).verdict, "PRICING_UNIT_ECONOMICS_PACK_NOT_READY");
});

test("test_bookings_presented_as_revenue_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.bookings_presented_as_revenue_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_bookings_presented_as_revenue"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_unrecorded_discounts_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unrecorded_discounts_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unrecorded_discounts"), "fail");
  assert.equal(v.verdict, "PRICING_UNIT_ECONOMICS_PACK_NOT_READY");
});

test("test_improvised_recognition_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.improvised_recognition_decisions_present = true;
  assert.equal(checkStatus(evaluate(m), "no_improvised_recognition_decisions"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.churn;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["churn_retention_and_reporting"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.tiers_count, null);
  assert.equal(v.discounts_count, null);
  assert.equal(v.computed_closing_mrr, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: PRICING_UNIT_ECONOMICS_PACK_READY"));
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
  m.product = 12345;
  assert.throws(() => evaluate(m), fieldError("product"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ revenue_model: "should-be-an-object" }), fieldError("revenue_model"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ tiers: { name: "basic" } }), fieldError("tiers"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ tiers: ["basic"] }), fieldError("tiers[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.churn.expansion_revenue_tracked = "yes";
  assert.throws(() => evaluate(m), fieldError("churn.expansion_revenue_tracked"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.mrr_bridge.opening_mrr = "10000";
  assert.throws(() => evaluate(m), fieldError("mrr_bridge.opening_mrr"));
});

test("malformed: nested list entry number field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tiers[0].price = "50";
  assert.throws(() => evaluate(m), fieldError("tiers[0].price"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.unit_economics = null;
  assert.throws(() => evaluate(m), fieldError("unit_economics"));
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
  .filter((f) => f.startsWith("pricing-unit-economics-pack--") && f.endsWith(".json"))
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
