import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from engineering_work_package_structuring import (  # noqa: E402
    FieldTypeError, evaluate, stamp,
)

COMPLETE = {
    "package": "motor-replacement-wp1",
    "definition": {"objective_declared": True,
                   "scope_in_declared": True,
                   "scope_out_declared": True,
                   "standards_declared": True,
                   "site_rules_declared": True,
                   "interfaces_declared": True,
                   "budget_link_declared": True,
                   "schedule_declared": True,
                   "acceptance_criteria_declared": True,
                   "deliverables_list_agreed": True,
                   "deliverable_gaps_documented": False},
    "deliverables": [
        {"name": "motor-calc", "kind": "calc package"},
        {"name": "motor-datasheet", "kind": "datasheet"},
        {"name": "pump-drawing", "kind": "drawing"},
    ],
    "documents": [
        {"name": "motor-calc", "kind": "calc package",
         "status": "For Construction", "revision": "C",
         "revision_reason_declared": True,
         "revision_history_present": True,
         "designer": "eng-a", "checker": "eng-b",
         "prepared_by": "eng-a", "reviewed_by": "eng-b",
         "approved_by": "eng-c",
         "purpose_declared": True, "inputs_declared": True,
         "assumptions_declared": True,
         "standards_cited_declared": True, "units_declared": True,
         "results_declared": True, "check_signature_declared": True},
        {"name": "motor-datasheet", "kind": "datasheet",
         "status": "For Review", "revision": "A",
         "revision_reason_declared": True,
         "revision_history_present": True,
         "designer": "eng-a", "checker": "eng-b",
         "prepared_by": "eng-a", "reviewed_by": "eng-b",
         "approved_by": "eng-c",
         "purpose_declared": True, "inputs_declared": True,
         "assumptions_declared": True,
         "standards_cited_declared": True, "units_declared": True,
         "results_declared": True, "check_signature_declared": True},
        {"name": "pump-drawing", "kind": "drawing",
         "status": "Draft", "revision": "0",
         "revision_reason_declared": True,
         "revision_history_present": True,
         "designer": "eng-d", "checker": "eng-e",
         "prepared_by": "eng-d", "reviewed_by": "eng-e",
         "approved_by": "eng-c",
         "purpose_declared": True, "inputs_declared": True,
         "assumptions_declared": True,
         "standards_cited_declared": True, "units_declared": True,
         "results_declared": True, "check_signature_declared": True},
    ],
    "document_control": {
        "numbering_naming_convention_declared": True,
        "status_flow_declared": True,
        "unapproved_revision_used_for_construction_present": False,
        "untraceable_changes_present": False,
        "superseded_versions_deleted_present": False,
        "uncontrolled_copies_present": False},
    "check_discipline": {"redline_backcheck_process_declared": True},
    "transmittals": [
        {"document": "motor-calc", "recipient": "client",
         "revision": "C", "date": "2027-03-01",
         "return_status_declared": True},
        {"document": "motor-datasheet", "recipient": "vendor",
         "revision": "A", "date": "2027-03-02",
         "return_status_declared": True},
    ],
    "transmittal_log": {"log_current_declared": True,
                        "verbal_issue_present": False},
    "handover": {"as_built_marked": True,
                 "om_references_declared": True,
                 "spares_list_declared": True,
                 "test_records_pointer_declared": True,
                 "training_notes_declared": True,
                 "closeout_checklist_signed": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_structured(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "WORK_PACKAGE_STRUCTURED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 42)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["deliverables_count"], 3)
        self.assertEqual(v["deliverables_with_invalid_kind"], [])
        self.assertEqual(v["documents_count"], 3)
        self.assertEqual(v["documents_with_invalid_status"], [])
        self.assertEqual(v["documents_without_revision"], [])
        self.assertEqual(v["signoff_coverage"], "1.000000")
        self.assertEqual(v["calculations_not_independently_checked"],
                         [])
        self.assertEqual(v["independent_check_coverage"], "1.000000")
        self.assertEqual(v["transmittals_count"], 2)
        self.assertEqual(v["transmittals_with_unknown_document"], [])
        self.assertEqual(v["transmittals_with_revision_mismatch"], [])
        self.assertEqual(v["transmittal_document_coverage"],
                         "1.000000")

    def test_objective_missing_is_insufficient(self):
        m = copy.deepcopy(COMPLETE)
        del m["definition"]["objective_declared"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["package_definition"],
                         "insufficient_evidence")

    def test_scope_out_not_declared_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["definition"]["scope_out_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "WORK_PACKAGE_NOT_STRUCTURED")
        self.assertEqual(v["sections"]["package_definition"], "fail")

    def test_gaps_documented_satisfies_deliverables_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["definition"]["deliverables_list_agreed"] = False
        m["definition"]["deliverable_gaps_documented"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "deliverables_agreed_or_gaps_documented"),
            "pass")
        self.assertEqual(v["verdict"], "WORK_PACKAGE_STRUCTURED")

    def test_deliverables_not_agreed_and_gaps_undocumented_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["definition"]["deliverables_list_agreed"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "deliverables_agreed_or_gaps_documented"),
            "fail")
        self.assertEqual(v["verdict"], "WORK_PACKAGE_NOT_STRUCTURED")

    def test_empty_deliverables_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["deliverables"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "deliverables_declared"),
                         "fail")
        self.assertEqual(v["deliverables_count"], 0)

    def test_deliverable_with_invalid_kind_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["deliverables"][1]["kind"] = "memo"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_deliverable_has_skill_kind"),
            "fail")
        self.assertEqual(v["deliverables_with_invalid_kind"],
                         ["motor-datasheet"])

    def test_deliverable_missing_kind_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["deliverables"][0]["kind"]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_deliverable_has_skill_kind"),
            "missing")
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_unapproved_revision_for_construction_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["document_control"][
            "unapproved_revision_used_for_construction_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "WORK_PACKAGE_NOT_STRUCTURED")
        self.assertEqual(
            v["sections"]["document_control_and_revisions"], "fail")
        self.assertEqual(
            check_status(
                v, "no_unapproved_revision_used_for_construction"),
            "fail")

    def test_superseded_versions_deleted_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["document_control"][
            "superseded_versions_deleted_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "WORK_PACKAGE_NOT_STRUCTURED")

    def test_untraceable_changes_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["document_control"]["untraceable_changes_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "WORK_PACKAGE_NOT_STRUCTURED")

    def test_uncontrolled_copies_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["document_control"]["uncontrolled_copies_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "WORK_PACKAGE_NOT_STRUCTURED")

    def test_document_with_invalid_status_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][2]["status"] = "Issued"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_document_has_flow_status"), "fail")
        self.assertEqual(v["documents_with_invalid_status"],
                         ["pump-drawing"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_document_without_revision_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][0]["revision"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_document_has_revision"), "fail")
        self.assertEqual(v["documents_without_revision"],
                         ["motor-calc"])

    def test_document_missing_revision_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["documents"][1]["revision"]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_document_has_revision"), "missing")
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_document_without_revision_reason_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][1]["revision_reason_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v,
                         "every_document_declares_revision_reason"),
            "fail")
        self.assertEqual(v["documents_without_revision_reason"],
                         ["motor-datasheet"])

    def test_document_without_revision_history_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][2]["revision_history_present"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_document_has_revision_history"),
            "fail")
        self.assertEqual(v["documents_without_revision_history"],
                         ["pump-drawing"])

    def test_calculation_checked_by_designer_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][0]["checker"] = "eng-a"
        v = evaluate(m)
        self.assertEqual(
            check_status(v,
                         "every_calculation_independently_checked"),
            "fail")
        self.assertEqual(
            v["calculations_not_independently_checked"],
            ["motor-calc"])
        self.assertEqual(v["independent_check_coverage"], "0.000000")

    def test_calculation_missing_checker_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["documents"][0]["checker"]
        v = evaluate(m)
        self.assertEqual(
            check_status(v,
                         "every_calculation_independently_checked"),
            "missing")
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_non_calculation_same_designer_checker_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][1]["checker"] = "eng-a"
        v = evaluate(m)
        self.assertEqual(
            check_status(v,
                         "every_calculation_independently_checked"),
            "pass")
        self.assertEqual(v["verdict"], "WORK_PACKAGE_STRUCTURED")

    def test_document_with_incomplete_signoff_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][1]["approved_by"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_document_signoff_complete"),
            "fail")
        self.assertEqual(v["documents_with_incomplete_signoff"],
                         ["motor-datasheet"])
        self.assertEqual(v["signoff_coverage"], "0.666667")

    def test_empty_documents_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "documents_declared"),
                         "fail")
        self.assertEqual(v["documents_count"], 0)
        self.assertIsNone(v["signoff_coverage"])
        self.assertIsNone(v["independent_check_coverage"])
        self.assertEqual(v["transmittal_document_coverage"],
                         "0.000000")

    def test_transmittal_with_unknown_document_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["transmittals"][0]["document"] = "cable-schedule"
        v = evaluate(m)
        self.assertEqual(
            check_status(v,
                         "every_transmittal_names_declared_document"),
            "fail")
        self.assertEqual(v["transmittals_with_unknown_document"],
                         ["cable-schedule"])
        self.assertEqual(v["transmittal_document_coverage"],
                         "0.500000")

    def test_transmittal_without_recipient_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["transmittals"][1]["recipient"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_transmittal_has_recipient"),
            "fail")
        self.assertEqual(v["transmittals_without_recipient"],
                         ["motor-datasheet"])

    def test_transmittal_revision_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["transmittals"][0]["revision"] = "B"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_transmittal_revision_matches_document"),
            "fail")
        self.assertEqual(v["transmittals_with_revision_mismatch"],
                         ["motor-calc"])

    def test_transmittal_with_invalid_date_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["transmittals"][0]["date"] = "2027-02-30"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_transmittal_has_valid_date"),
            "fail")
        self.assertEqual(v["transmittals_with_invalid_date"],
                         ["motor-calc"])

    def test_transmittal_without_return_status_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["transmittals"][1]["return_status_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v,
                         "every_transmittal_declares_return_status"),
            "fail")
        self.assertEqual(v["transmittals_without_return_status"],
                         ["motor-datasheet"])

    def test_verbal_issue_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["transmittal_log"]["verbal_issue_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "WORK_PACKAGE_NOT_STRUCTURED")
        self.assertEqual(check_status(v, "no_verbal_issue"), "fail")

    def test_transmittal_log_not_current_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["transmittal_log"]["log_current_declared"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "WORK_PACKAGE_NOT_STRUCTURED")

    def test_document_missing_units_fails_quality(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][0]["units_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v,
                         "every_document_declares_quality_elements"),
            "fail")
        self.assertEqual(v["documents_missing_quality_elements"],
                         ["motor-calc"])
        self.assertEqual(
            v["sections"]["delivery_quality_and_handover"], "fail")

    def test_document_without_check_signature_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][2]["check_signature_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_document_declares_assumptions_and_check_signature"),
            "fail")
        self.assertEqual(
            v["documents_missing_assumptions_or_signature"],
            ["pump-drawing"])

    def test_document_without_assumptions_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][1]["assumptions_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            v["documents_missing_assumptions_or_signature"],
            ["motor-datasheet"])

    def test_handover_closeout_unsigned_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["handover"]["closeout_checklist_signed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "WORK_PACKAGE_NOT_STRUCTURED")
        self.assertEqual(
            v["sections"]["delivery_quality_and_handover"], "fail")

    def test_handover_section_missing_is_insufficient(self):
        m = copy.deepcopy(COMPLETE)
        del m["handover"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["delivery_quality_and_handover"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["deliverables_count"])
        self.assertIsNone(v["documents_count"])
        self.assertIsNone(v["transmittals_count"])
        self.assertIsNone(v["signoff_coverage"])
        self.assertIsNone(v["independent_check_coverage"])
        self.assertIsNone(v["transmittal_document_coverage"])
        self.assertIsNone(v["transmittals_with_unknown_document"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: WORK_PACKAGE_STRUCTURED", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with FieldTypeError (both a ValueError
    and a TypeError) naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["package"] = 12345
        with self.assertRaises(FieldTypeError) as ctx:
            evaluate(m)
        self.assertIn("package", str(ctx.exception))
        self.assertIsInstance(ctx.exception, TypeError)
        self.assertIsInstance(ctx.exception, ValueError)

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(FieldTypeError) as ctx:
            evaluate({"definition": "should-be-an-object"})
        self.assertIn("definition", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(FieldTypeError) as ctx:
            evaluate({"documents": {"name": "motor-calc"}})
        self.assertIn("documents", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(FieldTypeError) as ctx:
            evaluate({"documents": ["motor-calc"]})
        self.assertIn("documents[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["definition"]["objective_declared"] = "yes"
        with self.assertRaises(FieldTypeError) as ctx:
            evaluate(m)
        self.assertIn("definition.objective_declared",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][1]["revision"] = 42
        with self.assertRaises(FieldTypeError) as ctx:
            evaluate(m)
        self.assertIn("documents[1].revision", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][0]["revision_history_present"] = "yes"
        with self.assertRaises(FieldTypeError) as ctx:
            evaluate(m)
        self.assertIn("documents[0].revision_history_present",
                      str(ctx.exception))

    def test_transmittal_entry_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["transmittals"][0]["date"] = True
        with self.assertRaises(FieldTypeError) as ctx:
            evaluate(m)
        self.assertIn("transmittals[0].date", str(ctx.exception))

    def test_deliverable_entry_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["deliverables"][0]["kind"] = 7
        with self.assertRaises(FieldTypeError) as ctx:
            evaluate(m)
        self.assertIn("deliverables[0].kind", str(ctx.exception))

    def test_false_check_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["document_control"]["untraceable_changes_present"] = "no"
        with self.assertRaises(FieldTypeError) as ctx:
            evaluate(m)
        self.assertIn(
            "document_control.untraceable_changes_present",
            str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["handover"] = None
        with self.assertRaises(FieldTypeError) as ctx:
            evaluate(m)
        self.assertIn("handover", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
