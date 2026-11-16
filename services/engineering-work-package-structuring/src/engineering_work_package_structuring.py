#!/usr/bin/env python3
"""Engineering work package structuring — deterministic core.

Built from the bound skill `engineering-work-packages`: "Run
engineering work packages — scope, deliverables, document
control, revisions, checks, transmittals, handover." A work
package is the unit of engineering delivery: bounded scope,
listed deliverables, controlled documents, checked work, clean
handover.

This atom is an AUDIT of a declared work-package structure
record: it validates the record a caller declares against the
skill's method — package definition, document control and
revisions, check discipline and transmittals, delivery quality
and handover. It does not structure the package, write or check
any document, issue any transmittal, or verify that a declared
control actually happens — it checks that the record the skill
requires is present and internally complete and consistent on
the declared evidence.

The caller submits a work-package manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- deliverables: the declared `deliverables` list must be
  non-empty and every declared deliverable row must carry a
  kind from the skill's own deliverables vocabulary — calc
  package, datasheet, drawing, test plan, procedure, BOM,
  report;
- documents: the declared `documents` list must be non-empty,
  every declared document row must carry a status from the
  skill's own status flow — Draft, For Review, For Approval,
  For Construction, As-Built — a non-empty revision, a declared
  revision reason and a present revision-history table, and a
  complete sign-off block (prepared / reviewed / approved all
  named);
- calculations: every declared document of kind `calc package`
  must be independently checked — a named designer and a named
  checker, and designer != checker (the skill's check
  discipline);
- transmittals: the declared `transmittals` list must be
  non-empty, every declared transmittal row must name a
  declared document, name a non-empty recipient, carry the
  named document's declared current revision, carry a valid
  ISO issue date, and declare its return status (the skill's
  transmittal log shape: what was issued, to whom, which
  revision, when — and the return status);
- delivery quality: every declared document row must declare
  the skill's document elements — purpose, inputs, assumptions,
  standards cited, units, results — and a check signature, with
  assumptions declared explicit, never embedded.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold — no deliverable,
document or transmittal count, no revision count, no schedule
or budget limit — so no numeric threshold check is invented;
quantities are computed and reported, and completeness (every
declared deliverable / document / transmittal) is the only
bar, exactly as the task's declared-row consistency requires.

Verdict:
- any fail             -> WORK_PACKAGE_NOT_STRUCTURED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> WORK_PACKAGE_STRUCTURED

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import datetime
import json
import math
import re
import sys

SECTIONS = (
    "package_definition",
    "document_control_and_revisions",
    "check_discipline_and_transmittals",
    "delivery_quality_and_handover",
)


class FieldTypeError(ValueError, TypeError):
    """A documented manifest field present with the wrong JSON
    type. Dual-inherits ValueError (the gateway maps it to HTTP
    422 invalid_input, as in every sibling oracle) and TypeError
    (the F1 contract: a wrong-typed documented field is a type
    error naming the field path)."""


# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (FieldTypeError ->
# the gateway's HTTP 422 invalid_input), never evidence: F1
# remedy, external verification Wave 1. Absent fields are not
# validated — absence is missing evidence, decided by the checks
# below.
MANIFEST_SPEC = {
    "package": "string",
    "definition": {
        "objective_declared": "boolean",
        "scope_in_declared": "boolean",
        "scope_out_declared": "boolean",
        "standards_declared": "boolean",
        "site_rules_declared": "boolean",
        "interfaces_declared": "boolean",
        "budget_link_declared": "boolean",
        "schedule_declared": "boolean",
        "acceptance_criteria_declared": "boolean",
        "deliverables_list_agreed": "boolean",
        "deliverable_gaps_documented": "boolean",
    },
    "deliverables": [{
        "name": "string",
        "kind": "string",
    }],
    "documents": [{
        "name": "string",
        "kind": "string",
        "status": "string",
        "revision": "string",
        "revision_reason_declared": "boolean",
        "revision_history_present": "boolean",
        "designer": "string",
        "checker": "string",
        "prepared_by": "string",
        "reviewed_by": "string",
        "approved_by": "string",
        "purpose_declared": "boolean",
        "inputs_declared": "boolean",
        "assumptions_declared": "boolean",
        "standards_cited_declared": "boolean",
        "units_declared": "boolean",
        "results_declared": "boolean",
        "check_signature_declared": "boolean",
    }],
    "document_control": {
        "numbering_naming_convention_declared": "boolean",
        "status_flow_declared": "boolean",
        "unapproved_revision_used_for_construction_present": "boolean",
        "untraceable_changes_present": "boolean",
        "superseded_versions_deleted_present": "boolean",
        "uncontrolled_copies_present": "boolean",
    },
    "check_discipline": {
        "redline_backcheck_process_declared": "boolean",
    },
    "transmittals": [{
        "document": "string",
        "recipient": "string",
        "revision": "string",
        "date": "string",
        "return_status_declared": "boolean",
    }],
    "transmittal_log": {
        "log_current_declared": "boolean",
        "verbal_issue_present": "boolean",
    },
    "handover": {
        "as_built_marked": "boolean",
        "om_references_declared": "boolean",
        "spares_list_declared": "boolean",
        "test_records_pointer_declared": "boolean",
        "training_notes_declared": "boolean",
        "closeout_checklist_signed": "boolean",
    },
}

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_KINDS = (
    "calc package", "datasheet", "drawing", "test plan",
    "procedure", "BOM", "report",
)
_STATUSES = (
    "Draft", "For Review", "For Approval", "For Construction",
    "As-Built",
)
_CALC_KIND = "calc package"
_QUALITY_FIELDS = (
    "purpose_declared", "inputs_declared",
    "standards_cited_declared", "units_declared",
    "results_declared",
)


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise FieldTypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise FieldTypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise FieldTypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise FieldTypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise FieldTypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _transmittal_name(entry):
    if isinstance(entry, dict) \
            and isinstance(entry.get("document"), str) \
            and len(entry["document"]) > 0:
        return entry["document"]
    return "unnamed"


def _parse_date(value):
    """Strict ISO YYYY-MM-DD -> datetime.date, or None."""
    if not isinstance(value, str) or not _DATE_RE.match(value):
        return None
    try:
        return datetime.date(
            int(value[0:4]), int(value[5:7]), int(value[8:10]))
    except ValueError:
        return None


def _has_nonempty_str(entry, field):
    return (
        isinstance(entry, dict)
        and isinstance(entry.get(field), str)
        and len(entry[field]) > 0
    )


def _signoff_complete(entry):
    return (
        _has_nonempty_str(entry, "prepared_by")
        and _has_nonempty_str(entry, "reviewed_by")
        and _has_nonempty_str(entry, "approved_by")
    )


def _is_calc(entry):
    return isinstance(entry, dict) and entry.get("kind") == _CALC_KIND


def _independently_checked(entry):
    return (
        _has_nonempty_str(entry, "designer")
        and _has_nonempty_str(entry, "checker")
        and entry["designer"] != entry["checker"]
    )


def evaluate(manifest):
    """Return the verdict dict for a work-package manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    deliverables, has_deliverables = _get(manifest, "deliverables")
    deliverables_is_list = has_deliverables \
        and isinstance(deliverables, list)
    documents, has_documents = _get(manifest, "documents")
    documents_is_list = has_documents and isinstance(documents, list)
    transmittals, has_transmittals = _get(manifest, "transmittals")
    transmittals_is_list = has_transmittals \
        and isinstance(transmittals, list)

    deliverables_count = len(deliverables) if deliverables_is_list \
        else None
    documents_count = len(documents) if documents_is_list else None
    transmittals_count = len(transmittals) if transmittals_is_list \
        else None

    document_by_name = (
        {d["name"]: d for d in documents
         if isinstance(d, dict) and isinstance(d.get("name"), str)}
        if documents_is_list else {}
    )

    deliverables_with_invalid_kind = (
        [_row_name(d) for d in deliverables
         if not (isinstance(d, dict) and d.get("kind") in _KINDS)]
        if deliverables_is_list else None
    )

    documents_with_invalid_status = (
        [_row_name(d) for d in documents
         if not (isinstance(d, dict) and d.get("status") in _STATUSES)]
        if documents_is_list else None
    )
    documents_without_revision = (
        [_row_name(d) for d in documents
         if not _has_nonempty_str(d, "revision")]
        if documents_is_list else None
    )
    documents_without_revision_reason = (
        [_row_name(d) for d in documents
         if not (isinstance(d, dict)
                 and d.get("revision_reason_declared") is True)]
        if documents_is_list else None
    )
    documents_without_revision_history = (
        [_row_name(d) for d in documents
         if not (isinstance(d, dict)
                 and d.get("revision_history_present") is True)]
        if documents_is_list else None
    )
    documents_with_incomplete_signoff = (
        [_row_name(d) for d in documents if not _signoff_complete(d)]
        if documents_is_list else None
    )
    calc_documents = (
        [d for d in documents if _is_calc(d)]
        if documents_is_list else []
    )
    calculations_not_independently_checked = (
        [_row_name(d) for d in calc_documents
         if not _independently_checked(d)]
        if documents_is_list else None
    )
    documents_missing_quality_elements = (
        [_row_name(d) for d in documents
         if not (isinstance(d, dict)
                 and all(d.get(f) is True for f in _QUALITY_FIELDS))]
        if documents_is_list else None
    )
    documents_missing_assumptions_or_signature = (
        [_row_name(d) for d in documents
         if not (isinstance(d, dict)
                 and d.get("assumptions_declared") is True
                 and d.get("check_signature_declared") is True)]
        if documents_is_list else None
    )

    signoff_coverage = (
        (documents_count - len(documents_with_incomplete_signoff))
        / documents_count
        if documents_is_list and documents_count > 0 else None
    )
    independent_check_coverage = (
        (len(calc_documents)
         - len(calculations_not_independently_checked))
        / len(calc_documents)
        if documents_is_list and len(calc_documents) > 0 else None
    )

    transmittals_with_unknown_document = (
        [_transmittal_name(t) for t in transmittals
         if not (isinstance(t, dict)
                 and isinstance(t.get("document"), str)
                 and t["document"] in document_by_name)]
        if transmittals_is_list and documents_is_list else None
    )
    transmittals_without_recipient = (
        [_transmittal_name(t) for t in transmittals
         if not _has_nonempty_str(t, "recipient")]
        if transmittals_is_list else None
    )
    transmittals_with_revision_mismatch = None
    if transmittals_is_list and documents_is_list:
        transmittals_with_revision_mismatch = []
        for t in transmittals:
            if not isinstance(t, dict) \
                    or not isinstance(t.get("document"), str) \
                    or t["document"] not in document_by_name:
                continue
            doc_revision = document_by_name[t["document"]].get(
                "revision")
            if t.get("revision") != doc_revision:
                transmittals_with_revision_mismatch.append(
                    _transmittal_name(t))
    transmittals_with_invalid_date = (
        [_transmittal_name(t) for t in transmittals
         if not (isinstance(t, dict)
                 and _parse_date(t.get("date")) is not None)]
        if transmittals_is_list else None
    )
    transmittals_without_return_status = (
        [_transmittal_name(t) for t in transmittals
         if not (isinstance(t, dict)
                 and t.get("return_status_declared") is True)]
        if transmittals_is_list else None
    )
    transmittal_document_coverage = (
        (transmittals_count
         - len(transmittals_with_unknown_document))
        / transmittals_count
        if transmittals_with_unknown_document is not None
        and transmittals_count
        else None
    )

    # ---- Section 1: package_definition (skill: method step 1 —
    #      define the package: objective; scope (in/out);
    #      deliverables list; standards and site rules;
    #      interfaces; budget link; schedule; acceptance
    #      criteria; quality gate — deliverables list agreed and
    #      complete, or gaps documented) ----
    _bool_check(results, "package_definition",
                "objective_declared", manifest,
                ("definition", "objective_declared"),
                "define the package: the objective is declared")
    _bool_check(results, "package_definition",
                "scope_in_declared", manifest,
                ("definition", "scope_in_declared"),
                "define the package: the scope — what is in — is "
                "declared")
    _bool_check(results, "package_definition",
                "scope_out_declared", manifest,
                ("definition", "scope_out_declared"),
                "define the package: the scope — what is out — is "
                "declared")
    _bool_check(results, "package_definition",
                "standards_declared", manifest,
                ("definition", "standards_declared"),
                "define the package: the standards are declared")
    _bool_check(results, "package_definition",
                "site_rules_declared", manifest,
                ("definition", "site_rules_declared"),
                "define the package: the site rules are declared")
    _bool_check(results, "package_definition",
                "interfaces_declared", manifest,
                ("definition", "interfaces_declared"),
                "define the package: the interfaces are declared")
    _bool_check(results, "package_definition",
                "budget_link_declared", manifest,
                ("definition", "budget_link_declared"),
                "define the package: the budget link is declared")
    _bool_check(results, "package_definition",
                "schedule_declared", manifest,
                ("definition", "schedule_declared"),
                "define the package: the schedule is declared")
    _bool_check(results, "package_definition",
                "acceptance_criteria_declared", manifest,
                ("definition", "acceptance_criteria_declared"),
                "define the package: the acceptance criteria are "
                "declared")
    agreed, has_agreed = _get(
        manifest, "definition", "deliverables_list_agreed")
    gaps, has_gaps = _get(
        manifest, "definition", "deliverable_gaps_documented")
    _check(results, "package_definition",
           "deliverables_agreed_or_gaps_documented", None,
           has_agreed or has_gaps,
           agreed is True or gaps is True,
           "quality gate: the deliverables list is agreed and "
           "complete — or its gaps are documented")
    _check(results, "package_definition",
           "deliverables_declared", deliverables,
           deliverables_is_list,
           deliverables_is_list and deliverables_count > 0,
           "define the package: the declared package record "
           "names its deliverables — the deliverables list is "
           "present and non-empty")
    kind_present = (
        deliverables_is_list
        and all(isinstance(d, dict) and "kind" in d
                for d in deliverables)
    )
    _check(results, "package_definition",
           "every_deliverable_has_skill_kind", deliverables,
           kind_present,
           deliverables_is_list and deliverables_count > 0
           and len(deliverables_with_invalid_kind) == 0,
           "define the package: every declared deliverable row "
           "carries a kind from the skill's own deliverables "
           "vocabulary — calc package, datasheet, drawing, test "
           "plan, procedure, BOM or report")

    # ---- Section 2: document_control_and_revisions (skill:
    #      method step 2 — document control: numbering/naming
    #      convention; revisions, rev letter + reason; status
    #      flow Draft -> For Review -> For Approval -> For
    #      Construction/As-Built; revision-history table on every
    #      controlled document; quality gate — revisions
    #      controlled with history, no uncontrolled copies
    #      floating; red lines — no unapproved revision used for
    #      construction, no untraceable changes, superseded
    #      versions retained (marked), never deleted) ----
    _bool_check(results, "document_control_and_revisions",
                "numbering_naming_convention_declared", manifest,
                ("document_control",
                 "numbering_naming_convention_declared"),
                "document control: the numbering/naming convention "
                "is declared")
    _bool_check(results, "document_control_and_revisions",
                "status_flow_declared", manifest,
                ("document_control", "status_flow_declared"),
                "document control: the status flow — Draft, For "
                "Review, For Approval, For Construction, As-Built "
                "— is declared")
    _false_check(results, "document_control_and_revisions",
                 "no_unapproved_revision_used_for_construction",
                 manifest,
                 ("document_control",
                  "unapproved_revision_used_for_construction_present"),
                 "red line: no unapproved revision is used for "
                 "construction")
    _false_check(results, "document_control_and_revisions",
                 "no_untraceable_changes", manifest,
                 ("document_control", "untraceable_changes_present"),
                 "red line: no untraceable changes")
    _false_check(results, "document_control_and_revisions",
                 "superseded_versions_retained_not_deleted", manifest,
                 ("document_control",
                  "superseded_versions_deleted_present"),
                 "red line: superseded versions are retained "
                 "(marked), never deleted")
    _false_check(results, "document_control_and_revisions",
                 "no_uncontrolled_copies", manifest,
                 ("document_control", "uncontrolled_copies_present"),
                 "quality gate: no uncontrolled copies are floating")
    _check(results, "document_control_and_revisions",
           "documents_declared", documents, documents_is_list,
           documents_is_list and documents_count > 0,
           "document control: the declared package record names "
           "its controlled documents — the documents list is "
           "present and non-empty")
    status_present = (
        documents_is_list
        and all(isinstance(d, dict) and "status" in d
                for d in documents)
    )
    _check(results, "document_control_and_revisions",
           "every_document_has_flow_status", documents,
           status_present,
           documents_is_list and documents_count > 0
           and len(documents_with_invalid_status) == 0,
           "document control: every declared document row "
           "carries a status from the skill's own status flow — "
           "Draft, For Review, For Approval, For Construction or "
           "As-Built")
    revision_present = (
        documents_is_list
        and all(isinstance(d, dict) and "revision" in d
                for d in documents)
    )
    _check(results, "document_control_and_revisions",
           "every_document_has_revision", documents,
           revision_present,
           documents_is_list and documents_count > 0
           and len(documents_without_revision) == 0,
           "document control: revisions — every declared "
           "document row carries a non-empty revision")
    reason_present = (
        documents_is_list
        and all(isinstance(d, dict)
                and "revision_reason_declared" in d
                for d in documents)
    )
    _check(results, "document_control_and_revisions",
           "every_document_declares_revision_reason", documents,
           reason_present,
           documents_is_list and documents_count > 0
           and len(documents_without_revision_reason) == 0,
           "document control: revisions carry a reason — every "
           "declared document row declares its revision reason")
    history_present = (
        documents_is_list
        and all(isinstance(d, dict)
                and "revision_history_present" in d
                for d in documents)
    )
    _check(results, "document_control_and_revisions",
           "every_document_has_revision_history", documents,
           history_present,
           documents_is_list and documents_count > 0
           and len(documents_without_revision_history) == 0,
           "document control: a revision-history table is "
           "present on every controlled document")

    # ---- Section 3: check_discipline_and_transmittals (skill:
    #      method step 3 — check discipline: every calculation
    #      independently checked, designer != checker;
    #      red-line/back-check process; sign-off blocks,
    #      prepared/reviewed/approved; step 4 — transmittals:
    #      log what was issued, to whom, which revision, when —
    #      and the return status; nothing is issued verbally;
    #      quality gate — checks signed, transmittal log
    #      current) ----
    _bool_check(results, "check_discipline_and_transmittals",
                "redline_backcheck_process_declared", manifest,
                ("check_discipline",
                 "redline_backcheck_process_declared"),
                "check discipline: the red-line/back-check process "
                "is declared")
    calc_fields_present = (
        documents_is_list
        and all(isinstance(d, dict) and "designer" in d
                and "checker" in d for d in calc_documents)
    )
    _check(results, "check_discipline_and_transmittals",
           "every_calculation_independently_checked", documents,
           calc_fields_present,
           documents_is_list and documents_count > 0
           and len(calculations_not_independently_checked) == 0,
           "check discipline: every calculation is independently "
           "checked — every declared calc package row names a "
           "designer and a checker, and designer != checker")
    signoff_present = (
        documents_is_list
        and all(isinstance(d, dict) and "prepared_by" in d
                and "reviewed_by" in d and "approved_by" in d
                for d in documents)
    )
    _check(results, "check_discipline_and_transmittals",
           "every_document_signoff_complete", documents,
           signoff_present,
           documents_is_list and documents_count > 0
           and len(documents_with_incomplete_signoff) == 0,
           "check discipline: sign-off blocks — every declared "
           "document row names who prepared, reviewed and "
           "approved it")
    _check(results, "check_discipline_and_transmittals",
           "transmittals_declared", transmittals,
           transmittals_is_list,
           transmittals_is_list and transmittals_count > 0,
           "transmittals: the declared package record names its "
           "transmittals — the transmittals list is present and "
           "non-empty")
    tdoc_present = (
        transmittals_is_list and documents_is_list
        and all(isinstance(t, dict) and "document" in t
                for t in transmittals)
    )
    _check(results, "check_discipline_and_transmittals",
           "every_transmittal_names_declared_document",
           transmittals, tdoc_present,
           transmittals_is_list and documents_is_list
           and transmittals_count > 0
           and transmittals_with_unknown_document is not None
           and len(transmittals_with_unknown_document) == 0,
           "transmittals: every declared transmittal names a "
           "document the package declares — what was issued")
    recipient_present = (
        transmittals_is_list
        and all(isinstance(t, dict) and "recipient" in t
                for t in transmittals)
    )
    _check(results, "check_discipline_and_transmittals",
           "every_transmittal_has_recipient", transmittals,
           recipient_present,
           transmittals_is_list and transmittals_count > 0
           and len(transmittals_without_recipient) == 0,
           "transmittals: every declared transmittal row names "
           "a non-empty recipient — to whom it was issued")
    trev_present = (
        transmittals_is_list and documents_is_list
        and all(isinstance(t, dict) and "document" in t
                and "revision" in t for t in transmittals)
        and all(isinstance(d, dict) and "revision" in d
                for d in documents)
    )
    _check(results, "check_discipline_and_transmittals",
           "every_transmittal_revision_matches_document",
           transmittals, trev_present,
           transmittals_is_list and documents_is_list
           and transmittals_count > 0
           and transmittals_with_unknown_document is not None
           and len(transmittals_with_unknown_document) == 0
           and transmittals_with_revision_mismatch is not None
           and len(transmittals_with_revision_mismatch) == 0,
           "transmittals: every declared transmittal carries "
           "the named document's declared current revision — "
           "which revision was issued")
    tdate_present = (
        transmittals_is_list
        and all(isinstance(t, dict) and "date" in t
                for t in transmittals)
    )
    _check(results, "check_discipline_and_transmittals",
           "every_transmittal_has_valid_date", transmittals,
           tdate_present,
           transmittals_is_list and transmittals_count > 0
           and len(transmittals_with_invalid_date) == 0,
           "transmittals: every declared transmittal row "
           "carries a valid ISO issue date — when it was issued")
    treturn_present = (
        transmittals_is_list
        and all(isinstance(t, dict)
                and "return_status_declared" in t
                for t in transmittals)
    )
    _check(results, "check_discipline_and_transmittals",
           "every_transmittal_declares_return_status",
           transmittals, treturn_present,
           transmittals_is_list and transmittals_count > 0
           and len(transmittals_without_return_status) == 0,
           "transmittals: every declared transmittal row "
           "declares its return status")
    _bool_check(results, "check_discipline_and_transmittals",
                "transmittal_log_current_declared", manifest,
                ("transmittal_log", "log_current_declared"),
                "quality gate: the transmittal log is current")
    _false_check(results, "check_discipline_and_transmittals",
                 "no_verbal_issue", manifest,
                 ("transmittal_log", "verbal_issue_present"),
                 "transmittals: nothing is issued verbally")

    # ---- Section 4: delivery_quality_and_handover (skill:
    #      method step 5 — delivery quality: each document states
    #      purpose, inputs, assumptions, standards cited, units,
    #      results, and check signature; assumptions explicit,
    #      never embedded; quality gate — checks signed; step 6 —
    #      handover: as-built marked, O&M references, spares
    #      list, test-records pointer, training notes; close-out
    #      checklist signed; quality gate — handover pack
    #      complete at close-out) ----
    quality_present = (
        documents_is_list
        and all(isinstance(d, dict)
                and all(f in d for f in _QUALITY_FIELDS)
                for d in documents)
    )
    _check(results, "delivery_quality_and_handover",
           "every_document_declares_quality_elements", documents,
           quality_present,
           documents_is_list and documents_count > 0
           and len(documents_missing_quality_elements) == 0,
           "delivery quality: each document states purpose, "
           "inputs, standards cited, units and results — "
           "declared on every document row")
    assumption_sig_present = (
        documents_is_list
        and all(isinstance(d, dict)
                and "assumptions_declared" in d
                and "check_signature_declared" in d
                for d in documents)
    )
    _check(results, "delivery_quality_and_handover",
           "every_document_declares_assumptions_and_check_signature",
           documents, assumption_sig_present,
           documents_is_list and documents_count > 0
           and len(documents_missing_assumptions_or_signature) == 0,
           "delivery quality: assumptions are explicit, never "
           "embedded, and a check signature is stated — declared "
           "on every document row")
    _bool_check(results, "delivery_quality_and_handover",
                "handover_as_built_marked", manifest,
                ("handover", "as_built_marked"),
                "handover: as-built is marked")
    _bool_check(results, "delivery_quality_and_handover",
                "handover_om_references_declared", manifest,
                ("handover", "om_references_declared"),
                "handover: O&M references are declared")
    _bool_check(results, "delivery_quality_and_handover",
                "handover_spares_list_declared", manifest,
                ("handover", "spares_list_declared"),
                "handover: the spares list is declared")
    _bool_check(results, "delivery_quality_and_handover",
                "handover_test_records_pointer_declared", manifest,
                ("handover", "test_records_pointer_declared"),
                "handover: the test-records pointer is declared")
    _bool_check(results, "delivery_quality_and_handover",
                "handover_training_notes_declared", manifest,
                ("handover", "training_notes_declared"),
                "handover: training notes are declared")
    _bool_check(results, "delivery_quality_and_handover",
                "handover_closeout_checklist_signed", manifest,
                ("handover", "closeout_checklist_signed"),
                "handover: the close-out checklist is signed — "
                "the handover pack is complete at close-out")

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
        verdict = "WORK_PACKAGE_NOT_STRUCTURED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "WORK_PACKAGE_STRUCTURED"

    computed_names = (
        "documents_declared",
        "every_document_has_flow_status",
        "every_document_has_revision",
        "every_calculation_independently_checked",
        "every_transmittal_names_declared_document",
        "every_transmittal_revision_matches_document",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "engineering-work-package-structuring",
        "atom_version": "0.1.0",
        "package": manifest.get("package"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "deliverables_count": deliverables_count,
        "deliverables_with_invalid_kind":
            deliverables_with_invalid_kind,
        "documents_count": documents_count,
        "documents_with_invalid_status": documents_with_invalid_status,
        "documents_without_revision": documents_without_revision,
        "documents_without_revision_reason":
            documents_without_revision_reason,
        "documents_without_revision_history":
            documents_without_revision_history,
        "documents_with_incomplete_signoff":
            documents_with_incomplete_signoff,
        "signoff_coverage": _fmt6(signoff_coverage),
        "calculations_not_independently_checked":
            calculations_not_independently_checked,
        "independent_check_coverage": _fmt6(
            independent_check_coverage),
        "documents_missing_quality_elements":
            documents_missing_quality_elements,
        "documents_missing_assumptions_or_signature":
            documents_missing_assumptions_or_signature,
        "transmittals_count": transmittals_count,
        "transmittals_with_unknown_document":
            transmittals_with_unknown_document,
        "transmittals_without_recipient":
            transmittals_without_recipient,
        "transmittals_with_revision_mismatch":
            transmittals_with_revision_mismatch,
        "transmittals_with_invalid_date":
            transmittals_with_invalid_date,
        "transmittals_without_return_status":
            transmittals_without_return_status,
        "transmittal_document_coverage": _fmt6(
            transmittal_document_coverage),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across four sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "ENGINEERING WORK PACKAGE STRUCTURING",
        f"package: {verdict.get('package')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: engineering_work_package_structuring.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "WORK_PACKAGE_STRUCTURED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
