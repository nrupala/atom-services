<!-- HAND-BUILT: built out in full for release slot #1. The generator never overwrites this file. -->
# Maintenance — release-readiness-verdict

**Bound skill (R1):** `release-management` v1 at
`workspace/mymilo-build/skills/release-management/SKILL.md`. The skill
is the source of the capability; this atom is a service face of it,
never a fork. Knowledge atom #13 supplies the five-bar frame
(control / understanding / management / lifecycle / stability).

**Refinement loop:** a gap found in service → issue in this repo
tagged `skill-feedback` → fix lands in the SKILL first → atom
re-deploys from the refined skill → regression must pass before the
atom version bumps. A skill-side refinement marks this atom **stale**
until re-verified.

**Status:** built locally 2026-11-15 (deterministic core + key
reference implementation + tests + listing package). No endpoint
live; nothing deployed.

## Test record

- 2026-11-15 — `python3 -m unittest discover -s tests` in this unit:
  **16 tests, all passing** (11 verdict tests: ready / not-ready /
  insufficient-evidence paths, semver, moved-tag red line, breaking
  change with and without migration steps, health window, empty
  manifest, stamp, type rejection; 5 key tests: deterministic
  derivation, per-atom scope, verify roundtrip + tamper, revocation,
  fingerprint).
- 2026-11-15 — CLI smoke: `src/release_readiness.py` on a complete
  2.0.0 manifest with a breaking change + migration steps →
  `VERDICT: READY`, 19 pass / 0 fail / 0 missing, exit 0.

## Production-cost measurement (pricing protocol step 1)

- 2026-11-15 — `python3 src/bench.py 20000`: verdict compute
  **0.1166 ms/call**, key derivation **0.0122 ms/call**, ~8,574
  calls/sec single core, **0 LLM tokens, 0 network calls**. Marginal
  compute cost ≈ zero; hosted marginal cost (platform per-request
  charge) is unmeasured until deployment. Rate stays `pending` —
  see `contract.yaml` and `rails/billing.md`.

**Named doubt to watch:** Guardian Mesh adjacency; benches still
unbuilt. The atom judges submitted evidence; it does not run probes.
