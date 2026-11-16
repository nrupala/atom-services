# Maintenance — structured-decision-making

**Bound skill (R1):** `decision-making` v1 at `workspace/mymilo-build/skills/decision-making/SKILL.md`. The skill is the source of the capability; this atom is a service face of it, never a fork.

**Refinement loop:** a gap found in service → issue in this repo tagged `skill-feedback` → fix lands in the SKILL first → atom re-deploys from the refined skill → regression must pass before the atom version bumps. A skill-side refinement marks this atom **stale** until re-verified.

**Status:** scaffolded 2026-11-15 from the register. No endpoint live; no production cost measured yet (T4 estimable only).
**Test record:** none yet — tests are written when the atom is built out for its release slot in the queue.
