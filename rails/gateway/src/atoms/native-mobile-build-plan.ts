// Native mobile build plan — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/native-mobile-build-plan/src/native_mobile_build_plan.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  app: "string",
  constraints: {
    screen_sizes_considered: "boolean",
    safe_areas_considered: "boolean",
    touch_targets_minimum_44px_declared: "boolean",
    battery_and_thermal_considered: "boolean",
    background_limits_considered: "boolean",
    worst_device_in_scope_named: "boolean",
  },
  platform_citizenship: {
    back_button_and_gestures_handled: "boolean",
    notification_permission_timing_planned: "boolean",
    deep_links_planned: "boolean",
    lifecycle_pause_resume_testing_planned: "boolean",
    gestures_have_non_gesture_alternative: "boolean",
  },
  permissions: [{
    name: "string",
    feature_needing_it: "string",
  }],
  offline: {
    local_store_is_truth_for_user_data: "boolean",
    sync_retry_and_queue_planned: "boolean",
    sync_states_pending_and_failed_visible: "boolean",
    indefinite_spinner_avoided: "boolean",
    conflict_rules_documented: "boolean",
  },
  builds: {
    toolchain_versions_pinned: "boolean",
    sdk_versions_pinned: "boolean",
    deterministic_builds_planned: "boolean",
    signing_keys_held_in_keystore_outside_repos: "boolean",
    version_code_and_name_discipline_planned: "boolean",
    ci_builds_the_artifact: "boolean",
    human_sign_off_on_release_build: "boolean",
  },
  testing: {
    device_matrix_includes_low_end_device: "boolean",
    device_matrix_includes_current_device: "boolean",
    largest_font_size_test_planned: "boolean",
    offline_tests_planned: "boolean",
    slow_network_tests_planned: "boolean",
    upgrade_tests_from_old_app_planned: "boolean",
    accessibility_pass_on_primary_flows_planned: "boolean",
    talkback_and_voiceover_in_accessibility_pass: "boolean",
  },
  release: {
    staged_rollout_internal_beta_prod_planned: "boolean",
    store_metadata_prepared: "boolean",
    privacy_labels_prepared: "boolean",
    data_safety_forms_prepared: "boolean",
    crash_reporting_live_before_full_rollout: "boolean",
    halt_rollout_rollback_plan_prepared: "boolean",
  },
  privacy: {
    minimum_collection_declared: "boolean",
    collection_disclosed_in_store_and_in_app: "boolean",
    analytics_without_pii_declared: "boolean",
  },
  red_lines: {
    secrets_in_app_bundle_present: "boolean",
    permissions_without_feature_present: "boolean",
    untested_upgrade_path_present: "boolean",
  },
};

export const SECTIONS = [
  "device_constraints_and_platform_citizenship",
  "offline_first_and_sync",
  "builds_and_signing",
  "testing_and_accessibility",
  "release_store_and_privacy",
  "red_lines",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  app: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  permissions_count: number | null;
  permissions_without_feature: string[] | null;
  feature_coverage: string | null;
  duplicate_permission_names: string[] | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [permissionsRaw, hasPermissions] = getPath(manifest, "permissions");
  const permissionsIsList = hasPermissions && Array.isArray(permissionsRaw);
  const rows: unknown[] = permissionsIsList ? (permissionsRaw as unknown[]) : [];
  const permissionsCount: number | null = permissionsIsList ? rows.length : null;

  const permissionsWithoutFeature: string[] | null = permissionsIsList
    ? rows.filter((c) => hasField(c, "feature_needing_it") &&
        !(typeof (c as Record<string, unknown>)["feature_needing_it"] === "string" &&
          (c as Record<string, unknown>)["feature_needing_it"] !== ""))
        .map(rowName)
    : null;
  let duplicatePermissionNames: string[] | null = null;
  if (permissionsIsList) {
    const seen: string[] = [];
    duplicatePermissionNames = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["name"] === "string") {
        const nm = c["name"] as string;
        if (seen.includes(nm) && !duplicatePermissionNames.includes(nm)) {
          duplicatePermissionNames.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const featureCoverage: number | null =
    permissionsIsList && permissionsCount !== null && permissionsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          typeof c["feature_needing_it"] === "string" &&
          c["feature_needing_it"] !== "").length / permissionsCount
      : null;

  // ---- Section 1: device_constraints_and_platform_citizenship ----
  boolCheck(results, "device_constraints_and_platform_citizenship",
    "screen_sizes_considered", manifest,
    ["constraints", "screen_sizes_considered"],
    "constraints: screen sizes are considered in the plan");
  boolCheck(results, "device_constraints_and_platform_citizenship",
    "safe_areas_considered", manifest,
    ["constraints", "safe_areas_considered"],
    "constraints: safe areas are considered in the plan");
  boolCheck(results, "device_constraints_and_platform_citizenship",
    "touch_targets_minimum_44px_declared", manifest,
    ["constraints", "touch_targets_minimum_44px_declared"],
    "constraints: touch targets adopt the skill's stated floor — at least 44px");
  boolCheck(results, "device_constraints_and_platform_citizenship",
    "battery_and_thermal_considered", manifest,
    ["constraints", "battery_and_thermal_considered"],
    "constraints: battery and thermal limits are considered in the plan");
  boolCheck(results, "device_constraints_and_platform_citizenship",
    "background_limits_considered", manifest,
    ["constraints", "background_limits_considered"],
    "constraints: background limits are considered in the plan");
  boolCheck(results, "device_constraints_and_platform_citizenship",
    "worst_device_in_scope_named", manifest,
    ["constraints", "worst_device_in_scope_named"],
    "constraints: the plan designs for the worst device in scope, and that device is named");
  boolCheck(results, "device_constraints_and_platform_citizenship",
    "back_button_and_gestures_handled", manifest,
    ["platform_citizenship", "back_button_and_gestures_handled"],
    "platform citizenship: the back button and gestures are handled");
  boolCheck(results, "device_constraints_and_platform_citizenship",
    "notification_permission_timing_planned", manifest,
    ["platform_citizenship", "notification_permission_timing_planned"],
    "platform citizenship: notification permission timing is planned");
  boolCheck(results, "device_constraints_and_platform_citizenship",
    "deep_links_planned", manifest,
    ["platform_citizenship", "deep_links_planned"],
    "platform citizenship: deep links are planned");
  boolCheck(results, "device_constraints_and_platform_citizenship",
    "lifecycle_pause_resume_testing_planned", manifest,
    ["platform_citizenship", "lifecycle_pause_resume_testing_planned"],
    "platform citizenship: lifecycle — pause and resume — testing is planned");
  boolCheck(results, "device_constraints_and_platform_citizenship",
    "gestures_have_non_gesture_alternative", manifest,
    ["platform_citizenship", "gestures_have_non_gesture_alternative"],
    "platform citizenship: haptics and gestures are seasoning, never the only path — a non-gesture alternative exists");
  check(results, "device_constraints_and_platform_citizenship",
    "permissions_declared", permissionsRaw, permissionsIsList,
    permissionsIsList,
    "the declared record names its permissions — the permissions list is present; an empty list declares that the plan requests no permissions");
  const featurePresent = permissionsIsList &&
    rows.every((c) => hasField(c, "feature_needing_it"));
  check(results, "device_constraints_and_platform_citizenship",
    "every_permission_names_feature_needing_it", permissionsRaw, featurePresent,
    permissionsIsList &&
      rows.every((c) => isPyDict(c) &&
        typeof c["feature_needing_it"] === "string" &&
        c["feature_needing_it"] !== ""),
    "permissions: every declared permission row names the feature needing it — no permissions without a feature needing them");
  const permNamePresent = permissionsIsList &&
    rows.every((c) => hasField(c, "name"));
  check(results, "device_constraints_and_platform_citizenship",
    "no_permission_name_duplicated", permissionsRaw, permNamePresent,
    permissionsIsList && duplicatePermissionNames !== null &&
      duplicatePermissionNames.length === 0,
    "permissions: no declared permission name is owned by more than one permission row");

  // ---- Section 2: offline_first_and_sync ----
  boolCheck(results, "offline_first_and_sync",
    "local_store_is_truth_for_user_data", manifest,
    ["offline", "local_store_is_truth_for_user_data"],
    "offline-first: the local store is the truth for user data");
  boolCheck(results, "offline_first_and_sync",
    "sync_retry_and_queue_planned", manifest,
    ["offline", "sync_retry_and_queue_planned"],
    "offline-first: sync with retry and queue is planned");
  boolCheck(results, "offline_first_and_sync",
    "sync_states_pending_and_failed_visible", manifest,
    ["offline", "sync_states_pending_and_failed_visible"],
    "offline-first: sync state is visible — pending and failed states are shown");
  boolCheck(results, "offline_first_and_sync",
    "indefinite_spinner_avoided", manifest,
    ["offline", "indefinite_spinner_avoided"],
    "offline-first: no spinners-forever — an indefinite spinner is avoided");
  boolCheck(results, "offline_first_and_sync",
    "conflict_rules_documented", manifest,
    ["offline", "conflict_rules_documented"],
    "offline-first: conflict rules are documented");

  // ---- Section 3: builds_and_signing ----
  boolCheck(results, "builds_and_signing",
    "toolchain_versions_pinned", manifest,
    ["builds", "toolchain_versions_pinned"],
    "builds: toolchain versions are pinned");
  boolCheck(results, "builds_and_signing",
    "sdk_versions_pinned", manifest,
    ["builds", "sdk_versions_pinned"],
    "builds: SDK versions are pinned");
  boolCheck(results, "builds_and_signing",
    "deterministic_builds_planned", manifest,
    ["builds", "deterministic_builds_planned"],
    "builds: deterministic builds are planned");
  boolCheck(results, "builds_and_signing",
    "signing_keys_held_in_keystore_outside_repos", manifest,
    ["builds", "signing_keys_held_in_keystore_outside_repos"],
    "builds: signing keys are held in the keystore — never in repos");
  boolCheck(results, "builds_and_signing",
    "version_code_and_name_discipline_planned", manifest,
    ["builds", "version_code_and_name_discipline_planned"],
    "builds: versionCode and versionName discipline is planned");
  boolCheck(results, "builds_and_signing",
    "ci_builds_the_artifact", manifest,
    ["builds", "ci_builds_the_artifact"],
    "builds: CI builds the artifact");
  boolCheck(results, "builds_and_signing",
    "human_sign_off_on_release_build", manifest,
    ["builds", "human_sign_off_on_release_build"],
    "builds: humans sign off the release build");

  // ---- Section 4: testing_and_accessibility ----
  boolCheck(results, "testing_and_accessibility",
    "device_matrix_includes_low_end_device", manifest,
    ["testing", "device_matrix_includes_low_end_device"],
    "testing: the device matrix includes a low-end device");
  boolCheck(results, "testing_and_accessibility",
    "device_matrix_includes_current_device", manifest,
    ["testing", "device_matrix_includes_current_device"],
    "testing: the device matrix includes a current device");
  boolCheck(results, "testing_and_accessibility",
    "largest_font_size_test_planned", manifest,
    ["testing", "largest_font_size_test_planned"],
    "testing: the largest font size is tested");
  boolCheck(results, "testing_and_accessibility",
    "offline_tests_planned", manifest,
    ["testing", "offline_tests_planned"],
    "testing: offline behavior tests are planned");
  boolCheck(results, "testing_and_accessibility",
    "slow_network_tests_planned", manifest,
    ["testing", "slow_network_tests_planned"],
    "testing: slow-network tests are planned");
  boolCheck(results, "testing_and_accessibility",
    "upgrade_tests_from_old_app_planned", manifest,
    ["testing", "upgrade_tests_from_old_app_planned"],
    "testing: upgrade tests — old app to new data — are planned");
  boolCheck(results, "testing_and_accessibility",
    "accessibility_pass_on_primary_flows_planned", manifest,
    ["testing", "accessibility_pass_on_primary_flows_planned"],
    "testing: an accessibility pass on the primary flows is planned");
  boolCheck(results, "testing_and_accessibility",
    "talkback_and_voiceover_in_accessibility_pass", manifest,
    ["testing", "talkback_and_voiceover_in_accessibility_pass"],
    "testing: the accessibility pass covers TalkBack and VoiceOver");

  // ---- Section 5: release_store_and_privacy ----
  boolCheck(results, "release_store_and_privacy",
    "staged_rollout_internal_beta_prod_planned", manifest,
    ["release", "staged_rollout_internal_beta_prod_planned"],
    "release: staged rollout — internal, then beta, then prod — is planned");
  boolCheck(results, "release_store_and_privacy",
    "store_metadata_prepared", manifest,
    ["release", "store_metadata_prepared"],
    "release: store metadata — screenshots and the listing — is prepared");
  boolCheck(results, "release_store_and_privacy",
    "privacy_labels_prepared", manifest,
    ["release", "privacy_labels_prepared"],
    "release: store privacy labels are prepared");
  boolCheck(results, "release_store_and_privacy",
    "data_safety_forms_prepared", manifest,
    ["release", "data_safety_forms_prepared"],
    "release: store data-safety forms are prepared");
  boolCheck(results, "release_store_and_privacy",
    "crash_reporting_live_before_full_rollout", manifest,
    ["release", "crash_reporting_live_before_full_rollout"],
    "release: crash reporting is live before 100% rollout");
  boolCheck(results, "release_store_and_privacy",
    "halt_rollout_rollback_plan_prepared", manifest,
    ["release", "halt_rollout_rollback_plan_prepared"],
    "release: a halt-rollout rollback plan is prepared");
  boolCheck(results, "release_store_and_privacy",
    "minimum_collection_declared", manifest,
    ["privacy", "minimum_collection_declared"],
    "privacy: the plan collects the minimum");
  boolCheck(results, "release_store_and_privacy",
    "collection_disclosed_in_store_and_in_app", manifest,
    ["privacy", "collection_disclosed_in_store_and_in_app"],
    "privacy: what is collected is disclosed in-store and in-app");
  boolCheck(results, "release_store_and_privacy",
    "analytics_without_pii_declared", manifest,
    ["privacy", "analytics_without_pii_declared"],
    "privacy: analytics run without PII");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines",
    "no_secrets_in_app_bundle", manifest,
    ["red_lines", "secrets_in_app_bundle_present"],
    "red line: no secrets in the app bundle are present in the plan");
  falseCheck(results, "red_lines",
    "no_permissions_without_feature", manifest,
    ["red_lines", "permissions_without_feature_present"],
    "red line: no permissions without a feature needing them are present in the plan");
  falseCheck(results, "red_lines",
    "no_untested_upgrade_path", manifest,
    ["red_lines", "untested_upgrade_path_present"],
    "red line: no untested upgrade path is present in the plan");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "NATIVE_MOBILE_BUILD_PLAN_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "NATIVE_MOBILE_BUILD_PLAN_READY";
  }

  const computedNames = [
    "permissions_declared",
    "every_permission_names_feature_needing_it",
    "no_permission_name_duplicated",
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "native-mobile-build-plan",
    atom_version: "0.1.0",
    app: manifest["app"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    permissions_count: permissionsCount,
    permissions_without_feature: permissionsWithoutFeature,
    feature_coverage: fmt6(featureCoverage),
    duplicate_permission_names: duplicatePermissionNames,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "NATIVE MOBILE BUILD PLAN",
    `app: ${pyStr(verdict.app ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
