# Test report — document-operations-service

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7bad54c4e4a145e493e8766eb2f3bafb
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/document-operations-service/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (operation `annual_report_audit`): all source/extraction/editing/preservation/verification/deliverable/delivery declarations true, the must-be-false flags false, gates declared so the conditional checks pass as not applicable or bind and pass, 1 document and 1 finding, both fully verified | HTTP 200, verdict `DOCUMENT_OPERATIONS_SOUND`, `documents_count` `1`, `findings_count` `1`, all three coverages `"1.0000"`, all three without-lists `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `DOCUMENT_OPERATIONS_SOUND`, 32 pass / 0 fail / 0 missing, all four sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest with `documents[0].output_reopened_and_checked` false, `findings[0].location` `""`, `findings[0].quoted_exactly_before_interpretation` false, `extraction.figure_quoted_without_location_present` true | HTTP 200, verdict `DOCUMENT_OPERATIONS_NOT_SOUND`, the 4 named checks fail | HTTP 200, `DOCUMENT_OPERATIONS_NOT_SOUND`, 28 pass / 4 fail / 0 missing; failing checks exactly `every_document_output_reopened_and_checked`, `every_finding_has_location_recorded`, `every_finding_quoted_exactly_before_interpretation`, `no_figure_quoted_without_location`; `documents_count` `1`, `findings_count` `1`, `documents_without_output_verification` `["bad_doc"]`, `findings_without_location` `["bad_finding"]`, `findings_not_quoted_exactly_first` `["bad_finding"]`, all three coverages `"0.0000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `source_and_extraction` and `conversion_and_verification` `fail`, the other two `pass` | PASS |
| 3 | sparse — only `operation` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 32 missing, all four sections `insufficient_evidence`, `documents_count` null, `findings_count` null, all three without-lists null, all three coverages null, `computed_status` null | PASS |
| 4 | malformed — `documents: "not_a_list"` (string where a list is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"documents","detail":"documents must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `document_operations_service`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 32 checks and a text stamp):

```json
{"service": "document-operations-service", "atom_version": "0.1.0", "operation": "annual_report_audit", "verdict": "DOCUMENT_OPERATIONS_SOUND", "sections": {"source_and_extraction": "pass", "editing_and_preservation": "pass", "conversion_and_verification": "pass", "delivery_and_hygiene": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "documents_count": 1, "documents_without_output_verification": [], "output_verification_coverage": "1.0000", "findings_count": 1, "findings_without_location": [], "location_coverage": "1.0000", "findings_not_quoted_exactly_first": [], "exact_quote_coverage": "1.0000", "summary": "32 pass, 0 fail, 0 missing of 32 checks across four sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"documents","detail":"documents must be a list"}
```

## Findings

No findings.

## Tester errors

The mechanical pre-flight validator rejected the raw Gemini design with **7 rejections**: R1 check-register ×4, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1 (R4 malformed-exactly-one ×0). 4 tester errors (correction entries), all corrected at design time before execution and not scored against the atom; the executed battery passed the validator (`ok: true`). The Gemini judge recorded 0 additional tester errors at the judgment stage:

1. (R1) Violations `expect.failing_checks` named field paths (`output_reopened_and_checked`, `location`, `quoted_exactly_before_interpretation`, `figure_quoted_without_location_present`) instead of exact check names — 4 validator rejections. Corrected before execution to the 4 exact check names the planted values fail: `every_document_output_reopened_and_checked`, `every_finding_has_location_recorded`, `every_finding_quoted_exactly_before_interpretation`, `no_figure_quoted_without_location`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`documents_count` `1`, `findings_count` `1`, `documents_without_output_verification` `[]`, `findings_without_location` `[]`, `findings_not_quoted_exactly_first` `[]`, `output_verification_coverage` `"1.0000"`, `location_coverage` `"1.0000"`, `exact_quote_coverage` `"1.0000"`, `computed_status` `within_stated_limits_on_declared_evidence`).
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`documents_count` `1`, `findings_count` `1`, `documents_without_output_verification` `["bad_doc"]`, `findings_without_location` `["bad_finding"]`, `findings_not_quoted_exactly_first` `["bad_finding"]`, `output_verification_coverage` `"0.0000"`, `location_coverage` `"0.0000"`, `exact_quote_coverage` `"0.0000"`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was sparse (only `operation`, `documents`, `findings` and one `extraction` field) instead of a full manifest. Corrected before execution: rebuilt it as a full manifest from the full-pass input, changing only the planted values (document row, finding row and `extraction.figure_quoted_without_location_present`).

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types and nesting — no correction needed), and the malformed case was verified to carry exactly one type violation of a documented typed field (`documents` as a string where a list is required — no correction needed, no R4 rejection).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the declared-row counts, the three row-name lists, the three coverage ratios under SERVICE.md's fixed 4-decimal serialization rule — round half up, `floor(v * 10000 + 0.5) / 10000`, formatted to exactly four decimals — and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts across all 32 checks. Raw output: `verification/work/document-operations-service/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `documents_count` / `findings_count` (declared list lengths) | 1 / 1 | 1 / 1 | ✓ |
| full-pass without-lists (no unverified / unlocated / unquoted rows) | [] / [] / [] | [] / [] / [] | ✓ |
| full-pass coverages (1 ÷ 1, 4dp serialization) | "1.0000" / "1.0000" / "1.0000" | "1.0000" / "1.0000" / "1.0000" | ✓ |
| full-pass `computed_status` (all five primary computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `documents_count` / `findings_count` | 1 / 1 | 1 / 1 | ✓ |
| violations without-lists | ["bad_doc"] / ["bad_finding"] / ["bad_finding"] | ["bad_doc"] / ["bad_finding"] / ["bad_finding"] | ✓ |
| violations coverages (0 ÷ 1, 4dp serialization) | "0.0000" / "0.0000" / "0.0000" | "0.0000" / "0.0000" / "0.0000" | ✓ |
| violations `computed_status` (a primary computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | DOCUMENT_OPERATIONS_SOUND / DOCUMENT_OPERATIONS_NOT_SOUND (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case. The coordinating tester's own headline recompute also matches: 1 of 1 documents verified and 1 of 1 findings located and quoted exactly gives `"1.0000"` on full-pass; 0 of 1 on each gives `"0.0000"` on violations, identical to the artifacts. Where Gemini's judgment was checked against the raw evidence, no contradiction was found — the evidence and the judgment agree.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `documents`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
