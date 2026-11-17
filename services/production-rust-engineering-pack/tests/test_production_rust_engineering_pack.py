import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from production_rust_engineering_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "gateway-hot-path",
    "ownership": {"borrow_before_cloning_practised": True,
                  "lifetimes_kept_local": True,
                  "owned_data_at_boundaries_borrows_within": True,
                  "clones_justified_where_present": True},
    "errors": {"error_enums_used_for_fallible_apis": True,
               "thiserror_used_for_library_errors": True,
               "anyhow_used_for_binary_errors": True,
               "question_mark_propagation_used": True,
               "no_unwrap_or_expect_in_production_paths": True,
               "unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages": True},
    "unsafe_policy": {"unsafe_forbidden_by_default_declared": True,
                      "unsafe_isolated_in_dedicated_modules": True},
    "unsafe_blocks": [
        {"location": "ffi::reader::read_raw",
         "invariant_documented": True, "tests_covering_block": True},
        {"location": "ring::buf::as_slice_unchecked",
         "invariant_documented": True, "tests_covering_block": True},
    ],
    "async_runtime": {"structured_tasks_with_tokio_used": True,
                      "blocking_calls_absent_from_async_code": True,
                      "bounded_channels_used": True,
                      "timeouts_applied_everywhere": True},
    "testing": {"unit_tests_beside_code_present": True,
                "integration_tests_in_tests_directory_present": True,
                "doc_tests_for_examples_present": True,
                "error_paths_tested": True,
                "criterion_benchmarks_present": True,
                "tests_green_including_failure_paths": True},
    "tooling": {"clippy_clean_with_deny_warnings": True,
                "cargo_fmt_check_clean": True,
                "lints_fixed_not_silenced_without_reason": True},
    "workspace": {"crates_split_only_at_real_boundaries": True,
                  "feature_flags_kept_minimal_no_default_bloat": True},
    "supply_chain": {"cargo_audit_run": True,
                     "msrv_pinned": True,
                     "new_crates_reviewed_before_adoption": True},
    "red_lines": {"blocking_work_inside_async_present": False,
                  "unbounded_channels_present": False,
                  "spawn_loops_without_backpressure_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "PRODUCTION_RUST_ENGINEERING_PACK_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 37)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["unsafe_blocks_count"], 2)
        self.assertEqual(v["unsafe_blocks_without_invariant"], [])
        self.assertEqual(v["unsafe_blocks_without_tests"], [])
        self.assertEqual(v["documented_coverage"], "1.000000")
        self.assertEqual(v["tested_coverage"], "1.000000")
        self.assertEqual(v["duplicate_unsafe_block_locations"], [])

    def test_empty_unsafe_blocks_list_is_a_valid_declaration(self):
        m = copy.deepcopy(COMPLETE)
        m["unsafe_blocks"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PRODUCTION_RUST_ENGINEERING_PACK_READY")
        self.assertEqual(v["unsafe_blocks_count"], 0)
        self.assertEqual(v["unsafe_blocks_without_invariant"], [])
        self.assertEqual(v["unsafe_blocks_without_tests"], [])
        self.assertIsNone(v["documented_coverage"])
        self.assertIsNone(v["tested_coverage"])
        self.assertEqual(v["duplicate_unsafe_block_locations"], [])
        self.assertEqual(check_status(v, "unsafe_blocks_declared"), "pass")
        self.assertEqual(
            check_status(v, "every_unsafe_block_documents_its_invariant"),
            "pass")

    def test_clone_first_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["ownership"]["borrow_before_cloning_practised"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(v["sections"]["ownership_and_lifetimes"], "fail")
        self.assertEqual(
            check_status(v, "borrow_before_cloning_practised"), "fail")

    def test_unwrap_in_production_paths_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["errors"]["no_unwrap_or_expect_in_production_paths"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "no_unwrap_or_expect_in_production_paths"),
            "fail")

    def test_no_thiserror_for_library_errors_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["errors"]["thiserror_used_for_library_errors"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY")

    def test_undocumented_unsafe_block_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["unsafe_blocks"][0]["invariant_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(
            check_status(
                v, "every_unsafe_block_documents_its_invariant"), "fail")
        self.assertEqual(v["unsafe_blocks_without_invariant"],
                         ["ffi::reader::read_raw"])
        self.assertEqual(v["documented_coverage"], "0.500000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_untested_unsafe_block_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["unsafe_blocks"][1]["tests_covering_block"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_unsafe_block_has_covering_tests"),
            "fail")
        self.assertEqual(v["unsafe_blocks_without_tests"],
                         ["ring::buf::as_slice_unchecked"])
        self.assertEqual(v["tested_coverage"], "0.500000")

    def test_unsafe_block_missing_invariant_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["unsafe_blocks"][0]["invariant_documented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_unsafe_block_documents_its_invariant"),
            "missing")
        self.assertEqual(v["unsafe_blocks_without_invariant"], [])

    def test_duplicate_unsafe_block_location_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["unsafe_blocks"][1]["location"] = "ffi::reader::read_raw"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_unsafe_block_location_duplicated"), "fail")
        self.assertEqual(v["duplicate_unsafe_block_locations"],
                         ["ffi::reader::read_raw"])

    def test_unsafe_block_missing_location_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["unsafe_blocks"][1]["location"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_unsafe_block_location_duplicated"),
            "missing")
        self.assertEqual(v["duplicate_unsafe_block_locations"], [])

    def test_absent_unsafe_blocks_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["unsafe_blocks"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "unsafe_blocks_declared"),
                         "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["unsafe_blocks_count"])
        self.assertIsNone(v["unsafe_blocks_without_invariant"])
        self.assertIsNone(v["unsafe_blocks_without_tests"])
        self.assertIsNone(v["documented_coverage"])
        self.assertIsNone(v["tested_coverage"])
        self.assertIsNone(v["duplicate_unsafe_block_locations"])

    def test_unsafe_not_forbidden_by_default_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["unsafe_policy"]["unsafe_forbidden_by_default_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["unsafe_discipline"], "fail")

    def test_blocking_calls_in_async_fail_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["async_runtime"]["blocking_calls_absent_from_async_code"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(v["sections"]["async_discipline"], "fail")

    def test_unbounded_channels_declaration_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["async_runtime"]["bounded_channels_used"] = False
        self.assertEqual(
            check_status(evaluate(m), "bounded_channels_used"), "fail")

    def test_error_paths_untested_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["error_paths_tested"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(v["sections"]["testing_and_benchmarks"], "fail")

    def test_no_doc_tests_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["doc_tests_for_examples_present"] = False
        self.assertEqual(
            check_status(evaluate(m), "doc_tests_for_examples_present"),
            "fail")

    def test_clippy_warnings_fails_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"]["clippy_clean_with_deny_warnings"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(
            v["sections"]["tooling_workspace_and_supply_chain"], "fail")

    def test_default_feature_bloat_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["workspace"]["feature_flags_kept_minimal_no_default_bloat"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "feature_flags_kept_minimal_no_default_bloat"),
            "fail")

    def test_unpinned_msrv_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["supply_chain"]["msrv_pinned"] = False
        self.assertEqual(
            check_status(evaluate(m), "msrv_pinned"), "fail")

    def test_blocking_work_in_async_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["blocking_work_inside_async_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_blocking_work_inside_async"), "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_unbounded_channels_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unbounded_channels_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_unbounded_channels"), "fail")
        self.assertEqual(v["verdict"],
                         "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY")

    def test_spawn_loops_without_backpressure_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["spawn_loops_without_backpressure_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_spawn_loops_without_backpressure"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["testing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["testing_and_benchmarks"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["unsafe_blocks_count"])
        self.assertIsNone(v["unsafe_blocks_without_invariant"])
        self.assertIsNone(v["unsafe_blocks_without_tests"])
        self.assertIsNone(v["documented_coverage"])
        self.assertIsNone(v["tested_coverage"])
        self.assertIsNone(v["duplicate_unsafe_block_locations"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: PRODUCTION_RUST_ENGINEERING_PACK_READY", stamp(v))

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
            evaluate({"ownership": "should-be-an-object"})
        self.assertIn("ownership", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"unsafe_blocks": {"location": "ffi::x"}})
        self.assertIn("unsafe_blocks", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"unsafe_blocks": ["ffi::x"]})
        self.assertIn("unsafe_blocks[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["error_paths_tested"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("testing.error_paths_tested", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["unsafe_blocks"][0]["location"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("unsafe_blocks[0].location", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["unsafe_blocks"][1]["invariant_documented"] = 7
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("unsafe_blocks[1].invariant_documented",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("tooling", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
