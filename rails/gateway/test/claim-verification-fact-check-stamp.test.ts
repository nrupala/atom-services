import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/claim-verification-fact-check-stamp.js";
import { FieldTypeError } from "../src/atoms/validate.js";

function claim(cid: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: cid, material: true, label: "verified",
    independent_sources: 2, primary_source: false,
    sources_archived: true, source_metadata_recorded: true,
    independence_checked: true, has_numbers: false,
    math_rechecked: false, language_weakest_supported: true,
    ...overrides,
  };
}

// The STAMPED manifest, copied from the Python VerdictTests oracle.
const STAMPED: Record<string, unknown> = {
  document: "launch-post",
  process: { claims_extracted: true, units_and_dates_checked: true,
             counter_case_considered: true,
             evidence_published_inline: true,
             methodology_visible_for_big_claims: true,
             corrections_policy_published: true,
             versions_retained: true, silent_edits_made: false },
  claims: [
    claim("c1", { has_numbers: true, math_rechecked: true }),
    claim("c2", { independent_sources: 1, primary_source: true,
                  label: "likely" }),
    claim("c3", { material: false, independent_sources: 0,
                  label: "unverified" }),
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 17 Python VerdictTests, ported ----

test("test_stamped_manifest_is_stamped", () => {
  const v = evaluate(clone(STAMPED));
  assert.equal(v.verdict, "STAMPED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.claims_summary.material_claims, 2);
});

test("test_single_source_material_claim_is_not_triangulated", () => {
  const m = clone(STAMPED) as any;
  m.claims[0].independent_sources = 1;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_STAMPED");
  assert.equal(v.sections["triangulation"], "fail");
});

test("test_primary_plus_confirmation_triangulates", () => {
  const m = clone(STAMPED) as any;
  m.claims[0].independent_sources = 1;
  m.claims[0].primary_source = true;
  assert.equal(evaluate(m).verdict, "STAMPED");
});

test("test_non_material_claim_needs_no_triangulation", () => {
  const v = evaluate(clone(STAMPED));
  const checks = Object.fromEntries(v.checks.map((c) => [c.check, c]));
  assert.equal(checks["material_claims_triangulated"].status, "pass");
});

test("test_numeric_claim_without_rederivation_fails", () => {
  const m = clone(STAMPED) as any;
  m.claims[0].math_rechecked = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_STAMPED");
  assert.equal(v.sections["compute_rechecks"], "fail");
});

test("test_label_outside_vocabulary_fails", () => {
  const m = clone(STAMPED) as any;
  m.claims[0].label = "proven";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_STAMPED");
  assert.equal(v.sections["uncertainty_language"], "fail");
});

test("test_overstated_language_fails", () => {
  const m = clone(STAMPED) as any;
  m.claims[1].language_weakest_supported = false;
  assert.equal(evaluate(m).verdict, "NOT_STAMPED");
});

test("test_unarchived_material_source_fails", () => {
  const m = clone(STAMPED) as any;
  m.claims[0].sources_archived = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_STAMPED");
  assert.equal(v.sections["source_ladder"], "fail");
});

test("test_silent_edits_are_a_red_line_fail", () => {
  const m = clone(STAMPED) as any;
  m.process.silent_edits_made = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_STAMPED");
  assert.equal(v.sections["publication_and_corrections"], "fail");
});

test("test_missing_source_metadata_is_insufficient", () => {
  const m = clone(STAMPED) as any;
  delete m.claims[0].source_metadata_recorded;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["source_ladder"], "insufficient_evidence");
});

test("test_missing_triangulation_fields_is_insufficient", () => {
  const m = clone(STAMPED) as any;
  delete m.claims[0].independent_sources;
  assert.equal(evaluate(m).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_no_claims_declared_is_insufficient", () => {
  const m = clone(STAMPED) as any;
  m.claims = [];
  assert.equal(evaluate(m).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_offending_claims_are_named", () => {
  const m = clone(STAMPED) as any;
  m.claims[0].independent_sources = 0;
  const v = evaluate(m);
  const checks = Object.fromEntries(v.checks.map((c) => [c.check, c]));
  assert.ok(checks["material_claims_triangulated"].evidence.includes("c1"));
});

test("test_absent_process_is_insufficient_not_failed", () => {
  const m = clone(STAMPED) as any;
  delete m.process;
  assert.equal(evaluate(m).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  assert.equal(evaluate({}).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(STAMPED))).includes("VERDICT: STAMPED"));
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
    () => evaluate({ document: "Malformed input", process: "should_be_an_object", claims: "should_be_a_list" }),
    fieldError("process"),
  );
});

test("malformed: process as string rejected", () => {
  assert.throws(
    () => evaluate({ process: "should_be_an_object" }),
    fieldError("process"),
  );
});

test("malformed: claims as string rejected", () => {
  assert.throws(
    () => evaluate({ claims: "should_be_a_list" }),
    fieldError("claims"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(STAMPED) as any;
  m.process.silent_edits_made = "no";
  assert.throws(() => evaluate(m), fieldError("process.silent_edits_made"));
});

test("malformed: claim entry number as string rejected", () => {
  const m = clone(STAMPED) as any;
  m.claims[0].independent_sources = "two";
  assert.throws(() => evaluate(m), fieldError("claims[0].independent_sources"));
});

test("malformed: claim entry as string rejected", () => {
  const m = clone(STAMPED) as any;
  m.claims = ["c1"];
  assert.throws(() => evaluate(m), fieldError("claims[0]"));
});

test("malformed: null field rejected", () => {
  const m = clone(STAMPED) as any;
  m.process = null;
  assert.throws(() => evaluate(m), fieldError("process"));
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
  .filter((f) => f.startsWith("claim-verification-fact-check-stamp--") && f.endsWith(".json"))
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
