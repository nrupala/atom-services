import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from system_design_failure_mode_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "design_name": "notification-system-no-duplicates",
    "design_context": {"requirement_stated": True, "data_flow_described": True,
                       "analysis_performed_before_build": True,
                       "component_boundaries_clear": True,
                       "single_responsibility_per_component_declared": True,
                       "loose_coupling_declared": True,
                       "layer_failure_independence_declared": True},
    "components": [
        {"component_id": "comp-1", "responsibility": "Accept send requests",
         "contract_declared": True},
        {"component_id": "comp-2", "responsibility": "Deliver notifications",
         "contract_declared": True},
    ],
    "failure_modes": [
        {"failure_id": "fm-1", "component_id": "comp-1",
         "failure_mode": "Duplicate request accepted on retry",
         "effect": "Duplicate notification sent", "severity": 8,
         "occurrence": 3, "detection": 4, "rpn_declared": 96,
         "mitigation_id": "mit-1"},
        {"failure_id": "fm-2", "component_id": "comp-2",
         "failure_mode": "Delivery worker crashes mid-send",
         "effect": "Notification lost", "severity": 9,
         "occurrence": 2, "detection": 5, "rpn_declared": 90,
         "mitigation_id": "mit-2"},
    ],
    "mitigations": [
        {"mitigation_id": "mit-1", "description": "Idempotency key per request",
         "residual_risk_stated": True},
        {"mitigation_id": "mit-2", "description": "At-least-once queue with dead letters",
         "residual_risk_stated": True},
    ],
    "mitigation_work": {"mitigations_considered_before_build": True,
                        "residual_risk_acceptance_stated": True},
    "state_and_reliability": {
        "source_of_truth_identified": True,
        "distributed_state_minimized_declared": True,
        "idempotency_for_retryable_operations_declared": True,
        "cap_tradeoffs_stated_explicitly": True,
        "timeouts_declared": True, "retries_with_jitter_declared": True,
        "circuit_breakers_declared": True,
        "graceful_degradation_declared": True,
        "readiness_vs_liveness_distinguished": True,
        "slow_unreliable_work_behind_queue_declared": True},
    "queues": {"queues_used": True,
               "at_least_once_delivery_with_idempotent_consumers_declared": True,
               "queue_backpressure_declared": True,
               "dead_letter_handling_declared": True},
    "observability_scaling_security": {
        "structured_logs_declared": True, "metrics_declared": True,
        "traces_declared": True,
        "bottleneck_identified_before_scaling": True,
        "measure_before_scaling_declared": True,
        "stateless_horizontal_scaling_where_scaled_declared": True,
        "zero_trust_boundaries_declared": True,
        "least_privilege_declared": True,
        "secrets_management_declared": True,
        "external_trust_boundary_stated": True},
    "caching": {"caching_used": True, "cache_invalidation_stated": True},
    "red_lines": {"distributed_monolith_present": False,
                  "shared_mutable_state_present": False,
                  "retries_without_idempotency_or_backpressure_present": False,
                  "design_without_observability_present": False,
                  "premature_microservices_present": False,
                  "strong_consistency_assumed_without_tradeoff_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "FAILURE_MODE_PACK_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 56)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["failure_mode_components_count"], 2)
        self.assertEqual(v["failure_modes_count"], 2)
        self.assertEqual(v["failure_mode_mitigations_count"], 2)
        self.assertEqual(v["duplicate_failure_mode_component_ids"], [])
        self.assertEqual(v["duplicate_failure_mode_ids"], [])
        self.assertEqual(v["duplicate_failure_mode_mitigation_ids"], [])
        self.assertEqual(v["component_contract_ratio"], "1.000000")
        self.assertEqual(v["component_failure_coverage_ratio"], "1.000000")
        self.assertEqual(v["rpn_recompute_ratio"], "1.000000")
        self.assertEqual(v["mitigation_resolution_ratio"], "1.000000")

    def test_requirement_not_stated_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["design_context"]["requirement_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FAILURE_MODE_PACK_NOT_SOUND")
        self.assertEqual(v["sections"]["design_framing_and_boundaries"], "fail")
        self.assertEqual(check_status(v, "failure_mode_pack_requirement_stated"), "fail")

    def test_duplicate_component_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][1]["component_id"] = "comp-1"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_failure_mode_pack_component_id_unique"), "fail")
        self.assertEqual(v["duplicate_failure_mode_component_ids"], ["comp-1"])

    def test_empty_responsibility_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][0]["responsibility"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_failure_mode_pack_component_responsibility_declared"), "fail")
        self.assertEqual(v["failure_mode_components_without_responsibility"], ["comp-1"])

    def test_component_without_contract_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][1]["contract_declared"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_failure_mode_pack_component_contract_declared"), "fail")
        self.assertEqual(v["failure_mode_components_without_contract"], ["comp-2"])
        self.assertEqual(v["component_contract_ratio"], "0.500000")

    def test_absent_components_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["components"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "failure_mode_pack_components_list_declared"), "missing")
        self.assertIsNone(v["failure_mode_components_count"])
        self.assertIsNone(v["computed_status"])

    def test_empty_failure_modes_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "failure_mode_pack_failure_modes_list_declared"), "fail")
        self.assertEqual(v["failure_modes_count"], 0)

    def test_failure_with_unknown_component_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][0]["component_id"] = "comp-99"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_failure_mode_pack_failure_component_referenced"), "fail")
        self.assertEqual(v["failure_modes_with_unknown_component_reference"], ["fm-1"])

    def test_component_without_failure_mode_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][1]["component_id"] = "comp-1"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_failure_mode_pack_component_covered_by_failure_mode"), "fail")
        self.assertEqual(v["failure_mode_components_without_failure_mode"], ["comp-2"])
        self.assertEqual(v["component_failure_coverage_ratio"], "0.500000")

    def test_rpn_mismatch_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][0]["rpn_declared"] = 95
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_failure_mode_pack_failure_rpn_recomputes"), "fail")
        self.assertEqual(v["failure_modes_with_rpn_mismatch"], ["fm-1"])
        self.assertEqual(v["rpn_recompute_ratio"], "0.500000")

    def test_nonpositive_rating_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][0]["severity"] = 0
        m["failure_modes"][0]["rpn_declared"] = 0
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_failure_mode_pack_failure_ratings_positive"), "fail")
        self.assertEqual(v["failure_modes_with_nonpositive_rating"], ["fm-1"])

    def test_failure_missing_severity_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["failure_modes"][0]["severity"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_failure_mode_pack_failure_ratings_positive"), "missing")

    def test_empty_effect_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][1]["effect"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_failure_mode_pack_failure_effect_declared"), "fail")
        self.assertEqual(v["failure_modes_without_effect"], ["fm-2"])

    def test_unknown_mitigation_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][0]["mitigation_id"] = "mit-99"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_failure_mode_pack_failure_mitigation_referenced"), "fail")
        self.assertEqual(v["failure_modes_with_unknown_mitigation_reference"], ["fm-1"])
        self.assertEqual(v["mitigation_resolution_ratio"], "0.500000")

    def test_mitigation_without_residual_risk_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["mitigations"][1]["residual_risk_stated"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_failure_mode_pack_mitigation_residual_risk_stated"), "fail")
        self.assertEqual(v["failure_mode_mitigations_without_residual_risk"], ["mit-2"])

    def test_timeouts_not_declared_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["state_and_reliability"]["timeouts_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["state_reliability_and_queues"], "fail")

    def test_queue_without_backpressure_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["queues"]["queue_backpressure_declared"] = False
        self.assertEqual(check_status(evaluate(m), "failure_mode_pack_queue_backpressure_declared_where_queues_used"), "fail")

    def test_no_queues_passes_queue_gates_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["queues"]["queues_used"] = False
        m["queues"]["queue_backpressure_declared"] = False
        m["queues"]["dead_letter_handling_declared"] = False
        m["queues"]["at_least_once_delivery_with_idempotent_consumers_declared"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "failure_mode_pack_queue_backpressure_declared_where_queues_used"), "pass")
        self.assertEqual(v["verdict"], "FAILURE_MODE_PACK_SOUND")

    def test_cache_without_invalidation_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["caching"]["cache_invalidation_stated"] = False
        self.assertEqual(check_status(evaluate(m), "failure_mode_pack_cache_invalidation_stated_where_caching_used"), "fail")

    def test_no_caching_passes_cache_gate_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["caching"]["caching_used"] = False
        m["caching"]["cache_invalidation_stated"] = False
        self.assertEqual(check_status(evaluate(m), "failure_mode_pack_cache_invalidation_stated_where_caching_used"), "pass")

    def test_distributed_monolith_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["distributed_monolith_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "FAILURE_MODE_PACK_NOT_SOUND")

    def test_shared_mutable_state_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["shared_mutable_state_present"] = True
        self.assertEqual(check_status(evaluate(m), "failure_mode_pack_free_of_shared_mutable_state"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["state_and_reliability"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["state_reliability_and_queues"], "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["failure_modes_count"])
        self.assertIsNone(v["rpn_recompute_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: FAILURE_MODE_PACK_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["design_name"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("design_name", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"design_context": "should-be-an-object"})
        self.assertIn("design_context", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"components": {"component_id": "comp-1"}})
        self.assertIn("components", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"failure_modes": ["fm-1"]})
        self.assertIn("failure_modes[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["state_and_reliability"]["timeouts_declared"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("state_and_reliability.timeouts_declared", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][0]["severity"] = "high"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("failure_modes[0].severity", str(ctx.exception))

    def test_number_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][0]["occurrence"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("failure_modes[0].occurrence", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["queues"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("queues", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
