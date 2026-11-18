# Codetopo Profile — Atom Services (nrupala/atom-services)

**What this is.** The agent-facing map of this repository, generated with
Codetopo 0.9.1 (local engine) — topology, trust boundaries, money
surface — with the graph snapshot held in the run record (see the note
under Regeneration) and `stats.json` beside this file as the measured
summary.

- **Repo:** nrupala/atom-services (public)
- **Commit profiled:** `20ce38d47d36e686acf2d8e8ff1fc1e00714eb0b` (main)
- **Engine:** codetopo 0.9.1 · index run 2026-11-18
- **Graph:** 2,121 files walked · 22,035 nodes · 128,240 edges · audit chain valid
- **Nodes by kind:** function 4,713 · method 5,519 · class 463 · interface 494 · variable 2,560 · module 2,121 · file 2,121 · doc 1,476 · external 2,566 · package 2
- **Edges by kind:** calls 44,631 · reads 37,983 · contains 19,467 · defines 14,642 · imports 2,859 · writes 8,649 · implements 2 · inherits 7

## Coverage honesty

Extracted at symbol level: TypeScript/JavaScript and Python — the
atoms' worker code and tooling — plus 1,476 Markdown files as Doc nodes
(the collective's contracts, censuses and verification records).
Not parsed: YAML/TOML/wrangler config and SQL. This is the largest
graph in the estate sweep; per-atom detail lives in each atom's own
directory docs.

## Topology

One collective repo for the Conduit Atoms — deterministic skill-atoms
served per API call on Conduit rails (atoms.pipavia.com):

- `services/` — **165 atom service directories**, each its own service
  unit with contract, docs, an oracle-proven core and external
  verification (e.g. `agent-safety-guardrail-audit`,
  `agent-context-packaging`, `append-only-ledger-design-audit`).
- `rails/` — the serving rails: `gateway/` (the gateway that fronts
  every atom call), `billing.md`, `contracts.md`, `serving.md`,
  `docs-standard.md` — the rules every atom ships under.
- `registry/` — the atom registry (what exists, at what version).
- `verification/` + `reviews/` — the external-verification records and
  review evidence; `VERIFICATION-INDEX.md` at the root indexes them.
- `tools/` — census, screening and replication tooling (see
  `REPLICATION-CENSUS.md`, `REPLICATION-LOG.md` at the root).

## Trust boundaries

- **Per-call key auth at the gateway:** atoms are served only through
  the gateway rail; each call is key-authenticated and metered (the
  Codetopo hosted pattern: keys by name, delivered once, never in this
  repo).
- **Determinism as the trust claim:** an atom's core is oracle-proven —
  the same input yields the same output, verified externally and
  recorded in `verification/`; an atom that cannot be proven does not
  ship (the census follow-ups at the root record takedowns).
- **No model in the atom:** atoms are deterministic services; calling
  agents supply the model. Indexed content is parsed, never executed,
  by the profiler.
- **Blast radius:** the gateway rail and the shared contracts
  (`rails/contracts.md`, `rails/serving.md`) — a rail change touches
  all 165 atoms at once (44,631 call edges concentrate there).

## Money surface

Atoms are **sold per API call**: the gateway meters accepted calls
against the caller's key and tier, and `rails/billing.md` is the
billing contract for the collective. Payment itself (checkout,
subscriptions) runs through the same Stripe rails as the other AIMLDS
surfaces — no card data and no payment credentials live in this repo;
keys and secrets are referenced by name only.

## How an agent should approach

1. Read `CHARTER.md`, `rails/contracts.md` and `rails/serving.md`
   before touching any atom; then the atom's own directory docs.
2. Read `VERIFICATION-INDEX.md` before claiming an atom is proven.
3. Query the graph per atom directory (the snapshot is indexed by
   file path) rather than reading the whole collective.
4. Regenerate this profile at every release.

## Regeneration

`docs/codetopo-profile/refresh.sh` (in this pack) re-runs the index and
rewrites the pack files. **Snapshot note:** this repo's snapshot.json
is ~50 MB at this commit — too large to be a useful in-repo artifact,
so the full snapshot is held in the program run record
(`~/workspace/codetopo-work/PROFILES-GM-GATE-2026-11-18/packs/atom-services/`)
and this pack carries `stats.json` + `verify.txt`; refresh.sh
regenerates the full snapshot locally on demand.

## Standing-condition lines for this change

- Documentation at par: this pack is the documentation change, same PR;
  no behaviour changed.
- Release gate: NOT RUN for this profile PR · Guardian Mesh approval:
  NOT RUN. Merging is not "shipped"; the pack enters the gate queue in
  the Stage-1 evidence pack.
- OpenSSF Best Practices: project 16859 — **In Progress at 91%**
  (checked 2026-11-18); the dynamic-analysis fuzz harness is the known
  path to Passing and a standing priority of the gate program. This
  additive docs change does not degrade any criterion.
