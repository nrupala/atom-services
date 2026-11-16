import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/semantic-code-taint-analysis-report.js";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

interface N { id: string; role: string; kind: string }
interface E { from: string; to: string; kind: string }

function manifest(nodes: N[], edges: E[]): Record<string, unknown> {
  return { graph: { nodes: clone(nodes), edges: clone(edges) } };
}

const TAINTED_NODES: N[] = [
  { id: "req", role: "source", kind: "untrusted_input" },
  { id: "handler", role: "transform", kind: "function" },
  { id: "query", role: "sink", kind: "sql" },
];
const TAINTED_EDGES: E[] = [
  { from: "req", to: "handler", kind: "flows_to" },
  { from: "handler", to: "query", kind: "flows_to" },
];
const SANITIZED_NODES: N[] = [
  { id: "req", role: "source", kind: "untrusted_input" },
  { id: "escape", role: "sanitizer", kind: "function" },
  { id: "query", role: "sink", kind: "sql" },
];
const SANITIZED_EDGES: E[] = [
  { from: "req", to: "escape", kind: "flows_to" },
  { from: "escape", to: "query", kind: "flows_to" },
];

// ---- The 19 Python TaintTests, ported ----

test("test_tainted_path_found", () => {
  const v = evaluate(manifest(TAINTED_NODES, TAINTED_EDGES));
  assert.equal(v.verdict, "TAINTED");
  assert.equal(v.counts["tainted"], 1);
  const f = v.findings[0] as any;
  assert.equal(f.source, "req");
  assert.equal(f.sink, "query");
  assert.deepEqual(f.path, ["req", "handler", "query"]);
  assert.equal(f.length, 2);
  assert.equal(f.severity, "high");
});

test("test_direct_source_to_sink_is_tainted", () => {
  const v = evaluate(manifest(
    [{ id: "inp", role: "source", kind: "untrusted_input" },
     { id: "run", role: "sink", kind: "exec" }],
    [{ from: "inp", to: "run", kind: "flows_to" }]));
  assert.equal(v.verdict, "TAINTED");
  assert.equal(v.findings[0]?.severity, "critical");
  assert.deepEqual(v.findings[0]?.path, ["inp", "run"]);
});

test("test_sanitizer_cut_path_is_clean", () => {
  const v = evaluate(manifest(SANITIZED_NODES, SANITIZED_EDGES));
  assert.equal(v.verdict, "CLEAN");
  assert.deepEqual(v.findings, []);
  assert.equal(v.counts["sanitized"], 1);
  assert.deepEqual(v.sanitized_flows[0]?.sanitizers, ["escape"]);
  assert.deepEqual(v.sanitized_flows[0]?.path, ["req", "escape", "query"]);
});

test("test_unsanitized_alternative_path_still_tainted", () => {
  const nodes = [...SANITIZED_NODES, { id: "raw", role: "transform", kind: "function" }];
  const edges = [...SANITIZED_EDGES,
    { from: "req", to: "raw", kind: "flows_to" },
    { from: "raw", to: "query", kind: "flows_to" }];
  const v = evaluate(manifest(nodes, edges));
  assert.equal(v.verdict, "TAINTED");
  assert.deepEqual(v.findings[0]?.path, ["req", "raw", "query"]);
});

test("test_no_path_is_clean_and_unreachable", () => {
  const v = evaluate(manifest(
    [{ id: "inp", role: "source", kind: "untrusted_input" },
     { id: "page", role: "sink", kind: "html" }], []));
  assert.equal(v.verdict, "CLEAN");
  assert.equal(v.counts["unreachable"], 1);
  assert.equal(v.counts["pairs_evaluated"], 1);
});

test("test_missing_sinks_is_insufficient_evidence", () => {
  const v = evaluate(manifest(TAINTED_NODES.slice(0, 2), TAINTED_EDGES.slice(0, 1)));
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.deepEqual(v.missing_evidence, ["sinks"]);
});

test("test_missing_sources_is_insufficient_evidence", () => {
  const v = evaluate(manifest(TAINTED_NODES.slice(1), TAINTED_EDGES));
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.deepEqual(v.missing_evidence, ["sources"]);
});

test("test_empty_graph_is_insufficient_evidence", () => {
  const v = evaluate(manifest([], []));
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.deepEqual(v.missing_evidence, ["sources", "sinks"]);
  assert.equal(v.counts["nodes"], 0);
});

test("test_html_sink_severity_high_and_unknown_medium", () => {
  const v = evaluate(manifest(
    [{ id: "a", role: "source", kind: "untrusted_input" },
     { id: "b", role: "source", kind: "untrusted_input" },
     { id: "page", role: "sink", kind: "html" },
     { id: "store", role: "sink", kind: "file_write" }],
    [{ from: "a", to: "page", kind: "flows_to" },
     { from: "b", to: "store", kind: "flows_to" }]));
  const sev: Record<string, string> = {};
  for (const f of v.findings) sev[`${f.source},${f.sink}`] = f.severity;
  assert.equal(sev["a,page"], "high");
  assert.equal(sev["b,store"], "medium");
  assert.equal(v.counts["pairs_evaluated"], 4);
  assert.equal(v.counts["tainted"], 2);
  assert.equal(v.counts["unreachable"], 2);
});

test("test_findings_sorted_by_source_then_sink", () => {
  const v = evaluate(manifest(
    [{ id: "z_in", role: "source", kind: "untrusted_input" },
     { id: "a_in", role: "source", kind: "untrusted_input" },
     { id: "run", role: "sink", kind: "exec" }],
    [{ from: "z_in", to: "run", kind: "flows_to" },
     { from: "a_in", to: "run", kind: "flows_to" }]));
  assert.deepEqual(v.findings.map((f) => f.source), ["a_in", "z_in"]);
});

test("test_cycle_does_not_loop", () => {
  const nodes = [...TAINTED_NODES, { id: "loop", role: "transform", kind: "function" }];
  const edges = [...TAINTED_EDGES,
    { from: "handler", to: "loop", kind: "flows_to" },
    { from: "loop", to: "handler", kind: "flows_to" }];
  const v = evaluate(manifest(nodes, edges));
  assert.equal(v.verdict, "TAINTED");
  assert.deepEqual(v.findings[0]?.path, ["req", "handler", "query"]);
});

test("test_duplicate_nodes_and_edges_deduped", () => {
  const m = manifest(TAINTED_NODES, TAINTED_EDGES) as any;
  m.graph.nodes.push({ id: "req", role: "sink", kind: "exec" });
  m.graph.edges.push({ ...TAINTED_EDGES[0] });
  const v = evaluate(m);
  assert.equal(v.counts["nodes"], 3);
  assert.equal(v.counts["edges"], 2);
  assert.equal(v.counts["sources"], 1);
});

test("test_edges_to_unknown_nodes_dropped", () => {
  const m = manifest(TAINTED_NODES, TAINTED_EDGES) as any;
  m.graph.edges.push({ from: "req", to: "ghost", kind: "flows_to" });
  assert.equal(evaluate(m).counts["edges"], 2);
});

test("test_unknown_role_defaults_to_transform", () => {
  const v = evaluate(manifest(
    [{ id: "inp", role: "source", kind: "untrusted_input" },
     { id: "mid", role: "weird", kind: "function" },
     { id: "run", role: "sink", kind: "exec" }],
    [{ from: "inp", to: "mid", kind: "flows_to" },
     { from: "mid", to: "run", kind: "flows_to" }]));
  assert.equal(v.verdict, "TAINTED");
});

test("test_sanitizer_off_path_does_not_cut", () => {
  const nodes = [...TAINTED_NODES, { id: "unused_clean", role: "sanitizer", kind: "function" }];
  const v = evaluate(manifest(nodes, TAINTED_EDGES));
  assert.equal(v.verdict, "TAINTED");
  assert.equal(v.counts["sanitizers"], 1);
});

test("test_missing_graph_rejected", () => {
  assert.throws(() => evaluate({}));
});

test("test_non_list_nodes_rejected", () => {
  assert.throws(() => evaluate({ graph: { nodes: {}, edges: [] } }));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(manifest(TAINTED_NODES, TAINTED_EDGES)))
    .includes("VERDICT: TAINTED"));
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
  .filter((f) => f.startsWith("semantic-code-taint-analysis-report--") && f.endsWith(".json"))
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
