#!/usr/bin/env python3
"""Zero-knowledge system design pack — deterministic core.

Built from the bound skill `zero-knowledge-systems`: "Design
systems that can't see user data — client-side E2EE, metadata
honesty, ZKP only where justified." Its method in brief is this
atom's record structure: define the trust model exactly (what
the server can and cannot see — content, metadata, access
patterns); client-side encryption with keys derived on the
client and per-share key wrapping, revocation and re-encryption
designed in; auth without exposure (PAKE/OPAQUE-style flows);
ZKP only where it pays — a proof system for a specific claim,
with circuit work budgeted; recovery trade-offs chosen
consciously and documented with their weakening effects;
honesty about the limits of encrypted search and what a server
can still infer; and a claims audit in which every
zero-knowledge statement maps to a mechanism — no orphans. Its
red lines are this atom's red lines: no "zero-knowledge"
without describing key custody exactly, and no ZKP promotion
without an actual proof system.

This atom is a DELIVERABLE audit of a declared ZK system
DESIGN record: it audits the record a caller declares — the
trust-model and key-custody declarations, the client-encryption,
auth and sharing design declarations, the declared circuit
rows with their declared constraint counts, the setup /
ceremony declarations, the declared verifier / deployment
rows, the soundness / completeness / zero-knowledge property
DECLARATIONS, the proof-system selection rationale
declarations, the recovery and limits declarations, the
declared claim-to-mechanism mapping rows, and the red lines
refused. It proves NOTHING, verifies no proof, runs no
cryptography, and certifies no security property: every skill
step that would generate or verify a proof, certify that a
system is secure, or advise on cryptographic construction is
EXCLUDED from this atom by name — proof generation, proof
verification, security certification, cryptographic advice,
circuit construction, and judging that any declared property
(soundness, completeness, zero-knowledge) actually holds are
each excluded; the atom checks only that the design record the
skill requires is present and internally consistent on the
declared evidence, and it recomputes the record's own declared
constraint arithmetic exactly.

Distinct ground: the nearest sibling is
`zero-knowledge-claim-audit` (a CHECK of a product's declared
zero-knowledge CLAIMS against its declared posture — whether a
server can read user data, whether keys leave a device,
escrow / recovery consistency, plaintext locations and theater
in published claims). This atom shares zero checks with it:
every check here is a DESIGN-record question — trust-model and
key-custody sections written, circuit rows with constraint
counts that recompute to a declared total, a setup ceremony
declared where a trusted setup is required, verifier /
deployment rows with verification-key references, property and
selection-rationale declarations recorded, recovery weakening
and search-limit declarations, and claim-to-mechanism mapping
rows in the design record. The boundary is: the design record
for a system being designed here; the soundness of published
claims about an existing product there.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- circuits: at least one declared row (a design record that
  declares a proof system declares the circuits it runs),
  unique circuit ids, a non-empty circuit name and a non-empty
  statement description on every row, and every declared
  constraint count non-negative;
- constraint total: the declared total constraint count
  recomputes as the sum of the declared per-circuit constraint
  counts, compared on the fixed 6dp serialization below;
- verifiers: at least one declared row, unique verifier ids,
  and a non-empty verifier name, deployment target and
  verification-key reference on every row;
- claim mappings: at least one declared row, unique mapping
  ids, and a non-empty claim text and mechanism reference on
  every row (the skill: every statement maps to a mechanism;
  no orphans);
- gated declaration: a ceremony procedure is required only
  where a trusted setup is declared required.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric threshold at all — no minimum
constraint count, no soundness-error bound, no security
parameter, no ceremony size — so no such check is invented;
those quantities are caller declarations at most, and
quantities here are computed and reported, with exact
recomputation and completeness over the caller's own declared
rows as the only bars.

Verdict:
- any fail             -> ZK_DESIGN_RECORD_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> ZK_DESIGN_RECORD_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "trust_model_and_key_custody",
    "client_encryption_sharing_and_auth_design",
    "proof_system_and_circuit_design",
    "setup_and_verifier_deployment",
    "properties_and_proof_selection",
    "recovery_limits_and_claim_mapping",
    "red_lines",
)

MANIFEST_SPEC = {
    "design_title": "string",
    "trust_model": {
        "server_content_visibility_declared": "boolean",
        "server_metadata_visibility_declared": "boolean",
        "server_access_pattern_visibility_declared": "boolean",
        "server_role_in_design_declared": "boolean",
        "key_custody_description_declared": "boolean",
        "key_generation_location_declared": "boolean",
        "key_storage_location_declared": "boolean",
        "threat_actors_in_design_declared": "boolean",
    },
    "e2ee_design": {
        "client_encryption_architecture_declared": "boolean",
        "key_derivation_approach_declared": "boolean",
        "ciphertext_envelope_format_declared": "boolean",
        "auth_flow_without_credential_exposure_declared": "boolean",
        "pake_style_auth_approach_addressed": "boolean",
        "sharing_key_wrapping_design_declared": "boolean",
        "share_revocation_design_declared": "boolean",
        "share_reencryption_path_declared": "boolean",
    },
    "proof_design": {
        "zkp_use_justification_declared": "boolean",
        "zkp_specific_claim_statement_declared": "boolean",
        "e2ee_alternative_for_proof_need_addressed": "boolean",
        "circuit_work_budget_declared": "boolean",
        "total_constraint_count_declared": "number",
    },
    "circuits": [{
        "circuit_id": "string",
        "circuit_name": "string",
        "statement_description": "string",
        "constraint_count_declared": "number",
    }],
    "setup_and_verifier": {
        "trusted_setup_required": "boolean",
        "ceremony_procedure_declared": "boolean",
        "setup_parameter_generation_declared": "boolean",
        "setup_transcript_publication_declared": "boolean",
        "verifier_location_declared": "boolean",
        "verification_failure_handling_declared": "boolean",
    },
    "verifiers": [{
        "verifier_id": "string",
        "verifier_name": "string",
        "deployment_target": "string",
        "verification_key_reference": "string",
    }],
    "properties": {
        "soundness_property_declaration_recorded": "boolean",
        "completeness_property_declaration_recorded": "boolean",
        "zero_knowledge_property_declaration_recorded": "boolean",
        "soundness_assumptions_declared": "boolean",
        "cryptographic_assumptions_declared": "boolean",
        "proof_system_selection_rationale_recorded": "boolean",
        "proof_system_alternatives_compared_declared": "boolean",
        "proof_system_selection_tradeoffs_recorded": "boolean",
    },
    "recovery_and_limits": {
        "recovery_mechanism_design_declared": "boolean",
        "recovery_weakening_effects_declared": "boolean",
        "recovery_choice_rationale_declared": "boolean",
        "encrypted_search_limits_declared": "boolean",
        "server_inference_limits_declared": "boolean",
        "design_limitations_declared": "boolean",
    },
    "claim_mappings": [{
        "mapping_id": "string",
        "claim_text": "string",
        "mechanism_reference": "string",
    }],
    "red_lines": {
        "zk_label_without_key_custody_description_present": "boolean",
        "zkp_promotion_without_declared_proof_system_present": "boolean",
        "trusted_setup_ceremony_omitted_where_required_present": "boolean",
        "verifier_without_failure_handling_in_design_present": "boolean",
        "recovery_weakening_undisclosed_in_design_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def _duplicates(rows, field):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get(field), str):
            nm = c[field]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _is_number(value):
    return (isinstance(value, (int, float))
            and not isinstance(value, bool))


def evaluate(manifest):
    """Return the verdict dict for a ZK system design record."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    circuits, has_circuits = _get(manifest, "circuits")
    circ_is_list = has_circuits and isinstance(circuits, list)
    circ_count = len(circuits) if circ_is_list else None
    circ_rows = circuits if circ_is_list else []

    verifiers, has_verifiers = _get(manifest, "verifiers")
    ver_is_list = has_verifiers and isinstance(verifiers, list)
    ver_count = len(verifiers) if ver_is_list else None
    ver_rows = verifiers if ver_is_list else []

    mappings, has_mappings = _get(manifest, "claim_mappings")
    map_is_list = has_mappings and isinstance(mappings, list)
    map_count = len(mappings) if map_is_list else None
    map_rows = mappings if map_is_list else []

    total_declared, has_total = _get(
        manifest, "proof_design", "total_constraint_count_declared")

    duplicate_circuit_ids = (
        _duplicates(circ_rows, "circuit_id") if circ_is_list else None)
    duplicate_verifier_ids = (
        _duplicates(ver_rows, "verifier_id") if ver_is_list else None)
    duplicate_mapping_ids = (
        _duplicates(map_rows, "mapping_id") if map_is_list else None)

    circuits_without_name = (
        [_row_name(c, "circuit_id") for c in circ_rows
         if _has(c, "circuit_name")
         and not _nonempty_str(c.get("circuit_name"))]
        if circ_is_list else None)
    circuits_without_statement = (
        [_row_name(c, "circuit_id") for c in circ_rows
         if _has(c, "statement_description")
         and not _nonempty_str(c.get("statement_description"))]
        if circ_is_list else None)
    circuits_with_invalid_constraint_count = (
        [_row_name(c, "circuit_id") for c in circ_rows
         if _has(c, "constraint_count_declared")
         and not (_is_number(c.get("constraint_count_declared"))
                  and c.get("constraint_count_declared") >= 0)]
        if circ_is_list else None)
    verifiers_without_name = (
        [_row_name(c, "verifier_id") for c in ver_rows
         if _has(c, "verifier_name")
         and not _nonempty_str(c.get("verifier_name"))]
        if ver_is_list else None)
    verifiers_without_deployment_target = (
        [_row_name(c, "verifier_id") for c in ver_rows
         if _has(c, "deployment_target")
         and not _nonempty_str(c.get("deployment_target"))]
        if ver_is_list else None)
    verifiers_without_key_reference = (
        [_row_name(c, "verifier_id") for c in ver_rows
         if _has(c, "verification_key_reference")
         and not _nonempty_str(c.get("verification_key_reference"))]
        if ver_is_list else None)
    mappings_without_claim_text = (
        [_row_name(c, "mapping_id") for c in map_rows
         if _has(c, "claim_text")
         and not _nonempty_str(c.get("claim_text"))]
        if map_is_list else None)
    mappings_without_mechanism_reference = (
        [_row_name(c, "mapping_id") for c in map_rows
         if _has(c, "mechanism_reference")
         and not _nonempty_str(c.get("mechanism_reference"))]
        if map_is_list else None)

    constraint_sum = None
    if circ_is_list:
        constraint_sum = 0.0
        for c in circ_rows:
            if isinstance(c, dict) and _is_number(
                    c.get("constraint_count_declared")):
                constraint_sum += c["constraint_count_declared"]

    def _total_recomputes():
        if not _is_number(total_declared) or constraint_sum is None:
            return False
        return _fmt6(constraint_sum) == _fmt6(total_declared)

    circuit_statement_ratio = (
        sum(1 for c in circ_rows
            if _nonempty_str(c.get("statement_description"))) / circ_count
        if circ_is_list and circ_count > 0 else None)
    verifier_key_reference_ratio = (
        sum(1 for c in ver_rows
            if _nonempty_str(c.get("verification_key_reference")))
        / ver_count
        if ver_is_list and ver_count > 0 else None)
    mapping_mechanism_ratio = (
        sum(1 for c in map_rows
            if _nonempty_str(c.get("mechanism_reference"))) / map_count
        if map_is_list and map_count > 0 else None)

    # ---- Section 1: trust_model_and_key_custody ----
    _bool_check(results, "trust_model_and_key_custody",
                "zk_design_pack_server_content_visibility_declared", manifest,
                ("trust_model", "server_content_visibility_declared"),
                "trust model: the design record states exactly what content the server can and cannot see")
    _bool_check(results, "trust_model_and_key_custody",
                "zk_design_pack_server_metadata_visibility_declared", manifest,
                ("trust_model", "server_metadata_visibility_declared"),
                "trust model: the design record states exactly what metadata the server can and cannot see — metadata is data and is addressed explicitly")
    _bool_check(results, "trust_model_and_key_custody",
                "zk_design_pack_server_access_pattern_visibility_declared",
                manifest,
                ("trust_model", "server_access_pattern_visibility_declared"),
                "trust model: the design record states what access patterns the server can and cannot see")
    _bool_check(results, "trust_model_and_key_custody",
                "zk_design_pack_server_role_in_design_declared", manifest,
                ("trust_model", "server_role_in_design_declared"),
                "trust model: the server's role in the design is declared")
    _bool_check(results, "trust_model_and_key_custody",
                "zk_design_pack_key_custody_description_declared", manifest,
                ("trust_model", "key_custody_description_declared"),
                "key custody: the design record describes key custody exactly — who holds keys, under the skill's red line that no zero-knowledge language stands without it")
    _bool_check(results, "trust_model_and_key_custody",
                "zk_design_pack_key_generation_location_declared", manifest,
                ("trust_model", "key_generation_location_declared"),
                "key custody: where keys are generated is declared in the design record")
    _bool_check(results, "trust_model_and_key_custody",
                "zk_design_pack_key_storage_location_declared", manifest,
                ("trust_model", "key_storage_location_declared"),
                "key custody: where keys are stored is declared in the design record")
    _bool_check(results, "trust_model_and_key_custody",
                "zk_design_pack_threat_actors_in_design_declared", manifest,
                ("trust_model", "threat_actors_in_design_declared"),
                "trust model: the threat actors the design is written against are declared")

    # ---- Section 2: client_encryption_sharing_and_auth_design ----
    _bool_check(results, "client_encryption_sharing_and_auth_design",
                "zk_design_pack_client_encryption_architecture_declared",
                manifest,
                ("e2ee_design", "client_encryption_architecture_declared"),
                "client-side encryption design: the client-side encryption architecture is declared — keys live with the user and the server side of the design holds ciphertext")
    _bool_check(results, "client_encryption_sharing_and_auth_design",
                "zk_design_pack_key_derivation_approach_declared", manifest,
                ("e2ee_design", "key_derivation_approach_declared"),
                "client-side encryption design: the client-side key derivation approach is declared")
    _bool_check(results, "client_encryption_sharing_and_auth_design",
                "zk_design_pack_ciphertext_envelope_format_declared", manifest,
                ("e2ee_design", "ciphertext_envelope_format_declared"),
                "client-side encryption design: the format of the ciphertext and envelopes the server stores is declared")
    _bool_check(results, "client_encryption_sharing_and_auth_design",
                "zk_design_pack_auth_flow_without_credential_exposure_declared",
                manifest,
                ("e2ee_design",
                 "auth_flow_without_credential_exposure_declared"),
                "auth design: the authentication flow is declared as one in which passwords do not reach the server")
    _bool_check(results, "client_encryption_sharing_and_auth_design",
                "zk_design_pack_pake_style_auth_approach_addressed", manifest,
                ("e2ee_design", "pake_style_auth_approach_addressed"),
                "auth design: a PAKE-style approach to authentication without credential exposure is addressed in the design record")
    _bool_check(results, "client_encryption_sharing_and_auth_design",
                "zk_design_pack_sharing_key_wrapping_design_declared", manifest,
                ("e2ee_design", "sharing_key_wrapping_design_declared"),
                "sharing design: per-share key wrapping is designed in and declared")
    _bool_check(results, "client_encryption_sharing_and_auth_design",
                "zk_design_pack_share_revocation_design_declared", manifest,
                ("e2ee_design", "share_revocation_design_declared"),
                "sharing design: share revocation is designed in and declared")
    _bool_check(results, "client_encryption_sharing_and_auth_design",
                "zk_design_pack_share_reencryption_path_declared", manifest,
                ("e2ee_design", "share_reencryption_path_declared"),
                "sharing design: the re-encryption path for shared data is documented in the design record")

    # ---- Section 3: proof_system_and_circuit_design ----
    _bool_check(results, "proof_system_and_circuit_design",
                "zk_design_pack_zkp_use_justification_declared", manifest,
                ("proof_design", "zkp_use_justification_declared"),
                "proof design: the record justifies why a zero-knowledge proof is used at all — ZKP only where it pays, since most products need E2EE, not ZKPs")
    _bool_check(results, "proof_system_and_circuit_design",
                "zk_design_pack_zkp_specific_claim_statement_declared",
                manifest,
                ("proof_design", "zkp_specific_claim_statement_declared"),
                "proof design: the specific claim the proof system is used for is stated in the design record")
    _bool_check(results, "proof_system_and_circuit_design",
                "zk_design_pack_e2ee_alternative_for_proof_need_addressed",
                manifest,
                ("proof_design", "e2ee_alternative_for_proof_need_addressed"),
                "proof design: the record addresses whether client-side encryption alone would meet the stated need, before proof-system work is taken on")
    _bool_check(results, "proof_system_and_circuit_design",
                "zk_design_pack_circuit_work_budget_declared", manifest,
                ("proof_design", "circuit_work_budget_declared"),
                "proof design: the circuit work for the proof system is budgeted in the design record")
    _check(results, "proof_system_and_circuit_design",
           "zk_design_pack_circuits_list_declared", circuits,
           circ_is_list, circ_is_list and circ_count >= 1,
           "circuits: the declared record names its circuits — the list is present and names at least one circuit; an absent list is missing evidence and an empty list declares no circuit work for a record that declares a proof system")
    circ_id_present = circ_is_list and all(
        _has(c, "circuit_id") for c in circ_rows)
    _check(results, "proof_system_and_circuit_design",
           "every_zk_design_pack_circuit_id_unique", circuits,
           circ_id_present,
           circ_is_list and duplicate_circuit_ids is not None
           and len(duplicate_circuit_ids) == 0,
           "circuits: no declared circuit_id is owned by more than one row")
    circ_name_present = circ_is_list and all(
        _has(c, "circuit_name") for c in circ_rows)
    _check(results, "proof_system_and_circuit_design",
           "every_zk_design_pack_circuit_name_declared", circuits,
           circ_name_present,
           circ_is_list
           and all(_nonempty_str(c.get("circuit_name")) for c in circ_rows),
           "circuits: every declared circuit declares a non-empty circuit name")
    circ_stmt_present = circ_is_list and all(
        _has(c, "statement_description") for c in circ_rows)
    _check(results, "proof_system_and_circuit_design",
           "every_zk_design_pack_circuit_statement_declared", circuits,
           circ_stmt_present,
           circ_is_list
           and all(_nonempty_str(c.get("statement_description"))
                   for c in circ_rows),
           "circuits: every declared circuit declares a non-empty statement description — the claim that circuit is written for")
    circ_cc_present = circ_is_list and all(
        _has(c, "constraint_count_declared") for c in circ_rows)
    _check(results, "proof_system_and_circuit_design",
           "every_zk_design_pack_circuit_constraint_count_non_negative",
           circuits, circ_cc_present,
           circ_is_list
           and all(_is_number(c.get("constraint_count_declared"))
                   and c.get("constraint_count_declared") >= 0
                   for c in circ_rows),
           "circuits: every declared circuit declares a non-negative constraint count")
    total_present = circ_is_list and has_total and circ_cc_present
    _check(results, "proof_system_and_circuit_design",
           "zk_design_pack_total_constraint_count_recomputes", circuits,
           total_present,
           total_present and _total_recomputes(),
           "circuits: the declared total constraint count recomputes exactly as the sum of the declared per-circuit constraint counts")

    # ---- Section 4: setup_and_verifier_deployment ----
    _bool_check(results, "setup_and_verifier_deployment",
                "zk_design_pack_setup_parameter_generation_declared", manifest,
                ("setup_and_verifier", "setup_parameter_generation_declared"),
                "setup design: how the setup parameters are generated is declared in the design record")
    _bool_check(results, "setup_and_verifier_deployment",
                "zk_design_pack_setup_transcript_publication_declared",
                manifest,
                ("setup_and_verifier",
                 "setup_transcript_publication_declared"),
                "setup design: publication of the setup transcript is declared in the design record")
    _bool_check(results, "setup_and_verifier_deployment",
                "zk_design_pack_verifier_location_declared", manifest,
                ("setup_and_verifier", "verifier_location_declared"),
                "verifier design: where verification runs in the deployment is declared")
    _bool_check(results, "setup_and_verifier_deployment",
                "zk_design_pack_verification_failure_handling_declared",
                manifest,
                ("setup_and_verifier",
                 "verification_failure_handling_declared"),
                "verifier design: what happens when verification fails is declared in the design record")
    _gated_bool_check(
        results, "setup_and_verifier_deployment",
        "zk_design_pack_ceremony_procedure_declared_where_trusted_setup_required",
        manifest,
        ("setup_and_verifier", "trusted_setup_required"),
        ("setup_and_verifier", "ceremony_procedure_declared"),
        "setup design: a trusted setup is declared required, and the ceremony procedure for it is declared in the design record",
        "no trusted setup declared required")
    _check(results, "setup_and_verifier_deployment",
           "zk_design_pack_verifiers_list_declared", verifiers,
           ver_is_list, ver_is_list and ver_count >= 1,
           "verifiers: the declared record names its verifier deployments — the list is present and names at least one verifier row; an absent list is missing evidence and an empty list declares no deployment for a record that declares verification")
    ver_id_present = ver_is_list and all(
        _has(c, "verifier_id") for c in ver_rows)
    _check(results, "setup_and_verifier_deployment",
           "every_zk_design_pack_verifier_id_unique", verifiers,
           ver_id_present,
           ver_is_list and duplicate_verifier_ids is not None
           and len(duplicate_verifier_ids) == 0,
           "verifiers: no declared verifier_id is owned by more than one row")
    ver_name_present = ver_is_list and all(
        _has(c, "verifier_name") for c in ver_rows)
    _check(results, "setup_and_verifier_deployment",
           "every_zk_design_pack_verifier_name_declared", verifiers,
           ver_name_present,
           ver_is_list
           and all(_nonempty_str(c.get("verifier_name")) for c in ver_rows),
           "verifiers: every declared verifier row declares a non-empty verifier name")
    ver_target_present = ver_is_list and all(
        _has(c, "deployment_target") for c in ver_rows)
    _check(results, "setup_and_verifier_deployment",
           "every_zk_design_pack_verifier_deployment_target_declared",
           verifiers, ver_target_present,
           ver_is_list
           and all(_nonempty_str(c.get("deployment_target"))
                   for c in ver_rows),
           "verifiers: every declared verifier row declares a non-empty deployment target")
    ver_key_present = ver_is_list and all(
        _has(c, "verification_key_reference") for c in ver_rows)
    _check(results, "setup_and_verifier_deployment",
           "every_zk_design_pack_verifier_verification_key_reference_declared",
           verifiers, ver_key_present,
           ver_is_list
           and all(_nonempty_str(c.get("verification_key_reference"))
                   for c in ver_rows),
           "verifiers: every declared verifier row declares a non-empty verification-key reference — the record names which key material the deployment verifies against, without this atom verifying anything with it")

    # ---- Section 5: properties_and_proof_selection ----
    _bool_check(results, "properties_and_proof_selection",
                "zk_design_pack_soundness_property_declaration_recorded",
                manifest,
                ("properties", "soundness_property_declaration_recorded"),
                "property declarations: a soundness property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that soundness holds")
    _bool_check(results, "properties_and_proof_selection",
                "zk_design_pack_completeness_property_declaration_recorded",
                manifest,
                ("properties", "completeness_property_declaration_recorded"),
                "property declarations: a completeness property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that completeness holds")
    _bool_check(results, "properties_and_proof_selection",
                "zk_design_pack_zero_knowledge_property_declaration_recorded",
                manifest,
                ("properties",
                 "zero_knowledge_property_declaration_recorded"),
                "property declarations: a zero-knowledge property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that the property holds")
    _bool_check(results, "properties_and_proof_selection",
                "zk_design_pack_soundness_assumptions_declared", manifest,
                ("properties", "soundness_assumptions_declared"),
                "property declarations: the assumptions the declared soundness property rests on are declared")
    _bool_check(results, "properties_and_proof_selection",
                "zk_design_pack_cryptographic_assumptions_declared", manifest,
                ("properties", "cryptographic_assumptions_declared"),
                "property declarations: the cryptographic assumptions the design rests on are declared — declared only; this atom judges no assumption's strength")
    _bool_check(results, "properties_and_proof_selection",
                "zk_design_pack_proof_system_selection_rationale_recorded",
                manifest,
                ("properties", "proof_system_selection_rationale_recorded"),
                "selection rationale: the rationale for selecting the declared proof system is recorded")
    _bool_check(results, "properties_and_proof_selection",
                "zk_design_pack_proof_system_alternatives_compared_declared",
                manifest,
                ("properties",
                 "proof_system_alternatives_compared_declared"),
                "selection rationale: the proof-system alternatives the selection was compared against are declared")
    _bool_check(results, "properties_and_proof_selection",
                "zk_design_pack_proof_system_selection_tradeoffs_recorded",
                manifest,
                ("properties", "proof_system_selection_tradeoffs_recorded"),
                "selection rationale: the trade-offs of the proof-system selection are recorded")

    # ---- Section 6: recovery_limits_and_claim_mapping ----
    _bool_check(results, "recovery_limits_and_claim_mapping",
                "zk_design_pack_recovery_mechanism_design_declared", manifest,
                ("recovery_and_limits", "recovery_mechanism_design_declared"),
                "recovery design: the recovery mechanism in the design is declared — escrow, social, phrase or none, as designed")
    _bool_check(results, "recovery_limits_and_claim_mapping",
                "zk_design_pack_recovery_weakening_effects_declared", manifest,
                ("recovery_and_limits", "recovery_weakening_effects_declared"),
                "recovery design: the weakening effects of the chosen recovery mechanism on the design's model are documented — any recovery mechanism weakens the model, chosen consciously")
    _bool_check(results, "recovery_limits_and_claim_mapping",
                "zk_design_pack_recovery_choice_rationale_declared", manifest,
                ("recovery_and_limits", "recovery_choice_rationale_declared"),
                "recovery design: the rationale for the recovery choice is declared")
    _bool_check(results, "recovery_limits_and_claim_mapping",
                "zk_design_pack_encrypted_search_limits_declared", manifest,
                ("recovery_and_limits", "encrypted_search_limits_declared"),
                "limits: the limits of encrypted search and query in the design are declared — encrypted search is a spectrum, stated honestly")
    _bool_check(results, "recovery_limits_and_claim_mapping",
                "zk_design_pack_server_inference_limits_declared", manifest,
                ("recovery_and_limits", "server_inference_limits_declared"),
                "limits: what the server can still infer under the design is declared")
    _bool_check(results, "recovery_limits_and_claim_mapping",
                "zk_design_pack_design_limitations_declared", manifest,
                ("recovery_and_limits", "design_limitations_declared"),
                "limits: the design's limitations are declared in the record")
    _check(results, "recovery_limits_and_claim_mapping",
           "zk_design_pack_claim_mappings_list_declared", mappings,
           map_is_list, map_is_list and map_count >= 1,
           "claim mappings: the declared record names its claim-to-mechanism mapping rows — the list is present and names at least one row; an absent list is missing evidence and an empty list declares no mapping at all")
    map_id_present = map_is_list and all(
        _has(c, "mapping_id") for c in map_rows)
    _check(results, "recovery_limits_and_claim_mapping",
           "every_zk_design_pack_claim_mapping_id_unique", mappings,
           map_id_present,
           map_is_list and duplicate_mapping_ids is not None
           and len(duplicate_mapping_ids) == 0,
           "claim mappings: no declared mapping_id is owned by more than one row")
    map_claim_present = map_is_list and all(
        _has(c, "claim_text") for c in map_rows)
    _check(results, "recovery_limits_and_claim_mapping",
           "every_zk_design_pack_claim_mapping_claim_text_declared",
           mappings, map_claim_present,
           map_is_list
           and all(_nonempty_str(c.get("claim_text")) for c in map_rows),
           "claim mappings: every declared mapping row declares a non-empty claim text — the zero-knowledge statement as written in the design record")
    map_mech_present = map_is_list and all(
        _has(c, "mechanism_reference") for c in map_rows)
    _check(results, "recovery_limits_and_claim_mapping",
           "every_zk_design_pack_claim_mapping_mechanism_reference_declared",
           mappings, map_mech_present,
           map_is_list
           and all(_nonempty_str(c.get("mechanism_reference"))
                   for c in map_rows),
           "claim mappings: every declared mapping row declares a non-empty mechanism reference — every statement maps to a mechanism in the design; no orphans")

    # ---- Section 7: red_lines ----
    _false_check(results, "red_lines",
                 "zk_design_pack_free_of_zk_label_without_key_custody_description",
                 manifest,
                 ("red_lines",
                  "zk_label_without_key_custody_description_present"),
                 "red line: no zero-knowledge label without describing key custody exactly is present in the record")
    _false_check(results, "red_lines",
                 "zk_design_pack_free_of_zkp_promotion_without_declared_proof_system",
                 manifest,
                 ("red_lines",
                  "zkp_promotion_without_declared_proof_system_present"),
                 "red line: no ZKP promotion without an actual declared proof system is present in the record")
    _false_check(results, "red_lines",
                 "zk_design_pack_free_of_trusted_setup_ceremony_omitted_where_required",
                 manifest,
                 ("red_lines",
                  "trusted_setup_ceremony_omitted_where_required_present"),
                 "red line: no omitted setup ceremony where a trusted setup is required is present in the record")
    _false_check(results, "red_lines",
                 "zk_design_pack_free_of_verifier_without_failure_handling_in_design",
                 manifest,
                 ("red_lines",
                  "verifier_without_failure_handling_in_design_present"),
                 "red line: no verifier deployment without declared failure handling is present in the record")
    _false_check(results, "red_lines",
                 "zk_design_pack_free_of_recovery_weakening_undisclosed_in_design",
                 manifest,
                 ("red_lines",
                  "recovery_weakening_undisclosed_in_design_present"),
                 "red line: no undisclosed recovery weakening is present in the record")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "ZK_DESIGN_RECORD_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "ZK_DESIGN_RECORD_SOUND"

    computed_names = (
        "zk_design_pack_circuits_list_declared",
        "every_zk_design_pack_circuit_id_unique",
        "every_zk_design_pack_circuit_name_declared",
        "every_zk_design_pack_circuit_statement_declared",
        "every_zk_design_pack_circuit_constraint_count_non_negative",
        "zk_design_pack_total_constraint_count_recomputes",
        "zk_design_pack_verifiers_list_declared",
        "every_zk_design_pack_verifier_id_unique",
        "every_zk_design_pack_verifier_name_declared",
        "every_zk_design_pack_verifier_deployment_target_declared",
        "every_zk_design_pack_verifier_verification_key_reference_declared",
        "zk_design_pack_claim_mappings_list_declared",
        "every_zk_design_pack_claim_mapping_id_unique",
        "every_zk_design_pack_claim_mapping_claim_text_declared",
        "every_zk_design_pack_claim_mapping_mechanism_reference_declared",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "zero-knowledge-system-design-pack",
        "atom_version": "0.1.0",
        "design_title": manifest.get("design_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "zk_design_circuits_count": circ_count,
        "zk_design_verifiers_count": ver_count,
        "zk_design_claim_mappings_count": map_count,
        "duplicate_zk_design_circuit_ids": duplicate_circuit_ids,
        "duplicate_zk_design_verifier_ids": duplicate_verifier_ids,
        "duplicate_zk_design_claim_mapping_ids": duplicate_mapping_ids,
        "zk_design_circuits_without_name": circuits_without_name,
        "zk_design_circuits_without_statement": circuits_without_statement,
        "zk_design_circuits_with_invalid_constraint_count": circuits_with_invalid_constraint_count,
        "zk_design_verifiers_without_name": verifiers_without_name,
        "zk_design_verifiers_without_deployment_target": verifiers_without_deployment_target,
        "zk_design_verifiers_without_verification_key_reference": verifiers_without_key_reference,
        "zk_design_claim_mappings_without_claim_text": mappings_without_claim_text,
        "zk_design_claim_mappings_without_mechanism_reference": mappings_without_mechanism_reference,
        "zk_design_constraint_count_sum": _fmt6(constraint_sum),
        "circuit_statement_coverage_ratio": _fmt6(circuit_statement_ratio),
        "verifier_key_reference_coverage_ratio": _fmt6(verifier_key_reference_ratio),
        "claim_mapping_mechanism_coverage_ratio": _fmt6(mapping_mechanism_ratio),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "ZERO-KNOWLEDGE SYSTEM DESIGN PACK",
        f"design_title: {verdict.get('design_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: zero_knowledge_system_design_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "ZK_DESIGN_RECORD_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
