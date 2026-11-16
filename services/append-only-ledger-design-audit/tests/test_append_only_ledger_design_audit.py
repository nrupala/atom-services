import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from append_only_ledger_design_audit import evaluate, stamp  # noqa: E402

SOUND = {
    "ledger_name": "example-ledger",
    "version": "1.0.0",
    "append_only": {
        "events_immutable": True,
        "update_on_posted_entries": False,
        "delete_on_posted_entries": False,
        "no_mutation_paths_verified": True,
        "correction_model": "reversing_entry",
        "corrections_reference_original": True,
        "retention_and_legal_holds": True,
    },
    "money": {
        "moves_money": True,
        "double_entry": True,
        "transaction_sum_zero": True,
        "amount_representation": "integer_minor_units",
        "currency_explicit_per_entry": True,
        "fx_rates_recorded_at_event_time": True,
    },
    "structure": {
        "accounts_entries_transactions": True,
        "transactions_atomic": True,
        "stable_ids": True,
        "event_fields": ["timestamp", "actor", "source"],
    },
    "derived_state": {
        "balances_are_projections": True,
        "projections_recomputable": True,
        "checkpoint_hashes": True,
    },
    "reconciliation": {
        "cadence": "monthly",
        "discrepancy_workflow_recorded": True,
        "unreconciled_period_closed_silently": False,
    },
    "reporting": {
        "audit_queries_who_what_when_why": True,
        "tax_ready_exports": True,
    },
    "security": {"encryption_at_rest": True, "scoped_access": True},
    "recovery": {"restore_drill_done": True,
                 "restore_replay_verified": True},
    "tests": {"balance_invariant_tests": True},
}


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))

    def test_update_on_posted_entries_is_a_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["append_only"]["update_on_posted_entries"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["append_only"], "fail")

    def test_delete_on_posted_entries_fails(self):
        m = copy.deepcopy(SOUND)
        m["append_only"]["delete_on_posted_entries"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["append_only"], "fail")

    def test_edit_in_place_correction_model_fails(self):
        m = copy.deepcopy(SOUND)
        m["append_only"]["correction_model"] = "edit_in_place"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["append_only"], "fail")

    def test_float_money_is_a_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["money"]["amount_representation"] = "float"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["money_discipline"], "fail")

    def test_exact_decimal_money_passes(self):
        m = copy.deepcopy(SOUND)
        m["money"]["amount_representation"] = "exact_decimal"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")

    def test_single_entry_when_money_moves_fails(self):
        m = copy.deepcopy(SOUND)
        m["money"]["double_entry"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["money_discipline"], "fail")

    def test_no_money_movement_makes_double_entry_not_applicable(self):
        m = copy.deepcopy(SOUND)
        m["money"]["moves_money"] = False
        del m["money"]["double_entry"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")

    def test_event_missing_actor_field_fails(self):
        m = copy.deepcopy(SOUND)
        m["structure"]["event_fields"] = ["timestamp", "source"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["structure_and_derivation"],
                         "fail")

    def test_silently_closed_unreconciled_period_is_a_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["reconciliation"]["unreconciled_period_closed_silently"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(
            v["sections"]["reconciliation_and_reporting"], "fail")

    def test_missing_checkpoint_hashes_fails_tamper_evidence(self):
        m = copy.deepcopy(SOUND)
        m["derived_state"]["checkpoint_hashes"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["recovery"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["security_and_recovery"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND))
        text = stamp(v)
        self.assertIn("VERDICT: SOUND", text)
        self.assertIn("append_only", text)

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict.
    The first case mirrors the recorded external malformed input."""

    def test_recorded_malformed_case_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"ledger_name": "Malformed Ledger",
                      "version": "1.0.0",
                      "append_only": "should_be_an_object"})
        self.assertIn("append_only", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"append_only": "should_be_an_object"})
        self.assertIn("append_only", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["append_only"]["events_immutable"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("append_only.events_immutable", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["structure"]["event_fields"] = "timestamp"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("structure.event_fields", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["structure"]["event_fields"] = ["timestamp", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("structure.event_fields[1]", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SOUND)
        m["money"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("money", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
