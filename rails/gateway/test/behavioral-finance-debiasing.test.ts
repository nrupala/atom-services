import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/behavioral-finance-debiasing.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The DEBIASED manifest, copied from the Python VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  decision: "panic-sell-debias-2026-11",
  context: { is_big_trade: true },
  bias_screening: {
    loss_aversion_screened: true,
    disposition_effect_screened: true,
    mental_accounting_screened: true,
    anchoring_to_purchase_price_screened: true,
    recency_availability_screened: true,
    herding_fomo_screened: true,
    overconfidence_illusion_of_control_screened: true,
    confirmation_screened: true,
    sunk_cost_screened: true,
    home_bias_screened: true,
    narrative_bias_screened: true },
  bias_patterns: { found: [
    { bias: "loss aversion", technique_named: true,
      surfaced_to_user: true },
    { bias: "disposition effect", technique_named: true,
      surfaced_to_user: true }] },
  prospect_theory: {
    reference_point_identified: true,
    framed_vs_reference_not_absolute_wealth: true,
    loss_asymmetry_acknowledged: true,
    risk_attitude_by_domain_checked: true,
    probability_weighting_checked: true },
  precommitment: {
    investment_policy_statement_present: true,
    written_sell_criteria_present: true,
    rules_decided_before_emotion_arrives: true,
    rebalancing_target_allocation_percent: 60,
    rebalancing_current_allocation_percent: 63,
    rebalancing_band_percent: 5 },
  journal_and_checklists: {
    decision_journal_reasoning_recorded: true,
    decisions_reviewed_separately_from_outcomes: true,
    base_rates_used: true,
    checklists_used: true,
    cooling_off_period_taken: true },
  whole_portfolio: {
    reframed_in_whole_portfolio_absolute_terms: true,
    single_position_pnl_framing_used: false,
    position_value: 5000,
    whole_portfolio_value: 100000 },
  guardrails: {
    bias_patterns_surfaced_to_user: true,
    tool_calculates_user_decides: true,
    not_advice_line_respected: true,
    biases_used_to_manipulate: false,
    trade_nudge_present: false,
    markets_assumed_perfectly_efficient_or_irrational: false,
    single_bias_treated_as_whole_story: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_debiased", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "DEBIASED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status, "within_declared_band_on_declared_evidence");
  assert.equal(v.checks.length, 36);
});

test("test_bias_patterns_found_count_reported", () => {
  assert.equal(evaluate(clone(COMPLETE)).bias_patterns_found_count, 2);
});

test("test_drift_over_band_serialized_at_fixed_4dp", () => {
  assert.equal(evaluate(clone(COMPLETE)).allocation_drift_over_band_percent, "-2.0000");
  const m = clone(COMPLETE) as any;
  m.precommitment.rebalancing_current_allocation_percent = 72;
  assert.equal(evaluate(m).allocation_drift_over_band_percent, "7.0000");
});

test("test_position_share_serialized_at_fixed_4dp", () => {
  assert.equal(evaluate(clone(COMPLETE)).position_share_percent_of_portfolio, "5.0000");
  const m = clone(COMPLETE) as any;
  m.whole_portfolio.position_value = 3333;
  assert.equal(evaluate(m).position_share_percent_of_portfolio, "3.3330");
});

test("test_position_share_null_when_portfolio_value_zero", () => {
  const m = clone(COMPLETE) as any;
  m.whole_portfolio.whole_portfolio_value = 0;
  const v = evaluate(m);
  assert.equal(v.position_share_percent_of_portfolio, null);
  assert.equal(v.verdict, "DEBIASED");
});

test("test_allocation_at_band_edge_passes", () => {
  const m = clone(COMPLETE) as any;
  m.precommitment.rebalancing_current_allocation_percent = 65;
  const v = evaluate(m);
  assert.equal(v.verdict, "DEBIASED");
  assert.equal(v.allocation_drift_over_band_percent, "0.0000");
});

test("test_allocation_below_target_within_band_passes", () => {
  const m = clone(COMPLETE) as any;
  m.precommitment.rebalancing_current_allocation_percent = 56;
  assert.equal(evaluate(m).verdict, "DEBIASED");
});

test("test_allocation_outside_band_fails", () => {
  const m = clone(COMPLETE) as any;
  m.precommitment.rebalancing_current_allocation_percent = 78;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEBIASED");
  assert.equal(v.sections["precommitment_rules"], "fail");
  assert.equal(v.computed_status, "outside_declared_band_on_declared_evidence");
});

test("test_missing_band_value_is_missing_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.precommitment.rebalancing_band_percent;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.allocation_drift_over_band_percent, null);
  assert.equal(v.computed_status, null);
});

test("test_found_pattern_without_technique_fails", () => {
  const m = clone(COMPLETE) as any;
  m.bias_patterns.found[0].technique_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEBIASED");
  assert.equal(checkStatus(v, "all_found_patterns_have_technique_named"), "fail");
});

test("test_found_pattern_not_surfaced_fails", () => {
  const m = clone(COMPLETE) as any;
  m.bias_patterns.found[1].surfaced_to_user = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEBIASED");
  assert.equal(checkStatus(v, "all_found_patterns_surfaced_to_user"), "fail");
});

test("test_empty_found_list_passes_pattern_checks", () => {
  const m = clone(COMPLETE) as any;
  m.bias_patterns.found = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "DEBIASED");
  assert.equal(v.bias_patterns_found_count, 0);
});

test("test_missing_found_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.bias_patterns.found;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.bias_patterns_found_count, null);
});

test("test_unscreened_bias_fails", () => {
  const m = clone(COMPLETE) as any;
  m.bias_screening.narrative_bias_screened = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEBIASED");
  assert.equal(v.sections["bias_screening"], "fail");
});

test("test_disposition_effect_not_screened_fails", () => {
  const m = clone(COMPLETE) as any;
  m.bias_screening.disposition_effect_screened = false;
  assert.equal(evaluate(m).verdict, "NOT_DEBIASED");
});

test("test_reference_point_not_identified_fails", () => {
  const m = clone(COMPLETE) as any;
  m.prospect_theory.reference_point_identified = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEBIASED");
  assert.equal(v.sections["prospect_theory_reframing"], "fail");
});

test("test_loss_asymmetry_not_acknowledged_fails", () => {
  const m = clone(COMPLETE) as any;
  m.prospect_theory.loss_asymmetry_acknowledged = false;
  assert.equal(evaluate(m).verdict, "NOT_DEBIASED");
});

test("test_no_investment_policy_statement_fails", () => {
  const m = clone(COMPLETE) as any;
  m.precommitment.investment_policy_statement_present = false;
  assert.equal(evaluate(m).verdict, "NOT_DEBIASED");
});

test("test_rules_decided_after_emotion_fails", () => {
  const m = clone(COMPLETE) as any;
  m.precommitment.rules_decided_before_emotion_arrives = false;
  assert.equal(evaluate(m).verdict, "NOT_DEBIASED");
});

test("test_big_trade_without_cooling_off_fails", () => {
  const m = clone(COMPLETE) as any;
  m.journal_and_checklists.cooling_off_period_taken = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEBIASED");
  assert.equal(checkStatus(v, "cooling_off_period_taken_before_big_trade"), "fail");
});

test("test_non_big_trade_passes_cooling_off_as_not_applicable", () => {
  const m = clone(COMPLETE) as any;
  m.context.is_big_trade = false;
  delete m.journal_and_checklists.cooling_off_period_taken;
  assert.equal(evaluate(m).verdict, "DEBIASED");
});

test("test_decisions_not_reviewed_separately_from_outcomes_fails", () => {
  const m = clone(COMPLETE) as any;
  m.journal_and_checklists.decisions_reviewed_separately_from_outcomes = false;
  assert.equal(evaluate(m).verdict, "NOT_DEBIASED");
});

test("test_base_rates_not_used_fails", () => {
  const m = clone(COMPLETE) as any;
  m.journal_and_checklists.base_rates_used = false;
  assert.equal(evaluate(m).verdict, "NOT_DEBIASED");
});

test("test_single_position_pnl_framing_fails", () => {
  const m = clone(COMPLETE) as any;
  m.whole_portfolio.single_position_pnl_framing_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEBIASED");
  assert.equal(v.sections["whole_portfolio_reframing"], "fail");
});

test("test_not_reframed_in_whole_portfolio_terms_fails", () => {
  const m = clone(COMPLETE) as any;
  m.whole_portfolio.reframed_in_whole_portfolio_absolute_terms = false;
  assert.equal(evaluate(m).verdict, "NOT_DEBIASED");
});

test("test_biases_used_to_manipulate_fails_anti_pattern", () => {
  const m = clone(COMPLETE) as any;
  m.guardrails.biases_used_to_manipulate = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_DEBIASED");
  assert.equal(v.sections["guardrails_and_anti_patterns"], "fail");
});

test("test_trade_nudge_fails", () => {
  const m = clone(COMPLETE) as any;
  m.guardrails.trade_nudge_present = true;
  assert.equal(evaluate(m).verdict, "NOT_DEBIASED");
});

test("test_single_bias_as_whole_story_fails_anti_pattern", () => {
  const m = clone(COMPLETE) as any;
  m.guardrails.single_bias_treated_as_whole_story = true;
  assert.equal(evaluate(m).verdict, "NOT_DEBIASED");
});

test("test_perfect_efficiency_or_irrationality_assumption_fails", () => {
  const m = clone(COMPLETE) as any;
  m.guardrails.markets_assumed_perfectly_efficient_or_irrational = true;
  assert.equal(evaluate(m).verdict, "NOT_DEBIASED");
});

test("test_not_advice_line_not_respected_fails", () => {
  const m = clone(COMPLETE) as any;
  m.guardrails.not_advice_line_respected = false;
  assert.equal(evaluate(m).verdict, "NOT_DEBIASED");
});

test("test_tool_decides_instead_of_user_fails", () => {
  const m = clone(COMPLETE) as any;
  m.guardrails.tool_calculates_user_decides = false;
  assert.equal(evaluate(m).verdict, "NOT_DEBIASED");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.prospect_theory;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["prospect_theory_reframing"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.bias_patterns_found_count, null);
  assert.equal(v.allocation_drift_over_band_percent, null);
  assert.equal(v.position_share_percent_of_portfolio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: DEBIASED"));
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

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.decision = 12345;
  assert.throws(() => evaluate(m), fieldError("decision"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ guardrails: "should-be-an-object" }),
    fieldError("guardrails"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.bias_patterns.found = "loss-aversion";
  assert.throws(() => evaluate(m), fieldError("bias_patterns.found"));
});

test("malformed: list entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.bias_patterns.found = ["loss aversion"];
  assert.throws(() => evaluate(m), fieldError("bias_patterns.found[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.bias_screening.sunk_cost_screened = "yes";
  assert.throws(() => evaluate(m), fieldError("bias_screening.sunk_cost_screened"));
});

test("malformed: boolean leaf in list entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.bias_patterns.found[0].technique_named = "yes";
  assert.throws(
    () => evaluate(m),
    fieldError("bias_patterns.found[0].technique_named"),
  );
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.precommitment.rebalancing_band_percent = "five";
  assert.throws(
    () => evaluate(m),
    fieldError("precommitment.rebalancing_band_percent"),
  );
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.guardrails = null;
  assert.throws(() => evaluate(m), fieldError("guardrails"));
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
  .filter((f) => f.startsWith("behavioral-finance-debiasing--") && f.endsWith(".json"))
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
