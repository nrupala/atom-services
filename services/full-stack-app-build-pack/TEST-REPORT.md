# Test report — full-stack-app-build-pack

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 38371decd3a447a1b2c82ff4ac4e8e42
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/full-stack-app-build-pack/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (project `test-project`): all approach/frontend/backend/data/security/testing/deploy declarations true, the eight must-be-false anti-pattern flags false, one slice `slice-1` end-to-end complete, `zero_knowledge_required` false, `direct_to_production_used` false | HTTP 200, verdict `FULL_STACK_BUILD_SOUND`, `slices_count` `1`, `slices_not_end_to_end` `[]`, `slice_end_to_end_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `FULL_STACK_BUILD_SOUND`, 57 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest identical to full-pass except the eight must-be-false anti-pattern fields set true (`framework_bloat_present`, `bare_500_responses_present`, `string_concatenated_sql_present`, `secrets_in_repo_present`, `tests_deferred_present`, `docker_used_present`, `big_bang_release_present`, `premature_optimization_present`) | HTTP 200, verdict `FULL_STACK_BUILD_NOT_SOUND`, the 8 named checks fail | HTTP 200, `FULL_STACK_BUILD_NOT_SOUND`, 49 pass / 8 fail / 0 missing; failing checks exactly `no_framework_bloat`, `no_bare_500_responses`, `no_string_concatenated_sql`, `no_secrets_in_repo`, `no_tests_deferred`, `no_docker_used`, `no_big_bang_release`, `no_premature_optimization`; `slices_count` `1`, `slices_not_end_to_end` `[]`, `slice_end_to_end_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` (derived only from the two slice checks, which still pass); sections `frontend`, `backend_and_data`, `security`, `testing_and_quality` and `deploy_and_delivery` `fail`, `approach_and_contracts` `pass` | PASS |
| 3 | sparse — only `project` (`minimal-project`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 57 missing, all six sections `insufficient_evidence`, `slices_count` null, `slices_not_end_to_end` null, `slice_end_to_end_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `slices: "not-a-list"` (string where a list is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"slices","detail":"slices must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `full_stack_app_build_pack`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 57 checks and a text stamp):

```json
{"service": "full-stack-app-build-pack", "atom_version": "0.1.0", "project": "test-project", "verdict": "FULL_STACK_BUILD_SOUND", "sections": {"approach_and_contracts": "pass", "frontend": "pass", "backend_and_data": "pass", "security": "pass", "testing_and_quality": "pass", "deploy_and_delivery": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "slices_count": 1, "slices_not_end_to_end": [], "slice_end_to_end_coverage": "1.000000", "summary": "57 pass, 0 fail, 0 missing of 57 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"slices","detail":"slices must be a list"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 11 rejections in total — by rule: R1 check-register ×8, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed the eight input field paths `frontend.framework_bloat_present`, `backend.bare_500_responses_present`, `data.string_concatenated_sql_present`, `security.secrets_in_repo_present`, `testing.tests_deferred_present`, `deploy.docker_used_present`, `deploy.big_bang_release_present`, `deploy.premature_optimization_present` instead of exact check names — 8 validator rejections. Corrected before execution to the 8 exact check names the planted values fail: `no_framework_bloat`, `no_bare_500_responses`, `no_string_concatenated_sql`, `no_secrets_in_repo`, `no_tests_deferred`, `no_docker_used`, `no_big_bang_release`, `no_premature_optimization`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block, hand-computed from the input per SERVICE.md (`slices_count` `1`, `slices_not_end_to_end` `[]`, `slice_end_to_end_coverage` `"1.000000"` — 1 end-to-end slice ÷ 1 declared slice, 6dp rule — `computed_status` `within_stated_limits_on_declared_evidence`).
3. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`slices_count` `1`, `slices_not_end_to_end` `[]`, `slice_end_to_end_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` — the slices are unchanged from full-pass and `computed_status` derives only from the two slice checks, so the eight planted anti-pattern failures do not change it).
4. (R3) Violations input was a sparse fragment instead of a full manifest — it carried only the eight planted fields in partial `frontend` / `backend` / `data` / `security` / `testing` / `deploy` objects and omitted the full-pass manifest's `project`, `approach`, `slices` and all remaining key paths. Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the 8 planted violations (the eight must-be-false anti-pattern fields set `true`) and nothing else changed.

The full-pass input was verified genuinely valid per SERVICE.md before execution (the Python oracle returns 57 pass / 0 fail / 0 missing on it locally — every required field present with correct types and nesting; `zero_knowledge_required` false so the two zero-knowledge checks pass as not applicable, and `direct_to_production_used` false so the named-bridge check passes as not applicable — no correction needed), the sparse case was verified genuinely sparse (only `project` — no correction needed), and the malformed case needed no correction (exactly one type violation of a documented typed field — `slices` as a string where a list is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the two primary computed checks, the declared count, the row-name list, the coverage ratio under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, the conditional zero-knowledge and direct-to-production checks, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/full-stack-app-build-pack/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `slices_count` | 1 | 1 | ✓ |
| full-pass `slices_not_end_to_end` | [] | [] | ✓ |
| full-pass `slice_end_to_end_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `computed_status` (both computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `slices_count` / `slices_not_end_to_end` / `slice_end_to_end_coverage` (slices unchanged) | 1 / [] / "1.000000" | 1 / [] / "1.000000" | ✓ |
| violations `computed_status` (both computed checks still pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 8 planted checks | same 8 | ✓ |
| verdicts | FULL_STACK_BUILD_SOUND / FULL_STACK_BUILD_NOT_SOUND (8 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 8-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only three quantities (it omitted `slices_not_end_to_end`), the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `slices`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
