// Zero-knowledge system design pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/zero-knowledge-system-design-pack/src/zero_knowledge_system_design_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals. This atom proves NOTHING, verifies no proof, runs no
// cryptography, and certifies no security property.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  design_title: "string",
  trust_model: {
    server_content_visibility_declared: "boolean",
    server_metadata_visibility_declared: "boolean",
    server_access_pattern_visibility_declared: "boolean",
    server_role_in_design_declared: "boolean",
    key_custody_description_declared: "boolean",
    key_generation_location_declared: "boolean",
    key_storage_location_declared: "boolean",
    threat_actors_in_design_declared: "boolean",
  },
  e2ee_design: {
    client_encryption_architecture_declared: "boolean",
    key_derivation_approach_declared: "boolean",
    ciphertext_envelope_format_declared: "boolean",
    auth_flow_without_credential_exposure_declared: "boolean",
    pake_style_auth_approach_addressed: "boolean",
    sharing_key_wrapping_design_declared: "boolean",
    share_revocation_design_declared: "boolean",
    share_reencryption_path_declared: "boolean",
  },
  proof_design: {
    zkp_use_justification_declared: "boolean",
    zkp_specific_claim_statement_declared: "boolean",
    e2ee_alternative_for_proof_need_addressed: "boolean",
    circuit_work_budget_declared: "boolean",
    total_constraint_count_declared: "number",
  },
  circuits: [{
    circuit_id: "string",
    circuit_name: "string",
    statement_description: "string",
    constraint_count_declared: "number",
  }],
  setup_and_verifier: {
    trusted_setup_required: "boolean",
    ceremony_procedure_declared: "boolean",
    setup_parameter_generation_declared: "boolean",
    setup_transcript_publication_declared: "boolean",
    verifier_location_declared: "boolean",
    verification_failure_handling_declared: "boolean",
  },
  verifiers: [{
    verifier_id: "string",
    verifier_name: "string",
    deployment_target: "string",
    verification_key_reference: "string",
  }],
  properties: {
    soundness_property_declaration_recorded: "boolean",
    completeness_property_declaration_recorded: "boolean",
    zero_knowledge_property_declaration_recorded: "boolean",
    soundness_assumptions_declared: "boolean",
    cryptographic_assumptions_declared: "boolean",
    proof_system_selection_rationale_recorded: "boolean",
    proof_system_alternatives_compared_declared: "boolean",
    proof_system_selection_tradeoffs_recorded: "boolean",
  },
  recovery_and_limits: {
    recovery_mechanism_design_declared: "boolean",
    recovery_weakening_effects_declared: "boolean",
    recovery_choice_rationale_declared: "boolean",
    encrypted_search_limits_declared: "boolean",
    server_inference_limits_declared: "boolean",
    design_limitations_declared: "boolean",
  },
  claim_mappings: [{
    mapping_id: "string",
    claim_text: "string",
    mechanism_reference: "string",
  }],
  red_lines: {
    zk_label_without_key_custody_description_present: "boolean",
    zkp_promotion_without_declared_proof_system_present: "boolean",
    trusted_setup_ceremony_omitted_where_required_present: "boolean",
    verifier_without_failure_handling_in_design_present: "boolean",
    recovery_weakening_undisclosed_in_design_present: "boolean",
  },
};

export const SECTIONS = [
  "trust_model_and_key_custody",
  "client_encryption_sharing_and_auth_design",
  "proof_system_and_circuit_design",
  "setup_and_verifier_deployment",
  "properties_and_proof_selection",
  "recovery_limits_and_claim_mapping",
  "red_lines",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  design_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  zk_design_circuits_count: number | null;
  zk_design_verifiers_count: number | null;
  zk_design_claim_mappings_count: number | null;
  duplicate_zk_design_circuit_ids: string[] | null;
  duplicate_zk_design_verifier_ids: string[] | null;
  duplicate_zk_design_claim_mapping_ids: string[] | null;
  zk_design_circuits_without_name: string[] | null;
  zk_design_circuits_without_statement: string[] | null;
  zk_design_circuits_with_invalid_constraint_count: string[] | null;
  zk_design_verifiers_without_name: string[] | null;
  zk_design_verifiers_without_deployment_target: string[] | null;
  zk_design_verifiers_without_verification_key_reference: string[] | null;
  zk_design_claim_mappings_without_claim_text: string[] | null;
  zk_design_claim_mappings_without_mechanism_reference: string[] | null;
  zk_design_constraint_count_sum: string | null;
  circuit_statement_coverage_ratio: string | null;
  verifier_key_reference_coverage_ratio: string | null;
  claim_mapping_mechanism_coverage_ratio: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && gate) {
    check(results, section, name, target, hasTarget, target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [circuitsRaw, hasCircuits] = getPath(manifest, "circuits");
  const circIsList = hasCircuits && Array.isArray(circuitsRaw);
  const circRows: unknown[] = circIsList ? (circuitsRaw as unknown[]) : [];
  const circCount: number | null = circIsList ? circRows.length : null;

  const [verifiersRaw, hasVerifiers] = getPath(manifest, "verifiers");
  const verIsList = hasVerifiers && Array.isArray(verifiersRaw);
  const verRows: unknown[] = verIsList ? (verifiersRaw as unknown[]) : [];
  const verCount: number | null = verIsList ? verRows.length : null;

  const [mappingsRaw, hasMappings] = getPath(manifest, "claim_mappings");
  const mapIsList = hasMappings && Array.isArray(mappingsRaw);
  const mapRows: unknown[] = mapIsList ? (mappingsRaw as unknown[]) : [];
  const mapCount: number | null = mapIsList ? mapRows.length : null;

  const [totalDeclared, hasTotal] = getPath(
    manifest, "proof_design", "total_constraint_count_declared");

  const duplicateCircuitIds: string[] | null = circIsList
    ? duplicates(circRows, "circuit_id") : null;
  const duplicateVerifierIds: string[] | null = verIsList
    ? duplicates(verRows, "verifier_id") : null;
  const duplicateMappingIds: string[] | null = mapIsList
    ? duplicates(mapRows, "mapping_id") : null;

  const circuitsWithoutName: string[] | null = circIsList
    ? circRows.filter((c) => hasField(c, "circuit_name") &&
        !nonemptyStr((c as Record<string, unknown>)["circuit_name"]))
        .map((c) => rowName(c, "circuit_id"))
    : null;
  const circuitsWithoutStatement: string[] | null = circIsList
    ? circRows.filter((c) => hasField(c, "statement_description") &&
        !nonemptyStr((c as Record<string, unknown>)["statement_description"]))
        .map((c) => rowName(c, "circuit_id"))
    : null;
  const circuitsWithInvalidConstraintCount: string[] | null = circIsList
    ? circRows.filter((c) => hasField(c, "constraint_count_declared") &&
        !(isNumber((c as Record<string, unknown>)["constraint_count_declared"]) &&
          ((c as Record<string, unknown>)["constraint_count_declared"] as number) >= 0))
        .map((c) => rowName(c, "circuit_id"))
    : null;
  const verifiersWithoutName: string[] | null = verIsList
    ? verRows.filter((c) => hasField(c, "verifier_name") &&
        !nonemptyStr((c as Record<string, unknown>)["verifier_name"]))
        .map((c) => rowName(c, "verifier_id"))
    : null;
  const verifiersWithoutDeploymentTarget: string[] | null = verIsList
    ? verRows.filter((c) => hasField(c, "deployment_target") &&
        !nonemptyStr((c as Record<string, unknown>)["deployment_target"]))
        .map((c) => rowName(c, "verifier_id"))
    : null;
  const verifiersWithoutKeyReference: string[] | null = verIsList
    ? verRows.filter((c) => hasField(c, "verification_key_reference") &&
        !nonemptyStr((c as Record<string, unknown>)["verification_key_reference"]))
        .map((c) => rowName(c, "verifier_id"))
    : null;
  const mappingsWithoutClaimText: string[] | null = mapIsList
    ? mapRows.filter((c) => hasField(c, "claim_text") &&
        !nonemptyStr((c as Record<string, unknown>)["claim_text"]))
        .map((c) => rowName(c, "mapping_id"))
    : null;
  const mappingsWithoutMechanismReference: string[] | null = mapIsList
    ? mapRows.filter((c) => hasField(c, "mechanism_reference") &&
        !nonemptyStr((c as Record<string, unknown>)["mechanism_reference"]))
        .map((c) => rowName(c, "mapping_id"))
    : null;

  let constraintSum: number | null = null;
  if (circIsList) {
    constraintSum = 0.0;
    for (const c of circRows) {
      if (isPyDict(c) && isNumber(c["constraint_count_declared"])) {
        constraintSum += c["constraint_count_declared"] as number;
      }
    }
  }

  const totalRecomputes = (): boolean => {
    if (!isNumber(totalDeclared) || constraintSum === null) return false;
    return fmt6(constraintSum) === fmt6(totalDeclared);
  };

  const circuitStatementRatio: number | null =
    circIsList && circCount !== null && circCount > 0
      ? circRows.filter((c) => isPyDict(c) && nonemptyStr(c["statement_description"])).length / circCount
      : null;
  const verifierKeyReferenceRatio: number | null =
    verIsList && verCount !== null && verCount > 0
      ? verRows.filter((c) => isPyDict(c) && nonemptyStr(c["verification_key_reference"])).length / verCount
      : null;
  const mappingMechanismRatio: number | null =
    mapIsList && mapCount !== null && mapCount > 0
      ? mapRows.filter((c) => isPyDict(c) && nonemptyStr(c["mechanism_reference"])).length / mapCount
      : null;

  // ---- Section 1: trust_model_and_key_custody ----
  boolCheck(results, "trust_model_and_key_custody",
    "zk_design_pack_server_content_visibility_declared", manifest,
    ["trust_model", "server_content_visibility_declared"],
    "trust model: the design record states exactly what content the server can and cannot see");
  boolCheck(results, "trust_model_and_key_custody",
    "zk_design_pack_server_metadata_visibility_declared", manifest,
    ["trust_model", "server_metadata_visibility_declared"],
    "trust model: the design record states exactly what metadata the server can and cannot see — metadata is data and is addressed explicitly");
  boolCheck(results, "trust_model_and_key_custody",
    "zk_design_pack_server_access_pattern_visibility_declared", manifest,
    ["trust_model", "server_access_pattern_visibility_declared"],
    "trust model: the design record states what access patterns the server can and cannot see");
  boolCheck(results, "trust_model_and_key_custody",
    "zk_design_pack_server_role_in_design_declared", manifest,
    ["trust_model", "server_role_in_design_declared"],
    "trust model: the server's role in the design is declared");
  boolCheck(results, "trust_model_and_key_custody",
    "zk_design_pack_key_custody_description_declared", manifest,
    ["trust_model", "key_custody_description_declared"],
    "key custody: the design record describes key custody exactly — who holds keys, under the skill's red line that no zero-knowledge language stands without it");
  boolCheck(results, "trust_model_and_key_custody",
    "zk_design_pack_key_generation_location_declared", manifest,
    ["trust_model", "key_generation_location_declared"],
    "key custody: where keys are generated is declared in the design record");
  boolCheck(results, "trust_model_and_key_custody",
    "zk_design_pack_key_storage_location_declared", manifest,
    ["trust_model", "key_storage_location_declared"],
    "key custody: where keys are stored is declared in the design record");
  boolCheck(results, "trust_model_and_key_custody",
    "zk_design_pack_threat_actors_in_design_declared", manifest,
    ["trust_model", "threat_actors_in_design_declared"],
    "trust model: the threat actors the design is written against are declared");

  // ---- Section 2: client_encryption_sharing_and_auth_design ----
  boolCheck(results, "client_encryption_sharing_and_auth_design",
    "zk_design_pack_client_encryption_architecture_declared", manifest,
    ["e2ee_design", "client_encryption_architecture_declared"],
    "client-side encryption design: the client-side encryption architecture is declared — keys live with the user and the server side of the design holds ciphertext");
  boolCheck(results, "client_encryption_sharing_and_auth_design",
    "zk_design_pack_key_derivation_approach_declared", manifest,
    ["e2ee_design", "key_derivation_approach_declared"],
    "client-side encryption design: the client-side key derivation approach is declared");
  boolCheck(results, "client_encryption_sharing_and_auth_design",
    "zk_design_pack_ciphertext_envelope_format_declared", manifest,
    ["e2ee_design", "ciphertext_envelope_format_declared"],
    "client-side encryption design: the format of the ciphertext and envelopes the server stores is declared");
  boolCheck(results, "client_encryption_sharing_and_auth_design",
    "zk_design_pack_auth_flow_without_credential_exposure_declared", manifest,
    ["e2ee_design", "auth_flow_without_credential_exposure_declared"],
    "auth design: the authentication flow is declared as one in which passwords do not reach the server");
  boolCheck(results, "client_encryption_sharing_and_auth_design",
    "zk_design_pack_pake_style_auth_approach_addressed", manifest,
    ["e2ee_design", "pake_style_auth_approach_addressed"],
    "auth design: a PAKE-style approach to authentication without credential exposure is addressed in the design record");
  boolCheck(results, "client_encryption_sharing_and_auth_design",
    "zk_design_pack_sharing_key_wrapping_design_declared", manifest,
    ["e2ee_design", "sharing_key_wrapping_design_declared"],
    "sharing design: per-share key wrapping is designed in and declared");
  boolCheck(results, "client_encryption_sharing_and_auth_design",
    "zk_design_pack_share_revocation_design_declared", manifest,
    ["e2ee_design", "share_revocation_design_declared"],
    "sharing design: share revocation is designed in and declared");
  boolCheck(results, "client_encryption_sharing_and_auth_design",
    "zk_design_pack_share_reencryption_path_declared", manifest,
    ["e2ee_design", "share_reencryption_path_declared"],
    "sharing design: the re-encryption path for shared data is documented in the design record");

  // ---- Section 3: proof_system_and_circuit_design ----
  boolCheck(results, "proof_system_and_circuit_design",
    "zk_design_pack_zkp_use_justification_declared", manifest,
    ["proof_design", "zkp_use_justification_declared"],
    "proof design: the record justifies why a zero-knowledge proof is used at all — ZKP only where it pays, since most products need E2EE, not ZKPs");
  boolCheck(results, "proof_system_and_circuit_design",
    "zk_design_pack_zkp_specific_claim_statement_declared", manifest,
    ["proof_design", "zkp_specific_claim_statement_declared"],
    "proof design: the specific claim the proof system is used for is stated in the design record");
  boolCheck(results, "proof_system_and_circuit_design",
    "zk_design_pack_e2ee_alternative_for_proof_need_addressed", manifest,
    ["proof_design", "e2ee_alternative_for_proof_need_addressed"],
    "proof design: the record addresses whether client-side encryption alone would meet the stated need, before proof-system work is taken on");
  boolCheck(results, "proof_system_and_circuit_design",
    "zk_design_pack_circuit_work_budget_declared", manifest,
    ["proof_design", "circuit_work_budget_declared"],
    "proof design: the circuit work for the proof system is budgeted in the design record");
  check(results, "proof_system_and_circuit_design",
    "zk_design_pack_circuits_list_declared", circuitsRaw, circIsList,
    circIsList && circCount !== null && circCount >= 1,
    "circuits: the declared record names its circuits — the list is present and names at least one circuit; an absent list is missing evidence and an empty list declares no circuit work for a record that declares a proof system");
  const circIdPresent = circIsList &&
    circRows.every((c) => hasField(c, "circuit_id"));
  check(results, "proof_system_and_circuit_design",
    "every_zk_design_pack_circuit_id_unique", circuitsRaw, circIdPresent,
    circIsList && duplicateCircuitIds !== null &&
      duplicateCircuitIds.length === 0,
    "circuits: no declared circuit_id is owned by more than one row");
  const circNamePresent = circIsList &&
    circRows.every((c) => hasField(c, "circuit_name"));
  check(results, "proof_system_and_circuit_design",
    "every_zk_design_pack_circuit_name_declared", circuitsRaw, circNamePresent,
    circIsList && circRows.every((c) => isPyDict(c) && nonemptyStr(c["circuit_name"])),
    "circuits: every declared circuit declares a non-empty circuit name");
  const circStmtPresent = circIsList &&
    circRows.every((c) => hasField(c, "statement_description"));
  check(results, "proof_system_and_circuit_design",
    "every_zk_design_pack_circuit_statement_declared", circuitsRaw,
    circStmtPresent,
    circIsList && circRows.every((c) => isPyDict(c) && nonemptyStr(c["statement_description"])),
    "circuits: every declared circuit declares a non-empty statement description — the claim that circuit is written for");
  const circCcPresent = circIsList &&
    circRows.every((c) => hasField(c, "constraint_count_declared"));
  check(results, "proof_system_and_circuit_design",
    "every_zk_design_pack_circuit_constraint_count_non_negative", circuitsRaw,
    circCcPresent,
    circIsList && circRows.every((c) => isPyDict(c) &&
      isNumber(c["constraint_count_declared"]) &&
      (c["constraint_count_declared"] as number) >= 0),
    "circuits: every declared circuit declares a non-negative constraint count");
  const totalPresent = circIsList && hasTotal && circCcPresent;
  check(results, "proof_system_and_circuit_design",
    "zk_design_pack_total_constraint_count_recomputes", circuitsRaw,
    totalPresent,
    totalPresent && totalRecomputes(),
    "circuits: the declared total constraint count recomputes exactly as the sum of the declared per-circuit constraint counts");

  // ---- Section 4: setup_and_verifier_deployment ----
  boolCheck(results, "setup_and_verifier_deployment",
    "zk_design_pack_setup_parameter_generation_declared", manifest,
    ["setup_and_verifier", "setup_parameter_generation_declared"],
    "setup design: how the setup parameters are generated is declared in the design record");
  boolCheck(results, "setup_and_verifier_deployment",
    "zk_design_pack_setup_transcript_publication_declared", manifest,
    ["setup_and_verifier", "setup_transcript_publication_declared"],
    "setup design: publication of the setup transcript is declared in the design record");
  boolCheck(results, "setup_and_verifier_deployment",
    "zk_design_pack_verifier_location_declared", manifest,
    ["setup_and_verifier", "verifier_location_declared"],
    "verifier design: where verification runs in the deployment is declared");
  boolCheck(results, "setup_and_verifier_deployment",
    "zk_design_pack_verification_failure_handling_declared", manifest,
    ["setup_and_verifier", "verification_failure_handling_declared"],
    "verifier design: what happens when verification fails is declared in the design record");
  gatedBoolCheck(results, "setup_and_verifier_deployment",
    "zk_design_pack_ceremony_procedure_declared_where_trusted_setup_required",
    manifest,
    ["setup_and_verifier", "trusted_setup_required"],
    ["setup_and_verifier", "ceremony_procedure_declared"],
    "setup design: a trusted setup is declared required, and the ceremony procedure for it is declared in the design record",
    "no trusted setup declared required");
  check(results, "setup_and_verifier_deployment",
    "zk_design_pack_verifiers_list_declared", verifiersRaw, verIsList,
    verIsList && verCount !== null && verCount >= 1,
    "verifiers: the declared record names its verifier deployments — the list is present and names at least one verifier row; an absent list is missing evidence and an empty list declares no deployment for a record that declares verification");
  const verIdPresent = verIsList &&
    verRows.every((c) => hasField(c, "verifier_id"));
  check(results, "setup_and_verifier_deployment",
    "every_zk_design_pack_verifier_id_unique", verifiersRaw, verIdPresent,
    verIsList && duplicateVerifierIds !== null &&
      duplicateVerifierIds.length === 0,
    "verifiers: no declared verifier_id is owned by more than one row");
  const verNamePresent = verIsList &&
    verRows.every((c) => hasField(c, "verifier_name"));
  check(results, "setup_and_verifier_deployment",
    "every_zk_design_pack_verifier_name_declared", verifiersRaw, verNamePresent,
    verIsList && verRows.every((c) => isPyDict(c) && nonemptyStr(c["verifier_name"])),
    "verifiers: every declared verifier row declares a non-empty verifier name");
  const verTargetPresent = verIsList &&
    verRows.every((c) => hasField(c, "deployment_target"));
  check(results, "setup_and_verifier_deployment",
    "every_zk_design_pack_verifier_deployment_target_declared", verifiersRaw,
    verTargetPresent,
    verIsList && verRows.every((c) => isPyDict(c) && nonemptyStr(c["deployment_target"])),
    "verifiers: every declared verifier row declares a non-empty deployment target");
  const verKeyPresent = verIsList &&
    verRows.every((c) => hasField(c, "verification_key_reference"));
  check(results, "setup_and_verifier_deployment",
    "every_zk_design_pack_verifier_verification_key_reference_declared",
    verifiersRaw, verKeyPresent,
    verIsList && verRows.every((c) => isPyDict(c) && nonemptyStr(c["verification_key_reference"])),
    "verifiers: every declared verifier row declares a non-empty verification-key reference — the record names which key material the deployment verifies against, without this atom verifying anything with it");

  // ---- Section 5: properties_and_proof_selection ----
  boolCheck(results, "properties_and_proof_selection",
    "zk_design_pack_soundness_property_declaration_recorded", manifest,
    ["properties", "soundness_property_declaration_recorded"],
    "property declarations: a soundness property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that soundness holds");
  boolCheck(results, "properties_and_proof_selection",
    "zk_design_pack_completeness_property_declaration_recorded", manifest,
    ["properties", "completeness_property_declaration_recorded"],
    "property declarations: a completeness property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that completeness holds");
  boolCheck(results, "properties_and_proof_selection",
    "zk_design_pack_zero_knowledge_property_declaration_recorded", manifest,
    ["properties", "zero_knowledge_property_declaration_recorded"],
    "property declarations: a zero-knowledge property declaration is recorded in the design record — recorded as a declaration only; this atom does not establish that the property holds");
  boolCheck(results, "properties_and_proof_selection",
    "zk_design_pack_soundness_assumptions_declared", manifest,
    ["properties", "soundness_assumptions_declared"],
    "property declarations: the assumptions the declared soundness property rests on are declared");
  boolCheck(results, "properties_and_proof_selection",
    "zk_design_pack_cryptographic_assumptions_declared", manifest,
    ["properties", "cryptographic_assumptions_declared"],
    "property declarations: the cryptographic assumptions the design rests on are declared — declared only; this atom judges no assumption's strength");
  boolCheck(results, "properties_and_proof_selection",
    "zk_design_pack_proof_system_selection_rationale_recorded", manifest,
    ["properties", "proof_system_selection_rationale_recorded"],
    "selection rationale: the rationale for selecting the declared proof system is recorded");
  boolCheck(results, "properties_and_proof_selection",
    "zk_design_pack_proof_system_alternatives_compared_declared", manifest,
    ["properties", "proof_system_alternatives_compared_declared"],
    "selection rationale: the proof-system alternatives the selection was compared against are declared");
  boolCheck(results, "properties_and_proof_selection",
    "zk_design_pack_proof_system_selection_tradeoffs_recorded", manifest,
    ["properties", "proof_system_selection_tradeoffs_recorded"],
    "selection rationale: the trade-offs of the proof-system selection are recorded");

  // ---- Section 6: recovery_limits_and_claim_mapping ----
  boolCheck(results, "recovery_limits_and_claim_mapping",
    "zk_design_pack_recovery_mechanism_design_declared", manifest,
    ["recovery_and_limits", "recovery_mechanism_design_declared"],
    "recovery design: the recovery mechanism in the design is declared — escrow, social, phrase or none, as designed");
  boolCheck(results, "recovery_limits_and_claim_mapping",
    "zk_design_pack_recovery_weakening_effects_declared", manifest,
    ["recovery_and_limits", "recovery_weakening_effects_declared"],
    "recovery design: the weakening effects of the chosen recovery mechanism on the design's model are documented — any recovery mechanism weakens the model, chosen consciously");
  boolCheck(results, "recovery_limits_and_claim_mapping",
    "zk_design_pack_recovery_choice_rationale_declared", manifest,
    ["recovery_and_limits", "recovery_choice_rationale_declared"],
    "recovery design: the rationale for the recovery choice is declared");
  boolCheck(results, "recovery_limits_and_claim_mapping",
    "zk_design_pack_encrypted_search_limits_declared", manifest,
    ["recovery_and_limits", "encrypted_search_limits_declared"],
    "limits: the limits of encrypted search and query in the design are declared — encrypted search is a spectrum, stated honestly");
  boolCheck(results, "recovery_limits_and_claim_mapping",
    "zk_design_pack_server_inference_limits_declared", manifest,
    ["recovery_and_limits", "server_inference_limits_declared"],
    "limits: what the server can still infer under the design is declared");
  boolCheck(results, "recovery_limits_and_claim_mapping",
    "zk_design_pack_design_limitations_declared", manifest,
    ["recovery_and_limits", "design_limitations_declared"],
    "limits: the design's limitations are declared in the record");
  check(results, "recovery_limits_and_claim_mapping",
    "zk_design_pack_claim_mappings_list_declared", mappingsRaw, mapIsList,
    mapIsList && mapCount !== null && mapCount >= 1,
    "claim mappings: the declared record names its claim-to-mechanism mapping rows — the list is present and names at least one row; an absent list is missing evidence and an empty list declares no mapping at all");
  const mapIdPresent = mapIsList &&
    mapRows.every((c) => hasField(c, "mapping_id"));
  check(results, "recovery_limits_and_claim_mapping",
    "every_zk_design_pack_claim_mapping_id_unique", mappingsRaw, mapIdPresent,
    mapIsList && duplicateMappingIds !== null &&
      duplicateMappingIds.length === 0,
    "claim mappings: no declared mapping_id is owned by more than one row");
  const mapClaimPresent = mapIsList &&
    mapRows.every((c) => hasField(c, "claim_text"));
  check(results, "recovery_limits_and_claim_mapping",
    "every_zk_design_pack_claim_mapping_claim_text_declared", mappingsRaw,
    mapClaimPresent,
    mapIsList && mapRows.every((c) => isPyDict(c) && nonemptyStr(c["claim_text"])),
    "claim mappings: every declared mapping row declares a non-empty claim text — the zero-knowledge statement as written in the design record");
  const mapMechPresent = mapIsList &&
    mapRows.every((c) => hasField(c, "mechanism_reference"));
  check(results, "recovery_limits_and_claim_mapping",
    "every_zk_design_pack_claim_mapping_mechanism_reference_declared",
    mappingsRaw, mapMechPresent,
    mapIsList && mapRows.every((c) => isPyDict(c) && nonemptyStr(c["mechanism_reference"])),
    "claim mappings: every declared mapping row declares a non-empty mechanism reference — every statement maps to a mechanism in the design; no orphans");

  // ---- Section 7: red_lines ----
  falseCheck(results, "red_lines",
    "zk_design_pack_free_of_zk_label_without_key_custody_description", manifest,
    ["red_lines", "zk_label_without_key_custody_description_present"],
    "red line: no zero-knowledge label without describing key custody exactly is present in the record");
  falseCheck(results, "red_lines",
    "zk_design_pack_free_of_zkp_promotion_without_declared_proof_system", manifest,
    ["red_lines", "zkp_promotion_without_declared_proof_system_present"],
    "red line: no ZKP promotion without an actual declared proof system is present in the record");
  falseCheck(results, "red_lines",
    "zk_design_pack_free_of_trusted_setup_ceremony_omitted_where_required",
    manifest,
    ["red_lines", "trusted_setup_ceremony_omitted_where_required_present"],
    "red line: no omitted setup ceremony where a trusted setup is required is present in the record");
  falseCheck(results, "red_lines",
    "zk_design_pack_free_of_verifier_without_failure_handling_in_design",
    manifest,
    ["red_lines", "verifier_without_failure_handling_in_design_present"],
    "red line: no verifier deployment without declared failure handling is present in the record");
  falseCheck(results, "red_lines",
    "zk_design_pack_free_of_recovery_weakening_undisclosed_in_design", manifest,
    ["red_lines", "recovery_weakening_undisclosed_in_design_present"],
    "red line: no undisclosed recovery weakening is present in the record");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "ZK_DESIGN_RECORD_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "ZK_DESIGN_RECORD_SOUND";
  }

  const computedNames = [
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
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "zero-knowledge-system-design-pack",
    atom_version: "0.1.0",
    design_title: manifest["design_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    zk_design_circuits_count: circCount,
    zk_design_verifiers_count: verCount,
    zk_design_claim_mappings_count: mapCount,
    duplicate_zk_design_circuit_ids: duplicateCircuitIds,
    duplicate_zk_design_verifier_ids: duplicateVerifierIds,
    duplicate_zk_design_claim_mapping_ids: duplicateMappingIds,
    zk_design_circuits_without_name: circuitsWithoutName,
    zk_design_circuits_without_statement: circuitsWithoutStatement,
    zk_design_circuits_with_invalid_constraint_count: circuitsWithInvalidConstraintCount,
    zk_design_verifiers_without_name: verifiersWithoutName,
    zk_design_verifiers_without_deployment_target: verifiersWithoutDeploymentTarget,
    zk_design_verifiers_without_verification_key_reference: verifiersWithoutKeyReference,
    zk_design_claim_mappings_without_claim_text: mappingsWithoutClaimText,
    zk_design_claim_mappings_without_mechanism_reference: mappingsWithoutMechanismReference,
    zk_design_constraint_count_sum: fmt6(constraintSum),
    circuit_statement_coverage_ratio: fmt6(circuitStatementRatio),
    verifier_key_reference_coverage_ratio: fmt6(verifierKeyReferenceRatio),
    claim_mapping_mechanism_coverage_ratio: fmt6(mappingMechanismRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ZERO-KNOWLEDGE SYSTEM DESIGN PACK",
    `design_title: ${pyStr(verdict.design_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
