# Link-rot scan and notarized archive — user guide

## What it does

You publish pages whose links and citations must stay provable. This atom reads a short evidence manifest describing your link-integrity practice — scheduled rot scans, WARC/SingleFile archive captures taken at cite time, canonicalization, notarization (SHA-256 hashes with timestamps from a real RFC 3161 TSA or transparency log), honest serving of archived copies, and logged repairs — and returns one deterministic verdict across six sections with per-check evidence: **LINK_INTEGRITY_SOUND**, **LINK_INTEGRITY_UNSOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "link-rot-scan-and-notarized-archive"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/link-rot-scan-and-notarized-archive`
  — tool name `link_rot_scan_and_notarized_archive`; `tools/call` arguments = the input object below.
- **REST:** `POST https://atoms.pipavia.com/v1/link-rot-scan-and-notarized-archive`
  — body = the input object; same `Authorization` header.

## Input

The full field table lives in the atom's `SERVICE.md`; the fields are:

| Field |
|---|
| `scan.scans_scheduled` |
| `scan.scan_records_status` |
| `scan.scan_records_content_hash` |
| `scan.dashboard_lists_rot_with_owners` |
| `scan.last_scan_within_cadence` |
| `links[].capture_at_cite_time` |
| `links[].notarized` |
| `archive.capture_format_warc_or_singlefile` |
| `archive.fallback_chain_configured` |
| `canonicalization.tracker_params_stripped` |
| `canonicalization.redirects_resolved` |
| `canonicalization.dedupe_by_content_hash` |
| `notarization.hash_algorithm_sha256` |
| `notarization.evidence_bundle_complete` |
| `notarization.tool_versions_recorded` |
| `notarization.verification_recipe_published` |
| `serving.as_seen_views_available` |
| `serving.live_vs_archive_diff_available` |
| `serving.authorship_preserved` |
| `repair.repairs_logged` |
| `compliance.robots_and_tos_honored` |
| `compliance.rate_limits_respected` |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE / gaps). A field present but false/invalid = the
check fails (counts toward the FAIL verdict).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/link-rot-scan-and-notarized-archive`:

```json
{
  "site": "example.com",
  "scan": {
    "scans_scheduled": true,
    "scan_records_status": true,
    "scan_records_content_hash": true,
    "dashboard_lists_rot_with_owners": true,
    "last_scan_within_cadence": true
  },
  "links": [
    {
      "id": "link_01",
      "url": "https://example.com/ref1",
      "is_published_citation": true,
      "observed_status": "ok",
      "archived": true,
      "capture_hash_present": true,
      "capture_timestamp_present": true,
      "capture_at_cite_time": true,
      "canonicalized": true,
      "stable_id_present": true,
      "content_hash": "abc123",
      "canonical_url": "https://example.com/ref1",
      "notarized": true,
      "repair_action": "none_needed",
      "repair_logged": true
    }
  ],
  "archive": {
    "capture_format_warc_or_singlefile": true,
    "fallback_chain_configured": true
  },
  "canonicalization": {
    "tracker_params_stripped": true,
    "redirects_resolved": true,
    "dedupe_by_content_hash": true
  },
  "notarization": {
    "hash_algorithm_sha256": true,
    "timestamp_source": "rfc3161_tsa",
    "evidence_bundle_complete": true,
    "tool_versions_recorded": true,
    "verification_recipe_published": true
  },
  "serving": {
    "as_seen_views_available": true,
    "live_vs_archive_diff_available": true,
    "provenance_badge_shows_capture_date": true,
    "provenance_badge_shows_verification_status": true,
    "archived_presented_as_current": false,
    "authorship_preserved": true
  },
  "repair": {
    "repairs_logged": true,
    "silent_drops_made": false
  },
  "compliance": {
    "robots_and_tos_honored": true,
    "rate_limits_respected": true,
    "access_controls_bypassed": false,
    "fabricated_captures_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries every check
and a text stamp of the verdict):

```json
{
  "service": "link-rot-scan-and-notarized-archive",
  "atom_version": "0.1.0",
  "site": "example.com",
  "verdict": "LINK_INTEGRITY_SOUND",
  "sections": {
    "scan_coverage": "pass",
    "archive_capture": "pass",
    "canonicalization": "pass",
    "notarization": "pass",
    "honest_serving": "pass",
    "repair_and_compliance": "pass"
  },
  "summary": "33 pass, 0 fail, 0 missing of 33 checks across six sections.",
  "checks": [
    {
      "section": "scan_coverage",
      "check": "scans_scheduled",
      "status": "pass",
      "evidence": "scheduled scans (HEAD/GET) for internal and external links"
    },
    {
      "section": "scan_coverage",
      "check": "scan_records_status",
      "status": "pass",
      "evidence": "scan records the observed status of every link"
    }
  ]
}
```

## Verdicts

- **LINK_INTEGRITY_SOUND** — every check passes (33/33); the link-integrity practice clears all six sections.
- **LINK_INTEGRITY_UNSOUND** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
