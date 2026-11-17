// Local voice stack engineering pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/local-voice-stack-engineering-pack/src/local_voice_stack_engineering_pack.py
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
  stack: "string",
  pipeline: {
    tts_stt_or_both_scope_declared: "boolean",
    streaming_vs_file_output_declared: "boolean",
    local_first_by_default: "boolean",
  },
  engine_selection: {
    quality_latency_footprint_evaluated: "boolean",
    language_coverage_addressed: "boolean",
  },
  engines: [{
    name: "string",
    license_cleared_for_commercial_use: "boolean",
    evaluated_on_own_golden_sentences: "boolean",
    is_voice_cloning: "boolean",
    cloning_consent_recorded: "boolean",
  }],
  cloning: {
    impersonation_present: "boolean",
    covert_recording_present: "boolean",
    synthetic_audio_disclosure_where_required: "boolean",
    voice_profiles_encrypted_at_rest: "boolean",
    deletion_honored: "boolean",
  },
  audio_engineering: {
    sample_rate_and_format_choices_declared: "boolean",
    loudness_normalization_applied: "boolean",
    chunking_for_long_text_with_pauses: "boolean",
    caching_synthesized_segments_for_repeat_text: "boolean",
  },
  latency: {
    time_to_first_audio_budget_stated: "boolean",
    latency_measured_against_stated_budget: "boolean",
    chunked_synthesis: "boolean",
    assistant_interactive_use_present: "boolean",
    interruption_barge_in_handling: "boolean",
  },
  accessibility: {
    speed_controls_present: "boolean",
    pitch_controls_present: "boolean",
    captions_or_transcripts_wired: "boolean",
    keyboard_operable_players: "boolean",
  },
  testing: {
    golden_audio_regressions_in_test_loop: "boolean",
    golden_hash_and_human_spot_checks: "boolean",
    noisy_input_stt_tests: "boolean",
    pronunciation_dictionaries_for_names_numbers_code: "boolean",
  },
};

export const SECTIONS = [
  "pipeline_and_engine_selection",
  "cloning_consent_and_ethics",
  "audio_engineering_and_latency",
  "accessibility",
  "testing_and_quality_gates",
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
  stack: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  engines_count: number | null;
  engines_without_license_clearance: string[] | null;
  license_coverage: string | null;
  engines_without_golden_sentence_evaluation: string[] | null;
  golden_evaluation_coverage: string | null;
  cloning_engines_without_consent_recorded: string[] | null;
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
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
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

  const [enginesRaw, hasEngines] = getPath(manifest, "engines");
  const enginesIsList = hasEngines && Array.isArray(enginesRaw);
  const rows: unknown[] = enginesIsList ? (enginesRaw as unknown[]) : [];
  const enginesCount: number | null = enginesIsList ? rows.length : null;

  const enginesWithoutLicense: string[] | null = enginesIsList
    ? rows.filter((c) => hasField(c, "license_cleared_for_commercial_use") &&
        (c as Record<string, unknown>)["license_cleared_for_commercial_use"] !== true)
        .map(rowName)
    : null;
  const enginesWithoutGolden: string[] | null = enginesIsList
    ? rows.filter((c) => hasField(c, "evaluated_on_own_golden_sentences") &&
        (c as Record<string, unknown>)["evaluated_on_own_golden_sentences"] !== true)
        .map(rowName)
    : null;
  const cloningRows = rows.filter(
    (c) => isPyDict(c) && c["is_voice_cloning"] === true);
  const cloningWithoutConsent: string[] | null = enginesIsList
    ? cloningRows.filter((c) => hasField(c, "cloning_consent_recorded") &&
        (c as Record<string, unknown>)["cloning_consent_recorded"] !== true)
        .map(rowName)
    : null;
  const licenseCoverage: number | null =
    enginesIsList && enginesCount !== null && enginesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["license_cleared_for_commercial_use"] === true).length / enginesCount
      : null;
  const goldenCoverage: number | null =
    enginesIsList && enginesCount !== null && enginesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["evaluated_on_own_golden_sentences"] === true).length / enginesCount
      : null;

  // ---- Section 1: pipeline_and_engine_selection ----
  boolCheck(results, "pipeline_and_engine_selection",
    "pipeline_scope_declared", manifest,
    ["pipeline", "tts_stt_or_both_scope_declared"],
    "pipeline first: the pipeline scope — TTS (synthesis), STT (transcription), or both — is declared");
  boolCheck(results, "pipeline_and_engine_selection",
    "output_mode_declared", manifest,
    ["pipeline", "streaming_vs_file_output_declared"],
    "pipeline first: streaming vs file output is declared");
  boolCheck(results, "pipeline_and_engine_selection",
    "local_first_by_default", manifest,
    ["pipeline", "local_first_by_default"],
    "pipeline first: device-side vs server is decided local-first by default — run it local where it matters");
  boolCheck(results, "pipeline_and_engine_selection",
    "quality_latency_footprint_evaluated", manifest,
    ["engine_selection", "quality_latency_footprint_evaluated"],
    "engine selection: quality vs latency vs footprint (CPU/GPU) is evaluated");
  boolCheck(results, "pipeline_and_engine_selection",
    "language_coverage_addressed", manifest,
    ["engine_selection", "language_coverage_addressed"],
    "engine selection: language coverage is addressed");
  check(results, "pipeline_and_engine_selection",
    "engines_declared", enginesRaw, enginesIsList,
    enginesIsList && (enginesCount as number) > 0,
    "the declared record names its engines — the engines list is present and non-empty");
  const licensePresent = enginesIsList &&
    rows.every((c) => hasField(c, "license_cleared_for_commercial_use"));
  check(results, "pipeline_and_engine_selection",
    "every_engine_license_cleared_for_commercial_use", enginesRaw,
    licensePresent,
    enginesIsList && (enginesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        c["license_cleared_for_commercial_use"] === true),
    "engine selection / quality gate: every declared engine row declares its license cleared for the intended use (commercial)");
  const goldenPresent = enginesIsList &&
    rows.every((c) => hasField(c, "evaluated_on_own_golden_sentences"));
  check(results, "pipeline_and_engine_selection",
    "every_engine_evaluated_on_own_golden_sentences", enginesRaw,
    goldenPresent,
    enginesIsList && (enginesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        c["evaluated_on_own_golden_sentences"] === true),
    "engine selection: every declared engine row declares evaluation on the caller's own golden sentences — not vendor demos");

  // ---- Section 2: cloning_consent_and_ethics ----
  falseCheck(results, "cloning_consent_and_ethics",
    "no_impersonation", manifest,
    ["cloning", "impersonation_present"],
    "cloning ethics & law / red line: no impersonation is present in the declared design");
  falseCheck(results, "cloning_consent_and_ethics",
    "no_covert_recording", manifest,
    ["cloning", "covert_recording_present"],
    "red line: no covert recording is present in the declared design");
  boolCheck(results, "cloning_consent_and_ethics",
    "synthetic_audio_disclosure_where_required", manifest,
    ["cloning", "synthetic_audio_disclosure_where_required"],
    "cloning ethics & law / red line: synthetic audio is disclosed where required — where context demands it");
  boolCheck(results, "cloning_consent_and_ethics",
    "voice_profiles_encrypted_at_rest", manifest,
    ["cloning", "voice_profiles_encrypted_at_rest"],
    "cloning ethics & law: voice profiles are encrypted at rest — cloned voices are treated as the sensitive thing they are");
  boolCheck(results, "cloning_consent_and_ethics",
    "deletion_honored", manifest,
    ["cloning", "deletion_honored"],
    "cloning ethics & law: deletion of voice profiles is honored");
  const cloningGatePresent = enginesIsList &&
    rows.every((c) => hasField(c, "is_voice_cloning"));
  const cloningPresent = enginesIsList && cloningGatePresent &&
    cloningRows.every((c) => hasField(c, "cloning_consent_recorded"));
  check(results, "cloning_consent_and_ethics",
    "every_cloning_engine_has_consent_recorded", enginesRaw,
    cloningPresent,
    enginesIsList &&
      cloningRows.every((c) => isPyDict(c) &&
        c["cloning_consent_recorded"] === true),
    "cloning ethics & law / quality gate / red line: every engine row declared as a voice-cloning engine declares explicit, recorded consent for the real-person voice — never clone without consent");

  // ---- Section 3: audio_engineering_and_latency ----
  boolCheck(results, "audio_engineering_and_latency",
    "sample_rate_and_format_choices_declared", manifest,
    ["audio_engineering", "sample_rate_and_format_choices_declared"],
    "audio engineering: sample-rate/format choices (wav/opus) are declared");
  boolCheck(results, "audio_engineering_and_latency",
    "loudness_normalization_applied", manifest,
    ["audio_engineering", "loudness_normalization_applied"],
    "audio engineering: loudness normalization is applied");
  boolCheck(results, "audio_engineering_and_latency",
    "chunking_for_long_text_with_pauses", manifest,
    ["audio_engineering", "chunking_for_long_text_with_pauses"],
    "audio engineering: chunking for long text (keep-alive + pauses) is in place");
  boolCheck(results, "audio_engineering_and_latency",
    "caching_synthesized_segments_for_repeat_text", manifest,
    ["audio_engineering", "caching_synthesized_segments_for_repeat_text"],
    "audio engineering: synthesized segments are cached for repeat text");
  boolCheck(results, "audio_engineering_and_latency",
    "time_to_first_audio_budget_stated", manifest,
    ["latency", "time_to_first_audio_budget_stated"],
    "latency budgets: a time-to-first-audio target for interactive use is stated");
  boolCheck(results, "audio_engineering_and_latency",
    "latency_measured_against_stated_budget", manifest,
    ["latency", "latency_measured_against_stated_budget"],
    "latency budgets / quality gate: latency is measured against a stated budget — measure latency honestly");
  boolCheck(results, "audio_engineering_and_latency",
    "chunked_synthesis", manifest,
    ["latency", "chunked_synthesis"],
    "latency budgets: chunked synthesis is used");
  gatedBoolCheck(results, "audio_engineering_and_latency",
    "interruption_barge_in_when_assistant_use", manifest,
    ["latency", "assistant_interactive_use_present"],
    ["latency", "interruption_barge_in_handling"],
    "latency budgets: interruption/barge-in handling is in place when assistant interactive use is declared present",
    "no assistant interactive use declared");

  // ---- Section 4: accessibility ----
  boolCheck(results, "accessibility",
    "speed_controls_present", manifest,
    ["accessibility", "speed_controls_present"],
    "accessibility / quality gate: speed controls are present");
  boolCheck(results, "accessibility",
    "pitch_controls_present", manifest,
    ["accessibility", "pitch_controls_present"],
    "accessibility / quality gate: pitch controls are present");
  boolCheck(results, "accessibility",
    "captions_or_transcripts_wired", manifest,
    ["accessibility", "captions_or_transcripts_wired"],
    "accessibility / quality gate: captions/transcripts from STT are wired");
  boolCheck(results, "accessibility",
    "keyboard_operable_players", manifest,
    ["accessibility", "keyboard_operable_players"],
    "accessibility: players are keyboard-operable — audio users are users");

  // ---- Section 5: testing_and_quality_gates ----
  boolCheck(results, "testing_and_quality_gates",
    "golden_audio_regressions_in_test_loop", manifest,
    ["testing", "golden_audio_regressions_in_test_loop"],
    "testing / quality gate: golden-sample regressions are in the test loop");
  boolCheck(results, "testing_and_quality_gates",
    "golden_hash_and_human_spot_checks", manifest,
    ["testing", "golden_hash_and_human_spot_checks"],
    "testing: golden-audio regressions use hash + human spot-checks");
  boolCheck(results, "testing_and_quality_gates",
    "noisy_input_stt_tests", manifest,
    ["testing", "noisy_input_stt_tests"],
    "testing: noisy-input STT tests are run");
  boolCheck(results, "testing_and_quality_gates",
    "pronunciation_dictionaries_for_names_numbers_code", manifest,
    ["testing", "pronunciation_dictionaries_for_names_numbers_code"],
    "testing: pronunciation dictionaries for names/numbers/code are in place");

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
    verdict = "LOCAL_VOICE_STACK_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "LOCAL_VOICE_STACK_SOUND";
  }

  const computedNames = [
    "engines_declared",
    "every_engine_license_cleared_for_commercial_use",
    "every_engine_evaluated_on_own_golden_sentences",
    "every_cloning_engine_has_consent_recorded",
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
    service: "local-voice-stack-engineering-pack",
    atom_version: "0.1.0",
    stack: manifest["stack"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    engines_count: enginesCount,
    engines_without_license_clearance: enginesWithoutLicense,
    license_coverage: fmt6(licenseCoverage),
    engines_without_golden_sentence_evaluation: enginesWithoutGolden,
    golden_evaluation_coverage: fmt6(goldenCoverage),
    cloning_engines_without_consent_recorded: cloningWithoutConsent,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "LOCAL VOICE STACK ENGINEERING PACK",
    `stack: ${pyStr(verdict.stack ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
