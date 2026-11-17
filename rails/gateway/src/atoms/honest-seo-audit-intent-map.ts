// Honest SEO audit intent map — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/honest-seo-audit-intent-map/src/honest_seo_audit_intent_map.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  site: "string",
  technical: {
    crawlable_robots_and_sitemap: "boolean",
    core_web_vitals_targets_addressed: "boolean",
    mobile_first: "boolean",
    https_enabled: "boolean",
    canonical_tags_correct: "boolean",
    accidental_noindex_or_blocked_paths_present: "boolean",
    clean_url_structure: "boolean",
    not_found_404s_handled: "boolean",
  },
  intent: {
    audience_questions_mapped: "boolean",
    intent_type_assigned_per_question: "boolean",
    prioritization_by_relevance_and_feasibility: "boolean",
  },
  on_page: {
    titles_and_descriptions_specific_and_honest: "boolean",
    heading_hierarchy_present: "boolean",
    internal_links_with_descriptive_anchors: "boolean",
    clickbait_mismatch_present: "boolean",
    word_count_padding_present: "boolean",
  },
  pages: [{
    name: "string",
    intent: "string",
    intent_type: "string",
    has_single_intent: "boolean",
    fully_answers_question: "boolean",
  }],
  structured_data: {
    schema_org_applied_as_applicable: "boolean",
    rich_results_validated: "boolean",
  },
  entity: {
    brand_name_contact_consistent: "boolean",
    real_author_identity_for_professional_content: "boolean",
    credentials_carried_where_appropriate: "boolean",
    public_content_sanitization_applied: "boolean",
  },
  authority: {
    useful_assets_created_to_attract_links: "boolean",
    relevant_human_outreach_only: "boolean",
  },
  measurement: {
    search_console_and_analytics_wired: "boolean",
    search_console_baseline_captured: "boolean",
    impressions_clicks_conversions_tracked: "boolean",
    queries_gained_lost_tracked: "boolean",
    monthly_iteration_cadence: "boolean",
    decaying_pages_refreshed_on_schedule: "boolean",
  },
  ai_era: {
    structure_and_canonical_answers_designed_for_extraction: "boolean",
  },
  red_lines: {
    cloaking_present: "boolean",
    pbn_present: "boolean",
    bought_links_present: "boolean",
    link_schemes_present: "boolean",
    keyword_spam_present: "boolean",
    misleading_metadata_present: "boolean",
    fake_urgency_present: "boolean",
  },
};

export const SECTIONS = [
  "technical_foundation",
  "intent_map_and_on_page_craft",
  "structured_data_and_entity_clarity",
  "earned_authority_and_measurement",
  "white_hat_red_lines",
] as const;

const INTENT_TYPES = ["informational", "commercial", "transactional"];

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
  site: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  pages_count: number | null;
  pages_without_single_intent: string[] | null;
  single_intent_coverage: string | null;
  pages_with_invalid_intent_type: string[] | null;
  valid_intent_type_coverage: string | null;
  duplicate_intents: string[] | null;
  pages_not_fully_answering: string[] | null;
  full_answer_coverage: string | null;
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

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
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

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [pagesRaw, hasPages] = getPath(manifest, "pages");
  const pagesIsList = hasPages && Array.isArray(pagesRaw);
  const rows: unknown[] = pagesIsList ? (pagesRaw as unknown[]) : [];
  const pagesCount: number | null = pagesIsList ? rows.length : null;

  const pagesWithoutSingleIntent: string[] | null = pagesIsList
    ? rows.filter((c) => hasField(c, "has_single_intent") &&
        (c as Record<string, unknown>)["has_single_intent"] !== true)
        .map(rowName)
    : null;
  const pagesWithInvalidIntentType: string[] | null = pagesIsList
    ? rows.filter((c) => hasField(c, "intent_type") &&
        !INTENT_TYPES.includes(
          (c as Record<string, unknown>)["intent_type"] as string))
        .map(rowName)
    : null;
  const pagesNotFullyAnswering: string[] | null = pagesIsList
    ? rows.filter((c) => hasField(c, "fully_answers_question") &&
        (c as Record<string, unknown>)["fully_answers_question"] !== true)
        .map(rowName)
    : null;
  let duplicateIntents: string[] | null = null;
  if (pagesIsList) {
    const seen: string[] = [];
    duplicateIntents = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["intent"] === "string") {
        const intent = c["intent"] as string;
        if (seen.includes(intent) && !duplicateIntents.includes(intent)) {
          duplicateIntents.push(intent);
        }
        seen.push(intent);
      }
    }
  }
  const singleIntentCoverage: number | null =
    pagesIsList && pagesCount !== null && pagesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["has_single_intent"] === true).length / pagesCount
      : null;
  const validIntentTypeCoverage: number | null =
    pagesIsList && pagesCount !== null && pagesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          INTENT_TYPES.includes(c["intent_type"] as string)).length / pagesCount
      : null;
  const fullAnswerCoverage: number | null =
    pagesIsList && pagesCount !== null && pagesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["fully_answers_question"] === true).length / pagesCount
      : null;

  // ---- Section 1: technical_foundation ----
  boolCheck(results, "technical_foundation",
    "crawlable_robots_and_sitemap", manifest,
    ["technical", "crawlable_robots_and_sitemap"],
    "technical foundation: crawlable — robots.txt and sitemap are in place");
  boolCheck(results, "technical_foundation",
    "core_web_vitals_targets_addressed", manifest,
    ["technical", "core_web_vitals_targets_addressed"],
    "technical foundation: fast — Core Web Vitals targets are addressed");
  boolCheck(results, "technical_foundation",
    "mobile_first", manifest,
    ["technical", "mobile_first"],
    "technical foundation: mobile-first");
  boolCheck(results, "technical_foundation",
    "https_enabled", manifest,
    ["technical", "https_enabled"],
    "technical foundation: HTTPS is enabled");
  boolCheck(results, "technical_foundation",
    "canonical_tags_correct", manifest,
    ["technical", "canonical_tags_correct"],
    "technical foundation: canonical tags are correct");
  falseCheck(results, "technical_foundation",
    "no_accidental_noindex_or_blocked_paths", manifest,
    ["technical", "accidental_noindex_or_blocked_paths_present"],
    "technical foundation: no accidental noindex or blocked paths are present");
  boolCheck(results, "technical_foundation",
    "clean_url_structure", manifest,
    ["technical", "clean_url_structure"],
    "technical foundation: URL structure is clean");
  boolCheck(results, "technical_foundation",
    "not_found_404s_handled", manifest,
    ["technical", "not_found_404s_handled"],
    "technical foundation: 404s are handled");

  // ---- Section 2: intent_map_and_on_page_craft ----
  boolCheck(results, "intent_map_and_on_page_craft",
    "audience_questions_mapped", manifest,
    ["intent", "audience_questions_mapped"],
    "intent map: audience questions are mapped");
  boolCheck(results, "intent_map_and_on_page_craft",
    "intent_type_assigned_per_question", manifest,
    ["intent", "intent_type_assigned_per_question"],
    "intent map: an intent type — informational / commercial / transactional — is assigned per question");
  boolCheck(results, "intent_map_and_on_page_craft",
    "prioritization_by_relevance_and_feasibility", manifest,
    ["intent", "prioritization_by_relevance_and_feasibility"],
    "intent map: prioritization is by relevance x feasibility over big-volume vanity terms");
  boolCheck(results, "intent_map_and_on_page_craft",
    "titles_and_descriptions_specific_and_honest", manifest,
    ["on_page", "titles_and_descriptions_specific_and_honest"],
    "on-page craft: titles and descriptions are specific and honest");
  boolCheck(results, "intent_map_and_on_page_craft",
    "heading_hierarchy_present", manifest,
    ["on_page", "heading_hierarchy_present"],
    "on-page craft: a heading hierarchy is present");
  boolCheck(results, "intent_map_and_on_page_craft",
    "internal_links_with_descriptive_anchors", manifest,
    ["on_page", "internal_links_with_descriptive_anchors"],
    "on-page craft: internal links use descriptive anchors");
  falseCheck(results, "intent_map_and_on_page_craft",
    "no_clickbait_mismatch", manifest,
    ["on_page", "clickbait_mismatch_present"],
    "on-page craft: no clickbait mismatch is present");
  falseCheck(results, "intent_map_and_on_page_craft",
    "no_word_count_padding", manifest,
    ["on_page", "word_count_padding_present"],
    "on-page craft: no word-count padding is present — depth where it matters");
  check(results, "intent_map_and_on_page_craft",
    "pages_declared", pagesRaw, pagesIsList,
    pagesIsList && (pagesCount as number) > 0,
    "the declared record names its pages — the pages list is present and non-empty");
  const singlePresent = pagesIsList &&
    rows.every((c) => hasField(c, "has_single_intent"));
  check(results, "intent_map_and_on_page_craft",
    "every_page_has_single_intent", pagesRaw, singlePresent,
    pagesIsList && (pagesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["has_single_intent"] === true),
    "intent map: every declared page row owns a single intent");
  const typePresent = pagesIsList &&
    rows.every((c) => hasField(c, "intent_type"));
  check(results, "intent_map_and_on_page_craft",
    "every_page_intent_type_valid", pagesRaw, typePresent,
    pagesIsList && (pagesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        INTENT_TYPES.includes(c["intent_type"] as string)),
    "intent map: every declared page row declares an intent type from the skill's set — informational / commercial / transactional");
  const intentPresent = pagesIsList &&
    rows.every((c) => hasField(c, "intent"));
  check(results, "intent_map_and_on_page_craft",
    "no_intent_owned_by_multiple_pages", pagesRaw, intentPresent,
    pagesIsList && duplicateIntents !== null &&
      duplicateIntents.length === 0,
    "intent map: no declared intent is owned by more than one page — each key page owns one intent");
  const answerPresent = pagesIsList &&
    rows.every((c) => hasField(c, "fully_answers_question"));
  check(results, "intent_map_and_on_page_craft",
    "every_page_fully_answers_question", pagesRaw, answerPresent,
    pagesIsList && (pagesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        c["fully_answers_question"] === true),
    "on-page craft: every declared page row fully answers its question");

  // ---- Section 3: structured_data_and_entity_clarity ----
  boolCheck(results, "structured_data_and_entity_clarity",
    "schema_org_applied_as_applicable", manifest,
    ["structured_data", "schema_org_applied_as_applicable"],
    "structured data: schema.org — Article, FAQ, Product, LocalBusiness as applicable — is applied");
  boolCheck(results, "structured_data_and_entity_clarity",
    "rich_results_validated", manifest,
    ["structured_data", "rich_results_validated"],
    "structured data: rich results are validated");
  boolCheck(results, "structured_data_and_entity_clarity",
    "brand_name_contact_consistent", manifest,
    ["entity", "brand_name_contact_consistent"],
    "entity/author clarity: brand, name and contact info are consistent");
  boolCheck(results, "structured_data_and_entity_clarity",
    "real_author_identity_for_professional_content", manifest,
    ["entity", "real_author_identity_for_professional_content"],
    "entity/author clarity: real author identity is carried for professional content — E-E-A-T spirit");
  boolCheck(results, "structured_data_and_entity_clarity",
    "credentials_carried_where_appropriate", manifest,
    ["entity", "credentials_carried_where_appropriate"],
    "entity/author clarity: professional pages carry credentials where appropriate");
  boolCheck(results, "structured_data_and_entity_clarity",
    "public_content_sanitization_applied", manifest,
    ["entity", "public_content_sanitization_applied"],
    "entity/author clarity: public content follows privacy / sanitization discipline");

  // ---- Section 4: earned_authority_and_measurement ----
  boolCheck(results, "earned_authority_and_measurement",
    "useful_assets_created_to_attract_links", manifest,
    ["authority", "useful_assets_created_to_attract_links"],
    "authority the earned way: genuinely useful assets — tools, data, guides — attract links");
  boolCheck(results, "earned_authority_and_measurement",
    "relevant_human_outreach_only", manifest,
    ["authority", "relevant_human_outreach_only"],
    "authority the earned way: outreach is relevant and human");
  boolCheck(results, "earned_authority_and_measurement",
    "search_console_and_analytics_wired", manifest,
    ["measurement", "search_console_and_analytics_wired"],
    "measurement: Search Console and analytics are wired");
  boolCheck(results, "earned_authority_and_measurement",
    "search_console_baseline_captured", manifest,
    ["measurement", "search_console_baseline_captured"],
    "measurement: a Search Console baseline is captured");
  boolCheck(results, "earned_authority_and_measurement",
    "impressions_clicks_conversions_tracked", manifest,
    ["measurement", "impressions_clicks_conversions_tracked"],
    "measurement: impressions to clicks to conversions are tracked");
  boolCheck(results, "earned_authority_and_measurement",
    "queries_gained_lost_tracked", manifest,
    ["measurement", "queries_gained_lost_tracked"],
    "measurement: queries gained and lost are tracked");
  boolCheck(results, "earned_authority_and_measurement",
    "monthly_iteration_cadence", manifest,
    ["measurement", "monthly_iteration_cadence"],
    "measurement: iteration is monthly");
  boolCheck(results, "earned_authority_and_measurement",
    "decaying_pages_refreshed_on_schedule", manifest,
    ["measurement", "decaying_pages_refreshed_on_schedule"],
    "measurement: decaying pages are refreshed on schedule");
  boolCheck(results, "earned_authority_and_measurement",
    "structure_and_canonical_answers_designed_for_extraction", manifest,
    ["ai_era", "structure_and_canonical_answers_designed_for_extraction"],
    "AI-era note: clean structure and canonical answers are designed for extraction — no tricks that decay");

  // ---- Section 5: white_hat_red_lines ----
  falseCheck(results, "white_hat_red_lines",
    "no_cloaking", manifest,
    ["red_lines", "cloaking_present"],
    "red line: no cloaking is present");
  falseCheck(results, "white_hat_red_lines",
    "no_pbn", manifest,
    ["red_lines", "pbn_present"],
    "red line: no PBNs are present");
  falseCheck(results, "white_hat_red_lines",
    "no_bought_links", manifest,
    ["red_lines", "bought_links_present"],
    "red line: no bought links are present — no link buying");
  falseCheck(results, "white_hat_red_lines",
    "no_link_schemes", manifest,
    ["red_lines", "link_schemes_present"],
    "red line: no link schemes are present");
  falseCheck(results, "white_hat_red_lines",
    "no_keyword_spam", manifest,
    ["red_lines", "keyword_spam_present"],
    "red line: no keyword spam is present");
  falseCheck(results, "white_hat_red_lines",
    "no_misleading_metadata", manifest,
    ["red_lines", "misleading_metadata_present"],
    "red line: no misleading metadata is present");
  falseCheck(results, "white_hat_red_lines",
    "no_fake_urgency", manifest,
    ["red_lines", "fake_urgency_present"],
    "red line: no fake urgency is present");

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
    verdict = "HONEST_SEO_MAP_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "HONEST_SEO_MAP_SOUND";
  }

  const computedNames = [
    "pages_declared",
    "every_page_has_single_intent",
    "every_page_intent_type_valid",
    "no_intent_owned_by_multiple_pages",
    "every_page_fully_answers_question",
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
    service: "honest-seo-audit-intent-map",
    atom_version: "0.1.0",
    site: manifest["site"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    pages_count: pagesCount,
    pages_without_single_intent: pagesWithoutSingleIntent,
    single_intent_coverage: fmt6(singleIntentCoverage),
    pages_with_invalid_intent_type: pagesWithInvalidIntentType,
    valid_intent_type_coverage: fmt6(validIntentTypeCoverage),
    duplicate_intents: duplicateIntents,
    pages_not_fully_answering: pagesNotFullyAnswering,
    full_answer_coverage: fmt6(fullAnswerCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "HONEST SEO AUDIT INTENT MAP",
    `site: ${pyStr(verdict.site ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
