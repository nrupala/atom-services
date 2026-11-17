# Test report — frontend-implementation

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 38371decd3a447a1b2c82ff4ac4e8e42
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/frontend-implementation/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (project `Alpha`): all structure/state/responsive/accessibility/performance declarations true, the must-be-false flags false, framework introduced with ADR recorded, fixed bars present with nothing hidden behind them, one data view `UserList` with all four states implemented | HTTP 200, verdict `FRONTEND_SOUND`, `data_views_count` `1`, `data_views_without_complete_states` `[]`, `state_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `FRONTEND_SOUND`, 39 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest identical to full-pass except eight planted values: `god_components_present` true, data view `BrokenView` with `empty_implemented` false, `dead_controls_present` true, `whole_screen_blocked_by_single_widget_present` true, `overflow_present` true, `overlap_present` true, `console_spam_present` true, `secrets_in_frontend_code_present` true | HTTP 200, verdict `FRONTEND_NOT_SOUND`, the 8 named checks fail | HTTP 200, `FRONTEND_NOT_SOUND`, 31 pass / 8 fail / 0 missing; failing checks exactly `no_god_components`, `every_data_view_has_all_four_states`, `no_dead_controls`, `no_whole_screen_blocked_by_single_widget`, `no_overflow`, `no_overlap`, `no_console_spam`, `no_secrets_in_frontend_code`; `data_views_count` `1`, `data_views_without_complete_states` `["BrokenView"]`, `state_coverage` `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `structure_and_components`, `states_and_data_layer`, `responsive_and_accessibility` and `verification_and_red_lines` `fail`, `performance_and_errors` `pass` | PASS |
| 3 | sparse — only `project` (`Gamma`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 39 missing, all five sections `insufficient_evidence`, `data_views_count` null, `data_views_without_complete_states` null, `state_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `structure: "not-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"structure","detail":"structure must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `frontend_implementation`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 39 checks and a text stamp):

```json
{"service": "frontend-implementation", "atom_version": "0.1.0", "project": "Alpha", "verdict": "FRONTEND_SOUND", "sections": {"structure_and_components": "pass", "states_and_data_layer": "pass", "responsive_and_accessibility": "pass", "performance_and_errors": "pass", "verification_and_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "data_views_count": 1, "data_views_without_complete_states": [], "state_coverage": "1.000000", "summary": "39 pass, 0 fail, 0 missing of 39 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"structure","detail":"structure must be an object"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 10 rejections in total — by rule: R1 check-register ×7, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. One further correction (item 5) was caught by hand-running the Python oracle on the raw design, not by the validator. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed input field paths (`structure.god_components_present`, `interactions.dead_controls_present`, `data_layer.whole_screen_blocked_by_single_widget_present`, `responsive.overflow_present`, `responsive.overlap_present`, `errors.console_spam_present`, `security.secrets_in_frontend_code_present`) instead of exact check names — 7 validator rejections — and omitted `every_data_view_has_all_four_states`, which its own planted incomplete data view (`empty_implemented` false) also fails. Corrected before execution to the 8 exact check names the planted values fail: `no_god_components`, `every_data_view_has_all_four_states`, `no_dead_controls`, `no_whole_screen_blocked_by_single_widget`, `no_overflow`, `no_overlap`, `no_console_spam`, `no_secrets_in_frontend_code`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`data_views_count` `1`, `data_views_without_complete_states` `[]`, `state_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence`).
3. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`data_views_count` `1`, `data_views_without_complete_states` `["BrokenView"]`, `state_coverage` `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was not a full manifest — it omitted key paths present in the full-pass manifest (`responsive.nothing_hidden_behind_fixed_bars` and the ADR path, as nested in the raw design). Corrected before execution: rebuilt it as a full copy of the corrected full-pass manifest carrying exactly the 8 planted violations and nothing else changed (the project name was also aligned to `Alpha` in that rebuild).
5. (Oracle hand-verification, no validator rule) Gemini nested `new_framework_introduced` and `adr_recorded` inside `structure`, but SERVICE.md and the oracle's MANIFEST_SPEC place them in a top-level `framework` object. As designed, the full-pass oracle verdict was `INSUFFICIENT_EVIDENCE` (38 pass / 0 fail / 1 missing — `new_framework_has_adr` missing), not `FRONTEND_SOUND`. Corrected before execution: moved both fields to a top-level `framework` object in the full-pass and violations inputs (full-pass: introduced `true`, ADR recorded `true`); the corrected full-pass oracle verdict is 39 pass / 0 fail / 0 missing.

The sparse case was verified genuinely sparse (only `project` — no correction needed), and the malformed case needed no correction (exactly one type violation of a documented typed field — `structure` as a string where an object is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the two primary computed checks, the conditional ADR and fixed-bars checks, the declared count, the row-name list, the coverage ratio under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/frontend-implementation/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `data_views_count` | 1 | 1 | ✓ |
| full-pass `state_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `data_views_without_complete_states` | [] | [] | ✓ |
| full-pass `computed_status` (both primary computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `data_views_without_complete_states` (`BrokenView`, `empty_implemented` false) | ["BrokenView"] | ["BrokenView"] | ✓ |
| violations `state_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `computed_status` (a primary computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 8 planted checks | same 8 | ✓ |
| verdicts | FRONTEND_SOUND / FRONTEND_NOT_SOUND (8 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 8-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity, and every structured spot-check quantity in both cases); where the Gemini judge's computed-check list covered only `data_views_count` and `state_coverage`, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `structure`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
