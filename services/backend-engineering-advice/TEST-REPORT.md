# Test report — backend-engineering-advice

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment babe764a73734f93a8016267e77af193
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/backend-engineering-advice/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete production pack, `mutating_operation_count` 1 with keys, taxonomy covering all five stated categories, migrations reversible | HTTP 200, verdict `PRODUCTION_READY`, `taxonomy_categories_missing` `[]`, `mutating_operation_count` 1, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `PRODUCTION_READY`, 32 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — `clients_trusted` true, taxonomy only `[validation]`, `silent_catch_all_present` true, `secrets_in_logs` and `pii_in_logs` true (other idempotency/data fields undeclared) | HTTP 200, verdict `NOT_PRODUCTION_READY`, the 5 named checks fail | HTTP 200, `NOT_PRODUCTION_READY`, 21 pass / 5 fail / 6 missing; failing checks exactly `clients_not_trusted`, `taxonomy_covers_all_stated_categories`, `no_silent_catch_all`, `no_secrets_in_logs`, `no_pii_in_logs`; `taxonomy_categories_missing` `[not_found, conflict, retryable, fatal]`, `mutating_operation_count` 0, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `system` + `contract.defined_before_code` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 31 missing, computed fields null | PASS |
| 4 | malformed — `contract: "not-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"contract","detail":"contract must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `backend_engineering_advice`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 32 checks and a text stamp):

```json
{"service": "backend-engineering-advice", "atom_version": "0.1.0", "system": "production-service-alpha", "verdict": "PRODUCTION_READY", "sections": {"contract_first": "pass", "boundary_validation": "pass", "idempotency": "pass", "error_taxonomy": "pass", "jobs_and_queues": "pass", "data_safety": "pass", "observability": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "taxonomy_categories_missing": [], "mutating_operation_count": 1, "summary": "32 pass, 0 fail, 0 missing of 32 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"contract","detail":"contract must be an object"}
```

## Findings

No findings.

## Tester errors

2 tester errors, both corrected at design time before execution and not scored against the atom:

1. Full-pass designed note stated `taxonomy_categories_missing=null`; per SERVICE.md that field is `[]` when a complete list is declared (null only when no list is declared). Corrected in cases.json to `[]`, with `computed_status` added.
2. Violations designed `failing_checks` listed section names (`boundary_validation`, `error_taxonomy`, `observability`) instead of exact check names. Corrected before execution to the 5 exact check names above, with no change to any input value or expected verdict.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (taxonomy coverage, idempotency-keys gating, migrations reversible-or-backed-up, and `computed_status`) and verified the artifact's numbers and verdicts. Raw output: `verification/work/backend-engineering-advice/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `taxonomy_categories_missing` (all 5 declared) | [] | [] | ✓ |
| full-pass `mutating_operation_count` | 1 | 1 | ✓ |
| full-pass `computed_status` | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `taxonomy_categories_missing` ([validation] only) | [not_found, conflict, retryable, fatal] | same | ✓ |
| violations pass/fail/missing | 21 / 5 / 6 | 21 / 5 / 6 | ✓ |
| violations `computed_status` | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| verdicts | PRODUCTION_READY / NOT_PRODUCTION_READY / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
