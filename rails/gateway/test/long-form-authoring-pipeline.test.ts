import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/long-form-authoring-pipeline.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  work: "example-book",
  outline: { toc_approved_before_drafting: true,
             chapters_or_modules_defined: true,
             scope_fences_defined: true },
  units: [
    { name: "ch-1", point_or_outcome: "reader can frame the problem",
      has_single_point: true },
    { name: "ch-2", point_or_outcome: "reader can run the method",
      has_single_point: true },
    { name: "ch-3", point_or_outcome: "reader can check results",
      has_single_point: true },
  ],
  drafting: { small_units_used: true,
              examples_before_abstractions: true,
              style_sheet_maintained: true, glossary_maintained: true },
  review: { comments_triaged_not_blind_applied: true },
  review_passes: [
    { name: "pass-structure", pass_type: "structure", recorded: true },
    { name: "pass-technical", pass_type: "technical_accuracy", recorded: true },
    { name: "pass-style", pass_type: "style_read_aloud", recorded: true },
    { name: "pass-facts", pass_type: "facts_attribution", recorded: true },
  ],
  versioning: { sources_in_git_markdown: true,
                research_kept_separate_from_prose: true,
                editions_tagged: true, changelog_per_edition: true },
  builds: { deterministic_pipeline: true, templates_pinned: true,
            preview_builds_for_reviewers: true, artifacts_hashed: true,
            artifacts_signed: true },
  publishing: { distribution_channels_defined: true,
                metadata_or_platform_setup_complete: true,
                launch_checklist_completed: true,
                sample_and_errata_pages_published: true },
  feedback: { reader_learner_feedback_collected: true,
              corrections_list_maintained: true,
              corrections_feed_next_edition: true, errata_visible: true,
              drop_off_analytics_reviewed: true },
  red_lines: { published_without_accuracy_pass_present: false,
               silent_edition_edits_present: false,
               unverified_quotes_or_attributions_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "AUTHORING_PIPELINE_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 36);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.units_count, 3);
  assert.deepEqual(v.units_without_single_point, []);
  assert.equal(v.single_point_coverage, "1.000000");
  assert.deepEqual(v.units_without_point_or_outcome, []);
  assert.equal(v.point_or_outcome_coverage, "1.000000");
  assert.equal(v.review_passes_count, 4);
  assert.deepEqual(v.review_passes_without_record, []);
  assert.equal(v.recorded_review_pass_coverage, "1.000000");
  assert.deepEqual(v.review_passes_with_invalid_type, []);
  assert.equal(v.valid_review_pass_type_coverage, "1.000000");
  assert.deepEqual(v.missing_review_pass_types, []);
});

test("test_unapproved_outline_fails_outline_section", () => {
  const m = clone(COMPLETE) as any;
  m.outline.toc_approved_before_drafting = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUTHORING_PIPELINE_NOT_SOUND");
  assert.equal(v.sections["outline_as_contract"], "fail");
  assert.equal(checkStatus(v, "toc_approved_before_drafting"), "fail");
});

test("test_no_scope_fences_fails", () => {
  const m = clone(COMPLETE) as any;
  m.outline.scope_fences_defined = false;
  assert.equal(evaluate(m).verdict, "AUTHORING_PIPELINE_NOT_SOUND");
});

test("test_unit_without_single_point_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.units[0].has_single_point = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_unit_has_single_point"), "fail");
  assert.deepEqual(v.units_without_single_point, ["ch-1"]);
  assert.equal(v.single_point_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_unit_missing_single_point_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.units[0].has_single_point;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_unit_has_single_point"), "missing");
  assert.deepEqual(v.units_without_single_point, []);
});

test("test_unit_with_empty_outcome_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.units[1].point_or_outcome = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_unit_point_or_outcome_declared"), "fail");
  assert.deepEqual(v.units_without_point_or_outcome, ["ch-2"]);
  assert.equal(v.point_or_outcome_coverage, "0.666667");
});

test("test_unit_missing_outcome_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.units[1].point_or_outcome;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_unit_point_or_outcome_declared"), "missing");
  assert.deepEqual(v.units_without_point_or_outcome, []);
});

test("test_empty_units_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.units = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "units_declared"), "fail");
  assert.equal(v.units_count, 0);
  assert.equal(v.single_point_coverage, null);
  assert.equal(v.point_or_outcome_coverage, null);
  assert.deepEqual(v.units_without_single_point, []);
});

test("test_no_style_sheet_fails_drafting_section", () => {
  const m = clone(COMPLETE) as any;
  m.drafting.style_sheet_maintained = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUTHORING_PIPELINE_NOT_SOUND");
  assert.equal(v.sections["drafting_loop"], "fail");
});

test("test_blind_applied_comments_fail_review_section", () => {
  const m = clone(COMPLETE) as any;
  m.review.comments_triaged_not_blind_applied = false;
  assert.equal(evaluate(m).sections["review_passes"], "fail");
});

test("test_unrecorded_pass_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.review_passes[1].recorded = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_review_pass_recorded"), "fail");
  assert.deepEqual(v.review_passes_without_record, ["pass-technical"]);
  assert.equal(v.recorded_review_pass_coverage, "0.750000");
});

test("test_pass_missing_recorded_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.review_passes[1].recorded;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_review_pass_recorded"), "missing");
  assert.deepEqual(v.review_passes_without_record, []);
});

test("test_pass_with_invalid_type_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.review_passes[2].pass_type = "copyedit";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_review_pass_type_valid"), "fail");
  assert.deepEqual(v.review_passes_with_invalid_type, ["pass-style"]);
  assert.equal(v.valid_review_pass_type_coverage, "0.750000");
  assert.deepEqual(v.missing_review_pass_types, ["style_read_aloud"]);
});

test("test_missing_required_pass_type_fails", () => {
  const m = clone(COMPLETE) as any;
  m.review_passes.splice(3, 1);
  const v = evaluate(m);
  assert.equal(checkStatus(v, "all_required_review_pass_types_present"), "fail");
  assert.deepEqual(v.missing_review_pass_types, ["facts_attribution"]);
  assert.equal(v.review_passes_count, 3);
});

test("test_pass_missing_type_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.review_passes[0].pass_type;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_review_pass_type_valid"), "missing");
  assert.equal(checkStatus(v, "all_required_review_pass_types_present"), "missing");
  assert.deepEqual(v.review_passes_with_invalid_type, []);
});

test("test_empty_review_passes_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.review_passes = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "review_passes_declared"), "fail");
  assert.equal(v.review_passes_count, 0);
  assert.equal(v.recorded_review_pass_coverage, null);
  assert.equal(v.valid_review_pass_type_coverage, null);
  assert.deepEqual(v.missing_review_pass_types,
    ["structure", "technical_accuracy", "style_read_aloud", "facts_attribution"]);
});

test("test_research_mixed_with_prose_fails_versioning", () => {
  const m = clone(COMPLETE) as any;
  m.versioning.research_kept_separate_from_prose = false;
  assert.equal(evaluate(m).sections["versioning_and_builds"], "fail");
});

test("test_unsigned_artifacts_fail_builds", () => {
  const m = clone(COMPLETE) as any;
  m.builds.artifacts_signed = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "artifacts_signed"), "fail");
  assert.equal(v.sections["versioning_and_builds"], "fail");
});

test("test_no_changelog_fails_versioning", () => {
  const m = clone(COMPLETE) as any;
  m.versioning.changelog_per_edition = false;
  assert.equal(evaluate(m).verdict, "AUTHORING_PIPELINE_NOT_SOUND");
});

test("test_incomplete_metadata_fails_publishing", () => {
  const m = clone(COMPLETE) as any;
  m.publishing.metadata_or_platform_setup_complete = false;
  assert.equal(evaluate(m).sections["publishing"], "fail");
});

test("test_no_errata_pages_fails_publishing", () => {
  const m = clone(COMPLETE) as any;
  m.publishing.sample_and_errata_pages_published = false;
  assert.equal(evaluate(m).verdict, "AUTHORING_PIPELINE_NOT_SOUND");
});

test("test_hidden_errata_fails_feedback_section", () => {
  const m = clone(COMPLETE) as any;
  m.feedback.errata_visible = false;
  assert.equal(evaluate(m).sections["feedback_loop_and_red_lines"], "fail");
});

test("test_publishing_without_accuracy_pass_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.published_without_accuracy_pass_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_publishing_without_accuracy_pass"), "fail");
  assert.equal(v.sections["feedback_loop_and_red_lines"], "fail");
});

test("test_silent_edition_edits_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.silent_edition_edits_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_silent_edition_edits"), "fail");
  assert.equal(v.verdict, "AUTHORING_PIPELINE_NOT_SOUND");
});

test("test_unverified_quotes_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unverified_quotes_or_attributions_present = true;
  assert.equal(checkStatus(evaluate(m), "no_unverified_quotes_or_attributions"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.publishing;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["publishing"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.units_count, null);
  assert.equal(v.units_without_single_point, null);
  assert.equal(v.single_point_coverage, null);
  assert.equal(v.units_without_point_or_outcome, null);
  assert.equal(v.point_or_outcome_coverage, null);
  assert.equal(v.review_passes_count, null);
  assert.equal(v.review_passes_without_record, null);
  assert.equal(v.recorded_review_pass_coverage, null);
  assert.equal(v.review_passes_with_invalid_type, null);
  assert.equal(v.valid_review_pass_type_coverage, null);
  assert.equal(v.missing_review_pass_types, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: AUTHORING_PIPELINE_SOUND"));
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
  m.work = 12345;
  assert.throws(() => evaluate(m), fieldError("work"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ outline: "should-be-an-object" }), fieldError("outline"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ units: { name: "ch-1" } }), fieldError("units"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ units: ["ch-1"] }), fieldError("units[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.outline.toc_approved_before_drafting = "yes";
  assert.throws(() => evaluate(m), fieldError("outline.toc_approved_before_drafting"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.units[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("units[0].name"));
});

test("malformed: nested list entry pass_type as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.review_passes[1].pass_type = true;
  assert.throws(() => evaluate(m), fieldError("review_passes[1].pass_type"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.feedback = null;
  assert.throws(() => evaluate(m), fieldError("feedback"));
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
  .filter((f) => f.startsWith("long-form-authoring-pipeline--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    const actual = evaluate(fixture.manifest);
    assert.deepStrictEqual(actual, fixture.expected);
    // Byte-compare full JSON incl. stamp
    assert.equal(
      JSON.stringify(actual) + "\n" + stamp(actual as any),
      JSON.stringify(fixture.expected) + "\n" + stamp(fixture.expected as any),
    );
  });
}
