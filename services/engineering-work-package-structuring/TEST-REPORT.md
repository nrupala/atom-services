# Test report — engineering-work-package-structuring

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 5cf70cb60526415d89b4db5e5cd02744
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/engineering-work-package-structuring/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (package `EE-2026-001`): definition complete, deliverable `Main Calc` kind `calc package`, document `Calc-001` status `For Approval`, revision `A`, designer `Alice` ≠ checker `Bob`, sign-off complete, all quality flags true, transmittal naming `Calc-001` at revision `A`, date `2026-11-20`, return status declared | HTTP 200, verdict `WORK_PACKAGE_STRUCTURED`, `deliverables_count` `1`, `documents_count` `1`, `transmittals_count` `1`, coverages `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `WORK_PACKAGE_STRUCTURED`, 42 pass / 0 fail / 0 missing, all four sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest (same key paths as full-pass) with deliverable kind `invalid_kind`; document status `InvalidStatus`, revision `""`, revision reason and history false, sign-off names empty, quality / assumptions / check-signature flags false; transmittal document `NonExistent`, revision `B`, date `2027-02-30`, return status false | HTTP 200, verdict `WORK_PACKAGE_NOT_STRUCTURED`, the 12 named checks fail | HTTP 200, `WORK_PACKAGE_NOT_STRUCTURED`, 30 pass / 12 fail / 0 missing; failing checks exactly `every_deliverable_has_skill_kind`, `every_document_has_flow_status`, `every_document_has_revision`, `every_document_declares_revision_reason`, `every_document_has_revision_history`, `every_document_signoff_complete`, `every_document_declares_quality_elements`, `every_document_declares_assumptions_and_check_signature`, `every_transmittal_names_declared_document`, `every_transmittal_revision_matches_document`, `every_transmittal_has_valid_date`, `every_transmittal_declares_return_status`; `deliverables_with_invalid_kind` `["Main Calc"]`, `documents_with_invalid_status` / `documents_without_revision` / `documents_without_revision_reason` / `documents_without_revision_history` / `documents_with_incomplete_signoff` / `documents_missing_quality_elements` / `documents_missing_assumptions_or_signature` all `["Calc-001"]`, `transmittals_with_unknown_document` / `transmittals_with_invalid_date` / `transmittals_without_return_status` all `["NonExistent"]`, `signoff_coverage` `"0.000000"`, `independent_check_coverage` `"1.000000"`, `transmittal_document_coverage` `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; all four sections `fail` | PASS |
| 3 | sparse — only `package` (`Minimal`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 42 missing, all four sections `insufficient_evidence`, all counts, row-name lists, coverages and `computed_status` null | PASS |
| 4 | malformed — `deliverables: "not_a_list"` (string where a list is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"deliverables","detail":"deliverables must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `engineering_work_package_structuring`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 42 checks and a text stamp):

```json
{"service": "engineering-work-package-structuring", "atom_version": "0.1.0", "package": "EE-2026-001", "verdict": "WORK_PACKAGE_STRUCTURED", "sections": {"package_definition": "pass", "document_control_and_revisions": "pass", "check_discipline_and_transmittals": "pass", "delivery_quality_and_handover": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "deliverables_count": 1, "deliverables_with_invalid_kind": [], "documents_count": 1, "documents_with_invalid_status": [], "documents_without_revision": [], "documents_without_revision_reason": [], "documents_without_revision_history": [], "documents_with_incomplete_signoff": [], "signoff_coverage": "1.000000", "calculations_not_independently_checked": [], "independent_check_coverage": "1.000000", "documents_missing_quality_elements": [], "documents_missing_assumptions_or_signature": [], "transmittals_count": 1, "transmittals_with_unknown_document": [], "transmittals_without_recipient": [], "transmittals_with_revision_mismatch": [], "transmittals_with_invalid_date": [], "transmittals_without_return_status": [], "transmittal_document_coverage": "1.000000", "summary": "42 pass, 0 fail, 0 missing of 42 checks across four sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"deliverables","detail":"deliverables must be a list"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 14 rejections in total — by rule: R1 check-register ×11, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations `expect.failing_checks` listed 11 descriptive prose names (`Kind per deliverable`, `Status per document`, `Revision per document`, `Revision reason and history per document`, `Sign-off per document`, `Delivery-quality elements per document`, `Assumptions and check signature per document`, `Transmittal document resolution`, `Transmittal revision match`, `Transmittal date valid`, `Return status per transmittal`) instead of exact check names — 11 validator rejections. Corrected before execution to the 12 exact register names the planted values fail (the single descriptive entry `Revision reason and history per document` maps to two register checks, `every_document_declares_revision_reason` and `every_document_has_revision_history`): `every_deliverable_has_skill_kind`, `every_document_has_flow_status`, `every_document_has_revision`, `every_document_declares_revision_reason`, `every_document_has_revision_history`, `every_document_signoff_complete`, `every_document_declares_quality_elements`, `every_document_declares_assumptions_and_check_signature`, `every_transmittal_names_declared_document`, `every_transmittal_revision_matches_document`, `every_transmittal_has_valid_date`, `every_transmittal_declares_return_status`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`deliverables_count` `1`, `documents_count` `1`, `transmittals_count` `1`, coverages `"1.000000"`, all row-name lists `[]`, `computed_status` `within_stated_limits_on_declared_evidence`).
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`deliverables_count` `1`, `documents_count` `1`, `transmittals_count` `1`, `signoff_coverage` `"0.000000"`, `independent_check_coverage` `"1.000000"`, `transmittal_document_coverage` `"0.000000"`, the row-name lists as recorded in the Cases table, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was sparse instead of a full manifest — it omitted most of the full-pass manifest's key paths (all of `definition`, `document_control`, `check_discipline` and `handover`, the documents' `designer` / `checker` fields, and parts of `transmittal_log`). Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the planted violations (invalid deliverable kind; invalid document status, empty revision, false revision reason / history, empty sign-off names, false quality and assumptions / signature flags; unknown transmittal document, revision `B`, impossible date, false return status) and nothing else changed.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types and nesting, deliverable kind in the skill vocabulary, document status in the flow, transmittal revision matching the named document — no correction needed), the sparse case was verified genuinely sparse (only `package` declared), and the malformed case already carried exactly one type violation of a documented typed field (`deliverables` as a string), so neither needed correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the declared counts, all fourteen row-name lists, the three coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, the derived `computed_status`, the failing-check sets and the verdicts) and verified the artifacts' values. Raw output: `verification/work/engineering-work-package-structuring/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: partial — `transmittals_with_revision_mismatch` in case `violations`: artifact reports `[]` (with check status `fail`); my recompute gives either `["NonExistent"]` (if empty revision counts as a present-but-invalid revision, mismatch "B" ≠ "") or `null` (if empty revision counts as missing evidence per the stated rule) — the artifact's empty list matches neither.**

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `deliverables_count` / `documents_count` / `transmittals_count` | 1 / 1 / 1 | 1 / 1 / 1 | ✓ |
| full-pass row-name lists (all fourteen) | all `[]` | all `[]` | ✓ |
| full-pass `signoff_coverage` / `independent_check_coverage` / `transmittal_document_coverage` (1 ÷ 1) | "1.000000" / "1.000000" / "1.000000" | "1.000000" / "1.000000" / "1.000000" | ✓ |
| full-pass `computed_status` (all six primary computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations counts | 1 / 1 / 1 | 1 / 1 / 1 | ✓ |
| violations `deliverables_with_invalid_kind` | ["Main Calc"] | ["Main Calc"] | ✓ |
| violations document row-name lists (status / revision / reason / history / sign-off / quality / assumptions-signature) | ["Calc-001"] each | ["Calc-001"] each | ✓ |
| violations `calculations_not_independently_checked` (designer `Alice` ≠ checker `Bob`, untouched) | [] | [] | ✓ |
| violations `transmittals_with_unknown_document` / `transmittals_with_invalid_date` / `transmittals_without_return_status` | ["NonExistent"] each | ["NonExistent"] each | ✓ |
| violations `transmittals_without_recipient` | [] | [] | ✓ |
| violations `signoff_coverage` (0 ÷ 1) / `independent_check_coverage` (1 ÷ 1) / `transmittal_document_coverage` (0 ÷ 1) | "0.000000" / "1.000000" / "0.000000" | "0.000000" / "1.000000" / "0.000000" | ✓ |
| violations `transmittals_with_revision_mismatch` | ["NonExistent"] or null (see adjudication) | [] | ✗ — adjudicated below |
| violations failing-check set | exactly the 12 planted checks | same 12 | ✓ |
| violations `computed_status` (a primary computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| verdicts | WORK_PACKAGE_STRUCTURED / WORK_PACKAGE_NOT_STRUCTURED (12 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** partial agreement on DeepSeek's line, adjudicated in the atom's favour on the evidence. The single disputed quantity is the violations-case `transmittals_with_revision_mismatch`. DeepSeek's first reading compares the transmittal's revision `B` against document `Calc-001`'s revision `""` — but the transmittal does not name `Calc-001`; it names `NonExistent`, which is not a declared document and therefore has no declared revision to compare against. The oracle's mismatch list is built only over transmittals whose `document` resolves to a declared document; an unresolvable transmittal is reported in `transmittals_with_unknown_document` (where the artifact does report `["NonExistent"]`), not in the mismatch list, so `[]` is the correct mismatch list for this input. DeepSeek's second reading treats the empty revision string as "lacking" a revision; SERVICE.md distinguishes the two throughout — an absent field is missing evidence, a present-but-empty revision string fails — and the `revision` field here is present, as are the transmittal's `document` and `revision` fields, so the missing-evidence rule for the revision-match check is not triggered on absence grounds. The check itself correctly fails: its pass condition requires both the unknown-document set and the mismatch set to be empty, and the unknown set is not empty. The raw evidence and the oracle therefore govern over DeepSeek's reading; every other recomputed quantity matches exactly.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `deliverables`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity except the single `transmittals_with_revision_mismatch` reading adjudicated above, where the evidence and the oracle govern (AGREEMENT: partial, on that one interpretation point only).
