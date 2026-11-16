# Crypto inventory pq migration map — full documentation

**Crypto inventory pq migration map** · slug `crypto-inventory-pq-migration-map` · deliverable type: MAP · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (Diátaxis architecture — tutorial / how-to / reference / explanation — in CommonMark, with role views per audience). All worked examples are real recorded trial runs, reproduced verbatim (see the provenance line under Worked examples).

## Tutorial — your first call, step by step

This tutorial walks through the recorded full-pass trial run for this atom — the same run reproduced verbatim under Worked examples. You submit one JSON manifest and receive one map back.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "crypto-inventory-pq-migration-map"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** The manifest names the system under review (`system: "production-cluster-01"`) and declares the evidence the atom checks, field by field (the full typed field list is under Reference — Input reference). The single entry declares RSA used for `key_exchange` on the `tls` surface, with a 10-year shelf life and owner `team-alpha`. The atom classifies RSA as classical asymmetric cryptography — the class a cryptographically relevant quantum computer breaks — and computes the row you see in the worked example below: classification `quantum_vulnerable`, action `migrate_hybrid`, target family `ML-KEM (FIPS 203)` (the key-exchange purpose selects ML-KEM), priority rank 1.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/crypto-inventory-pq-migration-map` with the manifest as the JSON body and your `Authorization` header. The recorded call returned HTTP 200.

**Step 4 — Read the map.** The response status is `complete`. Read `counts` first (totals reconcile the inventory: total, invalid entries, per-classification counts, how many entries need migration, how many are missing shelf-life or owner), then `migration_map` — the entries in priority order, each classified with its action and target family. The recorded run's summary: "Migration map over 1 inventory entries: 1 quantum-vulnerable, 0 hybrid, 0 PQ-ready, 0 symmetric/hash not broken, 0 unknown; 0 missing shelf-life."

**Step 5 — File or act on the result.** Keep the full JSON response (and its `stamp`) with the work it judges: it is the deliverable — one unit of sale = one delivered result. To see how the same atom responds when the evidence is not in order, compare the violations and malformed worked examples below before your first production call.

## How-to guides

### How to get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email — a sign-in link is emailed to you.
2. Open the link (it mints your session), then `POST /v1/keys` with `{"atom": "crypto-inventory-pq-migration-map"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/crypto-inventory-pq-migration-map` with the manifest as the JSON body and header `Authorization: Bearer <key>`.
4. HTTP 200 returns the deliverable JSON (see Reference — Output format). Errors are HTTP 401 / 403 / 422 / 429 (see Reference — Errors). Rate limit: 60 requests/minute and 10,000 requests/day per key.

### How to call via MCP

Call `POST https://atoms.pipavia.com/mcp/crypto-inventory-pq-migration-map` and invoke the tool `crypto_inventory_pq_migration_map` (`tools/call`), passing the manifest object as the tool arguments, with the same `Authorization: Bearer <key>` header. The MCP face returns the same deliverable core as REST — the recorded verification battery confirmed face parity: the MCP `structuredContent` is deep-equal to the REST artifact for the full-pass case (see TEST-REPORT.md).

### How to read a failing verdict and fix the manifest

A failing outcome for this atom is status `partial` (a map was computed, but the inventory has gaps) — or `insufficient_evidence` when there is nothing valid to map. Work from `counts`, not from the status alone:

1. In the recorded violations run the status was `partial` with counts `invalid_entries: 1`, `missing_shelf_life: 1`, `missing_owner: 1`.
2. `invalid_entries` counts entries that are not objects — they are skipped, so replace each with a full entry object.
3. `missing_shelf_life` / `missing_owner` count valid entries lacking a numeric `shelf_life_years` / an `owner` — supply both on every entry.
4. An entry classified `unknown` (algorithm absent, not a string, or in no known family) keeps the status `partial` — name the algorithm precisely so it classifies.

Make every inventory entry an object (a bare string entry is counted in `counts.invalid_entries` and skipped), and give every entry a numeric `shelf_life_years` and an `owner`. In the recorded violations run the RSA signature entry carried neither, so `counts.missing_shelf_life` and `counts.missing_owner` were both 1 and the status stayed `partial` even though its map row was computed (`quantum_vulnerable` / `migrate_hybrid` / `ML-DSA (FIPS 204) / SLH-DSA (FIPS 205)`). Supply the missing values and resubmit — the map, counts and status are recomputed deterministically.

### How to handle a 422 `invalid_input`

A type-violating manifest is rejected before any evaluation — HTTP 422, never a verdict. The recorded malformed run for this atom returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "system",
  "detail": "system must be a string"
}
```

Read `field` first: it names the first offending field (`system`), and `detail` states the expected type ("system must be a string"). Fix that field's type in your manifest and resubmit; if the manifest has more than one type violation, the gateway reports them one at a time, so repeat until the call returns HTTP 200. The full recorded malformed request and response are Worked examples, example 3.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/crypto-inventory-pq-migration-map` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/crypto-inventory-pq-migration-map` — tool name `crypto_inventory_pq_migration_map`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Gateway:** https://atoms.pipavia.com, gateway version 1.1.0 at the recorded verification run.

### Input reference

The caller submits one JSON manifest. `system` (string) is carried into the output, not itself mapped. The map is computed over `inventory`. A non-object entry is counted in `counts.invalid_entries` and skipped. Types below are from SERVICE.md; the evidence `inputSchema` corroborates them.

| Field | Type | Read by | Notes |
|---|---|---|---|
| `system` | string | manifest | string; carried into the output, not itself mapped |
| `inventory` | array | manifest | list of entries, below |
| `inventory[].id` | string | entry | string; carried into the map row |
| `inventory[].surface` | string | entry | string; where the crypto lives — e.g. `tls`, `code_signing`, `firmware_signing`, `agent_trust_root`, `at_rest_envelope`, `pki`; carried into the map row, not itself classified |
| `inventory[].algorithm` | string | entry | string; classified by family — see below |
| `inventory[].purpose` | string | entry | string; `key_exchange` / `kem` / `key_encapsulation` / `encryption` / `key_transport` select the ML-KEM target, `signature` / `signing` select the ML-DSA / SLH-DSA target |
| `inventory[].shelf_life_years` | number | entry | number; how long the data or signature must survive — orders priority within each group; absent / non-numeric = missing |
| `inventory[].owner` | string | entry | string; carried into the map row; absence is counted in `counts.missing_owner` |

### Computed outputs — operations, classifications and ordering (no `checks` array)

This is a computed map atom: its responses carry **no `checks` array**. What it computes, per SERVICE.md and the recorded responses, is:

**Classification** — matched on the lowercased algorithm name, PQ names stripped before the classical scan:

| Classification | Rule | Action | Target family |
|---|---|---|---|
| `quantum_vulnerable` | classical asymmetric only (RSA, ECDSA, ECDH/ECDHE, Ed25519/Ed448, X25519/X448, DSA, Diffie-Hellman, ElGamal, ECIES, secp/P- curves) | `migrate_hybrid` | by purpose / algorithm (below) |
| `hybrid_classical_pq` | classical asymmetric + a NIST PQ algorithm together | `complete_hybrid_transition` | by purpose / algorithm (below) |
| `pq_ready` | NIST PQ only (ML-KEM, ML-DSA, SLH-DSA — incl. Kyber / Dilithium / SPHINCS+ names) | `retain_pq` | the family the entry already names |
| `symmetric_or_hash_not_broken` | symmetric / hash only (AES, ChaCha, SHA-2 / SHA-3, HMAC, KDFs) | `no_pq_migration_needed` | — (null) |
| `unknown` | none of the above, or algorithm absent / not a string | `classify_before_planning` | — (null) |

**Target family** — an entry naming ML-KEM / Kyber maps to `ML-KEM (FIPS 203)`, SLH-DSA / SPHINCS+ to `SLH-DSA (FIPS 205)`, ML-DSA / Dilithium to `ML-DSA (FIPS 204)`; otherwise a key-exchange purpose (`key_exchange` / `kem` / `key_encapsulation` / `encryption` / `key_transport`) maps to ML-KEM and a signature purpose (`signature` / `signing`) to `ML-DSA (FIPS 204) / SLH-DSA (FIPS 205)`; a vulnerable or hybrid entry with neither names the dual family for both purposes.

**Priority ordering** — `priority_rank` 1..N: migration groups first (`quantum_vulnerable`, then `hybrid_classical_pq`, then `unknown`, then `pq_ready`, then `symmetric_or_hash_not_broken`); within a group, longest `shelf_life_years` first (missing shelf-life last in its group; ties keep submission order). No year threshold or cutoff is applied anywhere.

**Counts** — `total` (valid entries mapped), `invalid_entries` (non-object entries, skipped), `by_classification` (one count per classification above), `migration_needed`, `missing_shelf_life`, `missing_owner`. In the recorded full-pass run: total 1, invalid_entries 0, quantum_vulnerable 1, migration_needed 1, missing_shelf_life 0, missing_owner 0.

**Map rows** — each row carries `id`, `surface`, `algorithm`, `purpose`, `classification`, `action`, `target_family`, `shelf_life_years`, `owner`, `priority_rank`, `basis` (the recorded basis for the full-pass row: "classical asymmetric algorithm — quantum breaks today's asymmetric crypto").

### Output format

HTTP 200 JSON with keys: `service`, `atom_version`, `system` (carried from the manifest), `status`, `counts` (see above), `migration_map` (ordered rows, see above), `summary` (one line) and `stamp` (a text rendering of the map headed `CRYPTO INVENTORY PQ MIGRATION MAP` with the system, status and summary). The recorded full-pass response is reproduced in full under Worked examples.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `complete` (status) | inventory present and every entry valid, classified, and carrying a numeric shelf-life |
| `partial` (status) | a map was computed but some entries are invalid, unclassified (`unknown`), or missing shelf-life |
| `insufficient_evidence` (status) | no inventory, an empty inventory, or no valid entries |
| `quantum_vulnerable` / `hybrid_classical_pq` / `pq_ready` / `symmetric_or_hash_not_broken` / `unknown` (classification) | see the classification table above |
| `migrate_hybrid` / `complete_hybrid_transition` / `retain_pq` / `no_pq_migration_needed` / `classify_before_planning` (action) | the action paired with each classification, in the same order |

### Errors

Only the shapes evidenced in the repo / gateway docs are documented here — no payload is invented. The 422 shape is recorded verbatim in the verification battery; the 401 / 403 / 429 codes and meanings are from USER-GUIDE.md (no response payload for them is recorded in the evidence battery).

| HTTP | Error | Shape / meaning |
|---|---|---|
| 401 | unauthenticated | missing or invalid key — send `Authorization: Bearer <key>` with a valid gateway key |
| 403 | scope | the key lacks this atom's scope — issue the key for this atom (`POST /v1/keys` with this atom's slug) |
| 422 | `invalid_input` | recorded shape: `{"ok": false, "error": "invalid_input", "field": "system", "detail": "system must be a string"}` — `field` names the first offending field, `detail` states the expected type; returned before any evaluation, never as a verdict |
| 429 | rate limit | per-key rate limit exceeded (60/minute, 10,000/day) — back off and retry within the limit |

### Rate limits + pricing status

- **Rate limits (contract.yaml):** 60 requests/minute per key; 10,000 requests/day per key.
- **Pricing:** pricing unit is the deliverable; `pricing.rate` is `null` (rate status: pending — prices are set only from measured production cost per unit). **Free during trial — rate pending.**
- **Support:** info@pipavia.com

## Explanation — what this atom does, and how the verdict is decided

This is a computed map atom, not a checklist atom: its responses carry no `checks` array. Each inventory entry is classified by algorithm family — classical asymmetric only is `quantum_vulnerable`; classical asymmetric combined with a NIST post-quantum algorithm is `hybrid_classical_pq`; NIST PQ only (ML-KEM, ML-DSA, SLH-DSA, including the Kyber / Dilithium / SPHINCS+ names) is `pq_ready`; symmetric / hash only is `symmetric_or_hash_not_broken`; anything else, or a missing / non-string algorithm, is `unknown`. PQ names are stripped before the classical scan so ML-DSA / SLH-DSA are not misread as classical DSA. The target family follows purpose: key-exchange purposes map to ML-KEM, signature purposes to ML-DSA / SLH-DSA, and an entry that already names a PQ family maps to that family. Priority is an ordering, not a threshold: migration groups first (`quantum_vulnerable`, then `hybrid_classical_pq`, then `unknown`, then `pq_ready`, then `symmetric_or_hash_not_broken`), and within a group the longest `shelf_life_years` first, missing shelf-life last in its group, ties keeping submission order — the skill's shelf-life × migration-horizon priority applied as an ordering, with no year cutoff applied anywhere.

**How the status is decided (deterministic core).** The same inventory always produces the same map: classification, target selection and priority ordering are pure functions of the submitted entries, and the recorded battery confirmed byte-identical repeat responses and REST/MCP parity. Status follows the counts: `complete` when the inventory is present and every entry is valid, classified and carrying a numeric shelf-life; `partial` when a map was computed but some entries are invalid, unclassified or missing shelf-life (in the recorded violations run, an invalid entry plus missing shelf-life and owner produced `partial`); `insufficient_evidence` when there is no inventory, an empty inventory, or no valid entries. Absence is never silently treated as safety: an unclassifiable algorithm is `unknown` with action `classify_before_planning`, and an empty inventory returns `insufficient_evidence`, not an empty success.

**What it does NOT do.**

- It does not discover or scan your systems — it classifies only the inventory you submit. Cryptography you do not list is not in the map.
- It does not perform any migration, generate keys, or validate that a named algorithm is actually deployed as declared; it maps the declared inventory.
- It applies no shelf-life threshold or migration deadline of its own — priority is purely the documented ordering.
- A `symmetric_or_hash_not_broken` classification means no PQ migration is needed for that entry under the bound skill's families (the asymmetric side is what breaks; AES-256 is fine) — it is not a general security approval of the entry.
- It sells the map — the bounded judgment artifact — never the underlying post-quantum knowledge itself.

**Buyer / use context.** First buyer hypothesis: teams and agents working in Security & privacy who need a post-quantum migration map on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). House self-use (internal caller, zero price, metered to the internal cost ledger): **Long-lived product signing and archives**. One unit of sale = one delivered result.

## Role views

### For integrators (Users)

Integrate with two calls: `POST https://atoms.pipavia.com/v1/crypto-inventory-pq-migration-map` (REST) or the MCP tool `crypto_inventory_pq_migration_map` at `POST https://atoms.pipavia.com/mcp/crypto-inventory-pq-migration-map`. Authenticate with `Authorization: Bearer <key>` (key flow: How-to guides). Treat HTTP 200 as the deliverable, HTTP 422 as a client bug to fix by field name, HTTP 401/403 as key/scope problems, and HTTP 429 as back-off. Persist the full response — including `summary` and `stamp` — as the record of the judgment; re-calling with the same manifest returns the identical result, so retries are safe. Stay within 60 requests/minute and 10,000/day per key.

### For developers

Manifest authoring: build the manifest field-by-field from Reference — Input reference; respect the must-be-`false` constraints and the gated conditionals, because both invert naive boolean intuition. Determinism: the evaluator is a pure function of the manifest — no clocks, no randomness, no external lookups — so golden-file testing against the worked examples below is exact. Implementation pointers (contract.yaml): src/crypto_inventory_pq_migration_map.py — `evaluate(manifest)` -> migration-map dict; CLI prints JSON + stamp; tests: tests/test_crypto_inventory_pq_migration_map.py — 20 tests, all passing 2026-11-15. The atom is bound to the `post-quantum-cryptography` skill (R1: fixes land in the skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps).

### For ops

Endpoints: REST `POST /v1/crypto-inventory-pq-migration-map` and MCP `POST /mcp/crypto-inventory-pq-migration-map` on https://atoms.pipavia.com (gateway v1.1.0 at last verification). Key scope: per user, per atom — a key for one atom never verifies for another; scope failures surface as HTTP 403, missing/invalid keys as 401. Rate limits: 60/min and 10,000/day per key (HTTP 429 on breach). Error monitoring: alert on 422 spikes (client manifest drift), 403 (scope mis-issuance) and any 5xx (no 5xx shape is documented — none is evidenced). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing rate pending, free during trial, so metering is cost-ledger only.

### For regulators

The migration map is structured as inventory evidence: every submitted cryptographic use appears exactly once, classified, with its action, its target family (ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205) where applicable), its shelf life, its owner and its priority rank, and the `counts` block reconciles totals — including `invalid_entries`, `missing_shelf_life` and `missing_owner`, so gaps in the inventory are visible rather than silent. A `partial` status is itself evidence that the inventory is incomplete. The atom classifies the declared inventory only; it does not discover cryptography or certify that a migration has been performed (see Explanation — limits).

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:52:38.309356+00:00 against gateway v1.1.0, external verification lane, source `verification/work/crypto-inventory-pq-migration-map/evidence.json`. Inputs are the recorded case inputs; responses are the recorded REST executions' responses, reproduced verbatim (pretty-printed, indent 2). The sparse case from the same battery (result `insufficient_evidence` on minimal input) is recorded in TEST-REPORT.md and the same evidence file.

### Example 1 — full-pass (HTTP 200)

Input:

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

Response:

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
      "basis": "classical asymmetric algorithm — quantum breaks today's asymmetric crypto"
    }
  ],
  "summary": "Migration map over 1 inventory entries: 1 quantum-vulnerable, 0 hybrid, 0 PQ-ready, 0 symmetric/hash not broken, 0 unknown; 0 missing shelf-life.",
  "stamp": "CRYPTO INVENTORY PQ MIGRATION MAP\nsystem: production-cluster-01\nSTATUS: complete\nMigration map over 1 inventory entries: 1 quantum-vulnerable, 0 hybrid, 0 PQ-ready, 0 symmetric/hash not broken, 0 unknown; 0 missing shelf-life."
}
```

### Example 2 — violations (HTTP 200)

Input:

```json
{
  "system": "test-system",
  "inventory": [
    {
      "id": "item-2",
      "surface": "pki",
      "algorithm": "RSA",
      "purpose": "signature"
    },
    "invalid-entry-string"
  ]
}
```

Response:

```json
{
  "service": "crypto-inventory-pq-migration-map",
  "atom_version": "0.1.0",
  "system": "test-system",
  "status": "partial",
  "counts": {
    "total": 1,
    "invalid_entries": 1,
    "by_classification": {
      "quantum_vulnerable": 1,
      "hybrid_classical_pq": 0,
      "pq_ready": 0,
      "symmetric_or_hash_not_broken": 0,
      "unknown": 0
    },
    "migration_needed": 1,
    "missing_shelf_life": 1,
    "missing_owner": 1
  },
  "migration_map": [
    {
      "id": "item-2",
      "surface": "pki",
      "algorithm": "RSA",
      "purpose": "signature",
      "classification": "quantum_vulnerable",
      "action": "migrate_hybrid",
      "target_family": "ML-DSA (FIPS 204) / SLH-DSA (FIPS 205)",
      "shelf_life_years": null,
      "owner": null,
      "priority_rank": 1,
      "basis": "classical asymmetric algorithm — quantum breaks today's asymmetric crypto"
    }
  ],
  "summary": "Migration map over 1 inventory entries: 1 quantum-vulnerable, 0 hybrid, 0 PQ-ready, 0 symmetric/hash not broken, 0 unknown; 1 missing shelf-life.",
  "stamp": "CRYPTO INVENTORY PQ MIGRATION MAP\nsystem: test-system\nSTATUS: partial\nMigration map over 1 inventory entries: 1 quantum-vulnerable, 0 hybrid, 0 PQ-ready, 0 symmetric/hash not broken, 0 unknown; 1 missing shelf-life."
}
```

### Example 3 — malformed (HTTP 422)

Input:

```json
{
  "system": 12345,
  "inventory": "not-a-list"
}
```

Response:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "system",
  "detail": "system must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes · Developers Yes · Ops Yes · Regulators Yes |
| Checks named vs recorded | N/A — computed map atom: responses carry no `checks` array; computed outputs, classifications, actions and ordering documented instead (5 classifications / 5 actions) |
| Verdict vocabulary complete | Yes — `complete`, `partial`, `insufficient_evidence`; 5 classifications; 5 actions — complete |
| Input reference typed | Yes — 8 fields with types (SERVICE.md field table) |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/crypto-inventory-pq-migration-map/evidence.json` |

