# Engineering work package structuring — `engineering-work-package-structuring`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Run engineering work packages — scope, deliverables, document control, revisions, checks, transmittals, handover.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Electrical & energy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **EE consulting work package structuring**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the work-package manifest

The caller submits one JSON manifest: a declared work-package
structure record for one engineering work package. Every field
below is read by the named section's checks. A field **absent**
= evidence missing (`INSUFFICIENT_EVIDENCE`); a field present
but false / invalid = the check fails
(`WORK_PACKAGE_NOT_STRUCTURED`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `package` (string; carried into the verdict output, not itself checked) | — |
| `definition.objective_declared` | package_definition |
| `definition.scope_in_declared` | package_definition |
| `definition.scope_out_declared` | package_definition |
| `definition.standards_declared` | package_definition |
| `definition.site_rules_declared` | package_definition |
| `definition.interfaces_declared` | package_definition |
| `definition.budget_link_declared` | package_definition |
| `definition.schedule_declared` | package_definition |
| `definition.acceptance_criteria_declared` | package_definition |
| `definition.deliverables_list_agreed` | package_definition |
| `definition.deliverable_gaps_documented` | package_definition |
| `deliverables` (list of deliverable-row objects, each `{name, kind}` — see the two entry fields below; computed, see below) | package_definition |
| `deliverables[].name` (string; names the row in the computed outputs) | package_definition |
| `deliverables[].kind` (string; must be one of the skill's own deliverables vocabulary — `calc package`, `datasheet`, `drawing`, `test plan`, `procedure`, `BOM` or `report` — for the row to pass the computed kind check; any other string fails, an absent field is missing evidence) | package_definition |
| `documents` (list of controlled-document-row objects, each `{name, kind, status, revision, revision_reason_declared, revision_history_present, designer, checker, prepared_by, reviewed_by, approved_by, purpose_declared, inputs_declared, assumptions_declared, standards_cited_declared, units_declared, results_declared, check_signature_declared}` — see the entry fields below; computed, see below) | document_control_and_revisions, check_discipline_and_transmittals, delivery_quality_and_handover |
| `documents[].name` (string; names the row in the computed outputs and is the name transmittal rows' `document` fields must equal to resolve) | document_control_and_revisions, check_discipline_and_transmittals, delivery_quality_and_handover |
| `documents[].kind` (string; the row's deliverable kind — the value `calc package` marks the row as a calculation for the computed independent-check; any other value is not a calculation row. The kind string itself is not vocabulary-checked on document rows — the vocabulary check applies to the `deliverables` list) | check_discipline_and_transmittals |
| `documents[].status` (string; must be one of the skill's own status flow — `Draft`, `For Review`, `For Approval`, `For Construction` or `As-Built` — for the row to pass the computed status check; any other string fails, an absent field is missing evidence) | document_control_and_revisions |
| `documents[].revision` (string; must be a non-empty string for the row to pass the computed revision check — an absent field is missing evidence, an empty string fails) | document_control_and_revisions, check_discipline_and_transmittals |
| `documents[].revision_reason_declared` | document_control_and_revisions |
| `documents[].revision_history_present` | document_control_and_revisions |
| `documents[].designer` (string; must be a non-empty string, and different from `checker`, for a `calc package` row to pass the computed independent-check — an absent field on a calculation row is missing evidence, an empty string or a value equal to the checker fails. Read only for `calc package` rows) | check_discipline_and_transmittals |
| `documents[].checker` (string; same rule as `designer`, mirrored) | check_discipline_and_transmittals |
| `documents[].prepared_by` (string; must be a non-empty string for the row to pass the computed sign-off check — an absent field is missing evidence, an empty string fails) | check_discipline_and_transmittals |
| `documents[].reviewed_by` (string; same rule as `prepared_by`) | check_discipline_and_transmittals |
| `documents[].approved_by` (string; same rule as `prepared_by`) | check_discipline_and_transmittals |
| `documents[].purpose_declared` | delivery_quality_and_handover |
| `documents[].inputs_declared` | delivery_quality_and_handover |
| `documents[].assumptions_declared` | delivery_quality_and_handover |
| `documents[].standards_cited_declared` | delivery_quality_and_handover |
| `documents[].units_declared` | delivery_quality_and_handover |
| `documents[].results_declared` | delivery_quality_and_handover |
| `documents[].check_signature_declared` | delivery_quality_and_handover |
| `document_control.numbering_naming_convention_declared` | document_control_and_revisions |
| `document_control.status_flow_declared` | document_control_and_revisions |
| `document_control.unapproved_revision_used_for_construction_present` (must be `false` to pass — skill red line) | document_control_and_revisions |
| `document_control.untraceable_changes_present` (must be `false` to pass — skill red line) | document_control_and_revisions |
| `document_control.superseded_versions_deleted_present` (must be `false` to pass — skill red line: superseded versions are retained (marked), never deleted) | document_control_and_revisions |
| `document_control.uncontrolled_copies_present` (must be `false` to pass — quality gate: no uncontrolled copies floating) | document_control_and_revisions |
| `check_discipline.redline_backcheck_process_declared` | check_discipline_and_transmittals |
| `transmittals` (list of transmittal-row objects, each `{document, recipient, revision, date, return_status_declared}` — see the five entry fields below; computed, see below) | check_discipline_and_transmittals |
| `transmittals[].document` (string; must name a declared document for the row to pass the computed document-resolution and revision-match checks, and names the row in the computed outputs) | check_discipline_and_transmittals |
| `transmittals[].recipient` (string; must be a non-empty string for the row to pass the computed recipient check — an absent field is missing evidence, an empty string fails) | check_discipline_and_transmittals |
| `transmittals[].revision` (string; must equal the named document's declared `revision` string for the row to pass the computed revision-match check; an absent field is missing evidence) | check_discipline_and_transmittals |
| `transmittals[].date` (string; strict ISO `YYYY-MM-DD` — must parse as a real calendar date for the row to pass the computed date check; an absent field is missing evidence, an unparseable or impossible date such as `2027-02-30` fails) | check_discipline_and_transmittals |
| `transmittals[].return_status_declared` | check_discipline_and_transmittals |
| `transmittal_log.log_current_declared` | check_discipline_and_transmittals |
| `transmittal_log.verbal_issue_present` (must be `false` to pass — the skill: nothing is issued verbally) | check_discipline_and_transmittals |
| `handover.as_built_marked` | delivery_quality_and_handover |
| `handover.om_references_declared` | delivery_quality_and_handover |
| `handover.spares_list_declared` | delivery_quality_and_handover |
| `handover.test_records_pointer_declared` | delivery_quality_and_handover |
| `handover.training_notes_declared` | delivery_quality_and_handover |
| `handover.closeout_checklist_signed` | delivery_quality_and_handover |

Most checks are computed from the declared rows, using only
the consistency of the declared record itself — no outside
threshold is imported:

- **Deliverables agreed or gaps documented:** the skill's
  quality gate is a disjunction — the deliverables list is
  agreed and complete, *or* its gaps are documented. The check
  passes when either `deliverables_list_agreed` or
  `deliverable_gaps_documented` is declared true; it fails
  when at least one of the two fields is present and neither
  is true; it is missing evidence when both are absent.
- **Deliverables declared:** the declared `deliverables` list
  passes only when it is present and non-empty; an absent list
  is missing evidence, an empty list fails.
- **Kind per deliverable:** every declared deliverable row
  must carry a kind from the skill's own deliverables list —
  `calc package`, `datasheet`, `drawing`, `test plan`,
  `procedure`, `BOM` or `report`. Any other string fails; a
  row with the field absent is missing evidence.
- **Documents declared:** the declared `documents` list passes
  only when it is present and non-empty.
- **Status per document:** every declared document row must
  carry a status from the skill's own status flow — `Draft`,
  `For Review`, `For Approval`, `For Construction` or
  `As-Built`. Any other string fails.
- **Revision per document:** every declared document row must
  carry a non-empty `revision` string (the skill's rev letter).
  A row with the field absent is missing evidence; an empty
  string fails.
- **Revision reason and history per document:** every declared
  document row must declare `revision_reason_declared: true`
  (revisions carry a rev letter + reason) and
  `revision_history_present: true` (a revision-history table
  on every controlled document).
- **Independent check per calculation:** every declared
  document row of kind `calc package` must name a non-empty
  `designer` and a non-empty `checker`, and the two must
  differ (the skill: every calculation independently checked,
  designer ≠ checker). Only `calc package` rows are read; a
  package declaring no calculation rows passes this check on
  its declared documents. A calculation row with either field
  absent is missing evidence.
- **Sign-off per document:** every declared document row must
  name non-empty `prepared_by`, `reviewed_by` and
  `approved_by` strings (the skill's sign-off blocks:
  prepared/reviewed/approved).
- **Transmittals declared:** the declared `transmittals` list
  passes only when it is present and non-empty.
- **Transmittal document resolution:** every declared
  transmittal's `document` string must name a declared
  document (matched on the document rows' `name` strings). An
  unresolvable name fails and is reported in
  `transmittals_with_unknown_document`.
- **Recipient per transmittal:** every declared transmittal
  row must name a non-empty `recipient` string (the skill's
  log shape: what was issued, *to whom*).
- **Transmittal revision match:** every declared
  transmittal's `revision` string must equal the named
  document's declared current `revision`. A mismatch fails
  and is reported in `transmittals_with_revision_mismatch`.
  The check is missing evidence when any transmittal lacks
  `document` or `revision`, or any document lacks `revision`.
- **Transmittal date valid:** every declared transmittal row
  must carry a `date` that parses as a strict ISO calendar
  date. An unparseable or impossible date fails and the row
  is reported in `transmittals_with_invalid_date`.
- **Return status per transmittal:** every declared
  transmittal row must declare
  `return_status_declared: true`.
- **Delivery-quality elements per document:** every declared
  document row must declare `purpose_declared`,
  `inputs_declared`, `standards_cited_declared`,
  `units_declared` and `results_declared` all true (the
  skill: each document states purpose, inputs, standards
  cited, units, results).
- **Assumptions and check signature per document:** every
  declared document row must declare
  `assumptions_declared: true` (assumptions explicit, never
  embedded) and `check_signature_declared: true`.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the six primary computed checks — documents declared,
every document has flow status, every document has revision,
every calculation independently checked, every transmittal
names a declared document, every transmittal revision matches
document — cannot be completed), the counts
`deliverables_count`, `documents_count` and
`transmittals_count` (the declared list lengths, or null when
the list is not declared — counts are reported as integers,
exactly), the row-name lists
`deliverables_with_invalid_kind`,
`documents_with_invalid_status`, `documents_without_revision`,
`documents_without_revision_reason`,
`documents_without_revision_history`,
`documents_with_incomplete_signoff`,
`calculations_not_independently_checked`,
`documents_missing_quality_elements`,
`documents_missing_assumptions_or_signature`,
`transmittals_with_unknown_document`,
`transmittals_without_recipient`,
`transmittals_with_revision_mismatch`,
`transmittals_with_invalid_date` and
`transmittals_without_return_status` (each null when its
underlying list — or, for the transmittal-document lists,
either list — is not declared), and the three coverage ratios
`signoff_coverage` (documents with a complete sign-off block
÷ declared documents), `independent_check_coverage`
(calculation documents independently checked ÷ declared
calculation documents) and `transmittal_document_coverage`
(transmittals naming a declared document ÷ declared
transmittals).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly
six decimals; comparisons use the unrounded values. A ratio
is null when its denominator list is absent or empty (and,
for independent check coverage, when no declared document is
a calculation; for transmittal document coverage, when either
list is absent). That fixed serialization is what makes the
Python and TypeScript outputs byte-identical.

The skill states no numeric threshold — no deliverable,
document or transmittal count, no revision count, and no
budget or schedule limit — so no numeric threshold check is
invented. Quantities are computed and reported; the only bar
on the computed rows is completeness and internal consistency
over the caller's own declared rows (every declared
deliverable, document and transmittal), exactly as stated
above. Declined thresholds, named: a minimum or maximum
deliverable count; a minimum or maximum controlled-document
count; a minimum or maximum transmittal count; a minimum
revision count or a required current revision letter (the
skill requires revisions be controlled with a letter +
reason and a history table, and names no minimum depth); a
budget amount or budget-variance limit (the skill requires a
budget *link*, and states no figure — only that the link is
declared is checked); a schedule duration or milestone-date
limit (the skill requires a schedule be declared, and states
no dates for the package itself — only that the declaration
is present is checked); a handover deadline after close-out;
a checker-qualification or independence standard beyond
designer ≠ checker (the skill states the inequality and no
credential bar).

The verdict is one of `WORK_PACKAGE_STRUCTURED` (all 42
checks pass), `WORK_PACKAGE_NOT_STRUCTURED` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across four sections:
package_definition, document_control_and_revisions,
check_discipline_and_transmittals,
delivery_quality_and_handover.

## Honest scoping

This atom audits a **declared** work-package structure
record — it structures no work package, writes, checks or
issues no document, keeps no transmittal log, reads no
project files or document-management system, and does not
verify that a declared control actually happens. A package
is structured *on the caller's declared evidence*: a
manifest that declares an agreed deliverables list,
controlled documents with signed checks, and a complete
handover pack passes those checks even if the real package
has none of it. It is a completeness and consistency audit
of the record the skill requires, **not an engineering
service or a package certification**: it never judges
whether the scope is the right scope, whether a calculation
is correct, whether a check was competently performed, or
whether the handover pack would actually serve operations —
only that the record contains what the skill's method,
quality gates and red lines demand, and that its declared
rows are internally consistent over the declared revisions.

Non-reducible parts, named — these remain caller declarations
only, and the atom states plainly that it does not judge
them: whether the objective is the right objective; whether
the scope split (in/out) is correct or complete for the real
job; whether the cited standards and site rules are the
applicable ones; whether a deliverable the package needs is
missing from the list entirely (only declared rows are
checked, and the agreed/gaps gate is itself a declaration);
whether a document's content is technically correct;
whether the named checker is genuinely independent in fact
or competent to check (only that designer ≠ checker is
declared by name); whether a revision reason is the true
reason; whether the return status recorded for a transmittal
is accurate; whether as-built marks reflect the field state;
and whether the spares list would cover real failures (only
that the handover elements are declared present). Named
exclusions: no numeric thresholds (see the declined list
above); no check that a `For Construction` document's
revision is the latest issued beyond the declared
transmittal-revision match; no live verification of any
declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
