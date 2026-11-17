# Test report — multiplatform-core-design

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment a15298eb9b7f40bf80d306cea4a33f80
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/multiplatform-core-design/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (project `Vault`): all core/web/mobile/desktop-CLI/API/local-first/portability/packaging/testing declarations in passing polarity, all four red-line flags false, `packaging.docker_used` false, one surface row `web_client` with valid kind `web_pwa`, consuming the core contract, platform code isolated, no core logic reimplemented | HTTP 200, verdict `MULTIPLATFORM_CORE_SOUND`, `surfaces_count` `1`, `valid_kind_coverage` `"1.000000"`, `core_contract_coverage` `"1.000000"`, `isolated_platform_code_coverage` `"1.000000"`, `no_core_reimplementation_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `MULTIPLATFORM_CORE_SOUND`, 37 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except surface `web_client` with `kind` `watch`, `consumes_core_contract` false, `core_logic_reimplemented` true, and `packaging.docker_used` true | HTTP 200, verdict `MULTIPLATFORM_CORE_NOT_SOUND`, the 4 named checks fail | HTTP 200, `MULTIPLATFORM_CORE_NOT_SOUND`, 33 pass / 4 fail / 0 missing; failing checks exactly `every_surface_kind_valid`, `every_surface_consumes_core_contract`, `no_surface_reimplements_core_logic`, `no_docker`; `surfaces_with_invalid_kind` `["web_client"]`, `valid_kind_coverage` `"0.000000"`, `surfaces_not_consuming_core_contract` `["web_client"]`, `core_contract_coverage` `"0.000000"`, `surfaces_without_isolated_platform_code` `[]`, `isolated_platform_code_coverage` `"1.000000"`, `surfaces_reimplementing_core_logic` `["web_client"]`, `no_core_reimplementation_coverage` `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `surfaces_and_thin_adapters` and `packaging_and_testing` `fail`, the other three `pass` | PASS |
| 3 | sparse — only `project` (`fieldnotes`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 37 missing, all five sections `insufficient_evidence`, `surfaces_count` null, `surfaces_with_invalid_kind` null, `valid_kind_coverage` null, `surfaces_not_consuming_core_contract` null, `core_contract_coverage` null, `surfaces_without_isolated_platform_code` null, `isolated_platform_code_coverage` null, `surfaces_reimplementing_core_logic` null, `no_core_reimplementation_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `core: "not_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"core","detail":"core must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `multiplatform_core_design`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 37 checks and a text stamp):

```json
{"service": "multiplatform-core-design", "atom_version": "0.1.0", "project": "Vault", "verdict": "MULTIPLATFORM_CORE_SOUND", "sections": {"core_architecture": "pass", "surfaces_and_thin_adapters": "pass", "local_first_and_portability": "pass", "packaging_and_testing": "pass", "anti_pattern_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "surfaces_count": 1, "surfaces_with_invalid_kind": [], "valid_kind_coverage": "1.000000", "surfaces_not_consuming_core_contract": [], "core_contract_coverage": "1.000000", "surfaces_without_isolated_platform_code": [], "isolated_platform_code_coverage": "1.000000", "surfaces_reimplementing_core_logic": [], "no_core_reimplementation_coverage": "1.000000", "summary": "37 pass, 0 fail, 0 missing of 37 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"core","detail":"core must be an object"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 4 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2. The corrected, executed battery passed the validator (`final_ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the section name `packaging_and_testing` instead of an exact check name — validator rejection: "failing_checks names 'packaging_and_testing', which is not in the atom's check register (37 checks)". Corrected before execution as part of rebuilding the violations case (see below).
2. (R1) Violations designed `failing_checks` named the section name `surfaces_and_thin_adapters` instead of an exact check name — validator rejection: "failing_checks names 'surfaces_and_thin_adapters', which is not in the atom's check register (37 checks)". Corrected before execution: the violations case was rebuilt as a full copy of the full-pass manifest carrying exactly the 4 planted changes — `surfaces[0].kind` = `"watch"`, `surfaces[0].consumes_core_contract` = false, `surfaces[0].core_logic_reimplemented` = true, `packaging.docker_used` = true — with `failing_checks` set to exactly the 4 exact check names those changes fail: `every_surface_kind_valid`, `every_surface_consumes_core_contract`, `no_surface_reimplements_core_logic`, `no_docker`.
3. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes). Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `surfaces_count` `1`, `surfaces_with_invalid_kind` `[]`, `valid_kind_coverage` `"1.000000"`, `surfaces_not_consuming_core_contract` `[]`, `core_contract_coverage` `"1.000000"`, `surfaces_without_isolated_platform_code` `[]`, `isolated_platform_code_coverage` `"1.000000"`, `surfaces_reimplementing_core_logic` `[]`, `no_core_reimplementation_coverage` `"1.000000"`).
4. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `surfaces_count` `1`, `surfaces_with_invalid_kind` `["web_client"]`, `valid_kind_coverage` `"0.000000"`, `surfaces_not_consuming_core_contract` `["web_client"]`, `core_contract_coverage` `"0.000000"`, `surfaces_without_isolated_platform_code` `[]`, `isolated_platform_code_coverage` `"1.000000"`, `surfaces_reimplementing_core_logic` `["web_client"]`, `no_core_reimplementation_coverage` `"0.000000"`).

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 37 checks pass on it — no correction needed), the sparse case was replaced with an identity-only manifest (`{project}` only), and the malformed case was kept as designed: the raw malformed case carried exactly one documented type violation (`core` as a string where an object is required), so no correction was needed.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the five primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/multiplatform-core-design/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `surfaces_count` | 1 | 1 | ✓ |
| full-pass `valid_kind_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `core_contract_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `isolated_platform_code_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `no_core_reimplementation_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `surfaces_with_invalid_kind` / `surfaces_not_consuming_core_contract` / `surfaces_without_isolated_platform_code` / `surfaces_reimplementing_core_logic` | [] / [] / [] / [] | [] / [] / [] / [] | ✓ |
| full-pass `computed_status` (all five computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `surfaces_with_invalid_kind` (`web_client` kind `watch`) | ["web_client"] | ["web_client"] | ✓ |
| violations `valid_kind_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `surfaces_not_consuming_core_contract` | ["web_client"] | ["web_client"] | ✓ |
| violations `core_contract_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `isolated_platform_code_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| violations `surfaces_reimplementing_core_logic` | ["web_client"] | ["web_client"] | ✓ |
| violations `no_core_reimplementation_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | MULTIPLATFORM_CORE_SOUND / MULTIPLATFORM_CORE_NOT_SOUND (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `core`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
