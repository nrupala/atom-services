// Voice note narration audio — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/voice-note-narration-audio/src/voice_note_narration_audio.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals. One check departs from the fleet absent=missing
// convention in both implementations identically: the
// voice-consent declaration is a red-line class check — absent
// fails exactly as declared-false fails.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  production_title: "string",
  scoping: {
    kind_confirmed: "boolean",
    production_kind: "string",
    audience_noted: "boolean",
    audience_scope: "string",
    voice_confirmed_before_generation: "boolean",
    register_confirmed_before_generation: "boolean",
    target_length_confirmed_before_generation: "boolean",
    confirmations_completed_before_generation: "boolean",
  },
  voice: {
    voice_kind: "string",
    voice_selected_before_generation: "boolean",
    uses_real_person_voice: "boolean",
    real_person_voice_consent_recorded: "boolean",
    voice_consent_declared: "boolean",
  },
  rights: {
    source_text_reproduction_right_declared: "boolean",
    rights_basis_recorded: "boolean",
  },
  adaptation: {
    abbreviations_expanded: "boolean",
    long_sentences_broken: "boolean",
    numbers_spelled_out: "boolean",
    links_removed: "boolean",
    tables_and_formatting_removed: "boolean",
    text_adapted_not_read_raw: "boolean",
    adaptation_reviewed_for_meaning_preservation: "boolean",
  },
  chunking: {
    long_text_chunked_at_natural_breaks_where_long: "boolean",
    narrated_chunk_by_chunk: "boolean",
  },
  segments: [{
    segment_id: "string",
    section_label: "string",
    sequence_position: "number",
    duration_seconds: "number",
  }],
  audio_spec: {
    file_format: "string",
  },
  assembly: {
    audio_generated_through_voice_stack: "boolean",
    opening_spot_checked_for_clarity_and_pace: "boolean",
    middle_spot_checked_for_clarity_and_pace: "boolean",
    chunks_assembled_into_one_file: "boolean",
    assembled_order_verified: "boolean",
    assembly_completeness_verified: "boolean",
    total_duration_seconds_declared: "number",
  },
  delivery: {
    audio_file_delivered: "boolean",
    total_duration_stated_in_delivery: "boolean",
    played_through_voice_stack_only_if_requested: "boolean",
    recipient_matches_declared_audience: "boolean",
    ai_voice_disclosure_made: "boolean",
  },
  red_lines: {
    voice_cloned_or_imitated_without_consent_present: "boolean",
    voice_note_sent_to_other_without_ai_disclosure_present: "boolean",
    text_narrated_without_reproduction_right_present: "boolean",
    generated_audio_presented_as_real_event_recording_present: "boolean",
    source_meaning_changed_in_adaptation_present: "boolean",
  },
};

export const SECTIONS = [
  "production_scoping_and_confirmation",
  "voice_consent_and_rights",
  "text_adaptation_for_listening",
  "segments_and_chunking",
  "audio_spec_and_assembly",
  "delivery_and_disclosure",
  "red_lines",
] as const;

const PRODUCTION_KINDS = ["voice_note", "narration"];
const AUDIENCE_SCOPES = ["self_only", "includes_others"];
const VOICE_KINDS = ["original_synthetic", "licensed_voice", "real_person_voice"];
const FILE_FORMATS = ["mp3", "wav", "m4a", "ogg", "flac"];

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
  production_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  voice_note_segments_count: number | null;
  duplicate_voice_note_segment_ids: string[] | null;
  voice_note_segments_without_section_label: string[] | null;
  voice_note_segments_with_non_positive_duration: string[] | null;
  voice_note_segments_with_invalid_sequence_position: string[] | null;
  voice_note_segment_duration_total: string | null;
  voice_note_total_duration_declared: string | null;
  segment_sequence_coverage_ratio: string | null;
  segment_section_label_ratio: string | null;
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

function isNumber(value: unknown): value is number {
  return typeof value === "number";
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [segmentsRaw, hasSegments] = getPath(manifest, "segments");
  const segIsList = hasSegments && Array.isArray(segmentsRaw);
  const segRows: unknown[] = segIsList ? (segmentsRaw as unknown[]) : [];
  const segCount: number | null = segIsList ? segRows.length : null;

  const [productionKind, hasKind] = getPath(manifest, "scoping", "production_kind");
  const [audienceScope, hasScope] = getPath(manifest, "scoping", "audience_scope");
  const [voiceKind, hasVoiceKind] = getPath(manifest, "voice", "voice_kind");
  const [fileFormat, hasFormat] = getPath(manifest, "audio_spec", "file_format");
  const [totalDeclared, hasTotal] = getPath(
    manifest, "assembly", "total_duration_seconds_declared");

  const duplicateSegmentIds: string[] | null = segIsList
    ? duplicates(segRows, "segment_id") : null;
  const segmentsWithoutSectionLabel: string[] | null = segIsList
    ? segRows.filter((c) => hasField(c, "section_label") &&
        !nonemptyStr((c as Record<string, unknown>)["section_label"]))
        .map((c) => rowName(c, "segment_id"))
    : null;
  const segmentsWithNonPositiveDuration: string[] | null = segIsList
    ? segRows.filter((c) => hasField(c, "duration_seconds") &&
        !(isNumber((c as Record<string, unknown>)["duration_seconds"]) &&
          ((c as Record<string, unknown>)["duration_seconds"] as number) > 0))
        .map((c) => rowName(c, "segment_id"))
    : null;

  const positionValid = (c: unknown, seenPositions: number[]): boolean => {
    const pos = isPyDict(c) ? c["sequence_position"] : null;
    if (!isNumber(pos)) return false;
    if (pos !== Math.floor(pos)) return false;
    if (pos < 1 || (segCount !== null && pos > segCount)) return false;
    if (seenPositions.includes(pos)) return false;
    return true;
  };

  let segmentsWithInvalidSequence: string[] | null = null;
  let sequenceValidCount = 0;
  if (segIsList) {
    segmentsWithInvalidSequence = [];
    const seenPositions: number[] = [];
    for (const c of segRows) {
      if (hasField(c, "sequence_position")) {
        if (positionValid(c, seenPositions)) {
          seenPositions.push(
            (c as Record<string, unknown>)["sequence_position"] as number);
          sequenceValidCount += 1;
        } else {
          segmentsWithInvalidSequence.push(rowName(c, "segment_id"));
        }
      }
    }
  }

  const sequenceComplete = (): boolean => {
    if (!segIsList || segCount === 0) return false;
    if (!segRows.every((c) => hasField(c, "sequence_position"))) return false;
    return sequenceValidCount === segCount;
  };

  let durationTotal: number | null = null;
  if (segIsList) {
    durationTotal = 0.0;
    for (const c of segRows) {
      if (isPyDict(c) && isNumber(c["duration_seconds"])) {
        durationTotal += c["duration_seconds"] as number;
      }
    }
  }

  const totalRecomputes = (): boolean => {
    if (!hasTotal || !isNumber(totalDeclared)) return false;
    if (!segIsList) return false;
    if (!segRows.every((c) => hasField(c, "duration_seconds"))) return false;
    return fmt6(durationTotal) === fmt6(totalDeclared as number);
  };

  const sequenceCoverageRatio: number | null =
    segIsList && segCount !== null && segCount > 0
      ? sequenceValidCount / segCount
      : null;
  const sectionLabelRatio: number | null =
    segIsList && segCount !== null && segCount > 0
      ? segRows.filter((c) => isPyDict(c) && nonemptyStr(c["section_label"])).length / segCount
      : null;

  // ---- Section 1: production_scoping_and_confirmation ----
  boolCheck(results, "production_scoping_and_confirmation",
    "voice_note_narration_kind_confirmed", manifest,
    ["scoping", "kind_confirmed"],
    "scoping: what the audio is — a short note or a full narration — was confirmed");
  check(results, "production_scoping_and_confirmation",
    "voice_note_narration_production_kind_recognised",
    productionKind, hasKind,
    hasKind && PRODUCTION_KINDS.includes(productionKind as string),
    "scoping: the declared production kind is one of voice_note, narration — the two kinds the skill confirms");
  boolCheck(results, "production_scoping_and_confirmation",
    "voice_note_narration_audience_noted", manifest,
    ["scoping", "audience_noted"],
    "scoping: the audience — just the caller, or someone else as well — was noted");
  check(results, "production_scoping_and_confirmation",
    "voice_note_narration_audience_scope_recognised",
    audienceScope, hasScope,
    hasScope && AUDIENCE_SCOPES.includes(audienceScope as string),
    "scoping: the declared audience scope is one of self_only, includes_others — the two audiences the skill notes");
  boolCheck(results, "production_scoping_and_confirmation",
    "voice_note_narration_voice_confirmed_before_generation", manifest,
    ["scoping", "voice_confirmed_before_generation"],
    "confirmation: the voice was confirmed before generating");
  boolCheck(results, "production_scoping_and_confirmation",
    "voice_note_narration_register_confirmed_before_generation", manifest,
    ["scoping", "register_confirmed_before_generation"],
    "confirmation: the register — conversational for a note, steady and clear for narration — was confirmed before generating");
  boolCheck(results, "production_scoping_and_confirmation",
    "voice_note_narration_target_length_confirmed_before_generation", manifest,
    ["scoping", "target_length_confirmed_before_generation"],
    "confirmation: the target length was confirmed before generating");
  boolCheck(results, "production_scoping_and_confirmation",
    "voice_note_narration_confirmations_completed_before_generation", manifest,
    ["scoping", "confirmations_completed_before_generation"],
    "confirmation: the kind, audience, voice, register and target-length confirmations were all completed before generation began");

  // ---- Section 2: voice_consent_and_rights ----
  check(results, "voice_consent_and_rights",
    "voice_note_narration_voice_kind_recognised",
    voiceKind, hasVoiceKind,
    hasVoiceKind && VOICE_KINDS.includes(voiceKind as string),
    "voice: the declared voice kind is one of original_synthetic, licensed_voice, real_person_voice — the record's voice vocabulary");
  boolCheck(results, "voice_consent_and_rights",
    "voice_note_narration_voice_selected_before_generation", manifest,
    ["voice", "voice_selected_before_generation"],
    "voice: the voice used was selected before generation began");
  gatedBoolCheck(results, "voice_consent_and_rights",
    "voice_note_narration_real_person_voice_consent_recorded_where_real_person_voice_used",
    manifest,
    ["voice", "uses_real_person_voice"],
    ["voice", "real_person_voice_consent_recorded"],
    "consent: where a real person's voice is used, that person's clear consent is recorded — the skill's voice-cloning red line",
    "no real-person voice declared used");
  boolCheck(results, "voice_consent_and_rights",
    "voice_note_narration_source_text_reproduction_right_declared", manifest,
    ["rights", "source_text_reproduction_right_declared"],
    "rights: the record declares the right to reproduce the source text as audio — the skill's narration-rights red line");
  boolCheck(results, "voice_consent_and_rights",
    "voice_note_narration_rights_basis_recorded", manifest,
    ["rights", "rights_basis_recorded"],
    "rights: the basis for the declared reproduction right is recorded in the record");

  // ---- Section 3: text_adaptation_for_listening ----
  boolCheck(results, "text_adaptation_for_listening",
    "voice_note_narration_abbreviations_expanded", manifest,
    ["adaptation", "abbreviations_expanded"],
    "adaptation: abbreviations in the source text were expanded for speech");
  boolCheck(results, "text_adaptation_for_listening",
    "voice_note_narration_long_sentences_broken", manifest,
    ["adaptation", "long_sentences_broken"],
    "adaptation: long sentences were broken up so the text sounds spoken, not printed");
  boolCheck(results, "text_adaptation_for_listening",
    "voice_note_narration_numbers_spelled_out", manifest,
    ["adaptation", "numbers_spelled_out"],
    "adaptation: numbers were spelled out for speech");
  boolCheck(results, "text_adaptation_for_listening",
    "voice_note_narration_links_removed_for_listening", manifest,
    ["adaptation", "links_removed"],
    "adaptation: links, which do not survive aloud, were removed");
  boolCheck(results, "text_adaptation_for_listening",
    "voice_note_narration_tables_and_formatting_removed_for_listening", manifest,
    ["adaptation", "tables_and_formatting_removed"],
    "adaptation: tables and formatting that do not survive aloud were removed");
  boolCheck(results, "text_adaptation_for_listening",
    "voice_note_narration_text_adapted_not_read_raw", manifest,
    ["adaptation", "text_adapted_not_read_raw"],
    "adaptation: the text was adapted for listening, not read raw from the page");
  boolCheck(results, "text_adaptation_for_listening",
    "voice_note_narration_adaptation_reviewed_for_meaning_preservation", manifest,
    ["adaptation", "adaptation_reviewed_for_meaning_preservation"],
    "adaptation: the adapted text was reviewed to confirm the source text's meaning was not changed");

  // ---- Section 4: segments_and_chunking ----
  boolCheck(results, "segments_and_chunking",
    "voice_note_narration_long_text_chunked_at_natural_breaks_where_long",
    manifest,
    ["chunking", "long_text_chunked_at_natural_breaks_where_long"],
    "chunking: long text was chunked into sections at natural breaks");
  boolCheck(results, "segments_and_chunking",
    "voice_note_narration_narrated_chunk_by_chunk", manifest,
    ["chunking", "narrated_chunk_by_chunk"],
    "chunking: the audio was narrated chunk by chunk, so a failure never loses the whole piece");
  check(results, "segments_and_chunking",
    "voice_note_narration_segments_list_declared", segmentsRaw, segIsList,
    segIsList && segCount !== null && segCount >= 1,
    "segments: the declared record names its segment rows — the list is present and names at least one segment; an absent list is missing evidence and an empty list declares no segmented production at all");
  const segIdPresent = segIsList &&
    segRows.every((c) => hasField(c, "segment_id"));
  check(results, "segments_and_chunking",
    "every_voice_note_narration_segment_id_unique", segmentsRaw, segIdPresent,
    segIsList && duplicateSegmentIds !== null &&
      duplicateSegmentIds.length === 0,
    "segments: no declared segment_id is owned by more than one row");
  const labelPresent = segIsList &&
    segRows.every((c) => hasField(c, "section_label"));
  check(results, "segments_and_chunking",
    "every_voice_note_narration_segment_section_label_declared", segmentsRaw,
    labelPresent,
    segIsList && segRows.every((c) => isPyDict(c) && nonemptyStr(c["section_label"])),
    "segments: every declared segment declares a non-empty section label naming the source section it narrates");
  const durationPresent = segIsList &&
    segRows.every((c) => hasField(c, "duration_seconds"));
  check(results, "segments_and_chunking",
    "every_voice_note_narration_segment_duration_positive", segmentsRaw,
    durationPresent,
    segIsList && segRows.every((c) => isPyDict(c) &&
      isNumber(c["duration_seconds"]) && (c["duration_seconds"] as number) > 0),
    "segments: every declared segment declares a positive duration in seconds — a segment with no duration declares no audio");
  const positionPresent = segIsList &&
    segRows.every((c) => hasField(c, "sequence_position"));
  check(results, "segments_and_chunking",
    "voice_note_narration_segment_sequence_complete", segmentsRaw,
    positionPresent, sequenceComplete(),
    "segments: the declared sequence positions cover exactly 1..N, each once — no section is missing, repeated, or out of sequence");

  // ---- Section 5: audio_spec_and_assembly ----
  check(results, "audio_spec_and_assembly",
    "voice_note_narration_audio_file_format_recognised",
    fileFormat, hasFormat,
    hasFormat && FILE_FORMATS.includes(fileFormat as string),
    "audio spec: the declared audio file format is one of mp3, wav, m4a, ogg, flac — the record's format vocabulary");
  boolCheck(results, "audio_spec_and_assembly",
    "voice_note_narration_audio_generated_through_voice_stack", manifest,
    ["assembly", "audio_generated_through_voice_stack"],
    "assembly: the audio was generated through the caller's voice stack");
  boolCheck(results, "audio_spec_and_assembly",
    "voice_note_narration_opening_spot_checked_for_clarity_and_pace", manifest,
    ["assembly", "opening_spot_checked_for_clarity_and_pace"],
    "assembly QC: the opening section was spot-checked for clarity and pace");
  boolCheck(results, "audio_spec_and_assembly",
    "voice_note_narration_middle_spot_checked_for_clarity_and_pace", manifest,
    ["assembly", "middle_spot_checked_for_clarity_and_pace"],
    "assembly QC: a middle section was spot-checked for clarity and pace");
  boolCheck(results, "audio_spec_and_assembly",
    "voice_note_narration_chunks_assembled_into_one_file", manifest,
    ["assembly", "chunks_assembled_into_one_file"],
    "assembly: the chunks were assembled into one audio file");
  boolCheck(results, "audio_spec_and_assembly",
    "voice_note_narration_assembled_order_verified", manifest,
    ["assembly", "assembled_order_verified"],
    "assembly: the assembled order of the chunks was verified");
  boolCheck(results, "audio_spec_and_assembly",
    "voice_note_narration_assembly_completeness_verified", manifest,
    ["assembly", "assembly_completeness_verified"],
    "assembly: the assembled file was confirmed complete — no section missing, repeated, or out of sequence");
  const totalPresent = hasTotal && segIsList &&
    segRows.every((c) => hasField(c, "duration_seconds"));
  check(results, "audio_spec_and_assembly",
    "voice_note_narration_total_duration_recomputes_from_segments",
    totalDeclared, totalPresent, totalRecomputes(),
    "assembly: the declared total duration recomputes exactly as the sum of the declared segment durations");

  // ---- Section 6: delivery_and_disclosure ----
  boolCheck(results, "delivery_and_disclosure",
    "voice_note_narration_audio_file_delivered", manifest,
    ["delivery", "audio_file_delivered"],
    "delivery: the finished audio file was delivered");
  boolCheck(results, "delivery_and_disclosure",
    "voice_note_narration_total_duration_stated_in_delivery", manifest,
    ["delivery", "total_duration_stated_in_delivery"],
    "delivery: the delivery states the audio's total duration");
  boolCheck(results, "delivery_and_disclosure",
    "voice_note_narration_played_through_voice_stack_only_if_requested",
    manifest,
    ["delivery", "played_through_voice_stack_only_if_requested"],
    "delivery: the audio was played through the voice stack instead of delivered as a file only if the caller asked for that");
  boolCheck(results, "delivery_and_disclosure",
    "voice_note_narration_recipient_matches_declared_audience", manifest,
    ["delivery", "recipient_matches_declared_audience"],
    "delivery: the audio was delivered to the declared audience and no one else");
  const [disclosure, hasDisclosure] = getPath(
    manifest, "delivery", "ai_voice_disclosure_made");
  if (hasScope && audienceScope === "includes_others") {
    check(results, "delivery_and_disclosure",
      "voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others",
      disclosure, hasDisclosure, disclosure === true,
      "disclosure: where the audience includes someone else, the message carrying the note states plainly that the voice is AI-generated — the skill's disclosure red line");
  } else {
    check(results, "delivery_and_disclosure",
      "voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others",
      audienceScope, hasScope, true,
      "audience declared self-only — no disclosure to another recipient is owed");
  }

  // ---- Section 7: red_lines ----
  const [consent, _hasConsent] = getPath(
    manifest, "voice", "voice_consent_declared");
  // Red-line class: a narration record must declare voice
  // consent. Absent fails exactly as declared-false fails —
  // this check is never merely missing.
  check(results, "red_lines",
    "voice_note_narration_record_declares_voice_consent",
    consent, true, consent === true,
    "red line (consent class): the record declares voice consent — a missing voice-consent declaration fails this check exactly as a declared absence of consent does, because a narration record must declare voice consent");
  falseCheck(results, "red_lines",
    "voice_note_narration_free_of_voice_cloned_or_imitated_without_consent",
    manifest,
    ["red_lines", "voice_cloned_or_imitated_without_consent_present"],
    "red line: no imitation or cloning of a real person's voice without their clear consent is present in the record");
  falseCheck(results, "red_lines",
    "voice_note_narration_free_of_voice_note_sent_to_other_without_ai_disclosure",
    manifest,
    ["red_lines", "voice_note_sent_to_other_without_ai_disclosure_present"],
    "red line: no voice note sent to someone else without the AI-voice disclosure is present in the record");
  falseCheck(results, "red_lines",
    "voice_note_narration_free_of_text_narrated_without_reproduction_right",
    manifest,
    ["red_lines", "text_narrated_without_reproduction_right_present"],
    "red line: no narration of text the caller does not have the right to reproduce as audio is present in the record");
  falseCheck(results, "red_lines",
    "voice_note_narration_free_of_generated_audio_presented_as_real_event_recording",
    manifest,
    ["red_lines", "generated_audio_presented_as_real_event_recording_present"],
    "red line: no generated audio presented as a recording of a real event is present in the record");
  falseCheck(results, "red_lines",
    "voice_note_narration_free_of_source_meaning_changed_in_adaptation",
    manifest,
    ["red_lines", "source_meaning_changed_in_adaptation_present"],
    "red line: no change to the meaning of the source text while adapting it for speech is present in the record");

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
    verdict = "VOICE_NOTE_NARRATION_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "VOICE_NOTE_NARRATION_SOUND";
  }

  const computedNames = [
    "voice_note_narration_production_kind_recognised",
    "voice_note_narration_audience_scope_recognised",
    "voice_note_narration_voice_kind_recognised",
    "voice_note_narration_segments_list_declared",
    "every_voice_note_narration_segment_id_unique",
    "every_voice_note_narration_segment_section_label_declared",
    "every_voice_note_narration_segment_duration_positive",
    "voice_note_narration_segment_sequence_complete",
    "voice_note_narration_audio_file_format_recognised",
    "voice_note_narration_total_duration_recomputes_from_segments",
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
    service: "voice-note-narration-audio",
    atom_version: "0.1.0",
    production_title: manifest["production_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    voice_note_segments_count: segCount,
    duplicate_voice_note_segment_ids: duplicateSegmentIds,
    voice_note_segments_without_section_label: segmentsWithoutSectionLabel,
    voice_note_segments_with_non_positive_duration: segmentsWithNonPositiveDuration,
    voice_note_segments_with_invalid_sequence_position: segmentsWithInvalidSequence,
    voice_note_segment_duration_total: fmt6(durationTotal),
    voice_note_total_duration_declared:
      hasTotal && isNumber(totalDeclared) ? fmt6(totalDeclared as number) : null,
    segment_sequence_coverage_ratio: fmt6(sequenceCoverageRatio),
    segment_section_label_ratio: fmt6(sectionLabelRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "VOICE NOTE NARRATION AUDIO",
    `production_title: ${pyStr(verdict.production_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
