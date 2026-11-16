# Semantic code taint analysis report — `semantic-code-taint-analysis-report`

**Deliverable type:** REPORT. This atom sells the report it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Understand code meaning — ASTs, call/flow graphs, structural search, taint basics, refactor safety.

A caller submits the inputs the bound skill works on and receives one report back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this report on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Codetopo-style codebase impact reviews**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the declared code graph manifest

The caller submits one JSON manifest: a **declared** code graph, as
exported by their own analyser. This atom computes over the submitted
graph only; it never parses, fetches, or executes code.

| Field | Meaning |
|---|---|
| `graph.nodes[]` | `{id (string), role, kind (string)}` — `role` is one of `source` (untrusted input), `sink` (sensitive operation; `kind` names it, e.g. `exec`, `sql`, `html`), `sanitizer` (cleans data flowing through it), or `transform` (any other step; the default for a missing/invalid role). Duplicate ids keep the first entry; entries without a string id are dropped. |
| `graph.edges[]` | `{from, to, kind}` — directed data-flow edges. Edges naming unknown nodes and exact duplicates are dropped; edges are canonically sorted. |

For every (source, sink) pair, in sorted order, the atom finds the
shortest directed path. A pair is **tainted** when a path exists that
passes through no sanitizer (the shortest sanitizer-free path is the
finding, reported with its hops — the skill's "source → sink with
paths" gate, and its rule that untrusted input reaching exec/SQL/HTML
is a finding); **sanitized** when every path passes through at least
one sanitizer (shortest path + sanitizers on it are reported); and
**unreachable** when no path exists. Severity is a fixed table on the
sink kind (lower-cased): `exec` → `critical`, `sql` → `high`,
`html` → `high`, any other kind → `medium`, reported on tainted
findings only.

The verdict is one of `TAINTED` (at least one tainted pair), `CLEAN`
(at least one source and one sink declared, no tainted pair), or
`INSUFFICIENT_EVIDENCE` (no source declared, or no sink declared —
including an empty graph — so taint cannot be ruled in or out).

**Serialization rule:** all computed quantities are integers (counts
and path lengths) or strings; no floats are produced, and all lists
are canonically sorted, so the Python oracle and the TypeScript port
serialize the report byte-identically.

**Honest scoping / named exclusions:** only the declared graph is
analysed — code is never parsed or fetched, and no AST, call graph,
or source text is read. Dynamic dispatch, reflection, implicit flows,
and any flow the caller's exporter did not declare as an edge are out
of scope and cannot be found. A sanitizer is trusted exactly as
declared: the atom does not judge whether a declared sanitizer is
correct or sufficient for a given sink. No severity judgment beyond
the fixed sink-kind table, no scoring, and no remediation advice is
produced.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Named doubt (from the register)

Codetopo-adjacent; separable as analysis report
