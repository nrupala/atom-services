# Zero knowledge system design pack — documentation

**Zero knowledge system design pack** · slug `zero-knowledge-system-design-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment ee6a845a54d94e829dd0aad9f8cd9d41; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared zero-knowledge system design record for completeness and internal consistency only, and recomputes the arithmetic the record itself declares. It surfaces two faces: REST `POST /v1/zero-knowledge-system-design-pack` and MCP `POST /mcp/zero-knowledge-system-design-pack`. It proves nothing, verifies no proof, runs no cryptography and certifies no security property — see Explanation. It is not `zero-knowledge-claim-audit`: that atom checks an existing product's published zero-knowledge claims; this atom audits a design record for a system being designed, and the two share zero checks (see Explanation).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/zero-knowledge-system-design-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment ee6a845a54d94e829dd0aad9f8cd9d41). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the design `Vault-App-Design`); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "zero-knowledge-system-design-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the zero-knowledge system design manifest.** You declare a zero-knowledge system design record for one system being designed, made from the design record as actually written — trust model and key custody stated, client-encryption, sharing and auth design written, proof-system use justified with circuit rows declared, setup and verifier deployment declared, property declarations and a selection rationale recorded, recovery weakening and limits stated, and statements mapped to mechanisms; the atom audits the declared record, it does not design the system for you (see Explanation). The recorded full-pass manifest declares the design `Vault-App-Design`: all eight trust-model flags `true` (server content, metadata and access-pattern visibility declared; server role declared; key custody described; key generation and storage locations declared; threat actors declared); all eight E2EE design flags `true` (client encryption architecture, key derivation approach, ciphertext envelope format, auth flow without credential exposure, PAKE-style auth approach addressed, sharing key wrapping, share revocation and share re-encryption path); all four proof-design flags `true` with `total_constraint_count_declared` 100.0; one circuit `c1` (name `AuthCircuit`, statement `Verify credentials`, `constraint_count_declared` 100); `trusted_setup_required` declared `false` — so the ceremony-procedure check passes as not applicable and the manifest declares no `ceremony_procedure_declared` field at all — with the setup-parameter, setup-transcript, verifier-location and verification-failure-handling flags `true`; one verifier `v1` (name `MainVerifier`, target `Client`, key reference `ref_001`); all eight properties flags `true`; all six recovery/limits flags `true`; one claim mapping `m1` (claim `User owns key`, mechanism `KDF_Argon2`); and all five red-line flags `false` (no ZK label without a key-custody description, no ZKP promotion without a declared proof system, no omitted ceremony where required, no verifier without failure handling, no undisclosed recovery weakening).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/zero-knowledge-system-design-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `ZK_DESIGN_RECORD_SOUND`: "59 pass, 0 fail, 0 missing of 59 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `zk_design_circuits_count` is 1, `zk_design_verifiers_count` is 1, `zk_design_claim_mappings_count` is 1, all eleven duplicate / row-name lists are empty (`[]`), `zk_design_constraint_count_sum` is `"100.000000"`, and `circuit_statement_coverage_ratio`, `verifier_key_reference_coverage_ratio` and `claim_mapping_mechanism_coverage_ratio` are each `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `ZK_DESIGN_RECORD_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "zero-knowledge-system-design-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/zero-knowledge-system-design-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/zero-knowledge-system-design-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `zero_knowledge_system_design_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `ZK_DESIGN_RECORD_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `zk_design_pack_total_constraint_count_recomputes` and `zk_design_pack_free_of_zk_label_without_key_custody_description`, and the summary reads "57 pass, 2 fail, 0 missing of 59 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `proof_design.total_constraint_count_declared` is declared 50.0 while the declared circuit rows still sum to 100, so `zk_design_constraint_count_sum` stays `"100.000000"` and the recomputation check fails; and `red_lines.zk_label_without_key_custody_description_present` is declared `true`, failing the red-line check; the counts stay 1 / 1 / 1, all eleven duplicate / row-name lists stay `[]`, all three ratios stay `"1.000000"`, sections `proof_system_and_circuit_design` and `red_lines` report `fail`, the other five sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). Declare only what is true of the actual design record: correct the declared total to the sum the record's own circuit rows declare (or correct the rows), and record the true red-line state. For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a list is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "circuits",
  "detail": "circuits must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/zero-knowledge-system-design-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/zero-knowledge-system-design-pack` — tool name `zero_knowledge_system_design_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `zero_knowledge_system_design_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `design_title`, `circuits[].circuit_id`, `verifiers[].verifier_id` and `claim_mappings[].mapping_id` are noted as strings, `circuits[].circuit_name`, `circuits[].statement_description`, `verifiers[].verifier_name`, `verifiers[].deployment_target`, `verifiers[].verification_key_reference`, `claim_mappings[].claim_text` and `claim_mappings[].mechanism_reference` as non-empty strings, `proof_design.total_constraint_count_declared` and `circuits[].constraint_count_declared` as numbers, and `circuits`, `verifiers` and `claim_mappings` as lists there. Where SERVICE.md states no type — the section container objects (`trust_model`, `e2ee_design`, `proof_design`, `setup_and_verifier`, `properties`, `recovery_and_limits`, `red_lines`) and the row objects (`circuits[]`, `verifiers[]`, `claim_mappings[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and lists, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and the three lists `array`, agreeing with SERVICE.md — see Discrepancies) and is said so in the row note. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `ZK_DESIGN_RECORD_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the recorded section that reads them, as SERVICE.md groups them. The tables below carry 71 typed fields in total (the 61 fields SERVICE.md's table lists, plus the 7 section container objects and the 3 row objects whose types are grounded as noted).

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `design_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: trust_model_and_key_custody

| Field | Type | Notes |
|---|---|---|
| `trust_model` | object | The trust-model section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `trust_model.server_content_visibility_declared` | boolean | — |
| `trust_model.server_metadata_visibility_declared` | boolean | — |
| `trust_model.server_access_pattern_visibility_declared` | boolean | — |
| `trust_model.server_role_in_design_declared` | boolean | — |
| `trust_model.key_custody_description_declared` | boolean | — |
| `trust_model.key_generation_location_declared` | boolean | — |
| `trust_model.key_storage_location_declared` | boolean | — |
| `trust_model.threat_actors_in_design_declared` | boolean | — |

#### Read by: client_encryption_sharing_and_auth_design

| Field | Type | Notes |
|---|---|---|
| `e2ee_design` | object | The E2EE-design section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `e2ee_design.client_encryption_architecture_declared` | boolean | — |
| `e2ee_design.key_derivation_approach_declared` | boolean | — |
| `e2ee_design.ciphertext_envelope_format_declared` | boolean | — |
| `e2ee_design.auth_flow_without_credential_exposure_declared` | boolean | — |
| `e2ee_design.pake_style_auth_approach_addressed` | boolean | — |
| `e2ee_design.sharing_key_wrapping_design_declared` | boolean | — |
| `e2ee_design.share_revocation_design_declared` | boolean | — |
| `e2ee_design.share_reencryption_path_declared` | boolean | — |

#### Read by: proof_system_and_circuit_design

| Field | Type | Notes |
|---|---|---|
| `proof_design` | object | The proof-design section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `proof_design.zkp_use_justification_declared` | boolean | — |
| `proof_design.zkp_specific_claim_statement_declared` | boolean | — |
| `proof_design.e2ee_alternative_for_proof_need_addressed` | boolean | — |
| `proof_design.circuit_work_budget_declared` | boolean | — |
| `proof_design.total_constraint_count_declared` | number | Computed — must recompute from the declared circuit rows, see below (type stated in SERVICE.md) |
| `circuits` | list | List of circuit-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list; the recorded MCP `inputSchema` types it `array`, agreeing with SERVICE.md) |
| `circuits[]` | object | One declared circuit row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `circuits[].circuit_id` | string | Names the row in the computed outputs; computed — must be unique per row (type stated in SERVICE.md) |
| `circuits[].circuit_name` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |
| `circuits[].statement_description` | string | Computed — must be non-empty on every row — the claim that circuit is written for (type stated in SERVICE.md as a non-empty string) |
| `circuits[].constraint_count_declared` | number | Computed — must be non-negative on every row (type stated in SERVICE.md) |

#### Read by: setup_and_verifier_deployment

| Field | Type | Notes |
|---|---|---|
| `setup_and_verifier` | object | The setup-and-verifier section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `setup_and_verifier.trusted_setup_required` | boolean | Gates the ceremony-procedure check below |
| `setup_and_verifier.ceremony_procedure_declared` | boolean | Required when `setup_and_verifier.trusted_setup_required` is declared `true`; otherwise the check that reads it passes as not applicable — the recorded full-pass manifest omits this field entirely (its gate is declared `false`) and the check passes |
| `setup_and_verifier.setup_parameter_generation_declared` | boolean | — |
| `setup_and_verifier.setup_transcript_publication_declared` | boolean | — |
| `setup_and_verifier.verifier_location_declared` | boolean | — |
| `setup_and_verifier.verification_failure_handling_declared` | boolean | — |
| `verifiers` | list | List of verifier-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list; the recorded MCP `inputSchema` types it `array`, agreeing with SERVICE.md) |
| `verifiers[]` | object | One declared verifier row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `verifiers[].verifier_id` | string | Names the row in the computed outputs; computed — must be unique per row (type stated in SERVICE.md) |
| `verifiers[].verifier_name` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |
| `verifiers[].deployment_target` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |
| `verifiers[].verification_key_reference` | string | Computed — must be non-empty on every row; the atom records that a reference is declared and never uses the reference to verify anything (type stated in SERVICE.md as a non-empty string) |

#### Read by: properties_and_proof_selection

| Field | Type | Notes |
|---|---|---|
| `properties` | object | The properties section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `properties.soundness_property_declaration_recorded` | boolean | — |
| `properties.completeness_property_declaration_recorded` | boolean | — |
| `properties.zero_knowledge_property_declaration_recorded` | boolean | — |
| `properties.soundness_assumptions_declared` | boolean | — |
| `properties.cryptographic_assumptions_declared` | boolean | — |
| `properties.proof_system_selection_rationale_recorded` | boolean | — |
| `properties.proof_system_alternatives_compared_declared` | boolean | — |
| `properties.proof_system_selection_tradeoffs_recorded` | boolean | — |

#### Read by: recovery_limits_and_claim_mapping

| Field | Type | Notes |
|---|---|---|
| `recovery_and_limits` | object | The recovery-and-limits section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `recovery_and_limits.recovery_mechanism_design_declared` | boolean | — |
| `recovery_and_limits.recovery_weakening_effects_declared` | boolean | — |
| `recovery_and_limits.recovery_choice_rationale_declared` | boolean | — |
| `recovery_and_limits.encrypted_search_limits_declared` | boolean | — |
| `recovery_and_limits.server_inference_limits_declared` | boolean | — |
| `recovery_and_limits.design_limitations_declared` | boolean | — |
| `claim_mappings` | list | List of mapping-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list; the recorded MCP `inputSchema` types it `array`, agreeing with SERVICE.md) |
| `claim_mappings[]` | object | One declared claim-mapping row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `claim_mappings[].mapping_id` | string | Names the row in the computed outputs; computed — must be unique per row (type stated in SERVICE.md) |
| `claim_mappings[].claim_text` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |
| `claim_mappings[].mechanism_reference` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.zk_label_without_key_custody_description_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.zkp_promotion_without_declared_proof_system_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.trusted_setup_ceremony_omitted_where_required_present` | boolean | must be `false` to pass |
| `red_lines.verifier_without_failure_handling_in_design_present` | boolean | must be `false` to pass |
| `red_lines.recovery_weakening_undisclosed_in_design_present` | boolean | must be `false` to pass |

### Checks

All 59 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Note on the gated check: the one gated check (`zk_design_pack_ceremony_procedure_declared_where_trusted_setup_required`) carries the same recorded evidence text, "no trusted setup declared required", in both its full-pass `pass` state and its sparse-run `missing` state — see Discrepancies.

#### Section: trust_model_and_key_custody

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zk_design_pack_server_content_visibility_declared` | trust model: the design record states exactly what content the server can and cannot see | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_server_metadata_visibility_declared` | trust model: the design record states exactly what metadata the server can and cannot see — metadata is data and is addressed explicitly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_server_access_pattern_visibility_declared` | trust model: the design record states what access patterns the server can and cannot see | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_server_role_in_design_declared` | trust model: the server's role in the design is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_key_custody_description_declared` | key custody: the design record describes key custody exactly — who holds keys, under the skill's red line that no zero-knowledge language stands without it | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_key_generation_location_declared` | key custody: where keys are generated is declared in the design record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_key_storage_location_declared` | key custody: where keys are stored is declared in the design record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_threat_actors_in_design_declared` | trust model: the threat actors the design is written against are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: client_encryption_sharing_and_auth_design

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zk_design_pack_client_encryption_architecture_declared` | client-side encryption design: the client-side encryption architecture is declared — keys live with the user and the server side of the design holds ciphertext | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_key_derivation_approach_declared` | client-side encryption design: the client-side key derivation approach is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_ciphertext_envelope_format_declared` | client-side encryption design: the format of the ciphertext and envelopes the server stores is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_auth_flow_without_credential_exposure_declared` | auth design: the authentication flow is declared as one in which passwords do not reach the server | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_pake_style_auth_approach_addressed` | auth design: a PAKE-style approach to authentication without credential exposure is addressed in the design record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_sharing_key_wrapping_design_declared` | sharing design: per-share key wrapping is designed in and declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_share_revocation_design_declared` | sharing design: share revocation is designed in and declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_share_reencryption_path_declared` | sharing design: the re-encryption path for shared data is documented in the design record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: proof_system_and_circuit_design

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zk_design_pack_zkp_use_justification_declared` | proof design: the record justifies why a zero-knowledge proof is used at all — ZKP only where it pays, since most products need E2EE, not ZKPs | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_zkp_specific_claim_statement_declared` | proof design: the specific claim the proof system is used for is stated in the design record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_e2ee_alternative_for_proof_need_addressed` | proof design: the record addresses whether client-side encryption alone would meet the stated need, before proof-system work is taken on | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_circuit_work_budget_declared` | proof design: the circuit work for the proof system is budgeted in the design record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_circuits_list_declared` | circuits: the declared record names its circuits — the list is present and names at least one circuit; an absent list is missing evidence and an empty list declares no circuit work for a record that declares a proof system | Computed over the declared record. Pass: the `circuits` list is present and names at least one circuit. Fail: the list is present but empty. Missing: the list is absent. |
| `every_zk_design_pack_circuit_id_unique` | circuits: no declared circuit_id is owned by more than one row | Computed over the declared record. Pass: no declared `circuit_id` appears on more than one row. Fail: a `circuit_id` is declared on more than one row (duplicates are named in `duplicate_zk_design_circuit_ids`). Missing: the list is absent, or a row has `circuit_id` absent. |
| `every_zk_design_pack_circuit_name_declared` | circuits: every declared circuit declares a non-empty circuit name | Computed over the declared record. Pass: every declared circuit row declares a non-empty `circuit_name`. Fail: a row declares an empty name (offending rows are named in `zk_design_circuits_without_name`). Missing: the list is absent, or a row has `circuit_name` absent. |
| `every_zk_design_pack_circuit_statement_declared` | circuits: every declared circuit declares a non-empty statement description — the claim that circuit is written for | Computed over the declared record. Pass: every declared circuit row declares a non-empty `statement_description`. Fail: a row declares an empty statement (offending rows are named in `zk_design_circuits_without_statement`). Missing: the list is absent, or a row has `statement_description` absent. |
| `every_zk_design_pack_circuit_constraint_count_non_negative` | circuits: every declared circuit declares a non-negative constraint count | Computed over the declared record. Pass: every declared circuit row declares a non-negative `constraint_count_declared`. Fail: a row declares a negative count (offending rows are named in `zk_design_circuits_with_invalid_constraint_count`). Missing: the list is absent, or a row has `constraint_count_declared` absent. |
| `zk_design_pack_total_constraint_count_recomputes` | circuits: the declared total constraint count recomputes exactly as the sum of the declared per-circuit constraint counts | Computed over the declared record. Pass: `proof_design.total_constraint_count_declared` recomputes exactly as the sum of the declared per-circuit constraint counts, compared on the fixed 6dp serialization. Fail: the declared total differs from the recomputed sum (reported as `zk_design_constraint_count_sum`). Missing: the total is absent, the `circuits` list is absent, or a circuit row has no count. |

#### Section: setup_and_verifier_deployment

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zk_design_pack_setup_parameter_generation_declared` | setup design: how the setup parameters are generated is declared in the design record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_setup_transcript_publication_declared` | setup design: publication of the setup transcript is declared in the design record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_verifier_location_declared` | verifier design: where verification runs in the deployment is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_verification_failure_handling_declared` | verifier design: what happens when verification fails is declared in the design record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_ceremony_procedure_declared_where_trusted_setup_required` | no trusted setup declared required | Computed-gated over the declared record. Pass: `setup_and_verifier.trusted_setup_required` is declared `false` (the check passes as not applicable — the recorded full-pass manifest omits `setup_and_verifier.ceremony_procedure_declared` entirely and still passes), or the gate is declared `true` and `setup_and_verifier.ceremony_procedure_declared` is declared `true`. Fail: the gate is declared `true` and the field is declared `false`. Missing: the gate field is absent, or the gate is declared `true` and the field is absent. |
| `zk_design_pack_verifiers_list_declared` | verifiers: the declared record names its verifier deployments — the list is present and names at least one verifier row; an absent list is missing evidence and an empty list declares no deployment for a record that declares verification | Computed over the declared record. Pass: the `verifiers` list is present and names at least one verifier row. Fail: the list is present but empty. Missing: the list is absent. |
| `every_zk_design_pack_verifier_id_unique` | verifiers: no declared verifier_id is owned by more than one row | Computed over the declared record. Pass: no declared `verifier_id` appears on more than one row. Fail: a `verifier_id` is declared on more than one row (duplicates are named in `duplicate_zk_design_verifier_ids`). Missing: the list is absent, or a row has `verifier_id` absent. |
| `every_zk_design_pack_verifier_name_declared` | verifiers: every declared verifier row declares a non-empty verifier name | Computed over the declared record. Pass: every declared verifier row declares a non-empty `verifier_name`. Fail: a row declares an empty name (offending rows are named in `zk_design_verifiers_without_name`). Missing: the list is absent, or a row has `verifier_name` absent. |
| `every_zk_design_pack_verifier_deployment_target_declared` | verifiers: every declared verifier row declares a non-empty deployment target | Computed over the declared record. Pass: every declared verifier row declares a non-empty `deployment_target`. Fail: a row declares an empty target (offending rows are named in `zk_design_verifiers_without_deployment_target`). Missing: the list is absent, or a row has `deployment_target` absent. |
| `every_zk_design_pack_verifier_verification_key_reference_declared` | verifiers: every declared verifier row declares a non-empty verification-key reference — the record names which key material the deployment verifies against, without this atom verifying anything with it | Computed over the declared record. Pass: every declared verifier row declares a non-empty `verification_key_reference` — recorded as declared only; the reference is never used to verify anything. Fail: a row declares an empty reference (offending rows are named in `zk_design_verifiers_without_verification_key_reference`). Missing: the list is absent, or a row has `verification_key_reference` absent. |

#### Section: properties_and_proof_selection

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zk_design_pack_soundness_property_declaration_recorded` | property declarations: a soundness property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that soundness holds | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_completeness_property_declaration_recorded` | property declarations: a completeness property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that completeness holds | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_zero_knowledge_property_declaration_recorded` | property declarations: a zero-knowledge property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that the property holds | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_soundness_assumptions_declared` | property declarations: the assumptions the declared soundness property rests on are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_cryptographic_assumptions_declared` | property declarations: the cryptographic assumptions the design rests on are declared — declared only; this atom judges no assumption's strength | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_proof_system_selection_rationale_recorded` | selection rationale: the rationale for selecting the declared proof system is recorded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_proof_system_alternatives_compared_declared` | selection rationale: the proof-system alternatives the selection was compared against are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_proof_system_selection_tradeoffs_recorded` | selection rationale: the trade-offs of the proof-system selection are recorded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: recovery_limits_and_claim_mapping

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zk_design_pack_recovery_mechanism_design_declared` | recovery design: the recovery mechanism in the design is declared — escrow, social, phrase or none, as designed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_recovery_weakening_effects_declared` | recovery design: the weakening effects of the chosen recovery mechanism on the design's model are documented — any recovery mechanism weakens the model, chosen consciously | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_recovery_choice_rationale_declared` | recovery design: the rationale for the recovery choice is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_encrypted_search_limits_declared` | limits: the limits of encrypted search and query in the design are declared — encrypted search is a spectrum, stated honestly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_server_inference_limits_declared` | limits: what the server can still infer under the design is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_design_limitations_declared` | limits: the design's limitations are declared in the record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `zk_design_pack_claim_mappings_list_declared` | claim mappings: the declared record names its claim-to-mechanism mapping rows — the list is present and names at least one row; an absent list is missing evidence and an empty list declares no mapping at all | Computed over the declared record. Pass: the `claim_mappings` list is present and names at least one row. Fail: the list is present but empty. Missing: the list is absent. |
| `every_zk_design_pack_claim_mapping_id_unique` | claim mappings: no declared mapping_id is owned by more than one row | Computed over the declared record. Pass: no declared `mapping_id` appears on more than one row. Fail: a `mapping_id` is declared on more than one row (duplicates are named in `duplicate_zk_design_claim_mapping_ids`). Missing: the list is absent, or a row has `mapping_id` absent. |
| `every_zk_design_pack_claim_mapping_claim_text_declared` | claim mappings: every declared mapping row declares a non-empty claim text — the zero-knowledge statement as written in the design record | Computed over the declared record. Pass: every declared mapping row declares a non-empty `claim_text`. Fail: a row declares an empty claim text (offending rows are named in `zk_design_claim_mappings_without_claim_text`). Missing: the list is absent, or a row has `claim_text` absent. |
| `every_zk_design_pack_claim_mapping_mechanism_reference_declared` | claim mappings: every declared mapping row declares a non-empty mechanism reference — every statement maps to a mechanism in the design; no orphans | Computed over the declared record. Pass: every declared mapping row declares a non-empty `mechanism_reference`. Fail: a row declares an empty reference (offending rows are named in `zk_design_claim_mappings_without_mechanism_reference`). Missing: the list is absent, or a row has `mechanism_reference` absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `zk_design_pack_free_of_zk_label_without_key_custody_description` | red line: no zero-knowledge label without describing key custody exactly is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `zk_design_pack_free_of_zkp_promotion_without_declared_proof_system` | red line: no ZKP promotion without an actual declared proof system is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `zk_design_pack_free_of_trusted_setup_ceremony_omitted_where_required` | red line: no omitted setup ceremony where a trusted setup is required is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `zk_design_pack_free_of_verifier_without_failure_handling_in_design` | red line: no verifier deployment without declared failure handling is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `zk_design_pack_free_of_recovery_weakening_undisclosed_in_design` | red line: no undisclosed recovery weakening is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object, with these top-level fields in the recorded order:

- `service` (`"zero-knowledge-system-design-pack"`), `atom_version` (`"0.1.0"`), and `design_title` (the manifest's declared design title, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `zk_design_circuits_count`, `zk_design_verifiers_count` and `zk_design_claim_mappings_count` (the declared list lengths as integers, exactly, or null when the list is not declared); `duplicate_zk_design_circuit_ids`, `duplicate_zk_design_verifier_ids` and `duplicate_zk_design_claim_mapping_ids` (ids carried by more than one row; each null when its underlying list is not declared, as recorded in the sparse case); `zk_design_circuits_without_name`, `zk_design_circuits_without_statement`, `zk_design_circuits_with_invalid_constraint_count`, `zk_design_verifiers_without_name`, `zk_design_verifiers_without_deployment_target`, `zk_design_verifiers_without_verification_key_reference`, `zk_design_claim_mappings_without_claim_text` and `zk_design_claim_mappings_without_mechanism_reference` (the offending rows for each computed rule; each null when its underlying list is not declared, as recorded in the sparse case); `zk_design_constraint_count_sum` (the sum of the declared per-circuit constraint counts — a string with exactly six decimal places; null when the circuits list is not declared, as recorded in the sparse case); and the ratios `circuit_statement_coverage_ratio` (circuits with a recorded statement description ÷ declared circuits), `verifier_key_reference_coverage_ratio` (verifiers with a recorded verification-key reference ÷ declared verifiers) and `claim_mapping_mechanism_coverage_ratio` (mappings with a recorded mechanism reference ÷ declared mappings) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Computed quantities use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; the total-constraint-count comparison is made on the same 6dp serialization — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "59 pass, 0 fail, 0 missing of 59 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared design title, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `ZK_DESIGN_RECORD_SOUND` — all 59 checks pass: the declared zero-knowledge system design record is complete and internally consistent with the skill's method and red lines. The verdict names the **record** — it does not mean, and must never be read as, that the designed system is sound, secure or zero-knowledge.
- `ZK_DESIGN_RECORD_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only — the fifteen computed checks named in SERVICE.md): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the fifteen computed checks cannot be completed because the rows or fields it reads are absent (as recorded in the sparse case).

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for the gated check, including passes as not applicable when its gate is off); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `zk_design_circuits_count`, `zk_design_verifiers_count`, `zk_design_claim_mappings_count`, the three duplicate-id lists, the eight row-name lists, `zk_design_constraint_count_sum`, `circuit_statement_coverage_ratio`, `verifier_key_reference_coverage_ratio` and `claim_mapping_mechanism_coverage_ratio` — each defined in Output format above, with the values and null rules recorded there (19 computed fields in total, including `computed_status`).

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"circuits","detail":"circuits must be a list"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Design systems that can't see user data — client-side E2EE, metadata honesty, ZKP only where justified (the bound capability, from the skill). You submit one declared record — the zero-knowledge system design manifest, made from the design record as actually written — and the atom audits that record for completeness and internal consistency against the bound skill's method and red lines, and recomputes the arithmetic the record itself declares, returning one deterministic verdict across 7 sections (`trust_model_and_key_custody`, `client_encryption_sharing_and_auth_design`, `proof_system_and_circuit_design`, `setup_and_verifier_deployment`, `properties_and_proof_selection`, `recovery_limits_and_claim_mapping`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest sibling `zero-knowledge-claim-audit` (live, Tier A) (SERVICE.md, Distinct ground; verified mechanically at authoring by enumerating `evaluate({})` check names from every atom oracle and comparing — zero overlap): that atom is a CHECK of an existing product's published zero-knowledge claims against its declared posture, while every check here is a design-record question — trust-model content / metadata / access-pattern visibility and key custody, client-encryption, auth and sharing sections written, declared circuit rows carrying statement descriptions and constraint counts that recompute to a declared total, a setup ceremony declared where a trusted setup is required, verifier / deployment rows naming deployment targets and verification-key references, soundness / completeness / zero-knowledge property **declarations** and a proof-system selection rationale recorded, recovery weakening and encrypted-search limits declared, and the record's own claim-to-mechanism mapping rows complete. No check here asks whether any claim about a running product is true or sound, and no check in the claim audit asks about circuits, constraint counts, setup ceremonies, verifier deployments, property declarations or selection rationale in a design record.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* (fifteen, per SERVICE.md) are calculated from the declared rows and values themselves — the circuits list must be present and name at least one circuit, with unique `circuit_id` values, a non-empty `circuit_name` and `statement_description` on every row and a non-negative `constraint_count_declared` on every row, and the declared `proof_design.total_constraint_count_declared` must recompute exactly as the sum of the declared per-circuit constraint counts; the verifiers list must be present and name at least one verifier, with unique `verifier_id` values and a non-empty `verifier_name`, `deployment_target` and `verification_key_reference` on every row (the reference is recorded as declared — it is never used to verify anything); and the claim-mappings list must be present and name at least one mapping, with unique `mapping_id` values and a non-empty `claim_text` and `mechanism_reference` on every row — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *The gated check* follows the skill's own conditional scope: a ceremony procedure is required only where `setup_and_verifier.trusted_setup_required` is declared `true`; with the gate declared `false` the check passes as not applicable, and with the gate absent the check is missing evidence. Aggregation is strict: any `fail` anywhere produces `ZK_DESIGN_RECORD_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `ZK_DESIGN_RECORD_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are an exact trust model, key custody described, ZKP only where justified and budgeted, recovery weakening documented, limits stated honestly and statements mapped to mechanisms, not bars the atom can set. Declined, named, exactly as SERVICE.md names them: a minimum or maximum constraint count for any circuit or in total; a soundness-error bound or any numeric security parameter (bits of security, curve or field size, hash output length); a key length, KDF choice, KDF iteration count or algorithm choice (the skill names Argon2id / OPAQUE as examples of an approach class, not as a bar this atom sets — the derivation and auth checks judge only that an approach is declared and addressed, never which one); a ceremony size, participant count or contribution threshold; a proof size, proving time or verification time ceiling; a verifier count beyond at least one declared row, or a circuit or mapping count beyond at least one declared row; any judgment that a declared soundness, completeness or zero-knowledge property actually holds (those checks record that a declaration and its assumptions are in the record — they establish nothing); and any judgment that the selected proof system is the right, best or advisable one (only that a rationale, alternatives and trade-offs are recorded). Quantities are computed and reported; the only bars on the computed rows are exact recomputation and completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** ZK system design record: a verdict of `ZK_DESIGN_RECORD_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its trust model written, its circuits listed, its ceremony declared and its property declarations recorded passes those checks even if the real design did none of it. It **proves NOTHING, verifies no proof, runs no cryptography, and certifies no security property**. It inspects no running system, reads no code, executes no circuit, and tests no declared posture against the world. It is a completeness and consistency audit of the design record the skill requires, **not a security certification, a cryptographic review, a proof verification, or a guarantee that the designed system is zero-knowledge, sound, complete or secure**: it never judges whether a declared property holds, whether a declared constraint count is the real count of any real circuit, whether a mechanism reference actually supports the statement mapped to it, or whether the design should be built — only that the record contains what the skill's method and red lines demand, and that its declared rows are internally consistent. Named exclusions and non-reducible parts (excluded by name, never performed): generating a proof; verifying a proof; certifying the security, soundness, completeness or zero-knowledge property of any system or design; cryptographic advice — choosing a proof system, curve, field, hash, commitment scheme, key-derivation function or security parameter for a caller, or judging any such declared choice sound or advisable; constructing, writing or auditing an actual circuit; running, witnessing or attesting a setup ceremony; assessing whether a declared mechanism actually delivers the statement mapped to it; and assessing any real system's privacy in operation. Boundary case, named in SERVICE.md: a design that uses no proof system at all (pure client-side E2EE, which the skill says is what most products need) cannot pass this record format's circuits-declared and verifiers-declared checks (the format requires at least one declared circuit row and one declared verifier row — such a design is outside this atom's computed reach, not failed on its merits).

**Buyer and use context.** Teams and agents working in Security & privacy who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Designing vault-family apps (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was deployed census-style under a U-13 regulatory screen classified **(b) — screen-NO, flag-with-controls (census class)**, exactly as SERVICE.md's U-13 section records it. SERVICE.md records the basis: the keyword screen names zero-knowledge proof systems, soundness, cryptographic assumptions and security properties — no engineering-practice, securities/financial-advice or psychology-adjacent subject is the atom's output — but a ZK system design sits adjacent to professional security and cryptographic engineering judgment: a naive version of this atom that verified proofs, certified a design secure, or advised on cryptographic construction could read as professional advice a reader might rely on. The substance screen records that this atom's output could not itself read as regulated professional advice **while the controls below hold** — it audits a caller-**declared** design record for completeness and internal consistency only (trust-model and design-section declarations, circuit / verifier / mapping rows recomputed over the declared rows, setup and ceremony declarations, property and selection-rationale declarations recorded, and the red lines refused); every output is a pass / fail / missing verdict on the record or a quantity recomputed from the caller's own declared rows, and the verdict vocabulary names the **record** (`ZK_DESIGN_RECORD_SOUND`), never the system. What prevents an advice reading, as named controls, exactly as SERVICE.md records them: (1) it **proves nothing, verifies no proof, runs no cryptography and certifies no security property** — proof generation, proof verification, security certification and cryptographic advice are excluded by name in SERVICE.md's Honest scoping; (2) its property checks record only that a soundness / completeness / zero-knowledge **declaration** and its assumptions are in the record — they never state or imply that any property holds, and SERVICE.md and the check evidence say so in the check itself; (3) it sets **no threshold** on any cryptographic quantity (see the declined list in Explanation) and judges no declared algorithm, parameter or proof-system choice; (4) it produces **no design** — the skill's designing steps are the caller's work, recorded in their record; professional security and cryptographic decisions for real systems remain the caller's responsible professionals, on their record. SERVICE.md records why this is the census flag-with-controls class and not class (a): the adjacency is real (a ZK design for a production system is professional security work); and it is not the genuinely-open personal-financial-snapshot class, because no personal position of any kind is handled. It is not flagged HOLD CANDIDATE: the HOLD class is for a record whose shape itself implies a determination a reader could rely on professionally, and this record's shape — declarations recorded, rows recomputed, verdict naming the record only, with the no-certification controls above — makes no such determination. The flag stays open for the Director's review: the screen-NO classification and its controls stand as recorded, and the census flag is not closed by this document.

### For integrators (Users)

You need: a gateway key with the `zero_knowledge_system_design_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed quantities are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, and the total-constraint-count comparison is made on the same 6dp serialization, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/zero_knowledge_system_design_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_zero_knowledge_system_design_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/zero-knowledge-system-design-pack` (REST) and `POST /mcp/zero-knowledge-system-design-pack` (MCP, tool `zero_knowledge_system_design_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment ee6a845a54d94e829dd0aad9f8cd9d41; RC soak to 2026-11-22). Key scope: `zero_knowledge_system_design_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment ee6a845a54d94e829dd0aad9f8cd9d41) shows the atom live. This document follows the evidenced live state: live. The same staleness touches SERVICE.md's U-13 section, which records that "no deploy happens on this atom without the owner's explicit per-unit ruling in any case" — the recorded deployment exists; the U-13 flag itself stays open for the Director's review (see Role views, For regulators) and is not closed by this document.
2. **Check names differ from input field names:** the recorded check names differ from the leaf name of the input field they read — the attestation names carry the `zk_design_pack_` prefix (for example `zk_design_pack_server_content_visibility_declared` reads `trust_model.server_content_visibility_declared`; `zk_design_pack_ceremony_procedure_declared_where_trusted_setup_required` reads `setup_and_verifier.ceremony_procedure_declared` gated on `setup_and_verifier.trusted_setup_required`), the row-computed names carry an `every_zk_design_pack_` form (for example `every_zk_design_pack_circuit_id_unique` reads the circuit rows' `circuit_id` values; `zk_design_pack_total_constraint_count_recomputes` reads `proof_design.total_constraint_count_declared` against the circuit rows' `constraint_count_declared` values), and the five red-line checks are phrased as freedoms (for example `zk_design_pack_free_of_zk_label_without_key_custody_description` reads `red_lines.zk_label_without_key_custody_description_present`). The fifteen computed checks and the gated check have no single same-named field at all. Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md, and the recorded MCP `inputSchema` is shallow:** SERVICE.md states no type for the section container objects (`trust_model`, `e2ee_design`, `proof_design`, `setup_and_verifier`, `properties`, `recovery_and_limits`, `red_lines`) or for a row object (`circuits[]`, `verifiers[]`, `claim_mappings[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and lists, in the recorded MCP `inputSchema`, and are said so there. The recorded MCP `inputSchema` itself lists only the eleven top-level properties (`design_title`, `trust_model`, `e2ee_design`, `proof_design`, `circuits`, `setup_and_verifier`, `verifiers`, `properties`, `recovery_and_limits`, `claim_mappings`, `red_lines`) with no nested leaf or row types at all — the nested types rest on the recorded evidence inputs and SERVICE.md's table, not on the schema. Unlike some fleet atoms, this atom's schema types the three lists (`circuits`, `verifiers`, `claim_mappings`) as `array`, agreeing with SERVICE.md and the recorded inputs; no list is mis-typed as `object` here.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 59 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md for the list and sum outputs:** SERVICE.md's output paragraph states the null rules for `computed_status`, `zk_design_circuits_count`, `zk_design_verifiers_count`, `zk_design_claim_mappings_count` and the three ratios, but it does not state a null rule for the three duplicate-id lists, the eight row-name lists, or `zk_design_constraint_count_sum`. The recorded sparse response returns all of those as `null` when the underlying lists are not declared (as the Output format section records); this document follows the recording.
6. **Section groupings merging input objects:** the recorded sections do not map one-to-one onto input objects. Three recorded sections each merge a section object with a top-level row list — `proof_design` with `circuits` under `proof_system_and_circuit_design`, `setup_and_verifier` with `verifiers` under `setup_and_verifier_deployment`, and `recovery_and_limits` with `claim_mappings` under `recovery_limits_and_claim_mapping` — so six top-level input properties are grouped into three recorded sections (the remaining sections map one-to-one). This document groups the Input reference and the Checks by the recorded section names, with those mergings named in place.
7. **The gated check's evidence text does not vary with its state:** the evidence text quoted in the Checks section is the full-pass run's text. For the one gated check, `zk_design_pack_ceremony_procedure_declared_where_trusted_setup_required`, the recorded sparse run carries the identical evidence string — "no trusted setup declared required" — with status `missing` (its gate field is absent) as the full-pass run carries with status `pass` (its gate is declared `false` and the target field is absent from the manifest entirely). No distinct required-form evidence string for this check exists in the recordings; the Checks section says so at its head.
8. **Recorded check order differs from SERVICE.md's field-table order in one section:** in `setup_and_verifier_deployment`, SERVICE.md's field table lists `trusted_setup_required` and `ceremony_procedure_declared` first among the section's fields, but the recorded checks array places the gated ceremony check after the four setup / verifier attestation checks (`setup_parameter_generation`, `setup_transcript_publication`, `verifier_location`, `verification_failure_handling`) and before the verifier-row computed checks. The Checks section follows the recorded order; the Input reference follows SERVICE.md's grouping order.
9. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (5 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named a prose label (`Total constraint count recomputes`) and a section name (`red_lines`) instead of exact check names (R1 ×2); the full-pass and violations `expect` blocks carried no structured `computed_spot_checks` (R2 ×2); and the designed violations input was missing the key paths present in the full-pass manifest (R3 ×1). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.
10. **Second-tester narrative splits differing in TEST-REPORT.md:** DeepSeek's narrative (as TEST-REPORT.md itself records) splits three sections differently — 9 / 8 / 9 in place of the recorded 10 / 10 / 10 for `proof_system_and_circuit_design` / `setup_and_verifier_deployment` / `recovery_limits_and_claim_mapping` — and labels the row-name lists ×7 where there are eight such lists. Its totals (59), every recomputed quantity and its full-agreement headline all hold on a direct recount of `evidence.json` (8 + 8 + 10 + 10 + 8 + 10 + 5 = 59); the recorded responses govern.

## Worked examples

Provenance: recorded 2026-11-16T15:25:50.155455+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/zero-knowledge-system-design-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T15:25:50.155455+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/zero-knowledge-system-design-pack/evidence.json`.

Input:

```json
{
  "design_title": "Vault-App-Design",
  "trust_model": {
    "server_content_visibility_declared": true,
    "server_metadata_visibility_declared": true,
    "server_access_pattern_visibility_declared": true,
    "server_role_in_design_declared": true,
    "key_custody_description_declared": true,
    "key_generation_location_declared": true,
    "key_storage_location_declared": true,
    "threat_actors_in_design_declared": true
  },
  "e2ee_design": {
    "client_encryption_architecture_declared": true,
    "key_derivation_approach_declared": true,
    "ciphertext_envelope_format_declared": true,
    "auth_flow_without_credential_exposure_declared": true,
    "pake_style_auth_approach_addressed": true,
    "sharing_key_wrapping_design_declared": true,
    "share_revocation_design_declared": true,
    "share_reencryption_path_declared": true
  },
  "proof_design": {
    "zkp_use_justification_declared": true,
    "zkp_specific_claim_statement_declared": true,
    "e2ee_alternative_for_proof_need_addressed": true,
    "circuit_work_budget_declared": true,
    "total_constraint_count_declared": 100.0
  },
  "circuits": [
    {
      "circuit_id": "c1",
      "circuit_name": "AuthCircuit",
      "statement_description": "Verify credentials",
      "constraint_count_declared": 100
    }
  ],
  "setup_and_verifier": {
    "trusted_setup_required": false,
    "setup_parameter_generation_declared": true,
    "setup_transcript_publication_declared": true,
    "verifier_location_declared": true,
    "verification_failure_handling_declared": true
  },
  "verifiers": [
    {
      "verifier_id": "v1",
      "verifier_name": "MainVerifier",
      "deployment_target": "Client",
      "verification_key_reference": "ref_001"
    }
  ],
  "properties": {
    "soundness_property_declaration_recorded": true,
    "completeness_property_declaration_recorded": true,
    "zero_knowledge_property_declaration_recorded": true,
    "soundness_assumptions_declared": true,
    "cryptographic_assumptions_declared": true,
    "proof_system_selection_rationale_recorded": true,
    "proof_system_alternatives_compared_declared": true,
    "proof_system_selection_tradeoffs_recorded": true
  },
  "recovery_and_limits": {
    "recovery_mechanism_design_declared": true,
    "recovery_weakening_effects_declared": true,
    "recovery_choice_rationale_declared": true,
    "encrypted_search_limits_declared": true,
    "server_inference_limits_declared": true,
    "design_limitations_declared": true
  },
  "claim_mappings": [
    {
      "mapping_id": "m1",
      "claim_text": "User owns key",
      "mechanism_reference": "KDF_Argon2"
    }
  ],
  "red_lines": {
    "zk_label_without_key_custody_description_present": false,
    "zkp_promotion_without_declared_proof_system_present": false,
    "trusted_setup_ceremony_omitted_where_required_present": false,
    "verifier_without_failure_handling_in_design_present": false,
    "recovery_weakening_undisclosed_in_design_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "zero-knowledge-system-design-pack",
  "atom_version": "0.1.0",
  "design_title": "Vault-App-Design",
  "verdict": "ZK_DESIGN_RECORD_SOUND",
  "sections": {
    "trust_model_and_key_custody": "pass",
    "client_encryption_sharing_and_auth_design": "pass",
    "proof_system_and_circuit_design": "pass",
    "setup_and_verifier_deployment": "pass",
    "properties_and_proof_selection": "pass",
    "recovery_limits_and_claim_mapping": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_server_content_visibility_declared",
      "status": "pass",
      "evidence": "trust model: the design record states exactly what content the server can and cannot see"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_server_metadata_visibility_declared",
      "status": "pass",
      "evidence": "trust model: the design record states exactly what metadata the server can and cannot see — metadata is data and is addressed explicitly"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_server_access_pattern_visibility_declared",
      "status": "pass",
      "evidence": "trust model: the design record states what access patterns the server can and cannot see"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_server_role_in_design_declared",
      "status": "pass",
      "evidence": "trust model: the server's role in the design is declared"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_key_custody_description_declared",
      "status": "pass",
      "evidence": "key custody: the design record describes key custody exactly — who holds keys, under the skill's red line that no zero-knowledge language stands without it"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_key_generation_location_declared",
      "status": "pass",
      "evidence": "key custody: where keys are generated is declared in the design record"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_key_storage_location_declared",
      "status": "pass",
      "evidence": "key custody: where keys are stored is declared in the design record"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_threat_actors_in_design_declared",
      "status": "pass",
      "evidence": "trust model: the threat actors the design is written against are declared"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_client_encryption_architecture_declared",
      "status": "pass",
      "evidence": "client-side encryption design: the client-side encryption architecture is declared — keys live with the user and the server side of the design holds ciphertext"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_key_derivation_approach_declared",
      "status": "pass",
      "evidence": "client-side encryption design: the client-side key derivation approach is declared"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_ciphertext_envelope_format_declared",
      "status": "pass",
      "evidence": "client-side encryption design: the format of the ciphertext and envelopes the server stores is declared"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_auth_flow_without_credential_exposure_declared",
      "status": "pass",
      "evidence": "auth design: the authentication flow is declared as one in which passwords do not reach the server"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_pake_style_auth_approach_addressed",
      "status": "pass",
      "evidence": "auth design: a PAKE-style approach to authentication without credential exposure is addressed in the design record"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_sharing_key_wrapping_design_declared",
      "status": "pass",
      "evidence": "sharing design: per-share key wrapping is designed in and declared"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_share_revocation_design_declared",
      "status": "pass",
      "evidence": "sharing design: share revocation is designed in and declared"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_share_reencryption_path_declared",
      "status": "pass",
      "evidence": "sharing design: the re-encryption path for shared data is documented in the design record"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "zk_design_pack_zkp_use_justification_declared",
      "status": "pass",
      "evidence": "proof design: the record justifies why a zero-knowledge proof is used at all — ZKP only where it pays, since most products need E2EE, not ZKPs"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "zk_design_pack_zkp_specific_claim_statement_declared",
      "status": "pass",
      "evidence": "proof design: the specific claim the proof system is used for is stated in the design record"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "zk_design_pack_e2ee_alternative_for_proof_need_addressed",
      "status": "pass",
      "evidence": "proof design: the record addresses whether client-side encryption alone would meet the stated need, before proof-system work is taken on"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "zk_design_pack_circuit_work_budget_declared",
      "status": "pass",
      "evidence": "proof design: the circuit work for the proof system is budgeted in the design record"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "zk_design_pack_circuits_list_declared",
      "status": "pass",
      "evidence": "circuits: the declared record names its circuits — the list is present and names at least one circuit; an absent list is missing evidence and an empty list declares no circuit work for a record that declares a proof system"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "every_zk_design_pack_circuit_id_unique",
      "status": "pass",
      "evidence": "circuits: no declared circuit_id is owned by more than one row"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "every_zk_design_pack_circuit_name_declared",
      "status": "pass",
      "evidence": "circuits: every declared circuit declares a non-empty circuit name"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "every_zk_design_pack_circuit_statement_declared",
      "status": "pass",
      "evidence": "circuits: every declared circuit declares a non-empty statement description — the claim that circuit is written for"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "every_zk_design_pack_circuit_constraint_count_non_negative",
      "status": "pass",
      "evidence": "circuits: every declared circuit declares a non-negative constraint count"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "zk_design_pack_total_constraint_count_recomputes",
      "status": "pass",
      "evidence": "circuits: the declared total constraint count recomputes exactly as the sum of the declared per-circuit constraint counts"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "zk_design_pack_setup_parameter_generation_declared",
      "status": "pass",
      "evidence": "setup design: how the setup parameters are generated is declared in the design record"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "zk_design_pack_setup_transcript_publication_declared",
      "status": "pass",
      "evidence": "setup design: publication of the setup transcript is declared in the design record"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "zk_design_pack_verifier_location_declared",
      "status": "pass",
      "evidence": "verifier design: where verification runs in the deployment is declared"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "zk_design_pack_verification_failure_handling_declared",
      "status": "pass",
      "evidence": "verifier design: what happens when verification fails is declared in the design record"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "zk_design_pack_ceremony_procedure_declared_where_trusted_setup_required",
      "status": "pass",
      "evidence": "no trusted setup declared required"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "zk_design_pack_verifiers_list_declared",
      "status": "pass",
      "evidence": "verifiers: the declared record names its verifier deployments — the list is present and names at least one verifier row; an absent list is missing evidence and an empty list declares no deployment for a record that declares verification"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "every_zk_design_pack_verifier_id_unique",
      "status": "pass",
      "evidence": "verifiers: no declared verifier_id is owned by more than one row"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "every_zk_design_pack_verifier_name_declared",
      "status": "pass",
      "evidence": "verifiers: every declared verifier row declares a non-empty verifier name"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "every_zk_design_pack_verifier_deployment_target_declared",
      "status": "pass",
      "evidence": "verifiers: every declared verifier row declares a non-empty deployment target"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "every_zk_design_pack_verifier_verification_key_reference_declared",
      "status": "pass",
      "evidence": "verifiers: every declared verifier row declares a non-empty verification-key reference — the record names which key material the deployment verifies against, without this atom verifying anything with it"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_soundness_property_declaration_recorded",
      "status": "pass",
      "evidence": "property declarations: a soundness property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that soundness holds"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_completeness_property_declaration_recorded",
      "status": "pass",
      "evidence": "property declarations: a completeness property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that completeness holds"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_zero_knowledge_property_declaration_recorded",
      "status": "pass",
      "evidence": "property declarations: a zero-knowledge property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that the property holds"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_soundness_assumptions_declared",
      "status": "pass",
      "evidence": "property declarations: the assumptions the declared soundness property rests on are declared"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_cryptographic_assumptions_declared",
      "status": "pass",
      "evidence": "property declarations: the cryptographic assumptions the design rests on are declared — declared only; this atom judges no assumption's strength"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_proof_system_selection_rationale_recorded",
      "status": "pass",
      "evidence": "selection rationale: the rationale for selecting the declared proof system is recorded"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_proof_system_alternatives_compared_declared",
      "status": "pass",
      "evidence": "selection rationale: the proof-system alternatives the selection was compared against are declared"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_proof_system_selection_tradeoffs_recorded",
      "status": "pass",
      "evidence": "selection rationale: the trade-offs of the proof-system selection are recorded"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_recovery_mechanism_design_declared",
      "status": "pass",
      "evidence": "recovery design: the recovery mechanism in the design is declared — escrow, social, phrase or none, as designed"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_recovery_weakening_effects_declared",
      "status": "pass",
      "evidence": "recovery design: the weakening effects of the chosen recovery mechanism on the design's model are documented — any recovery mechanism weakens the model, chosen consciously"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_recovery_choice_rationale_declared",
      "status": "pass",
      "evidence": "recovery design: the rationale for the recovery choice is declared"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_encrypted_search_limits_declared",
      "status": "pass",
      "evidence": "limits: the limits of encrypted search and query in the design are declared — encrypted search is a spectrum, stated honestly"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_server_inference_limits_declared",
      "status": "pass",
      "evidence": "limits: what the server can still infer under the design is declared"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_design_limitations_declared",
      "status": "pass",
      "evidence": "limits: the design's limitations are declared in the record"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_claim_mappings_list_declared",
      "status": "pass",
      "evidence": "claim mappings: the declared record names its claim-to-mechanism mapping rows — the list is present and names at least one row; an absent list is missing evidence and an empty list declares no mapping at all"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "every_zk_design_pack_claim_mapping_id_unique",
      "status": "pass",
      "evidence": "claim mappings: no declared mapping_id is owned by more than one row"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "every_zk_design_pack_claim_mapping_claim_text_declared",
      "status": "pass",
      "evidence": "claim mappings: every declared mapping row declares a non-empty claim text — the zero-knowledge statement as written in the design record"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "every_zk_design_pack_claim_mapping_mechanism_reference_declared",
      "status": "pass",
      "evidence": "claim mappings: every declared mapping row declares a non-empty mechanism reference — every statement maps to a mechanism in the design; no orphans"
    },
    {
      "section": "red_lines",
      "check": "zk_design_pack_free_of_zk_label_without_key_custody_description",
      "status": "pass",
      "evidence": "red line: no zero-knowledge label without describing key custody exactly is present in the record"
    },
    {
      "section": "red_lines",
      "check": "zk_design_pack_free_of_zkp_promotion_without_declared_proof_system",
      "status": "pass",
      "evidence": "red line: no ZKP promotion without an actual declared proof system is present in the record"
    },
    {
      "section": "red_lines",
      "check": "zk_design_pack_free_of_trusted_setup_ceremony_omitted_where_required",
      "status": "pass",
      "evidence": "red line: no omitted setup ceremony where a trusted setup is required is present in the record"
    },
    {
      "section": "red_lines",
      "check": "zk_design_pack_free_of_verifier_without_failure_handling_in_design",
      "status": "pass",
      "evidence": "red line: no verifier deployment without declared failure handling is present in the record"
    },
    {
      "section": "red_lines",
      "check": "zk_design_pack_free_of_recovery_weakening_undisclosed_in_design",
      "status": "pass",
      "evidence": "red line: no undisclosed recovery weakening is present in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "zk_design_circuits_count": 1,
  "zk_design_verifiers_count": 1,
  "zk_design_claim_mappings_count": 1,
  "duplicate_zk_design_circuit_ids": [],
  "duplicate_zk_design_verifier_ids": [],
  "duplicate_zk_design_claim_mapping_ids": [],
  "zk_design_circuits_without_name": [],
  "zk_design_circuits_without_statement": [],
  "zk_design_circuits_with_invalid_constraint_count": [],
  "zk_design_verifiers_without_name": [],
  "zk_design_verifiers_without_deployment_target": [],
  "zk_design_verifiers_without_verification_key_reference": [],
  "zk_design_claim_mappings_without_claim_text": [],
  "zk_design_claim_mappings_without_mechanism_reference": [],
  "zk_design_constraint_count_sum": "100.000000",
  "circuit_statement_coverage_ratio": "1.000000",
  "verifier_key_reference_coverage_ratio": "1.000000",
  "claim_mapping_mechanism_coverage_ratio": "1.000000",
  "summary": "59 pass, 0 fail, 0 missing of 59 checks across seven sections.",
  "stamp": "ZERO-KNOWLEDGE SYSTEM DESIGN PACK\ndesign_title: Vault-App-Design\nVERDICT: ZK_DESIGN_RECORD_SOUND\n  trust_model_and_key_custody                  pass\n  client_encryption_sharing_and_auth_design    pass\n  proof_system_and_circuit_design              pass\n  setup_and_verifier_deployment                pass\n  properties_and_proof_selection               pass\n  recovery_limits_and_claim_mapping            pass\n  red_lines                                    pass\n59 pass, 0 fail, 0 missing of 59 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T15:25:50.155455+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/zero-knowledge-system-design-pack/evidence.json`.

Input:

```json
{
  "design_title": "Vault-App-Design",
  "trust_model": {
    "server_content_visibility_declared": true,
    "server_metadata_visibility_declared": true,
    "server_access_pattern_visibility_declared": true,
    "server_role_in_design_declared": true,
    "key_custody_description_declared": true,
    "key_generation_location_declared": true,
    "key_storage_location_declared": true,
    "threat_actors_in_design_declared": true
  },
  "e2ee_design": {
    "client_encryption_architecture_declared": true,
    "key_derivation_approach_declared": true,
    "ciphertext_envelope_format_declared": true,
    "auth_flow_without_credential_exposure_declared": true,
    "pake_style_auth_approach_addressed": true,
    "sharing_key_wrapping_design_declared": true,
    "share_revocation_design_declared": true,
    "share_reencryption_path_declared": true
  },
  "proof_design": {
    "zkp_use_justification_declared": true,
    "zkp_specific_claim_statement_declared": true,
    "e2ee_alternative_for_proof_need_addressed": true,
    "circuit_work_budget_declared": true,
    "total_constraint_count_declared": 50.0
  },
  "circuits": [
    {
      "circuit_id": "c1",
      "circuit_name": "AuthCircuit",
      "statement_description": "Verify credentials",
      "constraint_count_declared": 100
    }
  ],
  "setup_and_verifier": {
    "trusted_setup_required": false,
    "setup_parameter_generation_declared": true,
    "setup_transcript_publication_declared": true,
    "verifier_location_declared": true,
    "verification_failure_handling_declared": true
  },
  "verifiers": [
    {
      "verifier_id": "v1",
      "verifier_name": "MainVerifier",
      "deployment_target": "Client",
      "verification_key_reference": "ref_001"
    }
  ],
  "properties": {
    "soundness_property_declaration_recorded": true,
    "completeness_property_declaration_recorded": true,
    "zero_knowledge_property_declaration_recorded": true,
    "soundness_assumptions_declared": true,
    "cryptographic_assumptions_declared": true,
    "proof_system_selection_rationale_recorded": true,
    "proof_system_alternatives_compared_declared": true,
    "proof_system_selection_tradeoffs_recorded": true
  },
  "recovery_and_limits": {
    "recovery_mechanism_design_declared": true,
    "recovery_weakening_effects_declared": true,
    "recovery_choice_rationale_declared": true,
    "encrypted_search_limits_declared": true,
    "server_inference_limits_declared": true,
    "design_limitations_declared": true
  },
  "claim_mappings": [
    {
      "mapping_id": "m1",
      "claim_text": "User owns key",
      "mechanism_reference": "KDF_Argon2"
    }
  ],
  "red_lines": {
    "zk_label_without_key_custody_description_present": true,
    "zkp_promotion_without_declared_proof_system_present": false,
    "trusted_setup_ceremony_omitted_where_required_present": false,
    "verifier_without_failure_handling_in_design_present": false,
    "recovery_weakening_undisclosed_in_design_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "zero-knowledge-system-design-pack",
  "atom_version": "0.1.0",
  "design_title": "Vault-App-Design",
  "verdict": "ZK_DESIGN_RECORD_NOT_SOUND",
  "sections": {
    "trust_model_and_key_custody": "pass",
    "client_encryption_sharing_and_auth_design": "pass",
    "proof_system_and_circuit_design": "fail",
    "setup_and_verifier_deployment": "pass",
    "properties_and_proof_selection": "pass",
    "recovery_limits_and_claim_mapping": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_server_content_visibility_declared",
      "status": "pass",
      "evidence": "trust model: the design record states exactly what content the server can and cannot see"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_server_metadata_visibility_declared",
      "status": "pass",
      "evidence": "trust model: the design record states exactly what metadata the server can and cannot see — metadata is data and is addressed explicitly"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_server_access_pattern_visibility_declared",
      "status": "pass",
      "evidence": "trust model: the design record states what access patterns the server can and cannot see"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_server_role_in_design_declared",
      "status": "pass",
      "evidence": "trust model: the server's role in the design is declared"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_key_custody_description_declared",
      "status": "pass",
      "evidence": "key custody: the design record describes key custody exactly — who holds keys, under the skill's red line that no zero-knowledge language stands without it"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_key_generation_location_declared",
      "status": "pass",
      "evidence": "key custody: where keys are generated is declared in the design record"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_key_storage_location_declared",
      "status": "pass",
      "evidence": "key custody: where keys are stored is declared in the design record"
    },
    {
      "section": "trust_model_and_key_custody",
      "check": "zk_design_pack_threat_actors_in_design_declared",
      "status": "pass",
      "evidence": "trust model: the threat actors the design is written against are declared"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_client_encryption_architecture_declared",
      "status": "pass",
      "evidence": "client-side encryption design: the client-side encryption architecture is declared — keys live with the user and the server side of the design holds ciphertext"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_key_derivation_approach_declared",
      "status": "pass",
      "evidence": "client-side encryption design: the client-side key derivation approach is declared"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_ciphertext_envelope_format_declared",
      "status": "pass",
      "evidence": "client-side encryption design: the format of the ciphertext and envelopes the server stores is declared"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_auth_flow_without_credential_exposure_declared",
      "status": "pass",
      "evidence": "auth design: the authentication flow is declared as one in which passwords do not reach the server"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_pake_style_auth_approach_addressed",
      "status": "pass",
      "evidence": "auth design: a PAKE-style approach to authentication without credential exposure is addressed in the design record"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_sharing_key_wrapping_design_declared",
      "status": "pass",
      "evidence": "sharing design: per-share key wrapping is designed in and declared"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_share_revocation_design_declared",
      "status": "pass",
      "evidence": "sharing design: share revocation is designed in and declared"
    },
    {
      "section": "client_encryption_sharing_and_auth_design",
      "check": "zk_design_pack_share_reencryption_path_declared",
      "status": "pass",
      "evidence": "sharing design: the re-encryption path for shared data is documented in the design record"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "zk_design_pack_zkp_use_justification_declared",
      "status": "pass",
      "evidence": "proof design: the record justifies why a zero-knowledge proof is used at all — ZKP only where it pays, since most products need E2EE, not ZKPs"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "zk_design_pack_zkp_specific_claim_statement_declared",
      "status": "pass",
      "evidence": "proof design: the specific claim the proof system is used for is stated in the design record"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "zk_design_pack_e2ee_alternative_for_proof_need_addressed",
      "status": "pass",
      "evidence": "proof design: the record addresses whether client-side encryption alone would meet the stated need, before proof-system work is taken on"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "zk_design_pack_circuit_work_budget_declared",
      "status": "pass",
      "evidence": "proof design: the circuit work for the proof system is budgeted in the design record"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "zk_design_pack_circuits_list_declared",
      "status": "pass",
      "evidence": "circuits: the declared record names its circuits — the list is present and names at least one circuit; an absent list is missing evidence and an empty list declares no circuit work for a record that declares a proof system"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "every_zk_design_pack_circuit_id_unique",
      "status": "pass",
      "evidence": "circuits: no declared circuit_id is owned by more than one row"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "every_zk_design_pack_circuit_name_declared",
      "status": "pass",
      "evidence": "circuits: every declared circuit declares a non-empty circuit name"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "every_zk_design_pack_circuit_statement_declared",
      "status": "pass",
      "evidence": "circuits: every declared circuit declares a non-empty statement description — the claim that circuit is written for"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "every_zk_design_pack_circuit_constraint_count_non_negative",
      "status": "pass",
      "evidence": "circuits: every declared circuit declares a non-negative constraint count"
    },
    {
      "section": "proof_system_and_circuit_design",
      "check": "zk_design_pack_total_constraint_count_recomputes",
      "status": "fail",
      "evidence": "circuits: the declared total constraint count recomputes exactly as the sum of the declared per-circuit constraint counts"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "zk_design_pack_setup_parameter_generation_declared",
      "status": "pass",
      "evidence": "setup design: how the setup parameters are generated is declared in the design record"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "zk_design_pack_setup_transcript_publication_declared",
      "status": "pass",
      "evidence": "setup design: publication of the setup transcript is declared in the design record"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "zk_design_pack_verifier_location_declared",
      "status": "pass",
      "evidence": "verifier design: where verification runs in the deployment is declared"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "zk_design_pack_verification_failure_handling_declared",
      "status": "pass",
      "evidence": "verifier design: what happens when verification fails is declared in the design record"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "zk_design_pack_ceremony_procedure_declared_where_trusted_setup_required",
      "status": "pass",
      "evidence": "no trusted setup declared required"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "zk_design_pack_verifiers_list_declared",
      "status": "pass",
      "evidence": "verifiers: the declared record names its verifier deployments — the list is present and names at least one verifier row; an absent list is missing evidence and an empty list declares no deployment for a record that declares verification"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "every_zk_design_pack_verifier_id_unique",
      "status": "pass",
      "evidence": "verifiers: no declared verifier_id is owned by more than one row"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "every_zk_design_pack_verifier_name_declared",
      "status": "pass",
      "evidence": "verifiers: every declared verifier row declares a non-empty verifier name"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "every_zk_design_pack_verifier_deployment_target_declared",
      "status": "pass",
      "evidence": "verifiers: every declared verifier row declares a non-empty deployment target"
    },
    {
      "section": "setup_and_verifier_deployment",
      "check": "every_zk_design_pack_verifier_verification_key_reference_declared",
      "status": "pass",
      "evidence": "verifiers: every declared verifier row declares a non-empty verification-key reference — the record names which key material the deployment verifies against, without this atom verifying anything with it"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_soundness_property_declaration_recorded",
      "status": "pass",
      "evidence": "property declarations: a soundness property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that soundness holds"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_completeness_property_declaration_recorded",
      "status": "pass",
      "evidence": "property declarations: a completeness property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that completeness holds"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_zero_knowledge_property_declaration_recorded",
      "status": "pass",
      "evidence": "property declarations: a zero-knowledge property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that the property holds"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_soundness_assumptions_declared",
      "status": "pass",
      "evidence": "property declarations: the assumptions the declared soundness property rests on are declared"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_cryptographic_assumptions_declared",
      "status": "pass",
      "evidence": "property declarations: the cryptographic assumptions the design rests on are declared — declared only; this atom judges no assumption's strength"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_proof_system_selection_rationale_recorded",
      "status": "pass",
      "evidence": "selection rationale: the rationale for selecting the declared proof system is recorded"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_proof_system_alternatives_compared_declared",
      "status": "pass",
      "evidence": "selection rationale: the proof-system alternatives the selection was compared against are declared"
    },
    {
      "section": "properties_and_proof_selection",
      "check": "zk_design_pack_proof_system_selection_tradeoffs_recorded",
      "status": "pass",
      "evidence": "selection rationale: the trade-offs of the proof-system selection are recorded"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_recovery_mechanism_design_declared",
      "status": "pass",
      "evidence": "recovery design: the recovery mechanism in the design is declared — escrow, social, phrase or none, as designed"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_recovery_weakening_effects_declared",
      "status": "pass",
      "evidence": "recovery design: the weakening effects of the chosen recovery mechanism on the design's model are documented — any recovery mechanism weakens the model, chosen consciously"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_recovery_choice_rationale_declared",
      "status": "pass",
      "evidence": "recovery design: the rationale for the recovery choice is declared"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_encrypted_search_limits_declared",
      "status": "pass",
      "evidence": "limits: the limits of encrypted search and query in the design are declared — encrypted search is a spectrum, stated honestly"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_server_inference_limits_declared",
      "status": "pass",
      "evidence": "limits: what the server can still infer under the design is declared"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_design_limitations_declared",
      "status": "pass",
      "evidence": "limits: the design's limitations are declared in the record"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "zk_design_pack_claim_mappings_list_declared",
      "status": "pass",
      "evidence": "claim mappings: the declared record names its claim-to-mechanism mapping rows — the list is present and names at least one row; an absent list is missing evidence and an empty list declares no mapping at all"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "every_zk_design_pack_claim_mapping_id_unique",
      "status": "pass",
      "evidence": "claim mappings: no declared mapping_id is owned by more than one row"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "every_zk_design_pack_claim_mapping_claim_text_declared",
      "status": "pass",
      "evidence": "claim mappings: every declared mapping row declares a non-empty claim text — the zero-knowledge statement as written in the design record"
    },
    {
      "section": "recovery_limits_and_claim_mapping",
      "check": "every_zk_design_pack_claim_mapping_mechanism_reference_declared",
      "status": "pass",
      "evidence": "claim mappings: every declared mapping row declares a non-empty mechanism reference — every statement maps to a mechanism in the design; no orphans"
    },
    {
      "section": "red_lines",
      "check": "zk_design_pack_free_of_zk_label_without_key_custody_description",
      "status": "fail",
      "evidence": "red line: no zero-knowledge label without describing key custody exactly is present in the record"
    },
    {
      "section": "red_lines",
      "check": "zk_design_pack_free_of_zkp_promotion_without_declared_proof_system",
      "status": "pass",
      "evidence": "red line: no ZKP promotion without an actual declared proof system is present in the record"
    },
    {
      "section": "red_lines",
      "check": "zk_design_pack_free_of_trusted_setup_ceremony_omitted_where_required",
      "status": "pass",
      "evidence": "red line: no omitted setup ceremony where a trusted setup is required is present in the record"
    },
    {
      "section": "red_lines",
      "check": "zk_design_pack_free_of_verifier_without_failure_handling_in_design",
      "status": "pass",
      "evidence": "red line: no verifier deployment without declared failure handling is present in the record"
    },
    {
      "section": "red_lines",
      "check": "zk_design_pack_free_of_recovery_weakening_undisclosed_in_design",
      "status": "pass",
      "evidence": "red line: no undisclosed recovery weakening is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "zk_design_circuits_count": 1,
  "zk_design_verifiers_count": 1,
  "zk_design_claim_mappings_count": 1,
  "duplicate_zk_design_circuit_ids": [],
  "duplicate_zk_design_verifier_ids": [],
  "duplicate_zk_design_claim_mapping_ids": [],
  "zk_design_circuits_without_name": [],
  "zk_design_circuits_without_statement": [],
  "zk_design_circuits_with_invalid_constraint_count": [],
  "zk_design_verifiers_without_name": [],
  "zk_design_verifiers_without_deployment_target": [],
  "zk_design_verifiers_without_verification_key_reference": [],
  "zk_design_claim_mappings_without_claim_text": [],
  "zk_design_claim_mappings_without_mechanism_reference": [],
  "zk_design_constraint_count_sum": "100.000000",
  "circuit_statement_coverage_ratio": "1.000000",
  "verifier_key_reference_coverage_ratio": "1.000000",
  "claim_mapping_mechanism_coverage_ratio": "1.000000",
  "summary": "57 pass, 2 fail, 0 missing of 59 checks across seven sections.",
  "stamp": "ZERO-KNOWLEDGE SYSTEM DESIGN PACK\ndesign_title: Vault-App-Design\nVERDICT: ZK_DESIGN_RECORD_NOT_SOUND\n  trust_model_and_key_custody                  pass\n  client_encryption_sharing_and_auth_design    pass\n  proof_system_and_circuit_design              fail\n  setup_and_verifier_deployment                pass\n  properties_and_proof_selection               pass\n  recovery_limits_and_claim_mapping            pass\n  red_lines                                    fail\n57 pass, 2 fail, 0 missing of 59 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T15:25:50.155455+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/zero-knowledge-system-design-pack/evidence.json`.

Input:

```json
{
  "circuits": "not-a-list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "circuits",
  "detail": "circuits must be a list"
}
```
