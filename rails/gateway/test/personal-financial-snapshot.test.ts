import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/personal-financial-snapshot.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  subject: "household-a",
  snapshot: { as_of_date_stated: true,
              currency_stated: true,
              net_worth_stated: true,
              allocation_stated: true,
              cash_flow_stated: true,
              cash_flow_period_stated: true },
  figures: { total_assets: 500000,
             total_liabilities: 200000,
             net_worth: 300000,
             period_income: 12000,
             period_expenses: 9000,
             net_cash_flow: 3000,
             annual_fees_and_drag_total: 1200 },
  assets: [
    { name: "savings-account", category: "cash", amount: 50000 },
    { name: "investment-account", category: "investments", amount: 350000 },
    { name: "home", category: "property", amount: 100000 },
  ],
  liabilities: [
    { name: "mortgage", amount: 180000 },
    { name: "car-loan", amount: 20000 },
  ],
  fees: [
    { name: "account-fees", amount: 200 },
    { name: "fund-fees", amount: 1000 },
  ],
  lenses: { risk_lens_stated: true,
            liquidity_lens_stated: true,
            tax_efficiency_lens_stated: true,
            time_horizon_lens_stated: true },
  costs: { fees_and_drag_surfaced: true,
           fees_and_drag_total_stated: true },
  traceability: { math_shown: true,
                  every_claim_traces_to_a_number: true,
                  educational_only_boundary_stated: true },
  red_lines: { buy_or_sell_recommendation_present: false,
               personalised_financial_advice_present: false,
               projection_or_scenario_present: false,
               ranked_action_recommendations_present: false,
               claim_without_traced_number_present: false },
};

const NO_LIABILITIES_NO_FEES: Record<string, unknown> = (() => {
  const m = clone(COMPLETE) as any;
  m.liabilities = [];
  m.fees = [];
  m.figures.total_liabilities = 0;
  m.figures.net_worth = 500000;
  m.figures.annual_fees_and_drag_total = 0;
  return m;
})();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "SNAPSHOT_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 34);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.assets_count, 3);
  assert.equal(v.computed_asset_total, "500000.000000");
  assert.equal(v.asset_total_difference, "0.000000");
  assert.deepEqual(v.duplicate_asset_names, []);
  assert.equal(v.liabilities_count, 2);
  assert.equal(v.computed_liability_total, "200000.000000");
  assert.equal(v.net_worth_difference, "0.000000");
  assert.equal(v.computed_net_cash_flow, "3000.000000");
  assert.equal(v.fees_count, 2);
  assert.equal(v.computed_fees_total, "1200.000000");
});

test("test_declared_zero_liabilities_and_fees_pass", () => {
  const v = evaluate(clone(NO_LIABILITIES_NO_FEES));
  assert.equal(v.verdict, "SNAPSHOT_SOUND");
  assert.equal(checkStatus(v, "liabilities_declared"), "pass");
  assert.equal(checkStatus(v, "fees_declared"), "pass");
  assert.equal(v.computed_liability_total, "0.000000");
  assert.equal(v.computed_fees_total, "0.000000");
});

test("test_no_as_of_date_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.snapshot.as_of_date_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SNAPSHOT_NOT_SOUND");
  assert.equal(v.sections["snapshot_completeness"], "fail");
  assert.equal(checkStatus(v, "as_of_date_stated"), "fail");
});

test("test_net_worth_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.snapshot.net_worth_stated = false;
  assert.equal(evaluate(m).verdict, "SNAPSHOT_NOT_SOUND");
});

test("test_asset_sum_mismatch_fails_and_reports_difference", () => {
  const m = clone(COMPLETE) as any;
  m.assets[0].amount = 40000;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "asset_rows_sum_matches_declared_total_assets"), "fail");
  assert.equal(v.computed_asset_total, "490000.000000");
  assert.equal(v.asset_total_difference, "10000.000000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_asset_missing_amount_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.assets[0].amount;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "asset_rows_sum_matches_declared_total_assets"), "missing");
  assert.equal(v.computed_asset_total, null);
});

test("test_asset_empty_name_fails_row_complete", () => {
  const m = clone(COMPLETE) as any;
  m.assets[1].name = "";
  assert.equal(checkStatus(evaluate(m), "every_asset_row_complete"), "fail");
});

test("test_asset_missing_category_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.assets[1].category;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_asset_row_complete"), "missing");
});

test("test_duplicate_asset_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.assets[2].name = "savings-account";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_asset_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_asset_names, ["savings-account"]);
});

test("test_empty_assets_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.assets = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "assets_declared"), "fail");
  assert.equal(v.assets_count, 0);
  assert.deepEqual(v.duplicate_asset_names, []);
});

test("test_liability_sum_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.liabilities[0].amount = 170000;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "liability_rows_sum_matches_declared_total_liabilities"), "fail");
  assert.equal(v.liability_total_difference, "10000.000000");
});

test("test_duplicate_liability_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.liabilities[1].name = "mortgage";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_liability_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_liability_names, ["mortgage"]);
});

test("test_net_worth_figure_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.figures.net_worth = 290000;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "declared_net_worth_matches_assets_minus_liabilities"), "fail");
  assert.equal(v.net_worth_difference, "-10000.000000");
});

test("test_net_worth_figure_absent_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.figures.net_worth;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.net_worth_difference, null);
});

test("test_net_cash_flow_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.figures.net_cash_flow = 2500;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "declared_net_cash_flow_matches_income_minus_expenses"), "fail");
  assert.equal(v.computed_net_cash_flow, "3000.000000");
  assert.equal(v.net_cash_flow_difference, "-500.000000");
  assert.equal(v.sections["cash_flow_and_fees_arithmetic"], "fail");
});

test("test_fee_sum_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.fees[1].amount = 900;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "fee_rows_sum_matches_declared_fees_total"), "fail");
  assert.equal(v.fees_total_difference, "100.000000");
});

test("test_duplicate_fee_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.fees[1].name = "account-fees";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_fee_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_fee_names, ["account-fees"]);
});

test("test_risk_lens_not_stated_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.lenses.risk_lens_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SNAPSHOT_NOT_SOUND");
  assert.equal(v.sections["lenses_and_costs"], "fail");
});

test("test_fees_not_surfaced_fails", () => {
  const m = clone(COMPLETE) as any;
  m.costs.fees_and_drag_surfaced = false;
  assert.equal(checkStatus(evaluate(m), "fees_and_drag_surfaced"), "fail");
});

test("test_math_not_shown_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.traceability.math_shown = false;
  const v = evaluate(m);
  assert.equal(v.sections["traceability_and_advice_boundary"], "fail");
});

test("test_buy_sell_recommendation_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.buy_or_sell_recommendation_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_buy_or_sell_recommendation"), "fail");
  assert.equal(v.sections["traceability_and_advice_boundary"], "fail");
  assert.equal(v.verdict, "SNAPSHOT_NOT_SOUND");
});

test("test_projection_and_ranked_actions_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.projection_or_scenario_present = true;
  m.red_lines.ranked_action_recommendations_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_projection_or_scenario"), "fail");
  assert.equal(checkStatus(v, "no_ranked_action_recommendations"), "fail");
});

test("test_personalised_advice_and_untraced_claim_fail", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.personalised_financial_advice_present = true;
  m.red_lines.claim_without_traced_number_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_personalised_financial_advice"), "fail");
  assert.equal(checkStatus(v, "no_claim_without_traced_number"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.lenses;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["lenses_and_costs"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.assets_count, null);
  assert.equal(v.computed_asset_total, null);
  assert.equal(v.duplicate_asset_names, null);
  assert.equal(v.computed_net_cash_flow, null);
  assert.equal(v.duplicate_fee_names, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: SNAPSHOT_SOUND"));
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
  m.subject = 12345;
  assert.throws(() => evaluate(m), fieldError("subject"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ snapshot: "should-be-an-object" }), fieldError("snapshot"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ assets: { name: "savings-account" } }), fieldError("assets"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ assets: ["savings-account"] }), fieldError("assets[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.snapshot.net_worth_stated = "yes";
  assert.throws(() => evaluate(m), fieldError("snapshot.net_worth_stated"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.figures.total_assets = "500000";
  assert.throws(() => evaluate(m), fieldError("figures.total_assets"));
});

test("malformed: nested list entry number field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.assets[0].amount = "50000";
  assert.throws(() => evaluate(m), fieldError("assets[0].amount"));
});

test("malformed: boolean as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.figures.net_worth = true;
  assert.throws(() => evaluate(m), fieldError("figures.net_worth"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.lenses = null;
  assert.throws(() => evaluate(m), fieldError("lenses"));
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
  .filter((f) => f.startsWith("personal-financial-snapshot--") && f.endsWith(".json"))
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
