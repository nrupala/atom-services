import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/offline-first-pwa-engineering-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  app: "vault-notes-pwa",
  architecture: { local_store_is_primary_source: true,
                  server_is_sync_target_or_absent: true },
  core_flows: [
    { name: "read-notes", works_fully_offline: true },
    { name: "edit-note", works_fully_offline: true },
    { name: "search-vault", works_fully_offline: true },
  ],
  service_worker: { app_shell_precached: true,
                    versioned_assets_precached: true,
                    sensitive_responses_not_cached_blindly: true,
                    update_flow_new_version_ready_ui_present: true,
                    skip_waiting_controlled: true },
  storage: { versioned_schema_migrations_present: true,
             migrations_tested: true,
             quota_awareness_present: true,
             quota_exhaustion_handled_gracefully: true,
             export_path_exists: true,
             import_path_exists: true,
             export_import_round_trip_verified: true },
  sync: { server_sync_used: true,
          queue_with_retry_and_backoff: true,
          operations_idempotent: true,
          conflict_rules_explicit: true,
          state_visible_pending_synced_failed: true,
          indefinite_spinners_avoided: true },
  installability: { web_app_manifest_present: true,
                    icons_present: true,
                    theming_present: true,
                    keyboard_first_usability_addressed: true,
                    degraded_mode_messaging_present: true },
  encryption: { zero_knowledge_claimed: true,
                webcrypto_used: true,
                keys_never_exported_unencrypted: true,
                platform_limits_disclosed_honestly: true },
  testing: { devtools_offline_test_performed: true,
             devtools_throttle_test_performed: true,
             storage_full_simulation_performed: true,
             upgrade_path_old_data_tested: true,
             install_uninstall_flows_tested: true,
             service_worker_update_flow_exercised: true },
  red_lines: { silent_data_loss_present: false,
               caching_of_secrets_present: false,
               network_required_core_flows_claimed_offline_first_present: false },
};

const NO_SYNC: Record<string, unknown> = (() => {
  const m = clone(COMPLETE) as any;
  m.sync = { server_sync_used: false,
             queue_with_retry_and_backoff: false,
             operations_idempotent: false,
             conflict_rules_explicit: false,
             state_visible_pending_synced_failed: false,
             indefinite_spinners_avoided: true };
  return m;
})();

const NO_ZK: Record<string, unknown> = (() => {
  const m = clone(COMPLETE) as any;
  m.encryption = { zero_knowledge_claimed: false,
                   webcrypto_used: false,
                   keys_never_exported_unencrypted: false,
                   platform_limits_disclosed_honestly: false };
  return m;
})();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "OFFLINE_FIRST_PWA_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 41);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.core_flows_count, 3);
  assert.deepEqual(v.flows_without_offline_support, []);
  assert.equal(v.offline_coverage, "1.000000");
  assert.deepEqual(v.duplicate_flow_names, []);
});

test("test_no_sync_app_complete_is_sound", () => {
  const v = evaluate(clone(NO_SYNC));
  assert.equal(v.verdict, "OFFLINE_FIRST_PWA_SOUND");
  assert.equal(checkStatus(v, "queue_with_retry_and_backoff"), "pass");
});

test("test_no_zero_knowledge_app_complete_is_sound", () => {
  const v = evaluate(clone(NO_ZK));
  assert.equal(v.verdict, "OFFLINE_FIRST_PWA_SOUND");
  assert.equal(checkStatus(v, "webcrypto_used"), "pass");
});

test("test_local_store_not_primary_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.local_store_is_primary_source = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "OFFLINE_FIRST_PWA_NOT_SOUND");
  assert.equal(v.sections["offline_first_architecture"], "fail");
});

test("test_flow_not_offline_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.core_flows[0].works_fully_offline = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "OFFLINE_FIRST_PWA_NOT_SOUND");
  assert.equal(checkStatus(v, "every_core_flow_works_fully_offline"), "fail");
  assert.deepEqual(v.flows_without_offline_support, ["read-notes"]);
  assert.equal(v.offline_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_flow_missing_offline_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.core_flows[0].works_fully_offline;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_core_flow_works_fully_offline"), "missing");
  assert.deepEqual(v.flows_without_offline_support, []);
});

test("test_duplicate_flow_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.core_flows[2].name = "read-notes";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_core_flow_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_flow_names, ["read-notes"]);
});

test("test_flow_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.core_flows[2].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_core_flow_name_duplicated"), "missing");
});

test("test_empty_flows_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.core_flows = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "core_flows_declared"), "fail");
  assert.equal(v.core_flows_count, 0);
  assert.equal(v.offline_coverage, null);
  assert.deepEqual(v.duplicate_flow_names, []);
});

test("test_app_shell_not_precached_fails_section2", () => {
  const m = clone(COMPLETE) as any;
  m.service_worker.app_shell_precached = false;
  assert.equal(evaluate(m).sections["service_worker_discipline"], "fail");
});

test("test_uncontrolled_skip_waiting_fails", () => {
  const m = clone(COMPLETE) as any;
  m.service_worker.skip_waiting_controlled = false;
  assert.equal(checkStatus(evaluate(m), "skip_waiting_controlled"), "fail");
});

test("test_no_migrations_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.storage.versioned_schema_migrations_present = false;
  assert.equal(evaluate(m).sections["storage_engineering"], "fail");
});

test("test_quota_not_handled_fails", () => {
  const m = clone(COMPLETE) as any;
  m.storage.quota_exhaustion_handled_gracefully = false;
  assert.equal(checkStatus(evaluate(m), "quota_exhaustion_handled_gracefully"), "fail");
});

test("test_export_without_round_trip_fails", () => {
  const m = clone(COMPLETE) as any;
  m.storage.export_import_round_trip_verified = false;
  assert.equal(checkStatus(evaluate(m), "export_import_round_trip_verified"), "fail");
});

test("test_sync_gate_absent_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.sync.server_sync_used;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "sync_applicability_declared"), "missing");
  assert.equal(checkStatus(v, "operations_idempotent"), "missing");
});

test("test_sync_app_without_idempotence_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sync.operations_idempotent = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "operations_idempotent"), "fail");
  assert.equal(v.verdict, "OFFLINE_FIRST_PWA_NOT_SOUND");
});

test("test_indefinite_spinners_fail_even_without_sync", () => {
  const m = clone(NO_SYNC) as any;
  m.sync.indefinite_spinners_avoided = false;
  assert.equal(checkStatus(evaluate(m), "indefinite_spinners_avoided"), "fail");
});

test("test_no_manifest_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.installability.web_app_manifest_present = false;
  assert.equal(evaluate(m).sections["installability_encryption_and_ux"], "fail");
});

test("test_zk_gate_absent_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.encryption.zero_knowledge_claimed;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "zero_knowledge_applicability_declared"), "missing");
  assert.equal(checkStatus(v, "webcrypto_used"), "missing");
});

test("test_zk_claim_without_webcrypto_fails", () => {
  const m = clone(COMPLETE) as any;
  m.encryption.webcrypto_used = false;
  assert.equal(checkStatus(evaluate(m), "webcrypto_used"), "fail");
});

test("test_no_storage_full_simulation_fails_section6", () => {
  const m = clone(COMPLETE) as any;
  m.testing.storage_full_simulation_performed = false;
  assert.equal(evaluate(m).sections["testing_and_quality_gates"], "fail");
});

test("test_update_flow_not_exercised_fails", () => {
  const m = clone(COMPLETE) as any;
  m.testing.service_worker_update_flow_exercised = false;
  assert.equal(checkStatus(evaluate(m), "service_worker_update_flow_exercised"), "fail");
});

test("test_silent_data_loss_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.silent_data_loss_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "silent_data_loss_refused"), "fail");
  assert.equal(v.sections["pwa_red_lines"], "fail");
});

test("test_caching_secrets_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.caching_of_secrets_present = true;
  assert.equal(checkStatus(evaluate(m), "secrets_caching_refused"), "fail");
});

test("test_network_required_claim_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.network_required_core_flows_claimed_offline_first_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "network_required_core_flow_offline_claim_refused"), "fail");
  assert.equal(v.verdict, "OFFLINE_FIRST_PWA_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.testing;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["testing_and_quality_gates"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.core_flows_count, null);
  assert.equal(v.flows_without_offline_support, null);
  assert.equal(v.offline_coverage, null);
  assert.equal(v.duplicate_flow_names, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: OFFLINE_FIRST_PWA_SOUND"));
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
  assert.throws(() => evaluate({ architecture: "should-be-an-object" }), fieldError("architecture"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ core_flows: { name: "read-notes" } }), fieldError("core_flows"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ core_flows: ["read-notes"] }), fieldError("core_flows[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.architecture.local_store_is_primary_source = "yes";
  assert.throws(() => evaluate(m), fieldError("architecture.local_store_is_primary_source"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.core_flows[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("core_flows[0].name"));
});

test("malformed: nested list entry boolean as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.core_flows[1].works_fully_offline = "true";
  assert.throws(() => evaluate(m), fieldError("core_flows[1].works_fully_offline"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sync = null;
  assert.throws(() => evaluate(m), fieldError("sync"));
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
  .filter((f) => f.startsWith("offline-first-pwa-engineering-pack--") && f.endsWith(".json"))
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
