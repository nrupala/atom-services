import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/finance-tool-design-advisory.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  tool: "savings-teacher",
  compliance: { tool_calculates_user_decides: true,
                recommendation_language_present: false,
                disclaimers_carried: true,
                finra_2214_and_csa_framing_addressed: true,
                advice_like_language_redesigned_to_scenarios: true },
  margin: { margin_features_present: true,
            margin_disclosure_carried: true },
  quant: { risk_and_return_presented_together: true,
           diversification_and_correlation_addressed: true,
           mpt_limits_disclosed: true,
           factor_thinking_addressed: true,
           regime_awareness_addressed: true,
           tax_and_fee_aware_returns: true },
  features: [
    { name: "scenario-explorer", shows_scenarios_and_tradeoffs: true,
      implies_advice_present: false, figures_traceable: true,
      is_backtest: false },
    { name: "backtest-viewer", shows_scenarios_and_tradeoffs: true,
      implies_advice_present: false, figures_traceable: true,
      is_backtest: true, overfit_and_survivorship_addressed: true },
    { name: "risk-dashboard", shows_scenarios_and_tradeoffs: true,
      implies_advice_present: false, figures_traceable: true,
      is_backtest: false },
  ],
  open_building_blocks: { open_data_sources_used: true,
                          open_source_analytics_used: true,
                          every_number_reproducible_and_auditable: true },
  privacy: { zero_knowledge_design: true, user_held_keys: true,
             data_selling_present: false },
  business_model: {
    monetization_via_certification_membership_or_developer_licenses: true,
    core_features_gated_present: false },
  behavioral: { biases_accounted_for: true,
                decision_history_used_as_insight: true },
  anti_patterns: {
    guaranteed_or_return_promising_language_present: false,
    black_box_risk_numbers_present: false,
    fees_taxes_slippage_ignored_present: false,
    overfit_backtests_present: false,
    survivorship_bias_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "FINANCE_TOOL_DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 32);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.features_count, 3);
  assert.deepEqual(v.features_without_scenarios_and_tradeoffs, []);
  assert.equal(v.scenario_coverage, "1.000000");
  assert.deepEqual(v.features_implying_advice, []);
  assert.deepEqual(v.features_without_traceable_figures, []);
  assert.equal(v.traceability_coverage, "1.000000");
  assert.deepEqual(v.backtest_features_without_overfit_survivorship_address, []);
});

test("test_recommendation_language_fails_compliance_section", () => {
  const m = clone(COMPLETE) as any;
  m.compliance.recommendation_language_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "FINANCE_TOOL_DESIGN_NOT_SOUND");
  assert.equal(v.sections["compliance_and_advice_boundary"], "fail");
  assert.equal(checkStatus(v, "no_recommendation_language"), "fail");
});

test("test_tool_deciding_for_user_fails", () => {
  const m = clone(COMPLETE) as any;
  m.compliance.tool_calculates_user_decides = false;
  assert.equal(evaluate(m).verdict, "FINANCE_TOOL_DESIGN_NOT_SOUND");
});

test("test_no_disclaimers_fails", () => {
  const m = clone(COMPLETE) as any;
  m.compliance.disclaimers_carried = false;
  assert.equal(evaluate(m).verdict, "FINANCE_TOOL_DESIGN_NOT_SOUND");
});

test("test_margin_disclosure_missing_when_margin_present_fails", () => {
  const m = clone(COMPLETE) as any;
  m.margin.margin_disclosure_carried = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "margin_disclosure_when_margin_features"), "fail");
});

test("test_no_margin_features_passes_margin_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.margin = { margin_features_present: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "FINANCE_TOOL_DESIGN_SOUND");
  assert.equal(checkStatus(v, "margin_disclosure_when_margin_features"), "pass");
});

test("test_margin_target_missing_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.margin.margin_disclosure_carried;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "margin_disclosure_when_margin_features"), "missing");
});

test("test_mpt_limits_not_disclosed_fails_quant_section", () => {
  const m = clone(COMPLETE) as any;
  m.quant.mpt_limits_disclosed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FINANCE_TOOL_DESIGN_NOT_SOUND");
  assert.equal(v.sections["quant_fundamentals"], "fail");
});

test("test_gross_only_returns_fail", () => {
  const m = clone(COMPLETE) as any;
  m.quant.tax_and_fee_aware_returns = false;
  assert.equal(evaluate(m).verdict, "FINANCE_TOOL_DESIGN_NOT_SOUND");
});

test("test_feature_without_scenarios_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.features[0].shows_scenarios_and_tradeoffs = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FINANCE_TOOL_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "every_feature_shows_scenarios_and_tradeoffs"), "fail");
  assert.deepEqual(v.features_without_scenarios_and_tradeoffs, ["scenario-explorer"]);
  assert.equal(v.scenario_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_feature_missing_scenarios_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.features[0].shows_scenarios_and_tradeoffs;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_feature_shows_scenarios_and_tradeoffs"), "missing");
  assert.deepEqual(v.features_without_scenarios_and_tradeoffs, []);
});

test("test_feature_implying_advice_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.features[2].implies_advice_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_feature_implies_advice"), "fail");
  assert.deepEqual(v.features_implying_advice, ["risk-dashboard"]);
});

test("test_feature_without_traceable_figures_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.features[1].figures_traceable = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_feature_figures_traceable"), "fail");
  assert.deepEqual(v.features_without_traceable_figures, ["backtest-viewer"]);
  assert.equal(v.traceability_coverage, "0.666667");
});

test("test_empty_features_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.features = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "features_declared"), "fail");
  assert.equal(v.features_count, 0);
  assert.equal(v.scenario_coverage, null);
  assert.equal(v.traceability_coverage, null);
});

test("test_data_selling_fails_privacy", () => {
  const m = clone(COMPLETE) as any;
  m.privacy.data_selling_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_data_selling"), "fail");
  assert.equal(v.sections["reproducibility_privacy_and_open_finance"], "fail");
});

test("test_non_zero_knowledge_fails", () => {
  const m = clone(COMPLETE) as any;
  m.privacy.zero_knowledge_design = false;
  assert.equal(evaluate(m).verdict, "FINANCE_TOOL_DESIGN_NOT_SOUND");
});

test("test_core_features_gated_fails_business_section", () => {
  const m = clone(COMPLETE) as any;
  m.business_model.core_features_gated_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_core_features_gated"), "fail");
  assert.equal(v.sections["business_model_and_behavioral_design"], "fail");
});

test("test_biases_not_accounted_fails", () => {
  const m = clone(COMPLETE) as any;
  m.behavioral.biases_accounted_for = false;
  assert.equal(evaluate(m).verdict, "FINANCE_TOOL_DESIGN_NOT_SOUND");
});

test("test_guaranteed_language_fails_anti_patterns", () => {
  const m = clone(COMPLETE) as any;
  m.anti_patterns.guaranteed_or_return_promising_language_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_guaranteed_or_return_promising_language"), "fail");
  assert.equal(v.sections["anti_patterns"], "fail");
});

test("test_black_box_risk_numbers_fail", () => {
  const m = clone(COMPLETE) as any;
  m.anti_patterns.black_box_risk_numbers_present = true;
  assert.equal(evaluate(m).verdict, "FINANCE_TOOL_DESIGN_NOT_SOUND");
});

test("test_backtest_without_address_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.features[1].overfit_and_survivorship_addressed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FINANCE_TOOL_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "every_backtest_feature_addresses_overfit_and_survivorship"), "fail");
  assert.deepEqual(v.backtest_features_without_overfit_survivorship_address, ["backtest-viewer"]);
});

test("test_backtest_missing_address_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.features[1].overfit_and_survivorship_addressed;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_backtest_feature_addresses_overfit_and_survivorship"), "missing");
  assert.deepEqual(v.backtest_features_without_overfit_survivorship_address, []);
});

test("test_no_backtest_features_passes_backtest_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.features[1].is_backtest = false;
  delete m.features[1].overfit_and_survivorship_addressed;
  const v = evaluate(m);
  assert.equal(v.verdict, "FINANCE_TOOL_DESIGN_SOUND");
  assert.equal(checkStatus(v, "every_backtest_feature_addresses_overfit_and_survivorship"), "pass");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.quant;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["quant_fundamentals"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.features_count, null);
  assert.equal(v.features_without_scenarios_and_tradeoffs, null);
  assert.equal(v.scenario_coverage, null);
  assert.equal(v.features_implying_advice, null);
  assert.equal(v.features_without_traceable_figures, null);
  assert.equal(v.traceability_coverage, null);
  assert.equal(v.backtest_features_without_overfit_survivorship_address, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: FINANCE_TOOL_DESIGN_SOUND"));
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
  m.tool = 12345;
  assert.throws(() => evaluate(m), fieldError("tool"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ quant: "should-be-an-object" }), fieldError("quant"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ features: { name: "scenario-explorer" } }), fieldError("features"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ features: ["scenario-explorer"] }), fieldError("features[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.quant.mpt_limits_disclosed = "yes";
  assert.throws(() => evaluate(m), fieldError("quant.mpt_limits_disclosed"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.features[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("features[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.features[1].is_backtest = "yes";
  assert.throws(() => evaluate(m), fieldError("features[1].is_backtest"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.privacy = null;
  assert.throws(() => evaluate(m), fieldError("privacy"));
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
  .filter((f) => f.startsWith("finance-tool-design-advisory--") && f.endsWith(".json"))
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
