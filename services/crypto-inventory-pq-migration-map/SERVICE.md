# Crypto inventory pq migration map — `crypto-inventory-pq-migration-map`

**Deliverable type:** MAP. This atom sells the map it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Prepare for quantum risk — ML-KEM/ML-DSA hybrids, crypto inventory, migration mapping, honest timelines.

A caller submits the inputs the bound skill works on and receives one map back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this map on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Long-lived product signing and archives**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the crypto inventory manifest

The caller submits one JSON manifest. `system` (string) is carried into
the output, not itself mapped. The map is computed over `inventory`:
a list of entries, one per cryptographic use. A non-object entry is
counted in `counts.invalid_entries` and skipped.

| Field | Read from |
|---|---|
| `system` (string; carried into the output, not itself mapped) | manifest |
| `inventory` (list of entries, below) | manifest |
| `inventory[].id` (string; carried into the map row) | entry |
| `inventory[].surface` (string; where the crypto lives — e.g. `tls`, `code_signing`, `firmware_signing`, `agent_trust_root`, `at_rest_envelope`, `pki`; carried into the map row, not itself classified) | entry |
| `inventory[].algorithm` (string; classified by family — see below) | entry |
| `inventory[].purpose` (string; `key_exchange` / `kem` / `key_encapsulation` / `encryption` / `key_transport` select the ML-KEM target, `signature` / `signing` select the ML-DSA / SLH-DSA target) | entry |
| `inventory[].shelf_life_years` (number; how long the data or signature must survive — orders priority within each group; absent / non-numeric = missing) | entry |
| `inventory[].owner` (string; carried into the map row; absence is counted in `counts.missing_owner`) | entry |

Algorithm classification (the skill's families, matched on the
lowercased algorithm name, PQ names stripped before the classical
scan so ML-DSA / SLH-DSA are not misread as classical DSA):

| Classification | Rule | Action | Target family |
|---|---|---|---|
| `quantum_vulnerable` | classical asymmetric only (RSA, ECDSA, ECDH/ECDHE, Ed25519/Ed448, X25519/X448, DSA, Diffie-Hellman, ElGamal, ECIES, secp/P- curves) | `migrate_hybrid` | by purpose / algorithm (below) |
| `hybrid_classical_pq` | classical asymmetric + a NIST PQ algorithm together | `complete_hybrid_transition` | by purpose / algorithm (below) |
| `pq_ready` | NIST PQ only (ML-KEM, ML-DSA, SLH-DSA — incl. Kyber / Dilithium / SPHINCS+ names) | `retain_pq` | the family the entry already names |
| `symmetric_or_hash_not_broken` | symmetric / hash only (AES, ChaCha, SHA-2 / SHA-3, HMAC, KDFs) — the asymmetric side is what breaks; AES-256 is fine | `no_pq_migration_needed` | — (null) |
| `unknown` | none of the above, or algorithm absent / not a string | `classify_before_planning` | — (null) |

Target family: an entry naming ML-KEM / Kyber maps to
`ML-KEM (FIPS 203)`, SLH-DSA / SPHINCS+ to `SLH-DSA (FIPS 205)`,
ML-DSA / Dilithium to `ML-DSA (FIPS 204)`; otherwise a key-exchange
purpose maps to ML-KEM and a signature purpose to
`ML-DSA (FIPS 204) / SLH-DSA (FIPS 205)`; a vulnerable or hybrid
entry with neither names the dual family for both purposes.

Priority: the map is in priority order (`priority_rank` 1..N) —
migration groups first (`quantum_vulnerable`, then
`hybrid_classical_pq`, then `unknown`, then `pq_ready`, then
`symmetric_or_hash_not_broken`), and within a group the longest
`shelf_life_years` first (missing shelf-life last in its group; ties
keep submission order). This is the skill's "shelf-life × migration
horizon = priority order" applied as an ordering — no year threshold
or cutoff is applied anywhere.

The output status is one of `complete` (inventory present and every
entry valid, classified, and carrying a numeric shelf-life),
`partial` (a map was computed but some entries are invalid,
unclassified, or missing shelf-life), or `insufficient_evidence`
(no inventory, an empty inventory, or no valid entries), with
`counts` (total, invalid_entries, by_classification,
migration_needed, missing_shelf_life, missing_owner), the ordered
`migration_map` rows (id, surface, algorithm, purpose,
classification, action, target_family, shelf_life_years, owner,
priority_rank, basis), and a one-line `summary`.

## Status

Tier A · status: **built-locally** — deterministic core built and
verified locally (Python oracle + byte-identical TypeScript port);
no endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
