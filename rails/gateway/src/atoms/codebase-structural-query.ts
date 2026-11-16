// Codebase structural query — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/codebase-structural-query/src/codebase_structural_query.py
// (evaluate() + stamp()). No logic changes: every status, count,
// node list, hop list and summary string is byte-identical to the
// Python output for the same input.

import { pyStr } from "./release-readiness.js";

export const INTENTS = [
  "descendants",
  "ancestors",
  "blast_radius",
  "path",
  "stats",
  "snapshot",
] as const;

export interface GraphEdge {
  from: string;
  to: string;
  kind: string;
}

export interface QueryResult {
  service: string;
  atom_version: string;
  intent: string;
  target: string | null;
  target_b: string | null;
  status: string;
  counts: Record<string, unknown>;
  nodes: string[];
  hops: GraphEdge[];
  snapshot: { nodes: { id: string; kind: string }[]; edges: GraphEdge[] } | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function getFrom(
  obj: Record<string, unknown>,
  key: string,
): [unknown, boolean] {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) return [null, false];
  return [obj[key], true];
}

function cmpStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function loadGraph(
  manifest: Record<string, unknown>,
): { nodes: Map<string, string>; edges: GraphEdge[] } {
  const [graph, hasGraph] = getPath(manifest, "graph");
  if (!hasGraph || !isPyDict(graph)) {
    throw new Error("graph must be an object with nodes and edges");
  }
  const [rawNodes, hasNodes] = getFrom(graph, "nodes");
  const [rawEdges, hasEdges] = getFrom(graph, "edges");
  if (hasNodes && !Array.isArray(rawNodes)) {
    throw new Error("graph.nodes must be a list");
  }
  if (hasEdges && !Array.isArray(rawEdges)) {
    throw new Error("graph.edges must be a list");
  }
  const nodes = new Map<string, string>();
  for (const entry of (rawNodes as unknown[] | null) ?? []) {
    if (!isPyDict(entry)) continue;
    const [nodeId, hasId] = getFrom(entry, "id");
    if (!hasId || typeof nodeId !== "string" || nodeId.length === 0) continue;
    if (nodes.has(nodeId)) continue;
    const [kind, hasKind] = getFrom(entry, "kind");
    nodes.set(nodeId, hasKind && typeof kind === "string" ? kind : "unknown");
  }
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  for (const entry of (rawEdges as unknown[] | null) ?? []) {
    if (!isPyDict(entry)) continue;
    const [src, hasSrc] = getFrom(entry, "from");
    const [dst, hasDst] = getFrom(entry, "to");
    if (!(hasSrc && hasDst && typeof src === "string" &&
          typeof dst === "string")) continue;
    if (!nodes.has(src) || !nodes.has(dst)) continue;
    const [kindRaw, hasKind] = getFrom(entry, "kind");
    const kind = hasKind && typeof kindRaw === "string" ? kindRaw : "unknown";
    const key = `${src}${dst}${kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ from: src, to: dst, kind });
  }
  edges.sort((a, b) =>
    cmpStr(a.from, b.from) || cmpStr(a.to, b.to) || cmpStr(a.kind, b.kind));
  return { nodes, edges };
}

type Adjacency = Map<string, [string, string][]>;

function adjacency(edges: GraphEdge[], reverse = false): Adjacency {
  const adj: Adjacency = new Map();
  for (const edge of edges) {
    const src = reverse ? edge.to : edge.from;
    const dst = reverse ? edge.from : edge.to;
    if (!adj.has(src)) adj.set(src, []);
    (adj.get(src) as [string, string][]).push([dst, edge.kind]);
  }
  for (const list of adj.values()) {
    list.sort((a, b) => cmpStr(a[0], b[0]) || cmpStr(a[1], b[1]));
  }
  return adj;
}

function reachable(adj: Adjacency, start: string): Set<string> {
  const seen = new Set<string>();
  const queue: string[] = [start];
  while (queue.length > 0) {
    const node = queue.shift() as string;
    for (const [nxt] of adj.get(node) ?? []) {
      if (!seen.has(nxt)) {
        seen.add(nxt);
        queue.push(nxt);
      }
    }
  }
  seen.delete(start);
  return seen;
}

function shortestPath(
  adj: Adjacency,
  start: string,
  goal: string,
): GraphEdge[] | null {
  if (start === goal) return [];
  const prev = new Map<string, [string, string] | null>([[start, null]]);
  const queue: string[] = [start];
  while (queue.length > 0) {
    const node = queue.shift() as string;
    for (const [nxt, kind] of adj.get(node) ?? []) {
      if (!prev.has(nxt)) {
        prev.set(nxt, [node, kind]);
        if (nxt === goal) {
          const hops: GraphEdge[] = [];
          let cur = goal;
          while (prev.get(cur) !== null && prev.get(cur) !== undefined) {
            const [parent, edgeKind] = prev.get(cur) as [string, string];
            hops.push({ from: parent, to: cur, kind: edgeKind });
            cur = parent;
          }
          hops.reverse();
          return hops;
        }
        queue.push(nxt);
      }
    }
  }
  return null;
}

function byKind(
  nodes: Map<string, string>,
  nodeIds: Iterable<string>,
): Record<string, number> {
  const counts = new Map<string, number>();
  for (const nodeId of [...nodeIds].sort(cmpStr)) {
    const kind = nodes.get(nodeId) as string;
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  const out: Record<string, number> = {};
  for (const kind of [...counts.keys()].sort(cmpStr)) {
    out[kind] = counts.get(kind) as number;
  }
  return out;
}

export function evaluate(manifest: unknown): QueryResult {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  const [query, hasQuery] = getPath(manifest, "query");
  if (!hasQuery || !isPyDict(query)) {
    throw new Error("query must be an object");
  }
  const [intent, hasIntent] = getFrom(query, "intent");
  if (!hasIntent || typeof intent !== "string") {
    throw new Error("query.intent must be a string");
  }
  if (!(INTENTS as readonly string[]).includes(intent)) {
    throw new Error(`unknown intent: ${intent}`);
  }
  const [targetRaw, hasTarget] = getFrom(query, "target");
  const target = hasTarget && typeof targetRaw === "string" ? targetRaw : null;
  const [targetBRaw, hasTargetB] = getFrom(query, "target_b");
  const targetB = hasTargetB && typeof targetBRaw === "string" ? targetBRaw : null;
  const [expandRaw] = getFrom(query, "expand");
  const expand = expandRaw === true;

  const { nodes, edges } = loadGraph(manifest);

  const result: QueryResult = {
    service: "codebase-structural-query",
    atom_version: "0.1.0",
    intent,
    target,
    target_b: targetB,
    status: "ok",
    counts: { total: 0, by_kind: {} },
    nodes: [],
    hops: [],
    snapshot: null,
    summary: "",
  };

  const [stale, hasStale] = getPath(manifest, "index", "stale");
  if (hasStale && stale === true) {
    result.status = "stale_index";
    result.summary =
      "Index declared stale — no structural answer given; re-index and re-query.";
    return result;
  }

  if (intent === "stats") {
    const edgeCounts = new Map<string, number>();
    for (const edge of edges) {
      edgeCounts.set(edge.kind, (edgeCounts.get(edge.kind) ?? 0) + 1);
    }
    const edgesByKind: Record<string, number> = {};
    for (const kind of [...edgeCounts.keys()].sort(cmpStr)) {
      edgesByKind[kind] = edgeCounts.get(kind) as number;
    }
    result.counts = {
      total: nodes.size,
      by_kind: byKind(nodes, nodes.keys()),
      edges_total: edges.length,
      edges_by_kind: edgesByKind,
    };
    result.summary = `Graph shape: ${nodes.size} nodes, ${edges.length} edges.`;
    return result;
  }

  if (intent === "snapshot") {
    const snapNodes = [...nodes.keys()].sort(cmpStr)
      .map((id) => ({ id, kind: nodes.get(id) as string }));
    result.snapshot = { nodes: snapNodes, edges };
    result.counts = { total: nodes.size, by_kind: byKind(nodes, nodes.keys()) };
    result.summary =
      `Snapshot: ${nodes.size} nodes, ${edges.length} edges, canonically sorted.`;
    return result;
  }

  if (target === null || !nodes.has(target)) {
    result.status = "not_found";
    result.summary = "Target node not in the index.";
    return result;
  }

  const adj = adjacency(edges);
  const radj = adjacency(edges, true);

  if (intent === "path") {
    if (targetB === null || !nodes.has(targetB)) {
      result.status = "not_found";
      result.summary = "Target node not in the index.";
      return result;
    }
    const hops = shortestPath(adj, target, targetB);
    if (hops === null) {
      result.status = "no_path";
      result.summary = `No typed path from ${target} to ${targetB}.`;
      return result;
    }
    result.hops = hops;
    result.counts = { total: hops.length, by_kind: {} };
    result.summary =
      `Shortest typed path from ${target} to ${targetB}: ${hops.length} hop(s).`;
    return result;
  }

  let found: Set<string>;
  if (intent === "descendants") {
    found = reachable(adj, target);
  } else if (intent === "ancestors") {
    found = reachable(radj, target);
  } else {
    found = new Set([...reachable(adj, target), ...reachable(radj, target)]);
  }
  const ordered = [...found].sort(cmpStr);
  result.counts = { total: ordered.length, by_kind: byKind(nodes, ordered) };
  if (expand) result.nodes = ordered;
  result.summary = `${intent} of ${target}: ${ordered.length} node(s).`;
  return result;
}

export function stamp(result: QueryResult): string {
  const lines: string[] = [
    "CODEBASE STRUCTURAL QUERY",
    `intent: ${pyStr(result.intent ?? null)}  target: ${pyStr(result.target ?? null)}`,
    `STATUS: ${result.status}`,
    result.summary,
  ];
  return lines.join("\n");
}
