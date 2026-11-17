import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/local-first-sync-design.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  app: "vault-notes",
  local_truth: { device_store_authoritative: true,
                 server_is_relay_and_backup_not_gate: true,
                 core_flows_designed_airplane_mode_first: true,
                 core_flows_work_fully_offline: true,
                 sync_resumes_cleanly_after_long_offline: true },
  data_model: { mergeable_state_uses_crdt_or_ot: true,
                tombstones_declared: true,
                compaction_policy_declared: true },
  entities: [
    { name: "note-body", per_field_merge_semantics_declared: true,
      stable_id_declared: true, is_user_prose: true,
      silent_last_write_wins_present: false },
    { name: "note-counter", per_field_merge_semantics_declared: true,
      stable_id_declared: true, is_user_prose: false },
    { name: "vault-entry", per_field_merge_semantics_declared: true,
      stable_id_declared: true, is_user_prose: false,
      silent_last_write_wins_present: false },
  ],
  sync_protocol: { delta_sync_declared: true,
                   causal_ordering_declared: true,
                   resumability_declared: true,
                   bandwidth_budgets_declared: true,
                   store_and_forward_for_intermittent_peers: true,
                   vector_clocks_or_version_vectors_declared: true },
  encryption: { e2ee_before_upload: true,
                keys_never_leave_devices: true,
                per_device_keys_declared: true,
                key_hierarchy_declared: true,
                key_recovery_ux_tested_like_a_feature: true,
                key_recovery_exercised_end_to_end: true,
                e2ee_verified: true },
  personal_data_sync: { personal_data_synced: true,
                        personal_data_encrypted_before_sync: true },
  conflicts: { automatic_merge_for_text_and_counters: true,
               explicit_ui_only_for_semantic_conflicts: true,
               silent_data_loss_present: false,
               silent_last_write_wins_on_user_prose_present: false },
  state_ui: { offline_state_shown: true, queued_state_shown: true,
              syncing_state_shown: true, synced_state_shown: true,
              conflict_state_shown: true,
              export_escape_hatch_present: true,
              import_escape_hatch_present: true,
              sync_diagnostics_present: true,
              sync_badge_claimed: true },
  testing: { chaos_offline_scenario_tested: true,
             chaos_clock_skew_scenario_tested: true,
             chaos_concurrent_edits_scenario_tested: true,
             chaos_device_loss_scenario_tested: true,
             merge_invariants_property_tested: true,
             export_import_tested_on_real_data_volumes: true,
             real_device_matrix_tested: true,
             multi_device_round_trip_tests_passed: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "LOCAL_FIRST_SYNC_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 47);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.entities_count, 3);
  assert.deepEqual(v.entities_without_merge_semantics, []);
  assert.equal(v.merge_semantics_coverage, "1.000000");
  assert.deepEqual(v.entities_without_stable_id, []);
  assert.equal(v.stable_id_coverage, "1.000000");
  assert.deepEqual(v.prose_entities_with_silent_last_write_wins, []);
});

test("test_server_as_gate_fails_local_truth_section", () => {
  const m = clone(COMPLETE) as any;
  m.local_truth.server_is_relay_and_backup_not_gate = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
  assert.equal(v.sections["local_truth_and_data_model"], "fail");
  assert.equal(checkStatus(v, "server_is_relay_and_backup_not_gate"), "fail");
});

test("test_core_flows_not_offline_fails", () => {
  const m = clone(COMPLETE) as any;
  m.local_truth.core_flows_work_fully_offline = false;
  assert.equal(evaluate(m).verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
});

test("test_no_crdt_or_ot_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data_model.mergeable_state_uses_crdt_or_ot = false;
  assert.equal(evaluate(m).verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
});

test("test_entity_without_merge_semantics_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.entities[0].per_field_merge_semantics_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
  assert.equal(checkStatus(v, "every_entity_per_field_merge_semantics_declared"), "fail");
  assert.deepEqual(v.entities_without_merge_semantics, ["note-body"]);
  assert.equal(v.merge_semantics_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_entity_missing_merge_semantics_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.entities[0].per_field_merge_semantics_declared;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_entity_per_field_merge_semantics_declared"), "missing");
  assert.deepEqual(v.entities_without_merge_semantics, []);
});

test("test_entity_without_stable_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.entities[1].stable_id_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_entity_stable_id_declared"), "fail");
  assert.deepEqual(v.entities_without_stable_id, ["note-counter"]);
  assert.equal(v.stable_id_coverage, "0.666667");
});

test("test_empty_entities_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.entities = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "entities_declared"), "fail");
  assert.equal(v.entities_count, 0);
  assert.equal(v.merge_semantics_coverage, null);
  assert.equal(v.stable_id_coverage, null);
});

test("test_no_delta_sync_fails_sync_protocol_section", () => {
  const m = clone(COMPLETE) as any;
  m.sync_protocol.delta_sync_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
  assert.equal(v.sections["sync_protocol"], "fail");
});

test("test_no_causality_tracking_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sync_protocol.vector_clocks_or_version_vectors_declared = false;
  assert.equal(evaluate(m).verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
});

test("test_keys_leaving_devices_fails_encryption_section", () => {
  const m = clone(COMPLETE) as any;
  m.encryption.keys_never_leave_devices = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
  assert.equal(v.sections["encryption_and_keys"], "fail");
});

test("test_key_recovery_not_exercised_fails", () => {
  const m = clone(COMPLETE) as any;
  m.encryption.key_recovery_exercised_end_to_end = false;
  assert.equal(evaluate(m).verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
});

test("test_unencrypted_personal_data_sync_is_red_line_fail", () => {
  const m = clone(COMPLETE) as any;
  m.personal_data_sync.personal_data_encrypted_before_sync = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
  assert.equal(checkStatus(v, "personal_data_encrypted_when_personal_data_synced"), "fail");
});

test("test_no_personal_data_passes_encryption_gate_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.personal_data_sync = { personal_data_synced: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_FIRST_SYNC_SOUND");
  assert.equal(checkStatus(v, "personal_data_encrypted_when_personal_data_synced"), "pass");
});

test("test_personal_data_target_missing_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.personal_data_sync.personal_data_encrypted_before_sync;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "personal_data_encrypted_when_personal_data_synced"), "missing");
});

test("test_silent_data_loss_is_red_line_fail", () => {
  const m = clone(COMPLETE) as any;
  m.conflicts.silent_data_loss_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
  assert.equal(checkStatus(v, "no_silent_data_loss"), "fail");
  assert.equal(v.sections["conflicts_and_state_ui"], "fail");
});

test("test_global_silent_lww_on_prose_is_red_line_fail", () => {
  const m = clone(COMPLETE) as any;
  m.conflicts.silent_last_write_wins_on_user_prose_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_silent_last_write_wins_on_user_prose"), "fail");
});

test("test_prose_entity_with_silent_lww_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.entities[0].silent_last_write_wins_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
  assert.equal(checkStatus(v, "no_prose_entity_uses_silent_last_write_wins"), "fail");
  assert.deepEqual(v.prose_entities_with_silent_last_write_wins, ["note-body"]);
});

test("test_non_prose_entity_with_silent_lww_passes_prose_check", () => {
  const m = clone(COMPLETE) as any;
  m.entities[1].silent_last_write_wins_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_FIRST_SYNC_SOUND");
  assert.equal(checkStatus(v, "no_prose_entity_uses_silent_last_write_wins"), "pass");
  assert.deepEqual(v.prose_entities_with_silent_last_write_wins, []);
});

test("test_prose_entity_missing_lww_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.entities[0].silent_last_write_wins_present;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_prose_entity_uses_silent_last_write_wins"), "missing");
  assert.deepEqual(v.prose_entities_with_silent_last_write_wins, []);
});

test("test_missing_conflict_state_fails_state_ui", () => {
  const m = clone(COMPLETE) as any;
  m.state_ui.conflict_state_shown = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "conflict_state_shown"), "fail");
  assert.equal(v.sections["conflicts_and_state_ui"], "fail");
});

test("test_no_export_escape_hatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.state_ui.export_escape_hatch_present = false;
  assert.equal(evaluate(m).verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
});

test("test_sync_badge_without_round_trip_tests_is_red_line_fail", () => {
  const m = clone(COMPLETE) as any;
  m.testing.multi_device_round_trip_tests_passed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
  assert.equal(checkStatus(v, "sync_badge_only_with_multi_device_round_trip_tests"), "fail");
});

test("test_no_sync_badge_passes_badge_gate_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.state_ui.sync_badge_claimed = false;
  delete m.testing.multi_device_round_trip_tests_passed;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sync_badge_only_with_multi_device_round_trip_tests"), "pass");
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_merge_invariants_not_property_tested_fails", () => {
  const m = clone(COMPLETE) as any;
  m.testing.merge_invariants_property_tested = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
  assert.equal(v.sections["testing_and_quality_gates"], "fail");
});

test("test_clock_skew_chaos_not_tested_fails", () => {
  const m = clone(COMPLETE) as any;
  m.testing.chaos_clock_skew_scenario_tested = false;
  assert.equal(evaluate(m).verdict, "LOCAL_FIRST_SYNC_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.sync_protocol;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["sync_protocol"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.entities_count, null);
  assert.equal(v.entities_without_merge_semantics, null);
  assert.equal(v.merge_semantics_coverage, null);
  assert.equal(v.entities_without_stable_id, null);
  assert.equal(v.stable_id_coverage, null);
  assert.equal(v.prose_entities_with_silent_last_write_wins, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: LOCAL_FIRST_SYNC_SOUND"));
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
  m.app = 12345;
  assert.throws(() => evaluate(m), fieldError("app"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ sync_protocol: "should-be-an-object" }), fieldError("sync_protocol"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ entities: { name: "note-body" } }), fieldError("entities"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ entities: ["note-body"] }), fieldError("entities[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sync_protocol.delta_sync_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("sync_protocol.delta_sync_declared"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.entities[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("entities[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.entities[1].is_user_prose = "yes";
  assert.throws(() => evaluate(m), fieldError("entities[1].is_user_prose"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.encryption = null;
  assert.throws(() => evaluate(m), fieldError("encryption"));
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
  .filter((f) => f.startsWith("local-first-sync-design--") && f.endsWith(".json"))
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
