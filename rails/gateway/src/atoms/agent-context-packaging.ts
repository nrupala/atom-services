// Agent context packaging — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/agent-context-packaging/src/agent_context_packaging.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string
// are byte-identical to the Python output for the same input. The
// skill states no numeric threshold, so nothing is computed beyond
// the pass / fail / missing counts in the summary.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  pack: "string",
  scope: {
    what_travels_declared: "boolean",
    recipient_declared: "boolean",
    purpose_declared: "boolean",
    pack_inherits_boundary: "boolean",
  },
  redaction: {
    keys_replaced_with_environment_references: "boolean",
    personal_data_minimized_purpose_limited: "boolean",
    contacts_or_financials_included: "boolean",
    scan_clean_automated_and_manual: "boolean",
    secrets_or_pii_unredacted_present: "boolean",
  },
  manifest: {
    manifest_present: "boolean",
    manifest_lists_contents_version_date_generator_and_source: "boolean",
  },
  structure: {
    stable_folder_layout: "boolean",
    receiver_runbook_present: "boolean",
    receiver_runbook_tested: "boolean",
  },
  reproducibility: {
    generated_by_script_from_source_of_truth: "boolean",
    hand_assembled: "boolean",
    derived_pack_hand_maintained_silently: "boolean",
    versioned_in_git: "boolean",
  },
  signing: { pack_signed: "boolean" },
  handoff: {
    is_handoff_dossier: "boolean",
    dossier_contents_complete: "boolean",
    everything_dated: "boolean",
    review_date_marked: "boolean",
  },
  freshness: {
    expiry_or_review_date_present: "boolean",
    stale_packs_flagged: "boolean",
    single_upstream_source_derived_not_primary: "boolean",
  },
  privacy: {
    stored_privately: "boolean",
    access_limited: "boolean",
    contact_handling_rules_complied: "boolean",
    third_party_personal_data_included: "boolean",
    lawful_basis_established: "boolean",
  },
};

export const SECTIONS = [
  "scope_declaration",
  "redaction",
  "structure_and_manifest",
  "reproducibility_and_signing",
  "handoff_dossier",
  "freshness_and_privacy",
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
  pack: unknown;
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

  // ---- Section 1: scope_declaration ----
  boolCheck(results, "scope_declaration", "scope_what_travels_declared",
    manifest, ["scope", "what_travels_declared"],
    "scope declaration first: what travels (config / rules / skills / state summaries / dossiers) is written down");
  boolCheck(results, "scope_declaration", "scope_recipient_declared",
    manifest, ["scope", "recipient_declared"],
    "scope declaration first: to whom the pack travels is written down");
  boolCheck(results, "scope_declaration", "scope_purpose_declared",
    manifest, ["scope", "purpose_declared"],
    "scope declaration first: why the pack travels is written down");
  boolCheck(results, "scope_declaration", "pack_inherits_scope_boundary",
    manifest, ["scope", "pack_inherits_boundary"],
    "the pack inherits the declared scope boundary");

  // ---- Section 2: redaction ----
  boolCheck(results, "redaction",
    "keys_replaced_with_environment_references",
    manifest, ["redaction", "keys_replaced_with_environment_references"],
    "redaction before anything: keys become environment references");
  boolCheck(results, "redaction",
    "personal_data_minimized_purpose_limited",
    manifest, ["redaction", "personal_data_minimized_purpose_limited"],
    "redaction: personal data is minimized (purpose-limited)");
  falseCheck(results, "redaction",
    "contacts_and_financials_excluded_by_default",
    manifest, ["redaction", "contacts_or_financials_included"],
    "redaction: contacts / financials are excluded by default");
  boolCheck(results, "redaction",
    "redaction_scan_clean_automated_and_manual",
    manifest, ["redaction", "scan_clean_automated_and_manual"],
    "quality gate: redaction scan clean (automated secret scanners + a manual pass); assume the receiver's storage is less protected than yours");
  falseCheck(results, "redaction", "no_unredacted_secrets_or_pii",
    manifest, ["redaction", "secrets_or_pii_unredacted_present"],
    "red line: never export secrets or PII unredacted");

  // ---- Section 3: structure_and_manifest ----
  boolCheck(results, "structure_and_manifest", "manifest_present",
    manifest, ["manifest", "manifest_present"],
    "structure: a manifest is present");
  boolCheck(results, "structure_and_manifest",
    "manifest_lists_contents_version_date_generator_and_source",
    manifest,
    ["manifest", "manifest_lists_contents_version_date_generator_and_source"],
    "structure: the manifest lists contents, version, date and generator; red line: every pack carries date + source");
  boolCheck(results, "structure_and_manifest", "stable_folder_layout",
    manifest, ["structure", "stable_folder_layout"],
    "structure: a stable folder layout, machine-readable where possible");
  boolCheck(results, "structure_and_manifest", "receiver_runbook_present",
    manifest, ["structure", "receiver_runbook_present"],
    "structure: a README / runbook for the receiving agent is present");
  boolCheck(results, "structure_and_manifest", "receiver_runbook_tested",
    manifest, ["structure", "receiver_runbook_tested"],
    "quality gate: receiver runbook tested — a fresh agent can operate from the pack");

  // ---- Section 4: reproducibility_and_signing ----
  boolCheck(results, "reproducibility_and_signing",
    "generated_by_script_from_source_of_truth",
    manifest, ["reproducibility", "generated_by_script_from_source_of_truth"],
    "reproducibility: exports are generated by a script from the source of truth");
  falseCheck(results, "reproducibility_and_signing", "not_hand_assembled",
    manifest, ["reproducibility", "hand_assembled"],
    "reproducibility: exports are never hand-assembled");
  falseCheck(results, "reproducibility_and_signing",
    "not_hand_maintained_silently",
    manifest, ["reproducibility", "derived_pack_hand_maintained_silently"],
    "red line: never hand-maintain a derived pack silently");
  boolCheck(results, "reproducibility_and_signing", "versioned_in_git",
    manifest, ["reproducibility", "versioned_in_git"],
    "reproducibility: exports are versioned in git");
  boolCheck(results, "reproducibility_and_signing", "pack_signed",
    manifest, ["signing", "pack_signed"],
    "reproducibility / quality gate: the pack is signed so authenticity is checkable; stored privately");

  // ---- Section 5: handoff_dossier ----
  const [isDossier, hasIsDossier] = getPath(
    manifest, "handoff", "is_handoff_dossier");
  const [contents, hasContents] = getPath(
    manifest, "handoff", "dossier_contents_complete");
  if (hasIsDossier && pyTruthy(isDossier)) {
    check(results, "handoff_dossier",
      "dossier_contents_complete_when_dossier",
      contents, hasContents, contents === true,
      "handoff dossiers carry goals, current state, open loops, contact/protocol rules and first tasks");
  } else {
    check(results, "handoff_dossier",
      "dossier_contents_complete_when_dossier",
      isDossier, hasIsDossier, true,
      "no handoff dossier declared");
  }
  boolCheck(results, "handoff_dossier", "everything_dated",
    manifest, ["handoff", "everything_dated"],
    "handoff dossiers: date everything");
  boolCheck(results, "handoff_dossier",
    "review_date_marked_against_stale_claims",
    manifest, ["handoff", "review_date_marked"],
    "handoff dossiers: avoid stale claims — mark the review date");

  // ---- Section 6: freshness_and_privacy ----
  boolCheck(results, "freshness_and_privacy",
    "expiry_or_review_date_present",
    manifest, ["freshness", "expiry_or_review_date_present"],
    "freshness: expiry / review dates are present");
  boolCheck(results, "freshness_and_privacy", "stale_packs_flagged",
    manifest, ["freshness", "stale_packs_flagged"],
    "freshness: stale packs are flagged");
  boolCheck(results, "freshness_and_privacy",
    "single_upstream_source_export_derived_not_primary",
    manifest, ["freshness", "single_upstream_source_derived_not_primary"],
    "freshness: a single upstream source — the export is derived, never the primary");
  boolCheck(results, "freshness_and_privacy", "stored_privately",
    manifest, ["privacy", "stored_privately"],
    "privacy / quality gate: private repos — the pack is stored privately");
  boolCheck(results, "freshness_and_privacy", "access_limited",
    manifest, ["privacy", "access_limited"],
    "privacy: access to the pack is limited");
  boolCheck(results, "freshness_and_privacy",
    "contact_handling_rules_complied",
    manifest, ["privacy", "contact_handling_rules_complied"],
    "privacy: the pack complies with contact-handling rules");
  const [tpIncluded, hasTp] = getPath(
    manifest, "privacy", "third_party_personal_data_included");
  const [lawful, hasLawful] = getPath(
    manifest, "privacy", "lawful_basis_established");
  if (hasTp && pyTruthy(tpIncluded)) {
    check(results, "freshness_and_privacy",
      "third_party_personal_data_lawful_basis_when_included",
      lawful, hasLawful, lawful === true,
      "privacy: no third-party personal data without a lawful basis");
  } else {
    check(results, "freshness_and_privacy",
      "third_party_personal_data_lawful_basis_when_included",
      tpIncluded, hasTp, true,
      "no third-party personal data declared included");
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
    verdict = "PACK_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "PACK_SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "agent-context-packaging",
    atom_version: "0.1.0",
    pack: manifest["pack"] ?? null,
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
    "AGENT CONTEXT PACKAGING VERDICT",
    `pack: ${pyStr(verdict.pack ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
