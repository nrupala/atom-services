// Condition monitoring triage — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/condition-monitoring-triage/src/condition_monitoring_triage.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string are
// byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";

import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  asset: "string",
  baseline: {
    exists: "boolean",
    captured_under_known_load: "boolean",
    repair_since_baseline: "boolean",
    post_repair_baseline_captured: "boolean",
  },
  monitoring: {
    techniques_match_asset: "boolean",
    fixed_route_points: "boolean",
    same_instrument_class: "boolean",
  },
  context: {
    load_recorded: "boolean",
    ambient_recorded: "boolean",
    speed_recorded: "boolean",
  },
  trending: {
    deltas_vs_baseline_computed: "boolean",
    rate_of_change_considered: "boolean",
    repair_events_annotated: "boolean",
  },
  bands: { defined_per_standard_or_oem: "boolean" },
  readings: [{
    parameter: "string",
    value: "number",
    watch_limit: "number",
    warning_limit: "number",
    action_limit: "number",
  }],
  alarms: [{
    id: "string",
    disposition: "string",
    reasoning_recorded: "boolean",
    recheck_interval_set: "boolean",
    work_request_raised: "boolean",
  }],
  escalation: {
    findings_sent_with_trend_pack: "boolean",
    alarm_closed_without_triage_note: "boolean",
    condemned_or_cleared_on_single_reading: "boolean",
  },
};

export const SECTIONS = [
  "baseline",
  "technique_coverage",
  "context",
  "trending",
  "alert_bands_and_triage",
  "escalation",
] as const;

export const DISPOSITIONS = ["noise", "watch", "act"] as const;

export const BAND_ORDER: Record<string, number> = {
  normal: 0,
  watch: 1,
  warning: 2,
  action: 3,
};

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
  highest_band: string | null;
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

function getFrom(
  obj: Record<string, unknown>,
  key: string,
): [unknown, boolean] {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) return [null, false];
  return [obj[key], true];
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function readingBand(reading: Record<string, unknown>): string | null {
  const [value, hasValue] = getFrom(reading, "value");
  const [watch, hasWatch] = getFrom(reading, "watch_limit");
  const [warning, hasWarning] = getFrom(reading, "warning_limit");
  const [action, hasAction] = getFrom(reading, "action_limit");
  if (!(hasValue && hasWatch && hasWarning && hasAction &&
        isNumber(value) && isNumber(watch) && isNumber(warning) &&
        isNumber(action))) {
    return null;
  }
  if ((value as number) >= (action as number)) return "action";
  if ((value as number) >= (warning as number)) return "warning";
  if ((value as number) >= (watch as number)) return "watch";
  return "normal";
}

function readingsChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): string | null {
  const [readings, hasReadings] = getPath(manifest, "readings");
  const [alarms, hasAlarms] = getPath(manifest, "alarms");
  let highest: string | null = null;
  if (!hasReadings || !Array.isArray(readings) || readings.length === 0) {
    check(results, "alert_bands_and_triage",
      "readings_classified_against_bands",
      readings, false, false, "no readings declared");
    check(results, "alert_bands_and_triage",
      "action_band_readings_have_act_triage",
      readings, false, false, "no readings declared");
    return null;
  }
  let incomplete = false;
  let disordered = false;
  let anyAction = false;
  for (const reading of readings) {
    if (!isPyDict(reading)) {
      incomplete = true;
      continue;
    }
    const band = readingBand(reading);
    if (band === null) {
      incomplete = true;
      continue;
    }
    const [watch] = getFrom(reading, "watch_limit");
    const [warning] = getFrom(reading, "warning_limit");
    const [action] = getFrom(reading, "action_limit");
    if (!((watch as number) <= (warning as number) &&
          (warning as number) <= (action as number))) {
      disordered = true;
    }
    if (band === "action") anyAction = true;
    if (highest === null || BAND_ORDER[band] > BAND_ORDER[highest]) {
      highest = band;
    }
  }
  if (incomplete) {
    check(results, "alert_bands_and_triage",
      "readings_classified_against_bands",
      readings, false, false,
      "a reading is missing its value or band limits");
  } else if (disordered) {
    check(results, "alert_bands_and_triage",
      "readings_classified_against_bands",
      readings, true, false,
      "band limits out of order (watch <= warning <= action required)");
  } else {
    check(results, "alert_bands_and_triage",
      "readings_classified_against_bands",
      readings, true, true,
      "every reading classified against its declared bands");
  }
  if (!hasAlarms || !Array.isArray(alarms)) {
    check(results, "alert_bands_and_triage",
      "action_band_readings_have_act_triage",
      alarms, false, false, "no alarm triage record declared");
  } else {
    const hasAct = alarms.some(
      (a) => isPyDict(a) && getFrom(a, "disposition")[0] === "act");
    check(results, "alert_bands_and_triage",
      "action_band_readings_have_act_triage",
      alarms, true, hasAct || !anyAction,
      "a reading at or beyond its action limit requires an act triage (work request)");
  }
  return highest;
}

function alarmsCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): void {
  const [alarms, hasAlarms] = getPath(manifest, "alarms");
  if (!hasAlarms || !Array.isArray(alarms)) {
    check(results, "alert_bands_and_triage", "alarms_fully_triaged",
      alarms, false, false, "no alarm triage record declared");
    return;
  }
  let incomplete = false;
  let violating = false;
  for (const alarm of alarms) {
    if (!isPyDict(alarm)) {
      incomplete = true;
      continue;
    }
    const [disposition, hasDisp] = getFrom(alarm, "disposition");
    const [reasoning, hasReasoning] = getFrom(alarm, "reasoning_recorded");
    if (!(hasDisp && hasReasoning)) {
      incomplete = true;
      continue;
    }
    if (!(DISPOSITIONS as readonly unknown[]).includes(disposition) ||
        reasoning !== true) {
      violating = true;
      continue;
    }
    if (disposition === "watch") {
      const [recheck, hasRecheck] = getFrom(alarm, "recheck_interval_set");
      if (!hasRecheck) incomplete = true;
      else if (recheck !== true) violating = true;
    }
    if (disposition === "act") {
      const [request, hasRequest] = getFrom(alarm, "work_request_raised");
      if (!hasRequest) incomplete = true;
      else if (request !== true) violating = true;
    }
  }
  if (incomplete) {
    check(results, "alert_bands_and_triage", "alarms_fully_triaged",
      alarms, false, false,
      "an alarm is missing its disposition, reasoning, or follow-through fields");
  } else {
    check(results, "alert_bands_and_triage", "alarms_fully_triaged",
      alarms, true, !violating,
      "every alarm triaged — noise / watch (recheck interval) / act (work request) — with reasoning recorded");
  }
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: baseline (skill method 1 + quality gate) ----
  boolCheck(results, "baseline", "baseline_exists", manifest,
    ["baseline", "exists"],
    "quality gate: baselines exist for critical assets");
  boolCheck(results, "baseline", "baseline_captured_under_known_load", manifest,
    ["baseline", "captured_under_known_load"],
    "baseline as-installed, under known load");
  const [repair, hasRepair] = getPath(manifest, "baseline", "repair_since_baseline");
  const [post, hasPost] = getPath(manifest, "baseline", "post_repair_baseline_captured");
  if (hasRepair && pyTruthy(repair)) {
    check(results, "baseline", "post_repair_baseline_captured",
      post, hasPost, post === true,
      "quality gate: post-repair baselines captured (verify the fix actually fixed it)");
  } else {
    check(results, "baseline", "post_repair_baseline_captured",
      repair, hasRepair, true, "no repair since baseline declared");
  }

  // ---- Section 2: technique_coverage (skill methods 2-3) ----
  boolCheck(results, "technique_coverage", "techniques_match_asset", manifest,
    ["monitoring", "techniques_match_asset"],
    "techniques by asset: vibration / thermography / ESA / DGA as the asset class requires");
  boolCheck(results, "technique_coverage", "fixed_routes_and_points", manifest,
    ["monitoring", "fixed_route_points"],
    "fixed routes; same points, same method");
  boolCheck(results, "technique_coverage", "same_instrument_class", manifest,
    ["monitoring", "same_instrument_class"],
    "same instrument class — comparability is the whole game");

  // ---- Section 3: context (skill method 4 + quality gate) ----
  boolCheck(results, "context", "load_recorded_with_readings", manifest,
    ["context", "load_recorded"],
    "quality gate: readings carry load context");
  boolCheck(results, "context", "ambient_recorded", manifest,
    ["context", "ambient_recorded"],
    "quality gate: readings carry ambient context");
  boolCheck(results, "context", "speed_recorded", manifest,
    ["context", "speed_recorded"], "log speed with every reading");

  // ---- Section 4: trending (skill method 4) ----
  boolCheck(results, "trending", "deltas_vs_baseline_computed", manifest,
    ["trending", "deltas_vs_baseline_computed"],
    "deltas and rates-of-change beat absolute numbers");
  boolCheck(results, "trending", "rate_of_change_considered", manifest,
    ["trending", "rate_of_change_considered"],
    "trend + context: rates-of-change considered");
  boolCheck(results, "trending", "repair_events_annotated", manifest,
    ["trending", "repair_events_annotated"],
    "annotate charts with repair events");

  // ---- Section 5: alert_bands_and_triage (skill method 5 + gate) ----
  boolCheck(results, "alert_bands_and_triage",
    "bands_defined_per_standard_or_oem", manifest,
    ["bands", "defined_per_standard_or_oem"],
    "define watch/warning/action bands per site standard/OEM");
  const highestBand = readingsChecks(results, manifest);
  alarmsCheck(results, manifest);

  // ---- Section 6: escalation (skill method 6 + red line) ----
  boolCheck(results, "escalation",
    "suspicious_findings_escalated_with_trend_pack", manifest,
    ["escalation", "findings_sent_with_trend_pack"],
    "suspicious findings go to the responsible engineer with the full trend pack, not a single number");
  const [closed, hasClosed] = getPath(
    manifest, "escalation", "alarm_closed_without_triage_note");
  check(results, "escalation", "no_alarm_closed_without_triage_note",
    closed, hasClosed, closed === false,
    "skill red line: no alarm closes without a triage note");
  const [single, hasSingle] = getPath(
    manifest, "escalation", "condemned_or_cleared_on_single_reading");
  check(results, "escalation", "no_condemn_or_clear_on_single_reading",
    single, hasSingle, single === false,
    "skill red line: never condemn or clear equipment on one reading without context");

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
    verdict = "TRIAGE_UNSOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "TRIAGE_SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "condition-monitoring-triage",
    atom_version: "0.1.0",
    asset: manifest["asset"] ?? null,
    verdict,
    sections,
    checks: results,
    highest_band: highestBand,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "CONDITION-MONITORING TRIAGE",
    `asset: ${pyStr(verdict.asset ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(22)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
