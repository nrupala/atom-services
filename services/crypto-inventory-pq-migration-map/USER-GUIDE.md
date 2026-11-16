# Crypto inventory PQ migration map — user guide

## What it does

You need to know where your cryptography will break when quantum
computers arrive. This atom takes an inventory of cryptographic uses —
each entry's surface, algorithm, purpose, shelf-life and owner — and
computes a post-quantum migration map: every entry is classified
(`quantum_vulnerable`, `hybrid_classical_pq`, `pq_ready`,
`symmetric_or_hash_not_broken`, or `unknown`), given an action and a
target PQ family (ML-KEM, ML-DSA, SLH-DSA), and ordered by priority
(migration groups first, longest shelf-life first within a group). The
status is **complete**, **partial**, or **insufficient_evidence**. Same
inventory in → same map out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "crypto-inventory-pq-migration-map"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/crypto-inventory-pq-migration-map`
  — tool name `crypto_inventory_pq_migration_map`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/crypto-inventory-pq-migration-map`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `system` (string) | the system the inventory covers (carried into the output) |
| `inventory` | list of entries, one per cryptographic use |
| `inventory[].id` (string) | entry identifier (carried into the map row) |
| `inventory[].surface` (string) | where the crypto lives — e.g. `tls`, `code_signing`, `firmware_signing`, `pki` |
| `inventory[].algorithm` (string) | the algorithm in use; classified by family (RSA/ECDSA/X25519… → quantum-vulnerable; ML-KEM/ML-DSA/SLH-DSA → PQ; AES/SHA… → not broken) |
| `inventory[].purpose` (string) | `key_exchange`/`kem`/`encryption`-style purposes select the ML-KEM target; `signature`/`signing` select the ML-DSA / SLH-DSA target |
| `inventory[].shelf_life_years` (number) | how long the data or signature must survive — orders priority within each group; absent = counted in `counts.missing_shelf_life` |
| `inventory[].owner` (string) | entry owner; absence is counted in `counts.missing_owner` |

A non-object entry is counted in `counts.invalid_entries` and skipped.
The output carries `counts` (total, invalid_entries, by_classification,
migration_needed, missing_shelf_life, missing_owner), the ordered
`migration_map` rows, a one-line `summary` and a text stamp.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/crypto-inventory-pq-migration-map`:

```json
{
  "system": "production-cluster-01",
  "inventory": [
    {
      "id": "item-1",
      "surface": "tls",
      "algorithm": "RSA",
      "purpose": "key_exchange",
      "shelf_life_years": 10,
      "owner": "team-alpha"
    }
  ]
}
```

Response — HTTP 200 (trimmed; the full response carries the full migration map and a text stamp of the map):

```json
{
  "service": "crypto-inventory-pq-migration-map",
  "atom_version": "0.1.0",
  "system": "production-cluster-01",
  "status": "complete",
  "counts": {
    "total": 1,
    "invalid_entries": 0,
    "by_classification": {
      "quantum_vulnerable": 1,
      "hybrid_classical_pq": 0,
      "pq_ready": 0,
      "symmetric_or_hash_not_broken": 0,
      "unknown": 0
    },
    "migration_needed": 1,
    "missing_shelf_life": 0,
    "missing_owner": 0
  },
  "migration_map": [
    {
      "id": "item-1",
      "surface": "tls",
      "algorithm": "RSA",
      "purpose": "key_exchange",
      "classification": "quantum_vulnerable",
      "action": "migrate_hybrid",
      "target_family": "ML-KEM (FIPS 203)",
      "shelf_life_years": 10,
      "owner": "team-alpha",
      "priority_rank": 1,
      "basis": "classical asymmetric algorithm \u2014 quantum breaks today's asymmetric crypto"
    }
  ],
  "summary": "Migration map over 1 inventory entries: 1 quantum-vulnerable, 0 hybrid, 0 PQ-ready, 0 symmetric/hash not broken, 0 unknown; 0 missing shelf-life."
}
```

## Verdicts

- **complete** — inventory present and every entry valid, classified, and carrying a numeric shelf-life.
- **partial** — a map was computed, but some entries are invalid, unclassified, or missing shelf-life.
- **insufficient_evidence** — no inventory, an empty inventory, or no valid entries.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
