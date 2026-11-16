# License compliance check — user guide

## What it does

You ship a product built from licensed components. This atom reads a short licence-evidence manifest — licence files, dependency compatibility, contributor terms, and claims and contracts — and returns one deterministic verdict across four sections with per-check evidence. (Scan-based; not legal advice.): **COMPLIANT**, **NON_COMPLIANT**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Same manifest in → same verdict out;
it is built to be used as a gate. A field **absent** = evidence missing
(counts toward INSUFFICIENT_EVIDENCE). A field present but
false/invalid = the check fails (counts toward NON_COMPLIANT).

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "license-compliance-check"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/license-compliance-check`
  — tool name `license_compliance_check`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/license-compliance-check`
  — body = the manifest object; same `Authorization` header.

## Input — the evidence manifest

| Field | Meaning |
|---|---|
| `product` | product name; echoed in the result, no check gates on it |
| `distribution_model`, `project_license`, `license_decision.logged` | distribution model and project licence; a copyleft project licence (starting `AGPL`/`GPL`) requires a logged licence decision |
| `license_file.present`, `.texts_unmodified`, `notice_file.present`, `source_headers.present` | licence and NOTICE files, unmodified texts, source headers |
| `components` | array of component objects (`name`, `license`, `requires_attribution`, `requires_bundled_license`); must be a non-empty list — it drives the copyleft, attribution, and bundled-licence checks |
| `dependency_scan.completed`, `.clean`, `.accepted_with_record`, `.incompatible_shipped` | dependency scan; incompatible shipped must be `false`; a non-clean scan passes only with `accepted_with_record` |
| `attribution.shipped`, `bundled_licenses.shipped` | attribution / bundled licences shipped where required |
| `contributor_terms.policy`, `.documented_in_contributing`, `.enforced` | contributor terms; policy must be `DCO` or `CLA` |
| `trademark.usage_rules_documented`, `.implied_endorsement`, `public_claims.claims_made`, `.attestation_present`, `client_work.is_client_work`, `.contract_constraints_reviewed` | trademark, public claims, and client-work constraints; implied endorsement must be `false` |

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/license-compliance-check`:

```json
{
 "product": "TestApp",
 "distribution_model": "proprietary_binary",
 "project_license": "MIT",
 "license_decision": {
  "logged": false
 },
 "license_file": {
  "present": true,
  "texts_unmodified": true
 },
 "notice_file": {
  "present": true
 },
 "source_headers": {
  "present": true
 },
 "components": [
  {
   "name": "lib-a",
   "license": "MIT",
   "requires_attribution": false,
   "requires_bundled_license": false
  }
 ],
 "dependency_scan": {
  "completed": true,
  "clean": true,
  "incompatible_shipped": false
 },
 "attribution": {
  "shipped": true
 },
 "bundled_licenses": {
  "shipped": true
 },
 "contributor_terms": {
  "policy": "DCO",
  "documented_in_contributing": true,
  "enforced": true
 },
 "trademark": {
  "usage_rules_documented": true,
  "implied_endorsement": false
 },
 "public_claims": {
  "claims_made": [],
  "attestation_present": false
 },
 "client_work": {
  "is_client_work": false
 }
}
```

Response — HTTP 200 (trimmed; the full response carries all 19 checks
and a text stamp of the verdict):

```json
{
 "service": "license-compliance-check",
 "atom_version": "0.1.0",
 "product": "TestApp",
 "distribution_model": "proprietary_binary",
 "verdict": "COMPLIANT",
 "sections": {
  "license_files": "pass",
  "dependency_compatibility": "pass",
  "contributor_terms": "pass",
  "claims_and_contracts": "pass"
 },
 "summary": "19 pass, 0 fail, 0 missing of 19 checks across four sections."
}
```

## Verdicts

- **COMPLIANT** — every check passes; the product clears all four sections.
- **NON_COMPLIANT** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
