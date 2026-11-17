# Vendor evaluation three way match pack — documentation

**Vendor evaluation three way match pack** · slug `vendor-evaluation-three-way-match-pack` · deliverable type EVALUATION · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment ee6a845a54d94e829dd0aad9f8cd9d41; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared vendor evaluation and three-way match record for completeness and internal consistency only, and recomputes the arithmetic the record itself declares. It surfaces two faces: REST `POST /v1/vendor-evaluation-three-way-match-pack` and MCP `POST /mcp/vendor-evaluation-three-way-match-pack`. It fetches nothing, contacts no vendor, approves no payment and gives no procurement advice — a matched record is explicitly not a payment approval — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/vendor-evaluation-three-way-match-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment ee6a845a54d94e829dd0aad9f8cd9d41). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the pack "Standard Procurement Audit"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "vendor-evaluation-three-way-match-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the vendor evaluation three-way match manifest.** You declare a vendor evaluation and three-way match record for one purchase, made from the procurement record as actually kept — spec written before quotes, comparable sourcing, vendors scored against criteria set before scoring with total cost weighed, contract terms reviewed, purchase-order discipline kept, the three documents matched line by line, vendor records kept, and the red lines absent; the atom audits the declared record, it does not procure for you (see Explanation). The recorded full-pass manifest declares the pack `Standard Procurement Audit`: all four spec flags `true`; sourcing comparable same-scope declared `true` with `single_source_used` declared `false`, so the single-source justification check passes as not applicable and the manifest declares no `single_source_justification_recorded` field at all; all nine evaluation-setup flags `true` (criteria set before scoring; the total-cost evaluation documented with acquisition, operations, spares, support and switching costs included; evidence basis recorded; evaluation applied consistently across vendors); two vendors — `v1` (`Vendor A`, evidence note `Strong performance`, score 10.0 on criterion `c1`, declared weighted total 10.0) and `v2` (`Vendor B`, evidence note `Good performance`, score 8.0 on `c1`, declared weighted total 8.0); one criterion `c1` (name `Quality`, weight 1.0); all six contract flags `true`; all four purchase-order-discipline flags `true`; all four three-way-match declarations `true` with declared purchase-order total 100.0 and declared invoice total 100.0; one purchase-order line `l1` (quantity 10.0, unit price 10.0, declared line total 100.0); one receipt line `l1` (quantity 10.0); one invoice line `l1` (quantity 10.0, unit price 10.0, declared line total 100.0); all nine vendor-record flags `true`; and all four red-line flags `false` (no PO-less purchase above threshold, no payment without delivery confirmation, no payment before the three-way match, no silent bank-detail change).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/vendor-evaluation-three-way-match-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `VENDOR_EVALUATION_AND_MATCH_SOUND`: "66 pass, 0 fail, 0 missing of 66 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `vendor_evaluation_vendors_count` is 2, `vendor_evaluation_criteria_count` is 1, `purchase_order_lines_count`, `receipt_lines_count` and `invoice_lines_count` are each 1, `vendor_evaluation_criteria_weights_sum` is `"1.000000"`, `purchase_order_lines_total` and `invoice_lines_total` are each `"100.000000"`, all nineteen duplicate / row-name lists are empty (`[]`), and `vendor_score_coverage_ratio`, `vendor_weighted_total_match_ratio`, `vendor_evidence_note_ratio`, `three_way_quantity_match_ratio` and `three_way_amount_match_ratio` are each `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify; in particular it is not a payment approval). If the verdict had been `VENDOR_EVALUATION_AND_MATCH_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "vendor-evaluation-three-way-match-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/vendor-evaluation-three-way-match-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/vendor-evaluation-three-way-match-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `vendor_evaluation_three_way_match_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `VENDOR_EVALUATION_AND_MATCH_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_vendor_evaluation_vendor_scores_every_declared_criterion`, `every_vendor_evaluation_vendor_weighted_total_recomputes`, `every_vendor_evaluation_purchase_order_line_total_recomputes`, and `vendor_evaluation_purchase_order_total_recomputes_from_line_totals`, and the summary reads "62 pass, 4 fail, 0 missing of 66 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, the manifest is the full-pass manifest with two planted value mutations: vendor `v1`'s score names criterion `cX`, which is not a declared criterion, so `v1` is named in `vendor_evaluation_vendors_with_incomplete_or_extra_scores` as `["v1"]` and, because its declared weighted total no longer recomputes over a declared criterion, in `vendor_evaluation_vendors_with_weighted_total_mismatch` as `["v1"]`, dropping `vendor_score_coverage_ratio` and `vendor_weighted_total_match_ratio` to `"0.500000"` while `vendor_evidence_note_ratio` stays `"1.000000"`; and purchase-order line `l1` declares line total 999.0 against quantity 10.0 × unit price 10.0, so `l1` is named in `purchase_order_lines_with_line_total_mismatch` as `["l1"]`, `purchase_order_lines_total` becomes `"999.000000"` against `invoice_lines_total` `"100.000000"`, and `three_way_amount_match_ratio` drops to `"0.000000"` while `three_way_quantity_match_ratio` stays `"1.000000"` and `vendor_evaluation_criteria_weights_sum` stays `"1.000000"`; sections `vendor_evaluation_and_total_cost` and `three_way_match` report `fail`, the other five sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). Declare only what is true of the actual procurement record: name the criterion the vendor was actually scored on, and correct the declared line total to the record's real quantity × unit price (or correct the quantity or price, if those are what the record states). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a number where a string is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "pack_title",
  "detail": "pack_title must be a string"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/vendor-evaluation-three-way-match-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/vendor-evaluation-three-way-match-pack` — tool name `vendor_evaluation_three_way_match_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `vendor_evaluation_three_way_match_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `pack_title`, `vendors[].vendor_id`, `vendors[].scores[].criterion_id`, `criteria[].criterion_id` are noted as strings, `vendors[].vendor_name`, `vendors[].evidence_note` and `criteria[].criterion_name` as non-empty strings, `vendors[].scores[].score`, `vendors[].weighted_total_declared`, `criteria[].weight`, `three_way_match.purchase_order_total_declared`, `three_way_match.invoice_total_declared`, and the line rows' `quantity`, `unit_price` and `line_total_declared` fields as numbers, and `vendors`, `vendors[].scores`, `criteria`, `purchase_order_lines`, `receipt_lines` and `invoice_lines` as lists there. Where SERVICE.md states no type — the section container objects (`spec`, `sourcing`, `evaluation_setup`, `contract`, `po_discipline`, `three_way_match`, `vendor_records`, `red_lines`) and the row objects (`vendors[]`, `vendors[].scores[]`, `criteria[]`, `purchase_order_lines[]`, `receipt_lines[]`, `invoice_lines[]`) — the type below is grounded in the recorded evidence inputs and the recorded MCP `inputSchema` in evidence.json (which types the top-level containers `object` and the five top-level lists `array`), and is said so in the row note. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `VENDOR_EVALUATION_AND_MATCH_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, as SERVICE.md groups them; 85 typed fields in total.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `pack_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: spec_and_sourcing

| Field | Type | Notes |
|---|---|---|
| `spec` | object | The spec section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `spec.spec_written_before_quotes` | boolean | — |
| `spec.spec_includes_functional_requirements` | boolean | — |
| `spec.spec_includes_compliance_requirements` | boolean | — |
| `spec.spec_includes_interface_requirements` | boolean | — |
| `sourcing` | object | The sourcing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `sourcing.quotes_comparable_same_scope_declared` | boolean | — |
| `sourcing.single_source_used` | boolean | Gates the single-source justification check below |
| `sourcing.single_source_justification_recorded` | boolean | Required when `sourcing.single_source_used` is declared `true`; otherwise the check that reads it passes as not applicable — the recorded full-pass manifest omits this field entirely (its gate is declared `false`) and the check passes |

#### Read by: vendor_evaluation_and_total_cost

| Field | Type | Notes |
|---|---|---|
| `evaluation_setup` | object | The evaluation-setup section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `evaluation_setup.criteria_set_before_scoring` | boolean | — |
| `evaluation_setup.tco_evaluation_documented` | boolean | — |
| `evaluation_setup.tco_includes_acquisition_cost` | boolean | — |
| `evaluation_setup.tco_includes_operations_cost` | boolean | — |
| `evaluation_setup.tco_includes_spares_cost` | boolean | — |
| `evaluation_setup.tco_includes_support_cost` | boolean | — |
| `evaluation_setup.tco_includes_switching_cost` | boolean | — |
| `evaluation_setup.evidence_basis_recorded` | boolean | — |
| `evaluation_setup.evaluation_applied_consistently_across_vendors` | boolean | — |
| `vendors` | list | List of vendor-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list; the recorded MCP `inputSchema` also types it `array`) |
| `vendors[]` | object | One declared vendor row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `vendors[].vendor_id` | string | Names the row in the computed outputs; computed — must be unique per row (type stated in SERVICE.md) |
| `vendors[].vendor_name` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |
| `vendors[].evidence_note` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |
| `vendors[].scores` | list | List of score-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list) |
| `vendors[].scores[]` | object | One declared score row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `vendors[].scores[].criterion_id` | string | Computed — must name a declared criterion (type stated in SERVICE.md) |
| `vendors[].scores[].score` | number | The caller-declared score for that criterion; no scale is imposed (type stated in SERVICE.md) |
| `vendors[].weighted_total_declared` | number | Computed — must recompute from the declared weights and scores, see below (type stated in SERVICE.md) |
| `criteria` | list | List of criterion-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list; the recorded MCP `inputSchema` also types it `array`) |
| `criteria[]` | object | One declared criterion row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `criteria[].criterion_id` | string | Names the row in the computed outputs; computed — must be unique per row (type stated in SERVICE.md) |
| `criteria[].criterion_name` | string | Computed — must be non-empty on every row (type stated in SERVICE.md as a non-empty string) |
| `criteria[].weight` | number | Computed — must be non-negative, and the weights must sum positive (type stated in SERVICE.md) |

#### Read by: contract_and_terms

| Field | Type | Notes |
|---|---|---|
| `contract` | object | The contract section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `contract.exclusions_reviewed` | boolean | — |
| `contract.payment_terms_reviewed` | boolean | — |
| `contract.penalties_reviewed` | boolean | — |
| `contract.warranty_reviewed` | boolean | — |
| `contract.price_escalation_clauses_reviewed` | boolean | — |
| `contract.binding_terms_reviewed` | boolean | — |

#### Read by: purchase_order_discipline

| Field | Type | Notes |
|---|---|---|
| `po_discipline` | object | The purchase-order-discipline section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `po_discipline.po_issued_before_delivery` | boolean | — |
| `po_discipline.changes_via_change_order_declared` | boolean | — |
| `po_discipline.verbal_commitments_papered_same_day_declared` | boolean | — |
| `po_discipline.po_references_spec_declared` | boolean | — |

#### Read by: three_way_match

| Field | Type | Notes |
|---|---|---|
| `three_way_match` | object | The three-way-match section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `three_way_match.match_performed_before_payment_declared` | boolean | — |
| `three_way_match.discrepancies_resolved_before_payment_declared` | boolean | — |
| `three_way_match.inspection_against_spec_on_arrival_declared` | boolean | — |
| `three_way_match.receipt_verification_before_payment_declared` | boolean | — |
| `three_way_match.purchase_order_total_declared` | number | Computed — must recompute from the declared purchase-order line totals and agree with the declared invoice total, see below (type stated in SERVICE.md) |
| `three_way_match.invoice_total_declared` | number | Computed — must recompute from the declared invoice line totals, see below (type stated in SERVICE.md) |
| `purchase_order_lines` | list | List of purchase-order line-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list; the recorded MCP `inputSchema` also types it `array`) |
| `purchase_order_lines[]` | object | One declared purchase-order line row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `purchase_order_lines[].line_id` | string | Names the row in the computed outputs; computed — must be unique per row within the set (type stated in SERVICE.md) |
| `purchase_order_lines[].quantity` | number | Computed: must agree across purchase order, receipt and invoice for the same line (type stated in SERVICE.md) |
| `purchase_order_lines[].unit_price` | number | Computed: the invoice unit price for the same line must agree with it (type stated in SERVICE.md) |
| `purchase_order_lines[].line_total_declared` | number | Computed — must recompute as declared quantity × declared unit price, see below (type stated in SERVICE.md) |
| `receipt_lines` | list | List of goods-receipt line-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list; the recorded MCP `inputSchema` also types it `array`) |
| `receipt_lines[]` | object | One declared goods-receipt line row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `receipt_lines[].line_id` | string | Names the row in the computed outputs; computed — must be unique per row within the set (type stated in SERVICE.md) |
| `receipt_lines[].quantity` | number | Computed: must agree across purchase order, receipt and invoice for the same line (type stated in SERVICE.md) |
| `invoice_lines` | list | List of invoice line-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md as a list; the recorded MCP `inputSchema` also types it `array`) |
| `invoice_lines[]` | object | One declared invoice line row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `invoice_lines[].line_id` | string | Names the row in the computed outputs; computed — must be unique per row within the set (type stated in SERVICE.md) |
| `invoice_lines[].quantity` | number | Computed: must agree across purchase order, receipt and invoice for the same line (type stated in SERVICE.md) |
| `invoice_lines[].unit_price` | number | Computed: must agree with the purchase-order unit price for the same line (type stated in SERVICE.md) |
| `invoice_lines[].line_total_declared` | number | Computed — must recompute as declared quantity × declared unit price, see below (type stated in SERVICE.md) |

#### Read by: vendor_records_and_performance

| Field | Type | Notes |
|---|---|---|
| `vendor_records` | object | The vendor-records section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `vendor_records.vendor_terms_recorded` | boolean | — |
| `vendor_records.vendor_contacts_recorded` | boolean | — |
| `vendor_records.performance_log_maintained` | boolean | — |
| `vendor_records.performance_log_covers_on_time_quality_responsiveness` | boolean | — |
| `vendor_records.annual_review_cadence_set` | boolean | — |
| `vendor_records.two_viable_sources_for_critical_items_declared` | boolean | — |
| `vendor_records.banking_detail_changes_verified_via_known_contacts` | boolean | — |
| `vendor_records.segregation_of_duties_declared` | boolean | — |
| `vendor_records.gifts_conflict_policy_respected_declared` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.po_less_purchase_above_threshold_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.payment_without_delivery_confirmation_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.payment_before_three_way_match_present` | boolean | must be `false` to pass — skill quality gate |
| `red_lines.silent_bank_detail_change_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 66 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Note on the gated check: the one gated check (`vendor_evaluation_single_source_justification_recorded_where_single_source_used`) carries the same recorded evidence text, "no single-source purchase declared used", in both its full-pass `pass` state and its sparse-run `missing` state — see Discrepancies.

#### Section: spec_and_sourcing

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `vendor_evaluation_spec_written_before_quotes` | spec: a written specification existed before quotes were sought — buy to spec, not to brochure | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_spec_includes_functional_requirements` | spec: the specification includes the functional requirements | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_spec_includes_compliance_requirements` | spec: the specification includes the compliance requirements | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_spec_includes_interface_requirements` | spec: the specification includes the interface requirements | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_quotes_comparable_same_scope_declared` | sourcing: the quotes obtained are declared comparable — same scope, quantities, delivery, terms and warranty | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_single_source_justification_recorded_where_single_source_used` | no single-source purchase declared used | Gated over the declared record. Pass: `sourcing.single_source_used` is declared `false` (the check passes as not applicable — the recorded full-pass manifest omits `sourcing.single_source_justification_recorded` entirely and still passes), or the gate is declared `true` and `sourcing.single_source_justification_recorded` is declared `true`. Fail: the gate is declared `true` and the field is declared `false`. Missing: the gate field is absent, or the gate is declared `true` and the field is absent. |

#### Section: vendor_evaluation_and_total_cost

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `vendor_evaluation_criteria_set_before_scoring` | evaluation: the weighted criteria were set BEFORE scoring | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_tco_evaluation_documented` | total cost: the total-cost-of-ownership evaluation is documented — total cost, not price | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_tco_includes_acquisition_cost` | total cost: acquisition cost is included in the total-cost evaluation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_tco_includes_operations_cost` | total cost: operations cost is included in the total-cost evaluation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_tco_includes_spares_cost` | total cost: spares cost is included in the total-cost evaluation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_tco_includes_support_cost` | total cost: support cost is included in the total-cost evaluation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_tco_includes_switching_cost` | total cost: switching cost is included in the total-cost evaluation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_evidence_basis_recorded` | evaluation: the evidence basis for the vendor evaluation is recorded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_applied_consistently_across_vendors` | evaluation: the same criteria and evidence basis were applied consistently across all vendors | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_vendors_list_declared` | vendors: the declared record names its evaluated vendors — the list is present and names at least two vendors; an absent list is missing evidence and a list of fewer than two declares no comparison at all | Computed over the declared record. Pass: the `vendors` list is present and names at least two vendors. Fail: the list is present with fewer than two vendors. Missing: the list is absent. |
| `every_vendor_evaluation_vendor_id_unique` | vendors: no declared vendor_id is owned by more than one row | Computed over the declared record. Pass: no declared `vendor_id` appears on more than one row. Fail: a `vendor_id` is declared on more than one row (duplicates are named in `duplicate_vendor_evaluation_vendor_ids`). Missing: the list is absent, or a row has `vendor_id` absent. |
| `every_vendor_evaluation_vendor_name_declared` | vendors: every declared vendor declares a non-empty vendor name | Computed over the declared record. Pass: every declared vendor row declares a non-empty `vendor_name`. Fail: a row declares an empty name (offending rows are named in `vendor_evaluation_vendors_without_name`). Missing: the list is absent, or a row has `vendor_name` absent. |
| `every_vendor_evaluation_vendor_evidence_note_declared` | vendors: every declared vendor declares a non-empty evidence note | Computed over the declared record. Pass: every declared vendor row declares a non-empty `evidence_note`. Fail: a row declares an empty note (offending rows are named in `vendor_evaluation_vendors_without_evidence_note`). Missing: the list is absent, or a row has `evidence_note` absent. |
| `vendor_evaluation_criteria_list_declared` | criteria: the declared record names its evaluation criteria — the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no evaluation at all | Computed over the declared record. Pass: the `criteria` list is present and names at least one criterion. Fail: the list is present but empty. Missing: the list is absent. |
| `every_vendor_evaluation_criterion_id_unique` | criteria: no declared criterion_id is owned by more than one row | Computed over the declared record. Pass: no declared `criterion_id` appears on more than one row. Fail: a `criterion_id` is declared on more than one row (duplicates are named in `duplicate_vendor_evaluation_criterion_ids`). Missing: the list is absent, or a row has `criterion_id` absent. |
| `every_vendor_evaluation_criterion_name_declared` | criteria: every declared criterion declares a non-empty criterion name | Computed over the declared record. Pass: every declared criterion row declares a non-empty `criterion_name`. Fail: a row declares an empty name (offending rows are named in `vendor_evaluation_criteria_without_name`). Missing: the list is absent, or a row has `criterion_name` absent. |
| `every_vendor_evaluation_criterion_weight_non_negative` | criteria: every declared criterion declares a non-negative weight | Computed over the declared record. Pass: every declared criterion row declares a non-negative `weight`. Fail: a row declares a negative weight (offending rows are named in `vendor_evaluation_criteria_with_invalid_weight`). Missing: the list is absent, or a row has `weight` absent. |
| `vendor_evaluation_criteria_weights_sum_positive` | criteria: the declared criterion weights sum to a positive total — an evaluation whose weights sum to zero scores nothing | Computed over the declared record. Pass: the declared criterion weights sum to a positive total (reported as `vendor_evaluation_criteria_weights_sum`). Fail: the weights sum to zero. Missing: the list is absent, or a row has `weight` absent. |
| `every_vendor_evaluation_vendor_scores_every_declared_criterion` | scores: every declared vendor scores every declared criterion and no other criterion, exactly once | Computed over the declared record. Pass: every declared vendor's `scores` list names every declared criterion and no other criterion, exactly once. Fail: a vendor scores incompletely, extra, or twice (offending vendors are named in `vendor_evaluation_vendors_with_incomplete_or_extra_scores`). Missing: a vendor's `scores` is absent, or a criterion row has no `criterion_id`. |
| `every_vendor_evaluation_vendor_weighted_total_recomputes` | scores: every declared vendor's declared weighted total recomputes exactly as the sum of declared weight times declared score over its declared scores | Computed over the declared record. Pass: every declared vendor's `weighted_total_declared` recomputes as sum(declared weight × declared score) over its declared scores, compared on the fixed 6dp serialization. Fail: a vendor's declared total differs (offending vendors are named in `vendor_evaluation_vendors_with_weighted_total_mismatch`). Missing: a vendor's total or its scores are absent. |

#### Section: contract_and_terms

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `vendor_evaluation_contract_exclusions_reviewed` | contract care: the quote and contract exclusions were read and reviewed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_contract_payment_terms_reviewed` | contract care: the payment terms were read and reviewed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_contract_penalties_reviewed` | contract care: the penalties were read and reviewed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_contract_warranty_reviewed` | contract care: the warranty was read and reviewed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_contract_price_escalation_clauses_reviewed` | contract care: the price-escalation clauses were read and reviewed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_contract_binding_terms_reviewed` | contract care: the binding terms were reviewed — binding terms get review | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: purchase_order_discipline

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `vendor_evaluation_po_issued_before_delivery` | PO discipline: the purchase order was issued before delivery | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_po_changes_via_change_order_declared` | PO discipline: changes to the purchase order were made via change order | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_verbal_commitments_papered_same_day_declared` | PO discipline: no verbal commitments stand unpapered — any verbal commitment was papered the same day | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_po_references_spec_declared` | PO discipline: the purchase order references the written specification it buys to | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: three_way_match

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `vendor_evaluation_three_way_match_performed_before_payment_declared` | 3-way match: the three-way match (PO ↔ receipt/inspection ↔ invoice) was performed before payment | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_three_way_discrepancies_resolved_before_payment_declared` | 3-way match: discrepancies were resolved first, before payment | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_inspection_against_spec_on_arrival_declared` | receipt: the delivery was inspected against spec on arrival, not after install | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_receipt_verification_before_payment_declared` | receipt: receipt verification stands before payment — nothing is paid without receipt verification | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_purchase_order_lines_declared` | purchase order lines: the declared record names its purchase-order lines — the list is present and names at least one line; an absent list is missing evidence and an empty list declares no purchase at all | Computed over the declared record. Pass: the `purchase_order_lines` list is present and names at least one line. Fail: the list is present but empty. Missing: the list is absent. |
| `every_vendor_evaluation_purchase_order_line_id_unique` | purchase order lines: no declared line_id is owned by more than one purchase-order row | Computed over the declared record. Pass: no declared `line_id` appears on more than one purchase-order row. Fail: a `line_id` is declared on more than one row in the set (duplicates are named in `duplicate_purchase_order_line_ids`). Missing: the list is absent, or a row has `line_id` absent. |
| `every_vendor_evaluation_receipt_line_id_unique` | receipt lines: no declared line_id is owned by more than one receipt row | Computed over the declared record. Pass: no declared `line_id` appears on more than one receipt row. Fail: a `line_id` is declared on more than one row in the set (duplicates are named in `duplicate_receipt_line_ids`). Missing: the list is absent, or a row has `line_id` absent. |
| `every_vendor_evaluation_invoice_line_id_unique` | invoice lines: no declared line_id is owned by more than one invoice row | Computed over the declared record. Pass: no declared `line_id` appears on more than one invoice row. Fail: a `line_id` is declared on more than one row in the set (duplicates are named in `duplicate_invoice_line_ids`). Missing: the list is absent, or a row has `line_id` absent. |
| `every_vendor_evaluation_purchase_order_line_total_recomputes` | purchase order lines: every declared purchase-order line total recomputes exactly as declared quantity times declared unit price | Computed over the declared record. Pass: every declared purchase-order line's `line_total_declared` recomputes as declared quantity × declared unit price, compared on the fixed 6dp serialization. Fail: a line's declared total differs (offending lines are named in `purchase_order_lines_with_line_total_mismatch`). Missing: a line has any of the three fields absent. |
| `every_vendor_evaluation_invoice_line_total_recomputes` | invoice lines: every declared invoice line total recomputes exactly as declared quantity times declared unit price | Computed over the declared record. Pass: every declared invoice line's `line_total_declared` recomputes as declared quantity × declared unit price, compared on the fixed 6dp serialization. Fail: a line's declared total differs (offending lines are named in `invoice_lines_with_line_total_mismatch`). Missing: a line has any of the three fields absent. |
| `vendor_evaluation_receipt_lines_cover_purchase_order_lines_exactly` | 3-way match: the declared receipt line ids are exactly the declared purchase-order line ids — none missing, none extra, none duplicated | Computed over the declared record. Pass: the declared receipt line ids are exactly the declared purchase-order line ids — none missing, none extra, none duplicated. Fail: a purchase-order line is missing from the receipt (named in `purchase_order_line_ids_missing_from_receipt`), a receipt line is not on the purchase order (named in `receipt_line_ids_not_on_purchase_order`), or a receipt line id is duplicated (named in `duplicate_receipt_line_ids`). Missing: either list is absent, or a row has no `line_id`. |
| `vendor_evaluation_invoice_lines_cover_purchase_order_lines_exactly` | 3-way match: the declared invoice line ids are exactly the declared purchase-order line ids — none missing, none extra, none duplicated | Computed over the declared record. Pass: the declared invoice line ids are exactly the declared purchase-order line ids — none missing, none extra, none duplicated. Fail: a purchase-order line is missing from the invoice (named in `purchase_order_line_ids_missing_from_invoice`), an invoice line is not on the purchase order (named in `invoice_line_ids_not_on_purchase_order`), or an invoice line id is duplicated (named in `duplicate_invoice_line_ids`). Missing: either list is absent, or a row has no `line_id`. |
| `every_vendor_evaluation_three_way_line_quantity_matches_across_documents` | 3-way match: for every declared line, the declared quantity agrees across purchase order, receipt and invoice | Computed over the declared record. Pass: for every declared line, the declared quantity agrees across the purchase order, the receipt and the invoice. Fail: a line named on both sides declares differing quantities (named in `three_way_lines_with_quantity_mismatch`); coverage failures (a line missing from a document) fail this check through the coverage lists above. Missing: any of the three document lists is absent, or a row has `quantity` absent. |
| `every_vendor_evaluation_three_way_line_unit_price_matches_po_to_invoice` | 3-way match: for every declared line, the declared unit price on the invoice agrees with the declared unit price on the purchase order | Computed over the declared record. Pass: for every declared line, the declared invoice unit price agrees with the declared purchase-order unit price. Fail: a line's prices differ (named in `three_way_lines_with_unit_price_mismatch`). Missing: a list is absent, or a row has `unit_price` absent. |
| `vendor_evaluation_purchase_order_total_recomputes_from_line_totals` | purchase order total: the declared purchase-order grand total recomputes exactly as the sum of the declared purchase-order line totals | Computed over the declared record. Pass: `three_way_match.purchase_order_total_declared` recomputes as the sum of the declared purchase-order line totals, compared on the fixed 6dp serialization. Fail: the declared grand total differs from that sum. Missing: the grand total or the line list is absent. |
| `vendor_evaluation_invoice_total_recomputes_from_line_totals` | invoice total: the declared invoice grand total recomputes exactly as the sum of the declared invoice line totals | Computed over the declared record. Pass: `three_way_match.invoice_total_declared` recomputes as the sum of the declared invoice line totals, compared on the fixed 6dp serialization. Fail: the declared grand total differs from that sum. Missing: the grand total or the line list is absent. |
| `vendor_evaluation_three_way_grand_totals_match` | 3-way match: the declared purchase-order grand total and the declared invoice grand total agree — the atom checks only that the declared totals agree; it approves no payment | Computed over the declared record. Pass: the declared purchase-order grand total and the declared invoice grand total agree with each other, compared on the fixed 6dp serialization — only that the totals agree is checked; no payment is approved. Fail: the two declared totals differ. Missing: either declared total is absent. |

#### Section: vendor_records_and_performance

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `vendor_evaluation_vendor_terms_recorded` | vendor records: the vendor's terms are kept on record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_vendor_contacts_recorded` | vendor records: the vendor's contacts are kept on record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_performance_log_maintained` | vendor records: a vendor performance log is maintained | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_performance_log_covers_on_time_quality_responsiveness` | vendor records: the performance log covers on-time delivery, quality and responsiveness | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_annual_review_cadence_set` | vendor records: an annual vendor review cadence is set | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_two_viable_sources_for_critical_items_declared` | vendor records: two viable sources are kept for critical items where feasible, as declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_banking_detail_changes_verified_via_known_contacts` | fraud hygiene: banking-detail changes are verified via known contacts — never through email links | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_segregation_of_duties_declared` | fraud hygiene: segregation of duties is in place where possible, as declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vendor_evaluation_gifts_conflict_policy_respected_declared` | fraud hygiene: the gifts and conflict-of-interest policy is respected, as declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `vendor_evaluation_free_of_po_less_purchase_above_threshold` | red line: no PO-less purchase above threshold is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `vendor_evaluation_free_of_payment_without_delivery_confirmation` | red line: no payment without delivery confirmation is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `vendor_evaluation_free_of_payment_before_three_way_match` | red line: no payment made before the three-way match is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `vendor_evaluation_free_of_silent_bank_detail_change` | red line: no silent bank-detail change is present in the record — bank-detail changes are verified through known channels always | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object, with these top-level fields in the recorded order:

- `service` (`"vendor-evaluation-three-way-match-pack"`), `atom_version` (`"0.1.0"`), and `pack_title` (the manifest's declared pack title, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `vendor_evaluation_vendors_count`, `vendor_evaluation_criteria_count`, `purchase_order_lines_count`, `receipt_lines_count` and `invoice_lines_count` (the declared list lengths as integers, exactly, or null when the list is not declared); `duplicate_vendor_evaluation_vendor_ids`, `duplicate_vendor_evaluation_criterion_ids`, `duplicate_purchase_order_line_ids`, `duplicate_receipt_line_ids` and `duplicate_invoice_line_ids` (ids carried by more than one row; each null when its underlying list is not declared, as recorded in the sparse case); `vendor_evaluation_vendors_without_name`, `vendor_evaluation_vendors_without_evidence_note`, `vendor_evaluation_criteria_without_name`, `vendor_evaluation_criteria_with_invalid_weight`, `vendor_evaluation_vendors_with_incomplete_or_extra_scores`, `vendor_evaluation_vendors_with_weighted_total_mismatch`, `purchase_order_lines_with_line_total_mismatch`, `invoice_lines_with_line_total_mismatch`, `purchase_order_line_ids_missing_from_receipt`, `receipt_line_ids_not_on_purchase_order`, `purchase_order_line_ids_missing_from_invoice`, `invoice_line_ids_not_on_purchase_order`, `three_way_lines_with_quantity_mismatch` and `three_way_lines_with_unit_price_mismatch` (the offending rows for each computed rule; each null when its underlying list is not declared, as recorded in the sparse case); `vendor_evaluation_criteria_weights_sum` (the sum of the declared criterion weights), `purchase_order_lines_total` and `invoice_lines_total` (the sums of each set's declared line totals) — strings with exactly six decimal places; each null when its underlying list is not declared, as recorded in the sparse case; and the ratios `vendor_score_coverage_ratio` (vendors scoring every declared criterion exactly ÷ declared vendors), `vendor_weighted_total_match_ratio` (vendors whose declared weighted total recomputes ÷ declared vendors), `vendor_evidence_note_ratio` (vendors with a recorded evidence note ÷ declared vendors), `three_way_quantity_match_ratio` (purchase-order lines whose declared quantity agrees across all three documents ÷ declared purchase-order lines) and `three_way_amount_match_ratio` (purchase-order lines whose declared invoice line total agrees with the declared purchase-order line total ÷ declared purchase-order lines) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty, the score-coverage and weighted-total ratios are also null when the criteria list is not declared, and the quantity-match ratio is also null when any of the three document lists is not declared. Computed quantities use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; declared amounts and totals are compared only through that fixed serialization, so money arithmetic is exact at the declared precision — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "66 pass, 0 fail, 0 missing of 66 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared pack title, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `VENDOR_EVALUATION_AND_MATCH_SOUND` — all 66 checks pass: the declared vendor evaluation and three-way match record is complete and internally consistent with the skill's method, quality gates and red lines.
- `VENDOR_EVALUATION_AND_MATCH_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only — the twenty-four computed checks named in SERVICE.md): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the twenty-four computed checks cannot be completed because the rows or fields it reads are absent (as recorded in the sparse case).

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for the gated check, including passes as not applicable when its gate is off); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `computed_status`, the five declared-list counts, the five duplicate-id lists, the fourteen row-name / mismatch / coverage lists, `vendor_evaluation_criteria_weights_sum`, `purchase_order_lines_total`, `invoice_lines_total`, and the five ratios `vendor_score_coverage_ratio`, `vendor_weighted_total_match_ratio`, `vendor_evidence_note_ratio`, `three_way_quantity_match_ratio` and `three_way_amount_match_ratio` — each defined in Output format above, with the values and null rules recorded there (33 computed fields in total, including `computed_status`).

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"pack_title","detail":"pack_title must be a string"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type EVALUATION — this atom sells the evaluation it produces, a bounded judgment artifact, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Procure well — specs, sourcing, vendor evaluation, PO discipline, 3-way match, performance reviews (the bound capability, from the skill `procurement-vendor-management`). You submit one declared record — the vendor evaluation three-way match manifest, made from the procurement record as actually kept — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, and recomputes the arithmetic the record itself declares, returning one deterministic verdict across 7 sections (`spec_and_sourcing`, `vendor_evaluation_and_total_cost`, `contract_and_terms`, `purchase_order_discipline`, `three_way_match`, `vendor_records_and_performance`, `red_lines`). The atom sells that evaluation — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest siblings `structured-decision-making` (a general decision process), `cost-estimate-preparation` (estimating a cost honestly), `budget-design-review` (running budgets that hold) and `append-only-ledger-design-audit` (designing append-only ledgers and audit trails) (SERVICE.md, Distinct ground): every check here is a procurement-record question — spec written before quotes with functional / compliance / interface requirements, comparable same-scope sourcing with a single-source justification gate, vendor rows scored against procurement criteria set before scoring with acquisition / operations / spares / support / switching total-cost components weighed and declared weighted totals recomputed, contract care for a vendor agreement (exclusions, payment terms, penalties, warranty, escalation, binding terms), PO-before-delivery discipline with change orders and same-day papering of verbal commitments, the three-way match recomputed line by line across the declared purchase-order, goods-receipt and invoice rows (coverage, quantities, unit prices, line totals and grand totals), vendor performance records with fraud hygiene, and the procurement red lines refused.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* (twenty-four, per SERVICE.md) are calculated from the declared rows and values themselves — the vendors list must name at least two rows with unique ids and non-empty names and evidence notes; the criteria list must be declared with unique ids, non-empty names and non-negative weights summing positive; every vendor must score every declared criterion and no other, exactly once, and every declared weighted total must recompute exactly from declared scores × declared weights; the purchase-order lines list must name at least one line, with line ids unique per document set; every purchase-order and invoice line total must recompute as quantity × unit price; the receipt and invoice line ids must each cover the purchase-order line ids exactly; quantities must agree across the three documents and invoice unit prices with purchase-order unit prices; and both grand totals must recompute from their line totals and agree with each other — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *The gated check* follows the skill's own conditional scope: single-source justification is required only where `sourcing.single_source_used` is declared `true`; with the gate declared `false` the check passes as not applicable, and with the gate absent the check is missing evidence. Aggregation is strict: any `fail` anywhere produces `VENDOR_EVALUATION_AND_MATCH_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `VENDOR_EVALUATION_AND_MATCH_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric procurement threshold the atom may set — its demands are spec, comparability, total-cost weighing, PO discipline and matched payment, not bars the atom can set. Declined, named, exactly as SERVICE.md names them: a spend threshold amount for the PO-less red line or for material spend (the record declares whether the red line is present; the atom sets no currency amount); a minimum quote count as a counted bar, including importing the skill's three-quote discipline as a number the atom counts to (comparability and single-source justification are checked as declarations, not as a counted quote bar); a price ceiling, a total-cost ceiling, or any judgment that a declared price is too high; a score scale of the atom's own (scores are caller-declared numbers, checked only for coverage and arithmetic — no scale is imposed and no score is judged good or bad); a minimum winning margin between vendors, or any check that the winning vendor scored highest (the record declares no winner to this atom at all — checking one would be the atom choosing, and it is declined by name); a tolerance band on the three-way match (quantities, prices and totals must agree exactly at the declared 6dp precision — a tolerance would be the atom deciding which discrepancies may be paid, which is payment judgment, not audit); a vendor-count maximum, or a criterion-count bar beyond at least one criterion and at least two vendors; and any judgment that the chosen vendor is right, good or advisable (only that its declared evaluation record contains what the skill requires). Quantities are computed and reported; the only bars on the computed rows are exact recomputation and completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** vendor evaluation and three-way match record: a verdict of `VENDOR_EVALUATION_AND_MATCH_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its spec written, its vendors scored and its three documents matched passes those checks even if the real purchase did none of it. It is a completeness and consistency audit of the procurement record the skill requires, **not a vendor recommendation, a payment approval, or a guarantee that the purchase was sound**: it never judges whether a declared score is fair, whether the evidence note actually supports the vendor, whether the goods were really received, or whether the invoice should be paid — only that the record contains what the skill's method and red lines demand, and that its declared rows are internally consistent. Named exclusions: sourcing or finding vendors; selecting, recommending or ranking a vendor for the caller; negotiating terms with a vendor; contacting a vendor in any way; placing or issuing a purchase order; receiving or inspecting goods; paying an invoice; approving a payment — a matched record is an audit verdict on declared rows, never a pay / do-not-pay instruction; verifying banking details or any vendor fact against the world; and giving procurement, purchasing or spending advice of any kind — each is EXCLUDED by name from this atom, which audits only the declared record. Boundary case, named in SERVICE.md: a purchase with genuinely only one vendor ever considered cannot pass this record format's vendors-declared check (the format requires at least two compared vendors — such a purchase is outside this atom's computed reach, not failed on its merits; its single-source justification is still checked as a declaration when declared).

**Buyer and use context.** Teams and agents working in Money & markets who need this evaluation on demand and would rather buy it per use than build or staff the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: EE and software vendor purchases (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was deployed census-style under a U-13 regulatory screen classified **(b) — screen-NO, flag-with-controls (census class)**, exactly as SERVICE.md's U-13 section records it. SERVICE.md records the basis: the keyword screen names invoices, payments, purchase orders and banking details — finance-adjacent subjects — so the screen was applied strictly; the substance screen finds that this atom's output could not itself read as regulated professional advice **while the controls below hold** — it audits a caller-**declared** business procurement record for completeness and internal consistency only (spec / sourcing / contract / PO-discipline declarations, vendor and criteria rows with declared weighted totals recomputed over the declared rows, the three-way match recomputed line by line over the declared purchase-order, receipt and invoice rows, vendor-record and fraud-hygiene declarations, and the procurement red lines refused); every output is a pass / fail / missing verdict on the record or a quantity recomputed from the caller's own declared rows. Named controls, exactly as SERVICE.md records them: (1) it produces **no recommendation and no payment decision** — the skill's sourcing, selecting, negotiating, contacting, ordering, receiving and paying steps are excluded by name in SERVICE.md's Honest scoping; the atom never names a vendor the caller should use and never states that an invoice should or should not be paid; a matched record is not a payment approval and the grand-totals check states that boundary in its own evidence text; (2) it sets **no threshold** on any amount (see the declined list in Explanation) — no spend bar, no price ceiling, no match tolerance — so no output grades a purchase as financially good or bad; (3) it handles **no personal financial position of any kind** — no person's net worth, income, cash flow, holdings or personal accounts appear in this record; the amounts are a business's declared purchase-order and invoice rows for a procurement audit. SERVICE.md records why this is the census flag-with-controls class and not class (a): the adjacency is real (invoice amounts and banking-detail hygiene are finance-adjacent, and a naive version of this atom that approved payments could read as a financial control decision); and it is not the genuinely-open personal-financial-snapshot class, because that atom's shape is a snapshot of a *person's* finances, whose verdict could read as personal financial advice about that person's position, while this atom's shape is a *business's* procurement record, whose verdict reads only as an audit of whether that record is complete and arithmetically consistent. The flag stays open for the Director's review: the screen-NO classification and its controls stand as recorded, and the census flag is not closed by this document. SERVICE.md also records that no deploy happens on this atom without the owner's explicit per-unit ruling in any case.

### For integrators (Users)

You need: a gateway key with the `vendor_evaluation_three_way_match_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed quantities are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, and declared amounts are compared only through that fixed serialization, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/vendor_evaluation_three_way_match_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_vendor_evaluation_three_way_match_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/vendor-evaluation-three-way-match-pack` (REST) and `POST /mcp/vendor-evaluation-three-way-match-pack` (MCP, tool `vendor_evaluation_three_way_match_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment ee6a845a54d94e829dd0aad9f8cd9d41; RC soak to 2026-11-22). Key scope: `vendor_evaluation_three_way_match_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment ee6a845a54d94e829dd0aad9f8cd9d41) shows the atom live. This document follows the evidenced live state: live. The same staleness touches SERVICE.md's U-13 section, which records that "no deploy happens on this atom without the owner's explicit per-unit ruling in any case" — the recorded deployment exists; the U-13 flag itself stays open for the Director's review (see Role views, For regulators) and is not closed by this document.
2. **Check names differ from input field names:** the recorded check names differ from the leaf name of the input field they read — the attestation names carry the `vendor_evaluation_` prefix (for example `vendor_evaluation_spec_written_before_quotes` reads `spec.spec_written_before_quotes`; `vendor_evaluation_contract_exclusions_reviewed` reads `contract.exclusions_reviewed`), the row-computed names carry an `every_vendor_evaluation_` form (for example `every_vendor_evaluation_vendor_id_unique` reads the vendor rows' `vendor_id` values; `every_vendor_evaluation_purchase_order_line_total_recomputes` reads the purchase-order lines' `quantity`, `unit_price` and `line_total_declared` values against recomputation), and the four red-line checks are phrased as freedoms (for example `vendor_evaluation_free_of_silent_bank_detail_change` reads `red_lines.silent_bank_detail_change_present`). The twenty-four computed checks and the gated check have no single same-named field at all. Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md; the recorded MCP `inputSchema` covers only the top level:** SERVICE.md states no type for the section container objects (`spec`, `sourcing`, `evaluation_setup`, `contract`, `po_discipline`, `three_way_match`, `vendor_records`, `red_lines`) or for a row object (`vendors[]`, `vendors[].scores[]`, `criteria[]`, `purchase_order_lines[]`, `receipt_lines[]`, `invoice_lines[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers, in the recorded MCP `inputSchema`, and are said so there. The recorded MCP `inputSchema` itself lists only the fourteen top-level properties (`pack_title`, `spec`, `sourcing`, `evaluation_setup`, `vendors`, `criteria`, `contract`, `po_discipline`, `three_way_match`, `purchase_order_lines`, `receipt_lines`, `invoice_lines`, `vendor_records`, `red_lines`) and gives no nested row or leaf types — the nested types rest on the recorded evidence inputs and SERVICE.md's table, not on the schema. For the record: the schema types the five top-level lists (`vendors`, `criteria`, `purchase_order_lines`, `receipt_lines`, `invoice_lines`) correctly as `array` — no list-as-`object` mis-typing occurs in this atom's recorded schema.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 66 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md for the list, sum and total outputs:** SERVICE.md's output paragraph states the null rules for `computed_status`, the five declared-list counts and the five ratios, but it does not state a null rule for the five duplicate-id lists, the fourteen row-name / mismatch / coverage lists, `vendor_evaluation_criteria_weights_sum`, `purchase_order_lines_total` or `invoice_lines_total`. The recorded sparse response returns all of those as `null` when the underlying lists are not declared (as the Output format section records); this document follows the recording.
6. **Section groupings merging input objects:** the recorded sections do not map one-to-one onto input objects. Three recorded sections each merge several top-level input objects: `spec_and_sourcing` reads the `spec` and `sourcing` objects; `vendor_evaluation_and_total_cost` reads the `evaluation_setup` object together with the top-level `vendors` and `criteria` lists (whose rows sit outside any section object); and `three_way_match` reads the `three_way_match` object together with the three top-level line lists (`purchase_order_lines`, `receipt_lines`, `invoice_lines`) — including the receipt- and invoice-line id-uniqueness checks, which sit in `three_way_match` although their lists are separate top-level objects. This document groups the Input reference and the Checks by the recorded section names, with those mergings named in place.
7. **The gated check's evidence text does not vary with its state:** the evidence text quoted in the Checks section is the full-pass run's text. For the one gated check, `vendor_evaluation_single_source_justification_recorded_where_single_source_used`, the recorded sparse run carries the identical evidence string — "no single-source purchase declared used" — with status `missing` (its gate field is absent) as the full-pass run carries with status `pass` (its gate is declared `false` and the target field is absent from the manifest entirely). No distinct required-form evidence string for this check exists in the recordings; the Checks section says so at its head.
8. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (5 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named computed row-name lists (`purchase_order_lines_with_line_total_mismatch`, `vendor_evaluation_vendors_with_incomplete_or_extra_scores`) instead of exact check names (R1 ×2); the full-pass and violations `expect` blocks carried no structured `computed_spot_checks` (R2 ×2); and the designed violations input was missing the key paths present in the full-pass manifest (R3 ×1). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.
9. **Recorded quantity names in the judgment record are not output field names:** `judgment.json`'s computed checks and the full-pass case's `expect.notes` prose name the recomputed totals `purchase_order_total`, `invoice_total` and `violations_po_total`, while the response's actual output fields are `purchase_order_lines_total` and `invoice_lines_total`. The Output format section and Worked examples use the recorded response's field names; the judgment record's shorthand names are not fields a caller can read.

## Worked examples

Provenance: recorded 2026-11-16T15:25:07.263432+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/vendor-evaluation-three-way-match-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T15:25:07.263432+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/vendor-evaluation-three-way-match-pack/evidence.json`.

Input:

```json
{
  "pack_title": "Standard Procurement Audit",
  "spec": {
    "spec_written_before_quotes": true,
    "spec_includes_functional_requirements": true,
    "spec_includes_compliance_requirements": true,
    "spec_includes_interface_requirements": true
  },
  "sourcing": {
    "quotes_comparable_same_scope_declared": true,
    "single_source_used": false
  },
  "evaluation_setup": {
    "criteria_set_before_scoring": true,
    "tco_evaluation_documented": true,
    "tco_includes_acquisition_cost": true,
    "tco_includes_operations_cost": true,
    "tco_includes_spares_cost": true,
    "tco_includes_support_cost": true,
    "tco_includes_switching_cost": true,
    "evidence_basis_recorded": true,
    "evaluation_applied_consistently_across_vendors": true
  },
  "vendors": [
    {
      "vendor_id": "v1",
      "vendor_name": "Vendor A",
      "evidence_note": "Strong performance",
      "scores": [
        {
          "criterion_id": "c1",
          "score": 10.0
        }
      ],
      "weighted_total_declared": 10.0
    },
    {
      "vendor_id": "v2",
      "vendor_name": "Vendor B",
      "evidence_note": "Good performance",
      "scores": [
        {
          "criterion_id": "c1",
          "score": 8.0
        }
      ],
      "weighted_total_declared": 8.0
    }
  ],
  "criteria": [
    {
      "criterion_id": "c1",
      "criterion_name": "Quality",
      "weight": 1.0
    }
  ],
  "contract": {
    "exclusions_reviewed": true,
    "payment_terms_reviewed": true,
    "penalties_reviewed": true,
    "warranty_reviewed": true,
    "price_escalation_clauses_reviewed": true,
    "binding_terms_reviewed": true
  },
  "po_discipline": {
    "po_issued_before_delivery": true,
    "changes_via_change_order_declared": true,
    "verbal_commitments_papered_same_day_declared": true,
    "po_references_spec_declared": true
  },
  "three_way_match": {
    "match_performed_before_payment_declared": true,
    "discrepancies_resolved_before_payment_declared": true,
    "inspection_against_spec_on_arrival_declared": true,
    "receipt_verification_before_payment_declared": true,
    "purchase_order_total_declared": 100.0,
    "invoice_total_declared": 100.0
  },
  "purchase_order_lines": [
    {
      "line_id": "l1",
      "quantity": 10.0,
      "unit_price": 10.0,
      "line_total_declared": 100.0
    }
  ],
  "receipt_lines": [
    {
      "line_id": "l1",
      "quantity": 10.0
    }
  ],
  "invoice_lines": [
    {
      "line_id": "l1",
      "quantity": 10.0,
      "unit_price": 10.0,
      "line_total_declared": 100.0
    }
  ],
  "vendor_records": {
    "vendor_terms_recorded": true,
    "vendor_contacts_recorded": true,
    "performance_log_maintained": true,
    "performance_log_covers_on_time_quality_responsiveness": true,
    "annual_review_cadence_set": true,
    "two_viable_sources_for_critical_items_declared": true,
    "banking_detail_changes_verified_via_known_contacts": true,
    "segregation_of_duties_declared": true,
    "gifts_conflict_policy_respected_declared": true
  },
  "red_lines": {
    "po_less_purchase_above_threshold_present": false,
    "payment_without_delivery_confirmation_present": false,
    "payment_before_three_way_match_present": false,
    "silent_bank_detail_change_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "vendor-evaluation-three-way-match-pack",
  "atom_version": "0.1.0",
  "pack_title": "Standard Procurement Audit",
  "verdict": "VENDOR_EVALUATION_AND_MATCH_SOUND",
  "sections": {
    "spec_and_sourcing": "pass",
    "vendor_evaluation_and_total_cost": "pass",
    "contract_and_terms": "pass",
    "purchase_order_discipline": "pass",
    "three_way_match": "pass",
    "vendor_records_and_performance": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "spec_and_sourcing",
      "check": "vendor_evaluation_spec_written_before_quotes",
      "status": "pass",
      "evidence": "spec: a written specification existed before quotes were sought \u2014 buy to spec, not to brochure"
    },
    {
      "section": "spec_and_sourcing",
      "check": "vendor_evaluation_spec_includes_functional_requirements",
      "status": "pass",
      "evidence": "spec: the specification includes the functional requirements"
    },
    {
      "section": "spec_and_sourcing",
      "check": "vendor_evaluation_spec_includes_compliance_requirements",
      "status": "pass",
      "evidence": "spec: the specification includes the compliance requirements"
    },
    {
      "section": "spec_and_sourcing",
      "check": "vendor_evaluation_spec_includes_interface_requirements",
      "status": "pass",
      "evidence": "spec: the specification includes the interface requirements"
    },
    {
      "section": "spec_and_sourcing",
      "check": "vendor_evaluation_quotes_comparable_same_scope_declared",
      "status": "pass",
      "evidence": "sourcing: the quotes obtained are declared comparable \u2014 same scope, quantities, delivery, terms and warranty"
    },
    {
      "section": "spec_and_sourcing",
      "check": "vendor_evaluation_single_source_justification_recorded_where_single_source_used",
      "status": "pass",
      "evidence": "no single-source purchase declared used"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_criteria_set_before_scoring",
      "status": "pass",
      "evidence": "evaluation: the weighted criteria were set BEFORE scoring"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_tco_evaluation_documented",
      "status": "pass",
      "evidence": "total cost: the total-cost-of-ownership evaluation is documented \u2014 total cost, not price"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_tco_includes_acquisition_cost",
      "status": "pass",
      "evidence": "total cost: acquisition cost is included in the total-cost evaluation"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_tco_includes_operations_cost",
      "status": "pass",
      "evidence": "total cost: operations cost is included in the total-cost evaluation"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_tco_includes_spares_cost",
      "status": "pass",
      "evidence": "total cost: spares cost is included in the total-cost evaluation"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_tco_includes_support_cost",
      "status": "pass",
      "evidence": "total cost: support cost is included in the total-cost evaluation"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_tco_includes_switching_cost",
      "status": "pass",
      "evidence": "total cost: switching cost is included in the total-cost evaluation"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_evidence_basis_recorded",
      "status": "pass",
      "evidence": "evaluation: the evidence basis for the vendor evaluation is recorded"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_applied_consistently_across_vendors",
      "status": "pass",
      "evidence": "evaluation: the same criteria and evidence basis were applied consistently across all vendors"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_vendors_list_declared",
      "status": "pass",
      "evidence": "vendors: the declared record names its evaluated vendors \u2014 the list is present and names at least two vendors; an absent list is missing evidence and a list of fewer than two declares no comparison at all"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_vendor_id_unique",
      "status": "pass",
      "evidence": "vendors: no declared vendor_id is owned by more than one row"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_vendor_name_declared",
      "status": "pass",
      "evidence": "vendors: every declared vendor declares a non-empty vendor name"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_vendor_evidence_note_declared",
      "status": "pass",
      "evidence": "vendors: every declared vendor declares a non-empty evidence note"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_criteria_list_declared",
      "status": "pass",
      "evidence": "criteria: the declared record names its evaluation criteria \u2014 the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no evaluation at all"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_criterion_id_unique",
      "status": "pass",
      "evidence": "criteria: no declared criterion_id is owned by more than one row"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_criterion_name_declared",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-empty criterion name"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_criterion_weight_non_negative",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-negative weight"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_criteria_weights_sum_positive",
      "status": "pass",
      "evidence": "criteria: the declared criterion weights sum to a positive total \u2014 an evaluation whose weights sum to zero scores nothing"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_vendor_scores_every_declared_criterion",
      "status": "pass",
      "evidence": "scores: every declared vendor scores every declared criterion and no other criterion, exactly once"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_vendor_weighted_total_recomputes",
      "status": "pass",
      "evidence": "scores: every declared vendor's declared weighted total recomputes exactly as the sum of declared weight times declared score over its declared scores"
    },
    {
      "section": "contract_and_terms",
      "check": "vendor_evaluation_contract_exclusions_reviewed",
      "status": "pass",
      "evidence": "contract care: the quote and contract exclusions were read and reviewed"
    },
    {
      "section": "contract_and_terms",
      "check": "vendor_evaluation_contract_payment_terms_reviewed",
      "status": "pass",
      "evidence": "contract care: the payment terms were read and reviewed"
    },
    {
      "section": "contract_and_terms",
      "check": "vendor_evaluation_contract_penalties_reviewed",
      "status": "pass",
      "evidence": "contract care: the penalties were read and reviewed"
    },
    {
      "section": "contract_and_terms",
      "check": "vendor_evaluation_contract_warranty_reviewed",
      "status": "pass",
      "evidence": "contract care: the warranty was read and reviewed"
    },
    {
      "section": "contract_and_terms",
      "check": "vendor_evaluation_contract_price_escalation_clauses_reviewed",
      "status": "pass",
      "evidence": "contract care: the price-escalation clauses were read and reviewed"
    },
    {
      "section": "contract_and_terms",
      "check": "vendor_evaluation_contract_binding_terms_reviewed",
      "status": "pass",
      "evidence": "contract care: the binding terms were reviewed \u2014 binding terms get review"
    },
    {
      "section": "purchase_order_discipline",
      "check": "vendor_evaluation_po_issued_before_delivery",
      "status": "pass",
      "evidence": "PO discipline: the purchase order was issued before delivery"
    },
    {
      "section": "purchase_order_discipline",
      "check": "vendor_evaluation_po_changes_via_change_order_declared",
      "status": "pass",
      "evidence": "PO discipline: changes to the purchase order were made via change order"
    },
    {
      "section": "purchase_order_discipline",
      "check": "vendor_evaluation_verbal_commitments_papered_same_day_declared",
      "status": "pass",
      "evidence": "PO discipline: no verbal commitments stand unpapered \u2014 any verbal commitment was papered the same day"
    },
    {
      "section": "purchase_order_discipline",
      "check": "vendor_evaluation_po_references_spec_declared",
      "status": "pass",
      "evidence": "PO discipline: the purchase order references the written specification it buys to"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_three_way_match_performed_before_payment_declared",
      "status": "pass",
      "evidence": "3-way match: the three-way match (PO \u2194 receipt/inspection \u2194 invoice) was performed before payment"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_three_way_discrepancies_resolved_before_payment_declared",
      "status": "pass",
      "evidence": "3-way match: discrepancies were resolved first, before payment"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_inspection_against_spec_on_arrival_declared",
      "status": "pass",
      "evidence": "receipt: the delivery was inspected against spec on arrival, not after install"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_receipt_verification_before_payment_declared",
      "status": "pass",
      "evidence": "receipt: receipt verification stands before payment \u2014 nothing is paid without receipt verification"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_purchase_order_lines_declared",
      "status": "pass",
      "evidence": "purchase order lines: the declared record names its purchase-order lines \u2014 the list is present and names at least one line; an absent list is missing evidence and an empty list declares no purchase at all"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_purchase_order_line_id_unique",
      "status": "pass",
      "evidence": "purchase order lines: no declared line_id is owned by more than one purchase-order row"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_receipt_line_id_unique",
      "status": "pass",
      "evidence": "receipt lines: no declared line_id is owned by more than one receipt row"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_invoice_line_id_unique",
      "status": "pass",
      "evidence": "invoice lines: no declared line_id is owned by more than one invoice row"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_purchase_order_line_total_recomputes",
      "status": "pass",
      "evidence": "purchase order lines: every declared purchase-order line total recomputes exactly as declared quantity times declared unit price"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_invoice_line_total_recomputes",
      "status": "pass",
      "evidence": "invoice lines: every declared invoice line total recomputes exactly as declared quantity times declared unit price"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_receipt_lines_cover_purchase_order_lines_exactly",
      "status": "pass",
      "evidence": "3-way match: the declared receipt line ids are exactly the declared purchase-order line ids \u2014 none missing, none extra, none duplicated"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_invoice_lines_cover_purchase_order_lines_exactly",
      "status": "pass",
      "evidence": "3-way match: the declared invoice line ids are exactly the declared purchase-order line ids \u2014 none missing, none extra, none duplicated"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_three_way_line_quantity_matches_across_documents",
      "status": "pass",
      "evidence": "3-way match: for every declared line, the declared quantity agrees across purchase order, receipt and invoice"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_three_way_line_unit_price_matches_po_to_invoice",
      "status": "pass",
      "evidence": "3-way match: for every declared line, the declared unit price on the invoice agrees with the declared unit price on the purchase order"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_purchase_order_total_recomputes_from_line_totals",
      "status": "pass",
      "evidence": "purchase order total: the declared purchase-order grand total recomputes exactly as the sum of the declared purchase-order line totals"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_invoice_total_recomputes_from_line_totals",
      "status": "pass",
      "evidence": "invoice total: the declared invoice grand total recomputes exactly as the sum of the declared invoice line totals"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_three_way_grand_totals_match",
      "status": "pass",
      "evidence": "3-way match: the declared purchase-order grand total and the declared invoice grand total agree \u2014 the atom checks only that the declared totals agree; it approves no payment"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_vendor_terms_recorded",
      "status": "pass",
      "evidence": "vendor records: the vendor's terms are kept on record"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_vendor_contacts_recorded",
      "status": "pass",
      "evidence": "vendor records: the vendor's contacts are kept on record"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_performance_log_maintained",
      "status": "pass",
      "evidence": "vendor records: a vendor performance log is maintained"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_performance_log_covers_on_time_quality_responsiveness",
      "status": "pass",
      "evidence": "vendor records: the performance log covers on-time delivery, quality and responsiveness"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_annual_review_cadence_set",
      "status": "pass",
      "evidence": "vendor records: an annual vendor review cadence is set"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_two_viable_sources_for_critical_items_declared",
      "status": "pass",
      "evidence": "vendor records: two viable sources are kept for critical items where feasible, as declared"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_banking_detail_changes_verified_via_known_contacts",
      "status": "pass",
      "evidence": "fraud hygiene: banking-detail changes are verified via known contacts \u2014 never through email links"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_segregation_of_duties_declared",
      "status": "pass",
      "evidence": "fraud hygiene: segregation of duties is in place where possible, as declared"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_gifts_conflict_policy_respected_declared",
      "status": "pass",
      "evidence": "fraud hygiene: the gifts and conflict-of-interest policy is respected, as declared"
    },
    {
      "section": "red_lines",
      "check": "vendor_evaluation_free_of_po_less_purchase_above_threshold",
      "status": "pass",
      "evidence": "red line: no PO-less purchase above threshold is present in the record"
    },
    {
      "section": "red_lines",
      "check": "vendor_evaluation_free_of_payment_without_delivery_confirmation",
      "status": "pass",
      "evidence": "red line: no payment without delivery confirmation is present in the record"
    },
    {
      "section": "red_lines",
      "check": "vendor_evaluation_free_of_payment_before_three_way_match",
      "status": "pass",
      "evidence": "red line: no payment made before the three-way match is present in the record"
    },
    {
      "section": "red_lines",
      "check": "vendor_evaluation_free_of_silent_bank_detail_change",
      "status": "pass",
      "evidence": "red line: no silent bank-detail change is present in the record \u2014 bank-detail changes are verified through known channels always"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "vendor_evaluation_vendors_count": 2,
  "vendor_evaluation_criteria_count": 1,
  "purchase_order_lines_count": 1,
  "receipt_lines_count": 1,
  "invoice_lines_count": 1,
  "duplicate_vendor_evaluation_vendor_ids": [],
  "duplicate_vendor_evaluation_criterion_ids": [],
  "duplicate_purchase_order_line_ids": [],
  "duplicate_receipt_line_ids": [],
  "duplicate_invoice_line_ids": [],
  "vendor_evaluation_vendors_without_name": [],
  "vendor_evaluation_vendors_without_evidence_note": [],
  "vendor_evaluation_criteria_without_name": [],
  "vendor_evaluation_criteria_with_invalid_weight": [],
  "vendor_evaluation_vendors_with_incomplete_or_extra_scores": [],
  "vendor_evaluation_vendors_with_weighted_total_mismatch": [],
  "purchase_order_lines_with_line_total_mismatch": [],
  "invoice_lines_with_line_total_mismatch": [],
  "purchase_order_line_ids_missing_from_receipt": [],
  "receipt_line_ids_not_on_purchase_order": [],
  "purchase_order_line_ids_missing_from_invoice": [],
  "invoice_line_ids_not_on_purchase_order": [],
  "three_way_lines_with_quantity_mismatch": [],
  "three_way_lines_with_unit_price_mismatch": [],
  "vendor_evaluation_criteria_weights_sum": "1.000000",
  "purchase_order_lines_total": "100.000000",
  "invoice_lines_total": "100.000000",
  "vendor_score_coverage_ratio": "1.000000",
  "vendor_weighted_total_match_ratio": "1.000000",
  "vendor_evidence_note_ratio": "1.000000",
  "three_way_quantity_match_ratio": "1.000000",
  "three_way_amount_match_ratio": "1.000000",
  "summary": "66 pass, 0 fail, 0 missing of 66 checks across seven sections.",
  "stamp": "VENDOR EVALUATION THREE WAY MATCH PACK\npack_title: Standard Procurement Audit\nVERDICT: VENDOR_EVALUATION_AND_MATCH_SOUND\n  spec_and_sourcing                            pass\n  vendor_evaluation_and_total_cost             pass\n  contract_and_terms                           pass\n  purchase_order_discipline                    pass\n  three_way_match                              pass\n  vendor_records_and_performance               pass\n  red_lines                                    pass\n66 pass, 0 fail, 0 missing of 66 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T15:25:07.263432+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/vendor-evaluation-three-way-match-pack/evidence.json`.

Input:

```json
{
  "pack_title": "Standard Procurement Audit",
  "spec": {
    "spec_written_before_quotes": true,
    "spec_includes_functional_requirements": true,
    "spec_includes_compliance_requirements": true,
    "spec_includes_interface_requirements": true
  },
  "sourcing": {
    "quotes_comparable_same_scope_declared": true,
    "single_source_used": false
  },
  "evaluation_setup": {
    "criteria_set_before_scoring": true,
    "tco_evaluation_documented": true,
    "tco_includes_acquisition_cost": true,
    "tco_includes_operations_cost": true,
    "tco_includes_spares_cost": true,
    "tco_includes_support_cost": true,
    "tco_includes_switching_cost": true,
    "evidence_basis_recorded": true,
    "evaluation_applied_consistently_across_vendors": true
  },
  "vendors": [
    {
      "vendor_id": "v1",
      "vendor_name": "Vendor A",
      "evidence_note": "Strong performance",
      "scores": [
        {
          "criterion_id": "cX",
          "score": 10.0
        }
      ],
      "weighted_total_declared": 10.0
    },
    {
      "vendor_id": "v2",
      "vendor_name": "Vendor B",
      "evidence_note": "Good performance",
      "scores": [
        {
          "criterion_id": "c1",
          "score": 8.0
        }
      ],
      "weighted_total_declared": 8.0
    }
  ],
  "criteria": [
    {
      "criterion_id": "c1",
      "criterion_name": "Quality",
      "weight": 1.0
    }
  ],
  "contract": {
    "exclusions_reviewed": true,
    "payment_terms_reviewed": true,
    "penalties_reviewed": true,
    "warranty_reviewed": true,
    "price_escalation_clauses_reviewed": true,
    "binding_terms_reviewed": true
  },
  "po_discipline": {
    "po_issued_before_delivery": true,
    "changes_via_change_order_declared": true,
    "verbal_commitments_papered_same_day_declared": true,
    "po_references_spec_declared": true
  },
  "three_way_match": {
    "match_performed_before_payment_declared": true,
    "discrepancies_resolved_before_payment_declared": true,
    "inspection_against_spec_on_arrival_declared": true,
    "receipt_verification_before_payment_declared": true,
    "purchase_order_total_declared": 100.0,
    "invoice_total_declared": 100.0
  },
  "purchase_order_lines": [
    {
      "line_id": "l1",
      "quantity": 10.0,
      "unit_price": 10.0,
      "line_total_declared": 999.0
    }
  ],
  "receipt_lines": [
    {
      "line_id": "l1",
      "quantity": 10.0
    }
  ],
  "invoice_lines": [
    {
      "line_id": "l1",
      "quantity": 10.0,
      "unit_price": 10.0,
      "line_total_declared": 100.0
    }
  ],
  "vendor_records": {
    "vendor_terms_recorded": true,
    "vendor_contacts_recorded": true,
    "performance_log_maintained": true,
    "performance_log_covers_on_time_quality_responsiveness": true,
    "annual_review_cadence_set": true,
    "two_viable_sources_for_critical_items_declared": true,
    "banking_detail_changes_verified_via_known_contacts": true,
    "segregation_of_duties_declared": true,
    "gifts_conflict_policy_respected_declared": true
  },
  "red_lines": {
    "po_less_purchase_above_threshold_present": false,
    "payment_without_delivery_confirmation_present": false,
    "payment_before_three_way_match_present": false,
    "silent_bank_detail_change_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "vendor-evaluation-three-way-match-pack",
  "atom_version": "0.1.0",
  "pack_title": "Standard Procurement Audit",
  "verdict": "VENDOR_EVALUATION_AND_MATCH_NOT_SOUND",
  "sections": {
    "spec_and_sourcing": "pass",
    "vendor_evaluation_and_total_cost": "fail",
    "contract_and_terms": "pass",
    "purchase_order_discipline": "pass",
    "three_way_match": "fail",
    "vendor_records_and_performance": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "spec_and_sourcing",
      "check": "vendor_evaluation_spec_written_before_quotes",
      "status": "pass",
      "evidence": "spec: a written specification existed before quotes were sought \u2014 buy to spec, not to brochure"
    },
    {
      "section": "spec_and_sourcing",
      "check": "vendor_evaluation_spec_includes_functional_requirements",
      "status": "pass",
      "evidence": "spec: the specification includes the functional requirements"
    },
    {
      "section": "spec_and_sourcing",
      "check": "vendor_evaluation_spec_includes_compliance_requirements",
      "status": "pass",
      "evidence": "spec: the specification includes the compliance requirements"
    },
    {
      "section": "spec_and_sourcing",
      "check": "vendor_evaluation_spec_includes_interface_requirements",
      "status": "pass",
      "evidence": "spec: the specification includes the interface requirements"
    },
    {
      "section": "spec_and_sourcing",
      "check": "vendor_evaluation_quotes_comparable_same_scope_declared",
      "status": "pass",
      "evidence": "sourcing: the quotes obtained are declared comparable \u2014 same scope, quantities, delivery, terms and warranty"
    },
    {
      "section": "spec_and_sourcing",
      "check": "vendor_evaluation_single_source_justification_recorded_where_single_source_used",
      "status": "pass",
      "evidence": "no single-source purchase declared used"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_criteria_set_before_scoring",
      "status": "pass",
      "evidence": "evaluation: the weighted criteria were set BEFORE scoring"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_tco_evaluation_documented",
      "status": "pass",
      "evidence": "total cost: the total-cost-of-ownership evaluation is documented \u2014 total cost, not price"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_tco_includes_acquisition_cost",
      "status": "pass",
      "evidence": "total cost: acquisition cost is included in the total-cost evaluation"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_tco_includes_operations_cost",
      "status": "pass",
      "evidence": "total cost: operations cost is included in the total-cost evaluation"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_tco_includes_spares_cost",
      "status": "pass",
      "evidence": "total cost: spares cost is included in the total-cost evaluation"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_tco_includes_support_cost",
      "status": "pass",
      "evidence": "total cost: support cost is included in the total-cost evaluation"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_tco_includes_switching_cost",
      "status": "pass",
      "evidence": "total cost: switching cost is included in the total-cost evaluation"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_evidence_basis_recorded",
      "status": "pass",
      "evidence": "evaluation: the evidence basis for the vendor evaluation is recorded"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_applied_consistently_across_vendors",
      "status": "pass",
      "evidence": "evaluation: the same criteria and evidence basis were applied consistently across all vendors"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_vendors_list_declared",
      "status": "pass",
      "evidence": "vendors: the declared record names its evaluated vendors \u2014 the list is present and names at least two vendors; an absent list is missing evidence and a list of fewer than two declares no comparison at all"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_vendor_id_unique",
      "status": "pass",
      "evidence": "vendors: no declared vendor_id is owned by more than one row"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_vendor_name_declared",
      "status": "pass",
      "evidence": "vendors: every declared vendor declares a non-empty vendor name"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_vendor_evidence_note_declared",
      "status": "pass",
      "evidence": "vendors: every declared vendor declares a non-empty evidence note"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_criteria_list_declared",
      "status": "pass",
      "evidence": "criteria: the declared record names its evaluation criteria \u2014 the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no evaluation at all"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_criterion_id_unique",
      "status": "pass",
      "evidence": "criteria: no declared criterion_id is owned by more than one row"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_criterion_name_declared",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-empty criterion name"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_criterion_weight_non_negative",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-negative weight"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "vendor_evaluation_criteria_weights_sum_positive",
      "status": "pass",
      "evidence": "criteria: the declared criterion weights sum to a positive total \u2014 an evaluation whose weights sum to zero scores nothing"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_vendor_scores_every_declared_criterion",
      "status": "fail",
      "evidence": "scores: every declared vendor scores every declared criterion and no other criterion, exactly once"
    },
    {
      "section": "vendor_evaluation_and_total_cost",
      "check": "every_vendor_evaluation_vendor_weighted_total_recomputes",
      "status": "fail",
      "evidence": "scores: every declared vendor's declared weighted total recomputes exactly as the sum of declared weight times declared score over its declared scores"
    },
    {
      "section": "contract_and_terms",
      "check": "vendor_evaluation_contract_exclusions_reviewed",
      "status": "pass",
      "evidence": "contract care: the quote and contract exclusions were read and reviewed"
    },
    {
      "section": "contract_and_terms",
      "check": "vendor_evaluation_contract_payment_terms_reviewed",
      "status": "pass",
      "evidence": "contract care: the payment terms were read and reviewed"
    },
    {
      "section": "contract_and_terms",
      "check": "vendor_evaluation_contract_penalties_reviewed",
      "status": "pass",
      "evidence": "contract care: the penalties were read and reviewed"
    },
    {
      "section": "contract_and_terms",
      "check": "vendor_evaluation_contract_warranty_reviewed",
      "status": "pass",
      "evidence": "contract care: the warranty was read and reviewed"
    },
    {
      "section": "contract_and_terms",
      "check": "vendor_evaluation_contract_price_escalation_clauses_reviewed",
      "status": "pass",
      "evidence": "contract care: the price-escalation clauses were read and reviewed"
    },
    {
      "section": "contract_and_terms",
      "check": "vendor_evaluation_contract_binding_terms_reviewed",
      "status": "pass",
      "evidence": "contract care: the binding terms were reviewed \u2014 binding terms get review"
    },
    {
      "section": "purchase_order_discipline",
      "check": "vendor_evaluation_po_issued_before_delivery",
      "status": "pass",
      "evidence": "PO discipline: the purchase order was issued before delivery"
    },
    {
      "section": "purchase_order_discipline",
      "check": "vendor_evaluation_po_changes_via_change_order_declared",
      "status": "pass",
      "evidence": "PO discipline: changes to the purchase order were made via change order"
    },
    {
      "section": "purchase_order_discipline",
      "check": "vendor_evaluation_verbal_commitments_papered_same_day_declared",
      "status": "pass",
      "evidence": "PO discipline: no verbal commitments stand unpapered \u2014 any verbal commitment was papered the same day"
    },
    {
      "section": "purchase_order_discipline",
      "check": "vendor_evaluation_po_references_spec_declared",
      "status": "pass",
      "evidence": "PO discipline: the purchase order references the written specification it buys to"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_three_way_match_performed_before_payment_declared",
      "status": "pass",
      "evidence": "3-way match: the three-way match (PO \u2194 receipt/inspection \u2194 invoice) was performed before payment"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_three_way_discrepancies_resolved_before_payment_declared",
      "status": "pass",
      "evidence": "3-way match: discrepancies were resolved first, before payment"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_inspection_against_spec_on_arrival_declared",
      "status": "pass",
      "evidence": "receipt: the delivery was inspected against spec on arrival, not after install"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_receipt_verification_before_payment_declared",
      "status": "pass",
      "evidence": "receipt: receipt verification stands before payment \u2014 nothing is paid without receipt verification"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_purchase_order_lines_declared",
      "status": "pass",
      "evidence": "purchase order lines: the declared record names its purchase-order lines \u2014 the list is present and names at least one line; an absent list is missing evidence and an empty list declares no purchase at all"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_purchase_order_line_id_unique",
      "status": "pass",
      "evidence": "purchase order lines: no declared line_id is owned by more than one purchase-order row"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_receipt_line_id_unique",
      "status": "pass",
      "evidence": "receipt lines: no declared line_id is owned by more than one receipt row"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_invoice_line_id_unique",
      "status": "pass",
      "evidence": "invoice lines: no declared line_id is owned by more than one invoice row"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_purchase_order_line_total_recomputes",
      "status": "fail",
      "evidence": "purchase order lines: every declared purchase-order line total recomputes exactly as declared quantity times declared unit price"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_invoice_line_total_recomputes",
      "status": "pass",
      "evidence": "invoice lines: every declared invoice line total recomputes exactly as declared quantity times declared unit price"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_receipt_lines_cover_purchase_order_lines_exactly",
      "status": "pass",
      "evidence": "3-way match: the declared receipt line ids are exactly the declared purchase-order line ids \u2014 none missing, none extra, none duplicated"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_invoice_lines_cover_purchase_order_lines_exactly",
      "status": "pass",
      "evidence": "3-way match: the declared invoice line ids are exactly the declared purchase-order line ids \u2014 none missing, none extra, none duplicated"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_three_way_line_quantity_matches_across_documents",
      "status": "pass",
      "evidence": "3-way match: for every declared line, the declared quantity agrees across purchase order, receipt and invoice"
    },
    {
      "section": "three_way_match",
      "check": "every_vendor_evaluation_three_way_line_unit_price_matches_po_to_invoice",
      "status": "pass",
      "evidence": "3-way match: for every declared line, the declared unit price on the invoice agrees with the declared unit price on the purchase order"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_purchase_order_total_recomputes_from_line_totals",
      "status": "fail",
      "evidence": "purchase order total: the declared purchase-order grand total recomputes exactly as the sum of the declared purchase-order line totals"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_invoice_total_recomputes_from_line_totals",
      "status": "pass",
      "evidence": "invoice total: the declared invoice grand total recomputes exactly as the sum of the declared invoice line totals"
    },
    {
      "section": "three_way_match",
      "check": "vendor_evaluation_three_way_grand_totals_match",
      "status": "pass",
      "evidence": "3-way match: the declared purchase-order grand total and the declared invoice grand total agree \u2014 the atom checks only that the declared totals agree; it approves no payment"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_vendor_terms_recorded",
      "status": "pass",
      "evidence": "vendor records: the vendor's terms are kept on record"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_vendor_contacts_recorded",
      "status": "pass",
      "evidence": "vendor records: the vendor's contacts are kept on record"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_performance_log_maintained",
      "status": "pass",
      "evidence": "vendor records: a vendor performance log is maintained"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_performance_log_covers_on_time_quality_responsiveness",
      "status": "pass",
      "evidence": "vendor records: the performance log covers on-time delivery, quality and responsiveness"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_annual_review_cadence_set",
      "status": "pass",
      "evidence": "vendor records: an annual vendor review cadence is set"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_two_viable_sources_for_critical_items_declared",
      "status": "pass",
      "evidence": "vendor records: two viable sources are kept for critical items where feasible, as declared"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_banking_detail_changes_verified_via_known_contacts",
      "status": "pass",
      "evidence": "fraud hygiene: banking-detail changes are verified via known contacts \u2014 never through email links"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_segregation_of_duties_declared",
      "status": "pass",
      "evidence": "fraud hygiene: segregation of duties is in place where possible, as declared"
    },
    {
      "section": "vendor_records_and_performance",
      "check": "vendor_evaluation_gifts_conflict_policy_respected_declared",
      "status": "pass",
      "evidence": "fraud hygiene: the gifts and conflict-of-interest policy is respected, as declared"
    },
    {
      "section": "red_lines",
      "check": "vendor_evaluation_free_of_po_less_purchase_above_threshold",
      "status": "pass",
      "evidence": "red line: no PO-less purchase above threshold is present in the record"
    },
    {
      "section": "red_lines",
      "check": "vendor_evaluation_free_of_payment_without_delivery_confirmation",
      "status": "pass",
      "evidence": "red line: no payment without delivery confirmation is present in the record"
    },
    {
      "section": "red_lines",
      "check": "vendor_evaluation_free_of_payment_before_three_way_match",
      "status": "pass",
      "evidence": "red line: no payment made before the three-way match is present in the record"
    },
    {
      "section": "red_lines",
      "check": "vendor_evaluation_free_of_silent_bank_detail_change",
      "status": "pass",
      "evidence": "red line: no silent bank-detail change is present in the record \u2014 bank-detail changes are verified through known channels always"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "vendor_evaluation_vendors_count": 2,
  "vendor_evaluation_criteria_count": 1,
  "purchase_order_lines_count": 1,
  "receipt_lines_count": 1,
  "invoice_lines_count": 1,
  "duplicate_vendor_evaluation_vendor_ids": [],
  "duplicate_vendor_evaluation_criterion_ids": [],
  "duplicate_purchase_order_line_ids": [],
  "duplicate_receipt_line_ids": [],
  "duplicate_invoice_line_ids": [],
  "vendor_evaluation_vendors_without_name": [],
  "vendor_evaluation_vendors_without_evidence_note": [],
  "vendor_evaluation_criteria_without_name": [],
  "vendor_evaluation_criteria_with_invalid_weight": [],
  "vendor_evaluation_vendors_with_incomplete_or_extra_scores": [
    "v1"
  ],
  "vendor_evaluation_vendors_with_weighted_total_mismatch": [
    "v1"
  ],
  "purchase_order_lines_with_line_total_mismatch": [
    "l1"
  ],
  "invoice_lines_with_line_total_mismatch": [],
  "purchase_order_line_ids_missing_from_receipt": [],
  "receipt_line_ids_not_on_purchase_order": [],
  "purchase_order_line_ids_missing_from_invoice": [],
  "invoice_line_ids_not_on_purchase_order": [],
  "three_way_lines_with_quantity_mismatch": [],
  "three_way_lines_with_unit_price_mismatch": [],
  "vendor_evaluation_criteria_weights_sum": "1.000000",
  "purchase_order_lines_total": "999.000000",
  "invoice_lines_total": "100.000000",
  "vendor_score_coverage_ratio": "0.500000",
  "vendor_weighted_total_match_ratio": "0.500000",
  "vendor_evidence_note_ratio": "1.000000",
  "three_way_quantity_match_ratio": "1.000000",
  "three_way_amount_match_ratio": "0.000000",
  "summary": "62 pass, 4 fail, 0 missing of 66 checks across seven sections.",
  "stamp": "VENDOR EVALUATION THREE WAY MATCH PACK\npack_title: Standard Procurement Audit\nVERDICT: VENDOR_EVALUATION_AND_MATCH_NOT_SOUND\n  spec_and_sourcing                            pass\n  vendor_evaluation_and_total_cost             fail\n  contract_and_terms                           pass\n  purchase_order_discipline                    pass\n  three_way_match                              fail\n  vendor_records_and_performance               pass\n  red_lines                                    pass\n62 pass, 4 fail, 0 missing of 66 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T15:25:07.263432+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/vendor-evaluation-three-way-match-pack/evidence.json`.

Input:

```json
{
  "pack_title": 12345
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "pack_title",
  "detail": "pack_title must be a string"
}
```
