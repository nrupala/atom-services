#!/usr/bin/env python3
"""Document operations service — deterministic core.

Built from the bound skill `document-operations`: "Work across
Word files, PDFs, spreadsheets, and slides as one craft: extract
faithfully, edit cleanly, convert carefully, and prove the result
before calling it done. The source is always the authority."

This atom is an AUDIT of a declared document-operations record:
it validates the record a caller declares against the skill's
method, quality gates, red lines and delivery shape. It does not
read, edit or convert any document, extract any figure, or verify
that a declared control actually happened — it checks that the
record the skill requires is present and internally complete and
consistent on the declared evidence.

The caller submits a document-operations manifest (a dict, or
JSON on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- documents: the declared `documents` list (the operation's
  inventory) must be non-empty, and every declared document row
  must declare its output was re-opened and checked;
- findings: the declared `findings` list must be non-empty, every
  declared finding row must record a source location (a non-empty
  `location` string — page for PDFs and docs, sheet and cell for
  spreadsheets, slide number for decks), and every row must
  declare its numbers were quoted exactly before interpretation;
- five check groups are conditional, following the skill's own
  scoping: tracked structure must stay intact only when no
  rewrite was requested ("keep tracked structure intact unless
  you were asked to rewrite"); the conversion checks bind only
  when a conversion is declared performed, and the loss check
  binds only when a content loss is declared detected ("if
  conversion drops content ... fix it or report the loss
  plainly"); the proper-.docx checks bind only for a deliverable
  shared outside the caller's systems ("never send Markdown when
  the deliverable is meant for people outside your systems");
  the editable-source-kept check binds only when a revisable
  deliverable is declared ("an editable source is kept for
  anything likely to be revised again"); and the change-list
  check binds only when edits are declared performed (the
  skill's delivery shape is "a short change list for edits").

Computed ratios are serialized as strings with exactly four
decimal places, produced in both implementations by the same
fixed rule — round half up to 4dp, floor(v * 10000 + 0.5) /
10000, then format with exactly four decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact). The declared rows that fail the location,
exact-quote and output-verification computations are reported by
name as `findings_without_location`,
`findings_not_quoted_exactly_first` and
`documents_without_output_verification`. The computed outcome
over the five primary computed checks is reported as
`computed_status`.

The skill states no numeric threshold — no finding count, no
coverage percentage, no page or section count, and no naming or
versioning scheme — so no numeric threshold check is invented;
quantities are computed and reported, and completeness (every
declared finding / every declared document) is the only bar,
exactly as the task's declared-row consistency requires.

Verdict:
- any fail             -> DOCUMENT_OPERATIONS_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DOCUMENT_OPERATIONS_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "source_and_extraction",
    "editing_and_preservation",
    "conversion_and_verification",
    "delivery_and_hygiene",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "operation": "string",
    "source": {
        "file_format_and_home_identified": "boolean",
        "authoritative_copy_opened": "boolean",
        "read_in_source_order": "boolean",
    },
    "documents": [{
        "name": "string",
        "output_reopened_and_checked": "boolean",
    }],
    "findings": [{
        "name": "string",
        "location": "string",
        "quoted_exactly_before_interpretation": "boolean",
    }],
    "extraction": {
        "every_number_has_source_location": "boolean",
        "numbers_quoted_exactly_then_interpreted_separately": "boolean",
        "figure_quoted_without_location_present": "boolean",
        "unreadable_or_missing_sections_named": "boolean",
    },
    "editing": {
        "edits_performed": "boolean",
        "edits_on_editable_source": "boolean",
        "headings_tables_styles_preserved": "boolean",
        "rewrite_requested": "boolean",
        "tracked_structure_intact": "boolean",
    },
    "preservation": {
        "editable_source_saved_alongside_output": "boolean",
        "revisable_deliverable_present": "boolean",
        "editable_source_kept_for_revisable": "boolean",
        "only_editable_source_overwritten_with_flattened_export_present": "boolean",
    },
    "conversion": {
        "conversion_performed": "boolean",
        "output_reopened_and_compared_section_by_section": "boolean",
        "headings_tables_lists_figures_totals_survive": "boolean",
        "content_loss_detected": "boolean",
        "loss_fixed_or_reported_plainly": "boolean",
        "conversion_with_dropped_content_shipped_present": "boolean",
    },
    "verification": {
        "output_reopened_and_checked_after_edit_or_conversion": "boolean",
        "headings_tables_totals_match_source_and_output": "boolean",
    },
    "deliverable": {
        "shared_externally": "boolean",
        "send_copy_is_docx_not_markdown": "boolean",
        "markdown_sent_as_external_deliverable_present": "boolean",
        "draft_banners_comments_tracked_changes_stripped": "boolean",
        "send_copy_contains_draft_marks_present": "boolean",
    },
    "delivery": {
        "findings_first_in_decision_order_with_locations": "boolean",
        "change_list_provided": "boolean",
        "finished_file_in_send_format_plus_editable_source": "boolean",
        "loss_gap_unreadable_stated_in_delivery_note": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
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


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _gated_false_check(results, section, name, manifest, gate_path,
                       target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is False, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _gated_not_bool_check(results, section, name, manifest, gate_path,
                          target_path, evidence, na_evidence):
    """Binds when the gate is NOT declared true (skill: keep the
    tracked structure intact *unless* a rewrite was requested).
    An absent gate is no rewrite requested, so the check binds."""
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)
    else:
        _check(results, section, name, target, has_target,
               target is True, evidence)


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _has_location(entry):
    return (
        isinstance(entry, dict)
        and isinstance(entry.get("location"), str)
        and len(entry["location"]) > 0
    )


def evaluate(manifest):
    """Return the verdict dict for a document-operations manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    documents, has_documents = _get(manifest, "documents")
    documents_is_list = has_documents and isinstance(documents, list)
    findings, has_findings = _get(manifest, "findings")
    findings_is_list = has_findings and isinstance(findings, list)

    documents_count = len(documents) if documents_is_list else None
    findings_count = len(findings) if findings_is_list else None

    findings_without_location = (
        [_row_name(f) for f in findings if not _has_location(f)]
        if findings_is_list else None
    )
    findings_not_quoted = (
        [_row_name(f) for f in findings
         if not (isinstance(f, dict)
                 and f.get("quoted_exactly_before_interpretation")
                 is True)]
        if findings_is_list else None
    )
    documents_without_verification = (
        [_row_name(d) for d in documents
         if not (isinstance(d, dict)
                 and d.get("output_reopened_and_checked") is True)]
        if documents_is_list else None
    )
    location_coverage = (
        (findings_count - len(findings_without_location)) / findings_count
        if findings_is_list and findings_count > 0 else None
    )
    exact_quote_coverage = (
        (findings_count - len(findings_not_quoted)) / findings_count
        if findings_is_list and findings_count > 0 else None
    )
    verification_coverage = (
        (documents_count - len(documents_without_verification))
        / documents_count
        if documents_is_list and documents_count > 0 else None
    )

    # ---- Section 1: source_and_extraction (skill method 1-3, 9 —
    #      identify the file, its format and its home and open the
    #      authoritative copy; read in source order and record
    #      every finding with its location; quote numbers exactly
    #      first, then interpret separately; quality gates — every
    #      quoted number carries a location, unreadable sections
    #      are named; red line — never quote a figure without its
    #      source location) ----
    _bool_check(results, "source_and_extraction",
                "file_format_and_home_identified", manifest,
                ("source", "file_format_and_home_identified"),
                "method: the file, its format, and its home — Vault, "
                "Drive, Docs, Notion, Box, or Dropbox — are identified")
    _bool_check(results, "source_and_extraction",
                "authoritative_copy_opened", manifest,
                ("source", "authoritative_copy_opened"),
                "method: the authoritative copy is opened, not a "
                "stale download")
    _bool_check(results, "source_and_extraction",
                "read_in_source_order", manifest,
                ("source", "read_in_source_order"),
                "method: extraction reads in source order and keeps "
                "locations attached to everything pulled")
    _check(results, "source_and_extraction", "documents_declared",
           documents, documents_is_list,
           documents_is_list and documents_count > 0,
           "method: the declared operation record names its "
           "documents — the documents list is present and non-empty")
    _check(results, "source_and_extraction", "findings_declared",
           findings, findings_is_list,
           findings_is_list and findings_count > 0,
           "method: the declared operation record names its "
           "findings — the findings list is present and non-empty")
    location_present = (
        findings_is_list
        and all(isinstance(f, dict) and "location" in f for f in findings)
    )
    _check(results, "source_and_extraction",
           "every_finding_has_location_recorded", findings,
           location_present,
           findings_is_list and findings_count > 0
           and len(findings_without_location) == 0,
           "method / quality gate: every declared finding row "
           "records its location — page for PDFs and docs, sheet "
           "and cell for spreadsheets, slide number for decks")
    quoted_present = (
        findings_is_list
        and all(isinstance(f, dict)
                and "quoted_exactly_before_interpretation" in f
                for f in findings)
    )
    _check(results, "source_and_extraction",
           "every_finding_quoted_exactly_before_interpretation",
           findings, quoted_present,
           findings_is_list and findings_count > 0
           and len(findings_not_quoted) == 0,
           "method: every declared finding row declares its "
           "numbers were quoted exactly as written first, before "
           "any interpretation")
    _bool_check(results, "source_and_extraction",
                "every_quoted_number_carries_source_location", manifest,
                ("extraction", "every_number_has_source_location"),
                "quality gate / red line: every quoted number "
                "carries a page, sheet/cell, or slide reference")
    _bool_check(results, "source_and_extraction",
                "numbers_quoted_exactly_then_interpreted_separately",
                manifest,
                ("extraction",
                 "numbers_quoted_exactly_then_interpreted_separately"),
                "method: numbers are quoted exactly as written "
                "first, then interpreted separately — a figure and "
                "its reading are never merged into one line")
    _false_check(results, "source_and_extraction",
                 "no_figure_quoted_without_location", manifest,
                 ("extraction", "figure_quoted_without_location_present"),
                 "red line: no figure is quoted from a document "
                 "without its source location")
    _bool_check(results, "source_and_extraction",
                "unreadable_or_missing_sections_named", manifest,
                ("extraction", "unreadable_or_missing_sections_named"),
                "quality gate / method: unreadable or missing "
                "sections are named, not skipped over — the report "
                "states any pages, sheets, or sections that could "
                "not be read")

    # ---- Section 2: editing_and_preservation (skill method 4, 8 —
    #      work on the editable source, preserve headings, tables
    #      and styles, keep tracked structure intact unless a
    #      rewrite was asked for; save the revised editable source
    #      alongside the output; quality gate — an editable source
    #      is kept for anything likely to be revised again; red
    #      line — never overwrite the only editable source with a
    #      flattened export) ----
    _bool_check(results, "editing_and_preservation",
                "edits_made_on_editable_source", manifest,
                ("editing", "edits_on_editable_source"),
                "method: edits are worked on the editable source")
    _bool_check(results, "editing_and_preservation",
                "headings_tables_styles_preserved", manifest,
                ("editing", "headings_tables_styles_preserved"),
                "method: headings, tables, and styles are preserved "
                "in edits")
    _gated_not_bool_check(
        results, "editing_and_preservation",
        "tracked_structure_intact_unless_rewrite_requested",
        manifest, ("editing", "rewrite_requested"),
        ("editing", "tracked_structure_intact"),
        "method: tracked structure is kept intact — no rewrite "
        "was requested",
        "a rewrite was requested, so tracked structure need not "
        "stay intact")
    _bool_check(results, "editing_and_preservation",
                "editable_source_saved_alongside_output", manifest,
                ("preservation", "editable_source_saved_alongside_output"),
                "method: the revised editable source is saved "
                "alongside the output, so the next edit starts from "
                "a real source, not a flattened export")
    _gated_bool_check(
        results, "editing_and_preservation",
        "editable_source_kept_when_revisable",
        manifest, ("preservation", "revisable_deliverable_present"),
        ("preservation", "editable_source_kept_for_revisable"),
        "quality gate: an editable source is kept for the "
        "deliverable likely to be revised again",
        "no revisable deliverable declared")
    _false_check(results, "editing_and_preservation",
                 "only_editable_source_not_overwritten_with_flattened_export",
                 manifest,
                 ("preservation",
                  "only_editable_source_overwritten_with_flattened_export_present"),
                 "red line: the only editable source is never "
                 "overwritten with a flattened export")

    # ---- Section 3: conversion_and_verification (skill method
    #      6-7 — convert, then re-open the output and compare
    #      section by section; a conversion that drops content is
    #      failed, fixed or reported, never shipped silently;
    #      quality gates — the output file was re-opened and
    #      checked after editing or conversion, headings, tables
    #      and totals match between source and output; red line —
    #      never ship a conversion that dropped content) ----
    verification_present = (
        documents_is_list
        and all(isinstance(d, dict)
                and "output_reopened_and_checked" in d
                for d in documents)
    )
    _check(results, "conversion_and_verification",
           "every_document_output_reopened_and_checked", documents,
           verification_present,
           documents_is_list and documents_count > 0
           and len(documents_without_verification) == 0,
           "quality gate: every declared document row declares "
           "its output file was re-opened and checked after "
           "editing or conversion — the finished file is "
           "verified, not the file that was intended")
    _bool_check(results, "conversion_and_verification",
                "output_reopened_and_checked_after_edit_or_conversion",
                manifest,
                ("verification",
                 "output_reopened_and_checked_after_edit_or_conversion"),
                "quality gate: the output file was re-opened and "
                "checked after editing or conversion")
    _bool_check(results, "conversion_and_verification",
                "headings_tables_totals_match_source_and_output",
                manifest,
                ("verification",
                 "headings_tables_totals_match_source_and_output"),
                "quality gate: headings, tables, and totals match "
                "between source and output")
    _gated_bool_check(
        results, "conversion_and_verification",
        "conversion_output_reopened_and_compared_when_converted",
        manifest, ("conversion", "conversion_performed"),
        ("conversion", "output_reopened_and_compared_section_by_section"),
        "method: for conversion, the output is re-opened and "
        "compared section by section — headings, tables, lists, "
        "figures, and totals must all survive",
        "no conversion declared performed")
    _gated_bool_check(
        results, "conversion_and_verification",
        "conversion_content_survives_when_converted",
        manifest, ("conversion", "conversion_performed"),
        ("conversion", "headings_tables_lists_figures_totals_survive"),
        "method: headings, tables, lists, figures, and totals "
        "all survive the declared conversion",
        "no conversion declared performed")
    _gated_bool_check(
        results, "conversion_and_verification",
        "conversion_loss_fixed_or_reported_when_detected",
        manifest, ("conversion", "content_loss_detected"),
        ("conversion", "loss_fixed_or_reported_plainly"),
        "method: a conversion that drops content, garbles a "
        "table, or loses formatting that carries meaning is "
        "treated as failed — fixed, or the loss reported plainly",
        "no conversion content loss declared detected")
    _gated_false_check(
        results, "conversion_and_verification",
        "no_conversion_with_dropped_content_shipped",
        manifest, ("conversion", "conversion_performed"),
        ("conversion", "conversion_with_dropped_content_shipped_present"),
        "red line: no conversion that dropped content is shipped",
        "no conversion declared performed")

    # ---- Section 4: delivery_and_hygiene (skill method 5 — for
    #      shared deliverables build a proper Word .docx, never
    #      send Markdown as the deliverable, and strip draft
    #      banners, review marks, comments and tracked changes
    #      from the send copy; quality gate — send copies have
    #      zero draft banners, comments or tracked changes;
    #      delivery — findings first in decision order with
    #      locations attached, a short change list for edits, the
    #      finished file in its send format plus the editable
    #      source beside it, and any loss, gap or unreadable
    #      section stated in the delivery note itself) ----
    _gated_bool_check(
        results, "delivery_and_hygiene",
        "send_copy_is_docx_not_markdown_when_shared",
        manifest, ("deliverable", "shared_externally"),
        ("deliverable", "send_copy_is_docx_not_markdown"),
        "method: for shared deliverables a proper Word .docx is "
        "built — Markdown is never sent as the deliverable to "
        "people outside the caller's systems",
        "no externally shared deliverable declared")
    _gated_false_check(
        results, "delivery_and_hygiene",
        "no_markdown_sent_as_external_deliverable",
        manifest, ("deliverable", "shared_externally"),
        ("deliverable", "markdown_sent_as_external_deliverable_present"),
        "red line: Markdown is never sent when the deliverable "
        "is meant for people outside the caller's systems",
        "no externally shared deliverable declared")
    _bool_check(results, "delivery_and_hygiene",
                "draft_banners_comments_tracked_changes_stripped",
                manifest,
                ("deliverable",
                 "draft_banners_comments_tracked_changes_stripped"),
                "method: draft banners, review marks, comments, "
                "and tracked changes are stripped from the send copy")
    _false_check(results, "delivery_and_hygiene",
                 "send_copy_free_of_draft_marks", manifest,
                 ("deliverable", "send_copy_contains_draft_marks_present"),
                 "quality gate: send copies have zero draft "
                 "banners, comments, or tracked changes")
    _bool_check(results, "delivery_and_hygiene",
                "findings_first_in_decision_order_with_locations",
                manifest,
                ("delivery",
                 "findings_first_in_decision_order_with_locations"),
                "delivery: findings come first, in the order the "
                "decision needs them, locations attached")
    _gated_bool_check(
        results, "delivery_and_hygiene",
        "change_list_provided_when_edits_performed",
        manifest, ("editing", "edits_performed"),
        ("delivery", "change_list_provided"),
        "delivery: edits carry a short change list — what moved, "
        "what was rewritten, what was left alone",
        "no edits declared performed")
    _bool_check(results, "delivery_and_hygiene",
                "finished_file_in_send_format_plus_editable_source",
                manifest,
                ("delivery",
                 "finished_file_in_send_format_plus_editable_source"),
                "delivery: the finished file is delivered in its "
                "send format, plus the editable source kept beside it")
    _bool_check(results, "delivery_and_hygiene",
                "loss_gap_unreadable_stated_in_delivery_note", manifest,
                ("delivery", "loss_gap_unreadable_stated_in_delivery_note"),
                "delivery: any loss, gap, or unreadable section is "
                "stated in the delivery note itself")

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
        verdict = "DOCUMENT_OPERATIONS_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DOCUMENT_OPERATIONS_SOUND"

    computed_names = (
        "documents_declared",
        "findings_declared",
        "every_finding_has_location_recorded",
        "every_finding_quoted_exactly_before_interpretation",
        "every_document_output_reopened_and_checked",
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
        "service": "document-operations-service",
        "atom_version": "0.1.0",
        "operation": manifest.get("operation"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "documents_count": documents_count,
        "documents_without_output_verification": documents_without_verification,
        "output_verification_coverage": _fmt4(verification_coverage),
        "findings_count": findings_count,
        "findings_without_location": findings_without_location,
        "location_coverage": _fmt4(location_coverage),
        "findings_not_quoted_exactly_first": findings_not_quoted,
        "exact_quote_coverage": _fmt4(exact_quote_coverage),
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
        "DOCUMENT OPERATIONS SERVICE",
        f"operation: {verdict.get('operation')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: document_operations_service.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DOCUMENT_OPERATIONS_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
