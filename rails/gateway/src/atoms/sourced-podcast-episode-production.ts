// Sourced podcast episode production — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/sourced-podcast-episode-production/src/sourced_podcast_episode_production.py
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
  episode_title: "string",
  scoping: {
    topic_scoped: "boolean",
    audience_scoped: "boolean",
    target_length_scoped: "boolean",
    main_point_scoped: "boolean",
    distribution_intent_confirmed: "boolean",
    scoped_before_writing: "boolean",
  },
  episode_sections: [{
    section_id: "string",
    purpose: "string",
    supports_main_point: "boolean",
  }],
  source_work: {
    sources_collected_before_writing: "boolean",
    source_list_kept_beside_draft: "boolean",
    script_checked_claim_by_claim_against_sources: "boolean",
    unsupported_claims_cut_or_softened: "boolean",
  },
  sources: [{
    source_id: "string",
    citation: "string",
  }],
  claims: [{
    claim_id: "string",
    claim_kind: "string",
    source_id: "string",
    source_marked_in_script: "boolean",
  }],
  script: {
    written_for_the_ear: "boolean",
    uses_short_sentences: "boolean",
    uses_signposts: "boolean",
    has_no_visual_references: "boolean",
    opens_with_main_point: "boolean",
    supports_point_in_order: "boolean",
    closes_with_what_matters: "boolean",
    approved_before_narration: "boolean",
  },
  narration: {
    voice_confirmed: "boolean",
    pace_confirmed: "boolean",
    long_script_chunked_at_section_breaks_where_long: "boolean",
    audio_assembled: "boolean",
    opening_listen_back_checked: "boolean",
    section_joins_listen_back_checked: "boolean",
    misreads_and_awkward_joins_fixed: "boolean",
    ai_narrated: "boolean",
  },
  show_notes: {
    summary_included: "boolean",
    main_points_included: "boolean",
    complete_source_list_included: "boolean",
    source_ids_included: ["string"],
  },
  rights: {
    copyrighted_audio_or_music_used: "boolean",
    right_to_copyrighted_audio_or_music_cleared: "boolean",
  },
  guests: {
    guest_voices_present: "boolean",
    releases_recorded_for_all_guests: "boolean",
  },
  publishing: {
    publishing_or_scheduling_planned: "boolean",
    authorization_recorded_for_this_episode: "boolean",
    destination_matches_authorized_scope: "boolean",
    timing_matches_authorized_scope: "boolean",
    ai_narration_disclosure_made: "boolean",
  },
  red_lines: {
    fabricated_quote_statistic_or_source_present: "boolean",
    words_attributed_beyond_source_present: "boolean",
    publishing_beyond_authorized_scope_present: "boolean",
    ai_narration_presented_as_human_without_disclosure_present: "boolean",
    copyrighted_audio_without_clear_right_present: "boolean",
  },
};

export const SECTIONS = [
  "episode_scoping_and_outline",
  "sources_and_claim_traceability",
  "script_for_listening",
  "narration_and_assembly_qc",
  "show_notes_and_rights",
  "publishing_and_disclosure",
  "red_lines",
] as const;

const CLAIM_KINDS = ["quote", "statistic"];

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
  episode_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  episode_outline_sections_count: number | null;
  podcast_sources_count: number | null;
  podcast_claims_count: number | null;
  duplicate_episode_outline_section_ids: string[] | null;
  duplicate_podcast_source_ids: string[] | null;
  duplicate_podcast_claim_ids: string[] | null;
  episode_outline_sections_without_purpose: string[] | null;
  episode_outline_sections_not_supporting_main_point: string[] | null;
  podcast_sources_without_citation: string[] | null;
  podcast_claims_with_invalid_kind: string[] | null;
  podcast_claims_with_unknown_source_reference: string[] | null;
  podcast_claims_with_unmarked_source: string[] | null;
  podcast_sources_missing_from_show_notes: string[] | null;
  show_notes_source_ids_not_declared_as_sources: string[] | null;
  outline_section_support_ratio: string | null;
  source_citation_ratio: string | null;
  traced_claim_ratio: string | null;
  show_notes_source_coverage_ratio: string | null;
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
  if (hasGate && gate) {
    check(results, section, name, target, hasTarget, target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function idsOf(rows: unknown[], field: string): string[] {
  const out: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      out.push(c[field] as string);
    }
  }
  return out;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [epSectionsRaw, hasEpSections] = getPath(manifest, "episode_sections");
  const epIsList = hasEpSections && Array.isArray(epSectionsRaw);
  const epRows: unknown[] = epIsList ? (epSectionsRaw as unknown[]) : [];
  const epCount: number | null = epIsList ? epRows.length : null;

  const [sourcesRaw, hasSources] = getPath(manifest, "sources");
  const sourcesIsList = hasSources && Array.isArray(sourcesRaw);
  const sourceRows: unknown[] = sourcesIsList ? (sourcesRaw as unknown[]) : [];
  const sourcesCount: number | null = sourcesIsList ? sourceRows.length : null;
  const sourceIds = idsOf(sourceRows, "source_id");

  const [claimsRaw, hasClaims] = getPath(manifest, "claims");
  const claimsIsList = hasClaims && Array.isArray(claimsRaw);
  const claimRows: unknown[] = claimsIsList ? (claimsRaw as unknown[]) : [];
  const claimsCount: number | null = claimsIsList ? claimRows.length : null;

  const [notesIdsRaw, hasNotesIds] = getPath(manifest, "show_notes", "source_ids_included");
  const notesIsList = hasNotesIds && Array.isArray(notesIdsRaw);
  const notesRows: unknown[] = notesIsList ? (notesIdsRaw as unknown[]) : [];

  const duplicateSectionIds: string[] | null = epIsList
    ? duplicates(epRows, "section_id") : null;
  const duplicateSourceIds: string[] | null = sourcesIsList
    ? duplicates(sourceRows, "source_id") : null;
  const duplicateClaimIds: string[] | null = claimsIsList
    ? duplicates(claimRows, "claim_id") : null;

  const sectionsWithoutPurpose: string[] | null = epIsList
    ? epRows.filter((c) => hasField(c, "purpose") &&
        !nonemptyStr((c as Record<string, unknown>)["purpose"]))
        .map((c) => rowName(c, "section_id"))
    : null;
  const sectionsNotSupporting: string[] | null = epIsList
    ? epRows.filter((c) => hasField(c, "supports_main_point") &&
        (c as Record<string, unknown>)["supports_main_point"] !== true)
        .map((c) => rowName(c, "section_id"))
    : null;
  const sourcesWithoutCitation: string[] | null = sourcesIsList
    ? sourceRows.filter((c) => hasField(c, "citation") &&
        !nonemptyStr((c as Record<string, unknown>)["citation"]))
        .map((c) => rowName(c, "source_id"))
    : null;
  const claimsWithInvalidKind: string[] | null = claimsIsList
    ? claimRows.filter((c) => hasField(c, "claim_kind") &&
        !CLAIM_KINDS.includes((c as Record<string, unknown>)["claim_kind"] as string))
        .map((c) => rowName(c, "claim_id"))
    : null;
  const claimsWithUnknownSource: string[] | null = claimsIsList && sourcesIsList
    ? claimRows.filter((c) => hasField(c, "source_id") &&
        !sourceIds.includes((c as Record<string, unknown>)["source_id"] as string))
        .map((c) => rowName(c, "claim_id"))
    : null;
  const claimsWithUnmarkedSource: string[] | null = claimsIsList
    ? claimRows.filter((c) => hasField(c, "source_marked_in_script") &&
        (c as Record<string, unknown>)["source_marked_in_script"] !== true)
        .map((c) => rowName(c, "claim_id"))
    : null;

  const claimTraced = (c: unknown): boolean =>
    sourcesIsList && hasField(c, "source_id") &&
    sourceIds.includes((c as Record<string, unknown>)["source_id"] as string) &&
    (c as Record<string, unknown>)["source_marked_in_script"] === true;

  let notesMissing: string[] | null = null;
  let notesExtra: string[] | null = null;
  if (sourcesIsList && notesIsList) {
    notesMissing = [];
    for (const sid of sourceIds) {
      if (!notesRows.includes(sid) && !notesMissing.includes(sid)) {
        notesMissing.push(sid);
      }
    }
    notesExtra = [];
    for (const nid of notesRows) {
      if (typeof nid === "string" && !sourceIds.includes(nid) &&
          !notesExtra.includes(nid)) {
        notesExtra.push(nid);
      }
    }
  }

  const outlineSupportRatio: number | null =
    epIsList && epCount !== null && epCount > 0
      ? epRows.filter((c) => isPyDict(c) && c["supports_main_point"] === true).length / epCount
      : null;
  const sourceCitationRatio: number | null =
    sourcesIsList && sourcesCount !== null && sourcesCount > 0
      ? sourceRows.filter((c) => isPyDict(c) && nonemptyStr(c["citation"])).length / sourcesCount
      : null;
  const tracedClaimRatio: number | null =
    claimsIsList && claimsCount !== null && claimsCount > 0
      ? claimRows.filter((c) => claimTraced(c)).length / claimsCount
      : null;
  const showNotesCoverageRatio: number | null =
    sourcesIsList && notesIsList && sourcesCount !== null && sourcesCount > 0
      ? sourceIds.filter((s) => notesRows.includes(s)).length / sourcesCount
      : null;

  // ---- Section 1: episode_scoping_and_outline ----
  boolCheck(results, "episode_scoping_and_outline",
    "podcast_episode_topic_scoped", manifest,
    ["scoping", "topic_scoped"],
    "scoping: the episode topic was scoped before writing");
  boolCheck(results, "episode_scoping_and_outline",
    "podcast_episode_audience_scoped", manifest,
    ["scoping", "audience_scoped"],
    "scoping: the episode audience was scoped before writing");
  boolCheck(results, "episode_scoping_and_outline",
    "podcast_episode_target_length_scoped", manifest,
    ["scoping", "target_length_scoped"],
    "scoping: the episode target length was scoped before writing");
  boolCheck(results, "episode_scoping_and_outline",
    "podcast_episode_main_point_scoped", manifest,
    ["scoping", "main_point_scoped"],
    "scoping: the episode's single main point was scoped before writing");
  boolCheck(results, "episode_scoping_and_outline",
    "podcast_episode_distribution_intent_confirmed", manifest,
    ["scoping", "distribution_intent_confirmed"],
    "scoping: whether the episode is for the caller alone or for publishing later was confirmed");
  boolCheck(results, "episode_scoping_and_outline",
    "podcast_episode_scoped_before_writing", manifest,
    ["scoping", "scoped_before_writing"],
    "scoping / quality gate: topic, audience, length and main point were scoped before writing began");
  check(results, "episode_scoping_and_outline",
    "podcast_episode_outline_sections_list_declared", epSectionsRaw, epIsList,
    epIsList && epCount !== null && epCount > 0,
    "outline: the declared record names its episode outline sections — the list is present and names at least one section; an absent list is missing evidence and an empty list declares no outline at all");
  const secIdPresent = epIsList && epRows.every((c) => hasField(c, "section_id"));
  check(results, "episode_scoping_and_outline",
    "every_podcast_episode_outline_section_id_unique", epSectionsRaw, secIdPresent,
    epIsList && duplicateSectionIds !== null && duplicateSectionIds.length === 0,
    "outline sections: no declared section_id is owned by more than one row");
  const purposePresent = epIsList && epRows.every((c) => hasField(c, "purpose"));
  check(results, "episode_scoping_and_outline",
    "every_podcast_episode_outline_section_purpose_declared", epSectionsRaw,
    purposePresent,
    epIsList && epRows.every((c) => isPyDict(c) && nonemptyStr(c["purpose"])),
    "outline: every declared section declares a non-empty purpose — each section earns its place");
  const supportsPresent = epIsList &&
    epRows.every((c) => hasField(c, "supports_main_point"));
  check(results, "episode_scoping_and_outline",
    "every_podcast_episode_outline_section_supports_main_point", epSectionsRaw,
    supportsPresent,
    epIsList && epRows.every((c) => isPyDict(c) && c["supports_main_point"] === true),
    "outline: every declared section is declared to support the episode's single main point");

  // ---- Section 2: sources_and_claim_traceability ----
  boolCheck(results, "sources_and_claim_traceability",
    "podcast_episode_sources_collected_before_writing", manifest,
    ["source_work", "sources_collected_before_writing"],
    "research: sources were collected before writing anything");
  boolCheck(results, "sources_and_claim_traceability",
    "podcast_episode_source_list_kept_beside_draft", manifest,
    ["source_work", "source_list_kept_beside_draft"],
    "research: the source list was kept beside the draft from the first line onward");
  boolCheck(results, "sources_and_claim_traceability",
    "podcast_episode_script_checked_claim_by_claim", manifest,
    ["source_work", "script_checked_claim_by_claim_against_sources"],
    "claim check: the script was checked claim by claim against the source list");
  boolCheck(results, "sources_and_claim_traceability",
    "podcast_episode_unsupported_claims_cut_or_softened", manifest,
    ["source_work", "unsupported_claims_cut_or_softened"],
    "claim check: anything no collected source supports was cut or softened");
  check(results, "sources_and_claim_traceability",
    "podcast_episode_sources_list_declared", sourcesRaw, sourcesIsList,
    sourcesIsList && sourcesCount !== null && sourcesCount > 0,
    "sources: the declared record names its sources — the list is present and names at least one source; an absent list is missing evidence and an empty list declares no sourced episode at all");
  const srcIdPresent = sourcesIsList &&
    sourceRows.every((c) => hasField(c, "source_id"));
  check(results, "sources_and_claim_traceability",
    "every_podcast_source_id_unique", sourcesRaw, srcIdPresent,
    sourcesIsList && duplicateSourceIds !== null && duplicateSourceIds.length === 0,
    "sources: no declared source_id is owned by more than one row");
  const citationPresent = sourcesIsList &&
    sourceRows.every((c) => hasField(c, "citation"));
  check(results, "sources_and_claim_traceability",
    "every_podcast_source_citation_recorded", sourcesRaw, citationPresent,
    sourcesIsList && sourceRows.every((c) => isPyDict(c) && nonemptyStr(c["citation"])),
    "sources: every declared source declares a non-empty citation or link as recorded");
  check(results, "sources_and_claim_traceability",
    "podcast_episode_claims_list_declared", claimsRaw, claimsIsList,
    claimsIsList && claimsCount !== null && claimsCount > 0,
    "claims: the declared record names its quote and statistic claim rows — the list is present and names at least one claim; an absent list is missing evidence and an empty list declares no traced claims at all");
  const claimIdPresent = claimsIsList &&
    claimRows.every((c) => hasField(c, "claim_id"));
  check(results, "sources_and_claim_traceability",
    "every_podcast_claim_id_unique", claimsRaw, claimIdPresent,
    claimsIsList && duplicateClaimIds !== null && duplicateClaimIds.length === 0,
    "claims: no declared claim_id is owned by more than one row");
  const kindPresent = claimsIsList &&
    claimRows.every((c) => hasField(c, "claim_kind"));
  check(results, "sources_and_claim_traceability",
    "every_podcast_claim_kind_recognised", claimsRaw, kindPresent,
    claimsIsList && claimRows.every((c) => isPyDict(c) &&
      CLAIM_KINDS.includes(c["claim_kind"] as string)),
    "claims: every declared claim's kind is one of quote, statistic — the two kinds the skill requires to be marked with a source");
  const tracedPresent = claimsIsList && sourcesIsList &&
    claimRows.every((c) => hasField(c, "source_id"));
  check(results, "sources_and_claim_traceability",
    "every_podcast_claim_traced_to_declared_source", claimsRaw, tracedPresent,
    claimsIsList && sourcesIsList &&
      claimRows.every((c) => hasField(c, "source_id") &&
        sourceIds.includes((c as Record<string, unknown>)["source_id"] as string)),
    "claims / quality gate: every declared quote and statistic traces to a source_id named in the declared source list");
  const markedPresent = claimsIsList &&
    claimRows.every((c) => hasField(c, "source_marked_in_script"));
  check(results, "sources_and_claim_traceability",
    "every_podcast_claim_source_marked_in_script", claimsRaw, markedPresent,
    claimsIsList && claimRows.every((c) => isPyDict(c) &&
      c["source_marked_in_script"] === true),
    "claims: every declared quote and statistic is marked in the script with the source it came from");

  // ---- Section 3: script_for_listening ----
  boolCheck(results, "script_for_listening",
    "podcast_episode_script_written_for_the_ear", manifest,
    ["script", "written_for_the_ear"],
    "script / quality gate: the script was written for listening, not adapted from dense prose");
  boolCheck(results, "script_for_listening",
    "podcast_episode_script_uses_short_sentences", manifest,
    ["script", "uses_short_sentences"],
    "script: the script uses short sentences written for the ear");
  boolCheck(results, "script_for_listening",
    "podcast_episode_script_uses_signposts", manifest,
    ["script", "uses_signposts"],
    "script: the script uses signposts written for the ear");
  boolCheck(results, "script_for_listening",
    "podcast_episode_script_has_no_visual_references", manifest,
    ["script", "has_no_visual_references"],
    "script: the script contains no visual references");
  boolCheck(results, "script_for_listening",
    "podcast_episode_script_opens_with_main_point", manifest,
    ["script", "opens_with_main_point"],
    "outline / script: the script opens with the point");
  boolCheck(results, "script_for_listening",
    "podcast_episode_script_supports_point_in_order", manifest,
    ["script", "supports_point_in_order"],
    "outline / script: the script supports the point in order");
  boolCheck(results, "script_for_listening",
    "podcast_episode_script_closes_with_what_matters", manifest,
    ["script", "closes_with_what_matters"],
    "outline / script: the script closes with what matters");
  boolCheck(results, "script_for_listening",
    "podcast_episode_script_approved_before_narration", manifest,
    ["script", "approved_before_narration"],
    "script: the script was approved before narration — narration is of the approved script");

  // ---- Section 4: narration_and_assembly_qc ----
  boolCheck(results, "narration_and_assembly_qc",
    "podcast_episode_narration_voice_confirmed", manifest,
    ["narration", "voice_confirmed"],
    "narration: the narration voice was confirmed before narration");
  boolCheck(results, "narration_and_assembly_qc",
    "podcast_episode_narration_pace_confirmed", manifest,
    ["narration", "pace_confirmed"],
    "narration: the narration pace was confirmed before narration");
  boolCheck(results, "narration_and_assembly_qc",
    "podcast_episode_long_script_chunked_at_section_breaks", manifest,
    ["narration", "long_script_chunked_at_section_breaks_where_long"],
    "narration: a long script was chunked at section breaks, where the script is long");
  boolCheck(results, "narration_and_assembly_qc",
    "podcast_episode_audio_assembled", manifest,
    ["narration", "audio_assembled"],
    "assembly: the episode audio was assembled");
  boolCheck(results, "narration_and_assembly_qc",
    "podcast_episode_opening_listen_back_checked", manifest,
    ["narration", "opening_listen_back_checked"],
    "assembly / quality gate: narration was checked by listening back to the opening");
  boolCheck(results, "narration_and_assembly_qc",
    "podcast_episode_section_joins_listen_back_checked", manifest,
    ["narration", "section_joins_listen_back_checked"],
    "assembly / quality gate: narration was checked by listening back at the section joins");
  boolCheck(results, "narration_and_assembly_qc",
    "podcast_episode_misreads_and_awkward_joins_fixed", manifest,
    ["narration", "misreads_and_awkward_joins_fixed"],
    "assembly: misreads and awkward joins found on listen-back were fixed before the episode was called done");

  // ---- Section 5: show_notes_and_rights ----
  boolCheck(results, "show_notes_and_rights",
    "podcast_episode_show_notes_include_summary", manifest,
    ["show_notes", "summary_included"],
    "show notes: the show notes include a short summary");
  boolCheck(results, "show_notes_and_rights",
    "podcast_episode_show_notes_include_main_points", manifest,
    ["show_notes", "main_points_included"],
    "show notes: the show notes include the main points");
  boolCheck(results, "show_notes_and_rights",
    "podcast_episode_show_notes_include_complete_source_list", manifest,
    ["show_notes", "complete_source_list_included"],
    "show notes / quality gate: the show notes include the complete source list");
  const notesMatchPresent = sourcesIsList && notesIsList &&
    sourceRows.every((c) => hasField(c, "source_id"));
  check(results, "show_notes_and_rights",
    "podcast_episode_show_notes_source_ids_match_declared_sources", notesIdsRaw,
    notesMatchPresent,
    notesMatchPresent && notesMissing !== null && notesMissing.length === 0 &&
      notesExtra !== null && notesExtra.length === 0,
    "show notes: the source ids declared included in the show notes are exactly the declared source ids — none missing, none extra");
  gatedBoolCheck(results, "show_notes_and_rights",
    "podcast_episode_copyrighted_audio_rights_cleared_where_used", manifest,
    ["rights", "copyrighted_audio_or_music_used"],
    ["rights", "right_to_copyrighted_audio_or_music_cleared"],
    "rights / red line: a clear right to the copyrighted audio or music used in the episode is recorded",
    "no copyrighted audio or music use declared");
  gatedBoolCheck(results, "show_notes_and_rights",
    "podcast_episode_guest_releases_recorded_where_guests_present", manifest,
    ["guests", "guest_voices_present"],
    ["guests", "releases_recorded_for_all_guests"],
    "guests: releases are recorded for all guest voices present in the episode",
    "no guest voices declared");

  // ---- Section 6: publishing_and_disclosure ----
  gatedBoolCheck(results, "publishing_and_disclosure",
    "podcast_episode_publishing_authorization_recorded_where_planned", manifest,
    ["publishing", "publishing_or_scheduling_planned"],
    ["publishing", "authorization_recorded_for_this_episode"],
    "publishing / quality gate: publishing or scheduling was authorized for this episode",
    "no publishing or scheduling declared planned");
  gatedBoolCheck(results, "publishing_and_disclosure",
    "podcast_episode_publishing_destination_matches_authorization_where_planned",
    manifest,
    ["publishing", "publishing_or_scheduling_planned"],
    ["publishing", "destination_matches_authorized_scope"],
    "publishing: the publishing destination matches the authorization for this episode exactly",
    "no publishing or scheduling declared planned");
  gatedBoolCheck(results, "publishing_and_disclosure",
    "podcast_episode_publishing_timing_matches_authorization_where_planned",
    manifest,
    ["publishing", "publishing_or_scheduling_planned"],
    ["publishing", "timing_matches_authorized_scope"],
    "publishing: the publishing timing matches the authorization for this episode exactly",
    "no publishing or scheduling declared planned");
  gatedBoolCheck(results, "publishing_and_disclosure",
    "podcast_episode_ai_narration_disclosed_where_ai_narrated", manifest,
    ["narration", "ai_narrated"],
    ["publishing", "ai_narration_disclosure_made"],
    "disclosure / red line: the AI narration is disclosed — the episode is not presented as a human recording",
    "no AI narration declared");

  // ---- Section 7: red_lines ----
  falseCheck(results, "red_lines",
    "podcast_episode_free_of_fabricated_quote_statistic_or_source", manifest,
    ["red_lines", "fabricated_quote_statistic_or_source_present"],
    "red line: no fabricated quote, statistic or source is present in the record");
  falseCheck(results, "red_lines",
    "podcast_episode_free_of_words_attributed_beyond_source", manifest,
    ["red_lines", "words_attributed_beyond_source_present"],
    "red line: no words are attributed to a person that the source does not show them saying");
  falseCheck(results, "red_lines",
    "podcast_episode_free_of_publishing_beyond_authorized_scope", manifest,
    ["red_lines", "publishing_beyond_authorized_scope_present"],
    "red line: no publishing or scheduling beyond the scope authorized for this episode is present in the record");
  falseCheck(results, "red_lines",
    "podcast_episode_free_of_ai_narration_presented_as_human_without_disclosure",
    manifest,
    ["red_lines", "ai_narration_presented_as_human_without_disclosure_present"],
    "red line: no AI-narrated episode presented as a human recording without disclosure is present in the record");
  falseCheck(results, "red_lines",
    "podcast_episode_free_of_copyrighted_audio_without_clear_right", manifest,
    ["red_lines", "copyrighted_audio_without_clear_right_present"],
    "red line: no copyrighted audio or music used without a clear right to it is present in the record");

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
    verdict = "EPISODE_PRODUCTION_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "EPISODE_PRODUCTION_SOUND";
  }

  const computedNames = [
    "podcast_episode_outline_sections_list_declared",
    "every_podcast_episode_outline_section_id_unique",
    "every_podcast_episode_outline_section_purpose_declared",
    "every_podcast_episode_outline_section_supports_main_point",
    "podcast_episode_sources_list_declared",
    "every_podcast_source_id_unique",
    "every_podcast_source_citation_recorded",
    "podcast_episode_claims_list_declared",
    "every_podcast_claim_id_unique",
    "every_podcast_claim_kind_recognised",
    "every_podcast_claim_traced_to_declared_source",
    "every_podcast_claim_source_marked_in_script",
    "podcast_episode_show_notes_source_ids_match_declared_sources",
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
    service: "sourced-podcast-episode-production",
    atom_version: "0.1.0",
    episode_title: manifest["episode_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    episode_outline_sections_count: epCount,
    podcast_sources_count: sourcesCount,
    podcast_claims_count: claimsCount,
    duplicate_episode_outline_section_ids: duplicateSectionIds,
    duplicate_podcast_source_ids: duplicateSourceIds,
    duplicate_podcast_claim_ids: duplicateClaimIds,
    episode_outline_sections_without_purpose: sectionsWithoutPurpose,
    episode_outline_sections_not_supporting_main_point: sectionsNotSupporting,
    podcast_sources_without_citation: sourcesWithoutCitation,
    podcast_claims_with_invalid_kind: claimsWithInvalidKind,
    podcast_claims_with_unknown_source_reference: claimsWithUnknownSource,
    podcast_claims_with_unmarked_source: claimsWithUnmarkedSource,
    podcast_sources_missing_from_show_notes: notesMissing,
    show_notes_source_ids_not_declared_as_sources: notesExtra,
    outline_section_support_ratio: fmt6(outlineSupportRatio),
    source_citation_ratio: fmt6(sourceCitationRatio),
    traced_claim_ratio: fmt6(tracedClaimRatio),
    show_notes_source_coverage_ratio: fmt6(showNotesCoverageRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "SOURCED PODCAST EPISODE PRODUCTION",
    `episode_title: ${pyStr(verdict.episode_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
