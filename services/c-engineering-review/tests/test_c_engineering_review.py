import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from c_engineering_review import evaluate, stamp  # noqa: E402

COMPLETE = {
    "subject": "ring-buffer.c diff, parser hardening",
    "memory": {"one_owner_per_allocation": True,
               "freed_on_same_path_as_allocation": True,
               "ownership_documented_in_headers": True,
               "caller_supplied_buffers_preferred": True,
               "ownership_documented_for_outliving_pointers": True},
    "undefined_behavior": {"integer_overflow_addressed": True,
                           "strict_aliasing_respected": True,
                           "uninitialized_reads_avoided": True,
                           "signed_shifts_checked": True,
                           "sequence_point_traps_avoided": True,
                           "ub_shortcuts_used": False},
    "warnings": {"warnings_treated_as_errors": True,
                 "warning_count": 0},
    "bounds": {"sized_apis_used": True,
               "lengths_validated_at_boundaries": True,
               "unbounded_operations_in_diff": False,
               "banned_calls": []},
    "sanitizers": {"asan_enabled_in_test_builds": True,
                   "ubsan_enabled_in_test_builds": True,
                   "asan_ubsan_clean_on_suite": True,
                   "valgrind_used_for_leaks": True,
                   "parsers_fuzzed": True,
                   "static_analysis_run": True,
                   "static_analysis_findings_treated_as_bugs": True},
    "portability": {"fixed_width_types_used": True,
                    "compiler_extensions_isolated": True,
                    "tested_on_target_platforms": True},
    "build_and_test": {"build_system_pinned": True,
                       "unit_tests_at_function_boundaries": True,
                       "integration_tests_at_edges": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_review_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "REVIEW_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 30)
        self.assertEqual(v["warning_count"], 0)
        self.assertEqual(v["banned_calls_found"], [])

    def test_warnings_present_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["warnings"]["warning_count"] = 3
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["warnings_and_build"], "fail")
        self.assertEqual(check_status(v, "zero_warnings_maintained"),
                         "fail")
        self.assertEqual(v["warning_count"], 3)
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_negative_warning_count_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["warnings"]["warning_count"] = -1
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_missing_warning_count_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["warnings"]["warning_count"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "zero_warnings_maintained"),
                         "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["warning_count"])

    def test_warnings_not_treated_as_errors_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["warnings"]["warnings_treated_as_errors"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["warnings_and_build"], "fail")

    def test_banned_call_present_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["bounds"]["banned_calls"] = ["strcpy"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["bounds_and_strings"], "fail")
        self.assertEqual(check_status(v, "no_banned_functions_present"),
                         "fail")
        self.assertEqual(v["banned_calls_found"], ["strcpy"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_banned_calls_found_reported_in_skill_order(self):
        m = copy.deepcopy(COMPLETE)
        m["bounds"]["banned_calls"] = ["unchecked_scanf", "gets",
                                       "sprintf"]
        v = evaluate(m)
        self.assertEqual(v["banned_calls_found"],
                         ["gets", "sprintf", "unchecked_scanf"])

    def test_unknown_calls_do_not_count_as_banned(self):
        m = copy.deepcopy(COMPLETE)
        m["bounds"]["banned_calls"] = ["memcpy", "snprintf", "strncpy"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_SOUND")
        self.assertEqual(v["banned_calls_found"], [])

    def test_missing_banned_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["bounds"]["banned_calls"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["banned_calls_found"])
        self.assertIsNone(v["computed_status"])

    def test_unbounded_operations_in_diff_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["bounds"]["unbounded_operations_in_diff"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["bounds_and_strings"], "fail")

    def test_lengths_not_validated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["bounds"]["lengths_validated_at_boundaries"] = False
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_ub_shortcuts_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["undefined_behavior"]["ub_shortcuts_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["undefined_behavior"], "fail")
        self.assertEqual(check_status(v, "no_ub_shortcuts"), "fail")

    def test_strict_aliasing_not_respected_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["undefined_behavior"]["strict_aliasing_respected"] = False
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_allocation_without_single_owner_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["memory"]["one_owner_per_allocation"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["memory_discipline"], "fail")

    def test_ownership_not_documented_for_outliving_pointers_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["memory"]["ownership_documented_for_outliving_pointers"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(
            check_status(v, "ownership_documented_for_outliving_pointers"),
            "fail")

    def test_sanitizers_not_clean_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["sanitizers"]["asan_ubsan_clean_on_suite"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(
            v["sections"]["sanitizers_and_static_analysis"], "fail")

    def test_static_analysis_findings_dismissed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sanitizers"]["static_analysis_findings_treated_as_bugs"] = False
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_parsers_not_fuzzed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sanitizers"]["parsers_fuzzed"] = False
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_fixed_width_types_not_used_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["portability"]["fixed_width_types_used"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["portability"], "fail")

    def test_not_tested_on_target_platforms_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["portability"]["tested_on_target_platforms"] = False
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_build_not_pinned_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["build_and_test"]["build_system_pinned"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["build_and_test"], "fail")

    def test_no_unit_tests_at_boundaries_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["build_and_test"]["unit_tests_at_function_boundaries"] = False
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["portability"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["portability"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["warning_count"])
        self.assertIsNone(v["banned_calls_found"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: REVIEW_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["subject"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("subject", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"memory": "should-be-an-object"})
        self.assertIn("memory", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["bounds"]["banned_calls"] = "strcpy"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("bounds.banned_calls", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["bounds"]["banned_calls"] = ["strcpy", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("bounds.banned_calls[1]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["memory"]["one_owner_per_allocation"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("memory.one_owner_per_allocation",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["warnings"]["warning_count"] = "zero"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("warnings.warning_count", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["warnings"]["warning_count"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("warnings.warning_count", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["bounds"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("bounds", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
