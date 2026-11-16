# Document operations service — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You completed a document operation — reading, revising or converting a document, PDF, spreadsheet or presentation — and you have a record of how it was done: source and extraction, editing and preservation, conversion and verification, delivery and hygiene. This atom reads one declared manifest and returns one deterministic verdict across four sections: **DOCUMENT_OPERATIONS_SOUND**, **DOCUMENT_OPERATIONS_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared evidence's completeness and consistency only — it opens no file, reads no document, extracts no figure, performs no edit or conversion, and does not verify that a declared control actually happened; it never judges whether a quoted figure is actually correct, whether a recorded location actually contains the finding, or whether a conversion truly preserved meaning. Computed checks: the declared `documents` and `findings` lists must be present and non-empty; every declared finding must record a non-empty `location` and declare it was quoted exactly before interpretation; and every declared document must declare its output was re-opened and checked — completeness over your own declared rows, with no numeric threshold (no minimum or maximum counts, no coverage percentage below completeness). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "document-operations-service"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/document-operations-service` — tool name `document_operations_service`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/document-operations-service` — body = the manifest object; same `Authorization` header.

## Input — the document-operations-service manifest

| Field | Meaning |
|---|---|
| `operation` | operation name (string; carried into the output, not checked) |
| `source.file_format_and_home_identified` / `authoritative_copy_opened` / `read_in_source_order` | source evidence: format and home identified; the authoritative copy opened; read in source order |
| `documents` (list of `{name, output_reopened_and_checked}`) | computed: the list must be present and non-empty, and every row must declare `output_reopened_and_checked: true`; rows that do not are reported by name in `documents_without_output_verification` |
| `documents[].name` (string) | names the row in `documents_without_output_verification` |
| `documents[].output_reopened_and_checked` | the row's output was re-opened and checked |
| `findings` (list of `{name, location, quoted_exactly_before_interpretation}`) | computed: the list must be present and non-empty, every row must record a location and declare an exact quote first; rows that do not are reported by name in `findings_without_location` / `findings_not_quoted_exactly_first` |
| `findings[].name` (string) | names the row in the computed `findings_without_*` outputs |
| `findings[].location` (string) | source location; must be a non-empty string — an absent field is missing evidence, an empty string fails |
| `findings[].quoted_exactly_before_interpretation` | the finding was quoted exactly before any interpretation |
| `extraction.every_number_has_source_location` / `numbers_quoted_exactly_then_interpreted_separately` / `unreadable_or_missing_sections_named` | extraction evidence |
| `extraction.figure_quoted_without_location_present` | must be `false` to pass (red line: no figure quoted without its location) |
| `editing.edits_performed` | gates the change-list check: `delivery.change_list_provided` is required only when edits are declared performed |
| `editing.edits_on_editable_source` / `headings_tables_styles_preserved` | editing evidence |
| `editing.rewrite_requested` | inverted gate: `editing.tracked_structure_intact` is required when no rewrite is declared requested, and passes as not applicable when a rewrite is declared requested |
| `editing.tracked_structure_intact` | tracked structure kept intact (see the gate above) |
| `preservation.editable_source_saved_alongside_output` | the editable source is saved alongside the output |
| `preservation.revisable_deliverable_present` | gates the editable-source-kept check below |
| `preservation.editable_source_kept_for_revisable` | required when a revisable deliverable is declared; otherwise passes as not applicable |
| `preservation.only_editable_source_overwritten_with_flattened_export_present` | must be `false` to pass (red line: never overwrite the only editable source with a flattened export) |
| `conversion.conversion_performed` | gates the three conversion checks below |
| `conversion.output_reopened_and_compared_section_by_section` / `headings_tables_lists_figures_totals_survive` | required when a conversion is declared performed; otherwise pass as not applicable |
| `conversion.content_loss_detected` | gates the loss-handling check below |
| `conversion.loss_fixed_or_reported_plainly` | required when a content loss is declared detected; otherwise passes as not applicable |
| `conversion.conversion_with_dropped_content_shipped_present` | must be `false` to pass when a conversion is declared performed (red line); passes as not applicable when no conversion is declared |
| `verification.output_reopened_and_checked_after_edit_or_conversion` / `headings_tables_totals_match_source_and_output` | verification evidence |
| `deliverable.shared_externally` | gates the two send-format checks below |
| `deliverable.send_copy_is_docx_not_markdown` | required when an externally shared deliverable is declared; otherwise passes as not applicable |
| `deliverable.markdown_sent_as_external_deliverable_present` | must be `false` to pass when an externally shared deliverable is declared (red line); passes as not applicable when none is declared |
| `deliverable.draft_banners_comments_tracked_changes_stripped` | draft banners, comments and tracked changes stripped from the send copy |
| `deliverable.send_copy_contains_draft_marks_present` | must be `false` to pass (quality gate: send copy free of draft marks) |
| `delivery.findings_first_in_decision_order_with_locations` / `finished_file_in_send_format_plus_editable_source` / `loss_gap_unreadable_stated_in_delivery_note` | delivery evidence |
| `delivery.change_list_provided` | required when edits are declared performed; otherwise passes as not applicable |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward DOCUMENT_OPERATIONS_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/document-operations-service`:

```json
{
  "operation": "annual_report_audit",
  "source": {
    "file_format_and_home_identified": true,
    "authoritative_copy_opened": true,
    "read_in_source_order": true
  },
  "documents": [
    {
      "name": "doc_01",
      "output_reopened_and_checked": true
    }
  ],
  "findings": [
    {
      "name": "finding_01",
      "location": "page_12",
      "quoted_exactly_before_interpretation": true
    }
  ],
  "extraction": {
    "every_number_has_source_location": true,
    "numbers_quoted_exactly_then_interpreted_separately": true,
    "figure_quoted_without_location_present": false,
    "unreadable_or_missing_sections_named": true
  },
  "editing": {
    "edits_performed": false,
    "edits_on_editable_source": true,
    "headings_tables_styles_preserved": true,
    "rewrite_requested": false,
    "tracked_structure_intact": true
  },
  "preservation": {
    "editable_source_saved_alongside_output": true,
    "revisable_deliverable_present": false,
    "editable_source_kept_for_revisable": true,
    "only_editable_source_overwritten_with_flattened_export_present": false
  },
  "conversion": {
    "conversion_performed": false,
    "output_reopened_and_compared_section_by_section": true,
    "headings_tables_lists_figures_totals_survive": true,
    "content_loss_detected": false,
    "loss_fixed_or_reported_plainly": true,
    "conversion_with_dropped_content_shipped_present": false
  },
  "verification": {
    "output_reopened_and_checked_after_edit_or_conversion": true,
    "headings_tables_totals_match_source_and_output": true
  },
  "deliverable": {
    "shared_externally": false,
    "send_copy_is_docx_not_markdown": true,
    "markdown_sent_as_external_deliverable_present": false,
    "draft_banners_comments_tracked_changes_stripped": true,
    "send_copy_contains_draft_marks_present": false
  },
  "delivery": {
    "findings_first_in_decision_order_with_locations": true,
    "change_list_provided": true,
    "finished_file_in_send_format_plus_editable_source": true,
    "loss_gap_unreadable_stated_in_delivery_note": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 32 checks and a text stamp of the verdict):

```json
{
  "service": "document-operations-service",
  "atom_version": "0.1.0",
  "operation": "annual_report_audit",
  "verdict": "DOCUMENT_OPERATIONS_SOUND",
  "sections": {
    "source_and_extraction": "pass",
    "editing_and_preservation": "pass",
    "conversion_and_verification": "pass",
    "delivery_and_hygiene": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "documents_count": 1,
  "documents_without_output_verification": [],
  "output_verification_coverage": "1.0000",
  "findings_count": 1,
  "findings_without_location": [],
  "location_coverage": "1.0000",
  "findings_not_quoted_exactly_first": [],
  "exact_quote_coverage": "1.0000",
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across four sections."
}
```

## Verdicts

- **DOCUMENT_OPERATIONS_SOUND** — every check passes; the declared document-operations evidence is complete and consistent with the skill's method, quality gates and red lines.
- **DOCUMENT_OPERATIONS_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `documents_count` and `findings_count` (the declared list lengths as integers, or null when the list is not declared), `documents_without_output_verification`, `findings_without_location` and `findings_not_quoted_exactly_first` (the row names failing each computed row check, or null when the underlying list is not declared), the three coverage ratios `output_verification_coverage`, `location_coverage` and `exact_quote_coverage` (strings with exactly four decimal places, or null when the denominator list is absent or empty) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
