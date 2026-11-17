import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/json-schema-enforcer.js";

// Direct tests mirror the Python oracle suite
// (services/json-schema-enforcer/tests/test_json_schema_enforcer.py).

function run(payload: unknown, schema: unknown) {
  return evaluate({ payload, schema });
}

test("valid simple object", () => {
  const r = run(
    { name: "x", age: 3 },
    {
      type: "object",
      properties: { name: { type: "string" }, age: { type: "integer" } },
      required: ["name"],
    },
  );
  assert.equal(r.valid, true);
  assert.deepEqual(r.violations, []);
});

test("type mismatch reported with path", () => {
  const r = run(
    { age: "three" },
    { type: "object", properties: { age: { type: "integer" } } },
  );
  assert.equal(r.valid, false);
  assert.equal(r.violations[0].path, "/age");
  assert.equal(r.violations[0].rule, "type");
});

test("boolean is not a number; integral float is an integer", () => {
  assert.equal(run(true, { type: "number" }).valid, false);
  assert.equal(run(2.0, { type: "integer" }).valid, true);
  assert.equal(run(2.5, { type: "integer" }).valid, false);
});

test("unsupported keywords are named, annotations ignored", () => {
  const r = run(
    { a: 1 },
    { type: "object", propertyNames: { maxLength: 3 }, title: "T" },
  );
  assert.deepEqual(r.unsupported_keywords, ["propertyNames"]);
});

test("ref resolves and reports the caller path", () => {
  const schema = {
    definitions: { pos: { type: "integer", minimum: 1 } },
    type: "object",
    properties: { count: { $ref: "#/definitions/pos" } },
  };
  assert.equal(run({ count: 3 }, schema).valid, true);
  const r = run({ count: 0 }, schema);
  assert.equal(r.valid, false);
  assert.equal(r.violations[0].path, "/count");
});

test("missing envelope fields are caller errors", () => {
  assert.throws(() => evaluate({ schema: {} }), TypeError);
  assert.throws(() => evaluate({ payload: 1 }), TypeError);
  assert.throws(
    () => evaluate({ payload: 1, schema: "nope" }),
    TypeError,
  );
});

test("stamp renders violations", () => {
  const s = stamp(
    run({ a: "x" }, { properties: { a: { type: "integer" } } }),
  );
  assert.ok(s.startsWith("JSON SCHEMA ENFORCER"));
  assert.ok(s.includes("/a"));
});

// ---- Golden-fixture parity against the Python oracle ----

// Compiled output lives in dist-test/test/, fixtures in test/fixtures/.
// Only this atom's fixtures (prefix json-schema-enforcer--).
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
  .filter(
    (f) => f.startsWith("json-schema-enforcer--") && f.endsWith(".json"),
  )
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
