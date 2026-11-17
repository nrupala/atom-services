# Claim Verification Fact Check Stamp — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are about to publish something with claims in it. This atom
reads a short manifest describing the fact-check behind the document
— the declared claims (one row per claim, with its label, source
record and re-check record) plus the publication process record
(sources archived and triangulated, numbers re-derived, uncertainty
language no stronger than the evidence, a corrections policy, no
silent edits) — and returns one deterministic stamp across six
sections with per-check evidence: **STAMPED**, **NOT_STAMPED**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the stamp names exactly which). It also computes the claims_summary
counts (claims_total / material_claims / verified_claims) from the
claim rows. Same manifest in → same stamp out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "claim-verification-fact-check-stamp"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/claim-verification-fact-check-stamp`
  — tool name `claim_verification_fact_check_stamp`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/claim-verification-fact-check-stamp`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `document` (string) | document name; carried into the output, not itself checked |
| `process.claims_extracted` | one row per claim extracted |
| `process.units_and_dates_checked` | units, dates and names checked |
| `process.counter_case_considered` | the counter-case was considered |
| `process.evidence_published_inline`, `process.methodology_visible_for_big_claims`, `process.corrections_policy_published`, `process.versions_retained` | publication record |
| `process.silent_edits_made` | must be `false` to pass — no silent corrections |
| `claims[]` | claim rows `{id, material, label, independent_sources, primary_source, sources_archived, source_metadata_recorded, independence_checked, has_numbers, math_rechecked, language_weakest_supported}`. A material claim is triangulated with ≥2 independent sources (or one primary + ≥1 independent); a claim with numbers must have its math rechecked; every label must be in the vocabulary (verified / likely / contested / unverified); every material claim's sources must be archived. Non-material claims are exempt from triangulation and archiving. |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = the
section fails (counts toward NOT_STAMPED).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/claim-verification-fact-check-stamp`:

```json
{
  "document": "Climate change impact report",
  "process": {
    "claims_extracted": true,
    "units_and_dates_checked": true,
    "counter_case_considered": true,
    "evidence_published_inline": true,
    "methodology_visible_for_big_claims": true,
    "corrections_policy_published": true,
    "versions_retained": true,
    "silent_edits_made": false
  },
  "claims": [
    {
      "id": "c1",
      "material": true,
      "label": "verified",
      "independent_sources": 2,
      "primary_source": true,
      "sources_archived": true,
      "source_metadata_recorded": true,
      "independence_checked": true,
      "has_numbers": true,
      "math_rechecked": true,
      "language_weakest_supported": true
    }
  ]
}
```

Response — HTTP 200 (trimmed; the full response carries every check
and a text stamp of the verdict):

```json
{
  "service": "claim-verification-fact-check-stamp",
  "atom_version": "0.1.0",
  "document": "Climate change impact report",
  "verdict": "STAMPED",
  "sections": {"extraction": "pass", "source_ladder": "pass", "triangulation": "pass", "compute_rechecks": "pass", "uncertainty_language": "pass", "publication_and_corrections": "pass"},
  "claims_summary": {"claims_total": 1, "material_claims": 1, "verified_claims": 1},
  "summary": "16 pass, 0 fail, 0 missing of 16 checks across six sections."
}
```

## Verdicts

- **STAMPED** — every check passes; the fact-check clears all six sections.
- **NOT_STAMPED** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
