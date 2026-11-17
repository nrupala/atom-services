// Meaning-first translation with tone note — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/meaning-first-translation-with-tone-note/src/meaning_first_translation_with_tone_note.py
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
  document: "string",
  context: {
    source_language_identified: "boolean",
    target_language_identified: "boolean",
    purpose_identified: "boolean",
    whole_text_read_before_translation: "boolean",
    translated_for_meaning_not_word_for_word: "boolean",
    everyday_scope_not_software_localisation: "boolean",
  },
  tone: {
    register_preserved: "boolean",
    tone_and_intent_preserved: "boolean",
    tone_note_provided_for_sends: "boolean",
    tone_variant_offered_only_when_real_choice: "boolean",
    could_offend_or_mislead_phrases_flagged_first: "boolean",
    honorifics_and_family_terms_matched_to_relationship: "boolean",
    voice_preserved: "boolean",
    translation_ready_to_paste_or_speak_for_sends: "boolean",
  },
  handling: {
    idioms_flagged_and_explained: "boolean",
    ambiguities_named_with_both_readings: "boolean",
    flagged_items_given_short_note_not_lecture: "boolean",
    uncertain_or_illegible_passages_marked_as_uncertain: "boolean",
    source_unclear_uncertainty_and_reason_stated: "boolean",
  },
  segments: [{
    name: "string",
    has_translation: "boolean",
    meaning_preserved: "boolean",
    idiom_ambiguity_handling_complete: "boolean",
    exact_carryover_checked: "boolean",
  }],
  carryover: {
    names_numbers_dates_figures_checked_one_by_one: "boolean",
  },
  carryover_items: [{
    name: "string",
    kind: "string",
    matches_original_exactly: "boolean",
  }],
  sensitive: {
    sensitive_category_identified: "boolean",
    translated_faithfully_and_completely_when_sensitive: "boolean",
    nothing_summarised_away_when_sensitive: "boolean",
    certified_translation_flag_raised_when_sensitive: "boolean",
  },
  red_lines: {
    draft_upgraded_to_official_present: "boolean",
    idiom_flattened_or_firm_message_softened_silently_present: "boolean",
    illegible_text_guessed_present: "boolean",
    name_number_date_or_figure_changed_present: "boolean",
    meaning_added_beyond_original_present: "boolean",
  },
};

export const SECTIONS = [
  "context_and_meaning_first_method",
  "register_tone_and_send_readiness",
  "idiom_ambiguity_and_uncertainty",
  "exact_carryover_and_segment_coverage",
  "sensitive_documents_and_red_lines",
] as const;

const CARRYOVER_KINDS = ["name", "number", "date", "place", "figure"];

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
  document: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  segments_count: number | null;
  segments_without_translation: string[] | null;
  translation_coverage: string | null;
  segments_without_meaning_preserved: string[] | null;
  meaning_preserved_coverage: string | null;
  segments_without_idiom_ambiguity_handling: string[] | null;
  idiom_ambiguity_handling_coverage: string | null;
  segments_without_exact_carryover_check: string[] | null;
  exact_carryover_check_coverage: string | null;
  carryover_items_count: number | null;
  carryover_items_not_matching: string[] | null;
  exact_match_coverage: string | null;
  carryover_items_with_invalid_kind: string[] | null;
  valid_kind_coverage: string | null;
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

  const [segmentsRaw, hasSegments] = getPath(manifest, "segments");
  const segmentsIsList = hasSegments && Array.isArray(segmentsRaw);
  const rows: unknown[] = segmentsIsList ? (segmentsRaw as unknown[]) : [];
  const segmentsCount: number | null = segmentsIsList ? rows.length : null;

  const [itemsRaw, hasItems] = getPath(manifest, "carryover_items");
  const itemsIsList = hasItems && Array.isArray(itemsRaw);
  const itemRows: unknown[] = itemsIsList ? (itemsRaw as unknown[]) : [];
  const itemsCount: number | null = itemsIsList ? itemRows.length : null;

  const segmentsWithoutTranslation: string[] | null = segmentsIsList
    ? rows.filter((c) => hasField(c, "has_translation") &&
        (c as Record<string, unknown>)["has_translation"] !== true)
        .map(rowName)
    : null;
  const segmentsWithoutMeaningPreserved: string[] | null = segmentsIsList
    ? rows.filter((c) => hasField(c, "meaning_preserved") &&
        (c as Record<string, unknown>)["meaning_preserved"] !== true)
        .map(rowName)
    : null;
  const segmentsWithoutIdiomAmbiguityHandling: string[] | null = segmentsIsList
    ? rows.filter((c) => hasField(c, "idiom_ambiguity_handling_complete") &&
        (c as Record<string, unknown>)["idiom_ambiguity_handling_complete"] !== true)
        .map(rowName)
    : null;
  const segmentsWithoutExactCarryoverCheck: string[] | null = segmentsIsList
    ? rows.filter((c) => hasField(c, "exact_carryover_checked") &&
        (c as Record<string, unknown>)["exact_carryover_checked"] !== true)
        .map(rowName)
    : null;
  const carryoverItemsNotMatching: string[] | null = itemsIsList
    ? itemRows.filter((c) => hasField(c, "matches_original_exactly") &&
        (c as Record<string, unknown>)["matches_original_exactly"] !== true)
        .map(rowName)
    : null;
  const carryoverItemsWithInvalidKind: string[] | null = itemsIsList
    ? itemRows.filter((c) => hasField(c, "kind") &&
        !CARRYOVER_KINDS.includes(
          (c as Record<string, unknown>)["kind"] as string))
        .map(rowName)
    : null;
  const translationCoverage: number | null =
    segmentsIsList && segmentsCount !== null && segmentsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["has_translation"] === true).length / segmentsCount
      : null;
  const meaningPreservedCoverage: number | null =
    segmentsIsList && segmentsCount !== null && segmentsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["meaning_preserved"] === true).length / segmentsCount
      : null;
  const idiomAmbiguityHandlingCoverage: number | null =
    segmentsIsList && segmentsCount !== null && segmentsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["idiom_ambiguity_handling_complete"] === true).length / segmentsCount
      : null;
  const exactCarryoverCheckCoverage: number | null =
    segmentsIsList && segmentsCount !== null && segmentsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["exact_carryover_checked"] === true).length / segmentsCount
      : null;
  const exactMatchCoverage: number | null =
    itemsIsList && itemsCount !== null && itemsCount > 0
      ? itemRows.filter((c) => isPyDict(c) &&
          c["matches_original_exactly"] === true).length / itemsCount
      : null;
  const validKindCoverage: number | null =
    itemsIsList && itemsCount !== null && itemsCount > 0
      ? itemRows.filter((c) => isPyDict(c) &&
          CARRYOVER_KINDS.includes(c["kind"] as string)).length / itemsCount
      : null;

  // ---- Section 1: context_and_meaning_first_method ----
  boolCheck(results, "context_and_meaning_first_method",
    "source_language_identified", manifest,
    ["context", "source_language_identified"],
    "context: the source language is identified");
  boolCheck(results, "context_and_meaning_first_method",
    "target_language_identified", manifest,
    ["context", "target_language_identified"],
    "context: the target language is identified");
  boolCheck(results, "context_and_meaning_first_method",
    "purpose_identified", manifest,
    ["context", "purpose_identified"],
    "context: what the text is for is identified");
  boolCheck(results, "context_and_meaning_first_method",
    "whole_text_read_before_translation", manifest,
    ["context", "whole_text_read_before_translation"],
    "method: the whole text was read before translating any of it — context sets every line");
  boolCheck(results, "context_and_meaning_first_method",
    "translated_for_meaning_not_word_for_word", manifest,
    ["context", "translated_for_meaning_not_word_for_word"],
    "meaning first: the translation renders what the writer intends, not word for word");
  boolCheck(results, "context_and_meaning_first_method",
    "everyday_scope_not_software_localisation", manifest,
    ["context", "everyday_scope_not_software_localisation"],
    "scope: this is everyday translation, distinct from software localisation work");
  const meaningPresent = segmentsIsList &&
    rows.every((c) => hasField(c, "meaning_preserved"));
  check(results, "context_and_meaning_first_method",
    "every_segment_meaning_preserved", segmentsRaw, meaningPresent,
    segmentsIsList && (segmentsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["meaning_preserved"] === true),
    "meaning first: every declared segment row declares its meaning preserved");

  // ---- Section 2: register_tone_and_send_readiness ----
  boolCheck(results, "register_tone_and_send_readiness",
    "register_preserved", manifest,
    ["tone", "register_preserved"],
    "register preserved: formal stays formal, casual stays casual, family stays family");
  boolCheck(results, "register_tone_and_send_readiness",
    "tone_and_intent_preserved", manifest,
    ["tone", "tone_and_intent_preserved"],
    "tone: register, tone and intent are kept intact throughout — a warm message lands warm, a firm one firm");
  boolCheck(results, "register_tone_and_send_readiness",
    "tone_note_provided_for_sends", manifest,
    ["tone", "tone_note_provided_for_sends"],
    "tone note: for anything the caller will send, the translation carries a one-line note on its tone — warm, neutral, formal, firm — as it will be received");
  boolCheck(results, "register_tone_and_send_readiness",
    "tone_variant_offered_only_when_real_choice", manifest,
    ["tone", "tone_variant_offered_only_when_real_choice"],
    "tone: a softer or firmer variant is offered only when tone is a real choice in the reply");
  boolCheck(results, "register_tone_and_send_readiness",
    "could_offend_or_mislead_phrases_flagged_first", manifest,
    ["tone", "could_offend_or_mislead_phrases_flagged_first"],
    "for sends: any phrase that could offend or mislead in the target culture is flagged first");
  boolCheck(results, "register_tone_and_send_readiness",
    "honorifics_and_family_terms_matched_to_relationship", manifest,
    ["tone", "honorifics_and_family_terms_matched_to_relationship"],
    "for sends: honorifics and family terms are matched to the relationship, not guessed");
  boolCheck(results, "register_tone_and_send_readiness",
    "voice_preserved", manifest,
    ["tone", "voice_preserved"],
    "for sends: the sender's voice stays theirs — the translation does not sound like a stranger");
  boolCheck(results, "register_tone_and_send_readiness",
    "translation_ready_to_paste_or_speak_for_sends", manifest,
    ["tone", "translation_ready_to_paste_or_speak_for_sends"],
    "for sends: the finished translation is ready to paste or speak");

  // ---- Section 3: idiom_ambiguity_and_uncertainty ----
  boolCheck(results, "idiom_ambiguity_and_uncertainty",
    "idioms_flagged_and_explained", manifest,
    ["handling", "idioms_flagged_and_explained"],
    "idiom: idioms are flagged and explained, never silently flattened into something bland");
  boolCheck(results, "idiom_ambiguity_and_uncertainty",
    "ambiguities_named_with_both_readings", manifest,
    ["handling", "ambiguities_named_with_both_readings"],
    "ambiguity is named: a line that can be read two ways carries both readings");
  boolCheck(results, "idiom_ambiguity_and_uncertainty",
    "flagged_items_given_short_note_not_lecture", manifest,
    ["handling", "flagged_items_given_short_note_not_lecture"],
    "flagging: idioms, honorifics and ambiguous lines carry a short note, not a lecture");
  boolCheck(results, "idiom_ambiguity_and_uncertainty",
    "uncertain_or_illegible_passages_marked_as_uncertain", manifest,
    ["handling", "uncertain_or_illegible_passages_marked_as_uncertain"],
    "uncertainty: uncertain or illegible passages are marked as uncertain");
  boolCheck(results, "idiom_ambiguity_and_uncertainty",
    "source_unclear_uncertainty_and_reason_stated", manifest,
    ["handling", "source_unclear_uncertainty_and_reason_stated"],
    "uncertainty: where the source is unclear, garbled or partly illegible, what is uncertain and why is stated");
  const handlingPresent = segmentsIsList &&
    rows.every((c) => hasField(c, "idiom_ambiguity_handling_complete"));
  check(results, "idiom_ambiguity_and_uncertainty",
    "every_segment_idiom_ambiguity_handling_complete", segmentsRaw,
    handlingPresent,
    segmentsIsList && (segmentsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        c["idiom_ambiguity_handling_complete"] === true),
    "handling: every declared segment row declares its idiom and ambiguity handling complete");

  // ---- Section 4: exact_carryover_and_segment_coverage ----
  boolCheck(results, "exact_carryover_and_segment_coverage",
    "names_numbers_dates_figures_checked_one_by_one", manifest,
    ["carryover", "names_numbers_dates_figures_checked_one_by_one"],
    "exact carryover: names, numbers, dates and figures are checked against the original one by one");
  check(results, "exact_carryover_and_segment_coverage",
    "segments_declared", segmentsRaw, segmentsIsList,
    segmentsIsList && (segmentsCount as number) > 0,
    "the declared record names its segments — the segments list is present and non-empty");
  const translationPresent = segmentsIsList &&
    rows.every((c) => hasField(c, "has_translation"));
  check(results, "exact_carryover_and_segment_coverage",
    "every_segment_has_translation", segmentsRaw, translationPresent,
    segmentsIsList && (segmentsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["has_translation"] === true),
    "segment coverage: every declared segment row has a translation");
  const carryoverCheckPresent = segmentsIsList &&
    rows.every((c) => hasField(c, "exact_carryover_checked"));
  check(results, "exact_carryover_and_segment_coverage",
    "every_segment_exact_carryover_checked", segmentsRaw,
    carryoverCheckPresent,
    segmentsIsList && (segmentsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        c["exact_carryover_checked"] === true),
    "exact carryover: every declared segment row declares its exact-carryover check done");
  check(results, "exact_carryover_and_segment_coverage",
    "carryover_items_declared", itemsRaw, itemsIsList,
    itemsIsList,
    "the declared record names its carryover items — the carryover_items list is present (an explicitly empty list declares there was nothing to carry over)");
  const matchPresent = itemsIsList &&
    itemRows.every((c) => hasField(c, "matches_original_exactly"));
  check(results, "exact_carryover_and_segment_coverage",
    "every_carryover_item_matches_exactly", itemsRaw, matchPresent,
    itemsIsList &&
      itemRows.every((c) => isPyDict(c) &&
        c["matches_original_exactly"] === true),
    "exact carryover: every declared carryover item matches the original exactly, never localised away");
  const kindPresent = itemsIsList &&
    itemRows.every((c) => hasField(c, "kind"));
  check(results, "exact_carryover_and_segment_coverage",
    "every_carryover_kind_valid", itemsRaw, kindPresent,
    itemsIsList &&
      itemRows.every((c) => isPyDict(c) &&
        CARRYOVER_KINDS.includes(c["kind"] as string)),
    "exact carryover: every declared carryover item declares a kind from the skill's set — name / number / date / place / figure");

  // ---- Section 5: sensitive_documents_and_red_lines ----
  boolCheck(results, "sensitive_documents_and_red_lines",
    "sensitive_category_identified", manifest,
    ["sensitive", "sensitive_category_identified"],
    "sensitive documents: legal, medical or immigration character is identified where present");
  boolCheck(results, "sensitive_documents_and_red_lines",
    "translated_faithfully_and_completely_when_sensitive", manifest,
    ["sensitive", "translated_faithfully_and_completely_when_sensitive"],
    "sensitive documents: legal, medical and immigration texts are translated faithfully and completely");
  boolCheck(results, "sensitive_documents_and_red_lines",
    "nothing_summarised_away_when_sensitive", manifest,
    ["sensitive", "nothing_summarised_away_when_sensitive"],
    "sensitive documents: nothing is summarised away in a document where every clause can matter");
  boolCheck(results, "sensitive_documents_and_red_lines",
    "certified_translation_flag_raised_when_sensitive", manifest,
    ["sensitive", "certified_translation_flag_raised_when_sensitive"],
    "sensitive documents: the flag is raised plainly — an official use may need a certified translation");
  falseCheck(results, "sensitive_documents_and_red_lines",
    "no_draft_upgraded_to_official", manifest,
    ["red_lines", "draft_upgraded_to_official_present"],
    "red line: no draft translation is silently upgraded into an official document");
  falseCheck(results, "sensitive_documents_and_red_lines",
    "no_idiom_flattened_or_firm_message_softened_silently", manifest,
    ["red_lines", "idiom_flattened_or_firm_message_softened_silently_present"],
    "red line: no idiom is flattened and no firm message is softened without telling the caller");
  falseCheck(results, "sensitive_documents_and_red_lines",
    "no_illegible_text_guessed", manifest,
    ["red_lines", "illegible_text_guessed_present"],
    "red line: no illegible text is guessed at — it is marked and asked about");
  falseCheck(results, "sensitive_documents_and_red_lines",
    "no_name_number_date_or_figure_changed", manifest,
    ["red_lines", "name_number_date_or_figure_changed_present"],
    "red line: no name, number, date or figure is changed in translation");
  falseCheck(results, "sensitive_documents_and_red_lines",
    "no_meaning_added_beyond_original", manifest,
    ["red_lines", "meaning_added_beyond_original_present"],
    "red line: no meaning the original does not carry is added, however helpful it seems");

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
    verdict = "MEANING_FIRST_TRANSLATION_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "MEANING_FIRST_TRANSLATION_SOUND";
  }

  const computedNames = [
    "every_segment_meaning_preserved",
    "every_segment_idiom_ambiguity_handling_complete",
    "segments_declared",
    "every_segment_has_translation",
    "every_segment_exact_carryover_checked",
    "carryover_items_declared",
    "every_carryover_item_matches_exactly",
    "every_carryover_kind_valid",
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
    service: "meaning-first-translation-with-tone-note",
    atom_version: "0.1.0",
    document: manifest["document"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    segments_count: segmentsCount,
    segments_without_translation: segmentsWithoutTranslation,
    translation_coverage: fmt6(translationCoverage),
    segments_without_meaning_preserved: segmentsWithoutMeaningPreserved,
    meaning_preserved_coverage: fmt6(meaningPreservedCoverage),
    segments_without_idiom_ambiguity_handling:
      segmentsWithoutIdiomAmbiguityHandling,
    idiom_ambiguity_handling_coverage: fmt6(idiomAmbiguityHandlingCoverage),
    segments_without_exact_carryover_check:
      segmentsWithoutExactCarryoverCheck,
    exact_carryover_check_coverage: fmt6(exactCarryoverCheckCoverage),
    carryover_items_count: itemsCount,
    carryover_items_not_matching: carryoverItemsNotMatching,
    exact_match_coverage: fmt6(exactMatchCoverage),
    carryover_items_with_invalid_kind: carryoverItemsWithInvalidKind,
    valid_kind_coverage: fmt6(validKindCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "MEANING FIRST TRANSLATION WITH TONE NOTE",
    `document: ${pyStr(verdict.document ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
