import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from multiplatform_core_design import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "vault-app",
    "core": {"core_holds_logic": True,
             "core_holds_crypto": True,
             "core_holds_data_model": True,
             "core_in_portable_language": True,
             "single_internal_api_defined": True},
    "web": {"web_installable": True,
            "web_offline_capable_service_worker": True,
            "web_responsive": True},
    "mobile": {"mobile_pwa_first_where_sufficient": True,
               "mobile_native_only_when_truly_needed": True},
    "desktop_cli": {"desktop_single_static_binary_where_possible": True,
                    "cli_good_help": True,
                    "cli_correct_exit_codes": True,
                    "cli_pipe_friendly_output": True},
    "api": {"api_one_typed_contract": True},
    "surfaces": [
        {"name": "web", "kind": "web_pwa",
         "consumes_core_contract": True,
         "platform_code_isolated": True,
         "core_logic_reimplemented": False},
        {"name": "android", "kind": "mobile",
         "consumes_core_contract": True,
         "platform_code_isolated": True,
         "core_logic_reimplemented": False},
        {"name": "cli", "kind": "desktop_cli",
         "consumes_core_contract": True,
         "platform_code_isolated": True,
         "core_logic_reimplemented": False},
        {"name": "http-api", "kind": "api",
         "consumes_core_contract": True,
         "platform_code_isolated": True,
         "core_logic_reimplemented": False},
    ],
    "local_first": {"source_of_truth_on_device": True,
                    "sync_is_enhancement_not_requirement": True,
                    "user_data_and_keys_stay_on_device_hardware": True},
    "portability": {"platform_specific_code_behind_interfaces": True,
                    "per_platform_forks_minimized": True,
                    "one_design_system_across_surfaces": True,
                    "each_platform_conventions_respected": True},
    "packaging": {"reproducible_builds": True,
                  "signed_builds": True,
                  "docker_used": False,
                  "distribution_route_decided_per_surface": True},
    "testing": {"shared_core_tested_thoroughly_once": True,
                "each_surface_smoke_tested": True},
    "red_lines": {"core_logic_rewritten_per_platform_present": False,
                  "lowest_common_denominator_ux_present": False,
                  "platform_conventions_ignored_present": False,
                  "online_only_where_offline_matters_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "MULTIPLATFORM_CORE_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 37)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["surfaces_count"], 4)
        self.assertEqual(v["surfaces_with_invalid_kind"], [])
        self.assertEqual(v["valid_kind_coverage"], "1.000000")
        self.assertEqual(v["surfaces_not_consuming_core_contract"], [])
        self.assertEqual(v["core_contract_coverage"], "1.000000")
        self.assertEqual(v["surfaces_without_isolated_platform_code"], [])
        self.assertEqual(v["isolated_platform_code_coverage"], "1.000000")
        self.assertEqual(v["surfaces_reimplementing_core_logic"], [])
        self.assertEqual(v["no_core_reimplementation_coverage"], "1.000000")

    def test_core_not_holding_crypto_fails_core_section(self):
        m = copy.deepcopy(COMPLETE)
        m["core"]["core_holds_crypto"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MULTIPLATFORM_CORE_NOT_SOUND")
        self.assertEqual(v["sections"]["core_architecture"], "fail")
        self.assertEqual(check_status(v, "core_holds_crypto"), "fail")

    def test_no_single_internal_api_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["core"]["single_internal_api_defined"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "MULTIPLATFORM_CORE_NOT_SOUND")

    def test_web_not_offline_capable_fails_surfaces_section(self):
        m = copy.deepcopy(COMPLETE)
        m["web"]["web_offline_capable_service_worker"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["surfaces_and_thin_adapters"], "fail")
        self.assertEqual(
            check_status(v, "web_offline_capable_service_worker"), "fail")

    def test_native_first_mobile_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["mobile"]["mobile_pwa_first_where_sufficient"] = False
        self.assertEqual(
            check_status(evaluate(m), "mobile_pwa_first_where_sufficient"),
            "fail")

    def test_cli_wrong_exit_codes_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["desktop_cli"]["cli_correct_exit_codes"] = False
        self.assertEqual(
            check_status(evaluate(m), "cli_correct_exit_codes"), "fail")

    def test_surface_with_invalid_kind_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["surfaces"][1]["kind"] = "smart_tv"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_surface_kind_valid"), "fail")
        self.assertEqual(v["surfaces_with_invalid_kind"], ["android"])
        self.assertEqual(v["valid_kind_coverage"], "0.750000")

    def test_surface_missing_kind_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["surfaces"][1]["kind"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_surface_kind_valid"),
                         "missing")
        self.assertEqual(v["surfaces_with_invalid_kind"], [])

    def test_surface_not_consuming_contract_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["surfaces"][0]["consumes_core_contract"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_surface_consumes_core_contract"), "fail")
        self.assertEqual(v["surfaces_not_consuming_core_contract"], ["web"])
        self.assertEqual(v["core_contract_coverage"], "0.750000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_surface_missing_consumes_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["surfaces"][0]["consumes_core_contract"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_surface_consumes_core_contract"),
            "missing")
        self.assertEqual(v["surfaces_not_consuming_core_contract"], [])

    def test_surface_without_isolated_code_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["surfaces"][2]["platform_code_isolated"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_surface_platform_code_isolated"), "fail")
        self.assertEqual(v["surfaces_without_isolated_platform_code"],
                         ["cli"])
        self.assertEqual(v["isolated_platform_code_coverage"], "0.750000")

    def test_surface_reimplementing_core_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["surfaces"][3]["core_logic_reimplemented"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_surface_reimplements_core_logic"), "fail")
        self.assertEqual(v["surfaces_reimplementing_core_logic"],
                         ["http-api"])
        self.assertEqual(v["no_core_reimplementation_coverage"], "0.750000")

    def test_surface_missing_reimplemented_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["surfaces"][3]["core_logic_reimplemented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_surface_reimplements_core_logic"), "missing")
        self.assertEqual(v["surfaces_reimplementing_core_logic"], [])

    def test_empty_surfaces_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["surfaces"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "surfaces_declared"), "fail")
        self.assertEqual(v["surfaces_count"], 0)
        self.assertIsNone(v["valid_kind_coverage"])
        self.assertIsNone(v["core_contract_coverage"])
        self.assertIsNone(v["isolated_platform_code_coverage"])
        self.assertIsNone(v["no_core_reimplementation_coverage"])
        self.assertEqual(v["surfaces_reimplementing_core_logic"], [])

    def test_server_as_source_of_truth_fails_local_first(self):
        m = copy.deepcopy(COMPLETE)
        m["local_first"]["source_of_truth_on_device"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MULTIPLATFORM_CORE_NOT_SOUND")
        self.assertEqual(v["sections"]["local_first_and_portability"],
                         "fail")

    def test_platform_conventions_not_respected_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["portability"]["each_platform_conventions_respected"] = False
        self.assertEqual(
            check_status(evaluate(m),
                         "each_platform_conventions_respected"), "fail")

    def test_docker_used_fails_packaging(self):
        m = copy.deepcopy(COMPLETE)
        m["packaging"]["docker_used"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_docker"), "fail")
        self.assertEqual(v["sections"]["packaging_and_testing"], "fail")

    def test_unsigned_builds_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["packaging"]["signed_builds"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "MULTIPLATFORM_CORE_NOT_SOUND")

    def test_core_not_tested_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["shared_core_tested_thoroughly_once"] = False
        self.assertEqual(
            check_status(evaluate(m), "shared_core_tested_thoroughly_once"),
            "fail")

    def test_core_rewrite_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["core_logic_rewritten_per_platform_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_core_logic_rewritten_per_platform"), "fail")
        self.assertEqual(v["sections"]["anti_pattern_red_lines"], "fail")

    def test_lcd_ux_and_online_only_red_lines_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["lowest_common_denominator_ux_present"] = True
        m["red_lines"]["online_only_where_offline_matters_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_lowest_common_denominator_ux"), "fail")
        self.assertEqual(
            check_status(v, "no_online_only_where_offline_matters"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["testing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["packaging_and_testing"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["surfaces_count"])
        self.assertIsNone(v["surfaces_with_invalid_kind"])
        self.assertIsNone(v["valid_kind_coverage"])
        self.assertIsNone(v["surfaces_not_consuming_core_contract"])
        self.assertIsNone(v["core_contract_coverage"])
        self.assertIsNone(v["surfaces_without_isolated_platform_code"])
        self.assertIsNone(v["isolated_platform_code_coverage"])
        self.assertIsNone(v["surfaces_reimplementing_core_logic"])
        self.assertIsNone(v["no_core_reimplementation_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: MULTIPLATFORM_CORE_SOUND", stamp(v))

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
            evaluate({"core": "should-be-an-object"})
        self.assertIn("core", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"surfaces": {"name": "web"}})
        self.assertIn("surfaces", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"surfaces": ["web"]})
        self.assertIn("surfaces[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["core"]["core_holds_logic"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("core.core_holds_logic", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["surfaces"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("surfaces[0].name", str(ctx.exception))

    def test_nested_list_entry_kind_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["surfaces"][1]["kind"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("surfaces[1].kind", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["portability"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("portability", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
