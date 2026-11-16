// Lean4 formal proof — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/lean4-formal-proof/src/lean4_formal_proof.py
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
  project: "string",
  setup: {
    toolchain_pinned: "boolean",
    versions_pinned: "boolean",
    ci_runs_lake_build: "boolean",
    lake_build_green: "boolean",
  },
  statements: {
    stated_before_proving: "boolean",
    meaning_checked_before_proving: "boolean",
    reviewed_independently_of_tactics: "boolean",
    weakened_silently: "boolean",
    unproven_claims_presented_as_verified: "boolean",
  },
  definitions: {
    total: "boolean",
    executable: "boolean",
    specs_separate_from_implementation: "boolean",
  },
  proof: {
    structured_and_readable: "boolean",
    cheating_items_tracked_as_tickets: "boolean",
    cheating_smuggled_into_deliverable: "boolean",
  },
  theorems: [{
    name: "string",
    sorry_count: "number",
    axioms: ["string"],
    native_decide_used: "boolean",
    kernel_checked: "boolean",
  }],
  attestation: {
    build_log_retained: "boolean",
    axiom_audit_performed: "boolean",
    reproduction_recipe_present: "boolean",
  },
  alignment: {
    mapping_documented: "boolean",
    changes_ported_through_model: "boolean",
    model_and_implementation_in_sync: "boolean",
  },
};

export const SECTIONS = [
  "project_setup",
  "statement_integrity",
  "definitions_and_model",
  "proof_integrity",
  "theorem_declarations",
  "build_attestation",
  "model_alignment",
] as const;

export const STANDARD_AXIOMS: ReadonlySet<string> = new Set([
  "propext",
  "Classical.choice",
  "Quot.sound",
]);

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
  project: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  summary: string;
  theorems_evaluated: number;
  theorems_with_sorry: number;
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

function isInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function wellformed(entry: unknown): boolean {
  if (!isPyDict(entry)) return false;
  const name = entry["name"];
  if (typeof name !== "string" || name.length === 0) return false;
  if (!isInt(entry["sorry_count"]) || (entry["sorry_count"] as number) < 0) {
    return false;
  }
  const axioms = entry["axioms"];
  if (!Array.isArray(axioms)) return false;
  if (axioms.some((a) => typeof a !== "string")) return false;
  if (typeof entry["native_decide_used"] !== "boolean") return false;
  if (typeof entry["kernel_checked"] !== "boolean") return false;
  return true;
}

function theoremChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): [number, number] {
  const [theorems, present] = getPath(manifest, "theorems");
  if (!present || !Array.isArray(theorems) || theorems.length === 0) {
    const missing: Array<[string, string]> = [
      ["theorems_present_and_wellformed",
        "each delivered theorem is declared with its name, sorry count, axiom list, native_decide use and kernel-check status"],
      ["no_sorry_in_declared_theorems",
        "zero sorry/admit in delivered theorems — a landmark proof ships with zero sorry"],
      ["no_extra_axioms_in_declared_theorems",
        "no axioms beyond the standard kernel axioms (propext, Classical.choice, Quot.sound) — new axioms are tracked as cheating, never smuggled"],
      ["no_native_decide_in_declared_theorems",
        "no native_decide shortcuts in delivered theorems"],
      ["all_declared_theorems_kernel_checked",
        "every delivered theorem is kernel-checked — the statement you can trust is the one the kernel accepted"],
    ];
    for (const [name, evidence] of missing) {
      check(results, "theorem_declarations", name, theorems, false, false, evidence);
    }
    return [0, 0];
  }

  check(results, "theorem_declarations",
    "theorems_present_and_wellformed", theorems, true,
    theorems.every((e) => wellformed(e)),
    "each delivered theorem is declared with its name, sorry count, axiom list, native_decide use and kernel-check status");

  const sorryOk = (entry: unknown): boolean =>
    isPyDict(entry) && isInt(entry["sorry_count"]) && entry["sorry_count"] === 0;
  check(results, "theorem_declarations",
    "no_sorry_in_declared_theorems", theorems, true,
    theorems.every((e) => sorryOk(e)),
    "zero sorry/admit in delivered theorems — a landmark proof ships with zero sorry");

  const axiomsOk = (entry: unknown): boolean => {
    if (!isPyDict(entry)) return false;
    const axioms = entry["axioms"];
    return (
      Array.isArray(axioms) &&
      axioms.every((a) => typeof a === "string") &&
      axioms.every((a) => STANDARD_AXIOMS.has(a as string))
    );
  };
  check(results, "theorem_declarations",
    "no_extra_axioms_in_declared_theorems", theorems, true,
    theorems.every((e) => axiomsOk(e)),
    "no axioms beyond the standard kernel axioms (propext, Classical.choice, Quot.sound) — new axioms are tracked as cheating, never smuggled");

  const nativeOk = (entry: unknown): boolean =>
    isPyDict(entry) && entry["native_decide_used"] === false;
  check(results, "theorem_declarations",
    "no_native_decide_in_declared_theorems", theorems, true,
    theorems.every((e) => nativeOk(e)),
    "no native_decide shortcuts in delivered theorems");

  const kernelOk = (entry: unknown): boolean =>
    isPyDict(entry) && entry["kernel_checked"] === true;
  check(results, "theorem_declarations",
    "all_declared_theorems_kernel_checked", theorems, true,
    theorems.every((e) => kernelOk(e)),
    "every delivered theorem is kernel-checked — the statement you can trust is the one the kernel accepted");

  const withSorry = theorems.filter(
    (e) => isPyDict(e) && isInt(e["sorry_count"]) && (e["sorry_count"] as number) > 0,
  ).length;
  return [theorems.length, withSorry];
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: project_setup (method step 1) ----
  boolCheck(results, "project_setup", "toolchain_pinned", manifest,
    ["setup", "toolchain_pinned"],
    "elan toolchain pinned — the proof is checked by a known toolchain, not whatever is installed");
  boolCheck(results, "project_setup", "dependency_versions_pinned",
    manifest, ["setup", "versions_pinned"],
    "lake / Mathlib versions pinned — the proof's dependencies do not drift");
  boolCheck(results, "project_setup", "ci_runs_lake_build", manifest,
    ["setup", "ci_runs_lake_build"],
    "CI runs lake build so proofs stay green");
  boolCheck(results, "project_setup", "lake_build_green", manifest,
    ["setup", "lake_build_green"],
    "lake build is green — the proofs compile");

  // ---- Section 2: statement_integrity (method steps 2 + 6, red lines) ----
  boolCheck(results, "statement_integrity",
    "statement_stated_before_proving", manifest,
    ["statements", "stated_before_proving"],
    "the theorem is stated first — theorem name (args) : Prop — before any proving begins");
  boolCheck(results, "statement_integrity",
    "statement_meaning_checked", manifest,
    ["statements", "meaning_checked_before_proving"],
    "the statement is checked to say what it means before proving it");
  boolCheck(results, "statement_integrity",
    "statement_reviewed_independently_of_tactics", manifest,
    ["statements", "reviewed_independently_of_tactics"],
    "statements are reviewed independently of tactics by a second pair of eyes — a proof of the wrong theorem is worthless");
  falseCheck(results, "statement_integrity",
    "statement_not_weakened_silently", manifest,
    ["statements", "weakened_silently"],
    "never weaken a statement silently to make it provable");
  falseCheck(results, "statement_integrity",
    "unproven_claims_not_presented_as_verified", manifest,
    ["statements", "unproven_claims_presented_as_verified"],
    "no unproven claims dressed as formally verified");

  // ---- Section 3: definitions_and_model (method step 3) ----
  boolCheck(results, "definitions_and_model",
    "definitions_are_total", manifest,
    ["definitions", "total"],
    "definitions of the system model are total — no partial definitions hiding the hard cases");
  boolCheck(results, "definitions_and_model",
    "definitions_are_executable", manifest,
    ["definitions", "executable"],
    "definitions of the system model are executable");
  boolCheck(results, "definitions_and_model",
    "specs_separate_from_implementation", manifest,
    ["definitions", "specs_separate_from_implementation"],
    "specs are separate from implementation");

  // ---- Section 4: proof_integrity (method steps 4 + 5) ----
  boolCheck(results, "proof_integrity",
    "proofs_structured_and_readable", manifest,
    ["proof", "structured_and_readable"],
    "structured proofs, kept readable — proofs are code and docs");
  boolCheck(results, "proof_integrity",
    "cheating_items_tracked_as_tickets", manifest,
    ["proof", "cheating_items_tracked_as_tickets"],
    "sorry, new axioms and native_decide shortcuts are tracked as tickets, never smuggled into deliverables");
  falseCheck(results, "proof_integrity",
    "cheating_not_smuggled_into_deliverable", manifest,
    ["proof", "cheating_smuggled_into_deliverable"],
    "no cheating smuggled into the deliverable");

  // ---- Section 5: theorem_declarations (quality gates, computed) ----
  const [theoremsEvaluated, theoremsWithSorry] = theoremChecks(results, manifest);

  // ---- Section 6: build_attestation ----
  boolCheck(results, "build_attestation", "build_log_retained",
    manifest, ["attestation", "build_log_retained"],
    "the lake build output is retained as the kernel-check attestation");
  boolCheck(results, "build_attestation", "axiom_audit_performed",
    manifest, ["attestation", "axiom_audit_performed"],
    "an axiom audit (#print axioms) is performed for each delivered theorem");
  boolCheck(results, "build_attestation",
    "reproduction_recipe_present", manifest,
    ["attestation", "reproduction_recipe_present"],
    "a clean-checkout rebuild recipe is present — the proof re-checks from scratch");

  // ---- Section 7: model_alignment (method step 7) ----
  boolCheck(results, "model_alignment",
    "model_implementation_mapping_documented", manifest,
    ["alignment", "mapping_documented"],
    "the model-to-implementation mapping is documented");
  boolCheck(results, "model_alignment",
    "implementation_changes_ported_through_model", manifest,
    ["alignment", "changes_ported_through_model"],
    "port changes go back through the model");
  boolCheck(results, "model_alignment",
    "model_and_implementation_in_sync", manifest,
    ["alignment", "model_and_implementation_in_sync"],
    "the verified model and the implementation are in sync");

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
    verdict = "NOT_VERIFIED";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "VERIFIED";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "lean4-formal-proof",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
    theorems_evaluated: theoremsEvaluated,
    theorems_with_sorry: theoremsWithSorry,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "LEAN4 FORMAL PROOF",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(24)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
