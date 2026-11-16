# Test report — claim-verification-fact-check-stamp

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw.
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/claim-verification-fact-check-stamp/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid claim-verification manifest | HTTP 200, verdict `STAMPED`, 16/16 checks pass | HTTP 200, `STAMPED`, "16 pass, 0 fail, 0 missing of 16 checks across six sections", computed claims_summary claims_total=1 / material_claims=1 / verified_claims=1 (recomputed by Gemini: match) | PASS |
| 2 | violations — silent edits made, material claim not archived, not triangulated, numeric claim not rechecked | HTTP 200, verdict `NOT_STAMPED`, the checks covering those values fail | HTTP 200, `NOT_STAMPED`, exactly 4 checks fail (`material_claim_sources_archived`, `material_claims_triangulated`, `numbers_rederived_for_numeric_claims`, `no_silent_corrections`), 12 pass | PASS |
| 3 | sparse — only `document` + one process field | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 15 missing | PASS |
| 4 | malformed — `process: "should_be_an_object"`, `claims: "should_be_a_list"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 16 missing) — type-violating values were treated as missing evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `claim_verification_fact_check_stamp`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"claim-verification-fact-check-stamp","atom_version":"0.1.0","document":"Climate change impact report","verdict":"STAMPED","sections":{"extraction":"pass","source_ladder":"pass","triangulation":"pass","compute_rechecks":"pass","uncertainty_language":"pass","publication_and_corrections":"pass"},"checks":[{"section":"extraction","check":"claims_extracted_one_row_per_claim","status":"pass","evidence":"isolate every checkable unit — one row per claim"},{"section":"extraction","check":"claims_declared","status":"pass","evidence":"claims declared for verification"},{"section":"source_ladder","check":"source_metadata_recorded_for_every_claim","status":"pass","evidence":"for each source: who, when, method, sample, conflicts of interest recorded"},{"section":"source_ladder","check":"source_independence_checked","status":"pass","evidence":"independence checked — two sources citing each other are one source"},{"section":"source_ladder","check":"material_claim_sources_archived","status":"pass","evidence":"quality gate: every material claim has at least one archived source"},{"section":"triangulation","check":"material_claims_triangulated","status":"pass","evidence":"material claims need >= 2 independent sources, or one primary source plus confirmation"},{"section":"compute_rechecks","check":"numbers_rederived_for_numeric_claims","status":"pass","evidence":"re-derive math for claims carrying numbers"},{"section":"compute_rechecks","check":"units_dates_and_names_checked","status":"pass","evidence":"sanity-check units and orders of magnitude; verify dates and name spellings"},{"section":"uncertainty_language","check":"labels_in_vocabulary","status":"pass","evidence":"labels: verified / likely / contested / unverified"},{"section":"uncertainty_language","check":"language_is_weakest_the_evidence_supports","status":"pass","evidence":"never upgrade 'consistent with' to 'proves'"},{"section":"uncertainty_language","check":"counter_case_considered","status":"pass","evidence":"quality gate: counter-case considered; 'what would change our mind' noted for contested claims"},{"section":"publication_and_corrections","check":"evidence_published_inline","status":"pass","evidence":"publish with evidence: inline citations, archived links"},{"section":"publication_and_corrections","check":"methodology_visible_for_big_claims","status":"pass","evidence":"visible methodology for big claims"},{"section":"publication_and_corrections","check":"corrections_policy_published","status":"pass","evidence":"quality gate: corrections policy published"},{"section":"publication_and_corrections","check":"versions_retained","status":"pass","evidence":"quality gate: versions retained"},{"section":"publication_and_corrections","check":"no_silent_corrections","status":"pass","evidence":"skill red line: corrections are never silent — fast, dated, visible change log"}],"claims_summary":{"claims_total":1,"material_claims":1,"verified_claims":1},"summary":"16 pass, 0 fail, 0 missing of 16 checks across six sections.","stamp":"CLAIM-VERIFICATION FACT-CHECK STAMP\ndocument: Climate change impact report\nVERDICT: STAMPED\n  extraction                 pass\n  source_ladder              pass\n  triangulation              pass\n  compute_rechecks           pass\n  uncertainty_language       pass\n  publication_and_corrections pass\n16 pass, 0 fail, 0 missing of 16 checks across six sections."}
```

Malformed response (REST, HTTP 200 — the finding):

```json
{"service":"claim-verification-fact-check-stamp","atom_version":"0.1.0","document":"Malformed input","verdict":"INSUFFICIENT_EVIDENCE","sections":{"extraction":"insufficient_evidence","source_ladder":"insufficient_evidence","triangulation":"insufficient_evidence","compute_rechecks":"insufficient_evidence","uncertainty_language":"insufficient_evidence","publication_and_corrections":"insufficient_evidence"},"checks":[{"section":"extraction","check":"claims_extracted_one_row_per_claim","status":"missing","evidence":"isolate every checkable unit — one row per claim"},{"section":"extraction","check":"claims_declared","status":"missing","evidence":"no claims declared"},{"section":"source_ladder","check":"source_metadata_recorded_for_every_claim","status":"missing","evidence":"source metadata not recorded for every claim"},{"section":"source_ladder","check":"source_independence_checked","status":"missing","evidence":"source independence not checked for every claim"},{"section":"source_ladder","check":"material_claim_sources_archived","status":"missing","evidence":"archived-source evidence missing for a material claim"},{"section":"triangulation","check":"material_claims_triangulated","status":"missing","evidence":"triangulation evidence missing for a material claim"},{"section":"compute_rechecks","check":"numbers_rederived_for_numeric_claims","status":"missing","evidence":"math re-check evidence missing for a numeric claim"},{"section":"compute_rechecks","check":"units_dates_and_names_checked","status":"missing","evidence":"sanity-check units and orders of magnitude; verify dates and name spellings"},{"section":"uncertainty_language","check":"labels_in_vocabulary","status":"missing","evidence":"a claim carries no label"},{"section":"uncertainty_language","check":"language_is_weakest_the_evidence_supports","status":"missing","evidence":"language-strength evidence missing for a claim"},{"section":"uncertainty_language","check":"counter_case_considered","status":"missing","evidence":"quality gate: counter-case considered; 'what would change our mind' noted for contested claims"},{"section":"publication_and_corrections","check":"evidence_published_inline","status":"missing","evidence":"publish with evidence: inline citations, archived links"},{"section":"publication_and_corrections","check":"methodology_visible_for_big_claims","status":"missing","evidence":"visible methodology for big claims"},{"section":"publication_and_corrections","check":"corrections_policy_published","status":"missing","evidence":"quality gate: corrections policy published"},{"section":"publication_and_corrections","check":"versions_retained","status":"missing","evidence":"quality gate: versions retained"},{"section":"publication_and_corrections","check":"no_silent_corrections","status":"missing","evidence":"skill red line: corrections are never silent — fast, dated, visible change log"}],"claims_summary":{"claims_total":0,"material_claims":0,"verified_claims":0},"summary":"0 pass, 0 fail, 16 missing of 16 checks across six sections.","stamp":"CLAIM-VERIFICATION FACT-CHECK STAMP\ndocument: Malformed input\nVERDICT: INSUFFICIENT_EVIDENCE\n  extraction                 insufficient_evidence\n  source_ladder              insufficient_evidence\n  triangulation              insufficient_evidence\n  compute_rechecks           insufficient_evidence\n  uncertainty_language       insufficient_evidence\n  publication_and_corrections insufficient_evidence\n0 pass, 0 fail, 16 missing of 16 checks across six sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4 (malformed): `process` as a string where an object is required, and `claims` as a string where a list is required. Expected (test doctrine for this
program + the gateway's `invalid_input` mechanism in `callpath.ts`):
HTTP 422 `{ok:false, error:"invalid_input", field:...}`. Actual:
HTTP 200 with a verdict computed over the garbage values. The atom's
handler does not validate manifest field types before evaluation.
Disposition: **fix spec filed** — `verification/fix-specs/claim-verification-fact-check-stamp.md`.
Retest on redeploy.

No tester errors in this atom's run.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases, the computed claims_summary counts recompute correctly, determinism and MCP/REST parity hold; the single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: atoms-gateway v1.1.0 at https://atoms.pipavia.com — deployment 7f9cae9fdd60417eb72062905a066554. Evidence: `verification/work/claim-verification-fact-check-stamp/evidence.json` (Wave 1 preserved as `evidence-wave1.json` / `judgment-wave1.json`); judgment: `verification/work/claim-verification-fact-check-stamp/judgment.json` (Gemini verdict: FAIL).

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `STAMPED` | HTTP 422, `invalid_input` on `claims[0].primary_source` (no verdict) | FAIL |
| 2 | violations | HTTP 200, verdict `NOT_STAMPED` | HTTP 422, `invalid_input` on `claims[0].primary_source` (no verdict) | FAIL |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | PASS |
| 4 | malformed | HTTP 422, `{ok:false,error:"invalid_input"}` | HTTP 422, `{"ok": false, "error": "invalid_input", "field": "process", "detail": "process must be an object"}` | PASS |
| 5 | determinism | byte-identical repeat response (`determinism_byte_identical == true`) | `determinism_byte_identical == true` (byte-identical 422 error responses) | PASS |
| 6 | parity | MCP `structuredContent` deep-equal to REST artifact (`parity_structured_equal == true`) | `parity_structured_equal == false` — MCP returned JSON-RPC error -32602 (`claims[0].primary_source must be a boolean`), no structuredContent | FAIL |

F1 disposition: **F1 closed — malformed now returns 422 invalid_input (field: process)** for the recorded malformed case. Raw malformed body: `{"ok": false, "error": "invalid_input", "field": "process", "detail": "process must be an object"}`. However, the same validation now also rejects the recorded full-pass and violations cases: both return HTTP 422 `{ "ok": false, "error": "invalid_input", "field": "claims[0].primary_source", "detail": "claims[0].primary_source must be a boolean" }` instead of the expected HTTP 200 verdicts (`STAMPED` / `NOT_STAMPED`), and full-pass parity fails (`parity_structured_equal == false`). Mechanical evidence governs over judgment where they conflict, and a PASS requires all other recorded cases to pass, so this atom fails the retest on those recorded cases, not on the recorded malformed case.

Tester errors this wave: Gemini flagged 2 tester-error entries (full-pass, violations — the recorded inputs use a string `primary_source` (`"nasa.gov"` / `"blog.com"`) while the validator expects a boolean), alongside 2 findings for the same cases; Gemini's judgment verdict was FAIL. Disposition: the tester-error entries are named here, but they were not used to override the recorded battery — the cases were re-run exactly as recorded (no redesign), SERVICE.md's claims-row does not explicitly per-field type `primary_source`, and the mechanical checks in this retest (status/verdict vs cases.json expect, parity) fail. A future wave with a redesigned, contract-typed case set could re-disposition this point.

**Retest verdict: FAIL** — full-pass and violations return HTTP 422 on `claims[0].primary_source` instead of expected HTTP 200 verdicts, and full-pass parity is false

## Wave 3 retest — 2026-11-15 (fix-round-2 + Batch 8 deploy babe764a73734f93a8016267e77af193)

Gateway: atoms-gateway v1.1.0 at https://atoms.pipavia.com — deployment babe764a73734f93a8016267e77af193. Evidence: `verification/work/claim-verification-fact-check-stamp/evidence.json` (Wave 1 preserved as `evidence-wave1.json` / `judgment-wave1.json`; retest preserved as `evidence-retest.json` / `judgment-retest.json` / `cases-wave1.json`); judgment: `verification/work/claim-verification-fact-check-stamp/judgment.json` (Gemini verdict: PASS).

Battery redesign: cases were regenerated with `verification/gemini_design.py` from the current `contract.yaml` + `SERVICE.md`, in which `primary_source (boolean)` is now declared explicitly. Tester-design correction: none needed in this wave — Gemini's redesigned cases already carried `primary_source` as a boolean in both verdict cases (full-pass: `true`; violations: `false`, which with `independent_sources: 0` keeps triangulation failing exactly as intended). A 5th case, `primary-source-string`, was added by hand: a deep copy of the new full-pass input with `claims[0].primary_source` set to `"nasa.gov"`, expecting HTTP 422 naming that field.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `STAMPED`, all checks pass | HTTP 200, `STAMPED`, "16 pass, 0 fail, 0 missing of 16 checks across six sections", claims_summary claims_total=1 / material_claims=1 / verified_claims=1 | PASS |
| 2 | violations | HTTP 200, verdict `NOT_STAMPED`, expected failing checks fail | HTTP 200, `NOT_STAMPED`, exactly 4 checks fail (`material_claim_sources_archived`, `material_claims_triangulated`, `numbers_rederived_for_numeric_claims`, `no_silent_corrections` — covering source_ladder, triangulation, compute_rechecks, publication_and_corrections), 12 pass | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | PASS |
| 4 | malformed | HTTP 422, `{ok:false,error:"invalid_input"}` | HTTP 422, `{"ok": false, "error": "invalid_input", "field": "process", "detail": "process must be an object"}` | PASS |
| 5 | primary-source-string | HTTP 422, body field == `claims[0].primary_source` | HTTP 422, `{"ok": false, "error": "invalid_input", "field": "claims[0].primary_source", "detail": "claims[0].primary_source must be a boolean"}` | PASS |
| 6 | determinism | byte-identical repeat response (`determinism_byte_identical == true`) | `determinism_byte_identical == true` | PASS |
| 7 | parity | MCP `structuredContent` deep-equal to REST artifact (`parity_structured_equal == true`) | `parity_structured_equal == true` | PASS |

Tester errors this wave: 0 — Gemini's judgment recorded no tester-error entries (verdict: PASS, findings: 0, tester_errors: 0; computed checks claims_total / material_claims / verified_claims all match).

The Wave 1 FAIL on this atom's verdict cases was a tester-design error under the now-explicit contract: the Wave 1 cases carried URL strings (`"nasa.gov"` / `"blog.com"`) for `primary_source`, a field SERVICE.md's blanket boolean default always made boolean and which SERVICE.md now declares explicitly as `primary_source (boolean)`. The battery was redesigned to that explicit contract, not the atom relaxed — validation was not loosened, and the new 5th case proves a string `primary_source` is still rejected with HTTP 422 naming `claims[0].primary_source`. F4 disposition: **closed under ruling (a)** — all pass marks hold on the corrected battery.

**Wave 3 verdict: PASS** — full-pass STAMPED with all 16 checks passing, violations NOT_STAMPED with exactly the expected failing checks, sparse INSUFFICIENT_EVIDENCE, both malformed cases rejected 422 invalid_input with the correct fields named, and determinism and MCP/REST parity both true.
