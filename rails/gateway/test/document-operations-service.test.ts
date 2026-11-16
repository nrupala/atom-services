import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/document-operations-service.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The DOCUMENT_OPERATIONS_SOUND manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  operation: "board-pack-revision",
  source: { file_format_and_home_identified: true,
            authoritative_copy_opened: true,
            read_in_source_order: true },
  documents: [
    { name: "board-pack.pdf", output_reopened_and_checked: true },
    { name: "board-pack-summary.docx", output_reopened_and_checked: true },
  ],
  findings: [
    { name: "q3_cost_total", location: "page 12",
      quoted_exactly_before_interpretation: true },
    { name: "headcount_cell", location: "Sheet 'Costs' cell B14",
      quoted_exactly_before_interpretation: true },
  ],
  extraction: { every_number_has_source_location: true,
                numbers_quoted_exactly_then_interpreted_separately: true,
                figure_quoted_without_location_present: false,
                unreadable_or_missing_sections_named: true },
  editing: { edits_performed: true,
             edits_on_editable_source: true,
             headings_tables_styles_preserved: true,
             rewrite_requested: false,
             tracked_structure_intact: true },
  preservation: {
    editable_source_saved_alongside_output: true,
    revisable_deliverable_present: true,
    editable_source_kept_for_revisable: true,
    only_editable_source_overwritten_with_flattened_export_present: false },
  conversion: { conversion_performed: true,
                output_reopened_and_compared_section_by_section: true,
                headings_tables_lists_figures_totals_survive: true,
                content_loss_detected: true,
                loss_fixed_or_reported_plainly: true,
                conversion_with_dropped_content_shipped_present: false },
  verification: {
    output_reopened_and_checked_after_edit_or_conversion: true,
    headings_tables_totals_match_source_and_output: true },
  deliverable: { shared_externally: true,
                 send_copy_is_docx_not_markdown: true,
                 markdown_sent_as_external_deliverable_present: false,
                 draft_banners_comments_tracked_changes_stripped: true,
                 send_copy_contains_draft_marks_present: false },
  delivery: { findings_first_in_decision_order_with_locations: true,
              change_list_provided: true,
              finished_file_in_send_format_plus_editable_source: true,
              loss_gap_unreadable_stated_in_delivery_note: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 31 Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 32);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.documents_count, 2);
  assert.deepEqual(v.documents_without_output_verification, []);
  assert.equal(v.output_verification_coverage, "1.0000");
  assert.equal(v.findings_count, 2);
  assert.deepEqual(v.findings_without_location, []);
  assert.equal(v.location_coverage, "1.0000");
  assert.deepEqual(v.findings_not_quoted_exactly_first, []);
  assert.equal(v.exact_quote_coverage, "1.0000");
});

test("test_stale_copy_fails_source_section", () => {
  const m = clone(COMPLETE) as any;
  m.source.authoritative_copy_opened = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
  assert.equal(v.sections["source_and_extraction"], "fail");
});

test("test_finding_without_location_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.findings[1].location = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
  assert.equal(checkStatus(v, "every_finding_has_location_recorded"), "fail");
  assert.deepEqual(v.findings_without_location, ["headcount_cell"]);
  assert.equal(v.location_coverage, "0.5000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_finding_missing_location_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.findings[0].location;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_finding_has_location_recorded"), "missing");
  assert.deepEqual(v.findings_without_location, ["q3_cost_total"]);
});

test("test_finding_not_quoted_exactly_fails", () => {
  const m = clone(COMPLETE) as any;
  m.findings[0].quoted_exactly_before_interpretation = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
  assert.deepEqual(v.findings_not_quoted_exactly_first, ["q3_cost_total"]);
  assert.equal(v.exact_quote_coverage, "0.5000");
});

test("test_empty_findings_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.findings = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "findings_declared"), "fail");
  assert.equal(v.findings_count, 0);
  assert.equal(v.location_coverage, null);
});

test("test_empty_documents_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.documents = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "documents_declared"), "fail");
  assert.equal(v.documents_count, 0);
  assert.equal(v.output_verification_coverage, null);
});

test("test_figure_quoted_without_location_fails", () => {
  const m = clone(COMPLETE) as any;
  m.extraction.figure_quoted_without_location_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
  assert.equal(v.sections["source_and_extraction"], "fail");
});

test("test_unreadable_sections_not_named_fails", () => {
  const m = clone(COMPLETE) as any;
  m.extraction.unreadable_or_missing_sections_named = false;
  assert.equal(evaluate(m).verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
});

test("test_document_output_not_verified_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.documents[1].output_reopened_and_checked = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
  assert.deepEqual(v.documents_without_output_verification, ["board-pack-summary.docx"]);
  assert.equal(v.output_verification_coverage, "0.5000");
});

test("test_tracked_structure_broken_without_rewrite_request_fails", () => {
  const m = clone(COMPLETE) as any;
  m.editing.tracked_structure_intact = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
  assert.equal(checkStatus(v, "tracked_structure_intact_unless_rewrite_requested"), "fail");
});

test("test_rewrite_requested_passes_tracked_structure_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.editing.rewrite_requested = true;
  delete m.editing.tracked_structure_intact;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_SOUND");
  assert.equal(checkStatus(v, "tracked_structure_intact_unless_rewrite_requested"), "pass");
});

test("test_tracked_structure_missing_without_rewrite_request", () => {
  const m = clone(COMPLETE) as any;
  delete m.editing.tracked_structure_intact;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "tracked_structure_intact_unless_rewrite_requested"), "missing");
});

test("test_flattened_export_overwrite_fails", () => {
  const m = clone(COMPLETE) as any;
  m.preservation.only_editable_source_overwritten_with_flattened_export_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
  assert.equal(v.sections["editing_and_preservation"], "fail");
});

test("test_no_revisable_deliverable_passes_kept_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.preservation.revisable_deliverable_present = false;
  delete m.preservation.editable_source_kept_for_revisable;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_SOUND");
});

test("test_revisable_source_not_kept_fails", () => {
  const m = clone(COMPLETE) as any;
  m.preservation.editable_source_kept_for_revisable = false;
  assert.equal(evaluate(m).verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
});

test("test_no_conversion_passes_conversion_checks_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.conversion.conversion_performed = false;
  m.conversion.content_loss_detected = false;
  delete m.conversion.output_reopened_and_compared_section_by_section;
  delete m.conversion.headings_tables_lists_figures_totals_survive;
  delete m.conversion.loss_fixed_or_reported_plainly;
  delete m.conversion.conversion_with_dropped_content_shipped_present;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_SOUND");
  assert.equal(checkStatus(v, "conversion_output_reopened_and_compared_when_converted"), "pass");
  assert.equal(checkStatus(v, "no_conversion_with_dropped_content_shipped"), "pass");
});

test("test_conversion_loss_not_reported_fails", () => {
  const m = clone(COMPLETE) as any;
  m.conversion.loss_fixed_or_reported_plainly = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
  assert.equal(checkStatus(v, "conversion_loss_fixed_or_reported_when_detected"), "fail");
});

test("test_no_loss_detected_passes_loss_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.conversion.content_loss_detected = false;
  delete m.conversion.loss_fixed_or_reported_plainly;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_SOUND");
});

test("test_dropped_content_shipped_fails", () => {
  const m = clone(COMPLETE) as any;
  m.conversion.conversion_with_dropped_content_shipped_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
  assert.equal(v.sections["conversion_and_verification"], "fail");
});

test("test_conversion_content_not_surviving_fails", () => {
  const m = clone(COMPLETE) as any;
  m.conversion.headings_tables_lists_figures_totals_survive = false;
  assert.equal(evaluate(m).verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
});

test("test_markdown_sent_externally_fails", () => {
  const m = clone(COMPLETE) as any;
  m.deliverable.markdown_sent_as_external_deliverable_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
  assert.equal(v.sections["delivery_and_hygiene"], "fail");
});

test("test_not_shared_passes_format_checks_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.deliverable.shared_externally = false;
  delete m.deliverable.send_copy_is_docx_not_markdown;
  delete m.deliverable.markdown_sent_as_external_deliverable_present;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_SOUND");
});

test("test_send_copy_with_draft_marks_fails", () => {
  const m = clone(COMPLETE) as any;
  m.deliverable.send_copy_contains_draft_marks_present = true;
  assert.equal(evaluate(m).verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
});

test("test_no_edits_passes_change_list_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.editing.edits_performed = false;
  delete m.delivery.change_list_provided;
  const v = evaluate(m);
  assert.equal(v.verdict, "DOCUMENT_OPERATIONS_SOUND");
  assert.equal(checkStatus(v, "change_list_provided_when_edits_performed"), "pass");
});

test("test_edits_without_change_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.delivery.change_list_provided = false;
  assert.equal(evaluate(m).verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
});

test("test_loss_not_stated_in_delivery_note_fails", () => {
  const m = clone(COMPLETE) as any;
  m.delivery.loss_gap_unreadable_stated_in_delivery_note = false;
  assert.equal(evaluate(m).verdict, "DOCUMENT_OPERATIONS_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.delivery;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["delivery_and_hygiene"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.documents_count, null);
  assert.equal(v.findings_without_location, null);
  assert.equal(v.location_coverage, null);
  assert.equal(v.exact_quote_coverage, null);
  assert.equal(v.output_verification_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: DOCUMENT_OPERATIONS_SOUND"));
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
  m.operation = 12345;
  assert.throws(() => evaluate(m), fieldError("operation"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ extraction: "should-be-an-object" }),
    fieldError("extraction"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ findings: { name: "q3_cost_total" } }),
    fieldError("findings"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ findings: ["q3_cost_total"] }),
    fieldError("findings[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.source.authoritative_copy_opened = "yes";
  assert.throws(() => evaluate(m), fieldError("source.authoritative_copy_opened"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.findings[1].location = 42;
  assert.throws(() => evaluate(m), fieldError("findings[1].location"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.documents[0].output_reopened_and_checked = "yes";
  assert.throws(() => evaluate(m), fieldError("documents[0].output_reopened_and_checked"));
});

test("malformed: gate field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.conversion.conversion_performed = "yes";
  assert.throws(() => evaluate(m), fieldError("conversion.conversion_performed"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.delivery = null;
  assert.throws(() => evaluate(m), fieldError("delivery"));
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
  .filter((f) => f.startsWith("document-operations-service--") && f.endsWith(".json"))
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
