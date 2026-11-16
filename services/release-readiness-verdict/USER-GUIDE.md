# Release-readiness verdict — user guide

## What it does

You are about to ship a release. This atom reads a short evidence
manifest describing the release — version, tag, changelog, approvals,
rollout and rollback plans, health-check window, sealed artifacts,
passing tests — and returns one deterministic verdict across five
release bars (control, understanding, management, lifecycle,
stability) with per-check evidence: **READY**, **NOT_READY**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Same manifest in → same verdict out;
it is built to be used as a release gate.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "release-readiness-verdict"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/release-readiness-verdict`
  — tool name `release_readiness_verdict`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/release-readiness-verdict`
  — body = the manifest object; same `Authorization` header.

## Input — the release-evidence manifest

| Field | Meaning |
|---|---|
| `product`, `version` | product name; semver version |
| `version_bump_locations` | list; must name exactly one place |
| `tag.name` / `tag.annotated` / `tag.moved` | tag must be `v<version>`, annotated, never moved |
| `changelog.has_entry_for_version`, `changelog.unreleased_section_moved` | changelog state |
| `release_notes.present`, `release_notes.breaking_changes`, `release_notes.migration_steps` | user-facing notes |
| `approver`, `approval.hitl_recorded` | a named human approved, on record |
| `rollout_plan.present` | rollout plan exists |
| `rollback_plan.present`, `rollback_plan.testable` | rollback written and testable |
| `health_check.window_hours` | post-release health window, 24–48 |
| `artifacts.sealed`, `artifacts.checksum_manifest`, `artifacts.verified_before_announcement` | artifact provenance |
| `tests.passing` | the guarding suite is green |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = the bar
fails (counts toward NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/release-readiness-verdict`:

```json
{
  "product": "milo-core",
  "version": "1.2.3",
  "version_bump_locations": ["src/version.py"],
  "tag": {"name": "v1.2.3", "annotated": true, "moved": false},
  "changelog": {"has_entry_for_version": true, "unreleased_section_moved": true},
  "release_notes": {"present": true, "breaking_changes": false, "migration_steps": "none"},
  "approver": "jane.doe",
  "approval": {"hitl_recorded": true},
  "rollout_plan": {"present": true},
  "rollback_plan": {"present": true, "testable": true},
  "health_check": {"window_hours": 24},
  "artifacts": {"sealed": true, "checksum_manifest": true, "verified_before_announcement": true},
  "tests": {"passing": true}
}
```

Response — HTTP 200 (trimmed; the full response carries all 19 checks
and a text stamp of the verdict):

```json
{
  "service": "release-readiness-verdict",
  "atom_version": "0.1.0",
  "product": "milo-core",
  "version": "1.2.3",
  "verdict": "READY",
  "bars": {"control": "pass", "understanding": "pass", "management": "pass", "lifecycle": "pass", "stability": "pass"},
  "summary": "19 pass, 0 fail, 0 missing of 19 checks across five bars."
}
```

## Verdicts

- **READY** — every check passes; the release clears all five bars.
- **NOT_READY** — at least one check fails; the failing checks name the
  breached bar and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing;
  the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
