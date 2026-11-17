# Zero knowledge system design pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are designing a system that can't see user data and you keep a zero-knowledge system design record for one system being designed. This atom reads one declared zero-knowledge system design record and returns one deterministic verdict across seven sections (trust_model_and_key_custody, client_encryption_sharing_and_auth_design, proof_system_and_circuit_design, setup_and_verifier_deployment, properties_and_proof_selection, recovery_limits_and_claim_mapping, red_lines): **ZK_DESIGN_RECORD_SOUND**, **ZK_DESIGN_RECORD_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 59 checks. It audits the declared design record's completeness and internal consistency only — it proves nothing, verifies no proof, runs no cryptography, and certifies no cryptographic property: it generates no proof, verifies no proof, inspects no running system, reads no code, executes no circuit, and certifies no security, soundness, completeness or zero-knowledge property of any system or design. A record is sound *on your declared evidence*: a record that declares its trust model written, its circuits listed, its ceremony declared and its property declarations recorded passes those checks even if the real design did none of it. It is not a security certification, a cryptographic review, a proof verification, or a guarantee that the designed system is zero-knowledge, sound, complete or secure: it never judges whether a declared property holds, whether a declared constraint count is the real count of any real circuit, whether a mechanism reference actually supports the statement mapped to it, or whether the design should be built — only that the record contains what the skill's method and red lines demand, and that its declared rows are internally consistent. The computed checks: the declared `circuits` list must be present and name at least one circuit, with unique `circuit_id` values, a non-empty `circuit_name` and `statement_description` on every row, and a non-negative `constraint_count_declared` on every row, and the declared `proof_design.total_constraint_count_declared` must recompute exactly as the sum of the declared per-circuit constraint counts; the declared `verifiers` list must be present and name at least one verifier, with unique `verifier_id` values and a non-empty `verifier_name`, `deployment_target` and `verification_key_reference` on every row (the reference is recorded as declared — it is never used to verify anything); and the declared `claim_mappings` list must be present and name at least one mapping, with unique `mapping_id` values and a non-empty `claim_text` and `mechanism_reference` on every row. One check is gated on the record's own declared gate field: a ceremony procedure is required only where `setup_and_verifier.trusted_setup_required` is declared `true` — when the gate is declared `false` the check passes as not applicable, and when the gate field is absent the check is missing evidence. No numeric threshold is imposed — no minimum or maximum constraint count for any circuit or in total; no soundness-error bound or any numeric security parameter (bits of security, curve or field size, hash output length); no key length, KDF choice, KDF iteration count or algorithm choice (an approach being declared and addressed is judged, never which one); no ceremony size, participant count or contribution threshold; no proof size, proving time or verification time ceiling; no verifier, circuit or mapping count beyond at least one declared row each; no judgment that a declared soundness, completeness or zero-knowledge property actually holds (those checks record only that a declaration and its assumptions are in the record); and no judgment that the selected proof system is the right, best or advisable one (only that a rationale, alternatives and trade-offs are recorded). The only bars on the computed rows are exact recomputation and completeness over your own declared rows. Note the boundary case: a design that uses no proof system at all (pure client-side E2EE) cannot pass this record format's circuits-declared and verifiers-declared checks, because the format requires at least one declared circuit row and one declared verifier row — such a design is outside this atom's computed reach, not failed on its merits. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "zero-knowledge-system-design-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/zero-knowledge-system-design-pack` — tool name `zero_knowledge_system_design_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/zero-knowledge-system-design-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `design_title` | Design title (string; carried into the output, not checked) |
| `trust_model.server_content_visibility_declared` | trust-model evidence: what content the server can and cannot see is stated |
| `trust_model.server_metadata_visibility_declared` | trust-model evidence: what metadata the server can and cannot see is stated |
| `trust_model.server_access_pattern_visibility_declared` | trust-model evidence: what access patterns the server can and cannot see is stated |
| `trust_model.server_role_in_design_declared` | trust-model evidence: the server's role in the design is declared |
| `trust_model.key_custody_description_declared` | key-custody evidence: key custody is described exactly |
| `trust_model.key_generation_location_declared` | key-custody evidence: where keys are generated is declared |
| `trust_model.key_storage_location_declared` | key-custody evidence: where keys are stored is declared |
| `trust_model.threat_actors_in_design_declared` | trust-model evidence: the threat actors the design is written against are declared |
| `e2ee_design.client_encryption_architecture_declared` | E2EE evidence: the client-side encryption architecture is declared |
| `e2ee_design.key_derivation_approach_declared` | E2EE evidence: the client-side key derivation approach is declared (the approach class only — no algorithm is graded) |
| `e2ee_design.ciphertext_envelope_format_declared` | E2EE evidence: the ciphertext / envelope format the server stores is declared |
| `e2ee_design.auth_flow_without_credential_exposure_declared` | auth evidence: the authentication flow is declared as one in which passwords do not reach the server |
| `e2ee_design.pake_style_auth_approach_addressed` | auth evidence: a PAKE-style approach to authentication without credential exposure is addressed |
| `e2ee_design.sharing_key_wrapping_design_declared` | sharing evidence: per-share key wrapping is designed in and declared |
| `e2ee_design.share_revocation_design_declared` | sharing evidence: share revocation is designed in and declared |
| `e2ee_design.share_reencryption_path_declared` | sharing evidence: the re-encryption path for shared data is documented |
| `proof_design.zkp_use_justification_declared` | proof evidence: why a zero-knowledge proof is used at all is justified |
| `proof_design.zkp_specific_claim_statement_declared` | proof evidence: the specific claim the proof system is used for is stated |
| `proof_design.e2ee_alternative_for_proof_need_addressed` | proof evidence: whether client-side encryption alone would meet the stated need is addressed |
| `proof_design.circuit_work_budget_declared` | proof evidence: the circuit work for the proof system is budgeted |
| `proof_design.total_constraint_count_declared` (number) | computed: must recompute exactly as the sum of the declared per-circuit constraint counts |
| `circuits` (list of circuit objects) | computed: must be present and name at least one circuit; reported as `zk_design_circuits_count` |
| `circuits[].circuit_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `circuits[].circuit_name` (string) | computed: must be present and non-empty on every row |
| `circuits[].statement_description` (string) | computed: must be present and non-empty on every row — the claim that circuit is written for |
| `circuits[].constraint_count_declared` (number) | computed: must be non-negative on every row |
| `setup_and_verifier.trusted_setup_required` | gates the ceremony-procedure check: it applies only where a trusted setup is declared required |
| `setup_and_verifier.ceremony_procedure_declared` | required when `setup_and_verifier.trusted_setup_required` is `true`; otherwise the check passes as not applicable |
| `setup_and_verifier.setup_parameter_generation_declared` | setup evidence: how the setup parameters are generated is declared |
| `setup_and_verifier.setup_transcript_publication_declared` | setup evidence: publication of the setup transcript is declared |
| `setup_and_verifier.verifier_location_declared` | verifier evidence: where verification runs in the deployment is declared |
| `setup_and_verifier.verification_failure_handling_declared` | verifier evidence: what happens when verification fails is declared |
| `verifiers` (list of verifier objects) | computed: must be present and name at least one verifier; reported as `zk_design_verifiers_count` |
| `verifiers[].verifier_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `verifiers[].verifier_name` (string) | computed: must be present and non-empty on every row |
| `verifiers[].deployment_target` (string) | computed: must be present and non-empty on every row |
| `verifiers[].verification_key_reference` (string) | computed: must be present and non-empty on every row — recorded as declared only; never used to verify anything |
| `properties.soundness_property_declaration_recorded` | property evidence: a soundness property declaration is recorded (declaration only — it establishes nothing about whether soundness holds) |
| `properties.completeness_property_declaration_recorded` | property evidence: a completeness property declaration is recorded (declaration only) |
| `properties.zero_knowledge_property_declaration_recorded` | property evidence: a zero-knowledge property declaration is recorded (declaration only) |
| `properties.soundness_assumptions_declared` | property evidence: the assumptions the declared soundness property rests on are declared |
| `properties.cryptographic_assumptions_declared` | property evidence: the cryptographic assumptions the design rests on are declared (no assumption's strength is judged) |
| `properties.proof_system_selection_rationale_recorded` | selection evidence: the rationale for selecting the declared proof system is recorded |
| `properties.proof_system_alternatives_compared_declared` | selection evidence: the proof-system alternatives the selection was compared against are declared |
| `properties.proof_system_selection_tradeoffs_recorded` | selection evidence: the trade-offs of the proof-system selection are recorded |
| `recovery_and_limits.recovery_mechanism_design_declared` | recovery evidence: the recovery mechanism in the design is declared |
| `recovery_and_limits.recovery_weakening_effects_declared` | recovery evidence: the weakening effects of the chosen recovery mechanism are documented |
| `recovery_and_limits.recovery_choice_rationale_declared` | recovery evidence: the rationale for the recovery choice is declared |
| `recovery_and_limits.encrypted_search_limits_declared` | limits evidence: the limits of encrypted search and query in the design are declared |
| `recovery_and_limits.server_inference_limits_declared` | limits evidence: what the server can still infer under the design is declared |
| `recovery_and_limits.design_limitations_declared` | limits evidence: the design's limitations are declared |
| `claim_mappings` (list of mapping objects) | computed: must be present and name at least one mapping; reported as `zk_design_claim_mappings_count` |
| `claim_mappings[].mapping_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `claim_mappings[].claim_text` (string) | computed: must be present and non-empty on every row — the zero-knowledge statement as written in the design record |
| `claim_mappings[].mechanism_reference` (string) | computed: must be present and non-empty on every row — every statement maps to a mechanism; no orphans |
| `red_lines.zk_label_without_key_custody_description_present` | must be `false` to pass (red line: no zero-knowledge label without describing key custody exactly) |
| `red_lines.zkp_promotion_without_declared_proof_system_present` | must be `false` to pass (red line: no ZKP promotion without an actual declared proof system) |
| `red_lines.trusted_setup_ceremony_omitted_where_required_present` | must be `false` to pass (red line: no omitted setup ceremony where a trusted setup is required) |
| `red_lines.verifier_without_failure_handling_in_design_present` | must be `false` to pass (red line: no verifier deployment without declared failure handling) |
| `red_lines.recovery_weakening_undisclosed_in_design_present` | must be `false` to pass (red line: no undisclosed recovery weakening) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward ZK_DESIGN_RECORD_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/zero-knowledge-system-design-pack`:

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

Response — HTTP 200 (trimmed; the full response carries all 59 checks and a text stamp of the verdict):

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
  "summary": "59 pass, 0 fail, 0 missing of 59 checks across seven sections."
}
```

## Verdicts

- **ZK_DESIGN_RECORD_SOUND** — every check passes; the declared zero-knowledge system design record is complete and internally consistent with the skill's method and red lines. The verdict names the **record** only — it does not mean the designed system is sound, secure or zero-knowledge.
- **ZK_DESIGN_RECORD_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `zk_design_circuits_count`, `zk_design_verifiers_count` and `zk_design_claim_mappings_count` (integers, exactly; each null when its parent list is not declared), `duplicate_zk_design_circuit_ids`, `duplicate_zk_design_verifier_ids` and `duplicate_zk_design_claim_mapping_ids` (ids carried by more than one row; each null when its list is not declared), `zk_design_circuits_without_name`, `zk_design_circuits_without_statement`, `zk_design_circuits_with_invalid_constraint_count`, `zk_design_verifiers_without_name`, `zk_design_verifiers_without_deployment_target`, `zk_design_verifiers_without_verification_key_reference`, `zk_design_claim_mappings_without_claim_text` and `zk_design_claim_mappings_without_mechanism_reference` (the offending rows for each computed rule; each null when its underlying list is not declared), `zk_design_constraint_count_sum` (the sum of the declared per-circuit constraint counts), `circuit_statement_coverage_ratio` (circuits with a recorded statement description ÷ declared circuits), `verifier_key_reference_coverage_ratio` (verifiers with a recorded verification-key reference ÷ declared verifiers) and `claim_mapping_mechanism_coverage_ratio` (mappings with a recorded mechanism reference ÷ declared mappings; each quantity and ratio a string with exactly six decimal places, and null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the fifteen primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
