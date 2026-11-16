#!/usr/bin/env python3
"""Codebase structural query — deterministic core.

Built from the bound skill `codebase-intelligence` (v1): "Index once,
query as data — deterministic intent routing, aggregate-first output,
domain-blind analysis."

The caller submits a code-graph index (nodes + typed edges, as
exported by their indexer) and one structural query. The query is
routed to exactly one intent, per the skill's routing table:

- descendants   — everything downstream of the node
- ancestors     — everything upstream of the node
- blast_radius  — the full failure footprint (upstream + downstream)
- path          — shortest typed path between two nodes
- stats         — node/edge counts by kind (the shape of the graph)
- snapshot      — frozen, canonical, portable export of the graph

Rules carried from the skill:
- Aggregate-first: counts and kind breakdowns by default; full node
  lists only when the caller sets `expand`.
- Domain-blind: structure only — no scoring, no rankings, no opinions.
- A stale index is never answered from: if `index.stale` is true the
  result is STALE_INDEX and no structural answer is given.
- Typed edges in every path answer.

No model call, no network, no clock dependence: the same index and
query always produce the same answer. That determinism is the product.
"""
import json
import sys
from collections import deque

INTENTS = (
    "descendants",
    "ancestors",
    "blast_radius",
    "path",
    "stats",
    "snapshot",
)


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
        nodes[node_id] = kind if has_kind and isinstance(kind, str) \
            else "unknown"
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


def _adjacency(edges, reverse=False):
    adj = {}
    for edge in edges:
        src, dst = (edge["to"], edge["from"]) if reverse \
            else (edge["from"], edge["to"])
        adj.setdefault(src, []).append((dst, edge["kind"]))
    for key in adj:
        adj[key].sort()
    return adj


def _reachable(adj, start):
    seen = set()
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for nxt, _kind in adj.get(node, []):
            if nxt not in seen:
                seen.add(nxt)
                queue.append(nxt)
    seen.discard(start)
    return seen


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


def _by_kind(nodes, node_ids):
    counts = {}
    for node_id in sorted(node_ids):
        kind = nodes[node_id]
        counts[kind] = counts.get(kind, 0) + 1
    return {kind: counts[kind] for kind in sorted(counts)}


def evaluate(manifest):
    """Answer one structural query over the submitted graph index."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    query, has_query = _get(manifest, "query")
    if not has_query or not isinstance(query, dict):
        raise ValueError("query must be an object")
    intent, has_intent = _get(query, "intent")
    if not has_intent or not isinstance(intent, str):
        raise ValueError("query.intent must be a string")
    if intent not in INTENTS:
        raise ValueError(f"unknown intent: {intent}")
    target, has_target = _get(query, "target")
    target = target if has_target and isinstance(target, str) else None
    target_b, has_target_b = _get(query, "target_b")
    target_b = target_b if has_target_b and isinstance(target_b, str) \
        else None
    expand, has_expand = _get(query, "expand")
    expand = expand is True

    nodes, edges = _load_graph(manifest)

    result = {
        "service": "codebase-structural-query",
        "atom_version": "0.1.0",
        "intent": intent,
        "target": target,
        "target_b": target_b,
        "status": "ok",
        "counts": {"total": 0, "by_kind": {}},
        "nodes": [],
        "hops": [],
        "snapshot": None,
    }

    stale, has_stale = _get(manifest, "index", "stale")
    if has_stale and stale is True:
        result["status"] = "stale_index"
        result["summary"] = (
            "Index declared stale — no structural answer given; "
            "re-index and re-query."
        )
        return result

    if intent == "stats":
        edge_counts = {}
        for edge in edges:
            edge_counts[edge["kind"]] = edge_counts.get(edge["kind"], 0) + 1
        result["counts"] = {
            "total": len(nodes),
            "by_kind": _by_kind(nodes, nodes.keys()),
            "edges_total": len(edges),
            "edges_by_kind": {
                kind: edge_counts[kind] for kind in sorted(edge_counts)},
        }
        result["summary"] = (
            f"Graph shape: {len(nodes)} nodes, {len(edges)} edges."
        )
        return result

    if intent == "snapshot":
        snap_nodes = [{"id": node_id, "kind": nodes[node_id]}
                      for node_id in sorted(nodes)]
        result["snapshot"] = {"nodes": snap_nodes, "edges": edges}
        result["counts"] = {"total": len(nodes),
                            "by_kind": _by_kind(nodes, nodes.keys())}
        result["summary"] = (
            f"Snapshot: {len(nodes)} nodes, {len(edges)} edges, "
            "canonically sorted."
        )
        return result

    if target is None or target not in nodes:
        result["status"] = "not_found"
        result["summary"] = "Target node not in the index."
        return result

    adj = _adjacency(edges)
    radj = _adjacency(edges, reverse=True)

    if intent == "path":
        if target_b is None or target_b not in nodes:
            result["status"] = "not_found"
            result["summary"] = "Target node not in the index."
            return result
        hops = _shortest_path(adj, target, target_b)
        if hops is None:
            result["status"] = "no_path"
            result["summary"] = (
                f"No typed path from {target} to {target_b}."
            )
            return result
        result["hops"] = hops
        result["counts"] = {"total": len(hops), "by_kind": {}}
        result["summary"] = (
            f"Shortest typed path from {target} to {target_b}: "
            f"{len(hops)} hop(s)."
        )
        return result

    if intent == "descendants":
        found = _reachable(adj, target)
    elif intent == "ancestors":
        found = _reachable(radj, target)
    else:  # blast_radius
        found = _reachable(adj, target) | _reachable(radj, target)
    ordered = sorted(found)
    result["counts"] = {"total": len(ordered),
                        "by_kind": _by_kind(nodes, ordered)}
    if expand:
        result["nodes"] = ordered
    result["summary"] = (
        f"{intent} of {target}: {len(ordered)} node(s)."
    )
    return result


def stamp(verdict):
    """Human-readable stamp of a query result dict."""
    lines = [
        "CODEBASE STRUCTURAL QUERY",
        f"intent: {verdict.get('intent')}  target: {verdict.get('target')}",
        f"STATUS: {verdict['status']}",
        verdict["summary"],
    ]
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: codebase_structural_query.py <query.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    result = evaluate(manifest)
    print(json.dumps(result, indent=2))
    print()
    print(stamp(result))
    return 0 if result["status"] == "ok" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
