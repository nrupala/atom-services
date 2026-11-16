// Decision-ready research brief — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/decision-ready-research-brief/src/decision_ready_research_brief.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 4dp —
// floor(v * 10000 + 0.5) / 10000 — then format with exactly four
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  brief: "string",
  scope: {
    decision_named: "boolean",
    questions_ranked: "boolean",
    timebox_declared: "boolean",
    timebox_respected: "boolean",
    enough_criteria_defined: "boolean",
  },
  questions: [{
    name: "string",
  }],
  source_strategy: {
    primary_preferred_over_secondary_and_tertiary: "boolean",
  },
  sources: [{
    name: "string",
    link: "string",
    date: "string",
    quote: "string",
    source_type: "string",
    incentives_noted: "boolean",
  }],
  evidence: {
    notes_question_oriented: "boolean",
    evidence_table_present: "boolean",
    fact_estimate_opinion_separated: "boolean",
    gaps_recorded: "boolean",
  },
  claims: [{
    name: "string",
    kind: "string",
    material: "boolean",
    important: "boolean",
    supporting_source_names: ["string"],
    confidence_stated: "boolean",
  }],
  synthesis: {
    structured_by_question: "boolean",
    opposing_view_steelmanned: "boolean",
    quantified_where_possible: "boolean",
    confidence_stated: "boolean",
    unknowns_stated_explicitly: "boolean",
  },
  report: {
    version: "string",
    date: "string",
    open_questions_listed: "boolean",
  },
  report_sections: ["string"],
  reuse: {
    notes_archived_for_reuse: "boolean",
    updates_via_changelog: "boolean",
    silent_edits_present: "boolean",
  },
  tooling: {
    automation_does_not_replace_verification: "boolean",
    ai_summaries_used: "boolean",
    ai_summaries_cite_sources: "boolean",
    ai_summaries_spot_checked: "boolean",
    seo_spam_and_content_farms_screened: "boolean",
    scraped_or_automated_data_used: "boolean",
    scraped_or_automated_data_quality_checked: "boolean",
  },
  disclosure: {
    conflicts_present: "boolean",
    conflicts_disclosed: "boolean",
    unsourced_claims_present: "boolean",
    single_source_conclusions_on_important_facts_present: "boolean",
  },
};

export const SECTIONS = [
  "scoping_and_sources",
  "evidence_and_notes",
  "synthesis_and_report_structure",
  "reuse_verification_and_red_lines",
] as const;

export const REPORT_SECTION_ORDER = [
  "bluf",
  "findings",
  "evidence",
  "risks",
  "open_questions",
  "sources",
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
  brief: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  questions_count: number | null;
  sources_count: number | null;
  sources_without_complete_provenance: string[] | null;
  source_provenance_coverage: string | null;
  claims_count: number | null;
  material_claims_without_sources: string[] | null;
  material_claim_source_coverage: string | null;
  important_claims_not_triangulated: string[] | null;
  important_claim_triangulation_coverage: string | null;
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

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function nonemptyStr(entry: unknown, field: string): boolean {
  return isPyDict(entry) && typeof entry[field] === "string" &&
    (entry[field] as string).length > 0;
}

function hasCompleteProvenance(entry: unknown): boolean {
  return nonemptyStr(entry, "link") && nonemptyStr(entry, "date") &&
    nonemptyStr(entry, "quote");
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [questionsRaw, hasQuestions] = getPath(manifest, "questions");
  const questionsIsList = hasQuestions && Array.isArray(questionsRaw);
  const questions: unknown[] = questionsIsList ? (questionsRaw as unknown[]) : [];
  const [sourcesRaw, hasSources] = getPath(manifest, "sources");
  const sourcesIsList = hasSources && Array.isArray(sourcesRaw);
  const sources: unknown[] = sourcesIsList ? (sourcesRaw as unknown[]) : [];
  const [claimsRaw, hasClaims] = getPath(manifest, "claims");
  const claimsIsList = hasClaims && Array.isArray(claimsRaw);
  const claims: unknown[] = claimsIsList ? (claimsRaw as unknown[]) : [];
  const [reportSectionsRaw, hasReportSections] = getPath(manifest, "report_sections");
  const reportSectionsIsList = hasReportSections && Array.isArray(reportSectionsRaw);
  const reportSections: unknown[] = reportSectionsIsList ? (reportSectionsRaw as unknown[]) : [];

  const questionsCount: number | null = questionsIsList ? questions.length : null;
  const sourcesCount: number | null = sourcesIsList ? sources.length : null;
  const claimsCount: number | null = claimsIsList ? claims.length : null;

  const declaredSourceNames = new Set<string>(
    sourcesIsList
      ? sources.filter((s) => isPyDict(s) && typeof s["name"] === "string")
          .map((s) => (s as Record<string, unknown>)["name"] as string)
      : [],
  );

  function matchingCount(claim: unknown): number {
    if (!isPyDict(claim)) return 0;
    const supporting = claim["supporting_source_names"];
    if (!Array.isArray(supporting)) return 0;
    const matched = new Set<string>();
    for (const n of supporting) {
      if (typeof n === "string" && declaredSourceNames.has(n)) {
        matched.add(n);
      }
    }
    return matched.size;
  }

  const sourcesWithoutProvenance: string[] | null = sourcesIsList
    ? sources.filter((s) => !hasCompleteProvenance(s)).map(rowName)
    : null;
  const provenanceCoverage: number | null =
    sourcesIsList && sourcesCount !== null && sourcesCount > 0 &&
      sourcesWithoutProvenance !== null
      ? (sourcesCount - sourcesWithoutProvenance.length) / sourcesCount
      : null;

  const materialClaims: unknown[] = claimsIsList
    ? claims.filter((c) => isPyDict(c) && c["material"] === true)
    : [];
  const materialWithoutSources: string[] | null =
    claimsIsList && sourcesIsList
      ? materialClaims.filter((c) => isPyDict(c) &&
          Array.isArray(c["supporting_source_names"]) &&
          matchingCount(c) === 0).map(rowName)
      : null;
  const materialCovered: number | null =
    claimsIsList && sourcesIsList
      ? materialClaims.filter((c) => matchingCount(c) >= 1).length
      : null;
  const materialCoverage: number | null =
    materialCovered !== null && materialClaims.length > 0
      ? materialCovered / materialClaims.length
      : null;

  const importantClaims: unknown[] = claimsIsList
    ? claims.filter((c) => isPyDict(c) && c["important"] === true)
    : [];
  const importantNotTriangulated: string[] | null =
    claimsIsList && sourcesIsList
      ? importantClaims.filter((c) => isPyDict(c) &&
          Array.isArray(c["supporting_source_names"]) &&
          matchingCount(c) < 2).map(rowName)
      : null;
  const importantTriangulated: number | null =
    claimsIsList && sourcesIsList
      ? importantClaims.filter((c) => matchingCount(c) >= 2).length
      : null;
  const triangulationCoverage: number | null =
    importantTriangulated !== null && importantClaims.length > 0
      ? importantTriangulated / importantClaims.length
      : null;

  // ---- Section 1: scoping_and_sources ----
  boolCheck(results, "scoping_and_sources", "decision_named", manifest,
    ["scope", "decision_named"],
    "scope first: the decision this research serves is named — no decision, the research is questioned");
  boolCheck(results, "scoping_and_sources", "questions_ranked", manifest,
    ["scope", "questions_ranked"],
    "scope first: the questions are ranked");
  check(results, "scoping_and_sources", "questions_declared",
    questionsRaw, questionsIsList,
    questionsIsList && (questionsCount as number) > 0,
    "scope first: the declared brief record names its questions — the questions list is present and non-empty");
  boolCheck(results, "scoping_and_sources", "timebox_declared", manifest,
    ["scope", "timebox_declared"],
    "scope first: a timebox is declared");
  boolCheck(results, "scoping_and_sources", "timebox_respected", manifest,
    ["scope", "timebox_respected"],
    "quality gate: the timebox is respected");
  boolCheck(results, "scoping_and_sources", "enough_criteria_defined",
    manifest, ["scope", "enough_criteria_defined"],
    "scope first: what \"enough\" looks like is defined");
  boolCheck(results, "scoping_and_sources", "primary_sources_preferred",
    manifest,
    ["source_strategy", "primary_preferred_over_secondary_and_tertiary"],
    "source strategy: primary sources (filings, docs, data) are preferred over secondary, and secondary over tertiary");
  check(results, "scoping_and_sources", "sources_declared",
    sourcesRaw, sourcesIsList,
    sourcesIsList && (sourcesCount as number) > 0,
    "source strategy: the declared brief record names its sources — the sources list is present and non-empty");
  const sourceStringFields: Array<[string, string, string]> = [
    ["link", "every_source_has_link", "every declared source row names a non-empty link"],
    ["date", "every_source_has_date", "every declared source row names a non-empty date"],
    ["quote", "every_source_has_quote", "every declared source row names a non-empty quote"],
    ["source_type", "every_source_declares_source_type", "every declared source row declares its source type"],
  ];
  for (const [field, checkName, label] of sourceStringFields) {
    const fieldPresent = sourcesIsList &&
      sources.every((s) => hasField(s, field));
    check(results, "scoping_and_sources", checkName, sourcesRaw,
      fieldPresent,
      sourcesIsList && (sourcesCount as number) > 0 &&
        sources.every((s) => nonemptyStr(s, field)),
      `source strategy / provenance: ${label} — provenance is tracked as link + date + quote`);
  }
  const incentivesPresent = sourcesIsList &&
    sources.every((s) => hasField(s, "incentives_noted"));
  check(results, "scoping_and_sources", "every_source_incentives_noted",
    sourcesRaw, incentivesPresent,
    sourcesIsList && (sourcesCount as number) > 0 &&
      sources.every((s) => isPyDict(s) && s["incentives_noted"] === true),
    "source strategy: every declared source row declares its incentives noted");

  // ---- Section 2: evidence_and_notes ----
  check(results, "evidence_and_notes", "claims_declared",
    claimsRaw, claimsIsList,
    claimsIsList && (claimsCount as number) > 0,
    "notes discipline: the declared brief record names its claims — the claims list is present and non-empty");
  boolCheck(results, "evidence_and_notes", "notes_question_oriented",
    manifest, ["evidence", "notes_question_oriented"],
    "notes discipline: notes are question-oriented, not dumps");
  boolCheck(results, "evidence_and_notes", "evidence_table_present",
    manifest, ["evidence", "evidence_table_present"],
    "notes discipline: an evidence table is present — claim to sources to confidence to gaps");
  boolCheck(results, "evidence_and_notes",
    "fact_estimate_opinion_separated", manifest,
    ["evidence", "fact_estimate_opinion_separated"],
    "notes discipline: fact, estimate and opinion are separated");
  boolCheck(results, "evidence_and_notes", "gaps_recorded", manifest,
    ["evidence", "gaps_recorded"],
    "notes discipline: gaps are recorded in the evidence table");
  const materialPresent = claimsIsList && sourcesIsList &&
    claims.every((c) => hasField(c, "material")) &&
    materialClaims.every((c) => hasField(c, "supporting_source_names"));
  check(results, "evidence_and_notes",
    "every_material_claim_sourced_from_declared_sources", claimsRaw,
    materialPresent,
    claimsIsList && sourcesIsList && (claimsCount as number) > 0 &&
      materialWithoutSources !== null &&
      materialWithoutSources.length === 0 &&
      materialCovered === materialClaims.length,
    "quality gate / red line: every material claim is sourced — it names at least one supporting source that is actually declared; no unsourced claims");
  const importantPresent = claimsIsList && sourcesIsList &&
    claims.every((c) => hasField(c, "important")) &&
    importantClaims.every((c) => hasField(c, "supporting_source_names"));
  check(results, "evidence_and_notes",
    "every_important_claim_triangulated_across_declared_sources",
    claimsRaw, importantPresent,
    claimsIsList && sourcesIsList && (claimsCount as number) > 0 &&
      importantNotTriangulated !== null &&
      importantNotTriangulated.length === 0 &&
      importantTriangulated === importantClaims.length,
    "source strategy / red line: every important claim is triangulated — it names at least two distinct supporting sources that are actually declared; no single-source conclusions on important facts");
  const confidencePresent = claimsIsList &&
    claims.every((c) => hasField(c, "confidence_stated"));
  check(results, "evidence_and_notes", "every_claim_confidence_stated",
    claimsRaw, confidencePresent,
    claimsIsList && (claimsCount as number) > 0 &&
      claims.every((c) => isPyDict(c) && c["confidence_stated"] === true),
    "quality gate: every declared claim row declares its confidence stated");
  const kindPresent = claimsIsList &&
    claims.every((c) => hasField(c, "kind"));
  check(results, "evidence_and_notes", "every_claim_kind_declared",
    claimsRaw, kindPresent,
    claimsIsList && (claimsCount as number) > 0 &&
      claims.every((c) => nonemptyStr(c, "kind")),
    "notes discipline: every declared claim row declares a non-empty kind — the fact / estimate / opinion separation starts from each claim being labelled");

  // ---- Section 3: synthesis_and_report_structure ----
  boolCheck(results, "synthesis_and_report_structure",
    "synthesis_structured_by_question", manifest,
    ["synthesis", "structured_by_question"],
    "synthesis: the brief is structured by question");
  boolCheck(results, "synthesis_and_report_structure",
    "opposing_view_steelmanned", manifest,
    ["synthesis", "opposing_view_steelmanned"],
    "synthesis / quality gate: opposing views are presented as a steelman");
  boolCheck(results, "synthesis_and_report_structure",
    "quantified_where_possible", manifest,
    ["synthesis", "quantified_where_possible"],
    "synthesis: findings are quantified where possible");
  boolCheck(results, "synthesis_and_report_structure",
    "synthesis_confidence_stated", manifest,
    ["synthesis", "confidence_stated"],
    "synthesis: confidence is stated explicitly");
  boolCheck(results, "synthesis_and_report_structure",
    "unknowns_stated_explicitly", manifest,
    ["synthesis", "unknowns_stated_explicitly"],
    "synthesis: unknowns are stated explicitly");
  check(results, "synthesis_and_report_structure",
    "report_sections_in_skill_order", reportSectionsRaw,
    reportSectionsIsList,
    reportSectionsIsList &&
      JSON.stringify(reportSections) === JSON.stringify([...REPORT_SECTION_ORDER]),
    "report format: the declared report sections are exactly the skill's format in order — bluf, findings, evidence, risks, open_questions, sources");
  const [version, hasVersion] = getPath(manifest, "report", "version");
  check(results, "synthesis_and_report_structure",
    "report_version_declared", version, hasVersion,
    typeof version === "string" && version.length > 0,
    "report format: the report declares a non-empty version — version and date go on every report");
  const [date, hasDate] = getPath(manifest, "report", "date");
  check(results, "synthesis_and_report_structure", "report_date_declared",
    date, hasDate,
    typeof date === "string" && date.length > 0,
    "report format: the report declares a non-empty date — version and date go on every report");
  boolCheck(results, "synthesis_and_report_structure",
    "open_questions_listed", manifest,
    ["report", "open_questions_listed"],
    "quality gate: open questions are listed");

  // ---- Section 4: reuse_verification_and_red_lines ----
  boolCheck(results, "reuse_verification_and_red_lines",
    "notes_archived_for_reuse", manifest,
    ["reuse", "notes_archived_for_reuse"],
    "reuse: notes are stored and archived for future questions");
  boolCheck(results, "reuse_verification_and_red_lines",
    "updates_via_changelog", manifest,
    ["reuse", "updates_via_changelog"],
    "reuse: reports are updated when facts change via a changelog");
  falseCheck(results, "reuse_verification_and_red_lines",
    "no_silent_edits", manifest, ["reuse", "silent_edits_present"],
    "reuse / anti-pattern: no silent edits — updates are a changelog, not silent edits");
  boolCheck(results, "reuse_verification_and_red_lines",
    "automation_does_not_replace_verification", manifest,
    ["tooling", "automation_does_not_replace_verification"],
    "tooling discipline: automation speeds collection but never replaces verification");
  gatedBoolCheck(results, "reuse_verification_and_red_lines",
    "ai_summaries_cite_sources_when_used", manifest,
    ["tooling", "ai_summaries_used"],
    ["tooling", "ai_summaries_cite_sources"],
    "tooling discipline: AI summaries cite sources",
    "no AI summaries declared in use");
  gatedBoolCheck(results, "reuse_verification_and_red_lines",
    "ai_summaries_spot_checked_when_used", manifest,
    ["tooling", "ai_summaries_used"],
    ["tooling", "ai_summaries_spot_checked"],
    "tooling discipline: AI summaries are spot-checked",
    "no AI summaries declared in use");
  boolCheck(results, "reuse_verification_and_red_lines",
    "seo_spam_and_content_farms_screened", manifest,
    ["tooling", "seo_spam_and_content_farms_screened"],
    "tooling discipline: results are watched for SEO spam and content farms");
  gatedBoolCheck(results, "reuse_verification_and_red_lines",
    "scraped_or_automated_data_quality_checked_when_used", manifest,
    ["tooling", "scraped_or_automated_data_used"],
    ["tooling", "scraped_or_automated_data_quality_checked"],
    "tooling discipline / red line: scraped and automated data is quality-checked before use",
    "no scraped or automated data declared in use");
  gatedBoolCheck(results, "reuse_verification_and_red_lines",
    "conflicts_disclosed_when_present", manifest,
    ["disclosure", "conflicts_present"],
    ["disclosure", "conflicts_disclosed"],
    "red line: conflicts are disclosed",
    "no conflicts declared present");
  falseCheck(results, "reuse_verification_and_red_lines",
    "no_unsourced_claims", manifest,
    ["disclosure", "unsourced_claims_present"],
    "red line: no unsourced claims");
  falseCheck(results, "reuse_verification_and_red_lines",
    "no_single_source_conclusions_on_important_facts", manifest,
    ["disclosure", "single_source_conclusions_on_important_facts_present"],
    "red line: no single-source conclusions on important facts");

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
    verdict = "RESEARCH_BRIEF_NOT_DECISION_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "RESEARCH_BRIEF_DECISION_READY";
  }

  const computedNames = [
    "questions_declared",
    "sources_declared",
    "claims_declared",
    "every_material_claim_sourced_from_declared_sources",
    "every_important_claim_triangulated_across_declared_sources",
    "report_sections_in_skill_order",
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "decision-ready-research-brief",
    atom_version: "0.1.0",
    brief: manifest["brief"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    questions_count: questionsCount,
    sources_count: sourcesCount,
    sources_without_complete_provenance: sourcesWithoutProvenance,
    source_provenance_coverage: fmt4(provenanceCoverage),
    claims_count: claimsCount,
    material_claims_without_sources: materialWithoutSources,
    material_claim_source_coverage: fmt4(materialCoverage),
    important_claims_not_triangulated: importantNotTriangulated,
    important_claim_triangulation_coverage: fmt4(triangulationCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across four sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DECISION-READY RESEARCH BRIEF",
    `brief: ${pyStr(verdict.brief ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
