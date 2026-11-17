# Vendor evaluation three way match pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You keep a vendor evaluation and three-way match record for one purchase. This atom reads one declared vendor evaluation and three-way match record and returns one deterministic verdict across seven sections (spec_and_sourcing, vendor_evaluation_and_total_cost, contract_and_terms, purchase_order_discipline, three_way_match, vendor_records_and_performance, red_lines): **VENDOR_EVALUATION_AND_MATCH_SOUND**, **VENDOR_EVALUATION_AND_MATCH_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 66 checks (spec_and_sourcing 6, vendor_evaluation_and_total_cost 20, contract_and_terms 6, purchase_order_discipline 4, three_way_match 17, vendor_records_and_performance 9, red_lines 4). It audits the declared record's completeness and internal consistency only — it fetches nothing, contacts no vendor, approves no payment and gives no procurement advice. A record is sound *on your declared evidence*: a record that declares its spec written, its vendors scored and its three documents matched passes those checks even if the real purchase did none of it. It is not a vendor recommendation, a payment approval, or a guarantee that the purchase was sound: it never judges whether a declared score is fair, whether the evidence note actually supports the vendor, whether the goods were really received, or whether the invoice should be paid — only that the record contains what the skill's method and red lines demand, and that its declared rows are internally consistent. The computed checks (24 of them): the declared `vendors` list must be present and name at least two vendors, with unique `vendor_id` values and a non-empty `vendor_name` and `evidence_note` on every row; the declared `criteria` list must be present and name at least one criterion, with unique `criterion_id` values, a non-empty `criterion_name` and a non-negative `weight` on every row, and the weights must sum to a positive total; every vendor must score every declared criterion and no other criterion, exactly once, and every vendor's `weighted_total_declared` must recompute as sum(declared weight × declared score) over its declared scores; the declared `purchase_order_lines` list must be present and name at least one line, with `line_id` values unique per document set (purchase-order, receipt and invoice — three checks); every PO line's and every invoice line's `line_total_declared` must recompute as declared quantity × declared unit price; the receipt line ids and the invoice line ids must each cover the PO line ids exactly (none missing, none extra, none duplicated); for every line the quantity must agree across PO, receipt and invoice, and the invoice unit price must agree with the PO unit price; the declared PO grand total must recompute as the sum of the declared PO line totals, the declared invoice grand total must recompute as the sum of the declared invoice line totals, and the two declared grand totals must agree with each other (that check states only that the totals agree — it approves no payment). One check is gated on the record's own declared gate field: single-source justification — when `sourcing.single_source_used` is declared `false` the check passes as not applicable, when the gate field is absent the check is missing evidence, and when it is declared `true` the justification declaration `sourcing.single_source_justification_recorded` is required. No numeric threshold is imposed — no spend threshold amount for the PO-less red line or for material spend (the record declares whether the red line is present; no currency amount is set); no minimum quote count as a counted bar, including importing the skill's three-quote discipline as a number counted to (comparability and single-source justification are checked as declarations, not as a counted quote bar); no price ceiling, total-cost ceiling, or judgment that a declared price is too high; no score scale of the atom's own (scores are caller-declared numbers, checked only for coverage and arithmetic — no scale is imposed and no score is judged good or bad); no minimum winning margin between vendors, and no check that the winning vendor scored highest (the record declares no winner at all); no tolerance band on the three-way match (quantities, prices and totals must agree exactly at the declared 6dp precision); no vendor-count maximum, and no criterion-count bar beyond at least one criterion and at least two vendors; and no judgment that the chosen vendor is right, good or advisable (only that its declared evaluation record contains what the skill requires). The only bars on the computed rows are exact recomputation and completeness over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "vendor-evaluation-three-way-match-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/vendor-evaluation-three-way-match-pack` — tool name `vendor_evaluation_three_way_match_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/vendor-evaluation-three-way-match-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `pack_title` | Pack title (string; carried into the output, not checked) |
| `spec.spec_written_before_quotes` | spec evidence: a written specification existed before quotes were sought |
| `spec.spec_includes_functional_requirements` | spec evidence: the specification includes the functional requirements |
| `spec.spec_includes_compliance_requirements` | spec evidence: the specification includes the compliance requirements |
| `spec.spec_includes_interface_requirements` | spec evidence: the specification includes the interface requirements |
| `sourcing.quotes_comparable_same_scope_declared` | sourcing evidence: the quotes obtained are declared comparable — same scope |
| `sourcing.single_source_used` | gates the single-source justification check: it applies only where a single-source purchase is declared used |
| `sourcing.single_source_justification_recorded` | required when `sourcing.single_source_used` is `true`; otherwise the check passes as not applicable |
| `evaluation_setup.criteria_set_before_scoring` | evaluation evidence: the weighted criteria were set before scoring |
| `evaluation_setup.tco_evaluation_documented` | total-cost evidence: the total-cost-of-ownership evaluation is documented |
| `evaluation_setup.tco_includes_acquisition_cost` | total-cost evidence: acquisition cost is included |
| `evaluation_setup.tco_includes_operations_cost` | total-cost evidence: operations cost is included |
| `evaluation_setup.tco_includes_spares_cost` | total-cost evidence: spares cost is included |
| `evaluation_setup.tco_includes_support_cost` | total-cost evidence: support cost is included |
| `evaluation_setup.tco_includes_switching_cost` | total-cost evidence: switching cost is included |
| `evaluation_setup.evidence_basis_recorded` | evaluation evidence: the evidence basis is recorded |
| `evaluation_setup.evaluation_applied_consistently_across_vendors` | evaluation evidence: the same criteria and evidence basis were applied consistently across all vendors |
| `vendors` (list of vendor objects) | computed: must be present and name at least two vendors; reported as `vendor_evaluation_vendors_count` |
| `vendors[].vendor_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `vendors[].vendor_name` (string) | computed: must be present and non-empty on every row |
| `vendors[].evidence_note` (string) | computed: must be present and non-empty on every row |
| `vendors[].scores` (list of score objects) | computed: every vendor must score every declared criterion and no other, exactly once |
| `vendors[].scores[].criterion_id` (string) | computed: must name a declared criterion |
| `vendors[].scores[].score` (number) | the caller-declared score for that criterion; no scale is imposed |
| `vendors[].weighted_total_declared` (number) | computed: must recompute as sum(declared weight × declared score) over the vendor's declared scores |
| `criteria` (list of criterion objects) | computed: must be present and name at least one criterion; reported as `vendor_evaluation_criteria_count` |
| `criteria[].criterion_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `criteria[].criterion_name` (string) | computed: must be present and non-empty on every row |
| `criteria[].weight` (number) | computed: must be non-negative on every row; the weights must sum to a positive total (reported as `vendor_evaluation_criteria_weights_sum`; no sum target such as 1 or 100 is imposed) |
| `contract.exclusions_reviewed` | contract evidence: the exclusions were reviewed |
| `contract.payment_terms_reviewed` | contract evidence: the payment terms were reviewed |
| `contract.penalties_reviewed` | contract evidence: the penalties were reviewed |
| `contract.warranty_reviewed` | contract evidence: the warranty was reviewed |
| `contract.price_escalation_clauses_reviewed` | contract evidence: the price-escalation clauses were reviewed |
| `contract.binding_terms_reviewed` | contract evidence: the binding terms were reviewed |
| `po_discipline.po_issued_before_delivery` | PO evidence: the purchase order was issued before delivery |
| `po_discipline.changes_via_change_order_declared` | PO evidence: changes were made via change order |
| `po_discipline.verbal_commitments_papered_same_day_declared` | PO evidence: any verbal commitment was papered the same day |
| `po_discipline.po_references_spec_declared` | PO evidence: the purchase order references the written specification |
| `three_way_match.match_performed_before_payment_declared` | match evidence: the three-way match was performed before payment |
| `three_way_match.discrepancies_resolved_before_payment_declared` | match evidence: discrepancies were resolved before payment |
| `three_way_match.inspection_against_spec_on_arrival_declared` | match evidence: the delivery was inspected against spec on arrival |
| `three_way_match.receipt_verification_before_payment_declared` | match evidence: receipt verification stands before payment |
| `three_way_match.purchase_order_total_declared` (number) | computed: must recompute as the sum of the declared PO line totals, and agree with the declared invoice total |
| `three_way_match.invoice_total_declared` (number) | computed: must recompute as the sum of the declared invoice line totals |
| `purchase_order_lines` (list of PO line objects) | computed: must be present and name at least one line; reported as `purchase_order_lines_count` |
| `purchase_order_lines[].line_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row within the set |
| `purchase_order_lines[].quantity` (number) | computed: must agree across PO, receipt and invoice for the same line |
| `purchase_order_lines[].unit_price` (number) | computed: the invoice unit price for the same line must agree with it |
| `purchase_order_lines[].line_total_declared` (number) | computed: must recompute as declared quantity × declared unit price |
| `receipt_lines` (list of receipt line objects) | computed: its line ids must cover the PO line ids exactly; reported as `receipt_lines_count` |
| `receipt_lines[].line_id` (string) | computed: no id may appear on more than one row within the set |
| `receipt_lines[].quantity` (number) | computed: must agree with the PO and invoice quantities for the same line |
| `invoice_lines` (list of invoice line objects) | computed: its line ids must cover the PO line ids exactly; reported as `invoice_lines_count` |
| `invoice_lines[].line_id` (string) | computed: no id may appear on more than one row within the set |
| `invoice_lines[].quantity` (number) | computed: must agree with the PO and receipt quantities for the same line |
| `invoice_lines[].unit_price` (number) | computed: must agree with the PO unit price for the same line |
| `invoice_lines[].line_total_declared` (number) | computed: must recompute as declared quantity × declared unit price |
| `vendor_records.vendor_terms_recorded` | vendor-record evidence: the vendor's terms are kept on record |
| `vendor_records.vendor_contacts_recorded` | vendor-record evidence: the vendor's contacts are kept on record |
| `vendor_records.performance_log_maintained` | vendor-record evidence: a vendor performance log is maintained |
| `vendor_records.performance_log_covers_on_time_quality_responsiveness` | vendor-record evidence: the performance log covers on-time delivery, quality and responsiveness |
| `vendor_records.annual_review_cadence_set` | vendor-record evidence: an annual vendor review cadence is set |
| `vendor_records.two_viable_sources_for_critical_items_declared` | vendor-record evidence: two viable sources are kept for critical items, as declared |
| `vendor_records.banking_detail_changes_verified_via_known_contacts` | fraud-hygiene evidence: banking-detail changes are verified via known contacts |
| `vendor_records.segregation_of_duties_declared` | fraud-hygiene evidence: segregation of duties is in place, as declared |
| `vendor_records.gifts_conflict_policy_respected_declared` | fraud-hygiene evidence: the gifts and conflict-of-interest policy is respected, as declared |
| `red_lines.po_less_purchase_above_threshold_present` | must be `false` to pass (red line: no PO-less purchase above threshold) |
| `red_lines.payment_without_delivery_confirmation_present` | must be `false` to pass (red line: no payment without delivery confirmation) |
| `red_lines.payment_before_three_way_match_present` | must be `false` to pass (red line: no payment before the three-way match) |
| `red_lines.silent_bank_detail_change_present` | must be `false` to pass (red line: no silent bank-detail change) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward VENDOR_EVALUATION_AND_MATCH_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/vendor-evaluation-three-way-match-pack`:

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

Response — HTTP 200 (trimmed; the full response carries all 66 checks and a text stamp of the verdict):

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
  "summary": "66 pass, 0 fail, 0 missing of 66 checks across seven sections."
}
```

## Verdicts

- **VENDOR_EVALUATION_AND_MATCH_SOUND** — every check passes; the declared vendor evaluation and three-way match record is complete and internally consistent with the skill's method, quality gates and red lines.
- **VENDOR_EVALUATION_AND_MATCH_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `vendor_evaluation_vendors_count`, `vendor_evaluation_criteria_count`, `purchase_order_lines_count`, `receipt_lines_count` and `invoice_lines_count` (integers, exactly; each null when its parent list is not declared), `duplicate_vendor_evaluation_vendor_ids`, `duplicate_vendor_evaluation_criterion_ids`, `duplicate_purchase_order_line_ids`, `duplicate_receipt_line_ids` and `duplicate_invoice_line_ids` (ids carried by more than one row; each null when its list is not declared), `vendor_evaluation_vendors_without_name`, `vendor_evaluation_vendors_without_evidence_note`, `vendor_evaluation_criteria_without_name`, `vendor_evaluation_criteria_with_invalid_weight`, `vendor_evaluation_vendors_with_incomplete_or_extra_scores`, `vendor_evaluation_vendors_with_weighted_total_mismatch`, `purchase_order_lines_with_line_total_mismatch`, `invoice_lines_with_line_total_mismatch`, `purchase_order_line_ids_missing_from_receipt`, `receipt_line_ids_not_on_purchase_order`, `purchase_order_line_ids_missing_from_invoice`, `invoice_line_ids_not_on_purchase_order`, `three_way_lines_with_quantity_mismatch` and `three_way_lines_with_unit_price_mismatch` (the offending rows for each computed rule; each null when its underlying list is not declared), `vendor_evaluation_criteria_weights_sum`, `purchase_order_lines_total` and `invoice_lines_total` (sums over the declared rows), `vendor_score_coverage_ratio` (vendors scoring every declared criterion exactly ÷ declared vendors), `vendor_weighted_total_match_ratio` (vendors whose declared weighted total recomputes ÷ declared vendors), `vendor_evidence_note_ratio` (vendors with a recorded evidence note ÷ declared vendors), `three_way_quantity_match_ratio` (PO lines whose declared quantity agrees across all three documents ÷ declared PO lines) and `three_way_amount_match_ratio` (PO lines whose declared invoice line total agrees with the declared PO line total ÷ declared PO lines; each computed quantity and ratio a string with exactly six decimal places, and null when its denominator list is absent or empty — the score-coverage and weighted-total ratios are also null when the criteria list is not declared, and the quantity-match ratio is also null when any of the three document lists is not declared), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the twenty-four primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
