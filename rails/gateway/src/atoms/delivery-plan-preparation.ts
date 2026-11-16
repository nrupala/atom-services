// Delivery plan preparation — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/delivery-plan-preparation/src/delivery_plan_preparation.py
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
  plan: "string",
  framing: {
    goal_declared: "boolean",
    deliverable_declared: "boolean",
    constraints_declared: "boolean",
    definition_of_done_declared: "boolean",
    plan_approved_before_build: "boolean",
    build_started_before_approval: "boolean",
  },
  phases: [{
    name: "string",
    owner: "string",
    exit_criteria_declared: "boolean",
    start_date: "string",
    end_date: "string",
    depends_on: ["string"],
    size: "string",
    assumptions_declared: "boolean",
  }],
  milestones: [{
    name: "string",
    phase: "string",
    owner: "string",
    due_date: "string",
  }],
  estimation: {
    least_known_item_flagged_as_top_risk: "boolean",
  },
  risks: [{
    name: "string",
    mitigation_declared: "boolean",
    trigger_declared: "boolean",
  }],
  risk_management: {
    register_reviewed_each_phase: "boolean",
  },
  decisions: [{
    date: "string",
    decision: "string",
    rationale_declared: "boolean",
    alternatives_declared: "boolean",
  }],
  decision_log: {
    append_only: "boolean",
    logged_at_decision_time: "boolean",
  },
  execution: {
    wip_limit_declared: "boolean",
    one_worked_item_per_lane: "boolean",
    plan_updates_through_approval: "boolean",
    silent_rescoping_present: "boolean",
    deploys_hitl_approved: "boolean",
    direct_to_production_change_present: "boolean",
  },
  status: {
    phase_declared: "boolean",
    done_declared: "boolean",
    next_declared: "boolean",
    blockers_declared: "boolean",
    confidence_declared: "boolean",
  },
};

export const SECTIONS = [
  "framing_and_approval",
  "phases_milestones_and_dependencies",
  "risks_estimates_and_decisions",
  "execution_discipline_and_status",
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
  plan: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  phases_count: number | null;
  phases_without_owner: string[] | null;
  phases_without_exit_criteria: string[] | null;
  phases_with_date_problems: string[] | null;
  owner_coverage: string | null;
  unknown_dependencies: string[] | null;
  dependency_order_violations: string[] | null;
  dependency_coverage: string | null;
  total_duration_days: number | null;
  milestones_count: number | null;
  milestones_without_owner: string[] | null;
  milestones_with_unknown_phase: string[] | null;
  milestones_due_outside_phase_dates: string[] | null;
  milestone_phase_coverage: string | null;
  risks_count: number | null;
  risks_without_mitigation: string[] | null;
  risks_without_trigger: string[] | null;
  decisions_count: number | null;
  decisions_incomplete: string[] | null;
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

function decisionName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["decision"] === "string" &&
    (entry["decision"] as string).length > 0) {
    return entry["decision"] as string;
  }
  return "unnamed";
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SIZES = ["S", "M", "L"];

// Strict ISO YYYY-MM-DD -> epoch-day integer, or null. Mirrors the
// Python oracle's regex + datetime.date construction exactly
// (impossible dates such as 2027-02-30 are rejected in both).
function parseDate(value: unknown): number | null {
  if (typeof value !== "string" || !DATE_RE.test(value)) return null;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(5, 7));
  const d = Number(value.slice(8, 10));
  const ms = Date.UTC(y, m - 1, d);
  const dt = new Date(ms);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d) {
    return null;
  }
  return ms / 86400000;
}

function hasNonemptyStr(entry: unknown, field: string): boolean {
  return isPyDict(entry) && typeof entry[field] === "string" &&
    (entry[field] as string).length > 0;
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function phaseDates(p: unknown): [number | null, number | null] {
  if (!isPyDict(p)) return [null, null];
  return [parseDate(p["start_date"]), parseDate(p["end_date"])];
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [phasesRaw, hasPhases] = getPath(manifest, "phases");
  const phasesIsList = hasPhases && Array.isArray(phasesRaw);
  const phases: unknown[] = phasesIsList ? (phasesRaw as unknown[]) : [];
  const [milestonesRaw, hasMilestones] = getPath(manifest, "milestones");
  const milestonesIsList = hasMilestones && Array.isArray(milestonesRaw);
  const milestones: unknown[] = milestonesIsList
    ? (milestonesRaw as unknown[]) : [];
  const [risksRaw, hasRisks] = getPath(manifest, "risks");
  const risksIsList = hasRisks && Array.isArray(risksRaw);
  const risks: unknown[] = risksIsList ? (risksRaw as unknown[]) : [];
  const [decisionsRaw, hasDecisions] = getPath(manifest, "decisions");
  const decisionsIsList = hasDecisions && Array.isArray(decisionsRaw);
  const decisions: unknown[] = decisionsIsList
    ? (decisionsRaw as unknown[]) : [];

  const phasesCount: number | null = phasesIsList ? phases.length : null;
  const milestonesCount: number | null = milestonesIsList
    ? milestones.length : null;
  const risksCount: number | null = risksIsList ? risks.length : null;
  const decisionsCount: number | null = decisionsIsList
    ? decisions.length : null;

  const phaseNames: string[] = phasesIsList
    ? phases.filter((p) => isPyDict(p) && typeof p["name"] === "string")
      .map((p) => (p as Record<string, unknown>)["name"] as string)
    : [];
  const phaseByName = new Map<string, Record<string, unknown>>();
  if (phasesIsList) {
    for (const p of phases) {
      if (isPyDict(p) && typeof p["name"] === "string") {
        phaseByName.set(p["name"] as string, p);
      }
    }
  }

  const phasesWithoutOwner: string[] | null = phasesIsList
    ? phases.filter((p) => !hasNonemptyStr(p, "owner")).map(rowName)
    : null;
  const phasesWithoutExit: string[] | null = phasesIsList
    ? phases.filter((p) => !(isPyDict(p) &&
        p["exit_criteria_declared"] === true)).map(rowName)
    : null;
  const phasesWithoutAssumptions: string[] | null = phasesIsList
    ? phases.filter((p) => !(isPyDict(p) &&
        p["assumptions_declared"] === true)).map(rowName)
    : null;
  const phasesWithInvalidSize: string[] | null = phasesIsList
    ? phases.filter((p) => !(isPyDict(p) &&
        SIZES.includes(p["size"] as string))).map(rowName)
    : null;
  const phasesWithDateProblems: string[] | null = phasesIsList
    ? phases.filter((p) => {
        const [s, e] = phaseDates(p);
        return s === null || e === null || e < s;
      }).map(rowName)
    : null;

  let unknownDependencies: string[] | null = null;
  let dependencyRefsTotal: number | null = null;
  let dependencyOrderViolations: string[] | null = null;
  if (phasesIsList) {
    unknownDependencies = [];
    dependencyOrderViolations = [];
    dependencyRefsTotal = 0;
    for (const p of phases) {
      if (!isPyDict(p) || !Array.isArray(p["depends_on"])) continue;
      for (const dep of p["depends_on"] as unknown[]) {
        if (typeof dep !== "string") continue;
        dependencyRefsTotal += 1;
        const target = phaseByName.get(dep);
        if (target === undefined) {
          unknownDependencies.push(`${rowName(p)}->${dep}`);
          continue;
        }
        const depEnd = parseDate(target["end_date"]);
        const ownStart = parseDate(p["start_date"]);
        if (depEnd !== null && ownStart !== null && depEnd > ownStart) {
          dependencyOrderViolations.push(`${rowName(p)}->${dep}`);
        }
      }
    }
  }
  const dependencyCoverage: number | null =
    dependencyRefsTotal && unknownDependencies !== null
      ? (dependencyRefsTotal - unknownDependencies.length) /
        dependencyRefsTotal
      : null;
  const ownerCoverage: number | null =
    phasesIsList && phasesCount !== null && phasesCount > 0 &&
      phasesWithoutOwner !== null
      ? (phasesCount - phasesWithoutOwner.length) / phasesCount
      : null;

  let totalDurationDays: number | null = null;
  if (phasesIsList && phasesCount !== null && phasesCount > 0 &&
    phases.every((p) => {
      const [s, e] = phaseDates(p);
      return s !== null && e !== null;
    })) {
    const starts = phases.map((p) => phaseDates(p)[0] as number);
    const ends = phases.map((p) => phaseDates(p)[1] as number);
    totalDurationDays = Math.max(...ends) - Math.min(...starts);
  }

  const milestonesWithoutOwner: string[] | null = milestonesIsList
    ? milestones.filter((m) => !hasNonemptyStr(m, "owner")).map(rowName)
    : null;
  const milestonesWithUnknownPhase: string[] | null =
    milestonesIsList && phasesIsList
      ? milestones.filter((m) => !(isPyDict(m) &&
          typeof m["phase"] === "string" &&
          phaseByName.has(m["phase"] as string))).map(rowName)
      : null;
  let milestonesOutsidePhase: string[] | null = null;
  if (milestonesIsList && phasesIsList) {
    milestonesOutsidePhase = [];
    for (const m of milestones) {
      if (!isPyDict(m) || typeof m["phase"] !== "string" ||
        !phaseByName.has(m["phase"] as string)) {
        continue;
      }
      const due = parseDate(m["due_date"]);
      const [pStart, pEnd] = phaseDates(
        phaseByName.get(m["phase"] as string));
      if (due === null || pStart === null || pEnd === null ||
        due < pStart || due > pEnd) {
        milestonesOutsidePhase.push(rowName(m));
      }
    }
  }
  const milestonePhaseCoverage: number | null =
    milestonesWithUnknownPhase !== null && milestonesCount
      ? (milestonesCount - milestonesWithUnknownPhase.length) /
        milestonesCount
      : null;

  const risksWithoutMitigation: string[] | null = risksIsList
    ? risks.filter((r) => !(isPyDict(r) &&
        r["mitigation_declared"] === true)).map(rowName)
    : null;
  const risksWithoutTrigger: string[] | null = risksIsList
    ? risks.filter((r) => !(isPyDict(r) &&
        r["trigger_declared"] === true)).map(rowName)
    : null;

  function decisionComplete(d: unknown): boolean {
    return isPyDict(d) && parseDate(d["date"]) !== null &&
      hasNonemptyStr(d, "decision") &&
      d["rationale_declared"] === true &&
      d["alternatives_declared"] === true;
  }
  const decisionsIncomplete: string[] | null = decisionsIsList
    ? decisions.filter((d) => !decisionComplete(d)).map(decisionName)
    : null;

  // ---- Section 1: framing_and_approval ----
  boolCheck(results, "framing_and_approval", "goal_declared", manifest,
    ["framing", "goal_declared"],
    "frame: the goal is declared");
  boolCheck(results, "framing_and_approval", "deliverable_declared",
    manifest, ["framing", "deliverable_declared"],
    "frame: the deliverable is declared");
  boolCheck(results, "framing_and_approval", "constraints_declared",
    manifest, ["framing", "constraints_declared"],
    "frame: the constraints — time, cost, licenses, environment — are declared");
  boolCheck(results, "framing_and_approval",
    "definition_of_done_declared", manifest,
    ["framing", "definition_of_done_declared"],
    "frame: the definition of done is declared");
  boolCheck(results, "framing_and_approval",
    "plan_approved_before_build", manifest,
    ["framing", "plan_approved_before_build"],
    "quality gate: the plan is approved before build starts");
  falseCheck(results, "framing_and_approval",
    "no_build_started_before_approval", manifest,
    ["framing", "build_started_before_approval"],
    "charter: no building before an approved plan — build has not started before approval");

  // ---- Section 2: phases_milestones_and_dependencies ----
  check(results, "phases_milestones_and_dependencies",
    "phases_declared", phasesRaw, phasesIsList,
    phasesIsList && (phasesCount as number) > 0,
    "phase the work: the declared plan record names its phases — the phases list is present and non-empty");
  const ownerPresent = phasesIsList &&
    phases.every((p) => hasField(p, "owner"));
  check(results, "phases_milestones_and_dependencies",
    "every_phase_has_owner_named", phasesRaw, ownerPresent,
    phasesIsList && (phasesCount as number) > 0 &&
      phasesWithoutOwner !== null && phasesWithoutOwner.length === 0,
    "quality gate: every phase has an owner — every declared phase row names a non-empty owner");
  const exitPresent = phasesIsList &&
    phases.every((p) => hasField(p, "exit_criteria_declared"));
  check(results, "phases_milestones_and_dependencies",
    "every_phase_has_exit_criteria", phasesRaw, exitPresent,
    phasesIsList && (phasesCount as number) > 0 &&
      phasesWithoutExit !== null && phasesWithoutExit.length === 0,
    "quality gate: every phase has exit criteria — what must be true to move on — declared on every phase row");
  const sizePresent = phasesIsList &&
    phases.every((p) => hasField(p, "size"));
  check(results, "phases_milestones_and_dependencies",
    "every_phase_has_skill_size", phasesRaw, sizePresent,
    phasesIsList && (phasesCount as number) > 0 &&
      phasesWithInvalidSize !== null &&
      phasesWithInvalidSize.length === 0,
    "estimate honestly: every declared phase row carries a size from the skill's own vocabulary — S, M or L");
  const datesPresent = phasesIsList &&
    phases.every((p) => hasField(p, "start_date") &&
      hasField(p, "end_date"));
  check(results, "phases_milestones_and_dependencies",
    "every_phase_dates_valid_and_in_order", phasesRaw, datesPresent,
    phasesIsList && (phasesCount as number) > 0 &&
      phasesWithDateProblems !== null &&
      phasesWithDateProblems.length === 0,
    "phase the work: every declared phase row carries a valid ISO start and end date, and the end does not fall before the start");
  const depsPresent = phasesIsList &&
    phases.every((p) => hasField(p, "depends_on"));
  check(results, "phases_milestones_and_dependencies",
    "every_dependency_names_declared_phase", phasesRaw, depsPresent,
    phasesIsList && (phasesCount as number) > 0 &&
      unknownDependencies !== null && unknownDependencies.length === 0,
    "dependencies: every name in a phase's declared depends_on list names a phase the plan declares");
  const orderPresent = phasesIsList &&
    phases.every((p) => hasField(p, "depends_on") &&
      hasField(p, "start_date") && hasField(p, "end_date")) &&
    phaseNames.every((n) => {
      const t = phaseByName.get(n);
      return t !== undefined && hasField(t, "end_date");
    });
  check(results, "phases_milestones_and_dependencies",
    "every_dependency_precedes_dependent", phasesRaw, orderPresent,
    phasesIsList && (phasesCount as number) > 0 &&
      unknownDependencies !== null && unknownDependencies.length === 0 &&
      phasesWithDateProblems !== null &&
      phasesWithDateProblems.length === 0 &&
      dependencyOrderViolations !== null &&
      dependencyOrderViolations.length === 0,
    "sequencing: schedule arithmetic over the declared dates — a dependency's declared end date does not fall after the dependent phase's declared start date");
  check(results, "phases_milestones_and_dependencies",
    "milestones_declared", milestonesRaw, milestonesIsList,
    milestonesIsList && (milestonesCount as number) > 0,
    "milestones: the declared plan record names its milestones — the milestones list is present and non-empty");
  const msPhasePresent = milestonesIsList && phasesIsList &&
    milestones.every((m) => hasField(m, "phase"));
  check(results, "phases_milestones_and_dependencies",
    "every_milestone_names_declared_phase", milestonesRaw,
    msPhasePresent,
    milestonesIsList && phasesIsList &&
      (milestonesCount as number) > 0 &&
      milestonesWithUnknownPhase !== null &&
      milestonesWithUnknownPhase.length === 0,
    "milestones: every declared milestone names a phase the plan declares");
  const msOwnerPresent = milestonesIsList &&
    milestones.every((m) => hasField(m, "owner"));
  check(results, "phases_milestones_and_dependencies",
    "every_milestone_has_owner_named", milestonesRaw, msOwnerPresent,
    milestonesIsList && (milestonesCount as number) > 0 &&
      milestonesWithoutOwner !== null &&
      milestonesWithoutOwner.length === 0,
    "milestones: every declared milestone row names a non-empty owner");
  const msDatesPresent = milestonesIsList && phasesIsList &&
    milestones.every((m) => hasField(m, "phase") &&
      hasField(m, "due_date")) &&
    phases.every((p) => hasField(p, "start_date") &&
      hasField(p, "end_date"));
  check(results, "phases_milestones_and_dependencies",
    "every_milestone_due_within_phase_dates", milestonesRaw,
    msDatesPresent,
    milestonesIsList && phasesIsList &&
      (milestonesCount as number) > 0 &&
      milestonesWithUnknownPhase !== null &&
      milestonesWithUnknownPhase.length === 0 &&
      milestonesOutsidePhase !== null &&
      milestonesOutsidePhase.length === 0,
    "milestones: schedule arithmetic over the declared dates — every milestone's declared due date falls within its named phase's declared start and end dates");

  // ---- Section 3: risks_estimates_and_decisions ----
  check(results, "risks_estimates_and_decisions", "risks_declared",
    risksRaw, risksIsList,
    risksIsList && (risksCount as number) > 0,
    "risk register: the declared plan record names its risks — the risks list is present and non-empty");
  const mitigationPresent = risksIsList &&
    risks.every((r) => hasField(r, "mitigation_declared"));
  check(results, "risks_estimates_and_decisions",
    "every_risk_has_mitigation", risksRaw, mitigationPresent,
    risksIsList && (risksCount as number) > 0 &&
      risksWithoutMitigation !== null &&
      risksWithoutMitigation.length === 0,
    "quality gate: risks have mitigations — every declared risk row declares a mitigation");
  const triggerPresent = risksIsList &&
    risks.every((r) => hasField(r, "trigger_declared"));
  check(results, "risks_estimates_and_decisions",
    "every_risk_has_trigger", risksRaw, triggerPresent,
    risksIsList && (risksCount as number) > 0 &&
      risksWithoutTrigger !== null && risksWithoutTrigger.length === 0,
    "quality gate: risks have triggers — every declared risk row declares a trigger");
  boolCheck(results, "risks_estimates_and_decisions",
    "risk_register_reviewed_each_phase", manifest,
    ["risk_management", "register_reviewed_each_phase"],
    "risk register: the register is reviewed each phase");
  const assumptionsPresent = phasesIsList &&
    phases.every((p) => hasField(p, "assumptions_declared"));
  check(results, "risks_estimates_and_decisions",
    "every_phase_declares_assumptions", phasesRaw, assumptionsPresent,
    phasesIsList && (phasesCount as number) > 0 &&
      phasesWithoutAssumptions !== null &&
      phasesWithoutAssumptions.length === 0,
    "estimate honestly: sizes come with assumptions listed — every declared phase row declares its assumptions");
  boolCheck(results, "risks_estimates_and_decisions",
    "least_known_item_flagged_as_top_risk", manifest,
    ["estimation", "least_known_item_flagged_as_top_risk"],
    "estimate honestly: the least-known item is flagged as the top risk");
  check(results, "risks_estimates_and_decisions",
    "decisions_declared", decisionsRaw, decisionsIsList,
    decisionsIsList && (decisionsCount as number) > 0,
    "decision log: the declared plan record names its decision-log entries — the decisions list is present and non-empty");
  const decisionFieldsPresent = decisionsIsList &&
    decisions.every((d) => hasField(d, "date") &&
      hasField(d, "decision") && hasField(d, "rationale_declared") &&
      hasField(d, "alternatives_declared"));
  check(results, "risks_estimates_and_decisions",
    "every_decision_entry_complete", decisionsRaw,
    decisionFieldsPresent,
    decisionsIsList && (decisionsCount as number) > 0 &&
      decisionsIncomplete !== null && decisionsIncomplete.length === 0,
    "decision log: every entry carries the skill's log shape — a valid date, the decision, a declared rationale and declared alternatives considered");
  boolCheck(results, "risks_estimates_and_decisions",
    "decision_log_append_only", manifest,
    ["decision_log", "append_only"],
    "decision log: the log is append-only");
  boolCheck(results, "risks_estimates_and_decisions",
    "decisions_logged_at_decision_time", manifest,
    ["decision_log", "logged_at_decision_time"],
    "quality gate: decisions are logged when made, not reconstructed later");

  // ---- Section 4: execution_discipline_and_status ----
  boolCheck(results, "execution_discipline_and_status",
    "wip_limit_declared", manifest,
    ["execution", "wip_limit_declared"],
    "WIP limit: a work-in-progress limit is declared — finish phases, don't parallelize beyond capacity");
  boolCheck(results, "execution_discipline_and_status",
    "one_worked_item_per_lane", manifest,
    ["execution", "one_worked_item_per_lane"],
    "WIP limit: one worked item per lane");
  boolCheck(results, "execution_discipline_and_status",
    "plan_updates_through_approval", manifest,
    ["execution", "plan_updates_through_approval"],
    "red line: plan updates go through approval");
  falseCheck(results, "execution_discipline_and_status",
    "no_silent_rescoping", manifest,
    ["execution", "silent_rescoping_present"],
    "red line: no silent re-scoping");
  boolCheck(results, "execution_discipline_and_status",
    "deploys_hitl_approved", manifest,
    ["execution", "deploys_hitl_approved"],
    "red line: deploys are HITL — human approves; automation prepares, humans decide");
  falseCheck(results, "execution_discipline_and_status",
    "no_direct_to_production_change", manifest,
    ["execution", "direct_to_production_change_present"],
    "charter: never a direct-to-production change");
  boolCheck(results, "execution_discipline_and_status",
    "status_phase_declared", manifest,
    ["status", "phase_declared"],
    "status: the current phase is reported");
  boolCheck(results, "execution_discipline_and_status",
    "status_done_declared", manifest,
    ["status", "done_declared"],
    "status: what is done is reported");
  boolCheck(results, "execution_discipline_and_status",
    "status_next_declared", manifest,
    ["status", "next_declared"],
    "status: what is next is reported");
  boolCheck(results, "execution_discipline_and_status",
    "status_blockers_declared", manifest,
    ["status", "blockers_declared"],
    "status: blockers are reported");
  boolCheck(results, "execution_discipline_and_status",
    "status_confidence_declared", manifest,
    ["status", "confidence_declared"],
    "status: confidence is reported");

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
    verdict = "DELIVERY_PLAN_NOT_READY";
  } else if (
    Object.values(sections).some((v) => v === "insufficient_evidence")
  ) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DELIVERY_PLAN_READY";
  }

  const computedNames = [
    "phases_declared",
    "every_phase_has_owner_named",
    "every_phase_has_exit_criteria",
    "every_dependency_names_declared_phase",
    "every_phase_dates_valid_and_in_order",
    "every_dependency_precedes_dependent",
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
    service: "delivery-plan-preparation",
    atom_version: "0.1.0",
    plan: manifest["plan"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    phases_count: phasesCount,
    phases_without_owner: phasesWithoutOwner,
    phases_without_exit_criteria: phasesWithoutExit,
    phases_with_date_problems: phasesWithDateProblems,
    owner_coverage: fmt4(ownerCoverage),
    unknown_dependencies: unknownDependencies,
    dependency_order_violations: dependencyOrderViolations,
    dependency_coverage: fmt4(dependencyCoverage),
    total_duration_days: totalDurationDays,
    milestones_count: milestonesCount,
    milestones_without_owner: milestonesWithoutOwner,
    milestones_with_unknown_phase: milestonesWithUnknownPhase,
    milestones_due_outside_phase_dates: milestonesOutsidePhase,
    milestone_phase_coverage: fmt4(milestonePhaseCoverage),
    risks_count: risksCount,
    risks_without_mitigation: risksWithoutMitigation,
    risks_without_trigger: risksWithoutTrigger,
    decisions_count: decisionsCount,
    decisions_incomplete: decisionsIncomplete,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across four sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DELIVERY PLAN PREPARATION",
    `plan: ${pyStr(verdict.plan ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
