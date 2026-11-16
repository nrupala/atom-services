# Zero-knowledge claim audit — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You claim your product is zero-knowledge — the server learns nothing.
This atom reads a short evidence manifest describing the architecture
behind that claim — the core test (can the server read user data, does
it store only opaque bytes, is the claim a cryptographic guarantee or
a policy promise), client-side encryption, the key journey, trusted
parties and recovery, plaintext and metadata scope, and theater and
threat model — and returns one deterministic verdict across 27 checks
in six sections: **CLAIMS_SOUND**, **CLAIMS_UNSOUND**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). This is an audit of your *declared*
claims and *declared* evidence only: the atom does not inspect a
running system, read its code, or verify any cryptographic proof, and
zero-knowledge proof systems, trusted setups, circuits and constraint
systems are out of scope — the audit covers zero-knowledge *software
architecture* (client-side encryption, keys that never leave the
device, a server that stores only opaque bytes). Same manifest in →
same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "zero-knowledge-claim-audit"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/zero-knowledge-claim-audit`
  — tool name `zero_knowledge_claim_audit`; `tools/call`
  arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/zero-knowledge-claim-audit`
  — body = the manifest object; same `Authorization` header.

## Input — the zero-knowledge-evidence manifest

All fields are booleans unless noted.

| Field | Meaning |
|---|---|
| `product` | product name (string; carried into the output, not itself checked) |
| `claims.claim_basis` | claim basis (string; passes only as `cryptographic_guarantee` — "can't read", not a policy promise of "won't read") |
| `access.server_can_read_user_data` | the core test; must be `false` |
| `storage.server_stores_only_opaque_bytes` | server stores opaque bytes only; must be `true` |
| `encryption.encryption_happens_on_client_device`, `encryption.plaintext_exists_only_on_client_device`, `encryption.authenticated_encryption`, `encryption.relies_on_tls_alone` | client-side encryption; the first three must be `true`, TLS-alone reliance must be `false` |
| `keys.keys_never_leave_device`, `keys.key_derivation_client_side`, `keys.key_journey_documented`, `keys.key_backup_uploads_key_to_server` | key journey; the first three must be `true`, key backup uploading the key to the server must be `false` |
| `trust.key_escrow`, `trust.recovery_backdoor`, `trust.admin_plaintext_view` | trusted parties; all three must be `false` |
| `trust.trusted_components` | trusted components (list; passes only when it includes `client`, `operating_system` and `distribution_channel`) |
| `trust.trusted_third_parties_in_data_path` | trusted third parties in the data path (list; any declared list passes — an empty list declares none, a non-empty list names them) |
| `recovery.password_reset_recovers_data`, `recovery.no_recovery_possible_claimed` | recovery story; declaring both `true` fails — password-reset recovery and "no recovery is possible" cannot both be true |
| `scope.plaintext_locations_documented`, `scope.plaintext_in_logs`, `scope.plaintext_in_crash_dumps`, `scope.plaintext_in_thumbnails_or_previews`, `scope.metadata_leakage_acknowledged`, `scope.residual_risks_documented` | plaintext and metadata scope; locations documented, metadata leakage acknowledged and residual risks documented must be `true`; plaintext in logs, crash dumps or thumbnails/previews must be `false` |
| `theater.client_type` | client type (string, e.g. `native_app` or `web_app_served_by_same_server`) |
| `theater.web_app_trust_distinction_acknowledged` | web-app trust distinction; must be `true` when `client_type` is `web_app_served_by_same_server` (not applicable otherwise) |
| `theater.search_or_indexing_requires_server_plaintext_or_tokens`, `theater.threat_model_includes_malicious_operator` | theater and threat model; server-plaintext search/indexing must be `false`, the threat model must include a malicious operator (`true`) |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false / invalid = the
check fails (counts toward CLAIMS_UNSOUND).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/zero-knowledge-claim-audit`:

```json
{
 "product": "SecureVault",
 "claims": {
  "claim_basis": "cryptographic_guarantee"
 },
 "access": {
  "server_can_read_user_data": false
 },
 "storage": {
  "server_stores_only_opaque_bytes": true
 },
 "encryption": {
  "encryption_happens_on_client_device": true,
  "plaintext_exists_only_on_client_device": true,
  "authenticated_encryption": true,
  "relies_on_tls_alone": false
 },
 "keys": {
  "keys_never_leave_device": true,
  "key_derivation_client_side": true,
  "key_journey_documented": true,
  "key_backup_uploads_key_to_server": false
 },
 "trust": {
  "key_escrow": false,
  "recovery_backdoor": false,
  "admin_plaintext_view": false,
  "trusted_components": [
   "client",
   "operating_system",
   "distribution_channel"
  ],
  "trusted_third_parties_in_data_path": []
 },
 "recovery": {
  "password_reset_recovers_data": false,
  "no_recovery_possible_claimed": true
 },
 "scope": {
  "plaintext_locations_documented": true,
  "plaintext_in_logs": false,
  "plaintext_in_crash_dumps": false,
  "plaintext_in_thumbnails_or_previews": false,
  "metadata_leakage_acknowledged": true,
  "residual_risks_documented": true
 },
 "theater": {
  "client_type": "native_app",
  "web_app_trust_distinction_acknowledged": true,
  "search_or_indexing_requires_server_plaintext_or_tokens": false,
  "threat_model_includes_malicious_operator": true
 }
}
```

Response — HTTP 200 (trimmed; the full response carries all 27 checks
and a text stamp of the verdict):

```json
{
 "service": "zero-knowledge-claim-audit",
 "atom_version": "0.1.0",
 "product": "SecureVault",
 "verdict": "CLAIMS_SOUND",
 "sections": {
  "core_test": "pass",
  "client_side_encryption": "pass",
  "key_journey": "pass",
  "trusted_parties_and_recovery": "pass",
  "plaintext_and_metadata_scope": "pass",
  "theater_and_threat_model": "pass"
 },
 "summary": "27 pass, 0 fail, 0 missing of 27 checks across six sections."
}
```

## Verdicts

- **CLAIMS_SOUND** — every check passes; the declared architecture
  backs the zero-knowledge claim across all six sections.
- **CLAIMS_UNSOUND** — at least one check fails; the failing checks
  name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing;
  the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
