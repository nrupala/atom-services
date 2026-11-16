// Audience contract design — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/audience-contract-design/src/audience_contract_design.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed status and
// the summary string are byte-identical to the Python output for
// the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  artifact: "string",
  classes: {
    human_path_defined: "boolean",
    agent_path_defined: "boolean",
    system_path_defined: "boolean",
    software_path_defined: "boolean",
    single_class_only_shipment: "boolean",
  },
  single_truth: {
    canonical_source_declared: "boolean",
    renderings_generated_not_maintained: "boolean",
    truth_forked_per_class: "boolean",
  },
  progressive_formality: {
    formality_progressive_declared: "boolean",
  },
  failure: {
    human_failure_defined: "boolean",
    agent_failure_defined: "boolean",
    system_failure_defined: "boolean",
    software_failure_defined: "boolean",
  },
  authority: {
    dangerous_actions_present: "boolean",
    capability_required: "boolean",
    human_approval_required: "boolean",
    software_determinism_required: "boolean",
    system_audit_required: "boolean",
    dangerous_path_skips_lattice: "boolean",
  },
  verification: {
    agents_verified_by_software: "boolean",
    humans_verified_by_evidence: "boolean",
    software_verified_by_spec_tests: "boolean",
    systems_verified_by_audit_trails: "boolean",
  },
  identity: {
    human_passkey_or_mfa: "boolean",
    agent_scoped_short_lived_tokens: "boolean",
    system_policy_engine: "boolean",
    software_service_creds_or_mtls: "boolean",
  },
};

export const SECTIONS = [
  "classes_and_paths",
  "single_truth",
  "progressive_formality_and_failure",
  "authority_lattice",
  "verification_by_class",
  "identity_by_class",
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
  artifact: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  classes_with_path_count: number | null;
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

function latticeCheck(
  results: CheckResult[],
  name: string,
  manifest: Record<string, unknown>,
  elementPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [dangerous, hasDangerous] = getPath(
    manifest, "authority", "dangerous_actions_present");
  const [element, hasElement] = getPath(manifest, ...elementPath);
  if (hasDangerous && pyTruthy(dangerous)) {
    check(results, "authority_lattice", name, element,
      hasElement, element === true, evidence);
  } else {
    check(results, "authority_lattice", name, dangerous,
      hasDangerous, true, naEvidence);
  }
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: classes_and_paths ----
  boolCheck(results, "classes_and_paths", "human_path_defined",
    manifest, ["classes", "human_path_defined"],
    "method 1 / quality gate: the human class has a named, working path — visual, narrative, progressive disclosure, forgiving input; approves");
  boolCheck(results, "classes_and_paths", "agent_path_defined",
    manifest, ["classes", "agent_path_defined"],
    "method 1 / quality gate: the agent class has a named, working path — procedure: when to use, method, gates, red lines; executes within caps");
  boolCheck(results, "classes_and_paths", "system_path_defined",
    manifest, ["classes", "system_path_defined"],
    "method 1 / quality gate: the system class (human+agent+software together) has a named, working path — handoff contracts, approvals, shared state, audit; binds the others");
  boolCheck(results, "classes_and_paths", "software_path_defined",
    manifest, ["classes", "software_path_defined"],
    "method 1 / quality gate: the software class has a named, working path — schemas, stable IDs, versioned API/CLI/JSON, exit codes; deterministic");
  falseCheck(results, "classes_and_paths",
    "not_single_class_only_shipment",
    manifest, ["classes", "single_class_only_shipment"],
    "red line: never ship for one class and assume others will cope");

  // ---- Section 2: single_truth ----
  boolCheck(results, "single_truth", "canonical_source_declared",
    manifest, ["single_truth", "canonical_source_declared"],
    "method 2: one canonical artifact is the single source of truth, rendered per audience");
  boolCheck(results, "single_truth",
    "renderings_generated_not_maintained",
    manifest, ["single_truth", "renderings_generated_not_maintained"],
    "quality gate: renderings are generated from the canonical source, not maintained separately");
  falseCheck(results, "single_truth", "truth_not_forked_per_class",
    manifest, ["single_truth", "truth_forked_per_class"],
    "red line: never fork truth per audience — forking truth per class is drift");

  // ---- Section 3: progressive_formality_and_failure ----
  boolCheck(results, "progressive_formality_and_failure",
    "formality_progressive_declared",
    manifest, ["progressive_formality", "formality_progressive_declared"],
    "method 3: progressive formality — human view most forgiving to software least, same content: card, procedure, gates, schema, signature");
  boolCheck(results, "progressive_formality_and_failure",
    "human_failure_defined",
    manifest, ["failure", "human_failure_defined"],
    "method 4: humans get readable errors plus retry");
  boolCheck(results, "progressive_formality_and_failure",
    "agent_failure_defined",
    manifest, ["failure", "agent_failure_defined"],
    "method 4: agents get instructive errors plus a safe fallback");
  boolCheck(results, "progressive_formality_and_failure",
    "system_failure_defined",
    manifest, ["failure", "system_failure_defined"],
    "method 4: systems get escalation");
  boolCheck(results, "progressive_formality_and_failure",
    "software_failure_defined",
    manifest, ["failure", "software_failure_defined"],
    "method 4: software gets structured errors plus exit codes");

  // ---- Section 4: authority_lattice ----
  latticeCheck(results, "lattice_capability_required", manifest,
    ["authority", "capability_required"],
    "authority lattice: dangerous actions need capability (agent)",
    "no dangerous actions declared");
  latticeCheck(results, "lattice_human_approval_required", manifest,
    ["authority", "human_approval_required"],
    "authority lattice: dangerous actions need approval (human)",
    "no dangerous actions declared");
  latticeCheck(results, "lattice_software_determinism_required",
    manifest, ["authority", "software_determinism_required"],
    "authority lattice: dangerous actions need determinism (software)",
    "no dangerous actions declared");
  latticeCheck(results, "lattice_system_audit_required", manifest,
    ["authority", "system_audit_required"],
    "authority lattice: dangerous actions need audit (system) — audit exists",
    "no dangerous actions declared");
  falseCheck(results, "authority_lattice",
    "dangerous_path_does_not_skip_lattice",
    manifest, ["authority", "dangerous_path_skips_lattice"],
    "red line: no dangerous path that skips the lattice");

  // ---- Section 5: verification_by_class ----
  boolCheck(results, "verification_by_class",
    "agents_verified_by_software",
    manifest, ["verification", "agents_verified_by_software"],
    "method 6: agents are verified with software — tests and signatures");
  boolCheck(results, "verification_by_class",
    "humans_verified_by_evidence",
    manifest, ["verification", "humans_verified_by_evidence"],
    "method 6: humans are verified by evidence");
  boolCheck(results, "verification_by_class",
    "software_verified_by_spec_tests",
    manifest, ["verification", "software_verified_by_spec_tests"],
    "method 6: software is verified by spec tests");
  boolCheck(results, "verification_by_class",
    "systems_verified_by_audit_trails",
    manifest, ["verification", "systems_verified_by_audit_trails"],
    "method 6: systems are verified by cross-verification via audit trails");

  // ---- Section 6: identity_by_class ----
  boolCheck(results, "identity_by_class", "human_identity_declared",
    manifest, ["identity", "human_passkey_or_mfa"],
    "method 7: humans authenticate with passkey or MFA");
  boolCheck(results, "identity_by_class", "agent_identity_declared",
    manifest, ["identity", "agent_scoped_short_lived_tokens"],
    "method 7: agents authenticate with scoped short-lived tokens");
  boolCheck(results, "identity_by_class", "system_identity_declared",
    manifest, ["identity", "system_policy_engine"],
    "method 7: systems authenticate through a policy engine");
  boolCheck(results, "identity_by_class",
    "software_identity_declared",
    manifest, ["identity", "software_service_creds_or_mtls"],
    "method 7: software authenticates with service credentials or mTLS");

  const classPathFields: string[][] = [
    ["classes", "human_path_defined"],
    ["classes", "agent_path_defined"],
    ["classes", "system_path_defined"],
    ["classes", "software_path_defined"],
  ];
  const pathValues = classPathFields.map(
    (p) => getPath(manifest, ...p));
  const classesWithPathCount: number | null =
    pathValues.some(([, present]) => present)
      ? pathValues.filter(([value]) => value === true).length
      : null;

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
    verdict = "AUDIENCE_CONTRACT_INCOMPLETE";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "AUDIENCE_CONTRACT_COMPLETE";
  }

  const pathStatuses = results
    .filter((r) => r.check === "human_path_defined" ||
      r.check === "agent_path_defined" ||
      r.check === "system_path_defined" ||
      r.check === "software_path_defined")
    .map((r) => r.status);
  let computedStatus: string | null;
  if (pathStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (pathStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "audience-contract-design",
    atom_version: "0.1.0",
    artifact: manifest["artifact"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    classes_with_path_count: classesWithPathCount,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "AUDIENCE CONTRACT DESIGN",
    `artifact: ${pyStr(verdict.artifact ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
