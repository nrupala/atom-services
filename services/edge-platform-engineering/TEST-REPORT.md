# Test report — edge-platform-engineering

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 5cf70cb60526415d89b4db5e5cd02744
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/edge-platform-engineering/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (project `test-project`): all platform-fit/deploy/security/reliability/quota/DNS declarations true, the three must-be-false flags false, component `db-component` on `d1` with rationale documented, strong consistency required, admin surface with Access protected, `tunnels_present` false | HTTP 200, verdict `EDGE_PLATFORM_SOUND`, `components_count` `1`, `storage_documentation_coverage` `"1.000000"`, `access_protection_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `EDGE_PLATFORM_SOUND`, 38 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except component `bad-kv` on `kv` with `requires_strong_consistency` true and `access_protected` false on an admin surface | HTTP 200, verdict `EDGE_PLATFORM_NOT_SOUND`, the 2 named checks fail | HTTP 200, `EDGE_PLATFORM_NOT_SOUND`, 36 pass / 2 fail / 0 missing; failing checks exactly `no_strong_consistency_component_on_kv`, `every_admin_component_access_protected`; `components_on_kv_requiring_strong_consistency` `["bad-kv"]`, `admin_components_without_access` `["bad-kv"]`, `storage_documentation_coverage` `"1.000000"`, `access_protection_coverage` `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `platform_fit_and_storage` and `security_and_access` `fail`, the other three `pass` | PASS |
| 3 | sparse — only `project` (`sparse-project`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 38 missing, all five sections `insufficient_evidence`, `components_count` null, `components_without_storage_backend` null, `storage_documentation_coverage` null, `components_on_kv_requiring_strong_consistency` null, `admin_components_without_access` null, `access_protection_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `components: "not-a-list"` (string where a list is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"components","detail":"components must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `edge_platform_engineering`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 38 checks and a text stamp):

```json
{"service": "edge-platform-engineering", "atom_version": "0.1.0", "project": "test-project", "verdict": "EDGE_PLATFORM_SOUND", "sections": {"platform_fit_and_storage": "pass", "deploy_and_versioning": "pass", "security_and_access": "pass", "reliability_and_observability": "pass", "tunnels_quotas_and_hygiene": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "components_count": 1, "components_without_storage_backend": [], "storage_documentation_coverage": "1.000000", "components_on_kv_requiring_strong_consistency": [], "admin_components_without_access": [], "access_protection_coverage": "1.000000", "summary": "38 pass, 0 fail, 0 missing of 38 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"components","detail":"components must be a list"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed the computed output field names `components_on_kv_requiring_strong_consistency` and `admin_components_without_access` instead of exact check names — 2 validator rejections. Corrected before execution to the 2 exact check names the planted values fail: `no_strong_consistency_component_on_kv`, `every_admin_component_access_protected`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`components_count` `1`, `components_without_storage_backend` `[]`, `storage_documentation_coverage` `"1.000000"`, `components_on_kv_requiring_strong_consistency` `[]`, `admin_components_without_access` `[]`, `access_protection_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence`).
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`components_count` `1`, `components_without_storage_backend` `[]`, `storage_documentation_coverage` `"1.000000"`, `components_on_kv_requiring_strong_consistency` `["bad-kv"]`, `admin_components_without_access` `["bad-kv"]`, `access_protection_coverage` `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was sparse instead of a full manifest — it carried only `project` and `components` and omitted the full-pass manifest's `platform_fit`, `deploy`, `security`, `reliability`, `tunnels`, `quotas` and `dns_tls` key paths. Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the 2 planted violations (component `bad-kv` on `kv` requiring strong consistency, and an admin surface with `access_protected` false) and nothing else changed.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types and nesting, the tunnel checks passing as not applicable on the declared-false `tunnels_present` gate — no correction needed), the sparse case was verified genuinely sparse (only `project` — no correction needed), and the malformed case needed no correction (exactly one type violation of a documented typed field — `components` as a string where a list is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the five primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/edge-platform-engineering/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `components_count` | 1 | 1 | ✓ |
| full-pass `storage_documentation_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `access_protection_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `components_on_kv_requiring_strong_consistency` / `admin_components_without_access` | [] / [] | [] / [] | ✓ |
| full-pass `computed_status` (all five computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `components_on_kv_requiring_strong_consistency` (`bad-kv` on kv + strong consistency) | ["bad-kv"] | ["bad-kv"] | ✓ |
| violations `admin_components_without_access` (`bad-kv` admin, access false) | ["bad-kv"] | ["bad-kv"] | ✓ |
| violations `access_protection_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 2 planted checks | same 2 | ✓ |
| verdicts | EDGE_PLATFORM_SOUND / EDGE_PLATFORM_NOT_SOUND (2 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 2-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only four quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `components`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
