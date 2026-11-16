// Agentic coding practice — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/agentic-coding-practice/src/agentic_coding_practice.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string
// are byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  practice: "string",
  spec: {
    spec_written_first: "boolean",
    small_vertical_slices: "boolean",
    diffs_reviewed: "boolean",
  },
  hooks: {
    wired_as_guardrails: "boolean",
    events_and_payloads_known: "boolean",
    protected_paths_blocked: "boolean",
    formatters_auto_run: "boolean",
    secrets_denied: "boolean",
  },
  feedback: {
    tests_run_after_edit: "boolean",
    tests_wired_into_hooks: "boolean",
    linters_wired_into_hooks: "boolean",
  },
  guardrails: {
    protected_paths_declared: "boolean",
    no_secrets: "boolean",
    docker_used: "boolean",
    staging_first: "boolean",
    human_in_loop_on_irreversible: "boolean",
    autonomous_only_safe_reversible: "boolean",
    agent_run_unbounded: "boolean",
  },
  context: {
    only_what_agent_needs: "boolean",
    whole_repo_dumped: "boolean",
    files_pulled_into_workspace: "boolean",
  },
  tools: {
    mcp_tools_typed: "boolean",
    mcp_tools_narrowly_scoped: "boolean",
  },
  delegation: {
    subagent_tasks_bounded: "boolean",
    subagent_context_narrow: "boolean",
    planner_worker_reviewer_pattern: "boolean",
  },
  access: {
    broad_write_access: "boolean",
    guardrails_present: "boolean",
  },
};

export const SECTIONS = [
  "spec_and_slicing",
  "hooks_and_events",
  "feedback_loop",
  "guardrails",
  "context_and_tools",
  "delegation_and_access",
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
  practice: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: spec_and_slicing ----
  boolCheck(results, "spec_and_slicing", "spec_written_before_coding",
    manifest, ["spec", "spec_written_first"],
    "spec first: the spec is written before the coding agent builds");
  boolCheck(results, "spec_and_slicing", "small_vertical_slices",
    manifest, ["spec", "small_vertical_slices"],
    "work is split into small vertical slices");
  boolCheck(results, "spec_and_slicing",
    "diffs_reviewed_not_rubber_stamped",
    manifest, ["spec", "diffs_reviewed"],
    "review diffs — never rubber-stamp (anti-pattern: rubber-stamping diffs)");

  // ---- Section 2: hooks_and_events ----
  boolCheck(results, "hooks_and_events",
    "hooks_wired_as_deterministic_guardrails",
    manifest, ["hooks", "wired_as_guardrails"],
    "hooks are wired as deterministic guardrails — don't rely on the model's goodwill; wire the policy");
  boolCheck(results, "hooks_and_events",
    "hook_events_and_payloads_known",
    manifest, ["hooks", "events_and_payloads_known"],
    "events & payloads: what each hook/event carries is known, so the automation is precise, not guesswork");
  boolCheck(results, "hooks_and_events",
    "protected_path_edits_blocked_by_hooks",
    manifest, ["hooks", "protected_paths_blocked"],
    "hooks block edits to protected paths");
  boolCheck(results, "hooks_and_events",
    "formatters_auto_run_by_hooks",
    manifest, ["hooks", "formatters_auto_run"],
    "hooks auto-run formatters");
  boolCheck(results, "hooks_and_events", "secrets_denied_by_hooks",
    manifest, ["hooks", "secrets_denied"],
    "hooks deny secrets");

  // ---- Section 3: feedback_loop ----
  boolCheck(results, "feedback_loop", "tests_run_after_every_edit",
    manifest, ["feedback", "tests_run_after_edit"],
    "hooks run tests after every edit");
  boolCheck(results, "feedback_loop", "tests_wired_into_hooks",
    manifest, ["feedback", "tests_wired_into_hooks"],
    "tight feedback: tests are wired into hooks so the agent gets automatic signal (anti-pattern: no automated tests in the loop)");
  boolCheck(results, "feedback_loop", "linters_wired_into_hooks",
    manifest, ["feedback", "linters_wired_into_hooks"],
    "tight feedback: linters are wired into hooks so the agent gets automatic signal");

  // ---- Section 4: guardrails ----
  boolCheck(results, "guardrails", "protected_paths_declared",
    manifest, ["guardrails", "protected_paths_declared"],
    "guardrails: protected paths are declared");
  boolCheck(results, "guardrails", "secrets_not_used",
    manifest, ["guardrails", "no_secrets"],
    "guardrails: no secrets");
  falseCheck(results, "guardrails", "docker_not_used",
    manifest, ["guardrails", "docker_used"],
    "guardrails: no Docker (house rule)");
  boolCheck(results, "guardrails", "staging_first",
    manifest, ["guardrails", "staging_first"],
    "guardrails: staging-first");
  boolCheck(results, "guardrails",
    "human_in_loop_on_irreversible_actions",
    manifest, ["guardrails", "human_in_loop_on_irreversible"],
    "human-in-the-loop on irreversible actions");
  boolCheck(results, "guardrails",
    "autonomous_only_on_safe_reversible_actions",
    manifest, ["guardrails", "autonomous_only_safe_reversible"],
    "autonomous only on safe, reversible actions");
  falseCheck(results, "guardrails", "agent_run_not_unbounded",
    manifest, ["guardrails", "agent_run_unbounded"],
    "anti-pattern to refuse: letting the agent run unbounded");

  // ---- Section 5: context_and_tools ----
  boolCheck(results, "context_and_tools",
    "context_limited_to_what_agent_needs",
    manifest, ["context", "only_what_agent_needs"],
    "context hygiene: give the agent only what it needs");
  falseCheck(results, "context_and_tools", "whole_repo_not_dumped",
    manifest, ["context", "whole_repo_dumped"],
    "anti-pattern to refuse: dumping whole repos into context");
  boolCheck(results, "context_and_tools",
    "files_pulled_into_workspace",
    manifest, ["context", "files_pulled_into_workspace"],
    "pull files into a workspace (the town-github-coding-workflow VFS pattern) rather than dumping the whole repo");
  boolCheck(results, "context_and_tools", "mcp_tools_typed",
    manifest, ["tools", "mcp_tools_typed"],
    "MCP tools: prefer typed tools over broad ones");
  boolCheck(results, "context_and_tools",
    "mcp_tools_narrowly_scoped",
    manifest, ["tools", "mcp_tools_narrowly_scoped"],
    "MCP tools: prefer narrowly-scoped tools over broad ones");

  // ---- Section 6: delegation_and_access ----
  boolCheck(results, "delegation_and_access",
    "subagent_tasks_bounded",
    manifest, ["delegation", "subagent_tasks_bounded"],
    "sub-agents: delegate bounded tasks to focused agents");
  boolCheck(results, "delegation_and_access",
    "subagent_context_narrow",
    manifest, ["delegation", "subagent_context_narrow"],
    "sub-agents: keep each one's context narrow");
  boolCheck(results, "delegation_and_access",
    "planner_worker_reviewer_orchestration",
    manifest, ["delegation", "planner_worker_reviewer_pattern"],
    "sub-agents: orchestrate planner -> worker -> reviewer patterns");
  const [broad, hasBroad] = getPath(manifest, "access", "broad_write_access");
  const [guardrails, hasGuardrails] = getPath(
    manifest, "access", "guardrails_present");
  if (hasBroad && pyTruthy(broad)) {
    check(results, "delegation_and_access",
      "broad_write_access_has_guardrails",
      guardrails, hasGuardrails, guardrails === true,
      "anti-pattern to refuse: agents with broad write access and zero guardrails — broad write access requires guardrails");
  } else {
    check(results, "delegation_and_access",
      "broad_write_access_has_guardrails",
      broad, hasBroad, true,
      "no broad write access declared");
  }

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
    verdict = "NOT_RELIABLE_PRACTICE";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "RELIABLE_PRACTICE";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "agentic-coding-practice",
    atom_version: "0.1.0",
    practice: manifest["practice"] ?? null,
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
    "AGENTIC CODING PRACTICE VERDICT",
    `practice: ${pyStr(verdict.practice ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
