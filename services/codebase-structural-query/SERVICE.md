# Codebase structural query — `codebase-structural-query`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Index once, query as data — how to answer structural codebase questions from a code graph. Deterministic intent routing, aggregate-first output, domain-blind analysis.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one query.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **codetopo structural codebase questions**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **query**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the graph index and the query

The caller submits one JSON object: a code-graph index (as exported
by their indexer) and one structural query. This atom computes over
the submitted graph; it does not audit declared evidence.

| Field | Meaning |
|---|---|
| `graph.nodes[]` | `{id (string), kind (string)}` — packages, modules, files, functions, classes, externals. Duplicate ids keep the first entry; entries without a string id are dropped. |
| `graph.edges[]` | `{from, to, kind}` — typed edges (calls, references, contains, imports). Edges naming unknown nodes and exact duplicates are dropped. |
| `query.intent` | One of `descendants`, `ancestors`, `blast_radius`, `path`, `stats`, `snapshot` (the skill's routing table). Anything else is rejected as an input error — never force-fit. |
| `query.target` | The node the query is about (required except for `stats` / `snapshot`). |
| `query.target_b` | The second node, for `path` only. |
| `query.expand` | When true, traversal answers carry the full sorted node list; otherwise aggregate-first: counts and kind breakdowns only. |
| `index.stale` | When true, the answer is `stale_index` and no structural answer is given — a stale index is never answered from. |

Answers are domain-blind structure: counts before lists, typed edges
in every path hop, no scoring or opinions. Result `status` is one of
`ok`, `not_found` (target not in the index), `no_path`, or
`stale_index`. `blast_radius` is the full failure footprint: nodes
reachable upstream plus downstream of the target (the target itself
excluded). `snapshot` returns the whole graph canonically sorted.

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
