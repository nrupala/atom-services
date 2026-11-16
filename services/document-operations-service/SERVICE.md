# Document operations service — `document-operations-service`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Read, write, revise and convert documents, PDFs, spreadsheets and presentations — with findings tied to source locations and output verified after every change

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Writing & documents who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Client document revision work**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the document-operations manifest

The caller submits one JSON manifest: a declared document-operations
record for one completed operation. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`DOCUMENT_OPERATIONS_NOT_SOUND`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `operation` (string; carried into the verdict output, not itself checked) | — |
| `source.file_format_and_home_identified` | source_and_extraction |
| `source.authoritative_copy_opened` | source_and_extraction |
| `source.read_in_source_order` | source_and_extraction |
| `documents` (list of document-row objects, each `{name, output_reopened_and_checked}` — see the two entry fields below; computed, see below) | source_and_extraction, conversion_and_verification |
| `documents[].name` (string; names the row in the computed `documents_without_output_verification` output) | conversion_and_verification |
| `documents[].output_reopened_and_checked` | conversion_and_verification |
| `findings` (list of finding-row objects, each `{name, location, quoted_exactly_before_interpretation}` — see the three entry fields below; computed, see below) | source_and_extraction |
| `findings[].name` (string; names the row in the computed `findings_without_*` outputs) | source_and_extraction |
| `findings[].location` (string; must be a non-empty string for the row to pass the computed location check — an absent field is missing evidence, an empty string fails) | source_and_extraction |
| `findings[].quoted_exactly_before_interpretation` | source_and_extraction |
| `extraction.every_number_has_source_location` | source_and_extraction |
| `extraction.numbers_quoted_exactly_then_interpreted_separately` | source_and_extraction |
| `extraction.figure_quoted_without_location_present` (must be `false` to pass — skill red line) | source_and_extraction |
| `extraction.unreadable_or_missing_sections_named` | source_and_extraction |
| `editing.edits_performed` (gates the change-list check below) | delivery_and_hygiene |
| `editing.edits_on_editable_source` | editing_and_preservation |
| `editing.headings_tables_styles_preserved` | editing_and_preservation |
| `editing.rewrite_requested` (inverted gate for the tracked-structure check below: the check binds when no rewrite is declared requested, and passes as not applicable when a rewrite is declared requested) | editing_and_preservation |
| `editing.tracked_structure_intact` (required when no rewrite is declared requested; otherwise the check passes as not applicable) | editing_and_preservation |
| `preservation.editable_source_saved_alongside_output` | editing_and_preservation |
| `preservation.revisable_deliverable_present` (gates the editable-source-kept check below) | editing_and_preservation |
| `preservation.editable_source_kept_for_revisable` (required when a revisable deliverable is declared; otherwise the check passes as not applicable) | editing_and_preservation |
| `preservation.only_editable_source_overwritten_with_flattened_export_present` (must be `false` to pass — skill red line) | editing_and_preservation |
| `conversion.conversion_performed` (gates the three conversion checks below) | conversion_and_verification |
| `conversion.output_reopened_and_compared_section_by_section` (required when a conversion is declared performed; otherwise the check passes as not applicable) | conversion_and_verification |
| `conversion.headings_tables_lists_figures_totals_survive` (required when a conversion is declared performed; otherwise the check passes as not applicable) | conversion_and_verification |
| `conversion.content_loss_detected` (gates the loss-handling check below) | conversion_and_verification |
| `conversion.loss_fixed_or_reported_plainly` (required when a content loss is declared detected; otherwise the check passes as not applicable) | conversion_and_verification |
| `conversion.conversion_with_dropped_content_shipped_present` (must be `false` to pass when a conversion is declared performed — skill red line; passes as not applicable when no conversion is declared) | conversion_and_verification |
| `verification.output_reopened_and_checked_after_edit_or_conversion` | conversion_and_verification |
| `verification.headings_tables_totals_match_source_and_output` | conversion_and_verification |
| `deliverable.shared_externally` (gates the two send-format checks below) | delivery_and_hygiene |
| `deliverable.send_copy_is_docx_not_markdown` (required when an externally shared deliverable is declared; otherwise the check passes as not applicable) | delivery_and_hygiene |
| `deliverable.markdown_sent_as_external_deliverable_present` (must be `false` to pass when an externally shared deliverable is declared — skill red line; passes as not applicable when none is declared) | delivery_and_hygiene |
| `deliverable.draft_banners_comments_tracked_changes_stripped` | delivery_and_hygiene |
| `deliverable.send_copy_contains_draft_marks_present` (must be `false` to pass — skill quality gate) | delivery_and_hygiene |
| `delivery.findings_first_in_decision_order_with_locations` | delivery_and_hygiene |
| `delivery.change_list_provided` (required when edits are declared performed; otherwise the check passes as not applicable) | delivery_and_hygiene |
| `delivery.finished_file_in_send_format_plus_editable_source` | delivery_and_hygiene |
| `delivery.loss_gap_unreadable_stated_in_delivery_note` | delivery_and_hygiene |

Five checks are computed from the declared rows, using only the
consistency of the declared record itself — no outside threshold
is imported:

- **Documents declared:** the declared `documents` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Findings declared:** the declared `findings` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Location per finding:** every declared finding row must record
  a source location (a non-empty `location` string). A row with
  the field absent is missing evidence; a row naming an empty
  string fails.
- **Exact quote per finding:** every declared finding row must
  declare `quoted_exactly_before_interpretation: true`. A row with
  the field absent is missing evidence.
- **Output verification per document:** every declared document
  row must declare `output_reopened_and_checked: true`. A row with
  the field absent is missing evidence.

Five check groups are conditional, following the skill's own
scoping — computed from the declared gate fields:

- **Tracked structure:** the skill binds its preservation rule to
  the absence of a rewrite request ("keep tracked structure
  intact unless you were asked to rewrite").
  `tracked_structure_intact` is therefore required when
  `editing.rewrite_requested` is declared `false` **or absent**
  (no rewrite requested); when a rewrite is declared requested,
  the check passes as not applicable.
- **Conversion comparison and survival:** the skill binds its
  re-open-and-compare rule to conversions ("for conversion,
  convert, then re-open the output and compare section by
  section"). Both checks — and the dropped-content red line — are
  therefore required only when `conversion.conversion_performed`
  is declared `true`; when no conversion is declared, they pass
  as not applicable.
- **Conversion loss handling:** the skill binds its fix-or-report
  rule to a detected loss ("if conversion drops content, garbles
  a table, or loses formatting that carries meaning, treat it as
  failed — fix it or report the loss plainly").
  `loss_fixed_or_reported_plainly` is therefore required only
  when `conversion.content_loss_detected` is declared `true`;
  when no loss is declared detected, the check passes as not
  applicable.
- **Shared-deliverable format:** the skill binds its proper-.docx
  rule to deliverables meant for people outside the caller's
  systems ("never send Markdown when the deliverable is meant for
  people outside your systems"). Both format checks are therefore
  required only when `deliverable.shared_externally` is declared
  `true`; when no external sharing is declared, they pass as not
  applicable.
- **Editable source kept, and change list:** the skill binds its
  source-keeping gate to deliverables likely to be revised again
  ("an editable source is kept for anything likely to be revised
  again"), so `editable_source_kept_for_revisable` is required
  only when `preservation.revisable_deliverable_present` is
  declared `true`; and its change-list delivery shape to edits
  ("a short change list for edits"), so
  `delivery.change_list_provided` is required only when
  `editing.edits_performed` is declared `true`. Each passes as
  not applicable when its gate is declared `false`.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the five primary computed checks above cannot be completed),
`documents_count` and `findings_count` (the declared list
lengths, or null when the list is not declared — counts are
reported as integers, exactly), the row-name lists
`documents_without_output_verification`,
`findings_without_location` and
`findings_not_quoted_exactly_first` (null when the underlying
list is not declared), and the three coverage ratios
`output_verification_coverage` (documents declaring a re-opened,
checked output ÷ declared documents), `location_coverage`
(findings recording a location ÷ declared findings) and
`exact_quote_coverage` (findings declaring an exact quote before
interpretation ÷ declared findings).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly four decimal places, produced in both
implementations by the same rule — round half up to 4dp,
`floor(v * 10000 + 0.5) / 10000`, then format with exactly four
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric threshold — no finding or document
count, no coverage percentage, no page, sheet or section count —
so no numeric threshold check is invented. Quantities are
computed and reported; the only bar on the computed rows is
completeness over the caller's own declared rows (every declared
finding, every declared document), exactly as stated above.
Declined thresholds, named: a minimum or maximum finding/document
count; a coverage percentage below completeness; a numeric limit
on unreadable or missing sections; a file-size or page-count
limit; a naming convention for documents, findings or files, and
a versioning scheme for revisions (the skill names neither — it
requires only that the editable source be kept alongside the
output, which is checked); a retention period for kept editable
sources (the skill requires the source be kept, and states no
duration).

The verdict is one of `DOCUMENT_OPERATIONS_SOUND` (all 32 checks
pass), `DOCUMENT_OPERATIONS_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across four sections: source_and_extraction,
editing_and_preservation, conversion_and_verification,
delivery_and_hygiene.

## Honest scoping

This atom audits a **declared** document-operations record — it
opens no file, reads no document, extracts no figure, performs no
edit or conversion, and does not verify that a declared control
actually happened. An operation is sound *on the caller's
declared evidence*: a manifest that declares located findings,
verified outputs and stripped send copies passes those checks
even if the real work did none of it. It is a completeness and
consistency audit of the record the skill requires, **not a
document-processing service or a fidelity certification**: it
never judges whether a quoted figure is actually correct,
whether a recorded location actually contains the finding,
whether a conversion truly preserved meaning, or whether the
summary is faithful — only that the record contains what the
skill's method, quality gates, red lines and delivery shape
demand, and that its declared rows are internally consistent.

The non-reducible parts of the skill are caller declarations
only, stated plainly: the actual extraction, editing and
conversion craft (reading a scanned or awkward PDF, recovering
its content, judging whether formatting "carries meaning",
matching a presentation's claims back to its sources, and
summarising faithfully while keeping key figures) is performed
by the caller, never by this atom — the atom checks only the
declared attestations and row consistency named above. Named
exclusions: no numeric thresholds (see the declined list above);
no naming or versioning posture is checked (the skill states
none); no retention duration is checked (the skill states none);
no inspection of any document, spreadsheet, deck or output file;
no check that a location string is a well-formed page, cell or
slide reference beyond being a non-empty declared string (the
skill names the reference kinds, and states no grammar for
them); no live verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Commodity document handling
