# Codebase structural query — documentation

**Codebase structural query** · slug `codebase-structural-query` · deliverable type: DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. All worked examples are real recorded trial runs — see the provenance line under Worked examples.

> **Shape note (read first).** This is a *computed query* atom, not an evidence-audit atom. It has **no `checks` array, no sections, and no verdict**: it computes a structural answer over the graph you submit and returns a result `status` (`ok` / `not_found` / `no_path` / `stale_index`). The Reference below enumerates its operations and result vocabulary in place of a checks list.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run — a two-node graph (module `A` calling function `B`) with a `descendants` query — whose verbatim request and response appear as Worked example 1 below.

1. **Get a key.** Sign up at `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session; then issue a key for this atom with `POST /v1/keys` and body `{"atom": "codebase-structural-query"}`. Send the key as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides.)
2. **Assemble the submission.** One JSON object with three parts: `graph` (your index export — `nodes[]` with `{id, kind}` and typed `edges[]` with `{from, to, kind}`), `query` (here: intent `descendants`, target `A`, `expand: false`), and `index` (here: `stale: false`).
3. **Send it.** `POST https://atoms.pipavia.com/v1/codebase-structural-query` with the submission as the body and the `Authorization` header set.
4. **Read the answer.** The recorded response is HTTP 200 with `status: "ok"`, `intent: "descendants"`, `target: "A"`, and `counts: {"total": 1, "by_kind": {"function": 1}}` — aggregate-first: because `expand` was false, `nodes` is empty and the counts carry the answer. Its `summary` reads: “descendants of A: 1 node(s).”
5. **Ask for the list when you need it.** Resubmit the same graph with `expand: true` and traversal answers carry the full sorted node list (`nodes`, and `hops` for `path`). The graph and the computation are unchanged — only the presentation expands.

Same graph + query in → same answer out (the recorded battery proves byte-identical repeat responses and MCP/REST parity — see TEST-REPORT.md).

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "codebase-structural-query"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Keys are per user, per atom in scope (contract.yaml: key = HMAC-SHA256 over email | atom service | issued-at, version-prefixed, regenerated on demand after authentication, never stored).
3. Call:

```bash
curl -X POST https://atoms.pipavia.com/v1/codebase-structural-query \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @query.json
```

The body is the `{graph, query, index}` object (see Reference — Input reference). HTTP 200 returns the result object (see Reference — Output format).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/codebase-structural-query`
- Tool name: `codebase_structural_query`
- Send the same `Authorization: Bearer <key>` header. In the `tools/call` request, the tool arguments are the submission object — the same object you would POST as the REST body. The recorded battery proves parity: the MCP `structuredContent` is deep-equal to the REST artifact for the same submission.

### Read a failing verdict and fix the manifest

This atom has no failing verdict — a query that cannot be answered returns a non-`ok` result `status` (HTTP 200), and an invalid submission returns HTTP 422. Worked example 2 below is the recorded non-`ok` run: a `path` query from `A` to `NON_EXISTENT` returned `status: "not_found"` with summary “Target node not in the index.” To work with non-`ok` results:

1. **Branch on `status`, not on HTTP.** HTTP 200 with `status: "not_found"` means the target (or `target_b`) is not a node id in the submitted graph — check the id against your index export (ids are exact strings; nodes without a string `id` are dropped at ingest, and duplicate ids keep the first entry). `status: "no_path"` means both nodes exist but no typed path connects them. `status: "stale_index"` means you declared `index.stale: true` — re-export the index, declare `stale: false`, and resubmit; a stale index is never answered from.
2. **Fix the submission, not a manifest.** There is no evidence to remediate: correct the graph export or the query (intent, target, target_b) and resubmit the whole object. The atom is stateless — it holds no index between calls.
3. **Re-read `summary`.** It states the outcome in one line for every status.

### Handle a 422 invalid_input

An invalid submission is rejected before computation — never answered. The recorded malformed run (Worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "query",
  "detail": "query.intent must be a string"
}
```

The recorded sparse run (submission with no `graph`) returned HTTP 422 with the same shape:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "query",
  "detail": "graph must be an object with nodes and edges"
}
```

- `field` and `detail` name the problem for your submission (recorded details: “query.intent must be a string”; “graph must be an object with nodes and edges”). Note the recorded `field` value is `query` in both runs even when the detail names a deeper problem — read `detail` for the precise fault.
- `graph` and `query` are both required: a submission missing either, or with type-violating values (including an unknown `query.intent` — intents are never force-fit), is a 422, never a computed answer.
- A 422 carries no result object — do not read it as a `not_found` or `no_path` answer.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/codebase-structural-query` — body = the submission object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/codebase-structural-query` — tool name `codebase_structural_query`; `tools/call` arguments = the submission object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0). Contract endpoints: API, MCP, agent.

### Input reference

One JSON object per call: a code-graph index and one structural query. Types are from SERVICE.md's field table, corroborated by the recorded MCP `inputSchema` and the evidence inputs. `graph` and `query` are both required.

**`graph` — the code-graph index**

| Field | Type | Notes |
|---|---|---|
| `graph.nodes[]` | array of objects | Node rows `{id (string), kind (string)}` — packages, modules, files, functions, classes, externals. Duplicate ids keep the first entry; entries without a string `id` are dropped. |
| `graph.edges[]` | array of objects | Edge rows `{from (string), to (string), kind (string)}` — typed edges (calls, references, contains, imports). Edges naming unknown nodes and exact duplicates are dropped. |

**`query` — the structural query**

| Field | Type | Notes |
|---|---|---|
| `query.intent` | string (enum) | One of `descendants`, `ancestors`, `blast_radius`, `path`, `stats`, `snapshot`. Anything else is rejected as an input error (HTTP 422) — never force-fit. |
| `query.target` | string | The node the query is about. Required except for `stats` / `snapshot`. |
| `query.target_b` | string | The second node, for `path` only. |
| `query.expand` | boolean | When `true`, traversal answers carry the full sorted node list; otherwise aggregate-first: counts and kind breakdowns only. |

**`index` — index freshness**

| Field | Type | Notes |
|---|---|---|
| `index.stale` | boolean | When `true`, the answer is `stale_index` and no structural answer is given — a stale index is never answered from. |

### Operations and result vocabulary (in place of checks)

This atom has no checks array and no evidence sections: nothing is audited, everything is computed. Its operations are the six `query.intent` values, routed deterministically:

| Operation (intent) | What it computes | Result shape |
|---|---|---|
| `descendants` | Every node reachable downstream from `target`, following typed edges forward. | `counts` (total + `by_kind`); `nodes` carries the full sorted list only when `expand` is true. |
| `ancestors` | Every node that can reach `target`, following typed edges backward. | Same aggregate-first shape as `descendants`. |
| `blast_radius` | The full failure footprint of `target`: nodes reachable upstream plus downstream of the target, the target itself excluded. | Same aggregate-first shape. |
| `path` | The shortest typed path from `target` to `target_b`. | `hops` carries each hop with its typed edge; `status` is `no_path` when both nodes exist but nothing connects them, `not_found` when either node is absent. |
| `stats` | Aggregate statistics over the whole submitted graph (no target required). | Counts over the graph as ingested (after the documented node/edge dropping rules). |
| `snapshot` | The whole graph, canonically sorted. | `snapshot` carries the full sorted graph. |

Recorded grounding: the full-pass run exercised `descendants` (status `ok`, counts total 1, `by_kind` function 1); the violations run exercised `path` to an absent node (status `not_found`). The remaining intents and statuses are as defined in SERVICE.md and USER-GUIDE.md; no recorded run in this battery exercised `ancestors`, `blast_radius`, `stats`, `snapshot`, `no_path`, or `stale_index` — see the evidence-gap note in the checklist below.

### Output format

HTTP 200 returns one JSON object:

| Field | Content |
|---|---|
| `service` | `"codebase-structural-query"` |
| `atom_version` | `"0.1.0" |
| `intent` | The query's intent, echoed |
| `target` / `target_b` | The queried node(s), echoed (`target_b` is `null` for non-`path` intents) |
| `status` | One of the result statuses below |
| `counts` | `{total, by_kind}` — aggregate-first counts for traversal intents |
| `nodes` | Full sorted node list when `expand` is true; empty in aggregate mode |
| `hops` | Typed path hops for `path`; empty otherwise |
| `snapshot` | The canonically sorted whole graph for `snapshot`; `null` otherwise |
| `summary` | One line stating the outcome |
| `stamp` | The same result as a plain-text block |

### Verdict vocabulary

This atom returns no verdict. Its result vocabulary is the `status` field — every value it can return:

- `ok` — the query was answered; `counts` (and, with `expand`, the sorted `nodes` / `hops`) carry the result.
- `not_found` — the target (or `target_b`) is not in the index.
- `no_path` — both nodes exist, but no path connects them.
- `stale_index` — `index.stale` was `true`; no structural answer is given from a stale index.

There are no section statuses and no per-check statuses for this atom, because there are no sections and no checks. Intent vocabulary: `descendants` / `ancestors` / `blast_radius` / `path` / `stats` / `snapshot` (see Operations above).

### Errors

Only the shapes evidenced in the repo and gateway documentation are given; no payload is invented. USER-GUIDE.md evidences the four statuses; the 422 bodies are the recorded ones.

| HTTP | Meaning | Body |
|---|---|---|
| 401 | Unauthenticated — key missing or invalid | No body shape is evidenced in the repo for this atom; treat the status itself as the signal and check the `Authorization: Bearer <key>` header. |
| 403 | Scope — the key is valid but lacks this atom's scope | No body shape is evidenced in the repo for this atom; issue this atom's scope on the key (`POST /v1/keys` with this atom) and retry. |
| 422 | `invalid_input` — `graph`/`query` missing or type-violating; rejected before computation | Recorded shapes: `{"ok": false, "error": "invalid_input", "field": "query", "detail": "query.intent must be a string"}` (malformed case) and `{"ok": false, "error": "invalid_input", "field": "query", "detail": "graph must be an object with nodes and edges"}` (sparse case). |
| 429 | Rate limit — per-key limit exceeded (see Rate limits) | No body shape is evidenced in the repo for this atom; back off and retry within the limits below. |

### Rate limits and pricing

- Rate limits (contract.yaml): 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing: pricing unit `query`; `pricing.rate` is `null` (rate status: pending — prices are set only from measured production cost per unit). **Free during trial — rate pending.**

## Explanation

Most codebase questions are structural — what does this module reach, what breaks if it changes, is there a path between these two nodes — and they are answerable from a code graph without reading code. This atom is the query half of that split: the caller (or their indexer) builds the graph once — “index once, query as data” — and the atom computes deterministic answers over the graph as submitted. Intent routing is exact: the six intents are the whole language, and an unknown intent is an input error, never a best guess. Output is aggregate-first (counts and kind breakdowns before lists) so large answers stay small unless the caller expands them, and every path hop carries its typed edge. Answers are domain-blind structure: no scoring, no opinions, no reading of the code behind the node ids.

**How the result is decided.** Purely computationally and deterministically: ingest applies the documented normalisation (duplicate node ids keep the first entry; nodes without a string id, edges naming unknown nodes, and exact duplicate edges are dropped), then the intent's traversal runs over the normalised graph. A stale index short-circuits everything — `index.stale: true` returns `stale_index` with no structural answer, because answering from a stale index would present old structure as current. Absence is reported, not papered over: a target outside the graph is `not_found`, and two present-but-unconnected nodes are `no_path` — distinct statuses, because the caller's next action differs (fix the id vs accept the disconnection). There is no missing-evidence semantics of the audit atoms: a submission without `graph` and `query` is not a partial answer, it is a 422.

**What it does not do.**

- It does not build the index: parsing code into a graph is the caller's indexer's job; the atom only queries the graph it is handed.
- It does not read, fetch, or verify source code, and it cannot detect that a submitted graph is wrong about the codebase — only that it is stale, if the caller declares it stale.
- It does not score, rank, or opine: no importance weights, no risk judgments, no recommendations — counts, lists, and typed paths only.
- It holds no state between calls: every call must carry the full graph.
- It sells the deliverable (the computed answer) — never the underlying codebase-intelligence knowledge itself.

**Buyer and use context.** Teams and agents working in “Engineering & code” who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves (first buyer hypothesis from the register; not yet market-tested). House self-use: codetopo structural codebase questions — Wright is an internal caller (zero price, metered to the internal cost ledger). One unit of sale = one query (the delivered answer).

## Role views

### For integrators (Users)

You integrate one call: obtain a key, POST the `{graph, query, index}` object to the REST endpoint (or call the MCP tool `codebase_structural_query`), and branch on `status`: `ok` = consume `counts`/`nodes`/`hops`/`snapshot`; `not_found` = fix the node id; `no_path` = the graph genuinely disconnects the pair; `stale_index` = re-export and resubmit. Default to `expand: false` and expand only when a list is actually needed — aggregate answers are the cheap, cacheable form. Handle 422 as a client bug (the `detail` names it), 401/403 as key problems, and 429 by backing off. The call is stateless and deterministic, so caching an answer for an unchanged graph + query is sound.

### For developers

Authoring: your indexer owns graph quality — node ids must be stable strings, edge kinds typed, and `index.stale` must honestly reflect export freshness, because the atom trusts the graph completely. Implementation pointers: `src/codebase_structural_query.py` — `evaluate(query) -> result dict`; CLI prints JSON + stamp. Tests: `tests/test_codebase_structural_query.py — 17 tests, all passing 2026-11-15`. Determinism is contractual: canonical sorting everywhere, no randomness, no clock, no external calls — the recorded battery's byte-identical repeat and MCP/REST parity results (TEST-REPORT.md) are the regression bar. Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/codebase-structural-query`, MCP `POST /mcp/codebase-structural-query` (tool `codebase_structural_query`) on gateway `https://atoms.pipavia.com` (recorded gateway version 1.1.0). Key scope: per user, per atom — a 403 means the key lacks this atom's scope, a 401 means missing/invalid key. Rate limits: 60/min and 10,000/day per key; watch 429s as the capacity signal. Error monitoring: 422s indicate client submission bugs (the body names the fault in `detail`); `stale_index` and `not_found` rates are client data-quality signals, not atom faults. Payload size is the operational variable: every call carries the full graph. Status: live — release candidate (one-week RC soak to 2026-11-22); verification state PASS on the recorded battery (TEST-REPORT.md; `verification/results/codebase-structural-query.json`). Pricing is not yet metered for revenue: rate pending, free during trial.

## Worked examples

Provenance: recorded 2026-11-15T23:49:58.778183+00:00 against gateway v1.1.0, external verification lane, source `verification/work/codebase-structural-query/evidence.json`. Inputs are each case's recorded `input`; responses are the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — mechanically verified after writing).

### Example 1 — Full-pass (case `full-pass`, HTTP 200)

Input:

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

Response (REST):

```json
{
  "service": "codebase-structural-query",
  "atom_version": "0.1.0",
  "intent": "descendants",
  "target": "A",
  "target_b": null,
  "status": "ok",
  "counts": {
    "total": 1,
    "by_kind": {
      "function": 1
    }
  },
  "nodes": [],
  "hops": [],
  "snapshot": null,
  "summary": "descendants of A: 1 node(s).",
  "stamp": "CODEBASE STRUCTURAL QUERY\nintent: descendants  target: A\nSTATUS: ok\ndescendants of A: 1 node(s)."
}
```

### Example 2 — Violations (case `violations`, HTTP 200)

Input:

```json
{
  "graph": {
    "nodes": [
      {
        "id": "A",
        "kind": "module"
      }
    ],
    "edges": []
  },
  "query": {
    "intent": "path",
    "target": "A",
    "target_b": "NON_EXISTENT",
    "expand": false
  },
  "index": {
    "stale": false
  }
}
```

Response (REST):

```json
{
  "service": "codebase-structural-query",
  "atom_version": "0.1.0",
  "intent": "path",
  "target": "A",
  "target_b": "NON_EXISTENT",
  "status": "not_found",
  "counts": {
    "total": 0,
    "by_kind": {}
  },
  "nodes": [],
  "hops": [],
  "snapshot": null,
  "summary": "Target node not in the index.",
  "stamp": "CODEBASE STRUCTURAL QUERY\nintent: path  target: A\nSTATUS: not_found\nTarget node not in the index."
}
```

### Example 3 — Malformed (case `malformed`, HTTP 422)

Input:

```json
{
  "graph": "not_an_object",
  "query": {
    "intent": 123,
    "expand": "yes"
  }
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "query",
  "detail": "query.intent must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference, Explanation sections above |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; Developers Yes; Ops Yes; Regulators N/A — The atom computes structural answers over a submitted code graph; its result is not compliance or audit evidence and the domain is not regulated. |
| Checks named: documented vs recorded | N/A — computed query atom: no `checks` array exists in any recorded response (0 recorded); in its place all 6 operations (intents) and all 4 result statuses are enumerated |
| Verdict vocabulary complete | Yes — no verdict exists; all 4 result statuses (`ok` / `not_found` / `no_path` / `stale_index`) and all 6 intents listed |
| Input reference typed | Yes — 7 fields with types from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations, malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/codebase-structural-query/evidence.json` |

Evidence gaps named: the recorded battery exercised only intents `descendants` (full-pass) and `path` (violations), and only statuses `ok` and `not_found` in HTTP-200 responses; `ancestors`, `blast_radius`, `stats`, `snapshot`, `no_path` and `stale_index` are documented from SERVICE.md + USER-GUIDE.md definitions, not from recorded runs in this battery. The recorded sparse case (no `graph`) is an additional 422 shape, reproduced in the Errors section.

