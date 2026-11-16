# Test report — license-compliance-check

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
**Evidence:** `verification/work/license-compliance-check/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid evidence manifest | HTTP 200, verdict `COMPLIANT` | HTTP 200, `COMPLIANT`, "19 pass, 0 fail, 0 missing of 19 checks across four sections." stamp present and well-formed | PASS |
| 2 | violations — deliberate contract violations | HTTP 200, verdict `NON_COMPLIANT` | HTTP 200, `NON_COMPLIANT`, failing checks: `scan_clean_or_accepted_with_record`, `no_copyleft_in_proprietary_binary`, `no_incompatible_dependency_shipped`, `attribution_shipped_where_required`, `bundled_licenses_shipped_where_required`, `copyleft_choice_logged_as_decision` (13 pass, 6 fail, 0 missing) | PASS |
| 3 | sparse — minimal manifest | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 19 missing | PASS |
| 4 | malformed — `distribution_model` as a number instead of a string, `components` as a string instead of an array | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `NON_COMPLIANT` (3 pass, 1 fail, 15 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `license_compliance_check`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"license-compliance-check","atom_version":"0.1.0","product":"TestApp","distribution_model":"proprietary_binary","verdict":"COMPLIANT","sections":{"license_files":"pass","dependency_compatibility":"pass","contributor_terms":"pass","claims_and_contracts":"pass"},"checks":[{"section":"license_files","check":"root_license_present","status":"pass","evidence":"quality gate: root LICENSE present"},{"section":"license_files","check":"notice_file_present","status":"pass","evidence":"quality gate: root LICENSE + NOTICE present"},{"section":"license_files","check":"license_texts_unmodified","status":"pass","evidence":"skill red line: license texts kept verbatim, never edited"},{"section":"license_files","check":"source_headers_present","status":"pass","evidence":"source headers per house convention"},{"section":"dependency_compatibility","check":"components_inventory_declared","status":"pass","evidence":"components=[{'name': 'lib-a', 'license': 'MIT', 'requires_attribution': False, 'requires_bundled_license': False}]"},{"section":"dependency_compatibility","check":"dependency_scan_completed","status":"pass","evidence":"automated license scan of dependencies"},{"section":"dependency_compatibility","check":"scan_clean_or_accepted_with_record","status":"pass","evidence":"quality gate: scan clean or consciously accepted with a record"},{"section":"dependency_compatibility","check":"no_copyleft_in_proprietary_binary","status":"pass","evidence":"copyleft_components=[] distribution_model='proprietary_binary' (skill: incompatible combinations resolved before release)"},{"section":"dependency_compatibility","check":"no_incompatible_dependency_shipped","status":"pass","evidence":"skill red line: no incompatible dependency shipped 'for now'"},{"section":"dependency_compatibility","check":"attribution_shipped_where_required","status":"pass","evidence":"no component declares an attribution requirement"},{"section":"dependency_compatibility","check":"bundled_licenses_shipped_where_required","status":"pass","evidence":"no bundled-licence requirement triggered"},{"section":"contributor_terms","check":"contributor_policy_chosen","status":"pass","evidence":"policy='DCO' (skill: pick a policy — DCO sign-off or CLA)"},{"section":"contributor_terms","check":"contributor_policy_documented","status":"pass","evidence":"contributor policy documented in CONTRIBUTING"},{"section":"contributor_terms","check":"contributor_policy_enforced","status":"pass","evidence":"contributor policy enforced in the contribution flow"},{"section":"claims_and_contracts","check":"copyleft_choice_logged_as_decision","status":"pass","evidence":"project licence is not copyleft; no decision log required by this check"},{"section":"claims_and_contracts","check":"trademark_usage_rules_documented","status":"pass","evidence":"name/logo usage rules documented"},{"section":"claims_and_contracts","check":"no_implied_endorsement","status":"pass","evidence":"no implied endorsement"},{"section":"claims_and_contracts","check":"public_claims_have_attestation","status":"pass","evidence":"no public claims declared"},{"section":"claims_and_contracts","check":"client_contract_constraints_reviewed","status":"pass","evidence":"not declared as client work"}],"summary":"19 pass, 0 fail, 0 missing of 19 checks across four sections.","stamp":"LICENSE-COMPLIANCE CHECK\nproduct: TestApp  distribution_model: proprietary_binary\nVERDICT: COMPLIANT\n  license_files              pass\n  dependency_compatibility   pass\n  contributor_terms          pass\n  claims_and_contracts       pass\n19 pass, 0 fail, 0 missing of 19 checks across four sections.\nNot legal advice — counsel decides contested calls (skill red line)."}
```

Malformed response (REST, HTTP 200 — the finding; key fields, full
response in the evidence file):

```json
{
 "service": "license-compliance-check",
 "atom_version": "0.1.0",
 "product": "BadTypeApp",
 "distribution_model": 123,
 "verdict": "NON_COMPLIANT",
 "sections": {
  "license_files": "insufficient_evidence",
  "dependency_compatibility": "fail",
  "contributor_terms": "insufficient_evidence",
  "claims_and_contracts": "insufficient_evidence"
 },
 "summary": "3 pass, 1 fail, 15 missing of 19 checks across four sections."
}
```

Malformed input submitted:

```json
{"product": "BadTypeApp", "distribution_model": 123, "components": "not-an-array"}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `distribution_model` as a number instead of a string, `components` as a string instead of an array. Expected (test doctrine for
this program + the gateway's `invalid_input` mechanism in
`callpath.ts`): HTTP 422 `{ok:false, error:"invalid_input", field:...}`.
Actual: HTTP 200 with a `NON_COMPLIANT` verdict computed over the
garbage values (3 pass, 1 fail, 15 missing of 19 checks across four sections.; failing checks: `components_inventory_declared`). The atom's
handler does not validate manifest field types before evaluation.
Contract clause: SERVICE.md: Input manifest. Disposition: **fix spec filed** —
`verification/fix-specs/license-compliance-check.md`, entry `license-compliance-check F1`.
Retest on redeploy.

No tester errors in this atom's run.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases,
determinism and MCP/REST parity hold, the stamp is well-formed; the
single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: atoms-gateway v1.1.0 at https://atoms.pipavia.com — deployment 7f9cae9fdd60417eb72062905a066554. Evidence: `verification/work/license-compliance-check/evidence.json` (Wave 1 preserved as `evidence-wave1.json` / `judgment-wave1.json`); judgment: `verification/work/license-compliance-check/judgment.json` (Gemini verdict: PASS).

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `COMPLIANT` | HTTP 200, verdict `COMPLIANT` | PASS |
| 2 | violations | HTTP 200, verdict `NON_COMPLIANT` | HTTP 200, verdict `NON_COMPLIANT` | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | PASS |
| 4 | malformed | HTTP 422, `{ok:false,error:"invalid_input"}` | HTTP 422, `{"ok": false, "error": "invalid_input", "field": "distribution_model", "detail": "distribution_model must be a string"}` | PASS |
| 5 | determinism | byte-identical repeat response (`determinism_byte_identical == true`) | `determinism_byte_identical == true` | PASS |
| 6 | parity | MCP `structuredContent` deep-equal to REST artifact (`parity_structured_equal == true`) | `parity_structured_equal == true` | PASS |

F1 disposition: **F1 closed — malformed now returns 422 invalid_input (field: distribution_model)**. Raw malformed body: `{"ok": false, "error": "invalid_input", "field": "distribution_model", "detail": "distribution_model must be a string"}`. Wave 1 returned HTTP 200 with a verdict computed over the type-violating input; the retest evidence shows the recorded malformed case is now rejected before evaluation, and all other recorded cases (full-pass, violations, sparse, determinism, parity) pass both the Gemini judgment (verdict: PASS, findings: 0) and the mechanical checks (malformed status 422 with error == "invalid_input"; full-pass determinism_byte_identical == true and parity_structured_equal == true; full-pass/violations/sparse HTTP status and verdict match cases.json expect).

Tester errors this wave: none.

**Retest verdict: PASS**
