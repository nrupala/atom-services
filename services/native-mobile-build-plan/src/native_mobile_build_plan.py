#!/usr/bin/env python3
"""Native mobile build plan — deterministic core.

Built from the bound skill `mobile-native`: "Build native mobile
with discipline — device constraints, offline-first, builds/
releases, store compliance." ("Phones are hostile environments:
flaky networks, small screens, aggressive OS policies, and stores
that review you. Build for the device, not the demo.")

This atom is a DELIVERABLE audit of a declared native-mobile
build plan: it audits the plan record a caller declares against
the plan the skill defines — device constraints and platform
citizenship first, offline-first sync, pinned and signed builds,
a device/accessibility test matrix, staged release with store
and privacy preparation, and the skill's red lines refused. It
does not build an app itself, run a toolchain, inspect a bundle
or a repository, submit anything to a store, or verify that a
declared plan was ever carried out — it checks that the build
plan record the skill requires is present and internally
complete and consistent on the declared evidence.

Distinct ground: the nearest siblings are `local-first-sync-
design` (a sync-PROTOCOL design record for any app — entities,
merge semantics, tombstones, vector clocks, CRDT/OT choice),
`multiplatform-core-design` (a shared-core record across many
surfaces — what the portable core holds, per-surface adapters,
PWA-first sufficiency), `cicd-pipeline-design` (a generic CI
pipeline record — stages, minutes budgets, cache keying) and
`release-readiness` (a generic software release gate — version,
tag, changelog and artifact sealing for any product). This atom
shares zero checks with any of them: every check here is a
native-mobile build-plan question — the worst device in scope,
safe areas and the skill's 44px touch-target floor declared,
back-button/gesture and notification-timing citizenship, the
local store as truth for user data with visible pending/failed
sync states, signing keys held in a keystore outside repos,
versionCode/versionName discipline, a low-end + current +
largest-font device matrix, upgrade tests from the old app,
TalkBack/VoiceOver in the accessibility pass, staged internal
-> beta -> prod rollout with privacy labels and data-safety
forms prepared, crash reporting live before full rollout, and
the mobile red lines (no secrets in the bundle, no permission
without a feature, no untested upgrade path). The boundary is:
a native phone/tablet app's build-and-release plan here;
sync-protocol design, shared-core architecture, generic CI and
generic release gating there.

The caller submits a build-plan manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- permissions: the declared `permissions` list must be present
  (an empty list is a valid declaration — the plan requests no
  permissions; the skill requires no permission), and every
  declared permission row must name the non-empty
  `feature_needing_it` it exists for (the skill's red line: "no
  permissions without a feature needing them");
- permission-name ownership: no declared permission name may
  be owned by more than one permission row (one record per
  permission — internal consistency of the declared rows).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states exactly one numeric floor — touch targets
>=44px — and it is checked only as the caller's declaration
that the floor is adopted, never as a measured pixel value.
No other numeric threshold is stated — no screen-size range,
no battery or thermal limit, no retry count or backoff, no
device-matrix size, no font scale, no slow-network speed, no
rollout percentage or stage duration, no crash-free rate — so
no numeric threshold check is invented; those quantities are
caller attestations at most, and quantities here are computed
and reported, with completeness (every declared permission
row) as the only bar, exactly as stated above.

Verdict:
- any fail             -> NATIVE_MOBILE_BUILD_PLAN_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> NATIVE_MOBILE_BUILD_PLAN_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "device_constraints_and_platform_citizenship",
    "offline_first_and_sync",
    "builds_and_signing",
    "testing_and_accessibility",
    "release_store_and_privacy",
    "red_lines",
)

MANIFEST_SPEC = {
    "app": "string",
    "constraints": {
        "screen_sizes_considered": "boolean",
        "safe_areas_considered": "boolean",
        "touch_targets_minimum_44px_declared": "boolean",
        "battery_and_thermal_considered": "boolean",
        "background_limits_considered": "boolean",
        "worst_device_in_scope_named": "boolean",
    },
    "platform_citizenship": {
        "back_button_and_gestures_handled": "boolean",
        "notification_permission_timing_planned": "boolean",
        "deep_links_planned": "boolean",
        "lifecycle_pause_resume_testing_planned": "boolean",
        "gestures_have_non_gesture_alternative": "boolean",
    },
    "permissions": [{
        "name": "string",
        "feature_needing_it": "string",
    }],
    "offline": {
        "local_store_is_truth_for_user_data": "boolean",
        "sync_retry_and_queue_planned": "boolean",
        "sync_states_pending_and_failed_visible": "boolean",
        "indefinite_spinner_avoided": "boolean",
        "conflict_rules_documented": "boolean",
    },
    "builds": {
        "toolchain_versions_pinned": "boolean",
        "sdk_versions_pinned": "boolean",
        "deterministic_builds_planned": "boolean",
        "signing_keys_held_in_keystore_outside_repos": "boolean",
        "version_code_and_name_discipline_planned": "boolean",
        "ci_builds_the_artifact": "boolean",
        "human_sign_off_on_release_build": "boolean",
    },
    "testing": {
        "device_matrix_includes_low_end_device": "boolean",
        "device_matrix_includes_current_device": "boolean",
        "largest_font_size_test_planned": "boolean",
        "offline_tests_planned": "boolean",
        "slow_network_tests_planned": "boolean",
        "upgrade_tests_from_old_app_planned": "boolean",
        "accessibility_pass_on_primary_flows_planned": "boolean",
        "talkback_and_voiceover_in_accessibility_pass": "boolean",
    },
    "release": {
        "staged_rollout_internal_beta_prod_planned": "boolean",
        "store_metadata_prepared": "boolean",
        "privacy_labels_prepared": "boolean",
        "data_safety_forms_prepared": "boolean",
        "crash_reporting_live_before_full_rollout": "boolean",
        "halt_rollout_rollback_plan_prepared": "boolean",
    },
    "privacy": {
        "minimum_collection_declared": "boolean",
        "collection_disclosed_in_store_and_in_app": "boolean",
        "analytics_without_pii_declared": "boolean",
    },
    "red_lines": {
        "secrets_in_app_bundle_present": "boolean",
        "permissions_without_feature_present": "boolean",
        "untested_upgrade_path_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for a native mobile build plan manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    permissions, has_permissions = _get(manifest, "permissions")
    permissions_is_list = has_permissions and isinstance(permissions, list)
    permissions_count = len(permissions) if permissions_is_list else None
    rows = permissions if permissions_is_list else []

    permissions_without_feature = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "feature_needing_it" in c
         and not (isinstance(c.get("feature_needing_it"), str)
                  and c.get("feature_needing_it") != "")]
        if permissions_is_list else None
    )
    duplicate_permission_names = None
    if permissions_is_list:
        seen = []
        duplicate_permission_names = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("name"), str):
                nm = c["name"]
                if nm in seen and nm not in duplicate_permission_names:
                    duplicate_permission_names.append(nm)
                seen.append(nm)
    feature_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and isinstance(c.get("feature_needing_it"), str)
            and c.get("feature_needing_it") != "")
        / permissions_count
        if permissions_is_list and permissions_count > 0 else None
    )

    # ---- Section 1: device_constraints_and_platform_citizenship
    #      (skill Method 1 "Constraints first" and Method 3
    #      "Platform citizenship", plus the computed permission
    #      rows — Method 1 names permissions among the device
    #      constraints, and the red line bars a permission with
    #      no feature needing it) ----
    _bool_check(results, "device_constraints_and_platform_citizenship",
                "screen_sizes_considered", manifest,
                ("constraints", "screen_sizes_considered"),
                "constraints: screen sizes are considered in the "
                "plan")
    _bool_check(results, "device_constraints_and_platform_citizenship",
                "safe_areas_considered", manifest,
                ("constraints", "safe_areas_considered"),
                "constraints: safe areas are considered in the plan")
    _bool_check(results, "device_constraints_and_platform_citizenship",
                "touch_targets_minimum_44px_declared", manifest,
                ("constraints", "touch_targets_minimum_44px_declared"),
                "constraints: touch targets adopt the skill's "
                "stated floor — at least 44px")
    _bool_check(results, "device_constraints_and_platform_citizenship",
                "battery_and_thermal_considered", manifest,
                ("constraints", "battery_and_thermal_considered"),
                "constraints: battery and thermal limits are "
                "considered in the plan")
    _bool_check(results, "device_constraints_and_platform_citizenship",
                "background_limits_considered", manifest,
                ("constraints", "background_limits_considered"),
                "constraints: background limits are considered in "
                "the plan")
    _bool_check(results, "device_constraints_and_platform_citizenship",
                "worst_device_in_scope_named", manifest,
                ("constraints", "worst_device_in_scope_named"),
                "constraints: the plan designs for the worst "
                "device in scope, and that device is named")
    _bool_check(results, "device_constraints_and_platform_citizenship",
                "back_button_and_gestures_handled", manifest,
                ("platform_citizenship",
                 "back_button_and_gestures_handled"),
                "platform citizenship: the back button and "
                "gestures are handled")
    _bool_check(results, "device_constraints_and_platform_citizenship",
                "notification_permission_timing_planned", manifest,
                ("platform_citizenship",
                 "notification_permission_timing_planned"),
                "platform citizenship: notification permission "
                "timing is planned")
    _bool_check(results, "device_constraints_and_platform_citizenship",
                "deep_links_planned", manifest,
                ("platform_citizenship", "deep_links_planned"),
                "platform citizenship: deep links are planned")
    _bool_check(results, "device_constraints_and_platform_citizenship",
                "lifecycle_pause_resume_testing_planned", manifest,
                ("platform_citizenship",
                 "lifecycle_pause_resume_testing_planned"),
                "platform citizenship: lifecycle — pause and "
                "resume — testing is planned")
    _bool_check(results, "device_constraints_and_platform_citizenship",
                "gestures_have_non_gesture_alternative", manifest,
                ("platform_citizenship",
                 "gestures_have_non_gesture_alternative"),
                "platform citizenship: haptics and gestures are "
                "seasoning, never the only path — a non-gesture "
                "alternative exists")
    _check(results, "device_constraints_and_platform_citizenship",
           "permissions_declared", permissions, permissions_is_list,
           permissions_is_list,
           "the declared record names its permissions — the "
           "permissions list is present; an empty list declares "
           "that the plan requests no permissions")
    feature_present = (
        permissions_is_list
        and all(isinstance(c, dict) and "feature_needing_it" in c
                for c in rows)
    )
    _check(results, "device_constraints_and_platform_citizenship",
           "every_permission_names_feature_needing_it", permissions,
           feature_present,
           permissions_is_list
           and all(isinstance(c, dict)
                   and isinstance(c.get("feature_needing_it"), str)
                   and c.get("feature_needing_it") != ""
                   for c in rows),
           "permissions: every declared permission row names "
           "the feature needing it — no permissions without a "
           "feature needing them")
    perm_name_present = (
        permissions_is_list
        and all(isinstance(c, dict) and "name" in c for c in rows)
    )
    _check(results, "device_constraints_and_platform_citizenship",
           "no_permission_name_duplicated", permissions,
           perm_name_present,
           permissions_is_list
           and duplicate_permission_names is not None
           and len(duplicate_permission_names) == 0,
           "permissions: no declared permission name is owned "
           "by more than one permission row")

    # ---- Section 2: offline_first_and_sync (skill Method 2
    #      "Offline-first" — the local store as truth, sync with
    #      retry/queue, visible sync state, conflict rules
    #      documented; and the quality gate's no spinners-
    #      forever) ----
    _bool_check(results, "offline_first_and_sync",
                "local_store_is_truth_for_user_data", manifest,
                ("offline", "local_store_is_truth_for_user_data"),
                "offline-first: the local store is the truth for "
                "user data")
    _bool_check(results, "offline_first_and_sync",
                "sync_retry_and_queue_planned", manifest,
                ("offline", "sync_retry_and_queue_planned"),
                "offline-first: sync with retry and queue is "
                "planned")
    _bool_check(results, "offline_first_and_sync",
                "sync_states_pending_and_failed_visible", manifest,
                ("offline", "sync_states_pending_and_failed_visible"),
                "offline-first: sync state is visible — pending "
                "and failed states are shown")
    _bool_check(results, "offline_first_and_sync",
                "indefinite_spinner_avoided", manifest,
                ("offline", "indefinite_spinner_avoided"),
                "offline-first: no spinners-forever — an "
                "indefinite spinner is avoided")
    _bool_check(results, "offline_first_and_sync",
                "conflict_rules_documented", manifest,
                ("offline", "conflict_rules_documented"),
                "offline-first: conflict rules are documented")

    # ---- Section 3: builds_and_signing (skill Method 4
    #      "Builds" — pinned toolchain and SDK, deterministic
    #      builds, signing keys in the keystore never in repos,
    #      versionCode/versionName discipline, CI builds the
    #      artifact and humans sign off) ----
    _bool_check(results, "builds_and_signing",
                "toolchain_versions_pinned", manifest,
                ("builds", "toolchain_versions_pinned"),
                "builds: toolchain versions are pinned")
    _bool_check(results, "builds_and_signing",
                "sdk_versions_pinned", manifest,
                ("builds", "sdk_versions_pinned"),
                "builds: SDK versions are pinned")
    _bool_check(results, "builds_and_signing",
                "deterministic_builds_planned", manifest,
                ("builds", "deterministic_builds_planned"),
                "builds: deterministic builds are planned")
    _bool_check(results, "builds_and_signing",
                "signing_keys_held_in_keystore_outside_repos",
                manifest,
                ("builds",
                 "signing_keys_held_in_keystore_outside_repos"),
                "builds: signing keys are held in the keystore — "
                "never in repos")
    _bool_check(results, "builds_and_signing",
                "version_code_and_name_discipline_planned", manifest,
                ("builds", "version_code_and_name_discipline_planned"),
                "builds: versionCode and versionName discipline "
                "is planned")
    _bool_check(results, "builds_and_signing",
                "ci_builds_the_artifact", manifest,
                ("builds", "ci_builds_the_artifact"),
                "builds: CI builds the artifact")
    _bool_check(results, "builds_and_signing",
                "human_sign_off_on_release_build", manifest,
                ("builds", "human_sign_off_on_release_build"),
                "builds: humans sign off the release build")

    # ---- Section 4: testing_and_accessibility (skill Method 6
    #      "Testing" — a device matrix of low-end and current
    #      plus the largest font size, offline and slow-network
    #      tests, upgrade tests, and an accessibility pass on
    #      TalkBack/VoiceOver; plus the quality gate's
    #      accessibility pass on primary flows) ----
    _bool_check(results, "testing_and_accessibility",
                "device_matrix_includes_low_end_device", manifest,
                ("testing", "device_matrix_includes_low_end_device"),
                "testing: the device matrix includes a low-end "
                "device")
    _bool_check(results, "testing_and_accessibility",
                "device_matrix_includes_current_device", manifest,
                ("testing", "device_matrix_includes_current_device"),
                "testing: the device matrix includes a current "
                "device")
    _bool_check(results, "testing_and_accessibility",
                "largest_font_size_test_planned", manifest,
                ("testing", "largest_font_size_test_planned"),
                "testing: the largest font size is tested")
    _bool_check(results, "testing_and_accessibility",
                "offline_tests_planned", manifest,
                ("testing", "offline_tests_planned"),
                "testing: offline behavior tests are planned")
    _bool_check(results, "testing_and_accessibility",
                "slow_network_tests_planned", manifest,
                ("testing", "slow_network_tests_planned"),
                "testing: slow-network tests are planned")
    _bool_check(results, "testing_and_accessibility",
                "upgrade_tests_from_old_app_planned", manifest,
                ("testing", "upgrade_tests_from_old_app_planned"),
                "testing: upgrade tests — old app to new data — "
                "are planned")
    _bool_check(results, "testing_and_accessibility",
                "accessibility_pass_on_primary_flows_planned",
                manifest,
                ("testing",
                 "accessibility_pass_on_primary_flows_planned"),
                "testing: an accessibility pass on the primary "
                "flows is planned")
    _bool_check(results, "testing_and_accessibility",
                "talkback_and_voiceover_in_accessibility_pass",
                manifest,
                ("testing",
                 "talkback_and_voiceover_in_accessibility_pass"),
                "testing: the accessibility pass covers TalkBack "
                "and VoiceOver")

    # ---- Section 5: release_store_and_privacy (skill Method 5
    #      "Release discipline" — staged rollout, store metadata,
    #      crash reporting live before full rollout, a halt-
    #      rollout rollback plan; Method 7 "Privacy" — collect
    #      the minimum, disclose in-store and in-app, analytics
    #      without PII; plus the store privacy labels and
    #      data-safety forms Method 5 names) ----
    _bool_check(results, "release_store_and_privacy",
                "staged_rollout_internal_beta_prod_planned", manifest,
                ("release",
                 "staged_rollout_internal_beta_prod_planned"),
                "release: staged rollout — internal, then beta, "
                "then prod — is planned")
    _bool_check(results, "release_store_and_privacy",
                "store_metadata_prepared", manifest,
                ("release", "store_metadata_prepared"),
                "release: store metadata — screenshots and the "
                "listing — is prepared")
    _bool_check(results, "release_store_and_privacy",
                "privacy_labels_prepared", manifest,
                ("release", "privacy_labels_prepared"),
                "release: store privacy labels are prepared")
    _bool_check(results, "release_store_and_privacy",
                "data_safety_forms_prepared", manifest,
                ("release", "data_safety_forms_prepared"),
                "release: store data-safety forms are prepared")
    _bool_check(results, "release_store_and_privacy",
                "crash_reporting_live_before_full_rollout", manifest,
                ("release", "crash_reporting_live_before_full_rollout"),
                "release: crash reporting is live before 100% "
                "rollout")
    _bool_check(results, "release_store_and_privacy",
                "halt_rollout_rollback_plan_prepared", manifest,
                ("release", "halt_rollout_rollback_plan_prepared"),
                "release: a halt-rollout rollback plan is "
                "prepared")
    _bool_check(results, "release_store_and_privacy",
                "minimum_collection_declared", manifest,
                ("privacy", "minimum_collection_declared"),
                "privacy: the plan collects the minimum")
    _bool_check(results, "release_store_and_privacy",
                "collection_disclosed_in_store_and_in_app", manifest,
                ("privacy", "collection_disclosed_in_store_and_in_app"),
                "privacy: what is collected is disclosed in-store "
                "and in-app")
    _bool_check(results, "release_store_and_privacy",
                "analytics_without_pii_declared", manifest,
                ("privacy", "analytics_without_pii_declared"),
                "privacy: analytics run without PII")

    # ---- Section 6: red_lines (skill "Red lines" — no secrets
    #      in the app bundle, no permissions without a feature
    #      needing them, no untested upgrade path) ----
    _false_check(results, "red_lines",
                 "no_secrets_in_app_bundle", manifest,
                 ("red_lines", "secrets_in_app_bundle_present"),
                 "red line: no secrets in the app bundle are "
                 "present in the plan")
    _false_check(results, "red_lines",
                 "no_permissions_without_feature", manifest,
                 ("red_lines", "permissions_without_feature_present"),
                 "red line: no permissions without a feature "
                 "needing them are present in the plan")
    _false_check(results, "red_lines",
                 "no_untested_upgrade_path", manifest,
                 ("red_lines", "untested_upgrade_path_present"),
                 "red line: no untested upgrade path is present "
                 "in the plan")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "NATIVE_MOBILE_BUILD_PLAN_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "NATIVE_MOBILE_BUILD_PLAN_READY"

    computed_names = (
        "permissions_declared",
        "every_permission_names_feature_needing_it",
        "no_permission_name_duplicated",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "native-mobile-build-plan",
        "atom_version": "0.1.0",
        "app": manifest.get("app"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "permissions_count": permissions_count,
        "permissions_without_feature": permissions_without_feature,
        "feature_coverage": _fmt6(feature_coverage),
        "duplicate_permission_names": duplicate_permission_names,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "NATIVE MOBILE BUILD PLAN",
        f"app: {verdict.get('app')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: native_mobile_build_plan.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "NATIVE_MOBILE_BUILD_PLAN_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
