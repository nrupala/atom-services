// Dependency governance audit — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/dependency-governance-audit/src/dependency_governance_audit.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string are
// byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  project: "string",
  justification: {
    recorded: "boolean",
    alternatives_considered: "boolean",
  },
  sources: {
    all_official: "boolean",
    publisher_signing_checked: "boolean",
    binaries_present: "boolean",
    binary_checksums_verified: "boolean",
  },
  pinning: {
    exact_versions: "boolean",
    lockfile_committed: "boolean",
    lockfile_updated_in_same_change: "boolean",
    ci_installs_from_lockfile: "boolean",
    ci_actions_images_pinned_to_hashes: "boolean",
  },
  audit: {
    automated_in_workflow: "boolean",
    bot_bumps_reviewed: "boolean",
    automerge_without_green_suite: "boolean",
  },
  updates: {
    batched: "boolean",
    stale_dependencies_flagged: "boolean",
    unused_retired: "boolean",
  },
  licences: {
    checked: "boolean",
    non_permissive_present: "boolean",
    human_decision_recorded: "boolean",
    notice_required: "boolean",
    notice_updated: "boolean",
  },
  sbom: {
    generated_per_release: "boolean",
    kept_with_artifacts: "boolean",
  },
};

export const SECTIONS = [
  "justification",
  "verified_sources",
  "pinning",
  "audit_and_updates",
  "licences",
  "sbom",
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
  project: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Python truthiness for JSON-shaped values.
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: justification (skill method 1 + quality gate) ----
  const [justified, hasJust] = getPath(manifest, "justification", "recorded");
  check(
    results, "justification", "new_dependencies_justified_in_pr",
    justified, hasJust, justified === true,
    "quality gate: new dependency justified in the PR (what/why/alternatives)",
  );

  const [alternatives, hasAlt] = getPath(manifest, "justification", "alternatives_considered");
  check(
    results, "justification", "alternatives_considered",
    alternatives, hasAlt, alternatives === true,
    "prefer the standard library; prefer boring, maintained, small",
  );

  // ---- Section 2: verified_sources (skill method 2 + red line) ----
  const [official, hasOfficial] = getPath(manifest, "sources", "all_official");
  check(
    results, "verified_sources", "all_dependencies_from_official_sources",
    official, hasOfficial, official === true,
    "skill red line: no dependencies from unknown sources; official registries/repos only",
  );

  const [signing, hasSigning] = getPath(manifest, "sources", "publisher_signing_checked");
  check(
    results, "verified_sources", "publisher_and_signing_checked",
    signing, hasSigning, signing === true,
    "check publisher, release signing where available",
  );

  const [binaries, hasBinaries] = getPath(manifest, "sources", "binaries_present");
  const [checksums, hasChecksums] = getPath(manifest, "sources", "binary_checksums_verified");
  if (hasBinaries && pyTruthy(binaries)) {
    check(
      results, "verified_sources", "binary_checksums_verified",
      checksums, hasChecksums, checksums === true,
      "checksums for binaries",
    );
  } else {
    check(
      results, "verified_sources", "binary_checksums_verified",
      binaries, hasBinaries, true,
      "no binaries declared",
    );
  }

  // ---- Section 3: pinning (skill method 3 + quality gates + red line) ----
  const [exact, hasExact] = getPath(manifest, "pinning", "exact_versions");
  check(
    results, "pinning", "exact_versions_pinned",
    exact, hasExact, exact === true,
    'skill red line: no unpinned "latest"; exact versions',
  );

  const [lockfile, hasLock] = getPath(manifest, "pinning", "lockfile_committed");
  check(
    results, "pinning", "lockfile_committed",
    lockfile, hasLock, lockfile === true,
    "lockfiles committed",
  );

  const [lockSame, hasLockSame] = getPath(manifest, "pinning", "lockfile_updated_in_same_change");
  check(
    results, "pinning", "lockfile_updated_in_same_change",
    lockSame, hasLockSame, lockSame === true,
    "quality gate: lockfile updated in the same change",
  );

  const [ciLock, hasCiLock] = getPath(manifest, "pinning", "ci_installs_from_lockfile");
  check(
    results, "pinning", "ci_installs_from_lockfile",
    ciLock, hasCiLock, ciLock === true,
    "CI installs from the lock",
  );

  const [ciPinned, hasCiPinned] = getPath(manifest, "pinning", "ci_actions_images_pinned_to_hashes");
  check(
    results, "pinning", "ci_actions_and_images_pinned_to_hashes",
    ciPinned, hasCiPinned, ciPinned === true,
    "quality gate: no unpinned CI actions or images; pin to commit hashes",
  );

  // ---- Section 4: audit_and_updates (skill methods 4 + 7 + red line) ----
  const [autoAudit, hasAuto] = getPath(manifest, "audit", "automated_in_workflow");
  check(
    results, "audit_and_updates", "automated_audit_in_workflow",
    autoAudit, hasAuto, autoAudit === true,
    "automated audit in the normal workflow",
  );

  const [botReviewed, hasBot] = getPath(manifest, "audit", "bot_bumps_reviewed");
  check(
    results, "audit_and_updates", "bot_bumps_reviewed_not_blind_merged",
    botReviewed, hasBot, botReviewed === true,
    "review bot bumps — do not blind-merge them",
  );

  const [automerge, hasAutomerge] = getPath(manifest, "audit", "automerge_without_green_suite");
  check(
    results, "audit_and_updates", "no_automerge_without_green_suite",
    automerge, hasAutomerge, automerge === false,
    "skill red line: no auto-merge of dependency bumps without a green suite",
  );

  const [batched, hasBatched] = getPath(manifest, "updates", "batched");
  check(
    results, "audit_and_updates", "updates_batched",
    batched, hasBatched, batched === true,
    "update policy: batch updates, run the suite",
  );

  const [stale, hasStale] = getPath(manifest, "updates", "stale_dependencies_flagged");
  check(
    results, "audit_and_updates", "stale_dependencies_flagged",
    stale, hasStale, stale === true,
    "flag anything with no release in ~2 years",
  );

  const [unused, hasUnused] = getPath(manifest, "updates", "unused_retired");
  check(
    results, "audit_and_updates", "unused_dependencies_retired",
    unused, hasUnused, unused === true,
    "retire unused deps",
  );

  // ---- Section 5: licences (skill method 5 + quality gates) ----
  const [licChecked, hasLic] = getPath(manifest, "licences", "checked");
  check(
    results, "licences", "licences_checked",
    licChecked, hasLic, licChecked === true,
    "quality gate: license checked",
  );

  const [nonperm, hasNonperm] = getPath(manifest, "licences", "non_permissive_present");
  const [humanDecision, hasDecision] = getPath(manifest, "licences", "human_decision_recorded");
  if (hasNonperm && pyTruthy(nonperm)) {
    check(
      results, "licences", "non_permissive_licences_have_human_decision",
      humanDecision, hasDecision, humanDecision === true,
      "copyleft or commercial goes to an explicit human decision",
    );
  } else {
    check(
      results, "licences", "non_permissive_licences_have_human_decision",
      nonperm, hasNonperm, true,
      "no copyleft or commercial licences declared",
    );
  }

  const [noticeRequired, hasNr] = getPath(manifest, "licences", "notice_required");
  const [noticeUpdated, hasNu] = getPath(manifest, "licences", "notice_updated");
  if (hasNr && pyTruthy(noticeRequired)) {
    check(
      results, "licences", "notice_updated_when_required",
      noticeUpdated, hasNu, noticeUpdated === true,
      "quality gate: NOTICE updated when required",
    );
  } else {
    check(
      results, "licences", "notice_updated_when_required",
      noticeRequired, hasNr, true,
      "NOTICE update not required",
    );
  }

  // ---- Section 6: sbom (skill method 6) ----
  const [sbomGen, hasSbomGen] = getPath(manifest, "sbom", "generated_per_release");
  check(
    results, "sbom", "sbom_generated_per_release",
    sbomGen, hasSbomGen, sbomGen === true,
    "SBOM: generate per release where feasible",
  );

  const [sbomKept, hasSbomKept] = getPath(manifest, "sbom", "kept_with_artifacts");
  check(
    results, "sbom", "sbom_kept_with_release_artifacts",
    sbomKept, hasSbomKept, sbomKept === true,
    "keep SBOM with release artifacts",
  );

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
    verdict = "NOT_GOVERNED";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "GOVERNED";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "dependency-governance-audit",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
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
    "DEPENDENCY-GOVERNANCE AUDIT",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(18)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
