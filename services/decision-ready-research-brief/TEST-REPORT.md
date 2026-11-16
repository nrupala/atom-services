# Test report — decision-ready-research-brief

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7bad54c4e4a145e493e8766eb2f3bafb
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/decision-ready-research-brief/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (brief `Market entry strategy`): all scoping/evidence/synthesis/reuse/tooling/disclosure declarations true, the three must-be-false flags false, 1 question, 2 fully-provenanced sources, 1 material + important claim naming both sources, `report_sections` in exact skill order | HTTP 200, verdict `RESEARCH_BRIEF_DECISION_READY`, `questions_count` `1`, `sources_count` `2`, `claims_count` `1`, all three coverage ratios `"1.0000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `RESEARCH_BRIEF_DECISION_READY`, 42 pass / 0 fail / 0 missing, all four sections `pass`, exactly those computed values, all three row-name lists `[]` | PASS |
| 2 | violations — full manifest with `sources[0].link` `""`, important claim `C1` naming only `["S1"]`, `reuse.silent_edits_present` true | HTTP 200, verdict `RESEARCH_BRIEF_NOT_DECISION_READY`, the 3 named checks fail | HTTP 200, `RESEARCH_BRIEF_NOT_DECISION_READY`, 39 pass / 3 fail / 0 missing; failing checks exactly `every_source_has_link`, `every_important_claim_triangulated_across_declared_sources`, `no_silent_edits`; `source_provenance_coverage` `"0.5000"`, `material_claim_source_coverage` `"1.0000"`, `important_claim_triangulation_coverage` `"0.0000"`, `sources_without_complete_provenance` `["S1"]`, `important_claims_not_triangulated` `["C1"]`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `scoping_and_sources`, `evidence_and_notes` and `reuse_verification_and_red_lines` `fail`, `synthesis_and_report_structure` `pass` | PASS |
| 3 | sparse — only `brief` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 42 missing, all four sections `insufficient_evidence`, all counts, lists, ratios and `computed_status` null | PASS |
| 4 | malformed — `scope: "not-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"scope","detail":"scope must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `decision_ready_research_brief`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 42 checks and a text stamp):

```json
{"service": "decision-ready-research-brief", "atom_version": "0.1.0", "brief": "Market entry strategy", "verdict": "RESEARCH_BRIEF_DECISION_READY", "sections": {"scoping_and_sources": "pass", "evidence_and_notes": "pass", "synthesis_and_report_structure": "pass", "reuse_verification_and_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "questions_count": 1, "sources_count": 2, "sources_without_complete_provenance": [], "source_provenance_coverage": "1.0000", "claims_count": 1, "material_claims_without_sources": [], "material_claim_source_coverage": "1.0000", "important_claims_not_triangulated": [], "important_claim_triangulation_coverage": "1.0000", "summary": "42 pass, 0 fail, 0 missing of 42 checks across four sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"scope","detail":"scope must be an object"}
```

## Findings

No findings.

## Tester errors

6 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 6 rejections in total, by rule: **R1 check-register — 3; R2 structured-spot-checks — 2; R3 violations-full-manifest — 1; R4 — 0.** The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations `failing_checks` named the section shorthand `Provenance per source` instead of an exact check name. Corrected before execution to `every_source_has_link`, the check the planted empty `link` string fails.
2. (R1) Violations `failing_checks` named the section shorthand `Triangulation per important claim` instead of an exact check name. Corrected before execution to `every_important_claim_triangulated_across_declared_sources`, the check the planted single-source important claim fails.
3. (R1) Violations `failing_checks` named the field path `reuse.silent_edits_present` instead of an exact check name. Corrected before execution to `no_silent_edits`, the check the planted `silent_edits_present: true` fails.
4. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`questions_count` `1`, `sources_count` `2`, `claims_count` `1`, `computed_status` `within_stated_limits_on_declared_evidence`, all three row-name lists `[]`, all three coverage ratios `"1.0000"`).
5. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`questions_count` `1`, `sources_count` `2`, `claims_count` `1`, `computed_status` `outside_stated_limits_on_declared_evidence`, `sources_without_complete_provenance` `["S1"]`, `source_provenance_coverage` `"0.5000"`, `material_claim_source_coverage` `"1.0000"`, `important_claims_not_triangulated` `["C1"]`, `important_claim_triangulation_coverage` `"0.0000"`).
6. (R3) Violations input was sparse — only `brief`, one source row, one claim row and `reuse.silent_edits_present` — instead of a full manifest. Corrected before execution: rebuilt it as a full manifest identical in structure to the full-pass manifest, carrying exactly the three planted violations above (empty `link` on `S1`, important claim `C1` naming only `["S1"]`, `silent_edits_present: true`) and no others.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types and nesting — no correction needed), the sparse case was as designed (no correction needed), and the malformed case already carried exactly one type violation of a documented typed field (`scope` as a string where an object is required — no correction needed).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (declared list lengths, the per-source link + date + quote provenance triple, material-claim sourcing against declared source names, important-claim triangulation at the skill's two-distinct-source bar, and the three coverage ratios under the fixed round-half-up 4-decimal serialization rule) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/decision-ready-research-brief/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `questions_count` / `sources_count` / `claims_count` | 1 / 2 / 1 | 1 / 2 / 1 | ✓ |
| full-pass `sources_without_complete_provenance` (both sources complete) | [] | [] | ✓ |
| full-pass `source_provenance_coverage` (2/2) | "1.0000" | "1.0000" | ✓ |
| full-pass `material_claim_source_coverage` (1/1, `C1` names `S1`+`S2`) | "1.0000" | "1.0000" | ✓ |
| full-pass `important_claim_triangulation_coverage` (1/1, 2 distinct sources) | "1.0000" | "1.0000" | ✓ |
| full-pass `computed_status` (all six primary computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `questions_count` / `sources_count` / `claims_count` | 1 / 2 / 1 | 1 / 2 / 1 | ✓ |
| violations `sources_without_complete_provenance` (`S1` link empty) | ["S1"] | ["S1"] | ✓ |
| violations `source_provenance_coverage` (1/2) | "0.5000" | "0.5000" | ✓ |
| violations `material_claim_source_coverage` (1/1, `C1` names declared `S1`) | "1.0000" | "1.0000" | ✓ |
| violations `important_claims_not_triangulated` (`C1` names 1 distinct source) | ["C1"] | ["C1"] | ✓ |
| violations `important_claim_triangulation_coverage` (0/1) | "0.0000" | "0.0000" | ✓ |
| violations `computed_status` (a primary computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 3 planted checks | same 3 | ✓ |
| verdicts | RESEARCH_BRIEF_DECISION_READY / RESEARCH_BRIEF_NOT_DECISION_READY (3 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 3-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence also matches on every case: per-case HTTP status, the full-pass verdict with all 42 checks passing, the violations failing-check set exactly equalling `expect.failing_checks`, the sparse `INSUFFICIENT_EVIDENCE` outcome, the malformed 422 `invalid_input` on field `scope`, determinism byte-identical true and MCP↔REST parity true. Where Gemini's judgment was checked against the raw evidence, no contradiction was found — the evidence and the judgment agree.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `scope`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
