import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/technical-documentation-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  product_name: "grid-gateway",
  product_version: "2.4.0",
  readme: { what_it_is_one_paragraph_declared: true, quickstart_present: true,
            quickstart_copy_paste_ready: true, usage_present: true,
            operations_present: true, troubleshooting_present: true,
            where_to_change_things_present: true },
  documents: [
    { doc_id: "doc-readme", doc_kind: "readme", source_location: "README.md",
      source_of_truth: "product source tree" },
    { doc_id: "doc-api", doc_kind: "api_doc", source_location: "docs/api.md",
      source_of_truth: "OpenAPI contract" },
    { doc_id: "doc-adr", doc_kind: "decision_record",
      source_location: "docs/adr/0001.md", source_of_truth: "decision record in repo" },
  ],
  source_of_truth: { docs_live_with_source_they_describe: true,
                     no_wiki_only_oracle_docs: true },
  config_options: [
    { option_id: "opt-port", default_value: "8080", documented: true },
    { option_id: "opt-mode", default_value: "auto", documented: true },
  ],
  api_docs: { generated_from_or_verified_against_contracts: true },
  endpoints: [
    { endpoint_id: "ep-get-status", documented_in_doc_id: "doc-api",
      has_working_example: true, example_verified_against_contract: true },
    { endpoint_id: "ep-post-job", documented_in_doc_id: "doc-api",
      has_working_example: true, example_verified_against_contract: true },
  ],
  decision_work: { adrs_cross_linked_from_code_where_surprising: true },
  decision_records: [
    { adr_id: "adr-1", documented_in_doc_id: "doc-adr",
      cross_linked_from_code: true },
  ],
  review_verification: { docs_reviewed_like_code: true,
                          docs_updated_in_same_change_as_behavior_changes: true,
                          quickstart_run_from_clean_environment: true,
                          quickstart_works_verbatim_from_clean_state: true,
                          worked_examples_tested: true,
                          screenshots_or_commands_present: true,
                          screenshots_and_commands_verified_current: true },
  plain_language: { short_sentences_used: true, jargon_defined_on_first_use: true,
                    steps_presented_as_lists: true,
                    examples_preferred_over_adjectives: true },
  changelog: { kept_continuously: true, not_retrofitted_at_release_time: true,
               entry_for_current_version_present: true },
  versioning: { doc_set_version: "2.4.0", doc_set_versioned_with_product: true },
  red_lines: { private_contact_or_financial_data_published_in_docs_present: false,
               silent_todo_document_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "TECHNICAL_DOCUMENTATION_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 46);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.documentation_set_docs_count, 3);
  assert.equal(v.documentation_config_options_count, 2);
  assert.equal(v.documentation_endpoints_count, 2);
  assert.equal(v.documentation_decision_records_count, 1);
  assert.deepEqual(v.duplicate_technical_documentation_doc_ids, []);
  assert.equal(v.doc_source_of_truth_ratio, "1.000000");
  assert.equal(v.config_option_documentation_ratio, "1.000000");
  assert.equal(v.endpoint_worked_example_ratio, "1.000000");
  assert.equal(v.decision_record_cross_link_ratio, "1.000000");
});

test("test_readme_quickstart_missing_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.readme.quickstart_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TECHNICAL_DOCUMENTATION_NOT_SOUND");
  assert.equal(v.sections["readme_and_doc_set_structure"], "fail");
  assert.equal(checkStatus(v, "technical_documentation_readme_quickstart_present"), "fail");
});

test("test_duplicate_doc_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.documents[1].doc_id = "doc-readme";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_documentation_doc_id_unique"), "fail");
  assert.deepEqual(v.duplicate_technical_documentation_doc_ids, ["doc-readme"]);
});

test("test_invalid_doc_kind_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.documents[0].doc_kind = "blog_post";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_documentation_doc_kind_recognised"), "fail");
  assert.deepEqual(v.technical_documentation_docs_with_invalid_kind, ["doc-readme"]);
});

test("test_doc_without_source_of_truth_fails", () => {
  const m = clone(COMPLETE) as any;
  m.documents[1].source_of_truth = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_documentation_doc_source_of_truth_declared"), "fail");
  assert.deepEqual(v.technical_documentation_docs_without_source_of_truth, ["doc-api"]);
  assert.equal(v.doc_source_of_truth_ratio, "0.666667");
});

test("test_absent_documents_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.documents;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "technical_documentation_doc_set_list_declared"), "missing");
  assert.equal(v.documentation_set_docs_count, null);
  assert.equal(v.computed_status, null);
});

test("test_empty_config_options_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.config_options = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "technical_documentation_config_options_list_declared"), "fail");
  assert.equal(v.documentation_config_options_count, 0);
});

test("test_config_option_without_default_fails", () => {
  const m = clone(COMPLETE) as any;
  m.config_options[0].default_value = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_documentation_config_option_default_declared"), "fail");
  assert.deepEqual(v.technical_documentation_config_options_without_default, ["opt-port"]);
  assert.equal(v.config_option_documentation_ratio, "0.500000");
});

test("test_config_option_not_documented_fails", () => {
  const m = clone(COMPLETE) as any;
  m.config_options[1].documented = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_documentation_config_option_documented"), "fail");
  assert.deepEqual(v.technical_documentation_config_options_not_documented, ["opt-mode"]);
});

test("test_endpoint_unknown_doc_reference_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.endpoints[0].documented_in_doc_id = "doc-99";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_documentation_endpoint_documented_in_declared_doc"), "fail");
  assert.deepEqual(v.technical_documentation_endpoints_with_unknown_doc_reference, ["ep-get-status"]);
});

test("test_endpoint_without_example_fails", () => {
  const m = clone(COMPLETE) as any;
  m.endpoints[1].has_working_example = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_documentation_endpoint_working_example_declared"), "fail");
  assert.deepEqual(v.technical_documentation_endpoints_without_working_example, ["ep-post-job"]);
  assert.equal(v.endpoint_worked_example_ratio, "0.500000");
});

test("test_endpoint_unverified_example_fails", () => {
  const m = clone(COMPLETE) as any;
  m.endpoints[0].example_verified_against_contract = false;
  assert.equal(checkStatus(evaluate(m), "every_technical_documentation_endpoint_example_verified_against_contract"), "fail");
});

test("test_adr_not_cross_linked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.decision_records[0].cross_linked_from_code = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_documentation_decision_record_cross_linked_from_code"), "fail");
  assert.deepEqual(v.technical_documentation_decision_records_not_cross_linked, ["adr-1"]);
  assert.equal(v.decision_record_cross_link_ratio, "0.000000");
});

test("test_adr_unknown_doc_reference_fails", () => {
  const m = clone(COMPLETE) as any;
  m.decision_records[0].documented_in_doc_id = "doc-99";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_technical_documentation_decision_record_documented_in_declared_doc"), "fail");
  assert.deepEqual(v.technical_documentation_decision_records_with_unknown_doc_reference, ["adr-1"]);
});

test("test_endpoint_missing_doc_reference_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.endpoints[0].documented_in_doc_id;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_technical_documentation_endpoint_documented_in_declared_doc"), "missing");
});

test("test_quickstart_not_working_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.review_verification.quickstart_works_verbatim_from_clean_state = false;
  assert.equal(evaluate(m).sections["review_verification_and_testing"], "fail");
});

test("test_stale_screenshots_fail_gated", () => {
  const m = clone(COMPLETE) as any;
  m.review_verification.screenshots_and_commands_verified_current = false;
  assert.equal(checkStatus(evaluate(m), "technical_documentation_screenshots_and_commands_current_where_present"), "fail");
});

test("test_no_screenshots_passes_gated_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.review_verification.screenshots_or_commands_present = false;
  m.review_verification.screenshots_and_commands_verified_current = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "technical_documentation_screenshots_and_commands_current_where_present"), "pass");
  assert.equal(v.verdict, "TECHNICAL_DOCUMENTATION_SOUND");
});

test("test_jargon_not_defined_fails_section6", () => {
  const m = clone(COMPLETE) as any;
  m.plain_language.jargon_defined_on_first_use = false;
  assert.equal(evaluate(m).sections["plain_language_and_examples"], "fail");
});

test("test_version_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.versioning.doc_set_version = "2.3.0";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "technical_documentation_doc_set_version_matches_product_version"), "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_absent_product_version_is_missing_for_match", () => {
  const m = clone(COMPLETE) as any;
  delete m.product_version;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "technical_documentation_doc_set_version_matches_product_version"), "missing");
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_retrofitted_changelog_fails_section7", () => {
  const m = clone(COMPLETE) as any;
  m.changelog.not_retrofitted_at_release_time = false;
  assert.equal(evaluate(m).sections["changelog_and_versioning"], "fail");
});

test("test_private_data_in_docs_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.private_contact_or_financial_data_published_in_docs_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "TECHNICAL_DOCUMENTATION_NOT_SOUND");
});

test("test_silent_todo_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.silent_todo_document_present = true;
  assert.equal(checkStatus(evaluate(m), "technical_documentation_free_of_silent_todo_document"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.plain_language;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["plain_language_and_examples"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.documentation_set_docs_count, null);
  assert.equal(v.doc_source_of_truth_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: TECHNICAL_DOCUMENTATION_SOUND"));
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
  m.product_name = 12345;
  assert.throws(() => evaluate(m), fieldError("product_name"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ readme: "should-be-an-object" }), fieldError("readme"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ documents: { doc_id: "doc-1" } }), fieldError("documents"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ endpoints: ["ep-1"] }), fieldError("endpoints[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.plain_language.short_sentences_used = "yes";
  assert.throws(() => evaluate(m), fieldError("plain_language.short_sentences_used"));
});

test("malformed: nested list entry bool field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.config_options[0].documented = "true";
  assert.throws(() => evaluate(m), fieldError("config_options[0].documented"));
});

test("malformed: version string as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.versioning.doc_set_version = 240;
  assert.throws(() => evaluate(m), fieldError("versioning.doc_set_version"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.changelog = null;
  assert.throws(() => evaluate(m), fieldError("changelog"));
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
  .filter((f) => f.startsWith("technical-documentation-pack--") && f.endsWith(".json"))
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
