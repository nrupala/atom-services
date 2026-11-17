#!/usr/bin/env python3
"""Vendor evaluation three-way match pack — deterministic core.

Built from the bound skill `procurement-vendor-management`:
"Procure well — specs, sourcing, vendor evaluation, PO
discipline, 3-way match, performance reviews." Its method in
brief is this atom's record structure: spec before shopping;
sourcing with a three-quote discipline for material spend and
single-source decisions justified in writing; evaluate total
cost, not price — acquisition plus operations, spares, support
and switching cost — with weighted criteria set BEFORE scoring;
quote and contract care (exclusions, payment terms, penalties,
warranty, price-escalation clauses; binding terms reviewed);
PO discipline (PO before delivery, changes via change order,
no verbal commitments — or paper them same day); receipt and
reconciliation by 3-way match (PO ↔ receipt/inspection ↔
invoice) before payment, discrepancies resolved first,
inspection against spec on arrival; vendor records (terms,
contacts, performance log, annual review, two viable sources
for critical items where feasible); and fraud hygiene
(banking-detail changes verified via known contacts, never
email links; segregation where possible; gifts/conflict policy
respected). Its red lines are this atom's red lines: no
PO-less purchases above threshold; no payment without delivery
confirmation; no silent bank-detail changes.

This atom is an EVALUATION audit of a declared vendor
evaluation and three-way match record: it audits the record a
caller declares — the spec and sourcing declarations, the
declared vendor rows, the declared evaluation-criteria rows
with their declared weights, the declared per-vendor scores
and declared weighted totals, the contract-care declarations,
the PO-discipline declarations, the declared purchase-order /
goods-receipt / invoice row sets with their declared
quantities, unit prices, line totals and grand totals, the
vendor-record and performance declarations, and the red lines
refused. It fetches NOTHING, contacts NO vendor, approves NO
payment and gives NO procurement advice: every skill step that
sources, selects, negotiates with, contacts or pays a vendor,
or recommends a vendor or a purchase, is EXCLUDED from this
atom by name — sourcing vendors, selecting or recommending a
vendor, negotiating terms, placing a purchase order, receiving
goods, paying an invoice and approving a payment are each
excluded; the atom checks only that the record the skill
requires is present and internally consistent on the declared
evidence, and it recomputes the record's own declared
arithmetic exactly. Checking a DECLARED three-way match's
internal consistency (the three declared row sets name the
same lines, with the same quantities and prices, and every
declared total recomputes) is audit, not payment approval:
the atom never states that an invoice should be paid.

Distinct ground: the nearest siblings are
`structured-decision-making` (a general decision process —
frame, options, criteria, evaluate, commit, review for any
decision), `cost-estimate-preparation` (estimating a cost
honestly — classes, methods, ranges, escalation, estimate vs
actual), `budget-design-review` (running budgets — cycles,
owners, variance reviews, rolling forecasts) and
`append-only-ledger-design-audit` (designing append-only
ledgers and audit trails). This atom shares zero checks with
any of them: every check here is a procurement-record
question — spec-before-quotes and comparable sourcing for a
purchase, vendor rows scored against procurement criteria
with total-cost components weighed, contract-care items for a
vendor agreement, PO-before-delivery discipline, and the
three-way match recomputed line by line across the declared
purchase-order, receipt and invoice rows. The boundary is:
one vendor evaluation and payment-match record here; a
general decision process, a cost estimate, a budget and a
ledger design there.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- vendors: at least two declared rows (an evaluation that
  selects between vendors is comparative by the record's own
  framing; one row compares nothing), unique vendor ids, a
  non-empty vendor name and a non-empty evidence note on
  every row;
- criteria: at least one declared row, unique criterion ids,
  a non-empty criterion name on every row, every declared
  weight non-negative, and the declared weights summing to a
  positive total (an evaluation whose weights sum to zero
  scores nothing — internal consistency, not an imported
  target; the skill states no weight-sum target such as 1 or
  100, so none is checked);
- scores: every declared vendor scores every declared
  criterion and no other criterion, exactly once;
- weighted totals: every declared vendor's
  `weighted_total_declared` recomputes as sum(declared weight
  x declared score) over its declared scores, compared on the
  fixed 6dp serialization below;
- three-way match rows: each of the three declared row sets
  (purchase order, receipt, invoice) is present, the purchase
  order names at least one line, and no line id is owned by
  more than one row within any one set;
- line totals: every declared purchase-order and invoice
  line's `line_total_declared` recomputes as declared
  quantity x declared unit price, compared on the fixed 6dp
  serialization below;
- coverage: the declared receipt line ids are exactly the
  declared purchase-order line ids, and the declared invoice
  line ids are exactly the declared purchase-order line ids
  — none missing, none extra, none duplicated;
- quantities and prices: for every line named on both sides,
  the declared quantity agrees across purchase order, receipt
  and invoice, and the declared unit price agrees between
  purchase order and invoice;
- grand totals: each declared grand total
  (`purchase_order_total_declared`, `invoice_total_declared`)
  recomputes as the sum of its own set's declared line
  totals, and the two declared grand totals agree with each
  other;
- gated declaration: a single-source justification is
  required only where a single-source purchase is declared
  used.

Computed quantities and ratios are serialized as strings
with exactly six decimal places, produced in both
implementations by the same fixed rule — round half up to
6dp, floor(v * 1000000 + 0.5) / 1000000, then format with
exactly six decimals. Declared amounts are compared only
through that fixed serialization, so money arithmetic is
exact at the declared precision and the Python and
TypeScript outputs are byte-identical. Counts are reported
as integers (exact).

The skill states no numeric procurement threshold the atom
may set — no spend threshold amount, no minimum quote count
as a bar (the three-quote discipline is checked as a declared
comparability and justification record, not as a counted
bar), no price or total-cost ceiling, no score scale, no
winning margin — so no such check is invented; those
quantities are caller declarations at most, and quantities
here are computed and reported, with exact recomputation and
completeness over the caller's own declared rows as the only
bars.

Verdict:
- any fail             -> VENDOR_EVALUATION_AND_MATCH_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> VENDOR_EVALUATION_AND_MATCH_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "spec_and_sourcing",
    "vendor_evaluation_and_total_cost",
    "contract_and_terms",
    "purchase_order_discipline",
    "three_way_match",
    "vendor_records_and_performance",
    "red_lines",
)

MANIFEST_SPEC = {
    "pack_title": "string",
    "spec": {
        "spec_written_before_quotes": "boolean",
        "spec_includes_functional_requirements": "boolean",
        "spec_includes_compliance_requirements": "boolean",
        "spec_includes_interface_requirements": "boolean",
    },
    "sourcing": {
        "quotes_comparable_same_scope_declared": "boolean",
        "single_source_used": "boolean",
        "single_source_justification_recorded": "boolean",
    },
    "evaluation_setup": {
        "criteria_set_before_scoring": "boolean",
        "tco_evaluation_documented": "boolean",
        "tco_includes_acquisition_cost": "boolean",
        "tco_includes_operations_cost": "boolean",
        "tco_includes_spares_cost": "boolean",
        "tco_includes_support_cost": "boolean",
        "tco_includes_switching_cost": "boolean",
        "evidence_basis_recorded": "boolean",
        "evaluation_applied_consistently_across_vendors": "boolean",
    },
    "vendors": [{
        "vendor_id": "string",
        "vendor_name": "string",
        "evidence_note": "string",
        "scores": [{
            "criterion_id": "string",
            "score": "number",
        }],
        "weighted_total_declared": "number",
    }],
    "criteria": [{
        "criterion_id": "string",
        "criterion_name": "string",
        "weight": "number",
    }],
    "contract": {
        "exclusions_reviewed": "boolean",
        "payment_terms_reviewed": "boolean",
        "penalties_reviewed": "boolean",
        "warranty_reviewed": "boolean",
        "price_escalation_clauses_reviewed": "boolean",
        "binding_terms_reviewed": "boolean",
    },
    "po_discipline": {
        "po_issued_before_delivery": "boolean",
        "changes_via_change_order_declared": "boolean",
        "verbal_commitments_papered_same_day_declared": "boolean",
        "po_references_spec_declared": "boolean",
    },
    "three_way_match": {
        "match_performed_before_payment_declared": "boolean",
        "discrepancies_resolved_before_payment_declared": "boolean",
        "inspection_against_spec_on_arrival_declared": "boolean",
        "receipt_verification_before_payment_declared": "boolean",
        "purchase_order_total_declared": "number",
        "invoice_total_declared": "number",
    },
    "purchase_order_lines": [{
        "line_id": "string",
        "quantity": "number",
        "unit_price": "number",
        "line_total_declared": "number",
    }],
    "receipt_lines": [{
        "line_id": "string",
        "quantity": "number",
    }],
    "invoice_lines": [{
        "line_id": "string",
        "quantity": "number",
        "unit_price": "number",
        "line_total_declared": "number",
    }],
    "vendor_records": {
        "vendor_terms_recorded": "boolean",
        "vendor_contacts_recorded": "boolean",
        "performance_log_maintained": "boolean",
        "performance_log_covers_on_time_quality_responsiveness": "boolean",
        "annual_review_cadence_set": "boolean",
        "two_viable_sources_for_critical_items_declared": "boolean",
        "banking_detail_changes_verified_via_known_contacts": "boolean",
        "segregation_of_duties_declared": "boolean",
        "gifts_conflict_policy_respected_declared": "boolean",
    },
    "red_lines": {
        "po_less_purchase_above_threshold_present": "boolean",
        "payment_without_delivery_confirmation_present": "boolean",
        "payment_before_three_way_match_present": "boolean",
        "silent_bank_detail_change_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _is_num(value):
    return (isinstance(value, (int, float))
            and not isinstance(value, bool))


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def _duplicates(rows, field):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get(field), str):
            nm = c[field]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _ids(rows, field):
    return [c[field] for c in rows
            if isinstance(c, dict) and isinstance(c.get(field), str)]


def _by_id(rows, field):
    out = {}
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get(field), str):
            if c[field] not in out:
                out[c[field]] = c
    return out


def evaluate(manifest):
    """Return the verdict dict for a vendor evaluation record."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    vendors, has_vendors = _get(manifest, "vendors")
    vend_is_list = has_vendors and isinstance(vendors, list)
    vend_count = len(vendors) if vend_is_list else None
    vend_rows = vendors if vend_is_list else []
    vendor_ids = _ids(vend_rows, "vendor_id")

    criteria, has_criteria = _get(manifest, "criteria")
    crit_is_list = has_criteria and isinstance(criteria, list)
    crit_count = len(criteria) if crit_is_list else None
    crit_rows = criteria if crit_is_list else []
    criterion_ids = _ids(crit_rows, "criterion_id")

    po_lines, has_po = _get(manifest, "purchase_order_lines")
    po_is_list = has_po and isinstance(po_lines, list)
    po_count = len(po_lines) if po_is_list else None
    po_rows = po_lines if po_is_list else []
    po_ids = _ids(po_rows, "line_id")
    po_by_id = _by_id(po_rows, "line_id")

    receipt_lines, has_receipt = _get(manifest, "receipt_lines")
    receipt_is_list = has_receipt and isinstance(receipt_lines, list)
    receipt_count = len(receipt_lines) if receipt_is_list else None
    receipt_rows = receipt_lines if receipt_is_list else []
    receipt_ids = _ids(receipt_rows, "line_id")
    receipt_by_id = _by_id(receipt_rows, "line_id")

    invoice_lines, has_invoice = _get(manifest, "invoice_lines")
    invoice_is_list = has_invoice and isinstance(invoice_lines, list)
    invoice_count = len(invoice_lines) if invoice_is_list else None
    invoice_rows = invoice_lines if invoice_is_list else []
    invoice_ids = _ids(invoice_rows, "line_id")
    invoice_by_id = _by_id(invoice_rows, "line_id")

    po_total_declared, has_po_total = _get(
        manifest, "three_way_match", "purchase_order_total_declared")
    invoice_total_declared, has_invoice_total = _get(
        manifest, "three_way_match", "invoice_total_declared")

    duplicate_vendor_ids = (
        _duplicates(vend_rows, "vendor_id") if vend_is_list else None)
    duplicate_criterion_ids = (
        _duplicates(crit_rows, "criterion_id") if crit_is_list else None)
    duplicate_po_line_ids = (
        _duplicates(po_rows, "line_id") if po_is_list else None)
    duplicate_receipt_line_ids = (
        _duplicates(receipt_rows, "line_id") if receipt_is_list else None)
    duplicate_invoice_line_ids = (
        _duplicates(invoice_rows, "line_id") if invoice_is_list else None)

    vendors_without_name = (
        [_row_name(c, "vendor_id") for c in vend_rows
         if _has(c, "vendor_name") and not _nonempty_str(c.get("vendor_name"))]
        if vend_is_list else None)
    vendors_without_evidence_note = (
        [_row_name(c, "vendor_id") for c in vend_rows
         if _has(c, "evidence_note")
         and not _nonempty_str(c.get("evidence_note"))]
        if vend_is_list else None)
    criteria_without_name = (
        [_row_name(c, "criterion_id") for c in crit_rows
         if _has(c, "criterion_name")
         and not _nonempty_str(c.get("criterion_name"))]
        if crit_is_list else None)
    criteria_with_invalid_weight = (
        [_row_name(c, "criterion_id") for c in crit_rows
         if _has(c, "weight")
         and not (_is_num(c.get("weight")) and c.get("weight") >= 0)]
        if crit_is_list else None)

    weight_by_criterion = {}
    if crit_is_list:
        for c in crit_rows:
            if (isinstance(c, dict)
                    and isinstance(c.get("criterion_id"), str)
                    and _is_num(c.get("weight"))):
                weight_by_criterion[c["criterion_id"]] = c["weight"]
    weights_sum = None
    if crit_is_list:
        weights_sum = 0.0
        for cid in weight_by_criterion:
            weights_sum += weight_by_criterion[cid]

    def _score_ids(c):
        scores = c.get("scores") if isinstance(c, dict) else None
        if not isinstance(scores, list):
            return None
        return [s["criterion_id"] for s in scores
                if isinstance(s, dict)
                and isinstance(s.get("criterion_id"), str)]

    def _scores_cover(c):
        sids = _score_ids(c)
        if sids is None:
            return False
        return (len(sids) == len(criterion_ids)
                and len(set(sids)) == len(sids)
                and all(sid in criterion_ids for sid in sids)
                and all(cid in sids for cid in criterion_ids))

    def _recomputed_total(c):
        scores = c.get("scores") if isinstance(c, dict) else None
        if not isinstance(scores, list):
            return None
        total_val = 0.0
        for s in scores:
            if (isinstance(s, dict)
                    and isinstance(s.get("criterion_id"), str)
                    and s.get("criterion_id") in weight_by_criterion
                    and _is_num(s.get("score"))):
                total_val += weight_by_criterion[s["criterion_id"]] * s["score"]
        return total_val

    def _total_matches(c):
        if not _has(c, "weighted_total_declared"):
            return False
        rec = _recomputed_total(c)
        if rec is None:
            return False
        declared = c.get("weighted_total_declared")
        if not _is_num(declared):
            return False
        return _fmt6(rec) == _fmt6(declared)

    vendors_with_incomplete_scores = (
        [_row_name(c, "vendor_id") for c in vend_rows
         if _has(c, "scores") and not _scores_cover(c)]
        if vend_is_list and crit_is_list else None)
    vendors_with_total_mismatch = (
        [_row_name(c, "vendor_id") for c in vend_rows
         if _has(c, "weighted_total_declared") and _has(c, "scores")
         and not _total_matches(c)]
        if vend_is_list and crit_is_list else None)

    def _line_total_recomputes(row):
        if not (_has(row, "quantity") and _has(row, "unit_price")
                and _has(row, "line_total_declared")):
            return False
        if not (_is_num(row.get("quantity"))
                and _is_num(row.get("unit_price"))
                and _is_num(row.get("line_total_declared"))):
            return False
        return (_fmt6(row["quantity"] * row["unit_price"])
                == _fmt6(row["line_total_declared"]))

    po_lines_with_total_mismatch = (
        [_row_name(c, "line_id") for c in po_rows
         if _has(c, "line_total_declared") and _has(c, "quantity")
         and _has(c, "unit_price") and not _line_total_recomputes(c)]
        if po_is_list else None)
    invoice_lines_with_total_mismatch = (
        [_row_name(c, "line_id") for c in invoice_rows
         if _has(c, "line_total_declared") and _has(c, "quantity")
         and _has(c, "unit_price") and not _line_total_recomputes(c)]
        if invoice_is_list else None)

    def _missing_and_extra(base_ids, other_ids):
        missing = []
        for lid in base_ids:
            if lid not in other_ids and lid not in missing:
                missing.append(lid)
        extra = []
        for lid in other_ids:
            if lid not in base_ids and lid not in extra:
                extra.append(lid)
        return missing, extra

    po_missing_from_receipt = None
    receipt_extra = None
    if po_is_list and receipt_is_list:
        po_missing_from_receipt, receipt_extra = _missing_and_extra(
            po_ids, receipt_ids)
    po_missing_from_invoice = None
    invoice_extra = None
    if po_is_list and invoice_is_list:
        po_missing_from_invoice, invoice_extra = _missing_and_extra(
            po_ids, invoice_ids)

    def _quantity_agrees(line_id):
        rows = [po_by_id.get(line_id), receipt_by_id.get(line_id),
                invoice_by_id.get(line_id)]
        if any(r is None for r in rows):
            return None
        if any(not _is_num(r.get("quantity")) for r in rows):
            return None
        vals = {_fmt6(r["quantity"]) for r in rows}
        return len(vals) == 1

    quantity_mismatch_ids = None
    if po_is_list and receipt_is_list and invoice_is_list:
        quantity_mismatch_ids = []
        for lid in po_ids:
            if lid in receipt_by_id and lid in invoice_by_id:
                agree = _quantity_agrees(lid)
                if agree is False and lid not in quantity_mismatch_ids:
                    quantity_mismatch_ids.append(lid)

    price_mismatch_ids = None
    if po_is_list and invoice_is_list:
        price_mismatch_ids = []
        for lid in po_ids:
            if lid in invoice_by_id:
                po_row = po_by_id[lid]
                inv_row = invoice_by_id[lid]
                if (_is_num(po_row.get("unit_price"))
                        and _is_num(inv_row.get("unit_price"))
                        and _fmt6(po_row["unit_price"])
                        != _fmt6(inv_row["unit_price"])
                        and lid not in price_mismatch_ids):
                    price_mismatch_ids.append(lid)

    def _lines_total(rows):
        total = 0.0
        for c in rows:
            if isinstance(c, dict) and _is_num(c.get("line_total_declared")):
                total += c["line_total_declared"]
        return total

    po_lines_total = _lines_total(po_rows) if po_is_list else None
    invoice_lines_total = (
        _lines_total(invoice_rows) if invoice_is_list else None)

    score_coverage_ratio = (
        sum(1 for c in vend_rows if _scores_cover(c)) / vend_count
        if vend_is_list and crit_is_list and vend_count > 0 else None)
    weighted_total_match_ratio = (
        sum(1 for c in vend_rows if _total_matches(c)) / vend_count
        if vend_is_list and crit_is_list and vend_count > 0 else None)
    vendor_evidence_ratio = (
        sum(1 for c in vend_rows
            if _nonempty_str(c.get("evidence_note"))) / vend_count
        if vend_is_list and vend_count > 0 else None)
    quantity_match_ratio = None
    if (po_is_list and receipt_is_list and invoice_is_list
            and po_count > 0):
        matched = 0
        for lid in po_ids:
            if _quantity_agrees(lid) is True:
                matched += 1
        quantity_match_ratio = matched / po_count
    amount_match_ratio = None
    if po_is_list and invoice_is_list and po_count > 0:
        matched = 0
        for lid in po_ids:
            if lid in invoice_by_id:
                po_row = po_by_id[lid]
                inv_row = invoice_by_id[lid]
                if (_is_num(po_row.get("line_total_declared"))
                        and _is_num(inv_row.get("line_total_declared"))
                        and _fmt6(po_row["line_total_declared"])
                        == _fmt6(inv_row["line_total_declared"])):
                    matched += 1
        amount_match_ratio = matched / po_count

    # ---- Section 1: spec_and_sourcing ----
    _bool_check(results, "spec_and_sourcing",
                "vendor_evaluation_spec_written_before_quotes", manifest,
                ("spec", "spec_written_before_quotes"),
                "spec: a written specification existed before quotes were sought — buy to spec, not to brochure")
    _bool_check(results, "spec_and_sourcing",
                "vendor_evaluation_spec_includes_functional_requirements",
                manifest, ("spec", "spec_includes_functional_requirements"),
                "spec: the specification includes the functional requirements")
    _bool_check(results, "spec_and_sourcing",
                "vendor_evaluation_spec_includes_compliance_requirements",
                manifest, ("spec", "spec_includes_compliance_requirements"),
                "spec: the specification includes the compliance requirements")
    _bool_check(results, "spec_and_sourcing",
                "vendor_evaluation_spec_includes_interface_requirements",
                manifest, ("spec", "spec_includes_interface_requirements"),
                "spec: the specification includes the interface requirements")
    _bool_check(results, "spec_and_sourcing",
                "vendor_evaluation_quotes_comparable_same_scope_declared",
                manifest,
                ("sourcing", "quotes_comparable_same_scope_declared"),
                "sourcing: the quotes obtained are declared comparable — same scope, quantities, delivery, terms and warranty")
    _gated_bool_check(
        results, "spec_and_sourcing",
        "vendor_evaluation_single_source_justification_recorded_where_single_source_used",
        manifest,
        ("sourcing", "single_source_used"),
        ("sourcing", "single_source_justification_recorded"),
        "sourcing: the single-source decision is justified in writing",
        "no single-source purchase declared used")

    # ---- Section 2: vendor_evaluation_and_total_cost ----
    _bool_check(results, "vendor_evaluation_and_total_cost",
                "vendor_evaluation_criteria_set_before_scoring", manifest,
                ("evaluation_setup", "criteria_set_before_scoring"),
                "evaluation: the weighted criteria were set BEFORE scoring")
    _bool_check(results, "vendor_evaluation_and_total_cost",
                "vendor_evaluation_tco_evaluation_documented", manifest,
                ("evaluation_setup", "tco_evaluation_documented"),
                "total cost: the total-cost-of-ownership evaluation is documented — total cost, not price")
    _bool_check(results, "vendor_evaluation_and_total_cost",
                "vendor_evaluation_tco_includes_acquisition_cost", manifest,
                ("evaluation_setup", "tco_includes_acquisition_cost"),
                "total cost: acquisition cost is included in the total-cost evaluation")
    _bool_check(results, "vendor_evaluation_and_total_cost",
                "vendor_evaluation_tco_includes_operations_cost", manifest,
                ("evaluation_setup", "tco_includes_operations_cost"),
                "total cost: operations cost is included in the total-cost evaluation")
    _bool_check(results, "vendor_evaluation_and_total_cost",
                "vendor_evaluation_tco_includes_spares_cost", manifest,
                ("evaluation_setup", "tco_includes_spares_cost"),
                "total cost: spares cost is included in the total-cost evaluation")
    _bool_check(results, "vendor_evaluation_and_total_cost",
                "vendor_evaluation_tco_includes_support_cost", manifest,
                ("evaluation_setup", "tco_includes_support_cost"),
                "total cost: support cost is included in the total-cost evaluation")
    _bool_check(results, "vendor_evaluation_and_total_cost",
                "vendor_evaluation_tco_includes_switching_cost", manifest,
                ("evaluation_setup", "tco_includes_switching_cost"),
                "total cost: switching cost is included in the total-cost evaluation")
    _bool_check(results, "vendor_evaluation_and_total_cost",
                "vendor_evaluation_evidence_basis_recorded", manifest,
                ("evaluation_setup", "evidence_basis_recorded"),
                "evaluation: the evidence basis for the vendor evaluation is recorded")
    _bool_check(results, "vendor_evaluation_and_total_cost",
                "vendor_evaluation_applied_consistently_across_vendors",
                manifest,
                ("evaluation_setup",
                 "evaluation_applied_consistently_across_vendors"),
                "evaluation: the same criteria and evidence basis were applied consistently across all vendors")
    _check(results, "vendor_evaluation_and_total_cost",
           "vendor_evaluation_vendors_list_declared", vendors,
           vend_is_list, vend_is_list and vend_count >= 2,
           "vendors: the declared record names its evaluated vendors — the list is present and names at least two vendors; an absent list is missing evidence and a list of fewer than two declares no comparison at all")
    vend_id_present = vend_is_list and all(
        _has(c, "vendor_id") for c in vend_rows)
    _check(results, "vendor_evaluation_and_total_cost",
           "every_vendor_evaluation_vendor_id_unique", vendors,
           vend_id_present,
           vend_is_list and duplicate_vendor_ids is not None
           and len(duplicate_vendor_ids) == 0,
           "vendors: no declared vendor_id is owned by more than one row")
    vend_name_present = vend_is_list and all(
        _has(c, "vendor_name") for c in vend_rows)
    _check(results, "vendor_evaluation_and_total_cost",
           "every_vendor_evaluation_vendor_name_declared", vendors,
           vend_name_present,
           vend_is_list
           and all(_nonempty_str(c.get("vendor_name")) for c in vend_rows),
           "vendors: every declared vendor declares a non-empty vendor name")
    evidence_present = vend_is_list and all(
        _has(c, "evidence_note") for c in vend_rows)
    _check(results, "vendor_evaluation_and_total_cost",
           "every_vendor_evaluation_vendor_evidence_note_declared", vendors,
           evidence_present,
           vend_is_list
           and all(_nonempty_str(c.get("evidence_note")) for c in vend_rows),
           "vendors: every declared vendor declares a non-empty evidence note")
    _check(results, "vendor_evaluation_and_total_cost",
           "vendor_evaluation_criteria_list_declared", criteria,
           crit_is_list, crit_is_list and crit_count > 0,
           "criteria: the declared record names its evaluation criteria — the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no evaluation at all")
    crit_id_present = crit_is_list and all(
        _has(c, "criterion_id") for c in crit_rows)
    _check(results, "vendor_evaluation_and_total_cost",
           "every_vendor_evaluation_criterion_id_unique", criteria,
           crit_id_present,
           crit_is_list and duplicate_criterion_ids is not None
           and len(duplicate_criterion_ids) == 0,
           "criteria: no declared criterion_id is owned by more than one row")
    crit_name_present = crit_is_list and all(
        _has(c, "criterion_name") for c in crit_rows)
    _check(results, "vendor_evaluation_and_total_cost",
           "every_vendor_evaluation_criterion_name_declared", criteria,
           crit_name_present,
           crit_is_list
           and all(_nonempty_str(c.get("criterion_name")) for c in crit_rows),
           "criteria: every declared criterion declares a non-empty criterion name")
    weight_present = crit_is_list and all(
        _has(c, "weight") for c in crit_rows)
    _check(results, "vendor_evaluation_and_total_cost",
           "every_vendor_evaluation_criterion_weight_non_negative", criteria,
           weight_present,
           crit_is_list
           and all(_is_num(c.get("weight")) and c.get("weight") >= 0
                   for c in crit_rows),
           "criteria: every declared criterion declares a non-negative weight")
    _check(results, "vendor_evaluation_and_total_cost",
           "vendor_evaluation_criteria_weights_sum_positive", criteria,
           weight_present,
           crit_is_list and weights_sum is not None and weights_sum > 0,
           "criteria: the declared criterion weights sum to a positive total — an evaluation whose weights sum to zero scores nothing")
    scores_present = (vend_is_list and crit_is_list
                      and all(_has(c, "scores") for c in vend_rows)
                      and all(_has(c, "criterion_id") for c in crit_rows)
                      and all(isinstance(s, dict) and _has(s, "criterion_id")
                              for c in vend_rows
                              if isinstance(c.get("scores"), list)
                              for s in c["scores"]))
    _check(results, "vendor_evaluation_and_total_cost",
           "every_vendor_evaluation_vendor_scores_every_declared_criterion",
           vendors, scores_present,
           vend_is_list and crit_is_list
           and all(_scores_cover(c) for c in vend_rows),
           "scores: every declared vendor scores every declared criterion and no other criterion, exactly once")
    totals_present = (vend_is_list and crit_is_list
                      and all(_has(c, "weighted_total_declared")
                              for c in vend_rows)
                      and all(_has(c, "scores") for c in vend_rows)
                      and all(_has(c, "weight") for c in crit_rows)
                      and all(_has(c, "criterion_id") for c in crit_rows))
    _check(results, "vendor_evaluation_and_total_cost",
           "every_vendor_evaluation_vendor_weighted_total_recomputes",
           vendors, totals_present,
           vend_is_list and crit_is_list
           and all(_total_matches(c) for c in vend_rows),
           "scores: every declared vendor's declared weighted total recomputes exactly as the sum of declared weight times declared score over its declared scores")

    # ---- Section 3: contract_and_terms ----
    _bool_check(results, "contract_and_terms",
                "vendor_evaluation_contract_exclusions_reviewed", manifest,
                ("contract", "exclusions_reviewed"),
                "contract care: the quote and contract exclusions were read and reviewed")
    _bool_check(results, "contract_and_terms",
                "vendor_evaluation_contract_payment_terms_reviewed", manifest,
                ("contract", "payment_terms_reviewed"),
                "contract care: the payment terms were read and reviewed")
    _bool_check(results, "contract_and_terms",
                "vendor_evaluation_contract_penalties_reviewed", manifest,
                ("contract", "penalties_reviewed"),
                "contract care: the penalties were read and reviewed")
    _bool_check(results, "contract_and_terms",
                "vendor_evaluation_contract_warranty_reviewed", manifest,
                ("contract", "warranty_reviewed"),
                "contract care: the warranty was read and reviewed")
    _bool_check(results, "contract_and_terms",
                "vendor_evaluation_contract_price_escalation_clauses_reviewed",
                manifest, ("contract", "price_escalation_clauses_reviewed"),
                "contract care: the price-escalation clauses were read and reviewed")
    _bool_check(results, "contract_and_terms",
                "vendor_evaluation_contract_binding_terms_reviewed", manifest,
                ("contract", "binding_terms_reviewed"),
                "contract care: the binding terms were reviewed — binding terms get review")

    # ---- Section 4: purchase_order_discipline ----
    _bool_check(results, "purchase_order_discipline",
                "vendor_evaluation_po_issued_before_delivery", manifest,
                ("po_discipline", "po_issued_before_delivery"),
                "PO discipline: the purchase order was issued before delivery")
    _bool_check(results, "purchase_order_discipline",
                "vendor_evaluation_po_changes_via_change_order_declared",
                manifest, ("po_discipline", "changes_via_change_order_declared"),
                "PO discipline: changes to the purchase order were made via change order")
    _bool_check(results, "purchase_order_discipline",
                "vendor_evaluation_verbal_commitments_papered_same_day_declared",
                manifest,
                ("po_discipline",
                 "verbal_commitments_papered_same_day_declared"),
                "PO discipline: no verbal commitments stand unpapered — any verbal commitment was papered the same day")
    _bool_check(results, "purchase_order_discipline",
                "vendor_evaluation_po_references_spec_declared", manifest,
                ("po_discipline", "po_references_spec_declared"),
                "PO discipline: the purchase order references the written specification it buys to")

    # ---- Section 5: three_way_match ----
    _bool_check(results, "three_way_match",
                "vendor_evaluation_three_way_match_performed_before_payment_declared",
                manifest,
                ("three_way_match", "match_performed_before_payment_declared"),
                "3-way match: the three-way match (PO ↔ receipt/inspection ↔ invoice) was performed before payment")
    _bool_check(results, "three_way_match",
                "vendor_evaluation_three_way_discrepancies_resolved_before_payment_declared",
                manifest,
                ("three_way_match",
                 "discrepancies_resolved_before_payment_declared"),
                "3-way match: discrepancies were resolved first, before payment")
    _bool_check(results, "three_way_match",
                "vendor_evaluation_inspection_against_spec_on_arrival_declared",
                manifest,
                ("three_way_match",
                 "inspection_against_spec_on_arrival_declared"),
                "receipt: the delivery was inspected against spec on arrival, not after install")
    _bool_check(results, "three_way_match",
                "vendor_evaluation_receipt_verification_before_payment_declared",
                manifest,
                ("three_way_match",
                 "receipt_verification_before_payment_declared"),
                "receipt: receipt verification stands before payment — nothing is paid without receipt verification")
    _check(results, "three_way_match",
           "vendor_evaluation_purchase_order_lines_declared", po_lines,
           po_is_list, po_is_list and po_count > 0,
           "purchase order lines: the declared record names its purchase-order lines — the list is present and names at least one line; an absent list is missing evidence and an empty list declares no purchase at all")
    po_id_present = po_is_list and all(
        _has(c, "line_id") for c in po_rows)
    _check(results, "three_way_match",
           "every_vendor_evaluation_purchase_order_line_id_unique", po_lines,
           po_id_present,
           po_is_list and duplicate_po_line_ids is not None
           and len(duplicate_po_line_ids) == 0,
           "purchase order lines: no declared line_id is owned by more than one purchase-order row")
    receipt_id_present = receipt_is_list and all(
        _has(c, "line_id") for c in receipt_rows)
    _check(results, "three_way_match",
           "every_vendor_evaluation_receipt_line_id_unique", receipt_lines,
           receipt_id_present,
           receipt_is_list and duplicate_receipt_line_ids is not None
           and len(duplicate_receipt_line_ids) == 0,
           "receipt lines: no declared line_id is owned by more than one receipt row")
    invoice_id_present = invoice_is_list and all(
        _has(c, "line_id") for c in invoice_rows)
    _check(results, "three_way_match",
           "every_vendor_evaluation_invoice_line_id_unique", invoice_lines,
           invoice_id_present,
           invoice_is_list and duplicate_invoice_line_ids is not None
           and len(duplicate_invoice_line_ids) == 0,
           "invoice lines: no declared line_id is owned by more than one invoice row")
    po_total_fields_present = po_is_list and all(
        _has(c, "quantity") and _has(c, "unit_price")
        and _has(c, "line_total_declared") for c in po_rows)
    _check(results, "three_way_match",
           "every_vendor_evaluation_purchase_order_line_total_recomputes",
           po_lines, po_total_fields_present,
           po_is_list and all(_line_total_recomputes(c) for c in po_rows),
           "purchase order lines: every declared purchase-order line total recomputes exactly as declared quantity times declared unit price")
    invoice_total_fields_present = invoice_is_list and all(
        _has(c, "quantity") and _has(c, "unit_price")
        and _has(c, "line_total_declared") for c in invoice_rows)
    _check(results, "three_way_match",
           "every_vendor_evaluation_invoice_line_total_recomputes",
           invoice_lines, invoice_total_fields_present,
           invoice_is_list
           and all(_line_total_recomputes(c) for c in invoice_rows),
           "invoice lines: every declared invoice line total recomputes exactly as declared quantity times declared unit price")
    receipt_coverage_present = (
        po_is_list and receipt_is_list
        and all(_has(c, "line_id") for c in po_rows)
        and all(_has(c, "line_id") for c in receipt_rows))
    _check(results, "three_way_match",
           "vendor_evaluation_receipt_lines_cover_purchase_order_lines_exactly",
           receipt_lines, receipt_coverage_present,
           receipt_coverage_present and po_missing_from_receipt == []
           and receipt_extra == [] and duplicate_receipt_line_ids == []
           and receipt_count == po_count,
           "3-way match: the declared receipt line ids are exactly the declared purchase-order line ids — none missing, none extra, none duplicated")
    invoice_coverage_present = (
        po_is_list and invoice_is_list
        and all(_has(c, "line_id") for c in po_rows)
        and all(_has(c, "line_id") for c in invoice_rows))
    _check(results, "three_way_match",
           "vendor_evaluation_invoice_lines_cover_purchase_order_lines_exactly",
           invoice_lines, invoice_coverage_present,
           invoice_coverage_present and po_missing_from_invoice == []
           and invoice_extra == [] and duplicate_invoice_line_ids == []
           and invoice_count == po_count,
           "3-way match: the declared invoice line ids are exactly the declared purchase-order line ids — none missing, none extra, none duplicated")
    quantity_fields_present = (
        po_is_list and receipt_is_list and invoice_is_list
        and all(_has(c, "line_id") and _has(c, "quantity") for c in po_rows)
        and all(_has(c, "line_id") and _has(c, "quantity")
                for c in receipt_rows)
        and all(_has(c, "line_id") and _has(c, "quantity")
                for c in invoice_rows))
    _check(results, "three_way_match",
           "every_vendor_evaluation_three_way_line_quantity_matches_across_documents",
           po_lines, quantity_fields_present,
           quantity_fields_present and quantity_mismatch_ids == []
           and po_missing_from_receipt == [] and receipt_extra == []
           and po_missing_from_invoice == [] and invoice_extra == [],
           "3-way match: for every declared line, the declared quantity agrees across purchase order, receipt and invoice")
    price_fields_present = (
        po_is_list and invoice_is_list
        and all(_has(c, "line_id") and _has(c, "unit_price") for c in po_rows)
        and all(_has(c, "line_id") and _has(c, "unit_price")
                for c in invoice_rows))
    _check(results, "three_way_match",
           "every_vendor_evaluation_three_way_line_unit_price_matches_po_to_invoice",
           po_lines, price_fields_present,
           price_fields_present and price_mismatch_ids == []
           and po_missing_from_invoice == [] and invoice_extra == [],
           "3-way match: for every declared line, the declared unit price on the invoice agrees with the declared unit price on the purchase order")
    po_grand_present = (
        has_po_total and po_is_list
        and all(_has(c, "line_total_declared") for c in po_rows))
    _check(results, "three_way_match",
           "vendor_evaluation_purchase_order_total_recomputes_from_line_totals",
           po_total_declared, po_grand_present,
           po_grand_present and _is_num(po_total_declared)
           and po_lines_total is not None
           and _fmt6(po_lines_total) == _fmt6(po_total_declared),
           "purchase order total: the declared purchase-order grand total recomputes exactly as the sum of the declared purchase-order line totals")
    invoice_grand_present = (
        has_invoice_total and invoice_is_list
        and all(_has(c, "line_total_declared") for c in invoice_rows))
    _check(results, "three_way_match",
           "vendor_evaluation_invoice_total_recomputes_from_line_totals",
           invoice_total_declared, invoice_grand_present,
           invoice_grand_present and _is_num(invoice_total_declared)
           and invoice_lines_total is not None
           and _fmt6(invoice_lines_total) == _fmt6(invoice_total_declared),
           "invoice total: the declared invoice grand total recomputes exactly as the sum of the declared invoice line totals")
    grand_match_present = has_po_total and has_invoice_total
    _check(results, "three_way_match",
           "vendor_evaluation_three_way_grand_totals_match",
           po_total_declared, grand_match_present,
           grand_match_present and _is_num(po_total_declared)
           and _is_num(invoice_total_declared)
           and _fmt6(po_total_declared) == _fmt6(invoice_total_declared),
           "3-way match: the declared purchase-order grand total and the declared invoice grand total agree — the atom checks only that the declared totals agree; it approves no payment")

    # ---- Section 6: vendor_records_and_performance ----
    _bool_check(results, "vendor_records_and_performance",
                "vendor_evaluation_vendor_terms_recorded", manifest,
                ("vendor_records", "vendor_terms_recorded"),
                "vendor records: the vendor's terms are kept on record")
    _bool_check(results, "vendor_records_and_performance",
                "vendor_evaluation_vendor_contacts_recorded", manifest,
                ("vendor_records", "vendor_contacts_recorded"),
                "vendor records: the vendor's contacts are kept on record")
    _bool_check(results, "vendor_records_and_performance",
                "vendor_evaluation_performance_log_maintained", manifest,
                ("vendor_records", "performance_log_maintained"),
                "vendor records: a vendor performance log is maintained")
    _bool_check(results, "vendor_records_and_performance",
                "vendor_evaluation_performance_log_covers_on_time_quality_responsiveness",
                manifest,
                ("vendor_records",
                 "performance_log_covers_on_time_quality_responsiveness"),
                "vendor records: the performance log covers on-time delivery, quality and responsiveness")
    _bool_check(results, "vendor_records_and_performance",
                "vendor_evaluation_annual_review_cadence_set", manifest,
                ("vendor_records", "annual_review_cadence_set"),
                "vendor records: an annual vendor review cadence is set")
    _bool_check(results, "vendor_records_and_performance",
                "vendor_evaluation_two_viable_sources_for_critical_items_declared",
                manifest,
                ("vendor_records",
                 "two_viable_sources_for_critical_items_declared"),
                "vendor records: two viable sources are kept for critical items where feasible, as declared")
    _bool_check(results, "vendor_records_and_performance",
                "vendor_evaluation_banking_detail_changes_verified_via_known_contacts",
                manifest,
                ("vendor_records",
                 "banking_detail_changes_verified_via_known_contacts"),
                "fraud hygiene: banking-detail changes are verified via known contacts — never through email links")
    _bool_check(results, "vendor_records_and_performance",
                "vendor_evaluation_segregation_of_duties_declared", manifest,
                ("vendor_records", "segregation_of_duties_declared"),
                "fraud hygiene: segregation of duties is in place where possible, as declared")
    _bool_check(results, "vendor_records_and_performance",
                "vendor_evaluation_gifts_conflict_policy_respected_declared",
                manifest,
                ("vendor_records",
                 "gifts_conflict_policy_respected_declared"),
                "fraud hygiene: the gifts and conflict-of-interest policy is respected, as declared")

    # ---- Section 7: red_lines ----
    _false_check(results, "red_lines",
                 "vendor_evaluation_free_of_po_less_purchase_above_threshold",
                 manifest,
                 ("red_lines", "po_less_purchase_above_threshold_present"),
                 "red line: no PO-less purchase above threshold is present in the record")
    _false_check(results, "red_lines",
                 "vendor_evaluation_free_of_payment_without_delivery_confirmation",
                 manifest,
                 ("red_lines",
                  "payment_without_delivery_confirmation_present"),
                 "red line: no payment without delivery confirmation is present in the record")
    _false_check(results, "red_lines",
                 "vendor_evaluation_free_of_payment_before_three_way_match",
                 manifest,
                 ("red_lines", "payment_before_three_way_match_present"),
                 "red line: no payment made before the three-way match is present in the record")
    _false_check(results, "red_lines",
                 "vendor_evaluation_free_of_silent_bank_detail_change",
                 manifest,
                 ("red_lines", "silent_bank_detail_change_present"),
                 "red line: no silent bank-detail change is present in the record — bank-detail changes are verified through known channels always")

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
        verdict = "VENDOR_EVALUATION_AND_MATCH_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "VENDOR_EVALUATION_AND_MATCH_SOUND"

    computed_names = (
        "vendor_evaluation_vendors_list_declared",
        "every_vendor_evaluation_vendor_id_unique",
        "every_vendor_evaluation_vendor_name_declared",
        "every_vendor_evaluation_vendor_evidence_note_declared",
        "vendor_evaluation_criteria_list_declared",
        "every_vendor_evaluation_criterion_id_unique",
        "every_vendor_evaluation_criterion_name_declared",
        "every_vendor_evaluation_criterion_weight_non_negative",
        "vendor_evaluation_criteria_weights_sum_positive",
        "every_vendor_evaluation_vendor_scores_every_declared_criterion",
        "every_vendor_evaluation_vendor_weighted_total_recomputes",
        "vendor_evaluation_purchase_order_lines_declared",
        "every_vendor_evaluation_purchase_order_line_id_unique",
        "every_vendor_evaluation_receipt_line_id_unique",
        "every_vendor_evaluation_invoice_line_id_unique",
        "every_vendor_evaluation_purchase_order_line_total_recomputes",
        "every_vendor_evaluation_invoice_line_total_recomputes",
        "vendor_evaluation_receipt_lines_cover_purchase_order_lines_exactly",
        "vendor_evaluation_invoice_lines_cover_purchase_order_lines_exactly",
        "every_vendor_evaluation_three_way_line_quantity_matches_across_documents",
        "every_vendor_evaluation_three_way_line_unit_price_matches_po_to_invoice",
        "vendor_evaluation_purchase_order_total_recomputes_from_line_totals",
        "vendor_evaluation_invoice_total_recomputes_from_line_totals",
        "vendor_evaluation_three_way_grand_totals_match",
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
        "service": "vendor-evaluation-three-way-match-pack",
        "atom_version": "0.1.0",
        "pack_title": manifest.get("pack_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "vendor_evaluation_vendors_count": vend_count,
        "vendor_evaluation_criteria_count": crit_count,
        "purchase_order_lines_count": po_count,
        "receipt_lines_count": receipt_count,
        "invoice_lines_count": invoice_count,
        "duplicate_vendor_evaluation_vendor_ids": duplicate_vendor_ids,
        "duplicate_vendor_evaluation_criterion_ids": duplicate_criterion_ids,
        "duplicate_purchase_order_line_ids": duplicate_po_line_ids,
        "duplicate_receipt_line_ids": duplicate_receipt_line_ids,
        "duplicate_invoice_line_ids": duplicate_invoice_line_ids,
        "vendor_evaluation_vendors_without_name": vendors_without_name,
        "vendor_evaluation_vendors_without_evidence_note":
            vendors_without_evidence_note,
        "vendor_evaluation_criteria_without_name": criteria_without_name,
        "vendor_evaluation_criteria_with_invalid_weight":
            criteria_with_invalid_weight,
        "vendor_evaluation_vendors_with_incomplete_or_extra_scores":
            vendors_with_incomplete_scores,
        "vendor_evaluation_vendors_with_weighted_total_mismatch":
            vendors_with_total_mismatch,
        "purchase_order_lines_with_line_total_mismatch":
            po_lines_with_total_mismatch,
        "invoice_lines_with_line_total_mismatch":
            invoice_lines_with_total_mismatch,
        "purchase_order_line_ids_missing_from_receipt":
            po_missing_from_receipt,
        "receipt_line_ids_not_on_purchase_order": receipt_extra,
        "purchase_order_line_ids_missing_from_invoice":
            po_missing_from_invoice,
        "invoice_line_ids_not_on_purchase_order": invoice_extra,
        "three_way_lines_with_quantity_mismatch": quantity_mismatch_ids,
        "three_way_lines_with_unit_price_mismatch": price_mismatch_ids,
        "vendor_evaluation_criteria_weights_sum": _fmt6(weights_sum),
        "purchase_order_lines_total": _fmt6(po_lines_total),
        "invoice_lines_total": _fmt6(invoice_lines_total),
        "vendor_score_coverage_ratio": _fmt6(score_coverage_ratio),
        "vendor_weighted_total_match_ratio": _fmt6(weighted_total_match_ratio),
        "vendor_evidence_note_ratio": _fmt6(vendor_evidence_ratio),
        "three_way_quantity_match_ratio": _fmt6(quantity_match_ratio),
        "three_way_amount_match_ratio": _fmt6(amount_match_ratio),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "VENDOR EVALUATION THREE WAY MATCH PACK",
        f"pack_title: {verdict.get('pack_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: vendor_evaluation_three_way_match_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "VENDOR_EVALUATION_AND_MATCH_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
