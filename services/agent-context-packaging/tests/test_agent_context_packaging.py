import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from agent_context_packaging import evaluate, stamp  # noqa: E402

FULL = {
    "pack": "milo setup for new machine",
    "scope": {"what_travels_declared": True,
              "recipient_declared": True,
              "purpose_declared": True,
              "pack_inherits_boundary": True},
    "redaction": {"keys_replaced_with_environment_references": True,
                  "personal_data_minimized_purpose_limited": True,
                  "contacts_or_financials_included": False,
                  "scan_clean_automated_and_manual": True,
                  "secrets_or_pii_unredacted_present": False},
    "manifest": {"manifest_present": True,
                 "manifest_lists_contents_version_date_generator_and_source": True},
    "structure": {"stable_folder_layout": True,
                  "receiver_runbook_present": True,
                  "receiver_runbook_tested": True},
    "reproducibility": {"generated_by_script_from_source_of_truth": True,
                        "hand_assembled": False,
                        "derived_pack_hand_maintained_silently": False,
                        "versioned_in_git": True},
    "signing": {"pack_signed": True},
    "handoff": {"is_handoff_dossier": True,
                "dossier_contents_complete": True,
                "everything_dated": True,
                "review_date_marked": True},
    "freshness": {"expiry_or_review_date_present": True,
                  "stale_packs_flagged": True,
                  "single_upstream_source_derived_not_primary": True},
    "privacy": {"stored_privately": True,
                "access_limited": True,
                "contact_handling_rules_complied": True,
                "third_party_personal_data_included": True,
                "lawful_basis_established": True},
}


def sound():
    return copy.deepcopy(FULL)


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_pack_sound(self):
        v = evaluate(sound())
        self.assertEqual(v["verdict"], "PACK_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 29)
        self.assertEqual(v["pack"], "milo setup for new machine")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(
            s == "insufficient_evidence" for s in v["sections"].values()))

    def test_absent_section_is_insufficient_not_failed(self):
        m = sound()
        del m["privacy"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["freshness_and_privacy"],
                         "insufficient_evidence")

    def test_scope_what_not_declared_fails(self):
        m = sound()
        m["scope"]["what_travels_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PACK_NOT_SOUND")
        self.assertEqual(v["sections"]["scope_declaration"], "fail")

    def test_scope_recipient_not_declared_fails(self):
        m = sound()
        m["scope"]["recipient_declared"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_scope_purpose_not_declared_fails(self):
        m = sound()
        m["scope"]["purpose_declared"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_pack_not_inheriting_scope_boundary_fails(self):
        m = sound()
        m["scope"]["pack_inherits_boundary"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_keys_not_replaced_with_env_references_fails(self):
        m = sound()
        m["redaction"]["keys_replaced_with_environment_references"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PACK_NOT_SOUND")
        self.assertEqual(v["sections"]["redaction"], "fail")

    def test_personal_data_not_minimized_fails(self):
        m = sound()
        m["redaction"]["personal_data_minimized_purpose_limited"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_contacts_or_financials_included_fails(self):
        m = sound()
        m["redaction"]["contacts_or_financials_included"] = True
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_redaction_scan_not_clean_fails(self):
        m = sound()
        m["redaction"]["scan_clean_automated_and_manual"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_unredacted_secrets_or_pii_fails_red_line(self):
        m = sound()
        m["redaction"]["secrets_or_pii_unredacted_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PACK_NOT_SOUND")
        self.assertEqual(v["sections"]["redaction"], "fail")

    def test_manifest_absent_fails(self):
        m = sound()
        m["manifest"]["manifest_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PACK_NOT_SOUND")
        self.assertEqual(v["sections"]["structure_and_manifest"], "fail")

    def test_manifest_incomplete_fails(self):
        m = sound()
        m["manifest"][
            "manifest_lists_contents_version_date_generator_and_source"
        ] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_unstable_folder_layout_fails(self):
        m = sound()
        m["structure"]["stable_folder_layout"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_runbook_absent_fails(self):
        m = sound()
        m["structure"]["receiver_runbook_present"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_runbook_untested_fails(self):
        m = sound()
        m["structure"]["receiver_runbook_tested"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_not_generated_by_script_fails(self):
        m = sound()
        m["reproducibility"][
            "generated_by_script_from_source_of_truth"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PACK_NOT_SOUND")
        self.assertEqual(v["sections"]["reproducibility_and_signing"],
                         "fail")

    def test_hand_assembled_fails(self):
        m = sound()
        m["reproducibility"]["hand_assembled"] = True
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_hand_maintained_silently_fails_red_line(self):
        m = sound()
        m["reproducibility"]["derived_pack_hand_maintained_silently"] = True
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_not_versioned_in_git_fails(self):
        m = sound()
        m["reproducibility"]["versioned_in_git"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_unsigned_pack_fails(self):
        m = sound()
        m["signing"]["pack_signed"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_dossier_contents_incomplete_fails(self):
        m = sound()
        m["handoff"]["dossier_contents_complete"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PACK_NOT_SOUND")
        self.assertEqual(v["sections"]["handoff_dossier"], "fail")

    def test_dossier_contents_missing_is_insufficient(self):
        m = sound()
        del m["handoff"]["dossier_contents_complete"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["handoff_dossier"],
                         "insufficient_evidence")

    def test_no_dossier_passes_contents_as_not_applicable(self):
        m = sound()
        m["handoff"]["is_handoff_dossier"] = False
        del m["handoff"]["dossier_contents_complete"]
        self.assertEqual(evaluate(m)["verdict"], "PACK_SOUND")

    def test_everything_not_dated_fails(self):
        m = sound()
        m["handoff"]["everything_dated"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_review_date_not_marked_fails(self):
        m = sound()
        m["handoff"]["review_date_marked"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_no_expiry_or_review_date_fails(self):
        m = sound()
        m["freshness"]["expiry_or_review_date_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PACK_NOT_SOUND")
        self.assertEqual(v["sections"]["freshness_and_privacy"], "fail")

    def test_stale_packs_not_flagged_fails(self):
        m = sound()
        m["freshness"]["stale_packs_flagged"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_export_as_primary_source_fails(self):
        m = sound()
        m["freshness"]["single_upstream_source_derived_not_primary"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_not_stored_privately_fails(self):
        m = sound()
        m["privacy"]["stored_privately"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_access_not_limited_fails(self):
        m = sound()
        m["privacy"]["access_limited"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_contact_handling_not_complied_fails(self):
        m = sound()
        m["privacy"]["contact_handling_rules_complied"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_third_party_data_without_lawful_basis_fails(self):
        m = sound()
        m["privacy"]["lawful_basis_established"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PACK_NOT_SOUND")
        self.assertEqual(v["sections"]["freshness_and_privacy"], "fail")

    def test_third_party_data_lawful_basis_missing_is_insufficient(self):
        m = sound()
        del m["privacy"]["lawful_basis_established"]
        self.assertEqual(evaluate(m)["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_no_third_party_data_passes_basis_as_not_applicable(self):
        m = sound()
        m["privacy"]["third_party_personal_data_included"] = False
        del m["privacy"]["lawful_basis_established"]
        self.assertEqual(evaluate(m)["verdict"], "PACK_SOUND")

    def test_non_boolean_true_value_fails_bool_check(self):
        # Corrected under the F1 ruling: previously expected a
        # verdict over a wrong-typed documented field (the F1
        # defect). A non-boolean value is now rejected with
        # ValueError naming the field.
        m = sound()
        m["scope"]["what_travels_declared"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("scope.what_travels_declared", str(ctx.exception))

    def test_missing_single_field_is_insufficient(self):
        m = sound()
        del m["signing"]["pack_signed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["reproducibility_and_signing"],
                         "insufficient_evidence")

    def test_fail_beats_missing(self):
        m = sound()
        del m["signing"]["pack_signed"]
        m["scope"]["purpose_declared"] = False
        self.assertEqual(evaluate(m)["verdict"], "PACK_NOT_SOUND")

    def test_stamp_names_the_verdict(self):
        v = evaluate(sound())
        s = stamp(v)
        self.assertIn("VERDICT: PACK_SOUND", s)
        self.assertIn("pack: milo setup for new machine", s)

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])
        with self.assertRaises(TypeError):
            evaluate("not a manifest")


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = sound()
        m["pack"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pack", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"scope": "should-be-an-object"})
        self.assertIn("scope", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = sound()
        m["scope"]["what_travels_declared"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("scope.what_travels_declared", str(ctx.exception))

    def test_null_section_rejected(self):
        m = sound()
        m["privacy"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("privacy", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
