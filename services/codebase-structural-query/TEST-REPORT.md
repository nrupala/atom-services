# Test report — codebase-structural-query

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
**Evidence:** `verification/work/codebase-structural-query/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — graph A→B (`calls`), query `descendants` of A | HTTP 200, status `ok`, descendants_of_A=1 | HTTP 200, `ok`, counts total=1, by_kind {function: 1}, "descendants of A: 1 node(s)", stamp present and well-formed. Recomputed from the input (2 nodes, 1 edge, 1 descendant): match (Gemini and DeepSeek independently) | PASS |
| 2 | violations — `path` query A → `NON_EXISTENT` (target_b not in the index) | HTTP 200, status `not_found` *(expectation corrected — see tester errors)* | HTTP 200, `not_found`, "Target node not in the index." | PASS |
| 3 | sparse — only a `query` object, no `graph` | HTTP 422 clean input error *(expectation corrected — see tester errors)* | HTTP 422 `{ok:false, error:"invalid_input", field:"query", detail:"graph must be an object with nodes and edges"}` | PASS |
| 4 | malformed — `graph: "not_an_object"`, `query.intent: 123`, `query.expand: "yes"` | HTTP 422 clean input error, never a verdict | HTTP 422 `{ok:false, error:"invalid_input", field:"query", detail:"query.intent must be a string"}` | PASS |
| 5 | determinism — full-pass query submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass query via MCP `tools/call` vs REST | identical result core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `codebase_structural_query`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"codebase-structural-query","atom_version":"0.1.0","intent":"descendants","target":"A","target_b":null,"status":"ok","counts":{"total":1,"by_kind":{"function":1}},"nodes":[],"hops":[],"snapshot":null,"summary":"descendants of A: 1 node(s).","stamp":"CODEBASE STRUCTURAL QUERY\nintent: descendants  target: A\nSTATUS: ok\ndescendants of A: 1 node(s)."}
```

Violations response (REST, HTTP 200):

```json
{"service":"codebase-structural-query","atom_version":"0.1.0","intent":"path","target":"A","target_b":"NON_EXISTENT","status":"not_found","counts":{"total":0,"by_kind":{}},"nodes":[],"hops":[],"snapshot":null,"summary":"Target node not in the index.","stamp":"CODEBASE STRUCTURAL QUERY\nintent: path  target: A\nSTATUS: not_found\nTarget node not in the index."}
```

Sparse response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"query","detail":"graph must be an object with nodes and edges"}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"query","detail":"query.intent must be a string"}
```

## Findings

No findings against the atom. Gemini's verdict: **PASS**, findings 0.

**Tester errors — 2, both corrected and re-run (a tester error is
never recorded as an atom failure):**

1. Case `violations` (flagged by Gemini): the designed case expected
   status `no_path`, but SERVICE.md defines `not_found` as "target
   not in the index" and `no_path` for the both-nodes-exist-but-no-path
   situation. The atom's `not_found` answer is contract-correct.
   Correction: the case expectation was changed to `not_found`
   (input unchanged), harness + judge re-run — PASS.
2. Case `sparse` (found in coordinator disposition against the raw
   evidence; Gemini's first judgment did not flag it): the designed
   case expected HTTP 200 `insufficient_evidence`, but this computed
   atom has no such status — its vocabulary is `ok` / `not_found` /
   `no_path` / `stale_index`, and `graph` + `query` are the required
   submission, so a submission with no graph is a clean input error.
   The atom's HTTP 422 `invalid_input` answer is contract-correct.
   Correction: the case expectation was changed to HTTP 422 /
   outcome null, harness + judge re-run — PASS. On re-judgment Gemini
   recorded both cases under tester_errors and kept the verdict PASS.

Observation (not a finding): on the sparse case the 422 body carries
`field: "query"` while its `detail` describes the missing `graph`.
The error is clean, correctly coded, and the detail is accurate;
only the field label is imprecise.

## Second tester — DeepSeek

**Second tester:** DeepSeek via the house `custom.legacy-deepseek`
connector (`ds_chat.py`, temperature 0.1) — an independent second
judgment for this COMPUTED atom, given the contract, SERVICE.md and
the same judge input Gemini used, and instructed to recompute the
graph answers from the input itself. Raw output:
`verification/work/codebase-structural-query/deepseek-raw.txt`.

**DeepSeek verdict: PASS**, findings: none.

DeepSeek computed checks (all `match: true`): full-pass nodes_count
2 = 2; edges_count 1 = 1; descendants_of_A 1 = 1; descendants by_kind
function 1 = 1; full-pass status `ok`; violations target_b existence
— NON_EXISTENT absent from the index → `not_found`, actual
`not_found`; sparse HTTP 422 / error `invalid_input`; malformed HTTP
422 / error `invalid_input` / field `query`.

**Agreement:** DeepSeek agrees with Gemini on the verdict (PASS), on
every computed quantity, and on the `not_found` reading of the
violations case. No disagreements to disposition.

## Final verdict

**PASS** — computed graph answers recompute exactly under two independent testers (Gemini + DeepSeek), status vocabulary matches SERVICE.md, malformed and missing-required-field inputs return clean HTTP 422 `invalid_input`, determinism and MCP/REST parity hold, the stamp is well-formed. Two tester errors were corrected and re-run; no atom findings.

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health 200), deployment 7f9cae9fdd60417eb72062905a066554. Full recorded battery re-run live via `verification/harness.py` against the unchanged `cases.json`; Wave 1 evidence/judgment preserved as `evidence-wave1.json` / `judgment-wave1.json`. No HTTP 429 was encountered. Gemini judge re-run on the new evidence (`judgment.json`); mechanical verification from the new `evidence.json` governs where testers and evidence conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, status `ok`, descendants_of_A = 1 (by_kind function = 1) | HTTP 200, status `ok`, counts.total = 1, by_kind.function = 1 | PASS |
| 2 | violations | HTTP 200, status `not_found` (target_b NON_EXISTENT not in the index) | HTTP 200, status `not_found`, counts.total = 0 | PASS |
| 3 | sparse | HTTP 422 `invalid_input` (no graph submitted — this atom has no insufficient_evidence status) | HTTP 422, `{ok:false, error:"invalid_input", field:"query"}` | PASS |
| 4 | malformed | HTTP 422 `invalid_input` (graph/intent/expand type violations) | HTTP 422, `{ok:false, error:"invalid_input", field:"query"}` | PASS |
| 5 | determinism | REST repeat byte-identical | `determinism_byte_identical: true` | PASS |
| 6 | parity | MCP structuredContent deep-equals REST artifact | `parity_structured_equal: true` | PASS |

F1 disposition: **closed / not applicable as a defect here** — this atom already validated in Wave 1 and still does: the malformed case returns HTTP 422 `{ok:false, error:"invalid_input"}` (field `query`), and the sparse (missing-graph) case likewise returns HTTP 422 `invalid_input`. No HTTP 200 verdict is produced over type-violating or missing-required input. The fix-stream deploy did not regress this atom.

### Second tester — DeepSeek (retest)

**Second tester:** DeepSeek via the house `custom.legacy-deepseek` connector (`ds_chat.py`) — independent second read mirroring the Wave 1 scope, given SERVICE.md's computed rules, the `cases.json` inputs and the NEW evidence artifacts (full-pass and violations), and instructed to recompute the headline computed quantities by hand and show its arithmetic. Raw output: `verification/work/codebase-structural-query/deepseek-retest-raw.txt`.

**DeepSeek verdict: PASS** — no defects. DeepSeek's `findings` array lists per-case confirmations (expected = actual), not defects. All 10 computed checks match.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| nodes_count | 2 | 2 | ✓ |
| edges_count | 1 | 1 | ✓ |
| descendants_of_A | 1 | 1 | ✓ |
| descendants by_kind function | 1 | 1 | ✓ |
| violations status | not_found | not_found | ✓ |
| sparse / malformed HTTP + error | 422 / invalid_input | 422 / invalid_input | ✓ |

**Agreement:** DeepSeek agrees with Gemini (retest verdict PASS, findings: none) on the verdict and on every recomputed quantity. No disagreement to disposition.

**Tester errors this wave:** Gemini re-listed the two Wave 1 tester errors (the original `violations` expectation of `no_path` and the original `sparse` expectation of an `insufficient_evidence` status) — both were already corrected in `cases.json` before Wave 1 closed, the recorded expects are the corrected ones, and the atom matches them. They are carry-over re-flags, not new tester errors and not atom findings. No new tester errors this wave.

**Retest verdict: PASS**

---

## Wave 8 supplementary battery — intent/status completion (2026-11-15)

The original battery exercised only the `descendants` and `path` intents and the `ok` / `not_found` statuses (the WS1 documentation record named this gap). This supplementary battery exercises the remaining vocabulary over one shared graph (nodes A module, B function, C function, D module, E external, F module; edges A→B calls, A→C calls, B→D references, C→D references, D→E imports). Cases: `verification/work/codebase-structural-query/cases-supplementary.json`; evidence: `verification/work/codebase-structural-query/evidence-supplementary.json` (gateway v1.1.0, deployment 5cf70cb60526415d89b4db5e5cd02744, tested 2026-11-16T04:31Z).

| Case | Intent | Status exercised | Result |
|---|---|---|---|
| supp-ancestors | `ancestors` of D (expand) | `ok` — {A, B, C}, total 3 | HTTP 200, oracle match, expectation match — PASS |
| supp-blast-radius | `blast_radius` of B (expand) | `ok` — {A, D, E}, total 3 | HTTP 200, oracle match, expectation match — PASS |
| supp-stats | `stats` | `ok` — 6 nodes / 5 edges, edges_by_kind {calls 2, imports 1, references 2} | HTTP 200, oracle match, expectation match — PASS |
| supp-snapshot | `snapshot` | `ok` — nodes A–F canonically sorted, 5 edges | HTTP 200, oracle match, expectation match — PASS |
| supp-no-path | `path` A→F | `no_path` | HTTP 200, oracle match, expectation match — PASS |
| supp-stale-index | `descendants` of A with `index.stale: true` | `stale_index` | HTTP 200, oracle match, expectation match — PASS |

MCP↔REST parity on the ancestors case: structured-equal true. Every live artifact (minus the gateway-added `stamp`) deep-equals the atom oracle's own result for the same input, computed independently before the calls.

**Exercised set is now complete: 6/6 intents** (ancestors, blast_radius, descendants, path, snapshot, stats) **and 4/4 statuses** (not_found, no_path, ok, stale_index).

Validator note (recorded in the evidence's `case_validation` block): the Wave 7 mechanical validator cannot run on this atom — its register extraction executes the oracle's `evaluate({})`, which raises `query must be an object` by design (exit 2), because this computed atom has no checks register. The supplementary battery therefore used documented-shape pre-flight plus independent oracle pre-computation in place of the validator; the limitation is the validator's, not the atom's, and is named here rather than silently skipped.
