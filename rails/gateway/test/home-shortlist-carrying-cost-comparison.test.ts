import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluate,
  stamp,
} from "../src/atoms/home-shortlist-carrying-cost-comparison.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The HOME_SHORTLIST_COMPARISON_READY manifest, copied from the
// Python VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  search_name: "calgary-family-search",
  currency: "CAD",
  criteria: { written_before_search: true, area: "Calgary NW",
              property_type: "detached", budget_ceiling: 800000,
              must_haves_defined: true, deal_breakers_defined: true },
  homes: [
    { name: "maple-house", listing_source: "realtor-ca",
      fetch_date: "2026-11-10", status: "live",
      asking_price: 750000, monthly_housing_payment: 3200,
      monthly_property_tax: 350.5, monthly_utilities_estimate: 280,
      monthly_condo_or_hoa_fees: 0,
      declared_monthly_carrying_cost: 3830.5,
      open_questions: ["age of roof?"], meets_criteria: true },
    { name: "birch-condo", listing_source: "mls-feed",
      fetch_date: "2026-11-11", status: "viewed",
      asking_price: 520000, monthly_housing_payment: 2100,
      monthly_property_tax: 210, monthly_utilities_estimate: 150,
      monthly_condo_or_hoa_fees: 425,
      declared_monthly_carrying_cost: 2885,
      open_questions: [], meets_criteria: true },
    { name: "cedar-house", listing_source: "realtor-ca",
      fetch_date: "2026-11-09", status: "ruled_out",
      ruled_out_reason: "no garage — deal-breaker",
      asking_price: 690000, monthly_housing_payment: 2900,
      monthly_property_tax: 310, monthly_utilities_estimate: 260,
      monthly_condo_or_hoa_fees: 0,
      declared_monthly_carrying_cost: 3470,
      open_questions: ["furnace age?"], meets_criteria: false },
  ],
  tracking: { tracked_in_one_list: true,
              refreshed_before_comparison: true,
              criteria_market_conflict_addressed: true },
  presentation: {
    ranked_on_carrying_cost_not_price_alone: true,
    sources_and_fetch_dates_attached: true,
    unknowns_presented_as_questions: true,
    freshness_limits_stated: true,
    presented_as_research_not_advice: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 30 Python VerdictTests, ported ----

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "HOME_SHORTLIST_COMPARISON_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 25);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.homes_count, 3);
});

test("test_computed_carrying_costs_totals_and_ranking", () => {
  const v = evaluate(clone(COMPLETE));
  assert.deepEqual(v.monthly_carrying_costs, [
    { name: "maple-house", monthly_carrying_cost: "3830.500000" },
    { name: "birch-condo", monthly_carrying_cost: "2885.000000" },
    { name: "cedar-house", monthly_carrying_cost: "3470.000000" },
  ]);
  assert.equal(v.total_monthly_carrying_cost, "10185.500000");
  assert.equal(v.lowest_monthly_carrying_cost, "2885.000000");
  assert.equal(v.highest_monthly_carrying_cost, "3830.500000");
  assert.equal(v.carrying_cost_spread, "945.500000");
  assert.deepEqual(v.ranked_home_names,
    ["birch-condo", "cedar-house", "maple-house"]);
  assert.equal(v.cheapest_home_name, "birch-condo");
  assert.equal(v.cost_figure_coverage, "1.000000");
  assert.deepEqual(v.homes_over_budget_ceiling, []);
  assert.equal(v.homes_within_budget_count, 3);
  assert.equal(v.any_home_within_budget, true);
  assert.deepEqual(v.homes_not_meeting_criteria, ["cedar-house"]);
  assert.deepEqual(v.homes_with_carrying_cost_mismatch, []);
});

test("test_ranking_ties_keep_declared_order", () => {
  const m = clone(COMPLETE) as any;
  m.homes[2].monthly_housing_payment = 2315;
  m.homes[2].declared_monthly_carrying_cost = 2885;
  const v = evaluate(m);
  assert.deepEqual(v.ranked_home_names,
    ["birch-condo", "cedar-house", "maple-house"]);
});

test("test_criteria_not_written_first_fails_criteria_section", () => {
  const m = clone(COMPLETE) as any;
  m.criteria.written_before_search = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "HOME_SHORTLIST_COMPARISON_NOT_READY");
  assert.equal(v.sections["criteria_first"], "fail");
});

test("test_empty_area_fails_and_missing_area_is_missing", () => {
  const m = clone(COMPLETE) as any;
  m.criteria.area = "";
  assert.equal(checkStatus(evaluate(m), "criteria_area_declared"), "fail");
  const m2 = clone(COMPLETE) as any;
  delete m2.criteria.area;
  const v2 = evaluate(m2);
  assert.equal(v2.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v2, "criteria_area_declared"), "missing");
});

test("test_zero_budget_ceiling_fails", () => {
  const m = clone(COMPLETE) as any;
  m.criteria.budget_ceiling = 0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "criteria_budget_ceiling_declared"), "fail");
  assert.deepEqual(v.homes_over_budget_ceiling,
    ["maple-house", "birch-condo", "cedar-house"]);
  assert.equal(v.any_home_within_budget, false);
});

test("test_home_over_budget_is_reported_not_failed", () => {
  const m = clone(COMPLETE) as any;
  m.homes[0].asking_price = 850000;
  const v = evaluate(m);
  assert.equal(v.verdict, "HOME_SHORTLIST_COMPARISON_READY");
  assert.deepEqual(v.homes_over_budget_ceiling, ["maple-house"]);
  assert.equal(v.homes_within_budget_count, 2);
  assert.equal(v.any_home_within_budget, true);
});

test("test_missing_budget_ceiling_nulls_budget_outputs", () => {
  const m = clone(COMPLETE) as any;
  delete m.criteria.budget_ceiling;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.homes_over_budget_ceiling, null);
  assert.equal(v.homes_within_budget_count, null);
  assert.equal(v.any_home_within_budget, null);
});

test("test_empty_currency_fails", () => {
  const m = clone(COMPLETE) as any;
  m.currency = "";
  assert.equal(checkStatus(evaluate(m), "currency_declared"), "fail");
});

test("test_empty_homes_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.homes = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "homes_declared"), "fail");
  assert.equal(v.homes_count, 0);
  assert.deepEqual(v.monthly_carrying_costs, []);
  assert.deepEqual(v.ranked_home_names, []);
  assert.equal(v.cheapest_home_name, null);
  assert.equal(v.total_monthly_carrying_cost, null);
  assert.equal(v.cost_figure_coverage, null);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_home_without_source_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.homes[1].listing_source = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "HOME_SHORTLIST_COMPARISON_NOT_READY");
  assert.equal(checkStatus(v, "every_home_names_listing_source"), "fail");
  assert.deepEqual(v.homes_without_listing_source, ["birch-condo"]);
});

test("test_home_missing_source_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.homes[0].listing_source;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_home_names_listing_source"), "missing");
  assert.deepEqual(v.homes_without_listing_source, ["maple-house"]);
});

test("test_home_missing_fetch_date_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.homes[2].fetch_date;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_home_names_fetch_date"), "missing");
  assert.deepEqual(v.homes_without_fetch_date, ["cedar-house"]);
});

test("test_invalid_status_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.homes[0].status = "pending";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_home_declares_stated_status"), "fail");
  assert.deepEqual(v.homes_with_invalid_status, ["maple-house"]);
  assert.equal(v.verdict, "HOME_SHORTLIST_COMPARISON_NOT_READY");
});

test("test_ruled_out_without_reason_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.homes[2].ruled_out_reason = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ruled_out_home_has_reason"), "fail");
  assert.deepEqual(v.ruled_out_homes_without_reason, ["cedar-house"]);
});

test("test_ruled_out_missing_reason_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.homes[2].ruled_out_reason;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_ruled_out_home_has_reason"), "missing");
  assert.deepEqual(v.ruled_out_homes_without_reason, []);
});

test("test_no_ruled_out_homes_passes_reason_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.homes[2].status = "viewed";
  delete m.homes[2].ruled_out_reason;
  const v = evaluate(m);
  assert.equal(v.verdict, "HOME_SHORTLIST_COMPARISON_READY");
  assert.equal(checkStatus(v, "every_ruled_out_home_has_reason"), "pass");
});

test("test_missing_open_questions_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.homes[1].open_questions;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_home_lists_open_questions"), "missing");
});

test("test_missing_cost_component_nulls_that_home_only", () => {
  const m = clone(COMPLETE) as any;
  delete m.homes[1].monthly_condo_or_hoa_fees;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "every_home_declares_all_monthly_cost_components"),
    "missing");
  assert.deepEqual(v.monthly_carrying_costs?.[1],
    { name: "birch-condo", monthly_carrying_cost: null });
  assert.equal(v.total_monthly_carrying_cost, "7300.500000");
  assert.deepEqual(v.ranked_home_names, ["cedar-house", "maple-house"]);
  assert.equal(v.cost_figure_coverage, "0.666667");
});

test("test_negative_cost_component_fails", () => {
  const m = clone(COMPLETE) as any;
  m.homes[0].monthly_utilities_estimate = -10;
  m.homes[0].declared_monthly_carrying_cost = 3540.5;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "every_home_declares_all_monthly_cost_components"),
    "fail");
  assert.equal(v.verdict, "HOME_SHORTLIST_COMPARISON_NOT_READY");
});

test("test_declared_total_mismatch_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.homes[0].declared_monthly_carrying_cost = 3800;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "declared_carrying_costs_match_rederived"), "fail");
  assert.deepEqual(v.homes_with_carrying_cost_mismatch, ["maple-house"]);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
  assert.equal(v.verdict, "HOME_SHORTLIST_COMPARISON_NOT_READY");
});

test("test_missing_declared_total_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.homes[2].declared_monthly_carrying_cost;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "declared_carrying_costs_match_rederived"), "missing");
  assert.deepEqual(v.homes_with_carrying_cost_mismatch, []);
});

test("test_zero_or_negative_asking_price_fails", () => {
  const m = clone(COMPLETE) as any;
  m.homes[1].asking_price = 0;
  assert.equal(
    checkStatus(evaluate(m), "every_home_declares_asking_price"), "fail");
});

test("test_stale_candidates_not_refreshed_fails_tracking_section", () => {
  const m = clone(COMPLETE) as any;
  m.tracking.refreshed_before_comparison = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "HOME_SHORTLIST_COMPARISON_NOT_READY");
  assert.equal(v.sections["tracking_and_refresh"], "fail");
});

test("test_ranked_on_price_alone_fails_presentation_section", () => {
  const m = clone(COMPLETE) as any;
  m.presentation.ranked_on_carrying_cost_not_price_alone = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "HOME_SHORTLIST_COMPARISON_NOT_READY");
  assert.equal(v.sections["ranking_and_presentation"], "fail");
  assert.equal(
    checkStatus(v, "shortlist_ranked_on_carrying_cost_not_price_alone"),
    "fail");
});

test("test_freshness_limits_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.presentation.freshness_limits_stated = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "freshness_limits_stated"), "fail");
  assert.equal(v.verdict, "HOME_SHORTLIST_COMPARISON_NOT_READY");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.tracking;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["tracking_and_refresh"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.homes_count, null);
  assert.equal(v.monthly_carrying_costs, null);
  assert.equal(v.total_monthly_carrying_cost, null);
  assert.equal(v.ranked_home_names, null);
  assert.equal(v.cheapest_home_name, null);
  assert.equal(v.homes_over_budget_ceiling, null);
  assert.equal(v.any_home_within_budget, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE)))
    .includes("VERDICT: HOME_SHORTLIST_COMPARISON_READY"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types — the Python
// MalformedTypeTests, ported.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.search_name = 12345;
  assert.throws(() => evaluate(m), fieldError("search_name"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ criteria: "should-be-an-object" }),
    fieldError("criteria"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ homes: { name: "maple-house" } }),
    fieldError("homes"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ homes: ["maple-house"] }),
    fieldError("homes[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.criteria.written_before_search = "yes";
  assert.throws(() => evaluate(m), fieldError("criteria.written_before_search"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.criteria.budget_ceiling = "800000";
  assert.throws(() => evaluate(m), fieldError("criteria.budget_ceiling"));
});

test("malformed: number leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.homes[0].asking_price = true;
  assert.throws(() => evaluate(m), fieldError("homes[0].asking_price"));
});

test("malformed: nested list entry number field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.homes[1].monthly_condo_or_hoa_fees = "425";
  assert.throws(
    () => evaluate(m), fieldError("homes[1].monthly_condo_or_hoa_fees"));
});

test("malformed: string list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.homes[0].open_questions = [42];
  assert.throws(
    () => evaluate(m), fieldError("homes[0].open_questions[0]"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tracking = null;
  assert.throws(() => evaluate(m), fieldError("tracking"));
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
  .filter((f) => f.startsWith("home-shortlist-carrying-cost-comparison--") && f.endsWith(".json"))
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
