import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/markdown-sanitizer.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// Direct tests mirror the Python oracle suite
// (services/markdown-sanitizer/tests/test_markdown_sanitizer.py).

test("clean markdown unchanged", () => {
  const r = evaluate({ text: "# Title\n\nSome *markdown* text.\n" });
  assert.equal(r.changed, false);
  assert.equal(r.sanitized_text, "# Title\n\nSome *markdown* text.\n");
});

test("script block removed whole", () => {
  const r = evaluate({ text: "before\n<script>alert(1)</script>\nafter" });
  assert.ok(!r.sanitized_text.includes("alert"));
  assert.equal(r.counts.active_blocks_removed, 1);
});

test("javascript link neutralized, https kept", () => {
  const r = evaluate({
    text: "[click](javascript:alert(1)) and [ok](https://example.com)",
  });
  assert.ok(r.sanitized_text.includes("[click](#)"));
  assert.ok(r.sanitized_text.includes("[ok](https://example.com)"));
  assert.equal(r.counts.links_neutralized, 1);
});

test("link target with parentheses fully neutralized", () => {
  const r = evaluate({ text: "[Download](javascript:run_me())" });
  assert.equal(r.sanitized_text, "[Download](#)");
  assert.equal(r.counts.links_neutralized, 1);
});

test("fenced and inline code protected", () => {
  const r = evaluate({
    text: "Example:\n\n```html\n<script>alert(1)</script>\n```\n\nUse `<b>` for bold.",
  });
  assert.ok(r.sanitized_text.includes("<script>alert(1)</script>"));
  assert.equal(r.counts.active_blocks_removed, 0);
  assert.equal(r.counts.html_tags_removed, 0);
});

test("missing text is a caller error", () => {
  assert.throws(() => evaluate({ options: {} }), TypeError);
});

test("mistyped field raises FieldTypeError naming the field", () => {
  assert.throws(
    () => evaluate({ text: 42 }),
    (e: unknown) => e instanceof FieldTypeError && e.field === "text",
  );
});

test("stamp renders", () => {
  const s = stamp(evaluate({ text: "<script>x</script>hi" }));
  assert.ok(s.startsWith("MARKDOWN SANITIZER"));
  assert.ok(s.includes("active_blocks_removed"));
});

// ---- Golden-fixture parity against the Python oracle ----

// Compiled output lives in dist-test/test/, fixtures in test/fixtures/.
// Only this atom's fixtures (prefix markdown-sanitizer--).
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
  .filter((f) => f.startsWith("markdown-sanitizer--") && f.endsWith(".json"))
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

test("nested tag re-formation removed by fixpoint", () => {
  // Removing the inner pairs joins the outer fragments into a whole
  // new active block; the fixpoint pass must remove that one too,
  // whole. Count: 2 inner pairs in pass one + 1 re-formed block.
  const r = evaluate({
    text: "<scri<script></script>pt>alert(1)</scri<script></script>pt>",
  });
  assert.equal(r.sanitized_text, "");
  assert.equal(r.counts.active_blocks_removed, 3);
  assert.equal(r.counts.html_tags_removed, 0);
});
