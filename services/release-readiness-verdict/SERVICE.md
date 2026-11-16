<!-- HAND-BUILT: built out in full for release slot #1. The generator never overwrites this file. -->
# Release-readiness verdict — `release-readiness-verdict`

**Deliverable type:** VERDICT. This atom sells one verdict — is this
release ready, and on what evidence — never the release-management
knowledge it is built from.

**Queue position:** #1 in the approved release queue (owner,
2026-10-18). **Tier A.** Bound to knowledge atom #13 and the
`release-management` skill (R1).

## What it delivers

A caller submits a **release-evidence manifest** (below) describing a
release they are about to ship. The atom probes the five release bars
from knowledge atom #13 — **control, understanding, management,
lifecycle, stability** — across 19 deterministic checks drawn from
the bound skill's method, quality gates, and red lines, and returns
one verdict:

- `READY` — every check passes.
- `NOT_READY` — at least one check fails (a bar is breached).
- `INSUFFICIENT_EVIDENCE` — nothing fails, but evidence is missing;
  the verdict names exactly which evidence.

The core is deterministic: no model call, no network, same manifest →
same verdict. That determinism is the product — a gate that gives a
different answer on a re-run is not a gate.

## Inputs — the release-evidence manifest

| Field | Read by |
|---|---|
| `product`, `version` (semver) | control |
| `version_bump_locations` (list; must name exactly one place) | control |
| `tag.name` (= `v<version>`), `tag.annotated`, `tag.moved` | control |
| `changelog.has_entry_for_version`, `changelog.unreleased_section_moved` | understanding |
| `release_notes.present`, `release_notes.breaking_changes`, `release_notes.migration_steps` | understanding |
| `approver` (named human), `approval.hitl_recorded` | management |
| `rollout_plan.present` | management |
| `rollback_plan.present`, `rollback_plan.testable` | lifecycle |
| `health_check.window_hours` (must be 24–48) | lifecycle |
| `artifacts.sealed`, `artifacts.checksum_manifest`, `artifacts.verified_before_announcement` | stability |
| `tests.passing` | stability |

A field **absent** = evidence missing. A field present but false /
invalid = the bar fails. The distinction is deliberate: "you didn't
show me" and "you showed me and it's wrong" are different verdicts.

## Output — the verdict format

```json
{
  "service": "release-readiness-verdict",
  "atom_version": "0.1.0",
  "product": "...", "version": "...",
  "verdict": "READY | NOT_READY | INSUFFICIENT_EVIDENCE",
  "bars": {"control": "pass|fail|insufficient_evidence", "...": "..."},
  "checks": [{"bar": "...", "check": "...", "status": "pass|fail|missing", "evidence": "..."}],
  "summary": "19 pass, 0 fail, 0 missing of 19 checks across five bars."
}
```

Plus a human-readable stamp (`stamp()` in the implementation).

## Buyer

Teams and agents who ship software and need a release gate that is
not their own optimism: CI pipelines, release managers, agent
workflows that must not ship unsealed or un-rollback-able releases.
We are the first buyer — our own release-gate program is the
prototype (self-use workflow: **release gates run on every
product**).

## Endpoints (when live — none are yet)

MCP tool + `POST /v1/release-readiness-verdict`, gated by this atom's
own key (namespace `release_readiness_verdict`). Human face: the
listing page's try-it form. Serving shape: `rails/serving.md`.

## Pricing

Unit: **per call**. Rate: **pending** under the pricing protocol
(`rails/billing.md`) — measured compute is 0.1166 ms/call with zero
tokens (see `maintenance.md`); the consensus step ran 2026-11-15 and
split (Gemini $0.0005/call, DeepSeek $0.01/call, OpenAI lane
blocked), which is not a consensus; and the prompt-rate fallback is
$0 for a zero-token atom. No rate is published until the protocol
honestly produces one. Review record: `reviews/README.md`.

## Named doubt (from the register)

Guardian Mesh adjacency; benches still unbuilt. This atom judges
readiness from submitted evidence; it does not itself run Guardian
Mesh probes — a manifest that lies produces a verdict on the lie,
which is why the output carries the evidence per check.
