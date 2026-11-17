# Test report — javascript-review-and-build

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fe07be725c5a4817ad7b7e341310a97b
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/javascript-review-and-build/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (subject `auth-module`): all module/async/DOM/environment/bundle/test declarations in passing polarity, all four conditional gates declared `false` (network calls, HTML truly needed, shared code, UI) so the conditional checks pass as not applicable, one file `index.js` declared ESM with no var, no unhandled promise and no innerHTML injection | HTTP 200, verdict `JAVASCRIPT_REVIEW_SOUND`, `files_count` `1`, `esm_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `JAVASCRIPT_REVIEW_SOUND`, 27 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all four row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except 9 planted values: `modules.implicit_globals_present` true, `modules.var_used_present` true, `dom.user_input_via_inner_html_present` true, `bundle.huge_dependencies_for_small_jobs_present` true, file `index.js` with `var_present` / `unhandled_promise_present` / `inner_html_with_user_input_present` true, `red_lines.eval_or_function_on_untrusted_input_present` true and `red_lines.secrets_in_client_side_code_present` true | HTTP 200, verdict `JAVASCRIPT_REVIEW_NOT_SOUND`, the 9 named checks fail | HTTP 200, `JAVASCRIPT_REVIEW_NOT_SOUND`, 18 pass / 9 fail / 0 missing; failing checks exactly `no_implicit_globals`, `no_var_used`, `no_file_uses_var`, `no_file_has_unhandled_promise`, `no_user_input_via_inner_html`, `no_file_injects_user_input_via_inner_html`, `no_huge_dependencies_for_small_jobs`, `no_eval_or_function_on_untrusted_input`, `no_secrets_in_client_side_code`; `files_using_var` `["index.js"]`, `files_with_unhandled_promises` `["index.js"]`, `files_injecting_user_input_via_inner_html` `["index.js"]`, `files_without_esm` `[]`, `esm_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; all five sections `fail` | PASS |
| 3 | sparse — only `subject` (`incomplete-record`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 27 missing, all five sections `insufficient_evidence`, `files_count` null, `files_without_esm` null, `esm_coverage` null, `files_using_var` null, `files_with_unhandled_promises` null, `files_injecting_user_input_via_inner_html` null, `computed_status` null | PASS |
| 4 | malformed — `modules: "not-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"modules","detail":"modules must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `javascript_review_and_build`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 27 checks and a text stamp):

```json
{"service": "javascript-review-and-build", "atom_version": "0.1.0", "subject": "auth-module", "verdict": "JAVASCRIPT_REVIEW_SOUND", "sections": {"modules_and_strictness": "pass", "async_discipline": "pass", "dom_safety": "pass", "environment_and_bundle": "pass", "tests_and_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "files_count": 1, "files_without_esm": [], "esm_coverage": "1.000000", "files_using_var": [], "files_with_unhandled_promises": [], "files_injecting_user_input_via_inner_html": [], "summary": "27 pass, 0 fail, 0 missing of 27 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"modules","detail":"modules must be an object"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 6 rejections in total — by rule: R1 check-register ×4, R2 structured-spot-checks ×2, R3 violations-full-manifest ×0, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed the 4 section names `modules_and_strictness`, `dom_safety`, `environment_and_bundle`, `tests_and_red_lines` instead of exact check names — 4 validator rejections. Corrected before execution to the 9 exact check names the planted values fail: `no_implicit_globals`, `no_var_used`, `no_file_uses_var`, `no_file_has_unhandled_promise`, `no_user_input_via_inner_html`, `no_file_injects_user_input_via_inner_html`, `no_huge_dependencies_for_small_jobs`, `no_eval_or_function_on_untrusted_input`, `no_secrets_in_client_side_code`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`files_count` `1`, `files_without_esm` `[]`, `esm_coverage` `"1.000000"`, `files_using_var` `[]`, `files_with_unhandled_promises` `[]`, `files_injecting_user_input_via_inner_html` `[]`, `computed_status` `within_stated_limits_on_declared_evidence`), each value computed by hand from the input per SERVICE.md.
3. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`files_count` `1`, `files_without_esm` `[]`, `esm_coverage` `"1.000000"`, `files_using_var` `["index.js"]`, `files_with_unhandled_promises` `["index.js"]`, `files_injecting_user_input_via_inner_html` `["index.js"]`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (Oracle pre-check — incomplete manifest, no validator rule fired) Both the full-pass and violations `tests` objects omitted the unconditional field `tests.logic_extracted_from_event_handlers_and_tested`; run through the atom's Python oracle, the raw full-pass input returned `INSUFFICIENT_EVIDENCE` (26 pass / 0 fail / 1 missing), not the designed `JAVASCRIPT_REVIEW_SOUND`. Corrected before execution: added `logic_extracted_from_event_handlers_and_tested: true` to both manifests; the corrected full-pass input returns all 27 checks pass on the oracle.
5. (R3 fidelity — full-manifest principle, no validator rejection because key paths matched) The raw violations input changed two non-planted values relative to full-pass — `subject` (`auth-module` → `bad-module`) and `files[].name` (`index.js` → `bad.js`). Corrected before execution: rebuilt the violations input as an exact copy of the corrected full-pass manifest carrying exactly the 9 planted wrong values and nothing else changed.

The sparse case was verified genuinely sparse (only `subject` — no correction needed), and the malformed case needed no correction (exactly one type violation of a documented typed field — `modules` as a string where an object is required). The corrected violations input was verified on the oracle before execution to fail exactly the 9 planted checks (18 pass / 9 fail / 0 missing).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the five primary computed checks, the four conditional checks, the declared counts, the row-name lists, the `esm_coverage` ratio under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/javascript-review-and-build/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `files_count` | 1 | 1 | ✓ |
| full-pass `esm_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `files_without_esm` / `files_using_var` / `files_with_unhandled_promises` / `files_injecting_user_input_via_inner_html` | [] / [] / [] / [] | [] / [] / [] / [] | ✓ |
| full-pass `computed_status` (all five computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `files_using_var` / `files_with_unhandled_promises` / `files_injecting_user_input_via_inner_html` (`index.js` declares all three) | ["index.js"] / ["index.js"] / ["index.js"] | ["index.js"] / ["index.js"] / ["index.js"] | ✓ |
| violations `files_without_esm` / `esm_coverage` (1 ÷ 1) | [] / "1.000000" | [] / "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 9 planted checks | same 9 | ✓ |
| verdicts | JAVASCRIPT_REVIEW_SOUND / JAVASCRIPT_REVIEW_NOT_SOUND (9 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 9-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only three quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `modules`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
