import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/license-compliance-check.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The COMPLIANT manifest, copied from the Python VerdictTests oracle.
const COMPLIANT: Record<string, unknown> = {
  product: "example-app",
  distribution_model: "proprietary_binary",
  project_license: "MIT",
  license_decision: { logged: true },
  license_file: { present: true, texts_unmodified: true },
  notice_file: { present: true },
  source_headers: { present: true },
  components: [
    { name: "lib-a", license: "MIT", requires_attribution: true, requires_bundled_license: true },
    { name: "lib-b", license: "Apache-2.0", requires_attribution: true, requires_bundled_license: true },
  ],
  dependency_scan: { completed: true, clean: true, accepted_with_record: false, incompatible_shipped: false },
  attribution: { shipped: true },
  bundled_licenses: { shipped: true },
  contributor_terms: { policy: "DCO", documented_in_contributing: true, enforced: true },
  trademark: { usage_rules_documented: true, implied_endorsement: false },
  public_claims: { claims_made: ["compliant"], attestation_present: true },
  client_work: { is_client_work: false, contract_constraints_reviewed: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The Python VerdictTests, ported ----

test("test_compliant_manifest_is_compliant", () => {
  const v = evaluate(clone(COMPLIANT));
  assert.equal(v.verdict, "COMPLIANT");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 19);
});

test("test_copyleft_in_proprietary_binary_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.components.push({ name: "lib-gpl", license: "GPL-3.0", requires_attribution: false, requires_bundled_license: false });
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["dependency_compatibility"], "fail");
});

test("test_copyleft_in_open_source_distribution_passes_that_check", () => {
  const m = clone(COMPLIANT) as any;
  m.distribution_model = "open_source";
  m.project_license = "GPL-3.0";
  m.components = [{ name: "lib-gpl", license: "GPL-3.0", requires_attribution: false, requires_bundled_license: false }];
  const v = evaluate(m);
  assert.equal(v.verdict, "COMPLIANT");
});

test("test_edited_license_text_is_a_red_line_fail", () => {
  const m = clone(COMPLIANT) as any;
  m.license_file.texts_unmodified = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["license_files"], "fail");
});

test("test_missing_attribution_shipment_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.attribution.shipped = false;
  assert.equal(evaluate(m).verdict, "NON_COMPLIANT");
});

test("test_incompatible_dependency_shipped_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.dependency_scan.incompatible_shipped = true;
  assert.equal(evaluate(m).verdict, "NON_COMPLIANT");
});

test("test_dirty_scan_accepted_with_record_passes", () => {
  const m = clone(COMPLIANT) as any;
  m.dependency_scan.clean = false;
  m.dependency_scan.accepted_with_record = true;
  assert.equal(evaluate(m).verdict, "COMPLIANT");
});

test("test_dirty_scan_without_record_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.dependency_scan.clean = false;
  assert.equal(evaluate(m).verdict, "NON_COMPLIANT");
});

test("test_absent_notice_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLIANT) as any;
  delete m.notice_file;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["license_files"], "insufficient_evidence");
});

test("test_unattested_public_claim_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.public_claims.attestation_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["claims_and_contracts"], "fail");
});

test("test_unknown_contributor_policy_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.contributor_terms.policy = "none";
  const v = evaluate(m);
  assert.equal(v.verdict, "NON_COMPLIANT");
  assert.equal(v.sections["contributor_terms"], "fail");
});

test("test_copyleft_project_without_decision_log_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.distribution_model = "open_source";
  m.project_license = "AGPL-3.0";
  m.license_decision.logged = false;
  assert.equal(evaluate(m).verdict, "NON_COMPLIANT");
});

test("test_client_work_without_contract_review_fails", () => {
  const m = clone(COMPLIANT) as any;
  m.client_work = { is_client_work: true, contract_constraints_reviewed: false };
  assert.equal(evaluate(m).verdict, "NON_COMPLIANT");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  assert.equal(evaluate({}).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict_and_not_legal_advice", () => {
  const s = stamp(evaluate(clone(COMPLIANT)));
  assert.ok(s.includes("VERDICT: COMPLIANT"));
  assert.ok(s.includes("Not legal advice"));
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
    () => evaluate({ product: "BadTypeApp", distribution_model: 123, components: "not-an-array" }),
    fieldError("distribution_model"),
  );
});

test("malformed: distribution_model as number rejected", () => {
  assert.throws(
    () => evaluate({ distribution_model: 123 }),
    fieldError("distribution_model"),
  );
});

test("malformed: components as string rejected", () => {
  assert.throws(
    () => evaluate({ components: "not-an-array" }),
    fieldError("components"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLIANT) as any;
  m.license_file.present = "yes";
  assert.throws(() => evaluate(m), fieldError("license_file.present"));
});

test("malformed: component entry leaf as number rejected", () => {
  const m = clone(COMPLIANT) as any;
  m.components[0].license = 42;
  assert.throws(() => evaluate(m), fieldError("components[0].license"));
});

test("malformed: null field rejected", () => {
  const m = clone(COMPLIANT) as any;
  m.components = null;
  assert.throws(() => evaluate(m), fieldError("components"));
});

// ---- Golden-fixture parity against the Python oracle (this atom only) ----

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
  .filter((f) => f.startsWith("license-compliance-check--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for license-compliance-check");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
