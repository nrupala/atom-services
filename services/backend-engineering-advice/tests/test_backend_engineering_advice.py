import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from backend_engineering_advice import evaluate, stamp  # noqa: E402

COMPLETE = {
    "system": "billing-api",
    "contract": {"defined_before_code": True,
                 "inputs_defined": True,
                 "outputs_defined": True,
                 "errors_defined": True,
                 "versioned": True,
                 "kept_in_repo": True},
    "validation": {"at_boundaries": True,
                   "rejects_bad_input_early_with_specific_errors": True,
                   "clients_trusted": False},
    "idempotency": {"mutating_operation_count": 4,
                    "keys_on_mutating_operations": True,
                    "double_sends_possible": False,
                    "double_charges_possible": False,
                    "behavior_verified": True},
    "errors": {"taxonomy_structured": True,
               "taxonomy_consistent": True,
               "categories_covered": ["validation", "not_found",
                                      "conflict", "retryable", "fatal"],
               "validation_and_error_paths_tested": True,
               "silent_catch_all_present": False},
    "jobs": {"has_async_jobs": True,
             "retries_with_backoff_and_jitter": True,
             "dead_letter_path_present": True,
             "work_can_be_lost": False,
             "status_observable": True},
    "data": {"has_migrations": True,
             "migrations_reversible": True,
             "migrations_backed_up": False,
             "migrations_reviewed_before_live_data": True,
             "constraints_enforced_in_database": True,
             "plaintext_secrets_at_rest": False,
             "direct_to_prod_changes": False},
    "observability": {"structured_logs_with_ids_and_timings": True,
                      "metrics_at_edges": True,
                      "trace_ids_propagated": True,
                      "secrets_in_logs": False,
                      "pii_in_logs": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_production_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "PRODUCTION_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 32)
        self.assertEqual(v["taxonomy_categories_missing"], [])
        self.assertEqual(v["mutating_operation_count"], 4)

    def test_contract_not_versioned_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contract"]["versioned"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_PRODUCTION_READY")
        self.assertEqual(v["sections"]["contract_first"], "fail")

    def test_contract_defined_after_code_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contract"]["defined_before_code"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_PRODUCTION_READY")

    def test_clients_trusted_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["validation"]["clients_trusted"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_PRODUCTION_READY")
        self.assertEqual(v["sections"]["boundary_validation"], "fail")

    def test_mutating_operations_without_keys_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["idempotency"]["keys_on_mutating_operations"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_PRODUCTION_READY")
        self.assertEqual(
            check_status(v, "idempotency_keys_on_mutating_operations"),
            "fail")

    def test_zero_mutating_operations_passes_keys_as_not_applicable(self):
        m = copy.deepcopy(COMPLETE)
        m["idempotency"]["mutating_operation_count"] = 0
        del m["idempotency"]["keys_on_mutating_operations"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PRODUCTION_READY")
        self.assertEqual(v["mutating_operation_count"], 0)

    def test_mutating_operations_with_keys_undeclared_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["idempotency"]["keys_on_mutating_operations"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "idempotency_keys_on_mutating_operations"),
            "missing")

    def test_missing_mutating_count_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["idempotency"]["mutating_operation_count"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["mutating_operation_count"])

    def test_double_charge_possible_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["idempotency"]["double_charges_possible"] = True
        self.assertEqual(evaluate(m)["verdict"], "NOT_PRODUCTION_READY")

    def test_double_send_possible_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["idempotency"]["double_sends_possible"] = True
        self.assertEqual(evaluate(m)["verdict"], "NOT_PRODUCTION_READY")

    def test_taxonomy_missing_a_category_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["errors"]["categories_covered"] = [
            "validation", "not_found", "conflict", "retryable"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_PRODUCTION_READY")
        self.assertEqual(v["taxonomy_categories_missing"], ["fatal"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_taxonomy_empty_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["errors"]["categories_covered"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_PRODUCTION_READY")
        self.assertEqual(v["taxonomy_categories_missing"],
                         ["validation", "not_found", "conflict",
                          "retryable", "fatal"])

    def test_taxonomy_extra_categories_still_pass(self):
        m = copy.deepcopy(COMPLETE)
        m["errors"]["categories_covered"].append("rate_limited")
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PRODUCTION_READY")
        self.assertEqual(v["taxonomy_categories_missing"], [])

    def test_missing_taxonomy_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["errors"]["categories_covered"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["taxonomy_categories_missing"])
        self.assertIsNone(v["computed_status"])

    def test_silent_catch_all_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["errors"]["silent_catch_all_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_PRODUCTION_READY")
        self.assertEqual(v["sections"]["error_taxonomy"], "fail")

    def test_error_paths_untested_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["errors"]["validation_and_error_paths_tested"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_PRODUCTION_READY")

    def test_no_async_jobs_passes_job_checks_as_not_applicable(self):
        m = copy.deepcopy(COMPLETE)
        m["jobs"] = {"has_async_jobs": False}
        self.assertEqual(evaluate(m)["verdict"], "PRODUCTION_READY")

    def test_jobs_without_dead_letter_path_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["jobs"]["dead_letter_path_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_PRODUCTION_READY")
        self.assertEqual(v["sections"]["jobs_and_queues"], "fail")

    def test_lost_work_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["jobs"]["work_can_be_lost"] = True
        self.assertEqual(evaluate(m)["verdict"], "NOT_PRODUCTION_READY")

    def test_job_gate_absent_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["jobs"]["has_async_jobs"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["jobs_and_queues"],
                         "insufficient_evidence")

    def test_migrations_backed_up_but_not_reversible_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["migrations_reversible"] = False
        m["data"]["migrations_backed_up"] = True
        self.assertEqual(evaluate(m)["verdict"], "PRODUCTION_READY")

    def test_migrations_neither_reversible_nor_backed_up_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["migrations_reversible"] = False
        m["data"]["migrations_backed_up"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_PRODUCTION_READY")
        self.assertEqual(
            check_status(v, "migrations_reversible_or_backed_up"),
            "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_migrations_reversibility_undeclared_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["data"]["migrations_reversible"]
        del m["data"]["migrations_backed_up"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "migrations_reversible_or_backed_up"),
            "missing")

    def test_no_migrations_passes_migration_checks_as_not_applicable(self):
        m = copy.deepcopy(COMPLETE)
        m["data"] = {"has_migrations": False,
                     "constraints_enforced_in_database": True,
                     "plaintext_secrets_at_rest": False,
                     "direct_to_prod_changes": False}
        self.assertEqual(evaluate(m)["verdict"], "PRODUCTION_READY")

    def test_unreviewed_migrations_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["migrations_reviewed_before_live_data"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_PRODUCTION_READY")

    def test_plaintext_secrets_at_rest_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["plaintext_secrets_at_rest"] = True
        self.assertEqual(evaluate(m)["verdict"], "NOT_PRODUCTION_READY")

    def test_direct_to_prod_changes_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["direct_to_prod_changes"] = True
        self.assertEqual(evaluate(m)["verdict"], "NOT_PRODUCTION_READY")

    def test_constraints_only_in_app_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["constraints_enforced_in_database"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_PRODUCTION_READY")

    def test_secrets_in_logs_fail_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["observability"]["secrets_in_logs"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_PRODUCTION_READY")
        self.assertEqual(v["sections"]["observability"], "fail")

    def test_pii_in_logs_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["observability"]["pii_in_logs"] = True
        self.assertEqual(evaluate(m)["verdict"], "NOT_PRODUCTION_READY")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["observability"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["observability"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["taxonomy_categories_missing"])
        self.assertIsNone(v["mutating_operation_count"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: PRODUCTION_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["system"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("system", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"contract": "should-be-an-object"})
        self.assertIn("contract", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["errors"]["categories_covered"] = "validation"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("errors.categories_covered", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["errors"]["categories_covered"] = ["validation", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("errors.categories_covered[1]",
                      str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["contract"]["versioned"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("contract.versioned", str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["idempotency"]["mutating_operation_count"] = "four"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("idempotency.mutating_operation_count",
                      str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["idempotency"]["mutating_operation_count"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("idempotency.mutating_operation_count",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["data"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("data", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
