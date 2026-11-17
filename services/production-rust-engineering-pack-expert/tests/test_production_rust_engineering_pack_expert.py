import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from production_rust_engineering_pack_expert import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "guardian-mesh-core",
    "lifetime_design": {
        "lifetimes_modelled_deliberately_at_api_boundaries": True,
        "lifetime_annotation_sprawl_treated_as_layout_signal": True,
        "structs_split_when_lifetimes_tangle": True,
        "index_handles_or_arenas_used_for_tangled_graphs": True,
        "borrow_checker_fights_resolved_by_restructuring": True,
        "crate_dependency_graph_acyclic_and_boundaries_clean": True},
    "type_design": {
        "newtypes_wrap_domain_primitives": True,
        "state_machines_modelled_with_enums": True,
        "from_into_conversions_for_value_crossings": True,
        "builder_pattern_for_complex_construction": True,
        "trait_boundaries_chosen_over_premature_generics": True,
        "impl_vs_dyn_trait_choice_made_consciously": True,
        "error_values_carry_context_at_boundaries": True},
    "async_depth": {
        "blocking_work_offloaded_via_spawn_blocking": True,
        "send_sync_bounds_checked_for_spawned_futures": True,
        "mpsc_and_oneshot_channels_assigned_by_purpose": True,
        "cancellation_modelled_explicitly_in_async_flows": True},
    "performance": {
        "flamegraphs_captured_before_optimizing": True,
        "criterion_results_gate_optimization_claims": True,
        "str_borrows_preferred_over_owned_strings": True,
        "iterators_preferred_over_manual_loops": True,
        "cow_used_for_maybe_owned_data": True,
        "smallvec_used_where_small_sizes_dominate": True},
    "unsafe_ffi": {
        "unsafe_surface_encapsulated_behind_safe_api": True,
        "wasm_sandboxing_via_wasm_bindgen_for_untrusted_code": True},
    "ffi_bindings": [
        {"name": "pae::gemm_f64", "safe_wrapper_present": True,
         "safety_comment_present": True, "miri_tested": True},
        {"name": "pae::syrk_f64", "safe_wrapper_present": True,
         "safety_comment_present": True, "miri_tested": True},
    ],
    "crypto": {
        "vetted_crypto_crates_only_rustcrypto_or_ring": True,
        "secrets_zeroized_after_use": True,
        "constant_time_comparison_for_timing_sensitive_checks": True},
    "expert_red_lines": {
        "reflexive_clone_rc_dodge_present": False,
        "premature_unsafe_present": False,
        "homemade_crypto_present": False,
        "lifetime_soup_papered_over_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            v["verdict"], "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 37)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["ffi_bindings_count"], 2)
        self.assertEqual(v["ffi_bindings_without_safe_wrapper"], [])
        self.assertEqual(v["ffi_bindings_without_safety_comment"], [])
        self.assertEqual(v["ffi_bindings_without_miri"], [])
        self.assertEqual(v["safe_wrapper_coverage"], "1.000000")
        self.assertEqual(v["safety_comment_coverage"], "1.000000")
        self.assertEqual(v["miri_coverage"], "1.000000")
        self.assertEqual(v["duplicate_ffi_binding_names"], [])

    def test_empty_ffi_bindings_list_is_a_valid_declaration(self):
        m = copy.deepcopy(COMPLETE)
        m["ffi_bindings"] = []
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY")
        self.assertEqual(v["ffi_bindings_count"], 0)
        self.assertIsNone(v["safe_wrapper_coverage"])
        self.assertIsNone(v["miri_coverage"])
        self.assertEqual(check_status(v, "ffi_bindings_declared"), "pass")
        self.assertEqual(
            check_status(v, "every_ffi_binding_tested_under_miri"), "pass")

    def test_lifetime_soup_annotated_over_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["lifetime_design"][
            "lifetime_annotation_sprawl_treated_as_layout_signal"] = False
        v = evaluate(m)
        self.assertEqual(
            v["verdict"],
            "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY")
        self.assertEqual(v["sections"]["lifetime_architecture_depth"],
                         "fail")

    def test_cyclic_crate_graph_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["lifetime_design"][
            "crate_dependency_graph_acyclic_and_boundaries_clean"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "crate_dependency_graph_acyclic_and_boundaries_clean"),
            "fail")

    def test_bare_primitives_fail_type_design(self):
        m = copy.deepcopy(COMPLETE)
        m["type_design"]["newtypes_wrap_domain_primitives"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["type_system_and_api_design"],
                         "fail")

    def test_unconscious_dyn_choice_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["type_design"]["impl_vs_dyn_trait_choice_made_consciously"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "impl_vs_dyn_trait_choice_made_consciously"),
            "fail")

    def test_blocking_without_spawn_blocking_fails_async_depth(self):
        m = copy.deepcopy(COMPLETE)
        m["async_depth"]["blocking_work_offloaded_via_spawn_blocking"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["async_runtime_depth"], "fail")

    def test_unmodelled_cancellation_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["async_depth"][
            "cancellation_modelled_explicitly_in_async_flows"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "cancellation_modelled_explicitly_in_async_flows"),
            "fail")

    def test_optimizing_without_flamegraph_fails_performance(self):
        m = copy.deepcopy(COMPLETE)
        m["performance"]["flamegraphs_captured_before_optimizing"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["performance_measurement_and_allocation"],
            "fail")

    def test_owned_strings_everywhere_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["performance"]["str_borrows_preferred_over_owned_strings"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "str_borrows_preferred_over_owned_strings"),
            "fail")

    def test_binding_without_safe_wrapper_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["ffi_bindings"][0]["safe_wrapper_present"] = False
        v = evaluate(m)
        self.assertEqual(
            v["verdict"],
            "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY")
        self.assertEqual(
            check_status(v, "every_ffi_binding_exposes_safe_wrapper"),
            "fail")
        self.assertEqual(v["ffi_bindings_without_safe_wrapper"],
                         ["pae::gemm_f64"])
        self.assertEqual(v["safe_wrapper_coverage"], "0.500000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_binding_without_safety_comment_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["ffi_bindings"][1]["safety_comment_present"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_ffi_binding_carries_safety_comment"),
            "fail")
        self.assertEqual(v["ffi_bindings_without_safety_comment"],
                         ["pae::syrk_f64"])
        self.assertEqual(v["safety_comment_coverage"], "0.500000")

    def test_binding_not_miri_tested_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["ffi_bindings"][0]["miri_tested"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_ffi_binding_tested_under_miri"),
            "fail")
        self.assertEqual(v["ffi_bindings_without_miri"], ["pae::gemm_f64"])
        self.assertEqual(v["miri_coverage"], "0.500000")

    def test_binding_missing_miri_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["ffi_bindings"][0]["miri_tested"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_ffi_binding_tested_under_miri"),
            "missing")
        self.assertEqual(v["ffi_bindings_without_miri"], [])

    def test_duplicate_binding_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["ffi_bindings"][1]["name"] = "pae::gemm_f64"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_ffi_binding_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_ffi_binding_names"],
                         ["pae::gemm_f64"])

    def test_binding_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["ffi_bindings"][1]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_ffi_binding_name_duplicated"), "missing")
        self.assertEqual(v["duplicate_ffi_binding_names"], [])

    def test_absent_ffi_bindings_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["ffi_bindings"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "ffi_bindings_declared"),
                         "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["ffi_bindings_count"])
        self.assertIsNone(v["ffi_bindings_without_safe_wrapper"])
        self.assertIsNone(v["safe_wrapper_coverage"])
        self.assertIsNone(v["duplicate_ffi_binding_names"])

    def test_unvetted_crypto_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["crypto"]["vetted_crypto_crates_only_rustcrypto_or_ring"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["cryptography_and_secret_handling"], "fail")

    def test_secrets_not_zeroized_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["crypto"]["secrets_zeroized_after_use"] = False
        self.assertEqual(
            check_status(evaluate(m), "secrets_zeroized_after_use"),
            "fail")

    def test_reflexive_clone_rc_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_red_lines"]["reflexive_clone_rc_dodge_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "expert_no_reflexive_clone_rc_dodge"),
            "fail")
        self.assertEqual(v["sections"]["expert_red_lines"], "fail")

    def test_homemade_crypto_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_red_lines"]["homemade_crypto_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "expert_no_homemade_crypto"), "fail")
        self.assertEqual(
            v["verdict"],
            "PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_NOT_READY")

    def test_premature_unsafe_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_red_lines"]["premature_unsafe_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "expert_no_premature_unsafe"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["performance"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["performance_measurement_and_allocation"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["ffi_bindings_count"])
        self.assertIsNone(v["ffi_bindings_without_safe_wrapper"])
        self.assertIsNone(v["ffi_bindings_without_safety_comment"])
        self.assertIsNone(v["ffi_bindings_without_miri"])
        self.assertIsNone(v["safe_wrapper_coverage"])
        self.assertIsNone(v["safety_comment_coverage"])
        self.assertIsNone(v["miri_coverage"])
        self.assertIsNone(v["duplicate_ffi_binding_names"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: PRODUCTION_RUST_ENGINEERING_PACK_EXPERT_READY",
            stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["project"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("project", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"lifetime_design": "should-be-an-object"})
        self.assertIn("lifetime_design", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"ffi_bindings": {"name": "pae::x"}})
        self.assertIn("ffi_bindings", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"ffi_bindings": ["pae::x"]})
        self.assertIn("ffi_bindings[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["crypto"]["secrets_zeroized_after_use"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("crypto.secrets_zeroized_after_use",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["ffi_bindings"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("ffi_bindings[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["ffi_bindings"][1]["miri_tested"] = 7
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("ffi_bindings[1].miri_tested", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["performance"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("performance", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
