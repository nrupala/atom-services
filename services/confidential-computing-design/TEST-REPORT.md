# Test report — confidential-computing-design

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 56f92826f4284ec9a8570d683113aa86
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/confidential-computing-design/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete design record (Intel TDX, protects `host_access`/`operator_access`/`co_tenant_access`, exclusions `side_channels`/`supply_chain`/`flawed_enclave_code`/`unsealed_inputs_outputs`, 1 trusted component × 100 lines, declared total 100, all red lines false) | HTTP 200, verdict `CONFIDENTIAL_COMPUTING_DESIGN_READY`, `components_evaluated` 1, `computed_trusted_codebase_lines` `100.000000`, `trusted_codebase_difference` `0.000000`, all coverage lists `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `CONFIDENTIAL_COMPUTING_DESIGN_READY`, 35 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — full manifest identical to full-pass except `debug_enabled_in_production` true, declared trusted total 50 vs computed 100, `root_keys_stored_unsealed_beside_enclave` true, `unverifiable_secure_enclave_claims_made` true | HTTP 200, verdict `CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY`, the 4 named checks fail | HTTP 200, `CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY`, 31 pass / 4 fail / 0 missing; failing checks exactly `production_debug_disabled`, `trusted_codebase_total_matches_component_sum`, `root_keys_never_stored_unsealed`, `no_unverifiable_secure_enclave_claims`; `computed_trusted_codebase_lines` `100.000000`, `trusted_codebase_difference` `-50.000000`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `entity` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 35 missing, computed fields null, `components_evaluated` 0 | PASS |
| 4 | malformed — `enclave.declared_trusted_codebase_lines: "one hundred"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"enclave.declared_trusted_codebase_lines","detail":"enclave.declared_trusted_codebase_lines must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `confidential_computing_design`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 35 checks and a text stamp):

```json
{"service": "confidential-computing-design", "atom_version": "0.1.0", "entity": "secure-enclave-v1", "verdict": "CONFIDENTIAL_COMPUTING_DESIGN_READY", "sections": {"threat_model": "pass", "technology_selection": "pass", "attestation": "pass", "enclave_patterns": "pass", "engineering_discipline": "pass", "key_management": "pass", "claims_discipline": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "components_evaluated": 1, "computed_trusted_codebase_lines": "100.000000", "trusted_codebase_difference": "0.000000", "threat_protects_not_covered": [], "threat_exclusions_not_covered": [], "claims_exclusions_not_listed": [], "summary": "35 pass, 0 fail, 0 missing of 35 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"enclave.declared_trusted_codebase_lines","detail":"enclave.declared_trusted_codebase_lines must be a number"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors):

1. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured list (`components_evaluated` 1, `computed_trusted_codebase_lines` `100.000000`, `trusted_codebase_difference` `0.000000`, `threat_protects_not_covered` `[]`, `threat_exclusions_not_covered` `[]`, `claims_exclusions_not_listed` `[]`, `computed_status` `within_stated_limits_on_declared_evidence`).
2. Violations designed `failing_checks` listed field paths (`enclave.debug_enabled_in_production`, `enclave.declared_trusted_codebase_lines`, `keys.root_keys_stored_unsealed_beside_enclave`, `claims.unverifiable_secure_enclave_claims_made`) instead of exact check names. Corrected before execution to the 4 exact check names above.
3. Violations input was sparse — only fragments of `enclave`, `keys` and `claims`, so the other sections' checks would have been `missing`, not failing. Corrected before execution: rebuilt as a full manifest identical to full-pass carrying exactly the four planted violations.
4. Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured list (`components_evaluated` 1, `computed_trusted_codebase_lines` `100.000000`, `trusted_codebase_difference` `-50.000000`, coverage lists `[]`, `computed_status` `outside_stated_limits_on_declared_evidence`).
5. Malformed input carried two simultaneous type violations (`threat_model` as a string and `enclave.trusted_components` as a string), making the expected 422 field ambiguous. Corrected before execution: reduced to a single genuine type violation of a documented typed field — `enclave.declared_trusted_codebase_lines` as a string where a number is required.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (threat-model protects/exclusions coverage, trusted-component completeness, trusted-codebase total and difference with the SERVICE.md 6dp round-half-up rule, public-exclusions coverage, and `computed_status`) and verified the artifact's numbers and verdicts. Raw output: `verification/work/confidential-computing-design/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `computed_trusted_codebase_lines` (sum 100) | 100.000000 | 100.000000 | ✓ |
| full-pass `trusted_codebase_difference` (100 − 100) | 0.000000 | 0.000000 | ✓ |
| full-pass `components_evaluated` | 1 | 1 | ✓ |
| full-pass `threat_protects_not_covered` / `threat_exclusions_not_covered` / `claims_exclusions_not_listed` | [] / [] / [] | [] / [] / [] | ✓ |
| full-pass `computed_status` | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `computed_trusted_codebase_lines` (sum 100) | 100.000000 | 100.000000 | ✓ |
| violations `trusted_codebase_difference` (50 − 100) | -50.000000 | -50.000000 | ✓ |
| violations `computed_status` | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| verdicts | CONFIDENTIAL_COMPUTING_DESIGN_READY / CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `enclave.declared_trusted_codebase_lines`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
