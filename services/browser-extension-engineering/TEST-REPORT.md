# Test report — browser-extension-engineering

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fa3faa42fac649da873fcc00cfa20f82
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/browser-extension-engineering/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — all booleans pass, must-be-false fields false, requested `[storage, tabs]` fully justified, targets `[chrome, firefox]` fully tested | HTTP 200, verdict `EXTENSION_DESIGN_SOUND`, `permissions_without_justification` `[]`, `browsers_not_covered` `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `EXTENSION_DESIGN_SOUND`, 37 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — persistent background page and remote code true, overbroad permissions true, requested `[tabs]` vs justified `[]`, secrets in storage true, drive-by DOM changes true, browsing data exfiltrated and hidden collection true, target `[chrome]` neither tested nor documented, eval/remote scripts true | HTTP 200, verdict `EXTENSION_DESIGN_DEFICIENT`, the 10 named checks fail | HTTP 200, `EXTENSION_DESIGN_DEFICIENT`, 27 pass / 10 fail / 0 missing; failing checks exactly `no_persistent_background_page`, `no_remote_code_execution`, `no_overbroad_permissions`, `all_requested_permissions_justified_in_writing`, `no_secrets_in_extension_storage`, `no_drive_by_dom_changes_without_user_intent`, `browsing_data_never_exfiltrated`, `no_hidden_data_collection`, `all_target_browsers_tested_or_differences_documented`, `no_eval_or_remote_scripts`; `permissions_without_justification` `["tabs"]`, `browsers_not_covered` `["chrome"]`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `extension_name` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 37 missing, computed fields null | PASS |
| 4 | malformed — `extension_name: 12345` (number where a string is required), `mv3: "not_an_object"` | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"extension_name","detail":"extension_name must be a string"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `browser_extension_engineering`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 37 checks and a text stamp):

```json
{"service": "browser-extension-engineering", "atom_version": "0.1.0", "extension_name": "Test Extension", "verdict": "EXTENSION_DESIGN_SOUND", "sections": {"mv3_architecture": "pass", "least_privilege_permissions": "pass", "architecture_and_messaging": "pass", "ux_honesty": "pass", "privacy": "pass", "distribution_and_cross_browser": "pass", "security": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "permissions_without_justification": [], "browsers_not_covered": [], "summary": "37 pass, 0 fail, 0 missing of 37 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"extension_name","detail":"extension_name must be a string"}
```

## Findings

No findings.

## Tester errors

2 tester errors, corrected at design time before execution and not scored against the atom:

1. Violations designed `failing_checks` listed the 7 section names (`mv3_architecture`, `least_privilege_permissions`, `architecture_and_messaging`, `ux_honesty`, `privacy`, `distribution_and_cross_browser`, `security`) instead of exact check names. Corrected before execution to the 10 exact check names above, with no change to any input value or expected verdict.
2. Full-pass notes stated the computed lists as `permissions_without_justification=null, browsers_not_covered=null`, and carried no structured `computed_spot_checks`. Per SERVICE.md those lists are null only when a list is not declared; here all lists are declared, so both are `[]`. Corrected the notes and added the structured `computed_spot_checks` (`permissions_without_justification: []`, `browsers_not_covered: []`, `computed_status: within_stated_limits_on_declared_evidence`), with no change to any input value.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (permission-justification set difference, cross-browser coverage set logic, check tallies, and `computed_status`) and verified the artifact's numbers and verdicts. Raw output: `verification/work/browser-extension-engineering/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `permissions_without_justification` (`[storage, tabs]` − `[storage, tabs]`) | [] | [] | ✓ |
| full-pass `browsers_not_covered` (`[chrome, firefox]` covered by tested) | [] | [] | ✓ |
| full-pass `computed_status` | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| full-pass tally | 37 pass / 0 fail / 0 missing | same | ✓ |
| violations `permissions_without_justification` (`[tabs]` − `[]`) | ["tabs"] | ["tabs"] | ✓ |
| violations `browsers_not_covered` (`[chrome]` in neither list) | ["chrome"] | ["chrome"] | ✓ |
| violations `computed_status` | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations tally / failing checks | 27 pass / 10 fail / 0 missing, exactly the 10 planted | same | ✓ |
| verdicts | EXTENSION_DESIGN_SOUND / EXTENSION_DESIGN_DEFICIENT / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 10-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `extension_name`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
