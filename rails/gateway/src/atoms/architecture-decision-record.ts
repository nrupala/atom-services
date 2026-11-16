// Architecture decision record — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/architecture-decision-record/src/architecture_decision_record.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed status and
// the summary string are byte-identical to the Python output for
// the same input. The computed page-count excess uses the shared
// fixed serialization: round half up to 4dp —
// floor(v * 10000 + 0.5) / 10000 — then format with exactly four
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  decision: "string",
  nfrs: {
    written: "boolean",
    quantified_where_possible: "boolean",
    agreed_before_design_freeze: "boolean",
  },
  boundaries: {
    contexts_drawn: "boolean",
    core_kept_small: "boolean",
    hidden_coupling_present: "boolean",
    backdoor_paths_present: "boolean",
  },
  contracts: {
    interfaces_documented: "boolean",
    interfaces_versioned: "boolean",
    inputs_outputs_defined: "boolean",
    errors_defined: "boolean",
    defined_before_code: "boolean",
  },
  options: {
    alternatives: [{
      name: "string",
      serious: "boolean",
      tradeoffs_stated: "boolean",
    }],
    prefers_boring_replaceable_tech: "boolean",
  },
  adr: {
    numbered: "boolean",
    context_stated: "boolean",
    decision_stated: "boolean",
    consequences_positive_stated: "boolean",
    consequences_negative_stated: "boolean",
    consequences_risks_stated: "boolean",
    status_stated: "boolean",
    page_count: "number",
  },
  reversibility: {
    assessed: "boolean",
    expensive_choices_isolated_behind_interfaces: "boolean",
    irreversible_decisions_deferred: "boolean",
  },
  security: {
    data_flows_mapped: "boolean",
    encryption_verification_addressed: "boolean",
  },
  dependencies: {
    new_dependency_introduced: "boolean",
    new_dependency_reason_stated: "boolean",
  },
  supersession: {
    has_superseded_adrs: "boolean",
    superseded_adrs_linked_to_replacements: "boolean",
    superseded_silently_rewritten: "boolean",
  },
};

export const SECTIONS = [
  "nfrs_first",
  "boundaries_and_contracts",
  "options_and_tradeoffs",
  "adr_format",
  "reversibility_and_security",
  "lifecycle_and_dependencies",
] as const;

export const STATED_MIN_ALTERNATIVES = 2;
export const STATED_MAX_ALTERNATIVES = 3;
export const STATED_MAX_PAGES = 1;

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
  decision: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  alternatives_count: number | null;
  page_count_over_limit: string | null;
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: nfrs_first ----
  boolCheck(results, "nfrs_first", "nfrs_written",
    manifest, ["nfrs", "written"],
    "NFRs first: non-functional requirements (performance, scale, availability, security, cost) are written before the design");
  boolCheck(results, "nfrs_first", "nfrs_quantified_where_possible",
    manifest, ["nfrs", "quantified_where_possible"],
    "NFRs are quantified where possible, per the skill's method step 1");
  boolCheck(results, "nfrs_first",
    "nfrs_agreed_before_design_freeze",
    manifest, ["nfrs", "agreed_before_design_freeze"],
    "quality gate: NFRs written and agreed before design freeze");

  // ---- Section 2: boundaries_and_contracts ----
  boolCheck(results, "boundaries_and_contracts", "boundaries_drawn",
    manifest, ["boundaries", "contexts_drawn"],
    "boundaries: contexts/modules are drawn before the build");
  boolCheck(results, "boundaries_and_contracts", "core_kept_small",
    manifest, ["boundaries", "core_kept_small"],
    "boundaries: the core is kept small, with clear interfaces at the seams");
  boolCheck(results, "boundaries_and_contracts",
    "interfaces_documented",
    manifest, ["contracts", "interfaces_documented"],
    "quality gate: interfaces are documented");
  boolCheck(results, "boundaries_and_contracts",
    "interfaces_versioned",
    manifest, ["contracts", "interfaces_versioned"],
    "quality gate: interfaces are versioned — contracts are defined and versioned before code");
  boolCheck(results, "boundaries_and_contracts",
    "contract_inputs_outputs_defined",
    manifest, ["contracts", "inputs_outputs_defined"],
    "contracts before code: API/module contracts define inputs and outputs");
  boolCheck(results, "boundaries_and_contracts",
    "contract_errors_defined",
    manifest, ["contracts", "errors_defined"],
    "contracts before code: API/module contracts define errors");
  boolCheck(results, "boundaries_and_contracts",
    "contracts_defined_before_code",
    manifest, ["contracts", "defined_before_code"],
    "contracts before code: the contracts are defined before the code that implements them");
  falseCheck(results, "boundaries_and_contracts",
    "no_hidden_coupling_across_boundaries",
    manifest, ["boundaries", "hidden_coupling_present"],
    "red line: no hidden coupling across boundaries");
  falseCheck(results, "boundaries_and_contracts",
    "no_backdoor_paths_around_contracts",
    manifest, ["boundaries", "backdoor_paths_present"],
    "red line: no backdoor paths around the contracts");

  // ---- Section 3: options_and_tradeoffs ----
  const [alts, hasAlts] = getPath(manifest, "options", "alternatives");
  const altsIsList = hasAlts && Array.isArray(alts);
  const altCount: number | null = altsIsList
    ? (alts as unknown[]).length
    : null;
  const countOk = altsIsList &&
    (alts as unknown[]).length >= STATED_MIN_ALTERNATIVES &&
    (alts as unknown[]).length <= STATED_MAX_ALTERNATIVES;
  check(results, "options_and_tradeoffs",
    "alternatives_count_in_stated_range", altCount,
    altsIsList, countOk,
    "options: list 2-3 real alternatives — the declared alternatives list holds between two and three entries");
  const tradeoffsOk = altsIsList && (alts as unknown[]).length > 0 &&
    (alts as unknown[]).every(
      (a) => isPyDict(a) && a["tradeoffs_stated"] === true);
  check(results, "options_and_tradeoffs",
    "all_alternatives_tradeoffs_stated", alts, altsIsList,
    tradeoffsOk,
    "options: each listed alternative carries its trade-offs (honest trade-offs, stated per alternative)");
  const seriousOk = altsIsList &&
    (alts as unknown[]).some(
      (a) => isPyDict(a) && a["serious"] === true);
  check(results, "options_and_tradeoffs",
    "at_least_one_serious_alternative", alts, altsIsList,
    seriousOk,
    "quality gate: at least one serious alternative considered per major decision");
  boolCheck(results, "options_and_tradeoffs",
    "boring_replaceable_tech_preferred",
    manifest, ["options", "prefers_boring_replaceable_tech"],
    "options: prefer boring, replaceable tech");

  // ---- Section 4: adr_format ----
  boolCheck(results, "adr_format", "adr_numbered",
    manifest, ["adr", "numbered"],
    "artifacts: the ADR is numbered (docs/adr/NNNN-title)");
  boolCheck(results, "adr_format", "context_stated",
    manifest, ["adr", "context_stated"],
    "ADR format: Context is stated");
  boolCheck(results, "adr_format", "decision_stated",
    manifest, ["adr", "decision_stated"],
    "ADR format: Decision is stated");
  boolCheck(results, "adr_format", "consequences_positive_stated",
    manifest, ["adr", "consequences_positive_stated"],
    "ADR format: Consequences state the positives");
  boolCheck(results, "adr_format", "consequences_negative_stated",
    manifest, ["adr", "consequences_negative_stated"],
    "ADR format: Consequences state the negatives");
  boolCheck(results, "adr_format", "consequences_risks_stated",
    manifest, ["adr", "consequences_risks_stated"],
    "ADR format: Consequences state the risks");
  boolCheck(results, "adr_format", "status_stated",
    manifest, ["adr", "status_stated"],
    "ADR format: Status is stated");
  const [pages, hasPages] = getPath(manifest, "adr", "page_count");
  const pagesIsNumber = hasPages && isNumber(pages);
  const pagesOk = pagesIsNumber &&
    (pages as number) <= STATED_MAX_PAGES;
  check(results, "adr_format", "adr_within_one_page_max", pages,
    pagesIsNumber, pagesOk,
    "ADR format: one page max — the declared page count is at or below one page");
  const pageOver: number | null = pagesIsNumber
    ? (pages as number) - STATED_MAX_PAGES
    : null;

  // ---- Section 5: reversibility_and_security ----
  boolCheck(results, "reversibility_and_security",
    "reversibility_assessed",
    manifest, ["reversibility", "assessed"],
    "reversibility: the decision's reversibility is assessed — choices that are cheap to undo are preferred");
  boolCheck(results, "reversibility_and_security",
    "expensive_choices_isolated_behind_interfaces",
    manifest, ["reversibility",
      "expensive_choices_isolated_behind_interfaces"],
    "reversibility: expensive-to-reverse choices are isolated behind interfaces");
  falseCheck(results, "reversibility_and_security",
    "irreversible_decisions_not_deferred",
    manifest, ["reversibility", "irreversible_decisions_deferred"],
    "red line: no 'we'll figure it out later' for irreversible decisions");
  boolCheck(results, "reversibility_and_security",
    "data_flows_mapped",
    manifest, ["security", "data_flows_mapped"],
    "security by design: data flows are mapped");
  boolCheck(results, "reversibility_and_security",
    "encryption_and_verification_addressed",
    manifest, ["security", "encryption_verification_addressed"],
    "security by design: encryption/verification is addressed per the secure-build pattern");

  // ---- Section 6: lifecycle_and_dependencies ----
  const [introduced, hasIntroduced] = getPath(
    manifest, "dependencies", "new_dependency_introduced");
  const [reason, hasReason] = getPath(
    manifest, "dependencies", "new_dependency_reason_stated");
  if (hasIntroduced && pyTruthy(introduced)) {
    check(results, "lifecycle_and_dependencies",
      "new_dependency_reason_stated_when_introduced",
      reason, hasReason, reason === true,
      "options: no new dependency without a reason — a reason is stated for the introduced dependency");
  } else {
    check(results, "lifecycle_and_dependencies",
      "new_dependency_reason_stated_when_introduced",
      introduced, hasIntroduced, true,
      "no new dependency introduced");
  }
  const [superseded, hasSuperseded] = getPath(
    manifest, "supersession", "has_superseded_adrs");
  const [linked, hasLinked] = getPath(
    manifest, "supersession",
    "superseded_adrs_linked_to_replacements");
  if (hasSuperseded && pyTruthy(superseded)) {
    check(results, "lifecycle_and_dependencies",
      "superseded_adrs_link_to_replacements",
      linked, hasLinked, linked === true,
      "quality gate: superseded ADRs link to their replacements");
  } else {
    check(results, "lifecycle_and_dependencies",
      "superseded_adrs_link_to_replacements",
      superseded, hasSuperseded, true,
      "no superseded ADRs declared");
  }
  falseCheck(results, "lifecycle_and_dependencies",
    "superseded_adrs_not_silently_rewritten",
    manifest, ["supersession", "superseded_silently_rewritten"],
    "decisions live in ADRs — written once, superseded, never silently rewritten");

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
    verdict = "ADR_NOT_COMPLETE";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "ADR_COMPLETE";
  }

  const computedStatuses = results
    .filter((r) => r.check === "alternatives_count_in_stated_range" ||
      r.check === "adr_within_one_page_max")
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
    service: "architecture-decision-record",
    atom_version: "0.1.0",
    decision: manifest["decision"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    alternatives_count: altCount,
    page_count_over_limit: fmt4(pageOver),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ARCHITECTURE DECISION RECORD",
    `decision: ${pyStr(verdict.decision ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
