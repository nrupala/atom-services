// Semantic code taint analysis report — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/semantic-code-taint-analysis-report/src/semantic_code_taint_analysis_report.py
// (evaluate() + stamp()). No logic changes: every verdict, count,
// finding, sanitized flow and summary string is byte-identical to
// the Python output for the same input.

export const ROLES = ["source", "transform", "sanitizer", "sink"] as const;

const SEVERITY_BY_SINK_KIND: Record<string, string> = {
  exec: "critical",
  sql: "high",
  html: "high",
};

export interface GraphNode {
  id: string;
  kind: string;
  role: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: string;
}

export interface Finding {
  source: string;
  sink: string;
  sink_kind: string;
  severity: string;
  path: string[];
  hops: GraphEdge[];
  length: number;
}

export interface SanitizedFlow {
  source: string;
  sink: string;
  sink_kind: string;
  path: string[];
  hops: GraphEdge[];
  length: number;
  sanitizers: string[];
}

export interface Report {
  service: string;
  atom_version: string;
  verdict: string;
  counts: Record<string, number>;
  findings: Finding[];
  sanitized_flows: SanitizedFlow[];
  missing_evidence: string[];
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
): { nodes: Map<string, GraphNode>; edges: GraphEdge[] } {
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
  const nodes = new Map<string, GraphNode>();
  for (const entry of (rawNodes as unknown[] | null) ?? []) {
    if (!isPyDict(entry)) continue;
    const [nodeId, hasId] = getFrom(entry, "id");
    if (!hasId || typeof nodeId !== "string" || nodeId.length === 0) continue;
    if (nodes.has(nodeId)) continue;
    const [kindRaw, hasKind] = getFrom(entry, "kind");
    const kind = hasKind && typeof kindRaw === "string" ? kindRaw : "unknown";
    const [roleRaw, hasRole] = getFrom(entry, "role");
    const role =
      hasRole && typeof roleRaw === "string" &&
      (ROLES as readonly string[]).includes(roleRaw)
        ? roleRaw
        : "transform";
    nodes.set(nodeId, { id: nodeId, kind, role });
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
    const key = JSON.stringify([src, dst, kind]);
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ from: src, to: dst, kind });
  }
  edges.sort((a, b) =>
    cmpStr(a.from, b.from) || cmpStr(a.to, b.to) || cmpStr(a.kind, b.kind));
  return { nodes, edges };
}

type Adjacency = Map<string, [string, string][]>;

function adjacency(edges: GraphEdge[], blocked = new Set<string>()): Adjacency {
  const adj: Adjacency = new Map();
  for (const edge of edges) {
    if (blocked.has(edge.to)) continue;
    if (!adj.has(edge.from)) adj.set(edge.from, []);
    (adj.get(edge.from) as [string, string][]).push([edge.to, edge.kind]);
  }
  for (const list of adj.values()) {
    list.sort((a, b) => cmpStr(a[0], b[0]) || cmpStr(a[1], b[1]));
  }
  return adj;
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

function pathNodes(hops: GraphEdge[], start: string): string[] {
  const out = [start];
  for (const hop of hops) out.push(hop.to);
  return out;
}

export function evaluate(manifest: unknown): Report {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  const { nodes, edges } = loadGraph(manifest);

  const byRole = (role: string) =>
    [...nodes.values()].filter((n) => n.role === role)
      .map((n) => n.id).sort(cmpStr);
  const sources = byRole("source");
  const sinks = byRole("sink");
  const sanitizers = byRole("sanitizer");

  const missing: string[] = [];
  if (sources.length === 0) missing.push("sources");
  if (sinks.length === 0) missing.push("sinks");

  const adj = adjacency(edges);
  const adjFree = adjacency(edges, new Set(sanitizers));

  const findings: Finding[] = [];
  const sanitizedFlows: SanitizedFlow[] = [];
  let unreachable = 0;
  for (const source of sources) {
    for (const sink of sinks) {
      const freeHops = shortestPath(adjFree, source, sink);
      if (freeHops !== null) {
        const sinkKind = (nodes.get(sink) as GraphNode).kind;
        findings.push({
          source,
          sink,
          sink_kind: sinkKind,
          severity: SEVERITY_BY_SINK_KIND[sinkKind.toLowerCase()] ?? "medium",
          path: pathNodes(freeHops, source),
          hops: freeHops,
          length: freeHops.length,
        });
        continue;
      }
      const hops = shortestPath(adj, source, sink);
      if (hops === null) {
        unreachable += 1;
        continue;
      }
      const path = pathNodes(hops, source);
      sanitizedFlows.push({
        source,
        sink,
        sink_kind: (nodes.get(sink) as GraphNode).kind,
        path,
        hops,
        length: hops.length,
        sanitizers: path.filter(
          (nid) => (nodes.get(nid) as GraphNode).role === "sanitizer"),
      });
    }
  }

  const pairs = sources.length * sinks.length;
  let verdict: string;
  if (missing.length > 0) verdict = "INSUFFICIENT_EVIDENCE";
  else if (findings.length > 0) verdict = "TAINTED";
  else verdict = "CLEAN";

  const counts: Record<string, number> = {
    nodes: nodes.size,
    edges: edges.length,
    sources: sources.length,
    sinks: sinks.length,
    sanitizers: sanitizers.length,
    pairs_evaluated: pairs,
    tainted: findings.length,
    sanitized: sanitizedFlows.length,
    unreachable,
  };

  let summary: string;
  if (verdict === "INSUFFICIENT_EVIDENCE") {
    summary =
      `Insufficient evidence: no declared ${missing.join(" or ")} ` +
      `in the graph (${nodes.size} nodes, ${edges.length} edges); ` +
      "taint cannot be ruled in or out.";
  } else if (verdict === "TAINTED") {
    summary =
      `${findings.length} tainted source->sink path(s) found across ` +
      `${pairs} pair(s): untrusted input reaches a sink without a sanitizer.`;
  } else {
    summary =
      `No tainted source->sink path across ${pairs} pair(s): ` +
      `${sanitizedFlows.length} sanitized, ${unreachable} unreachable.`;
  }

  return {
    service: "semantic-code-taint-analysis-report",
    atom_version: "0.1.0",
    verdict,
    counts,
    findings,
    sanitized_flows: sanitizedFlows,
    missing_evidence: missing,
    summary,
  };
}

export function stamp(report: Report): string {
  const lines: string[] = [
    "SEMANTIC CODE TAINT ANALYSIS REPORT",
    `VERDICT: ${report.verdict}`,
    report.summary,
  ];
  return lines.join("\n");
}
