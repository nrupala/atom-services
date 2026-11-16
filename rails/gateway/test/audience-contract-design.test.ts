import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/audience-contract-design.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The AUDIENCE_CONTRACT_COMPLETE manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  artifact: "release-gate-report",
  classes: { human_path_defined: true,
             agent_path_defined: true,
             system_path_defined: true,
             software_path_defined: true,
             single_class_only_shipment: false },
  single_truth: { canonical_source_declared: true,
                  renderings_generated_not_maintained: true,
                  truth_forked_per_class: false },
  progressive_formality: { formality_progressive_declared: true },
  failure: { human_failure_defined: true,
             agent_failure_defined: true,
             system_failure_defined: true,
             software_failure_defined: true },
  authority: { dangerous_actions_present: true,
               capability_required: true,
               human_approval_required: true,
               software_determinism_required: true,
               system_audit_required: true,
               dangerous_path_skips_lattice: false },
  verification: { agents_verified_by_software: true,
                  humans_verified_by_evidence: true,
                  software_verified_by_spec_tests: true,
                  systems_verified_by_audit_trails: true },
  identity: { human_passkey_or_mfa: true,
              agent_scoped_short_lived_tokens: true,
              system_policy_engine: true,
              software_service_creds_or_mtls: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 18 Python VerdictTests, ported ----

test("test_complete_manifest_is_contract_complete", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "AUDIENCE_CONTRACT_COMPLETE");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 26);
  assert.equal(v.classes_with_path_count, 4);
});

test("test_missing_class_path_fails_and_counts", () => {
  const m = clone(COMPLETE) as any;
  m.classes.software_path_defined = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUDIENCE_CONTRACT_INCOMPLETE");
  assert.equal(v.sections["classes_and_paths"], "fail");
  assert.equal(v.classes_with_path_count, 3);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_absent_class_path_is_missing_and_counts_rest", () => {
  const m = clone(COMPLETE) as any;
  delete m.classes.agent_path_defined;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.classes_with_path_count, 3);
  assert.equal(v.computed_status, null);
});

test("test_no_class_paths_declared_count_is_null", () => {
  const v = evaluate({});
  assert.equal(v.classes_with_path_count, null);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_single_class_only_shipment_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.classes.single_class_only_shipment = true;
  assert.equal(evaluate(m).verdict, "AUDIENCE_CONTRACT_INCOMPLETE");
});

test("test_forked_truth_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.single_truth.truth_forked_per_class = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUDIENCE_CONTRACT_INCOMPLETE");
  assert.equal(v.sections["single_truth"], "fail");
});

test("test_renderings_maintained_separately_fails", () => {
  const m = clone(COMPLETE) as any;
  m.single_truth.renderings_generated_not_maintained = false;
  assert.equal(evaluate(m).verdict, "AUDIENCE_CONTRACT_INCOMPLETE");
});

test("test_failure_undefined_for_a_class_fails", () => {
  const m = clone(COMPLETE) as any;
  m.failure.agent_failure_defined = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUDIENCE_CONTRACT_INCOMPLETE");
  assert.equal(v.sections["progressive_formality_and_failure"], "fail");
});

test("test_lattice_missing_one_element_fails", () => {
  const m = clone(COMPLETE) as any;
  m.authority.system_audit_required = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUDIENCE_CONTRACT_INCOMPLETE");
  assert.equal(v.sections["authority_lattice"], "fail");
  assert.equal(checkStatus(v, "lattice_system_audit_required"), "fail");
});

test("test_lattice_element_absent_with_danger_fails_as_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.authority.capability_required;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "lattice_capability_required"), "missing");
});

test("test_no_dangerous_actions_passes_lattice_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.authority.dangerous_actions_present = false;
  delete m.authority.capability_required;
  delete m.authority.human_approval_required;
  delete m.authority.software_determinism_required;
  delete m.authority.system_audit_required;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUDIENCE_CONTRACT_COMPLETE");
  assert.equal(checkStatus(v, "lattice_capability_required"), "pass");
});

test("test_dangerous_path_skipping_lattice_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.authority.dangerous_path_skips_lattice = true;
  assert.equal(evaluate(m).verdict, "AUDIENCE_CONTRACT_INCOMPLETE");
});

test("test_agent_verified_by_self_report_only_fails", () => {
  const m = clone(COMPLETE) as any;
  m.verification.agents_verified_by_software = false;
  assert.equal(evaluate(m).verdict, "AUDIENCE_CONTRACT_INCOMPLETE");
});

test("test_identity_missing_for_a_class_fails", () => {
  const m = clone(COMPLETE) as any;
  m.identity.system_policy_engine = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "AUDIENCE_CONTRACT_INCOMPLETE");
  assert.equal(v.sections["identity_by_class"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.verification;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["verification_by_class"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: AUDIENCE_CONTRACT_COMPLETE"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types — the Python
// MalformedTypeTests, ported.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.artifact = 12345;
  assert.throws(() => evaluate(m), fieldError("artifact"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ classes: "should-be-an-object" }),
    fieldError("classes"),
  );
});

test("malformed: section as list rejected", () => {
  assert.throws(
    () => evaluate({ failure: ["not", "an", "object"] }),
    fieldError("failure"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.classes.human_path_defined = "yes";
  assert.throws(() => evaluate(m), fieldError("classes.human_path_defined"));
});

test("malformed: boolean leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.identity.human_passkey_or_mfa = 42;
  assert.throws(() => evaluate(m), fieldError("identity.human_passkey_or_mfa"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.authority = null;
  assert.throws(() => evaluate(m), fieldError("authority"));
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
  .filter((f) => f.startsWith("audience-contract-design--") && f.endsWith(".json"))
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
