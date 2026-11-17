# Test report — service-isolation-hardening-review

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment b71b0351b5994d9da5dc7bebffcd3189
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/service-isolation-hardening-review/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (subject `production-fleet-alpha`): all four identity flags true, one rostered service `auth-svc` (dedicated user assigned, filesystem access scoped, egress restricted — all true), all nine systemd directive flags true, all eight confinement flags true, all four resource-containment flags true, all three egress-monitoring flags true, all three verification flags true, all three red-line flags false | HTTP 200, verdict `SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED`, `services_count` `1`, `services_without_dedicated_user` `[]`, `services_without_filesystem_scope` `[]`, `services_without_egress_restriction` `[]`, `dedicated_user_coverage` `"1.000000"`, `filesystem_scope_coverage` `"1.000000"`, `egress_restriction_coverage` `"1.000000"`, `duplicate_service_names` `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED`, 39 pass / 0 fail / 0 missing, all seven sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest identical to full-pass except `services[0].dedicated_user_assigned` `false` and `red_lines.root_service_run_for_convenience_present` `true` | HTTP 200, verdict `SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED`, the 2 named checks fail | HTTP 200, `SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED`, 37 pass / 2 fail / 0 missing; failing checks exactly `every_rostered_service_has_dedicated_user_assignment`, `no_root_isolated_service_run_for_convenience`; `services_count` `1`, `services_without_dedicated_user` `["auth-svc"]`, `services_without_filesystem_scope` `[]`, `services_without_egress_restriction` `[]`, `dedicated_user_coverage` `"0.000000"`, `filesystem_scope_coverage` `"1.000000"`, `egress_restriction_coverage` `"1.000000"`, `duplicate_service_names` `[]`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `least_privilege_identity` `fail`, `red_lines` `fail`, other five sections `pass` | PASS |
| 3 | sparse — only `subject` (`minimal-test`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 39 missing, all seven sections `insufficient_evidence`, `services_count` null, `services_without_dedicated_user` null, `services_without_filesystem_scope` null, `services_without_egress_restriction` null, `dedicated_user_coverage` null, `filesystem_scope_coverage` null, `egress_restriction_coverage` null, `duplicate_service_names` null, `computed_status` null | PASS |
| 4 | malformed — full-pass manifest with `services: "not-a-list"` (string where a list is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"services","detail":"services must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `service_isolation_hardening_review`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 39 checks and a text stamp):

```json
{"service": "service-isolation-hardening-review", "atom_version": "0.1.0", "subject": "production-fleet-alpha", "verdict": "SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED", "sections": {"least_privilege_identity": "pass", "systemd_sandbox_directives": "pass", "confinement_and_sandbox_tools": "pass", "resource_containment": "pass", "egress_monitoring_and_kill_switch": "pass", "isolation_verification": "pass", "red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "services_count": 1, "services_without_dedicated_user": [], "services_without_filesystem_scope": [], "services_without_egress_restriction": [], "dedicated_user_coverage": "1.000000", "filesystem_scope_coverage": "1.000000", "egress_restriction_coverage": "1.000000", "duplicate_service_names": [], "summary": "39 pass, 0 fail, 0 missing of 39 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"services","detail":"services must be a list"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Validator rejection: "failing_checks names 'least_privilege_identity', which is not in the atom's check register (39 checks)". Fix: Rebuilt violations case as a deep copy of the full-pass manifest with planted value mutations only (services[0].dedicated_user_assigned=false and red_lines.root_service_run_for_convenience_present=true); failing_checks set to exactly the oracle-derived failing set ['every_rostered_service_has_dedicated_user_assignment', 'no_root_isolated_service_run_for_convenience'], confirmed by running the Python oracle on the mutated input.
2. (R1) Validator rejection: "failing_checks names 'red_lines', which is not in the atom's check register (39 checks)". Fix: Same rebuild as the other R1 rejection: section names removed; failing_checks set to exactly the oracle-derived failing set ['every_rostered_service_has_dedicated_user_assignment', 'no_root_isolated_service_run_for_convenience'], confirmed by running the Python oracle on the mutated input.
3. (R2) Validator rejection: "expect.computed_spot_checks is absent, empty or not structured (a non-empty object of quantity -> expected value, or a list of {quantity, expected} objects, is required); quantities stated only in prose notes do not count". Fix: Injected structured computed_spot_checks into full-pass expect as an object mapping quantity -> expected value, taken from the Python oracle output on the exact final full-pass input (computed_status, services_count, the three services_without_* lists, the three coverage ratios with fixed 6-decimal string serialization, duplicate_service_names).
4. (R2) Validator rejection: "expect.computed_spot_checks is absent, empty or not structured (a non-empty object of quantity -> expected value, or a list of {quantity, expected} objects, is required); quantities stated only in prose notes do not count". Fix: Injected structured computed_spot_checks into violations expect as an object mapping quantity -> expected value, taken from the Python oracle output on the exact mutated violations input (computed_status outside_stated_limits_on_declared_evidence, services_without_dedicated_user ['auth-svc'], dedicated_user_coverage '0.000000', other quantities as computed by the oracle).
5. (R3) Validator rejection: "violations input is missing key paths present in the full-pass manifest (a sparse violations input reads as missing evidence, not as failure): confinement, confinement.chroot_not_relied_upon_as_sole_service_isolation, confinement.mac_denials_audited_without_blanket_disabling_confinement, confinement.mac_profile_confines_network_exposed_isolated_services, confinement.microvm_used_where_kernel_level_isolation_is_required, confinement.namespaces_provide_filesystem_and_network_separation_for_isolated_services, confinement.sandbox_tool_used_for_one_off_untrusted_execution_isolation, confinement.wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation, confinement.windows_low_privilege_isolation_equivalents_applied_where_in_scope, egress_monitoring, egress_monitoring.exec_and_spawn_events_logged_for_isolated_services, egress_monitoring.outbound_egress_restricted_for_isolated_services_not_needing_world_access, egress_monitoring.per_service_kill_switch_available_for_isolated_services, identity, identity.cross_service_filesystem_access_denied_between_services, identity.dedicated_non_login_system_user_per_isolated_service, identity.isolated_services_run_as_non_root, identity.per_service_capability_set_minimised, resources, resources.cgroups_v2_cpu_memory_io_limits_set_for_isolated_services, resources.execution_timeouts_configured_for_isolated_services, resources.per_service_ulimits_configured_for_isolated_services, resources.restart_limits_configured_for_isolated_services, subject, systemd, systemd.systemd_capability_bounding_set_directive_restricted, systemd.systemd_dynamic_user_directive_set, systemd.systemd_no_new_privileges_directive_set, systemd.systemd_private_tmp_directive_set, systemd.systemd_protect_home_directive_set, systemd.systemd_protect_system_strict_directive_set, systemd.systemd_read_write_paths_directive_limited_to_required_paths, systemd.systemd_restrict_address_families_directive_applied, systemd.systemd_system_call_filter_directive_applied, verification, verification.runaway_service_behaviour_tested_against_resource_limits, verification.sandbox_blocking_verified_not_assumed_for_isolated_services, verification.sandbox_escape_and_abuse_cases_exercised_for_isolated_services". Fix: Rebuilt violations input as a deep copy of the full-pass manifest so every key path of the full-pass input is present, changing values only via the two planted mutations (services[0].dedicated_user_assigned=false; red_lines.root_service_run_for_convenience_present=true).

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 39 checks pass on it — no correction needed), and the sparse case was set to an identity-only manifest (`{subject}` only, as designed). The malformed case as designed already carried exactly one documented type violation (`services` as a string where a list is required); the executed case keeps that same single violation on a deep copy of the full-pass manifest, so the 422 field is unambiguous.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (roster declaration, dedicated-user / filesystem-scope / egress per-row completeness over the declared roster, duplicate names, `services_count`, the three "without" name lists, the three coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/service-isolation-hardening-review/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass roster / per-row checks (dedicated user, filesystem scope, egress — 1 of 1 true each) | pass / pass / pass | pass / pass / pass | ✓ |
| full-pass `services_count` | 1 | 1 | ✓ |
| full-pass `services_without_dedicated_user` / `services_without_filesystem_scope` / `services_without_egress_restriction` | [] / [] / [] | [] / [] / [] | ✓ |
| full-pass `duplicate_service_names` | [] | [] | ✓ |
| full-pass `dedicated_user_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `filesystem_scope_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `egress_restriction_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `computed_status` (all five primary computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations dedicated-user per-row check (0 of 1 true) | fail | fail | ✓ |
| violations `services_count` | 1 | 1 | ✓ |
| violations `services_without_dedicated_user` | ["auth-svc"] | ["auth-svc"] | ✓ |
| violations `dedicated_user_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `filesystem_scope_coverage` / `egress_restriction_coverage` | "1.000000" / "1.000000" | "1.000000" / "1.000000" | ✓ |
| violations `computed_status` (a primary computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly `every_rostered_service_has_dedicated_user_assignment`, `no_root_isolated_service_run_for_convenience` | same 2 | ✓ |
| verdicts | SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED / SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED (2 fail) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 2-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `services`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
