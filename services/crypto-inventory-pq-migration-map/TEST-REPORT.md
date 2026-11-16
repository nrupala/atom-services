# Test report — crypto-inventory-pq-migration-map

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
**Evidence:** `verification/work/crypto-inventory-pq-migration-map/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — one RSA key-exchange inventory entry, shelf-life 10y, owner named | HTTP 200, status `complete`, counts.total=1, migration_needed=1, row classified `quantum_vulnerable`, priority_rank 1 | HTTP 200, `complete`, counts exact, row `quantum_vulnerable` / `migrate_hybrid` / `ML-KEM (FIPS 203)`, priority_rank 1, stamp present and well-formed | PASS |
| 2 | violations — one RSA signature entry missing shelf-life + owner, plus one non-object entry | HTTP 200, status `partial`, invalid_entries=1, missing_shelf_life=1, missing_owner=1 | HTTP 200, `partial`, exactly those counts (map row: `quantum_vulnerable` / `migrate_hybrid` / `ML-DSA (FIPS 204) / SLH-DSA (FIPS 205)`) | PASS |
| 3 | sparse — `system` + empty `inventory` list | HTTP 200, status `insufficient_evidence` | HTTP 200, `insufficient_evidence`, empty map, all counts 0 | PASS |
| 4 | malformed — `system: 12345`, `inventory: "not-a-list"` | HTTP 422 clean input error, never a status | HTTP 200, status `insufficient_evidence` — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical artifact core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `crypto_inventory_pq_migration_map`) | PASS |

## Second tester — DeepSeek

**Second tester:** DeepSeek via the house `custom.legacy-deepseek`
connector, given the contract, SERVICE.md and the same recorded evidence
as the Gemini judge, and instructed to independently recompute the
classification/map from the input inventory and verify status
correctness. Raw output: `verification/work/crypto-inventory-pq-migration-map/deepseek-raw.txt`.

**DeepSeek verdict: FAIL** — on the malformed case only; it agrees with
Gemini on every other case.

DeepSeek computed checks (24 total; 22 match, the 2 mismatches are both
the malformed case):

| Quantity | Expected | Actual | Result |
|---|---|---|---|
| full-pass counts.total | 1 | 1 | match |
| full-pass counts.migration_needed | 1 | 1 | match |
| full-pass by_classification.quantum_vulnerable | 1 | 1 | match |
| full-pass row classification | quantum_vulnerable | quantum_vulnerable | match |
| full-pass row action | migrate_hybrid | migrate_hybrid | match |
| full-pass row target_family | ML-KEM (FIPS 203) | ML-KEM (FIPS 203) | match |
| full-pass row priority_rank | 1 | 1 | match |
| full-pass status | complete | complete | match |
| violations counts.total | 1 | 1 | match |
| violations counts.invalid_entries | 1 | 1 | match |
| violations counts.missing_shelf_life | 1 | 1 | match |
| violations counts.missing_owner | 1 | 1 | match |
| violations counts.migration_needed | 1 | 1 | match |
| violations row classification | quantum_vulnerable | quantum_vulnerable | match |
| violations row action | migrate_hybrid | migrate_hybrid | match |
| violations row target_family | ML-DSA (FIPS 204) / SLH-DSA (FIPS 205) | ML-DSA (FIPS 204) / SLH-DSA (FIPS 205) | match |
| violations row priority_rank | 1 | 1 | match |
| violations status | partial | partial | match |
| sparse status | insufficient_evidence | insufficient_evidence | match |
| sparse migration_map length | 0 | 0 | match |
| malformed http_status | 422 | 200 | **MISMATCH** |
| malformed status | no verdict (rejected) | insufficient_evidence | **MISMATCH** |
| full-pass determinism_byte_identical | true | true | match |
| full-pass parity_structured_equal | true | true | match |

**Agreement / disagreement:** full agreement with Gemini. DeepSeek
independently recomputed both computed cases — RSA `key_exchange` →
`quantum_vulnerable` / `migrate_hybrid` / `ML-KEM (FIPS 203)`; RSA
`signature` → `quantum_vulnerable` / `migrate_hybrid` /
`ML-DSA (FIPS 204) / SLH-DSA (FIPS 205)`; the non-object entry counted
as `invalid_entries=1` and skipped; missing shelf-life/owner counted —
and every count, row field and status matched the artifact. DeepSeek's
output listed the full-pass, violations and sparse cases inside its
`findings` array with expected == actual; those are confirmations, not
defects, and are dispositioned as such here. Its only defect finding is
F1 below, identical to Gemini's. No disagreement required disposition
from the raw evidence.

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"crypto-inventory-pq-migration-map","atom_version":"0.1.0","system":"production-cluster-01","status":"complete","counts":{"total":1,"invalid_entries":0,"by_classification":{"quantum_vulnerable":1,"hybrid_classical_pq":0,"pq_ready":0,"symmetric_or_hash_not_broken":0,"unknown":0},"migration_needed":1,"missing_shelf_life":0,"missing_owner":0},"migration_map":[{"id":"item-1","surface":"tls","algorithm":"RSA","purpose":"key_exchange","classification":"quantum_vulnerable","action":"migrate_hybrid","target_family":"ML-KEM (FIPS 203)","shelf_life_years":10,"owner":"team-alpha","priority_rank":1,"basis":"classical asymmetric algorithm \u2014 quantum breaks today's asymmetric crypto"}],"summary":"Migration map over 1 inventory entries: 1 quantum-vulnerable, 0 hybrid, 0 PQ-ready, 0 symmetric/hash not broken, 0 unknown; 0 missing shelf-life.","stamp":"CRYPTO INVENTORY PQ MIGRATION MAP\nsystem: production-cluster-01\nSTATUS: complete\nMigration map over 1 inventory entries: 1 quantum-vulnerable, 0 hybrid, 0 PQ-ready, 0 symmetric/hash not broken, 0 unknown; 0 missing shelf-life."}
```

Malformed response (REST, HTTP 200 — the finding; `checks` array trimmed):

```json
{"service":"crypto-inventory-pq-migration-map","atom_version":"0.1.0","system":12345,"status":"insufficient_evidence","counts":{"total":0,"invalid_entries":0,"by_classification":{"quantum_vulnerable":0,"hybrid_classical_pq":0,"pq_ready":0,"symmetric_or_hash_not_broken":0,"unknown":0},"migration_needed":0,"missing_shelf_life":0,"missing_owner":0},"migration_map":[],"summary":"Insufficient evidence: no crypto inventory entries submitted.","stamp":"CRYPTO INVENTORY PQ MIGRATION MAP\nsystem: 12345\nSTATUS: insufficient_evidence\nInsufficient evidence: no crypto inventory entries submitted."}
```

## Findings

**F1 — Type-violating input returns a status instead of a clean input
error.** Case 4: `system` as a number, `inventory` as a string. Expected (test doctrine for this program +
the gateway's `invalid_input` mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with a
`insufficient_evidence` status computed over the garbage values (`system` echoed back as `12345`).
The atom's handler does not validate manifest field
types before evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/crypto-inventory-pq-migration-map.md`. Retest on redeploy.

## Final verdict

**FAIL** — the computed classification, migration map, counts and status logic are exact on all three status cases — independently recomputed and confirmed by both Gemini and DeepSeek — determinism and MCP/REST parity hold, the stamp is well-formed; the single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health 200), deployment 7f9cae9fdd60417eb72062905a066554. Full recorded battery re-run live via `verification/harness.py` against the unchanged `cases.json`; Wave 1 evidence/judgment preserved as `evidence-wave1.json` / `judgment-wave1.json`. No HTTP 429 was encountered. Gemini judge re-run on the new evidence (`judgment.json`); mechanical verification from the new `evidence.json` governs where testers and evidence conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, status `complete`, counts.total = 1, migration_needed = 1, rank 1, classification quantum_vulnerable | HTTP 200, status `complete`, counts.total = 1, migration_needed = 1, priority_rank = 1, classification `quantum_vulnerable`, target ML-KEM (FIPS 203) | PASS |
| 2 | violations | HTTP 200, status `partial`, invalid_entries = 1, missing_shelf_life = 1, missing_owner = 1 | HTTP 200, status `partial`, counts invalid_entries = 1, missing_shelf_life = 1, missing_owner = 1, target ML-DSA (FIPS 204) / SLH-DSA (FIPS 205) | PASS |
| 3 | sparse | HTTP 200, status `insufficient_evidence` (empty inventory) | HTTP 200, status `insufficient_evidence`, counts all 0, empty map | PASS |
| 4 | malformed | HTTP 422 `invalid_input` (system must be string, inventory must be list) | HTTP 422, `{ok:false, error:"invalid_input", field:"system"}` — no status/migration_map artifact | PASS |
| 5 | determinism | REST repeat byte-identical | `determinism_byte_identical: true` | PASS |
| 6 | parity | MCP structuredContent deep-equals REST artifact | `parity_structured_equal: true` | PASS |

F1 disposition: **CLOSED**. Wave 1: `system: 12345` + `inventory: "not-a-list"` returned HTTP 200 with an `insufficient_evidence` verdict computed over the garbage values. Retest: the same malformed case returns HTTP 422 `{ok:false, error:"invalid_input", field:"system"}` ("system must be a string") and no verdict artifact is produced. Mechanical check of the new evidence: malformed status == 422 and body error == "invalid_input" — confirmed. All other cases are unchanged and exact.

### Second tester — DeepSeek (retest)

**Second tester:** DeepSeek via the house `custom.legacy-deepseek` connector (`ds_chat.py`) — independent second read mirroring the Wave 1 scope, given SERVICE.md's computed rules, the `cases.json` inputs and the NEW evidence artifacts (full-pass and violations), and instructed to recompute the headline computed quantities by hand and show its arithmetic. Raw output: `verification/work/crypto-inventory-pq-migration-map/deepseek-retest-raw.txt`.

**DeepSeek verdict: PASS** — no defects. DeepSeek's `findings` array lists per-case confirmations (expected = actual), not defects. All 19 computed checks match.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass counts.total / migration_needed | 1 / 1 | 1 / 1 | ✓ |
| full-pass classification / target_family | quantum_vulnerable / ML-KEM (FIPS 203) | quantum_vulnerable / ML-KEM (FIPS 203) | ✓ |
| violations invalid_entries / missing_shelf_life / missing_owner | 1 / 1 / 1 | 1 / 1 / 1 | ✓ |
| violations target_family | ML-DSA (FIPS 204) / SLH-DSA (FIPS 205) | ML-DSA (FIPS 204) / SLH-DSA (FIPS 205) | ✓ |
| malformed HTTP + error | 422 / invalid_input | 422 / invalid_input | ✓ |

**Agreement:** DeepSeek agrees with Gemini (retest verdict PASS, findings: none) on the verdict and on every recomputed quantity. No disagreement to disposition.

**Tester errors this wave:** none

**Retest verdict: PASS**
