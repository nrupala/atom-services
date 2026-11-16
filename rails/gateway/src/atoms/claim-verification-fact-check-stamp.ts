// Claim verification fact-check stamp — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/claim-verification-fact-check-stamp/src/claim_verification_fact_check_stamp.py
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
  document: "string",
  process: {
    claims_extracted: "boolean",
    units_and_dates_checked: "boolean",
    counter_case_considered: "boolean",
    evidence_published_inline: "boolean",
    methodology_visible_for_big_claims: "boolean",
    corrections_policy_published: "boolean",
    versions_retained: "boolean",
    silent_edits_made: "boolean",
  },
  claims: [{
    id: "string",
    material: "boolean",
    label: "string",
    independent_sources: "number",
    primary_source: "boolean",
    sources_archived: "boolean",
    source_metadata_recorded: "boolean",
    independence_checked: "boolean",
    has_numbers: "boolean",
    math_rechecked: "boolean",
    language_weakest_supported: "boolean",
  }],
};

export const SECTIONS = [
  "extraction",
  "source_ladder",
  "triangulation",
  "compute_rechecks",
  "uncertainty_language",
  "publication_and_corrections",
] as const;

export const LABELS = ["verified", "likely", "contested", "unverified"] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface ClaimsSummary {
  claims_total: number;
  material_claims: number;
  verified_claims: number;
}

export interface Verdict {
  service: string;
  atom_version: string;
  document: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  claims_summary: ClaimsSummary;
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

type Predicate = (claim: Record<string, unknown>) => boolean | null;

function claimName(claim: Record<string, unknown>, index: number): string {
  const [cid, hasId] = getFrom(claim, "id");
  if (hasId && typeof cid === "string" && cid.length > 0) return cid;
  return `#${index}`;
}

function aggregate(
  results: CheckResult[],
  section: string,
  name: string,
  claims: unknown,
  hasClaims: boolean,
  predicate: Predicate,
  passEvidence: string,
  failPrefix: string,
  missingEvidence: string,
): void {
  if (!hasClaims || !Array.isArray(claims) || claims.length === 0) {
    check(results, section, name, claims, false, false, missingEvidence);
    return;
  }
  const offenders: string[] = [];
  let incomplete = false;
  claims.forEach((claim, i) => {
    if (!isPyDict(claim)) {
      incomplete = true;
      return;
    }
    const outcome = predicate(claim);
    if (outcome === null) incomplete = true;
    else if (outcome === false) offenders.push(claimName(claim, i));
  });
  if (incomplete) {
    check(results, section, name, claims, false, false, missingEvidence);
  } else if (offenders.length > 0) {
    check(results, section, name, claims, true, false,
      `${failPrefix}: ${offenders.join(", ")}`);
  } else {
    check(results, section, name, claims, true, true, passEvidence);
  }
}

function fieldTrue(field: string): Predicate {
  return (claim) => {
    const [value, present] = getFrom(claim, field);
    if (!present) return null;
    return value === true;
  };
}

const triangulated: Predicate = (claim) => {
  const [material, hasMaterial] = getFrom(claim, "material");
  if (hasMaterial && material !== true) return true;
  const [sources, hasSources] = getFrom(claim, "independent_sources");
  const [primary, hasPrimary] = getFrom(claim, "primary_source");
  if (!(hasMaterial && hasSources && hasPrimary && isNumber(sources))) {
    return null;
  }
  return (sources as number) >= 2 || (primary === true && (sources as number) >= 1);
};

const mathRechecked: Predicate = (claim) => {
  const [hasNumbers, hasFlag] = getFrom(claim, "has_numbers");
  if (hasFlag && hasNumbers !== true) return true;
  const [rechecked, hasRechecked] = getFrom(claim, "math_rechecked");
  if (!(hasFlag && hasRechecked)) return null;
  return rechecked === true;
};

const labelValid: Predicate = (claim) => {
  const [label, hasLabel] = getFrom(claim, "label");
  if (!hasLabel) return null;
  return (LABELS as readonly unknown[]).includes(label);
};

const materialArchived: Predicate = (claim) => {
  const [material, hasMaterial] = getFrom(claim, "material");
  if (hasMaterial && material === true) {
    return fieldTrue("sources_archived")(claim);
  }
  return true;
};

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];
  const [claims, hasClaims] = getPath(manifest, "claims");

  // ---- Section 1: extraction (skill method 1) ----
  boolCheck(results, "extraction", "claims_extracted_one_row_per_claim",
    manifest, ["process", "claims_extracted"],
    "isolate every checkable unit — one row per claim");
  if (hasClaims && Array.isArray(claims) && claims.length > 0) {
    check(results, "extraction", "claims_declared", claims, true, true,
      "claims declared for verification");
  } else {
    check(results, "extraction", "claims_declared", claims, false, false,
      "no claims declared");
  }

  // ---- Section 2: source_ladder (skill method 2) ----
  aggregate(results, "source_ladder",
    "source_metadata_recorded_for_every_claim",
    claims, hasClaims, fieldTrue("source_metadata_recorded"),
    "for each source: who, when, method, sample, conflicts of interest recorded",
    "claims missing source metadata",
    "source metadata not recorded for every claim");
  aggregate(results, "source_ladder", "source_independence_checked",
    claims, hasClaims, fieldTrue("independence_checked"),
    "independence checked — two sources citing each other are one source",
    "claims whose source independence was not checked",
    "source independence not checked for every claim");
  aggregate(results, "source_ladder", "material_claim_sources_archived",
    claims, hasClaims, materialArchived,
    "quality gate: every material claim has at least one archived source",
    "material claims without archived sources",
    "archived-source evidence missing for a material claim");

  // ---- Section 3: triangulation (skill method 3) ----
  aggregate(results, "triangulation", "material_claims_triangulated",
    claims, hasClaims, triangulated,
    "material claims need >= 2 independent sources, or one primary source plus confirmation",
    "material claims not triangulated",
    "triangulation evidence missing for a material claim");

  // ---- Section 4: compute_rechecks (skill method 4) ----
  aggregate(results, "compute_rechecks",
    "numbers_rederived_for_numeric_claims",
    claims, hasClaims, mathRechecked,
    "re-derive math for claims carrying numbers",
    "numeric claims whose math was not re-derived",
    "math re-check evidence missing for a numeric claim");
  boolCheck(results, "compute_rechecks", "units_dates_and_names_checked",
    manifest, ["process", "units_and_dates_checked"],
    "sanity-check units and orders of magnitude; verify dates and name spellings");

  // ---- Section 5: uncertainty_language (skill methods 3 + 5 + gate) ----
  aggregate(results, "uncertainty_language", "labels_in_vocabulary",
    claims, hasClaims, labelValid,
    "labels: verified / likely / contested / unverified",
    "claims with labels outside the vocabulary",
    "a claim carries no label");
  aggregate(results, "uncertainty_language",
    "language_is_weakest_the_evidence_supports",
    claims, hasClaims, fieldTrue("language_weakest_supported"),
    "never upgrade 'consistent with' to 'proves'",
    "claims whose language overstates the evidence",
    "language-strength evidence missing for a claim");
  boolCheck(results, "uncertainty_language", "counter_case_considered",
    manifest, ["process", "counter_case_considered"],
    "quality gate: counter-case considered; 'what would change our mind' noted for contested claims");

  // ---- Section 6: publication_and_corrections (methods 6-7 + red lines) ----
  boolCheck(results, "publication_and_corrections",
    "evidence_published_inline", manifest,
    ["process", "evidence_published_inline"],
    "publish with evidence: inline citations, archived links");
  boolCheck(results, "publication_and_corrections",
    "methodology_visible_for_big_claims", manifest,
    ["process", "methodology_visible_for_big_claims"],
    "visible methodology for big claims");
  boolCheck(results, "publication_and_corrections",
    "corrections_policy_published", manifest,
    ["process", "corrections_policy_published"],
    "quality gate: corrections policy published");
  boolCheck(results, "publication_and_corrections", "versions_retained",
    manifest, ["process", "versions_retained"],
    "quality gate: versions retained");
  const [silent, hasSilent] = getPath(manifest, "process", "silent_edits_made");
  check(results, "publication_and_corrections", "no_silent_corrections",
    silent, hasSilent, silent === false,
    "skill red line: corrections are never silent — fast, dated, visible change log");

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
    verdict = "NOT_STAMPED";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "STAMPED";
  }

  const claimsTotal = Array.isArray(claims) ? claims.length : 0;
  let materialClaims = 0;
  let verifiedClaims = 0;
  if (Array.isArray(claims)) {
    for (const claim of claims) {
      if (isPyDict(claim)) {
        if (claim["material"] === true) materialClaims += 1;
        if (claim["label"] === "verified") verifiedClaims += 1;
      }
    }
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "claim-verification-fact-check-stamp",
    atom_version: "0.1.0",
    document: manifest["document"] ?? null,
    verdict,
    sections,
    checks: results,
    claims_summary: {
      claims_total: claimsTotal,
      material_claims: materialClaims,
      verified_claims: verifiedClaims,
    },
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "CLAIM-VERIFICATION FACT-CHECK STAMP",
    `document: ${pyStr(verdict.document ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(26)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
