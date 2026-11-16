// Tested authorization policy pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/tested-authorization-policy-pack/src/tested_authorization_policy_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed quantity and
// the summary string are byte-identical to the Python output for
// the same input. The coverage ratio uses the shared fixed
// serialization: round half up to 4dp — floor(v * 10000 + 0.5) /
// 10000 — then format with exactly four decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  pack: "string",
  decision_model: {
    decisions_enumerated: "boolean",
    input_schema_defined: "boolean",
    default_deny: "boolean",
  },
  policies: [{ id: "string", default: "string" }],
  policy_code: {
    rules_small_and_composable: "boolean",
    data_separated_from_logic: "boolean",
    policy_data_versioned: "boolean",
    decision_explanations_available: "boolean",
  },
  tests: [{ policy_id: "string", kind: "string" }],
  testing: {
    tests_green: "boolean",
    lint_format_clean: "boolean",
    key_roles_coverage_declared: "boolean",
  },
  rollout: {
    shadow_completed: "boolean",
    staged_before_production: "boolean",
    break_glass_documented_gated_audited: "boolean",
    break_glass_tested: "boolean",
    silent_policy_edits: "boolean",
  },
  decision_logs: {
    record_who_decision_version_reason: "boolean",
    retained_immutably: "boolean",
    full_in_sensitive_flows: "boolean",
  },
  governance: {
    second_pair_of_eyes_on_prs: "boolean",
    version_and_changelog: "boolean",
    human_summary_in_sync_with_code: "boolean",
  },
  enforcement: {
    points_inventoried: "boolean",
    failure_mode_chosen_per_surface: "boolean",
    sensitive_surfaces_fail_closed: "boolean",
    bypass_paths_present: "boolean",
  },
};

export const SECTIONS = [
  "decision_model",
  "policy_code",
  "testing",
  "rollout",
  "decision_logs",
  "governance_and_enforcement",
] as const;

export const TEST_KINDS = ["positive", "negative", "edge"] as const;

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
  pack: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  coverage_status: string | null;
  policy_count: number | null;
  tested_policy_count: number | null;
  test_count: number | null;
  test_coverage_ratio: string | null;
  untested_policy_ids: string[];
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
  check(results, section, name, present, value === true, evidence);
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
  check(results, section, name, present, value === false, evidence);
}

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

function policyIdsOf(manifest: Record<string, unknown>): string[] | null {
  const [policies, has] = getPath(manifest, "policies");
  if (!has || !Array.isArray(policies)) return null;
  const ids: string[] = [];
  for (const entry of policies) {
    if (isPyDict(entry)) {
      const pid = entry["id"];
      if (typeof pid === "string" && pid.length > 0) ids.push(pid);
    }
  }
  return ids;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Computed: policies_declared + every_policy_defaults_to_deny
  const [policiesRaw, hasPolicies] = getPath(manifest, "policies");
  const policies: unknown[] | null =
    hasPolicies && Array.isArray(policiesRaw) ? policiesRaw : null;
  let policyIds: string[] | null = null;
  let policiesDeclaredStatus: { present: boolean; ok: boolean; evidence: string };
  let defaultsStatus: { present: boolean; ok: boolean; evidence: string };
  if (policies === null || policies.length === 0) {
    policiesDeclaredStatus = { present: false, ok: false, evidence: "no policies declared" };
    defaultsStatus = { present: false, ok: false, evidence: "no policies declared" };
  } else {
    policyIds = policyIdsOf(manifest);
    if (policyIds === null || policyIds.length === 0) {
      policyIds = null;
      policiesDeclaredStatus = { present: true, ok: false, evidence: "policies declared but none carries a non-empty string id" };
      defaultsStatus = { present: false, ok: false, evidence: "no policy entry carries a usable id" };
    } else {
      policiesDeclaredStatus = { present: true, ok: true, evidence: "policies declared as code — authorization logic in testable policy, not scattered if statements" };
      let incomplete = false;
      const violating: string[] = [];
      for (const entry of policies) {
        if (!isPyDict(entry)) { incomplete = true; continue; }
        const pid = entry["id"];
        if (typeof pid !== "string" || pid.length === 0) { incomplete = true; continue; }
        const [def, hasDef] = getFrom(entry, "default");
        if (!hasDef) incomplete = true;
        else if (def !== "deny") violating.push(pid);
      }
      if (incomplete) {
        defaultsStatus = { present: false, ok: false, evidence: "a policy entry is missing its declared default" };
      } else if (violating.length > 0) {
        defaultsStatus = { present: true, ok: false, evidence: "skill red line: no default-allow — policies not defaulting to deny: " + violating.join(", ") };
      } else {
        defaultsStatus = { present: true, ok: true, evidence: "default deny — every declared policy defaults to deny" };
      }
    }
  }

  // ---- Computed: test coverage
  const [testsRaw, hasTests] = getPath(manifest, "tests");
  const testsList: unknown[] | null =
    hasTests && Array.isArray(testsRaw) ? testsRaw : null;
  let testedStatus: { present: boolean; ok: boolean; evidence: string };
  let kindsStatus: { present: boolean; ok: boolean; evidence: string };
  let computedFailed: boolean | null = null;
  let untestedIds: string[] = [];
  if (policyIds === null) {
    testedStatus = { present: false, ok: false, evidence: "no policies declared" };
    kindsStatus = { present: false, ok: false, evidence: "no policies declared" };
  } else if (testsList === null) {
    testedStatus = { present: false, ok: false, evidence: "no tests declared" };
    kindsStatus = { present: false, ok: false, evidence: "no tests declared" };
    untestedIds = [...policyIds];
  } else {
    const kindsByPolicy = new Map<string, Set<string>>();
    for (const entry of testsList) {
      if (!isPyDict(entry)) continue;
      const pid = entry["policy_id"];
      const kind = entry["kind"];
      if (typeof pid === "string" && pid.length > 0) {
        if (!kindsByPolicy.has(pid)) kindsByPolicy.set(pid, new Set());
        if (typeof kind === "string" && (TEST_KINDS as readonly string[]).includes(kind)) {
          kindsByPolicy.get(pid)!.add(kind);
        }
      }
    }
    untestedIds = policyIds.filter((pid) => !kindsByPolicy.has(pid));
    if (untestedIds.length > 0) {
      testedStatus = { present: true, ok: false, evidence: "skill red line: no untested policy to production — untested policies: " + untestedIds.join(", ") };
    } else {
      testedStatus = { present: true, ok: true, evidence: "test like code: every declared policy is covered by at least one declared test" };
    }
    const incompleteKinds = policyIds.filter((pid) => {
      const kinds = kindsByPolicy.get(pid) ?? new Set<string>();
      return TEST_KINDS.some((k) => !kinds.has(k));
    });
    if (testsList.length === 0) {
      kindsStatus = { present: false, ok: false, evidence: "no tests declared" };
    } else if (incompleteKinds.length > 0) {
      kindsStatus = { present: true, ok: false, evidence: "unit tests per rule — positive, negative, edge cases; policies missing a test kind: " + incompleteKinds.join(", ") };
    } else {
      kindsStatus = { present: true, ok: true, evidence: "unit tests per rule — every declared policy has a declared positive, negative and edge test" };
    }
    computedFailed = untestedIds.length > 0 || incompleteKinds.length > 0;
  }

  // ---- Section 1: decision_model ----
  boolCheck(results, "decision_model", "decisions_enumerated", manifest,
    ["decision_model", "decisions_enumerated"],
    "model the decisions: the questions to answer are enumerated (can subject S do action A on resource R, under context C?)");
  boolCheck(results, "decision_model", "input_schema_defined", manifest,
    ["decision_model", "input_schema_defined"],
    "the input schema for policy decisions is defined");
  boolCheck(results, "decision_model", "default_deny_declared", manifest,
    ["decision_model", "default_deny"],
    "default deny is the declared decision model");
  check(results, "decision_model", "every_policy_defaults_to_deny",
    defaultsStatus.present, defaultsStatus.ok, defaultsStatus.evidence);

  // ---- Section 2: policy_code ----
  check(results, "policy_code", "policies_declared",
    policiesDeclaredStatus.present, policiesDeclaredStatus.ok,
    policiesDeclaredStatus.evidence);
  boolCheck(results, "policy_code", "rules_small_and_composable", manifest,
    ["policy_code", "rules_small_and_composable"],
    "write policy as code: small composable rules");
  boolCheck(results, "policy_code", "data_separated_from_logic", manifest,
    ["policy_code", "data_separated_from_logic"],
    "data separated from logic");
  boolCheck(results, "policy_code", "policy_data_versioned", manifest,
    ["policy_code", "policy_data_versioned"],
    "policy data versioned");
  boolCheck(results, "policy_code", "decision_explanations_available", manifest,
    ["policy_code", "decision_explanations_available"],
    "decision explanations available for humans");

  // ---- Section 3: testing ----
  check(results, "testing", "every_policy_tested",
    testedStatus.present, testedStatus.ok, testedStatus.evidence);
  check(results, "testing", "positive_negative_edge_tests_per_policy",
    kindsStatus.present, kindsStatus.ok, kindsStatus.evidence);
  boolCheck(results, "testing", "tests_green", manifest,
    ["testing", "tests_green"],
    "quality gate: tests green");
  boolCheck(results, "testing", "lint_and_format_clean", manifest,
    ["testing", "lint_format_clean"],
    "lint + format in CI (opa fmt / check) clean");
  boolCheck(results, "testing", "decision_space_coverage_for_key_roles", manifest,
    ["testing", "key_roles_coverage_declared"],
    "decision-space coverage for key roles declared");

  // ---- Section 4: rollout ----
  boolCheck(results, "rollout", "shadow_period_completed", manifest,
    ["rollout", "shadow_completed"],
    "quality gate: shadow period completed before enforcement — shadow mode logs decisions without enforcing");
  boolCheck(results, "rollout", "staged_rollout_followed", manifest,
    ["rollout", "staged_before_production"],
    "roll out safely: shadow mode, then staging enforcement, then production");
  boolCheck(results, "rollout", "break_glass_documented_gated_audited", manifest,
    ["rollout", "break_glass_documented_gated_audited"],
    "break-glass path documented, gated, and audited");
  boolCheck(results, "rollout", "break_glass_tested_once", manifest,
    ["rollout", "break_glass_tested"],
    "quality gate: break-glass tested once");
  falseCheck(results, "rollout", "no_silent_policy_edits", manifest,
    ["rollout", "silent_policy_edits"],
    "no silent policy edits");

  // ---- Section 5: decision_logs ----
  boolCheck(results, "decision_logs", "logs_record_who_decision_version_reason", manifest,
    ["decision_logs", "record_who_decision_version_reason"],
    "decision logs: who asked, what was decided, under which policy version, why");
  boolCheck(results, "decision_logs", "logs_retained_immutably", manifest,
    ["decision_logs", "retained_immutably"],
    "quality gate: decision logs retained immutably");
  boolCheck(results, "decision_logs", "full_logging_in_sensitive_flows", manifest,
    ["decision_logs", "full_in_sensitive_flows"],
    "sample in prod, full in sensitive flows — full logging in sensitive flows declared");

  // ---- Section 6: governance_and_enforcement ----
  boolCheck(results, "governance_and_enforcement", "second_review_on_policy_changes", manifest,
    ["governance", "second_pair_of_eyes_on_prs"],
    "governance: second pair of eyes on policy PRs");
  boolCheck(results, "governance_and_enforcement", "version_and_changelog_present", manifest,
    ["governance", "version_and_changelog"],
    "version + changelog kept for the policy pack");
  boolCheck(results, "governance_and_enforcement", "human_summary_in_sync_with_code", manifest,
    ["governance", "human_summary_in_sync_with_code"],
    "the human-readable policy summary is in sync with the code");
  boolCheck(results, "governance_and_enforcement", "enforcement_points_inventoried", manifest,
    ["enforcement", "points_inventoried"],
    "quality gate: enforcement points inventoried — app middleware, gateways, sidecars enumerated");
  boolCheck(results, "governance_and_enforcement", "failure_mode_chosen_per_surface", manifest,
    ["enforcement", "failure_mode_chosen_per_surface"],
    "quality gate: failure mode chosen consciously — fail-open vs fail-closed decided per surface");
  boolCheck(results, "governance_and_enforcement", "sensitive_surfaces_fail_closed", manifest,
    ["enforcement", "sensitive_surfaces_fail_closed"],
    "default: fail closed for sensitive surfaces");
  falseCheck(results, "governance_and_enforcement", "no_bypass_paths", manifest,
    ["enforcement", "bypass_paths_present"],
    "skill red line: no bypass paths around enforcement points");

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
    verdict = "NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "READY";
  }

  const testCount = testsList !== null ? testsList.length : null;
  const policyCount = policyIds !== null ? policyIds.length : null;
  let testedCount: number | null = null;
  let ratio: number | null = null;
  if (policyIds !== null && testsList !== null) {
    testedCount = policyIds.length - untestedIds.length;
    ratio = policyIds.length ? testedCount / policyIds.length : null;
  }

  const coverageStatus =
    computedFailed === true ? "incomplete_on_declared_tests"
    : computedFailed === false ? "complete_on_declared_tests"
    : null;

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "tested-authorization-policy-pack",
    atom_version: "0.1.0",
    pack: manifest["pack"] ?? null,
    verdict,
    sections,
    checks: results,
    coverage_status: coverageStatus,
    policy_count: policyCount,
    tested_policy_count: testedCount,
    test_count: testCount,
    test_coverage_ratio: fmt4(ratio),
    untested_policy_ids: untestedIds,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "TESTED AUTHORIZATION POLICY PACK",
    `pack: ${pyStr(verdict.pack ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(25)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
