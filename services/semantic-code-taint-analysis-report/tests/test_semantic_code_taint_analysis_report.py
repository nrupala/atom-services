import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from semantic_code_taint_analysis_report import evaluate, stamp  # noqa: E402


def _manifest(nodes, edges):
    return {"graph": {"nodes": copy.deepcopy(nodes),
                      "edges": copy.deepcopy(edges)}}


TAINTED_NODES = [
    {"id": "req", "role": "source", "kind": "untrusted_input"},
    {"id": "handler", "role": "transform", "kind": "function"},
    {"id": "query", "role": "sink", "kind": "sql"},
]
TAINTED_EDGES = [
    {"from": "req", "to": "handler", "kind": "flows_to"},
    {"from": "handler", "to": "query", "kind": "flows_to"},
]

SANITIZED_NODES = [
    {"id": "req", "role": "source", "kind": "untrusted_input"},
    {"id": "escape", "role": "sanitizer", "kind": "function"},
    {"id": "query", "role": "sink", "kind": "sql"},
]
SANITIZED_EDGES = [
    {"from": "req", "to": "escape", "kind": "flows_to"},
    {"from": "escape", "to": "query", "kind": "flows_to"},
]


class TaintTests(unittest.TestCase):
    def test_tainted_path_found(self):
        v = evaluate(_manifest(TAINTED_NODES, TAINTED_EDGES))
        self.assertEqual(v["verdict"], "TAINTED")
        self.assertEqual(v["counts"]["tainted"], 1)
        f = v["findings"][0]
        self.assertEqual(f["source"], "req")
        self.assertEqual(f["sink"], "query")
        self.assertEqual(f["path"], ["req", "handler", "query"])
        self.assertEqual(f["length"], 2)
        self.assertEqual(f["severity"], "high")

    def test_direct_source_to_sink_is_tainted(self):
        v = evaluate(_manifest(
            [{"id": "inp", "role": "source", "kind": "untrusted_input"},
             {"id": "run", "role": "sink", "kind": "exec"}],
            [{"from": "inp", "to": "run", "kind": "flows_to"}]))
        self.assertEqual(v["verdict"], "TAINTED")
        self.assertEqual(v["findings"][0]["severity"], "critical")
        self.assertEqual(v["findings"][0]["path"], ["inp", "run"])

    def test_sanitizer_cut_path_is_clean(self):
        v = evaluate(_manifest(SANITIZED_NODES, SANITIZED_EDGES))
        self.assertEqual(v["verdict"], "CLEAN")
        self.assertEqual(v["findings"], [])
        self.assertEqual(v["counts"]["sanitized"], 1)
        self.assertEqual(v["sanitized_flows"][0]["sanitizers"],
                         ["escape"])
        self.assertEqual(v["sanitized_flows"][0]["path"],
                         ["req", "escape", "query"])

    def test_unsanitized_alternative_path_still_tainted(self):
        # Shortest path is sanitized, a longer bypass is not: tainted.
        nodes = SANITIZED_NODES + [
            {"id": "raw", "role": "transform", "kind": "function"}]
        edges = SANITIZED_EDGES + [
            {"from": "req", "to": "raw", "kind": "flows_to"},
            {"from": "raw", "to": "query", "kind": "flows_to"}]
        v = evaluate(_manifest(nodes, edges))
        self.assertEqual(v["verdict"], "TAINTED")
        self.assertEqual(v["findings"][0]["path"],
                         ["req", "raw", "query"])

    def test_no_path_is_clean_and_unreachable(self):
        v = evaluate(_manifest(
            [{"id": "inp", "role": "source", "kind": "untrusted_input"},
             {"id": "page", "role": "sink", "kind": "html"}],
            []))
        self.assertEqual(v["verdict"], "CLEAN")
        self.assertEqual(v["counts"]["unreachable"], 1)
        self.assertEqual(v["counts"]["pairs_evaluated"], 1)

    def test_missing_sinks_is_insufficient_evidence(self):
        v = evaluate(_manifest(TAINTED_NODES[:2], TAINTED_EDGES[:1]))
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["missing_evidence"], ["sinks"])

    def test_missing_sources_is_insufficient_evidence(self):
        v = evaluate(_manifest(TAINTED_NODES[1:], TAINTED_EDGES))
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["missing_evidence"], ["sources"])

    def test_empty_graph_is_insufficient_evidence(self):
        v = evaluate(_manifest([], []))
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["missing_evidence"], ["sources", "sinks"])
        self.assertEqual(v["counts"]["nodes"], 0)

    def test_html_sink_severity_high_and_unknown_medium(self):
        v = evaluate(_manifest(
            [{"id": "a", "role": "source", "kind": "untrusted_input"},
             {"id": "b", "role": "source", "kind": "untrusted_input"},
             {"id": "page", "role": "sink", "kind": "html"},
             {"id": "store", "role": "sink", "kind": "file_write"}],
            [{"from": "a", "to": "page", "kind": "flows_to"},
             {"from": "b", "to": "store", "kind": "flows_to"}]))
        sev = {(f["source"], f["sink"]): f["severity"]
               for f in v["findings"]}
        self.assertEqual(sev[("a", "page")], "high")
        self.assertEqual(sev[("b", "store")], "medium")
        self.assertEqual(v["counts"]["pairs_evaluated"], 4)
        self.assertEqual(v["counts"]["tainted"], 2)
        self.assertEqual(v["counts"]["unreachable"], 2)

    def test_findings_sorted_by_source_then_sink(self):
        v = evaluate(_manifest(
            [{"id": "z_in", "role": "source", "kind": "untrusted_input"},
             {"id": "a_in", "role": "source", "kind": "untrusted_input"},
             {"id": "run", "role": "sink", "kind": "exec"}],
            [{"from": "z_in", "to": "run", "kind": "flows_to"},
             {"from": "a_in", "to": "run", "kind": "flows_to"}]))
        self.assertEqual([f["source"] for f in v["findings"]],
                         ["a_in", "z_in"])

    def test_cycle_does_not_loop(self):
        nodes = TAINTED_NODES + [
            {"id": "loop", "role": "transform", "kind": "function"}]
        edges = TAINTED_EDGES + [
            {"from": "handler", "to": "loop", "kind": "flows_to"},
            {"from": "loop", "to": "handler", "kind": "flows_to"}]
        v = evaluate(_manifest(nodes, edges))
        self.assertEqual(v["verdict"], "TAINTED")
        self.assertEqual(v["findings"][0]["path"],
                         ["req", "handler", "query"])

    def test_duplicate_nodes_and_edges_deduped(self):
        m = _manifest(TAINTED_NODES, TAINTED_EDGES)
        m["graph"]["nodes"].append(
            {"id": "req", "role": "sink", "kind": "exec"})
        m["graph"]["edges"].append(dict(TAINTED_EDGES[0]))
        v = evaluate(m)
        self.assertEqual(v["counts"]["nodes"], 3)
        self.assertEqual(v["counts"]["edges"], 2)
        self.assertEqual(v["counts"]["sources"], 1)

    def test_edges_to_unknown_nodes_dropped(self):
        m = _manifest(TAINTED_NODES, TAINTED_EDGES)
        m["graph"]["edges"].append(
            {"from": "req", "to": "ghost", "kind": "flows_to"})
        v = evaluate(m)
        self.assertEqual(v["counts"]["edges"], 2)

    def test_unknown_role_defaults_to_transform(self):
        v = evaluate(_manifest(
            [{"id": "inp", "role": "source", "kind": "untrusted_input"},
             {"id": "mid", "role": "weird", "kind": "function"},
             {"id": "run", "role": "sink", "kind": "exec"}],
            [{"from": "inp", "to": "mid", "kind": "flows_to"},
             {"from": "mid", "to": "run", "kind": "flows_to"}]))
        self.assertEqual(v["verdict"], "TAINTED")

    def test_sanitizer_off_path_does_not_cut(self):
        nodes = TAINTED_NODES + [
            {"id": "unused_clean", "role": "sanitizer",
             "kind": "function"}]
        v = evaluate(_manifest(nodes, TAINTED_EDGES))
        self.assertEqual(v["verdict"], "TAINTED")
        self.assertEqual(v["counts"]["sanitizers"], 1)

    def test_missing_graph_rejected(self):
        with self.assertRaises(ValueError):
            evaluate({})

    def test_non_list_nodes_rejected(self):
        with self.assertRaises(ValueError):
            evaluate({"graph": {"nodes": {}, "edges": []}})

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(_manifest(TAINTED_NODES, TAINTED_EDGES))
        self.assertIn("VERDICT: TAINTED", stamp(v))


if __name__ == "__main__":
    unittest.main()
