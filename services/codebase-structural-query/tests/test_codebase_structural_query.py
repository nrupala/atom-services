import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from codebase_structural_query import evaluate, stamp  # noqa: E402

GRAPH = {
    "nodes": [
        {"id": "api", "kind": "module"},
        {"id": "auth", "kind": "function"},
        {"id": "db", "kind": "module"},
        {"id": "handler", "kind": "function"},
        {"id": "orphan", "kind": "function"},
        {"id": "token", "kind": "function"},
    ],
    "edges": [
        {"from": "api", "to": "handler", "kind": "calls"},
        {"from": "handler", "to": "auth", "kind": "calls"},
        {"from": "handler", "to": "db", "kind": "references"},
        {"from": "auth", "to": "token", "kind": "calls"},
        {"from": "token", "to": "auth", "kind": "references"},
    ],
}


def _query(intent, **kw):
    manifest = {"graph": copy.deepcopy(GRAPH),
                "query": {"intent": intent}}
    manifest["query"].update(kw)
    return manifest


class QueryTests(unittest.TestCase):
    def test_descendants_follow_edge_direction(self):
        v = evaluate(_query("descendants", target="api"))
        self.assertEqual(v["status"], "ok")
        self.assertEqual(v["counts"]["total"], 4)
        self.assertEqual(v["nodes"], [])  # aggregate-first by default

    def test_descendants_expanded_lists_sorted_nodes(self):
        v = evaluate(_query("descendants", target="api", expand=True))
        self.assertEqual(v["nodes"], ["auth", "db", "handler", "token"])

    def test_ancestors_are_upstream_only(self):
        v = evaluate(_query("ancestors", target="token", expand=True))
        self.assertEqual(v["nodes"], ["api", "auth", "handler"])

    def test_blast_radius_is_upstream_plus_downstream(self):
        v = evaluate(_query("blast_radius", target="auth", expand=True))
        self.assertEqual(v["nodes"], ["api", "handler", "token"])

    def test_cycle_does_not_loop_or_include_target(self):
        v = evaluate(_query("descendants", target="auth", expand=True))
        self.assertEqual(v["nodes"], ["token"])

    def test_path_returns_typed_hops(self):
        v = evaluate(_query("path", target="api", target_b="token"))
        self.assertEqual(v["status"], "ok")
        self.assertEqual(
            v["hops"],
            [{"from": "api", "to": "handler", "kind": "calls"},
             {"from": "handler", "to": "auth", "kind": "calls"},
             {"from": "auth", "to": "token", "kind": "calls"}])

    def test_path_to_self_is_zero_hops(self):
        v = evaluate(_query("path", target="api", target_b="api"))
        self.assertEqual(v["status"], "ok")
        self.assertEqual(v["hops"], [])

    def test_no_path_status(self):
        v = evaluate(_query("path", target="api", target_b="orphan"))
        self.assertEqual(v["status"], "no_path")

    def test_unknown_target_is_not_found(self):
        v = evaluate(_query("descendants", target="ghost"))
        self.assertEqual(v["status"], "not_found")

    def test_stats_counts_by_kind(self):
        v = evaluate(_query("stats"))
        self.assertEqual(v["counts"]["total"], 6)
        self.assertEqual(v["counts"]["by_kind"],
                         {"function": 4, "module": 2})
        self.assertEqual(v["counts"]["edges_total"], 5)
        self.assertEqual(v["counts"]["edges_by_kind"],
                         {"calls": 3, "references": 2})

    def test_snapshot_is_canonically_sorted(self):
        v = evaluate(_query("snapshot"))
        ids = [n["id"] for n in v["snapshot"]["nodes"]]
        self.assertEqual(ids, sorted(ids))
        self.assertEqual(len(v["snapshot"]["edges"]), 5)

    def test_stale_index_is_never_answered_from(self):
        m = _query("descendants", target="api")
        m["index"] = {"stale": True}
        v = evaluate(m)
        self.assertEqual(v["status"], "stale_index")
        self.assertEqual(v["counts"]["total"], 0)

    def test_duplicate_edges_and_nodes_deduped(self):
        m = _query("stats")
        m["graph"]["edges"].append(
            {"from": "api", "to": "handler", "kind": "calls"})
        m["graph"]["nodes"].append({"id": "api", "kind": "file"})
        v = evaluate(m)
        self.assertEqual(v["counts"]["edges_total"], 5)
        self.assertEqual(v["counts"]["by_kind"]["module"], 2)

    def test_edges_to_unknown_nodes_are_dropped(self):
        m = _query("stats")
        m["graph"]["edges"].append(
            {"from": "api", "to": "ghost", "kind": "calls"})
        v = evaluate(m)
        self.assertEqual(v["counts"]["edges_total"], 5)

    def test_unknown_intent_rejected(self):
        with self.assertRaises(ValueError):
            evaluate(_query("editorialize", target="api"))

    def test_stamp_names_the_status(self):
        v = evaluate(_query("stats"))
        self.assertIn("STATUS: ok", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


if __name__ == "__main__":
    unittest.main()
