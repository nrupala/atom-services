import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/agent-context-packaging.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The PACK_SOUND manifest, copied from the Python VerdictTests oracle.
const FULL: Record<string, unknown> = {
  pack: "milo setup for new machine",
  scope: { what_travels_declared: true, recipient_declared: true, purpose_declared: true, pack_inherits_boundary: true },
  redaction: { keys_replaced_with_environment_references: true, personal_data_minimized_purpose_limited: true, contacts_or_financials_included: false, scan_clean_automated_and_manual: true, secrets_or_pii_unredacted_present: false },
  manifest: { manifest_present: true, manifest_lists_contents_version_date_generator_and_source: true },
  structure: { stable_folder_layout: true, receiver_runbook_present: true, receiver_runbook_tested: true },
  reproducibility: { generated_by_script_from_source_of_truth: true, hand_assembled: false, derived_pack_hand_maintained_silently: false, versioned_in_git: true },
  signing: { pack_signed: true },
  handoff: { is_handoff_dossier: true, dossier_contents_complete: true, everything_dated: true, review_date_marked: true },
  freshness: { expiry_or_review_date_present: true, stale_packs_flagged: true, single_upstream_source_derived_not_primary: true },
  privacy: { stored_privately: true, access_limited: true, contact_handling_rules_complied: true, third_party_personal_data_included: true, lawful_basis_established: true },
};

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function sound(): any { return clone(FULL); }


// ---- The Python VerdictTests, ported ----

test("test_sound_manifest_is_pack_sound", () => {
  const m = sound();
  const v = evaluate(m); assert.equal(v.verdict, "PACK_SOUND"); assert.ok(Object.values(v.sections).every((s) => s === "pass")); assert.equal(v.checks.length, 29); assert.equal(v.pack, "milo setup for new machine");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({}); assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE"); assert.ok(Object.values(v.sections).every((s) => s === "insufficient_evidence"));
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = sound();
  delete m.privacy;
  const v = evaluate(m); assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE"); assert.equal(v.sections["freshness_and_privacy"], "insufficient_evidence");
});

test("test_scope_what_not_declared_fails", () => {
  const m = sound();
  m.scope.what_travels_declared = false;
  const v = evaluate(m); assert.equal(v.verdict, "PACK_NOT_SOUND"); assert.equal(v.sections["scope_declaration"], "fail");
});

test("test_scope_recipient_not_declared_fails", () => {
  const m = sound();
  m.scope.recipient_declared = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_scope_purpose_not_declared_fails", () => {
  const m = sound();
  m.scope.purpose_declared = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_pack_not_inheriting_scope_boundary_fails", () => {
  const m = sound();
  m.scope.pack_inherits_boundary = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_keys_not_replaced_with_env_references_fails", () => {
  const m = sound();
  m.redaction.keys_replaced_with_environment_references = false;
  const v = evaluate(m); assert.equal(v.verdict, "PACK_NOT_SOUND"); assert.equal(v.sections["redaction"], "fail");
});

test("test_personal_data_not_minimized_fails", () => {
  const m = sound();
  m.redaction.personal_data_minimized_purpose_limited = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_contacts_or_financials_included_fails", () => {
  const m = sound();
  m.redaction.contacts_or_financials_included = true;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_redaction_scan_not_clean_fails", () => {
  const m = sound();
  m.redaction.scan_clean_automated_and_manual = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_unredacted_secrets_or_pii_fails_red_line", () => {
  const m = sound();
  m.redaction.secrets_or_pii_unredacted_present = true;
  const v = evaluate(m); assert.equal(v.verdict, "PACK_NOT_SOUND"); assert.equal(v.sections["redaction"], "fail");
});

test("test_manifest_absent_fails", () => {
  const m = sound();
  m.manifest.manifest_present = false;
  const v = evaluate(m); assert.equal(v.verdict, "PACK_NOT_SOUND"); assert.equal(v.sections["structure_and_manifest"], "fail");
});

test("test_manifest_incomplete_fails", () => {
  const m = sound();
  m.manifest.manifest_lists_contents_version_date_generator_and_source = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_unstable_folder_layout_fails", () => {
  const m = sound();
  m.structure.stable_folder_layout = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_runbook_absent_fails", () => {
  const m = sound();
  m.structure.receiver_runbook_present = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_runbook_untested_fails", () => {
  const m = sound();
  m.structure.receiver_runbook_tested = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_not_generated_by_script_fails", () => {
  const m = sound();
  m.reproducibility.generated_by_script_from_source_of_truth = false;
  const v = evaluate(m); assert.equal(v.verdict, "PACK_NOT_SOUND"); assert.equal(v.sections["reproducibility_and_signing"], "fail");
});

test("test_hand_assembled_fails", () => {
  const m = sound();
  m.reproducibility.hand_assembled = true;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_hand_maintained_silently_fails_red_line", () => {
  const m = sound();
  m.reproducibility.derived_pack_hand_maintained_silently = true;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_not_versioned_in_git_fails", () => {
  const m = sound();
  m.reproducibility.versioned_in_git = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_unsigned_pack_fails", () => {
  const m = sound();
  m.signing.pack_signed = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_dossier_contents_incomplete_fails", () => {
  const m = sound();
  m.handoff.dossier_contents_complete = false;
  const v = evaluate(m); assert.equal(v.verdict, "PACK_NOT_SOUND"); assert.equal(v.sections["handoff_dossier"], "fail");
});

test("test_dossier_contents_missing_is_insufficient", () => {
  const m = sound();
  delete m.handoff.dossier_contents_complete;
  const v = evaluate(m); assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE"); assert.equal(v.sections["handoff_dossier"], "insufficient_evidence");
});

test("test_no_dossier_passes_contents_as_not_applicable", () => {
  const m = sound();
  m.handoff.is_handoff_dossier = false; delete m.handoff.dossier_contents_complete;
  assert.equal(evaluate(m).verdict, "PACK_SOUND");
});

test("test_everything_not_dated_fails", () => {
  const m = sound();
  m.handoff.everything_dated = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_review_date_not_marked_fails", () => {
  const m = sound();
  m.handoff.review_date_marked = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_no_expiry_or_review_date_fails", () => {
  const m = sound();
  m.freshness.expiry_or_review_date_present = false;
  const v = evaluate(m); assert.equal(v.verdict, "PACK_NOT_SOUND"); assert.equal(v.sections["freshness_and_privacy"], "fail");
});

test("test_stale_packs_not_flagged_fails", () => {
  const m = sound();
  m.freshness.stale_packs_flagged = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_export_as_primary_source_fails", () => {
  const m = sound();
  m.freshness.single_upstream_source_derived_not_primary = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_not_stored_privately_fails", () => {
  const m = sound();
  m.privacy.stored_privately = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_access_not_limited_fails", () => {
  const m = sound();
  m.privacy.access_limited = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_contact_handling_not_complied_fails", () => {
  const m = sound();
  m.privacy.contact_handling_rules_complied = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_third_party_data_without_lawful_basis_fails", () => {
  const m = sound();
  m.privacy.lawful_basis_established = false;
  const v = evaluate(m); assert.equal(v.verdict, "PACK_NOT_SOUND"); assert.equal(v.sections["freshness_and_privacy"], "fail");
});

test("test_third_party_data_lawful_basis_missing_is_insufficient", () => {
  const m = sound();
  delete m.privacy.lawful_basis_established;
  assert.equal(evaluate(m).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_no_third_party_data_passes_basis_as_not_applicable", () => {
  const m = sound();
  m.privacy.third_party_personal_data_included = false; delete m.privacy.lawful_basis_established;
  assert.equal(evaluate(m).verdict, "PACK_SOUND");
});

test("test_non_boolean_true_value_fails_bool_check", () => {
  // Corrected under the F1 ruling: previously expected a verdict
  // over a wrong-typed documented field (the F1 defect).
  const m = sound();
  m.scope.what_travels_declared = "yes";
  assert.throws(
    () => evaluate(m),
    fieldError("scope.what_travels_declared"),
  );
});

test("test_missing_single_field_is_insufficient", () => {
  const m = sound();
  delete m.signing.pack_signed;
  const v = evaluate(m); assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE"); assert.equal(v.sections["reproducibility_and_signing"], "insufficient_evidence");
});

test("test_fail_beats_missing", () => {
  const m = sound();
  delete m.signing.pack_signed; m.scope.purpose_declared = false;
  assert.equal(evaluate(m).verdict, "PACK_NOT_SOUND");
});

test("test_stamp_names_the_verdict", () => {
  const m = sound();
  const s = stamp(evaluate(m)); assert.ok(s.includes("VERDICT: PACK_SOUND")); assert.ok(s.includes("pack: milo setup for new machine"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(() => evaluate(["not", "a", "manifest"]), (err: unknown) => err instanceof TypeError && (err as Error).message === "manifest must be a JSON object"); assert.throws(() => evaluate("not a manifest"), TypeError);
});


// ---- F1 regression: malformed field types — the Python
// MalformedTypeTests, ported.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: top-level string field as number rejected", () => {
  const m = sound();
  m.pack = 12345;
  assert.throws(() => evaluate(m), fieldError("pack"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ scope: "should-be-an-object" }),
    fieldError("scope"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = sound();
  m.scope.what_travels_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("scope.what_travels_declared"));
});

test("malformed: null section rejected", () => {
  const m = sound();
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
  .filter((f) => f.startsWith("agent-context-packaging--") && f.endsWith(".json"))
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
