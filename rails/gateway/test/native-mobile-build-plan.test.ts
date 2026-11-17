import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/native-mobile-build-plan.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  app: "vault-mobile",
  constraints: { screen_sizes_considered: true,
                 safe_areas_considered: true,
                 touch_targets_minimum_44px_declared: true,
                 battery_and_thermal_considered: true,
                 background_limits_considered: true,
                 worst_device_in_scope_named: true },
  platform_citizenship: { back_button_and_gestures_handled: true,
                          notification_permission_timing_planned: true,
                          deep_links_planned: true,
                          lifecycle_pause_resume_testing_planned: true,
                          gestures_have_non_gesture_alternative: true },
  permissions: [
    { name: "camera", feature_needing_it: "document-scan" },
    { name: "notifications", feature_needing_it: "sync-alerts" },
    { name: "biometrics", feature_needing_it: "vault-unlock" },
  ],
  offline: { local_store_is_truth_for_user_data: true,
             sync_retry_and_queue_planned: true,
             sync_states_pending_and_failed_visible: true,
             indefinite_spinner_avoided: true,
             conflict_rules_documented: true },
  builds: { toolchain_versions_pinned: true,
            sdk_versions_pinned: true,
            deterministic_builds_planned: true,
            signing_keys_held_in_keystore_outside_repos: true,
            version_code_and_name_discipline_planned: true,
            ci_builds_the_artifact: true,
            human_sign_off_on_release_build: true },
  testing: { device_matrix_includes_low_end_device: true,
             device_matrix_includes_current_device: true,
             largest_font_size_test_planned: true,
             offline_tests_planned: true,
             slow_network_tests_planned: true,
             upgrade_tests_from_old_app_planned: true,
             accessibility_pass_on_primary_flows_planned: true,
             talkback_and_voiceover_in_accessibility_pass: true },
  release: { staged_rollout_internal_beta_prod_planned: true,
             store_metadata_prepared: true,
             privacy_labels_prepared: true,
             data_safety_forms_prepared: true,
             crash_reporting_live_before_full_rollout: true,
             halt_rollout_rollback_plan_prepared: true },
  privacy: { minimum_collection_declared: true,
             collection_disclosed_in_store_and_in_app: true,
             analytics_without_pii_declared: true },
  red_lines: { secrets_in_app_bundle_present: false,
               permissions_without_feature_present: false,
               untested_upgrade_path_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "NATIVE_MOBILE_BUILD_PLAN_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 46);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.permissions_count, 3);
  assert.deepEqual(v.permissions_without_feature, []);
  assert.equal(v.feature_coverage, "1.000000");
  assert.deepEqual(v.duplicate_permission_names, []);
});

test("test_empty_permissions_list_is_a_valid_declaration", () => {
  const m = clone(COMPLETE) as any;
  m.permissions = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "NATIVE_MOBILE_BUILD_PLAN_READY");
  assert.equal(v.permissions_count, 0);
  assert.deepEqual(v.permissions_without_feature, []);
  assert.equal(v.feature_coverage, null);
  assert.deepEqual(v.duplicate_permission_names, []);
  assert.equal(checkStatus(v, "permissions_declared"), "pass");
  assert.equal(checkStatus(v, "every_permission_names_feature_needing_it"), "pass");
});

test("test_no_worst_device_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.constraints.worst_device_in_scope_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NATIVE_MOBILE_BUILD_PLAN_NOT_READY");
  assert.equal(v.sections["device_constraints_and_platform_citizenship"], "fail");
  assert.equal(checkStatus(v, "worst_device_in_scope_named"), "fail");
});

test("test_touch_targets_below_skill_floor_declaration_fails", () => {
  const m = clone(COMPLETE) as any;
  m.constraints.touch_targets_minimum_44px_declared = false;
  assert.equal(checkStatus(evaluate(m), "touch_targets_minimum_44px_declared"), "fail");
});

test("test_gesture_only_path_fails", () => {
  const m = clone(COMPLETE) as any;
  m.platform_citizenship.gestures_have_non_gesture_alternative = false;
  assert.equal(evaluate(m).verdict, "NATIVE_MOBILE_BUILD_PLAN_NOT_READY");
});

test("test_permission_without_feature_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.permissions[0].feature_needing_it = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "NATIVE_MOBILE_BUILD_PLAN_NOT_READY");
  assert.equal(checkStatus(v, "every_permission_names_feature_needing_it"), "fail");
  assert.deepEqual(v.permissions_without_feature, ["camera"]);
  assert.equal(v.feature_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_permission_missing_feature_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.permissions[0].feature_needing_it;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_permission_names_feature_needing_it"), "missing");
  assert.deepEqual(v.permissions_without_feature, []);
});

test("test_duplicate_permission_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.permissions[2].name = "camera";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_permission_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_permission_names, ["camera"]);
});

test("test_permission_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.permissions[2].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_permission_name_duplicated"), "missing");
  assert.deepEqual(v.duplicate_permission_names, []);
});

test("test_absent_permissions_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.permissions;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "permissions_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.permissions_count, null);
  assert.equal(v.permissions_without_feature, null);
  assert.equal(v.feature_coverage, null);
  assert.equal(v.duplicate_permission_names, null);
});

test("test_local_store_not_truth_fails_section2", () => {
  const m = clone(COMPLETE) as any;
  m.offline.local_store_is_truth_for_user_data = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NATIVE_MOBILE_BUILD_PLAN_NOT_READY");
  assert.equal(v.sections["offline_first_and_sync"], "fail");
});

test("test_indefinite_spinner_fails", () => {
  const m = clone(COMPLETE) as any;
  m.offline.indefinite_spinner_avoided = false;
  assert.equal(checkStatus(evaluate(m), "indefinite_spinner_avoided"), "fail");
});

test("test_conflict_rules_not_documented_fails", () => {
  const m = clone(COMPLETE) as any;
  m.offline.conflict_rules_documented = false;
  assert.equal(evaluate(m).verdict, "NATIVE_MOBILE_BUILD_PLAN_NOT_READY");
});

test("test_signing_keys_in_repo_plan_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.builds.signing_keys_held_in_keystore_outside_repos = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NATIVE_MOBILE_BUILD_PLAN_NOT_READY");
  assert.equal(v.sections["builds_and_signing"], "fail");
});

test("test_unpinned_sdk_fails", () => {
  const m = clone(COMPLETE) as any;
  m.builds.sdk_versions_pinned = false;
  assert.equal(checkStatus(evaluate(m), "sdk_versions_pinned"), "fail");
});

test("test_no_human_sign_off_fails", () => {
  const m = clone(COMPLETE) as any;
  m.builds.human_sign_off_on_release_build = false;
  assert.equal(evaluate(m).verdict, "NATIVE_MOBILE_BUILD_PLAN_NOT_READY");
});

test("test_no_low_end_device_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.testing.device_matrix_includes_low_end_device = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NATIVE_MOBILE_BUILD_PLAN_NOT_READY");
  assert.equal(v.sections["testing_and_accessibility"], "fail");
});

test("test_no_upgrade_tests_fails", () => {
  const m = clone(COMPLETE) as any;
  m.testing.upgrade_tests_from_old_app_planned = false;
  assert.equal(checkStatus(evaluate(m), "upgrade_tests_from_old_app_planned"), "fail");
});

test("test_no_largest_font_test_fails", () => {
  const m = clone(COMPLETE) as any;
  m.testing.largest_font_size_test_planned = false;
  assert.equal(evaluate(m).verdict, "NATIVE_MOBILE_BUILD_PLAN_NOT_READY");
});

test("test_crash_reporting_after_rollout_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.release.crash_reporting_live_before_full_rollout = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NATIVE_MOBILE_BUILD_PLAN_NOT_READY");
  assert.equal(v.sections["release_store_and_privacy"], "fail");
});

test("test_no_data_safety_forms_fails", () => {
  const m = clone(COMPLETE) as any;
  m.release.data_safety_forms_prepared = false;
  assert.equal(checkStatus(evaluate(m), "data_safety_forms_prepared"), "fail");
});

test("test_analytics_with_pii_fails", () => {
  const m = clone(COMPLETE) as any;
  m.privacy.analytics_without_pii_declared = false;
  assert.equal(evaluate(m).verdict, "NATIVE_MOBILE_BUILD_PLAN_NOT_READY");
});

test("test_secrets_in_bundle_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.secrets_in_app_bundle_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_secrets_in_app_bundle"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_permission_without_feature_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.permissions_without_feature_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_permissions_without_feature"), "fail");
  assert.equal(v.verdict, "NATIVE_MOBILE_BUILD_PLAN_NOT_READY");
});

test("test_untested_upgrade_path_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.untested_upgrade_path_present = true;
  assert.equal(checkStatus(evaluate(m), "no_untested_upgrade_path"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.testing;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["testing_and_accessibility"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.permissions_count, null);
  assert.equal(v.permissions_without_feature, null);
  assert.equal(v.feature_coverage, null);
  assert.equal(v.duplicate_permission_names, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: NATIVE_MOBILE_BUILD_PLAN_READY"));
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
  assert.throws(() => evaluate({ constraints: "should-be-an-object" }), fieldError("constraints"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ permissions: { name: "camera" } }), fieldError("permissions"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ permissions: ["camera"] }), fieldError("permissions[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.offline.conflict_rules_documented = "yes";
  assert.throws(() => evaluate(m), fieldError("offline.conflict_rules_documented"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.permissions[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("permissions[0].name"));
});

test("malformed: nested list entry string feature rejected", () => {
  const m = clone(COMPLETE) as any;
  m.permissions[1].feature_needing_it = 7;
  assert.throws(() => evaluate(m), fieldError("permissions[1].feature_needing_it"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.builds = null;
  assert.throws(() => evaluate(m), fieldError("builds"));
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
  .filter((f) => f.startsWith("native-mobile-build-plan--") && f.endsWith(".json"))
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
