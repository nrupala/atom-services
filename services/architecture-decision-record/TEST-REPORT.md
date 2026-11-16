# Test report — architecture-decision-record

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7f9cae9fdd60417eb72062905a066554
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/architecture-decision-record/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — 2 alternatives (one serious, all trade-offs stated), `adr.page_count` 1 | HTTP 200, verdict `ADR_COMPLETE`, `alternatives_count` 2, `page_count_over_limit` `0.0000`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `ADR_COMPLETE`, 32 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — hidden coupling + backdoor paths true, 1 alternative (not serious, no trade-offs), `page_count` 5, irreversible decisions deferred true | HTTP 200, verdict `ADR_NOT_COMPLETE`, the 7 named checks fail | HTTP 200, `ADR_NOT_COMPLETE`, 25 pass / 7 fail / 0 missing; failing checks exactly `no_hidden_coupling_across_boundaries`, `no_backdoor_paths_around_contracts`, `alternatives_count_in_stated_range`, `all_alternatives_tradeoffs_stated`, `at_least_one_serious_alternative`, `adr_within_one_page_max`, `irreversible_decisions_not_deferred`; `alternatives_count` 1, `page_count_over_limit` `4.0000` | PASS |
| 3 | sparse — only `decision` present | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 32 missing, computed fields null | PASS |
| 4 | malformed — `nfrs: "not-an-object"` (string where an object is required), `adr.page_count: "one-page"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"nfrs","detail":"nfrs must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `architecture_decision_record`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 32 checks and a text stamp):

```json
{"service": "architecture-decision-record", "atom_version": "0.1.0", "decision": "Use PostgreSQL for primary storage", "verdict": "ADR_COMPLETE", "sections": {"nfrs_first": "pass", "boundaries_and_contracts": "pass", "options_and_tradeoffs": "pass", "adr_format": "pass", "reversibility_and_security": "pass", "lifecycle_and_dependencies": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "alternatives_count": 2, "page_count_over_limit": "0.0000", "summary": "32 pass, 0 fail, 0 missing of 32 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"nfrs","detail":"nfrs must be an object"}
```

## Findings

No findings.

## Tester errors

One tester error in this atom's run, corrected at design time before execution and not scored against the atom: Gemini's designed full-pass (and violations) manifests omitted `supersession.superseded_silently_rewritten`. That field is read by an unconditional must-be-false check, so its absence is missing evidence — the full-pass case as designed would have returned `INSUFFICIENT_EVIDENCE`, not the documented `ADR_COMPLETE`. The field was added as `false` to both manifests before the harness ran. The violations case's expected failing checks, designed as section names, were likewise normalised to the exact check names above; its values and expected verdict were unchanged.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input`; determinism byte-identical true; MCP/REST parity true). The computed alternatives-count, trade-offs, serious-alternative and one-page checks behave exactly as SERVICE.md states, including `page_count_over_limit` `4.0000` at page count 5.
