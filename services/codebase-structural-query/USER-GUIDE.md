# Codebase Structural Query — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a code graph (from your own indexer) and a structural
question about it — what does this module reach, what would break if
it changed, is there a path between these two nodes. This atom
computes the answer over the graph you submit: deterministic intent
routing, aggregate-first output (counts and kind breakdowns before
lists), typed edges in every path hop, no scoring or opinions. It
does not audit declared evidence — it computes. Same graph + query
in → same answer out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "codebase-structural-query"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/codebase-structural-query`
  — tool name `codebase_structural_query`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/codebase-structural-query`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `graph.nodes[]` | `{id (string), kind (string)}` — packages, modules, files, functions, classes, externals. Duplicate ids keep the first entry; entries without a string id are dropped. |
| `graph.edges[]` | `{from, to, kind}` — typed edges (calls, references, contains, imports). Edges naming unknown nodes and exact duplicates are dropped. |
| `query.intent` | one of `descendants`, `ancestors`, `blast_radius`, `path`, `stats`, `snapshot`. Anything else is rejected as an input error — never force-fit. |
| `query.target` | the node the query is about (required except for `stats` / `snapshot`) |
| `query.target_b` | the second node, for `path` only |
| `query.expand` | when true, traversal answers carry the full sorted node list; otherwise aggregate-first: counts and kind breakdowns only |
| `index.stale` | when true, the answer is `stale_index` and no structural answer is given — a stale index is never answered from |

`graph` and `query` are both required: a submission missing either,
or with type-violating values, is a clean input error (HTTP 422
`invalid_input`), never a computed answer.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/codebase-structural-query`:

```json
{
  "graph": {
    "nodes": [
      {
        "id": "A",
        "kind": "module"
      },
      {
        "id": "B",
        "kind": "function"
      }
    ],
    "edges": [
      {
        "from": "A",
        "to": "B",
        "kind": "calls"
      }
    ]
  },
  "query": {
    "intent": "descendants",
    "target": "A",
    "expand": false
  },
  "index": {
    "stale": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries every check
and a text stamp of the verdict):

```json
{
  "service": "codebase-structural-query",
  "atom_version": "0.1.0",
  "intent": "descendants",
  "target": "A",
  "target_b": null,
  "status": "ok",
  "counts": {"total": 1, "by_kind": {"function": 1}},
  "nodes": [],
  "hops": [],
  "snapshot": null,
  "summary": "descendants of A: 1 node(s)."
}
```

## Verdicts

- **ok** — the query was answered; `counts` (and, with `expand`, the sorted `nodes` / `hops`) carry the result. `blast_radius` is the full failure footprint: nodes reachable upstream plus downstream of the target, the target itself excluded. `snapshot` returns the whole graph canonically sorted.
- **not_found** — the target (or `target_b`) is not in the index.
- **no_path** — both nodes exist, but no path connects them.
- **stale_index** — `index.stale` was true; no structural answer is given from a stale index.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
