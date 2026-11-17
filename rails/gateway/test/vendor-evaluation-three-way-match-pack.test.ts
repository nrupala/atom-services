import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/vendor-evaluation-three-way-match-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  pack_title: "q4-laptop-refresh",
  spec: { spec_written_before_quotes: true,
          spec_includes_functional_requirements: true,
          spec_includes_compliance_requirements: true,
          spec_includes_interface_requirements: true },
  sourcing: { quotes_comparable_same_scope_declared: true,
              single_source_used: false,
              single_source_justification_recorded: false },
  evaluation_setup: {
    criteria_set_before_scoring: true,
    tco_evaluation_documented: true,
    tco_includes_acquisition_cost: true,
    tco_includes_operations_cost: true,
    tco_includes_spares_cost: true,
    tco_includes_support_cost: true,
    tco_includes_switching_cost: true,
    evidence_basis_recorded: true,
    evaluation_applied_consistently_across_vendors: true },
  vendors: [
    { vendor_id: "vend-1", vendor_name: "Northwind Supply",
      evidence_note: "Quote and references recorded",
      scores: [{ criterion_id: "crit-1", score: 4 },
               { criterion_id: "crit-2", score: 5 },
               { criterion_id: "crit-3", score: 3 }],
      weighted_total_declared: 26 },
    { vendor_id: "vend-2", vendor_name: "Contoso Trading",
      evidence_note: "Quote and delivery terms recorded",
      scores: [{ criterion_id: "crit-1", score: 3 },
               { criterion_id: "crit-2", score: 4 },
               { criterion_id: "crit-3", score: 2 }],
      weighted_total_declared: 20 },
  ],
  criteria: [
    { criterion_id: "crit-1", criterion_name: "Total cost fit", weight: 2 },
    { criterion_id: "crit-2", criterion_name: "Delivery reliability", weight: 3 },
    { criterion_id: "crit-3", criterion_name: "Support quality", weight: 1 },
  ],
  contract: { exclusions_reviewed: true, payment_terms_reviewed: true,
              penalties_reviewed: true, warranty_reviewed: true,
              price_escalation_clauses_reviewed: true,
              binding_terms_reviewed: true },
  po_discipline: { po_issued_before_delivery: true,
                   changes_via_change_order_declared: true,
                   verbal_commitments_papered_same_day_declared: true,
                   po_references_spec_declared: true },
  three_way_match: {
    match_performed_before_payment_declared: true,
    discrepancies_resolved_before_payment_declared: true,
    inspection_against_spec_on_arrival_declared: true,
    receipt_verification_before_payment_declared: true,
    purchase_order_total_declared: 655,
    invoice_total_declared: 655 },
  purchase_order_lines: [
    { line_id: "line-1", quantity: 10, unit_price: 25.5,
      line_total_declared: 255 },
    { line_id: "line-2", quantity: 4, unit_price: 100,
      line_total_declared: 400 },
  ],
  receipt_lines: [
    { line_id: "line-1", quantity: 10 },
    { line_id: "line-2", quantity: 4 },
  ],
  invoice_lines: [
    { line_id: "line-1", quantity: 10, unit_price: 25.5,
      line_total_declared: 255 },
    { line_id: "line-2", quantity: 4, unit_price: 100,
      line_total_declared: 400 },
  ],
  vendor_records: {
    vendor_terms_recorded: true,
    vendor_contacts_recorded: true,
    performance_log_maintained: true,
    performance_log_covers_on_time_quality_responsiveness: true,
    annual_review_cadence_set: true,
    two_viable_sources_for_critical_items_declared: true,
    banking_detail_changes_verified_via_known_contacts: true,
    segregation_of_duties_declared: true,
    gifts_conflict_policy_respected_declared: true },
  red_lines: { po_less_purchase_above_threshold_present: false,
               payment_without_delivery_confirmation_present: false,
               payment_before_three_way_match_present: false,
               silent_bank_detail_change_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "VENDOR_EVALUATION_AND_MATCH_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 66);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.vendor_evaluation_vendors_count, 2);
  assert.equal(v.vendor_evaluation_criteria_count, 3);
  assert.equal(v.purchase_order_lines_count, 2);
  assert.deepEqual(v.duplicate_vendor_evaluation_vendor_ids, []);
  assert.equal(v.vendor_evaluation_criteria_weights_sum, "6.000000");
  assert.equal(v.purchase_order_lines_total, "655.000000");
  assert.equal(v.invoice_lines_total, "655.000000");
  assert.equal(v.vendor_score_coverage_ratio, "1.000000");
  assert.equal(v.three_way_quantity_match_ratio, "1.000000");
  assert.equal(v.three_way_amount_match_ratio, "1.000000");
});

test("test_spec_not_written_before_quotes_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.spec.spec_written_before_quotes = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "VENDOR_EVALUATION_AND_MATCH_NOT_SOUND");
  assert.equal(v.sections["spec_and_sourcing"], "fail");
  assert.equal(checkStatus(v, "vendor_evaluation_spec_written_before_quotes"), "fail");
});

test("test_single_source_without_justification_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.sourcing.single_source_used = true;
  assert.equal(checkStatus(evaluate(m), "vendor_evaluation_single_source_justification_recorded_where_single_source_used"), "fail");
});

test("test_no_single_source_passes_gated_as_na", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(checkStatus(v, "vendor_evaluation_single_source_justification_recorded_where_single_source_used"), "pass");
  assert.equal(v.verdict, "VENDOR_EVALUATION_AND_MATCH_SOUND");
});

test("test_duplicate_vendor_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.vendors[1].vendor_id = "vend-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_vendor_evaluation_vendor_id_unique"), "fail");
  assert.deepEqual(v.duplicate_vendor_evaluation_vendor_ids, ["vend-1"]);
});

test("test_single_vendor_fails_comparison", () => {
  const m = clone(COMPLETE) as any;
  m.vendors = m.vendors.slice(0, 1);
  assert.equal(checkStatus(evaluate(m), "vendor_evaluation_vendors_list_declared"), "fail");
});

test("test_absent_vendors_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.vendors;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "vendor_evaluation_vendors_list_declared"), "missing");
  assert.equal(v.vendor_evaluation_vendors_count, null);
  assert.equal(v.computed_status, null);
});

test("test_empty_evidence_note_fails", () => {
  const m = clone(COMPLETE) as any;
  m.vendors[1].evidence_note = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_vendor_evaluation_vendor_evidence_note_declared"), "fail");
  assert.deepEqual(v.vendor_evaluation_vendors_without_evidence_note, ["vend-2"]);
  assert.equal(v.vendor_evidence_note_ratio, "0.500000");
});

test("test_negative_weight_fails", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[0].weight = -1;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_vendor_evaluation_criterion_weight_non_negative"), "fail");
  assert.deepEqual(v.vendor_evaluation_criteria_with_invalid_weight, ["crit-1"]);
});

test("test_zero_weight_sum_fails", () => {
  const m = clone(COMPLETE) as any;
  for (const c of m.criteria) c.weight = 0;
  for (const vend of m.vendors) vend.weighted_total_declared = 0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "vendor_evaluation_criteria_weights_sum_positive"), "fail");
  assert.equal(v.vendor_evaluation_criteria_weights_sum, "0.000000");
});

test("test_missing_score_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.vendors[0].scores = m.vendors[0].scores.slice(0, 2);
  m.vendors[0].weighted_total_declared = 23;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_vendor_evaluation_vendor_scores_every_declared_criterion"), "fail");
  assert.deepEqual(v.vendor_evaluation_vendors_with_incomplete_or_extra_scores, ["vend-1"]);
  assert.equal(v.vendor_score_coverage_ratio, "0.500000");
});

test("test_weighted_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.vendors[1].weighted_total_declared = 21;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_vendor_evaluation_vendor_weighted_total_recomputes"), "fail");
  assert.deepEqual(v.vendor_evaluation_vendors_with_weighted_total_mismatch, ["vend-2"]);
  assert.equal(v.vendor_weighted_total_match_ratio, "0.500000");
});

test("test_criterion_missing_weight_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.criteria[0].weight;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_vendor_evaluation_criterion_weight_non_negative"), "missing");
});

test("test_exclusions_not_reviewed_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.contract.exclusions_reviewed = false;
  assert.equal(evaluate(m).sections["contract_and_terms"], "fail");
});

test("test_po_after_delivery_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.po_discipline.po_issued_before_delivery = false;
  const v = evaluate(m);
  assert.equal(v.sections["purchase_order_discipline"], "fail");
  assert.equal(checkStatus(v, "vendor_evaluation_po_issued_before_delivery"), "fail");
});

test("test_receipt_quantity_short_fails_quantity_match", () => {
  const m = clone(COMPLETE) as any;
  m.receipt_lines[1].quantity = 3;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_vendor_evaluation_three_way_line_quantity_matches_across_documents"), "fail");
  assert.deepEqual(v.three_way_lines_with_quantity_mismatch, ["line-2"]);
  assert.equal(v.three_way_quantity_match_ratio, "0.500000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_invoice_unit_price_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.invoice_lines[0].unit_price = 26;
  m.invoice_lines[0].line_total_declared = 260;
  m.three_way_match.invoice_total_declared = 660;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_vendor_evaluation_three_way_line_unit_price_matches_po_to_invoice"), "fail");
  assert.deepEqual(v.three_way_lines_with_unit_price_mismatch, ["line-1"]);
});

test("test_po_line_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.purchase_order_lines[0].line_total_declared = 250;
  m.three_way_match.purchase_order_total_declared = 650;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_vendor_evaluation_purchase_order_line_total_recomputes"), "fail");
  assert.deepEqual(v.purchase_order_lines_with_line_total_mismatch, ["line-1"]);
});

test("test_invoice_line_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.invoice_lines[1].line_total_declared = 401;
  m.three_way_match.invoice_total_declared = 656;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_vendor_evaluation_invoice_line_total_recomputes"), "fail");
  assert.deepEqual(v.invoice_lines_with_line_total_mismatch, ["line-2"]);
});

test("test_receipt_missing_line_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.receipt_lines = m.receipt_lines.slice(0, 1);
  const v = evaluate(m);
  assert.equal(checkStatus(v, "vendor_evaluation_receipt_lines_cover_purchase_order_lines_exactly"), "fail");
  assert.deepEqual(v.purchase_order_line_ids_missing_from_receipt, ["line-2"]);
});

test("test_invoice_extra_line_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.invoice_lines.push({ line_id: "line-9", quantity: 1, unit_price: 5, line_total_declared: 5 });
  m.three_way_match.invoice_total_declared = 660;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "vendor_evaluation_invoice_lines_cover_purchase_order_lines_exactly"), "fail");
  assert.deepEqual(v.invoice_line_ids_not_on_purchase_order, ["line-9"]);
});

test("test_duplicate_receipt_line_id_fails", () => {
  const m = clone(COMPLETE) as any;
  m.receipt_lines[1].line_id = "line-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_vendor_evaluation_receipt_line_id_unique"), "fail");
  assert.deepEqual(v.duplicate_receipt_line_ids, ["line-1"]);
});

test("test_po_grand_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.three_way_match.purchase_order_total_declared = 650;
  assert.equal(checkStatus(evaluate(m), "vendor_evaluation_purchase_order_total_recomputes_from_line_totals"), "fail");
});

test("test_grand_totals_disagree_fails", () => {
  const m = clone(COMPLETE) as any;
  m.three_way_match.invoice_total_declared = 650;
  assert.equal(checkStatus(evaluate(m), "vendor_evaluation_three_way_grand_totals_match"), "fail");
});

test("test_absent_receipt_lines_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.receipt_lines;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "vendor_evaluation_receipt_lines_cover_purchase_order_lines_exactly"), "missing");
  assert.equal(v.receipt_lines_count, null);
  assert.equal(v.three_way_quantity_match_ratio, null);
});

test("test_fractional_amounts_recompute_exactly", () => {
  const m = clone(COMPLETE) as any;
  m.purchase_order_lines[0].quantity = 3;
  m.purchase_order_lines[0].unit_price = 0.1;
  m.purchase_order_lines[0].line_total_declared = 0.3;
  m.receipt_lines[0].quantity = 3;
  m.invoice_lines[0].quantity = 3;
  m.invoice_lines[0].unit_price = 0.1;
  m.invoice_lines[0].line_total_declared = 0.3;
  m.three_way_match.purchase_order_total_declared = 400.3;
  m.three_way_match.invoice_total_declared = 400.3;
  const v = evaluate(m);
  assert.equal(v.verdict, "VENDOR_EVALUATION_AND_MATCH_SOUND");
  assert.equal(v.purchase_order_lines_total, "400.300000");
});

test("test_performance_log_not_maintained_fails_section6", () => {
  const m = clone(COMPLETE) as any;
  m.vendor_records.performance_log_maintained = false;
  assert.equal(evaluate(m).sections["vendor_records_and_performance"], "fail");
});

test("test_payment_without_delivery_confirmation_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.payment_without_delivery_confirmation_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "VENDOR_EVALUATION_AND_MATCH_NOT_SOUND");
});

test("test_silent_bank_detail_change_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.silent_bank_detail_change_present = true;
  assert.equal(checkStatus(evaluate(m), "vendor_evaluation_free_of_silent_bank_detail_change"), "fail");
});

test("test_po_less_purchase_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.po_less_purchase_above_threshold_present = true;
  assert.equal(checkStatus(evaluate(m), "vendor_evaluation_free_of_po_less_purchase_above_threshold"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.contract;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["contract_and_terms"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.vendor_evaluation_vendors_count, null);
  assert.equal(v.vendor_evaluation_criteria_weights_sum, null);
  assert.equal(v.three_way_quantity_match_ratio, null);
  assert.equal(v.purchase_order_lines_total, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: VENDOR_EVALUATION_AND_MATCH_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pack_title = 12345;
  assert.throws(() => evaluate(m), fieldError("pack_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ spec: "should-be-an-object" }), fieldError("spec"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ vendors: { vendor_id: "vend-1" } }), fieldError("vendors"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ criteria: ["crit-1"] }), fieldError("criteria[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.spec.spec_written_before_quotes = "yes";
  assert.throws(() => evaluate(m), fieldError("spec.spec_written_before_quotes"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[0].weight = "2";
  assert.throws(() => evaluate(m), fieldError("criteria[0].weight"));
});

test("malformed: nested score as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.vendors[0].scores[0].score = "4";
  assert.throws(() => evaluate(m), fieldError("vendors[0].scores[0].score"));
});

test("malformed: line quantity as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.purchase_order_lines[0].quantity = "10";
  assert.throws(() => evaluate(m), fieldError("purchase_order_lines[0].quantity"));
});

test("malformed: grand total as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.three_way_match.invoice_total_declared = "655";
  assert.throws(() => evaluate(m), fieldError("three_way_match.invoice_total_declared"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.vendor_records = null;
  assert.throws(() => evaluate(m), fieldError("vendor_records"));
});

// ---- Golden-fixture parity against the Python oracle ----

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "fixtures",
);

interface Fixture {
  name: string;
  manifest: unknown;
  expected: unknown;
}

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.startsWith("vendor-evaluation-three-way-match-pack--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
