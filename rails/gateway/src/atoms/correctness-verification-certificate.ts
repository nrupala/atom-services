// Correctness verification certificate — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/correctness-verification-certificate/src/
// correctness_verification_certificate.py
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
  component: "string",
  register: {
    exists: "boolean",
    property_named: "boolean",
    scope_named: "boolean",
    evidence_level_assigned: "boolean",
    expiry_set: "boolean",
  },
  ladder: {
    cheapest_sufficient_level_selected: "boolean",
    claim_exceeds_evidence_level: "boolean",
    tests_presented_as_proof: "boolean",
  },
  specs: {
    invariants_written: "boolean",
    pre_post_conditions_written: "boolean",
    liveness_properties_written: "boolean",
    written_before_tools_run: "boolean",
  },
  artifacts: {
    machine_checkable_per_claim: "boolean",
    proof_scripts_or_solver_logs_retained: "boolean",
    counterexample_suppressed: "boolean",
    reproduction_recipe_present: "boolean",
  },
  scope: {
    exclusions_written: "boolean",
    claims_versioned: "boolean",
    reverification_triggers_defined: "boolean",
    verified_at_current_version: "boolean",
  },
  ci: {
    verification_in_pipeline: "boolean",
    broken_proof_fails_build: "boolean",
  },
  review: {
    independent_review_done: "boolean",
    counterexample_found: "boolean",
    counterexample_disclosed: "boolean",
  },
  certificate: {
    signed_attestation_binds_claim_artifact_commit: "boolean",
    independently_reproducible: "boolean",
  },
};

export const SECTIONS = [
  "claims_register",
  "evidence_ladder",
  "specs_before_tools",
  "evidence_artifacts",
  "scope_honesty",
  "ci_integration",
  "adversarial_and_certification",
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
  component: unknown;
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

  // ---- Section 1: claims_register (method step 1) ----
  boolCheck(results, "claims_register", "register_exists", manifest,
    ["register", "exists"],
    "claims register first: one row per claim — no register, no claim");
  boolCheck(results, "claims_register",
    "property_named_for_each_claim", manifest,
    ["register", "property_named"],
    "each claim names the property — what exactly is claimed correct");
  boolCheck(results, "claims_register",
    "scope_named_for_each_claim", manifest,
    ["register", "scope_named"],
    "each claim names its scope — which version / configuration the claim covers");
  boolCheck(results, "claims_register",
    "evidence_level_assigned_for_each_claim", manifest,
    ["register", "evidence_level_assigned"],
    "each claim carries its evidence level from the ladder");
  boolCheck(results, "claims_register",
    "expiry_set_for_each_claim", manifest,
    ["register", "expiry_set"],
    "each claim carries an expiry — stale certificates are void");

  // ---- Section 2: evidence_ladder (method step 2 + quality gate) ----
  boolCheck(results, "evidence_ladder",
    "cheapest_sufficient_level_selected", manifest,
    ["ladder", "cheapest_sufficient_level_selected"],
    "the evidence ladder — L1 static analysis, L2 property-based testing and fuzzing, L3 model checking, L4 deductive verification, L5 proof assistants — cheapest that suffices is selected");
  falseCheck(results, "evidence_ladder",
    "no_claim_exceeds_its_evidence_level", manifest,
    ["ladder", "claim_exceeds_evidence_level"],
    "no claim exceeds its evidence level (tests are not proof)");
  falseCheck(results, "evidence_ladder",
    "tests_not_presented_as_proof", manifest,
    ["ladder", "tests_presented_as_proof"],
    "tests are not presented as proof — never say proven, bug-free, or certified without property, scope, and evidence");

  // ---- Section 3: specs_before_tools (method step 3) ----
  boolCheck(results, "specs_before_tools", "invariants_written",
    manifest, ["specs", "invariants_written"],
    "invariants are written in the checker's language");
  boolCheck(results, "specs_before_tools",
    "pre_post_conditions_written", manifest,
    ["specs", "pre_post_conditions_written"],
    "pre- and post-conditions are written in the checker's language");
  boolCheck(results, "specs_before_tools",
    "liveness_properties_written", manifest,
    ["specs", "liveness_properties_written"],
    "liveness properties are written in the checker's language");
  boolCheck(results, "specs_before_tools",
    "specs_written_before_tools_run", manifest,
    ["specs", "written_before_tools_run"],
    "specs come before tools: written before running anything");

  // ---- Section 4: evidence_artifacts (method step 4 + red lines) ----
  boolCheck(results, "evidence_artifacts",
    "machine_checkable_artifact_for_each_claim", manifest,
    ["artifacts", "machine_checkable_per_claim"],
    "each claim has a machine-checkable artifact behind it");
  boolCheck(results, "evidence_artifacts",
    "proof_scripts_or_solver_logs_retained", manifest,
    ["artifacts", "proof_scripts_or_solver_logs_retained"],
    "evidence artifacts are retained: counterexamples, proof scripts, solver logs, CI records");
  falseCheck(results, "evidence_artifacts",
    "counterexample_not_suppressed", manifest,
    ["artifacts", "counterexample_suppressed"],
    "never suppress a counterexample");
  boolCheck(results, "evidence_artifacts",
    "reproduction_recipe_present", manifest,
    ["artifacts", "reproduction_recipe_present"],
    "no certificate without a reproduction recipe");

  // ---- Section 5: scope_honesty (method step 5 + red lines) ----
  boolCheck(results, "scope_honesty", "exclusions_written", manifest,
    ["scope", "exclusions_written"],
    "what is outside scope is listed — dependencies, hardware, misconfiguration, side channels");
  boolCheck(results, "scope_honesty", "claims_versioned", manifest,
    ["scope", "claims_versioned"],
    "every claim is versioned");
  boolCheck(results, "scope_honesty",
    "reverification_triggers_defined", manifest,
    ["scope", "reverification_triggers_defined"],
    "re-verification triggers are defined — re-verify on change");
  boolCheck(results, "scope_honesty",
    "verified_at_current_version", manifest,
    ["scope", "verified_at_current_version"],
    "never certify an artifact that has not been verified at its current version");

  // ---- Section 6: ci_integration (method step 6) ----
  boolCheck(results, "ci_integration",
    "verification_runs_in_pipeline", manifest,
    ["ci", "verification_in_pipeline"],
    "verification runs in the pipeline");
  boolCheck(results, "ci_integration",
    "broken_proof_fails_build", manifest,
    ["ci", "broken_proof_fails_build"],
    "a broken proof fails the build like a broken test");

  // ---- Section 7: adversarial_and_certification ----
  boolCheck(results, "adversarial_and_certification",
    "independent_adversarial_review_done", manifest,
    ["review", "independent_review_done"],
    "an independent adversarial pass tries to falsify the claim — only unfalsified claims are certified");
  const [found, hasFound] = getPath(manifest, "review", "counterexample_found");
  const [disclosed, hasDisclosed] = getPath(manifest, "review", "counterexample_disclosed");
  if (hasFound && pyTruthy(found)) {
    check(results, "adversarial_and_certification",
      "counterexample_disclosed_when_found",
      disclosed, hasDisclosed, disclosed === true,
      "a counterexample found in adversarial review is disclosed, never suppressed");
  } else {
    check(results, "adversarial_and_certification",
      "counterexample_disclosed_when_found",
      found, hasFound, true,
      "no counterexample found in adversarial review");
  }
  boolCheck(results, "adversarial_and_certification",
    "signed_attestation_binds_claim_artifact_and_commit",
    manifest,
    ["certificate", "signed_attestation_binds_claim_artifact_commit"],
    "a signed attestation binds claim to artifact to source commit (hash and signature)");
  boolCheck(results, "adversarial_and_certification",
    "certificate_independently_reproducible", manifest,
    ["certificate", "independently_reproducible"],
    "certificates are signed, versioned, and independently reproducible");

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
    verdict = "NOT_CERTIFIED";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CERTIFIED";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "correctness-verification-certificate",
    atom_version: "0.1.0",
    component: manifest["component"] ?? null,
    verdict,
    sections,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "CORRECTNESS VERIFICATION CERTIFICATE",
    `component: ${pyStr(verdict.component ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
