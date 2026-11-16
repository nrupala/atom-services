import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/claim-evaluation-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

function claim(label: string, restated = true, supporting = true, refuting = true, presence = true) {
  return { label, restated_precisely: restated, supporting_evidence_sought: supporting, refuting_evidence_sought: refuting, evidence_presence_assessed: presence };
}

const COMPLETE: Record<string, unknown> = {
  entity: "Vendor pitch claim set Q4",
  claims: [claim("claim_1"), claim("claim_2"), claim("claim_3")],
  hierarchy: { evidence_ranked_by_hierarchy: true, conflicts_noted: true, conflict_reasons_and_incentives_examined: true, conclusions_from_vibes_or_authority_alone: false },
  base_rates: { considered_first: true, reference_class_identified: true, used_where_applicable: true, base_rate_percent: 30 },
  steelman: { strongest_counterargument_constructed: true, strongest_counterargument_engaged: true, straw_manning_in_own_favor: false },
  fallacy_screen: { fallacies_checked: ["ad_hominem", "straw_man", "false_dilemma", "appeal_to_authority", "appeal_to_antiquity", "survivorship_stories", "motivated_reasoning", "cherry_picked_windows"] },
  calibration: { confidence_stated: true, confidence_percent: 80, outcomes_reviewed: true, hit_rate_tracked_by_confidence_band: true, outcomes_correct: 7, outcomes_total: 10, declared_hit_rate_percent: 70, certainty_outruns_evidence: false },
  second_order: { second_order_thinking_applied: true },
  judgment: { judgment_written: true, judgment_includes_key_uncertainties: true, judgment_checkable_later: true },
};

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function checkStatus(v: ReturnType<typeof evaluate>, name: string) { return v.checks.find((c) => c.check === name)?.status; }

test("test_complete_manifest_is_complete", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "CLAIM_EVALUATION_COMPLETE");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 26);
  assert.equal(v.claims_evaluated, 3);
  assert.equal(v.base_rate_percent, "30.000000");
  assert.equal(v.confidence_percent, "80.000000");
  assert.equal(v.computed_hit_rate_percent, "70.000000");
  assert.equal(v.hit_rate_difference, "0.000000");
  assert.deepEqual(v.fallacies_not_checked, []);
});
test("test_single_claim_passes_no_minimum_claim_count", () => { const m = clone(COMPLETE) as any; m.claims = [claim("only")]; const v = evaluate(m); assert.equal(v.verdict, "CLAIM_EVALUATION_COMPLETE"); assert.equal(v.claims_evaluated, 1); });
test("test_claim_not_restated_fails", () => { const m = clone(COMPLETE) as any; m.claims[1].restated_precisely = false; const v = evaluate(m); assert.equal(v.verdict, "CLAIM_EVALUATION_NOT_COMPLETE"); assert.equal(v.sections["claim_set_and_evidence"], "fail"); assert.equal(checkStatus(v, "all_claims_restated_precisely"), "fail"); assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence"); });
test("test_refuting_evidence_not_sought_fails", () => { const m = clone(COMPLETE) as any; m.claims[0].refuting_evidence_sought = false; assert.equal(checkStatus(evaluate(m), "all_claims_supporting_and_refuting_evidence_sought"), "fail"); });
test("test_evidence_presence_not_assessed_fails", () => { const m = clone(COMPLETE) as any; m.claims[2].evidence_presence_assessed = false; assert.equal(checkStatus(evaluate(m), "all_claims_evidence_presence_assessed"), "fail"); });
test("test_missing_claims_is_missing", () => { const m = clone(COMPLETE) as any; delete m.claims; const v = evaluate(m); assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE"); assert.equal(checkStatus(v, "all_claims_restated_precisely"), "missing"); assert.equal(v.claims_evaluated, 0); assert.equal(v.computed_status, null); });
test("test_empty_claims_list_is_missing", () => { const m = clone(COMPLETE) as any; m.claims = []; const v = evaluate(m); assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE"); assert.equal(checkStatus(v, "claim_entries_complete"), "missing"); });
test("test_incomplete_claim_entry_is_missing", () => { const m = clone(COMPLETE) as any; delete m.claims[1].refuting_evidence_sought; const v = evaluate(m); assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE"); assert.equal(checkStatus(v, "claim_entries_complete"), "missing"); assert.equal(v.claims_evaluated, 2); });
test("test_empty_label_claim_entry_is_missing", () => { const m = clone(COMPLETE) as any; m.claims[0].label = ""; const v = evaluate(m); assert.equal(checkStatus(v, "claim_entries_complete"), "missing"); assert.equal(v.claims_evaluated, 2); });
test("test_hierarchy_not_ranked_fails", () => { const m = clone(COMPLETE) as any; m.hierarchy.evidence_ranked_by_hierarchy = false; const v = evaluate(m); assert.equal(v.verdict, "CLAIM_EVALUATION_NOT_COMPLETE"); assert.equal(v.sections["evidence_hierarchy_and_conflicts"], "fail"); });
test("test_conflict_incentives_not_examined_fails", () => { const m = clone(COMPLETE) as any; m.hierarchy.conflict_reasons_and_incentives_examined = false; assert.equal(evaluate(m).verdict, "CLAIM_EVALUATION_NOT_COMPLETE"); });
test("test_conclusions_from_vibes_or_authority_fails_red_line", () => { const m = clone(COMPLETE) as any; m.hierarchy.conclusions_from_vibes_or_authority_alone = true; assert.equal(checkStatus(evaluate(m), "no_conclusions_from_vibes_or_authority_alone"), "fail"); });
test("test_base_rates_not_first_fails", () => { const m = clone(COMPLETE) as any; m.base_rates.considered_first = false; assert.equal(evaluate(m).sections["base_rates_and_reference_class"], "fail"); });
test("test_base_rate_percent_over_100_fails", () => { const m = clone(COMPLETE) as any; m.base_rates.base_rate_percent = 130; const v = evaluate(m); assert.equal(checkStatus(v, "base_rate_percent_within_percent_range"), "fail"); assert.equal(v.base_rate_percent, "130.000000"); });
test("test_base_rate_percent_negative_fails", () => { const m = clone(COMPLETE) as any; m.base_rates.base_rate_percent = -5; assert.equal(checkStatus(evaluate(m), "base_rate_percent_within_percent_range"), "fail"); });
test("test_base_rate_at_bounds_passes", () => { for (const value of [0, 100]) { const m = clone(COMPLETE) as any; m.base_rates.base_rate_percent = value; assert.equal(evaluate(m).verdict, "CLAIM_EVALUATION_COMPLETE"); } });
test("test_missing_base_rate_percent_is_missing", () => { const m = clone(COMPLETE) as any; delete m.base_rates.base_rate_percent; const v = evaluate(m); assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE"); assert.equal(v.base_rate_percent, null); });
test("test_steelman_not_constructed_fails", () => { const m = clone(COMPLETE) as any; m.steelman.strongest_counterargument_constructed = false; assert.equal(evaluate(m).verdict, "CLAIM_EVALUATION_NOT_COMPLETE"); });
test("test_steelman_not_engaged_fails", () => { const m = clone(COMPLETE) as any; m.steelman.strongest_counterargument_engaged = false; assert.equal(evaluate(m).sections["steelman_and_fallacy_screen"], "fail"); });
test("test_straw_manning_in_own_favor_fails_red_line", () => { const m = clone(COMPLETE) as any; m.steelman.straw_manning_in_own_favor = true; assert.equal(checkStatus(evaluate(m), "no_straw_manning_in_own_favor"), "fail"); });
test("test_fallacy_coverage_missing_one_fails", () => { const m = clone(COMPLETE) as any; m.fallacy_screen.fallacies_checked = m.fallacy_screen.fallacies_checked.filter((f: string) => f !== "cherry_picked_windows"); const v = evaluate(m); assert.equal(v.verdict, "CLAIM_EVALUATION_NOT_COMPLETE"); assert.deepEqual(v.fallacies_not_checked, ["cherry_picked_windows"]); assert.equal(checkStatus(v, "fallacy_screen_covers_stated_fallacies"), "fail"); });
test("test_fallacy_empty_list_fails_not_missing", () => { const m = clone(COMPLETE) as any; m.fallacy_screen.fallacies_checked = []; const v = evaluate(m); assert.equal(v.verdict, "CLAIM_EVALUATION_NOT_COMPLETE"); assert.equal(v.fallacies_not_checked?.length, 8); });
test("test_fallacy_unknown_entries_do_not_satisfy_coverage", () => { const m = clone(COMPLETE) as any; m.fallacy_screen.fallacies_checked = ["hasty", "tu_quoque"]; assert.equal(evaluate(m).fallacies_not_checked?.length, 8); });
test("test_missing_fallacy_list_is_missing", () => { const m = clone(COMPLETE) as any; delete m.fallacy_screen.fallacies_checked; const v = evaluate(m); assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE"); assert.equal(v.fallacies_not_checked, null); });
test("test_confidence_not_stated_fails", () => { const m = clone(COMPLETE) as any; m.calibration.confidence_stated = false; assert.equal(evaluate(m).verdict, "CLAIM_EVALUATION_NOT_COMPLETE"); });
test("test_confidence_percent_over_100_fails", () => { const m = clone(COMPLETE) as any; m.calibration.confidence_percent = 101; assert.equal(checkStatus(evaluate(m), "confidence_percent_within_percent_range"), "fail"); });
test("test_confidence_at_other_percent_passes", () => { const m = clone(COMPLETE) as any; m.calibration.confidence_percent = 55; const v = evaluate(m); assert.equal(v.verdict, "CLAIM_EVALUATION_COMPLETE"); assert.equal(v.confidence_percent, "55.000000"); });
test("test_hit_rate_mismatch_fails", () => { const m = clone(COMPLETE) as any; m.calibration.declared_hit_rate_percent = 60; const v = evaluate(m); assert.equal(v.verdict, "CLAIM_EVALUATION_NOT_COMPLETE"); assert.equal(checkStatus(v, "declared_hit_rate_matches_correct_divided_by_total"), "fail"); assert.equal(v.hit_rate_difference, "-10.000000"); assert.equal(v.computed_hit_rate_percent, "70.000000"); });
test("test_hit_rate_at_other_values_passes", () => { const m = clone(COMPLETE) as any; Object.assign(m.calibration, { outcomes_correct: 1, outcomes_total: 4, declared_hit_rate_percent: 25 }); const v = evaluate(m); assert.equal(v.verdict, "CLAIM_EVALUATION_COMPLETE"); assert.equal(v.computed_hit_rate_percent, "25.000000"); });
test("test_zero_outcomes_total_fails_hit_rate", () => { const m = clone(COMPLETE) as any; Object.assign(m.calibration, { outcomes_correct: 0, outcomes_total: 0, declared_hit_rate_percent: 0 }); const v = evaluate(m); assert.equal(v.verdict, "CLAIM_EVALUATION_NOT_COMPLETE"); assert.equal(v.computed_hit_rate_percent, null); assert.equal(v.hit_rate_difference, null); });
test("test_missing_hit_rate_number_is_missing", () => { const m = clone(COMPLETE) as any; delete m.calibration.declared_hit_rate_percent; const v = evaluate(m); assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE"); assert.equal(v.computed_hit_rate_percent, "70.000000"); assert.equal(v.hit_rate_difference, null); });
test("test_outcomes_not_reviewed_fails", () => { const m = clone(COMPLETE) as any; m.calibration.outcomes_reviewed = false; assert.equal(evaluate(m).verdict, "CLAIM_EVALUATION_NOT_COMPLETE"); });
test("test_certainty_outrunning_evidence_fails_red_line", () => { const m = clone(COMPLETE) as any; m.calibration.certainty_outruns_evidence = true; const v = evaluate(m); assert.equal(v.sections["calibration"], "fail"); assert.equal(checkStatus(v, "certainty_does_not_outrun_evidence"), "fail"); });
test("test_second_order_not_applied_fails", () => { const m = clone(COMPLETE) as any; m.second_order.second_order_thinking_applied = false; assert.equal(evaluate(m).sections["second_order_and_judgment"], "fail"); });
test("test_judgment_not_written_fails", () => { const m = clone(COMPLETE) as any; m.judgment.judgment_written = false; assert.equal(evaluate(m).verdict, "CLAIM_EVALUATION_NOT_COMPLETE"); });
test("test_judgment_without_uncertainties_fails", () => { const m = clone(COMPLETE) as any; m.judgment.judgment_includes_key_uncertainties = false; assert.equal(evaluate(m).verdict, "CLAIM_EVALUATION_NOT_COMPLETE"); });
test("test_absent_section_is_insufficient_not_failed", () => { const m = clone(COMPLETE) as any; delete m.fallacy_screen; const v = evaluate(m); assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE"); assert.equal(v.sections["steelman_and_fallacy_screen"], "insufficient_evidence"); });
test("test_empty_manifest_is_insufficient_evidence", () => { const v = evaluate({}); assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE"); assert.equal(v.computed_status, null); assert.equal(v.claims_evaluated, 0); assert.equal(v.base_rate_percent, null); assert.equal(v.confidence_percent, null); assert.equal(v.computed_hit_rate_percent, null); assert.equal(v.fallacies_not_checked, null); });
test("test_stamp_names_the_verdict", () => { const v = evaluate(clone(COMPLETE)); assert.ok(stamp(v).includes("VERDICT: CLAIM_EVALUATION_COMPLETE")); });
test("test_non_object_manifest_rejected", () => { assert.throws(() => evaluate(["not", "a", "manifest"]), (err: unknown) => err instanceof TypeError && (err as Error).message === "manifest must be a JSON object"); });

function fieldError(field: string) { return (err: unknown) => err instanceof FieldTypeError && err.field === field; }
test("malformed: top-level string field as number rejected", () => { const m = clone(COMPLETE) as any; m.entity = 12345; assert.throws(() => evaluate(m), fieldError("entity")); });
test("malformed: section as string rejected", () => { assert.throws(() => evaluate({ hierarchy: "should-be-an-object" }), fieldError("hierarchy")); });
test("malformed: claims list as object rejected", () => { const m = clone(COMPLETE) as any; m.claims = { label: "claim_1" }; assert.throws(() => evaluate(m), fieldError("claims")); });
test("malformed: claim entry as string rejected", () => { const m = clone(COMPLETE) as any; m.claims[0] = "claim_1"; assert.throws(() => evaluate(m), fieldError("claims[0]")); });
test("malformed: claim label as number rejected", () => { const m = clone(COMPLETE) as any; m.claims[0].label = 1; assert.throws(() => evaluate(m), fieldError("claims[0].label")); });
test("malformed: claim boolean leaf as string rejected", () => { const m = clone(COMPLETE) as any; m.claims[1].restated_precisely = "yes"; assert.throws(() => evaluate(m), fieldError("claims[1].restated_precisely")); });
test("malformed: list field as string rejected", () => { const m = clone(COMPLETE) as any; m.fallacy_screen.fallacies_checked = "ad_hominem"; assert.throws(() => evaluate(m), fieldError("fallacy_screen.fallacies_checked")); });
test("malformed: list entry as number rejected", () => { const m = clone(COMPLETE) as any; m.fallacy_screen.fallacies_checked = ["ad_hominem", 42]; assert.throws(() => evaluate(m), fieldError("fallacy_screen.fallacies_checked[1]")); });
test("malformed: boolean leaf as string rejected", () => { const m = clone(COMPLETE) as any; m.hierarchy.conflicts_noted = "yes"; assert.throws(() => evaluate(m), fieldError("hierarchy.conflicts_noted")); });
test("malformed: numeric leaf as string rejected", () => { const m = clone(COMPLETE) as any; m.calibration.confidence_percent = "80"; assert.throws(() => evaluate(m), fieldError("calibration.confidence_percent")); });
test("malformed: numeric leaf as boolean rejected", () => { const m = clone(COMPLETE) as any; m.base_rates.base_rate_percent = true; assert.throws(() => evaluate(m), fieldError("base_rates.base_rate_percent")); });
test("malformed: null section rejected", () => { const m = clone(COMPLETE) as any; m.calibration = null; assert.throws(() => evaluate(m), fieldError("calibration")); });

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "test", "fixtures");
interface Fixture { name: string; manifest: unknown; expected: unknown; }
const fixtureFiles = readdirSync(fixturesDir).filter((f) => f.startsWith("claim-evaluation-review--") && f.endsWith(".json")).sort();
assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");
for (const file of fixtureFiles) {
  const fixture = JSON.parse(readFileSync(path.join(fixturesDir, file), "utf-8")) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => { assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected); });
}
