// Link rot scan and notarized archive — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/link-rot-scan-and-notarized-archive/src/
// link_rot_scan_and_notarized_archive.py (evaluate() + stamp()).
// No logic changes: every verdict, section outcome, per-check status,
// evidence string and the summary string are byte-identical to the
// Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  site: "string",
  scan: {
    scans_scheduled: "boolean",
    scan_records_status: "boolean",
    scan_records_content_hash: "boolean",
    dashboard_lists_rot_with_owners: "boolean",
    last_scan_within_cadence: "boolean",
  },
  links: [{
    id: "string",
    url: "string",
    is_published_citation: "boolean",
    observed_status: "string",
    archived: "boolean",
    capture_hash_present: "boolean",
    capture_timestamp_present: "boolean",
    capture_at_cite_time: "boolean",
    canonicalized: "boolean",
    stable_id_present: "boolean",
    content_hash: "string",
    canonical_url: "string",
    notarized: "boolean",
    repair_action: "string",
    repair_logged: "boolean",
  }],
  archive: {
    capture_format_warc_or_singlefile: "boolean",
    fallback_chain_configured: "boolean",
  },
  canonicalization: {
    tracker_params_stripped: "boolean",
    redirects_resolved: "boolean",
    dedupe_by_content_hash: "boolean",
  },
  notarization: {
    hash_algorithm_sha256: "boolean",
    timestamp_source: "string",
    evidence_bundle_complete: "boolean",
    tool_versions_recorded: "boolean",
    verification_recipe_published: "boolean",
  },
  serving: {
    as_seen_views_available: "boolean",
    live_vs_archive_diff_available: "boolean",
    provenance_badge_shows_capture_date: "boolean",
    provenance_badge_shows_verification_status: "boolean",
    archived_presented_as_current: "boolean",
    authorship_preserved: "boolean",
  },
  repair: {
    repairs_logged: "boolean",
    silent_drops_made: "boolean",
  },
  compliance: {
    robots_and_tos_honored: "boolean",
    rate_limits_respected: "boolean",
    access_controls_bypassed: "boolean",
    fabricated_captures_present: "boolean",
  },
};

export const SECTIONS = [
  "scan_coverage",
  "archive_capture",
  "canonicalization",
  "notarization",
  "honest_serving",
  "repair_and_compliance",
] as const;

export const OBSERVED_STATUSES = [
  "ok", "dead", "moved", "soft_404", "paywalled", "hijacked",
] as const;

export const ROTTED_STATUSES = [
  "dead", "moved", "soft_404", "hijacked",
] as const;

export const REPAIR_ACTIONS = [
  "none_needed", "archived_copy", "updated_canonical",
  "removal_note", "none",
] as const;

export const REPAIR_DONE_ACTIONS = [
  "archived_copy", "updated_canonical", "removal_note",
] as const;

export const TIMESTAMP_SOURCES = [
  "rfc3161_tsa", "transparency_log",
] as const;

const LINK_BOOL_FIELDS = [
  "is_published_citation", "archived", "capture_hash_present",
  "capture_timestamp_present", "capture_at_cite_time",
  "canonicalized", "stable_id_present", "notarized", "repair_logged",
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
  site: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  links_evaluated: number;
  citations_total: number;
  rotted_citations: number;
  unarchived_citations: number;
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

function isBool(value: unknown): boolean {
  return typeof value === "boolean";
}

function isNonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

type LinkRow = Record<string, unknown>;

function linkComplete(link: unknown): link is LinkRow {
  if (!isPyDict(link)) return false;
  if (!isNonemptyStr(link["id"])) return false;
  if (!isNonemptyStr(link["url"])) return false;
  if (!(OBSERVED_STATUSES as readonly unknown[]).includes(link["observed_status"])) {
    return false;
  }
  for (const field of LINK_BOOL_FIELDS) {
    if (!isBool(link[field])) return false;
  }
  if (!isNonemptyStr(link["content_hash"])) return false;
  if (!isNonemptyStr(link["canonical_url"])) return false;
  if (!(REPAIR_ACTIONS as readonly unknown[]).includes(link["repair_action"])) {
    return false;
  }
  return true;
}

type LinksState = "none" | "incomplete" | "ok";

function analyzeLinks(
  manifest: Record<string, unknown>,
): [LinksState, LinkRow[]] {
  const [links, hasLinks] = getPath(manifest, "links");
  if (!hasLinks || !Array.isArray(links) || links.length === 0) {
    return ["none", []];
  }
  const complete = links.filter((row) => linkComplete(row)) as LinkRow[];
  if (complete.length !== links.length) return ["incomplete", complete];
  return ["ok", complete];
}

function computedCheck(
  results: CheckResult[],
  section: string,
  name: string,
  state: LinksState,
  ok: boolean | null,
  evidence: string,
  missingEvidence: string,
  naEvidence?: string,
): void {
  if (state === "none") {
    check(results, section, name, null, false, false, "no links declared");
  } else if (state === "incomplete") {
    check(results, section, name, null, false, false, missingEvidence);
  } else if (ok === null) {
    check(results, section, name, null, true, true, naEvidence as string);
  } else {
    check(results, section, name, null, true, ok, evidence);
  }
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [state, completeLinks] = analyzeLinks(manifest);
  const citations = completeLinks.filter(
    (row) => row["is_published_citation"] === true,
  );
  const rottedCitations = citations.filter((row) =>
    (ROTTED_STATUSES as readonly unknown[]).includes(row["observed_status"]),
  );
  const unarchived = citations.filter(
    (row) =>
      !(
        row["archived"] === true &&
        row["capture_hash_present"] === true &&
        row["capture_timestamp_present"] === true
      ),
  );

  // ---- Section 1: scan_coverage ----
  boolCheck(results, "scan_coverage", "scans_scheduled",
    manifest, ["scan", "scans_scheduled"],
    "scheduled scans (HEAD/GET) for internal and external links");
  boolCheck(results, "scan_coverage", "scan_records_status",
    manifest, ["scan", "scan_records_status"],
    "scan records the observed status of every link");
  boolCheck(results, "scan_coverage", "scan_records_content_hash",
    manifest, ["scan", "scan_records_content_hash"],
    "scan records a content hash for every link");
  boolCheck(results, "scan_coverage",
    "dashboard_lists_rot_with_owners", manifest,
    ["scan", "dashboard_lists_rot_with_owners"],
    "quality gate: dashboard lists dead/moved/hijacked links with owners");
  boolCheck(results, "scan_coverage", "scan_cadence_current",
    manifest, ["scan", "last_scan_within_cadence"],
    "the most recent scan ran within its declared cadence");
  computedCheck(
    results, "scan_coverage", "links_complete", state, true,
    "every link row carries an id, url, observed status, archive, canonicalization, notarization, and repair record",
    "a link row is missing its id, url, observed status, archive, canonicalization, notarization, or repair fields");

  // ---- Section 2: archive_capture ----
  boolCheck(results, "archive_capture",
    "captures_in_warc_or_singlefile", manifest,
    ["archive", "capture_format_warc_or_singlefile"],
    "captures stored as WARC or SingleFile at save time");
  boolCheck(results, "archive_capture", "fallback_chain_configured",
    manifest, ["archive", "fallback_chain_configured"],
    "fallback chain: original, then archive.org, then other public archives");
  let archivedOk: boolean | null = null;
  if (state === "ok") {
    archivedOk = citations.length === 0 ? true : unarchived.length === 0;
  }
  computedCheck(
    results, "archive_capture",
    "citations_archived_with_hash_and_timestamp", state,
    archivedOk,
    "quality gate: every published citation has an archived capture with hash and timestamp",
    "a link row is incomplete, so citation archiving cannot be verified",
    "no published citations declared");
  let citeTimeOk: boolean | null = null;
  if (state === "ok") {
    citeTimeOk =
      citations.length === 0
        ? true
        : citations.every((row) => row["capture_at_cite_time"] === true);
  }
  computedCheck(
    results, "archive_capture", "citations_captured_at_cite_time",
    state, citeTimeOk,
    "captures taken at cite time, when saved — not later",
    "a link row is incomplete, so cite-time capture cannot be verified",
    "no published citations declared");

  // ---- Section 3: canonicalization ----
  boolCheck(results, "canonicalization", "tracker_params_stripped",
    manifest, ["canonicalization", "tracker_params_stripped"],
    "URLs normalized: tracker parameters stripped");
  boolCheck(results, "canonicalization", "redirects_resolved",
    manifest, ["canonicalization", "redirects_resolved"],
    "URLs normalized: redirects resolved");
  boolCheck(results, "canonicalization", "dedupe_by_content_hash",
    manifest, ["canonicalization", "dedupe_by_content_hash"],
    "dedupe by content hash");
  let canonOk: boolean | null = null;
  if (state === "ok") {
    canonOk = completeLinks.every(
      (row) =>
        row["canonicalized"] === true && row["stable_id_present"] === true,
    );
  }
  computedCheck(
    results, "canonicalization",
    "links_canonicalized_with_stable_ids", state, canonOk,
    "every link is canonicalized and carries a stable internal ID, so links survive URL changes",
    "a link row is incomplete, so canonicalization cannot be verified");
  const seenHashes = new Map<string, unknown>();
  let dedupeConflict = false;
  for (const row of completeLinks) {
    const digest = row["content_hash"] as string;
    if (seenHashes.has(digest) && seenHashes.get(digest) !== row["canonical_url"]) {
      dedupeConflict = true;
    }
    seenHashes.set(digest, row["canonical_url"]);
  }
  computedCheck(
    results, "canonicalization",
    "duplicate_content_shares_canonical", state,
    state === "ok" ? !dedupeConflict : null,
    "links sharing a content hash share one canonical URL",
    "a link row is incomplete, so dedupe consistency cannot be verified");

  // ---- Section 4: notarization ----
  boolCheck(results, "notarization", "hash_is_sha256",
    manifest, ["notarization", "hash_algorithm_sha256"],
    "artifact hashed with SHA-256");
  const [tsSource, hasTsSource] = getPath(manifest, "notarization", "timestamp_source");
  check(results, "notarization", "timestamp_from_real_tsa_or_log",
    tsSource, hasTsSource,
    (TIMESTAMP_SOURCES as readonly unknown[]).includes(tsSource),
    "red line: timestamps come from a real RFC 3161 TSA or transparency log — never fabricated");
  boolCheck(results, "notarization", "evidence_bundle_complete",
    manifest, ["notarization", "evidence_bundle_complete"],
    "evidence bundle: URL + capture + hashes + time + tool versions");
  boolCheck(results, "notarization", "tool_versions_recorded",
    manifest, ["notarization", "tool_versions_recorded"],
    "tool versions recorded in the evidence bundle");
  boolCheck(results, "notarization",
    "verification_recipe_published", manifest,
    ["notarization", "verification_recipe_published"],
    "quality gate: verification recipe published — anyone can re-hash and check");
  let notarizedOk: boolean | null = null;
  if (state === "ok") {
    notarizedOk =
      citations.length === 0
        ? true
        : citations.every((row) => row["notarized"] === true);
  }
  computedCheck(
    results, "notarization", "citations_notarized", state,
    notarizedOk,
    "every published citation's capture is notarized",
    "a link row is incomplete, so citation notarization cannot be verified",
    "no published citations declared");

  // ---- Section 5: honest_serving ----
  boolCheck(results, "honest_serving", "as_seen_views_available",
    manifest, ["serving", "as_seen_views_available"],
    "reader/playback offers as-seen views of captures");
  boolCheck(results, "honest_serving",
    "live_vs_archive_diff_available", manifest,
    ["serving", "live_vs_archive_diff_available"],
    "live-vs-archive diff available");
  const [badgeDate, hasBadgeDate] = getPath(
    manifest, "serving", "provenance_badge_shows_capture_date");
  const [badgeStatus, hasBadgeStatus] = getPath(
    manifest, "serving", "provenance_badge_shows_verification_status");
  check(results, "honest_serving", "provenance_badge_complete",
    badgeDate, hasBadgeDate && hasBadgeStatus,
    badgeDate === true && badgeStatus === true,
    "provenance badge shows capture date and verification status");
  falseCheck(results, "honest_serving",
    "archived_never_presented_as_current", manifest,
    ["serving", "archived_presented_as_current"],
    "red line: archived content is never presented as current");
  boolCheck(results, "honest_serving", "authorship_never_stripped",
    manifest, ["serving", "authorship_preserved"],
    "red line: a page's authorship is never stripped while archiving");

  // ---- Section 6: repair_and_compliance ----
  boolCheck(results, "repair_and_compliance", "repairs_logged",
    manifest, ["repair", "repairs_logged"],
    "quality gate: all repairs logged");
  falseCheck(results, "repair_and_compliance", "no_silent_drops",
    manifest, ["repair", "silent_drops_made"],
    "rotted links are never silently dropped");
  let repairedOk: boolean | null = null;
  if (state === "ok") {
    repairedOk =
      rottedCitations.length === 0
        ? true
        : rottedCitations.every(
            (row) =>
              (REPAIR_DONE_ACTIONS as readonly unknown[]).includes(
                row["repair_action"],
              ) && row["repair_logged"] === true,
          );
  }
  computedCheck(
    results, "repair_and_compliance", "rotted_citations_repaired",
    state, repairedOk,
    "quality gate: no broken citation ships — every rotted citation has a logged repair (archived copy, updated canonical, or dated removal note)",
    "a link row is incomplete, so citation repair cannot be verified",
    "no rotted published citations declared");
  boolCheck(results, "repair_and_compliance",
    "robots_and_tos_honored", manifest,
    ["compliance", "robots_and_tos_honored"],
    "robots and terms of service honored for fetching");
  boolCheck(results, "repair_and_compliance",
    "rate_limits_respected", manifest,
    ["compliance", "rate_limits_respected"],
    "rate limits respected — no scraping at volumes that harm the target");
  falseCheck(results, "repair_and_compliance",
    "no_access_control_bypass", manifest,
    ["compliance", "access_controls_bypassed"],
    "red line: no bypassing access controls");
  falseCheck(results, "repair_and_compliance",
    "no_fabricated_captures", manifest,
    ["compliance", "fabricated_captures_present"],
    "red line: no fabricated or synthetic captures");

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
    verdict = "LINK_INTEGRITY_UNSOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "LINK_INTEGRITY_SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "link-rot-scan-and-notarized-archive",
    atom_version: "0.1.0",
    site: manifest["site"] ?? null,
    verdict,
    sections,
    checks: results,
    links_evaluated: completeLinks.length,
    citations_total: citations.length,
    rotted_citations: rottedCitations.length,
    unarchived_citations: unarchived.length,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "LINK ROT SCAN AND NOTARIZED ARCHIVE",
    `site: ${pyStr(verdict.site ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(24)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
