import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluate, stamp,
} from "../src/atoms/engineering-work-package-structuring.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The WORK_PACKAGE_STRUCTURED manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  package: "motor-replacement-wp1",
  definition: { objective_declared: true, scope_in_declared: true,
                scope_out_declared: true, standards_declared: true,
                site_rules_declared: true, interfaces_declared: true,
                budget_link_declared: true, schedule_declared: true,
                acceptance_criteria_declared: true,
                deliverables_list_agreed: true,
                deliverable_gaps_documented: false },
  deliverables: [
    { name: "motor-calc", kind: "calc package" },
    { name: "motor-datasheet", kind: "datasheet" },
    { name: "pump-drawing", kind: "drawing" },
  ],
  documents: [
    { name: "motor-calc", kind: "calc package",
      status: "For Construction", revision: "C",
      revision_reason_declared: true, revision_history_present: true,
      designer: "eng-a", checker: "eng-b",
      prepared_by: "eng-a", reviewed_by: "eng-b",
      approved_by: "eng-c",
      purpose_declared: true, inputs_declared: true,
      assumptions_declared: true, standards_cited_declared: true,
      units_declared: true, results_declared: true,
      check_signature_declared: true },
    { name: "motor-datasheet", kind: "datasheet",
      status: "For Review", revision: "A",
      revision_reason_declared: true, revision_history_present: true,
      designer: "eng-a", checker: "eng-b",
      prepared_by: "eng-a", reviewed_by: "eng-b",
      approved_by: "eng-c",
      purpose_declared: true, inputs_declared: true,
      assumptions_declared: true, standards_cited_declared: true,
      units_declared: true, results_declared: true,
      check_signature_declared: true },
    { name: "pump-drawing", kind: "drawing",
      status: "Draft", revision: "0",
      revision_reason_declared: true, revision_history_present: true,
      designer: "eng-d", checker: "eng-e",
      prepared_by: "eng-d", reviewed_by: "eng-e",
      approved_by: "eng-c",
      purpose_declared: true, inputs_declared: true,
      assumptions_declared: true, standards_cited_declared: true,
      units_declared: true, results_declared: true,
      check_signature_declared: true },
  ],
  document_control: {
    numbering_naming_convention_declared: true,
    status_flow_declared: true,
    unapproved_revision_used_for_construction_present: false,
    untraceable_changes_present: false,
    superseded_versions_deleted_present: false,
    uncontrolled_copies_present: false },
  check_discipline: { redline_backcheck_process_declared: true },
  transmittals: [
    { document: "motor-calc", recipient: "client", revision: "C",
      date: "2027-03-01", return_status_declared: true },
    { document: "motor-datasheet", recipient: "vendor",
      revision: "A", date: "2027-03-02",
      return_status_declared: true },
  ],
  transmittal_log: { log_current_declared: true,
                     verbal_issue_present: false },
  handover: { as_built_marked: true, om_references_declared: true,
              spares_list_declared: true,
              test_records_pointer_declared: true,
              training_notes_declared: true,
              closeout_checklist_signed: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 37 Python VerdictTests, ported ----

test("test_complete_manifest_is_structured", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "WORK_PACKAGE_STRUCTURED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 42);
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.deliverables_count, 3);
  assert.deepEqual(v.deliverables_with_invalid_kind, []);
  assert.equal(v.documents_count, 3);
  assert.deepEqual(v.documents_with_invalid_status, []);
  assert.deepEqual(v.documents_without_revision, []);
  assert.equal(v.signoff_coverage, "1.000000");
  assert.deepEqual(v.calculations_not_independently_checked, []);
  assert.equal(v.independent_check_coverage, "1.000000");
  assert.equal(v.transmittals_count, 2);
  assert.deepEqual(v.transmittals_with_unknown_document, []);
  assert.deepEqual(v.transmittals_with_revision_mismatch, []);
  assert.equal(v.transmittal_document_coverage, "1.000000");
});

test("test_objective_missing_is_insufficient", () => {
  const m = clone(COMPLETE) as any;
  delete m.definition.objective_declared;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["package_definition"],
    "insufficient_evidence");
});

test("test_scope_out_not_declared_fails", () => {
  const m = clone(COMPLETE) as any;
  m.definition.scope_out_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "WORK_PACKAGE_NOT_STRUCTURED");
  assert.equal(v.sections["package_definition"], "fail");
});

test("test_gaps_documented_satisfies_deliverables_gate", () => {
  const m = clone(COMPLETE) as any;
  m.definition.deliverables_list_agreed = false;
  m.definition.deliverable_gaps_documented = true;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "deliverables_agreed_or_gaps_documented"),
    "pass");
  assert.equal(v.verdict, "WORK_PACKAGE_STRUCTURED");
});

test("test_deliverables_not_agreed_and_gaps_undocumented_fails", () => {
  const m = clone(COMPLETE) as any;
  m.definition.deliverables_list_agreed = false;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "deliverables_agreed_or_gaps_documented"),
    "fail");
  assert.equal(v.verdict, "WORK_PACKAGE_NOT_STRUCTURED");
});

test("test_empty_deliverables_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.deliverables = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "deliverables_declared"), "fail");
  assert.equal(v.deliverables_count, 0);
});

test("test_deliverable_with_invalid_kind_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.deliverables[1].kind = "memo";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_deliverable_has_skill_kind"),
    "fail");
  assert.deepEqual(v.deliverables_with_invalid_kind,
    ["motor-datasheet"]);
});

test("test_deliverable_missing_kind_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.deliverables[0].kind;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_deliverable_has_skill_kind"),
    "missing");
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_unapproved_revision_for_construction_fails", () => {
  const m = clone(COMPLETE) as any;
  m.document_control
    .unapproved_revision_used_for_construction_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "WORK_PACKAGE_NOT_STRUCTURED");
  assert.equal(v.sections["document_control_and_revisions"],
    "fail");
  assert.equal(
    checkStatus(v, "no_unapproved_revision_used_for_construction"),
    "fail");
});

test("test_superseded_versions_deleted_fails", () => {
  const m = clone(COMPLETE) as any;
  m.document_control.superseded_versions_deleted_present = true;
  assert.equal(evaluate(m).verdict, "WORK_PACKAGE_NOT_STRUCTURED");
});

test("test_untraceable_changes_fail", () => {
  const m = clone(COMPLETE) as any;
  m.document_control.untraceable_changes_present = true;
  assert.equal(evaluate(m).verdict, "WORK_PACKAGE_NOT_STRUCTURED");
});

test("test_uncontrolled_copies_fail", () => {
  const m = clone(COMPLETE) as any;
  m.document_control.uncontrolled_copies_present = true;
  assert.equal(evaluate(m).verdict, "WORK_PACKAGE_NOT_STRUCTURED");
});

test("test_document_with_invalid_status_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.documents[2].status = "Issued";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_document_has_flow_status"),
    "fail");
  assert.deepEqual(v.documents_with_invalid_status,
    ["pump-drawing"]);
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_document_without_revision_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.documents[0].revision = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_document_has_revision"),
    "fail");
  assert.deepEqual(v.documents_without_revision, ["motor-calc"]);
});

test("test_document_missing_revision_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.documents[1].revision;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_document_has_revision"),
    "missing");
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_document_without_revision_reason_fails", () => {
  const m = clone(COMPLETE) as any;
  m.documents[1].revision_reason_declared = false;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "every_document_declares_revision_reason"),
    "fail");
  assert.deepEqual(v.documents_without_revision_reason,
    ["motor-datasheet"]);
});

test("test_document_without_revision_history_fails", () => {
  const m = clone(COMPLETE) as any;
  m.documents[2].revision_history_present = false;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "every_document_has_revision_history"), "fail");
  assert.deepEqual(v.documents_without_revision_history,
    ["pump-drawing"]);
});

test("test_calculation_checked_by_designer_fails", () => {
  const m = clone(COMPLETE) as any;
  m.documents[0].checker = "eng-a";
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "every_calculation_independently_checked"),
    "fail");
  assert.deepEqual(v.calculations_not_independently_checked,
    ["motor-calc"]);
  assert.equal(v.independent_check_coverage, "0.000000");
});

test("test_calculation_missing_checker_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.documents[0].checker;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "every_calculation_independently_checked"),
    "missing");
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_non_calculation_same_designer_checker_passes", () => {
  const m = clone(COMPLETE) as any;
  m.documents[1].checker = "eng-a";
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "every_calculation_independently_checked"),
    "pass");
  assert.equal(v.verdict, "WORK_PACKAGE_STRUCTURED");
});

test("test_document_with_incomplete_signoff_fails", () => {
  const m = clone(COMPLETE) as any;
  m.documents[1].approved_by = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_document_signoff_complete"),
    "fail");
  assert.deepEqual(v.documents_with_incomplete_signoff,
    ["motor-datasheet"]);
  assert.equal(v.signoff_coverage, "0.666667");
});

test("test_empty_documents_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.documents = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "documents_declared"), "fail");
  assert.equal(v.documents_count, 0);
  assert.equal(v.signoff_coverage, null);
  assert.equal(v.independent_check_coverage, null);
  assert.equal(v.transmittal_document_coverage, "0.000000");
});

test("test_transmittal_with_unknown_document_fails", () => {
  const m = clone(COMPLETE) as any;
  m.transmittals[0].document = "cable-schedule";
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "every_transmittal_names_declared_document"),
    "fail");
  assert.deepEqual(v.transmittals_with_unknown_document,
    ["cable-schedule"]);
  assert.equal(v.transmittal_document_coverage, "0.500000");
});

test("test_transmittal_without_recipient_fails", () => {
  const m = clone(COMPLETE) as any;
  m.transmittals[1].recipient = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_transmittal_has_recipient"),
    "fail");
  assert.deepEqual(v.transmittals_without_recipient,
    ["motor-datasheet"]);
});

test("test_transmittal_revision_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.transmittals[0].revision = "B";
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "every_transmittal_revision_matches_document"),
    "fail");
  assert.deepEqual(v.transmittals_with_revision_mismatch,
    ["motor-calc"]);
});

test("test_transmittal_with_invalid_date_fails", () => {
  const m = clone(COMPLETE) as any;
  m.transmittals[0].date = "2027-02-30";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_transmittal_has_valid_date"),
    "fail");
  assert.deepEqual(v.transmittals_with_invalid_date, ["motor-calc"]);
});

test("test_transmittal_without_return_status_fails", () => {
  const m = clone(COMPLETE) as any;
  m.transmittals[1].return_status_declared = false;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "every_transmittal_declares_return_status"),
    "fail");
  assert.deepEqual(v.transmittals_without_return_status,
    ["motor-datasheet"]);
});

test("test_verbal_issue_fails", () => {
  const m = clone(COMPLETE) as any;
  m.transmittal_log.verbal_issue_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "WORK_PACKAGE_NOT_STRUCTURED");
  assert.equal(checkStatus(v, "no_verbal_issue"), "fail");
});

test("test_transmittal_log_not_current_fails", () => {
  const m = clone(COMPLETE) as any;
  m.transmittal_log.log_current_declared = false;
  assert.equal(evaluate(m).verdict, "WORK_PACKAGE_NOT_STRUCTURED");
});

test("test_document_missing_units_fails_quality", () => {
  const m = clone(COMPLETE) as any;
  m.documents[0].units_declared = false;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "every_document_declares_quality_elements"),
    "fail");
  assert.deepEqual(v.documents_missing_quality_elements,
    ["motor-calc"]);
  assert.equal(v.sections["delivery_quality_and_handover"],
    "fail");
});

test("test_document_without_check_signature_fails", () => {
  const m = clone(COMPLETE) as any;
  m.documents[2].check_signature_declared = false;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v,
      "every_document_declares_assumptions_and_check_signature"),
    "fail");
  assert.deepEqual(v.documents_missing_assumptions_or_signature,
    ["pump-drawing"]);
});

test("test_document_without_assumptions_fails", () => {
  const m = clone(COMPLETE) as any;
  m.documents[1].assumptions_declared = false;
  const v = evaluate(m);
  assert.deepEqual(v.documents_missing_assumptions_or_signature,
    ["motor-datasheet"]);
});

test("test_handover_closeout_unsigned_fails", () => {
  const m = clone(COMPLETE) as any;
  m.handover.closeout_checklist_signed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "WORK_PACKAGE_NOT_STRUCTURED");
  assert.equal(v.sections["delivery_quality_and_handover"],
    "fail");
});

test("test_handover_section_missing_is_insufficient", () => {
  const m = clone(COMPLETE) as any;
  delete m.handover;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["delivery_quality_and_handover"],
    "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.deliverables_count, null);
  assert.equal(v.documents_count, null);
  assert.equal(v.transmittals_count, null);
  assert.equal(v.signoff_coverage, null);
  assert.equal(v.independent_check_coverage, null);
  assert.equal(v.transmittal_document_coverage, null);
  assert.equal(v.transmittals_with_unknown_document, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes(
    "VERDICT: WORK_PACKAGE_STRUCTURED"));
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
  m.package = 12345;
  assert.throws(() => evaluate(m), fieldError("package"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ definition: "should-be-an-object" }),
    fieldError("definition"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ documents: { name: "motor-calc" } }),
    fieldError("documents"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ documents: ["motor-calc"] }),
    fieldError("documents[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.definition.objective_declared = "yes";
  assert.throws(() => evaluate(m),
    fieldError("definition.objective_declared"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.documents[1].revision = 42;
  assert.throws(() => evaluate(m),
    fieldError("documents[1].revision"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.documents[0].revision_history_present = "yes";
  assert.throws(() => evaluate(m),
    fieldError("documents[0].revision_history_present"));
});

test("malformed: transmittal entry field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.transmittals[0].date = true;
  assert.throws(() => evaluate(m),
    fieldError("transmittals[0].date"));
});

test("malformed: deliverable entry field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.deliverables[0].kind = 7;
  assert.throws(() => evaluate(m),
    fieldError("deliverables[0].kind"));
});

test("malformed: false-check field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.document_control.untraceable_changes_present = "no";
  assert.throws(() => evaluate(m),
    fieldError("document_control.untraceable_changes_present"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.handover = null;
  assert.throws(() => evaluate(m), fieldError("handover"));
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
  .filter((f) =>
    f.startsWith("engineering-work-package-structuring--") &&
    f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0,
  "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest),
      fixture.expected);
  });
}
