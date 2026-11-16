#!/usr/bin/env python3
"""Semantic code taint analysis report — deterministic core.

Built from the bound skill `semantic-analysis` (v1): "data flow
(source -> transform -> sink) for taint-style checks — untrusted
input reaching exec/SQL/HTML = finding", and its quality gate:
"Taint/flow findings list source -> sink with paths."

The caller submits a DECLARED code graph — nodes labelled by role
(source / transform / sanitizer / sink) and directed data-flow
edges, as exported by their own analyser. This atom computes over
the submitted graph only; it never parses, fetches or executes code.

Deterministic reduction (only rules the skill states):
- A source is an untrusted-input node; a sink is a sensitive
  operation node (its `kind` names the operation, e.g. exec, sql,
  html); a sanitizer is a node that cleans data flowing through it;
  any other node is a transform.
- For every (source, sink) pair, in sorted order:
  * TAINTED — a directed path from source to sink exists that
    passes through NO sanitizer node. The shortest such
    sanitizer-free path is reported as the finding, with its hops.
  * SANITIZED — a directed path exists, but every path passes
    through at least one sanitizer. The shortest overall path and
    the sanitizers on it are reported.
  * UNREACHABLE — no directed path exists.
- Verdict:
  * TAINTED — at least one tainted pair.
  * CLEAN — at least one source and one sink are declared and no
    pair is tainted.
  * INSUFFICIENT_EVIDENCE — no source is declared, or no sink is
    declared (including an empty graph): taint cannot be ruled
    in or out from missing evidence, so no clean verdict is given.
- Severity is a fixed table on the sink kind (lower-cased):
  exec -> critical; sql -> high; html -> high; any other kind ->
  medium. It is reported on tainted findings only.

Graph hygiene mirrors the sibling graph atom: duplicate node ids
keep the first entry, nodes without a string id are dropped, edges
naming unknown nodes and exact duplicate edges are dropped, edges
are canonically sorted, and adjacency is sorted so BFS shortest
paths are deterministic.

No floats are produced: every computed quantity is an integer
count or a path length, so Python and TypeScript serialise the
report identically. No model call, no network, no clock dependence:
the same declared graph always produces the same report.
"""
import json
import sys
from collections import deque

ROLES = ("source", "transform", "sanitizer", "sink")

SEVERITY_BY_SINK_KIND = {
    "exec": "critical",
    "sql": "high",
    "html": "high",
}


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _load_graph(manifest):
    graph, has_graph = _get(manifest, "graph")
    if not has_graph or not isinstance(graph, dict):
        raise ValueError("graph must be an object with nodes and edges")
    raw_nodes, has_nodes = _get(graph, "nodes")
    raw_edges, has_edges = _get(graph, "edges")
    if has_nodes and not isinstance(raw_nodes, list):
        raise ValueError("graph.nodes must be a list")
    if has_edges and not isinstance(raw_edges, list):
        raise ValueError("graph.edges must be a list")
    nodes = {}
    for entry in raw_nodes or []:
        if not isinstance(entry, dict):
            continue
        node_id, has_id = _get(entry, "id")
        if not has_id or not isinstance(node_id, str) or not node_id:
            continue
        if node_id in nodes:
            continue
        kind, has_kind = _get(entry, "kind")
        kind = kind if has_kind and isinstance(kind, str) else "unknown"
        role, has_role = _get(entry, "role")
        role = role if has_role and role in ROLES else "transform"
        nodes[node_id] = {"id": node_id, "kind": kind, "role": role}
    edges = []
    seen = set()
    for entry in raw_edges or []:
        if not isinstance(entry, dict):
            continue
        src, has_src = _get(entry, "from")
        dst, has_dst = _get(entry, "to")
        if not (has_src and has_dst and isinstance(src, str)
                and isinstance(dst, str)):
            continue
        if src not in nodes or dst not in nodes:
            continue
        kind, has_kind = _get(entry, "kind")
        kind = kind if has_kind and isinstance(kind, str) else "unknown"
        key = (src, dst, kind)
        if key in seen:
            continue
        seen.add(key)
        edges.append({"from": src, "to": dst, "kind": kind})
    edges.sort(key=lambda e: (e["from"], e["to"], e["kind"]))
    return nodes, edges


def _adjacency(edges, blocked=frozenset()):
    adj = {}
    for edge in edges:
        if edge["to"] in blocked:
            continue
        adj.setdefault(edge["from"], []).append((edge["to"], edge["kind"]))
    for key in adj:
        adj[key].sort()
    return adj


def _shortest_path(adj, start, goal):
    if start == goal:
        return []
    prev = {start: None}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for nxt, kind in adj.get(node, []):
            if nxt not in prev:
                prev[nxt] = (node, kind)
                if nxt == goal:
                    hops = []
                    cur = goal
                    while prev[cur] is not None:
                        parent, edge_kind = prev[cur]
                        hops.append({"from": parent, "to": cur,
                                     "kind": edge_kind})
                        cur = parent
                    hops.reverse()
                    return hops
                queue.append(nxt)
    return None


def _path_nodes(hops, start):
    out = [start]
    for hop in hops:
        out.append(hop["to"])
    return out


def evaluate(manifest):
    """Analyse one declared code graph for taint flows."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    nodes, edges = _load_graph(manifest)

    sources = sorted(nid for nid, n in nodes.items()
                     if n["role"] == "source")
    sinks = sorted(nid for nid, n in nodes.items()
                   if n["role"] == "sink")
    sanitizers = sorted(nid for nid, n in nodes.items()
                        if n["role"] == "sanitizer")

    missing = []
    if not sources:
        missing.append("sources")
    if not sinks:
        missing.append("sinks")

    adj = _adjacency(edges)
    adj_free = _adjacency(edges, blocked=frozenset(sanitizers))

    findings = []
    sanitized_flows = []
    unreachable = 0
    for source in sources:
        for sink in sinks:
            free_hops = _shortest_path(adj_free, source, sink)
            if free_hops is not None:
                sink_kind = nodes[sink]["kind"]
                findings.append({
                    "source": source,
                    "sink": sink,
                    "sink_kind": sink_kind,
                    "severity": SEVERITY_BY_SINK_KIND.get(
                        sink_kind.lower(), "medium"),
                    "path": _path_nodes(free_hops, source),
                    "hops": free_hops,
                    "length": len(free_hops),
                })
                continue
            hops = _shortest_path(adj, source, sink)
            if hops is None:
                unreachable += 1
                continue
            path = _path_nodes(hops, source)
            sanitized_flows.append({
                "source": source,
                "sink": sink,
                "sink_kind": nodes[sink]["kind"],
                "path": path,
                "hops": hops,
                "length": len(hops),
                "sanitizers": [nid for nid in path
                               if nodes[nid]["role"] == "sanitizer"],
            })

    pairs = len(sources) * len(sinks)
    if missing:
        verdict = "INSUFFICIENT_EVIDENCE"
    elif findings:
        verdict = "TAINTED"
    else:
        verdict = "CLEAN"

    counts = {
        "nodes": len(nodes),
        "edges": len(edges),
        "sources": len(sources),
        "sinks": len(sinks),
        "sanitizers": len(sanitizers),
        "pairs_evaluated": pairs,
        "tainted": len(findings),
        "sanitized": len(sanitized_flows),
        "unreachable": unreachable,
    }

    if verdict == "INSUFFICIENT_EVIDENCE":
        summary = (
            "Insufficient evidence: no declared "
            + " or ".join(missing)
            + f" in the graph ({len(nodes)} nodes, {len(edges)} edges); "
            "taint cannot be ruled in or out."
        )
    elif verdict == "TAINTED":
        summary = (
            f"{len(findings)} tainted source->sink path(s) found across "
            f"{pairs} pair(s): untrusted input reaches a sink without "
            "a sanitizer."
        )
    else:
        summary = (
            f"No tainted source->sink path across {pairs} pair(s): "
            f"{len(sanitized_flows)} sanitized, {unreachable} unreachable."
        )

    return {
        "service": "semantic-code-taint-analysis-report",
        "atom_version": "0.1.0",
        "verdict": verdict,
        "counts": counts,
        "findings": findings,
        "sanitized_flows": sanitized_flows,
        "missing_evidence": missing,
        "summary": summary,
    }


def stamp(report):
    """Human-readable stamp of a report dict."""
    lines = [
        "SEMANTIC CODE TAINT ANALYSIS REPORT",
        f"VERDICT: {report['verdict']}",
        report["summary"],
    ]
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: semantic_code_taint_analysis_report.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    report = evaluate(manifest)
    print(json.dumps(report, indent=2))
    print()
    print(stamp(report))
    return 0 if report["verdict"] == "CLEAN" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
