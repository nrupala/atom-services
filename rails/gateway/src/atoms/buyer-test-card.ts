// Buyer-test card — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/buyer-test-card/src/buyer_test_card.py (evaluate() +
// stamp()). No logic changes: every verdict, section outcome,
// per-check status, evidence string, computed value and the
// summary string are byte-identical to the Python output for the
// same input. Computed day counts use the shared fixed
// serialization: round half up to 6dp — floor(v * 1000000 + 0.5)
// / 1000000 — then format with exactly six decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (decision / disposition) are validated as
// strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  idea: "string",
  decision: "string",
  disposition: "string",
  hypothesis: {
    written: "boolean",
    single: "boolean",
    states_capability_under_constraints: "boolean",
  },
  criteria: {
    success_written_before_start: "boolean",
    kill_written_before_start: "boolean",
    agreed_by_decision_owner_before_build: "boolean",
  },
  timebox: {
    hard_limit_set: "boolean",
    limit_days: "number",
    elapsed_days: "number",
    scope_limited_to_critical_path: "boolean",
    scope_creep_refused_politely: "boolean",
  },
  evidence: {
    from_measurements_tests_or_demo: "boolean",
    numbers_over_impressions: "boolean",
    stubs_and_mocks_recorded: "boolean",
  },
  production_boundary: {
    slid_into_production: "boolean",
    claimed_as_production_evidence: "boolean",
  },
  findings: {
    memo_written: "boolean",
    rationale_references_criteria: "boolean",
    decision_logged: "boolean",
    not_tested_list_clear: "boolean",
    adopting_routed_through_full_team_process: "boolean",
  },
};

export const SECTIONS = [
  "hypothesis",
  "criteria_upfront",
  "timebox_and_scope",
  "disposition_and_production_boundary",
  "evidence",
  "decision_and_findings",
] as const;

export const STATED_DECISIONS = [
  "adopt",
  "adapt",
  "abandon",
];

export const STATED_DISPOSITIONS = [
  "disposable",
  "slated_for_hardening",
];

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
  idea: unknown;
  decision: unknown;
  disposition: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  timebox_limit_days: unknown;
  timebox_elapsed_days: unknown;
  timebox_overrun_days: string | null;
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: hypothesis ----
  boolCheck(results, "hypothesis", "hypothesis_written",
    manifest, ["hypothesis", "written"],
    "method step 1: one hypothesis is written down");
  boolCheck(results, "hypothesis", "single_hypothesis",
    manifest, ["hypothesis", "single"],
    "method step 1: the record carries one hypothesis, not several");
  boolCheck(results, "hypothesis",
    "hypothesis_states_capability_under_constraints",
    manifest, ["hypothesis", "states_capability_under_constraints"],
    "method step 1: the hypothesis is in the stated form — X can do Y under constraints Z");

  // ---- Section 2: criteria_upfront ----
  boolCheck(results, "criteria_upfront",
    "success_criteria_written_before_start",
    manifest, ["criteria", "success_written_before_start"],
    "method step 2 / quality gate: success criteria are written before the start");
  boolCheck(results, "criteria_upfront",
    "kill_criteria_written_before_start",
    manifest, ["criteria", "kill_written_before_start"],
    "method step 2 / quality gate: kill criteria are written before the start");
  boolCheck(results, "criteria_upfront",
    "criteria_agreed_by_decision_owner_before_build",
    manifest, ["criteria", "agreed_by_decision_owner_before_build"],
    "method step 2: the success and kill criteria are agreed by the decision owner before the build");

  // ---- Section 3: timebox_and_scope ----
  boolCheck(results, "timebox_and_scope", "timebox_hard_limit_set",
    manifest, ["timebox", "hard_limit_set"],
    "method step 3 / red line: a hard timebox limit is set — no unbounded POCs");
  const [limit, hasLimit] = getPath(manifest, "timebox", "limit_days");
  const [elapsed, hasElapsed] = getPath(manifest, "timebox", "elapsed_days");
  const bothNumbers = hasLimit && hasElapsed &&
    isNumber(limit) && isNumber(elapsed);
  const overrun: number | null = bothNumbers
    ? (elapsed as number) - (limit as number)
    : null;
  const within = bothNumbers &&
    (limit as number) > 0 &&
    (elapsed as number) >= 0 &&
    (elapsed as number) <= (limit as number);
  check(results, "timebox_and_scope", "timebox_within_declared_limit",
    elapsed, bothNumbers, within,
    "method step 3 / quality gate: the elapsed days do not exceed the declared timebox limit in days, the limit is positive, and the elapsed time is not negative — the skill states no numeric cap, so only the declared numbers are compared");
  boolCheck(results, "timebox_and_scope",
    "scope_limited_to_critical_path",
    manifest, ["timebox", "scope_limited_to_critical_path"],
    "method step 3: scope is the critical path, nothing more");
  boolCheck(results, "timebox_and_scope", "scope_creep_refused_politely",
    manifest, ["timebox", "scope_creep_refused_politely"],
    "quality gate: scope creep is refused politely");

  // ---- Section 4: disposition_and_production_boundary ----
  const [disposition, hasDisposition] = getPath(manifest, "disposition");
  const dispositionIsString = hasDisposition &&
    typeof disposition === "string";
  check(results, "disposition_and_production_boundary",
    "disposition_is_a_stated_option", disposition, dispositionIsString,
    dispositionIsString &&
      STATED_DISPOSITIONS.includes(disposition as string),
    "method step 4: the disposition says which it is — disposable (throwaway by default) or explicitly slated_for_hardening");
  falseCheck(results, "disposition_and_production_boundary",
    "no_silent_poc_to_production",
    manifest, ["production_boundary", "slid_into_production"],
    "red line: no silent POC-to-production gradient — the POC does not slide into production");
  falseCheck(results, "disposition_and_production_boundary",
    "poc_result_not_claimed_as_production_evidence",
    manifest, ["production_boundary", "claimed_as_production_evidence"],
    "red line: 'it worked in the POC' is never claimed as production evidence");

  // ---- Section 5: evidence ----
  boolCheck(results, "evidence",
    "evidence_from_measurements_tests_or_demo",
    manifest, ["evidence", "from_measurements_tests_or_demo"],
    "method step 5: evidence is measurements, tests, or a demo");
  boolCheck(results, "evidence", "evidence_numbers_over_impressions",
    manifest, ["evidence", "numbers_over_impressions"],
    "method step 5: the evidence is numbers over impressions");
  boolCheck(results, "evidence", "stubs_and_mocks_recorded",
    manifest, ["evidence", "stubs_and_mocks_recorded"],
    "method step 5: what was stubbed or mocked is recorded");

  // ---- Section 6: decision_and_findings ----
  boolCheck(results, "decision_and_findings", "findings_memo_written",
    manifest, ["findings", "memo_written"],
    "quality gate: a findings memo is written, with decision and evidence");
  const [decision, hasDecision] = getPath(manifest, "decision");
  const decisionIsString = hasDecision && typeof decision === "string";
  check(results, "decision_and_findings", "decision_is_a_stated_option",
    decision, decisionIsString,
    decisionIsString && STATED_DECISIONS.includes(decision as string),
    "method step 6: the decision is one of the options the skill names — adopt, adapt, or abandon");
  boolCheck(results, "decision_and_findings",
    "decision_rationale_references_criteria",
    manifest, ["findings", "rationale_references_criteria"],
    "method step 6: the written rationale references the criteria");
  boolCheck(results, "decision_and_findings", "decision_logged",
    manifest, ["findings", "decision_logged"],
    "method step 6: the decision is logged");
  boolCheck(results, "decision_and_findings", "not_tested_list_clear",
    manifest, ["findings", "not_tested_list_clear"],
    "quality gate: a clear 'not tested / not included' list is present");
  boolCheck(results, "decision_and_findings",
    "adopting_routed_through_full_team_process",
    manifest, ["findings", "adopting_routed_through_full_team_process"],
    "method step 7: if adopting, the work is routed through the full team process (spec, build, test, review) — POCs never slide into production");

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
    verdict = "CARD_NOT_COMPLETE";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CARD_COMPLETE";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "timebox_within_declared_limit" ||
      r.check === "disposition_is_a_stated_option" ||
      r.check === "decision_is_a_stated_option")
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const countStatus = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "buyer-test-card",
    atom_version: "0.1.0",
    idea: manifest["idea"] ?? null,
    decision: manifest["decision"] ?? null,
    disposition: manifest["disposition"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    timebox_limit_days: hasLimit ? limit : null,
    timebox_elapsed_days: hasElapsed ? elapsed : null,
    timebox_overrun_days: fmt6(overrun),
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "BUYER-TEST CARD",
    `idea: ${pyStr(verdict.idea ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
