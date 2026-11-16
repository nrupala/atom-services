import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/release-readiness.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The READY manifest, copied from the Python VerdictTests oracle.
const READY: Record<string, unknown> = {
  product: "example-app",
  version: "1.2.0",
  version_bump_locations: ["VERSION"],
  tag: { name: "v1.2.0", annotated: true, moved: false },
  changelog: { has_entry_for_version: true, unreleased_section_moved: true },
  release_notes: { present: true, breaking_changes: [], migration_steps: [] },
  approver: "release-owner",
  approval: { hitl_recorded: true },
  rollout_plan: { present: true, staged: true },
  rollback_plan: { present: true, testable: true },
  health_check: { window_hours: 36 },
  artifacts: {
    sealed: true,
    checksum_manifest: true,
    verified_before_announcement: true,
  },
  tests: { passing: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 11 Python VerdictTests, ported ----

test("test_ready_manifest_is_ready", () => {
  const v = evaluate(clone(READY));
  assert.equal(v.verdict, "READY");
  assert.ok(Object.values(v.bars).every((s) => s === "pass"));
});

test("test_missing_rollback_plan_is_not_ready", () => {
  const m = clone(READY) as any;
  m.rollback_plan.present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
  assert.equal(v.bars["lifecycle"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(READY) as any;
  delete m.health_check;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.bars["lifecycle"], "insufficient_evidence");
});

test("test_bad_semver_fails_control", () => {
  const m = clone(READY) as any;
  m.version = "1.2";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
  assert.equal(v.bars["control"], "fail");
});

test("test_moved_tag_is_a_red_line_fail", () => {
  const m = clone(READY) as any;
  m.tag.moved = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
});

test("test_breaking_change_without_migration_steps_fails", () => {
  const m = clone(READY) as any;
  m.release_notes.breaking_changes = ["config format changed"];
  m.release_notes.migration_steps = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
  assert.equal(v.bars["understanding"], "fail");
});

test("test_breaking_change_with_migration_steps_passes", () => {
  const m = clone(READY) as any;
  m.release_notes.breaking_changes = ["config format changed"];
  m.release_notes.migration_steps = ["run migrate-config"];
  const v = evaluate(m);
  assert.equal(v.verdict, "READY");
});

test("test_health_window_outside_24_to_48_fails", () => {
  const m = clone(READY) as any;
  m.health_check.window_hours = 6;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_READY");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(READY));
  assert.ok(stamp(v).includes("VERDICT: READY"));
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
    () => evaluate({ product: 123, version: "1.2.3", version_bump_locations: "not-a-list", tag: "invalid-object-type" }),
    fieldError("product"),
  );
});

test("malformed: product as number rejected", () => {
  assert.throws(
    () => evaluate({ product: 123 }),
    fieldError("product"),
  );
});

test("malformed: version_bump_locations as string rejected", () => {
  assert.throws(
    () => evaluate({ version_bump_locations: "not-a-list" }),
    fieldError("version_bump_locations"),
  );
});

test("malformed: tag as string rejected", () => {
  assert.throws(
    () => evaluate({ tag: "invalid-object-type" }),
    fieldError("tag"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(READY) as any;
  m.tag.annotated = "yes";
  assert.throws(() => evaluate(m), fieldError("tag.annotated"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(READY) as any;
  m.version_bump_locations = [42];
  assert.throws(() => evaluate(m), fieldError("version_bump_locations[0]"));
});

test("malformed: null field rejected", () => {
  const m = clone(READY) as any;
  m.tag = null;
  assert.throws(() => evaluate(m), fieldError("tag"));
});

// ---- F3 regression: release_notes.breaking_changes /
// migration_steps carry no documented type in SERVICE.md, so they
// are not type-validated (external verification retest, 2026-11-15).
// The recorded Wave 1 battery manifests are embedded verbatim from
// verification/work/release-readiness-verdict/cases.json —
// breaking_changes: false and migration_steps: "none" must return
// verdicts, not raise FieldTypeError.

const F3_FULL_PASS: Record<string, unknown> = {
  product: "milo-core",
  version: "1.2.3",
  version_bump_locations: [
    "src/version.py",
  ],
  tag: {
    name: "v1.2.3",
    annotated: true,
    moved: false,
  },
  changelog: {
    has_entry_for_version: true,
    unreleased_section_moved: true,
  },
  release_notes: {
    present: true,
    breaking_changes: false,
    migration_steps: "none",
  },
  approver: "jane.doe",
  approval: {
    hitl_recorded: true,
  },
  rollout_plan: {
    present: true,
  },
  rollback_plan: {
    present: true,
    testable: true,
  },
  health_check: {
    window_hours: 24,
  },
  artifacts: {
    sealed: true,
    checksum_manifest: true,
    verified_before_announcement: true,
  },
  tests: {
    passing: true,
  },
};

const F3_VIOLATIONS: Record<string, unknown> = {
  product: "milo-core",
  version: "1.2.3",
  version_bump_locations: [
    "src/version.py",
  ],
  tag: {
    name: "v1.2.3",
    annotated: true,
    moved: false,
  },
  changelog: {
    has_entry_for_version: true,
    unreleased_section_moved: true,
  },
  release_notes: {
    present: true,
    breaking_changes: false,
    migration_steps: "none",
  },
  approver: "jane.doe",
  approval: {
    hitl_recorded: true,
  },
  rollout_plan: {
    present: true,
  },
  rollback_plan: {
    present: true,
    testable: false,
  },
  health_check: {
    window_hours: 10,
  },
  artifacts: {
    sealed: true,
    checksum_manifest: true,
    verified_before_announcement: true,
  },
  tests: {
    passing: true,
  },
};

test("f3: recorded full-pass returns READY", () => {
  const v = evaluate(clone(F3_FULL_PASS));
  assert.equal(v.verdict, "READY");
});

test("f3: recorded violations returns NOT_READY", () => {
  const v = evaluate(clone(F3_VIOLATIONS));
  assert.equal(v.verdict, "NOT_READY");
});

test("f3: recorded malformed still rejected", () => {
  assert.throws(
    () => evaluate({ product: 123, version: "1.2.3", version_bump_locations: "not-a-list", tag: "invalid-object-type" }),
    fieldError("product"),
  );
});

test("f3: minimal false breaking and string migration not rejected", () => {
  const v = evaluate({ release_notes: { present: true, breaking_changes: false, migration_steps: "none" } });
  assert.ok(typeof v.verdict === "string");
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

// Atom #1's fixtures are the unprefixed files; replicated atoms carry
// "<service>--<case>.json" names and are loaded by their own test files.
const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.endsWith(".json") && !f.includes("--"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
