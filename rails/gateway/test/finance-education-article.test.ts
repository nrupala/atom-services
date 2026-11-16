import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/finance-education-article.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The READY manifest, copied from the Python VerdictTests oracle.
const READY: Record<string, unknown> = {
  article: "What a yield curve is",
  topic: "yield curve",
  structure: {
    concept_explained: true,
    framework_taught_not_answer: true,
    what_to_watch_close_present: true,
    section_order: ["concept", "worked_example", "what_to_watch"],
  },
  worked_example: {
    present: true,
    steps: [
      { operation: "subtract", operands: [5.0, 2.0], declared_result: 3.0 },
      { operation: "multiply", operands: [1000, 0.03], declared_result: 30.0 },
      { operation: "divide", operands: [30.0, 1000], declared_result: 0.03 },
      { operation: "add", operands: [1000, 30.0], declared_result: 1030.0 },
    ],
  },
  signals: {
    buy_sell_signals_present: false,
    implied_trade_present: false,
    trade_execution_present: false,
  },
  disclosure: {
    uses_data_or_assumptions: true,
    assumptions_stated: true,
    data_dates_stated: true,
    limits_stated: true,
    data_as_of: "2026-11-01",
  },
  review: {
    education_only_review_passed: true,
    think_with_finance_voice_confirmed: true,
    plain_language_review_passed: true,
    no_hype_confirmed: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 21 Python VerdictTests, ported ----

test("test_ready_manifest_is_article_ready", () => {
  const v = evaluate(clone(READY));
  assert.equal(v.verdict, "ARTICLE_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 19);
  assert.equal(v.steps_evaluated, 4);
  assert.equal(v.steps_incomplete, 0);
});

test("test_missing_topic_fails_structure", () => {
  const m = clone(READY) as any;
  m.topic = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_ARTICLE_READY");
  assert.equal(v.sections["article_structure"], "fail");
});

test("test_wrong_section_order_fails_structure", () => {
  const m = clone(READY) as any;
  m.structure.section_order = ["worked_example", "concept", "what_to_watch"];
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_ARTICLE_READY");
  assert.equal(v.sections["article_structure"], "fail");
});

test("test_framework_not_taught_fails_structure", () => {
  const m = clone(READY) as any;
  m.structure.framework_taught_not_answer = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_ARTICLE_READY");
  assert.equal(v.sections["article_structure"], "fail");
});

test("test_worked_example_absent_declared_fails", () => {
  const m = clone(READY) as any;
  m.worked_example.present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_ARTICLE_READY");
  assert.equal(v.sections["worked_example"], "fail");
});

test("test_worked_example_arithmetic_wrong_fails", () => {
  const m = clone(READY) as any;
  m.worked_example.steps[1].declared_result = 31.0;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_ARTICLE_READY");
  assert.equal(v.sections["worked_example"], "fail");
  assert.equal(v.steps_evaluated, 4);
});

test("test_buy_sell_signal_fails_no_signals", () => {
  const m = clone(READY) as any;
  m.signals.buy_sell_signals_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_ARTICLE_READY");
  assert.equal(v.sections["no_signals"], "fail");
});

test("test_trade_execution_fails_no_signals", () => {
  const m = clone(READY) as any;
  m.signals.trade_execution_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_ARTICLE_READY");
  assert.equal(v.sections["no_signals"], "fail");
});

test("test_unstated_limits_fail_disclosures", () => {
  const m = clone(READY) as any;
  m.disclosure.limits_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_ARTICLE_READY");
  assert.equal(v.sections["disclosures"], "fail");
});

test("test_empty_data_as_of_fails_disclosures", () => {
  const m = clone(READY) as any;
  m.disclosure.data_as_of = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_ARTICLE_READY");
  assert.equal(v.sections["disclosures"], "fail");
});

test("test_no_data_or_assumptions_passes_disclosures_as_na", () => {
  const m = clone(READY) as any;
  m.disclosure = { uses_data_or_assumptions: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "ARTICLE_READY");
  assert.equal(v.sections["disclosures"], "pass");
});

test("test_hype_not_cleared_fails_review", () => {
  const m = clone(READY) as any;
  m.review.no_hype_confirmed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_ARTICLE_READY");
  assert.equal(v.sections["review"], "fail");
});

test("test_step_missing_declared_result_is_insufficient", () => {
  const m = clone(READY) as any;
  delete m.worked_example.steps[0].declared_result;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["worked_example"], "insufficient_evidence");
  assert.equal(v.steps_evaluated, 3);
  assert.equal(v.steps_incomplete, 1);
});

test("test_division_by_zero_step_is_incomplete", () => {
  const m = clone(READY) as any;
  m.worked_example.steps[2].operands = [30.0, 0];
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.steps_incomplete, 1);
});

test("test_unknown_operation_step_is_incomplete", () => {
  const m = clone(READY) as any;
  m.worked_example.steps[0].operation = "compound";
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.steps_incomplete, 1);
});

test("test_no_steps_declared_is_insufficient", () => {
  const m = clone(READY) as any;
  delete m.worked_example.steps;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.steps_evaluated, 0);
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(READY) as any;
  delete m.review;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["review"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.steps_evaluated, 0);
  assert.equal(v.steps_incomplete, 0);
});

test("test_sparse_manifest_is_insufficient_evidence", () => {
  const v = evaluate({ article: "Draft", topic: "yield curve" });
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(READY))).includes("VERDICT: ARTICLE_READY"));
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
// MalformedTypeTests, ported. A documented field present with the
// wrong JSON type raises FieldTypeError naming the field.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: topic as number rejected", () => {
  assert.throws(() => evaluate({ topic: 123 }), fieldError("topic"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ structure: "not_an_object" }),
    fieldError("structure"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.signals.buy_sell_signals_present = "no";
  assert.throws(
    () => evaluate(m),
    fieldError("signals.buy_sell_signals_present"),
  );
});

test("malformed: section order as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.structure.section_order = "concept,worked_example";
  assert.throws(
    () => evaluate(m),
    fieldError("structure.section_order"),
  );
});

test("malformed: section order entry as number rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.structure.section_order = ["concept", 2, "what_to_watch"];
  assert.throws(
    () => evaluate(m),
    fieldError("structure.section_order[1]"),
  );
});

test("malformed: steps as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.worked_example.steps = "not-a-list";
  assert.throws(
    () => evaluate(m),
    fieldError("worked_example.steps"),
  );
});

test("malformed: operand as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.worked_example.steps[0].operands = [5.0, "2"];
  assert.throws(
    () => evaluate(m),
    fieldError("worked_example.steps[0].operands[1]"),
  );
});

test("malformed: declared result as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.worked_example.steps[0].declared_result = "3.0";
  assert.throws(
    () => evaluate(m),
    fieldError("worked_example.steps[0].declared_result"),
  );
});

test("malformed: declared result as boolean rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.worked_example.steps[0].declared_result = true;
  assert.throws(
    () => evaluate(m),
    fieldError("worked_example.steps[0].declared_result"),
  );
});

test("malformed: null field rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.disclosure = null;
  assert.throws(() => evaluate(m), fieldError("disclosure"));
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
  .filter((f) => f.startsWith("finance-education-article--") && f.endsWith(".json"))
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
