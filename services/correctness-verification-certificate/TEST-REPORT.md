# Test report — correctness-verification-certificate

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
**Evidence:** `verification/work/correctness-verification-certificate/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid correctness-verification evidence manifest (corrected case, see tester-error note) | HTTP 200, verdict `CERTIFIED`, 26/26 checks pass | HTTP 200, `CERTIFIED`, "26 pass, 0 fail, 0 missing of 26 checks across seven sections", stamp present and well-formed | PASS |
| 2 | violations — `ladder.claim_exceeds_evidence_level=true`, `ladder.tests_presented_as_proof=true`, `artifacts.counterexample_suppressed=true` | HTTP 200, verdict `NOT_CERTIFIED`, the 3 negative-constraint checks fail | HTTP 200, `NOT_CERTIFIED`, exactly those 3 checks fail (23 pass, 3 fail, 0 missing) | PASS |
| 3 | sparse — only `component` + `register.exists` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 25 missing | PASS |
| 4 | malformed — `component: 12345`, `register: "not-an-object"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 26 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `correctness_verification_certificate`) | PASS |

**Tester error (corrected, not an atom failure):** Gemini's first design
placed the two certificate fields under `review.*`
(`review.signed_attestation_binds_claim_artifact_commit`,
`review.independently_reproducible`); SERVICE.md documents them under
`certificate.*`. On the first run the full-pass case therefore returned
`INSUFFICIENT_EVIDENCE` (24 pass, 2 missing) and Gemini's first judgment
recorded that as an atom finding. Verification against SERVICE.md showed
the case contradicted the contract: the fields were moved to a
`certificate` object, the harness and judge were re-run, and the atom
returned `CERTIFIED` 26/26. The original finding is dispositioned as a
tester error and is not counted against the atom.

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"correctness-verification-certificate","atom_version":"0.1.0","component":"auth-service-v1","verdict":"CERTIFIED","sections":{"claims_register":"pass","evidence_ladder":"pass","specs_before_tools":"pass","evidence_artifacts":"pass","scope_honesty":"pass","ci_integration":"pass","adversarial_and_certification":"pass"},"checks":[{"section":"claims_register","check":"register_exists","status":"pass","evidence":"claims register first: one row per claim \u2014 no register, no claim"},{"section":"claims_register","check":"property_named_for_each_claim","status":"pass","evidence":"each claim names the property \u2014 what exactly is claimed correct"},{"section":"claims_register","check":"scope_named_for_each_claim","status":"pass","evidence":"each claim names its scope \u2014 which version / configuration the claim covers"},{"section":"claims_register","check":"evidence_level_assigned_for_each_claim","status":"pass","evidence":"each claim carries its evidence level from the ladder"},{"section":"claims_register","check":"expiry_set_for_each_claim","status":"pass","evidence":"each claim carries an expiry \u2014 stale certificates are void"},{"section":"evidence_ladder","check":"cheapest_sufficient_level_selected","status":"pass","evidence":"the evidence ladder \u2014 L1 static analysis, L2 property-based testing and fuzzing, L3 model checking, L4 deductive verification, L5 proof assistants \u2014 cheapest that suffices is selected"},{"section":"evidence_ladder","check":"no_claim_exceeds_its_evidence_level","status":"pass","evidence":"no claim exceeds its evidence level (tests are not proof)"},{"section":"evidence_ladder","check":"tests_not_presented_as_proof","status":"pass","evidence":"tests are not presented as proof \u2014 never say proven, bug-free, or certified without property, scope, and evidence"},{"section":"specs_before_tools","check":"invariants_written","status":"pass","evidence":"invariants are written in the checker's language"},{"section":"specs_before_tools","check":"pre_post_conditions_written","status":"pass","evidence":"pre- and post-conditions are written in the checker's language"},{"section":"specs_before_tools","check":"liveness_properties_written","status":"pass","evidence":"liveness properties are written in the checker's language"},{"section":"specs_before_tools","check":"specs_written_before_tools_run","status":"pass","evidence":"specs come before tools: written before running anything"},{"section":"evidence_artifacts","check":"machine_checkable_artifact_for_each_claim","status":"pass","evidence":"each claim has a machine-checkable artifact behind it"},{"section":"evidence_artifacts","check":"proof_scripts_or_solver_logs_retained","status":"pass","evidence":"evidence artifacts are retained: counterexamples, proof scripts, solver logs, CI records"},{"section":"evidence_artifacts","check":"counterexample_not_suppressed","status":"pass","evidence":"never suppress a counterexample"},{"section":"evidence_artifacts","check":"reproduction_recipe_present","status":"pass","evidence":"no certificate without a reproduction recipe"},{"section":"scope_honesty","check":"exclusions_written","status":"pass","evidence":"what is outside scope is listed \u2014 dependencies, hardware, misconfiguration, side channels"},{"section":"scope_honesty","check":"claims_versioned","status":"pass","evidence":"every claim is versioned"},{"section":"scope_honesty","check":"reverification_triggers_defined","status":"pass","evidence":"re-verification triggers are defined \u2014 re-verify on change"},{"section":"scope_honesty","check":"verified_at_current_version","status":"pass","evidence":"never certify an artifact that has not been verified at its current version"},{"section":"ci_integration","check":"verification_runs_in_pipeline","status":"pass","evidence":"verification runs in the pipeline"},{"section":"ci_integration","check":"broken_proof_fails_build","status":"pass","evidence":"a broken proof fails the build like a broken test"},{"section":"adversarial_and_certification","check":"independent_adversarial_review_done","status":"pass","evidence":"an independent adversarial pass tries to falsify the claim \u2014 only unfalsified claims are certified"},{"section":"adversarial_and_certification","check":"counterexample_disclosed_when_found","status":"pass","evidence":"no counterexample found in adversarial review"},{"section":"adversarial_and_certification","check":"signed_attestation_binds_claim_artifact_and_commit","status":"pass","evidence":"a signed attestation binds claim to artifact to source commit (hash and signature)"},{"section":"adversarial_and_certification","check":"certificate_independently_reproducible","status":"pass","evidence":"certificates are signed, versioned, and independently reproducible"}],"summary":"26 pass, 0 fail, 0 missing of 26 checks across seven sections.","stamp":"CORRECTNESS VERIFICATION CERTIFICATE\ncomponent: auth-service-v1\nVERDICT: CERTIFIED\n  claims_register                  pass\n  evidence_ladder                  pass\n  specs_before_tools               pass\n  evidence_artifacts               pass\n  scope_honesty                    pass\n  ci_integration                   pass\n  adversarial_and_certification    pass\n26 pass, 0 fail, 0 missing of 26 checks across seven sections."}
```

Malformed response (REST, HTTP 200 — the finding; `checks` array trimmed):

```json
{"service":"correctness-verification-certificate","atom_version":"0.1.0","component":12345,"verdict":"INSUFFICIENT_EVIDENCE","sections":{"claims_register":"insufficient_evidence","evidence_ladder":"insufficient_evidence","specs_before_tools":"insufficient_evidence","evidence_artifacts":"insufficient_evidence","scope_honesty":"insufficient_evidence","ci_integration":"insufficient_evidence","adversarial_and_certification":"insufficient_evidence"},"summary":"0 pass, 0 fail, 26 missing of 26 checks across seven sections.","stamp":"CORRECTNESS VERIFICATION CERTIFICATE\ncomponent: 12345\nVERDICT: INSUFFICIENT_EVIDENCE\n  claims_register                  insufficient_evidence\n  evidence_ladder                  insufficient_evidence\n  specs_before_tools               insufficient_evidence\n  evidence_artifacts               insufficient_evidence\n  scope_honesty                    insufficient_evidence\n  ci_integration                   insufficient_evidence\n  adversarial_and_certification    insufficient_evidence\n0 pass, 0 fail, 26 missing of 26 checks across seven sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `component` as a number, `register` as a string. Expected (test doctrine for this program +
the gateway's `invalid_input` mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with a
`INSUFFICIENT_EVIDENCE` verdict computed over the garbage values (`component` echoed back as `12345`).
The atom's handler does not validate manifest field
types before evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/correctness-verification-certificate.md`. Retest on redeploy.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases (after the tester-error correction above), determinism and MCP/REST parity hold, the stamp is well-formed; the single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

**Gateway/deployment:** atoms-gateway v1.1.0 at https://atoms.pipavia.com (health HTTP 200), deployment `7f9cae9fdd60417eb72062905a066554`, retested 2026-11-15. Evidence: `verification/work/correctness-verification-certificate/evidence.json` (Wave 1 preserved as `evidence-wave1.json` / `judgment-wave1.json`); judgment: `verification/work/correctness-verification-certificate/judgment.json` (Gemini verdict: PASS, 0 findings, 0 tester errors).

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `CERTIFIED` | HTTP 200, verdict `CERTIFIED`, "26 pass, 0 fail, 0 missing of 26 checks across seven sections." | PASS |
| 2 | violations | HTTP 200, verdict `NOT_CERTIFIED` | HTTP 200, verdict `NOT_CERTIFIED`, "23 pass, 3 fail, 0 missing of 26 checks across seven sections." | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE`, "1 pass, 0 fail, 25 missing of 26 checks across seven sections." | PASS |
| 4 | malformed | HTTP 422, `{ok:false, error:"invalid_input"}`, no verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"component","detail":"component must be a string"}` | PASS |
| 5 | determinism | byte-identical responses on repeat REST submission of full-pass | byte-identical: **true** | PASS |
| 6 | parity | MCP `tools/call` structuredContent deep-equal to REST artifact for full-pass | structuredContent deep-equal: **true** (tool name `correctness_verification_certificate`) | PASS |

F1 closed — malformed now returns 422 invalid_input (field: component). Raw malformed response: `{"ok":false,"error":"invalid_input","field":"component","detail":"component must be a string"}`. This replaces the Wave 1 behaviour, in which the same type-violating manifest returned HTTP 200 with a verdict computed over the garbage values. Mechanical verification confirms the malformed first execution is HTTP 422 with a JSON body whose `error` is `"invalid_input"`, and that the full-pass, violations and sparse first executions match the HTTP status and verdict recorded in `cases.json` expect, with `determinism_byte_identical == true` and `parity_structured_equal == true` on the full-pass case.

Tester errors this wave: none. Gemini returned PASS with no findings and no tester errors, and no Gemini finding contradicted the atom's contract.yaml / SERVICE.md; mechanical evidence and Gemini's judgment agree on every case.

**Retest verdict: PASS**
