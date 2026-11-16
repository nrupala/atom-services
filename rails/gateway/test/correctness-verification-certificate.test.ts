import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/correctness-verification-certificate.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The CERTIFIED manifest, copied from the Python VerdictTests oracle.
const CERTIFIED: Record<string, unknown> = {
  component: "ledger-kernel",
  register: { exists: true, property_named: true, scope_named: true,
              evidence_level_assigned: true, expiry_set: true },
  ladder: { cheapest_sufficient_level_selected: true,
            claim_exceeds_evidence_level: false,
            tests_presented_as_proof: false },
  specs: { invariants_written: true, pre_post_conditions_written: true,
           liveness_properties_written: true,
           written_before_tools_run: true },
  artifacts: { machine_checkable_per_claim: true,
               proof_scripts_or_solver_logs_retained: true,
               counterexample_suppressed: false,
               reproduction_recipe_present: true },
  scope: { exclusions_written: true, claims_versioned: true,
           reverification_triggers_defined: true,
           verified_at_current_version: true },
  ci: { verification_in_pipeline: true, broken_proof_fails_build: true },
  review: { independent_review_done: true, counterexample_found: true,
            counterexample_disclosed: true },
  certificate: {
    signed_attestation_binds_claim_artifact_commit: true,
    independently_reproducible: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 21 Python VerdictTests, ported ----

test("test_certified_manifest_is_certified", () => {
  const v = evaluate(clone(CERTIFIED));
  assert.equal(v.verdict, "CERTIFIED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 26);
});

test("test_no_register_no_claim", () => {
  const m = clone(CERTIFIED) as any;
  m.register.exists = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_CERTIFIED");
  assert.equal(v.sections["claims_register"], "fail");
});

test("test_claim_without_property_fails", () => {
  const m = clone(CERTIFIED) as any;
  m.register.property_named = false;
  assert.equal(evaluate(m).verdict, "NOT_CERTIFIED");
});

test("test_claim_exceeding_evidence_level_fails", () => {
  const m = clone(CERTIFIED) as any;
  m.ladder.claim_exceeds_evidence_level = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_CERTIFIED");
  assert.equal(v.sections["evidence_ladder"], "fail");
});

test("test_tests_presented_as_proof_fails", () => {
  const m = clone(CERTIFIED) as any;
  m.ladder.tests_presented_as_proof = true;
  assert.equal(evaluate(m).verdict, "NOT_CERTIFIED");
});

test("test_specs_written_after_tools_fail", () => {
  const m = clone(CERTIFIED) as any;
  m.specs.written_before_tools_run = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_CERTIFIED");
  assert.equal(v.sections["specs_before_tools"], "fail");
});

test("test_missing_invariants_fail", () => {
  const m = clone(CERTIFIED) as any;
  m.specs.invariants_written = false;
  assert.equal(evaluate(m).verdict, "NOT_CERTIFIED");
});

test("test_claim_without_machine_checkable_artifact_fails", () => {
  const m = clone(CERTIFIED) as any;
  m.artifacts.machine_checkable_per_claim = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_CERTIFIED");
  assert.equal(v.sections["evidence_artifacts"], "fail");
});

test("test_suppressed_counterexample_fails", () => {
  const m = clone(CERTIFIED) as any;
  m.artifacts.counterexample_suppressed = true;
  assert.equal(evaluate(m).verdict, "NOT_CERTIFIED");
});

test("test_no_reproduction_recipe_no_certificate", () => {
  const m = clone(CERTIFIED) as any;
  m.artifacts.reproduction_recipe_present = false;
  assert.equal(evaluate(m).verdict, "NOT_CERTIFIED");
});

test("test_unwritten_exclusions_fail_scope_honesty", () => {
  const m = clone(CERTIFIED) as any;
  m.scope.exclusions_written = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_CERTIFIED");
  assert.equal(v.sections["scope_honesty"], "fail");
});

test("test_stale_version_not_verified_fails", () => {
  const m = clone(CERTIFIED) as any;
  m.scope.verified_at_current_version = false;
  assert.equal(evaluate(m).verdict, "NOT_CERTIFIED");
});

test("test_broken_proof_not_failing_build_fails_ci", () => {
  const m = clone(CERTIFIED) as any;
  m.ci.broken_proof_fails_build = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_CERTIFIED");
  assert.equal(v.sections["ci_integration"], "fail");
});

test("test_no_adversarial_review_fails", () => {
  const m = clone(CERTIFIED) as any;
  m.review.independent_review_done = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_CERTIFIED");
  assert.equal(v.sections["adversarial_and_certification"], "fail");
});

test("test_undisclosed_counterexample_fails", () => {
  const m = clone(CERTIFIED) as any;
  m.review.counterexample_disclosed = false;
  assert.equal(evaluate(m).verdict, "NOT_CERTIFIED");
});

test("test_no_counterexample_passes_as_not_applicable", () => {
  const m = clone(CERTIFIED) as any;
  m.review.counterexample_found = false;
  delete m.review.counterexample_disclosed;
  assert.equal(evaluate(m).verdict, "CERTIFIED");
});

test("test_unsigned_attestation_fails", () => {
  const m = clone(CERTIFIED) as any;
  m.certificate.signed_attestation_binds_claim_artifact_commit = false;
  assert.equal(evaluate(m).verdict, "NOT_CERTIFIED");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(CERTIFIED) as any;
  delete m.ci;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["ci_integration"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  assert.equal(evaluate({}).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(CERTIFIED))).includes("VERDICT: CERTIFIED"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});


// ---- F1 regression: malformed field types (external verification
// Wave 1) — the Python MalformedTypeTests, ported. A documented
// field present with the wrong JSON type raises FieldTypeError
// naming the field — never a verdict over garbage.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: recorded external case rejected", () => {
  assert.throws(
    () => evaluate({ component: 12345, register: "not-an-object" }),
    fieldError("component"),
  );
});

test("malformed: component as number rejected", () => {
  assert.throws(() => evaluate({ component: 12345 }), fieldError("component"));
});

test("malformed: register as string rejected", () => {
  assert.throws(() => evaluate({ register: "not-an-object" }), fieldError("register"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(CERTIFIED) as Record<string, any>;
  m.register.exists = "yes";
  assert.throws(() => evaluate(m), fieldError("register.exists"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(CERTIFIED) as Record<string, any>;
  m.register = null;
  assert.throws(() => evaluate(m), fieldError("register"));
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
  .filter((f) => f.startsWith("correctness-verification-certificate--") && f.endsWith(".json"))
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
