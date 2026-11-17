// Vendor evaluation three-way match pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/vendor-evaluation-three-way-match-pack/src/vendor_evaluation_three_way_match_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed quantities use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  pack_title: "string",
  spec: {
    spec_written_before_quotes: "boolean",
    spec_includes_functional_requirements: "boolean",
    spec_includes_compliance_requirements: "boolean",
    spec_includes_interface_requirements: "boolean",
  },
  sourcing: {
    quotes_comparable_same_scope_declared: "boolean",
    single_source_used: "boolean",
    single_source_justification_recorded: "boolean",
  },
  evaluation_setup: {
    criteria_set_before_scoring: "boolean",
    tco_evaluation_documented: "boolean",
    tco_includes_acquisition_cost: "boolean",
    tco_includes_operations_cost: "boolean",
    tco_includes_spares_cost: "boolean",
    tco_includes_support_cost: "boolean",
    tco_includes_switching_cost: "boolean",
    evidence_basis_recorded: "boolean",
    evaluation_applied_consistently_across_vendors: "boolean",
  },
  vendors: [{
    vendor_id: "string",
    vendor_name: "string",
    evidence_note: "string",
    scores: [{
      criterion_id: "string",
      score: "number",
    }],
    weighted_total_declared: "number",
  }],
  criteria: [{
    criterion_id: "string",
    criterion_name: "string",
    weight: "number",
  }],
  contract: {
    exclusions_reviewed: "boolean",
    payment_terms_reviewed: "boolean",
    penalties_reviewed: "boolean",
    warranty_reviewed: "boolean",
    price_escalation_clauses_reviewed: "boolean",
    binding_terms_reviewed: "boolean",
  },
  po_discipline: {
    po_issued_before_delivery: "boolean",
    changes_via_change_order_declared: "boolean",
    verbal_commitments_papered_same_day_declared: "boolean",
    po_references_spec_declared: "boolean",
  },
  three_way_match: {
    match_performed_before_payment_declared: "boolean",
    discrepancies_resolved_before_payment_declared: "boolean",
    inspection_against_spec_on_arrival_declared: "boolean",
    receipt_verification_before_payment_declared: "boolean",
    purchase_order_total_declared: "number",
    invoice_total_declared: "number",
  },
  purchase_order_lines: [{
    line_id: "string",
    quantity: "number",
    unit_price: "number",
    line_total_declared: "number",
  }],
  receipt_lines: [{
    line_id: "string",
    quantity: "number",
  }],
  invoice_lines: [{
    line_id: "string",
    quantity: "number",
    unit_price: "number",
    line_total_declared: "number",
  }],
  vendor_records: {
    vendor_terms_recorded: "boolean",
    vendor_contacts_recorded: "boolean",
    performance_log_maintained: "boolean",
    performance_log_covers_on_time_quality_responsiveness: "boolean",
    annual_review_cadence_set: "boolean",
    two_viable_sources_for_critical_items_declared: "boolean",
    banking_detail_changes_verified_via_known_contacts: "boolean",
    segregation_of_duties_declared: "boolean",
    gifts_conflict_policy_respected_declared: "boolean",
  },
  red_lines: {
    po_less_purchase_above_threshold_present: "boolean",
    payment_without_delivery_confirmation_present: "boolean",
    payment_before_three_way_match_present: "boolean",
    silent_bank_detail_change_present: "boolean",
  },
};

export const SECTIONS = [
  "spec_and_sourcing",
  "vendor_evaluation_and_total_cost",
  "contract_and_terms",
  "purchase_order_discipline",
  "three_way_match",
  "vendor_records_and_performance",
  "red_lines",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  pack_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  vendor_evaluation_vendors_count: number | null;
  vendor_evaluation_criteria_count: number | null;
  purchase_order_lines_count: number | null;
  receipt_lines_count: number | null;
  invoice_lines_count: number | null;
  duplicate_vendor_evaluation_vendor_ids: string[] | null;
  duplicate_vendor_evaluation_criterion_ids: string[] | null;
  duplicate_purchase_order_line_ids: string[] | null;
  duplicate_receipt_line_ids: string[] | null;
  duplicate_invoice_line_ids: string[] | null;
  vendor_evaluation_vendors_without_name: string[] | null;
  vendor_evaluation_vendors_without_evidence_note: string[] | null;
  vendor_evaluation_criteria_without_name: string[] | null;
  vendor_evaluation_criteria_with_invalid_weight: string[] | null;
  vendor_evaluation_vendors_with_incomplete_or_extra_scores: string[] | null;
  vendor_evaluation_vendors_with_weighted_total_mismatch: string[] | null;
  purchase_order_lines_with_line_total_mismatch: string[] | null;
  invoice_lines_with_line_total_mismatch: string[] | null;
  purchase_order_line_ids_missing_from_receipt: string[] | null;
  receipt_line_ids_not_on_purchase_order: string[] | null;
  purchase_order_line_ids_missing_from_invoice: string[] | null;
  invoice_line_ids_not_on_purchase_order: string[] | null;
  three_way_lines_with_quantity_mismatch: string[] | null;
  three_way_lines_with_unit_price_mismatch: string[] | null;
  vendor_evaluation_criteria_weights_sum: string | null;
  purchase_order_lines_total: string | null;
  invoice_lines_total: string | null;
  vendor_score_coverage_ratio: string | null;
  vendor_weighted_total_match_ratio: string | null;
  vendor_evidence_note_ratio: string | null;
  three_way_quantity_match_ratio: string | null;
  three_way_amount_match_ratio: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function isNum(value: unknown): value is number {
  return typeof value === "number";
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && gate) {
    check(results, section, name, target, hasTarget, target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function idsOf(rows: unknown[], field: string): string[] {
  const out: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      out.push(c[field] as string);
    }
  }
  return out;
}

function byId(rows: unknown[], field: string): Map<string, Record<string, unknown>> {
  const out = new Map<string, Record<string, unknown>>();
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const key = c[field] as string;
      if (!out.has(key)) out.set(key, c);
    }
  }
  return out;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [vendorsRaw, hasVendors] = getPath(manifest, "vendors");
  const vendIsList = hasVendors && Array.isArray(vendorsRaw);
  const vendRows: unknown[] = vendIsList ? (vendorsRaw as unknown[]) : [];
  const vendCount: number | null = vendIsList ? vendRows.length : null;
  const vendorIds = idsOf(vendRows, "vendor_id");

  const [criteriaRaw, hasCriteria] = getPath(manifest, "criteria");
  const critIsList = hasCriteria && Array.isArray(criteriaRaw);
  const critRows: unknown[] = critIsList ? (criteriaRaw as unknown[]) : [];
  const critCount: number | null = critIsList ? critRows.length : null;
  const criterionIds = idsOf(critRows, "criterion_id");

  const [poRaw, hasPo] = getPath(manifest, "purchase_order_lines");
  const poIsList = hasPo && Array.isArray(poRaw);
  const poRows: unknown[] = poIsList ? (poRaw as unknown[]) : [];
  const poCount: number | null = poIsList ? poRows.length : null;
  const poIds = idsOf(poRows, "line_id");
  const poById = byId(poRows, "line_id");

  const [receiptRaw, hasReceipt] = getPath(manifest, "receipt_lines");
  const receiptIsList = hasReceipt && Array.isArray(receiptRaw);
  const receiptRows: unknown[] = receiptIsList ? (receiptRaw as unknown[]) : [];
  const receiptCount: number | null = receiptIsList ? receiptRows.length : null;
  const receiptIds = idsOf(receiptRows, "line_id");
  const receiptById = byId(receiptRows, "line_id");

  const [invoiceRaw, hasInvoice] = getPath(manifest, "invoice_lines");
  const invoiceIsList = hasInvoice && Array.isArray(invoiceRaw);
  const invoiceRows: unknown[] = invoiceIsList ? (invoiceRaw as unknown[]) : [];
  const invoiceCount: number | null = invoiceIsList ? invoiceRows.length : null;
  const invoiceIds = idsOf(invoiceRows, "line_id");
  const invoiceById = byId(invoiceRows, "line_id");

  const [poTotalDeclared, hasPoTotal] = getPath(
    manifest, "three_way_match", "purchase_order_total_declared");
  const [invoiceTotalDeclared, hasInvoiceTotal] = getPath(
    manifest, "three_way_match", "invoice_total_declared");

  const duplicateVendorIds: string[] | null = vendIsList
    ? duplicates(vendRows, "vendor_id") : null;
  const duplicateCriterionIds: string[] | null = critIsList
    ? duplicates(critRows, "criterion_id") : null;
  const duplicatePoLineIds: string[] | null = poIsList
    ? duplicates(poRows, "line_id") : null;
  const duplicateReceiptLineIds: string[] | null = receiptIsList
    ? duplicates(receiptRows, "line_id") : null;
  const duplicateInvoiceLineIds: string[] | null = invoiceIsList
    ? duplicates(invoiceRows, "line_id") : null;

  const vendorsWithoutName: string[] | null = vendIsList
    ? vendRows.filter((c) => hasField(c, "vendor_name") &&
        !nonemptyStr((c as Record<string, unknown>)["vendor_name"]))
        .map((c) => rowName(c, "vendor_id"))
    : null;
  const vendorsWithoutEvidenceNote: string[] | null = vendIsList
    ? vendRows.filter((c) => hasField(c, "evidence_note") &&
        !nonemptyStr((c as Record<string, unknown>)["evidence_note"]))
        .map((c) => rowName(c, "vendor_id"))
    : null;
  const criteriaWithoutName: string[] | null = critIsList
    ? critRows.filter((c) => hasField(c, "criterion_name") &&
        !nonemptyStr((c as Record<string, unknown>)["criterion_name"]))
        .map((c) => rowName(c, "criterion_id"))
    : null;
  const criteriaWithInvalidWeight: string[] | null = critIsList
    ? critRows.filter((c) => hasField(c, "weight") &&
        !(isNum((c as Record<string, unknown>)["weight"]) &&
          ((c as Record<string, unknown>)["weight"] as number) >= 0))
        .map((c) => rowName(c, "criterion_id"))
    : null;

  const weightByCriterion = new Map<string, number>();
  if (critIsList) {
    for (const c of critRows) {
      if (isPyDict(c) && typeof c["criterion_id"] === "string" &&
          isNum(c["weight"])) {
        weightByCriterion.set(c["criterion_id"] as string,
                              c["weight"] as number);
      }
    }
  }
  let weightsSum: number | null = null;
  if (critIsList) {
    weightsSum = 0.0;
    for (const w of weightByCriterion.values()) weightsSum += w;
  }

  const scoreIds = (c: unknown): string[] | null => {
    const scores = isPyDict(c) ? c["scores"] : null;
    if (!Array.isArray(scores)) return null;
    const out: string[] = [];
    for (const s of scores) {
      if (isPyDict(s) && typeof s["criterion_id"] === "string") {
        out.push(s["criterion_id"] as string);
      }
    }
    return out;
  };

  const scoresCover = (c: unknown): boolean => {
    const sids = scoreIds(c);
    if (sids === null) return false;
    return sids.length === criterionIds.length &&
      new Set(sids).size === sids.length &&
      sids.every((sid) => criterionIds.includes(sid)) &&
      criterionIds.every((cid) => sids.includes(cid));
  };

  const recomputedTotal = (c: unknown): number | null => {
    const scores = isPyDict(c) ? c["scores"] : null;
    if (!Array.isArray(scores)) return null;
    let totalVal = 0.0;
    for (const s of scores) {
      if (isPyDict(s) && typeof s["criterion_id"] === "string" &&
          weightByCriterion.has(s["criterion_id"] as string) &&
          isNum(s["score"])) {
        totalVal += weightByCriterion.get(s["criterion_id"] as string)! *
          (s["score"] as number);
      }
    }
    return totalVal;
  };

  const totalMatches = (c: unknown): boolean => {
    if (!hasField(c, "weighted_total_declared")) return false;
    const rec = recomputedTotal(c);
    if (rec === null) return false;
    const declared = (c as Record<string, unknown>)["weighted_total_declared"];
    if (!isNum(declared)) return false;
    return fmt6(rec) === fmt6(declared);
  };

  const vendorsWithIncompleteScores: string[] | null =
    vendIsList && critIsList
      ? vendRows.filter((c) => hasField(c, "scores") && !scoresCover(c))
          .map((c) => rowName(c, "vendor_id"))
      : null;
  const vendorsWithTotalMismatch: string[] | null =
    vendIsList && critIsList
      ? vendRows.filter((c) => hasField(c, "weighted_total_declared") &&
          hasField(c, "scores") && !totalMatches(c))
          .map((c) => rowName(c, "vendor_id"))
      : null;

  const lineTotalRecomputes = (row: unknown): boolean => {
    if (!(hasField(row, "quantity") && hasField(row, "unit_price") &&
          hasField(row, "line_total_declared"))) return false;
    const r = row as Record<string, unknown>;
    if (!(isNum(r["quantity"]) && isNum(r["unit_price"]) &&
          isNum(r["line_total_declared"]))) return false;
    return fmt6((r["quantity"] as number) * (r["unit_price"] as number)) ===
      fmt6(r["line_total_declared"] as number);
  };

  const poLinesWithTotalMismatch: string[] | null = poIsList
    ? poRows.filter((c) => hasField(c, "line_total_declared") &&
        hasField(c, "quantity") && hasField(c, "unit_price") &&
        !lineTotalRecomputes(c))
        .map((c) => rowName(c, "line_id"))
    : null;
  const invoiceLinesWithTotalMismatch: string[] | null = invoiceIsList
    ? invoiceRows.filter((c) => hasField(c, "line_total_declared") &&
        hasField(c, "quantity") && hasField(c, "unit_price") &&
        !lineTotalRecomputes(c))
        .map((c) => rowName(c, "line_id"))
    : null;

  const missingAndExtra = (
    baseIds: string[], otherIds: string[],
  ): [string[], string[]] => {
    const missing: string[] = [];
    for (const lid of baseIds) {
      if (!otherIds.includes(lid) && !missing.includes(lid)) missing.push(lid);
    }
    const extra: string[] = [];
    for (const lid of otherIds) {
      if (!baseIds.includes(lid) && !extra.includes(lid)) extra.push(lid);
    }
    return [missing, extra];
  };

  let poMissingFromReceipt: string[] | null = null;
  let receiptExtra: string[] | null = null;
  if (poIsList && receiptIsList) {
    [poMissingFromReceipt, receiptExtra] = missingAndExtra(poIds, receiptIds);
  }
  let poMissingFromInvoice: string[] | null = null;
  let invoiceExtra: string[] | null = null;
  if (poIsList && invoiceIsList) {
    [poMissingFromInvoice, invoiceExtra] = missingAndExtra(poIds, invoiceIds);
  }

  const quantityAgrees = (lineId: string): boolean | null => {
    const rows = [poById.get(lineId), receiptById.get(lineId),
                  invoiceById.get(lineId)];
    if (rows.some((r) => r === undefined)) return null;
    if (rows.some((r) => !isNum(r!["quantity"]))) return null;
    const vals = new Set(rows.map((r) => fmt6(r!["quantity"] as number)));
    return vals.size === 1;
  };

  let quantityMismatchIds: string[] | null = null;
  if (poIsList && receiptIsList && invoiceIsList) {
    quantityMismatchIds = [];
    for (const lid of poIds) {
      if (receiptById.has(lid) && invoiceById.has(lid)) {
        if (quantityAgrees(lid) === false &&
            !quantityMismatchIds.includes(lid)) {
          quantityMismatchIds.push(lid);
        }
      }
    }
  }

  let priceMismatchIds: string[] | null = null;
  if (poIsList && invoiceIsList) {
    priceMismatchIds = [];
    for (const lid of poIds) {
      if (invoiceById.has(lid)) {
        const poRow = poById.get(lid)!;
        const invRow = invoiceById.get(lid)!;
        if (isNum(poRow["unit_price"]) && isNum(invRow["unit_price"]) &&
            fmt6(poRow["unit_price"] as number) !==
              fmt6(invRow["unit_price"] as number) &&
            !priceMismatchIds.includes(lid)) {
          priceMismatchIds.push(lid);
        }
      }
    }
  }

  const linesTotal = (rows: unknown[]): number => {
    let total = 0.0;
    for (const c of rows) {
      if (isPyDict(c) && isNum(c["line_total_declared"])) {
        total += c["line_total_declared"] as number;
      }
    }
    return total;
  };
  const poLinesTotal: number | null = poIsList ? linesTotal(poRows) : null;
  const invoiceLinesTotal: number | null = invoiceIsList
    ? linesTotal(invoiceRows) : null;

  const scoreCoverageRatio: number | null =
    vendIsList && critIsList && vendCount !== null && vendCount > 0
      ? vendRows.filter((c) => scoresCover(c)).length / vendCount
      : null;
  const weightedTotalMatchRatio: number | null =
    vendIsList && critIsList && vendCount !== null && vendCount > 0
      ? vendRows.filter((c) => totalMatches(c)).length / vendCount
      : null;
  const vendorEvidenceRatio: number | null =
    vendIsList && vendCount !== null && vendCount > 0
      ? vendRows.filter((c) => isPyDict(c) && nonemptyStr(c["evidence_note"])).length / vendCount
      : null;
  let quantityMatchRatio: number | null = null;
  if (poIsList && receiptIsList && invoiceIsList &&
      poCount !== null && poCount > 0) {
    let matched = 0;
    for (const lid of poIds) {
      if (quantityAgrees(lid) === true) matched += 1;
    }
    quantityMatchRatio = matched / poCount;
  }
  let amountMatchRatio: number | null = null;
  if (poIsList && invoiceIsList && poCount !== null && poCount > 0) {
    let matched = 0;
    for (const lid of poIds) {
      if (invoiceById.has(lid)) {
        const poRow = poById.get(lid)!;
        const invRow = invoiceById.get(lid)!;
        if (isNum(poRow["line_total_declared"]) &&
            isNum(invRow["line_total_declared"]) &&
            fmt6(poRow["line_total_declared"] as number) ===
              fmt6(invRow["line_total_declared"] as number)) {
          matched += 1;
        }
      }
    }
    amountMatchRatio = matched / poCount;
  }

  // ---- Section 1: spec_and_sourcing ----
  boolCheck(results, "spec_and_sourcing",
    "vendor_evaluation_spec_written_before_quotes", manifest,
    ["spec", "spec_written_before_quotes"],
    "spec: a written specification existed before quotes were sought — buy to spec, not to brochure");
  boolCheck(results, "spec_and_sourcing",
    "vendor_evaluation_spec_includes_functional_requirements", manifest,
    ["spec", "spec_includes_functional_requirements"],
    "spec: the specification includes the functional requirements");
  boolCheck(results, "spec_and_sourcing",
    "vendor_evaluation_spec_includes_compliance_requirements", manifest,
    ["spec", "spec_includes_compliance_requirements"],
    "spec: the specification includes the compliance requirements");
  boolCheck(results, "spec_and_sourcing",
    "vendor_evaluation_spec_includes_interface_requirements", manifest,
    ["spec", "spec_includes_interface_requirements"],
    "spec: the specification includes the interface requirements");
  boolCheck(results, "spec_and_sourcing",
    "vendor_evaluation_quotes_comparable_same_scope_declared", manifest,
    ["sourcing", "quotes_comparable_same_scope_declared"],
    "sourcing: the quotes obtained are declared comparable — same scope, quantities, delivery, terms and warranty");
  gatedBoolCheck(results, "spec_and_sourcing",
    "vendor_evaluation_single_source_justification_recorded_where_single_source_used",
    manifest,
    ["sourcing", "single_source_used"],
    ["sourcing", "single_source_justification_recorded"],
    "sourcing: the single-source decision is justified in writing",
    "no single-source purchase declared used");

  // ---- Section 2: vendor_evaluation_and_total_cost ----
  boolCheck(results, "vendor_evaluation_and_total_cost",
    "vendor_evaluation_criteria_set_before_scoring", manifest,
    ["evaluation_setup", "criteria_set_before_scoring"],
    "evaluation: the weighted criteria were set BEFORE scoring");
  boolCheck(results, "vendor_evaluation_and_total_cost",
    "vendor_evaluation_tco_evaluation_documented", manifest,
    ["evaluation_setup", "tco_evaluation_documented"],
    "total cost: the total-cost-of-ownership evaluation is documented — total cost, not price");
  boolCheck(results, "vendor_evaluation_and_total_cost",
    "vendor_evaluation_tco_includes_acquisition_cost", manifest,
    ["evaluation_setup", "tco_includes_acquisition_cost"],
    "total cost: acquisition cost is included in the total-cost evaluation");
  boolCheck(results, "vendor_evaluation_and_total_cost",
    "vendor_evaluation_tco_includes_operations_cost", manifest,
    ["evaluation_setup", "tco_includes_operations_cost"],
    "total cost: operations cost is included in the total-cost evaluation");
  boolCheck(results, "vendor_evaluation_and_total_cost",
    "vendor_evaluation_tco_includes_spares_cost", manifest,
    ["evaluation_setup", "tco_includes_spares_cost"],
    "total cost: spares cost is included in the total-cost evaluation");
  boolCheck(results, "vendor_evaluation_and_total_cost",
    "vendor_evaluation_tco_includes_support_cost", manifest,
    ["evaluation_setup", "tco_includes_support_cost"],
    "total cost: support cost is included in the total-cost evaluation");
  boolCheck(results, "vendor_evaluation_and_total_cost",
    "vendor_evaluation_tco_includes_switching_cost", manifest,
    ["evaluation_setup", "tco_includes_switching_cost"],
    "total cost: switching cost is included in the total-cost evaluation");
  boolCheck(results, "vendor_evaluation_and_total_cost",
    "vendor_evaluation_evidence_basis_recorded", manifest,
    ["evaluation_setup", "evidence_basis_recorded"],
    "evaluation: the evidence basis for the vendor evaluation is recorded");
  boolCheck(results, "vendor_evaluation_and_total_cost",
    "vendor_evaluation_applied_consistently_across_vendors", manifest,
    ["evaluation_setup", "evaluation_applied_consistently_across_vendors"],
    "evaluation: the same criteria and evidence basis were applied consistently across all vendors");
  check(results, "vendor_evaluation_and_total_cost",
    "vendor_evaluation_vendors_list_declared", vendorsRaw, vendIsList,
    vendIsList && vendCount !== null && vendCount >= 2,
    "vendors: the declared record names its evaluated vendors — the list is present and names at least two vendors; an absent list is missing evidence and a list of fewer than two declares no comparison at all");
  const vendIdPresent = vendIsList &&
    vendRows.every((c) => hasField(c, "vendor_id"));
  check(results, "vendor_evaluation_and_total_cost",
    "every_vendor_evaluation_vendor_id_unique", vendorsRaw, vendIdPresent,
    vendIsList && duplicateVendorIds !== null &&
      duplicateVendorIds.length === 0,
    "vendors: no declared vendor_id is owned by more than one row");
  const vendNamePresent = vendIsList &&
    vendRows.every((c) => hasField(c, "vendor_name"));
  check(results, "vendor_evaluation_and_total_cost",
    "every_vendor_evaluation_vendor_name_declared", vendorsRaw,
    vendNamePresent,
    vendIsList && vendRows.every((c) => isPyDict(c) && nonemptyStr(c["vendor_name"])),
    "vendors: every declared vendor declares a non-empty vendor name");
  const evidencePresent = vendIsList &&
    vendRows.every((c) => hasField(c, "evidence_note"));
  check(results, "vendor_evaluation_and_total_cost",
    "every_vendor_evaluation_vendor_evidence_note_declared", vendorsRaw,
    evidencePresent,
    vendIsList && vendRows.every((c) => isPyDict(c) && nonemptyStr(c["evidence_note"])),
    "vendors: every declared vendor declares a non-empty evidence note");
  check(results, "vendor_evaluation_and_total_cost",
    "vendor_evaluation_criteria_list_declared", criteriaRaw, critIsList,
    critIsList && critCount !== null && critCount > 0,
    "criteria: the declared record names its evaluation criteria — the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no evaluation at all");
  const critIdPresent = critIsList &&
    critRows.every((c) => hasField(c, "criterion_id"));
  check(results, "vendor_evaluation_and_total_cost",
    "every_vendor_evaluation_criterion_id_unique", criteriaRaw, critIdPresent,
    critIsList && duplicateCriterionIds !== null &&
      duplicateCriterionIds.length === 0,
    "criteria: no declared criterion_id is owned by more than one row");
  const critNamePresent = critIsList &&
    critRows.every((c) => hasField(c, "criterion_name"));
  check(results, "vendor_evaluation_and_total_cost",
    "every_vendor_evaluation_criterion_name_declared", criteriaRaw,
    critNamePresent,
    critIsList && critRows.every((c) => isPyDict(c) && nonemptyStr(c["criterion_name"])),
    "criteria: every declared criterion declares a non-empty criterion name");
  const weightPresent = critIsList &&
    critRows.every((c) => hasField(c, "weight"));
  check(results, "vendor_evaluation_and_total_cost",
    "every_vendor_evaluation_criterion_weight_non_negative", criteriaRaw,
    weightPresent,
    critIsList && critRows.every((c) => isPyDict(c) &&
      isNum(c["weight"]) && (c["weight"] as number) >= 0),
    "criteria: every declared criterion declares a non-negative weight");
  check(results, "vendor_evaluation_and_total_cost",
    "vendor_evaluation_criteria_weights_sum_positive", criteriaRaw,
    weightPresent,
    critIsList && weightsSum !== null && weightsSum > 0,
    "criteria: the declared criterion weights sum to a positive total — an evaluation whose weights sum to zero scores nothing");
  const scoresPresent = vendIsList && critIsList &&
    vendRows.every((c) => hasField(c, "scores")) &&
    critRows.every((c) => hasField(c, "criterion_id")) &&
    vendRows.every((c) => {
      const scores = isPyDict(c) ? c["scores"] : null;
      if (!Array.isArray(scores)) return true;
      return scores.every((s) => isPyDict(s) && hasField(s, "criterion_id"));
    });
  check(results, "vendor_evaluation_and_total_cost",
    "every_vendor_evaluation_vendor_scores_every_declared_criterion",
    vendorsRaw, scoresPresent,
    vendIsList && critIsList && vendRows.every((c) => scoresCover(c)),
    "scores: every declared vendor scores every declared criterion and no other criterion, exactly once");
  const totalsPresent = vendIsList && critIsList &&
    vendRows.every((c) => hasField(c, "weighted_total_declared")) &&
    vendRows.every((c) => hasField(c, "scores")) &&
    critRows.every((c) => hasField(c, "weight")) &&
    critRows.every((c) => hasField(c, "criterion_id"));
  check(results, "vendor_evaluation_and_total_cost",
    "every_vendor_evaluation_vendor_weighted_total_recomputes",
    vendorsRaw, totalsPresent,
    vendIsList && critIsList && vendRows.every((c) => totalMatches(c)),
    "scores: every declared vendor's declared weighted total recomputes exactly as the sum of declared weight times declared score over its declared scores");

  // ---- Section 3: contract_and_terms ----
  boolCheck(results, "contract_and_terms",
    "vendor_evaluation_contract_exclusions_reviewed", manifest,
    ["contract", "exclusions_reviewed"],
    "contract care: the quote and contract exclusions were read and reviewed");
  boolCheck(results, "contract_and_terms",
    "vendor_evaluation_contract_payment_terms_reviewed", manifest,
    ["contract", "payment_terms_reviewed"],
    "contract care: the payment terms were read and reviewed");
  boolCheck(results, "contract_and_terms",
    "vendor_evaluation_contract_penalties_reviewed", manifest,
    ["contract", "penalties_reviewed"],
    "contract care: the penalties were read and reviewed");
  boolCheck(results, "contract_and_terms",
    "vendor_evaluation_contract_warranty_reviewed", manifest,
    ["contract", "warranty_reviewed"],
    "contract care: the warranty was read and reviewed");
  boolCheck(results, "contract_and_terms",
    "vendor_evaluation_contract_price_escalation_clauses_reviewed", manifest,
    ["contract", "price_escalation_clauses_reviewed"],
    "contract care: the price-escalation clauses were read and reviewed");
  boolCheck(results, "contract_and_terms",
    "vendor_evaluation_contract_binding_terms_reviewed", manifest,
    ["contract", "binding_terms_reviewed"],
    "contract care: the binding terms were reviewed — binding terms get review");

  // ---- Section 4: purchase_order_discipline ----
  boolCheck(results, "purchase_order_discipline",
    "vendor_evaluation_po_issued_before_delivery", manifest,
    ["po_discipline", "po_issued_before_delivery"],
    "PO discipline: the purchase order was issued before delivery");
  boolCheck(results, "purchase_order_discipline",
    "vendor_evaluation_po_changes_via_change_order_declared", manifest,
    ["po_discipline", "changes_via_change_order_declared"],
    "PO discipline: changes to the purchase order were made via change order");
  boolCheck(results, "purchase_order_discipline",
    "vendor_evaluation_verbal_commitments_papered_same_day_declared", manifest,
    ["po_discipline", "verbal_commitments_papered_same_day_declared"],
    "PO discipline: no verbal commitments stand unpapered — any verbal commitment was papered the same day");
  boolCheck(results, "purchase_order_discipline",
    "vendor_evaluation_po_references_spec_declared", manifest,
    ["po_discipline", "po_references_spec_declared"],
    "PO discipline: the purchase order references the written specification it buys to");

  // ---- Section 5: three_way_match ----
  boolCheck(results, "three_way_match",
    "vendor_evaluation_three_way_match_performed_before_payment_declared",
    manifest,
    ["three_way_match", "match_performed_before_payment_declared"],
    "3-way match: the three-way match (PO ↔ receipt/inspection ↔ invoice) was performed before payment");
  boolCheck(results, "three_way_match",
    "vendor_evaluation_three_way_discrepancies_resolved_before_payment_declared",
    manifest,
    ["three_way_match", "discrepancies_resolved_before_payment_declared"],
    "3-way match: discrepancies were resolved first, before payment");
  boolCheck(results, "three_way_match",
    "vendor_evaluation_inspection_against_spec_on_arrival_declared", manifest,
    ["three_way_match", "inspection_against_spec_on_arrival_declared"],
    "receipt: the delivery was inspected against spec on arrival, not after install");
  boolCheck(results, "three_way_match",
    "vendor_evaluation_receipt_verification_before_payment_declared", manifest,
    ["three_way_match", "receipt_verification_before_payment_declared"],
    "receipt: receipt verification stands before payment — nothing is paid without receipt verification");
  check(results, "three_way_match",
    "vendor_evaluation_purchase_order_lines_declared", poRaw, poIsList,
    poIsList && poCount !== null && poCount > 0,
    "purchase order lines: the declared record names its purchase-order lines — the list is present and names at least one line; an absent list is missing evidence and an empty list declares no purchase at all");
  const poIdPresent = poIsList &&
    poRows.every((c) => hasField(c, "line_id"));
  check(results, "three_way_match",
    "every_vendor_evaluation_purchase_order_line_id_unique", poRaw,
    poIdPresent,
    poIsList && duplicatePoLineIds !== null &&
      duplicatePoLineIds.length === 0,
    "purchase order lines: no declared line_id is owned by more than one purchase-order row");
  const receiptIdPresent = receiptIsList &&
    receiptRows.every((c) => hasField(c, "line_id"));
  check(results, "three_way_match",
    "every_vendor_evaluation_receipt_line_id_unique", receiptRaw,
    receiptIdPresent,
    receiptIsList && duplicateReceiptLineIds !== null &&
      duplicateReceiptLineIds.length === 0,
    "receipt lines: no declared line_id is owned by more than one receipt row");
  const invoiceIdPresent = invoiceIsList &&
    invoiceRows.every((c) => hasField(c, "line_id"));
  check(results, "three_way_match",
    "every_vendor_evaluation_invoice_line_id_unique", invoiceRaw,
    invoiceIdPresent,
    invoiceIsList && duplicateInvoiceLineIds !== null &&
      duplicateInvoiceLineIds.length === 0,
    "invoice lines: no declared line_id is owned by more than one invoice row");
  const poTotalFieldsPresent = poIsList && poRows.every((c) =>
    hasField(c, "quantity") && hasField(c, "unit_price") &&
    hasField(c, "line_total_declared"));
  check(results, "three_way_match",
    "every_vendor_evaluation_purchase_order_line_total_recomputes",
    poRaw, poTotalFieldsPresent,
    poIsList && poRows.every((c) => lineTotalRecomputes(c)),
    "purchase order lines: every declared purchase-order line total recomputes exactly as declared quantity times declared unit price");
  const invoiceTotalFieldsPresent = invoiceIsList &&
    invoiceRows.every((c) =>
      hasField(c, "quantity") && hasField(c, "unit_price") &&
      hasField(c, "line_total_declared"));
  check(results, "three_way_match",
    "every_vendor_evaluation_invoice_line_total_recomputes",
    invoiceRaw, invoiceTotalFieldsPresent,
    invoiceIsList && invoiceRows.every((c) => lineTotalRecomputes(c)),
    "invoice lines: every declared invoice line total recomputes exactly as declared quantity times declared unit price");
  const receiptCoveragePresent = poIsList && receiptIsList &&
    poRows.every((c) => hasField(c, "line_id")) &&
    receiptRows.every((c) => hasField(c, "line_id"));
  check(results, "three_way_match",
    "vendor_evaluation_receipt_lines_cover_purchase_order_lines_exactly",
    receiptRaw, receiptCoveragePresent,
    receiptCoveragePresent && poMissingFromReceipt !== null &&
      poMissingFromReceipt.length === 0 &&
      receiptExtra !== null && receiptExtra.length === 0 &&
      duplicateReceiptLineIds !== null &&
      duplicateReceiptLineIds.length === 0 &&
      receiptCount === poCount,
    "3-way match: the declared receipt line ids are exactly the declared purchase-order line ids — none missing, none extra, none duplicated");
  const invoiceCoveragePresent = poIsList && invoiceIsList &&
    poRows.every((c) => hasField(c, "line_id")) &&
    invoiceRows.every((c) => hasField(c, "line_id"));
  check(results, "three_way_match",
    "vendor_evaluation_invoice_lines_cover_purchase_order_lines_exactly",
    invoiceRaw, invoiceCoveragePresent,
    invoiceCoveragePresent && poMissingFromInvoice !== null &&
      poMissingFromInvoice.length === 0 &&
      invoiceExtra !== null && invoiceExtra.length === 0 &&
      duplicateInvoiceLineIds !== null &&
      duplicateInvoiceLineIds.length === 0 &&
      invoiceCount === poCount,
    "3-way match: the declared invoice line ids are exactly the declared purchase-order line ids — none missing, none extra, none duplicated");
  const quantityFieldsPresent = poIsList && receiptIsList && invoiceIsList &&
    poRows.every((c) => hasField(c, "line_id") && hasField(c, "quantity")) &&
    receiptRows.every((c) => hasField(c, "line_id") && hasField(c, "quantity")) &&
    invoiceRows.every((c) => hasField(c, "line_id") && hasField(c, "quantity"));
  check(results, "three_way_match",
    "every_vendor_evaluation_three_way_line_quantity_matches_across_documents",
    poRaw, quantityFieldsPresent,
    quantityFieldsPresent && quantityMismatchIds !== null &&
      quantityMismatchIds.length === 0 &&
      poMissingFromReceipt !== null && poMissingFromReceipt.length === 0 &&
      receiptExtra !== null && receiptExtra.length === 0 &&
      poMissingFromInvoice !== null && poMissingFromInvoice.length === 0 &&
      invoiceExtra !== null && invoiceExtra.length === 0,
    "3-way match: for every declared line, the declared quantity agrees across purchase order, receipt and invoice");
  const priceFieldsPresent = poIsList && invoiceIsList &&
    poRows.every((c) => hasField(c, "line_id") && hasField(c, "unit_price")) &&
    invoiceRows.every((c) => hasField(c, "line_id") && hasField(c, "unit_price"));
  check(results, "three_way_match",
    "every_vendor_evaluation_three_way_line_unit_price_matches_po_to_invoice",
    poRaw, priceFieldsPresent,
    priceFieldsPresent && priceMismatchIds !== null &&
      priceMismatchIds.length === 0 &&
      poMissingFromInvoice !== null && poMissingFromInvoice.length === 0 &&
      invoiceExtra !== null && invoiceExtra.length === 0,
    "3-way match: for every declared line, the declared unit price on the invoice agrees with the declared unit price on the purchase order");
  const poGrandPresent = hasPoTotal && poIsList &&
    poRows.every((c) => hasField(c, "line_total_declared"));
  check(results, "three_way_match",
    "vendor_evaluation_purchase_order_total_recomputes_from_line_totals",
    poTotalDeclared, poGrandPresent,
    poGrandPresent && isNum(poTotalDeclared) && poLinesTotal !== null &&
      fmt6(poLinesTotal) === fmt6(poTotalDeclared as number),
    "purchase order total: the declared purchase-order grand total recomputes exactly as the sum of the declared purchase-order line totals");
  const invoiceGrandPresent = hasInvoiceTotal && invoiceIsList &&
    invoiceRows.every((c) => hasField(c, "line_total_declared"));
  check(results, "three_way_match",
    "vendor_evaluation_invoice_total_recomputes_from_line_totals",
    invoiceTotalDeclared, invoiceGrandPresent,
    invoiceGrandPresent && isNum(invoiceTotalDeclared) &&
      invoiceLinesTotal !== null &&
      fmt6(invoiceLinesTotal) === fmt6(invoiceTotalDeclared as number),
    "invoice total: the declared invoice grand total recomputes exactly as the sum of the declared invoice line totals");
  const grandMatchPresent = hasPoTotal && hasInvoiceTotal;
  check(results, "three_way_match",
    "vendor_evaluation_three_way_grand_totals_match",
    poTotalDeclared, grandMatchPresent,
    grandMatchPresent && isNum(poTotalDeclared) &&
      isNum(invoiceTotalDeclared) &&
      fmt6(poTotalDeclared as number) === fmt6(invoiceTotalDeclared as number),
    "3-way match: the declared purchase-order grand total and the declared invoice grand total agree — the atom checks only that the declared totals agree; it approves no payment");

  // ---- Section 6: vendor_records_and_performance ----
  boolCheck(results, "vendor_records_and_performance",
    "vendor_evaluation_vendor_terms_recorded", manifest,
    ["vendor_records", "vendor_terms_recorded"],
    "vendor records: the vendor's terms are kept on record");
  boolCheck(results, "vendor_records_and_performance",
    "vendor_evaluation_vendor_contacts_recorded", manifest,
    ["vendor_records", "vendor_contacts_recorded"],
    "vendor records: the vendor's contacts are kept on record");
  boolCheck(results, "vendor_records_and_performance",
    "vendor_evaluation_performance_log_maintained", manifest,
    ["vendor_records", "performance_log_maintained"],
    "vendor records: a vendor performance log is maintained");
  boolCheck(results, "vendor_records_and_performance",
    "vendor_evaluation_performance_log_covers_on_time_quality_responsiveness",
    manifest,
    ["vendor_records", "performance_log_covers_on_time_quality_responsiveness"],
    "vendor records: the performance log covers on-time delivery, quality and responsiveness");
  boolCheck(results, "vendor_records_and_performance",
    "vendor_evaluation_annual_review_cadence_set", manifest,
    ["vendor_records", "annual_review_cadence_set"],
    "vendor records: an annual vendor review cadence is set");
  boolCheck(results, "vendor_records_and_performance",
    "vendor_evaluation_two_viable_sources_for_critical_items_declared",
    manifest,
    ["vendor_records", "two_viable_sources_for_critical_items_declared"],
    "vendor records: two viable sources are kept for critical items where feasible, as declared");
  boolCheck(results, "vendor_records_and_performance",
    "vendor_evaluation_banking_detail_changes_verified_via_known_contacts",
    manifest,
    ["vendor_records", "banking_detail_changes_verified_via_known_contacts"],
    "fraud hygiene: banking-detail changes are verified via known contacts — never through email links");
  boolCheck(results, "vendor_records_and_performance",
    "vendor_evaluation_segregation_of_duties_declared", manifest,
    ["vendor_records", "segregation_of_duties_declared"],
    "fraud hygiene: segregation of duties is in place where possible, as declared");
  boolCheck(results, "vendor_records_and_performance",
    "vendor_evaluation_gifts_conflict_policy_respected_declared", manifest,
    ["vendor_records", "gifts_conflict_policy_respected_declared"],
    "fraud hygiene: the gifts and conflict-of-interest policy is respected, as declared");

  // ---- Section 7: red_lines ----
  falseCheck(results, "red_lines",
    "vendor_evaluation_free_of_po_less_purchase_above_threshold", manifest,
    ["red_lines", "po_less_purchase_above_threshold_present"],
    "red line: no PO-less purchase above threshold is present in the record");
  falseCheck(results, "red_lines",
    "vendor_evaluation_free_of_payment_without_delivery_confirmation", manifest,
    ["red_lines", "payment_without_delivery_confirmation_present"],
    "red line: no payment without delivery confirmation is present in the record");
  falseCheck(results, "red_lines",
    "vendor_evaluation_free_of_payment_before_three_way_match", manifest,
    ["red_lines", "payment_before_three_way_match_present"],
    "red line: no payment made before the three-way match is present in the record");
  falseCheck(results, "red_lines",
    "vendor_evaluation_free_of_silent_bank_detail_change", manifest,
    ["red_lines", "silent_bank_detail_change_present"],
    "red line: no silent bank-detail change is present in the record — bank-detail changes are verified through known channels always");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "VENDOR_EVALUATION_AND_MATCH_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "VENDOR_EVALUATION_AND_MATCH_SOUND";
  }

  const computedNames = [
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
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "vendor-evaluation-three-way-match-pack",
    atom_version: "0.1.0",
    pack_title: manifest["pack_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    vendor_evaluation_vendors_count: vendCount,
    vendor_evaluation_criteria_count: critCount,
    purchase_order_lines_count: poCount,
    receipt_lines_count: receiptCount,
    invoice_lines_count: invoiceCount,
    duplicate_vendor_evaluation_vendor_ids: duplicateVendorIds,
    duplicate_vendor_evaluation_criterion_ids: duplicateCriterionIds,
    duplicate_purchase_order_line_ids: duplicatePoLineIds,
    duplicate_receipt_line_ids: duplicateReceiptLineIds,
    duplicate_invoice_line_ids: duplicateInvoiceLineIds,
    vendor_evaluation_vendors_without_name: vendorsWithoutName,
    vendor_evaluation_vendors_without_evidence_note: vendorsWithoutEvidenceNote,
    vendor_evaluation_criteria_without_name: criteriaWithoutName,
    vendor_evaluation_criteria_with_invalid_weight: criteriaWithInvalidWeight,
    vendor_evaluation_vendors_with_incomplete_or_extra_scores: vendorsWithIncompleteScores,
    vendor_evaluation_vendors_with_weighted_total_mismatch: vendorsWithTotalMismatch,
    purchase_order_lines_with_line_total_mismatch: poLinesWithTotalMismatch,
    invoice_lines_with_line_total_mismatch: invoiceLinesWithTotalMismatch,
    purchase_order_line_ids_missing_from_receipt: poMissingFromReceipt,
    receipt_line_ids_not_on_purchase_order: receiptExtra,
    purchase_order_line_ids_missing_from_invoice: poMissingFromInvoice,
    invoice_line_ids_not_on_purchase_order: invoiceExtra,
    three_way_lines_with_quantity_mismatch: quantityMismatchIds,
    three_way_lines_with_unit_price_mismatch: priceMismatchIds,
    vendor_evaluation_criteria_weights_sum: fmt6(weightsSum),
    purchase_order_lines_total: fmt6(poLinesTotal),
    invoice_lines_total: fmt6(invoiceLinesTotal),
    vendor_score_coverage_ratio: fmt6(scoreCoverageRatio),
    vendor_weighted_total_match_ratio: fmt6(weightedTotalMatchRatio),
    vendor_evidence_note_ratio: fmt6(vendorEvidenceRatio),
    three_way_quantity_match_ratio: fmt6(quantityMatchRatio),
    three_way_amount_match_ratio: fmt6(amountMatchRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "VENDOR EVALUATION THREE WAY MATCH PACK",
    `pack_title: ${pyStr(verdict.pack_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
