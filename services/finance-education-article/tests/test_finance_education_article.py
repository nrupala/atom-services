import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from finance_education_article import evaluate, stamp  # noqa: E402

READY = {
    "article": "What a yield curve is",
    "topic": "yield curve",
    "structure": {
        "concept_explained": True,
        "framework_taught_not_answer": True,
        "what_to_watch_close_present": True,
        "section_order": ["concept", "worked_example", "what_to_watch"],
    },
    "worked_example": {
        "present": True,
        "steps": [
            {"operation": "subtract", "operands": [5.0, 2.0],
             "declared_result": 3.0},
            {"operation": "multiply", "operands": [1000, 0.03],
             "declared_result": 30.0},
            {"operation": "divide", "operands": [30.0, 1000],
             "declared_result": 0.03},
            {"operation": "add", "operands": [1000, 30.0],
             "declared_result": 1030.0},
        ],
    },
    "signals": {
        "buy_sell_signals_present": False,
        "implied_trade_present": False,
        "trade_execution_present": False,
    },
    "disclosure": {
        "uses_data_or_assumptions": True,
        "assumptions_stated": True,
        "data_dates_stated": True,
        "limits_stated": True,
        "data_as_of": "2026-11-01",
    },
    "review": {
        "education_only_review_passed": True,
        "think_with_finance_voice_confirmed": True,
        "plain_language_review_passed": True,
        "no_hype_confirmed": True,
    },
}


class VerdictTests(unittest.TestCase):
    def test_ready_manifest_is_article_ready(self):
        v = evaluate(copy.deepcopy(READY))
        self.assertEqual(v["verdict"], "ARTICLE_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 19)
        self.assertEqual(v["steps_evaluated"], 4)
        self.assertEqual(v["steps_incomplete"], 0)

    # ---- per-section failure cases ----
    def test_missing_topic_fails_structure(self):
        m = copy.deepcopy(READY)
        m["topic"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_ARTICLE_READY")
        self.assertEqual(v["sections"]["article_structure"], "fail")

    def test_wrong_section_order_fails_structure(self):
        m = copy.deepcopy(READY)
        m["structure"]["section_order"] = [
            "worked_example", "concept", "what_to_watch"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_ARTICLE_READY")
        self.assertEqual(v["sections"]["article_structure"], "fail")

    def test_framework_not_taught_fails_structure(self):
        m = copy.deepcopy(READY)
        m["structure"]["framework_taught_not_answer"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_ARTICLE_READY")
        self.assertEqual(v["sections"]["article_structure"], "fail")

    def test_worked_example_absent_declared_fails(self):
        m = copy.deepcopy(READY)
        m["worked_example"]["present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_ARTICLE_READY")
        self.assertEqual(v["sections"]["worked_example"], "fail")

    def test_worked_example_arithmetic_wrong_fails(self):
        m = copy.deepcopy(READY)
        m["worked_example"]["steps"][1]["declared_result"] = 31.0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_ARTICLE_READY")
        self.assertEqual(v["sections"]["worked_example"], "fail")
        self.assertEqual(v["steps_evaluated"], 4)

    def test_buy_sell_signal_fails_no_signals(self):
        m = copy.deepcopy(READY)
        m["signals"]["buy_sell_signals_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_ARTICLE_READY")
        self.assertEqual(v["sections"]["no_signals"], "fail")

    def test_trade_execution_fails_no_signals(self):
        m = copy.deepcopy(READY)
        m["signals"]["trade_execution_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_ARTICLE_READY")
        self.assertEqual(v["sections"]["no_signals"], "fail")

    def test_unstated_limits_fail_disclosures(self):
        m = copy.deepcopy(READY)
        m["disclosure"]["limits_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_ARTICLE_READY")
        self.assertEqual(v["sections"]["disclosures"], "fail")

    def test_empty_data_as_of_fails_disclosures(self):
        m = copy.deepcopy(READY)
        m["disclosure"]["data_as_of"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_ARTICLE_READY")
        self.assertEqual(v["sections"]["disclosures"], "fail")

    def test_no_data_or_assumptions_passes_disclosures_as_na(self):
        m = copy.deepcopy(READY)
        m["disclosure"] = {"uses_data_or_assumptions": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ARTICLE_READY")
        self.assertEqual(v["sections"]["disclosures"], "pass")

    def test_hype_not_cleared_fails_review(self):
        m = copy.deepcopy(READY)
        m["review"]["no_hype_confirmed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_ARTICLE_READY")
        self.assertEqual(v["sections"]["review"], "fail")

    # ---- missing / incomplete evidence ----
    def test_step_missing_declared_result_is_insufficient(self):
        m = copy.deepcopy(READY)
        del m["worked_example"]["steps"][0]["declared_result"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["worked_example"],
                         "insufficient_evidence")
        self.assertEqual(v["steps_evaluated"], 3)
        self.assertEqual(v["steps_incomplete"], 1)

    def test_division_by_zero_step_is_incomplete(self):
        m = copy.deepcopy(READY)
        m["worked_example"]["steps"][2]["operands"] = [30.0, 0]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["steps_incomplete"], 1)

    def test_unknown_operation_step_is_incomplete(self):
        m = copy.deepcopy(READY)
        m["worked_example"]["steps"][0]["operation"] = "compound"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["steps_incomplete"], 1)

    def test_no_steps_declared_is_insufficient(self):
        m = copy.deepcopy(READY)
        del m["worked_example"]["steps"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["steps_evaluated"], 0)

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(READY)
        del m["review"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["review"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["steps_evaluated"], 0)
        self.assertEqual(v["steps_incomplete"], 0)

    def test_sparse_manifest_is_insufficient_evidence(self):
        v = evaluate({"article": "Draft", "topic": "yield curve"})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(READY))
        self.assertIn("VERDICT: ARTICLE_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong JSON
    type is rejected with TypeError naming the field — never
    evaluated into a verdict."""

    def test_topic_as_number_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"topic": 123})
        self.assertIn("topic", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"structure": "not_an_object"})
        self.assertIn("structure", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["signals"]["buy_sell_signals_present"] = "no"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("signals.buy_sell_signals_present",
                      str(ctx.exception))

    def test_section_order_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["structure"]["section_order"] = "concept,worked_example"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("structure.section_order", str(ctx.exception))

    def test_section_order_entry_as_number_rejected(self):
        m = copy.deepcopy(READY)
        m["structure"]["section_order"] = ["concept", 2, "what_to_watch"]
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("structure.section_order[1]", str(ctx.exception))

    def test_steps_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["worked_example"]["steps"] = "not-a-list"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("worked_example.steps", str(ctx.exception))

    def test_operand_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["worked_example"]["steps"][0]["operands"] = [5.0, "2"]
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("worked_example.steps[0].operands[1]",
                      str(ctx.exception))

    def test_declared_result_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["worked_example"]["steps"][0]["declared_result"] = "3.0"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("worked_example.steps[0].declared_result",
                      str(ctx.exception))

    def test_boolean_as_number_rejected(self):
        m = copy.deepcopy(READY)
        m["worked_example"]["steps"][0]["declared_result"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("worked_example.steps[0].declared_result",
                      str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(READY)
        m["disclosure"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("disclosure", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
