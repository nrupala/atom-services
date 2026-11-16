import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from efficient_web_build_standard import evaluate, stamp  # noqa: E402

COMPLETE = {
    "site": "product-landing",
    "plan": {"call_count_stated": True,
             "per_request_work_stated": True,
             "cheaper_alternative_stated": True,
             "fragility_named": True},
    "precompute": {"rebuild_triggered_by_publish_event": True,
                   "timer_or_per_visitor_primary_rebuild_present": False,
                   "live_render_fallback_present": True},
    "calls": {"await_in_loop_present": False,
              "independent_calls_batched_or_avoided": True,
              "duplicate_upstream_fetches_coalesced": True},
    "search": {"has_search_or_filter": True,
               "uses_single_publish_time_index_blob": True},
    "pages": [
        {"name": "home", "content_same_for_all_visitors": True,
         "rendered_at_publish": True, "calls_per_load": 1},
        {"name": "docs-index", "content_same_for_all_visitors": True,
         "rendered_at_publish": True, "calls_per_load": 1},
        {"name": "account-dashboard",
         "content_same_for_all_visitors": False,
         "rendered_at_publish": False, "calls_per_load": 3},
    ],
    "caching": {"edge_cache_configured": True,
                "stale_while_revalidate_configured": True,
                "app_cache_scoped_to_authenticated_personalized": True,
                "db_cache_scoped_to_genuinely_dynamic": True,
                "hashed_static_assets_used": True,
                "hashed_asset_max_age_seconds": 31536000,
                "stale_served_on_upstream_failure": True},
    "payload": {"text_compression_brotli_gzip_fallback": True,
                "already_compressed_media_recompressed_present": False,
                "js_css_minified_at_build": True,
                "dead_code_removed": True,
                "client_js_limited_to_needed_interactivity": True,
                "critical_css_inlined_rest_deferred": True,
                "images_efficient_formats_responsive_lazy": True,
                "static_assets_highest_compression_level": True,
                "on_the_fly_compression_low_level": True,
                "interactive_js_gzipped_kb": 120},
    "delivery": {"edge_first_delivery": True,
                 "static_shell_first_slow_parts_deferred": True,
                 "content_page_cpu_p99_ms": 0.4},
    "security": {"csp_header_present": True,
                 "hsts_header_present": True,
                 "content_type_options_nosniff_present": True,
                 "frame_protection_present": True,
                 "referrer_policy_present": True,
                 "https_only": True,
                 "secrets_in_client_code_or_repos_present": False,
                 "write_endpoints_bearer_token_protected": True,
                 "user_derived_output_escaped": True,
                 "undefined_field_guards_present": True,
                 "least_privilege_tokens_and_bindings": True},
    "process": {"staging_deployed_first": True,
                "staging_speed_and_correctness_verified": True,
                "production_promoted_only_on_explicit_go": True,
                "post_ship_efficiency_confirmed_with_numbers": True,
                "testing_done_on_live_site_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_meets_standard(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "EFFICIENT_WEB_BUILD_STANDARD_MET")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 49)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["pages_count"], 3)
        self.assertEqual(v["shared_pages_not_precomputed"], [])
        self.assertEqual(v["precomputed_pages_over_single_read"], [])
        self.assertEqual(v["total_calls_per_load"], 5)
        self.assertEqual(v["max_calls_per_load"], 3)
        self.assertEqual(v["precomputed_page_coverage"], "0.666667")
        self.assertEqual(v["single_read_page_coverage"], "0.666667")
        self.assertEqual(v["interactive_js_gzipped_kb"], 120)
        self.assertEqual(v["content_page_cpu_p99_ms"], 0.4)

    def test_plan_without_call_count_fails_section_1(self):
        m = copy.deepcopy(COMPLETE)
        m["plan"]["call_count_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET")
        self.assertEqual(
            v["sections"]["publish_time_precompute_and_calls"], "fail")

    def test_timer_primary_rebuild_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["precompute"]["timer_or_per_visitor_primary_rebuild_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_timer_or_per_visitor_primary_rebuild"),
            "fail")

    def test_await_in_loop_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["calls"]["await_in_loop_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET")

    def test_search_without_single_index_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["search"]["uses_single_publish_time_index_blob"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "search_uses_single_publish_time_index"),
            "fail")

    def test_no_search_passes_index_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["search"]["has_search_or_filter"] = False
        del m["search"]["uses_single_publish_time_index_blob"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EFFICIENT_WEB_BUILD_STANDARD_MET")
        self.assertEqual(
            check_status(v, "search_uses_single_publish_time_index"),
            "pass")

    def test_empty_pages_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "pages_declared"), "fail")
        self.assertEqual(v["pages_count"], 0)
        self.assertIsNone(v["precomputed_page_coverage"])
        self.assertIsNone(v["total_calls_per_load"])

    def test_shared_page_not_precomputed_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][0]["rendered_at_publish"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_shared_content_page_rendered_at_publish"),
            "fail")
        self.assertEqual(v["shared_pages_not_precomputed"], ["home"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_shared_page_missing_rendered_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["pages"][0]["rendered_at_publish"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_shared_content_page_rendered_at_publish"),
            "missing")
        self.assertEqual(v["shared_pages_not_precomputed"], [])

    def test_precomputed_page_with_two_calls_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][1]["calls_per_load"] = 2
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_precomputed_page_serves_single_read"),
            "fail")
        self.assertEqual(v["precomputed_pages_over_single_read"],
                         ["docs-index"])

    def test_precomputed_page_missing_calls_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["pages"][1]["calls_per_load"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_precomputed_page_serves_single_read"),
            "missing")

    def test_dynamic_page_with_many_calls_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][2]["calls_per_load"] = 9
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EFFICIENT_WEB_BUILD_STANDARD_MET")
        self.assertEqual(v["max_calls_per_load"], 9)

    def test_edge_cache_off_fails_caching_section(self):
        m = copy.deepcopy(COMPLETE)
        m["caching"]["edge_cache_configured"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET")
        self.assertEqual(v["sections"]["caching_layers"], "fail")

    def test_hashed_assets_with_wrong_max_age_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["caching"]["hashed_asset_max_age_seconds"] = 86400
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "hashed_assets_use_immutable_year_cache"),
            "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_hashed_assets_missing_max_age_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["caching"]["hashed_asset_max_age_seconds"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "hashed_assets_use_immutable_year_cache"),
            "missing")

    def test_no_hashed_assets_passes_max_age_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["caching"]["hashed_static_assets_used"] = False
        del m["caching"]["hashed_asset_max_age_seconds"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EFFICIENT_WEB_BUILD_STANDARD_MET")
        self.assertEqual(
            check_status(v, "hashed_assets_use_immutable_year_cache"),
            "pass")

    def test_media_recompression_fails_bytes_section(self):
        m = copy.deepcopy(COMPLETE)
        m["payload"]["already_compressed_media_recompressed_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["bytes_compression_and_client_code"],
                         "fail")

    def test_interactive_js_over_budget_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["payload"]["interactive_js_gzipped_kb"] = 450
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "interactive_js_within_stated_budget"),
            "fail")
        self.assertEqual(v["verdict"],
                         "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET")

    def test_interactive_js_at_budget_boundary_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["payload"]["interactive_js_gzipped_kb"] = 400
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "interactive_js_within_stated_budget"),
            "pass")

    def test_interactive_js_absent_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["payload"]["interactive_js_gzipped_kb"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["interactive_js_gzipped_kb"])

    def test_cpu_p99_at_one_ms_fails_sub_millisecond(self):
        m = copy.deepcopy(COMPLETE)
        m["delivery"]["content_page_cpu_p99_ms"] = 1.0
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "content_page_cpu_p99_sub_millisecond"),
            "fail")

    def test_cpu_p99_multi_ms_fails_delivery_section(self):
        m = copy.deepcopy(COMPLETE)
        m["delivery"]["content_page_cpu_p99_ms"] = 4.2
        v = evaluate(m)
        self.assertEqual(v["sections"]["delivery_security_and_process"],
                         "fail")

    def test_missing_csp_header_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["csp_header_present"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "csp_header_present"), "fail")
        self.assertEqual(v["verdict"],
                         "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET")

    def test_secrets_in_client_code_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["secrets_in_client_code_or_repos_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET")

    def test_testing_on_live_site_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["process"]["testing_done_on_live_site_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_testing_on_live_site"),
                         "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["process"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["delivery_security_and_process"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["pages_count"])
        self.assertIsNone(v["shared_pages_not_precomputed"])
        self.assertIsNone(v["precomputed_pages_over_single_read"])
        self.assertIsNone(v["total_calls_per_load"])
        self.assertIsNone(v["max_calls_per_load"])
        self.assertIsNone(v["precomputed_page_coverage"])
        self.assertIsNone(v["single_read_page_coverage"])
        self.assertIsNone(v["interactive_js_gzipped_kb"])
        self.assertIsNone(v["content_page_cpu_p99_ms"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: EFFICIENT_WEB_BUILD_STANDARD_MET",
                      stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with TypeError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["site"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("site", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"caching": "should-be-an-object"})
        self.assertIn("caching", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"pages": {"name": "home"}})
        self.assertIn("pages", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"pages": ["home"]})
        self.assertIn("pages[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["plan"]["call_count_stated"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("plan.call_count_stated", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("pages[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][0]["rendered_at_publish"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("pages[0].rendered_at_publish", str(ctx.exception))

    def test_calls_per_load_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][0]["calls_per_load"] = "1"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("pages[0].calls_per_load", str(ctx.exception))

    def test_calls_per_load_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][0]["calls_per_load"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("pages[0].calls_per_load", str(ctx.exception))

    def test_max_age_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["caching"]["hashed_asset_max_age_seconds"] = "31536000"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("caching.hashed_asset_max_age_seconds",
                      str(ctx.exception))

    def test_cpu_p99_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["delivery"]["content_page_cpu_p99_ms"] = "0.4"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("delivery.content_page_cpu_p99_ms",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["process"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("process", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
