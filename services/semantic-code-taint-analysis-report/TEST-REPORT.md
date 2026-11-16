# Test report — semantic-code-taint-analysis-report

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw. The undersigned verification lane re-checked every
judgment against the raw evidence before disposition (one tester error
was caught and corrected — see below).
**Second tester:** DeepSeek (independent recomputation — see its section
below).
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/semantic-code-taint-analysis-report/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`; DeepSeek raw:
`deepseek-raw.txt`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — source `n1` → exec sink `n2`, direct edge, no sanitizer | HTTP 200, verdict `TAINTED`, 1 tainted pair, path length 1, severity `critical` | HTTP 200, `TAINTED`, counts {nodes 2, edges 1, pairs_evaluated 1, tainted 1}, finding path `["n1","n2"]`, length 1, severity `critical` | PASS |
| 2 | violations — the only edge names unknown node `n3` | HTTP 200, verdict `CLEAN` (corrected expectation — see tester error below): edge dropped per contract, pair unreachable | HTTP 200, `CLEAN`, counts {edges 0, tainted 0, sanitized 0, unreachable 1} | PASS (after tester-error correction) |
| 3 | sparse — one source node, no sink, no edges | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, `missing_evidence: ["sinks"]` | PASS |
| 4 | malformed — `graph.nodes: "not_a_list"`, `graph.edges: 123` | HTTP 422 clean input error, never a report | HTTP 422 `{"ok":false,"error":"invalid_input","field":"graph","detail":"graph.nodes must be a list"}` | PASS |
| 5 | determinism — full-pass graph submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass graph via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `semantic_code_taint_analysis_report`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200, complete):

```json
{"service":"semantic-code-taint-analysis-report","atom_version":"0.1.0","verdict":"TAINTED","counts":{"nodes":2,"edges":1,"sources":1,"sinks":1,"sanitizers":0,"pairs_evaluated":1,"tainted":1,"sanitized":0,"unreachable":0},"findings":[{"source":"n1","sink":"n2","sink_kind":"exec","severity":"critical","path":["n1","n2"],"hops":[{"from":"n1","to":"n2","kind":"flow"}],"length":1}],"sanitized_flows":[],"missing_evidence":[],"summary":"1 tainted source->sink path(s) found across 1 pair(s): untrusted input reaches a sink without a sanitizer."}
```

Violations response (REST, HTTP 200, complete):

```json
{"service":"semantic-code-taint-analysis-report","atom_version":"0.1.0","verdict":"CLEAN","counts":{"nodes":2,"edges":0,"sources":1,"sinks":1,"sanitizers":0,"pairs_evaluated":1,"tainted":0,"sanitized":0,"unreachable":1},"findings":[],"sanitized_flows":[],"missing_evidence":[],"summary":"No tainted source->sink path across 1 pair(s): 0 sanitized, 1 unreachable."}
```

Malformed response (REST, HTTP 422, complete):

```json
{"ok":false,"error":"invalid_input","field":"graph","detail":"graph.nodes must be a list"}
```

## Tester error — corrected, not an atom failure

Gemini's original violations case expected `INSUFFICIENT_EVIDENCE` on
the reasoning that dropping the edge to the unknown node `n3` leaves
the graph unable to support a verdict, and its first judgment filed
that expectation as an atom finding. The contract says otherwise, in
terms: SERVICE.md states that "edges naming unknown nodes … are
dropped", defines a pair with no path as **unreachable**, and defines
`CLEAN` as "at least one source and one sink declared, no tainted
pair" — `INSUFFICIENT_EVIDENCE` is reserved for "no source declared,
or no sink declared". The case's graph declares both a source and a
sink, so the atom's `CLEAN` (1 unreachable pair) is the
contract-correct verdict. The case expectation was corrected in
`cases.json`, steps 2–3 were re-run, and Gemini's re-judgment concurs
(PASS, computed check "violations: unreachable count 1 = 1").
**1 tester error, recorded as such — never as an atom failure.**

## Findings

None. Every case — including the malformed case, which correctly
returns HTTP 422 `invalid_input` — behaves as the contract specifies.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from
the case inputs by hand (node/edge/source/sink counts after the
contract's drop rules, per-pair reachability over the declared graph,
shortest sanitizer-free path and its length, and severity from the
fixed sink-kind table) and verified the artifact's numbers and
verdicts. Raw output:
`verification/work/semantic-code-taint-analysis-report/deepseek-raw.txt`.

**DeepSeek verdict: PASS** — no findings.

Its computed checks (all 25 match), in summary: full-pass counts
(nodes 2, edges 1, sources 1, sinks 1, sanitizers 0, pairs 1,
tainted 1, sanitized 0, unreachable 0), finding length 1 and severity
`critical` (exec sink), verdict `TAINTED`; violations counts with the
unknown-node edge dropped (edges 0, unreachable 1) and verdict
`CLEAN`; sparse counts (sinks 0, pairs 0) and verdict
`INSUFFICIENT_EVIDENCE`; malformed HTTP status 422.

**Agreement:** full. DeepSeek and Gemini (after the tester-error
correction) agree on the verdict and on every recomputed quantity;
DeepSeek independently reached the same `CLEAN` reading of the
violations case that the contract supports. No disagreement to
disposition.

## Final verdict

**PASS** — taint reachability, severity, counts, verdict vocabulary,
determinism, MCP/REST parity and malformed-input handling (HTTP 422)
all conform to the contract, confirmed by two independent testers.
One tester error was corrected during the run (see above).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health 200), deployment 7f9cae9fdd60417eb72062905a066554. Full recorded battery re-run live via `verification/harness.py` against the unchanged `cases.json`; Wave 1 evidence/judgment preserved as `evidence-wave1.json` / `judgment-wave1.json`. No HTTP 429 was encountered. Gemini judge re-run on the new evidence (`judgment.json`); mechanical verification from the new `evidence.json` governs where testers and evidence conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `TAINTED`, path_length = 1, severity critical | HTTP 200, verdict `TAINTED`, counts tainted = 1, finding length 1, severity `critical` | PASS |
| 2 | violations | HTTP 200, verdict `CLEAN` (unknown-node edge dropped → pair unreachable) | HTTP 200, verdict `CLEAN`, counts edges = 0, unreachable = 1 | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (no sink declared) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE`, missing_evidence = [sinks] | PASS |
| 4 | malformed | HTTP 422 `invalid_input` (nodes/edges must be lists) | HTTP 422, `{ok:false, error:"invalid_input", field:"graph"}` | PASS |
| 5 | determinism | REST repeat byte-identical | `determinism_byte_identical: true` | PASS |
| 6 | parity | MCP structuredContent deep-equals REST artifact | `parity_structured_equal: true` | PASS |

F1 disposition: **closed / not applicable as a defect here** — this atom already validated in Wave 1 and still does: the malformed case returns HTTP 422 `{ok:false, error:"invalid_input"}` (field `graph`, "graph.nodes must be a list") with no verdict emitted. The fix-stream deploy did not regress this atom.

### Second tester — DeepSeek (retest)

**Second tester:** DeepSeek via the house `custom.legacy-deepseek` connector (`ds_chat.py`) — independent second read mirroring the Wave 1 scope, given SERVICE.md's computed rules, the `cases.json` inputs and the NEW evidence artifacts (full-pass and violations), and instructed to recompute the headline computed quantities by hand and show its arithmetic. Raw output: `verification/work/semantic-code-taint-analysis-report/deepseek-retest-raw.txt`.

**DeepSeek verdict: PASS** — no defects. DeepSeek's `findings` array lists per-case confirmations (expected = actual), not defects. All 23 computed checks match.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass counts (nodes/edges/sources/sinks/pairs/tainted) | 2/1/1/1/1/1 | 2/1/1/1/1/1 | ✓ |
| full-pass finding length / severity | 1 / critical | 1 / critical | ✓ |
| violations counts.edges (unknown-node edge dropped) | 0 | 0 | ✓ |
| violations counts.unreachable / verdict | 1 / CLEAN | 1 / CLEAN | ✓ |
| sparse verdict | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE | ✓ |
| malformed HTTP + error | 422 / invalid_input | 422 / invalid_input | ✓ |

**Agreement:** DeepSeek agrees with Gemini (retest verdict PASS, findings: none) on the verdict and on every recomputed quantity. No disagreement to disposition.

**Tester errors this wave:** none

**Retest verdict: PASS**
