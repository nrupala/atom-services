// Release pack changelog seal rollback — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/release-pack-changelog-seal-rollback/src/release_pack_changelog_seal_rollback.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values. Semver parts
// are compared as BigInt so arbitrarily large version components
// keep Python's arbitrary-precision integer semantics.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  release_label: "string",
  version_detail: {
    declared_version: "string",
    previous_version: "string",
    bump_kind: "string",
    breaking_change_in_pack: "boolean",
  },
  changelog_pack: {
    keep_a_changelog_layout_followed: "boolean",
    unreleased_backlog_maintained_continuously: "boolean",
    pack_release_notes_state_why_changes_matter: "boolean",
    pack_breaking_items_pair_migration_steps: "boolean",
  },
  changelog_entries: [{
    entry_heading: "string",
    entry_category: "string",
    entry_summary_present: "boolean",
    entry_version_heading: "string",
  }],
  seal_record: {
    pack_artifacts_hashed_and_signed_declared: "boolean",
    seal_manifest_generated_from_build_outputs: "boolean",
    declared_sealed_artifact_total: "number",
  },
  sealed_artifacts: [{
    artifact_filename: "string",
    checksum_algorithm: "string",
    checksum_value: "string",
    signature_recorded: "boolean",
  }],
  tag_and_attachment: {
    pack_tag_created_as_annotated: "boolean",
    pack_tag_signature_recorded_when_signing_key_exists: "boolean",
    seal_manifest_attached_to_pack_record: "boolean",
    signature_file_attached_to_pack_record: "boolean",
    pack_checksums_rechecked_before_announcement: "boolean",
  },
  rollback_detail: {
    rollback_path_written_before_rollout_began: "boolean",
    rollback_sequence_is_executable_as_written: "boolean",
    rollback_trigger_conditions_named_in_pack: "boolean",
  },
  rollback_steps: [{
    step_label: "string",
    step_order: "number",
    step_action_recorded: "boolean",
    step_verification_recorded: "boolean",
  }],
  rollout_record: {
    rollout_staging_or_canary_declared_for_pack: "boolean",
    rollout_approver_recorded_for_pack: "boolean",
    defined_health_window_stated_for_pack: "boolean",
    post_release_health_verification_completed_for_pack: "boolean",
    post_release_discrepancies_logged_for_pack: "boolean",
  },
  red_lines: {
    untagged_pack_release_present: "boolean",
    published_history_rewrite_present: "boolean",
    unattended_pack_deploy_present: "boolean",
  },
};

export const SECTIONS = [
  "version_stamp_and_bump_classification",
  "changelog_pack_completeness",
  "seal_manifest_integrity",
  "tag_signature_and_attachment",
  "rollback_sequence_detail",
  "staged_rollout_and_health_record",
  "pack_red_lines",
] as const;

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const HEX = /^[0-9a-fA-F]+$/;
const CHANGELOG_CATEGORIES: readonly string[] = [
  "Added", "Changed", "Deprecated", "Removed", "Fixed", "Security",
];
const CHECKSUM_HEX_LENGTHS: Record<string, number> = {
  sha256: 64,
  sha512: 128,
};

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
  release_label: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  changelog_entries_count: number | null;
  changelog_entries_without_summary: string[] | null;
  changelog_entries_with_unrecognised_category: string[] | null;
  changelog_entries_filed_under_other_version: string[] | null;
  duplicate_changelog_entry_headings: string[] | null;
  changelog_summary_coverage: string | null;
  recognised_category_coverage: string | null;
  sealed_artifacts_count: number | null;
  sealed_artifacts_with_malformed_checksum: string[] | null;
  sealed_artifacts_without_signature: string[] | null;
  duplicate_sealed_artifact_filenames: string[] | null;
  checksum_format_coverage: string | null;
  signature_coverage: string | null;
  rollback_steps_count: number | null;
  rollback_steps_without_action: string[] | null;
  rollback_steps_without_verification: string[] | null;
  duplicate_rollback_step_labels: string[] | null;
  rollback_action_coverage: string | null;
  rollback_verification_coverage: string | null;
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

function fieldOf(entry: unknown, field: string): unknown {
  return isPyDict(entry) ? entry[field] : undefined;
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

function parseSemver(value: unknown): [bigint, bigint, bigint] | null {
  if (typeof value !== "string") return null;
  const match = SEMVER.exec(value);
  if (!match) return null;
  return [BigInt(match[1]), BigInt(match[2]), BigInt(match[3])];
}

function semverGreater(
  a: [bigint, bigint, bigint],
  b: [bigint, bigint, bigint],
): boolean {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

function checksumFormatOk(entry: unknown): boolean {
  if (!isPyDict(entry)) return false;
  const algorithm = entry["checksum_algorithm"];
  const value = entry["checksum_value"];
  if (typeof algorithm !== "string" ||
      !(algorithm in CHECKSUM_HEX_LENGTHS) ||
      typeof value !== "string") {
    return false;
  }
  return value.length === CHECKSUM_HEX_LENGTHS[algorithm] &&
    HEX.test(value);
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const entry of rows) {
    if (isPyDict(entry) && typeof entry[field] === "string") {
      const nm = entry[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function rowNames(
  rows: unknown[],
  field: string,
  predicate: (entry: unknown) => boolean,
): string[] {
  return rows.filter(predicate).map((entry) =>
    isPyDict(entry) && typeof entry[field] === "string"
      ? (entry[field] as string)
      : "unnamed");
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [declaredVersion, hasDeclaredVersion] =
    getPath(manifest, "version_detail", "declared_version");
  const [previousVersion, hasPreviousVersion] =
    getPath(manifest, "version_detail", "previous_version");
  const [bumpKind, hasBumpKind] =
    getPath(manifest, "version_detail", "bump_kind");
  const [breaking, hasBreaking] =
    getPath(manifest, "version_detail", "breaking_change_in_pack");
  const parsedVersion = hasDeclaredVersion
    ? parseSemver(declaredVersion) : null;
  const parsedPrevious = hasPreviousVersion
    ? parseSemver(previousVersion) : null;

  const [entriesRaw, hasEntries] = getPath(manifest, "changelog_entries");
  const entriesIsList = hasEntries && Array.isArray(entriesRaw);
  const entryRows: unknown[] = entriesIsList ? (entriesRaw as unknown[]) : [];
  const entriesCount: number | null = entriesIsList ? entryRows.length : null;

  const [artifactsRaw, hasArtifacts] = getPath(manifest, "sealed_artifacts");
  const artifactsIsList = hasArtifacts && Array.isArray(artifactsRaw);
  const artifactRows: unknown[] =
    artifactsIsList ? (artifactsRaw as unknown[]) : [];
  const artifactsCount: number | null =
    artifactsIsList ? artifactRows.length : null;
  const [declaredTotal, hasDeclaredTotal] =
    getPath(manifest, "seal_record", "declared_sealed_artifact_total");

  const [stepsRaw, hasSteps] = getPath(manifest, "rollback_steps");
  const stepsIsList = hasSteps && Array.isArray(stepsRaw);
  const stepRows: unknown[] = stepsIsList ? (stepsRaw as unknown[]) : [];
  const stepsCount: number | null = stepsIsList ? stepRows.length : null;

  const entriesWithoutSummary: string[] | null = entriesIsList
    ? rowNames(entryRows, "entry_heading", (c) =>
        hasField(c, "entry_summary_present") &&
        fieldOf(c, "entry_summary_present") !== true)
    : null;
  const entriesWithUnrecognisedCategory: string[] | null = entriesIsList
    ? rowNames(entryRows, "entry_heading", (c) =>
        hasField(c, "entry_category") &&
        !CHANGELOG_CATEGORIES.includes(fieldOf(c, "entry_category") as string))
    : null;
  const entriesFiledUnderOtherVersion: string[] | null =
    entriesIsList && hasDeclaredVersion
      ? rowNames(entryRows, "entry_heading", (c) =>
          hasField(c, "entry_version_heading") &&
          fieldOf(c, "entry_version_heading") !== declaredVersion)
      : null;
  const duplicateEntryHeadings: string[] | null = entriesIsList
    ? duplicates(entryRows, "entry_heading") : null;
  const summaryCoverage: number | null =
    entriesIsList && entriesCount !== null && entriesCount > 0
      ? entryRows.filter((c) =>
          fieldOf(c, "entry_summary_present") === true).length / entriesCount
      : null;
  const recognisedCategoryCoverage: number | null =
    entriesIsList && entriesCount !== null && entriesCount > 0
      ? entryRows.filter((c) =>
          CHANGELOG_CATEGORIES.includes(
            fieldOf(c, "entry_category") as string)).length / entriesCount
      : null;

  const artifactsWithMalformedChecksum: string[] | null = artifactsIsList
    ? rowNames(artifactRows, "artifact_filename", (c) =>
        hasField(c, "checksum_algorithm") &&
        hasField(c, "checksum_value") && !checksumFormatOk(c))
    : null;
  const artifactsWithoutSignature: string[] | null = artifactsIsList
    ? rowNames(artifactRows, "artifact_filename", (c) =>
        hasField(c, "signature_recorded") &&
        fieldOf(c, "signature_recorded") !== true)
    : null;
  const duplicateArtifactFilenames: string[] | null = artifactsIsList
    ? duplicates(artifactRows, "artifact_filename") : null;
  const checksumFormatCoverage: number | null =
    artifactsIsList && artifactsCount !== null && artifactsCount > 0
      ? artifactRows.filter((c) => checksumFormatOk(c)).length /
          artifactsCount
      : null;
  const signatureCoverage: number | null =
    artifactsIsList && artifactsCount !== null && artifactsCount > 0
      ? artifactRows.filter((c) =>
          fieldOf(c, "signature_recorded") === true).length / artifactsCount
      : null;

  const stepsWithoutAction: string[] | null = stepsIsList
    ? rowNames(stepRows, "step_label", (c) =>
        hasField(c, "step_action_recorded") &&
        fieldOf(c, "step_action_recorded") !== true)
    : null;
  const stepsWithoutVerification: string[] | null = stepsIsList
    ? rowNames(stepRows, "step_label", (c) =>
        hasField(c, "step_verification_recorded") &&
        fieldOf(c, "step_verification_recorded") !== true)
    : null;
  const duplicateStepLabels: string[] | null = stepsIsList
    ? duplicates(stepRows, "step_label") : null;
  const actionCoverage: number | null =
    stepsIsList && stepsCount !== null && stepsCount > 0
      ? stepRows.filter((c) =>
          fieldOf(c, "step_action_recorded") === true).length / stepsCount
      : null;
  const verificationCoverage: number | null =
    stepsIsList && stepsCount !== null && stepsCount > 0
      ? stepRows.filter((c) =>
          fieldOf(c, "step_verification_recorded") === true).length /
          stepsCount
      : null;

  // ---- Section 1: version_stamp_and_bump_classification ----
  check(results, "version_stamp_and_bump_classification",
    "pack_version_is_wellformed_semver", declaredVersion,
    hasDeclaredVersion, parsedVersion !== null,
    "semver: the pack's declared version is well-formed MAJOR.MINOR.PATCH semver");
  check(results, "version_stamp_and_bump_classification",
    "pack_version_advances_from_previous_declared_version", previousVersion,
    hasDeclaredVersion && hasPreviousVersion,
    parsedVersion !== null && parsedPrevious !== null &&
      semverGreater(parsedVersion, parsedPrevious),
    "semver: the pack's declared version advances from the declared previous version");
  let deltaOk = false;
  if (parsedVersion !== null && parsedPrevious !== null) {
    const [vmaj, vmin, vpat] = parsedVersion;
    const [pmaj, pmin, ppat] = parsedPrevious;
    if (bumpKind === "major") {
      deltaOk = vmaj === pmaj + 1n && vmin === 0n && vpat === 0n;
    } else if (bumpKind === "minor") {
      deltaOk = vmaj === pmaj && vmin === pmin + 1n && vpat === 0n;
    } else if (bumpKind === "patch") {
      deltaOk = vmaj === pmaj && vmin === pmin && vpat === ppat + 1n;
    }
  }
  check(results, "version_stamp_and_bump_classification",
    "pack_bump_kind_matches_version_delta", bumpKind,
    hasDeclaredVersion && hasPreviousVersion && hasBumpKind,
    deltaOk,
    "semver: the declared bump kind matches the declared version delta — major resets minor/patch, minor resets patch, patch increments patch only");
  check(results, "version_stamp_and_bump_classification",
    "pack_bump_kind_follows_declared_breaking_flag", bumpKind,
    hasBumpKind && hasBreaking,
    breaking !== true || bumpKind === "major",
    "semver: a pack declaring a breaking change declares a major bump — MAJOR means breaking");

  // ---- Section 2: changelog_pack_completeness ----
  boolCheck(results, "changelog_pack_completeness",
    "keep_a_changelog_layout_followed", manifest,
    ["changelog_pack", "keep_a_changelog_layout_followed"],
    "changelog: the pack follows the Keep-a-Changelog layout");
  boolCheck(results, "changelog_pack_completeness",
    "unreleased_backlog_maintained_continuously", manifest,
    ["changelog_pack", "unreleased_backlog_maintained_continuously"],
    "changelog: the [Unreleased] backlog is maintained continuously, not reconstructed at release time");
  boolCheck(results, "changelog_pack_completeness",
    "pack_release_notes_state_why_changes_matter", manifest,
    ["changelog_pack", "pack_release_notes_state_why_changes_matter"],
    "release notes: the pack's user-facing notes state what changed and why it matters");
  boolCheck(results, "changelog_pack_completeness",
    "pack_breaking_items_pair_migration_steps", manifest,
    ["changelog_pack", "pack_breaking_items_pair_migration_steps"],
    "release notes: the pack's breaking items are paired with migration steps in the notes");
  check(results, "changelog_pack_completeness",
    "changelog_entry_rows_declared", entriesRaw, entriesIsList,
    entriesIsList && entriesCount !== null && entriesCount > 0,
    "changelog: the pack declares its changelog entry rows — the list is present and non-empty; a release pack ships at least one changelog entry");
  const categoryPresent = entriesIsList &&
    entryRows.every((c) => hasField(c, "entry_category"));
  check(results, "changelog_pack_completeness",
    "every_changelog_entry_uses_recognised_category", entriesRaw,
    categoryPresent,
    entriesIsList && entryRows.every((c) =>
      CHANGELOG_CATEGORIES.includes(fieldOf(c, "entry_category") as string)),
    "changelog entries: every declared entry's category is a Keep-a-Changelog category (Added / Changed / Deprecated / Removed / Fixed / Security)");
  const summaryPresent = entriesIsList &&
    entryRows.every((c) => hasField(c, "entry_summary_present"));
  check(results, "changelog_pack_completeness",
    "every_changelog_entry_carries_summary", entriesRaw, summaryPresent,
    entriesIsList && entryRows.every((c) =>
      fieldOf(c, "entry_summary_present") === true),
    "changelog entries: every declared entry carries a summary of the change");
  const filingPresent = entriesIsList && hasDeclaredVersion &&
    entryRows.every((c) => hasField(c, "entry_version_heading"));
  check(results, "changelog_pack_completeness",
    "every_changelog_entry_filed_under_pack_version", entriesRaw,
    filingPresent,
    entriesIsList && hasDeclaredVersion && entryRows.every((c) =>
      fieldOf(c, "entry_version_heading") === declaredVersion),
    "changelog entries: every declared entry is filed under the pack's declared version heading — entries moved under the version at release");
  const headingPresent = entriesIsList &&
    entryRows.every((c) => hasField(c, "entry_heading"));
  check(results, "changelog_pack_completeness",
    "no_changelog_entry_heading_duplicated", entriesRaw, headingPresent,
    entriesIsList && duplicateEntryHeadings !== null &&
      duplicateEntryHeadings.length === 0,
    "changelog entries: no declared entry heading is owned by more than one row");

  // ---- Section 3: seal_manifest_integrity ----
  boolCheck(results, "seal_manifest_integrity",
    "pack_artifacts_hashed_and_signed_declared", manifest,
    ["seal_record", "pack_artifacts_hashed_and_signed_declared"],
    "seal: the pack declares its build artifacts hashed and signed");
  boolCheck(results, "seal_manifest_integrity",
    "seal_manifest_generated_from_build_outputs", manifest,
    ["seal_record", "seal_manifest_generated_from_build_outputs"],
    "seal: the pack's seal manifest is generated from the build outputs it seals");
  check(results, "seal_manifest_integrity",
    "sealed_artifact_rows_declared", artifactsRaw, artifactsIsList,
    artifactsIsList && artifactsCount !== null && artifactsCount > 0,
    "seal: the pack declares its sealed artifact rows — the list is present and non-empty; the skill seals build artifacts");
  const checksumPresent = artifactsIsList &&
    artifactRows.every((c) => hasField(c, "checksum_algorithm") &&
      hasField(c, "checksum_value"));
  check(results, "seal_manifest_integrity",
    "every_sealed_artifact_checksum_matches_declared_algorithm_format",
    artifactsRaw, checksumPresent,
    artifactsIsList && artifactRows.every((c) => checksumFormatOk(c)),
    "sealed artifacts: every declared checksum matches the format of the algorithm declared on its row (sha256: 64 hex digits; sha512: 128 hex digits) — format only; no real artifact is hashed here");
  const signaturePresent = artifactsIsList &&
    artifactRows.every((c) => hasField(c, "signature_recorded"));
  check(results, "seal_manifest_integrity",
    "every_sealed_artifact_signature_recorded", artifactsRaw,
    signaturePresent,
    artifactsIsList && artifactRows.every((c) =>
      fieldOf(c, "signature_recorded") === true),
    "sealed artifacts: every declared artifact records its signature in the pack");
  const filenamePresent = artifactsIsList &&
    artifactRows.every((c) => hasField(c, "artifact_filename"));
  check(results, "seal_manifest_integrity",
    "no_sealed_artifact_filename_duplicated", artifactsRaw, filenamePresent,
    artifactsIsList && duplicateArtifactFilenames !== null &&
      duplicateArtifactFilenames.length === 0,
    "sealed artifacts: no declared artifact filename is owned by more than one row");
  check(results, "seal_manifest_integrity",
    "seal_artifact_count_matches_pack_manifest_total", declaredTotal,
    artifactsIsList && hasDeclaredTotal,
    artifactsIsList && hasDeclaredTotal &&
      declaredTotal === artifactsCount,
    "seal: the seal record's declared artifact total equals the number of declared sealed artifact rows");

  // ---- Section 4: tag_signature_and_attachment ----
  boolCheck(results, "tag_signature_and_attachment",
    "pack_tag_created_as_annotated", manifest,
    ["tag_and_attachment", "pack_tag_created_as_annotated"],
    "tag: the pack's release tag is created as an annotated tag");
  boolCheck(results, "tag_signature_and_attachment",
    "pack_tag_signature_recorded_when_signing_key_exists", manifest,
    ["tag_and_attachment",
     "pack_tag_signature_recorded_when_signing_key_exists"],
    "tag: the pack records the tag as signed when signing keys exist");
  boolCheck(results, "tag_signature_and_attachment",
    "seal_manifest_attached_to_pack_record", manifest,
    ["tag_and_attachment", "seal_manifest_attached_to_pack_record"],
    "seal: the manifest is attached to the pack's release record");
  boolCheck(results, "tag_signature_and_attachment",
    "signature_file_attached_to_pack_record", manifest,
    ["tag_and_attachment", "signature_file_attached_to_pack_record"],
    "seal: the signature file is attached to the pack's release record");
  boolCheck(results, "tag_signature_and_attachment",
    "pack_checksums_rechecked_before_announcement", manifest,
    ["tag_and_attachment",
     "pack_checksums_rechecked_before_announcement"],
    "seal: the pack's checksums and signature are rechecked before the release is announced");

  // ---- Section 5: rollback_sequence_detail ----
  boolCheck(results, "rollback_sequence_detail",
    "rollback_path_written_before_rollout_began", manifest,
    ["rollback_detail", "rollback_path_written_before_rollout_began"],
    "rollback: the pack's rollback path was written before the rollout began");
  boolCheck(results, "rollback_sequence_detail",
    "rollback_sequence_is_executable_as_written", manifest,
    ["rollback_detail", "rollback_sequence_is_executable_as_written"],
    "rollback: the pack's rollback sequence is executable as written — the plan is testable");
  boolCheck(results, "rollback_sequence_detail",
    "rollback_trigger_conditions_named_in_pack", manifest,
    ["rollback_detail", "rollback_trigger_conditions_named_in_pack"],
    "rollback: the pack names the conditions that trigger a rollback");
  check(results, "rollback_sequence_detail",
    "rollback_step_rows_declared", stepsRaw, stepsIsList,
    stepsIsList && stepsCount !== null && stepsCount > 0,
    "rollback: the pack declares its rollback step rows — the list is present and non-empty; a rollback path has at least one step");
  const orderPresent = stepsIsList &&
    stepRows.every((c) => hasField(c, "step_order"));
  let ordersOk = false;
  if (stepsIsList && orderPresent && stepsCount !== null) {
    const orders = stepRows.map((c) => fieldOf(c, "step_order") as number);
    const sorted = [...orders].sort((a, b) => a - b);
    ordersOk = sorted.length === stepsCount &&
      sorted.every((v, i) => v === i + 1);
  }
  check(results, "rollback_sequence_detail",
    "rollback_step_orders_form_contiguous_sequence", stepsRaw,
    orderPresent, ordersOk,
    "rollback steps: the declared step orders form the contiguous sequence 1..n — no gaps, no repeats");
  const actionPresent = stepsIsList &&
    stepRows.every((c) => hasField(c, "step_action_recorded"));
  check(results, "rollback_sequence_detail",
    "every_rollback_step_records_its_action", stepsRaw, actionPresent,
    stepsIsList && stepRows.every((c) =>
      fieldOf(c, "step_action_recorded") === true),
    "rollback steps: every declared step records the action it performs");
  const verificationPresent = stepsIsList &&
    stepRows.every((c) => hasField(c, "step_verification_recorded"));
  check(results, "rollback_sequence_detail",
    "every_rollback_step_records_post_step_verification", stepsRaw,
    verificationPresent,
    stepsIsList && stepRows.every((c) =>
      fieldOf(c, "step_verification_recorded") === true),
    "rollback steps: every declared step records how its effect is verified after the step runs");
  const labelPresent = stepsIsList &&
    stepRows.every((c) => hasField(c, "step_label"));
  check(results, "rollback_sequence_detail",
    "no_rollback_step_label_duplicated", stepsRaw, labelPresent,
    stepsIsList && duplicateStepLabels !== null &&
      duplicateStepLabels.length === 0,
    "rollback steps: no declared step label is owned by more than one row");

  // ---- Section 6: staged_rollout_and_health_record ----
  boolCheck(results, "staged_rollout_and_health_record",
    "rollout_staging_or_canary_declared_for_pack", manifest,
    ["rollout_record", "rollout_staging_or_canary_declared_for_pack"],
    "rollout: the pack declares a canary or staged rollout where feasible");
  boolCheck(results, "staged_rollout_and_health_record",
    "rollout_approver_recorded_for_pack", manifest,
    ["rollout_record", "rollout_approver_recorded_for_pack"],
    "rollout: the pack's rollout record names its approver");
  boolCheck(results, "staged_rollout_and_health_record",
    "defined_health_window_stated_for_pack", manifest,
    ["rollout_record", "defined_health_window_stated_for_pack"],
    "post-release: the pack states a defined health verification window");
  boolCheck(results, "staged_rollout_and_health_record",
    "post_release_health_verification_completed_for_pack", manifest,
    ["rollout_record",
     "post_release_health_verification_completed_for_pack"],
    "post-release: the pack records the post-release health verification as done");
  boolCheck(results, "staged_rollout_and_health_record",
    "post_release_discrepancies_logged_for_pack", manifest,
    ["rollout_record", "post_release_discrepancies_logged_for_pack"],
    "post-release: the pack logs discrepancies and records the loops closed");

  // ---- Section 7: pack_red_lines ----
  falseCheck(results, "pack_red_lines",
    "no_untagged_pack_release_in_record", manifest,
    ["red_lines", "untagged_pack_release_present"],
    "red line: no untagged release of the pack is present in the record");
  falseCheck(results, "pack_red_lines",
    "no_published_history_rewrite_in_record", manifest,
    ["red_lines", "published_history_rewrite_present"],
    "red line: no rewritten history on a published branch is present in the record");
  falseCheck(results, "pack_red_lines",
    "no_unattended_pack_deploy_in_record", manifest,
    ["red_lines", "unattended_pack_deploy_present"],
    "red line: no deploy of the pack without human approval is present in the record — deploys stay HITL");

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
    verdict = "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY";
  }

  const computedNames = [
    "pack_version_is_wellformed_semver",
    "pack_version_advances_from_previous_declared_version",
    "pack_bump_kind_matches_version_delta",
    "pack_bump_kind_follows_declared_breaking_flag",
    "changelog_entry_rows_declared",
    "every_changelog_entry_uses_recognised_category",
    "every_changelog_entry_carries_summary",
    "every_changelog_entry_filed_under_pack_version",
    "no_changelog_entry_heading_duplicated",
    "sealed_artifact_rows_declared",
    "every_sealed_artifact_checksum_matches_declared_algorithm_format",
    "every_sealed_artifact_signature_recorded",
    "no_sealed_artifact_filename_duplicated",
    "seal_artifact_count_matches_pack_manifest_total",
    "rollback_step_rows_declared",
    "rollback_step_orders_form_contiguous_sequence",
    "every_rollback_step_records_its_action",
    "every_rollback_step_records_post_step_verification",
    "no_rollback_step_label_duplicated",
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
    service: "release-pack-changelog-seal-rollback",
    atom_version: "0.1.0",
    release_label: manifest["release_label"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    changelog_entries_count: entriesCount,
    changelog_entries_without_summary: entriesWithoutSummary,
    changelog_entries_with_unrecognised_category:
      entriesWithUnrecognisedCategory,
    changelog_entries_filed_under_other_version:
      entriesFiledUnderOtherVersion,
    duplicate_changelog_entry_headings: duplicateEntryHeadings,
    changelog_summary_coverage: fmt6(summaryCoverage),
    recognised_category_coverage: fmt6(recognisedCategoryCoverage),
    sealed_artifacts_count: artifactsCount,
    sealed_artifacts_with_malformed_checksum:
      artifactsWithMalformedChecksum,
    sealed_artifacts_without_signature: artifactsWithoutSignature,
    duplicate_sealed_artifact_filenames: duplicateArtifactFilenames,
    checksum_format_coverage: fmt6(checksumFormatCoverage),
    signature_coverage: fmt6(signatureCoverage),
    rollback_steps_count: stepsCount,
    rollback_steps_without_action: stepsWithoutAction,
    rollback_steps_without_verification: stepsWithoutVerification,
    duplicate_rollback_step_labels: duplicateStepLabels,
    rollback_action_coverage: fmt6(actionCoverage),
    rollback_verification_coverage: fmt6(verificationCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "RELEASE PACK CHANGELOG SEAL ROLLBACK",
    `release_label: ${pyStr(verdict.release_label ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
