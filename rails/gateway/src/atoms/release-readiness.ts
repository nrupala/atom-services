// Release-readiness verdict — deterministic core (atom #1).
// Faithful TypeScript port of the Python implementation in
// services/release-readiness-verdict/src/release_readiness.py
// (evaluate() + stamp()). No logic changes: every verdict, bar outcome,
// per-check status, evidence string and the summary string are
// byte-identical to the Python output for the same input.

import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Deliberate exception (F3, 2026-11-15): release_notes.breaking_changes
// and release_notes.migration_steps carry no spec entry because
// SERVICE.md documents no type for them — validation follows the
// documented spec exactly. A field absent from the spec is not
// type-validated; the checks below handle those fields by
// truthiness (false/empty = no breaking changes declared; truthy
// breaking requires a non-empty list migration_steps at check level).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  product: "string",
  version: "string",
  tag: { name: "string", annotated: "boolean", moved: "boolean" },
  version_bump_locations: ["string"],
  changelog: {
    has_entry_for_version: "boolean",
    unreleased_section_moved: "boolean",
  },
  release_notes: {
    present: "boolean",
  },
  approver: "string",
  approval: { hitl_recorded: "boolean" },
  rollout_plan: { present: "boolean" },
  rollback_plan: { present: "boolean", testable: "boolean" },
  health_check: { window_hours: "number" },
  artifacts: {
    sealed: "boolean",
    checksum_manifest: "boolean",
    verified_before_announcement: "boolean",
  },
  tests: { passing: "boolean" },
};

export const BARS = [
  "control",
  "understanding",
  "management",
  "lifecycle",
  "stability",
] as const;

export type Bar = (typeof BARS)[number];
export type CheckStatus = "pass" | "fail" | "missing";
export type BarStatus = "pass" | "fail" | "insufficient_evidence";

export interface CheckResult {
  bar: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  product: unknown;
  version: unknown;
  verdict: string;
  bars: Record<string, string>;
  checks: CheckResult[];
  summary: string;
}

// Python's `$` in a `$`-anchored match also matches just before a trailing
// newline, so "1.2.0\n" is a valid semver for the Python core. The optional
// `\n` before `$` reproduces that; JS `$` alone would not.
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)\n?$/;

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Python number str(): JS String() differs on exponent padding
// (Python "1e+07" vs JS "1e+7") and on inf/nan spellings.
export function pyNumberStr(value: number): string {
  if (Number.isNaN(value)) return "nan";
  if (value === Infinity) return "inf";
  if (value === -Infinity) return "-inf";
  const raw = String(value);
  const eIdx = raw.indexOf("e");
  if (eIdx === -1) return raw;
  const mantissa = raw.slice(0, eIdx);
  const exp = parseInt(raw.slice(eIdx + 1), 10);
  const sign = exp < 0 ? "-" : "+";
  const digits = String(Math.abs(exp)).padStart(2, "0");
  return `${mantissa}e${sign}${digits}`;
}

function pyReprString(value: string): string {
  // Python repr() prefers single quotes, switching to double quotes when
  // the string contains a single quote but no double quote.
  const quote = value.includes("'") && !value.includes('"') ? '"' : "'";
  let out = quote;
  for (const ch of value) {
    const code = ch.codePointAt(0) as number;
    if (ch === "\\") {
      out += "\\\\";
    } else if (ch === quote) {
      out += "\\" + quote;
    } else if (ch === "\n") {
      out += "\\n";
    } else if (ch === "\r") {
      out += "\\r";
    } else if (ch === "\t") {
      out += "\\t";
    } else if (code < 0x20 || code === 0x7f) {
      out += "\\x" + code.toString(16).padStart(2, "0");
    } else {
      out += ch;
    }
  }
  return out + quote;
}

// Python repr() for JSON-shaped values.
export function pyRepr(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  if (typeof value === "string") return pyReprString(value);
  if (typeof value === "number") return pyNumberStr(value);
  if (Array.isArray(value)) {
    return "[" + value.map((item) => pyRepr(item)).join(", ") + "]";
  }
  if (isPyDict(value)) {
    const parts = Object.entries(value).map(
      ([k, v]) => `${pyRepr(k)}: ${pyRepr(v)}`,
    );
    return "{" + parts.join(", ") + "}";
  }
  return pyReprString(String(value));
}

// Python str() for JSON-shaped values: strings pass through unchanged,
// everything else formats like repr() (str(list) == repr(list), etc.).
export function pyStr(value: unknown): string {
  if (typeof value === "string") return value;
  return pyRepr(value);
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
  bar: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ bar, check: name, status, evidence });
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Bar 1: control (version + tag discipline, from the skill) ----
  const [version, hasVersion] = getPath(manifest, "version");
  const semverOk = Boolean(
    hasVersion && SEMVER.test(pyStr(version)),
  );
  check(
    results, "control", "version_is_semver", version, hasVersion,
    semverOk, `version=${pyRepr(version)}`,
  );

  const [tagName, hasTag] = getPath(manifest, "tag", "name");
  check(
    results, "control", "release_is_tagged", tagName, hasTag,
    pyTruthy(tagName) && pyStr(tagName) === `v${pyStr(version)}`,
    `tag=${pyRepr(tagName)} expected v${pyStr(version)}`,
  );

  const [annotated, hasAnn] = getPath(manifest, "tag", "annotated");
  check(
    results, "control", "tag_is_annotated", annotated, hasAnn,
    annotated === true,
    "annotated tag (skill: annotated tags, signed when keys exist)",
  );

  const [moved, hasMoved] = getPath(manifest, "tag", "moved");
  check(
    results, "control", "published_tag_not_moved", moved, hasMoved,
    moved === false, "skill red line: never move a published tag",
  );

  const [places, hasPlaces] = getPath(manifest, "version_bump_locations");
  check(
    results, "control", "version_bumped_in_exactly_one_place",
    places, hasPlaces,
    Array.isArray(places) && places.length === 1,
    `version_bump_locations=${pyRepr(places)}`,
  );

  // ---- Bar 2: understanding (changelog + notes a reader can act on) ----
  const [entry, hasEntry] = getPath(manifest, "changelog", "has_entry_for_version");
  check(
    results, "understanding", "changelog_entry_for_this_version",
    entry, hasEntry, entry === true,
    "Keep-a-Changelog: entry for this version ships in the same change",
  );

  const [movedUnrel, hasMu] = getPath(manifest, "changelog", "unreleased_section_moved");
  check(
    results, "understanding", "unreleased_section_moved_under_version",
    movedUnrel, hasMu, movedUnrel === true,
    "[Unreleased] entries moved under the version at release",
  );

  const [notes, hasNotes] = getPath(manifest, "release_notes", "present");
  check(
    results, "understanding", "release_notes_present", notes,
    hasNotes, notes === true,
    "user-facing notes: what changed, why it matters",
  );

  const [breaking, hasBreaking] = getPath(manifest, "release_notes", "breaking_changes");
  const [migration, hasMig] = getPath(manifest, "release_notes", "migration_steps");
  if (hasBreaking && pyTruthy(breaking)) {
    check(
      results, "understanding", "breaking_changes_have_migration_steps",
      migration, hasMig,
      Array.isArray(migration) && migration.length > 0,
      "breaking items must ship with migration steps",
    );
  } else {
    check(
      results, "understanding", "breaking_changes_have_migration_steps",
      breaking, hasBreaking, true,
      "no breaking changes declared",
    );
  }

  // ---- Bar 3: management (a named human owns and approves the release) ----
  const [approver, hasApprover] = getPath(manifest, "approver");
  check(
    results, "management", "approver_named", approver, hasApprover,
    typeof approver === "string" && approver.trim().length > 0,
    "rollout plan names the approver",
  );

  const [hitl, hasHitl] = getPath(manifest, "approval", "hitl_recorded");
  check(
    results, "management", "human_approval_recorded", hitl, hasHitl,
    hitl === true,
    "skill red line: deploys stay HITL — automation prepares, humans approve",
  );

  const [rollout, hasRollout] = getPath(manifest, "rollout_plan", "present");
  check(
    results, "management", "rollout_plan_present", rollout, hasRollout,
    rollout === true, "canary/staged where feasible",
  );

  // ---- Bar 4: lifecycle (reversible + watched after release) ----
  const [rbPresent, hasRb] = getPath(manifest, "rollback_plan", "present");
  check(
    results, "lifecycle", "rollback_plan_present", rbPresent, hasRb,
    rbPresent === true,
    "the rollback path is written before rolling out",
  );

  const [rbTestable, hasRbt] = getPath(manifest, "rollback_plan", "testable");
  check(
    results, "lifecycle", "rollback_plan_testable", rbTestable,
    hasRbt, rbTestable === true,
    "quality gate: rollback plan exists and is testable",
  );

  const [windowValue, hasWindow] = getPath(manifest, "health_check", "window_hours");
  // Python: isinstance(window, (int, float)) — bool is an int subclass, so
  // window_hours=true passes isinstance and then fails 24 <= True (== 1).
  const windowIsNumber =
    typeof windowValue === "number" || typeof windowValue === "boolean";
  const windowNumber =
    typeof windowValue === "boolean" ? (windowValue ? 1 : 0) : (windowValue as number);
  check(
    results, "lifecycle", "post_release_health_window_24_to_48h",
    windowValue, hasWindow,
    windowIsNumber && 24 <= windowNumber && windowNumber <= 48,
    `window_hours=${pyRepr(windowValue)} (skill: verify health for 24–48h)`,
  );

  // ---- Bar 5: stability (sealed artifacts + passing tests) ----
  const [sealed, hasSealed] = getPath(manifest, "artifacts", "sealed");
  check(
    results, "stability", "artifacts_sealed", sealed, hasSealed,
    sealed === true, "hash + sign build artifacts; manifest attached",
  );

  const [checksums, hasSums] = getPath(manifest, "artifacts", "checksum_manifest");
  check(
    results, "stability", "checksum_manifest_present", checksums,
    hasSums, checksums === true, "provenance manifest present",
  );

  const [verified, hasVer] = getPath(manifest, "artifacts", "verified_before_announcement");
  check(
    results, "stability", "artifacts_verified_before_announcement",
    verified, hasVer, verified === true,
    "quality gate: artifacts verified (checksums/signature) before announcement",
  );

  const [testsOk, hasTests] = getPath(manifest, "tests", "passing");
  check(
    results, "stability", "tests_passing", testsOk, hasTests,
    testsOk === true, "the release's own test evidence passes",
  );

  const bars: Record<string, string> = {};
  for (const bar of BARS) {
    const barResults = results.filter((r) => r.bar === bar);
    if (barResults.some((r) => r.status === "fail")) {
      bars[bar] = "fail";
    } else if (barResults.some((r) => r.status === "missing")) {
      bars[bar] = "insufficient_evidence";
    } else {
      bars[bar] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(bars).some((v) => v === "fail")) {
    verdict = "NOT_READY";
  } else if (Object.values(bars).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "READY";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "release-readiness-verdict",
    atom_version: "0.1.0",
    product: manifest["product"] ?? null,
    version: manifest["version"] ?? null,
    verdict,
    bars,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five bars.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "RELEASE-READINESS VERDICT",
    `product: ${pyStr(verdict.product ?? null)}  version: ${pyStr(verdict.version ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const bar of BARS) {
    lines.push(`  ${bar.padEnd(14)} ${verdict.bars[bar]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
