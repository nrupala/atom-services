# Test report — community-support-operations

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 56f92826f4284ec9a8570d683113aa86
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/community-support-operations/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — SLA targets 1 / 2 / 3 hours (outage < broken < question), messages received 100 / tracked 100, top themes 10 / covered 10, triage categories `[bug, feature, usage, noise]`, threads total 50 / closed 50, all other booleans true and all red-line booleans false | HTTP 200, verdict `COMMUNITY_SUPPORT_READY`, `computed_tracked_share` `1.000000`, `tracked_difference` `0.000000`, `computed_theme_coverage_ratio` `1.000000`, `theme_coverage_difference` `0.000000`, `triage_categories_not_covered` `[]`, `computed_thread_closure_share` `1.000000`, `thread_closure_difference` `0.000000`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `COMMUNITY_SUPPORT_READY`, 38 pass / 0 fail / 0 missing, exactly those computed values, all seven sections `pass` | PASS |
| 2 | violations — full manifest with SLA outage 5 / broken 2 / question 3, tracked 50 of 100 received, themes covered 5 of 10 (top count itself 10), triage categories only `[bug, feature]`, threads closed 5 of 10 | HTTP 200, verdict `COMMUNITY_SUPPORT_NOT_READY`, the 5 named checks fail | HTTP 200, `COMMUNITY_SUPPORT_NOT_READY`, 33 pass / 5 fail / 0 missing; failing checks exactly `sla_targets_respect_severity_order`, `every_message_tracked`, `all_top_themes_have_doc_or_backlog`, `triage_categories_cover_stated_categories`, `every_thread_ends_with_resolution_or_tracked_item`; `computed_tracked_share` `0.500000`, `tracked_difference` `-50.000000`, `computed_theme_coverage_ratio` `0.500000`, `theme_coverage_difference` `-5.000000`, `triage_categories_not_covered` `[usage, noise]`, `computed_thread_closure_share` `0.500000`, `thread_closure_difference` `-5.000000`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `entity` and `intake.channels_defined` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 37 missing, computed fields null, `triage_categories_not_covered` null | PASS |
| 4 | malformed — `intake.channels_defined: "YES"` (string where a boolean is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"intake.channels_defined","detail":"intake.channels_defined must be a boolean"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `community_support_operations`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 38 checks and a text stamp):

```json
{"service": "community-support-operations", "atom_version": "0.1.0", "entity": "test-org", "verdict": "COMMUNITY_SUPPORT_READY", "sections": {"intake_and_slas": "pass", "help_docs_and_deflection": "pass", "triage_loop": "pass", "response_craft_and_red_lines": "pass", "release_and_incident_comms": "pass", "community_norms": "pass", "measurement": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "computed_tracked_share": "1.000000", "tracked_difference": "0.000000", "computed_theme_coverage_ratio": "1.000000", "theme_coverage_difference": "0.000000", "triage_categories_not_covered": [], "computed_thread_closure_share": "1.000000", "thread_closure_difference": "0.000000", "summary": "38 pass, 0 fail, 0 missing of 38 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"intake.channels_defined","detail":"intake.channels_defined must be a boolean"}
```

## Findings

No findings.

## Tester errors

3 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors):

1. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check list (`computed_tracked_share` `1.000000`, `tracked_difference` `0.000000`, `computed_theme_coverage_ratio` `1.000000`, `theme_coverage_difference` `0.000000`, `triage_categories_not_covered` `[]`, `computed_thread_closure_share` `1.000000`, `thread_closure_difference` `0.000000`, `computed_status` `within_stated_limits_on_declared_evidence`).
2. Violations designed `failing_checks` listed descriptive names (`SLA severity order`, `Intake tracking`, `Top-ten themes`, `Triage categories`, `Thread closure`) instead of exact check names. Corrected before execution to the 5 exact check names above.
3. Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check list (`computed_tracked_share` `0.500000`, `tracked_difference` `-50.000000`, `computed_theme_coverage_ratio` `0.500000`, `theme_coverage_difference` `-5.000000`, `triage_categories_not_covered` `[usage, noise]`, `computed_thread_closure_share` `0.500000`, `thread_closure_difference` `-5.000000`, `computed_status` `outside_stated_limits_on_declared_evidence`).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (SLA severity order, tracked share and difference, top-theme coverage ratio and difference, triage categories not covered, thread closure share and difference, and `computed_status`, all with the SERVICE.md 6dp round-half-up rule) and verified the artifact's numbers and verdicts. Raw output: `verification/work/community-support-operations/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `computed_tracked_share` (100 / 100) | 1.000000 | 1.000000 | ✓ |
| full-pass `tracked_difference` (100 − 100) | 0.000000 | 0.000000 | ✓ |
| full-pass `computed_theme_coverage_ratio` (10 / 10) | 1.000000 | 1.000000 | ✓ |
| full-pass `theme_coverage_difference` (10 − 10) | 0.000000 | 0.000000 | ✓ |
| full-pass `triage_categories_not_covered` | [] | [] | ✓ |
| full-pass `computed_thread_closure_share` (50 / 50) | 1.000000 | 1.000000 | ✓ |
| full-pass `thread_closure_difference` (50 − 50) | 0.000000 | 0.000000 | ✓ |
| violations `computed_tracked_share` (50 / 100) | 0.500000 | 0.500000 | ✓ |
| violations `tracked_difference` (50 − 100) | -50.000000 | -50.000000 | ✓ |
| violations `computed_theme_coverage_ratio` (5 / 10) | 0.500000 | 0.500000 | ✓ |
| violations `theme_coverage_difference` (5 − 10) | -5.000000 | -5.000000 | ✓ |
| violations `triage_categories_not_covered` | [usage, noise] | [usage, noise] | ✓ |
| violations `computed_thread_closure_share` (5 / 10) | 0.500000 | 0.500000 | ✓ |
| violations `thread_closure_difference` (5 − 10) | -5.000000 | -5.000000 | ✓ |
| verdicts | COMMUNITY_SUPPORT_READY / COMMUNITY_SUPPORT_NOT_READY (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case. The coordinating tester's own headline recompute also matches: tracked 100 / received 100 = 1.000000 → `computed_tracked_share` `1.000000`, identical to the artifact.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `intake.channels_defined`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
