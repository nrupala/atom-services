// Confidential computing design — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/confidential-computing-design/src/confidential_computing_design.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Computed amounts use the shared
// fixed serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly
// six decimals; computed comparisons compare the fixed-6dp
// difference to zero. This atom validates a declared
// confidential-computing design record; it designs no system
// and exercises no security judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (the coverage-list entries and the
// technology name) are validated as strings only, never
// enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  entity: "string",
  threat_model: {
    documented: "boolean",
    protects_against: ["string"],
    does_not_protect_against: ["string"],
    claims_require_threat_model: "boolean",
  },
  technology: {
    name: "string",
    distinctions_considered: "boolean",
    chosen_by_workload_shape: "boolean",
    chosen_by_available_hardware: "boolean",
  },
  attestation: {
    verification_implemented: "boolean",
    verification_tested: "boolean",
    measurement_verified: "boolean",
    fresh_nonce_verified: "boolean",
    verified_before_trusting: "boolean",
  },
  enclave: {
    sealed_keys_bound_to_identity_or_measurement: "boolean",
    attested_tls_used: "boolean",
    surface_area_minimized: "boolean",
    trusted_components: [{
      name: "string",
      trusted_lines: "number",
    }],
    declared_trusted_codebase_lines: "number",
    debug_enabled_in_production: "boolean",
  },
  engineering: {
    reproducible_builds: "boolean",
    signed_enclave_images: "boolean",
    measurements_versioned_and_pinned: "boolean",
    real_attestation_in_ci_or_staging: "boolean",
    fallback_documented: "boolean",
    silent_downgrade_used: "boolean",
  },
  keys: {
    sealed_keys_tested_including_recovery: "boolean",
    root_keys_stored_unsealed_beside_enclave: "boolean",
    rotation_designed: "boolean",
    recovery_designed: "boolean",
    measurement_changes_invalidating_seals_documented: "boolean",
  },
  claims: {
    claims_match_evidence: "boolean",
    marketing_mechanism_audit_done: "boolean",
    public_exclusions: ["string"],
    unverifiable_secure_enclave_claims_made: "boolean",
    regulatory_compliance_paired_where_required: "boolean",
  },
};

export const SECTIONS = [
  "threat_model",
  "technology_selection",
  "attestation",
  "enclave_patterns",
  "engineering_discipline",
  "key_management",
  "claims_discipline",
] as const;

export const STATED_PROTECTS_AGAINST = [
  "host_access",
  "operator_access",
  "co_tenant_access",
];

export const STATED_DOES_NOT_PROTECT_AGAINST = [
  "side_channels",
  "supply_chain",
  "flawed_enclave_code",
  "unsealed_inputs_outputs",
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
  entity: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  components_evaluated: number;
  computed_trusted_codebase_lines: string | null;
  trusted_codebase_difference: string | null;
  threat_protects_not_covered: string[] | null;
  threat_exclusions_not_covered: string[] | null;
  claims_exclusions_not_listed: string[] | null;
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

function getEntry(
  entry: Record<string, unknown>,
  key: string,
): [unknown, boolean] {
  if (!Object.prototype.hasOwnProperty.call(entry, key)) {
    return [null, false];
  }
  return [entry[key], true];
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

function isNonemptyStr(value: unknown): boolean {
  return typeof value === "string" && value.length > 0;
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function coverageCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  stated: string[],
  evidence: string,
): string[] | null {
  const [entries, hasEntries] = getPath(manifest, ...path);
  const isList = hasEntries && Array.isArray(entries);
  const notCovered: string[] | null = isList
    ? stated.filter((entry) => !(entries as unknown[]).includes(entry))
    : null;
  check(results, section, name, entries, isList,
    isList && (notCovered as string[]).length === 0, evidence);
  return notCovered;
}

interface TrustedComputed {
  componentsEvaluated: number;
  computedTotal: number | null;
  totalDifference: number | null;
}

function trustedCodebaseChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): TrustedComputed {
  const [components, hasComponents] = getPath(
    manifest, "enclave", "trusted_components");
  const [declaredTotal, hasDeclared] = getPath(
    manifest, "enclave", "declared_trusted_codebase_lines");
  if (!hasComponents || !Array.isArray(components) ||
      components.length === 0) {
    for (const [name, evidence] of [
      ["trusted_component_entries_complete",
       "no trusted components declared"],
      ["trusted_codebase_total_matches_component_sum",
       "no trusted components declared"],
    ] as const) {
      check(results, "enclave_patterns", name,
        components, false, false, evidence);
    }
    return { componentsEvaluated: 0, computedTotal: null, totalDifference: null };
  }
  let incomplete = false;
  let evaluated = 0;
  let total = 0;
  for (const entry of components as unknown[]) {
    if (!isPyDict(entry)) {
      incomplete = true;
      continue;
    }
    const [name, hasName] = getEntry(entry, "name");
    const [lines, hasLines] = getEntry(entry, "trusted_lines");
    if (!(hasName && hasLines && isNonemptyStr(name) && isNumber(lines))) {
      incomplete = true;
      continue;
    }
    evaluated += 1;
    total += lines as number;
  }
  if (incomplete) {
    check(results, "enclave_patterns",
      "trusted_component_entries_complete",
      components, false, false,
      "a trusted component is missing its name or trusted_lines");
  } else {
    check(results, "enclave_patterns",
      "trusted_component_entries_complete",
      components, true, true,
      "every trusted component carries a name and a trusted_lines count");
  }
  let computedTotal: number | null = null;
  let difference: number | null = null;
  if (incomplete) {
    check(results, "enclave_patterns",
      "trusted_codebase_total_matches_component_sum",
      components, false, false,
      "a trusted component is incomplete, so the trusted-codebase total cannot be re-derived");
  } else {
    computedTotal = total;
    if (hasDeclared && isNumber(declaredTotal)) {
      difference = (declaredTotal as number) - total;
    }
    const consistent = hasDeclared && isNumber(declaredTotal) &&
      fmt6((declaredTotal as number) - total) === "0.000000";
    check(results, "enclave_patterns",
      "trusted_codebase_total_matches_component_sum",
      declaredTotal, hasDeclared && isNumber(declaredTotal), consistent,
      "method step 4: the declared total trusted-codebase lines equal the sum of the declared trusted components' lines (minimal enclave surface area; no maximum size is stated by the skill, so no size is judged here)");
  }
  return { componentsEvaluated: evaluated, computedTotal, totalDifference: difference };
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: threat_model ----
  boolCheck(results, "threat_model", "threat_model_documented",
    manifest, ["threat_model", "documented"],
    "quality gate: the threat model is documented — protects / doesn't protect");
  const protectsNotCovered = coverageCheck(results, "threat_model",
    "threat_protects_against_covers_stated",
    manifest, ["threat_model", "protects_against"],
    STATED_PROTECTS_AGAINST,
    "method step 1: the declared protects-against list covers what the skill names — host access, operator poking, co-tenants");
  const exclusionsNotCovered = coverageCheck(results, "threat_model",
    "threat_does_not_protect_against_covers_stated",
    manifest, ["threat_model", "does_not_protect_against"],
    STATED_DOES_NOT_PROTECT_AGAINST,
    "method step 1: the declared does-not-protect list covers what the skill names — side channels, supply chain, flawed enclave code, unsealed inputs/outputs");
  boolCheck(results, "threat_model", "claims_require_threat_model",
    manifest, ["threat_model", "claims_require_threat_model"],
    "method step 1: no model, no claim — claims are gated on the threat model");

  // ---- Section 2: technology_selection ----
  const [techName, hasTechName] = getPath(manifest, "technology", "name");
  check(results, "technology_selection", "technology_named",
    techName, hasTechName, isNonemptyStr(techName),
    "method step 2: the chosen TEE technology is named (validated as a string only, never enum-checked — the skill names examples, not a closed list)");
  boolCheck(results, "technology_selection",
    "technology_distinctions_considered",
    manifest, ["technology", "distinctions_considered"],
    "method step 2: the VM-level vs process-level vs ARM CCA/TZ distinctions are considered");
  boolCheck(results, "technology_selection",
    "technology_chosen_by_workload_shape",
    manifest, ["technology", "chosen_by_workload_shape"],
    "method step 2: the technology is chosen by workload shape");
  boolCheck(results, "technology_selection",
    "technology_chosen_by_available_hardware",
    manifest, ["technology", "chosen_by_available_hardware"],
    "method step 2: the technology is chosen by available hardware");

  // ---- Section 3: attestation ----
  boolCheck(results, "attestation", "attestation_verification_implemented",
    manifest, ["attestation", "verification_implemented"],
    "quality gate: attestation verification is implemented");
  boolCheck(results, "attestation", "attestation_verification_tested",
    manifest, ["attestation", "verification_tested"],
    "quality gate: attestation verification is tested");
  boolCheck(results, "attestation", "quote_measurement_verified",
    manifest, ["attestation", "measurement_verified"],
    "method step 3: the quote measurement is verified");
  boolCheck(results, "attestation", "fresh_nonce_verified",
    manifest, ["attestation", "fresh_nonce_verified"],
    "method step 3: the nonce is fresh — quotes are verified with a fresh nonce");
  boolCheck(results, "attestation", "attestation_verified_before_trusting",
    manifest, ["attestation", "verified_before_trusting"],
    "method step 3: quotes are verified before trusting an enclave");

  // ---- Section 4: enclave_patterns ----
  boolCheck(results, "enclave_patterns",
    "sealed_keys_bound_to_identity_or_measurement",
    manifest, ["enclave", "sealed_keys_bound_to_identity_or_measurement"],
    "method step 4: sealed storage — keys are bound to enclave identity/measurement");
  boolCheck(results, "enclave_patterns", "attested_tls_secure_channels",
    manifest, ["enclave", "attested_tls_used"],
    "method step 4: secure channels use attested TLS");
  boolCheck(results, "enclave_patterns", "enclave_surface_area_minimized",
    manifest, ["enclave", "surface_area_minimized"],
    "method step 4: the enclave surface area is minimal — a small trusted codebase");
  const { componentsEvaluated, computedTotal, totalDifference } =
    trustedCodebaseChecks(results, manifest);
  falseCheck(results, "enclave_patterns", "production_debug_disabled",
    manifest, ["enclave", "debug_enabled_in_production"],
    "red line: no production debug mode — debug is disabled everywhere in prod");

  // ---- Section 5: engineering_discipline ----
  boolCheck(results, "engineering_discipline", "reproducible_builds",
    manifest, ["engineering", "reproducible_builds"],
    "method step 5: enclave builds are reproducible");
  boolCheck(results, "engineering_discipline", "enclave_images_signed",
    manifest, ["engineering", "signed_enclave_images"],
    "method step 5: enclave images are signed");
  boolCheck(results, "engineering_discipline",
    "measurements_versioned_and_pinned",
    manifest, ["engineering", "measurements_versioned_and_pinned"],
    "method step 5: measurements are versioned and pinned");
  boolCheck(results, "engineering_discipline",
    "real_attestation_in_ci_or_staging",
    manifest, ["engineering", "real_attestation_in_ci_or_staging"],
    "method step 5: real attestation is exercised in CI/staging where possible (a simulator is used in dev)");
  boolCheck(results, "engineering_discipline",
    "hardware_absent_fallback_documented",
    manifest, ["engineering", "fallback_documented"],
    "method step 5: the fallback if hardware is absent is documented");
  falseCheck(results, "engineering_discipline",
    "fallback_never_silent_downgrade",
    manifest, ["engineering", "silent_downgrade_used"],
    "method step 5: a hardware-absent downgrade is explicit, never silent");

  // ---- Section 6: key_management ----
  boolCheck(results, "key_management",
    "sealed_keys_tested_including_recovery",
    manifest, ["keys", "sealed_keys_tested_including_recovery"],
    "quality gate: sealed keys are tested, including the recovery path");
  falseCheck(results, "key_management", "root_keys_never_stored_unsealed",
    manifest, ["keys", "root_keys_stored_unsealed_beside_enclave"],
    "red line: root keys are never stored unsealed beside the enclave");
  boolCheck(results, "key_management", "key_rotation_designed",
    manifest, ["keys", "rotation_designed"],
    "method step 6: key rotation is designed");
  boolCheck(results, "key_management", "key_recovery_designed",
    manifest, ["keys", "recovery_designed"],
    "method step 6: key recovery is designed — user data is not bricked if the enclave dies");
  boolCheck(results, "key_management",
    "measurement_changes_invalidating_seals_documented",
    manifest, ["keys", "measurement_changes_invalidating_seals_documented"],
    "method step 6: measurement changes that invalidate seals are documented");

  // ---- Section 7: claims_discipline ----
  boolCheck(results, "claims_discipline", "claims_match_evidence",
    manifest, ["claims", "claims_match_evidence"],
    "quality gate: claims match evidence");
  boolCheck(results, "claims_discipline", "marketing_mechanism_audit_done",
    manifest, ["claims", "marketing_mechanism_audit_done"],
    "method step 7: a marketing-to-mechanism audit is done");
  const claimsNotListed = coverageCheck(results, "claims_discipline",
    "public_exclusions_cover_stated_exclusions",
    manifest, ["claims", "public_exclusions"],
    STATED_DOES_NOT_PROTECT_AGAINST,
    "method step 7: the publicly listed exclusions cover what the enclave doesn't cover — side channels, supply chain, flawed enclave code, unsealed inputs/outputs");
  falseCheck(results, "claims_discipline",
    "no_unverifiable_secure_enclave_claims",
    manifest, ["claims", "unverifiable_secure_enclave_claims_made"],
    "red line: no unverifiable 'secure enclave' claims are made");
  boolCheck(results, "claims_discipline",
    "regulatory_compliance_paired_where_required",
    manifest, ["claims", "regulatory_compliance_paired_where_required"],
    "method step 7: regulatory compliance is paired where required");

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
    verdict = "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CONFIDENTIAL_COMPUTING_DESIGN_READY";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "threat_protects_against_covers_stated" ||
      r.check === "threat_does_not_protect_against_covers_stated" ||
      r.check === "trusted_component_entries_complete" ||
      r.check === "trusted_codebase_total_matches_component_sum" ||
      r.check === "public_exclusions_cover_stated_exclusions")
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
    service: "confidential-computing-design",
    atom_version: "0.1.0",
    entity: manifest["entity"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    components_evaluated: componentsEvaluated,
    computed_trusted_codebase_lines: fmt6(computedTotal),
    trusted_codebase_difference: fmt6(totalDifference),
    threat_protects_not_covered: protectsNotCovered,
    threat_exclusions_not_covered: exclusionsNotCovered,
    claims_exclusions_not_listed: claimsNotListed,
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "CONFIDENTIAL COMPUTING DESIGN",
    `entity: ${pyStr(verdict.entity ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
