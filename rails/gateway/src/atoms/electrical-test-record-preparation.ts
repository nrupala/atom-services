// Electrical test record preparation — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/electrical-test-record-preparation/src/
// electrical_test_record_preparation.py (evaluate() + stamp()).
// No logic changes: every verdict, section outcome, per-check status,
// evidence string and the summary string are byte-identical to the
// Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  asset: "string",
  record: {
    asset_id_present: "boolean",
    datetime_present: "boolean",
    ambient_present: "boolean",
    load_condition_present: "boolean",
    instrument_named: "boolean",
    calibration_status_recorded: "boolean",
    test_method_reference_present: "boolean",
    acceptance_criteria_present: "boolean",
    verdict_value: "string",
    tester_named: "boolean",
    reviewer_named: "boolean",
    has_na_fields: "boolean",
    na_reasons_recorded: "boolean",
    is_critical_test: "boolean",
    reviewer_signoff_present: "boolean",
  },
  hygiene: {
    asset_ids_consistent: "boolean",
    si_units_used: "boolean",
    conversions_noted: "boolean",
    iso_timestamps: "boolean",
    single_source_of_truth: "boolean",
    raw_data_overwritten: "boolean",
    photos_attached_and_named: "boolean",
  },
  format: {
    single_header_row: "boolean",
    tidy_long_format: "boolean",
    required_columns_present: "boolean",
  },
  readings: [{
    point: "string",
    value: "number",
    unit: "string",
    acceptance_min: "number",
    acceptance_max: "number",
  }],
  trending: {
    same_point_method_instrument_class: "boolean",
    plotted_vs_time: "boolean",
    load_varies: "boolean",
    plotted_vs_load: "boolean",
    repair_events_annotated: "boolean",
    control_bands_from_limits_or_baseline: "boolean",
    trends_updated_on_cadence: "boolean",
    anomalies_present: "boolean",
    anomalies_flagged_with_action: "boolean",
  },
  plotting: {
    axes_labeled_with_units: "boolean",
    version_and_date_on_charts: "boolean",
    dual_axis_used: "boolean",
    out_of_band_points_present: "boolean",
    out_of_band_highlighted: "boolean",
    summary_sheet_per_asset: "boolean",
  },
  retention: {
    archived_and_findable: "boolean",
    retention_per_policy: "boolean",
    superseded_revisions_exist: "boolean",
    superseded_retained_marked: "boolean",
    corrections_made: "boolean",
    correction_revision_notes_present: "boolean",
    raw_data_destroyed: "boolean",
  },
};

export const SECTIONS = [
  "template_completeness",
  "data_hygiene",
  "machine_readable_format",
  "trending",
  "plotting_discipline",
  "retention_and_audit",
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
  asset: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  readings_evaluated: number;
  readings_out_of_criteria: number;
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

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function isNonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function readingsChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): [number, number] {
  const [readings, hasReadings] = getPath(manifest, "readings");
  const [verdictValue, hasVerdict] = getPath(manifest, "record", "verdict_value");
  if (!hasReadings || !Array.isArray(readings) || readings.length === 0) {
    check(results, "machine_readable_format",
      "readings_complete_against_criteria",
      readings, false, false, "no readings declared");
    check(results, "machine_readable_format",
      "declared_verdict_matches_readings",
      readings, false, false, "no readings declared");
    return [0, 0];
  }
  let incomplete = false;
  let disordered = false;
  let evaluated = 0;
  let outOfCriteria = 0;
  for (const reading of readings) {
    if (!isPyDict(reading)) {
      incomplete = true;
      continue;
    }
    const [point, hasPoint] = getPath(reading, "point");
    const [value, hasValue] = getPath(reading, "value");
    const [unit, hasUnit] = getPath(reading, "unit");
    const [low, hasLow] = getPath(reading, "acceptance_min");
    const [high, hasHigh] = getPath(reading, "acceptance_max");
    if (!(hasPoint && hasValue && hasUnit && hasLow && hasHigh &&
          isNonemptyStr(point) && isNumber(value) && isNonemptyStr(unit) &&
          isNumber(low) && isNumber(high))) {
      incomplete = true;
      continue;
    }
    evaluated += 1;
    if (!((low as number) <= (high as number))) {
      disordered = true;
      continue;
    }
    if ((value as number) < (low as number) ||
        (value as number) > (high as number)) {
      outOfCriteria += 1;
    }
  }
  if (incomplete) {
    check(results, "machine_readable_format",
      "readings_complete_against_criteria",
      readings, false, false,
      "a reading is missing its point, value, unit, or acceptance limits");
  } else if (disordered) {
    check(results, "machine_readable_format",
      "readings_complete_against_criteria",
      readings, true, false,
      "acceptance limits out of order (acceptance_min <= acceptance_max required)");
  } else {
    check(results, "machine_readable_format",
      "readings_complete_against_criteria",
      readings, true, true,
      "every reading carries a point, a value with units, and its acceptance criteria");
  }
  if (incomplete) {
    check(results, "machine_readable_format",
      "declared_verdict_matches_readings",
      verdictValue, false, false,
      "a reading is incomplete, so the declared verdict cannot be verified against the readings");
  } else if (disordered) {
    check(results, "machine_readable_format",
      "declared_verdict_matches_readings",
      verdictValue, hasVerdict, false,
      "acceptance limits out of order, so the declared verdict cannot be verified against the readings");
  } else if (!hasVerdict) {
    check(results, "machine_readable_format",
      "declared_verdict_matches_readings",
      verdictValue, false, false,
      "no verdict value declared on the sheet");
  } else {
    const expected = outOfCriteria > 0 ? "fail" : "pass";
    check(results, "machine_readable_format",
      "declared_verdict_matches_readings",
      verdictValue, true, verdictValue === expected,
      "the declared verdict matches the readings against their acceptance criteria (any reading outside its limits means the test verdict is fail)");
  }
  return [evaluated, outOfCriteria];
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: template_completeness ----
  boolCheck(results, "template_completeness", "asset_id_recorded",
    manifest, ["record", "asset_id_present"],
    "test sheet field: asset ID");
  boolCheck(results, "template_completeness", "datetime_recorded",
    manifest, ["record", "datetime_present"],
    "test sheet field: date/time");
  boolCheck(results, "template_completeness", "ambient_recorded",
    manifest, ["record", "ambient_present"],
    "test sheet field: ambient");
  boolCheck(results, "template_completeness", "load_condition_recorded",
    manifest, ["record", "load_condition_present"],
    "test sheet field: load/condition");
  const [instrument, hasInstrument] = getPath(manifest, "record", "instrument_named");
  const [calibration, hasCalibration] = getPath(manifest, "record", "calibration_status_recorded");
  check(results, "template_completeness",
    "instrument_and_calibration_recorded",
    instrument, hasInstrument && hasCalibration,
    instrument === true && calibration === true,
    "test sheet field: instrument + calibration status");
  boolCheck(results, "template_completeness",
    "test_method_reference_recorded", manifest,
    ["record", "test_method_reference_present"],
    "test sheet field: test method reference");
  boolCheck(results, "template_completeness",
    "acceptance_criteria_recorded", manifest,
    ["record", "acceptance_criteria_present"],
    "test sheet field: acceptance criteria");
  const [verdictValue, hasVerdictValue] = getPath(manifest, "record", "verdict_value");
  check(results, "template_completeness", "verdict_recorded",
    verdictValue, hasVerdictValue,
    verdictValue === "pass" || verdictValue === "fail",
    "test sheet field: verdict (pass/fail) against the acceptance criteria");
  boolCheck(results, "template_completeness", "tester_named",
    manifest, ["record", "tester_named"],
    "test sheet field: tester");
  boolCheck(results, "template_completeness", "reviewer_named",
    manifest, ["record", "reviewer_named"],
    "test sheet field: reviewer");
  const [hasNa, hasHasNa] = getPath(manifest, "record", "has_na_fields");
  const [naReasons, hasNaReasons] = getPath(manifest, "record", "na_reasons_recorded");
  if (hasHasNa && pyTruthy(hasNa)) {
    check(results, "template_completeness", "na_fields_have_reasons",
      naReasons, hasNaReasons, naReasons === true,
      "'N/A' needs a reason; blank fields are defects");
  } else {
    check(results, "template_completeness", "na_fields_have_reasons",
      hasNa, hasHasNa, true, "no 'N/A' fields declared");
  }
  const [critical, hasCritical] = getPath(manifest, "record", "is_critical_test");
  const [signoff, hasSignoff] = getPath(manifest, "record", "reviewer_signoff_present");
  if (hasCritical && pyTruthy(critical)) {
    check(results, "template_completeness",
      "reviewer_signoff_on_critical_tests",
      signoff, hasSignoff, signoff === true,
      "quality gate: reviewer sign-off on critical tests");
  } else {
    check(results, "template_completeness",
      "reviewer_signoff_on_critical_tests",
      critical, hasCritical, true,
      "not a critical test — reviewer sign-off not required");
  }

  // ---- Section 2: data_hygiene ----
  boolCheck(results, "data_hygiene", "asset_ids_consistent",
    manifest, ["hygiene", "asset_ids_consistent"],
    "consistent asset IDs");
  boolCheck(results, "data_hygiene", "si_units_used", manifest,
    ["hygiene", "si_units_used"], "SI units — no unit soup");
  boolCheck(results, "data_hygiene", "conversions_noted", manifest,
    ["hygiene", "conversions_noted"],
    "SI units with conversions noted");
  boolCheck(results, "data_hygiene", "iso_timestamps_used", manifest,
    ["hygiene", "iso_timestamps"], "ISO timestamps");
  boolCheck(results, "data_hygiene", "single_source_of_truth",
    manifest, ["hygiene", "single_source_of_truth"],
    "one source of truth (file/DB)");
  falseCheck(results, "data_hygiene", "raw_data_never_overwritten",
    manifest, ["hygiene", "raw_data_overwritten"],
    "raw data stays RAW (never overwrite — add derived columns)");
  boolCheck(results, "data_hygiene", "photos_attached_and_named",
    manifest, ["hygiene", "photos_attached_and_named"],
    "photos attached and named");

  // ---- Section 3: machine_readable_format ----
  boolCheck(results, "machine_readable_format", "single_header_row",
    manifest, ["format", "single_header_row"],
    "machine-readable first: one header row");
  boolCheck(results, "machine_readable_format", "tidy_long_format",
    manifest, ["format", "tidy_long_format"],
    "tidy/long format (asset, date, point, value, unit, load)");
  boolCheck(results, "machine_readable_format",
    "required_columns_present", manifest,
    ["format", "required_columns_present"],
    "tidy columns present: asset, date, point, value, unit, load");
  const [readingsEvaluated, readingsOut] = readingsChecks(results, manifest);

  // ---- Section 4: trending ----
  boolCheck(results, "trending",
    "same_point_method_and_instrument_class", manifest,
    ["trending", "same_point_method_instrument_class"],
    "trending: same point + method + instrument class across time");
  boolCheck(results, "trending", "plotted_vs_time", manifest,
    ["trending", "plotted_vs_time"], "plot vs time");
  const [loadVaries, hasLoadVaries] = getPath(manifest, "trending", "load_varies");
  const [vsLoad, hasVsLoad] = getPath(manifest, "trending", "plotted_vs_load");
  if (hasLoadVaries && pyTruthy(loadVaries)) {
    check(results, "trending", "plotted_vs_load_when_load_varies",
      vsLoad, hasVsLoad, vsLoad === true,
      "plot vs time AND vs load where load varies");
  } else {
    check(results, "trending", "plotted_vs_load_when_load_varies",
      loadVaries, hasLoadVaries, true,
      "load does not vary — a vs-load plot is not required");
  }
  boolCheck(results, "trending", "repair_events_annotated", manifest,
    ["trending", "repair_events_annotated"],
    "annotate repairs/changes on charts");
  boolCheck(results, "trending",
    "control_bands_from_limits_or_baseline", manifest,
    ["trending", "control_bands_from_limits_or_baseline"],
    "control bands from limits or baseline");
  boolCheck(results, "trending", "trends_updated_on_cadence",
    manifest, ["trending", "trends_updated_on_cadence"],
    "quality gate: trends updated on cadence");
  const [anomalies, hasAnomalies] = getPath(manifest, "trending", "anomalies_present");
  const [flagged, hasFlagged] = getPath(manifest, "trending", "anomalies_flagged_with_action");
  if (hasAnomalies && pyTruthy(anomalies)) {
    check(results, "trending", "anomalies_flagged_with_action",
      flagged, hasFlagged, flagged === true,
      "quality gate: anomalies flagged with an action");
  } else {
    check(results, "trending", "anomalies_flagged_with_action",
      anomalies, hasAnomalies, true, "no anomalies declared");
  }

  // ---- Section 5: plotting_discipline ----
  boolCheck(results, "plotting_discipline",
    "axes_labeled_with_units", manifest,
    ["plotting", "axes_labeled_with_units"],
    "labeled axes with units");
  boolCheck(results, "plotting_discipline",
    "version_and_date_on_every_chart", manifest,
    ["plotting", "version_and_date_on_charts"],
    "version + date on every chart");
  falseCheck(results, "plotting_discipline", "no_dual_axis_tricks",
    manifest, ["plotting", "dual_axis_used"],
    "no dual-axis tricks to tell a story");
  const [outPresent, hasOutPresent] = getPath(manifest, "plotting", "out_of_band_points_present");
  const [highlighted, hasHighlighted] = getPath(manifest, "plotting", "out_of_band_highlighted");
  if (hasOutPresent && pyTruthy(outPresent)) {
    check(results, "plotting_discipline",
      "out_of_band_points_highlighted",
      highlighted, hasHighlighted, highlighted === true,
      "out-of-band points highlighted");
  } else {
    check(results, "plotting_discipline",
      "out_of_band_points_highlighted",
      outPresent, hasOutPresent, true,
      "no out-of-band points declared");
  }
  boolCheck(results, "plotting_discipline",
    "summary_sheet_per_asset", manifest,
    ["plotting", "summary_sheet_per_asset"],
    "summary sheet per asset (latest values + verdict)");

  // ---- Section 6: retention_and_audit ----
  boolCheck(results, "retention_and_audit",
    "archived_and_findable", manifest,
    ["retention", "archived_and_findable"],
    "archived, findable in 60 seconds");
  boolCheck(results, "retention_and_audit", "retention_per_policy",
    manifest, ["retention", "retention_per_policy"],
    "retention per policy");
  const [superseded, hasSuperseded] = getPath(manifest, "retention", "superseded_revisions_exist");
  const [retained, hasRetained] = getPath(manifest, "retention", "superseded_retained_marked");
  if (hasSuperseded && pyTruthy(superseded)) {
    check(results, "retention_and_audit",
      "superseded_revisions_retained_marked",
      retained, hasRetained, retained === true,
      "quality gate: records intact after supersession — superseded revisions retained (marked)");
  } else {
    check(results, "retention_and_audit",
      "superseded_revisions_retained_marked",
      superseded, hasSuperseded, true,
      "no superseded revisions declared");
  }
  const [corrections, hasCorrections] = getPath(manifest, "retention", "corrections_made");
  const [notes, hasNotes] = getPath(manifest, "retention", "correction_revision_notes_present");
  if (hasCorrections && pyTruthy(corrections)) {
    check(results, "retention_and_audit",
      "corrections_have_dated_revision_notes",
      notes, hasNotes, notes === true,
      "red line: no retrospective edits without a revision note — corrections via dated revision notes, never silent edits");
  } else {
    check(results, "retention_and_audit",
      "corrections_have_dated_revision_notes",
      corrections, hasCorrections, true,
      "no corrections declared");
  }
  falseCheck(results, "retention_and_audit",
    "raw_data_never_destroyed", manifest,
    ["retention", "raw_data_destroyed"],
    "red line: never destroy raw data");

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
    verdict = "RECORD_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "RECORD_READY";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "electrical-test-record-preparation",
    atom_version: "0.1.0",
    asset: manifest["asset"] ?? null,
    verdict,
    sections,
    checks: results,
    readings_evaluated: readingsEvaluated,
    readings_out_of_criteria: readingsOut,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ELECTRICAL TEST RECORD PREPARATION",
    `asset: ${pyStr(verdict.asset ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(24)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
