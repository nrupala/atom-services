# Lean4 formal proof — user guide

## What it does

You hold a Lean 4 formal proof you want to trust. This atom does not prove theorems — it audits a *declared* proof artifact: you submit one manifest declaring the proof's setup (pinned toolchain and versions, green lake build), statement integrity, total and executable definitions, proof integrity, per-theorem declarations (sorry counts, axioms, kernel-check status — five checks are computed from the theorems list, not declared), build attestation and model alignment, and it returns one deterministic verdict across seven sections with per-check evidence: **VERIFIED**, **NOT_VERIFIED**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "lean4-formal-proof"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/lean4-formal-proof`
  — tool name `lean4_formal_proof`; `tools/call` arguments = the input object below.
- **REST:** `POST https://atoms.pipavia.com/v1/lean4-formal-proof`
  — body = the input object; same `Authorization` header.

## Input

The full field table lives in the atom's `SERVICE.md`; the fields are:

| Field |
|---|
| `setup.toolchain_pinned` |
| `setup.versions_pinned` |
| `setup.ci_runs_lake_build` |
| `setup.lake_build_green` |
| `statements.stated_before_proving` |
| `statements.meaning_checked_before_proving` |
| `statements.reviewed_independently_of_tactics` |
| `definitions.total` |
| `definitions.executable` |
| `definitions.specs_separate_from_implementation` |
| `proof.structured_and_readable` |
| `proof.cheating_items_tracked_as_tickets` |
| `attestation.build_log_retained` |
| `attestation.axiom_audit_performed` |
| `attestation.reproduction_recipe_present` |
| `alignment.mapping_documented` |
| `alignment.changes_ported_through_model` |
| `alignment.model_and_implementation_in_sync` |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE / gaps). A field present but false/invalid = the
check fails (counts toward the FAIL verdict).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/lean4-formal-proof`:

```json
{
  "project": "verified-math-lib",
  "setup": {
    "toolchain_pinned": true,
    "versions_pinned": true,
    "ci_runs_lake_build": true,
    "lake_build_green": true
  },
  "statements": {
    "stated_before_proving": true,
    "meaning_checked_before_proving": true,
    "reviewed_independently_of_tactics": true,
    "weakened_silently": false,
    "unproven_claims_presented_as_verified": false
  },
  "definitions": {
    "total": true,
    "executable": true,
    "specs_separate_from_implementation": true
  },
  "proof": {
    "structured_and_readable": true,
    "cheating_items_tracked_as_tickets": true,
    "cheating_smuggled_into_deliverable": false
  },
  "theorems": [
    {
      "name": "thm1",
      "sorry_count": 0,
      "axioms": [
        "propext"
      ],
      "native_decide_used": false,
      "kernel_checked": true
    }
  ],
  "attestation": {
    "build_log_retained": true,
    "axiom_audit_performed": true,
    "reproduction_recipe_present": true
  },
  "alignment": {
    "mapping_documented": true,
    "changes_ported_through_model": true,
    "model_and_implementation_in_sync": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries every check
and a text stamp of the verdict):

```json
{
  "service": "lean4-formal-proof",
  "atom_version": "0.1.0",
  "project": "verified-math-lib",
  "verdict": "VERIFIED",
  "sections": {
    "project_setup": "pass",
    "statement_integrity": "pass",
    "definitions_and_model": "pass",
    "proof_integrity": "pass",
    "theorem_declarations": "pass",
    "build_attestation": "pass",
    "model_alignment": "pass"
  },
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across seven sections.",
  "checks": [
    {
      "section": "project_setup",
      "check": "toolchain_pinned",
      "status": "pass",
      "evidence": "elan toolchain pinned \u2014 the proof is checked by a known toolchain, not whatever is installed"
    },
    {
      "section": "project_setup",
      "check": "dependency_versions_pinned",
      "status": "pass",
      "evidence": "lake / Mathlib versions pinned \u2014 the proof's dependencies do not drift"
    }
  ]
}
```

## Verdicts

- **VERIFIED** — every check passes (26/26); the declared proof artifact clears all seven sections.
- **NOT_VERIFIED** — at least one check fails — one failure breaks the claim; the failing checks name the breached section.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
