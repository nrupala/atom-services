import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/json-schema-design-check.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  artifact: "orders-api",
  schema: { schema_for_every_external_payload: true,
            validated_at_boundary: true },
  writer_reader: {
    strict_writer_emits_exactly_schema: true,
    tolerant_reader_accepts_documented_variations: true,
    undocumented_variations_rejected_loudly: true },
  payloads: [
    { name: "order-created", has_schema: true, has_sample: true,
      has_version_field: true, money_and_bigint_fields_as_strings: true,
      is_hashed_or_signed: true, canonical_rules_documented: true },
    { name: "order-updated", has_schema: true, has_sample: true,
      has_version_field: true, money_and_bigint_fields_as_strings: true,
      is_hashed_or_signed: false },
    { name: "invoice-issued", has_schema: true, has_sample: true,
      has_version_field: true, money_and_bigint_fields_as_strings: true,
      is_hashed_or_signed: false },
  ],
  canonical: { fixed_key_ordering_documented: true,
               number_formatting_documented: true,
               hashes_or_signatures_cover_json: true,
               canonical_rules_documented: true,
               money_as_strings: true,
               big_integers_as_strings: true,
               float_usage_for_money_or_big_integers_present: false },
  versioning: {
    version_field_on_everything_persisted_or_sent: true,
    additive_changes_by_default: true,
    breaking_changes_require_new_version: true },
  parsing: { size_limits_on_untrusted_input: true,
             depth_limits_on_untrusted_input: true,
             eval_used_present: false,
             duplicate_keys_handled_deliberately: true,
             utf8_only_and_escapes_normalized: true,
             parse_errors_explicit_not_silent_defaults: true },
  streaming_ops: { ndjson_for_logs_and_events: true,
                   streaming_parsers_for_large_files: true,
                   compact_for_machine_storage_pretty_for_humans: true,
                   inspection_and_diffs_in_reviews: true,
                   sample_fixtures_kept_per_schema: true },
  red_lines: {
    unbounded_parsing_of_untrusted_input_present: false,
    unvalidated_config_edits_without_ci_schema_validation_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "JSON_SCHEMA_DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 32);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.payloads_count, 3);
  assert.deepEqual(v.payloads_without_schema_or_sample, []);
  assert.equal(v.schema_coverage, "1.000000");
  assert.deepEqual(v.payloads_without_version_field, []);
  assert.equal(v.version_coverage, "1.000000");
  assert.deepEqual(v.payloads_without_money_and_bigint_fields_as_strings, []);
  assert.equal(v.money_bigint_string_coverage, "1.000000");
  assert.deepEqual(v.hashed_or_signed_payloads_without_canonical_rules, []);
  assert.equal(v.canonical_coverage, "1.000000");
});

test("test_no_schema_for_payload_fails_section", () => {
  const m = clone(COMPLETE) as any;
  m.schema.schema_for_every_external_payload = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "JSON_SCHEMA_DESIGN_NOT_SOUND");
  assert.equal(v.sections["schema_first_and_boundary"], "fail");
});

test("test_not_validated_at_boundary_fails", () => {
  const m = clone(COMPLETE) as any;
  m.schema.validated_at_boundary = false;
  assert.equal(evaluate(m).verdict, "JSON_SCHEMA_DESIGN_NOT_SOUND");
});

test("test_lenient_writer_fails", () => {
  const m = clone(COMPLETE) as any;
  m.writer_reader.strict_writer_emits_exactly_schema = false;
  assert.equal(evaluate(m).verdict, "JSON_SCHEMA_DESIGN_NOT_SOUND");
});

test("test_silent_rejection_fails", () => {
  const m = clone(COMPLETE) as any;
  m.writer_reader.undocumented_variations_rejected_loudly = false;
  assert.equal(evaluate(m).verdict, "JSON_SCHEMA_DESIGN_NOT_SOUND");
});

test("test_payload_without_sample_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.payloads[0].has_sample = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "JSON_SCHEMA_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "every_payload_has_schema_and_sample"), "fail");
  assert.deepEqual(v.payloads_without_schema_or_sample, ["order-created"]);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_payload_missing_schema_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.payloads[0].has_schema;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_payload_has_schema_and_sample"), "missing");
  assert.deepEqual(v.payloads_without_schema_or_sample, []);
  assert.equal(v.schema_coverage, "0.666667");
});

test("test_empty_payloads_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.payloads = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "payloads_declared"), "fail");
  assert.equal(v.payloads_count, 0);
  assert.equal(v.schema_coverage, null);
  assert.equal(v.canonical_coverage, null);
});

test("test_canonical_not_documented_when_signing_fails", () => {
  const m = clone(COMPLETE) as any;
  m.canonical.canonical_rules_documented = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "canonical_rules_documented_when_hashing_or_signing"), "fail");
});

test("test_no_signing_passes_canonical_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.canonical = {
    fixed_key_ordering_documented: true,
    number_formatting_documented: true,
    hashes_or_signatures_cover_json: false,
    money_as_strings: true,
    big_integers_as_strings: true,
    float_usage_for_money_or_big_integers_present: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "JSON_SCHEMA_DESIGN_SOUND");
  assert.equal(checkStatus(v, "canonical_rules_documented_when_hashing_or_signing"), "pass");
});

test("test_canonical_target_missing_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.canonical.canonical_rules_documented;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "canonical_rules_documented_when_hashing_or_signing"), "missing");
});

test("test_hashed_payload_without_canonical_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.payloads[0].canonical_rules_documented = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_hashed_or_signed_payload_canonical_documented"), "fail");
  assert.deepEqual(v.hashed_or_signed_payloads_without_canonical_rules, ["order-created"]);
  assert.equal(v.canonical_coverage, "0.000000");
});

test("test_hashed_payload_missing_canonical_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.payloads[0].canonical_rules_documented;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_hashed_or_signed_payload_canonical_documented"), "missing");
});

test("test_no_hashed_payloads_passes_canonical_row_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.payloads[0].is_hashed_or_signed = false;
  delete m.payloads[0].canonical_rules_documented;
  const v = evaluate(m);
  assert.equal(v.verdict, "JSON_SCHEMA_DESIGN_SOUND");
  assert.equal(checkStatus(v, "every_hashed_or_signed_payload_canonical_documented"), "pass");
  assert.equal(v.canonical_coverage, null);
});

test("test_float_for_money_fails_number_care", () => {
  const m = clone(COMPLETE) as any;
  m.canonical.float_usage_for_money_or_big_integers_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_float_for_money_or_big_integers"), "fail");
  assert.equal(v.sections["canonical_form_and_number_care"], "fail");
});

test("test_money_not_as_strings_fails", () => {
  const m = clone(COMPLETE) as any;
  m.canonical.money_as_strings = false;
  assert.equal(evaluate(m).verdict, "JSON_SCHEMA_DESIGN_NOT_SOUND");
});

test("test_payload_money_not_as_strings_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.payloads[1].money_and_bigint_fields_as_strings = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_payload_money_and_bigint_fields_as_strings"), "fail");
  assert.deepEqual(v.payloads_without_money_and_bigint_fields_as_strings, ["order-updated"]);
  assert.equal(v.money_bigint_string_coverage, "0.666667");
});

test("test_breaking_without_new_version_fails_versioning", () => {
  const m = clone(COMPLETE) as any;
  m.versioning.breaking_changes_require_new_version = false;
  const v = evaluate(m);
  assert.equal(v.sections["versioning"], "fail");
});

test("test_payload_without_version_field_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.payloads[2].has_version_field = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_payload_has_version_field"), "fail");
  assert.deepEqual(v.payloads_without_version_field, ["invoice-issued"]);
  assert.equal(v.version_coverage, "0.666667");
});

test("test_no_size_limits_fails_parsing", () => {
  const m = clone(COMPLETE) as any;
  m.parsing.size_limits_on_untrusted_input = false;
  const v = evaluate(m);
  assert.equal(v.sections["parsing_safety_and_encoding"], "fail");
});

test("test_eval_used_fails_parsing", () => {
  const m = clone(COMPLETE) as any;
  m.parsing.eval_used_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_eval"), "fail");
});

test("test_silent_parse_defaults_fail", () => {
  const m = clone(COMPLETE) as any;
  m.parsing.parse_errors_explicit_not_silent_defaults = false;
  assert.equal(evaluate(m).verdict, "JSON_SCHEMA_DESIGN_NOT_SOUND");
});

test("test_pretty_printed_storage_fails_streaming", () => {
  const m = clone(COMPLETE) as any;
  m.streaming_ops.compact_for_machine_storage_pretty_for_humans = false;
  assert.equal(evaluate(m).verdict, "JSON_SCHEMA_DESIGN_NOT_SOUND");
});

test("test_unbounded_parsing_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unbounded_parsing_of_untrusted_input_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unbounded_parsing_of_untrusted_input"), "fail");
  assert.equal(v.sections["streaming_ops_and_red_lines"], "fail");
});

test("test_unvalidated_config_edits_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unvalidated_config_edits_without_ci_schema_validation_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unvalidated_config_edits_without_ci_schema_validation"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.parsing;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["parsing_safety_and_encoding"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.payloads_count, null);
  assert.equal(v.payloads_without_schema_or_sample, null);
  assert.equal(v.schema_coverage, null);
  assert.equal(v.payloads_without_version_field, null);
  assert.equal(v.version_coverage, null);
  assert.equal(v.payloads_without_money_and_bigint_fields_as_strings, null);
  assert.equal(v.money_bigint_string_coverage, null);
  assert.equal(v.hashed_or_signed_payloads_without_canonical_rules, null);
  assert.equal(v.canonical_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: JSON_SCHEMA_DESIGN_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.artifact = 12345;
  assert.throws(() => evaluate(m), fieldError("artifact"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ parsing: "should-be-an-object" }), fieldError("parsing"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ payloads: { name: "order-created" } }), fieldError("payloads"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ payloads: ["order-created"] }), fieldError("payloads[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.parsing.size_limits_on_untrusted_input = "yes";
  assert.throws(() => evaluate(m), fieldError("parsing.size_limits_on_untrusted_input"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.payloads[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("payloads[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.payloads[1].is_hashed_or_signed = "yes";
  assert.throws(() => evaluate(m), fieldError("payloads[1].is_hashed_or_signed"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.canonical = null;
  assert.throws(() => evaluate(m), fieldError("canonical"));
});

// ---- Golden-fixture parity against the Python oracle ----

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "fixtures",
);

interface Fixture {
  name: string;
  manifest: unknown;
  expected: unknown;
}

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.startsWith("json-schema-design-check--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
