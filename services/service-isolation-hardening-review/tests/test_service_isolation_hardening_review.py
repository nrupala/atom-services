import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from service_isolation_hardening_review import evaluate, stamp  # noqa: E402

COMPLETE = {
    "subject": "fleet-node-3",
    "identity": {"dedicated_non_login_system_user_per_isolated_service": True,
                 "isolated_services_run_as_non_root": True,
                 "cross_service_filesystem_access_denied_between_services": True,
                 "per_service_capability_set_minimised": True},
    "services": [
        {"name": "mailer", "dedicated_user_assigned": True,
         "filesystem_access_scoped": True, "egress_restricted": True},
        {"name": "parser", "dedicated_user_assigned": True,
         "filesystem_access_scoped": True, "egress_restricted": True},
    ],
    "systemd": {"systemd_no_new_privileges_directive_set": True,
                "systemd_protect_system_strict_directive_set": True,
                "systemd_protect_home_directive_set": True,
                "systemd_private_tmp_directive_set": True,
                "systemd_dynamic_user_directive_set": True,
                "systemd_capability_bounding_set_directive_restricted": True,
                "systemd_system_call_filter_directive_applied": True,
                "systemd_restrict_address_families_directive_applied": True,
                "systemd_read_write_paths_directive_limited_to_required_paths": True},
    "confinement": {"sandbox_tool_used_for_one_off_untrusted_execution_isolation": True,
                    "namespaces_provide_filesystem_and_network_separation_for_isolated_services": True,
                    "mac_profile_confines_network_exposed_isolated_services": True,
                    "mac_denials_audited_without_blanket_disabling_confinement": True,
                    "wasm_wasi_runtime_used_for_untrusted_plugin_logic_isolation": True,
                    "microvm_used_where_kernel_level_isolation_is_required": True,
                    "windows_low_privilege_isolation_equivalents_applied_where_in_scope": True,
                    "chroot_not_relied_upon_as_sole_service_isolation": True},
    "resources": {"cgroups_v2_cpu_memory_io_limits_set_for_isolated_services": True,
                  "per_service_ulimits_configured_for_isolated_services": True,
                  "execution_timeouts_configured_for_isolated_services": True,
                  "restart_limits_configured_for_isolated_services": True},
    "egress_monitoring": {"outbound_egress_restricted_for_isolated_services_not_needing_world_access": True,
                          "exec_and_spawn_events_logged_for_isolated_services": True,
                          "per_service_kill_switch_available_for_isolated_services": True},
    "verification": {"runaway_service_behaviour_tested_against_resource_limits": True,
                     "sandbox_escape_and_abuse_cases_exercised_for_isolated_services": True,
                     "sandbox_blocking_verified_not_assumed_for_isolated_services": True},
    "red_lines": {"root_service_run_for_convenience_present": False,
                  "host_wide_mounts_into_isolated_services_present": False,
                  "sandbox_disabled_to_make_service_run_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_hardened(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"],
                         "SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 39)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["services_count"], 2)
        self.assertEqual(v["services_without_dedicated_user"], [])
        self.assertEqual(v["services_without_filesystem_scope"], [])
        self.assertEqual(v["services_without_egress_restriction"], [])
        self.assertEqual(v["dedicated_user_coverage"], "1.000000")
        self.assertEqual(v["filesystem_scope_coverage"], "1.000000")
        self.assertEqual(v["egress_restriction_coverage"], "1.000000")
        self.assertEqual(v["duplicate_service_names"], [])

    def test_empty_services_list_is_a_valid_declaration(self):
        m = copy.deepcopy(COMPLETE)
        m["services"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED")
        self.assertEqual(v["services_count"], 0)
        self.assertEqual(v["services_without_dedicated_user"], [])
        self.assertIsNone(v["dedicated_user_coverage"])
        self.assertIsNone(v["filesystem_scope_coverage"])
        self.assertIsNone(v["egress_restriction_coverage"])
        self.assertEqual(v["duplicate_service_names"], [])
        self.assertEqual(check_status(v, "isolated_services_roster_declared"),
                         "pass")
        self.assertEqual(
            check_status(
                v, "every_rostered_service_has_dedicated_user_assignment"),
            "pass")

    def test_shared_user_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["identity"]["dedicated_non_login_system_user_per_isolated_service"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED")
        self.assertEqual(v["sections"]["least_privilege_identity"], "fail")
        self.assertEqual(
            check_status(
                v, "dedicated_non_login_system_user_per_isolated_service"),
            "fail")

    def test_root_service_declaration_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["identity"]["isolated_services_run_as_non_root"] = False
        self.assertEqual(
            check_status(evaluate(m), "isolated_services_run_as_non_root"),
            "fail")

    def test_service_without_dedicated_user_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["services"][0]["dedicated_user_assigned"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED")
        self.assertEqual(
            check_status(
                v, "every_rostered_service_has_dedicated_user_assignment"),
            "fail")
        self.assertEqual(v["services_without_dedicated_user"], ["mailer"])
        self.assertEqual(v["dedicated_user_coverage"], "0.500000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_service_without_filesystem_scope_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["services"][1]["filesystem_access_scoped"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_rostered_service_has_scoped_filesystem_access"),
            "fail")
        self.assertEqual(v["services_without_filesystem_scope"], ["parser"])
        self.assertEqual(v["filesystem_scope_coverage"], "0.500000")

    def test_service_without_egress_restriction_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["services"][1]["egress_restricted"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_rostered_service_has_restricted_egress_declaration"),
            "fail")
        self.assertEqual(v["services_without_egress_restriction"],
                         ["parser"])
        self.assertEqual(v["egress_restriction_coverage"], "0.500000")

    def test_service_missing_user_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["services"][0]["dedicated_user_assigned"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_rostered_service_has_dedicated_user_assignment"),
            "missing")
        self.assertEqual(v["services_without_dedicated_user"], [])

    def test_duplicate_service_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["services"][1]["name"] = "mailer"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_rostered_service_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_service_names"], ["mailer"])

    def test_service_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["services"][1]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_rostered_service_name_duplicated"),
            "missing")
        self.assertEqual(v["duplicate_service_names"], [])

    def test_absent_services_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["services"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "isolated_services_roster_declared"),
                         "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["services_count"])
        self.assertIsNone(v["services_without_dedicated_user"])
        self.assertIsNone(v["services_without_filesystem_scope"])
        self.assertIsNone(v["services_without_egress_restriction"])
        self.assertIsNone(v["dedicated_user_coverage"])
        self.assertIsNone(v["filesystem_scope_coverage"])
        self.assertIsNone(v["egress_restriction_coverage"])
        self.assertIsNone(v["duplicate_service_names"])

    def test_missing_no_new_privileges_fails_section2(self):
        m = copy.deepcopy(COMPLETE)
        m["systemd"]["systemd_no_new_privileges_directive_set"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED")
        self.assertEqual(v["sections"]["systemd_sandbox_directives"],
                         "fail")

    def test_unrestricted_read_write_paths_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["systemd"]["systemd_read_write_paths_directive_limited_to_required_paths"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "systemd_read_write_paths_directive_limited_to_required_paths"),
            "fail")

    def test_no_mac_profile_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["confinement"]["mac_profile_confines_network_exposed_isolated_services"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED")
        self.assertEqual(v["sections"]["confinement_and_sandbox_tools"],
                         "fail")

    def test_chroot_as_sole_isolation_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["confinement"]["chroot_not_relied_upon_as_sole_service_isolation"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "chroot_not_relied_upon_as_sole_service_isolation"),
            "fail")

    def test_no_resource_limits_fail_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["resources"]["cgroups_v2_cpu_memory_io_limits_set_for_isolated_services"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED")
        self.assertEqual(v["sections"]["resource_containment"], "fail")

    def test_no_restart_limits_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["resources"]["restart_limits_configured_for_isolated_services"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "restart_limits_configured_for_isolated_services"),
            "fail")

    def test_open_egress_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["egress_monitoring"]["outbound_egress_restricted_for_isolated_services_not_needing_world_access"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED")
        self.assertEqual(
            v["sections"]["egress_monitoring_and_kill_switch"], "fail")

    def test_no_kill_switch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["egress_monitoring"]["per_service_kill_switch_available_for_isolated_services"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "per_service_kill_switch_available_for_isolated_services"),
            "fail")

    def test_unexercised_escape_cases_fail_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["verification"]["sandbox_escape_and_abuse_cases_exercised_for_isolated_services"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED")
        self.assertEqual(v["sections"]["isolation_verification"], "fail")

    def test_runaway_behaviour_untested_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["verification"]["runaway_service_behaviour_tested_against_resource_limits"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "runaway_service_behaviour_tested_against_resource_limits"),
            "fail")

    def test_root_for_convenience_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["root_service_run_for_convenience_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_root_isolated_service_run_for_convenience"),
            "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_host_wide_mounts_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["host_wide_mounts_into_isolated_services_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_host_wide_mounts_into_isolated_services"),
            "fail")
        self.assertEqual(v["verdict"],
                         "SERVICE_ISOLATION_HARDENING_REVIEW_NOT_HARDENED")

    def test_sandbox_disabled_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["sandbox_disabled_to_make_service_run_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "no_sandbox_disabled_to_make_isolated_service_run"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["verification"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["isolation_verification"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["services_count"])
        self.assertIsNone(v["services_without_dedicated_user"])
        self.assertIsNone(v["services_without_filesystem_scope"])
        self.assertIsNone(v["services_without_egress_restriction"])
        self.assertIsNone(v["dedicated_user_coverage"])
        self.assertIsNone(v["filesystem_scope_coverage"])
        self.assertIsNone(v["egress_restriction_coverage"])
        self.assertIsNone(v["duplicate_service_names"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: SERVICE_ISOLATION_HARDENING_REVIEW_HARDENED",
            stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["subject"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("subject", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"identity": "should-be-an-object"})
        self.assertIn("identity", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"services": {"name": "mailer"}})
        self.assertIn("services", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"services": ["mailer"]})
        self.assertIn("services[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["verification"]["runaway_service_behaviour_tested_against_resource_limits"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn(
            "verification.runaway_service_behaviour_tested_against_resource_limits",
            str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["services"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("services[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["services"][1]["dedicated_user_assigned"] = 7
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("services[1].dedicated_user_assigned",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["systemd"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("systemd", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
