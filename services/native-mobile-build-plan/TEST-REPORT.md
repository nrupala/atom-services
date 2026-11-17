# Test report — native-mobile-build-plan

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment c64bdc48fce84cd4817fe3a293be6ae5
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/native-mobile-build-plan/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (app `MyMilo-Vault`): all constraints/platform-citizenship/offline/builds/testing/release/privacy declarations true, all three red-line flags false, one permission row `CAMERA` with feature `QR_Scanner` | HTTP 200, verdict `NATIVE_MOBILE_BUILD_PLAN_READY`, `permissions_count` `1`, `feature_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `NATIVE_MOBILE_BUILD_PLAN_READY`, 46 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `constraints.screen_sizes_considered` false, `offline.local_store_is_truth_for_user_data` false, `permissions[0].feature_needing_it` empty, and `red_lines.secrets_in_app_bundle_present` true | HTTP 200, verdict `NATIVE_MOBILE_BUILD_PLAN_NOT_READY`, the 4 named checks fail | HTTP 200, `NATIVE_MOBILE_BUILD_PLAN_NOT_READY`, 42 pass / 4 fail / 0 missing; failing checks exactly `every_permission_names_feature_needing_it`, `local_store_is_truth_for_user_data`, `no_secrets_in_app_bundle`, `screen_sizes_considered`; `permissions_count` `1`, `permissions_without_feature` `["CAMERA"]`, `feature_coverage` `"0.000000"`, `duplicate_permission_names` `[]`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `device_constraints_and_platform_citizenship`, `offline_first_and_sync` and `red_lines` `fail`, the other three `pass` | PASS |
| 3 | sparse — only `app` (`Minimal-Plan`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 46 missing, all six sections `insufficient_evidence`, `permissions_count` null, `permissions_without_feature` null, `feature_coverage` null, `duplicate_permission_names` null, `computed_status` null | PASS |
| 4 | malformed — `constraints: "should-be-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"constraints","detail":"constraints must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `native_mobile_build_plan`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 46 checks and a text stamp):

```json
{"service": "native-mobile-build-plan", "atom_version": "0.1.0", "app": "MyMilo-Vault", "verdict": "NATIVE_MOBILE_BUILD_PLAN_READY", "sections": {"device_constraints_and_platform_citizenship": "pass", "offline_first_and_sync": "pass", "builds_and_signing": "pass", "testing_and_accessibility": "pass", "release_store_and_privacy": "pass", "red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "permissions_count": 1, "permissions_without_feature": [], "feature_coverage": "1.000000", "duplicate_permission_names": [], "summary": "46 pass, 0 fail, 0 missing of 46 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"constraints","detail":"constraints must be an object"}
```

## Findings

No findings.

## Tester errors

6 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1. The corrected, executed battery passed the validator (`final_ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the input field path `red_lines.secrets_in_app_bundle_present` instead of an exact check name — validator rejection: "failing_checks names 'red_lines.secrets_in_app_bundle_present', which is not in the atom's check register (46 checks)". Corrected before execution as part of rebuilding the violations case (see item 6).
2. (R1) Violations designed `failing_checks` named the input field path `red_lines.permissions_without_feature_present` instead of an exact check name — validator rejection: "failing_checks names 'red_lines.permissions_without_feature_present', which is not in the atom's check register (46 checks)". Corrected before execution as part of rebuilding the violations case (see item 6).
3. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes). Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `permissions_count` `1`, `permissions_without_feature` `[]`, `feature_coverage` `"1.000000"`, `duplicate_permission_names` `[]`).
4. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `permissions_count` `1`, `permissions_without_feature` `["CAMERA"]`, `feature_coverage` `"0.000000"`, `duplicate_permission_names` `[]`).
5. (R3) Violations input was a sparse manifest (only `app`, `red_lines` and `permissions` present), missing 46 key paths present in the full-pass manifest — validator rejection: "violations input is missing key paths present in the full-pass manifest (a sparse violations input reads as missing evidence, not as failure): builds, builds.ci_builds_the_artifact, builds.deterministic_builds_planned, builds.human_sign_off_on_release_build, builds.sdk_versions_pinned, builds.signing_keys_held_in_keystore_outside_repos, builds.toolchain_versions_pinned, builds.version_code_and_name_discipline_planned, constraints, constraints.background_limits_considered, constraints.battery_and_thermal_considered, constraints.safe_areas_considered, constraints.screen_sizes_considered, constraints.touch_targets_minimum_44px_declared, constraints.worst_device_in_scope_named, offline, offline.conflict_rules_documented, offline.indefinite_spinner_avoided, offline.local_store_is_truth_for_user_data, offline.sync_retry_and_queue_planned, offline.sync_states_pending_and_failed_visible, platform_citizenship, platform_citizenship.back_button_and_gestures_handled, platform_citizenship.deep_links_planned, platform_citizenship.gestures_have_non_gesture_alternative, platform_citizenship.lifecycle_pause_resume_testing_planned, platform_citizenship.notification_permission_timing_planned, privacy, privacy.analytics_without_pii_declared, privacy.collection_disclosed_in_store_and_in_app, privacy.minimum_collection_declared, release, release.crash_reporting_live_before_full_rollout, release.data_safety_forms_prepared, release.halt_rollout_rollback_plan_prepared, release.privacy_labels_prepared, release.staged_rollout_internal_beta_prod_planned, release.store_metadata_prepared, testing, testing.accessibility_pass_on_primary_flows_planned, testing.device_matrix_includes_current_device, testing.device_matrix_includes_low_end_device, testing.largest_font_size_test_planned, testing.offline_tests_planned, testing.slow_network_tests_planned, testing.talkback_and_voiceover_in_accessibility_pass, testing.upgrade_tests_from_old_app_planned". Corrected before execution by the rebuild in item 6.
6. (plant-adaptation) The violations case was rebuilt as a deep copy of the genuinely-valid full-pass manifest carrying exactly four planted mutations chosen from the check semantics in SERVICE.md — `constraints.screen_sizes_considered` = false, `offline.local_store_is_truth_for_user_data` = false, `permissions[0].feature_needing_it` = `""`, `red_lines.secrets_in_app_bundle_present` = true — with `failing_checks` set to exactly the oracle's failing set (sorted: `every_permission_names_feature_needing_it`, `local_store_is_truth_for_user_data`, `no_secrets_in_app_bundle`, `screen_sizes_considered`) and `expect.outcome` to the oracle's verdict (`NATIVE_MOBILE_BUILD_PLAN_NOT_READY`); no missing checks asserted.

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 46 checks pass on it — no correction needed), the sparse case was set to an identity-only manifest (`{app}` only, as designed), and the malformed case was kept as designed: the raw malformed case carried exactly one documented type violation (`constraints` as a string where an object is required), so no correction was needed.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the three primary computed checks, the declared counts, the row-name lists, the coverage ratio under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/native-mobile-build-plan/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `permissions_count` | 1 | 1 | ✓ |
| full-pass `feature_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `permissions_without_feature` / `duplicate_permission_names` | [] / [] | [] / [] | ✓ |
| full-pass `computed_status` (all three computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| full-pass summary / verdict | 46 pass / 0 fail / 0 missing, NATIVE_MOBILE_BUILD_PLAN_READY | same | ✓ |
| violations `permissions_count` | 1 | 1 | ✓ |
| violations `permissions_without_feature` (`CAMERA` feature empty) | ["CAMERA"] | ["CAMERA"] | ✓ |
| violations `feature_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `duplicate_permission_names` | [] | [] | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations summary | 42 pass / 4 fail / 0 missing | same | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | NATIVE_MOBILE_BUILD_PLAN_READY / NATIVE_MOBILE_BUILD_PLAN_NOT_READY (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `constraints`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
