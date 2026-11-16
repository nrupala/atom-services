// Document operations service — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/document-operations-service/src/document_operations_service.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 4dp —
// floor(v * 10000 + 0.5) / 10000 — then format with exactly four
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  operation: "string",
  source: {
    file_format_and_home_identified: "boolean",
    authoritative_copy_opened: "boolean",
    read_in_source_order: "boolean",
  },
  documents: [{
    name: "string",
    output_reopened_and_checked: "boolean",
  }],
  findings: [{
    name: "string",
    location: "string",
    quoted_exactly_before_interpretation: "boolean",
  }],
  extraction: {
    every_number_has_source_location: "boolean",
    numbers_quoted_exactly_then_interpreted_separately: "boolean",
    figure_quoted_without_location_present: "boolean",
    unreadable_or_missing_sections_named: "boolean",
  },
  editing: {
    edits_performed: "boolean",
    edits_on_editable_source: "boolean",
    headings_tables_styles_preserved: "boolean",
    rewrite_requested: "boolean",
    tracked_structure_intact: "boolean",
  },
  preservation: {
    editable_source_saved_alongside_output: "boolean",
    revisable_deliverable_present: "boolean",
    editable_source_kept_for_revisable: "boolean",
    only_editable_source_overwritten_with_flattened_export_present: "boolean",
  },
  conversion: {
    conversion_performed: "boolean",
    output_reopened_and_compared_section_by_section: "boolean",
    headings_tables_lists_figures_totals_survive: "boolean",
    content_loss_detected: "boolean",
    loss_fixed_or_reported_plainly: "boolean",
    conversion_with_dropped_content_shipped_present: "boolean",
  },
  verification: {
    output_reopened_and_checked_after_edit_or_conversion: "boolean",
    headings_tables_totals_match_source_and_output: "boolean",
  },
  deliverable: {
    shared_externally: "boolean",
    send_copy_is_docx_not_markdown: "boolean",
    markdown_sent_as_external_deliverable_present: "boolean",
    draft_banners_comments_tracked_changes_stripped: "boolean",
    send_copy_contains_draft_marks_present: "boolean",
  },
  delivery: {
    findings_first_in_decision_order_with_locations: "boolean",
    change_list_provided: "boolean",
    finished_file_in_send_format_plus_editable_source: "boolean",
    loss_gap_unreadable_stated_in_delivery_note: "boolean",
  },
};

export const SECTIONS = [
  "source_and_extraction",
  "editing_and_preservation",
  "conversion_and_verification",
  "delivery_and_hygiene",
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
  operation: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  documents_count: number | null;
  documents_without_output_verification: string[] | null;
  output_verification_coverage: string | null;
  findings_count: number | null;
  findings_without_location: string[] | null;
  location_coverage: string | null;
  findings_not_quoted_exactly_first: string[] | null;
  exact_quote_coverage: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pyTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPyDict(value)) return Object.keys(value).length > 0;
  return Boolean(value);
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
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function gatedFalseCheck(
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
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      target === false, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function gatedNotBoolCheck(
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
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, gate, hasGate, true, naEvidence);
  } else {
    check(results, section, name, target, hasTarget,
      target === true, evidence);
  }
}

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function hasLocation(entry: unknown): boolean {
  return isPyDict(entry) && typeof entry["location"] === "string" &&
    (entry["location"] as string).length > 0;
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [documentsRaw, hasDocuments] = getPath(manifest, "documents");
  const documentsIsList = hasDocuments && Array.isArray(documentsRaw);
  const documents: unknown[] = documentsIsList ? (documentsRaw as unknown[]) : [];
  const [findingsRaw, hasFindings] = getPath(manifest, "findings");
  const findingsIsList = hasFindings && Array.isArray(findingsRaw);
  const findings: unknown[] = findingsIsList ? (findingsRaw as unknown[]) : [];

  const documentsCount: number | null = documentsIsList ? documents.length : null;
  const findingsCount: number | null = findingsIsList ? findings.length : null;

  const findingsWithoutLocation: string[] | null = findingsIsList
    ? findings.filter((f) => !hasLocation(f)).map(rowName)
    : null;
  const findingsNotQuoted: string[] | null = findingsIsList
    ? findings.filter((f) => !(isPyDict(f) && f["quoted_exactly_before_interpretation"] === true)).map(rowName)
    : null;
  const documentsWithoutVerification: string[] | null = documentsIsList
    ? documents.filter((d) => !(isPyDict(d) && d["output_reopened_and_checked"] === true)).map(rowName)
    : null;
  const locationCoverage: number | null =
    findingsIsList && findingsCount !== null && findingsCount > 0 &&
      findingsWithoutLocation !== null
      ? (findingsCount - findingsWithoutLocation.length) / findingsCount
      : null;
  const exactQuoteCoverage: number | null =
    findingsIsList && findingsCount !== null && findingsCount > 0 &&
      findingsNotQuoted !== null
      ? (findingsCount - findingsNotQuoted.length) / findingsCount
      : null;
  const verificationCoverage: number | null =
    documentsIsList && documentsCount !== null && documentsCount > 0 &&
      documentsWithoutVerification !== null
      ? (documentsCount - documentsWithoutVerification.length) / documentsCount
      : null;

  // ---- Section 1: source_and_extraction ----
  boolCheck(results, "source_and_extraction",
    "file_format_and_home_identified", manifest,
    ["source", "file_format_and_home_identified"],
    "method: the file, its format, and its home — Vault, Drive, Docs, Notion, Box, or Dropbox — are identified");
  boolCheck(results, "source_and_extraction",
    "authoritative_copy_opened", manifest,
    ["source", "authoritative_copy_opened"],
    "method: the authoritative copy is opened, not a stale download");
  boolCheck(results, "source_and_extraction",
    "read_in_source_order", manifest,
    ["source", "read_in_source_order"],
    "method: extraction reads in source order and keeps locations attached to everything pulled");
  check(results, "source_and_extraction", "documents_declared",
    documentsRaw, documentsIsList,
    documentsIsList && (documentsCount as number) > 0,
    "method: the declared operation record names its documents — the documents list is present and non-empty");
  check(results, "source_and_extraction", "findings_declared",
    findingsRaw, findingsIsList,
    findingsIsList && (findingsCount as number) > 0,
    "method: the declared operation record names its findings — the findings list is present and non-empty");
  const locationPresent = findingsIsList &&
    findings.every((f) => hasField(f, "location"));
  check(results, "source_and_extraction",
    "every_finding_has_location_recorded", findingsRaw, locationPresent,
    findingsIsList && (findingsCount as number) > 0 &&
      findingsWithoutLocation !== null && findingsWithoutLocation.length === 0,
    "method / quality gate: every declared finding row records its location — page for PDFs and docs, sheet and cell for spreadsheets, slide number for decks");
  const quotedPresent = findingsIsList &&
    findings.every((f) => hasField(f, "quoted_exactly_before_interpretation"));
  check(results, "source_and_extraction",
    "every_finding_quoted_exactly_before_interpretation", findingsRaw,
    quotedPresent,
    findingsIsList && (findingsCount as number) > 0 &&
      findingsNotQuoted !== null && findingsNotQuoted.length === 0,
    "method: every declared finding row declares its numbers were quoted exactly as written first, before any interpretation");
  boolCheck(results, "source_and_extraction",
    "every_quoted_number_carries_source_location", manifest,
    ["extraction", "every_number_has_source_location"],
    "quality gate / red line: every quoted number carries a page, sheet/cell, or slide reference");
  boolCheck(results, "source_and_extraction",
    "numbers_quoted_exactly_then_interpreted_separately", manifest,
    ["extraction", "numbers_quoted_exactly_then_interpreted_separately"],
    "method: numbers are quoted exactly as written first, then interpreted separately — a figure and its reading are never merged into one line");
  falseCheck(results, "source_and_extraction",
    "no_figure_quoted_without_location", manifest,
    ["extraction", "figure_quoted_without_location_present"],
    "red line: no figure is quoted from a document without its source location");
  boolCheck(results, "source_and_extraction",
    "unreadable_or_missing_sections_named", manifest,
    ["extraction", "unreadable_or_missing_sections_named"],
    "quality gate / method: unreadable or missing sections are named, not skipped over — the report states any pages, sheets, or sections that could not be read");

  // ---- Section 2: editing_and_preservation ----
  boolCheck(results, "editing_and_preservation",
    "edits_made_on_editable_source", manifest,
    ["editing", "edits_on_editable_source"],
    "method: edits are worked on the editable source");
  boolCheck(results, "editing_and_preservation",
    "headings_tables_styles_preserved", manifest,
    ["editing", "headings_tables_styles_preserved"],
    "method: headings, tables, and styles are preserved in edits");
  gatedNotBoolCheck(results, "editing_and_preservation",
    "tracked_structure_intact_unless_rewrite_requested", manifest,
    ["editing", "rewrite_requested"],
    ["editing", "tracked_structure_intact"],
    "method: tracked structure is kept intact — no rewrite was requested",
    "a rewrite was requested, so tracked structure need not stay intact");
  boolCheck(results, "editing_and_preservation",
    "editable_source_saved_alongside_output", manifest,
    ["preservation", "editable_source_saved_alongside_output"],
    "method: the revised editable source is saved alongside the output, so the next edit starts from a real source, not a flattened export");
  gatedBoolCheck(results, "editing_and_preservation",
    "editable_source_kept_when_revisable", manifest,
    ["preservation", "revisable_deliverable_present"],
    ["preservation", "editable_source_kept_for_revisable"],
    "quality gate: an editable source is kept for the deliverable likely to be revised again",
    "no revisable deliverable declared");
  falseCheck(results, "editing_and_preservation",
    "only_editable_source_not_overwritten_with_flattened_export", manifest,
    ["preservation", "only_editable_source_overwritten_with_flattened_export_present"],
    "red line: the only editable source is never overwritten with a flattened export");

  // ---- Section 3: conversion_and_verification ----
  const verificationPresent = documentsIsList &&
    documents.every((d) => hasField(d, "output_reopened_and_checked"));
  check(results, "conversion_and_verification",
    "every_document_output_reopened_and_checked", documentsRaw,
    verificationPresent,
    documentsIsList && (documentsCount as number) > 0 &&
      documentsWithoutVerification !== null &&
      documentsWithoutVerification.length === 0,
    "quality gate: every declared document row declares its output file was re-opened and checked after editing or conversion — the finished file is verified, not the file that was intended");
  boolCheck(results, "conversion_and_verification",
    "output_reopened_and_checked_after_edit_or_conversion", manifest,
    ["verification", "output_reopened_and_checked_after_edit_or_conversion"],
    "quality gate: the output file was re-opened and checked after editing or conversion");
  boolCheck(results, "conversion_and_verification",
    "headings_tables_totals_match_source_and_output", manifest,
    ["verification", "headings_tables_totals_match_source_and_output"],
    "quality gate: headings, tables, and totals match between source and output");
  gatedBoolCheck(results, "conversion_and_verification",
    "conversion_output_reopened_and_compared_when_converted", manifest,
    ["conversion", "conversion_performed"],
    ["conversion", "output_reopened_and_compared_section_by_section"],
    "method: for conversion, the output is re-opened and compared section by section — headings, tables, lists, figures, and totals must all survive",
    "no conversion declared performed");
  gatedBoolCheck(results, "conversion_and_verification",
    "conversion_content_survives_when_converted", manifest,
    ["conversion", "conversion_performed"],
    ["conversion", "headings_tables_lists_figures_totals_survive"],
    "method: headings, tables, lists, figures, and totals all survive the declared conversion",
    "no conversion declared performed");
  gatedBoolCheck(results, "conversion_and_verification",
    "conversion_loss_fixed_or_reported_when_detected", manifest,
    ["conversion", "content_loss_detected"],
    ["conversion", "loss_fixed_or_reported_plainly"],
    "method: a conversion that drops content, garbles a table, or loses formatting that carries meaning is treated as failed — fixed, or the loss reported plainly",
    "no conversion content loss declared detected");
  gatedFalseCheck(results, "conversion_and_verification",
    "no_conversion_with_dropped_content_shipped", manifest,
    ["conversion", "conversion_performed"],
    ["conversion", "conversion_with_dropped_content_shipped_present"],
    "red line: no conversion that dropped content is shipped",
    "no conversion declared performed");

  // ---- Section 4: delivery_and_hygiene ----
  gatedBoolCheck(results, "delivery_and_hygiene",
    "send_copy_is_docx_not_markdown_when_shared", manifest,
    ["deliverable", "shared_externally"],
    ["deliverable", "send_copy_is_docx_not_markdown"],
    "method: for shared deliverables a proper Word .docx is built — Markdown is never sent as the deliverable to people outside the caller's systems",
    "no externally shared deliverable declared");
  gatedFalseCheck(results, "delivery_and_hygiene",
    "no_markdown_sent_as_external_deliverable", manifest,
    ["deliverable", "shared_externally"],
    ["deliverable", "markdown_sent_as_external_deliverable_present"],
    "red line: Markdown is never sent when the deliverable is meant for people outside the caller's systems",
    "no externally shared deliverable declared");
  boolCheck(results, "delivery_and_hygiene",
    "draft_banners_comments_tracked_changes_stripped", manifest,
    ["deliverable", "draft_banners_comments_tracked_changes_stripped"],
    "method: draft banners, review marks, comments, and tracked changes are stripped from the send copy");
  falseCheck(results, "delivery_and_hygiene",
    "send_copy_free_of_draft_marks", manifest,
    ["deliverable", "send_copy_contains_draft_marks_present"],
    "quality gate: send copies have zero draft banners, comments, or tracked changes");
  boolCheck(results, "delivery_and_hygiene",
    "findings_first_in_decision_order_with_locations", manifest,
    ["delivery", "findings_first_in_decision_order_with_locations"],
    "delivery: findings come first, in the order the decision needs them, locations attached");
  gatedBoolCheck(results, "delivery_and_hygiene",
    "change_list_provided_when_edits_performed", manifest,
    ["editing", "edits_performed"],
    ["delivery", "change_list_provided"],
    "delivery: edits carry a short change list — what moved, what was rewritten, what was left alone",
    "no edits declared performed");
  boolCheck(results, "delivery_and_hygiene",
    "finished_file_in_send_format_plus_editable_source", manifest,
    ["delivery", "finished_file_in_send_format_plus_editable_source"],
    "delivery: the finished file is delivered in its send format, plus the editable source kept beside it");
  boolCheck(results, "delivery_and_hygiene",
    "loss_gap_unreadable_stated_in_delivery_note", manifest,
    ["delivery", "loss_gap_unreadable_stated_in_delivery_note"],
    "delivery: any loss, gap, or unreadable section is stated in the delivery note itself");

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
    verdict = "DOCUMENT_OPERATIONS_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DOCUMENT_OPERATIONS_SOUND";
  }

  const computedNames = [
    "documents_declared",
    "findings_declared",
    "every_finding_has_location_recorded",
    "every_finding_quoted_exactly_before_interpretation",
    "every_document_output_reopened_and_checked",
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
    service: "document-operations-service",
    atom_version: "0.1.0",
    operation: manifest["operation"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    documents_count: documentsCount,
    documents_without_output_verification: documentsWithoutVerification,
    output_verification_coverage: fmt4(verificationCoverage),
    findings_count: findingsCount,
    findings_without_location: findingsWithoutLocation,
    location_coverage: fmt4(locationCoverage),
    findings_not_quoted_exactly_first: findingsNotQuoted,
    exact_quote_coverage: fmt4(exactQuoteCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across four sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DOCUMENT OPERATIONS SERVICE",
    `operation: ${pyStr(verdict.operation ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
