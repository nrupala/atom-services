import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from json_schema_design_check import evaluate, stamp  # noqa: E402

COMPLETE = {
    "artifact": "orders-api",
    "schema": {"schema_for_every_external_payload": True,
               "validated_at_boundary": True},
    "writer_reader": {
        "strict_writer_emits_exactly_schema": True,
        "tolerant_reader_accepts_documented_variations": True,
        "undocumented_variations_rejected_loudly": True},
    "payloads": [
        {"name": "order-created",
         "has_schema": True, "has_sample": True,
         "has_version_field": True,
         "money_and_bigint_fields_as_strings": True,
         "is_hashed_or_signed": True,
         "canonical_rules_documented": True},
        {"name": "order-updated",
         "has_schema": True, "has_sample": True,
         "has_version_field": True,
         "money_and_bigint_fields_as_strings": True,
         "is_hashed_or_signed": False},
        {"name": "invoice-issued",
         "has_schema": True, "has_sample": True,
         "has_version_field": True,
         "money_and_bigint_fields_as_strings": True,
         "is_hashed_or_signed": False},
    ],
    "canonical": {"fixed_key_ordering_documented": True,
                  "number_formatting_documented": True,
                  "hashes_or_signatures_cover_json": True,
                  "canonical_rules_documented": True,
                  "money_as_strings": True,
                  "big_integers_as_strings": True,
                  "float_usage_for_money_or_big_integers_present": False},
    "versioning": {
        "version_field_on_everything_persisted_or_sent": True,
        "additive_changes_by_default": True,
        "breaking_changes_require_new_version": True},
    "parsing": {"size_limits_on_untrusted_input": True,
                "depth_limits_on_untrusted_input": True,
                "eval_used_present": False,
                "duplicate_keys_handled_deliberately": True,
                "utf8_only_and_escapes_normalized": True,
                "parse_errors_explicit_not_silent_defaults": True},
    "streaming_ops": {"ndjson_for_logs_and_events": True,
                      "streaming_parsers_for_large_files": True,
                      "compact_for_machine_storage_pretty_for_humans": True,
                      "inspection_and_diffs_in_reviews": True,
                      "sample_fixtures_kept_per_schema": True},
    "red_lines": {
        "unbounded_parsing_of_untrusted_input_present": False,
        "unvalidated_config_edits_without_ci_schema_validation_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "JSON_SCHEMA_DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 32)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["payloads_count"], 3)
        self.assertEqual(v["payloads_without_schema_or_sample"], [])
        self.assertEqual(v["schema_coverage"], "1.000000")
        self.assertEqual(v["payloads_without_version_field"], [])
        self.assertEqual(v["version_coverage"], "1.000000")
        self.assertEqual(
            v["payloads_without_money_and_bigint_fields_as_strings"], [])
        self.assertEqual(v["money_bigint_string_coverage"], "1.000000")
        self.assertEqual(
            v["hashed_or_signed_payloads_without_canonical_rules"], [])
        self.assertEqual(v["canonical_coverage"], "1.000000")

    def test_no_schema_for_payload_fails_section(self):
        m = copy.deepcopy(COMPLETE)
        m["schema"]["schema_for_every_external_payload"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JSON_SCHEMA_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["schema_first_and_boundary"], "fail")

    def test_not_validated_at_boundary_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["schema"]["validated_at_boundary"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "JSON_SCHEMA_DESIGN_NOT_SOUND")

    def test_lenient_writer_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["writer_reader"]["strict_writer_emits_exactly_schema"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "JSON_SCHEMA_DESIGN_NOT_SOUND")

    def test_silent_rejection_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["writer_reader"]["undocumented_variations_rejected_loudly"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "JSON_SCHEMA_DESIGN_NOT_SOUND")

    def test_payload_without_sample_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["payloads"][0]["has_sample"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JSON_SCHEMA_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_payload_has_schema_and_sample"), "fail")
        self.assertEqual(v["payloads_without_schema_or_sample"],
                         ["order-created"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_payload_missing_schema_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["payloads"][0]["has_schema"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_payload_has_schema_and_sample"),
            "missing")
        self.assertEqual(v["payloads_without_schema_or_sample"], [])
        self.assertEqual(v["schema_coverage"], "0.666667")

    def test_empty_payloads_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["payloads"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "payloads_declared"), "fail")
        self.assertEqual(v["payloads_count"], 0)
        self.assertIsNone(v["schema_coverage"])
        self.assertIsNone(v["canonical_coverage"])

    def test_canonical_not_documented_when_signing_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["canonical"]["canonical_rules_documented"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "canonical_rules_documented_when_hashing_or_signing"),
            "fail")

    def test_no_signing_passes_canonical_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["canonical"] = {
            "fixed_key_ordering_documented": True,
            "number_formatting_documented": True,
            "hashes_or_signatures_cover_json": False,
            "money_as_strings": True,
            "big_integers_as_strings": True,
            "float_usage_for_money_or_big_integers_present": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JSON_SCHEMA_DESIGN_SOUND")
        self.assertEqual(
            check_status(
                v, "canonical_rules_documented_when_hashing_or_signing"),
            "pass")

    def test_canonical_target_missing_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["canonical"]["canonical_rules_documented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "canonical_rules_documented_when_hashing_or_signing"),
            "missing")

    def test_hashed_payload_without_canonical_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["payloads"][0]["canonical_rules_documented"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_hashed_or_signed_payload_canonical_documented"),
            "fail")
        self.assertEqual(
            v["hashed_or_signed_payloads_without_canonical_rules"],
            ["order-created"])
        self.assertEqual(v["canonical_coverage"], "0.000000")

    def test_hashed_payload_missing_canonical_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["payloads"][0]["canonical_rules_documented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "every_hashed_or_signed_payload_canonical_documented"),
            "missing")

    def test_no_hashed_payloads_passes_canonical_row_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["payloads"][0]["is_hashed_or_signed"] = False
        del m["payloads"][0]["canonical_rules_documented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JSON_SCHEMA_DESIGN_SOUND")
        self.assertEqual(
            check_status(
                v,
                "every_hashed_or_signed_payload_canonical_documented"),
            "pass")
        self.assertIsNone(v["canonical_coverage"])

    def test_float_for_money_fails_number_care(self):
        m = copy.deepcopy(COMPLETE)
        m["canonical"]["float_usage_for_money_or_big_integers_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_float_for_money_or_big_integers"), "fail")
        self.assertEqual(
            v["sections"]["canonical_form_and_number_care"], "fail")

    def test_money_not_as_strings_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["canonical"]["money_as_strings"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "JSON_SCHEMA_DESIGN_NOT_SOUND")

    def test_payload_money_not_as_strings_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["payloads"][1]["money_and_bigint_fields_as_strings"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_payload_money_and_bigint_fields_as_strings"),
            "fail")
        self.assertEqual(
            v["payloads_without_money_and_bigint_fields_as_strings"],
            ["order-updated"])
        self.assertEqual(v["money_bigint_string_coverage"], "0.666667")

    def test_breaking_without_new_version_fails_versioning(self):
        m = copy.deepcopy(COMPLETE)
        m["versioning"]["breaking_changes_require_new_version"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["versioning"], "fail")

    def test_payload_without_version_field_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["payloads"][2]["has_version_field"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_payload_has_version_field"), "fail")
        self.assertEqual(v["payloads_without_version_field"],
                         ["invoice-issued"])
        self.assertEqual(v["version_coverage"], "0.666667")

    def test_no_size_limits_fails_parsing(self):
        m = copy.deepcopy(COMPLETE)
        m["parsing"]["size_limits_on_untrusted_input"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["parsing_safety_and_encoding"], "fail")

    def test_eval_used_fails_parsing(self):
        m = copy.deepcopy(COMPLETE)
        m["parsing"]["eval_used_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_eval"), "fail")

    def test_silent_parse_defaults_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["parsing"]["parse_errors_explicit_not_silent_defaults"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "JSON_SCHEMA_DESIGN_NOT_SOUND")

    def test_pretty_printed_storage_fails_streaming(self):
        m = copy.deepcopy(COMPLETE)
        m["streaming_ops"][
            "compact_for_machine_storage_pretty_for_humans"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "JSON_SCHEMA_DESIGN_NOT_SOUND")

    def test_unbounded_parsing_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unbounded_parsing_of_untrusted_input_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_unbounded_parsing_of_untrusted_input"),
            "fail")
        self.assertEqual(
            v["sections"]["streaming_ops_and_red_lines"], "fail")

    def test_unvalidated_config_edits_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "unvalidated_config_edits_without_ci_schema_validation_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "no_unvalidated_config_edits_without_ci_schema_validation"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["parsing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["parsing_safety_and_encoding"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["payloads_count"])
        self.assertIsNone(v["payloads_without_schema_or_sample"])
        self.assertIsNone(v["schema_coverage"])
        self.assertIsNone(v["payloads_without_version_field"])
        self.assertIsNone(v["version_coverage"])
        self.assertIsNone(
            v["payloads_without_money_and_bigint_fields_as_strings"])
        self.assertIsNone(v["money_bigint_string_coverage"])
        self.assertIsNone(
            v["hashed_or_signed_payloads_without_canonical_rules"])
        self.assertIsNone(v["canonical_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: JSON_SCHEMA_DESIGN_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["artifact"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("artifact", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"parsing": "should-be-an-object"})
        self.assertIn("parsing", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"payloads": {"name": "order-created"}})
        self.assertIn("payloads", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"payloads": ["order-created"]})
        self.assertIn("payloads[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["parsing"]["size_limits_on_untrusted_input"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("parsing.size_limits_on_untrusted_input",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["payloads"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("payloads[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["payloads"][1]["is_hashed_or_signed"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("payloads[1].is_hashed_or_signed",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["canonical"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("canonical", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
