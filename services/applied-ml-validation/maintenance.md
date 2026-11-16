# Maintenance — applied-ml-validation

**Bound skill (R1):** `applied-machine-learning` v1 at `workspace/mymilo-build/skills/applied-machine-learning/SKILL.md`. The skill is the source of the capability; this atom is a service face of it, never a fork.

**Refinement loop:** a gap found in service → issue in this repo tagged `skill-feedback` → fix lands in the SKILL first → atom re-deploys from the refined skill → regression must pass before the atom version bumps. A skill-side refinement marks this atom **stale** until re-verified.

**Status:** scaffolded 2026-11-15 from the register. No endpoint live; no production cost measured yet (T4 estimable only).
**Named doubt to watch:** Overlaps ai-ml-ds-engineer

**Test record:** none yet — tests are written when the atom is built out for its release slot in the queue.
