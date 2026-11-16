import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/codebase-structural-query.js";

// The GRAPH index, copied from the Python QueryTests oracle.
const GRAPH: Record<string, unknown> = {
  nodes: [
    { id: "api", kind: "module" },
    { id: "auth", kind: "function" },
    { id: "db", kind: "module" },
    { id: "handler", kind: "function" },
    { id: "orphan", kind: "function" },
    { id: "token", kind: "function" },
  ],
  edges: [
    { from: "api", to: "handler", kind: "calls" },
    { from: "handler", to: "auth", kind: "calls" },
    { from: "handler", to: "db", kind: "references" },
    { from: "auth", to: "token", kind: "calls" },
    { from: "token", to: "auth", kind: "references" },
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function query(intent: string, kw: Record<string, unknown> = {}): Record<string, unknown> {
  return { graph: clone(GRAPH), query: { intent, ...kw } };
}

// ---- The 17 Python QueryTests, ported ----

test("test_descendants_follow_edge_direction", () => {
  const v = evaluate(query("descendants", { target: "api" }));
  assert.equal(v.status, "ok");
  assert.equal(v.counts["total"], 4);
  assert.deepEqual(v.nodes, []);
});

test("test_descendants_expanded_lists_sorted_nodes", () => {
  const v = evaluate(query("descendants", { target: "api", expand: true }));
  assert.deepEqual(v.nodes, ["auth", "db", "handler", "token"]);
});

test("test_ancestors_are_upstream_only", () => {
  const v = evaluate(query("ancestors", { target: "token", expand: true }));
  assert.deepEqual(v.nodes, ["api", "auth", "handler"]);
});

test("test_blast_radius_is_upstream_plus_downstream", () => {
  const v = evaluate(query("blast_radius", { target: "auth", expand: true }));
  assert.deepEqual(v.nodes, ["api", "handler", "token"]);
});

test("test_cycle_does_not_loop_or_include_target", () => {
  const v = evaluate(query("descendants", { target: "auth", expand: true }));
  assert.deepEqual(v.nodes, ["token"]);
});

test("test_path_returns_typed_hops", () => {
  const v = evaluate(query("path", { target: "api", target_b: "token" }));
  assert.equal(v.status, "ok");
  assert.deepEqual(v.hops, [
    { from: "api", to: "handler", kind: "calls" },
    { from: "handler", to: "auth", kind: "calls" },
    { from: "auth", to: "token", kind: "calls" },
  ]);
});

test("test_path_to_self_is_zero_hops", () => {
  const v = evaluate(query("path", { target: "api", target_b: "api" }));
  assert.equal(v.status, "ok");
  assert.deepEqual(v.hops, []);
});

test("test_no_path_status", () => {
  const v = evaluate(query("path", { target: "api", target_b: "orphan" }));
  assert.equal(v.status, "no_path");
});

test("test_unknown_target_is_not_found", () => {
  const v = evaluate(query("descendants", { target: "ghost" }));
  assert.equal(v.status, "not_found");
});

test("test_stats_counts_by_kind", () => {
  const v = evaluate(query("stats"));
  assert.equal(v.counts["total"], 6);
  assert.deepEqual(v.counts["by_kind"], { function: 4, module: 2 });
  assert.equal(v.counts["edges_total"], 5);
  assert.deepEqual(v.counts["edges_by_kind"], { calls: 3, references: 2 });
});

test("test_snapshot_is_canonically_sorted", () => {
  const v = evaluate(query("snapshot"));
  const ids = (v.snapshot?.nodes ?? []).map((n) => n.id);
  assert.deepEqual(ids, [...ids].sort());
  assert.equal(v.snapshot?.edges.length, 5);
});

test("test_stale_index_is_never_answered_from", () => {
  const m = query("descendants", { target: "api" }) as any;
  m.index = { stale: true };
  const v = evaluate(m);
  assert.equal(v.status, "stale_index");
  assert.equal(v.counts["total"], 0);
});

test("test_duplicate_edges_and_nodes_deduped", () => {
  const m = query("stats") as any;
  m.graph.edges.push({ from: "api", to: "handler", kind: "calls" });
  m.graph.nodes.push({ id: "api", kind: "file" });
  const v = evaluate(m);
  assert.equal(v.counts["edges_total"], 5);
  assert.equal((v.counts["by_kind"] as any)["module"], 2);
});

test("test_edges_to_unknown_nodes_are_dropped", () => {
  const m = query("stats") as any;
  m.graph.edges.push({ from: "api", to: "ghost", kind: "calls" });
  assert.equal(evaluate(m).counts["edges_total"], 5);
});

test("test_unknown_intent_rejected", () => {
  assert.throws(() => evaluate(query("editorialize", { target: "api" })));
});

test("test_stamp_names_the_status", () => {
  assert.ok(stamp(evaluate(query("stats"))).includes("STATUS: ok"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
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
  .filter((f) => f.startsWith("codebase-structural-query--") && f.endsWith(".json"))
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
