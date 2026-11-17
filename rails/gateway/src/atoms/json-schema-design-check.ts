// Json schema design check — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/json-schema-design-check/src/json_schema_design_check.py
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
  artifact: "string",
  schema: {
    schema_for_every_external_payload: "boolean",
    validated_at_boundary: "boolean",
  },
  writer_reader: {
    strict_writer_emits_exactly_schema: "boolean",
    tolerant_reader_accepts_documented_variations: "boolean",
    undocumented_variations_rejected_loudly: "boolean",
  },
  payloads: [{
    name: "string",
    has_schema: "boolean",
    has_sample: "boolean",
    has_version_field: "boolean",
    money_and_bigint_fields_as_strings: "boolean",
    is_hashed_or_signed: "boolean",
    canonical_rules_documented: "boolean",
  }],
  canonical: {
    fixed_key_ordering_documented: "boolean",
    number_formatting_documented: "boolean",
    hashes_or_signatures_cover_json: "boolean",
    canonical_rules_documented: "boolean",
    money_as_strings: "boolean",
    big_integers_as_strings: "boolean",
    float_usage_for_money_or_big_integers_present: "boolean",
  },
  versioning: {
    version_field_on_everything_persisted_or_sent: "boolean",
    additive_changes_by_default: "boolean",
    breaking_changes_require_new_version: "boolean",
  },
  parsing: {
    size_limits_on_untrusted_input: "boolean",
    depth_limits_on_untrusted_input: "boolean",
    eval_used_present: "boolean",
    duplicate_keys_handled_deliberately: "boolean",
    utf8_only_and_escapes_normalized: "boolean",
    parse_errors_explicit_not_silent_defaults: "boolean",
  },
  streaming_ops: {
    ndjson_for_logs_and_events: "boolean",
    streaming_parsers_for_large_files: "boolean",
    compact_for_machine_storage_pretty_for_humans: "boolean",
    inspection_and_diffs_in_reviews: "boolean",
    sample_fixtures_kept_per_schema: "boolean",
  },
  red_lines: {
    unbounded_parsing_of_untrusted_input_present: "boolean",
    unvalidated_config_edits_without_ci_schema_validation_present: "boolean",
  },
};

export const SECTIONS = [
  "schema_first_and_boundary",
  "canonical_form_and_number_care",
  "versioning",
  "parsing_safety_and_encoding",
  "streaming_ops_and_red_lines",
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
  artifact: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  payloads_count: number | null;
  payloads_without_schema_or_sample: string[] | null;
  schema_coverage: string | null;
  payloads_without_version_field: string[] | null;
  version_coverage: string | null;
  payloads_without_money_and_bigint_fields_as_strings: string[] | null;
  money_bigint_string_coverage: string | null;
  hashed_or_signed_payloads_without_canonical_rules: string[] | null;
  canonical_coverage: string | null;
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

  const [payloadsRaw, hasPayloads] = getPath(manifest, "payloads");
  const payloadsIsList = hasPayloads && Array.isArray(payloadsRaw);
  const rows: unknown[] = payloadsIsList ? (payloadsRaw as unknown[]) : [];
  const payloadsCount: number | null = payloadsIsList ? rows.length : null;

  const payloadsWithoutSchemaOrSample: string[] | null = payloadsIsList
    ? rows.filter((c) => isPyDict(c) &&
        ((hasField(c, "has_schema") && c["has_schema"] !== true) ||
         (hasField(c, "has_sample") && c["has_sample"] !== true)))
        .map(rowName)
    : null;
  const payloadsWithoutVersion: string[] | null = payloadsIsList
    ? rows.filter((c) => hasField(c, "has_version_field") &&
        (c as Record<string, unknown>)["has_version_field"] !== true)
        .map(rowName)
    : null;
  const payloadsWithoutMoney: string[] | null = payloadsIsList
    ? rows.filter((c) => hasField(c, "money_and_bigint_fields_as_strings") &&
        (c as Record<string, unknown>)["money_and_bigint_fields_as_strings"] !== true)
        .map(rowName)
    : null;
  const hashedRows = rows.filter(
    (c) => isPyDict(c) && c["is_hashed_or_signed"] === true);
  const hashedWithoutCanonical: string[] | null = payloadsIsList
    ? hashedRows.filter((c) => hasField(c, "canonical_rules_documented") &&
        (c as Record<string, unknown>)["canonical_rules_documented"] !== true)
        .map(rowName)
    : null;
  const schemaCoverage: number | null =
    payloadsIsList && payloadsCount !== null && payloadsCount > 0
      ? rows.filter((c) => isPyDict(c) && c["has_schema"] === true).length / payloadsCount
      : null;
  const versionCoverage: number | null =
    payloadsIsList && payloadsCount !== null && payloadsCount > 0
      ? rows.filter((c) => isPyDict(c) && c["has_version_field"] === true).length / payloadsCount
      : null;
  const moneyCoverage: number | null =
    payloadsIsList && payloadsCount !== null && payloadsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["money_and_bigint_fields_as_strings"] === true).length / payloadsCount
      : null;
  const canonicalCoverage: number | null =
    payloadsIsList && hashedRows.length > 0
      ? hashedRows.filter((c) => isPyDict(c) &&
          c["canonical_rules_documented"] === true).length / hashedRows.length
      : null;

  // ---- Section 1: schema_first_and_boundary ----
  boolCheck(results, "schema_first_and_boundary",
    "schema_for_every_external_payload", manifest,
    ["schema", "schema_for_every_external_payload"],
    "schema-first: a JSON Schema (or typed schema) is declared for every external payload");
  boolCheck(results, "schema_first_and_boundary",
    "validated_at_boundary", manifest,
    ["schema", "validated_at_boundary"],
    "schema-first: payloads are validated at the boundary");
  boolCheck(results, "schema_first_and_boundary",
    "strict_writer_emits_exactly_schema", manifest,
    ["writer_reader", "strict_writer_emits_exactly_schema"],
    "strict writer / tolerant reader: the writer emits exactly its schema");
  boolCheck(results, "schema_first_and_boundary",
    "tolerant_reader_accepts_documented_variations", manifest,
    ["writer_reader", "tolerant_reader_accepts_documented_variations"],
    "strict writer / tolerant reader: the reader accepts documented variations");
  boolCheck(results, "schema_first_and_boundary",
    "undocumented_variations_rejected_loudly", manifest,
    ["writer_reader", "undocumented_variations_rejected_loudly"],
    "strict writer / tolerant reader: the rest is rejected loudly");
  check(results, "schema_first_and_boundary",
    "payloads_declared", payloadsRaw, payloadsIsList,
    payloadsIsList && (payloadsCount as number) > 0,
    "the declared record names its payloads — the payloads list is present and non-empty");
  const schemaSamplePresent = payloadsIsList &&
    rows.every((c) => hasField(c, "has_schema") && hasField(c, "has_sample"));
  check(results, "schema_first_and_boundary",
    "every_payload_has_schema_and_sample", payloadsRaw,
    schemaSamplePresent,
    payloadsIsList && (payloadsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["has_schema"] === true &&
        c["has_sample"] === true),
    "quality gate: every declared payload row has a schema and a sample");

  // ---- Section 2: canonical_form_and_number_care ----
  boolCheck(results, "canonical_form_and_number_care",
    "fixed_key_ordering_documented", manifest,
    ["canonical", "fixed_key_ordering_documented"],
    "canonical form: fixed key ordering is documented");
  boolCheck(results, "canonical_form_and_number_care",
    "number_formatting_documented", manifest,
    ["canonical", "number_formatting_documented"],
    "canonical form: number formatting is documented — floats are IEEE-754");
  gatedBoolCheck(results, "canonical_form_and_number_care",
    "canonical_rules_documented_when_hashing_or_signing", manifest,
    ["canonical", "hashes_or_signatures_cover_json"],
    ["canonical", "canonical_rules_documented"],
    "canonical form: the canonical rules are documented next to the schema when hashes or signatures cover JSON",
    "no hashes or signatures cover JSON declared");
  boolCheck(results, "canonical_form_and_number_care",
    "money_as_strings", manifest,
    ["canonical", "money_as_strings"],
    "number care: money is carried as strings");
  boolCheck(results, "canonical_form_and_number_care",
    "big_integers_as_strings", manifest,
    ["canonical", "big_integers_as_strings"],
    "number care: big integers are carried as strings");
  falseCheck(results, "canonical_form_and_number_care",
    "no_float_for_money_or_big_integers", manifest,
    ["canonical", "float_usage_for_money_or_big_integers_present"],
    "quality gate: no float usage for money or >2^53 integers is present");
  const hashedGatePresent = payloadsIsList &&
    rows.every((c) => hasField(c, "is_hashed_or_signed"));
  const hashedPresent = payloadsIsList && hashedGatePresent &&
    hashedRows.every((c) => hasField(c, "canonical_rules_documented"));
  check(results, "canonical_form_and_number_care",
    "every_hashed_or_signed_payload_canonical_documented", payloadsRaw,
    hashedPresent,
    payloadsIsList &&
      hashedRows.every((c) => isPyDict(c) &&
        c["canonical_rules_documented"] === true),
    "canonical form: every payload row declared hashed or signed declares its canonical rules documented");
  const moneyPresent = payloadsIsList &&
    rows.every((c) => hasField(c, "money_and_bigint_fields_as_strings"));
  check(results, "canonical_form_and_number_care",
    "every_payload_money_and_bigint_fields_as_strings", payloadsRaw,
    moneyPresent,
    payloadsIsList && (payloadsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        c["money_and_bigint_fields_as_strings"] === true),
    "number care: every declared payload row declares its money and big-integer fields as strings");

  // ---- Section 3: versioning ----
  boolCheck(results, "versioning",
    "version_field_on_everything_persisted_or_sent", manifest,
    ["versioning", "version_field_on_everything_persisted_or_sent"],
    "versioning: a version field is carried on everything persisted or sent");
  boolCheck(results, "versioning",
    "additive_changes_by_default", manifest,
    ["versioning", "additive_changes_by_default"],
    "versioning: changes are additive by default");
  boolCheck(results, "versioning",
    "breaking_changes_require_new_version", manifest,
    ["versioning", "breaking_changes_require_new_version"],
    "versioning: breaking changes require a new version");
  const versionPresent = payloadsIsList &&
    rows.every((c) => hasField(c, "has_version_field"));
  check(results, "versioning",
    "every_payload_has_version_field", payloadsRaw, versionPresent,
    payloadsIsList && (payloadsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["has_version_field"] === true),
    "versioning: every declared payload row carries a version field");

  // ---- Section 4: parsing_safety_and_encoding ----
  boolCheck(results, "parsing_safety_and_encoding",
    "size_limits_on_untrusted_input", manifest,
    ["parsing", "size_limits_on_untrusted_input"],
    "parsing safety: size limits are applied to untrusted input");
  boolCheck(results, "parsing_safety_and_encoding",
    "depth_limits_on_untrusted_input", manifest,
    ["parsing", "depth_limits_on_untrusted_input"],
    "parsing safety: depth limits are applied to untrusted input");
  falseCheck(results, "parsing_safety_and_encoding",
    "no_eval", manifest,
    ["parsing", "eval_used_present"],
    "parsing safety: no eval is used");
  boolCheck(results, "parsing_safety_and_encoding",
    "duplicate_keys_handled_deliberately", manifest,
    ["parsing", "duplicate_keys_handled_deliberately"],
    "parsing safety: duplicate keys are handled deliberately");
  boolCheck(results, "parsing_safety_and_encoding",
    "utf8_only_and_escapes_normalized", manifest,
    ["parsing", "utf8_only_and_escapes_normalized"],
    "parsing safety: UTF-8 only, escapes normalized");
  boolCheck(results, "parsing_safety_and_encoding",
    "parse_errors_explicit_not_silent_defaults", manifest,
    ["parsing", "parse_errors_explicit_not_silent_defaults"],
    "quality gate: parse errors on bad input are explicit, not silent defaults");

  // ---- Section 5: streaming_ops_and_red_lines ----
  boolCheck(results, "streaming_ops_and_red_lines",
    "ndjson_for_logs_and_events", manifest,
    ["streaming_ops", "ndjson_for_logs_and_events"],
    "streaming & scale: NDJSON is used for logs and events");
  boolCheck(results, "streaming_ops_and_red_lines",
    "streaming_parsers_for_large_files", manifest,
    ["streaming_ops", "streaming_parsers_for_large_files"],
    "streaming & scale: streaming parsers are used for large files");
  boolCheck(results, "streaming_ops_and_red_lines",
    "compact_for_machine_storage_pretty_for_humans", manifest,
    ["streaming_ops", "compact_for_machine_storage_pretty_for_humans"],
    "streaming & scale: storage is compact for machines and pretty for humans — megabytes are not pretty-printed for storage");
  boolCheck(results, "streaming_ops_and_red_lines",
    "inspection_and_diffs_in_reviews", manifest,
    ["streaming_ops", "inspection_and_diffs_in_reviews"],
    "ops: jq is used for inspection and diffs are carried in reviews");
  boolCheck(results, "streaming_ops_and_red_lines",
    "sample_fixtures_kept_per_schema", manifest,
    ["streaming_ops", "sample_fixtures_kept_per_schema"],
    "ops: sample fixtures are kept per schema");
  falseCheck(results, "streaming_ops_and_red_lines",
    "no_unbounded_parsing_of_untrusted_input", manifest,
    ["red_lines", "unbounded_parsing_of_untrusted_input_present"],
    "red line: no unbounded parsing of untrusted input (DoS) is present");
  falseCheck(results, "streaming_ops_and_red_lines",
    "no_unvalidated_config_edits_without_ci_schema_validation", manifest,
    ["red_lines", "unvalidated_config_edits_without_ci_schema_validation_present"],
    "red line: no \"it's just JSON\" config edits without schema validation in CI are present");

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
    verdict = "JSON_SCHEMA_DESIGN_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "JSON_SCHEMA_DESIGN_SOUND";
  }

  const computedNames = [
    "payloads_declared",
    "every_payload_has_schema_and_sample",
    "every_hashed_or_signed_payload_canonical_documented",
    "every_payload_has_version_field",
    "every_payload_money_and_bigint_fields_as_strings",
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
    service: "json-schema-design-check",
    atom_version: "0.1.0",
    artifact: manifest["artifact"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    payloads_count: payloadsCount,
    payloads_without_schema_or_sample: payloadsWithoutSchemaOrSample,
    schema_coverage: fmt6(schemaCoverage),
    payloads_without_version_field: payloadsWithoutVersion,
    version_coverage: fmt6(versionCoverage),
    payloads_without_money_and_bigint_fields_as_strings: payloadsWithoutMoney,
    money_bigint_string_coverage: fmt6(moneyCoverage),
    hashed_or_signed_payloads_without_canonical_rules: hashedWithoutCanonical,
    canonical_coverage: fmt6(canonicalCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "JSON SCHEMA DESIGN CHECK",
    `artifact: ${pyStr(verdict.artifact ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
