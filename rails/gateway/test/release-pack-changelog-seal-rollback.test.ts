import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/release-pack-changelog-seal-rollback.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const SHA256_A = "a".repeat(64);
const SHA512_C = "f".repeat(128);

const COMPLETE: Record<string, unknown> = {
  release_label: "gateway-2.4.0",
  version_detail: { declared_version: "2.4.0", previous_version: "2.3.1",
                    bump_kind: "minor", breaking_change_in_pack: false },
  changelog_pack: { keep_a_changelog_layout_followed: true,
                    unreleased_backlog_maintained_continuously: true,
                    pack_release_notes_state_why_changes_matter: true,
                    pack_breaking_items_pair_migration_steps: true },
  changelog_entries: [
    { entry_heading: "Faster sync engine", entry_category: "Added",
      entry_summary_present: true, entry_version_heading: "2.4.0" },
    { entry_heading: "Token refresh race", entry_category: "Fixed",
      entry_summary_present: true, entry_version_heading: "2.4.0" },
  ],
  seal_record: { pack_artifacts_hashed_and_signed_declared: true,
                 seal_manifest_generated_from_build_outputs: true,
                 declared_sealed_artifact_total: 2 },
  sealed_artifacts: [
    { artifact_filename: "gateway-2.4.0-linux.tar.gz",
      checksum_algorithm: "sha256", checksum_value: SHA256_A,
      signature_recorded: true },
    { artifact_filename: "gateway-2.4.0-macos.tar.gz",
      checksum_algorithm: "sha512", checksum_value: SHA512_C,
      signature_recorded: true },
  ],
  tag_and_attachment: {
    pack_tag_created_as_annotated: true,
    pack_tag_signature_recorded_when_signing_key_exists: true,
    seal_manifest_attached_to_pack_record: true,
    signature_file_attached_to_pack_record: true,
    pack_checksums_rechecked_before_announcement: true },
  rollback_detail: {
    rollback_path_written_before_rollout_began: true,
    rollback_sequence_is_executable_as_written: true,
    rollback_trigger_conditions_named_in_pack: true },
  rollback_steps: [
    { step_label: "Drain canary nodes", step_order: 1,
      step_action_recorded: true, step_verification_recorded: true },
    { step_label: "Restore previous build", step_order: 2,
      step_action_recorded: true, step_verification_recorded: true },
  ],
  rollout_record: {
    rollout_staging_or_canary_declared_for_pack: true,
    rollout_approver_recorded_for_pack: true,
    defined_health_window_stated_for_pack: true,
    post_release_health_verification_completed_for_pack: true,
    post_release_discrepancies_logged_for_pack: true },
  red_lines: { untagged_pack_release_present: false,
               published_history_rewrite_present: false,
               unattended_pack_deploy_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 41);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.changelog_entries_count, 2);
  assert.equal(v.sealed_artifacts_count, 2);
  assert.equal(v.rollback_steps_count, 2);
  assert.equal(v.changelog_summary_coverage, "1.000000");
  assert.equal(v.recognised_category_coverage, "1.000000");
  assert.equal(v.checksum_format_coverage, "1.000000");
  assert.equal(v.signature_coverage, "1.000000");
  assert.equal(v.rollback_action_coverage, "1.000000");
  assert.equal(v.rollback_verification_coverage, "1.000000");
  assert.deepEqual(v.duplicate_changelog_entry_headings, []);
  assert.deepEqual(v.duplicate_sealed_artifact_filenames, []);
  assert.deepEqual(v.duplicate_rollback_step_labels, []);
});

test("test_malformed_version_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.version_detail.declared_version = "2.4";
  const v = evaluate(m);
  assert.equal(v.verdict, "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY");
  assert.equal(v.sections["version_stamp_and_bump_classification"], "fail");
  assert.equal(checkStatus(v, "pack_version_is_wellformed_semver"), "fail");
});

test("test_version_not_advancing_fails", () => {
  const m = clone(COMPLETE) as any;
  m.version_detail.declared_version = "2.3.1";
  m.version_detail.bump_kind = "patch";
  assert.equal(checkStatus(evaluate(m), "pack_version_advances_from_previous_declared_version"), "fail");
});

test("test_bump_kind_mismatching_delta_fails", () => {
  const m = clone(COMPLETE) as any;
  m.version_detail.bump_kind = "patch";
  assert.equal(checkStatus(evaluate(m), "pack_bump_kind_matches_version_delta"), "fail");
});

test("test_breaking_change_without_major_bump_fails", () => {
  const m = clone(COMPLETE) as any;
  m.version_detail.breaking_change_in_pack = true;
  assert.equal(checkStatus(evaluate(m), "pack_bump_kind_follows_declared_breaking_flag"), "fail");
});

test("test_major_bump_with_breaking_change_passes", () => {
  const m = clone(COMPLETE) as any;
  Object.assign(m.version_detail, { declared_version: "3.0.0", bump_kind: "major", breaking_change_in_pack: true });
  for (const e of m.changelog_entries) e.entry_version_heading = "3.0.0";
  assert.equal(evaluate(m).verdict, "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY");
});

test("test_unrecognised_changelog_category_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.changelog_entries[0].entry_category = "Tweaked";
  const v = evaluate(m);
  assert.equal(v.sections["changelog_pack_completeness"], "fail");
  assert.equal(checkStatus(v, "every_changelog_entry_uses_recognised_category"), "fail");
  assert.deepEqual(v.changelog_entries_with_unrecognised_category, ["Faster sync engine"]);
  assert.equal(v.recognised_category_coverage, "0.500000");
});

test("test_entry_without_summary_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.changelog_entries[1].entry_summary_present = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_changelog_entry_carries_summary"), "fail");
  assert.deepEqual(v.changelog_entries_without_summary, ["Token refresh race"]);
  assert.equal(v.changelog_summary_coverage, "0.500000");
});

test("test_entry_filed_under_other_version_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.changelog_entries[0].entry_version_heading = "2.3.0";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_changelog_entry_filed_under_pack_version"), "fail");
  assert.deepEqual(v.changelog_entries_filed_under_other_version, ["Faster sync engine"]);
});

test("test_duplicate_entry_heading_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.changelog_entries[1].entry_heading = "Faster sync engine";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_changelog_entry_heading_duplicated"), "fail");
  assert.deepEqual(v.duplicate_changelog_entry_headings, ["Faster sync engine"]);
});

test("test_entry_missing_category_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.changelog_entries[0].entry_category;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_changelog_entry_uses_recognised_category"), "missing");
  assert.deepEqual(v.changelog_entries_with_unrecognised_category, []);
});

test("test_empty_changelog_entries_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.changelog_entries = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "changelog_entry_rows_declared"), "fail");
  assert.equal(v.changelog_entries_count, 0);
  assert.equal(v.changelog_summary_coverage, null);
});

test("test_absent_changelog_entries_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.changelog_entries;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "changelog_entry_rows_declared"), "missing");
  assert.equal(v.changelog_entries_count, null);
  assert.equal(v.duplicate_changelog_entry_headings, null);
});

test("test_malformed_checksum_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.sealed_artifacts[0].checksum_value = "abcd";
  const v = evaluate(m);
  assert.equal(v.sections["seal_manifest_integrity"], "fail");
  assert.equal(checkStatus(v, "every_sealed_artifact_checksum_matches_declared_algorithm_format"), "fail");
  assert.deepEqual(v.sealed_artifacts_with_malformed_checksum, ["gateway-2.4.0-linux.tar.gz"]);
  assert.equal(v.checksum_format_coverage, "0.500000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_checksum_algorithm_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sealed_artifacts[0].checksum_algorithm = "sha512";
  assert.equal(checkStatus(evaluate(m), "every_sealed_artifact_checksum_matches_declared_algorithm_format"), "fail");
});

test("test_non_hex_checksum_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sealed_artifacts[1].checksum_value = "z".repeat(128);
  assert.equal(checkStatus(evaluate(m), "every_sealed_artifact_checksum_matches_declared_algorithm_format"), "fail");
});

test("test_artifact_without_signature_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.sealed_artifacts[1].signature_recorded = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sealed_artifact_signature_recorded"), "fail");
  assert.deepEqual(v.sealed_artifacts_without_signature, ["gateway-2.4.0-macos.tar.gz"]);
  assert.equal(v.signature_coverage, "0.500000");
});

test("test_duplicate_artifact_filename_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.sealed_artifacts[1].artifact_filename = "gateway-2.4.0-linux.tar.gz";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_sealed_artifact_filename_duplicated"), "fail");
  assert.deepEqual(v.duplicate_sealed_artifact_filenames, ["gateway-2.4.0-linux.tar.gz"]);
});

test("test_seal_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.seal_record.declared_sealed_artifact_total = 3;
  assert.equal(checkStatus(evaluate(m), "seal_artifact_count_matches_pack_manifest_total"), "fail");
});

test("test_empty_sealed_artifacts_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sealed_artifacts = [];
  m.seal_record.declared_sealed_artifact_total = 0;
  assert.equal(checkStatus(evaluate(m), "sealed_artifact_rows_declared"), "fail");
});

test("test_unattached_signature_file_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.tag_and_attachment.signature_file_attached_to_pack_record = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY");
  assert.equal(v.sections["tag_signature_and_attachment"], "fail");
});

test("test_rollback_written_after_rollout_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.rollback_detail.rollback_path_written_before_rollout_began = false;
  assert.equal(evaluate(m).sections["rollback_sequence_detail"], "fail");
});

test("test_non_contiguous_step_orders_fail", () => {
  const m = clone(COMPLETE) as any;
  m.rollback_steps[1].step_order = 3;
  assert.equal(checkStatus(evaluate(m), "rollback_step_orders_form_contiguous_sequence"), "fail");
});

test("test_duplicate_step_orders_fail", () => {
  const m = clone(COMPLETE) as any;
  m.rollback_steps[1].step_order = 1;
  assert.equal(checkStatus(evaluate(m), "rollback_step_orders_form_contiguous_sequence"), "fail");
});

test("test_out_of_order_steps_with_contiguous_orders_pass", () => {
  const m = clone(COMPLETE) as any;
  m.rollback_steps = [...m.rollback_steps].reverse();
  assert.equal(evaluate(m).verdict, "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY");
});

test("test_step_without_action_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.rollback_steps[0].step_action_recorded = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rollback_step_records_its_action"), "fail");
  assert.deepEqual(v.rollback_steps_without_action, ["Drain canary nodes"]);
  assert.equal(v.rollback_action_coverage, "0.500000");
});

test("test_step_without_verification_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.rollback_steps[1].step_verification_recorded = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_rollback_step_records_post_step_verification"), "fail");
  assert.deepEqual(v.rollback_steps_without_verification, ["Restore previous build"]);
  assert.equal(v.rollback_verification_coverage, "0.500000");
});

test("test_duplicate_step_label_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.rollback_steps[1].step_label = "Drain canary nodes";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_rollback_step_label_duplicated"), "fail");
  assert.deepEqual(v.duplicate_rollback_step_labels, ["Drain canary nodes"]);
});

test("test_step_missing_order_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.rollback_steps[0].step_order;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "rollback_step_orders_form_contiguous_sequence"), "missing");
});

test("test_empty_rollback_steps_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.rollback_steps = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "rollback_step_rows_declared"), "fail");
  assert.equal(v.rollback_steps_count, 0);
});

test("test_unstaged_rollout_fails_section6", () => {
  const m = clone(COMPLETE) as any;
  m.rollout_record.rollout_staging_or_canary_declared_for_pack = false;
  assert.equal(evaluate(m).sections["staged_rollout_and_health_record"], "fail");
});

test("test_untagged_pack_release_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.untagged_pack_release_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_untagged_pack_release_in_record"), "fail");
  assert.equal(v.sections["pack_red_lines"], "fail");
});

test("test_history_rewrite_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.published_history_rewrite_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_published_history_rewrite_in_record"), "fail");
  assert.equal(v.verdict, "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY");
});

test("test_unattended_deploy_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unattended_pack_deploy_present = true;
  assert.equal(checkStatus(evaluate(m), "no_unattended_pack_deploy_in_record"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.rollout_record;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["staged_rollout_and_health_record"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.changelog_entries_count, null);
  assert.equal(v.sealed_artifacts_count, null);
  assert.equal(v.rollback_steps_count, null);
  assert.equal(v.changelog_summary_coverage, null);
  assert.equal(v.checksum_format_coverage, null);
  assert.equal(v.rollback_action_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY"));
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
  m.release_label = 12345;
  assert.throws(() => evaluate(m), fieldError("release_label"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ version_detail: "should-be-an-object" }), fieldError("version_detail"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ changelog_entries: { entry_heading: "x" } }), fieldError("changelog_entries"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ rollback_steps: ["drain"] }), fieldError("rollback_steps[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.changelog_pack.keep_a_changelog_layout_followed = "yes";
  assert.throws(() => evaluate(m), fieldError("changelog_pack.keep_a_changelog_layout_followed"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.seal_record.declared_sealed_artifact_total = "2";
  assert.throws(() => evaluate(m), fieldError("seal_record.declared_sealed_artifact_total"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sealed_artifacts[0].checksum_value = 42;
  assert.throws(() => evaluate(m), fieldError("sealed_artifacts[0].checksum_value"));
});

test("malformed: nested list entry number field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.rollback_steps[1].step_order = "second";
  assert.throws(() => evaluate(m), fieldError("rollback_steps[1].step_order"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tag_and_attachment = null;
  assert.throws(() => evaluate(m), fieldError("tag_and_attachment"));
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
  .filter((f) => f.startsWith("release-pack-changelog-seal-rollback--") && f.endsWith(".json"))
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
