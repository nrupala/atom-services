import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/decision-process-design.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The DECISION_PROCESS_SOUND manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  decision: "hire-or-not-senior-engineer",
  framing: { decision_named: true,
             decision_maker_identified: true,
             objective_stated: true,
             decision_maker_defines_what_matters: true,
             analyst_informs_not_decides: true,
             analysis_makes_the_call_present: false },
  options: [
    { name: "hire", viable: true },
    { name: "do_not_hire", viable: true },
  ],
  criteria: [
    { name: "work_sample_score", set_before_data: true,
      threshold_declared: true },
    { name: "reference_strength", set_before_data: true,
      threshold_declared: true },
  ],
  precommitment: { default_action: "do_not_hire",
                   change_my_mind_threshold_stated: true,
                   criteria_and_thresholds_set_before_data_seen: true,
                   data_seen_before_criteria_set_present: false },
  loss: { loss_function_framed: true,
          cost_of_being_wrong_in_each_direction_stated: true,
          cost_of_false_action: 40000,
          cost_of_false_inaction: 10000,
          asymmetric_costs_declared: true,
          threshold_adjusted_for_asymmetric_costs: true },
  rigor: { stakes_assessed: true,
           reversibility_assessed: true,
           effort_matched_to_stakes_and_reversibility: true,
           data_gathering_worth_assessed: true,
           irreversible_declared: false,
           slowed_down_and_more_evidence_for_irreversible: false,
           reversible_declared: true,
           default_to_action_for_reversible: true },
  evidence: { exploratory_and_confirmatory_distinguished: true,
              confirmatory_analysis_used: true,
              hypothesis_preregistered: true,
              conclusion_drawn_from_inspiring_data_present: false,
              evidence_has_power_to_change_decision: true,
              data_is_decoration_present: false,
              acted_per_preset_criteria_after_gathering: true },
  review: { decision_quality_reviewed_separately_from_outcome: true,
            decision_judged_by_process_and_information_at_time: true,
            outcome_used_alone_to_judge_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 30 Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "DECISION_PROCESS_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 36);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.options_count, 2);
  assert.deepEqual(v.options_without_name, []);
  assert.deepEqual(v.options_not_declared_viable, []);
  assert.equal(v.option_name_coverage, "1.0000");
  assert.equal(v.criteria_count, 2);
  assert.deepEqual(v.criteria_without_name, []);
  assert.deepEqual(v.criteria_not_set_before_data, []);
  assert.deepEqual(v.criteria_without_threshold, []);
  assert.equal(v.criterion_set_before_data_coverage, "1.0000");
  assert.equal(v.criterion_threshold_coverage, "1.0000");
  assert.equal(v.default_action, "do_not_hire");
  assert.equal(v.loss_cost_ratio, "4.0000");
});

test("test_decision_not_named_fails_framing_section", () => {
  const m = clone(COMPLETE) as any;
  m.framing.decision_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_NOT_SOUND");
  assert.equal(v.sections["framing_and_roles"], "fail");
});

test("test_option_without_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.options[1].name = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_NOT_SOUND");
  assert.equal(checkStatus(v, "every_option_named"), "fail");
  assert.deepEqual(v.options_without_name, [""]);
  assert.equal(v.option_name_coverage, "0.5000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_option_missing_name_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.options[0].name;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_option_named"), "missing");
  assert.deepEqual(v.options_without_name, ["unnamed"]);
});

test("test_option_not_viable_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options[0].viable = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_NOT_SOUND");
  assert.deepEqual(v.options_not_declared_viable, ["hire"]);
});

test("test_empty_options_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "options_declared"), "fail");
  assert.equal(v.options_count, 0);
  assert.equal(v.option_name_coverage, null);
});

test("test_analysis_makes_call_fails", () => {
  const m = clone(COMPLETE) as any;
  m.framing.analysis_makes_the_call_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_NOT_SOUND");
  assert.equal(v.sections["framing_and_roles"], "fail");
});

test("test_criterion_not_set_before_data_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[1].set_before_data = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_NOT_SOUND");
  assert.equal(checkStatus(v, "every_criterion_set_before_data"), "fail");
  assert.deepEqual(v.criteria_not_set_before_data, ["reference_strength"]);
  assert.equal(v.criterion_set_before_data_coverage, "0.5000");
});

test("test_criterion_without_threshold_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[0].threshold_declared = false;
  const v = evaluate(m);
  assert.deepEqual(v.criteria_without_threshold, ["work_sample_score"]);
  assert.equal(v.criterion_threshold_coverage, "0.5000");
});

test("test_criterion_missing_threshold_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.criteria[0].threshold_declared;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_criterion_threshold_declared"), "missing");
});

test("test_default_action_not_a_declared_option_fails", () => {
  const m = clone(COMPLETE) as any;
  m.precommitment.default_action = "defer_forever";
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_NOT_SOUND");
  assert.equal(checkStatus(v, "default_action_matches_declared_option"), "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_default_action_missing_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.precommitment.default_action;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "default_action_matches_declared_option"), "missing");
  assert.equal(v.default_action, null);
});

test("test_data_seen_before_criteria_fails", () => {
  const m = clone(COMPLETE) as any;
  m.precommitment.data_seen_before_criteria_set_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_NOT_SOUND");
  assert.equal(v.sections["precommitment_before_data"], "fail");
});

test("test_negative_loss_cost_fails", () => {
  const m = clone(COMPLETE) as any;
  m.loss.cost_of_false_action = -5;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "loss_costs_both_directions_declared"), "fail");
});

test("test_loss_cost_missing_is_missing_and_ratio_null", () => {
  const m = clone(COMPLETE) as any;
  delete m.loss.cost_of_false_inaction;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "loss_costs_both_directions_declared"), "missing");
  assert.equal(v.loss_cost_ratio, null);
});

test("test_zero_inaction_cost_ratio_is_null_but_check_passes", () => {
  const m = clone(COMPLETE) as any;
  m.loss.cost_of_false_inaction = 0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "loss_costs_both_directions_declared"), "pass");
  assert.equal(v.loss_cost_ratio, null);
});

test("test_threshold_not_adjusted_when_asymmetric_fails", () => {
  const m = clone(COMPLETE) as any;
  m.loss.threshold_adjusted_for_asymmetric_costs = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_NOT_SOUND");
  assert.equal(checkStatus(v, "threshold_adjusted_when_costs_asymmetric"), "fail");
});

test("test_no_asymmetry_passes_threshold_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.loss.asymmetric_costs_declared = false;
  delete m.loss.threshold_adjusted_for_asymmetric_costs;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_SOUND");
  assert.equal(checkStatus(v, "threshold_adjusted_when_costs_asymmetric"), "pass");
});

test("test_irreversible_without_slowing_fails", () => {
  const m = clone(COMPLETE) as any;
  m.rigor.irreversible_declared = true;
  m.rigor.slowed_down_and_more_evidence_for_irreversible = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_NOT_SOUND");
  assert.equal(checkStatus(v, "slowed_down_when_irreversible"), "fail");
});

test("test_reversible_without_default_to_action_fails", () => {
  const m = clone(COMPLETE) as any;
  m.rigor.default_to_action_for_reversible = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "default_to_action_when_reversible"), "fail");
});

test("test_no_reversible_passes_default_to_action_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.rigor.reversible_declared = false;
  delete m.rigor.default_to_action_for_reversible;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_SOUND");
});

test("test_conclusion_from_inspiring_data_fails", () => {
  const m = clone(COMPLETE) as any;
  m.evidence.conclusion_drawn_from_inspiring_data_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_NOT_SOUND");
  assert.equal(v.sections["evidence_discipline_and_review"], "fail");
});

test("test_data_decoration_fails", () => {
  const m = clone(COMPLETE) as any;
  m.evidence.data_is_decoration_present = true;
  assert.equal(evaluate(m).verdict, "DECISION_PROCESS_NOT_SOUND");
});

test("test_hypothesis_missing_when_confirmatory", () => {
  const m = clone(COMPLETE) as any;
  delete m.evidence.hypothesis_preregistered;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "hypothesis_preregistered_when_confirmatory"), "missing");
});

test("test_no_confirmatory_passes_preregistration_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.evidence.confirmatory_analysis_used = false;
  delete m.evidence.hypothesis_preregistered;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_SOUND");
});

test("test_outcome_alone_judgment_fails", () => {
  const m = clone(COMPLETE) as any;
  m.review.outcome_used_alone_to_judge_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_PROCESS_NOT_SOUND");
  assert.equal(v.sections["evidence_discipline_and_review"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.review;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["evidence_discipline_and_review"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.options_count, null);
  assert.equal(v.options_without_name, null);
  assert.equal(v.option_name_coverage, null);
  assert.equal(v.criteria_count, null);
  assert.equal(v.loss_cost_ratio, null);
  assert.equal(v.default_action, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: DECISION_PROCESS_SOUND"));
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
  m.decision = 12345;
  assert.throws(() => evaluate(m), fieldError("decision"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ framing: "should-be-an-object" }),
    fieldError("framing"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ options: { name: "hire" } }),
    fieldError("options"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ options: ["hire"] }),
    fieldError("options[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.framing.decision_named = "yes";
  assert.throws(() => evaluate(m), fieldError("framing.decision_named"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.options[1].name = 42;
  assert.throws(() => evaluate(m), fieldError("options[1].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[0].set_before_data = "yes";
  assert.throws(() => evaluate(m), fieldError("criteria[0].set_before_data"));
});

test("malformed: number field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.loss.cost_of_false_action = "40000";
  assert.throws(() => evaluate(m), fieldError("loss.cost_of_false_action"));
});

test("malformed: number field as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.loss.cost_of_false_inaction = true;
  assert.throws(() => evaluate(m), fieldError("loss.cost_of_false_inaction"));
});

test("malformed: default action as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.precommitment.default_action = 7;
  assert.throws(() => evaluate(m), fieldError("precommitment.default_action"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.review = null;
  assert.throws(() => evaluate(m), fieldError("review"));
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
  .filter((f) => f.startsWith("decision-process-design--") && f.endsWith(".json"))
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
