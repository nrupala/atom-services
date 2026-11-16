// License compliance check — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/license-compliance-check/src/license_compliance_check.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string
// are byte-identical to the Python output for the same input.

import { pyRepr, pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  product: "string",
  distribution_model: "string",
  license_file: {
    present: "boolean",
    texts_unmodified: "boolean",
  },
  notice_file: { present: "boolean" },
  source_headers: { present: "boolean" },
  components: [{
    name: "string",
    license: "string",
    requires_attribution: "boolean",
    requires_bundled_license: "boolean",
  }],
  dependency_scan: {
    completed: "boolean",
    clean: "boolean",
    accepted_with_record: "boolean",
    incompatible_shipped: "boolean",
  },
  attribution: { shipped: "boolean" },
  bundled_licenses: { shipped: "boolean" },
  contributor_terms: {
    policy: "string",
    documented_in_contributing: "boolean",
    enforced: "boolean",
  },
  project_license: "string",
  license_decision: { logged: "boolean" },
  trademark: {
    usage_rules_documented: "boolean",
    implied_endorsement: "boolean",
  },
  public_claims: {
    claims_made: ["string"],
    attestation_present: "boolean",
  },
  client_work: {
    is_client_work: "boolean",
    contract_constraints_reviewed: "boolean",
  },
};

export const SECTIONS = [
  "license_files",
  "dependency_compatibility",
  "contributor_terms",
  "claims_and_contracts",
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
  product: unknown;
  distribution_model: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  summary: string;
}

const BINARY_MODELS = [
  "proprietary_binary",
  "binary_distribution",
  "open_binary",
];

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

function isCopyleft(licence: unknown): boolean {
  if (typeof licence !== "string") return false;
  const normalized = licence.trim().toUpperCase();
  return normalized.startsWith("AGPL") || normalized.startsWith("GPL");
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];
  const [compsRaw, hasComps] = getPath(manifest, "components");
  const components: unknown[] = Array.isArray(compsRaw) ? compsRaw : [];

  // ---- Section 1: license_files ----
  const [licPresent, hasLic] = getPath(manifest, "license_file", "present");
  check(results, "license_files", "root_license_present", licPresent,
    hasLic, licPresent === true, "quality gate: root LICENSE present");

  const [notice, hasNotice] = getPath(manifest, "notice_file", "present");
  check(results, "license_files", "notice_file_present", notice,
    hasNotice, notice === true, "quality gate: root LICENSE + NOTICE present");

  const [unmodified, hasUnmod] = getPath(manifest, "license_file", "texts_unmodified");
  check(results, "license_files", "license_texts_unmodified", unmodified,
    hasUnmod, unmodified === true,
    "skill red line: license texts kept verbatim, never edited");

  const [headers, hasHeaders] = getPath(manifest, "source_headers", "present");
  check(results, "license_files", "source_headers_present", headers,
    hasHeaders, headers === true, "source headers per house convention");

  // ---- Section 2: dependency_compatibility ----
  check(results, "dependency_compatibility", "components_inventory_declared",
    compsRaw, hasComps,
    Array.isArray(compsRaw) && compsRaw.length > 0,
    `components=${pyRepr(compsRaw)}`);

  const [scanDone, hasScan] = getPath(manifest, "dependency_scan", "completed");
  check(results, "dependency_compatibility", "dependency_scan_completed",
    scanDone, hasScan, scanDone === true,
    "automated license scan of dependencies");

  const [clean, hasClean] = getPath(manifest, "dependency_scan", "clean");
  const [accepted] = getPath(manifest, "dependency_scan", "accepted_with_record");
  check(results, "dependency_compatibility", "scan_clean_or_accepted_with_record",
    clean, hasClean, clean === true || accepted === true,
    "quality gate: scan clean or consciously accepted with a record");

  const [model, hasModel] = getPath(manifest, "distribution_model");
  const offenders = components
    .filter((c) => isPyDict(c) && isCopyleft(c["license"]))
    .map((c) => (c as Record<string, unknown>)["name"] ?? null);
  check(results, "dependency_compatibility", "no_copyleft_in_proprietary_binary",
    model, hasComps && hasModel,
    !(model === "proprietary_binary" && offenders.length > 0),
    `copyleft_components=${pyRepr(offenders)} distribution_model=${pyRepr(model)} ` +
    "(skill: incompatible combinations resolved before release)");

  const [incompat, hasIncompat] = getPath(manifest, "dependency_scan", "incompatible_shipped");
  check(results, "dependency_compatibility", "no_incompatible_dependency_shipped",
    incompat, hasIncompat, incompat === false,
    "skill red line: no incompatible dependency shipped 'for now'");

  const requiresAttr = components.some(
    (c) => isPyDict(c) && c["requires_attribution"] === true,
  );
  const [shipped, hasShipped] = getPath(manifest, "attribution", "shipped");
  if (requiresAttr) {
    check(results, "dependency_compatibility", "attribution_shipped_where_required",
      shipped, hasShipped, shipped === true,
      "a component requires attribution; attribution must ship");
  } else {
    check(results, "dependency_compatibility", "attribution_shipped_where_required",
      compsRaw, hasComps, true,
      "no component declares an attribution requirement");
  }

  const requiresBundled = components.some(
    (c) => isPyDict(c) && c["requires_bundled_license"] === true,
  );
  const [bundled, hasBundled] = getPath(manifest, "bundled_licenses", "shipped");
  if (typeof model === "string" && BINARY_MODELS.includes(model) && requiresBundled) {
    check(results, "dependency_compatibility", "bundled_licenses_shipped_where_required",
      bundled, hasBundled, bundled === true,
      "release hygiene: bundled third-party licenses shipped with binaries where required");
  } else {
    check(results, "dependency_compatibility", "bundled_licenses_shipped_where_required",
      model, hasModel && hasComps, true,
      "no bundled-licence requirement triggered");
  }

  // ---- Section 3: contributor_terms ----
  const [policy, hasPolicy] = getPath(manifest, "contributor_terms", "policy");
  check(results, "contributor_terms", "contributor_policy_chosen",
    policy, hasPolicy, policy === "DCO" || policy === "CLA",
    `policy=${pyRepr(policy)} (skill: pick a policy — DCO sign-off or CLA)`);

  const [documented, hasDoc] = getPath(manifest, "contributor_terms", "documented_in_contributing");
  check(results, "contributor_terms", "contributor_policy_documented",
    documented, hasDoc, documented === true,
    "contributor policy documented in CONTRIBUTING");

  const [enforced, hasEnf] = getPath(manifest, "contributor_terms", "enforced");
  check(results, "contributor_terms", "contributor_policy_enforced",
    enforced, hasEnf, enforced === true,
    "contributor policy enforced in the contribution flow");

  // ---- Section 4: claims_and_contracts ----
  const [projectLicence, hasPl] = getPath(manifest, "project_license");
  const [logged, hasLogged] = getPath(manifest, "license_decision", "logged");
  if (isCopyleft(projectLicence)) {
    check(results, "claims_and_contracts", "copyleft_choice_logged_as_decision",
      logged, hasLogged, logged === true,
      "skill: copyleft only as a conscious product decision, logged like an ADR");
  } else {
    check(results, "claims_and_contracts", "copyleft_choice_logged_as_decision",
      projectLicence, hasPl, true,
      "project licence is not copyleft; no decision log required by this check");
  }

  const [tmRules, hasTm] = getPath(manifest, "trademark", "usage_rules_documented");
  check(results, "claims_and_contracts", "trademark_usage_rules_documented",
    tmRules, hasTm, tmRules === true, "name/logo usage rules documented");

  const [endorsement, hasEnd] = getPath(manifest, "trademark", "implied_endorsement");
  check(results, "claims_and_contracts", "no_implied_endorsement",
    endorsement, hasEnd, endorsement === false, "no implied endorsement");

  const [claims, hasClaims] = getPath(manifest, "public_claims", "claims_made");
  const [attestation, hasAtt] = getPath(manifest, "public_claims", "attestation_present");
  if (Array.isArray(claims) && claims.length > 0) {
    check(results, "claims_and_contracts", "public_claims_have_attestation",
      attestation, hasAtt, attestation === true,
      "public claims only with real attestation behind them");
  } else {
    check(results, "claims_and_contracts", "public_claims_have_attestation",
      claims, hasClaims, true, "no public claims declared");
  }

  const [isClient, hasClient] = getPath(manifest, "client_work", "is_client_work");
  const [reviewed, hasReviewed] = getPath(manifest, "client_work", "contract_constraints_reviewed");
  if (isClient === true) {
    check(results, "claims_and_contracts", "client_contract_constraints_reviewed",
      reviewed, hasReviewed, reviewed === true,
      "client work: SOW/MSA constraints on IP and reuse reviewed; conflicts flagged for counsel");
  } else {
    check(results, "claims_and_contracts", "client_contract_constraints_reviewed",
      isClient, hasClient, true, "not declared as client work");
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
    verdict = "NON_COMPLIANT";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "COMPLIANT";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "license-compliance-check",
    atom_version: "0.1.0",
    product: manifest["product"] ?? null,
    distribution_model: manifest["distribution_model"] ?? null,
    verdict,
    sections,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across four sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "LICENSE-COMPLIANCE CHECK",
    `product: ${pyStr(verdict.product ?? null)}  distribution_model: ${pyStr(verdict.distribution_model ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(26)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  lines.push(
    "Not legal advice — counsel decides contested calls (skill red line).",
  );
  return lines.join("\n");
}
