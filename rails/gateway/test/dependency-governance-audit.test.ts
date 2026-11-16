import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/dependency-governance-audit.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The GOVERNED manifest, copied from the Python VerdictTests oracle.
const GOVERNED: Record<string, unknown> = {
  project: "example-app",
  justification: { recorded: true, alternatives_considered: true },
  sources: {
    all_official: true,
    publisher_signing_checked: true,
    binaries_present: true,
    binary_checksums_verified: true,
  },
  pinning: {
    exact_versions: true,
    lockfile_committed: true,
    lockfile_updated_in_same_change: true,
    ci_installs_from_lockfile: true,
    ci_actions_images_pinned_to_hashes: true,
  },
  audit: {
    automated_in_workflow: true,
    bot_bumps_reviewed: true,
    automerge_without_green_suite: false,
  },
  updates: { batched: true, stale_dependencies_flagged: true, unused_retired: true },
  licences: {
    checked: true,
    non_permissive_present: false,
    human_decision_recorded: false,
    notice_required: true,
    notice_updated: true,
  },
  sbom: { generated_per_release: true, kept_with_artifacts: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 16 Python VerdictTests, ported ----

test("test_governed_manifest_is_governed", () => {
  const v = evaluate(clone(GOVERNED));
  assert.equal(v.verdict, "GOVERNED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
});

test("test_unpinned_versions_fail_pinning", () => {
  const m = clone(GOVERNED) as any;
  m.pinning.exact_versions = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GOVERNED");
  assert.equal(v.sections["pinning"], "fail");
});

test("test_unknown_sources_are_a_red_line_fail", () => {
  const m = clone(GOVERNED) as any;
  m.sources.all_official = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GOVERNED");
  assert.equal(v.sections["verified_sources"], "fail");
});

test("test_automerge_without_green_suite_is_a_red_line_fail", () => {
  const m = clone(GOVERNED) as any;
  m.audit.automerge_without_green_suite = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GOVERNED");
  assert.equal(v.sections["audit_and_updates"], "fail");
});

test("test_lockfile_not_updated_in_same_change_fails", () => {
  const m = clone(GOVERNED) as any;
  m.pinning.lockfile_updated_in_same_change = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GOVERNED");
  assert.equal(v.sections["pinning"], "fail");
});

test("test_unpinned_ci_actions_fail", () => {
  const m = clone(GOVERNED) as any;
  m.pinning.ci_actions_images_pinned_to_hashes = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GOVERNED");
});

test("test_copyleft_without_human_decision_fails", () => {
  const m = clone(GOVERNED) as any;
  m.licences.non_permissive_present = true;
  m.licences.human_decision_recorded = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GOVERNED");
  assert.equal(v.sections["licences"], "fail");
});

test("test_copyleft_with_human_decision_passes", () => {
  const m = clone(GOVERNED) as any;
  m.licences.non_permissive_present = true;
  m.licences.human_decision_recorded = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "GOVERNED");
});

test("test_notice_required_but_not_updated_fails", () => {
  const m = clone(GOVERNED) as any;
  m.licences.notice_updated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GOVERNED");
  assert.equal(v.sections["licences"], "fail");
});

test("test_binaries_without_checksums_fail", () => {
  const m = clone(GOVERNED) as any;
  m.sources.binary_checksums_verified = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GOVERNED");
  assert.equal(v.sections["verified_sources"], "fail");
});

test("test_no_binaries_passes_checksum_check", () => {
  const m = clone(GOVERNED) as any;
  m.sources.binaries_present = false;
  delete m.sources.binary_checksums_verified;
  const v = evaluate(m);
  assert.equal(v.verdict, "GOVERNED");
});

test("test_unjustified_dependency_fails", () => {
  const m = clone(GOVERNED) as any;
  m.justification.recorded = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_GOVERNED");
  assert.equal(v.sections["justification"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(GOVERNED) as any;
  delete m.sbom;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["sbom"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(GOVERNED));
  assert.ok(stamp(v).includes("VERDICT: GOVERNED"));
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
    () => evaluate({ project: "malformed-project", justification: "not-an-object", sources: { all_official: "should-be-boolean" } }),
    fieldError("justification"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ justification: "not-an-object" }),
    fieldError("justification"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  assert.throws(
    () => evaluate({ sources: { all_official: "should-be-boolean" } }),
    fieldError("sources.all_official"),
  );
});

test("malformed: nested boolean leaf as string rejected", () => {
  const m = clone(GOVERNED) as any;
  m.pinning.exact_versions = "yes";
  assert.throws(() => evaluate(m), fieldError("pinning.exact_versions"));
});

test("malformed: null field rejected", () => {
  const m = clone(GOVERNED) as any;
  m.sources = null;
  assert.throws(() => evaluate(m), fieldError("sources"));
});

// ---- Golden-fixture parity against the Python oracle ----

// Compiled output lives in dist/test/, fixtures in test/fixtures/.
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
  .filter((f) => f.startsWith("dependency-governance-audit--") && f.endsWith(".json"))
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
