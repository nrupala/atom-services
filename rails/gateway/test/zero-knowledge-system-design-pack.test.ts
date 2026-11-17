import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/zero-knowledge-system-design-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  design_title: "vault-notes-zk-design",
  trust_model: { server_content_visibility_declared: true,
                 server_metadata_visibility_declared: true,
                 server_access_pattern_visibility_declared: true,
                 server_role_in_design_declared: true,
                 key_custody_description_declared: true,
                 key_generation_location_declared: true,
                 key_storage_location_declared: true,
                 threat_actors_in_design_declared: true },
  e2ee_design: { client_encryption_architecture_declared: true,
                 key_derivation_approach_declared: true,
                 ciphertext_envelope_format_declared: true,
                 auth_flow_without_credential_exposure_declared: true,
                 pake_style_auth_approach_addressed: true,
                 sharing_key_wrapping_design_declared: true,
                 share_revocation_design_declared: true,
                 share_reencryption_path_declared: true },
  proof_design: { zkp_use_justification_declared: true,
                  zkp_specific_claim_statement_declared: true,
                  e2ee_alternative_for_proof_need_addressed: true,
                  circuit_work_budget_declared: true,
                  total_constraint_count_declared: 1500 },
  circuits: [
    { circuit_id: "circ-1", circuit_name: "Membership circuit",
      statement_description: "Prover knows a secret in the set",
      constraint_count_declared: 1000 },
    { circuit_id: "circ-2", circuit_name: "Range circuit",
      statement_description: "Prover knows a value in range",
      constraint_count_declared: 500 },
  ],
  setup_and_verifier: { trusted_setup_required: true,
                        ceremony_procedure_declared: true,
                        setup_parameter_generation_declared: true,
                        setup_transcript_publication_declared: true,
                        verifier_location_declared: true,
                        verification_failure_handling_declared: true },
  verifiers: [
    { verifier_id: "ver-1", verifier_name: "API verifier",
      deployment_target: "api-service",
      verification_key_reference: "vk-membership-v1" },
    { verifier_id: "ver-2", verifier_name: "Client verifier",
      deployment_target: "mobile-client",
      verification_key_reference: "vk-range-v1" },
  ],
  properties: { soundness_property_declaration_recorded: true,
                completeness_property_declaration_recorded: true,
                zero_knowledge_property_declaration_recorded: true,
                soundness_assumptions_declared: true,
                cryptographic_assumptions_declared: true,
                proof_system_selection_rationale_recorded: true,
                proof_system_alternatives_compared_declared: true,
                proof_system_selection_tradeoffs_recorded: true },
  recovery_and_limits: { recovery_mechanism_design_declared: true,
                         recovery_weakening_effects_declared: true,
                         recovery_choice_rationale_declared: true,
                         encrypted_search_limits_declared: true,
                         server_inference_limits_declared: true,
                         design_limitations_declared: true },
  claim_mappings: [
    { mapping_id: "map-1",
      claim_text: "The server cannot read note content",
      mechanism_reference: "trust-model section 2, envelope format" },
    { mapping_id: "map-2",
      claim_text: "Membership is proved without revealing the secret",
      mechanism_reference: "circ-1 membership circuit" },
  ],
  red_lines: { zk_label_without_key_custody_description_present: false,
               zkp_promotion_without_declared_proof_system_present: false,
               trusted_setup_ceremony_omitted_where_required_present: false,
               verifier_without_failure_handling_in_design_present: false,
               recovery_weakening_undisclosed_in_design_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "ZK_DESIGN_RECORD_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 59);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.zk_design_circuits_count, 2);
  assert.equal(v.zk_design_verifiers_count, 2);
  assert.equal(v.zk_design_claim_mappings_count, 2);
  assert.deepEqual(v.duplicate_zk_design_circuit_ids, []);
  assert.equal(v.zk_design_constraint_count_sum, "1500.000000");
  assert.equal(v.circuit_statement_coverage_ratio, "1.000000");
  assert.equal(v.verifier_key_reference_coverage_ratio, "1.000000");
  assert.equal(v.claim_mapping_mechanism_coverage_ratio, "1.000000");
});

test("test_key_custody_not_declared_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.trust_model.key_custody_description_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ZK_DESIGN_RECORD_NOT_SOUND");
  assert.equal(v.sections["trust_model_and_key_custody"], "fail");
  assert.equal(checkStatus(v, "zk_design_pack_key_custody_description_declared"), "fail");
});

test("test_duplicate_circuit_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.circuits[1].circuit_id = "circ-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_zk_design_pack_circuit_id_unique"), "fail");
  assert.deepEqual(v.duplicate_zk_design_circuit_ids, ["circ-1"]);
});

test("test_empty_circuits_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.circuits = [];
  m.proof_design.total_constraint_count_declared = 0;
  assert.equal(checkStatus(evaluate(m), "zk_design_pack_circuits_list_declared"), "fail");
});

test("test_absent_circuits_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.circuits;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "zk_design_pack_circuits_list_declared"), "missing");
  assert.equal(v.zk_design_circuits_count, null);
  assert.equal(v.computed_status, null);
});

test("test_empty_circuit_statement_fails", () => {
  const m = clone(COMPLETE) as any;
  m.circuits[0].statement_description = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_zk_design_pack_circuit_statement_declared"), "fail");
  assert.deepEqual(v.zk_design_circuits_without_statement, ["circ-1"]);
  assert.equal(v.circuit_statement_coverage_ratio, "0.500000");
});

test("test_negative_constraint_count_fails", () => {
  const m = clone(COMPLETE) as any;
  m.circuits[0].constraint_count_declared = -5;
  m.proof_design.total_constraint_count_declared = 495;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_zk_design_pack_circuit_constraint_count_non_negative"), "fail");
  assert.deepEqual(v.zk_design_circuits_with_invalid_constraint_count, ["circ-1"]);
});

test("test_total_constraint_count_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.proof_design.total_constraint_count_declared = 1501;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "zk_design_pack_total_constraint_count_recomputes"), "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_circuit_missing_constraint_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.circuits[0].constraint_count_declared;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_zk_design_pack_circuit_constraint_count_non_negative"), "missing");
});

test("test_ceremony_missing_where_trusted_setup_required_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.setup_and_verifier.ceremony_procedure_declared = false;
  assert.equal(checkStatus(evaluate(m), "zk_design_pack_ceremony_procedure_declared_where_trusted_setup_required"), "fail");
});

test("test_no_trusted_setup_passes_gated_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.setup_and_verifier.trusted_setup_required = false;
  m.setup_and_verifier.ceremony_procedure_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "zk_design_pack_ceremony_procedure_declared_where_trusted_setup_required"), "pass");
  assert.equal(v.verdict, "ZK_DESIGN_RECORD_SOUND");
});

test("test_duplicate_verifier_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.verifiers[1].verifier_id = "ver-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_zk_design_pack_verifier_id_unique"), "fail");
  assert.deepEqual(v.duplicate_zk_design_verifier_ids, ["ver-1"]);
});

test("test_empty_verification_key_reference_fails", () => {
  const m = clone(COMPLETE) as any;
  m.verifiers[1].verification_key_reference = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_zk_design_pack_verifier_verification_key_reference_declared"), "fail");
  assert.deepEqual(v.zk_design_verifiers_without_verification_key_reference, ["ver-2"]);
  assert.equal(v.verifier_key_reference_coverage_ratio, "0.500000");
});

test("test_empty_mechanism_reference_fails_mapping", () => {
  const m = clone(COMPLETE) as any;
  m.claim_mappings[0].mechanism_reference = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_zk_design_pack_claim_mapping_mechanism_reference_declared"), "fail");
  assert.deepEqual(v.zk_design_claim_mappings_without_mechanism_reference, ["map-1"]);
  assert.equal(v.claim_mapping_mechanism_coverage_ratio, "0.500000");
});

test("test_soundness_declaration_absent_is_missing_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.properties.soundness_property_declaration_recorded;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "zk_design_pack_soundness_property_declaration_recorded"), "missing");
});

test("test_zkp_promotion_without_proof_system_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.zkp_promotion_without_declared_proof_system_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "ZK_DESIGN_RECORD_NOT_SOUND");
});

test("test_zk_label_without_key_custody_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.zk_label_without_key_custody_description_present = true;
  assert.equal(checkStatus(evaluate(m), "zk_design_pack_free_of_zk_label_without_key_custody_description"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.properties;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["properties_and_proof_selection"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.zk_design_circuits_count, null);
  assert.equal(v.zk_design_constraint_count_sum, null);
  assert.equal(v.circuit_statement_coverage_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: ZK_DESIGN_RECORD_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.design_title = 12345;
  assert.throws(() => evaluate(m), fieldError("design_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ trust_model: "should-be-an-object" }), fieldError("trust_model"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ circuits: { circuit_id: "circ-1" } }), fieldError("circuits"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ verifiers: ["ver-1"] }), fieldError("verifiers[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.trust_model.key_custody_description_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("trust_model.key_custody_description_declared"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.circuits[0].constraint_count_declared = "1000";
  assert.throws(() => evaluate(m), fieldError("circuits[0].constraint_count_declared"));
});

test("malformed: total as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.proof_design.total_constraint_count_declared = "1500";
  assert.throws(() => evaluate(m), fieldError("proof_design.total_constraint_count_declared"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.properties = null;
  assert.throws(() => evaluate(m), fieldError("properties"));
});

// ---- Golden-fixture parity against the Python oracle ----

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "fixtures",
);

interface Fixture {
  name: string;
  manifest: unknown;
  expected: unknown;
}

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.startsWith("zero-knowledge-system-design-pack--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
