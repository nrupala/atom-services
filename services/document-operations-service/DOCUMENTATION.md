# Document operations service — documentation

**Document operations service** · slug `document-operations-service` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `operation` "annual_report_audit"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "document-operations-service"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the document-operations manifest.** You declare a record of work already done — the atom audits the record, it does not do the work (see Explanation). The recorded full-pass manifest declares the operation `annual_report_audit`: the file, its format and its home are identified, the authoritative copy is opened, and extraction reads in source order. Documents and findings are both declared; every finding records a source location and declares its numbers were quoted exactly before interpretation; every quoted number carries a location, quoted exactly first and interpreted separately, with no figure quoted without a location and unreadable or missing sections named. Edits are worked on the editable source with headings, tables and styles preserved; no rewrite is declared requested, so tracked structure must be — and is declared — intact; the editable source is saved alongside the output and never overwritten with a flattened export. Every document's output is declared re-opened and checked, and headings, tables and totals are declared matching. No conversion, no revisable deliverable, no external sharing and — in this record — no edits are declared performed, so the conversion, editable-source-kept, send-format and change-list checks pass as not applicable; the send copy is nonetheless declared free of draft marks, findings come first in decision order with locations, and any loss, gap or unreadable section is stated in the delivery note.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/document-operations-service` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `DOCUMENT_OPERATIONS_SOUND`: "32 pass, 0 fail, 0 missing of 32 checks across four sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `DOCUMENT_OPERATIONS_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "document-operations-service"}`.
3. Call: `POST https://atoms.pipavia.com/v1/document-operations-service` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/document-operations-service` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `document_operations_service`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `DOCUMENT_OPERATIONS_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_finding_has_location_recorded`, `every_finding_quoted_exactly_before_interpretation`, `no_figure_quoted_without_location`, `every_document_output_reopened_and_checked`, and the summary reads "28 pass, 4 fail, 0 missing of 32 checks across four sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (see Output format). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "documents",
  "detail": "documents must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/document-operations-service` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/document-operations-service` — tool name `document_operations_service`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `document_operations_service` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `DOCUMENT_OPERATIONS_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `operation` | string | Carried into the verdict output, not itself checked |

#### Read by: source_and_extraction

| Field | Type | Notes |
|---|---|---|
| `source.file_format_and_home_identified` | boolean | — |
| `source.authoritative_copy_opened` | boolean | — |
| `source.read_in_source_order` | boolean | — |
| `findings` | list | list of finding-row objects, each `{name, location, quoted_exactly_before_interpretation}` — see the three entry fields below; computed, see below |
| `findings[].name` | string | Names the row in the computed `findings_without_*` outputs |
| `findings[].location` | string | Must be a non-empty string for the row to pass the computed location check — an absent field is missing evidence, an empty string fails |
| `findings[].quoted_exactly_before_interpretation` | boolean | — |
| `extraction.every_number_has_source_location` | boolean | — |
| `extraction.numbers_quoted_exactly_then_interpreted_separately` | boolean | — |
| `extraction.figure_quoted_without_location_present` | boolean | must be `false` to pass — skill red line |
| `extraction.unreadable_or_missing_sections_named` | boolean | — |

#### Read by: source_and_extraction, conversion_and_verification

| Field | Type | Notes |
|---|---|---|
| `documents` | list | list of document-row objects, each `{name, output_reopened_and_checked}` — see the two entry fields below; computed, see below |

#### Read by: conversion_and_verification

| Field | Type | Notes |
|---|---|---|
| `documents[].name` | string | Names the row in the computed `documents_without_output_verification` output |
| `documents[].output_reopened_and_checked` | boolean | — |
| `conversion.conversion_performed` | boolean (gate) | gates the three conversion checks below |
| `conversion.output_reopened_and_compared_section_by_section` | boolean | required when a conversion is declared performed; otherwise the check passes as not applicable |
| `conversion.headings_tables_lists_figures_totals_survive` | boolean | required when a conversion is declared performed; otherwise the check passes as not applicable |
| `conversion.content_loss_detected` | boolean (gate) | gates the loss-handling check below |
| `conversion.loss_fixed_or_reported_plainly` | boolean | required when a content loss is declared detected; otherwise the check passes as not applicable |
| `conversion.conversion_with_dropped_content_shipped_present` | boolean | must be `false` to pass when a conversion is declared performed — skill red line; passes as not applicable when no conversion is declared |
| `verification.output_reopened_and_checked_after_edit_or_conversion` | boolean | — |
| `verification.headings_tables_totals_match_source_and_output` | boolean | — |

#### Read by: delivery_and_hygiene

| Field | Type | Notes |
|---|---|---|
| `editing.edits_performed` | boolean (gate) | gates the change-list check below |
| `deliverable.shared_externally` | boolean (gate) | gates the two send-format checks below |
| `deliverable.send_copy_is_docx_not_markdown` | boolean | required when an externally shared deliverable is declared; otherwise the check passes as not applicable |
| `deliverable.markdown_sent_as_external_deliverable_present` | boolean | must be `false` to pass when an externally shared deliverable is declared — skill red line; passes as not applicable when none is declared |
| `deliverable.draft_banners_comments_tracked_changes_stripped` | boolean | — |
| `deliverable.send_copy_contains_draft_marks_present` | boolean | must be `false` to pass — skill quality gate |
| `delivery.findings_first_in_decision_order_with_locations` | boolean | — |
| `delivery.change_list_provided` | boolean | required when edits are declared performed; otherwise the check passes as not applicable |
| `delivery.finished_file_in_send_format_plus_editable_source` | boolean | — |
| `delivery.loss_gap_unreadable_stated_in_delivery_note` | boolean | — |

#### Read by: editing_and_preservation

| Field | Type | Notes |
|---|---|---|
| `editing.edits_on_editable_source` | boolean | — |
| `editing.headings_tables_styles_preserved` | boolean | — |
| `editing.rewrite_requested` | boolean (gate) | inverted gate for the tracked-structure check below: the check binds when no rewrite is declared requested, and passes as not applicable when a rewrite is declared requested |
| `editing.tracked_structure_intact` | boolean | required when no rewrite is declared requested; otherwise the check passes as not applicable |
| `preservation.editable_source_saved_alongside_output` | boolean | — |
| `preservation.revisable_deliverable_present` | boolean (gate) | gates the editable-source-kept check below |
| `preservation.editable_source_kept_for_revisable` | boolean | required when a revisable deliverable is declared; otherwise the check passes as not applicable |
| `preservation.only_editable_source_overwritten_with_flattened_export_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 32 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: source_and_extraction

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `file_format_and_home_identified` | method: the file, its format, and its home — Vault, Drive, Docs, Notion, Box, or Dropbox — are identified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `authoritative_copy_opened` | method: the authoritative copy is opened, not a stale download | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `read_in_source_order` | method: extraction reads in source order and keeps locations attached to everything pulled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `documents_declared` | method: the declared operation record names its documents — the documents list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `findings_declared` | method: the declared operation record names its findings — the findings list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_finding_has_location_recorded` | method / quality gate: every declared finding row records its location — page for PDFs and docs, sheet and cell for spreadsheets, slide number for decks | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_finding_quoted_exactly_before_interpretation` | method: every declared finding row declares its numbers were quoted exactly as written first, before any interpretation | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_quoted_number_carries_source_location` | quality gate / red line: every quoted number carries a page, sheet/cell, or slide reference | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `numbers_quoted_exactly_then_interpreted_separately` | method: numbers are quoted exactly as written first, then interpreted separately — a figure and its reading are never merged into one line | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_figure_quoted_without_location` | red line: no figure is quoted from a document without its source location | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `unreadable_or_missing_sections_named` | quality gate / method: unreadable or missing sections are named, not skipped over — the report states any pages, sheets, or sections that could not be read | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
#### Section: editing_and_preservation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `edits_made_on_editable_source` | method: edits are worked on the editable source | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `headings_tables_styles_preserved` | method: headings, tables, and styles are preserved in edits | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tracked_structure_intact_unless_rewrite_requested` | method: tracked structure is kept intact — no rewrite was requested | Conditional on `editing.rewrite_requested (inverted: the check binds when no rewrite is declared requested — declared `false` or absent — and passes as not applicable when a rewrite is declared requested)`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `editable_source_saved_alongside_output` | method: the revised editable source is saved alongside the output, so the next edit starts from a real source, not a flattened export | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `editable_source_kept_when_revisable` | no revisable deliverable declared | Conditional on `preservation.revisable_deliverable_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `only_editable_source_not_overwritten_with_flattened_export` | red line: the only editable source is never overwritten with a flattened export | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
#### Section: conversion_and_verification

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `every_document_output_reopened_and_checked` | quality gate: every declared document row declares its output file was re-opened and checked after editing or conversion — the finished file is verified, not the file that was intended | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `output_reopened_and_checked_after_edit_or_conversion` | quality gate: the output file was re-opened and checked after editing or conversion | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `headings_tables_totals_match_source_and_output` | quality gate: headings, tables, and totals match between source and output | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `conversion_output_reopened_and_compared_when_converted` | no conversion declared performed | Conditional on `conversion.conversion_performed`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `conversion_content_survives_when_converted` | no conversion declared performed | Conditional on `conversion.conversion_performed`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `conversion_loss_fixed_or_reported_when_detected` | no conversion content loss declared detected | Conditional on `conversion.content_loss_detected`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `no_conversion_with_dropped_content_shipped` | no conversion declared performed | Conditional on `conversion.conversion_performed`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
#### Section: delivery_and_hygiene

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `send_copy_is_docx_not_markdown_when_shared` | no externally shared deliverable declared | Conditional on `deliverable.shared_externally`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `no_markdown_sent_as_external_deliverable` | no externally shared deliverable declared | Conditional on `deliverable.shared_externally`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `draft_banners_comments_tracked_changes_stripped` | method: draft banners, review marks, comments, and tracked changes are stripped from the send copy | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `send_copy_free_of_draft_marks` | quality gate: send copies have zero draft banners, comments, or tracked changes | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `findings_first_in_decision_order_with_locations` | delivery: findings come first, in the order the decision needs them, locations attached | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `change_list_provided_when_edits_performed` | no edits declared performed | Conditional on `editing.edits_performed`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run where applicable). Fail: the gate is declared and the requirement is declared unmet (for per-row gates: a gated row declares it unmet). Missing: the gate is declared and the required field is absent (for per-row gates: absent on a gated row). |
| `finished_file_in_send_format_plus_editable_source` | delivery: the finished file is delivered in its send format, plus the editable source kept beside it | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `loss_gap_unreadable_stated_in_delivery_note` | delivery: any loss, gap, or unreadable section is stated in the delivery note itself | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"document-operations-service"`), `atom_version` (`"0.1.0"`), and `operation` (the manifest's declared title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `documents_count` and `findings_count` (declared list lengths as integers, or null when the list is not declared); the row-name lists `documents_without_output_verification`, `findings_without_location` and `findings_not_quoted_exactly_first` (null when the underlying list is not declared); the ratios `output_verification_coverage`, `location_coverage` and `exact_quote_coverage` (strings with exactly four decimal places; null when the denominator list is absent or empty); and `computed_status` (see Verdict vocabulary). Ratios use the fixed serialization rule — round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, formatted with exactly four decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "32 pass, 0 fail, 0 missing of 32 checks across four sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared title value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `DOCUMENT_OPERATIONS_SOUND` — all 32 checks pass: the declared record is complete and consistent with the bound skill's checklist, gates and red lines.
- `DOCUMENT_OPERATIONS_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the document_operations_service scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the document_operations_service scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"documents","detail":"documents must be a list"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for document-operations-service exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Read, write, revise and convert documents, PDFs, spreadsheets and presentations — with findings tied to source locations and output verified after every change (bound from the house documents skill). You submit one declared record — the document-operations manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 4 sections (`source_and_extraction`, `editing_and_preservation`, `conversion_and_verification`, `delivery_and_hygiene`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — list presence, per-row completeness, cross-row consistency and, where the skill states them, its own arithmetic — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies; when the gate is not triggered they pass as not applicable, and their evidence text says so. Aggregation is strict: any `fail` anywhere produces `DOCUMENT_OPERATIONS_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `DOCUMENT_OPERATIONS_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: no minimum or maximum finding or document count, no coverage percentage below completeness, no numeric limit on unreadable or missing sections, no file-size or page-count limit, no naming convention for documents, findings or files, no versioning scheme for revisions, and no retention period for kept editable sources.

**What it does NOT do.** The atom audits a **declared** record: a verdict of `DOCUMENT_OPERATIONS_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares the required acts passes those checks even if the real work did none of it. It is a completeness and consistency audit, not a certification of the underlying work. Specifically: it opens no file, reads no document, extracts no figure, performs no edit or conversion, and does not verify that a declared control actually happened. It never judges whether a quoted figure is actually correct, whether a recorded location actually contains the finding, whether a conversion truly preserved meaning, or whether a summary is faithful. The actual extraction, editing and conversion craft — reading a scanned or awkward PDF, recovering its content, judging whether formatting "carries meaning", matching a presentation's claims back to its sources, summarising faithfully — is performed by the caller, never by this atom. No naming or versioning posture is checked (the skill states none), no retention duration for kept editable sources is checked (the skill states none), and no location string is checked beyond being a non-empty declared string — there is no grammar check that it is a well-formed page, cell or slide reference.

**Buyer and use context.** Teams and agents working in Writing & documents who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: client document revision work. The register's named doubt for this atom — "Commodity document handling" — is printed in SERVICE.md, never hidden. Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared document-operations record; its verdict is a workmanship-completeness judgment, not compliance or audit evidence, and general document handling is not a regulated domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `document_operations_service` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly four decimal places under the fixed rule `floor(v * 10000 + 0.5) / 10000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/document_operations_service.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_document_operations_service.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/document-operations-service` (REST) and `POST /mcp/document-operations-service` (MCP, tool `document_operations_service`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `document_operations_service`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T03:30:02.269601+00:00 against gateway v1.1.0, external verification lane, source `verification/work/document-operations-service/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "source_and_extraction",
      "check": "file_format_and_home_identified",
      "status": "pass",
      "evidence": "method: the file, its format, and its home \u2014 Vault, Drive, Docs, Notion, Box, or Dropbox \u2014 are identified"
    },
    {
      "section": "source_and_extraction",
      "check": "authoritative_copy_opened",
      "status": "pass",
      "evidence": "method: the authoritative copy is opened, not a stale download"
    },
    {
      "section": "source_and_extraction",
      "check": "read_in_source_order",
      "status": "pass",
      "evidence": "method: extraction reads in source order and keeps locations attached to everything pulled"
    },
    {
      "section": "source_and_extraction",
      "check": "documents_declared",
      "status": "pass",
      "evidence": "method: the declared operation record names its documents \u2014 the documents list is present and non-empty"
    },
    {
      "section": "source_and_extraction",
      "check": "findings_declared",
      "status": "pass",
      "evidence": "method: the declared operation record names its findings \u2014 the findings list is present and non-empty"
    },
    {
      "section": "source_and_extraction",
      "check": "every_finding_has_location_recorded",
      "status": "pass",
      "evidence": "method / quality gate: every declared finding row records its location \u2014 page for PDFs and docs, sheet and cell for spreadsheets, slide number for decks"
    },
    {
      "section": "source_and_extraction",
      "check": "every_finding_quoted_exactly_before_interpretation",
      "status": "pass",
      "evidence": "method: every declared finding row declares its numbers were quoted exactly as written first, before any interpretation"
    },
    {
      "section": "source_and_extraction",
      "check": "every_quoted_number_carries_source_location",
      "status": "pass",
      "evidence": "quality gate / red line: every quoted number carries a page, sheet/cell, or slide reference"
    },
    {
      "section": "source_and_extraction",
      "check": "numbers_quoted_exactly_then_interpreted_separately",
      "status": "pass",
      "evidence": "method: numbers are quoted exactly as written first, then interpreted separately \u2014 a figure and its reading are never merged into one line"
    },
    {
      "section": "source_and_extraction",
      "check": "no_figure_quoted_without_location",
      "status": "pass",
      "evidence": "red line: no figure is quoted from a document without its source location"
    },
    {
      "section": "source_and_extraction",
      "check": "unreadable_or_missing_sections_named",
      "status": "pass",
      "evidence": "quality gate / method: unreadable or missing sections are named, not skipped over \u2014 the report states any pages, sheets, or sections that could not be read"
    },
    {
      "section": "editing_and_preservation",
      "check": "edits_made_on_editable_source",
      "status": "pass",
      "evidence": "method: edits are worked on the editable source"
    },
    {
      "section": "editing_and_preservation",
      "check": "headings_tables_styles_preserved",
      "status": "pass",
      "evidence": "method: headings, tables, and styles are preserved in edits"
    },
    {
      "section": "editing_and_preservation",
      "check": "tracked_structure_intact_unless_rewrite_requested",
      "status": "pass",
      "evidence": "method: tracked structure is kept intact \u2014 no rewrite was requested"
    },
    {
      "section": "editing_and_preservation",
      "check": "editable_source_saved_alongside_output",
      "status": "pass",
      "evidence": "method: the revised editable source is saved alongside the output, so the next edit starts from a real source, not a flattened export"
    },
    {
      "section": "editing_and_preservation",
      "check": "editable_source_kept_when_revisable",
      "status": "pass",
      "evidence": "no revisable deliverable declared"
    },
    {
      "section": "editing_and_preservation",
      "check": "only_editable_source_not_overwritten_with_flattened_export",
      "status": "pass",
      "evidence": "red line: the only editable source is never overwritten with a flattened export"
    },
    {
      "section": "conversion_and_verification",
      "check": "every_document_output_reopened_and_checked",
      "status": "pass",
      "evidence": "quality gate: every declared document row declares its output file was re-opened and checked after editing or conversion \u2014 the finished file is verified, not the file that was intended"
    },
    {
      "section": "conversion_and_verification",
      "check": "output_reopened_and_checked_after_edit_or_conversion",
      "status": "pass",
      "evidence": "quality gate: the output file was re-opened and checked after editing or conversion"
    },
    {
      "section": "conversion_and_verification",
      "check": "headings_tables_totals_match_source_and_output",
      "status": "pass",
      "evidence": "quality gate: headings, tables, and totals match between source and output"
    },
    {
      "section": "conversion_and_verification",
      "check": "conversion_output_reopened_and_compared_when_converted",
      "status": "pass",
      "evidence": "no conversion declared performed"
    },
    {
      "section": "conversion_and_verification",
      "check": "conversion_content_survives_when_converted",
      "status": "pass",
      "evidence": "no conversion declared performed"
    },
    {
      "section": "conversion_and_verification",
      "check": "conversion_loss_fixed_or_reported_when_detected",
      "status": "pass",
      "evidence": "no conversion content loss declared detected"
    },
    {
      "section": "conversion_and_verification",
      "check": "no_conversion_with_dropped_content_shipped",
      "status": "pass",
      "evidence": "no conversion declared performed"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "send_copy_is_docx_not_markdown_when_shared",
      "status": "pass",
      "evidence": "no externally shared deliverable declared"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "no_markdown_sent_as_external_deliverable",
      "status": "pass",
      "evidence": "no externally shared deliverable declared"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "draft_banners_comments_tracked_changes_stripped",
      "status": "pass",
      "evidence": "method: draft banners, review marks, comments, and tracked changes are stripped from the send copy"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "send_copy_free_of_draft_marks",
      "status": "pass",
      "evidence": "quality gate: send copies have zero draft banners, comments, or tracked changes"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "findings_first_in_decision_order_with_locations",
      "status": "pass",
      "evidence": "delivery: findings come first, in the order the decision needs them, locations attached"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "change_list_provided_when_edits_performed",
      "status": "pass",
      "evidence": "no edits declared performed"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "finished_file_in_send_format_plus_editable_source",
      "status": "pass",
      "evidence": "delivery: the finished file is delivered in its send format, plus the editable source kept beside it"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "loss_gap_unreadable_stated_in_delivery_note",
      "status": "pass",
      "evidence": "delivery: any loss, gap, or unreadable section is stated in the delivery note itself"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "documents_count": 1,
  "documents_without_output_verification": [],
  "output_verification_coverage": "1.0000",
  "findings_count": 1,
  "findings_without_location": [],
  "location_coverage": "1.0000",
  "findings_not_quoted_exactly_first": [],
  "exact_quote_coverage": "1.0000",
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across four sections.",
  "stamp": "DOCUMENT OPERATIONS SERVICE\noperation: annual_report_audit\nVERDICT: DOCUMENT_OPERATIONS_SOUND\n  source_and_extraction                pass\n  editing_and_preservation             pass\n  conversion_and_verification          pass\n  delivery_and_hygiene                 pass\n32 pass, 0 fail, 0 missing of 32 checks across four sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "operation": "bad_audit",
  "source": {
    "file_format_and_home_identified": true,
    "authoritative_copy_opened": true,
    "read_in_source_order": true
  },
  "documents": [
    {
      "name": "bad_doc",
      "output_reopened_and_checked": false
    }
  ],
  "findings": [
    {
      "name": "bad_finding",
      "location": "",
      "quoted_exactly_before_interpretation": false
    }
  ],
  "extraction": {
    "every_number_has_source_location": true,
    "numbers_quoted_exactly_then_interpreted_separately": true,
    "figure_quoted_without_location_present": true,
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

Response (HTTP 200):

```json
{
  "service": "document-operations-service",
  "atom_version": "0.1.0",
  "operation": "bad_audit",
  "verdict": "DOCUMENT_OPERATIONS_NOT_SOUND",
  "sections": {
    "source_and_extraction": "fail",
    "editing_and_preservation": "pass",
    "conversion_and_verification": "fail",
    "delivery_and_hygiene": "pass"
  },
  "checks": [
    {
      "section": "source_and_extraction",
      "check": "file_format_and_home_identified",
      "status": "pass",
      "evidence": "method: the file, its format, and its home \u2014 Vault, Drive, Docs, Notion, Box, or Dropbox \u2014 are identified"
    },
    {
      "section": "source_and_extraction",
      "check": "authoritative_copy_opened",
      "status": "pass",
      "evidence": "method: the authoritative copy is opened, not a stale download"
    },
    {
      "section": "source_and_extraction",
      "check": "read_in_source_order",
      "status": "pass",
      "evidence": "method: extraction reads in source order and keeps locations attached to everything pulled"
    },
    {
      "section": "source_and_extraction",
      "check": "documents_declared",
      "status": "pass",
      "evidence": "method: the declared operation record names its documents \u2014 the documents list is present and non-empty"
    },
    {
      "section": "source_and_extraction",
      "check": "findings_declared",
      "status": "pass",
      "evidence": "method: the declared operation record names its findings \u2014 the findings list is present and non-empty"
    },
    {
      "section": "source_and_extraction",
      "check": "every_finding_has_location_recorded",
      "status": "fail",
      "evidence": "method / quality gate: every declared finding row records its location \u2014 page for PDFs and docs, sheet and cell for spreadsheets, slide number for decks"
    },
    {
      "section": "source_and_extraction",
      "check": "every_finding_quoted_exactly_before_interpretation",
      "status": "fail",
      "evidence": "method: every declared finding row declares its numbers were quoted exactly as written first, before any interpretation"
    },
    {
      "section": "source_and_extraction",
      "check": "every_quoted_number_carries_source_location",
      "status": "pass",
      "evidence": "quality gate / red line: every quoted number carries a page, sheet/cell, or slide reference"
    },
    {
      "section": "source_and_extraction",
      "check": "numbers_quoted_exactly_then_interpreted_separately",
      "status": "pass",
      "evidence": "method: numbers are quoted exactly as written first, then interpreted separately \u2014 a figure and its reading are never merged into one line"
    },
    {
      "section": "source_and_extraction",
      "check": "no_figure_quoted_without_location",
      "status": "fail",
      "evidence": "red line: no figure is quoted from a document without its source location"
    },
    {
      "section": "source_and_extraction",
      "check": "unreadable_or_missing_sections_named",
      "status": "pass",
      "evidence": "quality gate / method: unreadable or missing sections are named, not skipped over \u2014 the report states any pages, sheets, or sections that could not be read"
    },
    {
      "section": "editing_and_preservation",
      "check": "edits_made_on_editable_source",
      "status": "pass",
      "evidence": "method: edits are worked on the editable source"
    },
    {
      "section": "editing_and_preservation",
      "check": "headings_tables_styles_preserved",
      "status": "pass",
      "evidence": "method: headings, tables, and styles are preserved in edits"
    },
    {
      "section": "editing_and_preservation",
      "check": "tracked_structure_intact_unless_rewrite_requested",
      "status": "pass",
      "evidence": "method: tracked structure is kept intact \u2014 no rewrite was requested"
    },
    {
      "section": "editing_and_preservation",
      "check": "editable_source_saved_alongside_output",
      "status": "pass",
      "evidence": "method: the revised editable source is saved alongside the output, so the next edit starts from a real source, not a flattened export"
    },
    {
      "section": "editing_and_preservation",
      "check": "editable_source_kept_when_revisable",
      "status": "pass",
      "evidence": "no revisable deliverable declared"
    },
    {
      "section": "editing_and_preservation",
      "check": "only_editable_source_not_overwritten_with_flattened_export",
      "status": "pass",
      "evidence": "red line: the only editable source is never overwritten with a flattened export"
    },
    {
      "section": "conversion_and_verification",
      "check": "every_document_output_reopened_and_checked",
      "status": "fail",
      "evidence": "quality gate: every declared document row declares its output file was re-opened and checked after editing or conversion \u2014 the finished file is verified, not the file that was intended"
    },
    {
      "section": "conversion_and_verification",
      "check": "output_reopened_and_checked_after_edit_or_conversion",
      "status": "pass",
      "evidence": "quality gate: the output file was re-opened and checked after editing or conversion"
    },
    {
      "section": "conversion_and_verification",
      "check": "headings_tables_totals_match_source_and_output",
      "status": "pass",
      "evidence": "quality gate: headings, tables, and totals match between source and output"
    },
    {
      "section": "conversion_and_verification",
      "check": "conversion_output_reopened_and_compared_when_converted",
      "status": "pass",
      "evidence": "no conversion declared performed"
    },
    {
      "section": "conversion_and_verification",
      "check": "conversion_content_survives_when_converted",
      "status": "pass",
      "evidence": "no conversion declared performed"
    },
    {
      "section": "conversion_and_verification",
      "check": "conversion_loss_fixed_or_reported_when_detected",
      "status": "pass",
      "evidence": "no conversion content loss declared detected"
    },
    {
      "section": "conversion_and_verification",
      "check": "no_conversion_with_dropped_content_shipped",
      "status": "pass",
      "evidence": "no conversion declared performed"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "send_copy_is_docx_not_markdown_when_shared",
      "status": "pass",
      "evidence": "no externally shared deliverable declared"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "no_markdown_sent_as_external_deliverable",
      "status": "pass",
      "evidence": "no externally shared deliverable declared"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "draft_banners_comments_tracked_changes_stripped",
      "status": "pass",
      "evidence": "method: draft banners, review marks, comments, and tracked changes are stripped from the send copy"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "send_copy_free_of_draft_marks",
      "status": "pass",
      "evidence": "quality gate: send copies have zero draft banners, comments, or tracked changes"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "findings_first_in_decision_order_with_locations",
      "status": "pass",
      "evidence": "delivery: findings come first, in the order the decision needs them, locations attached"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "change_list_provided_when_edits_performed",
      "status": "pass",
      "evidence": "no edits declared performed"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "finished_file_in_send_format_plus_editable_source",
      "status": "pass",
      "evidence": "delivery: the finished file is delivered in its send format, plus the editable source kept beside it"
    },
    {
      "section": "delivery_and_hygiene",
      "check": "loss_gap_unreadable_stated_in_delivery_note",
      "status": "pass",
      "evidence": "delivery: any loss, gap, or unreadable section is stated in the delivery note itself"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "documents_count": 1,
  "documents_without_output_verification": [
    "bad_doc"
  ],
  "output_verification_coverage": "0.0000",
  "findings_count": 1,
  "findings_without_location": [
    "bad_finding"
  ],
  "location_coverage": "0.0000",
  "findings_not_quoted_exactly_first": [
    "bad_finding"
  ],
  "exact_quote_coverage": "0.0000",
  "summary": "28 pass, 4 fail, 0 missing of 32 checks across four sections.",
  "stamp": "DOCUMENT OPERATIONS SERVICE\noperation: bad_audit\nVERDICT: DOCUMENT_OPERATIONS_NOT_SOUND\n  source_and_extraction                fail\n  editing_and_preservation             pass\n  conversion_and_verification          fail\n  delivery_and_hygiene                 pass\n28 pass, 4 fail, 0 missing of 32 checks across four sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "operation": "type_error",
  "documents": "not_a_list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "documents",
  "detail": "documents must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared document-operations record; its verdict is a workmanship-completeness judgment, not compliance or audit evidence, and general document handling is not a regulated domain. |
| Checks named | 32 documented / 32 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 41 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/document-operations-service/evidence.json` |
