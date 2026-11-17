# Native mobile build plan — documentation

**Native mobile build plan** · slug `native-mobile-build-plan` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment c64bdc48fce84cd4817fe3a293be6ae5).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/native-mobile-build-plan/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment c64bdc48fce84cd4817fe3a293be6ae5). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `app` "MyMilo-Vault"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "native-mobile-build-plan"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the native mobile build plan manifest.** You declare a record of a native mobile app's build plan, made at the planning stage before the release build — the atom audits the declared record, it does not build the app or inspect its bundle (see Explanation). The recorded full-pass manifest declares the app `MyMilo-Vault`: screen sizes, safe areas, the 44px touch-target floor, battery and thermal, and background limits all considered, and the worst device in scope named; back button and gestures handled, notification permission timing and deep links planned, lifecycle pause/resume testing planned, and gestures with a non-gesture alternative; one permission row, `CAMERA` with feature `QR_Scanner`; the local store as truth for user data, sync retry and queue planned, pending and failed sync states visible, no indefinite spinner, and conflict rules documented; toolchain and SDK versions pinned, deterministic builds planned, signing keys held in a keystore outside repos, version code and name discipline planned, CI building the artifact, and human sign-off on the release build; a device matrix including a low-end and a current device, largest-font-size, offline, slow-network and upgrade tests planned, and an accessibility pass on primary flows covering TalkBack and VoiceOver; staged internal → beta → prod rollout planned, store metadata, privacy labels and data-safety forms prepared, crash reporting live before full rollout, and a halt-rollout rollback plan prepared; minimum collection declared, collection disclosed in store and in app, and analytics without PII declared; and all three red-line flags `false` (no secrets in the app bundle, no permissions without a feature, no untested upgrade path).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/native-mobile-build-plan` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `NATIVE_MOBILE_BUILD_PLAN_READY`: "46 pass, 0 fail, 0 missing of 46 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `permissions_count` is 1, and `feature_coverage` is `"1.000000"`, with both name lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `NATIVE_MOBILE_BUILD_PLAN_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "native-mobile-build-plan"}`.
3. Call: `POST https://atoms.pipavia.com/v1/native-mobile-build-plan` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/native-mobile-build-plan` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `native_mobile_build_plan`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `NATIVE_MOBILE_BUILD_PLAN_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_permission_names_feature_needing_it`, `local_store_is_truth_for_user_data`, `no_secrets_in_app_bundle`, `screen_sizes_considered`, and the summary reads "42 pass, 4 fail, 0 missing of 46 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `permissions_without_feature` names `CAMERA` — that row declares `feature_needing_it: ""` — `feature_coverage` is `"0.000000"`, `constraints.screen_sizes_considered` is declared `false`, failing `screen_sizes_considered`, `offline.local_store_is_truth_for_user_data` is declared `false`, failing `local_store_is_truth_for_user_data`, and `red_lines.secrets_in_app_bundle_present` is declared `true`, failing `no_secrets_in_app_bundle`; sections `device_constraints_and_platform_citizenship`, `offline_first_and_sync` and `red_lines` report `fail`, the other three `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "constraints",
  "detail": "constraints must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/native-mobile-build-plan` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/native-mobile-build-plan` — tool name `native_mobile_build_plan`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `native_mobile_build_plan` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `app` and the `permissions[]` string fields are noted as strings and `permissions` as a list there. Where SERVICE.md states no type — the section container objects (`constraints`, `platform_citizenship`, `offline`, `builds`, `testing`, `release`, `privacy`, `red_lines`) and a `permissions[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and `permissions`, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `permissions` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `NATIVE_MOBILE_BUILD_PLAN_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `app` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: device_constraints_and_platform_citizenship

| Field | Type | Notes |
|---|---|---|
| `constraints` | object | The constraints section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `constraints.screen_sizes_considered` | boolean | — |
| `constraints.safe_areas_considered` | boolean | — |
| `constraints.touch_targets_minimum_44px_declared` | boolean | The skill's stated 44px floor, checked only as a declaration |
| `constraints.battery_and_thermal_considered` | boolean | — |
| `constraints.background_limits_considered` | boolean | — |
| `constraints.worst_device_in_scope_named` | boolean | — |
| `platform_citizenship` | object | The platform-citizenship section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `platform_citizenship.back_button_and_gestures_handled` | boolean | — |
| `platform_citizenship.notification_permission_timing_planned` | boolean | — |
| `platform_citizenship.deep_links_planned` | boolean | — |
| `platform_citizenship.lifecycle_pause_resume_testing_planned` | boolean | — |
| `platform_citizenship.gestures_have_non_gesture_alternative` | boolean | — |
| `permissions` | list | list of permission-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `permissions[]` | object | One declared permission row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `permissions[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `permissions[].feature_needing_it` | string | The feature that needs the permission; must be present and non-empty per row (type stated in SERVICE.md) |

#### Read by: offline_first_and_sync

| Field | Type | Notes |
|---|---|---|
| `offline` | object | The offline section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `offline.local_store_is_truth_for_user_data` | boolean | — |
| `offline.sync_retry_and_queue_planned` | boolean | — |
| `offline.sync_states_pending_and_failed_visible` | boolean | — |
| `offline.indefinite_spinner_avoided` | boolean | — |
| `offline.conflict_rules_documented` | boolean | — |

#### Read by: builds_and_signing

| Field | Type | Notes |
|---|---|---|
| `builds` | object | The builds section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `builds.toolchain_versions_pinned` | boolean | — |
| `builds.sdk_versions_pinned` | boolean | — |
| `builds.deterministic_builds_planned` | boolean | — |
| `builds.signing_keys_held_in_keystore_outside_repos` | boolean | — |
| `builds.version_code_and_name_discipline_planned` | boolean | — |
| `builds.ci_builds_the_artifact` | boolean | — |
| `builds.human_sign_off_on_release_build` | boolean | — |

#### Read by: testing_and_accessibility

| Field | Type | Notes |
|---|---|---|
| `testing` | object | The testing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `testing.device_matrix_includes_low_end_device` | boolean | — |
| `testing.device_matrix_includes_current_device` | boolean | — |
| `testing.largest_font_size_test_planned` | boolean | — |
| `testing.offline_tests_planned` | boolean | — |
| `testing.slow_network_tests_planned` | boolean | — |
| `testing.upgrade_tests_from_old_app_planned` | boolean | — |
| `testing.accessibility_pass_on_primary_flows_planned` | boolean | — |
| `testing.talkback_and_voiceover_in_accessibility_pass` | boolean | — |

#### Read by: release_store_and_privacy

| Field | Type | Notes |
|---|---|---|
| `release` | object | The release section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `release.staged_rollout_internal_beta_prod_planned` | boolean | — |
| `release.store_metadata_prepared` | boolean | — |
| `release.privacy_labels_prepared` | boolean | — |
| `release.data_safety_forms_prepared` | boolean | — |
| `release.crash_reporting_live_before_full_rollout` | boolean | — |
| `release.halt_rollout_rollback_plan_prepared` | boolean | — |
| `privacy` | object | The privacy section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `privacy.minimum_collection_declared` | boolean | — |
| `privacy.collection_disclosed_in_store_and_in_app` | boolean | — |
| `privacy.analytics_without_pii_declared` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.secrets_in_app_bundle_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.permissions_without_feature_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.untested_upgrade_path_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 46 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: device_constraints_and_platform_citizenship

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `screen_sizes_considered` | constraints: screen sizes are considered in the plan | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `safe_areas_considered` | constraints: safe areas are considered in the plan | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `touch_targets_minimum_44px_declared` | constraints: touch targets adopt the skill's stated floor — at least 44px | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `battery_and_thermal_considered` | constraints: battery and thermal limits are considered in the plan | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `background_limits_considered` | constraints: background limits are considered in the plan | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `worst_device_in_scope_named` | constraints: the plan designs for the worst device in scope, and that device is named | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `back_button_and_gestures_handled` | platform citizenship: the back button and gestures are handled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `notification_permission_timing_planned` | platform citizenship: notification permission timing is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deep_links_planned` | platform citizenship: deep links are planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `lifecycle_pause_resume_testing_planned` | platform citizenship: lifecycle — pause and resume — testing is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `gestures_have_non_gesture_alternative` | platform citizenship: haptics and gestures are seasoning, never the only path — a non-gesture alternative exists | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `permissions_declared` | the declared record names its permissions — the permissions list is present; an empty list declares that the plan requests no permissions | Computed over the declared record. Pass: the `permissions` list is present — an empty list passes, because it declares that the plan requests no permissions. Missing: the list is absent. (SERVICE.md states no fail case for this check: presence passes, absence is missing.) |
| `every_permission_names_feature_needing_it` | permissions: every declared permission row names the feature needing it — no permissions without a feature needing them | Computed over the declared record. Pass: every declared permission row declares `feature_needing_it` as a present, non-empty string — on an empty list the check passes vacuously. Fail: a row declares `feature_needing_it` present but empty (offending rows are named in `permissions_without_feature`). Missing: the list is absent, or a row has `feature_needing_it` absent (such a row is missing evidence and does not appear in `permissions_without_feature`). |
| `no_permission_name_duplicated` | permissions: no declared permission name is owned by more than one permission row | Computed over the declared record. Pass: no declared `name` string appears on more than one permission row. Fail: a `name` string is declared on more than one row (offending names are named in `duplicate_permission_names`). Missing: the list is absent, or a row has `name` absent (such a row is missing evidence for this check). |

#### Section: offline_first_and_sync

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `local_store_is_truth_for_user_data` | offline-first: the local store is the truth for user data | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sync_retry_and_queue_planned` | offline-first: sync with retry and queue is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sync_states_pending_and_failed_visible` | offline-first: sync state is visible — pending and failed states are shown | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `indefinite_spinner_avoided` | offline-first: no spinners-forever — an indefinite spinner is avoided | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `conflict_rules_documented` | offline-first: conflict rules are documented | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: builds_and_signing

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `toolchain_versions_pinned` | builds: toolchain versions are pinned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sdk_versions_pinned` | builds: SDK versions are pinned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deterministic_builds_planned` | builds: deterministic builds are planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `signing_keys_held_in_keystore_outside_repos` | builds: signing keys are held in the keystore — never in repos | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `version_code_and_name_discipline_planned` | builds: versionCode and versionName discipline is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ci_builds_the_artifact` | builds: CI builds the artifact | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `human_sign_off_on_release_build` | builds: humans sign off the release build | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: testing_and_accessibility

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `device_matrix_includes_low_end_device` | testing: the device matrix includes a low-end device | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `device_matrix_includes_current_device` | testing: the device matrix includes a current device | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `largest_font_size_test_planned` | testing: the largest font size is tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `offline_tests_planned` | testing: offline behavior tests are planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `slow_network_tests_planned` | testing: slow-network tests are planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `upgrade_tests_from_old_app_planned` | testing: upgrade tests — old app to new data — are planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `accessibility_pass_on_primary_flows_planned` | testing: an accessibility pass on the primary flows is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `talkback_and_voiceover_in_accessibility_pass` | testing: the accessibility pass covers TalkBack and VoiceOver | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: release_store_and_privacy

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `staged_rollout_internal_beta_prod_planned` | release: staged rollout — internal, then beta, then prod — is planned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `store_metadata_prepared` | release: store metadata — screenshots and the listing — is prepared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `privacy_labels_prepared` | release: store privacy labels are prepared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `data_safety_forms_prepared` | release: store data-safety forms are prepared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `crash_reporting_live_before_full_rollout` | release: crash reporting is live before 100% rollout | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `halt_rollout_rollback_plan_prepared` | release: a halt-rollout rollback plan is prepared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `minimum_collection_declared` | privacy: the plan collects the minimum | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `collection_disclosed_in_store_and_in_app` | privacy: what is collected is disclosed in-store and in-app | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `analytics_without_pii_declared` | privacy: analytics run without PII | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_secrets_in_app_bundle` | red line: no secrets in the app bundle are present in the plan | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_permissions_without_feature` | red line: no permissions without a feature needing them are present in the plan | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_untested_upgrade_path` | red line: no untested upgrade path is present in the plan | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"native-mobile-build-plan"`), `atom_version` (`"0.1.0"`), and `app` (the manifest's declared app value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `permissions_count` (the declared list length as an integer, or null when the list is not declared); the row-name list `permissions_without_feature` (permissions whose `feature_needing_it` field is present but empty; a permission with the field absent is missing evidence and does not appear) and the name list `duplicate_permission_names` (permission names declared on more than one row, in the order their second occurrence appears) — both lists are null when the `permissions` list is not declared, as recorded in the sparse case; and the ratio `feature_coverage` (permissions naming a feature ÷ declared permissions) — a string with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "46 pass, 0 fail, 0 missing of 46 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared app value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `NATIVE_MOBILE_BUILD_PLAN_READY` — all 46 checks pass: the declared build-plan record is complete and consistent with the bound skill's checklist and red lines.
- `NATIVE_MOBILE_BUILD_PLAN_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the three primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `permissions_count`, `permissions_without_feature`, `feature_coverage`, `duplicate_permission_names` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"constraints","detail":"constraints must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Build native mobile with discipline — device constraints, offline-first, builds/releases, store compliance (the bound capability, from the skill). You submit one declared record — the native mobile build plan manifest, made at the planning stage before the release build — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 6 sections (`device_constraints_and_platform_citizenship`, `offline_first_and_sync`, `builds_and_signing`, `testing_and_accessibility`, `release_store_and_privacy`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `permissions` list must be present (an empty list passes: it declares that the plan requests no permissions, and the skill requires no permission), every permission row must name a non-empty `feature_needing_it` string, and no declared `name` string may appear on more than one permission row — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `NATIVE_MOBILE_BUILD_PLAN_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `NATIVE_MOBILE_BUILD_PLAN_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: the skill states exactly one numeric floor — touch targets ≥44px — and it is checked only as the caller's declaration that the floor is adopted, never as a measured pixel value. Declined, named: a touch-target minimum above the skill's stated 44px, or any measured pixel value for a target, screen size, or safe area; a battery, thermal, or background-execution limit; a sync retry count, backoff interval, or queue depth; a choice among conflict-resolution strategies (only that rules are documented is checked); specific toolchain or SDK version numbers (only that versions are pinned is checked); a number of devices in the test matrix, or specific devices beyond a low-end and a current device being included; a font scale beyond the largest font size being tested; a slow-network speed or latency figure; an accessibility conformance level or score; rollout percentages or stage durations for the internal → beta → prod stages; a crash-free rate or crash-reporting threshold; a number of permissions an app may request; a data-retention period or an analytics standard beyond analytics running without PII as declared. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** native-mobile build plan: a verdict of `NATIVE_MOBILE_BUILD_PLAN_READY` means the record is complete and consistent *on the caller's declared evidence* — a record that declares pinned versions, keys in a keystore, and no secrets in the bundle passes those checks even if the real build did none of it. It is a completeness and consistency audit of the build-plan record the skill requires, **not a build service, a store-submission service, a security audit of an actual bundle, or a prediction that a store will approve the app**. Specifically: it builds no app itself, runs no toolchain, inspects no bundle, repository, keystore, or store listing, runs no device test, and does not verify that a declared plan was ever carried out. It never judges whether the named worst device is really the worst, whether the declared conflict rules are good, whether a permission is genuinely needed by the feature named for it, or whether the plan will work — only that the record contains what the skill's sections and red lines demand, and that its declared permission rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated 44px floor, itself checked only as a declaration (see the declined list above); no live verification of any declared fact; no judgment of plan quality — whether the constraints, sync design, or test matrix are adequate for the real app is a caller declaration, checked only for declared presence and consistency; the skill's named store and platform specifics are checked only as the generic preparations the skill states (metadata, privacy labels, data-safety forms) — this atom files nothing with any store and takes no position on any store's current review rules; privacy substance (whether the minimum is truly collected, whether a disclosure is legally sufficient) is a caller declaration — only its declared presence is checked, and the output is not legal advice.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: MyMilo vault app mobile builds (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared native-mobile build-plan record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly (U-13 regulatory screen) that its output could not read as regulated professional advice, that it offers no engineering, financial, medical, or legal advice, and that its privacy/store checks judge declared presence only, never legal sufficiency. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `native_mobile_build_plan` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/native_mobile_build_plan.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_native_mobile_build_plan.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/native-mobile-build-plan` (REST) and `POST /mcp/native-mobile-build-plan` (MCP, tool `native_mobile_build_plan`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment c64bdc48fce84cd4817fe3a293be6ae5). Key scope: `native_mobile_build_plan`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment c64bdc48fce84cd4817fe3a293be6ae5) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the red-line checks and the computed checks. Recorded check names used verbatim in the Checks section include `no_secrets_in_app_bundle` (input `red_lines.secrets_in_app_bundle_present`), `no_permissions_without_feature` (input `red_lines.permissions_without_feature_present`) and `no_untested_upgrade_path` (input `red_lines.untested_upgrade_path_present`), plus the computed checks `permissions_declared`, `every_permission_names_feature_needing_it` and `no_permission_name_duplicated`, which read the `permissions` rows rather than any single input field. The remaining recorded check names match the leaf name of the input field they read (for example `screen_sizes_considered` reads `constraints.screen_sizes_considered`).
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`constraints`, `platform_citizenship`, `offline`, `builds`, `testing`, `release`, `privacy`, `red_lines`) or for a `permissions[]` row object. The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and `permissions`, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 46 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects — `constraints`, `platform_citizenship` and `permissions` inputs are read by the single recorded section `device_constraints_and_platform_citizenship`, and `release` and `privacy` inputs are read by the single recorded section `release_store_and_privacy`. This document groups the Input reference and the Checks by the recorded section names.
6. **Null lists on an undeclared `permissions` list:** SERVICE.md's output paragraph states the null rules for `computed_status`, `permissions_count` and the coverage ratio, but does not state a null rule for the two row-name / name lists. The recorded sparse response returns both lists as `null` when `permissions` is not declared (as USER-GUIDE.md also states); this document follows the recording.
7. **Case-design prose in cases.json:** no discrepancy found — the `cases.json` inputs and expects were compared with the recorded executions in evidence.json and match them (inputs and expects identical, and the case notes describe the same planted violations, sparse identity-only manifest and `constraints` type violation that the recorded responses show). No unscored prose in `cases.json` differs from the recorded executions for this atom; where any prose had differed, the responses would govern.

## Worked examples

Provenance: recorded 2026-11-16T08:32:02.934971+00:00 against gateway v1.1.0, external verification lane, source `verification/work/native-mobile-build-plan/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T08:32:02.934971+00:00 · gateway v1.1.0 · source `verification/work/native-mobile-build-plan/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "screen_sizes_considered",
      "status": "pass",
      "evidence": "constraints: screen sizes are considered in the plan"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "safe_areas_considered",
      "status": "pass",
      "evidence": "constraints: safe areas are considered in the plan"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "touch_targets_minimum_44px_declared",
      "status": "pass",
      "evidence": "constraints: touch targets adopt the skill's stated floor — at least 44px"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "battery_and_thermal_considered",
      "status": "pass",
      "evidence": "constraints: battery and thermal limits are considered in the plan"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "background_limits_considered",
      "status": "pass",
      "evidence": "constraints: background limits are considered in the plan"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "worst_device_in_scope_named",
      "status": "pass",
      "evidence": "constraints: the plan designs for the worst device in scope, and that device is named"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "back_button_and_gestures_handled",
      "status": "pass",
      "evidence": "platform citizenship: the back button and gestures are handled"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "notification_permission_timing_planned",
      "status": "pass",
      "evidence": "platform citizenship: notification permission timing is planned"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "deep_links_planned",
      "status": "pass",
      "evidence": "platform citizenship: deep links are planned"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "lifecycle_pause_resume_testing_planned",
      "status": "pass",
      "evidence": "platform citizenship: lifecycle — pause and resume — testing is planned"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "gestures_have_non_gesture_alternative",
      "status": "pass",
      "evidence": "platform citizenship: haptics and gestures are seasoning, never the only path — a non-gesture alternative exists"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "permissions_declared",
      "status": "pass",
      "evidence": "the declared record names its permissions — the permissions list is present; an empty list declares that the plan requests no permissions"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "every_permission_names_feature_needing_it",
      "status": "pass",
      "evidence": "permissions: every declared permission row names the feature needing it — no permissions without a feature needing them"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "no_permission_name_duplicated",
      "status": "pass",
      "evidence": "permissions: no declared permission name is owned by more than one permission row"
    },
    {
      "section": "offline_first_and_sync",
      "check": "local_store_is_truth_for_user_data",
      "status": "pass",
      "evidence": "offline-first: the local store is the truth for user data"
    },
    {
      "section": "offline_first_and_sync",
      "check": "sync_retry_and_queue_planned",
      "status": "pass",
      "evidence": "offline-first: sync with retry and queue is planned"
    },
    {
      "section": "offline_first_and_sync",
      "check": "sync_states_pending_and_failed_visible",
      "status": "pass",
      "evidence": "offline-first: sync state is visible — pending and failed states are shown"
    },
    {
      "section": "offline_first_and_sync",
      "check": "indefinite_spinner_avoided",
      "status": "pass",
      "evidence": "offline-first: no spinners-forever — an indefinite spinner is avoided"
    },
    {
      "section": "offline_first_and_sync",
      "check": "conflict_rules_documented",
      "status": "pass",
      "evidence": "offline-first: conflict rules are documented"
    },
    {
      "section": "builds_and_signing",
      "check": "toolchain_versions_pinned",
      "status": "pass",
      "evidence": "builds: toolchain versions are pinned"
    },
    {
      "section": "builds_and_signing",
      "check": "sdk_versions_pinned",
      "status": "pass",
      "evidence": "builds: SDK versions are pinned"
    },
    {
      "section": "builds_and_signing",
      "check": "deterministic_builds_planned",
      "status": "pass",
      "evidence": "builds: deterministic builds are planned"
    },
    {
      "section": "builds_and_signing",
      "check": "signing_keys_held_in_keystore_outside_repos",
      "status": "pass",
      "evidence": "builds: signing keys are held in the keystore — never in repos"
    },
    {
      "section": "builds_and_signing",
      "check": "version_code_and_name_discipline_planned",
      "status": "pass",
      "evidence": "builds: versionCode and versionName discipline is planned"
    },
    {
      "section": "builds_and_signing",
      "check": "ci_builds_the_artifact",
      "status": "pass",
      "evidence": "builds: CI builds the artifact"
    },
    {
      "section": "builds_and_signing",
      "check": "human_sign_off_on_release_build",
      "status": "pass",
      "evidence": "builds: humans sign off the release build"
    },
    {
      "section": "testing_and_accessibility",
      "check": "device_matrix_includes_low_end_device",
      "status": "pass",
      "evidence": "testing: the device matrix includes a low-end device"
    },
    {
      "section": "testing_and_accessibility",
      "check": "device_matrix_includes_current_device",
      "status": "pass",
      "evidence": "testing: the device matrix includes a current device"
    },
    {
      "section": "testing_and_accessibility",
      "check": "largest_font_size_test_planned",
      "status": "pass",
      "evidence": "testing: the largest font size is tested"
    },
    {
      "section": "testing_and_accessibility",
      "check": "offline_tests_planned",
      "status": "pass",
      "evidence": "testing: offline behavior tests are planned"
    },
    {
      "section": "testing_and_accessibility",
      "check": "slow_network_tests_planned",
      "status": "pass",
      "evidence": "testing: slow-network tests are planned"
    },
    {
      "section": "testing_and_accessibility",
      "check": "upgrade_tests_from_old_app_planned",
      "status": "pass",
      "evidence": "testing: upgrade tests — old app to new data — are planned"
    },
    {
      "section": "testing_and_accessibility",
      "check": "accessibility_pass_on_primary_flows_planned",
      "status": "pass",
      "evidence": "testing: an accessibility pass on the primary flows is planned"
    },
    {
      "section": "testing_and_accessibility",
      "check": "talkback_and_voiceover_in_accessibility_pass",
      "status": "pass",
      "evidence": "testing: the accessibility pass covers TalkBack and VoiceOver"
    },
    {
      "section": "release_store_and_privacy",
      "check": "staged_rollout_internal_beta_prod_planned",
      "status": "pass",
      "evidence": "release: staged rollout — internal, then beta, then prod — is planned"
    },
    {
      "section": "release_store_and_privacy",
      "check": "store_metadata_prepared",
      "status": "pass",
      "evidence": "release: store metadata — screenshots and the listing — is prepared"
    },
    {
      "section": "release_store_and_privacy",
      "check": "privacy_labels_prepared",
      "status": "pass",
      "evidence": "release: store privacy labels are prepared"
    },
    {
      "section": "release_store_and_privacy",
      "check": "data_safety_forms_prepared",
      "status": "pass",
      "evidence": "release: store data-safety forms are prepared"
    },
    {
      "section": "release_store_and_privacy",
      "check": "crash_reporting_live_before_full_rollout",
      "status": "pass",
      "evidence": "release: crash reporting is live before 100% rollout"
    },
    {
      "section": "release_store_and_privacy",
      "check": "halt_rollout_rollback_plan_prepared",
      "status": "pass",
      "evidence": "release: a halt-rollout rollback plan is prepared"
    },
    {
      "section": "release_store_and_privacy",
      "check": "minimum_collection_declared",
      "status": "pass",
      "evidence": "privacy: the plan collects the minimum"
    },
    {
      "section": "release_store_and_privacy",
      "check": "collection_disclosed_in_store_and_in_app",
      "status": "pass",
      "evidence": "privacy: what is collected is disclosed in-store and in-app"
    },
    {
      "section": "release_store_and_privacy",
      "check": "analytics_without_pii_declared",
      "status": "pass",
      "evidence": "privacy: analytics run without PII"
    },
    {
      "section": "red_lines",
      "check": "no_secrets_in_app_bundle",
      "status": "pass",
      "evidence": "red line: no secrets in the app bundle are present in the plan"
    },
    {
      "section": "red_lines",
      "check": "no_permissions_without_feature",
      "status": "pass",
      "evidence": "red line: no permissions without a feature needing them are present in the plan"
    },
    {
      "section": "red_lines",
      "check": "no_untested_upgrade_path",
      "status": "pass",
      "evidence": "red line: no untested upgrade path is present in the plan"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "permissions_count": 1,
  "permissions_without_feature": [],
  "feature_coverage": "1.000000",
  "duplicate_permission_names": [],
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across six sections.",
  "stamp": "NATIVE MOBILE BUILD PLAN\napp: MyMilo-Vault\nVERDICT: NATIVE_MOBILE_BUILD_PLAN_READY\n  device_constraints_and_platform_citizenship  pass\n  offline_first_and_sync                       pass\n  builds_and_signing                           pass\n  testing_and_accessibility                    pass\n  release_store_and_privacy                    pass\n  red_lines                                    pass\n46 pass, 0 fail, 0 missing of 46 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T08:32:02.934971+00:00 · gateway v1.1.0 · source `verification/work/native-mobile-build-plan/evidence.json`.

Input:

```json
{
  "app": "MyMilo-Vault",
  "constraints": {
    "screen_sizes_considered": false,
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
      "feature_needing_it": ""
    }
  ],
  "offline": {
    "local_store_is_truth_for_user_data": false,
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
    "secrets_in_app_bundle_present": true,
    "permissions_without_feature_present": false,
    "untested_upgrade_path_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "native-mobile-build-plan",
  "atom_version": "0.1.0",
  "app": "MyMilo-Vault",
  "verdict": "NATIVE_MOBILE_BUILD_PLAN_NOT_READY",
  "sections": {
    "device_constraints_and_platform_citizenship": "fail",
    "offline_first_and_sync": "fail",
    "builds_and_signing": "pass",
    "testing_and_accessibility": "pass",
    "release_store_and_privacy": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "screen_sizes_considered",
      "status": "fail",
      "evidence": "constraints: screen sizes are considered in the plan"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "safe_areas_considered",
      "status": "pass",
      "evidence": "constraints: safe areas are considered in the plan"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "touch_targets_minimum_44px_declared",
      "status": "pass",
      "evidence": "constraints: touch targets adopt the skill's stated floor — at least 44px"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "battery_and_thermal_considered",
      "status": "pass",
      "evidence": "constraints: battery and thermal limits are considered in the plan"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "background_limits_considered",
      "status": "pass",
      "evidence": "constraints: background limits are considered in the plan"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "worst_device_in_scope_named",
      "status": "pass",
      "evidence": "constraints: the plan designs for the worst device in scope, and that device is named"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "back_button_and_gestures_handled",
      "status": "pass",
      "evidence": "platform citizenship: the back button and gestures are handled"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "notification_permission_timing_planned",
      "status": "pass",
      "evidence": "platform citizenship: notification permission timing is planned"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "deep_links_planned",
      "status": "pass",
      "evidence": "platform citizenship: deep links are planned"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "lifecycle_pause_resume_testing_planned",
      "status": "pass",
      "evidence": "platform citizenship: lifecycle — pause and resume — testing is planned"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "gestures_have_non_gesture_alternative",
      "status": "pass",
      "evidence": "platform citizenship: haptics and gestures are seasoning, never the only path — a non-gesture alternative exists"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "permissions_declared",
      "status": "pass",
      "evidence": "the declared record names its permissions — the permissions list is present; an empty list declares that the plan requests no permissions"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "every_permission_names_feature_needing_it",
      "status": "fail",
      "evidence": "permissions: every declared permission row names the feature needing it — no permissions without a feature needing them"
    },
    {
      "section": "device_constraints_and_platform_citizenship",
      "check": "no_permission_name_duplicated",
      "status": "pass",
      "evidence": "permissions: no declared permission name is owned by more than one permission row"
    },
    {
      "section": "offline_first_and_sync",
      "check": "local_store_is_truth_for_user_data",
      "status": "fail",
      "evidence": "offline-first: the local store is the truth for user data"
    },
    {
      "section": "offline_first_and_sync",
      "check": "sync_retry_and_queue_planned",
      "status": "pass",
      "evidence": "offline-first: sync with retry and queue is planned"
    },
    {
      "section": "offline_first_and_sync",
      "check": "sync_states_pending_and_failed_visible",
      "status": "pass",
      "evidence": "offline-first: sync state is visible — pending and failed states are shown"
    },
    {
      "section": "offline_first_and_sync",
      "check": "indefinite_spinner_avoided",
      "status": "pass",
      "evidence": "offline-first: no spinners-forever — an indefinite spinner is avoided"
    },
    {
      "section": "offline_first_and_sync",
      "check": "conflict_rules_documented",
      "status": "pass",
      "evidence": "offline-first: conflict rules are documented"
    },
    {
      "section": "builds_and_signing",
      "check": "toolchain_versions_pinned",
      "status": "pass",
      "evidence": "builds: toolchain versions are pinned"
    },
    {
      "section": "builds_and_signing",
      "check": "sdk_versions_pinned",
      "status": "pass",
      "evidence": "builds: SDK versions are pinned"
    },
    {
      "section": "builds_and_signing",
      "check": "deterministic_builds_planned",
      "status": "pass",
      "evidence": "builds: deterministic builds are planned"
    },
    {
      "section": "builds_and_signing",
      "check": "signing_keys_held_in_keystore_outside_repos",
      "status": "pass",
      "evidence": "builds: signing keys are held in the keystore — never in repos"
    },
    {
      "section": "builds_and_signing",
      "check": "version_code_and_name_discipline_planned",
      "status": "pass",
      "evidence": "builds: versionCode and versionName discipline is planned"
    },
    {
      "section": "builds_and_signing",
      "check": "ci_builds_the_artifact",
      "status": "pass",
      "evidence": "builds: CI builds the artifact"
    },
    {
      "section": "builds_and_signing",
      "check": "human_sign_off_on_release_build",
      "status": "pass",
      "evidence": "builds: humans sign off the release build"
    },
    {
      "section": "testing_and_accessibility",
      "check": "device_matrix_includes_low_end_device",
      "status": "pass",
      "evidence": "testing: the device matrix includes a low-end device"
    },
    {
      "section": "testing_and_accessibility",
      "check": "device_matrix_includes_current_device",
      "status": "pass",
      "evidence": "testing: the device matrix includes a current device"
    },
    {
      "section": "testing_and_accessibility",
      "check": "largest_font_size_test_planned",
      "status": "pass",
      "evidence": "testing: the largest font size is tested"
    },
    {
      "section": "testing_and_accessibility",
      "check": "offline_tests_planned",
      "status": "pass",
      "evidence": "testing: offline behavior tests are planned"
    },
    {
      "section": "testing_and_accessibility",
      "check": "slow_network_tests_planned",
      "status": "pass",
      "evidence": "testing: slow-network tests are planned"
    },
    {
      "section": "testing_and_accessibility",
      "check": "upgrade_tests_from_old_app_planned",
      "status": "pass",
      "evidence": "testing: upgrade tests — old app to new data — are planned"
    },
    {
      "section": "testing_and_accessibility",
      "check": "accessibility_pass_on_primary_flows_planned",
      "status": "pass",
      "evidence": "testing: an accessibility pass on the primary flows is planned"
    },
    {
      "section": "testing_and_accessibility",
      "check": "talkback_and_voiceover_in_accessibility_pass",
      "status": "pass",
      "evidence": "testing: the accessibility pass covers TalkBack and VoiceOver"
    },
    {
      "section": "release_store_and_privacy",
      "check": "staged_rollout_internal_beta_prod_planned",
      "status": "pass",
      "evidence": "release: staged rollout — internal, then beta, then prod — is planned"
    },
    {
      "section": "release_store_and_privacy",
      "check": "store_metadata_prepared",
      "status": "pass",
      "evidence": "release: store metadata — screenshots and the listing — is prepared"
    },
    {
      "section": "release_store_and_privacy",
      "check": "privacy_labels_prepared",
      "status": "pass",
      "evidence": "release: store privacy labels are prepared"
    },
    {
      "section": "release_store_and_privacy",
      "check": "data_safety_forms_prepared",
      "status": "pass",
      "evidence": "release: store data-safety forms are prepared"
    },
    {
      "section": "release_store_and_privacy",
      "check": "crash_reporting_live_before_full_rollout",
      "status": "pass",
      "evidence": "release: crash reporting is live before 100% rollout"
    },
    {
      "section": "release_store_and_privacy",
      "check": "halt_rollout_rollback_plan_prepared",
      "status": "pass",
      "evidence": "release: a halt-rollout rollback plan is prepared"
    },
    {
      "section": "release_store_and_privacy",
      "check": "minimum_collection_declared",
      "status": "pass",
      "evidence": "privacy: the plan collects the minimum"
    },
    {
      "section": "release_store_and_privacy",
      "check": "collection_disclosed_in_store_and_in_app",
      "status": "pass",
      "evidence": "privacy: what is collected is disclosed in-store and in-app"
    },
    {
      "section": "release_store_and_privacy",
      "check": "analytics_without_pii_declared",
      "status": "pass",
      "evidence": "privacy: analytics run without PII"
    },
    {
      "section": "red_lines",
      "check": "no_secrets_in_app_bundle",
      "status": "fail",
      "evidence": "red line: no secrets in the app bundle are present in the plan"
    },
    {
      "section": "red_lines",
      "check": "no_permissions_without_feature",
      "status": "pass",
      "evidence": "red line: no permissions without a feature needing them are present in the plan"
    },
    {
      "section": "red_lines",
      "check": "no_untested_upgrade_path",
      "status": "pass",
      "evidence": "red line: no untested upgrade path is present in the plan"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "permissions_count": 1,
  "permissions_without_feature": [
    "CAMERA"
  ],
  "feature_coverage": "0.000000",
  "duplicate_permission_names": [],
  "summary": "42 pass, 4 fail, 0 missing of 46 checks across six sections.",
  "stamp": "NATIVE MOBILE BUILD PLAN\napp: MyMilo-Vault\nVERDICT: NATIVE_MOBILE_BUILD_PLAN_NOT_READY\n  device_constraints_and_platform_citizenship  fail\n  offline_first_and_sync                       fail\n  builds_and_signing                           pass\n  testing_and_accessibility                    pass\n  release_store_and_privacy                    pass\n  red_lines                                    fail\n42 pass, 4 fail, 0 missing of 46 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T08:32:02.934971+00:00 · gateway v1.1.0 · source `verification/work/native-mobile-build-plan/evidence.json`.

Input:

```json
{
  "app": "Malformed-Plan",
  "constraints": "should-be-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "constraints",
  "detail": "constraints must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared native-mobile build-plan record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not a build service, a store-submission service, a security audit of an actual bundle or a prediction that a store will approve the app, its privacy/store checks judge declared presence only, never legal sufficiency, and it verifies no live fact. |
| Checks named | 46 documented / 46 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`permissions_count`, the two row-name / name lists and the coverage ratio) |
| Input reference typed | Yes — 56 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/native-mobile-build-plan/evidence.json` |
