# Charter — atom-services

Binding rules for this repo. Set by the owner (Nrupal Akolkar) on
2026-10-18 and 2026-11-15. A change that breaks a rule here needs the
owner's word first.

## 1. Independence

- Atoms are independent services. They are **never merged into
  existing product repos** (not into Conduit, not into codetopo, not
  into any product). This repo is their home; Conduit is their
  storefront and rail, not their owner.
- Each atom is its own service unit: own name, own endpoints, own
  architecture where it needs one, own payment plan. Bundling happens
  only as optional packs at selling time, never as merged code or
  merged fate.

## 2. What an atom sells

- A bounded artifact: a VERDICT, CHECK, MAP, STAMP, REPORT or
  DELIVERABLE — never the underlying knowledge, never a copyable
  prompt wrapper standing alone (Tier B sells in packs for exactly
  this reason), never Milo itself (Milo is the owner's personal
  assistant and is never sold).

## 3. The three binding design requirements

- **R1 — Bidirectional refinement loop.** Every atom is bound to its
  underlying skill (`contract.yaml` records skill name, path,
  version). Fixes land in the SKILL first; the atom re-deploys from
  the refined skill and must pass regression before its version
  bumps. A skill refinement marks the bound atom **stale** until
  re-verified. There is never a second, divergent copy of a
  capability living only in atom-land.
- **R2 — Wright is an internal caller.** The rails carry an internal
  call path: same service, same contract, internal key, zero price,
  metered to an internal cost ledger. Our own usage is each atom's
  first uptake evidence and feeds its production-cost record.
- **R3 — Self-use test.** An atom ships only if we call it ourselves,
  or credibly would, in a named real workflow. The register records
  the workflow. Self-use is necessary, not sufficient.

## 4. Money

- One Stripe account: 2351485 ALBERTA INC. (public name AIMLDS).
- Pricing unit fits the atom's cost shape (per call / per deliverable
  / per query / per 1M tokens). **No price without measured
  production cost.** The register carries units only.
- Settlement is aggregated (prepaid balance / packs drawn down).
  Never a card charge per call.
- Trial is the discount: free units first, full service, refill at
  the posted price.
- No Google fabric anywhere in any atom surface.

## 5. Releases

- One by one, or bundle by bundle, in the approved queue order.
  Queue head: (1) release-readiness-verdict, (2) assumption-audit,
  (3) provenance-stamper, (4) codebase-graph-analysis +
  codebase-structural-query, (5) study-clause-check,
  (6) calculation-rederivation.
- Bundles form around proven singles, never before.
- Each atom reads its uptake at 30/60/90 days; below its cost floor
  at 90 days it is refined, repriced from measured cost, or retired —
  per-atom, never averaged.
- Nothing lists, sells, or deploys without the owner's GO per wave,
  and no atom is called "live" until its effect is verified on the
  live surface.

## 6. The public cut

- Public: Tier A + Tier B (162). Tier C stays personal. Tier D
  returns only by the owner's word after screening. FAIL-self-use
  entries are not services and never become units.
- The register (`registry/register.yaml`) is authoritative. Change
  the register, re-run `tools/generate.py`, commit both together.

## 7. Governing processes

This program is governed by the house delivery processes, bound here
by name (owner ruling 2026-11-15 20:40 MST):

- `corporate/processes/product-documentation.md` — including
  checklist row **N-10** (user guides follow the AppDoc Studio
  methodology; worked examples are real recorded runs).
- `corporate/processes/product-release.md` — including checklist
  row **R-18** (each service unit behind the shared gateway carries
  its own gate verdict, documentation lines, and Guardian Mesh
  disposition; a gateway-level or batch-level verdict does not cover
  its units).
- `corporate/processes/gate-before-deploy.md`.
- The release-gate skill
  (`~/workspace/custom-skills/local-release-gate/SKILL.md`).
- The AppDoc Studio methodology for all user documentation.

Per-atom completion lines — **batch-blocking**:

- (a) **Documentation:** an N-10 documentation pass for the atom.
- (b) **Gate:** the atom's own recorded release-gate verdict and
  evidence pack. External UAT (Gemini/DeepSeek verification) is
  evidence input to the gate, never the verdict.
- (c) **Guardian Mesh:** the atom's own GM disposition — probes run
  with results filed, or the gate's Spec Inputs filed with the leg
  marked NOT RUN.

**Completion rule:** no batch counts complete with an OPEN or
NOT RUN line in any atom's documentation, gate, or Guardian Mesh
rows, unless that line is WAIVED on record with a reason. Batch
readiness is reported as counts — PROVEN / OPEN / WAIVED / NOT
RUN — never as narrative alone.

Root cause, recorded once: this program was stood up under a
charter that never bound the house delivery processes, so
lane-local checks (builder tests, external UAT) silently stood in
for them. The processes existed; the charter omitted them. This
section is the fix.
