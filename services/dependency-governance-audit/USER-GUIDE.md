# Dependency governance audit — user guide

## What it does

You ship software built on third-party dependencies. This atom reads a short evidence manifest describing how those dependencies are governed — justification, verified sources, pinning, audit and updates, licences, and SBOM — and returns one deterministic verdict across six sections with per-check evidence. All fields are booleans unless noted: **GOVERNED**, **NOT_GOVERNED**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Same manifest in → same verdict out;
it is built to be used as a gate. A field **absent** = evidence missing
(counts toward INSUFFICIENT_EVIDENCE). A field present but
false/invalid = the check fails (counts toward NOT_GOVERNED).

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "dependency-governance-audit"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/dependency-governance-audit`
  — tool name `dependency_governance_audit`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/dependency-governance-audit`
  — body = the manifest object; same `Authorization` header.

## Input — the evidence manifest

| Field | Meaning |
|---|---|
| `project` | project name (string); carried into the output, not itself checked |
| `justification.recorded`, `.alternatives_considered` | why each dependency exists |
| `sources.all_official`, `.publisher_signing_checked`, `.binaries_present`, `.binary_checksums_verified` | verified sources; checksums checked only when binaries are present |
| `pinning.exact_versions`, `.lockfile_committed`, `.lockfile_updated_in_same_change`, `.ci_installs_from_lockfile`, `.ci_actions_images_pinned_to_hashes` | pinning and lockfile discipline |
| `audit.automated_in_workflow`, `.bot_bumps_reviewed`, `.automerge_without_green_suite` | audit; automerge without a green suite must be `false` |
| `updates.batched`, `.stale_dependencies_flagged`, `.unused_retired` | update hygiene |
| `licences.checked`, `.non_permissive_present`, `.human_decision_recorded`, `.notice_required`, `.notice_updated` | licence checks; a recorded human decision is required when a non-permissive licence is present |
| `sbom.generated_per_release`, `.kept_with_artifacts` | SBOM produced per release and kept with the artifacts |

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/dependency-governance-audit`:

```json
{
 "project": "test-project",
 "justification": {
  "recorded": true,
  "alternatives_considered": true
 },
 "sources": {
  "all_official": true,
  "publisher_signing_checked": true,
  "binaries_present": true,
  "binary_checksums_verified": true
 },
 "pinning": {
  "exact_versions": true,
  "lockfile_committed": true,
  "lockfile_updated_in_same_change": true,
  "ci_installs_from_lockfile": true,
  "ci_actions_images_pinned_to_hashes": true
 },
 "audit": {
  "automated_in_workflow": true,
  "bot_bumps_reviewed": true,
  "automerge_without_green_suite": false
 },
 "updates": {
  "batched": true,
  "stale_dependencies_flagged": true,
  "unused_retired": true
 },
 "licences": {
  "checked": true,
  "non_permissive_present": true,
  "human_decision_recorded": true,
  "notice_required": true,
  "notice_updated": true
 },
 "sbom": {
  "generated_per_release": true,
  "kept_with_artifacts": true
 }
}
```

Response — HTTP 200 (trimmed; the full response carries all 21 checks
and a text stamp of the verdict):

```json
{
 "service": "dependency-governance-audit",
 "atom_version": "0.1.0",
 "project": "test-project",
 "verdict": "GOVERNED",
 "sections": {
  "justification": "pass",
  "verified_sources": "pass",
  "pinning": "pass",
  "audit_and_updates": "pass",
  "licences": "pass",
  "sbom": "pass"
 },
 "summary": "21 pass, 0 fail, 0 missing of 21 checks across six sections."
}
```

## Verdicts

- **GOVERNED** — every check passes; dependency governance clears all six sections.
- **NOT_GOVERNED** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
