# Engineering work package structuring — documentation

**Engineering work package structuring** · slug `engineering-work-package-structuring` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `package` "EE-2026-001"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "engineering-work-package-structuring"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the work-package manifest.** You declare a record of a work package's structure — the atom audits the record, it does not structure the package (see Explanation). The recorded full-pass manifest declares the package `EE-2026-001`: its definition is complete (objective, scope in and scope out, standards, site rules, interfaces, budget link, schedule and acceptance criteria all declared), with the deliverables list agreed (`deliverables_list_agreed: true`; `deliverable_gaps_documented: false` — the disjunction gate passes on the agreed declaration). It declares one deliverable, `Main Calc`, of kind `calc package`; one controlled document, `Calc-001`, of kind `calc package`, status `For Approval`, revision `A` with its revision reason declared and revision history present, designer `Alice` and checker `Bob` (designer ≠ checker), sign-off by `Alice` (prepared), `Charlie` (reviewed) and `Dave` (approved), and all delivery-quality flags declared. Document control declares its numbering/naming convention and status flow with none of the red-line conditions present; the red-line/back-check process is declared; one transmittal issues `Calc-001` to `Client` at revision `A` on `2026-11-20` with its return status declared and the transmittal log current, with nothing issued verbally; and the handover pack is complete (as-built marked, O&M references, spares list, test-records pointer and training notes declared, close-out checklist signed).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/engineering-work-package-structuring` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `WORK_PACKAGE_STRUCTURED`: "42 pass, 0 fail, 0 missing of 42 checks across four sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `WORK_PACKAGE_NOT_STRUCTURED` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "engineering-work-package-structuring"}`.
3. Call: `POST https://atoms.pipavia.com/v1/engineering-work-package-structuring` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/engineering-work-package-structuring` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `engineering_work_package_structuring`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `WORK_PACKAGE_NOT_STRUCTURED` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 12 checks fail: `every_deliverable_has_skill_kind`, `every_document_has_flow_status`, `every_document_has_revision`, `every_document_declares_revision_reason`, `every_document_has_revision_history`, `every_document_signoff_complete`, `every_document_declares_quality_elements`, `every_document_declares_assumptions_and_check_signature`, `every_transmittal_names_declared_document`, `every_transmittal_revision_matches_document`, `every_transmittal_has_valid_date`, `every_transmittal_declares_return_status`, and the summary reads "30 pass, 12 fail, 0 missing of 42 checks across four sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (see Output format). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "deliverables",
  "detail": "deliverables must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/engineering-work-package-structuring` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/engineering-work-package-structuring` — tool name `engineering_work_package_structuring`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `engineering_work_package_structuring` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `WORK_PACKAGE_NOT_STRUCTURED`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them. Section objects and list-entry objects, which SERVICE.md's table describes in the list fields' rows rather than as separate rows, are given their own rows here, following the template's convention.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `package` | string | Carried into the verdict output, not itself checked |

#### Read by: package_definition

| Field | Type | Notes |
|---|---|---|
| `definition` | object | The package-definition section object — a present non-object value is rejected before evaluation |
| `definition.objective_declared` | boolean | — |
| `definition.scope_in_declared` | boolean | — |
| `definition.scope_out_declared` | boolean | — |
| `definition.standards_declared` | boolean | — |
| `definition.site_rules_declared` | boolean | — |
| `definition.interfaces_declared` | boolean | — |
| `definition.budget_link_declared` | boolean | — |
| `definition.schedule_declared` | boolean | — |
| `definition.acceptance_criteria_declared` | boolean | — |
| `definition.deliverables_list_agreed` | boolean | One half of the deliverables disjunction gate — see the check below |
| `definition.deliverable_gaps_documented` | boolean | One half of the deliverables disjunction gate — see the check below |
| `deliverables` | list | list of deliverable-row objects, each `{name, kind}` — see the three entry fields below; computed, see below |
| `deliverables[]` | object | One declared deliverable row — a present non-object entry is rejected before evaluation |
| `deliverables[].name` | string | Names the row in the computed outputs |
| `deliverables[].kind` | string | Must be one of the skill's own deliverables vocabulary — `calc package`, `datasheet`, `drawing`, `test plan`, `procedure`, `BOM` or `report` — for the row to pass the computed kind check; any other string fails, an absent field is missing evidence |

#### Read by: document_control_and_revisions

| Field | Type | Notes |
|---|---|---|
| `documents` | list | list of controlled-document-row objects, each `{name, kind, status, revision, revision_reason_declared, revision_history_present, designer, checker, prepared_by, reviewed_by, approved_by, purpose_declared, inputs_declared, assumptions_declared, standards_cited_declared, units_declared, results_declared, check_signature_declared}` — see the entry fields below and in the following two groups; computed, see below. Read by document_control_and_revisions, check_discipline_and_transmittals and delivery_quality_and_handover |
| `documents[]` | object | One declared controlled-document row — a present non-object entry is rejected before evaluation |
| `documents[].name` | string | Names the row in the computed outputs and is the name transmittal rows' `document` fields must equal to resolve. Also read by check_discipline_and_transmittals and delivery_quality_and_handover |
| `documents[].status` | string | Must be one of the skill's own status flow — `Draft`, `For Review`, `For Approval`, `For Construction` or `As-Built` — for the row to pass the computed status check; any other string fails, an absent field is missing evidence |
| `documents[].revision` | string | Must be a non-empty string for the row to pass the computed revision check — an absent field is missing evidence, an empty string fails. Also read by check_discipline_and_transmittals |
| `documents[].revision_reason_declared` | boolean | — |
| `documents[].revision_history_present` | boolean | — |
| `document_control` | object | The document-control section object — a present non-object value is rejected before evaluation |
| `document_control.numbering_naming_convention_declared` | boolean | — |
| `document_control.status_flow_declared` | boolean | — |
| `document_control.unapproved_revision_used_for_construction_present` | boolean | must be `false` to pass — skill red line |
| `document_control.untraceable_changes_present` | boolean | must be `false` to pass — skill red line |
| `document_control.superseded_versions_deleted_present` | boolean | must be `false` to pass — skill red line: superseded versions are retained (marked), never deleted |
| `document_control.uncontrolled_copies_present` | boolean | must be `false` to pass — quality gate: no uncontrolled copies floating |

#### Read by: check_discipline_and_transmittals

| Field | Type | Notes |
|---|---|---|
| `documents[].kind` | string | The row's deliverable kind — the value `calc package` marks the row as a calculation for the computed independent-check. Any other value is not a calculation row. The kind string itself is not vocabulary-checked on document rows — the vocabulary check applies to the `deliverables` list |
| `documents[].designer` | string | Must be a non-empty string, and different from `checker`, for a `calc package` row to pass the computed independent-check — an absent field on a calculation row is missing evidence, an empty string or a value equal to the checker fails. Read only for `calc package` rows |
| `documents[].checker` | string | Same rule as `designer`, mirrored |
| `documents[].prepared_by` | string | Must be a non-empty string for the row to pass the computed sign-off check — an absent field is missing evidence, an empty string fails |
| `documents[].reviewed_by` | string | Same rule as `prepared_by` |
| `documents[].approved_by` | string | Same rule as `prepared_by` |
| `check_discipline` | object | The check-discipline section object — a present non-object value is rejected before evaluation |
| `check_discipline.redline_backcheck_process_declared` | boolean | — |
| `transmittals` | list | list of transmittal-row objects, each `{document, recipient, revision, date, return_status_declared}` — see the five entry fields below; computed, see below |
| `transmittals[]` | object | One declared transmittal row — a present non-object entry is rejected before evaluation |
| `transmittals[].document` | string | Must name a declared document for the row to pass the computed document-resolution and revision-match checks, and names the row in the computed outputs |
| `transmittals[].recipient` | string | Must be a non-empty string for the row to pass the computed recipient check — an absent field is missing evidence, an empty string fails |
| `transmittals[].revision` | string | Must equal the named document's declared `revision` string for the row to pass the computed revision-match check; an absent field is missing evidence |
| `transmittals[].date` | string | Strict ISO `YYYY-MM-DD` — must parse as a real calendar date for the row to pass the computed date check; an absent field is missing evidence, an unparseable or impossible date such as `2027-02-30` fails |
| `transmittals[].return_status_declared` | boolean | — |
| `transmittal_log` | object | The transmittal-log section object — a present non-object value is rejected before evaluation |
| `transmittal_log.log_current_declared` | boolean | — |
| `transmittal_log.verbal_issue_present` | boolean | must be `false` to pass — the skill: nothing is issued verbally |

#### Read by: delivery_quality_and_handover

| Field | Type | Notes |
|---|---|---|
| `documents[].purpose_declared` | boolean | — |
| `documents[].inputs_declared` | boolean | — |
| `documents[].assumptions_declared` | boolean | — |
| `documents[].standards_cited_declared` | boolean | — |
| `documents[].units_declared` | boolean | — |
| `documents[].results_declared` | boolean | — |
| `documents[].check_signature_declared` | boolean | — |
| `handover` | object | The handover section object — a present non-object value is rejected before evaluation |
| `handover.as_built_marked` | boolean | — |
| `handover.om_references_declared` | boolean | — |
| `handover.spares_list_declared` | boolean | — |
| `handover.test_records_pointer_declared` | boolean | — |
| `handover.training_notes_declared` | boolean | — |
| `handover.closeout_checklist_signed` | boolean | — |

### Checks

All 42 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: there is no not-applicable per-check status in the recorded response. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: package_definition

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `objective_declared` | define the package: the objective is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `scope_in_declared` | define the package: the scope — what is in — is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `scope_out_declared` | define the package: the scope — what is out — is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `standards_declared` | define the package: the standards are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `site_rules_declared` | define the package: the site rules are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `interfaces_declared` | define the package: the interfaces are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `budget_link_declared` | define the package: the budget link is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `schedule_declared` | define the package: the schedule is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `acceptance_criteria_declared` | define the package: the acceptance criteria are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deliverables_agreed_or_gaps_documented` | quality gate: the deliverables list is agreed and complete — or its gaps are documented | Disjunction over two declared fields. Pass: either `deliverables_list_agreed` or `deliverable_gaps_documented` is declared `true`. Fail: at least one of the two fields is present and neither is `true`. Missing: both fields are absent. |
| `deliverables_declared` | define the package: the declared package record names its deliverables — the deliverables list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_deliverable_has_skill_kind` | define the package: every declared deliverable row carries a kind from the skill's own deliverables vocabulary — calc package, datasheet, drawing, test plan, procedure, BOM or report | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
#### Section: document_control_and_revisions

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `numbering_naming_convention_declared` | document control: the numbering/naming convention is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `status_flow_declared` | document control: the status flow — Draft, For Review, For Approval, For Construction, As-Built — is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_unapproved_revision_used_for_construction` | red line: no unapproved revision is used for construction | Pass: the red-line field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_untraceable_changes` | red line: no untraceable changes | Pass: the red-line field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `superseded_versions_retained_not_deleted` | red line: superseded versions are retained (marked), never deleted | Pass: the red-line field (`superseded_versions_deleted_present`) is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_uncontrolled_copies` | quality gate: no uncontrolled copies are floating | Pass: the quality-gate field (`uncontrolled_copies_present`) is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `documents_declared` | document control: the declared package record names its controlled documents — the documents list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_document_has_flow_status` | document control: every declared document row carries a status from the skill's own status flow — Draft, For Review, For Approval, For Construction or As-Built | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_document_has_revision` | document control: revisions — every declared document row carries a non-empty revision | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_document_declares_revision_reason` | document control: revisions carry a reason — every declared document row declares its revision reason | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_document_has_revision_history` | document control: a revision-history table is present on every controlled document | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
#### Section: check_discipline_and_transmittals

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `redline_backcheck_process_declared` | check discipline: the red-line/back-check process is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_calculation_independently_checked` | check discipline: every calculation is independently checked — every declared calc package row names a designer and a checker, and designer != checker | Computed over the declared record, reading only `calc package` document rows. Pass: the rule holds over the declared rows — including a package declaring no calculation rows, which passes this check on its declared documents. Fail: the declared record breaks the rule — an empty string, or a designer equal to the checker, on a calculation row (offending rows are named in the computed outputs). Missing: the list is absent, or `designer` or `checker` is absent on a calculation row. |
| `every_document_signoff_complete` | check discipline: sign-off blocks — every declared document row names who prepared, reviewed and approved it | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `transmittals_declared` | transmittals: the declared package record names its transmittals — the transmittals list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_transmittal_names_declared_document` | transmittals: every declared transmittal names a document the package declares — what was issued | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_transmittal_has_recipient` | transmittals: every declared transmittal row names a non-empty recipient — to whom it was issued | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_transmittal_revision_matches_document` | transmittals: every declared transmittal carries the named document's declared current revision — which revision was issued | Computed over the declared record. Pass: every transmittal's `revision` equals the named document's declared `revision`. Fail: a transmittal names an undeclared document, or its revision mismatches the named document's revision (mismatches are named in the computed outputs). Missing: any transmittal lacks `document` or `revision`, or any document lacks `revision`. |
| `every_transmittal_has_valid_date` | transmittals: every declared transmittal row carries a valid ISO issue date — when it was issued | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_transmittal_declares_return_status` | transmittals: every declared transmittal row declares its return status | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `transmittal_log_current_declared` | quality gate: the transmittal log is current | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_verbal_issue` | transmittals: nothing is issued verbally | Pass: the field (`verbal_issue_present`) is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
#### Section: delivery_quality_and_handover

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `every_document_declares_quality_elements` | delivery quality: each document states purpose, inputs, standards cited, units and results — declared on every document row | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_document_declares_assumptions_and_check_signature` | delivery quality: assumptions are explicit, never embedded, and a check signature is stated — declared on every document row | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `handover_as_built_marked` | handover: as-built is marked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `handover_om_references_declared` | handover: O&M references are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `handover_spares_list_declared` | handover: the spares list is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `handover_test_records_pointer_declared` | handover: the test-records pointer is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `handover_training_notes_declared` | handover: training notes are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `handover_closeout_checklist_signed` | handover: the close-out checklist is signed — the handover pack is complete at close-out | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"engineering-work-package-structuring"`), `atom_version` (`"0.1.0"`), and `package` (the manifest's declared package value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `deliverables_count`, `documents_count` and `transmittals_count` (the declared list lengths as integers, or null when the list is not declared); the row-name lists `deliverables_with_invalid_kind`, `documents_with_invalid_status`, `documents_without_revision`, `documents_without_revision_reason`, `documents_without_revision_history`, `documents_with_incomplete_signoff`, `calculations_not_independently_checked`, `documents_missing_quality_elements`, `documents_missing_assumptions_or_signature`, `transmittals_with_unknown_document`, `transmittals_without_recipient`, `transmittals_with_revision_mismatch`, `transmittals_with_invalid_date` and `transmittals_without_return_status` (each null when its underlying list — or, for the transmittal-document lists, either list — is not declared); and the ratios `signoff_coverage` (documents with a complete sign-off block ÷ declared documents), `independent_check_coverage` (calculation documents independently checked ÷ declared calculation documents) and `transmittal_document_coverage` (transmittals naming a declared document ÷ declared transmittals). Ratios are strings with exactly six decimal places under the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; comparisons use the unrounded values — which is what makes the Python and TypeScript outputs byte-identical. A ratio is null when its denominator list is absent or empty (and, for independent check coverage, when no declared document is a calculation; for transmittal document coverage, when either list is absent).
- `summary` — a one-line count, e.g. "42 pass, 0 fail, 0 missing of 42 checks across four sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared package value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `WORK_PACKAGE_STRUCTURED` — all 42 checks pass: the declared work-package record is complete and consistent with the bound skill's method, quality gates and red lines.
- `WORK_PACKAGE_NOT_STRUCTURED` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the six primary computed checks (documents declared, every document has flow status, every document has revision, every calculation independently checked, every transmittal names a declared document, every transmittal revision matches document) cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the engineering_work_package_structuring scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the engineering_work_package_structuring scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"deliverables","detail":"deliverables must be a list"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for engineering-work-package-structuring exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Run engineering work packages — scope, deliverables, document control, revisions, checks, transmittals, handover (the bound `engineering-work-packages` skill). You submit one declared record — the work-package manifest — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 4 sections (`package_definition`, `document_control_and_revisions`, `check_discipline_and_transmittals`, `delivery_quality_and_handover`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line and quality-gate fields that must be absent, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — list presence, per-row completeness and cross-row consistency — using only the declared record, with no outside threshold imported. One attestation-shaped check is a *disjunction*: `deliverables_agreed_or_gaps_documented` passes when either of its two fields is declared `true`, fails when at least one is present and neither is `true`, and is `missing` when both are absent. Aggregation is strict: any `fail` anywhere produces `WORK_PACKAGE_NOT_STRUCTURED`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `WORK_PACKAGE_STRUCTURED`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold — no deliverable, document or transmittal count, no revision count, and no budget or schedule limit — so no numeric threshold check is invented. Quantities are computed and reported; the only bar on the computed rows is completeness and internal consistency over the caller's own declared rows. Declined thresholds, named: a minimum or maximum deliverable count; a minimum or maximum controlled-document count; a minimum or maximum transmittal count; a minimum revision count or a required current revision letter (the skill requires revisions be controlled with a letter + reason and a history table, and names no minimum depth); a budget amount or budget-variance limit (the skill requires a budget *link*, and states no figure — only that the link is declared is checked); a schedule duration or milestone-date limit (the skill requires a schedule be declared, and states no dates for the package itself — only that the declaration is present is checked); a handover deadline after close-out; a checker-qualification or independence standard beyond designer ≠ checker (the skill states the inequality and no credential bar).

**What it does NOT do.** The atom audits a **declared** work-package structure record — it structures no work package, writes, checks or issues no document, keeps no transmittal log, reads no project files or document-management system, and does not verify that a declared control actually happens. A package is structured *on the caller's declared evidence*: a manifest that declares an agreed deliverables list, controlled documents with signed checks, and a complete handover pack passes those checks even if the real package has none of it. It is a completeness and consistency audit of the record the skill requires, **not an engineering service or a package certification**: it never judges whether the scope is the right scope, whether a calculation is correct, whether a check was competently performed, or whether the handover pack would actually serve operations — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent over the declared revisions. Non-reducible parts remain caller declarations only, and the atom does not judge them: whether the objective is the right objective; whether the scope split (in/out) is correct or complete for the real job; whether the cited standards and site rules are the applicable ones; whether a deliverable the package needs is missing from the list entirely (only declared rows are checked, and the agreed/gaps gate is itself a declaration); whether a document's content is technically correct; whether the named checker is genuinely independent in fact or competent to check (only that designer ≠ checker is declared by name); whether a revision reason is the true reason; whether the return status recorded for a transmittal is accurate; whether as-built marks reflect the field state; and whether the spares list would cover real failures (only that the handover elements are declared present). Named exclusions: no numeric thresholds (see the declined list above); no check that a `For Construction` document's revision is the latest issued beyond the declared transmittal-revision match; no live verification of any declared fact.

**Buyer and use context.** Teams and agents working in Electrical & energy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: EE consulting work package structuring. Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared work-package structure record; its verdict is a completeness and consistency judgment on declared evidence, not compliance or audit evidence, and SERVICE.md states plainly that it is not an engineering service or a package certification. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `engineering_work_package_structuring` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/engineering_work_package_structuring.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_engineering_work_package_structuring.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/engineering-work-package-structuring` (REST) and `POST /mcp/engineering-work-package-structuring` (MCP, tool `engineering_work_package_structuring`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `engineering_work_package_structuring`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T04:26:51.595589+00:00 against gateway v1.1.0, external verification lane, source `verification/work/engineering-work-package-structuring/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "package": "EE-2026-001",
  "definition": {
    "objective_declared": true,
    "scope_in_declared": true,
    "scope_out_declared": true,
    "standards_declared": true,
    "site_rules_declared": true,
    "interfaces_declared": true,
    "budget_link_declared": true,
    "schedule_declared": true,
    "acceptance_criteria_declared": true,
    "deliverables_list_agreed": true,
    "deliverable_gaps_documented": false
  },
  "deliverables": [
    {
      "name": "Main Calc",
      "kind": "calc package"
    }
  ],
  "documents": [
    {
      "name": "Calc-001",
      "kind": "calc package",
      "status": "For Approval",
      "revision": "A",
      "revision_reason_declared": true,
      "revision_history_present": true,
      "designer": "Alice",
      "checker": "Bob",
      "prepared_by": "Alice",
      "reviewed_by": "Charlie",
      "approved_by": "Dave",
      "purpose_declared": true,
      "inputs_declared": true,
      "assumptions_declared": true,
      "standards_cited_declared": true,
      "units_declared": true,
      "results_declared": true,
      "check_signature_declared": true
    }
  ],
  "document_control": {
    "numbering_naming_convention_declared": true,
    "status_flow_declared": true,
    "unapproved_revision_used_for_construction_present": false,
    "untraceable_changes_present": false,
    "superseded_versions_deleted_present": false,
    "uncontrolled_copies_present": false
  },
  "check_discipline": {
    "redline_backcheck_process_declared": true
  },
  "transmittals": [
    {
      "document": "Calc-001",
      "recipient": "Client",
      "revision": "A",
      "date": "2026-11-20",
      "return_status_declared": true
    }
  ],
  "transmittal_log": {
    "log_current_declared": true,
    "verbal_issue_present": false
  },
  "handover": {
    "as_built_marked": true,
    "om_references_declared": true,
    "spares_list_declared": true,
    "test_records_pointer_declared": true,
    "training_notes_declared": true,
    "closeout_checklist_signed": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "engineering-work-package-structuring",
  "atom_version": "0.1.0",
  "package": "EE-2026-001",
  "verdict": "WORK_PACKAGE_STRUCTURED",
  "sections": {
    "package_definition": "pass",
    "document_control_and_revisions": "pass",
    "check_discipline_and_transmittals": "pass",
    "delivery_quality_and_handover": "pass"
  },
  "checks": [
    {
      "section": "package_definition",
      "check": "objective_declared",
      "status": "pass",
      "evidence": "define the package: the objective is declared"
    },
    {
      "section": "package_definition",
      "check": "scope_in_declared",
      "status": "pass",
      "evidence": "define the package: the scope \u2014 what is in \u2014 is declared"
    },
    {
      "section": "package_definition",
      "check": "scope_out_declared",
      "status": "pass",
      "evidence": "define the package: the scope \u2014 what is out \u2014 is declared"
    },
    {
      "section": "package_definition",
      "check": "standards_declared",
      "status": "pass",
      "evidence": "define the package: the standards are declared"
    },
    {
      "section": "package_definition",
      "check": "site_rules_declared",
      "status": "pass",
      "evidence": "define the package: the site rules are declared"
    },
    {
      "section": "package_definition",
      "check": "interfaces_declared",
      "status": "pass",
      "evidence": "define the package: the interfaces are declared"
    },
    {
      "section": "package_definition",
      "check": "budget_link_declared",
      "status": "pass",
      "evidence": "define the package: the budget link is declared"
    },
    {
      "section": "package_definition",
      "check": "schedule_declared",
      "status": "pass",
      "evidence": "define the package: the schedule is declared"
    },
    {
      "section": "package_definition",
      "check": "acceptance_criteria_declared",
      "status": "pass",
      "evidence": "define the package: the acceptance criteria are declared"
    },
    {
      "section": "package_definition",
      "check": "deliverables_agreed_or_gaps_documented",
      "status": "pass",
      "evidence": "quality gate: the deliverables list is agreed and complete \u2014 or its gaps are documented"
    },
    {
      "section": "package_definition",
      "check": "deliverables_declared",
      "status": "pass",
      "evidence": "define the package: the declared package record names its deliverables \u2014 the deliverables list is present and non-empty"
    },
    {
      "section": "package_definition",
      "check": "every_deliverable_has_skill_kind",
      "status": "pass",
      "evidence": "define the package: every declared deliverable row carries a kind from the skill's own deliverables vocabulary \u2014 calc package, datasheet, drawing, test plan, procedure, BOM or report"
    },
    {
      "section": "document_control_and_revisions",
      "check": "numbering_naming_convention_declared",
      "status": "pass",
      "evidence": "document control: the numbering/naming convention is declared"
    },
    {
      "section": "document_control_and_revisions",
      "check": "status_flow_declared",
      "status": "pass",
      "evidence": "document control: the status flow \u2014 Draft, For Review, For Approval, For Construction, As-Built \u2014 is declared"
    },
    {
      "section": "document_control_and_revisions",
      "check": "no_unapproved_revision_used_for_construction",
      "status": "pass",
      "evidence": "red line: no unapproved revision is used for construction"
    },
    {
      "section": "document_control_and_revisions",
      "check": "no_untraceable_changes",
      "status": "pass",
      "evidence": "red line: no untraceable changes"
    },
    {
      "section": "document_control_and_revisions",
      "check": "superseded_versions_retained_not_deleted",
      "status": "pass",
      "evidence": "red line: superseded versions are retained (marked), never deleted"
    },
    {
      "section": "document_control_and_revisions",
      "check": "no_uncontrolled_copies",
      "status": "pass",
      "evidence": "quality gate: no uncontrolled copies are floating"
    },
    {
      "section": "document_control_and_revisions",
      "check": "documents_declared",
      "status": "pass",
      "evidence": "document control: the declared package record names its controlled documents \u2014 the documents list is present and non-empty"
    },
    {
      "section": "document_control_and_revisions",
      "check": "every_document_has_flow_status",
      "status": "pass",
      "evidence": "document control: every declared document row carries a status from the skill's own status flow \u2014 Draft, For Review, For Approval, For Construction or As-Built"
    },
    {
      "section": "document_control_and_revisions",
      "check": "every_document_has_revision",
      "status": "pass",
      "evidence": "document control: revisions \u2014 every declared document row carries a non-empty revision"
    },
    {
      "section": "document_control_and_revisions",
      "check": "every_document_declares_revision_reason",
      "status": "pass",
      "evidence": "document control: revisions carry a reason \u2014 every declared document row declares its revision reason"
    },
    {
      "section": "document_control_and_revisions",
      "check": "every_document_has_revision_history",
      "status": "pass",
      "evidence": "document control: a revision-history table is present on every controlled document"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "redline_backcheck_process_declared",
      "status": "pass",
      "evidence": "check discipline: the red-line/back-check process is declared"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_calculation_independently_checked",
      "status": "pass",
      "evidence": "check discipline: every calculation is independently checked \u2014 every declared calc package row names a designer and a checker, and designer != checker"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_document_signoff_complete",
      "status": "pass",
      "evidence": "check discipline: sign-off blocks \u2014 every declared document row names who prepared, reviewed and approved it"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "transmittals_declared",
      "status": "pass",
      "evidence": "transmittals: the declared package record names its transmittals \u2014 the transmittals list is present and non-empty"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_transmittal_names_declared_document",
      "status": "pass",
      "evidence": "transmittals: every declared transmittal names a document the package declares \u2014 what was issued"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_transmittal_has_recipient",
      "status": "pass",
      "evidence": "transmittals: every declared transmittal row names a non-empty recipient \u2014 to whom it was issued"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_transmittal_revision_matches_document",
      "status": "pass",
      "evidence": "transmittals: every declared transmittal carries the named document's declared current revision \u2014 which revision was issued"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_transmittal_has_valid_date",
      "status": "pass",
      "evidence": "transmittals: every declared transmittal row carries a valid ISO issue date \u2014 when it was issued"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_transmittal_declares_return_status",
      "status": "pass",
      "evidence": "transmittals: every declared transmittal row declares its return status"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "transmittal_log_current_declared",
      "status": "pass",
      "evidence": "quality gate: the transmittal log is current"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "no_verbal_issue",
      "status": "pass",
      "evidence": "transmittals: nothing is issued verbally"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "every_document_declares_quality_elements",
      "status": "pass",
      "evidence": "delivery quality: each document states purpose, inputs, standards cited, units and results \u2014 declared on every document row"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "every_document_declares_assumptions_and_check_signature",
      "status": "pass",
      "evidence": "delivery quality: assumptions are explicit, never embedded, and a check signature is stated \u2014 declared on every document row"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "handover_as_built_marked",
      "status": "pass",
      "evidence": "handover: as-built is marked"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "handover_om_references_declared",
      "status": "pass",
      "evidence": "handover: O&M references are declared"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "handover_spares_list_declared",
      "status": "pass",
      "evidence": "handover: the spares list is declared"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "handover_test_records_pointer_declared",
      "status": "pass",
      "evidence": "handover: the test-records pointer is declared"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "handover_training_notes_declared",
      "status": "pass",
      "evidence": "handover: training notes are declared"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "handover_closeout_checklist_signed",
      "status": "pass",
      "evidence": "handover: the close-out checklist is signed \u2014 the handover pack is complete at close-out"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "deliverables_count": 1,
  "deliverables_with_invalid_kind": [],
  "documents_count": 1,
  "documents_with_invalid_status": [],
  "documents_without_revision": [],
  "documents_without_revision_reason": [],
  "documents_without_revision_history": [],
  "documents_with_incomplete_signoff": [],
  "signoff_coverage": "1.000000",
  "calculations_not_independently_checked": [],
  "independent_check_coverage": "1.000000",
  "documents_missing_quality_elements": [],
  "documents_missing_assumptions_or_signature": [],
  "transmittals_count": 1,
  "transmittals_with_unknown_document": [],
  "transmittals_without_recipient": [],
  "transmittals_with_revision_mismatch": [],
  "transmittals_with_invalid_date": [],
  "transmittals_without_return_status": [],
  "transmittal_document_coverage": "1.000000",
  "summary": "42 pass, 0 fail, 0 missing of 42 checks across four sections.",
  "stamp": "ENGINEERING WORK PACKAGE STRUCTURING\npackage: EE-2026-001\nVERDICT: WORK_PACKAGE_STRUCTURED\n  package_definition                   pass\n  document_control_and_revisions       pass\n  check_discipline_and_transmittals    pass\n  delivery_quality_and_handover        pass\n42 pass, 0 fail, 0 missing of 42 checks across four sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "package": "EE-2026-002",
  "definition": {
    "objective_declared": true,
    "scope_in_declared": true,
    "scope_out_declared": true,
    "standards_declared": true,
    "site_rules_declared": true,
    "interfaces_declared": true,
    "budget_link_declared": true,
    "schedule_declared": true,
    "acceptance_criteria_declared": true,
    "deliverables_list_agreed": true,
    "deliverable_gaps_documented": false
  },
  "deliverables": [
    {
      "name": "Main Calc",
      "kind": "invalid_kind"
    }
  ],
  "documents": [
    {
      "name": "Calc-001",
      "kind": "calc package",
      "status": "InvalidStatus",
      "revision": "",
      "revision_reason_declared": false,
      "revision_history_present": false,
      "designer": "Alice",
      "checker": "Bob",
      "prepared_by": "",
      "reviewed_by": "",
      "approved_by": "",
      "purpose_declared": false,
      "inputs_declared": false,
      "assumptions_declared": false,
      "standards_cited_declared": false,
      "units_declared": false,
      "results_declared": false,
      "check_signature_declared": false
    }
  ],
  "document_control": {
    "numbering_naming_convention_declared": true,
    "status_flow_declared": true,
    "unapproved_revision_used_for_construction_present": false,
    "untraceable_changes_present": false,
    "superseded_versions_deleted_present": false,
    "uncontrolled_copies_present": false
  },
  "check_discipline": {
    "redline_backcheck_process_declared": true
  },
  "transmittals": [
    {
      "document": "NonExistent",
      "recipient": "Client",
      "revision": "B",
      "date": "2027-02-30",
      "return_status_declared": false
    }
  ],
  "transmittal_log": {
    "log_current_declared": true,
    "verbal_issue_present": false
  },
  "handover": {
    "as_built_marked": true,
    "om_references_declared": true,
    "spares_list_declared": true,
    "test_records_pointer_declared": true,
    "training_notes_declared": true,
    "closeout_checklist_signed": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "engineering-work-package-structuring",
  "atom_version": "0.1.0",
  "package": "EE-2026-002",
  "verdict": "WORK_PACKAGE_NOT_STRUCTURED",
  "sections": {
    "package_definition": "fail",
    "document_control_and_revisions": "fail",
    "check_discipline_and_transmittals": "fail",
    "delivery_quality_and_handover": "fail"
  },
  "checks": [
    {
      "section": "package_definition",
      "check": "objective_declared",
      "status": "pass",
      "evidence": "define the package: the objective is declared"
    },
    {
      "section": "package_definition",
      "check": "scope_in_declared",
      "status": "pass",
      "evidence": "define the package: the scope \u2014 what is in \u2014 is declared"
    },
    {
      "section": "package_definition",
      "check": "scope_out_declared",
      "status": "pass",
      "evidence": "define the package: the scope \u2014 what is out \u2014 is declared"
    },
    {
      "section": "package_definition",
      "check": "standards_declared",
      "status": "pass",
      "evidence": "define the package: the standards are declared"
    },
    {
      "section": "package_definition",
      "check": "site_rules_declared",
      "status": "pass",
      "evidence": "define the package: the site rules are declared"
    },
    {
      "section": "package_definition",
      "check": "interfaces_declared",
      "status": "pass",
      "evidence": "define the package: the interfaces are declared"
    },
    {
      "section": "package_definition",
      "check": "budget_link_declared",
      "status": "pass",
      "evidence": "define the package: the budget link is declared"
    },
    {
      "section": "package_definition",
      "check": "schedule_declared",
      "status": "pass",
      "evidence": "define the package: the schedule is declared"
    },
    {
      "section": "package_definition",
      "check": "acceptance_criteria_declared",
      "status": "pass",
      "evidence": "define the package: the acceptance criteria are declared"
    },
    {
      "section": "package_definition",
      "check": "deliverables_agreed_or_gaps_documented",
      "status": "pass",
      "evidence": "quality gate: the deliverables list is agreed and complete \u2014 or its gaps are documented"
    },
    {
      "section": "package_definition",
      "check": "deliverables_declared",
      "status": "pass",
      "evidence": "define the package: the declared package record names its deliverables \u2014 the deliverables list is present and non-empty"
    },
    {
      "section": "package_definition",
      "check": "every_deliverable_has_skill_kind",
      "status": "fail",
      "evidence": "define the package: every declared deliverable row carries a kind from the skill's own deliverables vocabulary \u2014 calc package, datasheet, drawing, test plan, procedure, BOM or report"
    },
    {
      "section": "document_control_and_revisions",
      "check": "numbering_naming_convention_declared",
      "status": "pass",
      "evidence": "document control: the numbering/naming convention is declared"
    },
    {
      "section": "document_control_and_revisions",
      "check": "status_flow_declared",
      "status": "pass",
      "evidence": "document control: the status flow \u2014 Draft, For Review, For Approval, For Construction, As-Built \u2014 is declared"
    },
    {
      "section": "document_control_and_revisions",
      "check": "no_unapproved_revision_used_for_construction",
      "status": "pass",
      "evidence": "red line: no unapproved revision is used for construction"
    },
    {
      "section": "document_control_and_revisions",
      "check": "no_untraceable_changes",
      "status": "pass",
      "evidence": "red line: no untraceable changes"
    },
    {
      "section": "document_control_and_revisions",
      "check": "superseded_versions_retained_not_deleted",
      "status": "pass",
      "evidence": "red line: superseded versions are retained (marked), never deleted"
    },
    {
      "section": "document_control_and_revisions",
      "check": "no_uncontrolled_copies",
      "status": "pass",
      "evidence": "quality gate: no uncontrolled copies are floating"
    },
    {
      "section": "document_control_and_revisions",
      "check": "documents_declared",
      "status": "pass",
      "evidence": "document control: the declared package record names its controlled documents \u2014 the documents list is present and non-empty"
    },
    {
      "section": "document_control_and_revisions",
      "check": "every_document_has_flow_status",
      "status": "fail",
      "evidence": "document control: every declared document row carries a status from the skill's own status flow \u2014 Draft, For Review, For Approval, For Construction or As-Built"
    },
    {
      "section": "document_control_and_revisions",
      "check": "every_document_has_revision",
      "status": "fail",
      "evidence": "document control: revisions \u2014 every declared document row carries a non-empty revision"
    },
    {
      "section": "document_control_and_revisions",
      "check": "every_document_declares_revision_reason",
      "status": "fail",
      "evidence": "document control: revisions carry a reason \u2014 every declared document row declares its revision reason"
    },
    {
      "section": "document_control_and_revisions",
      "check": "every_document_has_revision_history",
      "status": "fail",
      "evidence": "document control: a revision-history table is present on every controlled document"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "redline_backcheck_process_declared",
      "status": "pass",
      "evidence": "check discipline: the red-line/back-check process is declared"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_calculation_independently_checked",
      "status": "pass",
      "evidence": "check discipline: every calculation is independently checked \u2014 every declared calc package row names a designer and a checker, and designer != checker"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_document_signoff_complete",
      "status": "fail",
      "evidence": "check discipline: sign-off blocks \u2014 every declared document row names who prepared, reviewed and approved it"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "transmittals_declared",
      "status": "pass",
      "evidence": "transmittals: the declared package record names its transmittals \u2014 the transmittals list is present and non-empty"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_transmittal_names_declared_document",
      "status": "fail",
      "evidence": "transmittals: every declared transmittal names a document the package declares \u2014 what was issued"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_transmittal_has_recipient",
      "status": "pass",
      "evidence": "transmittals: every declared transmittal row names a non-empty recipient \u2014 to whom it was issued"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_transmittal_revision_matches_document",
      "status": "fail",
      "evidence": "transmittals: every declared transmittal carries the named document's declared current revision \u2014 which revision was issued"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_transmittal_has_valid_date",
      "status": "fail",
      "evidence": "transmittals: every declared transmittal row carries a valid ISO issue date \u2014 when it was issued"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "every_transmittal_declares_return_status",
      "status": "fail",
      "evidence": "transmittals: every declared transmittal row declares its return status"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "transmittal_log_current_declared",
      "status": "pass",
      "evidence": "quality gate: the transmittal log is current"
    },
    {
      "section": "check_discipline_and_transmittals",
      "check": "no_verbal_issue",
      "status": "pass",
      "evidence": "transmittals: nothing is issued verbally"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "every_document_declares_quality_elements",
      "status": "fail",
      "evidence": "delivery quality: each document states purpose, inputs, standards cited, units and results \u2014 declared on every document row"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "every_document_declares_assumptions_and_check_signature",
      "status": "fail",
      "evidence": "delivery quality: assumptions are explicit, never embedded, and a check signature is stated \u2014 declared on every document row"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "handover_as_built_marked",
      "status": "pass",
      "evidence": "handover: as-built is marked"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "handover_om_references_declared",
      "status": "pass",
      "evidence": "handover: O&M references are declared"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "handover_spares_list_declared",
      "status": "pass",
      "evidence": "handover: the spares list is declared"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "handover_test_records_pointer_declared",
      "status": "pass",
      "evidence": "handover: the test-records pointer is declared"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "handover_training_notes_declared",
      "status": "pass",
      "evidence": "handover: training notes are declared"
    },
    {
      "section": "delivery_quality_and_handover",
      "check": "handover_closeout_checklist_signed",
      "status": "pass",
      "evidence": "handover: the close-out checklist is signed \u2014 the handover pack is complete at close-out"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "deliverables_count": 1,
  "deliverables_with_invalid_kind": [
    "Main Calc"
  ],
  "documents_count": 1,
  "documents_with_invalid_status": [
    "Calc-001"
  ],
  "documents_without_revision": [
    "Calc-001"
  ],
  "documents_without_revision_reason": [
    "Calc-001"
  ],
  "documents_without_revision_history": [
    "Calc-001"
  ],
  "documents_with_incomplete_signoff": [
    "Calc-001"
  ],
  "signoff_coverage": "0.000000",
  "calculations_not_independently_checked": [],
  "independent_check_coverage": "1.000000",
  "documents_missing_quality_elements": [
    "Calc-001"
  ],
  "documents_missing_assumptions_or_signature": [
    "Calc-001"
  ],
  "transmittals_count": 1,
  "transmittals_with_unknown_document": [
    "NonExistent"
  ],
  "transmittals_without_recipient": [],
  "transmittals_with_revision_mismatch": [],
  "transmittals_with_invalid_date": [
    "NonExistent"
  ],
  "transmittals_without_return_status": [
    "NonExistent"
  ],
  "transmittal_document_coverage": "0.000000",
  "summary": "30 pass, 12 fail, 0 missing of 42 checks across four sections.",
  "stamp": "ENGINEERING WORK PACKAGE STRUCTURING\npackage: EE-2026-002\nVERDICT: WORK_PACKAGE_NOT_STRUCTURED\n  package_definition                   fail\n  document_control_and_revisions       fail\n  check_discipline_and_transmittals    fail\n  delivery_quality_and_handover        fail\n30 pass, 12 fail, 0 missing of 42 checks across four sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "package": "Malformed",
  "deliverables": "not_a_list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "deliverables",
  "detail": "deliverables must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared work-package structure record; its verdict is a completeness and consistency judgment on declared evidence, not compliance or audit evidence, and SERVICE.md states plainly that it is not an engineering service or a package certification. |
| Checks named | 42 documented / 42 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses |
| Input reference typed | Yes — 63 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/engineering-work-package-structuring/evidence.json` |
