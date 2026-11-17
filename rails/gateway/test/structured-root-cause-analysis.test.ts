import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/structured-root-cause-analysis.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  analysis_title: "pump-trip-2026-11-02",
  problem: { problem_statement_stated: true,
             inference_type_classified: true,
             scope_boundary_stated: true,
             trigger_distinguished_from_root_cause: true,
             controllable_cause_targeted: true },
  decomposition: { mece_decomposition_declared: true,
                   hypothesis_tree_declared: true,
                   branches_ranked_by_likelihood_and_test_cost: true },
  timeline_events: [
    { event_id: "ev-1", sequence_number: 1 },
    { event_id: "ev-2", sequence_number: 2 },
    { event_id: "ev-3", sequence_number: 5 },
  ],
  factors: [
    { factor_id: "f-equipment", category: "equipment",
      evidence_tier: "measurement" },
    { factor_id: "f-process", category: "process",
      evidence_tier: "log" },
    { factor_id: "f-people", category: "people",
      evidence_tier: "report" },
  ],
  causal_chain: [
    { link_id: "why-1", depth: 1, factor_id: "f-equipment" },
    { link_id: "why-2", depth: 2, factor_id: "f-process" },
    { link_id: "why-3", depth: 3, factor_id: "f-process" },
  ],
  evidence: { evidence_tiers_applied: true,
              base_rates_considered_first: true,
              evidence_update_stated: true,
              magnitudes_and_ranges_quantified: true,
              units_and_assumptions_stated: true },
  verification: { root_cause_verified_by_revert_or_test: true,
                  counterfactual_test_recorded: true,
                  strongest_counterargument_stated: true,
                  contradicting_data_named: true,
                  revision_conditions_stated: true },
  conclusion: { conclusion_confidence_and_basis_stated: true },
  corrective_actions: [
    { action_id: "act-1", factor_id: "f-process" },
    { action_id: "act-2", factor_id: "f-equipment" },
  ],
  red_lines: { unverified_single_source_conclusion_present: false,
               post_hoc_storytelling_present: false,
               plausible_presented_as_proven_present: false,
               cause_asserted_without_declared_evidence_present: false,
               person_blame_as_root_cause_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "ROOT_CAUSE_ANALYSIS_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 38);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.timeline_events_count, 3);
  assert.equal(v.factor_rows_count, 3);
  assert.equal(v.causal_chain_links_count, 3);
  assert.equal(v.corrective_action_rows_count, 2);
  assert.deepEqual(v.duplicate_timeline_event_ids, []);
  assert.deepEqual(v.duplicate_factor_ids, []);
  assert.deepEqual(v.duplicate_causal_chain_link_ids, []);
  assert.deepEqual(v.duplicate_corrective_action_ids, []);
  assert.deepEqual(v.factors_without_category, []);
  assert.deepEqual(v.factors_missing_evidence_tier, []);
  assert.deepEqual(v.factors_with_unrecognised_evidence_tier, []);
  assert.deepEqual(v.causal_chain_links_with_unreferenced_factor, []);
  assert.deepEqual(v.corrective_actions_with_unreferenced_factor, []);
  assert.equal(v.fishbone_categories_declared_count, 3);
  assert.equal(v.factor_category_coverage_ratio, "1.000000");
  assert.equal(v.factor_evidence_tier_ratio, "1.000000");
  assert.equal(v.causal_chain_reference_ratio, "1.000000");
  assert.equal(v.corrective_action_reference_ratio, "1.000000");
});

test("test_problem_not_stated_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.problem.problem_statement_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ROOT_CAUSE_ANALYSIS_NOT_SOUND");
  assert.equal(v.sections["problem_framing_and_inference"], "fail");
  assert.equal(checkStatus(v, "rca_problem_statement_stated"), "fail");
});

test("test_trigger_conflated_with_root_fails", () => {
  const m = clone(COMPLETE) as any;
  m.problem.trigger_distinguished_from_root_cause = false;
  assert.equal(checkStatus(evaluate(m), "rca_trigger_distinguished_from_root"), "fail");
});

test("test_timeline_running_backwards_fails", () => {
  const m = clone(COMPLETE) as any;
  m.timeline_events[2].sequence_number = 2;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "rca_timeline_sequence_strictly_increasing"), "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_timeline_equal_sequence_fails_strictly_increasing", () => {
  const m = clone(COMPLETE) as any;
  m.timeline_events[1].sequence_number = 1;
  assert.equal(checkStatus(evaluate(m), "rca_timeline_sequence_strictly_increasing"), "fail");
});

test("test_duplicate_timeline_event_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.timeline_events[2].event_id = "ev-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rca_timeline_event_id_unique"), "fail");
  assert.deepEqual(v.duplicate_timeline_event_ids, ["ev-1"]);
});

test("test_timeline_event_missing_sequence_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.timeline_events[1].sequence_number;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "rca_timeline_sequence_strictly_increasing"), "missing");
});

test("test_absent_timeline_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.timeline_events;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "rca_timeline_events_list_declared"), "missing");
  assert.equal(v.timeline_events_count, null);
  assert.equal(v.duplicate_timeline_event_ids, null);
});

test("test_empty_factors_list_fails_factors_declared", () => {
  const m = clone(COMPLETE) as any;
  m.factors = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "ROOT_CAUSE_ANALYSIS_NOT_SOUND");
  assert.equal(checkStatus(v, "rca_factor_rows_list_declared"), "fail");
  assert.equal(v.factor_rows_count, 0);
  assert.equal(v.factor_category_coverage_ratio, null);
  assert.equal(v.factor_evidence_tier_ratio, null);
  assert.equal(v.causal_chain_reference_ratio, "0.000000");
  assert.equal(checkStatus(v, "every_rca_causal_chain_link_factor_referenced"), "fail");
});

test("test_duplicate_factor_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.factors[2].factor_id = "f-process";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rca_factor_id_unique"), "fail");
  assert.deepEqual(v.duplicate_factor_ids, ["f-process"]);
});

test("test_factor_without_category_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.factors[1].category = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rca_factor_category_declared"), "fail");
  assert.deepEqual(v.factors_without_category, ["f-process"]);
  assert.equal(v.factor_category_coverage_ratio, "0.666667");
  assert.equal(v.fishbone_categories_declared_count, 2);
});

test("test_factor_missing_category_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.factors[0].category;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_rca_factor_category_declared"), "missing");
  assert.deepEqual(v.factors_without_category, ["f-equipment"]);
});

test("test_unrecognised_evidence_tier_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.factors[0].evidence_tier = "rumour";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rca_factor_evidence_tier_recognised"), "fail");
  assert.deepEqual(v.factors_with_unrecognised_evidence_tier, ["f-equipment"]);
  assert.equal(v.factor_evidence_tier_ratio, "0.666667");
});

test("test_opinion_tier_is_recognised", () => {
  const m = clone(COMPLETE) as any;
  m.factors[2].evidence_tier = "opinion";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rca_factor_evidence_tier_recognised"), "pass");
  assert.equal(v.verdict, "ROOT_CAUSE_ANALYSIS_SOUND");
});

test("test_factor_missing_tier_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.factors[2].evidence_tier;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.deepEqual(v.factors_missing_evidence_tier, ["f-people"]);
});

test("test_chain_depth_skip_fails", () => {
  const m = clone(COMPLETE) as any;
  m.causal_chain[2].depth = 4;
  assert.equal(checkStatus(evaluate(m), "rca_causal_chain_depths_consecutive_from_one"), "fail");
});

test("test_chain_depth_not_starting_at_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.causal_chain.forEach((link: any, i: number) => { link.depth = i + 2; });
  assert.equal(checkStatus(evaluate(m), "rca_causal_chain_depths_consecutive_from_one"), "fail");
});

test("test_chain_link_unreferenced_factor_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.causal_chain[1].factor_id = "f-ghost";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rca_causal_chain_link_factor_referenced"), "fail");
  assert.deepEqual(v.causal_chain_links_with_unreferenced_factor, ["why-2"]);
  assert.equal(v.causal_chain_reference_ratio, "0.666667");
});

test("test_chain_link_missing_factor_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.causal_chain[0].factor_id;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_rca_causal_chain_link_factor_referenced"), "missing");
  assert.deepEqual(v.causal_chain_links_with_unreferenced_factor, []);
});

test("test_absent_factors_make_reference_checks_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.factors;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_rca_causal_chain_link_factor_referenced"), "missing");
  assert.equal(v.causal_chain_links_with_unreferenced_factor, null);
  assert.equal(v.causal_chain_reference_ratio, null);
  assert.equal(v.fishbone_categories_declared_count, null);
});

test("test_duplicate_chain_link_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.causal_chain[2].link_id = "why-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rca_causal_chain_link_id_unique"), "fail");
  assert.deepEqual(v.duplicate_causal_chain_link_ids, ["why-1"]);
});

test("test_action_unreferenced_factor_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.corrective_actions[0].factor_id = "f-ghost";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rca_corrective_action_factor_referenced"), "fail");
  assert.deepEqual(v.corrective_actions_with_unreferenced_factor, ["act-1"]);
  assert.equal(v.corrective_action_reference_ratio, "0.500000");
});

test("test_duplicate_action_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.corrective_actions[1].action_id = "act-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rca_corrective_action_id_unique"), "fail");
  assert.deepEqual(v.duplicate_corrective_action_ids, ["act-1"]);
});

test("test_empty_actions_list_fails_actions_declared", () => {
  const m = clone(COMPLETE) as any;
  m.corrective_actions = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "rca_corrective_action_rows_list_declared"), "fail");
  assert.equal(v.corrective_action_rows_count, 0);
  assert.equal(v.corrective_action_reference_ratio, null);
});

test("test_base_rates_skipped_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.evidence.base_rates_considered_first = false;
  const v = evaluate(m);
  assert.equal(v.sections["evidence_and_quantification"], "fail");
  assert.equal(checkStatus(v, "rca_base_rates_considered_first"), "fail");
});

test("test_unverified_root_cause_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.verification.root_cause_verified_by_revert_or_test = false;
  const v = evaluate(m);
  assert.equal(v.sections["verification_falsification_and_conclusion"], "fail");
  assert.equal(checkStatus(v, "rca_root_cause_verified_by_revert_or_test"), "fail");
});

test("test_no_counterargument_fails", () => {
  const m = clone(COMPLETE) as any;
  m.verification.strongest_counterargument_stated = false;
  assert.equal(checkStatus(evaluate(m), "rca_strongest_counterargument_stated"), "fail");
});

test("test_single_source_conclusion_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unverified_single_source_conclusion_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "rca_free_of_unverified_single_source_conclusion"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "ROOT_CAUSE_ANALYSIS_NOT_SOUND");
});

test("test_post_hoc_storytelling_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.post_hoc_storytelling_present = true;
  assert.equal(checkStatus(evaluate(m), "rca_free_of_post_hoc_storytelling"), "fail");
});

test("test_person_blame_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.person_blame_as_root_cause_present = true;
  assert.equal(checkStatus(evaluate(m), "rca_free_of_person_blame_as_root_cause"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.evidence;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["evidence_and_quantification"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.timeline_events_count, null);
  assert.equal(v.factor_rows_count, null);
  assert.equal(v.causal_chain_links_count, null);
  assert.equal(v.corrective_action_rows_count, null);
  assert.equal(v.duplicate_factor_ids, null);
  assert.equal(v.factors_without_category, null);
  assert.equal(v.causal_chain_links_with_unreferenced_factor, null);
  assert.equal(v.fishbone_categories_declared_count, null);
  assert.equal(v.factor_evidence_tier_ratio, null);
  assert.equal(v.causal_chain_reference_ratio, null);
  assert.equal(v.corrective_action_reference_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: ROOT_CAUSE_ANALYSIS_SOUND"));
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
  m.analysis_title = 12345;
  assert.throws(() => evaluate(m), fieldError("analysis_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ problem: "should-be-an-object" }), fieldError("problem"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ factors: { factor_id: "f-1" } }), fieldError("factors"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ factors: ["f-1"] }), fieldError("factors[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.evidence.base_rates_considered_first = "yes";
  assert.throws(() => evaluate(m), fieldError("evidence.base_rates_considered_first"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.causal_chain[0].depth = "1";
  assert.throws(() => evaluate(m), fieldError("causal_chain[0].depth"));
});

test("malformed: number leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.timeline_events[0].sequence_number = true;
  assert.throws(() => evaluate(m), fieldError("timeline_events[0].sequence_number"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.factors[1].evidence_tier = 42;
  assert.throws(() => evaluate(m), fieldError("factors[1].evidence_tier"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.verification = null;
  assert.throws(() => evaluate(m), fieldError("verification"));
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
  .filter((f) => f.startsWith("structured-root-cause-analysis--") && f.endsWith(".json"))
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
