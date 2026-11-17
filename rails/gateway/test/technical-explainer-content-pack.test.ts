import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/technical-explainer-content-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  explainer_title: "how-a-transformer-works",
  audience: { defined: true, reader_outcome_stated: true,
              prior_knowledge_assumption_stated: true, prior_knowledge_assumed: true },
  prerequisites: [
    { prerequisite_id: "pre-1", description: "Basic voltage idea" },
    { prerequisite_id: "pre-2", description: "What a coil is" },
  ],
  learning_objective_framing: { outcomes_stated_as_do_or_say: true },
  learning_objectives: [
    { objective_id: "obj-1", outcome: "Say why voltage changes across a transformer" },
    { objective_id: "obj-2", outcome: "Do a turns-ratio calculation" },
  ],
  structure: { follows_spine_order: true, single_core_idea_confirmed: true,
               second_core_idea_present: true, second_core_idea_split_off: true },
  explanation_sections: [
    { section_id: "sec-1", spine_stage: "question", objective_id: "obj-1" },
    { section_id: "sec-2", spine_stage: "why_it_matters", objective_id: "obj-1" },
    { section_id: "sec-3", spine_stage: "core_idea", objective_id: "obj-1" },
    { section_id: "sec-4", spine_stage: "how_it_works", objective_id: "obj-2" },
    { section_id: "sec-5", spine_stage: "where_it_breaks", objective_id: "obj-2" },
    { section_id: "sec-6", spine_stage: "what_to_watch", objective_id: "obj-2" },
  ],
  simplification: { language_simplified_not_facts: true,
                    simplifications_flagged_explicitly: true,
                    units_preserved_correct: true,
                    orders_of_magnitude_preserved_correct: true,
                    directions_preserved_correct: true,
                    jargon_defined_on_first_use: true,
                    reading_level_appropriate_for_audience: true },
  analogy: { analogy_used: true, single_analogy_confirmed: true, failure_mode_stated: true },
  example_work: { worked_mini_examples_included: true, concrete_numbers_included: true,
                  concrete_cases_included: true, visuals_included_where_they_carry_weight: true },
  worked_examples: [
    { example_id: "ex-1", objective_id: "obj-2", source_id: "src-1", steps_declared_complete: true },
    { example_id: "ex-2", objective_id: "obj-1", source_id: "src-2", steps_declared_complete: true },
  ],
  misconceptions: [
    { misconception_id: "mis-1", description: "Transformers create energy", addressed_section_id: "sec-5" },
  ],
  accuracy: { accuracy_review_done: true, every_factual_claim_labeled: true, every_factual_claim_sourced: true },
  sources: [
    { source_id: "src-1", citation: "IEEE guide, citation recorded", archived: true },
    { source_id: "src-2", citation: "Manufacturer datasheet, dated", archived: true },
  ],
  safety: { safety_relevant_topic: true, expert_review_by_qualified_person: true,
            defers_to_licensed_practice_note_included: true },
  canonical: { canonical_explainer_identified: true,
               renderings_regenerated_from_canonical_after_updates: true },
  renderings: [
    { rendering_id: "ren-1", rendering_kind: "faq", derived_from_canonical_source: true },
    { rendering_id: "ren-2", rendering_kind: "video_script", derived_from_canonical_source: true },
  ],
  corrections: { corrections_dated: true, corrections_visible: true, corrections_logged: true },
  red_lines: { invented_numbers_or_figures_present: false,
               unsupported_studies_show_claim_present: false,
               fear_mongering_or_hype_present: false,
               teaching_beyond_declared_competence_present: false,
               unlicensed_practice_encouraged_present: false },
};

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "EXPLAINER_CONTENT_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 63);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.technical_explainer_learning_objectives_count, 2);
  assert.equal(v.technical_explainer_explanation_sections_count, 6);
  assert.equal(v.spine_stage_coverage_ratio, "1.000000");
  assert.equal(v.objective_section_coverage_ratio, "1.000000");
  assert.equal(v.worked_example_traceability_ratio, "1.000000");
  assert.equal(v.accuracy_source_archive_ratio, "1.000000");
  assert.equal(v.misconception_resolution_ratio, "1.000000");
  assert.equal(v.rendering_derivation_ratio, "1.000000");
  assert.deepEqual(v.technical_explainer_missing_spine_stages, []);
});

test("test_audience_not_defined_fails_section1", () => {
  const m = clone(COMPLETE) as any; m.audience.defined = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "EXPLAINER_CONTENT_NOT_SOUND");
  assert.equal(v.sections["audience_and_prerequisites"], "fail");
  assert.equal(checkStatus(v, "technical_explainer_audience_defined"), "fail");
});

test("test_no_prior_knowledge_passes_prereq_gate", () => {
  const m = clone(COMPLETE) as any; m.audience.prior_knowledge_assumed = false; m.prerequisites = [];
  assert.equal(checkStatus(evaluate(m), "technical_explainer_prerequisites_listed_where_prior_knowledge_assumed"), "pass");
});

test("test_prior_knowledge_without_prereqs_fails", () => {
  const m = clone(COMPLETE) as any; m.prerequisites = [];
  assert.equal(checkStatus(evaluate(m), "technical_explainer_prerequisites_listed_where_prior_knowledge_assumed"), "fail");
});

test("test_duplicate_objective_id_fails", () => {
  const m = clone(COMPLETE) as any; m.learning_objectives[1].objective_id = "obj-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_explainer_learning_objective_id_unique"), "fail");
  assert.deepEqual(v.duplicate_technical_explainer_learning_objective_ids, ["obj-1"]);
});

test("test_empty_objective_outcome_fails", () => {
  const m = clone(COMPLETE) as any; m.learning_objectives[0].outcome = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_explainer_learning_objective_outcome_declared"), "fail");
  assert.deepEqual(v.technical_explainer_learning_objectives_without_outcome, ["obj-1"]);
});

test("test_missing_spine_stage_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any; m.explanation_sections[5].spine_stage = "core_idea";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "technical_explainer_all_spine_stages_declared_present"), "fail");
  assert.deepEqual(v.technical_explainer_missing_spine_stages, ["what_to_watch"]);
  assert.equal(v.spine_stage_coverage_ratio, "0.833333");
});

test("test_invalid_spine_stage_fails", () => {
  const m = clone(COMPLETE) as any; m.explanation_sections[0].spine_stage = "intro";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_explainer_explanation_section_spine_stage_recognised"), "fail");
  assert.deepEqual(v.technical_explainer_explanation_sections_with_invalid_spine_stage, ["sec-1"]);
});

test("test_section_unknown_objective_fails", () => {
  const m = clone(COMPLETE) as any; m.explanation_sections[0].objective_id = "obj-99";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_explainer_explanation_section_objective_reference_resolves"), "fail");
  assert.deepEqual(v.technical_explainer_explanation_sections_with_unknown_objective_reference, ["sec-1"]);
});

test("test_second_idea_not_split_fails_gated", () => {
  const m = clone(COMPLETE) as any; m.structure.second_core_idea_split_off = false;
  assert.equal(checkStatus(evaluate(m), "technical_explainer_second_core_idea_split_off_where_present"), "fail");
});

test("test_no_second_idea_passes_gated", () => {
  const m = clone(COMPLETE) as any; m.structure.second_core_idea_present = false; m.structure.second_core_idea_split_off = false;
  assert.equal(checkStatus(evaluate(m), "technical_explainer_second_core_idea_split_off_where_present"), "pass");
});

test("test_analogy_without_failure_mode_fails", () => {
  const m = clone(COMPLETE) as any; m.analogy.failure_mode_stated = false;
  assert.equal(checkStatus(evaluate(m), "technical_explainer_analogy_failure_mode_stated_where_analogy_used"), "fail");
});

test("test_no_analogy_passes_gated", () => {
  const m = clone(COMPLETE) as any; m.analogy.analogy_used = false; m.analogy.failure_mode_stated = false; m.analogy.single_analogy_confirmed = false;
  assert.equal(evaluate(m).verdict, "EXPLAINER_CONTENT_SOUND");
});

test("test_example_unknown_source_fails", () => {
  const m = clone(COMPLETE) as any; m.worked_examples[0].source_id = "src-99";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_explainer_worked_example_source_reference_resolves"), "fail");
  assert.deepEqual(v.technical_explainer_worked_examples_with_unknown_source_reference, ["ex-1"]);
  assert.equal(v.worked_example_traceability_ratio, "0.500000");
});

test("test_example_incomplete_steps_fails", () => {
  const m = clone(COMPLETE) as any; m.worked_examples[1].steps_declared_complete = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_explainer_worked_example_steps_declared_complete"), "fail");
  assert.deepEqual(v.technical_explainer_worked_examples_without_complete_steps, ["ex-2"]);
});

test("test_source_not_archived_fails", () => {
  const m = clone(COMPLETE) as any; m.sources[0].archived = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_explainer_accuracy_source_archived"), "fail");
  assert.deepEqual(v.technical_explainer_accuracy_sources_not_archived, ["src-1"]);
});

test("test_misconception_unknown_section_fails", () => {
  const m = clone(COMPLETE) as any; m.misconceptions[0].addressed_section_id = "sec-99";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_explainer_misconception_addressed_section_reference_resolves"), "fail");
  assert.deepEqual(v.technical_explainer_misconceptions_with_unknown_addressed_section, ["mis-1"]);
  assert.equal(v.misconception_resolution_ratio, "0.000000");
});

test("test_safety_without_expert_review_fails", () => {
  const m = clone(COMPLETE) as any; m.safety.expert_review_by_qualified_person = false;
  assert.equal(checkStatus(evaluate(m), "technical_explainer_safety_expert_review_where_safety_relevant"), "fail");
});

test("test_not_safety_relevant_passes_gates", () => {
  const m = clone(COMPLETE) as any; m.safety.safety_relevant_topic = false; m.safety.expert_review_by_qualified_person = false; m.safety.defers_to_licensed_practice_note_included = false;
  assert.equal(evaluate(m).verdict, "EXPLAINER_CONTENT_SOUND");
});

test("test_rendering_invalid_kind_fails", () => {
  const m = clone(COMPLETE) as any; m.renderings[0].rendering_kind = "podcast";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_explainer_rendering_kind_recognised"), "fail");
  assert.deepEqual(v.technical_explainer_renderings_with_invalid_kind, ["ren-1"]);
});

test("test_rendering_not_derived_fails", () => {
  const m = clone(COMPLETE) as any; m.renderings[1].derived_from_canonical_source = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_explainer_rendering_derived_from_canonical_source"), "fail");
  assert.deepEqual(v.technical_explainer_renderings_not_derived_from_canonical, ["ren-2"]);
});

test("test_invented_numbers_fail_red_lines", () => {
  const m = clone(COMPLETE) as any; m.red_lines.invented_numbers_or_figures_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "EXPLAINER_CONTENT_NOT_SOUND");
});

test("test_unlicensed_practice_fails_red_lines", () => {
  const m = clone(COMPLETE) as any; m.red_lines.unlicensed_practice_encouraged_present = true;
  assert.equal(checkStatus(evaluate(m), "technical_explainer_free_of_unlicensed_practice_encouragement"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any; delete m.simplification;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["simplification_and_analogy_integrity"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.technical_explainer_accuracy_sources_count, null);
  assert.equal(v.spine_stage_coverage_ratio, null);
});

test("test_absent_objectives_list_is_missing", () => {
  const m = clone(COMPLETE) as any; delete m.learning_objectives;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "technical_explainer_learning_objectives_list_declared"), "missing");
  assert.equal(v.computed_status, null);
});

test("test_empty_sources_list_fails", () => {
  const m = clone(COMPLETE) as any; m.sources = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "technical_explainer_accuracy_sources_list_declared"), "fail");
  assert.equal(v.technical_explainer_accuracy_sources_count, 0);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: EXPLAINER_CONTENT_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) => err instanceof TypeError && (err as Error).message === "manifest must be a JSON object",
  );
});

function fieldError(field: string) {
  return (err: unknown) => err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any; m.explainer_title = 12345;
  assert.throws(() => evaluate(m), fieldError("explainer_title"));
});
test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ audience: "x" }), fieldError("audience"));
});
test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ sources: { source_id: "src-1" } }), fieldError("sources"));
});
test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ learning_objectives: ["obj-1"] }), fieldError("learning_objectives[0]"));
});
test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any; m.simplification.jargon_defined_on_first_use = "yes";
  assert.throws(() => evaluate(m), fieldError("simplification.jargon_defined_on_first_use"));
});
test("malformed: nested list entry bool field rejected", () => {
  const m = clone(COMPLETE) as any; m.sources[0].archived = "true";
  assert.throws(() => evaluate(m), fieldError("sources[0].archived"));
});
test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any; m.safety = null;
  assert.throws(() => evaluate(m), fieldError("safety"));
});

// ---- Golden-fixture parity against the Python oracle ----

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "fixtures",
);

interface Fixture { name: string; manifest: unknown; expected: unknown; }

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.startsWith("technical-explainer-content-pack--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(readFileSync(path.join(fixturesDir, file), "utf-8")) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
