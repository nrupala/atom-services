# Correctness verification certificate — user guide
Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are claiming software is correct. This atom reads a short evidence
manifest describing the claim — its register entry, the evidence ladder
behind it, specs written before tools ran, machine-checkable artifacts,
honest scope, CI integration, adversarial review and the signed
certificate itself — and returns one deterministic verdict across seven
sections (claims_register, evidence_ladder, specs_before_tools,
evidence_artifacts, scope_honesty, ci_integration,
adversarial_and_certification): **CERTIFIED**, **NOT_CERTIFIED**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the
verdict names exactly which). Same manifest in → same verdict out; one
failed check breaks the claim.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "correctness-verification-certificate"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/correctness-verification-certificate`
  — tool name `correctness_verification_certificate`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/correctness-verification-certificate`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `component` (string) | the component the claim covers (carried into the output) |
| `register.exists`, `register.property_named`, `register.scope_named`, `register.evidence_level_assigned`, `register.expiry_set` | the claims register names each claim's property, scope, evidence level and expiry |
| `ladder.cheapest_sufficient_level_selected`, `ladder.claim_exceeds_evidence_level` (must be `false`), `ladder.tests_presented_as_proof` (must be `false`) | the cheapest sufficient evidence level was chosen; claims never exceed it; tests are never presented as proof |
| `specs.invariants_written`, `specs.pre_post_conditions_written`, `specs.liveness_properties_written`, `specs.written_before_tools_run` | specs exist and were written before tools ran |
| `artifacts.machine_checkable_per_claim`, `artifacts.proof_scripts_or_solver_logs_retained`, `artifacts.counterexample_suppressed` (must be `false`), `artifacts.reproduction_recipe_present` | machine-checkable evidence per claim, retained, honestly disclosed |
| `scope.exclusions_written`, `scope.claims_versioned`, `scope.reverification_triggers_defined`, `scope.verified_at_current_version` | the scope is honest and current |
| `ci.verification_in_pipeline`, `ci.broken_proof_fails_build` | verification runs in CI and a broken proof fails the build |
| `review.independent_review_done`, `review.counterexample_found`, `review.counterexample_disclosed` | independent adversarial review; a found counterexample is disclosed (disclosure required only when one was found) |
| `certificate.signed_attestation_binds_claim_artifact_commit`, `certificate.independently_reproducible` | the signed attestation binds claim, artifact and commit; the certificate is independently reproducible |

All fields are booleans unless noted. A field **absent** = evidence
missing (counts toward INSUFFICIENT_EVIDENCE). A field present but
false/invalid = the check fails (counts toward NOT_CERTIFIED).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/correctness-verification-certificate`:

```json
{
  "component": "auth-service-v1",
  "register": {
    "exists": true,
    "property_named": true,
    "scope_named": true,
    "evidence_level_assigned": true,
    "expiry_set": true
  },
  "ladder": {
    "cheapest_sufficient_level_selected": true,
    "claim_exceeds_evidence_level": false,
    "tests_presented_as_proof": false
  },
  "specs": {
    "invariants_written": true,
    "pre_post_conditions_written": true,
    "liveness_properties_written": true,
    "written_before_tools_run": true
  },
  "artifacts": {
    "machine_checkable_per_claim": true,
    "proof_scripts_or_solver_logs_retained": true,
    "counterexample_suppressed": false,
    "reproduction_recipe_present": true
  },
  "scope": {
    "exclusions_written": true,
    "claims_versioned": true,
    "reverification_triggers_defined": true,
    "verified_at_current_version": true
  },
  "ci": {
    "verification_in_pipeline": true,
    "broken_proof_fails_build": true
  },
  "review": {
    "independent_review_done": true,
    "counterexample_found": false,
    "counterexample_disclosed": true
  },
  "certificate": {
    "signed_attestation_binds_claim_artifact_commit": true,
    "independently_reproducible": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 26 checks and a text stamp of the certificate):

```json
{
  "service": "correctness-verification-certificate",
  "atom_version": "0.1.0",
  "component": "auth-service-v1",
  "verdict": "CERTIFIED",
  "sections": {
    "claims_register": "pass",
    "evidence_ladder": "pass",
    "specs_before_tools": "pass",
    "evidence_artifacts": "pass",
    "scope_honesty": "pass",
    "ci_integration": "pass",
    "adversarial_and_certification": "pass"
  },
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across seven sections."
}
```

## Verdicts

- **CERTIFIED** — every check passes; all 26 checks across the seven sections.
- **NOT_CERTIFIED** — at least one check fails; one failure breaks the claim, and the failing checks name the section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
