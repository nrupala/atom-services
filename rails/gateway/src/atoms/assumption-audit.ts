// Assumption audit — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/assumption-audit/src/assumption_audit.py
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
  decision: "string",
  framing: {
    decision_named: "boolean",
    options_listed: "boolean",
    decision_maker_identified: "boolean",
    objective_defined: "boolean",
  },
  preset: {
    criteria_set_before_data: "boolean",
    default_action_set: "boolean",
    change_threshold_set_before_data: "boolean",
  },
  loss: {
    framed_each_direction: "boolean",
    threshold_reflects_asymmetry: "boolean",
  },
  rigor: {
    stakes_assessed: "boolean",
    reversibility_assessed: "boolean",
    effort_matched: "boolean",
  },
  data: {
    exploratory_confirmatory_separated: "boolean",
    conclusion_not_from_inspiring_data: "boolean",
    evidence_could_change_decision: "boolean",
    roles_clear: "boolean",
  },
  review: {
    conducted: "boolean",
    separates_decision_from_outcome: "boolean",
  },
};

export const SECTIONS = [
  "framing",
  "preset_criteria",
  "loss_function",
  "rigor_sizing",
  "data_discipline",
  "review",
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
  decision: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: framing (skill process checklist 1-2) ----
  boolCheck(results, "framing", "decision_named", manifest,
    ["framing", "decision_named"],
    "name the decision and the real options");
  boolCheck(results, "framing", "real_options_listed", manifest,
    ["framing", "options_listed"],
    "the real options are listed, not a single foregone option");
  boolCheck(results, "framing", "decision_maker_identified", manifest,
    ["framing", "decision_maker_identified"],
    "identify the decision-maker");
  boolCheck(results, "framing", "objective_defined", manifest,
    ["framing", "objective_defined"],
    "what the decision-maker actually cares about (the objective / loss function) is defined");

  // ---- Section 2: preset_criteria (core tenets 1-2) ----
  boolCheck(results, "preset_criteria", "criteria_set_before_data", manifest,
    ["preset", "criteria_set_before_data"],
    "decide how to decide before you see the data — decision criteria set in advance");
  boolCheck(results, "preset_criteria", "default_action_set", manifest,
    ["preset", "default_action_set"],
    "default action known in advance");
  boolCheck(results, "preset_criteria", "change_my_mind_threshold_set_before_data", manifest,
    ["preset", "change_threshold_set_before_data"],
    "pre-commit to exactly what evidence would flip the default — answered before looking");

  // ---- Section 3: loss_function (core tenet: frame the loss) ----
  boolCheck(results, "loss_function", "loss_framed_in_each_direction", manifest,
    ["loss", "framed_each_direction"],
    "what being wrong costs — in each direction");
  boolCheck(results, "loss_function", "threshold_reflects_asymmetric_costs", manifest,
    ["loss", "threshold_reflects_asymmetry"],
    "asymmetric costs move the threshold");

  // ---- Section 4: rigor_sizing (core tenet: right-size the rigor) ----
  boolCheck(results, "rigor_sizing", "stakes_assessed", manifest,
    ["rigor", "stakes_assessed"],
    "match effort to stakes");
  boolCheck(results, "rigor_sizing", "reversibility_assessed", manifest,
    ["rigor", "reversibility_assessed"],
    "one-way-door vs two-way-door assessed");
  boolCheck(results, "rigor_sizing", "effort_matched_to_stakes_and_reversibility", manifest,
    ["rigor", "effort_matched"],
    "reversible decisions decide fast; irreversible ones slow down and gather more");

  // ---- Section 5: data_discipline ----
  boolCheck(results, "data_discipline", "exploratory_and_confirmatory_separated", manifest,
    ["data", "exploratory_confirmatory_separated"],
    "exploratory analysis generates hypotheses; confirmatory analysis tests a pre-registered hypothesis");
  boolCheck(results, "data_discipline", "no_conclusion_from_inspiring_data", manifest,
    ["data", "conclusion_not_from_inspiring_data"],
    "never draw a conclusion from the same data that inspired it");
  boolCheck(results, "data_discipline", "evidence_could_change_the_decision", manifest,
    ["data", "evidence_could_change_decision"],
    "if no possible data could change the action, the data is decoration");
  boolCheck(results, "data_discipline", "roles_clear", manifest,
    ["data", "roles_clear"],
    "the decision-maker frames and defines thresholds; the analyst informs — analysis does not quietly make the call");

  // ---- Section 6: review (process checklist 6; decisions != outcomes) ----
  boolCheck(results, "review", "decision_quality_reviewed", manifest,
    ["review", "conducted"],
    "review the decision after acting per the pre-set criteria");
  boolCheck(results, "review", "decision_reviewed_separately_from_outcome", manifest,
    ["review", "separates_decision_from_outcome"],
    "judge a decision by the process and information at the time, not by how it turned out (no resulting)");

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
    verdict = "UNSOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "assumption-audit",
    atom_version: "0.1.0",
    decision: manifest["decision"] ?? null,
    verdict,
    sections,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ASSUMPTION AUDIT",
    `decision: ${pyStr(verdict.decision ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(18)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
