// Sourced visual reference search — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/sourced-visual-reference-search/src/sourced_visual_reference_search.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  search_title: "string",
  brief: {
    target_restated_in_searchable_terms: "boolean",
    subject_stated: "boolean",
    setting_stated: "boolean",
    angle_or_style_stated: "boolean",
    must_have_and_must_avoid_details_stated: "boolean",
  },
  search: {
    terms_adjusted_when_first_pass_off_topic: "boolean",
  },
  results: [{
    result_id: "string",
    direct_image_url: "string",
    source_page_url: "string",
    source_page_verified: "boolean",
    matches_brief_by_viewing: "boolean",
    shows_subject_clearly: "boolean",
    usable_resolution_declared: "boolean",
    misleading_cropping_present: "boolean",
    watermark_present: "boolean",
    caption_product_mismatch_present: "boolean",
    depiction_noted: "boolean",
    publisher_noted: "boolean",
    caption_date_or_credit_noted: "boolean",
    licence_status: "string",
    licence_note_present: "boolean",
    credit_noted: "boolean",
    claimed_cleared_for_commercial_use: "boolean",
  }],
  quality: {
    relevance_checked_by_viewing_not_title_alone: "boolean",
    weak_duplicate_or_misleading_filtered_out: "boolean",
  },
  selection: {
    involves_choice: "boolean",
    strongest_match_called_out_first: "boolean",
    similar_candidates_grouped: "boolean",
    evidence_use_paired_with_facts_where_used_as_evidence: "boolean",
  },
  licensing: {
    licensing_caution_stated_plainly: "boolean",
  },
  red_lines: {
    person_identified_in_found_photo_present: "boolean",
    found_image_presented_as_own_or_generated_present: "boolean",
    found_image_presented_as_licensed_without_explicit_grant_present: "boolean",
    unsourced_image_returned_present: "boolean",
    altered_image_passed_as_original_present: "boolean",
  },
};

export const SECTIONS = [
  "search_brief_and_query",
  "source_provenance",
  "relevance_and_quality",
  "context_and_selection",
  "licensing_and_attribution",
  "red_lines",
] as const;

const LICENCE_STATUSES = [
  "explicitly_licensed",
  "reference_only_no_licence_stated",
  "licence_unknown",
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
  search_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  visual_reference_results_count: number | null;
  duplicate_visual_reference_result_ids: string[] | null;
  duplicate_visual_reference_direct_image_urls: string[] | null;
  visual_reference_results_missing_source_pair: string[] | null;
  visual_reference_results_with_incomplete_licence_attribution: string[] | null;
  sourced_pair_coverage_ratio: string | null;
  licence_attribution_coverage_ratio: string | null;
  visual_reference_match_ratio: string | null;
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

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["result_id"] === "string") {
    return entry["result_id"] as string;
  }
  return "unnamed";
}

function allHave(rows: unknown[], ...fields: string[]): boolean {
  return rows.every((c) => fields.every((f) => hasField(c, f)));
}

function hasSourcePair(entry: unknown): boolean {
  return isPyDict(entry) && nonemptyStr(entry["direct_image_url"]) &&
    nonemptyStr(entry["source_page_url"]);
}

function licenceAttributionComplete(entry: unknown): boolean {
  return isPyDict(entry) &&
    entry["licence_note_present"] === true &&
    LICENCE_STATUSES.includes(entry["licence_status"] as string) &&
    entry["credit_noted"] === true;
}

function fieldIs(entry: unknown, field: string, expected: unknown): boolean {
  return isPyDict(entry) && entry[field] === expected;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [rowsRaw, hasRows] = getPath(manifest, "results");
  const rowsIsList = hasRows && Array.isArray(rowsRaw);
  const rows: unknown[] = rowsIsList ? (rowsRaw as unknown[]) : [];
  const rowsCount: number | null = rowsIsList ? rows.length : null;

  let duplicateResultIds: string[] | null = null;
  let duplicateDirectImageUrls: string[] | null = null;
  if (rowsIsList) {
    const seenIds: string[] = [];
    duplicateResultIds = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["result_id"] === "string") {
        const nm = c["result_id"] as string;
        if (seenIds.includes(nm) && !duplicateResultIds.includes(nm)) {
          duplicateResultIds.push(nm);
        }
        seenIds.push(nm);
      }
    }
    const seenUrls: string[] = [];
    duplicateDirectImageUrls = [];
    for (const c of rows) {
      if (isPyDict(c) && nonemptyStr(c["direct_image_url"])) {
        const url = c["direct_image_url"] as string;
        if (seenUrls.includes(url) && !duplicateDirectImageUrls.includes(url)) {
          duplicateDirectImageUrls.push(url);
        }
        seenUrls.push(url);
      }
    }
  }
  const resultsMissingSourcePair: string[] | null = rowsIsList
    ? rows.filter((c) => !hasSourcePair(c)).map(rowName)
    : null;
  const resultsWithIncompleteLicenceAttribution: string[] | null = rowsIsList
    ? rows.filter((c) => !licenceAttributionComplete(c)).map(rowName)
    : null;
  const sourcedPairCoverageRatio: number | null =
    rowsIsList && rowsCount !== null && rowsCount > 0
      ? rows.filter((c) => hasSourcePair(c)).length / rowsCount
      : null;
  const licenceAttributionCoverageRatio: number | null =
    rowsIsList && rowsCount !== null && rowsCount > 0
      ? rows.filter((c) => licenceAttributionComplete(c)).length / rowsCount
      : null;
  const visualReferenceMatchRatio: number | null =
    rowsIsList && rowsCount !== null && rowsCount > 0
      ? rows.filter((c) => fieldIs(c, "matches_brief_by_viewing", true)).length / rowsCount
      : null;

  // ---- Section 1: search_brief_and_query ----
  boolCheck(results, "search_brief_and_query",
    "visual_reference_target_restated_in_searchable_terms", manifest,
    ["brief", "target_restated_in_searchable_terms"],
    "brief: the target is restated in searchable terms before searching");
  boolCheck(results, "search_brief_and_query",
    "visual_reference_subject_stated", manifest,
    ["brief", "subject_stated"],
    "brief: the subject the images must show is stated");
  boolCheck(results, "search_brief_and_query",
    "visual_reference_setting_stated", manifest,
    ["brief", "setting_stated"],
    "brief: the setting the subject must appear in is stated");
  boolCheck(results, "search_brief_and_query",
    "visual_reference_angle_or_style_stated", manifest,
    ["brief", "angle_or_style_stated"],
    "brief: the angle or style the images must show is stated");
  boolCheck(results, "search_brief_and_query",
    "visual_reference_must_have_and_must_avoid_details_stated", manifest,
    ["brief", "must_have_and_must_avoid_details_stated"],
    "brief: the must-have and must-avoid details are stated");
  boolCheck(results, "search_brief_and_query",
    "visual_reference_search_terms_adjusted_when_first_pass_off_topic", manifest,
    ["search", "terms_adjusted_when_first_pass_off_topic"],
    "search: the search terms were broadened or narrowed when the first pass returned off-topic, stocky or low-quality results, where that applied");

  // ---- Section 2: source_provenance ----
  check(results, "source_provenance",
    "visual_reference_results_list_declared", rowsRaw, rowsIsList,
    rowsIsList && rowsCount !== null && rowsCount > 0,
    "the declared record names its visual reference results — the results list is present and names at least one result; an absent list is missing evidence and an empty list declares no reference set at all");
  const idPresent = rowsIsList && allHave(rows, "result_id");
  check(results, "source_provenance",
    "every_visual_reference_result_id_unique", rowsRaw, idPresent,
    rowsIsList && duplicateResultIds !== null && duplicateResultIds.length === 0,
    "visual reference results: no declared result_id is owned by more than one row");
  const pairPresent = rowsIsList &&
    allHave(rows, "direct_image_url", "source_page_url");
  check(results, "source_provenance",
    "every_visual_reference_result_has_direct_image_and_source_page_links",
    rowsRaw, pairPresent,
    rowsIsList && rows.every((c) => hasSourcePair(c)),
    "visual reference results: every declared result carries both a non-empty direct image link and a non-empty source page link together");
  const verifiedPresent = rowsIsList && allHave(rows, "source_page_verified");
  check(results, "source_provenance",
    "every_visual_reference_result_source_page_verified", rowsRaw,
    verifiedPresent,
    rowsIsList && rows.every((c) => fieldIs(c, "source_page_verified", true)),
    "visual reference results: every declared result's source page was opened or verified");
  const urlPresent = rowsIsList && allHave(rows, "direct_image_url");
  check(results, "source_provenance",
    "every_visual_reference_direct_image_url_unique", rowsRaw, urlPresent,
    rowsIsList && duplicateDirectImageUrls !== null &&
      duplicateDirectImageUrls.length === 0 &&
      rows.every((c) => isPyDict(c) && nonemptyStr(c["direct_image_url"])),
    "visual reference results: no declared direct image URL is owned by more than one row — duplicate results were filtered out");

  // ---- Section 3: relevance_and_quality ----
  boolCheck(results, "relevance_and_quality",
    "visual_reference_relevance_checked_by_viewing_not_title_alone", manifest,
    ["quality", "relevance_checked_by_viewing_not_title_alone"],
    "quality: relevance was checked by looking at each candidate, not by title alone");
  const matchesPresent = rowsIsList && allHave(rows, "matches_brief_by_viewing");
  check(results, "relevance_and_quality",
    "every_visual_reference_result_matches_brief_by_viewing", rowsRaw,
    matchesPresent,
    rowsIsList && rows.every((c) => fieldIs(c, "matches_brief_by_viewing", true)),
    "visual reference results: every declared result actually matches the description, checked by viewing");
  const clearPresent = rowsIsList && allHave(rows, "shows_subject_clearly");
  check(results, "relevance_and_quality",
    "every_visual_reference_result_shows_subject_clearly", rowsRaw, clearPresent,
    rowsIsList && rows.every((c) => fieldIs(c, "shows_subject_clearly", true)),
    "visual reference results: every declared result shows the subject clearly");
  const resolutionPresent = rowsIsList && allHave(rows, "usable_resolution_declared");
  check(results, "relevance_and_quality",
    "every_visual_reference_result_usable_resolution_declared", rowsRaw,
    resolutionPresent,
    rowsIsList && rows.every((c) => fieldIs(c, "usable_resolution_declared", true)),
    "visual reference results: every declared result is declared to be at a usable resolution");
  const defectsPresent = rowsIsList && allHave(rows,
    "misleading_cropping_present", "watermark_present",
    "caption_product_mismatch_present");
  check(results, "relevance_and_quality",
    "no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch",
    rowsRaw, defectsPresent,
    rowsIsList && rows.every((c) =>
      fieldIs(c, "misleading_cropping_present", false) &&
      fieldIs(c, "watermark_present", false) &&
      fieldIs(c, "caption_product_mismatch_present", false)),
    "visual reference results: no declared result carries misleading cropping, a watermark, or a different product than its caption claims");
  boolCheck(results, "relevance_and_quality",
    "visual_reference_weak_duplicate_or_misleading_results_filtered_out", manifest,
    ["quality", "weak_duplicate_or_misleading_filtered_out"],
    "quality: weak, duplicate or misleading results were filtered out before presenting");

  // ---- Section 4: context_and_selection ----
  const depictionPresent = rowsIsList && allHave(rows, "depiction_noted");
  check(results, "context_and_selection",
    "every_visual_reference_result_depiction_noted", rowsRaw, depictionPresent,
    rowsIsList && rows.every((c) => fieldIs(c, "depiction_noted", true)),
    "visual reference results: every declared result notes what the image depicts, from its source page");
  const publisherPresent = rowsIsList && allHave(rows, "publisher_noted");
  check(results, "context_and_selection",
    "every_visual_reference_result_publisher_noted", rowsRaw, publisherPresent,
    rowsIsList && rows.every((c) => fieldIs(c, "publisher_noted", true)),
    "visual reference results: every declared result notes who published it, from its source page");
  const contextPresent = rowsIsList && allHave(rows, "caption_date_or_credit_noted");
  check(results, "context_and_selection",
    "every_visual_reference_result_caption_date_or_credit_context_noted", rowsRaw,
    contextPresent,
    rowsIsList && rows.every((c) => fieldIs(c, "caption_date_or_credit_noted", true)),
    "visual reference results: every declared result notes any caption, date or credit information present on its source page");
  boolCheck(results, "context_and_selection",
    "visual_reference_strongest_match_called_out_first", manifest,
    ["selection", "strongest_match_called_out_first"],
    "selection: the strongest match is called out first, so choosing takes seconds");
  boolCheck(results, "context_and_selection",
    "visual_reference_similar_candidates_grouped", manifest,
    ["selection", "similar_candidates_grouped"],
    "selection: similar candidates are grouped together");
  const [involvesChoice, hasInvolvesChoice] = getPath(manifest,
    "selection", "involves_choice");
  const distinctUrls: string[] = [];
  if (rowsIsList) {
    for (const c of rows) {
      if (isPyDict(c) && nonemptyStr(c["direct_image_url"])) {
        const url = c["direct_image_url"] as string;
        if (!distinctUrls.includes(url)) distinctUrls.push(url);
      }
    }
  }
  const choicePresent = rowsIsList && hasInvolvesChoice && urlPresent;
  const choiceOk = rowsIsList && hasInvolvesChoice &&
    (involvesChoice === true ? distinctUrls.length >= 3 : distinctUrls.length >= 1);
  check(results, "context_and_selection",
    "visual_reference_choice_set_several_distinct_candidates_when_choice_involved",
    rowsRaw, choicePresent, choiceOk,
    "selection: when the request involves a choice, several distinct candidates are offered — at least three distinct declared direct image URLs, the minimum of the skill's stated three-to-six range; otherwise at least one distinct candidate");
  boolCheck(results, "context_and_selection",
    "visual_reference_evidence_use_paired_with_facts_where_used_as_evidence", manifest,
    ["selection", "evidence_use_paired_with_facts_where_used_as_evidence"],
    "selection: where images are used as evidence, the set is paired with the underlying facts and handed off to deeper verification, never a photo standing alone as proof, where that applied");

  // ---- Section 5: licensing_and_attribution ----
  boolCheck(results, "licensing_and_attribution",
    "visual_reference_licensing_caution_stated_plainly", manifest,
    ["licensing", "licensing_caution_stated_plainly"],
    "licensing: the licensing caution is stated plainly — these are references found on the web, not images cleared for republication or commercial use, unless a licence on the source page explicitly says otherwise");
  const notePresent = rowsIsList && allHave(rows, "licence_note_present");
  check(results, "licensing_and_attribution",
    "every_visual_reference_result_licence_note_present", rowsRaw, notePresent,
    rowsIsList && rows.every((c) => fieldIs(c, "licence_note_present", true)),
    "visual reference results: every declared result carries a licence note");
  const statusPresent = rowsIsList && allHave(rows, "licence_status");
  check(results, "licensing_and_attribution",
    "every_visual_reference_result_licence_status_recognised", rowsRaw,
    statusPresent,
    rowsIsList && rows.every((c) => isPyDict(c) &&
      LICENCE_STATUSES.includes(c["licence_status"] as string)),
    "visual reference results: every declared result's licence status is one of explicitly_licensed, reference_only_no_licence_stated or licence_unknown");
  const creditPresent = rowsIsList && allHave(rows, "credit_noted");
  check(results, "licensing_and_attribution",
    "every_visual_reference_result_credit_noted", rowsRaw, creditPresent,
    rowsIsList && rows.every((c) => fieldIs(c, "credit_noted", true)),
    "visual reference results: every declared result notes any explicit licence or credit from its source");
  const claimedPresent = rowsIsList &&
    allHave(rows, "claimed_cleared_for_commercial_use", "licence_status");
  check(results, "licensing_and_attribution",
    "no_visual_reference_result_claimed_cleared_without_explicit_licence", rowsRaw,
    claimedPresent,
    rowsIsList && rows.every((c) => !(isPyDict(c) &&
      c["claimed_cleared_for_commercial_use"] === true &&
      c["licence_status"] !== "explicitly_licensed")),
    "visual reference results: no declared result is claimed cleared for commercial use unless its declared licence status is explicitly_licensed");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines",
    "visual_reference_free_of_person_identification", manifest,
    ["red_lines", "person_identified_in_found_photo_present"],
    "red line: no person in a found photo is identified — no naming, guessing or biographical claims — in the record");
  falseCheck(results, "red_lines",
    "visual_reference_free_of_found_image_presented_as_own_or_generated", manifest,
    ["red_lines", "found_image_presented_as_own_or_generated_present"],
    "red line: no found image is presented as the caller's own, as the owner's own, or as generated for them in the record");
  falseCheck(results, "red_lines",
    "visual_reference_free_of_found_image_presented_as_licensed_without_grant", manifest,
    ["red_lines", "found_image_presented_as_licensed_without_explicit_grant_present"],
    "red line: no found image is presented as licensed for commercial use or republication without the source page granting that right explicitly in the record");
  falseCheck(results, "red_lines",
    "visual_reference_free_of_unsourced_image_returned", manifest,
    ["red_lines", "unsourced_image_returned_present"],
    "red line: no image without its source page is returned in the record");
  falseCheck(results, "red_lines",
    "visual_reference_free_of_altered_image_passed_as_original", manifest,
    ["red_lines", "altered_image_passed_as_original_present"],
    "red line: no altered found image is passed off as the original evidence in the record");

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
    verdict = "VISUAL_REFERENCE_SET_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "VISUAL_REFERENCE_SET_SOUND";
  }

  const computedNames = [
    "visual_reference_results_list_declared",
    "every_visual_reference_result_id_unique",
    "every_visual_reference_result_has_direct_image_and_source_page_links",
    "every_visual_reference_result_source_page_verified",
    "every_visual_reference_direct_image_url_unique",
    "every_visual_reference_result_matches_brief_by_viewing",
    "every_visual_reference_result_shows_subject_clearly",
    "every_visual_reference_result_usable_resolution_declared",
    "no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch",
    "every_visual_reference_result_depiction_noted",
    "every_visual_reference_result_publisher_noted",
    "every_visual_reference_result_caption_date_or_credit_context_noted",
    "visual_reference_choice_set_several_distinct_candidates_when_choice_involved",
    "every_visual_reference_result_licence_note_present",
    "every_visual_reference_result_licence_status_recognised",
    "every_visual_reference_result_credit_noted",
    "no_visual_reference_result_claimed_cleared_without_explicit_licence",
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
    service: "sourced-visual-reference-search",
    atom_version: "0.1.0",
    search_title: manifest["search_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    visual_reference_results_count: rowsCount,
    duplicate_visual_reference_result_ids: duplicateResultIds,
    duplicate_visual_reference_direct_image_urls: duplicateDirectImageUrls,
    visual_reference_results_missing_source_pair: resultsMissingSourcePair,
    visual_reference_results_with_incomplete_licence_attribution:
      resultsWithIncompleteLicenceAttribution,
    sourced_pair_coverage_ratio: fmt6(sourcedPairCoverageRatio),
    licence_attribution_coverage_ratio: fmt6(licenceAttributionCoverageRatio),
    visual_reference_match_ratio: fmt6(visualReferenceMatchRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "SOURCED VISUAL REFERENCE SEARCH",
    `search_title: ${pyStr(verdict.search_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
