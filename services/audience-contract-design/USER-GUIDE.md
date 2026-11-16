# Audience contract design — user guide
Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are designing one artifact for four user classes — humans,
agents, hybrid systems, and software. This atom reads a declared
audience-contract design record for one artifact — class paths,
single truth, progressive formality and failure, the authority
lattice, verification by class, identity by class — and returns one
deterministic verdict across six sections:
**AUDIENCE_CONTRACT_COMPLETE**, **AUDIENCE_CONTRACT_INCOMPLETE**,
or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is
missing — the verdict names exactly which). Two things are
computed: how many of the four classes have a declared path, and
the authority lattice — dangerous actions require capability
(agent) + approval (human) + determinism (software) + audit
(system), each required only when dangerous actions are declared
present. Same manifest in → same verdict out. It audits the
declared record; it does not judge whether a class's path is good.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "audience-contract-design"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/audience-contract-design`
  — tool name `audience_contract_design`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/audience-contract-design`
  — body = the manifest object; same `Authorization` header.

## Input — the audience-contract manifest

| Field | Meaning |
|---|---|
| `artifact` | artifact name (string; carried into the output, not checked) |
| `classes.human_path_defined` / `agent_path_defined` / `system_path_defined` / `software_path_defined` | one named, working path per class; counted into `classes_with_path_count` |
| `classes.single_class_only_shipment` | must be `false` to pass (red line) |
| `single_truth.canonical_source_declared` / `renderings_generated_not_maintained` | one canonical source; renderings generated, not maintained separately |
| `single_truth.truth_forked_per_class` | must be `false` to pass (red line) |
| `progressive_formality.formality_progressive_declared` | progressive formality declared |
| `failure.human_failure_defined` / `agent_failure_defined` / `system_failure_defined` / `software_failure_defined` | failure behaviour defined per class |
| `authority.dangerous_actions_present` | gates the four lattice checks below |
| `authority.capability_required` / `human_approval_required` / `software_determinism_required` / `system_audit_required` | required when dangerous actions are present; otherwise each passes as not applicable |
| `authority.dangerous_path_skips_lattice` | must be `false` to pass (red line) |
| `verification.agents_verified_by_software` / `humans_verified_by_evidence` / `software_verified_by_spec_tests` / `systems_verified_by_audit_trails` | verification by class |
| `identity.human_passkey_or_mfa` / `agent_scoped_short_lived_tokens` / `system_policy_engine` / `software_service_creds_or_mtls` | identity by class |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false = the check
fails (counts toward AUDIENCE_CONTRACT_INCOMPLETE).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/audience-contract-design`:

```json
{
  "artifact": "test-artifact-001",
  "classes": {
    "human_path_defined": true,
    "agent_path_defined": true,
    "system_path_defined": true,
    "software_path_defined": true,
    "single_class_only_shipment": false
  },
  "single_truth": {
    "canonical_source_declared": true,
    "renderings_generated_not_maintained": true,
    "truth_forked_per_class": false
  },
  "progressive_formality": {
    "formality_progressive_declared": true
  },
  "failure": {
    "human_failure_defined": true,
    "agent_failure_defined": true,
    "system_failure_defined": true,
    "software_failure_defined": true
  },
  "authority": {
    "dangerous_actions_present": true,
    "capability_required": true,
    "human_approval_required": true,
    "software_determinism_required": true,
    "system_audit_required": true,
    "dangerous_path_skips_lattice": false
  },
  "verification": {
    "agents_verified_by_software": true,
    "humans_verified_by_evidence": true,
    "software_verified_by_spec_tests": true,
    "systems_verified_by_audit_trails": true
  },
  "identity": {
    "human_passkey_or_mfa": true,
    "agent_scoped_short_lived_tokens": true,
    "system_policy_engine": true,
    "software_service_creds_or_mtls": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 26 checks
and a text stamp of the verdict):

```json
{
  "service": "audience-contract-design",
  "atom_version": "0.1.0",
  "artifact": "test-artifact-001",
  "verdict": "AUDIENCE_CONTRACT_COMPLETE",
  "sections": {
    "classes_and_paths": "pass",
    "single_truth": "pass",
    "progressive_formality_and_failure": "pass",
    "authority_lattice": "pass",
    "verification_by_class": "pass",
    "identity_by_class": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "classes_with_path_count": 4,
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across six sections."
}
```

## Verdicts

- **AUDIENCE_CONTRACT_COMPLETE** — every check passes; the design record is complete on the declared evidence.
- **AUDIENCE_CONTRACT_INCOMPLETE** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `classes_with_path_count` (how many of the four class-path fields are `true`; null when none is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when a class-path check cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
