import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/token-estimator.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// Direct tests mirror the Python oracle suite
// (services/token-estimator/tests/test_token_estimator.py).

test("empty text is zero", () => {
  const r = evaluate({ text: "" });
  assert.equal(r.estimated_tokens, 0);
  assert.equal(r.chars, 0);
});

test("single word at the generic factor", () => {
  const r = evaluate({ text: "hello" });
  assert.equal(r.words, 1);
  assert.equal(r.estimated_tokens, 2);
});

test("sentence estimate matches the documented arithmetic", () => {
  const r = evaluate({
    text: "The quick brown fox jumps over the lazy dog.",
  });
  assert.equal(r.words, 9);
  assert.equal(r.estimated_tokens, 14);
});

test("messages add per-message overhead", () => {
  const r = evaluate({
    messages: [{ role: "user", content: "hello" }],
  });
  assert.equal(r.message_count, 1);
  assert.equal(r.estimated_tokens, 6);
});

test("text and messages conflict is a caller error", () => {
  assert.throws(() => evaluate({ text: "x", messages: [] }), TypeError);
});

test("unknown family is a caller error", () => {
  assert.throws(
    () => evaluate({ text: "x", model_family: "bert" }),
    TypeError,
  );
});

test("mistyped field raises FieldTypeError naming the field", () => {
  assert.throws(
    () => evaluate({ text: 42 }),
    (e: unknown) => e instanceof FieldTypeError && e.field === "text",
  );
});

test("method states the estimate", () => {
  const r = evaluate({ text: "anything" });
  assert.ok(r.method.includes("not a tokenizer count"));
});

test("stamp renders", () => {
  const s = stamp(evaluate({ text: "hello world" }));
  assert.ok(s.startsWith("TOKEN ESTIMATOR"));
});

// ---- Golden-fixture parity against the Python oracle ----

// Compiled output lives in dist-test/test/, fixtures in test/fixtures/.
// Only this atom's fixtures (prefix token-estimator--).
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
  .filter((f) => f.startsWith("token-estimator--") && f.endsWith(".json"))
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
