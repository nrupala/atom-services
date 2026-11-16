# Zero knowledge claim audit — full documentation

**Zero knowledge claim audit** · slug `zero-knowledge-claim-audit` · deliverable type: CHECK · atom version 0.1.0 · status: **live — release candidate (one-week RC soak to 2026-11-22)**

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (worked example 1 below reproduces its request and response verbatim).

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the full flow is in the how-to below). Every call sends the key as `Authorization: Bearer <key>`.

**Step 2 — build the manifest.** The caller assembles one JSON manifest naming the subject in `product` (`"SecureVault"`) and declaring the evidence the atom checks, group by group (the input reference below lists every field and its type). In the recorded run, every checked field is supplied.

**Step 3 — call the REST endpoint.** `POST https://atoms.pipavia.com/v1/zero-knowledge-claim-audit` with the manifest as the body and the `Authorization` header set.

**Step 4 — read the verdict.** The recorded response came back HTTP 200 with verdict `CLAIMS_SOUND`. Its summary: "27 pass, 0 fail, 0 missing of 27 checks across six sections." Every section reports `pass` (core_test, client_side_encryption, key_journey, trusted_parties_and_recovery, plaintext_and_metadata_scope, theater_and_threat_model) and every check in the `checks` array reports `pass` — that array, with its per-check evidence strings, is the deliverable's reasoning, not decoration.

**Step 5 — trust but verify.** The same manifest submitted twice returned byte-identical REST responses, and the MCP face returned a structurally identical result — both properties are recorded in the evidence (`determinism_byte_identical`, `parity_structured_equal`). Same input in, same deliverable out.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "zero-knowledge-claim-audit"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. `POST https://atoms.pipavia.com/v1/zero-knowledge-claim-audit` — body = the manifest object; same `Authorization` header. HTTP 200 returns the deliverable as JSON.

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/zero-knowledge-claim-audit`
- Tool name: `zero_knowledge_claim_audit` — `tools/call` arguments = the manifest object (the same object you would POST to REST).
- Send the same `Authorization: Bearer <key>` header. The MCP result's structured content is the same deliverable the REST face returns (parity is recorded in the evidence).

### Read a failing verdict and fix the manifest

The recorded violations run (worked example 2) returned HTTP 200 with verdict `CLAIMS_UNSOUND`: "23 pass, 4 fail, 0 missing of 27 checks across six sections." Read a failing response in this order:

1. **`verdict` + `summary`** — the counts tell you how many checks fail vs are missing. Fail and missing are different problems: a fail means your manifest *declares evidence against you*; missing means you *did not declare the evidence at all*.
2. **`checks` with `status: "fail"`** — in the recorded run:
   - `server_operator_cannot_read_user_data` (section `core_test`) — evidence: "skill: the core test — can the server operator (malicious, curious, or compelled) read user data? If yes, the system is not zero-knowledge"
   - `trusted_components_named_including_client_os_distribution` (section `trusted_parties_and_recovery`) — evidence: "trusted_components=['client'] (skill: name every trusted component explicitly — including the client itself, the OS, and the distribution channel)"
   - `recovery_claims_consistent` (section `trusted_parties_and_recovery`) — evidence: "password_reset_recovers_data=True no_recovery_possible_claimed=True (skill: read the recovery story — 'forgot password' recovery and 'we can't recover your data' cannot both be true; the recovery mechanism defines the real trust model)"
   - `web_app_trust_distinction_acknowledged` (section `theater_and_threat_model`) — evidence: "client_type='web_app_served_by_same_server' web_app_trust_distinction_acknowledged=False (skill: the web-app paradox — browser-delivered crypto moves trust to the server's code pipeline; it is not the same guarantee as a locally installed client, and that distinction must be stated)"
   Fix = change the underlying practice or record so the declaration becomes true, then resubmit. Editing the manifest to claim what is not true defeats the deliverable — the atom checks declared evidence, and its value is that the declaration is yours.
3. **`sections`** — a section reports `fail` when any of its checks fails, `insufficient_evidence` when nothing fails but evidence is missing, `pass` only when all its checks pass.

### Handle a 422 invalid_input

A type-violating manifest is rejected before any verdict is computed. The recorded malformed run (worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "claims.claim_basis",
  "detail": "claims.claim_basis must be a string"
}
```

Read `field` for the offending field and `detail` for the expected shape — here, `claims.claim_basis`: "claims.claim_basis must be a string". Fix the type at that field (per the input reference below) and resubmit. A 422 is never a verdict and is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/zero-knowledge-claim-audit` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/zero-knowledge-claim-audit` — tool name `zero_knowledge_claim_audit`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Support: info@pipavia.com

### Input reference

Every field, grouped as SERVICE.md groups them, with its type. All fields are booleans unless a type is noted.

**Group: `output (named in the verdict)`**

| Field | Type | Notes |
|---|---|---|
| `product` | string |  |

**Group: `core_test`**

| Field | Type | Notes |
|---|---|---|
| `claims.claim_basis` | string — `cryptographic_guarantee` passes; a policy-promise value fails |  |
| `access.server_can_read_user_data` | boolean |  |
| `storage.server_stores_only_opaque_bytes` | boolean |  |

**Group: `client_side_encryption`**

| Field | Type | Notes |
|---|---|---|
| `encryption.encryption_happens_on_client_device` | boolean |  |
| `encryption.plaintext_exists_only_on_client_device` | boolean |  |
| `encryption.authenticated_encryption` | boolean |  |
| `encryption.relies_on_tls_alone` | boolean |  |

**Group: `key_journey`**

| Field | Type | Notes |
|---|---|---|
| `keys.keys_never_leave_device` | boolean |  |
| `keys.key_derivation_client_side` | boolean |  |
| `keys.key_journey_documented` | boolean |  |
| `keys.key_backup_uploads_key_to_server` | boolean |  |

**Group: `trusted_parties_and_recovery`**

| Field | Type | Notes |
|---|---|---|
| `trust.key_escrow` | boolean |  |
| `trust.recovery_backdoor` | boolean |  |
| `trust.admin_plaintext_view` | boolean |  |
| `trust.trusted_components` | list of strings |  |
| `trust.trusted_third_parties_in_data_path` | list of strings |  |
| `recovery.password_reset_recovers_data` | boolean |  |
| `recovery.no_recovery_possible_claimed` | boolean |  |

**Group: `plaintext_and_metadata_scope`**

| Field | Type | Notes |
|---|---|---|
| `scope.plaintext_locations_documented` | boolean |  |
| `scope.plaintext_in_logs` | boolean |  |
| `scope.plaintext_in_crash_dumps` | boolean |  |
| `scope.plaintext_in_thumbnails_or_previews` | boolean |  |
| `scope.metadata_leakage_acknowledged` | boolean |  |
| `scope.residual_risks_documented` | boolean |  |

**Group: `theater_and_threat_model`**

| Field | Type | Notes |
|---|---|---|
| `theater.client_type` | string |  |
| `theater.web_app_trust_distinction_acknowledged` | boolean |  |
| `theater.search_or_indexing_requires_server_plaintext_or_tokens` | boolean |  |
| `theater.threat_model_includes_malicious_operator` | boolean |  |

### Checks

Every check the atom runs — 27 in total, exactly as named in the recorded full-pass response, grouped by section. For each check: what it requires to pass (the recorded evidence text states the requirement), and the status semantics that follow the table.

**Section: `core_test`**

| Check | Requires to pass | Notes |
|---|---|---|
| `server_operator_cannot_read_user_data` | skill: the core test — can the server operator (malicious, curious, or compelled) read user data? If yes, the system is not zero-knowledge |  |
| `server_stores_only_opaque_bytes` | skill: the server receives and stores opaque bytes; plaintext exists only on the user's device |  |
| `claim_basis_is_cryptographic_guarantee` | claim_basis='cryptographic_guarantee' (skill: distinguish can't read (cryptographic guarantee) from won't read (policy promise); only the first is ZK) | Computed over the declared string: passes only for `cryptographic_guarantee` ("can't read"), not for a policy promise ("won't read"). |
**Section: `client_side_encryption`**

| Check | Requires to pass | Notes |
|---|---|---|
| `encryption_on_client_device` | skill: client-side encryption, always — if encryption does not happen on your device, it is not zero-knowledge, whatever the marketing page says |  |
| `plaintext_only_on_client_device` | skill: plaintext exists only on the user's device; the server stores unreadable bytes and only the user decrypts |  |
| `authenticated_encryption` | skill: authenticated encryption — ciphertext must be tamper-evident; encryption without authentication lets an attacker modify data silently |  |
| `encryption_independent_of_transport` | skill: encryption independent of transport — TLS protects the pipe, ZK protects the data; a system that relies on TLS alone trusts the server at the end of the pipe |  |
**Section: `key_journey`**

| Check | Requires to pass | Notes |
|---|---|---|
| `keys_never_leave_device` | skill: keys never leave the device — not in transit, not 'temporarily', not for 'convenience features' |  |
| `key_derivation_client_side` | skill: key derivation happens locally (password -> KDF -> key, all client-side) |  |
| `key_journey_documented` | skill: follow the key — where is it generated, where is it stored, what crosses the network? Gaps in the diagram are the audit findings |  |
| `no_key_backup_uploaded_to_server` | skill (theater): key 'backup' uploads the key to the server under another name |  |
**Section: `trusted_parties_and_recovery`**

| Check | Requires to pass | Notes |
|---|---|---|
| `no_key_escrow` | skill: no trusted third parties in the data path — no key escrow |  |
| `no_recovery_backdoor` | skill: no trusted third parties in the data path — no recovery backdoor |  |
| `no_admin_plaintext_view` | skill: no trusted third parties in the data path — no admin plaintext view |  |
| `trusted_components_named_including_client_os_distribution` | trusted_components=['client', 'operating_system', 'distribution_channel'] (skill: name every trusted component explicitly — including the client itself, the OS, and the distribution channel) | Computed over the declared list: passes only when it includes `client`, `operating_system` and `distribution_channel`. |
| `trusted_third_parties_in_data_path_listed` | trusted_third_parties_in_data_path=[] (skill: each exception is a named party you now trust — list them; an empty list declares none) | Passes for any declared list — an empty list declares no trusted third party; a non-empty list names them. |
| `recovery_claims_consistent` | password_reset_recovers_data=False no_recovery_possible_claimed=True (skill: read the recovery story — 'forgot password' recovery and 'we can't recover your data' cannot both be true; the recovery mechanism defines the real trust model) | Computed over both `recovery.*` fields: declaring both password-reset recovery and "no recovery is possible" fails. |
**Section: `plaintext_and_metadata_scope`**

| Check | Requires to pass | Notes |
|---|---|---|
| `plaintext_locations_documented` | skill: follow the plaintext — list every place plaintext exists, however briefly (memory, logs, crash dumps, thumbnails, previews); each is a scope boundary |  |
| `plaintext_not_in_logs` | skill: follow the plaintext — plaintext in logs is a scope boundary where plaintext exists outside the device guarantee |  |
| `plaintext_not_in_crash_dumps` | skill: follow the plaintext — plaintext in crash dumps is a scope boundary where plaintext exists outside the device guarantee |  |
| `plaintext_not_in_thumbnails_or_previews` | skill: follow the plaintext — plaintext in thumbnails and previews is a scope boundary where plaintext exists outside the device guarantee |  |
| `metadata_leakage_acknowledged` | skill: check the metadata — traffic analysis and blob-size leakage survive encryption; sizes, timing, and access patterns are data too, and ZK does not hide that you store data, how much, or when you access it |  |
| `residual_risks_documented` | skill: residual risks are part of the answer, not a footnote |  |
**Section: `theater_and_threat_model`**

| Check | Requires to pass | Notes |
|---|---|---|
| `client_type_declared` | client_type='native_app' (skill: say which one you are looking at — a locally installed client or a web app served by the same server) | The declared client type is reported in the evidence and gates the web-app check. |
| `web_app_trust_distinction_acknowledged` | client is not declared as a web app served by the same server | Conditional: binds only when `theater.client_type` is `web_app_served_by_same_server`; for other client types it passes as not applicable. |
| `search_indexing_does_not_expose_plaintext_or_tokens` | skill (theater): the 'encrypted' search/indexing requires the server to see plaintext or searchable tokens |  |
| `threat_model_includes_malicious_operator` | skill (theater): the threat model quietly excludes the actual adversary (a malicious operator) |  |

**Per-check status semantics:** `pass` — the requirement is met on the declared evidence (a conditional check whose gate does not bind also reports `pass`, with its evidence text saying why it does not bind, e.g. "no conveyor drives declared"); `fail` — the field is present but false/invalid, a red line is crossed, or a computed comparison fails; `missing` — the field (or a value a computed check needs) is absent. There is no separate not-applicable status value in the recorded responses: not-applicable is expressed as `pass` with explanatory evidence.

### Output format

A successful call returns one JSON object. The recorded full-pass response carries these top-level keys, in order: `service`, `atom_version`, `product`, `verdict`, `sections`, `checks`, `summary`, `stamp`. It always includes `service` and `atom_version`, the subject echo where the manifest names one, the verdict/status, a human-readable `summary`, and a text `stamp` restating the result.

The response carries `product` (echoed), the six `sections`, all 27 `checks`, a `summary` and a text `stamp`. Several check evidence strings quote the declared values they judged (e.g. the trusted-components list, the claim basis, the client type).

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `CLAIMS_SOUND` | All 27 checks pass across the six sections — the declared zero-knowledge architecture claims are complete and internally consistent. |
| `CLAIMS_UNSOUND` | At least one check fails — e.g. the server can read user data, encryption relies on TLS alone, a key backup uploads the key, recovery claims contradict each other, or the trusted-components list omits the client, the OS or the distribution channel. |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but evidence is missing (absent fields). |
| `claims.claim_basis = cryptographic_guarantee` | The passing value: a "can't read" cryptographic guarantee, as opposed to a policy promise ("won't read"), which fails the claim-basis check. |
| `theater.client_type = web_app_served_by_same_server` | The value that binds the conditional web-app trust-distinction check; other declared client types (e.g. `native_app`) leave that check passing as not applicable. |
| section status `pass` | Every check in the section passes (including not-applicable passes). |
| section status `fail` | At least one check in the section fails. |
| section status `insufficient_evidence` | No check in the section fails, but at least one is missing. |
| check status `pass` / `fail` / `missing` | See the status semantics under Checks. |

### Errors

Only the shapes evidenced in the gateway code and the recorded battery are documented here:

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | Missing, malformed, unknown or revoked key (REST face shape, from the gateway call path). |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the <namespace> scope; issue it for this atom first"}` | The key is valid but was never issued for this atom — issue it for `zero-knowledge-claim-audit` and retry. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "claims.claim_basis", "detail": "claims.claim_basis must be a string"}` (recorded verbatim in worked example 3) | The manifest violates a field type; `field` and `detail` name the problem. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for zero-knowledge-claim-audit exceeded"}` (a per-day variant names the 10000/day limit) | Rate limit exceeded; the call is not metered. |

### Rate limits and pricing status

- Rate limits (contract.yaml, SPEC default): **60 calls/minute and 10000 calls/day per key** for this atom.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is null and `rate_status` is pending — **Free during trial — rate pending.** Prices are set only from measured production cost per unit, per the billing protocol in the contract.

## Explanation

This atom sells its deliverable — a bounded check artifact — never the underlying knowledge itself. teams and agents working in Security & privacy who need this check on demand and would rather buy it per use than build or staff the capability themselves. House self-use: **Auditing vault and zerok claims**.

**How the verdict is decided.** Deterministic core (byte-identical repeats and REST/MCP parity recorded). Scope correction, stated plainly: the bound skill is about zero-knowledge *software architecture* — client-side encryption, keys that never leave the device, a server that stores only opaque bytes — so this audit states no proof-system facts and checks none. Most checks read one declared field each; several are inverted (the passing value is `false`: the server cannot read user data, no key escrow, no recovery backdoor, no admin plaintext view, plaintext not in logs/crash dumps/thumbnails). Three checks are computed or conditional: `trusted_components` passes only when the declared list includes `client`, `operating_system` and `distribution_channel`; `trusted_third_parties_in_data_path` passes for any declared list (empty declares none; non-empty names them); the recovery-consistency check needs both `recovery.*` fields — declaring both password-reset recovery and "no recovery is possible" fails, because the two cannot both be true; and the web-app check binds only when `client_type` is `web_app_served_by_same_server`. Absent = missing; present-but-false/invalid = fail.

**What it does NOT do.**

- Declared claims only: an audit of the consistency and completeness of declared claims and declared evidence. It does not inspect a running system, read its code, or test whether the declared posture is true in operation.
- No proof verification, and not a privacy certification. It does not replace a cryptographic review or a formal security audit.
- Zero-knowledge proof systems are excluded by name — proof systems, trusted setups, circuits and constraint systems are not checked, because the bound skill states no facts or thresholds about them.
- No invented thresholds: no key length, KDF, algorithm or iteration threshold is checked (that specificity belongs to the sibling `encryption-claim-audit` atom).
- Honest limits carried from the skill: zero-knowledge does not protect against a compromised client device, malware, or physical access to an unlocked device, and it does not hide *that* data is stored, how much, or when it is accessed — only *what* it contains.

## Role views

### For integrators (Users)

One manifest in, one deliverable out, over REST or MCP with the same key. Start with the tutorial, keep the input reference beside your manifest builder, and treat the response's verdict/status, summary and per-item detail as the product. Rate: free during trial — rate pending; limits 60/min, 10000/day per key. Support: info@pipavia.com.

### For developers

Manifest authoring: field names, groupings and types are exactly as in the input reference — a type violation is a 422 before any computation, and an absent field is a deliberate signal (missing evidence), not a default. Determinism: the core is deterministic — the recorded battery proves byte-identical repeat REST responses and REST/MCP structured parity for this atom, so golden-file testing against the worked examples below is sound. Implementation: `services/zero-knowledge-claim-audit/src/zero_knowledge_claim_audit.py` (Python 3, stdlib only; `evaluate(manifest)`), tests: `services/zero-knowledge-claim-audit/tests/test_zero_knowledge_claim_audit.py` (23 tests, per contract.yaml). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract R1 rule).

### For ops

Endpoints: REST `POST /v1/zero-knowledge-claim-audit` and MCP `POST /mcp/zero-knowledge-claim-audit` (tool `zero_knowledge_claim_audit`) on https://atoms.pipavia.com. Key scope: per user, per atom — a key never verifies for another atom; 403 means the scope was never issued. Rate limits: 60/min, 10000/day per key (429, not metered). Error monitoring: watch the 401 (unauthorized) / 403 (scope_required) / 422 (invalid_input, with field+detail) / 429 (rate_limit) shapes in the errors table. Status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

### For regulators

Included because this atom is compliance-facing (privacy): its verdict is audit evidence over a product's zero-knowledge claims. Scope correction, on the record: the bound skill is zero-knowledge software *architecture* — client-side encryption, key journey, server access and storage, trusted parties, plaintext and metadata scope — and the atom states no proof-system facts, verifies no cryptographic proof, and is not a privacy certification. What it gives a reviewer: a deterministic consistency/completeness verdict over the declared claims, with the claim basis (cryptographic guarantee vs policy promise) settled explicitly. What it does not give: inspection of a running system or its code, or a formal security audit.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:55:56.371091+00:00 against gateway v1.1.0, external verification lane, source `verification/work/zero-knowledge-claim-audit/evidence.json`. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — verified mechanically against the evidence after writing).

### Example 1 — full-pass (recorded HTTP 200)

Recorded case note: All 27 checks pass; recovery consistency is valid; trusted components list is complete.

Input:

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

Response (REST):

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
  "checks": [
    {
      "section": "core_test",
      "check": "server_operator_cannot_read_user_data",
      "status": "pass",
      "evidence": "skill: the core test — can the server operator (malicious, curious, or compelled) read user data? If yes, the system is not zero-knowledge"
    },
    {
      "section": "core_test",
      "check": "server_stores_only_opaque_bytes",
      "status": "pass",
      "evidence": "skill: the server receives and stores opaque bytes; plaintext exists only on the user's device"
    },
    {
      "section": "core_test",
      "check": "claim_basis_is_cryptographic_guarantee",
      "status": "pass",
      "evidence": "claim_basis='cryptographic_guarantee' (skill: distinguish can't read (cryptographic guarantee) from won't read (policy promise); only the first is ZK)"
    },
    {
      "section": "client_side_encryption",
      "check": "encryption_on_client_device",
      "status": "pass",
      "evidence": "skill: client-side encryption, always — if encryption does not happen on your device, it is not zero-knowledge, whatever the marketing page says"
    },
    {
      "section": "client_side_encryption",
      "check": "plaintext_only_on_client_device",
      "status": "pass",
      "evidence": "skill: plaintext exists only on the user's device; the server stores unreadable bytes and only the user decrypts"
    },
    {
      "section": "client_side_encryption",
      "check": "authenticated_encryption",
      "status": "pass",
      "evidence": "skill: authenticated encryption — ciphertext must be tamper-evident; encryption without authentication lets an attacker modify data silently"
    },
    {
      "section": "client_side_encryption",
      "check": "encryption_independent_of_transport",
      "status": "pass",
      "evidence": "skill: encryption independent of transport — TLS protects the pipe, ZK protects the data; a system that relies on TLS alone trusts the server at the end of the pipe"
    },
    {
      "section": "key_journey",
      "check": "keys_never_leave_device",
      "status": "pass",
      "evidence": "skill: keys never leave the device — not in transit, not 'temporarily', not for 'convenience features'"
    },
    {
      "section": "key_journey",
      "check": "key_derivation_client_side",
      "status": "pass",
      "evidence": "skill: key derivation happens locally (password -> KDF -> key, all client-side)"
    },
    {
      "section": "key_journey",
      "check": "key_journey_documented",
      "status": "pass",
      "evidence": "skill: follow the key — where is it generated, where is it stored, what crosses the network? Gaps in the diagram are the audit findings"
    },
    {
      "section": "key_journey",
      "check": "no_key_backup_uploaded_to_server",
      "status": "pass",
      "evidence": "skill (theater): key 'backup' uploads the key to the server under another name"
    },
    {
      "section": "trusted_parties_and_recovery",
      "check": "no_key_escrow",
      "status": "pass",
      "evidence": "skill: no trusted third parties in the data path — no key escrow"
    },
    {
      "section": "trusted_parties_and_recovery",
      "check": "no_recovery_backdoor",
      "status": "pass",
      "evidence": "skill: no trusted third parties in the data path — no recovery backdoor"
    },
    {
      "section": "trusted_parties_and_recovery",
      "check": "no_admin_plaintext_view",
      "status": "pass",
      "evidence": "skill: no trusted third parties in the data path — no admin plaintext view"
    },
    {
      "section": "trusted_parties_and_recovery",
      "check": "trusted_components_named_including_client_os_distribution",
      "status": "pass",
      "evidence": "trusted_components=['client', 'operating_system', 'distribution_channel'] (skill: name every trusted component explicitly — including the client itself, the OS, and the distribution channel)"
    },
    {
      "section": "trusted_parties_and_recovery",
      "check": "trusted_third_parties_in_data_path_listed",
      "status": "pass",
      "evidence": "trusted_third_parties_in_data_path=[] (skill: each exception is a named party you now trust — list them; an empty list declares none)"
    },
    {
      "section": "trusted_parties_and_recovery",
      "check": "recovery_claims_consistent",
      "status": "pass",
      "evidence": "password_reset_recovers_data=False no_recovery_possible_claimed=True (skill: read the recovery story — 'forgot password' recovery and 'we can't recover your data' cannot both be true; the recovery mechanism defines the real trust model)"
    },
    {
      "section": "plaintext_and_metadata_scope",
      "check": "plaintext_locations_documented",
      "status": "pass",
      "evidence": "skill: follow the plaintext — list every place plaintext exists, however briefly (memory, logs, crash dumps, thumbnails, previews); each is a scope boundary"
    },
    {
      "section": "plaintext_and_metadata_scope",
      "check": "plaintext_not_in_logs",
      "status": "pass",
      "evidence": "skill: follow the plaintext — plaintext in logs is a scope boundary where plaintext exists outside the device guarantee"
    },
    {
      "section": "plaintext_and_metadata_scope",
      "check": "plaintext_not_in_crash_dumps",
      "status": "pass",
      "evidence": "skill: follow the plaintext — plaintext in crash dumps is a scope boundary where plaintext exists outside the device guarantee"
    },
    {
      "section": "plaintext_and_metadata_scope",
      "check": "plaintext_not_in_thumbnails_or_previews",
      "status": "pass",
      "evidence": "skill: follow the plaintext — plaintext in thumbnails and previews is a scope boundary where plaintext exists outside the device guarantee"
    },
    {
      "section": "plaintext_and_metadata_scope",
      "check": "metadata_leakage_acknowledged",
      "status": "pass",
      "evidence": "skill: check the metadata — traffic analysis and blob-size leakage survive encryption; sizes, timing, and access patterns are data too, and ZK does not hide that you store data, how much, or when you access it"
    },
    {
      "section": "plaintext_and_metadata_scope",
      "check": "residual_risks_documented",
      "status": "pass",
      "evidence": "skill: residual risks are part of the answer, not a footnote"
    },
    {
      "section": "theater_and_threat_model",
      "check": "client_type_declared",
      "status": "pass",
      "evidence": "client_type='native_app' (skill: say which one you are looking at — a locally installed client or a web app served by the same server)"
    },
    {
      "section": "theater_and_threat_model",
      "check": "web_app_trust_distinction_acknowledged",
      "status": "pass",
      "evidence": "client is not declared as a web app served by the same server"
    },
    {
      "section": "theater_and_threat_model",
      "check": "search_indexing_does_not_expose_plaintext_or_tokens",
      "status": "pass",
      "evidence": "skill (theater): the 'encrypted' search/indexing requires the server to see plaintext or searchable tokens"
    },
    {
      "section": "theater_and_threat_model",
      "check": "threat_model_includes_malicious_operator",
      "status": "pass",
      "evidence": "skill (theater): the threat model quietly excludes the actual adversary (a malicious operator)"
    }
  ],
  "summary": "27 pass, 0 fail, 0 missing of 27 checks across six sections.",
  "stamp": "ZERO-KNOWLEDGE CLAIM AUDIT\nproduct: SecureVault\nVERDICT: CLAIMS_SOUND\n  core_test                    pass\n  client_side_encryption       pass\n  key_journey                  pass\n  trusted_parties_and_recovery pass\n  plaintext_and_metadata_scope pass\n  theater_and_threat_model     pass\n27 pass, 0 fail, 0 missing of 27 checks across six sections."
}
```

### Example 2 — violations (recorded HTTP 200)

Recorded case note: Violates server access, trusted components list, recovery consistency, and web-app trust requirements.

Input:

```json
{
  "product": "InsecureVault",
  "claims": {
    "claim_basis": "cryptographic_guarantee"
  },
  "access": {
    "server_can_read_user_data": true
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
      "client"
    ],
    "trusted_third_parties_in_data_path": []
  },
  "recovery": {
    "password_reset_recovers_data": true,
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
    "client_type": "web_app_served_by_same_server",
    "web_app_trust_distinction_acknowledged": false,
    "search_or_indexing_requires_server_plaintext_or_tokens": false,
    "threat_model_includes_malicious_operator": true
  }
}
```

Response (REST):

```json
{
  "service": "zero-knowledge-claim-audit",
  "atom_version": "0.1.0",
  "product": "InsecureVault",
  "verdict": "CLAIMS_UNSOUND",
  "sections": {
    "core_test": "fail",
    "client_side_encryption": "pass",
    "key_journey": "pass",
    "trusted_parties_and_recovery": "fail",
    "plaintext_and_metadata_scope": "pass",
    "theater_and_threat_model": "fail"
  },
  "checks": [
    {
      "section": "core_test",
      "check": "server_operator_cannot_read_user_data",
      "status": "fail",
      "evidence": "skill: the core test — can the server operator (malicious, curious, or compelled) read user data? If yes, the system is not zero-knowledge"
    },
    {
      "section": "core_test",
      "check": "server_stores_only_opaque_bytes",
      "status": "pass",
      "evidence": "skill: the server receives and stores opaque bytes; plaintext exists only on the user's device"
    },
    {
      "section": "core_test",
      "check": "claim_basis_is_cryptographic_guarantee",
      "status": "pass",
      "evidence": "claim_basis='cryptographic_guarantee' (skill: distinguish can't read (cryptographic guarantee) from won't read (policy promise); only the first is ZK)"
    },
    {
      "section": "client_side_encryption",
      "check": "encryption_on_client_device",
      "status": "pass",
      "evidence": "skill: client-side encryption, always — if encryption does not happen on your device, it is not zero-knowledge, whatever the marketing page says"
    },
    {
      "section": "client_side_encryption",
      "check": "plaintext_only_on_client_device",
      "status": "pass",
      "evidence": "skill: plaintext exists only on the user's device; the server stores unreadable bytes and only the user decrypts"
    },
    {
      "section": "client_side_encryption",
      "check": "authenticated_encryption",
      "status": "pass",
      "evidence": "skill: authenticated encryption — ciphertext must be tamper-evident; encryption without authentication lets an attacker modify data silently"
    },
    {
      "section": "client_side_encryption",
      "check": "encryption_independent_of_transport",
      "status": "pass",
      "evidence": "skill: encryption independent of transport — TLS protects the pipe, ZK protects the data; a system that relies on TLS alone trusts the server at the end of the pipe"
    },
    {
      "section": "key_journey",
      "check": "keys_never_leave_device",
      "status": "pass",
      "evidence": "skill: keys never leave the device — not in transit, not 'temporarily', not for 'convenience features'"
    },
    {
      "section": "key_journey",
      "check": "key_derivation_client_side",
      "status": "pass",
      "evidence": "skill: key derivation happens locally (password -> KDF -> key, all client-side)"
    },
    {
      "section": "key_journey",
      "check": "key_journey_documented",
      "status": "pass",
      "evidence": "skill: follow the key — where is it generated, where is it stored, what crosses the network? Gaps in the diagram are the audit findings"
    },
    {
      "section": "key_journey",
      "check": "no_key_backup_uploaded_to_server",
      "status": "pass",
      "evidence": "skill (theater): key 'backup' uploads the key to the server under another name"
    },
    {
      "section": "trusted_parties_and_recovery",
      "check": "no_key_escrow",
      "status": "pass",
      "evidence": "skill: no trusted third parties in the data path — no key escrow"
    },
    {
      "section": "trusted_parties_and_recovery",
      "check": "no_recovery_backdoor",
      "status": "pass",
      "evidence": "skill: no trusted third parties in the data path — no recovery backdoor"
    },
    {
      "section": "trusted_parties_and_recovery",
      "check": "no_admin_plaintext_view",
      "status": "pass",
      "evidence": "skill: no trusted third parties in the data path — no admin plaintext view"
    },
    {
      "section": "trusted_parties_and_recovery",
      "check": "trusted_components_named_including_client_os_distribution",
      "status": "fail",
      "evidence": "trusted_components=['client'] (skill: name every trusted component explicitly — including the client itself, the OS, and the distribution channel)"
    },
    {
      "section": "trusted_parties_and_recovery",
      "check": "trusted_third_parties_in_data_path_listed",
      "status": "pass",
      "evidence": "trusted_third_parties_in_data_path=[] (skill: each exception is a named party you now trust — list them; an empty list declares none)"
    },
    {
      "section": "trusted_parties_and_recovery",
      "check": "recovery_claims_consistent",
      "status": "fail",
      "evidence": "password_reset_recovers_data=True no_recovery_possible_claimed=True (skill: read the recovery story — 'forgot password' recovery and 'we can't recover your data' cannot both be true; the recovery mechanism defines the real trust model)"
    },
    {
      "section": "plaintext_and_metadata_scope",
      "check": "plaintext_locations_documented",
      "status": "pass",
      "evidence": "skill: follow the plaintext — list every place plaintext exists, however briefly (memory, logs, crash dumps, thumbnails, previews); each is a scope boundary"
    },
    {
      "section": "plaintext_and_metadata_scope",
      "check": "plaintext_not_in_logs",
      "status": "pass",
      "evidence": "skill: follow the plaintext — plaintext in logs is a scope boundary where plaintext exists outside the device guarantee"
    },
    {
      "section": "plaintext_and_metadata_scope",
      "check": "plaintext_not_in_crash_dumps",
      "status": "pass",
      "evidence": "skill: follow the plaintext — plaintext in crash dumps is a scope boundary where plaintext exists outside the device guarantee"
    },
    {
      "section": "plaintext_and_metadata_scope",
      "check": "plaintext_not_in_thumbnails_or_previews",
      "status": "pass",
      "evidence": "skill: follow the plaintext — plaintext in thumbnails and previews is a scope boundary where plaintext exists outside the device guarantee"
    },
    {
      "section": "plaintext_and_metadata_scope",
      "check": "metadata_leakage_acknowledged",
      "status": "pass",
      "evidence": "skill: check the metadata — traffic analysis and blob-size leakage survive encryption; sizes, timing, and access patterns are data too, and ZK does not hide that you store data, how much, or when you access it"
    },
    {
      "section": "plaintext_and_metadata_scope",
      "check": "residual_risks_documented",
      "status": "pass",
      "evidence": "skill: residual risks are part of the answer, not a footnote"
    },
    {
      "section": "theater_and_threat_model",
      "check": "client_type_declared",
      "status": "pass",
      "evidence": "client_type='web_app_served_by_same_server' (skill: say which one you are looking at — a locally installed client or a web app served by the same server)"
    },
    {
      "section": "theater_and_threat_model",
      "check": "web_app_trust_distinction_acknowledged",
      "status": "fail",
      "evidence": "client_type='web_app_served_by_same_server' web_app_trust_distinction_acknowledged=False (skill: the web-app paradox — browser-delivered crypto moves trust to the server's code pipeline; it is not the same guarantee as a locally installed client, and that distinction must be stated)"
    },
    {
      "section": "theater_and_threat_model",
      "check": "search_indexing_does_not_expose_plaintext_or_tokens",
      "status": "pass",
      "evidence": "skill (theater): the 'encrypted' search/indexing requires the server to see plaintext or searchable tokens"
    },
    {
      "section": "theater_and_threat_model",
      "check": "threat_model_includes_malicious_operator",
      "status": "pass",
      "evidence": "skill (theater): the threat model quietly excludes the actual adversary (a malicious operator)"
    }
  ],
  "summary": "23 pass, 4 fail, 0 missing of 27 checks across six sections.",
  "stamp": "ZERO-KNOWLEDGE CLAIM AUDIT\nproduct: InsecureVault\nVERDICT: CLAIMS_UNSOUND\n  core_test                    fail\n  client_side_encryption       pass\n  key_journey                  pass\n  trusted_parties_and_recovery fail\n  plaintext_and_metadata_scope pass\n  theater_and_threat_model     fail\n23 pass, 4 fail, 0 missing of 27 checks across six sections."
}
```

### Example 3 — malformed (recorded HTTP 422)

Recorded case note: Type mismatch: claim_basis expects string, access expects object.

Input:

```json
{
  "product": "MalformedAudit",
  "claims": {
    "claim_basis": 12345
  },
  "access": "not_an_object"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "claims.claim_basis",
  "detail": "claims.claim_basis must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Y — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Integrators Y · Developers Y · Ops Y · Regulators Y (privacy/compliance-facing — the verdict is audit evidence over a product's zero-knowledge claims (claim basis, server access, key journey, trusted parties, plaintext and metadata scope). Scope correction: the bound skill is ZK software *architecture*; the atom states no proof-system facts, verifies no cryptographic proof, and is not a privacy certification.) |
| Checks named count vs recorded count | 27 / 27 — every check in the recorded full-pass response is documented |
| Verdict vocabulary complete | Y — 3 verdict values plus section/per-item statuses documented |
| Input reference typed | Y — 29 field rows, each with a type (SERVICE.md field table + recorded input schema) |
| Worked examples verbatim-verified | Y — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/zero-knowledge-claim-audit/evidence.json` |

