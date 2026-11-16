# Semantic code taint analysis report — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You export a code graph from your own analyser — nodes (sources of
untrusted input, sinks such as `exec`/`sql`/`html`, sanitizers, and
ordinary transform steps) and the directed data-flow edges between
them. This atom analyses exactly that declared graph: for every
(source, sink) pair it finds the shortest directed path and classifies
the pair as **tainted** (a path exists that passes through no
sanitizer — reported with its path and a severity from the sink kind:
`exec` → critical, `sql`/`html` → high, anything else → medium),
**sanitized** (every path passes through a sanitizer), or
**unreachable** (no path). The verdict is **TAINTED**, **CLEAN**, or
**INSUFFICIENT_EVIDENCE**. The atom never parses, fetches or executes
your code — only the graph you declare is analysed. Same graph in →
same report out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "semantic-code-taint-analysis-report"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/semantic-code-taint-analysis-report`
  — tool name `semantic_code_taint_analysis_report`; `tools/call`
  arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/semantic-code-taint-analysis-report`
  — body = the manifest object; same `Authorization` header.

## Input — the declared code graph manifest

| Field | Meaning |
|---|---|
| `graph.nodes[]` | entries `{id (string), role, kind}` — `role` is `source` (untrusted input), `sink` (sensitive operation; `kind` names it, e.g. `exec`, `sql`, `html`), `sanitizer` (cleans data flowing through it), or `transform` (any other step; the default for a missing/invalid role). Duplicate ids keep the first entry; entries without a string id are dropped |
| `graph.edges[]` | entries `{from, to, kind}` — directed data-flow edges. Edges naming unknown nodes and exact duplicates are dropped; edges are canonically sorted |

All computed quantities in the report are integers or strings (counts
and path lengths); all lists are canonically sorted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/semantic-code-taint-analysis-report`:

```json
{
  "graph": {
    "nodes": [
      {"id": "n1", "role": "source", "kind": "input"},
      {"id": "n2", "role": "sink", "kind": "exec"}
    ],
    "edges": [{"from": "n1", "to": "n2", "kind": "flow"}]
  }
}
```

Response — HTTP 200 (complete; this response is short enough to show
in full):

```json
{
  "service": "semantic-code-taint-analysis-report",
  "atom_version": "0.1.0",
  "verdict": "TAINTED",
  "counts": {"nodes": 2, "edges": 1, "sources": 1, "sinks": 1, "sanitizers": 0, "pairs_evaluated": 1, "tainted": 1, "sanitized": 0, "unreachable": 0},
  "findings": [{"source": "n1", "sink": "n2", "sink_kind": "exec", "severity": "critical", "path": ["n1", "n2"], "hops": [{"from": "n1", "to": "n2", "kind": "flow"}], "length": 1}],
  "sanitized_flows": [],
  "missing_evidence": [],
  "summary": "1 tainted source->sink path(s) found across 1 pair(s): untrusted input reaches a sink without a sanitizer."
}
```

(The full response also carries a text stamp of the verdict.)

## Verdicts

- **TAINTED** — at least one source reaches a sink without passing
  through a sanitizer; each such pair is a finding with its shortest
  sanitizer-free path and severity.
- **CLEAN** — at least one source and one sink are declared and no
  pair is tainted (pairs are sanitized or unreachable).
- **INSUFFICIENT_EVIDENCE** — no source declared, or no sink declared
  (including an empty graph), so taint cannot be ruled in or out;
  `missing_evidence` names what is absent.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
