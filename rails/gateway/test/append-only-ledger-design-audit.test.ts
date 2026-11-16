import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/append-only-ledger-design-audit.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  ledger_name: "example-ledger",
  version: "1.0.0",
  append_only: {
    events_immutable: true,
    update_on_posted_entries: false,
    delete_on_posted_entries: false,
    no_mutation_paths_verified: true,
    correction_model: "reversing_entry",
    corrections_reference_original: true,
    retention_and_legal_holds: true,
  },
  money: {
    moves_money: true,
    double_entry: true,
    transaction_sum_zero: true,
    amount_representation: "integer_minor_units",
    currency_explicit_per_entry: true,
    fx_rates_recorded_at_event_time: true,
  },
  structure: {
    accounts_entries_transactions: true,
    transactions_atomic: true,
    stable_ids: true,
    event_fields: ["timestamp", "actor", "source"],
  },
  derived_state: {
    balances_are_projections: true,
    projections_recomputable: true,
    checkpoint_hashes: true,
  },
  reconciliation: {
    cadence: "monthly",
    discrepancy_workflow_recorded: true,
    unreconciled_period_closed_silently: false,
  },
  reporting: {
    audit_queries_who_what_when_why: true,
    tax_ready_exports: true,
  },
  security: { encryption_at_rest: true, scoped_access: true },
  recovery: { restore_drill_done: true, restore_replay_verified: true },
  tests: { balance_invariant_tests: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The Python VerdictTests, ported ----

test("test_sound_manifest_is_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
});

test("test_update_on_posted_entries_is_a_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.append_only.update_on_posted_entries = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["append_only"], "fail");
});

test("test_delete_on_posted_entries_fails", () => {
  const m = clone(SOUND) as any;
  m.append_only.delete_on_posted_entries = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["append_only"], "fail");
});

test("test_edit_in_place_correction_model_fails", () => {
  const m = clone(SOUND) as any;
  m.append_only.correction_model = "edit_in_place";
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["append_only"], "fail");
});

test("test_float_money_is_a_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.money.amount_representation = "float";
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["money_discipline"], "fail");
});

test("test_exact_decimal_money_passes", () => {
  const m = clone(SOUND) as any;
  m.money.amount_representation = "exact_decimal";
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
});

test("test_single_entry_when_money_moves_fails", () => {
  const m = clone(SOUND) as any;
  m.money.double_entry = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["money_discipline"], "fail");
});

test("test_no_money_movement_makes_double_entry_not_applicable", () => {
  const m = clone(SOUND) as any;
  m.money.moves_money = false;
  delete m.money.double_entry;
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
});

test("test_event_missing_actor_field_fails", () => {
  const m = clone(SOUND) as any;
  m.structure.event_fields = ["timestamp", "source"];
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["structure_and_derivation"], "fail");
});

test("test_silently_closed_unreconciled_period_is_a_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.reconciliation.unreconciled_period_closed_silently = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["reconciliation_and_reporting"], "fail");
});

test("test_missing_checkpoint_hashes_fails_tamper_evidence", () => {
  const m = clone(SOUND) as any;
  m.derived_state.checkpoint_hashes = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.recovery;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["security_and_recovery"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(SOUND));
  const text = stamp(v);
  assert.ok(text.includes("VERDICT: SOUND"));
  assert.ok(text.includes("append_only"));
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
    () => evaluate({ ledger_name: "Malformed Ledger", version: "1.0.0", append_only: "should_be_an_object" }),
    fieldError("append_only"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ append_only: "should_be_an_object" }),
    fieldError("append_only"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(SOUND) as any;
  m.append_only.events_immutable = "yes";
  assert.throws(() => evaluate(m), fieldError("append_only.events_immutable"));
});

test("malformed: list field as string rejected", () => {
  const m = clone(SOUND) as any;
  m.structure.event_fields = "timestamp";
  assert.throws(() => evaluate(m), fieldError("structure.event_fields"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(SOUND) as any;
  m.structure.event_fields = ["timestamp", 42];
  assert.throws(() => evaluate(m), fieldError("structure.event_fields[1]"));
});

test("malformed: null field rejected", () => {
  const m = clone(SOUND) as any;
  m.money = null;
  assert.throws(() => evaluate(m), fieldError("money"));
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
  .filter((f) => f.startsWith("append-only-ledger-design-audit--") && f.endsWith(".json"))
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
