# Semantic code taint analysis report — full documentation

**Semantic code taint analysis report** · slug `semantic-code-taint-analysis-report` · deliverable type: REPORT · atom version 0.1.0 · status: **live — release candidate (one-week RC soak to 2026-11-22)**

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (worked example 1 below reproduces its request and response verbatim).

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the full flow is in the how-to below). Every call sends the key as `Authorization: Bearer <key>`.

**Step 2 — build the manifest.** The caller assembles one JSON manifest declaring the graph the atom analyses (the input reference below lists every field and its type). In the recorded run, the graph declares a source flowing directly into a sink.

**Step 3 — call the REST endpoint.** `POST https://atoms.pipavia.com/v1/semantic-code-taint-analysis-report` with the manifest as the body and the `Authorization` header set.

**Step 4 — read the result.** The recorded response came back HTTP 200 with status `TAINTED`. Its summary: "1 tainted source->sink path(s) found across 1 pair(s): untrusted input reaches a sink without a sanitizer." Read the computed sections, the counts, and the gaps/missing-evidence detail (empty here) — that is the deliverable.

**Step 5 — trust but verify.** The same manifest submitted twice returned byte-identical REST responses, and the MCP face returned a structurally identical result — both properties are recorded in the evidence (`determinism_byte_identical`, `parity_structured_equal`). Same input in, same deliverable out.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "semantic-code-taint-analysis-report"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. `POST https://atoms.pipavia.com/v1/semantic-code-taint-analysis-report` — body = the manifest object; same `Authorization` header. HTTP 200 returns the deliverable as JSON.

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/semantic-code-taint-analysis-report`
- Tool name: `semantic_code_taint_analysis_report` — `tools/call` arguments = the manifest object (the same object you would POST to REST).
- Send the same `Authorization: Bearer <key>` header. The MCP result's structured content is the same deliverable the REST face returns (parity is recorded in the evidence).

### Read a failing verdict and fix the manifest

The recorded violations run (worked example 2) returned verdict `CLEAN` — in that run the declared graph's source had no path to its sink (1 pair evaluated: 0 tainted, 0 sanitized, 1 unreachable). To read any response:

1. **`findings`** — each tainted pair, with the shortest unsanitized path, its hops, and the fixed-table severity. A finding means your own declared graph contains an unsanitized source→sink flow; fix the code (or the graph export, if the export is wrong) so the flow passes through a sanitizer or no longer exists.
2. **`sanitized_flows`** — pairs whose every path passes through a sanitizer; not findings, but the sanitizers named are trusted exactly as declared.
3. **`missing_evidence`** — when the verdict is `INSUFFICIENT_EVIDENCE`, this names the absent side (no sources and/or no sinks declared); supply a graph that declares both.
4. **`counts`** — nodes/edges/sources/sinks/sanitizers and pair outcomes; use them to confirm the graph you think you sent is the graph the atom analysed (unknown-node edges and duplicate node ids are dropped by rule).

### Handle a 422 invalid_input

A type-violating manifest is rejected before any verdict is computed. The recorded malformed run (worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "graph",
  "detail": "graph.nodes must be a list"
}
```

Read `field` for the offending field and `detail` for the expected shape — here, `graph`: "graph.nodes must be a list". Fix the type at that field (per the input reference below) and resubmit. A 422 is never a verdict and is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/semantic-code-taint-analysis-report` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/semantic-code-taint-analysis-report` — tool name `semantic_code_taint_analysis_report`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Support: info@pipavia.com

### Input reference

The manifest is a single declared code graph. Every field, with its type:

| Field | Type | Notes |
|---|---|---|
| `graph.nodes[]` | list of objects | Declared code-graph nodes (see the entry fields below). |
| `graph.nodes[].id` | string | Node identifier. Entries without a string id are dropped; duplicate ids keep the first entry. |
| `graph.nodes[].role` | string — one of `source`, `sink`, `sanitizer`, `transform` | `source` = untrusted input; `sink` = sensitive operation; `sanitizer` = cleans data flowing through it; `transform` = any other step (the default for a missing/invalid role). |
| `graph.nodes[].kind` | string | For sinks, names the operation (e.g. `exec`, `sql`, `html`) and drives the fixed severity table. |
| `graph.edges[]` | list of objects | Directed data-flow edges. Edges naming unknown nodes and exact duplicates are dropped; edges are canonically sorted. |
| `graph.edges[].from` | string | Source node id of the edge. |
| `graph.edges[].to` | string | Target node id of the edge. |
| `graph.edges[].kind` | string | Edge kind, carried into the reported hops. |

### Computed outputs and operations (no checks array)

This atom's responses carry **no `checks` array** — it is a computed atom, and its deliverable is the computed report below, not a check battery. The operations it performs, from SERVICE.md, each visible in the recorded responses:

1. Graph normalisation — duplicate node ids keep the first entry; entries without a string id are dropped; missing/invalid role defaults to `transform`; edges naming unknown nodes and exact duplicates are dropped; edges canonically sorted.
2. Pair enumeration — every (source, sink) pair, in sorted order.
3. Shortest-path search — the shortest directed path per pair over the declared edges.
4. Tainted classification — a sanitizer-free path exists; the shortest such path, its hops and length are the finding.
5. Sanitized classification — every path passes through at least one sanitizer; shortest path plus the sanitizers on it are reported.
6. Unreachable classification — no directed path exists.
7. Severity assignment — fixed table on the sink kind (lower-cased): `exec` → critical, `sql` → high, `html` → high, any other kind → medium; tainted findings only.
8. Counts and missing-evidence reporting — pair/outcome counts, and `missing_evidence` naming the absent side (sources and/or sinks) when the verdict is `INSUFFICIENT_EVIDENCE`.

### Output format

A successful call returns one JSON object. The recorded full-pass response carries these top-level keys, in order: `service`, `atom_version`, `verdict`, `counts`, `findings`, `sanitized_flows`, `missing_evidence`, `summary`, `stamp`. It always includes `service` and `atom_version`, the subject echo where the manifest names one, the verdict/status, a human-readable `summary`, and a text `stamp` restating the result.

The response carries `counts` (nodes, edges, sources, sinks, sanitizers, pairs_evaluated, tainted, sanitized, unreachable), `findings` (tainted pairs with source, sink, sink_kind, severity, path, hops, length), `sanitized_flows`, `missing_evidence`, a `summary` and a text `stamp`. No floats are produced.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `TAINTED` | At least one (source, sink) pair is tainted — a sanitizer-free path exists. Each tainted pair is reported as a finding with its shortest unsanitized path, hops, and severity. |
| `CLEAN` | At least one source and one sink are declared, and no pair is tainted (every pair is sanitized or unreachable). |
| `INSUFFICIENT_EVIDENCE` | No source declared, or no sink declared — including an empty graph — so taint cannot be ruled in or out. The missing side is named in `missing_evidence`. |
| `tainted (pair classification)` | A path exists from source to sink that passes through no sanitizer; the shortest sanitizer-free path is the finding. |
| `sanitized (pair classification)` | Every path from source to sink passes through at least one sanitizer; the shortest path and the sanitizers on it are reported in `sanitized_flows`. |
| `unreachable (pair classification)` | No directed path exists from source to sink. |
| `severity = critical` | Fixed table on sink kind (lower-cased): `exec` → critical. Reported on tainted findings only. |
| `severity = high` | Sink kind `sql` or `html` → high. |
| `severity = medium` | Any other sink kind → medium. |

### Errors

Only the shapes evidenced in the gateway code and the recorded battery are documented here:

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | Missing, malformed, unknown or revoked key (REST face shape, from the gateway call path). |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the <namespace> scope; issue it for this atom first"}` | The key is valid but was never issued for this atom — issue it for `semantic-code-taint-analysis-report` and retry. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "graph", "detail": "graph.nodes must be a list"}` (recorded verbatim in worked example 3) | The manifest violates a field type; `field` and `detail` name the problem. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for semantic-code-taint-analysis-report exceeded"}` (a per-day variant names the 10000/day limit) | Rate limit exceeded; the call is not metered. |

### Rate limits and pricing status

- Rate limits (contract.yaml, SPEC default): **60 calls/minute and 10000 calls/day per key** for this atom.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is null and `rate_status` is pending — **Free during trial — rate pending.** Prices are set only from measured production cost per unit, per the billing protocol in the contract.

## Explanation

This atom sells a report, never the underlying knowledge: given a declared code graph — sources, sinks, sanitizers, transforms and directed data-flow edges, as exported by the caller's own analyser — it classifies every source→sink pair and reports the tainted flows with their paths and severities. The buyer context (SERVICE.md, first hypothesis, not yet market-tested): teams and agents working in Engineering & code who need this report on demand. House self-use: **Codetopo-style codebase impact reviews**.

**How the verdict is decided.** This is a computed atom: it carries no checks array. For every (source, sink) pair, in sorted order, it finds the shortest directed path over the declared edges and classifies the pair as tainted, sanitized, or unreachable (see the verdict vocabulary). Duplicate node ids keep the first entry; entries without a string id are dropped; a missing/invalid node role defaults to `transform`; edges naming unknown nodes and exact duplicates are dropped and edges are canonically sorted. All computed quantities are integers or strings and all lists are canonically sorted, so the report is deterministic. There is no missing-vs-fail check semantics here: the analogue of missing evidence is the `INSUFFICIENT_EVIDENCE` verdict (no source or no sink declared), and the analogue of a failure finding is a tainted pair.

**What it does NOT do.**

- Only the declared graph is analysed — code is never parsed, fetched, or executed, and no AST, call graph, or source text is read.
- Dynamic dispatch, reflection, implicit flows, and any flow the caller's exporter did not declare as an edge are out of scope and cannot be found.
- A sanitizer is trusted exactly as declared: the atom does not judge whether a declared sanitizer is correct or sufficient for a given sink.
- No severity judgment beyond the fixed sink-kind table, no scoring, and no remediation advice is produced.

## Role views

### For integrators (Users)

One manifest in, one deliverable out, over REST or MCP with the same key. Start with the tutorial, keep the input reference beside your manifest builder, and treat the response's verdict/status, summary and per-item detail as the product. Rate: free during trial — rate pending; limits 60/min, 10000/day per key. Support: info@pipavia.com.

### For developers

Manifest authoring: field names, groupings and types are exactly as in the input reference — a type violation is a 422 before any computation, and an absent field is a deliberate signal (missing evidence), not a default. Determinism: the core is deterministic — the recorded battery proves byte-identical repeat REST responses and REST/MCP structured parity for this atom, so golden-file testing against the worked examples below is sound. Implementation: `services/semantic-code-taint-analysis-report/src/semantic_code_taint_analysis_report.py` (Python 3, stdlib only; `evaluate(manifest)`), tests: `services/semantic-code-taint-analysis-report/tests/test_semantic_code_taint_analysis_report.py` (19 tests, per contract.yaml). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract R1 rule).

### For ops

Endpoints: REST `POST /v1/semantic-code-taint-analysis-report` and MCP `POST /mcp/semantic-code-taint-analysis-report` (tool `semantic_code_taint_analysis_report`) on https://atoms.pipavia.com. Key scope: per user, per atom — a key never verifies for another atom; 403 means the scope was never issued. Rate limits: 60/min, 10000/day per key (429, not metered). Error monitoring: watch the 401 (unauthorized) / 403 (scope_required) / 422 (invalid_input, with field+detail) / 429 (rate_limit) shapes in the errors table. Status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:51:44.782658+00:00 against gateway v1.1.0, external verification lane, source `verification/work/semantic-code-taint-analysis-report/evidence.json`. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — verified mechanically against the evidence after writing).

### Example 1 — full-pass (recorded HTTP 200)

Recorded case note: Valid tainted path from source to exec sink. computed_spot_checks: path_length=1, severity=critical, verdict=TAINTED

Input:

```json
{
  "graph": {
    "nodes": [
      {
        "id": "n1",
        "role": "source",
        "kind": "input"
      },
      {
        "id": "n2",
        "role": "sink",
        "kind": "exec"
      }
    ],
    "edges": [
      {
        "from": "n1",
        "to": "n2",
        "kind": "flow"
      }
    ]
  }
}
```

Response (REST):

```json
{
  "service": "semantic-code-taint-analysis-report",
  "atom_version": "0.1.0",
  "verdict": "TAINTED",
  "counts": {
    "nodes": 2,
    "edges": 1,
    "sources": 1,
    "sinks": 1,
    "sanitizers": 0,
    "pairs_evaluated": 1,
    "tainted": 1,
    "sanitized": 0,
    "unreachable": 0
  },
  "findings": [
    {
      "source": "n1",
      "sink": "n2",
      "sink_kind": "exec",
      "severity": "critical",
      "path": [
        "n1",
        "n2"
      ],
      "hops": [
        {
          "from": "n1",
          "to": "n2",
          "kind": "flow"
        }
      ],
      "length": 1
    }
  ],
  "sanitized_flows": [],
  "missing_evidence": [],
  "summary": "1 tainted source->sink path(s) found across 1 pair(s): untrusted input reaches a sink without a sanitizer.",
  "stamp": "SEMANTIC CODE TAINT ANALYSIS REPORT\nVERDICT: TAINTED\n1 tainted source->sink path(s) found across 1 pair(s): untrusted input reaches a sink without a sanitizer."
}
```

### Example 2 — violations (recorded HTTP 200)

Recorded case note: CORRECTED by tester: SERVICE.md states edges naming unknown nodes are dropped, a pair with no path is 'unreachable', and CLEAN = at least one source and one sink declared with no tainted pair; INSUFFICIENT_EVIDENCE is only for no source or no sink declared. Original Gemini expectation of INSUFFICIENT_EVIDENCE contradicted the contract.

Input:

```json
{
  "graph": {
    "nodes": [
      {
        "id": "n1",
        "role": "source",
        "kind": "input"
      },
      {
        "id": "n2",
        "role": "sink",
        "kind": "exec"
      }
    ],
    "edges": [
      {
        "from": "n1",
        "to": "n3",
        "kind": "flow"
      }
    ]
  }
}
```

Response (REST):

```json
{
  "service": "semantic-code-taint-analysis-report",
  "atom_version": "0.1.0",
  "verdict": "CLEAN",
  "counts": {
    "nodes": 2,
    "edges": 0,
    "sources": 1,
    "sinks": 1,
    "sanitizers": 0,
    "pairs_evaluated": 1,
    "tainted": 0,
    "sanitized": 0,
    "unreachable": 1
  },
  "findings": [],
  "sanitized_flows": [],
  "missing_evidence": [],
  "summary": "No tainted source->sink path across 1 pair(s): 0 sanitized, 1 unreachable.",
  "stamp": "SEMANTIC CODE TAINT ANALYSIS REPORT\nVERDICT: CLEAN\nNo tainted source->sink path across 1 pair(s): 0 sanitized, 1 unreachable."
}
```

### Example 3 — malformed (recorded HTTP 422)

Recorded case note: Type violation: nodes must be a list and edges must be a list.

Input:

```json
{
  "graph": {
    "nodes": "not_a_list",
    "edges": 123
  }
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "graph",
  "detail": "graph.nodes must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Y — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Integrators Y · Developers Y · Ops Y · Regulators N/A (a code-analysis report over a caller-declared graph; an engineering analysis artifact, not itself compliance or audit evidence for a regulated domain.) |
| Checks named count vs recorded count | N/A — computed atom: the recorded responses carry no checks array; computed outputs/operations enumerated instead (see Reference) |
| Verdict vocabulary complete | Y — 3 verdict values plus section/per-item statuses documented |
| Input reference typed | Y — 8 field rows, each with a type (SERVICE.md field table + recorded input schema) |
| Worked examples verbatim-verified | Y — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/semantic-code-taint-analysis-report/evidence.json` |

