# Agent context packaging — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are packaging context/config for an agent to travel. This atom reads a declared context-pack manifest — scope, redaction, structure/manifest, reproducibility/signing, handoff dossier, and freshness/privacy — and returns one deterministic verdict across six sections (scope_declaration, redaction, structure_and_manifest, reproducibility_and_signing, handoff_dossier, freshness_and_privacy): **PACK_SOUND**, **PACK_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Same manifest in → same verdict out. It audits declared evidence only; it does not open the pack or scan it.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "agent-context-packaging"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/agent-context-packaging`
  — tool name `agent_context_packaging`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/agent-context-packaging`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Read by |
|---|---|
| `pack` (string; carried into the verdict output, not itself checked) | — |
| `scope.what_travels_declared` | scope_declaration |
| `scope.recipient_declared` | scope_declaration |
| `scope.purpose_declared` | scope_declaration |
| `scope.pack_inherits_boundary` | scope_declaration |
| `redaction.keys_replaced_with_environment_references` | redaction |
| `redaction.personal_data_minimized_purpose_limited` | redaction |
| `redaction.contacts_or_financials_included` (must be `false` to pass — excluded by default) | redaction |
| `redaction.scan_clean_automated_and_manual` | redaction |
| `redaction.secrets_or_pii_unredacted_present` (must be `false` to pass — skill red line) | redaction |
| `manifest.manifest_present` | structure_and_manifest |
| `manifest.manifest_lists_contents_version_date_generator_and_source` | structure_and_manifest |
| `structure.stable_folder_layout` | structure_and_manifest |
| `structure.receiver_runbook_present` | structure_and_manifest |
| `structure.receiver_runbook_tested` | structure_and_manifest |
| `reproducibility.generated_by_script_from_source_of_truth` | reproducibility_and_signing |
| `reproducibility.hand_assembled` (must be `false` to pass) | reproducibility_and_signing |
| `reproducibility.derived_pack_hand_maintained_silently` (must be `false` to pass — skill red line) | reproducibility_and_signing |
| `reproducibility.versioned_in_git` | reproducibility_and_signing |
| `signing.pack_signed` | reproducibility_and_signing |
| `handoff.is_handoff_dossier` (gates the contents check below) | handoff_dossier |
| `handoff.dossier_contents_complete` (required when the pack is a handoff dossier; otherwise the check passes as not applicable) | handoff_dossier |
| `handoff.everything_dated` | handoff_dossier |
| `handoff.review_date_marked` | handoff_dossier |
| `freshness.expiry_or_review_date_present` | freshness_and_privacy |
| `freshness.stale_packs_flagged` | freshness_and_privacy |
| `freshness.single_upstream_source_derived_not_primary` | freshness_and_privacy |
| `privacy.stored_privately` | freshness_and_privacy |
| `privacy.access_limited` | freshness_and_privacy |
| `privacy.contact_handling_rules_complied` | freshness_and_privacy |
| `privacy.third_party_personal_data_included` (gates the lawful-basis check below) | freshness_and_privacy |
| `privacy.lawful_basis_established` (required when third-party personal data is included; otherwise the check passes as not applicable) | freshness_and_privacy |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = a check
fails (counts toward the not-sound verdict).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/agent-context-packaging`:

```json
{
  "pack": "agent_handoff_v1",
  "scope": {
    "what_travels_declared": true,
    "recipient_declared": true,
    "purpose_declared": true,
    "pack_inherits_boundary": true
  },
  "redaction": {
    "keys_replaced_with_environment_references": true,
    "personal_data_minimized_purpose_limited": true,
    "contacts_or_financials_included": false,
    "scan_clean_automated_and_manual": true,
    "secrets_or_pii_unredacted_present": false
  },
  "manifest": {
    "manifest_present": true,
    "manifest_lists_contents_version_date_generator_and_source": true
  },
  "structure": {
    "stable_folder_layout": true,
    "receiver_runbook_present": true,
    "receiver_runbook_tested": true
  },
  "reproducibility": {
    "generated_by_script_from_source_of_truth": true,
    "hand_assembled": false,
    "derived_pack_hand_maintained_silently": false,
    "versioned_in_git": true
  },
  "signing": {
    "pack_signed": true
  },
  "handoff": {
    "is_handoff_dossier": true,
    "dossier_contents_complete": true,
    "everything_dated": true,
    "review_date_marked": true
  },
  "freshness": {
    "expiry_or_review_date_present": true,
    "stale_packs_flagged": true,
    "single_upstream_source_derived_not_primary": true
  },
  "privacy": {
    "stored_privately": true,
    "access_limited": true,
    "contact_handling_rules_complied": true,
    "third_party_personal_data_included": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all checks
and a text stamp of the verdict):

```json
{
  "service": "agent-context-packaging",
  "atom_version": "0.1.0",
  "pack": "agent_handoff_v1",
  "verdict": "PACK_SOUND",
  "sections": {
    "scope_declaration": "pass",
    "redaction": "pass",
    "structure_and_manifest": "pass",
    "reproducibility_and_signing": "pass",
    "handoff_dossier": "pass",
    "freshness_and_privacy": "pass"
  },
  "summary": "29 pass, 0 fail, 0 missing of 29 checks across six sections."
}
```

## Verdicts

- **PACK_SOUND** — all 29 checks pass.
- **PACK_NOT_SOUND** — at least one check fails — including the red lines: never export secrets or PII unredacted, and never hand-maintain a derived pack silently.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
