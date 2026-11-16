#!/usr/bin/env python3
"""Agent context packaging — deterministic core.

Built from the bound skill `context-packaging` (v1): "Package
context and configs for agents — redaction, reproducibility,
handoffs, versioned exports." Configs and context that travel must
arrive safe, reproducible, and actually usable: redact first,
generate (never hand-maintain), version everything.

The caller submits a context-pack manifest (a dict, or JSON on the
CLI): a DECLARED pack — what it claims travels, to whom and why,
how it was redacted, how it is structured, how it was generated
and signed, what its handoff dossier carries, and its freshness
and privacy posture. Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Two checks are conditional, following the skill's own scope:

- the handoff-dossier contents check applies only when the pack
  is declared to be a handoff dossier (`handoff.is_handoff_dossier`
  true): a dossier must carry goals, current state, open loops,
  contact/protocol rules and first tasks. When no dossier is
  declared, the check passes as not applicable;
- the third-party personal-data check applies only when such data
  is declared included (`privacy.third_party_personal_data_included`
  true): it then requires a lawful basis to be established. When
  none is included, the check passes as not applicable.

The skill states NO numeric threshold, limit, expiry period or
scoring formula, so none is computed and none is invented: dates
and review dates are checked for declared presence only, never
compared against a clock (that would also break determinism).

Verdict (one failure breaks the pack — the skill's red lines:
never export secrets or PII unredacted; never hand-maintain a
derived pack silently; every pack carries date + source):
- any fail             -> PACK_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> PACK_SOUND

This atom audits DECLARED evidence about a pack — it does not
open the pack, run a secret scanner, verify a signature, or test
the runbook itself.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "scope_declaration",
    "redaction",
    "structure_and_manifest",
    "reproducibility_and_signing",
    "handoff_dossier",
    "freshness_and_privacy",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "pack": "string",
    "scope": {
        "what_travels_declared": "boolean",
        "recipient_declared": "boolean",
        "purpose_declared": "boolean",
        "pack_inherits_boundary": "boolean",
    },
    "redaction": {
        "keys_replaced_with_environment_references": "boolean",
        "personal_data_minimized_purpose_limited": "boolean",
        "contacts_or_financials_included": "boolean",
        "scan_clean_automated_and_manual": "boolean",
        "secrets_or_pii_unredacted_present": "boolean",
    },
    "manifest": {
        "manifest_present": "boolean",
        "manifest_lists_contents_version_date_generator_and_source": "boolean",
    },
    "structure": {
        "stable_folder_layout": "boolean",
        "receiver_runbook_present": "boolean",
        "receiver_runbook_tested": "boolean",
    },
    "reproducibility": {
        "generated_by_script_from_source_of_truth": "boolean",
        "hand_assembled": "boolean",
        "derived_pack_hand_maintained_silently": "boolean",
        "versioned_in_git": "boolean",
    },
    "signing": {"pack_signed": "boolean"},
    "handoff": {
        "is_handoff_dossier": "boolean",
        "dossier_contents_complete": "boolean",
        "everything_dated": "boolean",
        "review_date_marked": "boolean",
    },
    "freshness": {
        "expiry_or_review_date_present": "boolean",
        "stale_packs_flagged": "boolean",
        "single_upstream_source_derived_not_primary": "boolean",
    },
    "privacy": {
        "stored_privately": "boolean",
        "access_limited": "boolean",
        "contact_handling_rules_complied": "boolean",
        "third_party_personal_data_included": "boolean",
        "lawful_basis_established": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def evaluate(manifest):
    """Return the verdict dict for an agent context-pack manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: scope_declaration (skill method 1: scope
    #      declaration first — what travels, to whom, and why;
    #      write it down; the pack inherits this boundary) ----
    _bool_check(results, "scope_declaration", "scope_what_travels_declared",
                manifest, ("scope", "what_travels_declared"),
                "scope declaration first: what travels (config / rules / "
                "skills / state summaries / dossiers) is written down")
    _bool_check(results, "scope_declaration", "scope_recipient_declared",
                manifest, ("scope", "recipient_declared"),
                "scope declaration first: to whom the pack travels is "
                "written down")
    _bool_check(results, "scope_declaration", "scope_purpose_declared",
                manifest, ("scope", "purpose_declared"),
                "scope declaration first: why the pack travels is "
                "written down")
    _bool_check(results, "scope_declaration", "pack_inherits_scope_boundary",
                manifest, ("scope", "pack_inherits_boundary"),
                "the pack inherits the declared scope boundary")

    # ---- Section 2: redaction (skill method 2 + quality gate 1 +
    #      red line: never export secrets or PII unredacted) ----
    _bool_check(results, "redaction",
                "keys_replaced_with_environment_references",
                manifest,
                ("redaction", "keys_replaced_with_environment_references"),
                "redaction before anything: keys become environment "
                "references")
    _bool_check(results, "redaction",
                "personal_data_minimized_purpose_limited",
                manifest,
                ("redaction", "personal_data_minimized_purpose_limited"),
                "redaction: personal data is minimized (purpose-limited)")
    _false_check(results, "redaction",
                 "contacts_and_financials_excluded_by_default",
                 manifest, ("redaction", "contacts_or_financials_included"),
                 "redaction: contacts / financials are excluded by default")
    _bool_check(results, "redaction",
                "redaction_scan_clean_automated_and_manual",
                manifest, ("redaction", "scan_clean_automated_and_manual"),
                "quality gate: redaction scan clean (automated secret "
                "scanners + a manual pass); assume the receiver's storage "
                "is less protected than yours")
    _false_check(results, "redaction", "no_unredacted_secrets_or_pii",
                 manifest, ("redaction", "secrets_or_pii_unredacted_present"),
                 "red line: never export secrets or PII unredacted")

    # ---- Section 3: structure_and_manifest (skill method 3 +
    #      quality gates 2-3 + red line: every pack carries
    #      date + source) ----
    _bool_check(results, "structure_and_manifest", "manifest_present",
                manifest, ("manifest", "manifest_present"),
                "structure: a manifest is present")
    _bool_check(results, "structure_and_manifest",
                "manifest_lists_contents_version_date_generator_and_source",
                manifest,
                ("manifest",
                 "manifest_lists_contents_version_date_generator_and_source"),
                "structure: the manifest lists contents, version, date "
                "and generator; red line: every pack carries date + source")
    _bool_check(results, "structure_and_manifest", "stable_folder_layout",
                manifest, ("structure", "stable_folder_layout"),
                "structure: a stable folder layout, machine-readable "
                "where possible")
    _bool_check(results, "structure_and_manifest",
                "receiver_runbook_present",
                manifest, ("structure", "receiver_runbook_present"),
                "structure: a README / runbook for the receiving agent "
                "is present")
    _bool_check(results, "structure_and_manifest",
                "receiver_runbook_tested",
                manifest, ("structure", "receiver_runbook_tested"),
                "quality gate: receiver runbook tested — a fresh agent "
                "can operate from the pack")

    # ---- Section 4: reproducibility_and_signing (skill method 4 +
    #      quality gate 4 + red line: never hand-maintain a derived
    #      pack silently) ----
    _bool_check(results, "reproducibility_and_signing",
                "generated_by_script_from_source_of_truth",
                manifest,
                ("reproducibility",
                 "generated_by_script_from_source_of_truth"),
                "reproducibility: exports are generated by a script from "
                "the source of truth")
    _false_check(results, "reproducibility_and_signing",
                 "not_hand_assembled",
                 manifest, ("reproducibility", "hand_assembled"),
                 "reproducibility: exports are never hand-assembled")
    _false_check(results, "reproducibility_and_signing",
                 "not_hand_maintained_silently",
                 manifest,
                 ("reproducibility", "derived_pack_hand_maintained_silently"),
                 "red line: never hand-maintain a derived pack silently")
    _bool_check(results, "reproducibility_and_signing", "versioned_in_git",
                manifest, ("reproducibility", "versioned_in_git"),
                "reproducibility: exports are versioned in git")
    _bool_check(results, "reproducibility_and_signing", "pack_signed",
                manifest, ("signing", "pack_signed"),
                "reproducibility / quality gate: the pack is signed so "
                "authenticity is checkable; stored privately")

    # ---- Section 5: handoff_dossier (skill method 5: goals,
    #      current state, open loops, contact/protocol rules, first
    #      tasks; date everything; mark review date) ----
    is_dossier, has_is_dossier = _get(manifest, "handoff",
                                      "is_handoff_dossier")
    contents, has_contents = _get(manifest, "handoff",
                                  "dossier_contents_complete")
    if has_is_dossier and is_dossier:
        _check(results, "handoff_dossier",
               "dossier_contents_complete_when_dossier",
               contents, has_contents, contents is True,
               "handoff dossiers carry goals, current state, open "
               "loops, contact/protocol rules and first tasks")
    else:
        _check(results, "handoff_dossier",
               "dossier_contents_complete_when_dossier",
               is_dossier, has_is_dossier, True,
               "no handoff dossier declared")
    _bool_check(results, "handoff_dossier", "everything_dated",
                manifest, ("handoff", "everything_dated"),
                "handoff dossiers: date everything")
    _bool_check(results, "handoff_dossier",
                "review_date_marked_against_stale_claims",
                manifest, ("handoff", "review_date_marked"),
                "handoff dossiers: avoid stale claims — mark the "
                "review date")

    # ---- Section 6: freshness_and_privacy (skill methods 6-7:
    #      expiry/review dates, stale packs flagged, single upstream
    #      source; private, access-limited, contact-handling rules,
    #      no third-party personal data without a lawful basis) ----
    _bool_check(results, "freshness_and_privacy",
                "expiry_or_review_date_present",
                manifest, ("freshness", "expiry_or_review_date_present"),
                "freshness: expiry / review dates are present")
    _bool_check(results, "freshness_and_privacy", "stale_packs_flagged",
                manifest, ("freshness", "stale_packs_flagged"),
                "freshness: stale packs are flagged")
    _bool_check(results, "freshness_and_privacy",
                "single_upstream_source_export_derived_not_primary",
                manifest,
                ("freshness", "single_upstream_source_derived_not_primary"),
                "freshness: a single upstream source — the export is "
                "derived, never the primary")
    _bool_check(results, "freshness_and_privacy", "stored_privately",
                manifest, ("privacy", "stored_privately"),
                "privacy / quality gate: private repos — the pack is "
                "stored privately")
    _bool_check(results, "freshness_and_privacy", "access_limited",
                manifest, ("privacy", "access_limited"),
                "privacy: access to the pack is limited")
    _bool_check(results, "freshness_and_privacy",
                "contact_handling_rules_complied",
                manifest, ("privacy", "contact_handling_rules_complied"),
                "privacy: the pack complies with contact-handling rules")
    tp_included, has_tp = _get(manifest, "privacy",
                               "third_party_personal_data_included")
    lawful, has_lawful = _get(manifest, "privacy",
                              "lawful_basis_established")
    if has_tp and tp_included:
        _check(results, "freshness_and_privacy",
               "third_party_personal_data_lawful_basis_when_included",
               lawful, has_lawful, lawful is True,
               "privacy: no third-party personal data without a "
               "lawful basis")
    else:
        _check(results, "freshness_and_privacy",
               "third_party_personal_data_lawful_basis_when_included",
               tp_included, has_tp, True,
               "no third-party personal data declared included")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "PACK_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "PACK_SOUND"

    return {
        "service": "agent-context-packaging",
        "atom_version": "0.1.0",
        "pack": manifest.get("pack"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "AGENT CONTEXT PACKAGING VERDICT",
        f"pack: {verdict.get('pack')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: agent_context_packaging.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "PACK_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
