# Native mobile build plan — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are planning a native mobile app — device constraints, offline-first behaviour, pinned and signed builds, a device/accessibility test matrix, staged store release — and you have a record of that build plan, made at the planning stage before the release build. This atom reads one declared manifest and returns one deterministic verdict across six sections (device_constraints_and_platform_citizenship, offline_first_and_sync, builds_and_signing, testing_and_accessibility, release_store_and_privacy, red_lines): **NATIVE_MOBILE_BUILD_PLAN_READY**, **NATIVE_MOBILE_BUILD_PLAN_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 46 checks. It audits the declared record's completeness and consistency only — it builds no app itself, runs no toolchain, inspects no bundle, repository, keystore or store listing, runs no device test, and does not verify that a declared plan was ever carried out. A plan is ready *on your declared evidence*: it never judges whether the named worst device is really the worst, whether the declared conflict rules are good, whether a permission is genuinely needed by the feature named for it, or whether the plan will work. The three computed checks: the declared `permissions` list must be present (an empty list passes — it declares the plan requests no permissions); every permission row must name a non-empty `feature_needing_it` (the skill's red line: no permissions without a feature needing them); and no permission `name` may appear on more than one row. The skill states exactly one numeric floor — touch targets ≥44px — and it is checked only as your declaration that the floor is adopted, never as a measured pixel value. No other numeric threshold is imposed — no touch-target minimum above the skill's stated 44px or any measured pixel value, no battery, thermal or background-execution limit, no sync retry count, backoff interval or queue depth, no choice among conflict-resolution strategies, no specific toolchain or SDK version numbers, no number of devices in the test matrix or specific devices beyond a low-end and a current device, no font scale beyond the largest font size being tested, no slow-network speed or latency figure, no accessibility conformance level or score, no rollout percentages or stage durations, no crash-free rate or crash-reporting threshold, no number of permissions an app may request, and no data-retention period or analytics standard beyond analytics running without PII as declared. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "native-mobile-build-plan"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/native-mobile-build-plan` — tool name `native_mobile_build_plan`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/native-mobile-build-plan` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `app` | app name (string; carried into the output, not checked) |
| `constraints.screen_sizes_considered` | device-constraints evidence: screen sizes are considered in the plan |
| `constraints.safe_areas_considered` | device-constraints evidence: safe areas are considered in the plan |
| `constraints.touch_targets_minimum_44px_declared` | device-constraints evidence: touch targets adopt the skill's stated floor — at least 44px (declaration only, never a measured value) |
| `constraints.battery_and_thermal_considered` | device-constraints evidence: battery and thermal limits are considered in the plan |
| `constraints.background_limits_considered` | device-constraints evidence: background limits are considered in the plan |
| `constraints.worst_device_in_scope_named` | device-constraints evidence: the plan designs for the worst device in scope, and that device is named |
| `platform_citizenship.back_button_and_gestures_handled` | platform-citizenship evidence: the back button and gestures are handled |
| `platform_citizenship.notification_permission_timing_planned` | platform-citizenship evidence: notification permission timing is planned |
| `platform_citizenship.deep_links_planned` | platform-citizenship evidence: deep links are planned |
| `platform_citizenship.lifecycle_pause_resume_testing_planned` | platform-citizenship evidence: lifecycle — pause and resume — testing is planned |
| `platform_citizenship.gestures_have_non_gesture_alternative` | platform-citizenship evidence: gestures have a non-gesture alternative — gestures are never the only path |
| `permissions` (list of permission-row objects) | computed: must be present; an empty list declares the plan requests no permissions; reported as `permissions_count` |
| `permissions[].name` (string) | names the row in the computed outputs; computed: no name may appear on more than one row (duplicates reported in `duplicate_permission_names`) |
| `permissions[].feature_needing_it` (string) | the feature that needs the permission; computed: every row must name a non-empty feature; rows with the field present but empty are reported in `permissions_without_feature` |
| `offline.local_store_is_truth_for_user_data` | offline-first evidence: the local store is the truth for user data |
| `offline.sync_retry_and_queue_planned` | offline-first evidence: sync with retry and queue is planned |
| `offline.sync_states_pending_and_failed_visible` | offline-first evidence: sync state is visible — pending and failed states are shown |
| `offline.indefinite_spinner_avoided` | offline-first evidence: no spinners-forever — an indefinite spinner is avoided |
| `offline.conflict_rules_documented` | offline-first evidence: conflict rules are documented |
| `builds.toolchain_versions_pinned` | builds evidence: toolchain versions are pinned |
| `builds.sdk_versions_pinned` | builds evidence: SDK versions are pinned |
| `builds.deterministic_builds_planned` | builds evidence: deterministic builds are planned |
| `builds.signing_keys_held_in_keystore_outside_repos` | builds evidence: signing keys are held in the keystore — never in repos |
| `builds.version_code_and_name_discipline_planned` | builds evidence: versionCode and versionName discipline is planned |
| `builds.ci_builds_the_artifact` | builds evidence: CI builds the artifact |
| `builds.human_sign_off_on_release_build` | builds evidence: humans sign off the release build |
| `testing.device_matrix_includes_low_end_device` | testing evidence: the device matrix includes a low-end device |
| `testing.device_matrix_includes_current_device` | testing evidence: the device matrix includes a current device |
| `testing.largest_font_size_test_planned` | testing evidence: the largest font size is tested |
| `testing.offline_tests_planned` | testing evidence: offline behavior tests are planned |
| `testing.slow_network_tests_planned` | testing evidence: slow-network tests are planned |
| `testing.upgrade_tests_from_old_app_planned` | testing evidence: upgrade tests — old app to new data — are planned |
| `testing.accessibility_pass_on_primary_flows_planned` | testing evidence: an accessibility pass on the primary flows is planned |
| `testing.talkback_and_voiceover_in_accessibility_pass` | testing evidence: the accessibility pass covers TalkBack and VoiceOver |
| `release.staged_rollout_internal_beta_prod_planned` | release evidence: staged rollout — internal, then beta, then prod — is planned |
| `release.store_metadata_prepared` | release evidence: store metadata — screenshots and the listing — is prepared |
| `release.privacy_labels_prepared` | release evidence: store privacy labels are prepared |
| `release.data_safety_forms_prepared` | release evidence: store data-safety forms are prepared |
| `release.crash_reporting_live_before_full_rollout` | release evidence: crash reporting is live before 100% rollout |
| `release.halt_rollout_rollback_plan_prepared` | release evidence: a halt-rollout rollback plan is prepared |
| `privacy.minimum_collection_declared` | privacy evidence: the plan collects the minimum |
| `privacy.collection_disclosed_in_store_and_in_app` | privacy evidence: what is collected is disclosed in-store and in-app |
| `privacy.analytics_without_pii_declared` | privacy evidence: analytics run without PII |
| `red_lines.secrets_in_app_bundle_present` | must be `false` to pass (red line: no secrets in the app bundle) |
| `red_lines.permissions_without_feature_present` | must be `false` to pass (red line: no permissions without a feature needing them) |
| `red_lines.untested_upgrade_path_present` | must be `false` to pass (red line: no untested upgrade path) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward NATIVE_MOBILE_BUILD_PLAN_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/native-mobile-build-plan`:

```json
{
  "app": "MyMilo-Vault",
  "constraints": {
    "screen_sizes_considered": true,
    "safe_areas_considered": true,
    "touch_targets_minimum_44px_declared": true,
    "battery_and_thermal_considered": true,
    "background_limits_considered": true,
    "worst_device_in_scope_named": true
  },
  "platform_citizenship": {
    "back_button_and_gestures_handled": true,
    "notification_permission_timing_planned": true,
    "deep_links_planned": true,
    "lifecycle_pause_resume_testing_planned": true,
    "gestures_have_non_gesture_alternative": true
  },
  "permissions": [
    {
      "name": "CAMERA",
      "feature_needing_it": "QR_Scanner"
    }
  ],
  "offline": {
    "local_store_is_truth_for_user_data": true,
    "sync_retry_and_queue_planned": true,
    "sync_states_pending_and_failed_visible": true,
    "indefinite_spinner_avoided": true,
    "conflict_rules_documented": true
  },
  "builds": {
    "toolchain_versions_pinned": true,
    "sdk_versions_pinned": true,
    "deterministic_builds_planned": true,
    "signing_keys_held_in_keystore_outside_repos": true,
    "version_code_and_name_discipline_planned": true,
    "ci_builds_the_artifact": true,
    "human_sign_off_on_release_build": true
  },
  "testing": {
    "device_matrix_includes_low_end_device": true,
    "device_matrix_includes_current_device": true,
    "largest_font_size_test_planned": true,
    "offline_tests_planned": true,
    "slow_network_tests_planned": true,
    "upgrade_tests_from_old_app_planned": true,
    "accessibility_pass_on_primary_flows_planned": true,
    "talkback_and_voiceover_in_accessibility_pass": true
  },
  "release": {
    "staged_rollout_internal_beta_prod_planned": true,
    "store_metadata_prepared": true,
    "privacy_labels_prepared": true,
    "data_safety_forms_prepared": true,
    "crash_reporting_live_before_full_rollout": true,
    "halt_rollout_rollback_plan_prepared": true
  },
  "privacy": {
    "minimum_collection_declared": true,
    "collection_disclosed_in_store_and_in_app": true,
    "analytics_without_pii_declared": true
  },
  "red_lines": {
    "secrets_in_app_bundle_present": false,
    "permissions_without_feature_present": false,
    "untested_upgrade_path_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 46 checks and a text stamp of the verdict):

```json
{
  "service": "native-mobile-build-plan",
  "atom_version": "0.1.0",
  "app": "MyMilo-Vault",
  "verdict": "NATIVE_MOBILE_BUILD_PLAN_READY",
  "sections": {
    "device_constraints_and_platform_citizenship": "pass",
    "offline_first_and_sync": "pass",
    "builds_and_signing": "pass",
    "testing_and_accessibility": "pass",
    "release_store_and_privacy": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "permissions_count": 1,
  "permissions_without_feature": [],
  "feature_coverage": "1.000000",
  "duplicate_permission_names": [],
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across six sections."
}
```

## Verdicts

- **NATIVE_MOBILE_BUILD_PLAN_READY** — every check passes; the declared native-mobile build-plan record is complete and consistent with the skill's checklist and red lines.
- **NATIVE_MOBILE_BUILD_PLAN_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `permissions_count` (the declared list length as an integer, or null when the list is not declared), the row-name list `permissions_without_feature` and the name list `duplicate_permission_names` (null when the `permissions` list is not declared; a permission with the relevant field absent is missing evidence and does not appear in `permissions_without_feature`), the coverage value `feature_coverage` (a ratio as a string with exactly six decimal places; null when the denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the three primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
