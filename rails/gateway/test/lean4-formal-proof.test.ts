import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/lean4-formal-proof.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The VERIFIED manifest, copied from the Python VerdictTests oracle.
const VERIFIED: Record<string, unknown> = {
  project: "consensus-core",
  setup: { toolchain_pinned: true, versions_pinned: true,
           ci_runs_lake_build: true, lake_build_green: true },
  statements: { stated_before_proving: true,
                meaning_checked_before_proving: true,
                reviewed_independently_of_tactics: true,
                weakened_silently: false,
                unproven_claims_presented_as_verified: false },
  definitions: { total: true, executable: true,
                 specs_separate_from_implementation: true },
  proof: { structured_and_readable: true,
           cheating_items_tracked_as_tickets: true,
           cheating_smuggled_into_deliverable: false },
  theorems: [
    { name: "leader_safety", sorry_count: 0,
      axioms: ["propext", "Classical.choice", "Quot.sound"],
      native_decide_used: false, kernel_checked: true },
    { name: "log_matching", sorry_count: 0,
      axioms: ["propext"],
      native_decide_used: false, kernel_checked: true },
  ],
  attestation: { build_log_retained: true,
                 axiom_audit_performed: true,
                 reproduction_recipe_present: true },
  alignment: { mapping_documented: true,
               changes_ported_through_model: true,
               model_and_implementation_in_sync: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 24 Python VerdictTests, ported ----

test("test_verified_manifest_is_verified", () => {
  const v = evaluate(clone(VERIFIED));
  assert.equal(v.verdict, "VERIFIED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 26);
  assert.equal(v.theorems_evaluated, 2);
  assert.equal(v.theorems_with_sorry, 0);
});

test("test_red_build_fails", () => {
  const m = clone(VERIFIED) as any;
  m.setup.lake_build_green = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VERIFIED");
  assert.equal(v.sections["project_setup"], "fail");
});

test("test_unpinned_toolchain_fails", () => {
  const m = clone(VERIFIED) as any;
  m.setup.toolchain_pinned = false;
  assert.equal(evaluate(m).verdict, "NOT_VERIFIED");
});

test("test_statement_not_reviewed_fails", () => {
  const m = clone(VERIFIED) as any;
  m.statements.reviewed_independently_of_tactics = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VERIFIED");
  assert.equal(v.sections["statement_integrity"], "fail");
});

test("test_silently_weakened_statement_fails", () => {
  const m = clone(VERIFIED) as any;
  m.statements.weakened_silently = true;
  assert.equal(evaluate(m).verdict, "NOT_VERIFIED");
});

test("test_unproven_claim_dressed_as_verified_fails", () => {
  const m = clone(VERIFIED) as any;
  m.statements.unproven_claims_presented_as_verified = true;
  assert.equal(evaluate(m).verdict, "NOT_VERIFIED");
});

test("test_partial_definitions_fail", () => {
  const m = clone(VERIFIED) as any;
  m.definitions.total = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VERIFIED");
  assert.equal(v.sections["definitions_and_model"], "fail");
});

test("test_smuggled_cheating_fails", () => {
  const m = clone(VERIFIED) as any;
  m.proof.cheating_smuggled_into_deliverable = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VERIFIED");
  assert.equal(v.sections["proof_integrity"], "fail");
});

test("test_sorry_in_theorem_fails", () => {
  const m = clone(VERIFIED) as any;
  m.theorems[0].sorry_count = 1;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VERIFIED");
  assert.equal(v.sections["theorem_declarations"], "fail");
  assert.equal(v.theorems_with_sorry, 1);
});

test("test_extra_axiom_fails", () => {
  const m = clone(VERIFIED) as any;
  m.theorems[1].axioms = ["propext", "my_custom_axiom"];
  assert.equal(evaluate(m).verdict, "NOT_VERIFIED");
});

test("test_standard_axioms_only_pass", () => {
  const m = clone(VERIFIED) as any;
  m.theorems[0].axioms = [];
  assert.equal(evaluate(m).verdict, "VERIFIED");
});

test("test_native_decide_shortcut_fails", () => {
  const m = clone(VERIFIED) as any;
  m.theorems[0].native_decide_used = true;
  assert.equal(evaluate(m).verdict, "NOT_VERIFIED");
});

test("test_unchecked_theorem_fails", () => {
  const m = clone(VERIFIED) as any;
  m.theorems[1].kernel_checked = false;
  assert.equal(evaluate(m).verdict, "NOT_VERIFIED");
});

test("test_malformed_theorem_entry_fails", () => {
  const m = clone(VERIFIED) as any;
  delete m.theorems[0].sorry_count;
  assert.equal(evaluate(m).verdict, "NOT_VERIFIED");
});

test("test_negative_sorry_count_fails", () => {
  const m = clone(VERIFIED) as any;
  m.theorems[0].sorry_count = -1;
  assert.equal(evaluate(m).verdict, "NOT_VERIFIED");
});

test("test_bool_sorry_count_rejected", () => {
  // F1 test correction (coordinator ruling, 2026-11-15): this test
  // previously asserted a NOT_VERIFIED verdict over a boolean
  // sorry_count — a wrong-typed documented field. That assertion
  // encoded the F1 defect itself: a boolean is not a number, so
  // the manifest is rejected with FieldTypeError naming the field.
  const m = clone(VERIFIED) as any;
  m.theorems[0].sorry_count = true;
  assert.throws(
    () => evaluate(m),
    (err: unknown) =>
      err instanceof FieldTypeError &&
      err.field === "theorems[0].sorry_count",
  );
});

test("test_no_axiom_audit_fails", () => {
  const m = clone(VERIFIED) as any;
  m.attestation.axiom_audit_performed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VERIFIED");
  assert.equal(v.sections["build_attestation"], "fail");
});

test("test_model_out_of_sync_fails", () => {
  const m = clone(VERIFIED) as any;
  m.alignment.model_and_implementation_in_sync = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VERIFIED");
  assert.equal(v.sections["model_alignment"], "fail");
});

test("test_absent_theorems_is_insufficient_not_failed", () => {
  const m = clone(VERIFIED) as any;
  delete m.theorems;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["theorem_declarations"], "insufficient_evidence");
  assert.equal(v.theorems_evaluated, 0);
});

test("test_empty_theorems_list_is_insufficient", () => {
  const m = clone(VERIFIED) as any;
  m.theorems = [];
  assert.equal(evaluate(m).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(VERIFIED) as any;
  delete m.attestation;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["build_attestation"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  assert.equal(evaluate({}).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(VERIFIED))).includes("VERDICT: VERIFIED"));
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
    () => evaluate({ project: "malformed-input", setup: "not-an-object", theorems: "should-be-a-list" }),
    fieldError("setup"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ setup: "not-an-object" }),
    fieldError("setup"),
  );
});

test("malformed: list field as string rejected", () => {
  assert.throws(
    () => evaluate({ theorems: "should-be-a-list" }),
    fieldError("theorems"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(VERIFIED) as Record<string, any>;
  m.setup.lake_build_green = "yes";
  assert.throws(() => evaluate(m), fieldError("setup.lake_build_green"));
});

test("malformed: list entry field as string rejected", () => {
  const m = structuredClone(VERIFIED) as Record<string, any>;
  m.theorems[0].sorry_count = "zero";
  assert.throws(() => evaluate(m), fieldError("theorems[0].sorry_count"));
});

test("malformed: nested list entry as number rejected", () => {
  const m = structuredClone(VERIFIED) as Record<string, any>;
  m.theorems[0].axioms = ["propext", 42];
  assert.throws(() => evaluate(m), fieldError("theorems[0].axioms[1]"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(VERIFIED) as Record<string, any>;
  m.theorems = null;
  assert.throws(() => evaluate(m), fieldError("theorems"));
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
  .filter((f) => f.startsWith("lean4-formal-proof--") && f.endsWith(".json"))
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
