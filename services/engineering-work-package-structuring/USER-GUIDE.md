# Engineering work package structuring — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have an engineering work package and a record of how it is structured — its definition, deliverables, controlled documents and revisions, check discipline, transmittals and handover. This atom reads one declared manifest and returns one deterministic verdict across four sections: **WORK_PACKAGE_STRUCTURED**, **WORK_PACKAGE_NOT_STRUCTURED**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and internal consistency only — it structures no work package, writes, checks or issues no document, keeps no transmittal log, reads no project files or document-management system, and does not verify that a declared control actually happens. A package is structured *on your declared evidence*: it never judges whether the scope is the right scope, whether a calculation is correct, whether a check was competently performed, or whether the handover pack would actually serve operations. Computed checks: the declared `deliverables`, `documents` and `transmittals` lists must be present and non-empty; every deliverable row must carry a kind from the skill's vocabulary (`calc package`, `datasheet`, `drawing`, `test plan`, `procedure`, `BOM`, `report`); every document row must carry a status from the skill's flow (`Draft`, `For Review`, `For Approval`, `For Construction`, `As-Built`), a non-empty revision with a declared reason and a present revision history, a complete sign-off block, and the delivery-quality elements; every `calc package` document must be independently checked (named designer and checker, designer ≠ checker); and every transmittal must name a declared document, a non-empty recipient, that document's current revision, a valid ISO date, and a declared return status. The deliverables gate is a disjunction: the list is agreed, *or* its gaps are documented. No numeric threshold is imposed — no minimum or maximum deliverable, document or transmittal count, no minimum revision depth, and no budget or schedule limit (only that a budget link and a schedule are declared is checked). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "engineering-work-package-structuring"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/engineering-work-package-structuring` — tool name `engineering_work_package_structuring`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/engineering-work-package-structuring` — body = the manifest object; same `Authorization` header.

## Input — the engineering-work-package-structuring manifest

| Field | Meaning |
|---|---|
| `package` | work-package name (string; carried into the output, not checked) |
| `definition.objective_declared` / `scope_in_declared` / `scope_out_declared` | definition evidence: the objective is declared; the scope — what is in and what is out — is declared |
| `definition.standards_declared` / `site_rules_declared` / `interfaces_declared` | definition evidence: the standards, site rules and interfaces are declared |
| `definition.budget_link_declared` / `schedule_declared` / `acceptance_criteria_declared` | definition evidence: the budget link, schedule and acceptance criteria are declared |
| `definition.deliverables_list_agreed` / `deliverable_gaps_documented` | quality gate (disjunction): passes when either is `true`; fails when at least one is present and neither is true |
| `deliverables` (list of `{name, kind}` rows) | computed: must be present and non-empty; reported as `deliverables_count` |
| `deliverables[].name` (string) | names the row in the computed outputs |
| `deliverables[].kind` (string) | computed: must be one of `calc package`, `datasheet`, `drawing`, `test plan`, `procedure`, `BOM`, `report`; other strings are reported in `deliverables_with_invalid_kind` |
| `documents` (list of controlled-document rows) | computed: must be present and non-empty; reported as `documents_count` |
| `documents[].name` (string) | names the row in the computed outputs; transmittal `document` fields must equal it to resolve |
| `documents[].kind` (string) | the row's deliverable kind; the value `calc package` marks the row as a calculation for the independent-check computation (not vocabulary-checked on document rows) |
| `documents[].status` (string) | computed: must be one of `Draft`, `For Review`, `For Approval`, `For Construction`, `As-Built`; other strings are reported in `documents_with_invalid_status` |
| `documents[].revision` (string) | computed: must be a non-empty string; rows without one are reported in `documents_without_revision` |
| `documents[].revision_reason_declared` / `revision_history_present` | computed: every row must declare both `true`; rows that do not are reported in `documents_without_revision_reason` / `documents_without_revision_history` |
| `documents[].designer` (string) / `checker` (string) | computed, `calc package` rows only: both must be non-empty and different; rows that fail are reported in `calculations_not_independently_checked` |
| `documents[].prepared_by` / `reviewed_by` / `approved_by` (strings) | computed: all three must be non-empty (the sign-off block); rows that fail are reported in `documents_with_incomplete_signoff` |
| `documents[].purpose_declared` / `inputs_declared` / `standards_cited_declared` / `units_declared` / `results_declared` | computed: all five must be `true` (delivery-quality elements); rows that fail are reported in `documents_missing_quality_elements` |
| `documents[].assumptions_declared` / `check_signature_declared` | computed: both must be `true` (assumptions explicit, never embedded; check signature stated); rows that fail are reported in `documents_missing_assumptions_or_signature` |
| `document_control.numbering_naming_convention_declared` / `status_flow_declared` | document-control evidence: the numbering/naming convention and the status flow are declared |
| `document_control.unapproved_revision_used_for_construction_present` | must be `false` to pass (red line: no unapproved revision used for construction) |
| `document_control.untraceable_changes_present` | must be `false` to pass (red line: no untraceable changes) |
| `document_control.superseded_versions_deleted_present` | must be `false` to pass (red line: superseded versions are retained, marked, never deleted) |
| `document_control.uncontrolled_copies_present` | must be `false` to pass (quality gate: no uncontrolled copies floating) |
| `check_discipline.redline_backcheck_process_declared` | check-discipline evidence: the red-line/back-check process is declared |
| `transmittals` (list of `{document, recipient, revision, date, return_status_declared}` rows) | computed: must be present and non-empty; reported as `transmittals_count` |
| `transmittals[].document` (string) | computed: must name a declared document; rows that do not are reported in `transmittals_with_unknown_document` |
| `transmittals[].recipient` (string) | computed: must be a non-empty string; rows without one are reported in `transmittals_without_recipient` |
| `transmittals[].revision` (string) | computed: must equal the named document's declared `revision`; mismatches are reported in `transmittals_with_revision_mismatch` |
| `transmittals[].date` (string) | computed: must parse as a strict ISO `YYYY-MM-DD` calendar date; rows that fail are reported in `transmittals_with_invalid_date` |
| `transmittals[].return_status_declared` | computed: every row must declare `true`; rows that do not are reported in `transmittals_without_return_status` |
| `transmittal_log.log_current_declared` | transmittal evidence: the transmittal log is current |
| `transmittal_log.verbal_issue_present` | must be `false` to pass (nothing is issued verbally) |
| `handover.as_built_marked` / `om_references_declared` / `spares_list_declared` | handover evidence: as-built is marked; O&M references and the spares list are declared |
| `handover.test_records_pointer_declared` / `training_notes_declared` / `closeout_checklist_signed` | handover evidence: the test-records pointer and training notes are declared; the close-out checklist is signed |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward WORK_PACKAGE_NOT_STRUCTURED). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/engineering-work-package-structuring`:

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

Response — HTTP 200 (trimmed; the full response carries all 42 checks and a text stamp of the verdict):

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
  "summary": "42 pass, 0 fail, 0 missing of 42 checks across four sections."
}
```

## Verdicts

- **WORK_PACKAGE_STRUCTURED** — every check passes; the declared work-package record is complete and consistent with the skill's method, quality gates and red lines.
- **WORK_PACKAGE_NOT_STRUCTURED** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `deliverables_count`, `documents_count` and `transmittals_count` (the declared list lengths as integers, or null when the list is not declared), the row-name lists `deliverables_with_invalid_kind`, `documents_with_invalid_status`, `documents_without_revision`, `documents_without_revision_reason`, `documents_without_revision_history`, `documents_with_incomplete_signoff`, `calculations_not_independently_checked`, `documents_missing_quality_elements`, `documents_missing_assumptions_or_signature`, `transmittals_with_unknown_document`, `transmittals_without_recipient`, `transmittals_with_revision_mismatch`, `transmittals_with_invalid_date` and `transmittals_without_return_status` (each null when its underlying list — or, for the transmittal-document lists, either list — is not declared), the coverage ratios `signoff_coverage`, `independent_check_coverage` and `transmittal_document_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty — and, for independent check coverage, when no declared document is a calculation; for transmittal document coverage, when either list is absent), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the six primary computed checks — documents declared, every document has flow status, every document has revision, every calculation independently checked, every transmittal names a declared document, every transmittal revision matches document — cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
