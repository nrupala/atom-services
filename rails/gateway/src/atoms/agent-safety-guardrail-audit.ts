// Agent safety guardrail audit — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/agent-safety-guardrail-audit/src/agent_safety_guardrail_audit.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string are
// byte-identical to the Python output for the same input.

import { pyRepr, pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  system: "string",
  version: "string",
  guardrails_disabled: "boolean",
  injection_defense: {
    external_content_treated_as_data: "boolean",
    suspicious_imperatives_flagged: "boolean",
    test_suite: { present: "boolean", passing: "boolean" },
  },
  tool_access: {
    scoped_to_job: "boolean",
    read_write_separated: "boolean",
    destructive_tools_gated: "boolean",
    shell_access: "boolean",
    shell_sandboxed: "boolean",
  },
  approvals: {
    destructive_actions_require_approval: "boolean",
    verified: "boolean",
    covered_actions: ["string"],
    bypassable_by_agent: "boolean",
  },
  sandbox: {
    enabled: "boolean",
    filesystem_scope_minimal: "boolean",
    egress_restricted: "boolean",
    resource_caps_enforced: "boolean",
    abuse_test_passed: "boolean",
  },
  budgets: { caps_set: "boolean", alert_before_cap: "boolean" },
  circuit_breakers: { loop_detection_enabled: "boolean" },
  kill_switch: { present: "boolean", tested: "boolean" },
  output_validation: {
    schema_checked: "boolean",
    model_output_evaled: "boolean",
    downstream_parameterized: "boolean",
  },
  secrets: {
    values_in_context: "boolean",
    pii_in_context: "boolean",
    credential_handles_only: "boolean",
    exfiltration_paths_tested: "boolean",
  },
  red_team: {
    injection_suite_run: "boolean",
    jailbreak_tested: "boolean",
    canary_tokens_used: "boolean",
    findings_become_regression_tests: "boolean",
  },
};

export const SECTIONS = [
  "injection_defense",
  "tool_least_privilege",
  "approval_gates",
  "sandboxing",
  "budgets_and_circuit_breakers",
  "output_validation",
  "secrets_hygiene",
  "red_teaming",
] as const;

export const REQUIRED_APPROVAL_ACTIONS = [
  "deploys",
  "payments",
  "deletions",
  "external_sends",
  "credential_changes",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Audit {
  service: string;
  atom_version: string;
  system: unknown;
  version: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Python truthiness for JSON-shaped values.
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

export function evaluate(manifest: unknown): Audit {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: injection_defense (skill method 1 + quality gate) ----
  const [treated, hasTreated] = getPath(
    manifest, "injection_defense", "external_content_treated_as_data");
  check(
    results, "injection_defense", "external_content_treated_as_data",
    treated, hasTreated, treated === true,
    "skill method 1: all external content is hostile data, never instructions",
  );

  const [flagged, hasFlagged] = getPath(
    manifest, "injection_defense", "suspicious_imperatives_flagged");
  check(
    results, "injection_defense", "suspicious_imperatives_flagged",
    flagged, hasFlagged, flagged === true,
    "content stripped/annotated before model use; suspicious imperatives flagged",
  );

  const [suitePresent, hasSp] = getPath(
    manifest, "injection_defense", "test_suite", "present");
  check(
    results, "injection_defense", "injection_test_suite_present",
    suitePresent, hasSp, suitePresent === true,
    "quality gate: injection test suite exists on the agent's inputs",
  );

  const [suitePassing, hasSpass] = getPath(
    manifest, "injection_defense", "test_suite", "passing");
  check(
    results, "injection_defense", "injection_test_suite_passing",
    suitePassing, hasSpass, suitePassing === true,
    "quality gate: injection test suite passes on the agent's inputs",
  );

  // ---- Section 2: tool_least_privilege (skill method 2) ----
  const [scoped, hasScoped] = getPath(manifest, "tool_access", "scoped_to_job");
  check(
    results, "tool_least_privilege", "tools_scoped_to_job",
    scoped, hasScoped, scoped === true,
    "each agent gets only the tools its job needs",
  );

  const [separated, hasSep] = getPath(
    manifest, "tool_access", "read_write_separated");
  check(
    results, "tool_least_privilege", "read_write_tools_separated",
    separated, hasSep, separated === true,
    "read tools granted before write tools",
  );

  const [gated, hasGated] = getPath(
    manifest, "tool_access", "destructive_tools_gated");
  check(
    results, "tool_least_privilege", "destructive_tools_gated",
    gated, hasGated, gated === true,
    "destructive tools gated (approval or explicit scope)",
  );

  const [shellAccess, hasShell] = getPath(manifest, "tool_access", "shell_access");
  const [shellSandboxed, hasSandboxed] = getPath(
    manifest, "tool_access", "shell_sandboxed");
  if (hasShell && pyTruthy(shellAccess)) {
    check(
      results, "tool_least_privilege", "shell_access_sandboxed",
      shellSandboxed, hasSandboxed, shellSandboxed === true,
      "no shell passthrough without sandbox",
    );
  } else {
    check(
      results, "tool_least_privilege", "shell_access_sandboxed",
      shellAccess, hasShell, true,
      "no shell access declared",
    );
  }

  // ---- Section 3: approval_gates (skill method 3 + red lines) ----
  const [reqAppr, hasRa] = getPath(
    manifest, "approvals", "destructive_actions_require_approval");
  check(
    results, "approval_gates", "destructive_actions_require_approval",
    reqAppr, hasRa, reqAppr === true,
    "deploys, payments, deletions, external sends, credential changes — human confirms",
  );

  const [verified, hasVer] = getPath(manifest, "approvals", "verified");
  check(
    results, "approval_gates", "approval_requirement_verified",
    verified, hasVer, verified === true,
    "quality gate: destructive actions require approval (verified, not assumed)",
  );

  const [covered, hasCovered] = getPath(manifest, "approvals", "covered_actions");
  check(
    results, "approval_gates", "approvals_cover_all_sensitive_actions",
    covered, hasCovered,
    Array.isArray(covered) &&
      REQUIRED_APPROVAL_ACTIONS.every((a) => covered.includes(a)),
    `covered_actions=${pyRepr(covered)}`,
  );

  const [bypassable, hasByp] = getPath(
    manifest, "approvals", "bypassable_by_agent");
  check(
    results, "approval_gates", "approval_not_bypassable_by_agent",
    bypassable, hasByp, bypassable === false,
    "the guardrail is not configurable away by the agent",
  );

  const [disabled, hasDisabled] = getPath(manifest, "guardrails_disabled");
  check(
    results, "approval_gates", "guardrails_not_disabled",
    disabled, hasDisabled, disabled === false,
    "skill red line: never disable guardrails 'to make it work'",
  );

  // ---- Section 4: sandboxing (skill method 4 + quality gate) ----
  const [sbEnabled, hasSbe] = getPath(manifest, "sandbox", "enabled");
  check(
    results, "sandboxing", "untrusted_code_sandboxed",
    sbEnabled, hasSbe, sbEnabled === true,
    "untrusted code/tooling runs in isolation",
  );

  const [fsMin, hasFsm] = getPath(manifest, "sandbox", "filesystem_scope_minimal");
  check(
    results, "sandboxing", "filesystem_scope_minimal",
    fsMin, hasFsm, fsMin === true,
    "filesystem scope minimal",
  );

  const [egress, hasEgress] = getPath(manifest, "sandbox", "egress_restricted");
  check(
    results, "sandboxing", "egress_restricted",
    egress, hasEgress, egress === true,
    "egress restricted",
  );

  const [caps, hasCaps] = getPath(manifest, "sandbox", "resource_caps_enforced");
  check(
    results, "sandboxing", "resource_caps_enforced",
    caps, hasCaps, caps === true,
    "resource caps enforced",
  );

  const [abuse, hasAbuse] = getPath(manifest, "sandbox", "abuse_test_passed");
  check(
    results, "sandboxing", "sandbox_abuse_test_passed",
    abuse, hasAbuse, abuse === true,
    "quality gate: sandbox + egress + resource caps verified with an abuse test",
  );

  // ---- Section 5: budgets_and_circuit_breakers (skill method 5 + quality gate) ----
  const [bcaps, hasBcaps] = getPath(manifest, "budgets", "caps_set");
  check(
    results, "budgets_and_circuit_breakers", "budget_caps_set",
    bcaps, hasBcaps, bcaps === true,
    "token/cost/time caps set",
  );

  const [alert, hasAlert] = getPath(manifest, "budgets", "alert_before_cap");
  check(
    results, "budgets_and_circuit_breakers", "budgets_alert_before_cap",
    alert, hasAlert, alert === true,
    "quality gate: budgets alert before cap",
  );

  const [loop, hasLoop] = getPath(
    manifest, "circuit_breakers", "loop_detection_enabled");
  check(
    results, "budgets_and_circuit_breakers", "loop_detection_enabled",
    loop, hasLoop, loop === true,
    "loop detection: same action N times -> stop + escalate",
  );

  const [ksPresent, hasKsp] = getPath(manifest, "kill_switch", "present");
  check(
    results, "budgets_and_circuit_breakers", "kill_switch_present",
    ksPresent, hasKsp, ksPresent === true,
    "kill switch per agent",
  );

  const [ksTested, hasKst] = getPath(manifest, "kill_switch", "tested");
  check(
    results, "budgets_and_circuit_breakers", "kill_switch_tested",
    ksTested, hasKst, ksTested === true,
    "quality gate: kill switch tested",
  );

  // ---- Section 6: output_validation (skill method 6) ----
  const [schema, hasSchema] = getPath(
    manifest, "output_validation", "schema_checked");
  check(
    results, "output_validation", "output_schema_checked",
    schema, hasSchema, schema === true,
    "schema-check what agents produce before acting on it",
  );

  const [evaled, hasEvaled] = getPath(
    manifest, "output_validation", "model_output_evaled");
  check(
    results, "output_validation", "model_output_not_evaled",
    evaled, hasEvaled, evaled === false,
    "never eval model output",
  );

  const [param, hasParam] = getPath(
    manifest, "output_validation", "downstream_parameterized");
  check(
    results, "output_validation", "downstream_calls_parameterized",
    param, hasParam, param === true,
    "parameterize everything downstream",
  );

  // ---- Section 7: secrets_hygiene (skill method 7 + red line) ----
  const [values, hasValues] = getPath(manifest, "secrets", "values_in_context");
  check(
    results, "secrets_hygiene", "secret_values_not_in_context",
    values, hasValues, values === false,
    "skill red line: no secrets in agent context by default",
  );

  const [pii, hasPii] = getPath(manifest, "secrets", "pii_in_context");
  check(
    results, "secrets_hygiene", "pii_not_in_context",
    pii, hasPii, pii === false,
    "skill red line: no PII in agent context by default",
  );

  const [handles, hasHandles] = getPath(
    manifest, "secrets", "credential_handles_only");
  check(
    results, "secrets_hygiene", "credential_handles_only",
    handles, hasHandles, handles === true,
    "agents reference credential handles, not values",
  );

  const [exfil, hasExfil] = getPath(
    manifest, "secrets", "exfiltration_paths_tested");
  check(
    results, "secrets_hygiene", "exfiltration_paths_tested",
    exfil, hasExfil, exfil === true,
    "exfiltration paths (rendering, URLs, logs) considered in tests",
  );

  // ---- Section 8: red_teaming (skill method 8) ----
  const [rtInj, hasRti] = getPath(manifest, "red_team", "injection_suite_run");
  check(
    results, "red_teaming", "injection_suite_run_against_interface",
    rtInj, hasRti, rtInj === true,
    "injection suites: instructions hidden in content",
  );

  const [jailbreak, hasJb] = getPath(manifest, "red_team", "jailbreak_tested");
  check(
    results, "red_teaming", "jailbreak_attempts_tested",
    jailbreak, hasJb, jailbreak === true,
    "jailbreak attempts run against the interface",
  );

  const [canary, hasCanary] = getPath(manifest, "red_team", "canary_tokens_used");
  check(
    results, "red_teaming", "canary_tokens_used",
    canary, hasCanary, canary === true,
    "canary tokens for leak detection",
  );

  const [regression, hasReg] = getPath(
    manifest, "red_team", "findings_become_regression_tests");
  check(
    results, "red_teaming", "findings_become_regression_tests",
    regression, hasReg, regression === true,
    "findings become regression tests",
  );

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
    verdict = "NOT_GUARDED";
  } else if (
    Object.values(sections).some((v) => v === "insufficient_evidence")
  ) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "GUARDED";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "agent-safety-guardrail-audit",
    atom_version: "0.1.0",
    system: manifest["system"] ?? null,
    version: manifest["version"] ?? null,
    verdict,
    sections,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across eight sections.`,
  };
}

export function stamp(verdict: Audit): string {
  const lines: string[] = [
    "AGENT-SAFETY GUARDRAIL AUDIT",
    `system: ${pyStr(verdict.system ?? null)}  version: ${pyStr(verdict.version ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(30)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
