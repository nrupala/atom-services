# Test report — offline-first-pwa-engineering-pack

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment c64bdc48fce84cd4817fe3a293be6ae5
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/offline-first-pwa-engineering-pack/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (app `TestApp`): all architecture/service-worker/storage/sync/installability/encryption/testing declarations in passing polarity, all three red-line flags false, sync gate and zero-knowledge gate both true with all gated fields true, two core-flow rows `login` and `view_dashboard` both working fully offline | HTTP 200, verdict `OFFLINE_FIRST_PWA_SOUND`, `core_flows_count` `2`, `offline_coverage` `"1.000000"`, `flows_without_offline_support` `[]`, `duplicate_flow_names` `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `OFFLINE_FIRST_PWA_SOUND`, 41 pass / 0 fail / 0 missing, all seven sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest identical to full-pass except `core_flows[0].works_fully_offline` false, `core_flows[1].name` changed to `login` (duplicate), `service_worker.app_shell_precached` false, and `red_lines.silent_data_loss_present` true | HTTP 200, verdict `OFFLINE_FIRST_PWA_NOT_SOUND`, the 4 named checks fail | HTTP 200, `OFFLINE_FIRST_PWA_NOT_SOUND`, 37 pass / 4 fail / 0 missing; failing checks exactly `app_shell_precached`, `every_core_flow_works_fully_offline`, `no_core_flow_name_duplicated`, `silent_data_loss_refused`; `core_flows_count` `2`, `flows_without_offline_support` `["login"]`, `duplicate_flow_names` `["login"]`, `offline_coverage` `"0.500000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `offline_first_architecture`, `service_worker_discipline` and `pwa_red_lines` `fail`, the other four `pass` | PASS |
| 3 | sparse — only `app` (`TestApp`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 41 missing, all seven sections `insufficient_evidence`, `core_flows_count` null, `flows_without_offline_support` null, `offline_coverage` null, `duplicate_flow_names` null, `computed_status` null | PASS |
| 4 | malformed — `architecture.local_store_is_primary_source: "NOT_A_BOOLEAN"` (string where a boolean is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"architecture.local_store_is_primary_source","detail":"architecture.local_store_is_primary_source must be a boolean"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `offline_first_pwa_engineering_pack`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 41 checks and a text stamp):

```json
{"service": "offline-first-pwa-engineering-pack", "atom_version": "0.1.0", "app": "TestApp", "verdict": "OFFLINE_FIRST_PWA_SOUND", "sections": {"offline_first_architecture": "pass", "service_worker_discipline": "pass", "storage_engineering": "pass", "sync_and_honest_state": "pass", "installability_encryption_and_ux": "pass", "testing_and_quality_gates": "pass", "pwa_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "core_flows_count": 2, "flows_without_offline_support": [], "offline_coverage": "1.000000", "duplicate_flow_names": [], "summary": "41 pass, 0 fail, 0 missing of 41 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"architecture.local_store_is_primary_source","detail":"architecture.local_store_is_primary_source must be a boolean"}
```

## Findings

No findings.

## Tester errors

6 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 4 rejections in total — by rule: R1 check-register ×1, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1. The corrected, executed battery passed the validator (`final_ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the section name `pwa_red_lines` instead of an exact check name — validator rejection: "failing_checks names 'pwa_red_lines', which is not in the atom's check register (41 checks)". Corrected before execution as part of rebuilding the violations case (see below).
2. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes). Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `core_flows_count` `2`, `flows_without_offline_support` `[]`, `offline_coverage` `"1.000000"`, `duplicate_flow_names` `[]`).
3. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `core_flows_count` `2`, `flows_without_offline_support` `["login"]`, `offline_coverage` `"0.500000"`, `duplicate_flow_names` `["login"]`).
4. (R3) Violations input was a sparse manifest missing most key paths present in the full-pass manifest (all of `encryption`, `installability`, `service_worker`, `storage`, `sync` and `testing`, with their sub-fields). Corrected before execution: the violations case was rebuilt as a full copy of the full-pass manifest (see item 6).
5. (genuine-validity) The full-pass input was not genuinely valid: the oracle returned 0 fail but 3 missing — `core_flows_declared`, `every_core_flow_works_fully_offline`, `no_core_flow_name_duplicated` — because Gemini nested `core_flows` inside `architecture`, whereas SERVICE.md / MANIFEST_SPEC declare it as a top-level list. Corrected minimally before execution by moving `core_flows` to the top level of the manifest (`architecture.core_flows` -> `core_flows`), after which the oracle returns 0 fail and 0 missing (all 41 checks pass).
6. (plant-adaptation) The violations case was rebuilt as a deep copy of the (corrected) full-pass manifest carrying exactly the 4 planted changes — `core_flows[0].works_fully_offline` = false, `core_flows[1].name` = `"login"` (duplicate of `core_flows[0]`), `service_worker.app_shell_precached` = false, `red_lines.silent_data_loss_present` = true — with `failing_checks` set to exactly the oracle's failing set: `app_shell_precached`, `every_core_flow_works_fully_offline`, `no_core_flow_name_duplicated`, `silent_data_loss_refused`, and outcome `OFFLINE_FIRST_PWA_NOT_SOUND`.

The sparse case was replaced with an identity-only manifest (`{app}` only), and the malformed case was kept as designed: the raw malformed case carried exactly one documented type violation (`architecture.local_store_is_primary_source` as a string where a boolean is required), so no correction was needed there.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the three primary computed checks, the declared counts, the row-name lists, the coverage ratio under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/offline-first-pwa-engineering-pack/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `core_flows_count` | 2 | 2 | ✓ |
| full-pass `offline_coverage` (2 ÷ 2) | "1.000000" | "1.000000" | ✓ |
| full-pass `flows_without_offline_support` / `duplicate_flow_names` | [] / [] | [] / [] | ✓ |
| full-pass `computed_status` (all three computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `core_flows_count` | 2 | 2 | ✓ |
| violations `flows_without_offline_support` | ["login"] | ["login"] | ✓ |
| violations `duplicate_flow_names` | ["login"] | ["login"] | ✓ |
| violations `offline_coverage` (1 ÷ 2) | "0.500000" | "0.500000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | OFFLINE_FIRST_PWA_SOUND / OFFLINE_FIRST_PWA_NOT_SOUND (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `architecture.local_store_is_primary_source`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
