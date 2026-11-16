// Engineering work package structuring — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/engineering-work-package-structuring/src/
// engineering_work_package_structuring.py (evaluate() + stamp()).
// No logic changes: every verdict, section outcome, per-check
// status, evidence string, computed field and the summary string
// are byte-identical to the Python output for the same input.
// Computed ratios use the shared fixed serialization: round half
// up to 6dp — floor(v * 1000000 + 0.5) / 1000000 — then format
// with exactly six decimals; comparisons use the unrounded
// values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  package: "string",
  definition: {
    objective_declared: "boolean",
    scope_in_declared: "boolean",
    scope_out_declared: "boolean",
    standards_declared: "boolean",
    site_rules_declared: "boolean",
    interfaces_declared: "boolean",
    budget_link_declared: "boolean",
    schedule_declared: "boolean",
    acceptance_criteria_declared: "boolean",
    deliverables_list_agreed: "boolean",
    deliverable_gaps_documented: "boolean",
  },
  deliverables: [{
    name: "string",
    kind: "string",
  }],
  documents: [{
    name: "string",
    kind: "string",
    status: "string",
    revision: "string",
    revision_reason_declared: "boolean",
    revision_history_present: "boolean",
    designer: "string",
    checker: "string",
    prepared_by: "string",
    reviewed_by: "string",
    approved_by: "string",
    purpose_declared: "boolean",
    inputs_declared: "boolean",
    assumptions_declared: "boolean",
    standards_cited_declared: "boolean",
    units_declared: "boolean",
    results_declared: "boolean",
    check_signature_declared: "boolean",
  }],
  document_control: {
    numbering_naming_convention_declared: "boolean",
    status_flow_declared: "boolean",
    unapproved_revision_used_for_construction_present: "boolean",
    untraceable_changes_present: "boolean",
    superseded_versions_deleted_present: "boolean",
    uncontrolled_copies_present: "boolean",
  },
  check_discipline: {
    redline_backcheck_process_declared: "boolean",
  },
  transmittals: [{
    document: "string",
    recipient: "string",
    revision: "string",
    date: "string",
    return_status_declared: "boolean",
  }],
  transmittal_log: {
    log_current_declared: "boolean",
    verbal_issue_present: "boolean",
  },
  handover: {
    as_built_marked: "boolean",
    om_references_declared: "boolean",
    spares_list_declared: "boolean",
    test_records_pointer_declared: "boolean",
    training_notes_declared: "boolean",
    closeout_checklist_signed: "boolean",
  },
};

export const SECTIONS = [
  "package_definition",
  "document_control_and_revisions",
  "check_discipline_and_transmittals",
  "delivery_quality_and_handover",
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
  package: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  deliverables_count: number | null;
  deliverables_with_invalid_kind: string[] | null;
  documents_count: number | null;
  documents_with_invalid_status: string[] | null;
  documents_without_revision: string[] | null;
  documents_without_revision_reason: string[] | null;
  documents_without_revision_history: string[] | null;
  documents_with_incomplete_signoff: string[] | null;
  signoff_coverage: string | null;
  calculations_not_independently_checked: string[] | null;
  independent_check_coverage: string | null;
  documents_missing_quality_elements: string[] | null;
  documents_missing_assumptions_or_signature: string[] | null;
  transmittals_count: number | null;
  transmittals_with_unknown_document: string[] | null;
  transmittals_without_recipient: string[] | null;
  transmittals_with_revision_mismatch: string[] | null;
  transmittals_with_invalid_date: string[] | null;
  transmittals_without_return_status: string[] | null;
  transmittal_document_coverage: string | null;
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

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function transmittalName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["document"] === "string" &&
    (entry["document"] as string).length > 0) {
    return entry["document"] as string;
  }
  return "unnamed";
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = [
  "calc package", "datasheet", "drawing", "test plan",
  "procedure", "BOM", "report",
];
const STATUSES = [
  "Draft", "For Review", "For Approval", "For Construction",
  "As-Built",
];
const CALC_KIND = "calc package";
const QUALITY_FIELDS = [
  "purpose_declared", "inputs_declared",
  "standards_cited_declared", "units_declared", "results_declared",
];

// Strict ISO YYYY-MM-DD validity, mirroring the Python oracle's
// regex + datetime.date construction (impossible dates such as
// 2027-02-30 are rejected in both).
function isValidDate(value: unknown): boolean {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(5, 7));
  const d = Number(value.slice(8, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d;
}

function hasNonemptyStr(entry: unknown, field: string): boolean {
  return isPyDict(entry) && typeof entry[field] === "string" &&
    (entry[field] as string).length > 0;
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function signoffComplete(entry: unknown): boolean {
  return hasNonemptyStr(entry, "prepared_by") &&
    hasNonemptyStr(entry, "reviewed_by") &&
    hasNonemptyStr(entry, "approved_by");
}

function isCalc(entry: unknown): boolean {
  return isPyDict(entry) && entry["kind"] === CALC_KIND;
}

function independentlyChecked(entry: unknown): boolean {
  return hasNonemptyStr(entry, "designer") &&
    hasNonemptyStr(entry, "checker") &&
    (entry as Record<string, unknown>)["designer"] !==
      (entry as Record<string, unknown>)["checker"];
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [deliverablesRaw, hasDeliverables] = getPath(manifest, "deliverables");
  const deliverablesIsList = hasDeliverables && Array.isArray(deliverablesRaw);
  const deliverables: unknown[] = deliverablesIsList
    ? (deliverablesRaw as unknown[]) : [];
  const [documentsRaw, hasDocuments] = getPath(manifest, "documents");
  const documentsIsList = hasDocuments && Array.isArray(documentsRaw);
  const documents: unknown[] = documentsIsList
    ? (documentsRaw as unknown[]) : [];
  const [transmittalsRaw, hasTransmittals] = getPath(manifest, "transmittals");
  const transmittalsIsList = hasTransmittals && Array.isArray(transmittalsRaw);
  const transmittals: unknown[] = transmittalsIsList
    ? (transmittalsRaw as unknown[]) : [];

  const deliverablesCount: number | null = deliverablesIsList
    ? deliverables.length : null;
  const documentsCount: number | null = documentsIsList
    ? documents.length : null;
  const transmittalsCount: number | null = transmittalsIsList
    ? transmittals.length : null;

  const documentByName = new Map<string, Record<string, unknown>>();
  if (documentsIsList) {
    for (const d of documents) {
      if (isPyDict(d) && typeof d["name"] === "string") {
        documentByName.set(d["name"] as string, d);
      }
    }
  }

  const deliverablesWithInvalidKind: string[] | null = deliverablesIsList
    ? deliverables.filter((d) => !(isPyDict(d) &&
        KINDS.includes(d["kind"] as string))).map(rowName)
    : null;

  const documentsWithInvalidStatus: string[] | null = documentsIsList
    ? documents.filter((d) => !(isPyDict(d) &&
        STATUSES.includes(d["status"] as string))).map(rowName)
    : null;
  const documentsWithoutRevision: string[] | null = documentsIsList
    ? documents.filter((d) => !hasNonemptyStr(d, "revision")).map(rowName)
    : null;
  const documentsWithoutRevisionReason: string[] | null = documentsIsList
    ? documents.filter((d) => !(isPyDict(d) &&
        d["revision_reason_declared"] === true)).map(rowName)
    : null;
  const documentsWithoutRevisionHistory: string[] | null = documentsIsList
    ? documents.filter((d) => !(isPyDict(d) &&
        d["revision_history_present"] === true)).map(rowName)
    : null;
  const documentsWithIncompleteSignoff: string[] | null = documentsIsList
    ? documents.filter((d) => !signoffComplete(d)).map(rowName)
    : null;
  const calcDocuments: unknown[] = documentsIsList
    ? documents.filter((d) => isCalc(d)) : [];
  const calculationsNotIndependentlyChecked: string[] | null =
    documentsIsList
      ? calcDocuments.filter((d) => !independentlyChecked(d)).map(rowName)
      : null;
  const documentsMissingQualityElements: string[] | null = documentsIsList
    ? documents.filter((d) => !(isPyDict(d) &&
        QUALITY_FIELDS.every((f) => d[f] === true))).map(rowName)
    : null;
  const documentsMissingAssumptionsOrSignature: string[] | null =
    documentsIsList
      ? documents.filter((d) => !(isPyDict(d) &&
          d["assumptions_declared"] === true &&
          d["check_signature_declared"] === true)).map(rowName)
      : null;

  const signoffCoverage: number | null =
    documentsIsList && documentsCount !== null && documentsCount > 0 &&
      documentsWithIncompleteSignoff !== null
      ? (documentsCount - documentsWithIncompleteSignoff.length) /
        documentsCount
      : null;
  const independentCheckCoverage: number | null =
    documentsIsList && calcDocuments.length > 0 &&
      calculationsNotIndependentlyChecked !== null
      ? (calcDocuments.length -
          calculationsNotIndependentlyChecked.length) /
        calcDocuments.length
      : null;

  const transmittalsWithUnknownDocument: string[] | null =
    transmittalsIsList && documentsIsList
      ? transmittals.filter((t) => !(isPyDict(t) &&
          typeof t["document"] === "string" &&
          documentByName.has(t["document"] as string)))
        .map(transmittalName)
      : null;
  const transmittalsWithoutRecipient: string[] | null = transmittalsIsList
    ? transmittals.filter((t) => !hasNonemptyStr(t, "recipient"))
      .map(transmittalName)
    : null;
  let transmittalsWithRevisionMismatch: string[] | null = null;
  if (transmittalsIsList && documentsIsList) {
    transmittalsWithRevisionMismatch = [];
    for (const t of transmittals) {
      if (!isPyDict(t) || typeof t["document"] !== "string" ||
        !documentByName.has(t["document"] as string)) {
        continue;
      }
      const docRevision = documentByName.get(
        t["document"] as string)?.["revision"];
      if (t["revision"] !== docRevision) {
        transmittalsWithRevisionMismatch.push(transmittalName(t));
      }
    }
  }
  const transmittalsWithInvalidDate: string[] | null = transmittalsIsList
    ? transmittals.filter((t) => !(isPyDict(t) &&
        isValidDate(t["date"]))).map(transmittalName)
    : null;
  const transmittalsWithoutReturnStatus: string[] | null =
    transmittalsIsList
      ? transmittals.filter((t) => !(isPyDict(t) &&
          t["return_status_declared"] === true)).map(transmittalName)
      : null;
  const transmittalDocumentCoverage: number | null =
    transmittalsWithUnknownDocument !== null && transmittalsCount
      ? (transmittalsCount - transmittalsWithUnknownDocument.length) /
        transmittalsCount
      : null;

  // ---- Section 1: package_definition ----
  boolCheck(results, "package_definition", "objective_declared", manifest,
    ["definition", "objective_declared"],
    "define the package: the objective is declared");
  boolCheck(results, "package_definition", "scope_in_declared", manifest,
    ["definition", "scope_in_declared"],
    "define the package: the scope — what is in — is declared");
  boolCheck(results, "package_definition", "scope_out_declared", manifest,
    ["definition", "scope_out_declared"],
    "define the package: the scope — what is out — is declared");
  boolCheck(results, "package_definition", "standards_declared", manifest,
    ["definition", "standards_declared"],
    "define the package: the standards are declared");
  boolCheck(results, "package_definition", "site_rules_declared", manifest,
    ["definition", "site_rules_declared"],
    "define the package: the site rules are declared");
  boolCheck(results, "package_definition", "interfaces_declared", manifest,
    ["definition", "interfaces_declared"],
    "define the package: the interfaces are declared");
  boolCheck(results, "package_definition", "budget_link_declared", manifest,
    ["definition", "budget_link_declared"],
    "define the package: the budget link is declared");
  boolCheck(results, "package_definition", "schedule_declared", manifest,
    ["definition", "schedule_declared"],
    "define the package: the schedule is declared");
  boolCheck(results, "package_definition",
    "acceptance_criteria_declared", manifest,
    ["definition", "acceptance_criteria_declared"],
    "define the package: the acceptance criteria are declared");
  const [agreed, hasAgreed] = getPath(
    manifest, "definition", "deliverables_list_agreed");
  const [gaps, hasGaps] = getPath(
    manifest, "definition", "deliverable_gaps_documented");
  check(results, "package_definition",
    "deliverables_agreed_or_gaps_documented", null,
    hasAgreed || hasGaps,
    agreed === true || gaps === true,
    "quality gate: the deliverables list is agreed and complete — or its gaps are documented");
  check(results, "package_definition", "deliverables_declared",
    deliverablesRaw, deliverablesIsList,
    deliverablesIsList && (deliverablesCount as number) > 0,
    "define the package: the declared package record names its deliverables — the deliverables list is present and non-empty");
  const kindPresent = deliverablesIsList &&
    deliverables.every((d) => hasField(d, "kind"));
  check(results, "package_definition",
    "every_deliverable_has_skill_kind", deliverablesRaw, kindPresent,
    deliverablesIsList && (deliverablesCount as number) > 0 &&
      deliverablesWithInvalidKind !== null &&
      deliverablesWithInvalidKind.length === 0,
    "define the package: every declared deliverable row carries a kind from the skill's own deliverables vocabulary — calc package, datasheet, drawing, test plan, procedure, BOM or report");

  // ---- Section 2: document_control_and_revisions ----
  boolCheck(results, "document_control_and_revisions",
    "numbering_naming_convention_declared", manifest,
    ["document_control", "numbering_naming_convention_declared"],
    "document control: the numbering/naming convention is declared");
  boolCheck(results, "document_control_and_revisions",
    "status_flow_declared", manifest,
    ["document_control", "status_flow_declared"],
    "document control: the status flow — Draft, For Review, For Approval, For Construction, As-Built — is declared");
  falseCheck(results, "document_control_and_revisions",
    "no_unapproved_revision_used_for_construction", manifest,
    ["document_control",
      "unapproved_revision_used_for_construction_present"],
    "red line: no unapproved revision is used for construction");
  falseCheck(results, "document_control_and_revisions",
    "no_untraceable_changes", manifest,
    ["document_control", "untraceable_changes_present"],
    "red line: no untraceable changes");
  falseCheck(results, "document_control_and_revisions",
    "superseded_versions_retained_not_deleted", manifest,
    ["document_control", "superseded_versions_deleted_present"],
    "red line: superseded versions are retained (marked), never deleted");
  falseCheck(results, "document_control_and_revisions",
    "no_uncontrolled_copies", manifest,
    ["document_control", "uncontrolled_copies_present"],
    "quality gate: no uncontrolled copies are floating");
  check(results, "document_control_and_revisions", "documents_declared",
    documentsRaw, documentsIsList,
    documentsIsList && (documentsCount as number) > 0,
    "document control: the declared package record names its controlled documents — the documents list is present and non-empty");
  const statusPresent = documentsIsList &&
    documents.every((d) => hasField(d, "status"));
  check(results, "document_control_and_revisions",
    "every_document_has_flow_status", documentsRaw, statusPresent,
    documentsIsList && (documentsCount as number) > 0 &&
      documentsWithInvalidStatus !== null &&
      documentsWithInvalidStatus.length === 0,
    "document control: every declared document row carries a status from the skill's own status flow — Draft, For Review, For Approval, For Construction or As-Built");
  const revisionPresent = documentsIsList &&
    documents.every((d) => hasField(d, "revision"));
  check(results, "document_control_and_revisions",
    "every_document_has_revision", documentsRaw, revisionPresent,
    documentsIsList && (documentsCount as number) > 0 &&
      documentsWithoutRevision !== null &&
      documentsWithoutRevision.length === 0,
    "document control: revisions — every declared document row carries a non-empty revision");
  const reasonPresent = documentsIsList &&
    documents.every((d) => hasField(d, "revision_reason_declared"));
  check(results, "document_control_and_revisions",
    "every_document_declares_revision_reason", documentsRaw,
    reasonPresent,
    documentsIsList && (documentsCount as number) > 0 &&
      documentsWithoutRevisionReason !== null &&
      documentsWithoutRevisionReason.length === 0,
    "document control: revisions carry a reason — every declared document row declares its revision reason");
  const historyPresent = documentsIsList &&
    documents.every((d) => hasField(d, "revision_history_present"));
  check(results, "document_control_and_revisions",
    "every_document_has_revision_history", documentsRaw, historyPresent,
    documentsIsList && (documentsCount as number) > 0 &&
      documentsWithoutRevisionHistory !== null &&
      documentsWithoutRevisionHistory.length === 0,
    "document control: a revision-history table is present on every controlled document");

  // ---- Section 3: check_discipline_and_transmittals ----
  boolCheck(results, "check_discipline_and_transmittals",
    "redline_backcheck_process_declared", manifest,
    ["check_discipline", "redline_backcheck_process_declared"],
    "check discipline: the red-line/back-check process is declared");
  const calcFieldsPresent = documentsIsList &&
    calcDocuments.every((d) => hasField(d, "designer") &&
      hasField(d, "checker"));
  check(results, "check_discipline_and_transmittals",
    "every_calculation_independently_checked", documentsRaw,
    calcFieldsPresent,
    documentsIsList && (documentsCount as number) > 0 &&
      calculationsNotIndependentlyChecked !== null &&
      calculationsNotIndependentlyChecked.length === 0,
    "check discipline: every calculation is independently checked — every declared calc package row names a designer and a checker, and designer != checker");
  const signoffPresent = documentsIsList &&
    documents.every((d) => hasField(d, "prepared_by") &&
      hasField(d, "reviewed_by") && hasField(d, "approved_by"));
  check(results, "check_discipline_and_transmittals",
    "every_document_signoff_complete", documentsRaw, signoffPresent,
    documentsIsList && (documentsCount as number) > 0 &&
      documentsWithIncompleteSignoff !== null &&
      documentsWithIncompleteSignoff.length === 0,
    "check discipline: sign-off blocks — every declared document row names who prepared, reviewed and approved it");
  check(results, "check_discipline_and_transmittals",
    "transmittals_declared", transmittalsRaw, transmittalsIsList,
    transmittalsIsList && (transmittalsCount as number) > 0,
    "transmittals: the declared package record names its transmittals — the transmittals list is present and non-empty");
  const tdocPresent = transmittalsIsList && documentsIsList &&
    transmittals.every((t) => hasField(t, "document"));
  check(results, "check_discipline_and_transmittals",
    "every_transmittal_names_declared_document", transmittalsRaw,
    tdocPresent,
    transmittalsIsList && documentsIsList &&
      (transmittalsCount as number) > 0 &&
      transmittalsWithUnknownDocument !== null &&
      transmittalsWithUnknownDocument.length === 0,
    "transmittals: every declared transmittal names a document the package declares — what was issued");
  const recipientPresent = transmittalsIsList &&
    transmittals.every((t) => hasField(t, "recipient"));
  check(results, "check_discipline_and_transmittals",
    "every_transmittal_has_recipient", transmittalsRaw,
    recipientPresent,
    transmittalsIsList && (transmittalsCount as number) > 0 &&
      transmittalsWithoutRecipient !== null &&
      transmittalsWithoutRecipient.length === 0,
    "transmittals: every declared transmittal row names a non-empty recipient — to whom it was issued");
  const trevPresent = transmittalsIsList && documentsIsList &&
    transmittals.every((t) => hasField(t, "document") &&
      hasField(t, "revision")) &&
    documents.every((d) => hasField(d, "revision"));
  check(results, "check_discipline_and_transmittals",
    "every_transmittal_revision_matches_document", transmittalsRaw,
    trevPresent,
    transmittalsIsList && documentsIsList &&
      (transmittalsCount as number) > 0 &&
      transmittalsWithUnknownDocument !== null &&
      transmittalsWithUnknownDocument.length === 0 &&
      transmittalsWithRevisionMismatch !== null &&
      transmittalsWithRevisionMismatch.length === 0,
    "transmittals: every declared transmittal carries the named document's declared current revision — which revision was issued");
  const tdatePresent = transmittalsIsList &&
    transmittals.every((t) => hasField(t, "date"));
  check(results, "check_discipline_and_transmittals",
    "every_transmittal_has_valid_date", transmittalsRaw, tdatePresent,
    transmittalsIsList && (transmittalsCount as number) > 0 &&
      transmittalsWithInvalidDate !== null &&
      transmittalsWithInvalidDate.length === 0,
    "transmittals: every declared transmittal row carries a valid ISO issue date — when it was issued");
  const treturnPresent = transmittalsIsList &&
    transmittals.every((t) => hasField(t, "return_status_declared"));
  check(results, "check_discipline_and_transmittals",
    "every_transmittal_declares_return_status", transmittalsRaw,
    treturnPresent,
    transmittalsIsList && (transmittalsCount as number) > 0 &&
      transmittalsWithoutReturnStatus !== null &&
      transmittalsWithoutReturnStatus.length === 0,
    "transmittals: every declared transmittal row declares its return status");
  boolCheck(results, "check_discipline_and_transmittals",
    "transmittal_log_current_declared", manifest,
    ["transmittal_log", "log_current_declared"],
    "quality gate: the transmittal log is current");
  falseCheck(results, "check_discipline_and_transmittals",
    "no_verbal_issue", manifest,
    ["transmittal_log", "verbal_issue_present"],
    "transmittals: nothing is issued verbally");

  // ---- Section 4: delivery_quality_and_handover ----
  const qualityPresent = documentsIsList &&
    documents.every((d) =>
      QUALITY_FIELDS.every((f) => hasField(d, f)));
  check(results, "delivery_quality_and_handover",
    "every_document_declares_quality_elements", documentsRaw,
    qualityPresent,
    documentsIsList && (documentsCount as number) > 0 &&
      documentsMissingQualityElements !== null &&
      documentsMissingQualityElements.length === 0,
    "delivery quality: each document states purpose, inputs, standards cited, units and results — declared on every document row");
  const assumptionSigPresent = documentsIsList &&
    documents.every((d) => hasField(d, "assumptions_declared") &&
      hasField(d, "check_signature_declared"));
  check(results, "delivery_quality_and_handover",
    "every_document_declares_assumptions_and_check_signature",
    documentsRaw, assumptionSigPresent,
    documentsIsList && (documentsCount as number) > 0 &&
      documentsMissingAssumptionsOrSignature !== null &&
      documentsMissingAssumptionsOrSignature.length === 0,
    "delivery quality: assumptions are explicit, never embedded, and a check signature is stated — declared on every document row");
  boolCheck(results, "delivery_quality_and_handover",
    "handover_as_built_marked", manifest,
    ["handover", "as_built_marked"],
    "handover: as-built is marked");
  boolCheck(results, "delivery_quality_and_handover",
    "handover_om_references_declared", manifest,
    ["handover", "om_references_declared"],
    "handover: O&M references are declared");
  boolCheck(results, "delivery_quality_and_handover",
    "handover_spares_list_declared", manifest,
    ["handover", "spares_list_declared"],
    "handover: the spares list is declared");
  boolCheck(results, "delivery_quality_and_handover",
    "handover_test_records_pointer_declared", manifest,
    ["handover", "test_records_pointer_declared"],
    "handover: the test-records pointer is declared");
  boolCheck(results, "delivery_quality_and_handover",
    "handover_training_notes_declared", manifest,
    ["handover", "training_notes_declared"],
    "handover: training notes are declared");
  boolCheck(results, "delivery_quality_and_handover",
    "handover_closeout_checklist_signed", manifest,
    ["handover", "closeout_checklist_signed"],
    "handover: the close-out checklist is signed — the handover pack is complete at close-out");

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
    verdict = "WORK_PACKAGE_NOT_STRUCTURED";
  } else if (
    Object.values(sections).some((v) => v === "insufficient_evidence")
  ) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "WORK_PACKAGE_STRUCTURED";
  }

  const computedNames = [
    "documents_declared",
    "every_document_has_flow_status",
    "every_document_has_revision",
    "every_calculation_independently_checked",
    "every_transmittal_names_declared_document",
    "every_transmittal_revision_matches_document",
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
    service: "engineering-work-package-structuring",
    atom_version: "0.1.0",
    package: manifest["package"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    deliverables_count: deliverablesCount,
    deliverables_with_invalid_kind: deliverablesWithInvalidKind,
    documents_count: documentsCount,
    documents_with_invalid_status: documentsWithInvalidStatus,
    documents_without_revision: documentsWithoutRevision,
    documents_without_revision_reason: documentsWithoutRevisionReason,
    documents_without_revision_history: documentsWithoutRevisionHistory,
    documents_with_incomplete_signoff: documentsWithIncompleteSignoff,
    signoff_coverage: fmt6(signoffCoverage),
    calculations_not_independently_checked:
      calculationsNotIndependentlyChecked,
    independent_check_coverage: fmt6(independentCheckCoverage),
    documents_missing_quality_elements: documentsMissingQualityElements,
    documents_missing_assumptions_or_signature:
      documentsMissingAssumptionsOrSignature,
    transmittals_count: transmittalsCount,
    transmittals_with_unknown_document: transmittalsWithUnknownDocument,
    transmittals_without_recipient: transmittalsWithoutRecipient,
    transmittals_with_revision_mismatch:
      transmittalsWithRevisionMismatch,
    transmittals_with_invalid_date: transmittalsWithInvalidDate,
    transmittals_without_return_status:
      transmittalsWithoutReturnStatus,
    transmittal_document_coverage: fmt6(transmittalDocumentCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across four sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ENGINEERING WORK PACKAGE STRUCTURING",
    `package: ${pyStr(verdict.package ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
