# Confidential computing design — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a confidential-computing design record — its threat model, TEE technology selection, attestation record, enclave patterns and trusted-codebase accounting, engineering discipline, key-management record and claims record. This atom reads one declared manifest and returns one deterministic verdict across seven sections: **CONFIDENTIAL_COMPUTING_DESIGN_READY**, **CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not design an enclave, run attestation, verify a quote, inspect enclave code, or audit encryption claims (that is the separate `encryption-claim-audit` atom). Computed checks: the protects-against list must cover `host_access`, `operator_access`, `co_tenant_access`; the does-not-protect list and the public exclusions must each cover `side_channels`, `supply_chain`, `flawed_enclave_code`, `unsealed_inputs_outputs`; every trusted component must carry a non-empty name and a numeric line count; and the declared trusted-codebase total must equal the sum of the component lines (no maximum size is imposed — only the arithmetic is re-derived). The technology name is validated as a non-empty string only, never enum-checked, and no attestation-freshness window is imposed. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "confidential-computing-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/confidential-computing-design` — tool name `confidential_computing_design`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/confidential-computing-design` — body = the manifest object; same `Authorization` header.

## Input — the confidential-computing-design manifest

| Field | Meaning |
|---|---|
| `entity` | entity name (string; carried into the output, not checked) |
| `threat_model.documented` | threat model is documented |
| `threat_model.protects_against` (list of strings) | computed: must contain all of `host_access`, `operator_access`, `co_tenant_access`; omitted entries reported as `threat_protects_not_covered` |
| `threat_model.does_not_protect_against` (list of strings) | computed: must contain all of `side_channels`, `supply_chain`, `flawed_enclave_code`, `unsealed_inputs_outputs`; omitted entries reported as `threat_exclusions_not_covered` |
| `threat_model.claims_require_threat_model` | claims are gated on the threat model |
| `technology.name` (string) | chosen TEE technology; must be non-empty, validated as a string only, never enum-checked |
| `technology.distinctions_considered` / `chosen_by_workload_shape` / `chosen_by_available_hardware` | technology-selection evidence |
| `attestation.verification_implemented` / `verification_tested` / `measurement_verified` / `fresh_nonce_verified` / `verified_before_trusting` | attestation evidence |
| `enclave.sealed_keys_bound_to_identity_or_measurement` / `attested_tls_used` / `surface_area_minimized` | enclave-pattern evidence |
| `enclave.trusted_components` (list of entries) | computed: every entry needs a non-empty `name` (string) and numeric `trusted_lines`; count of complete entries reported as `components_evaluated` |
| `enclave.declared_trusted_codebase_lines` (number) | computed: must equal the sum of `trusted_components[].trusted_lines`; reported as `computed_trusted_codebase_lines` and `trusted_codebase_difference` (6 decimal places) |
| `enclave.debug_enabled_in_production` | must be `false` to pass |
| `engineering.reproducible_builds` / `signed_enclave_images` / `measurements_versioned_and_pinned` / `real_attestation_in_ci_or_staging` / `fallback_documented` | engineering-discipline evidence |
| `engineering.silent_downgrade_used` | must be `false` to pass |
| `keys.sealed_keys_tested_including_recovery` | sealed keys tested, including recovery |
| `keys.root_keys_stored_unsealed_beside_enclave` | must be `false` to pass |
| `keys.rotation_designed` / `recovery_designed` / `measurement_changes_invalidating_seals_documented` | key-management evidence |
| `claims.claims_match_evidence` / `marketing_mechanism_audit_done` | claims evidence |
| `claims.public_exclusions` (list of strings) | computed: must contain all four stated exclusions; omitted entries reported as `claims_exclusions_not_listed` |
| `claims.unverifiable_secure_enclave_claims_made` | must be `false` to pass |
| `claims.regulatory_compliance_paired_where_required` | regulatory compliance paired where required |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/confidential-computing-design`:

```json
{
  "entity": "secure-enclave-v1",
  "threat_model": {
    "documented": true,
    "protects_against": [
      "host_access",
      "operator_access",
      "co_tenant_access"
    ],
    "does_not_protect_against": [
      "side_channels",
      "supply_chain",
      "flawed_enclave_code",
      "unsealed_inputs_outputs"
    ],
    "claims_require_threat_model": true
  },
  "technology": {
    "name": "Intel TDX",
    "distinctions_considered": true,
    "chosen_by_workload_shape": true,
    "chosen_by_available_hardware": true
  },
  "attestation": {
    "verification_implemented": true,
    "verification_tested": true,
    "measurement_verified": true,
    "fresh_nonce_verified": true,
    "verified_before_trusting": true
  },
  "enclave": {
    "sealed_keys_bound_to_identity_or_measurement": true,
    "attested_tls_used": true,
    "surface_area_minimized": true,
    "trusted_components": [
      {
        "name": "core-logic",
        "trusted_lines": 100
      }
    ],
    "declared_trusted_codebase_lines": 100,
    "debug_enabled_in_production": false
  },
  "engineering": {
    "reproducible_builds": true,
    "signed_enclave_images": true,
    "measurements_versioned_and_pinned": true,
    "real_attestation_in_ci_or_staging": true,
    "fallback_documented": true,
    "silent_downgrade_used": false
  },
  "keys": {
    "sealed_keys_tested_including_recovery": true,
    "root_keys_stored_unsealed_beside_enclave": false,
    "rotation_designed": true,
    "recovery_designed": true,
    "measurement_changes_invalidating_seals_documented": true
  },
  "claims": {
    "claims_match_evidence": true,
    "marketing_mechanism_audit_done": true,
    "public_exclusions": [
      "side_channels",
      "supply_chain",
      "flawed_enclave_code",
      "unsealed_inputs_outputs"
    ],
    "unverifiable_secure_enclave_claims_made": false,
    "regulatory_compliance_paired_where_required": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 35 checks and a text stamp of the verdict):

```json
{
  "service": "confidential-computing-design",
  "atom_version": "0.1.0",
  "entity": "secure-enclave-v1",
  "verdict": "CONFIDENTIAL_COMPUTING_DESIGN_READY",
  "sections": {
    "threat_model": "pass",
    "technology_selection": "pass",
    "attestation": "pass",
    "enclave_patterns": "pass",
    "engineering_discipline": "pass",
    "key_management": "pass",
    "claims_discipline": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "components_evaluated": 1,
  "computed_trusted_codebase_lines": "100.000000",
  "trusted_codebase_difference": "0.000000",
  "threat_protects_not_covered": [],
  "threat_exclusions_not_covered": [],
  "claims_exclusions_not_listed": [],
  "summary": "35 pass, 0 fail, 0 missing of 35 checks across seven sections."
}
```

## Verdicts

- **CONFIDENTIAL_COMPUTING_DESIGN_READY** — every check passes; the design record is complete and internally consistent on the declared evidence.
- **CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `components_evaluated` (count of complete trusted-component entries), `computed_trusted_codebase_lines` and `trusted_codebase_difference` (computed amounts as strings with exactly six decimals, or null when they cannot be computed), `threat_protects_not_covered`, `threat_exclusions_not_covered` and `claims_exclusions_not_listed` (omitted stated entries, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
