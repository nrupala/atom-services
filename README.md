# atom-services

**Conceived by Nrupal Akolkar · Built by Muse (Arjun/Wright).**

One collective repo for all product atoms. An **atom** is a small,
independent service that delivers one bounded judgment artifact — a
VERDICT, a CHECK, a MAP, a STAMP, a REPORT — over API / MCP / agent /
human endpoints, paid per unit delivered. Atoms never sell the
underlying knowledge; they sell the artifact the knowledge produces.

## The model in plain words

- **Independent atoms, one home.** Every atom is its own named service
  unit in `services/<service-name>/`, with its own endpoints, its own
  payment plan, and its own growth / retention / maintenance docs.
  Atoms are **never merged into existing product repos** — this repo
  is their only home. Shared rails live once at the repo root
  (`rails/`), not inside any product.
- **The rail is Conduit.** Atoms are listed and discovered through
  Conduit (the owner's connector marketplace, live since 2026-11-12)
  and served as key-gated MCP/API endpoints in Conduit's shape. Where
  Conduit lacks a piece atoms need, the gap is named in `rails/` and
  in `BUILD-LOG.md` — never papered over.
- **One by one.** Atoms release one by one (or bundle by bundle), in
  the approved queue order — never the whole register at once.
  Release #1 is `release-readiness-verdict`.
- **Volume pricing doctrine.** Cheap per unit, millions of units.
  The earning lever is refinement — narrower, sharper services get
  called more — not price height. Every price must clear the atom's
  *measured* production cost; until cost is measured, atoms carry a
  pricing **unit** only and no price.
- **One Stripe account** (2351485 ALBERTA INC., public name AIMLDS)
  settles everything. Settlement is aggregated — prepaid balance /
  packs drawn down per unit — never a card charge per call.

## Layout

```
registry/    The authoritative register (register.yaml + ATOMS-REGISTER.md,
             copied unchanged) + PUBLIC-LIST.md (generated).
rails/       serving.md · billing.md · docs-standard.md · contracts.md —
             how every atom in this repo is served, metered, billed,
             documented, and contracted. SPEC marks what is not built yet.
services/    One directory per PUBLIC atom (162), generated from the
             register by tools/generate.py. Each unit: SERVICE.md,
             contract.yaml, growth.md, retention.md, maintenance.md.
tools/       generate.py — regenerates registry/PUBLIC-LIST.md and all
             service scaffolds from registry/register.yaml.
SKILL.md     Agent onboarding for the fleet (discovery, key flow,
             verdicts, error shapes) — served verbatim at
             atoms.pipavia.com/SKILL.md.
BUILD-LOG.md What was built, verified counts, test evidence, named gaps.
CHARTER.md   The binding rules of this repo (read before changing anything).
```

## The public cut

255 candidates were screened. **Public = Tier A (48) + Tier B (114) =
162.** Tier C (34, personal/internal), Tier D (40, held) and
FAIL-self-use (19, not services) get **no service units** — they exist
in `registry/` only, marked non-public with reasons
(`registry/PUBLIC-LIST.md`).

## Status

Scaffold + atom #1's deterministic core are built and tested locally.
**Nothing in this repo is deployed or live.** Atom #1's remaining road
to live on Conduit is listed in `BUILD-LOG.md`.
