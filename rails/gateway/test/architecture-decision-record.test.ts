import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/architecture-decision-record.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The ADR_COMPLETE manifest, copied from the Python VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  decision: "0007-choice-of-database",
  nfrs: { written: true,
          quantified_where_possible: true,
          agreed_before_design_freeze: true },
  boundaries: { contexts_drawn: true,
                core_kept_small: true,
                hidden_coupling_present: false,
                backdoor_paths_present: false },
  contracts: { interfaces_documented: true,
               interfaces_versioned: true,
               inputs_outputs_defined: true,
               errors_defined: true,
               defined_before_code: true },
  options: { alternatives: [
               { name: "postgres", serious: true,
                 tradeoffs_stated: true },
               { name: "sqlite", serious: true,
                 tradeoffs_stated: true },
               { name: "dynamodb", serious: false,
                 tradeoffs_stated: true }],
             prefers_boring_replaceable_tech: true },
  adr: { numbered: true,
         context_stated: true,
         decision_stated: true,
         consequences_positive_stated: true,
         consequences_negative_stated: true,
         consequences_risks_stated: true,
         status_stated: true,
         page_count: 1 },
  reversibility: { assessed: true,
                   expensive_choices_isolated_behind_interfaces: true,
                   irreversible_decisions_deferred: false },
  security: { data_flows_mapped: true,
              encryption_verification_addressed: true },
  dependencies: { new_dependency_introduced: true,
                  new_dependency_reason_stated: true },
  supersession: { has_superseded_adrs: true,
                  superseded_adrs_linked_to_replacements: true,
                  superseded_silently_rewritten: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 38 Python VerdictTests, ported ----

test("test_complete_manifest_is_adr_complete", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "ADR_COMPLETE");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 32);
});

test("test_alternatives_count_reported", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.alternatives_count, 3);
});

test("test_page_over_limit_serialized_at_fixed_4dp", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.page_count_over_limit, "0.0000");
  const m = clone(COMPLETE) as any;
  m.adr.page_count = 2;
  assert.equal(evaluate(m).page_count_over_limit, "1.0000");
  m.adr.page_count = 0.5;
  assert.equal(evaluate(m).page_count_over_limit, "-0.5000");
});

test("test_page_count_above_one_page_max_fails", () => {
  const m = clone(COMPLETE) as any;
  m.adr.page_count = 2;
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(v.sections["adr_format"], "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_page_count_exactly_one_passes", () => {
  const m = clone(COMPLETE) as any;
  m.adr.page_count = 1;
  assert.equal(evaluate(m).verdict, "ADR_COMPLETE");
});

test("test_page_count_fractional_above_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.adr.page_count = 1.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(v.page_count_over_limit, "0.5000");
});

test("test_non_numeric_page_count_is_missing", () => {
  // Corrected under the F1 ruling: previously expected a verdict
  // over a wrong-typed documented field (the F1 defect).
  const m = clone(COMPLETE) as any;
  m.adr.page_count = "one";
  assert.throws(() => evaluate(m), fieldError("adr.page_count"));
});

test("test_boolean_page_count_is_missing_not_numeric", () => {
  // Corrected under the F1 ruling: a boolean is not a number —
  // previously expected a verdict over the wrong-typed field.
  const m = clone(COMPLETE) as any;
  m.adr.page_count = true;
  assert.throws(() => evaluate(m), fieldError("adr.page_count"));
});

test("test_too_few_alternatives_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options.alternatives = m.options.alternatives.slice(0, 1);
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(v.sections["options_and_tradeoffs"], "fail");
  assert.equal(v.alternatives_count, 1);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_too_many_alternatives_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options.alternatives.push(
    { name: "couchdb", serious: false, tradeoffs_stated: true });
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(v.alternatives_count, 4);
});

test("test_two_alternatives_passes_lower_boundary", () => {
  const m = clone(COMPLETE) as any;
  m.options.alternatives = m.options.alternatives.slice(0, 2);
  assert.equal(evaluate(m).verdict, "ADR_COMPLETE");
});

test("test_alternative_without_tradeoffs_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options.alternatives[1].tradeoffs_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(checkStatus(v, "all_alternatives_tradeoffs_stated"), "fail");
});

test("test_no_serious_alternative_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  for (const alt of m.options.alternatives) alt.serious = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(checkStatus(v, "at_least_one_serious_alternative"), "fail");
});

test("test_empty_alternatives_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.options.alternatives = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(v.alternatives_count, 0);
  assert.equal(checkStatus(v, "alternatives_count_in_stated_range"), "fail");
});

test("test_missing_alternatives_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.options.alternatives;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.alternatives_count, null);
  assert.equal(v.computed_status, null);
});

test("test_non_list_alternatives_is_missing", () => {
  // Corrected under the F1 ruling: previously expected a verdict
  // over a wrong-typed documented field (the F1 defect).
  const m = clone(COMPLETE) as any;
  m.options.alternatives = "postgres-or-sqlite";
  assert.throws(() => evaluate(m), fieldError("options.alternatives"));
});

test("test_non_object_alternative_entries_fail", () => {
  // Corrected under the F1 ruling: previously expected a verdict
  // over wrong-typed list entries (the F1 defect).
  const m = clone(COMPLETE) as any;
  m.options.alternatives = ["postgres", "sqlite"];
  assert.throws(
    () => evaluate(m),
    fieldError("options.alternatives[0]"),
  );
});

test("test_nfrs_not_agreed_before_freeze_fails", () => {
  const m = clone(COMPLETE) as any;
  m.nfrs.agreed_before_design_freeze = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(v.sections["nfrs_first"], "fail");
});

test("test_nfrs_not_quantified_fails", () => {
  const m = clone(COMPLETE) as any;
  m.nfrs.quantified_where_possible = false;
  assert.equal(evaluate(m).verdict, "ADR_NOT_COMPLETE");
});

test("test_hidden_coupling_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.boundaries.hidden_coupling_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(v.sections["boundaries_and_contracts"], "fail");
});

test("test_backdoor_path_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.boundaries.backdoor_paths_present = true;
  assert.equal(evaluate(m).verdict, "ADR_NOT_COMPLETE");
});

test("test_interfaces_not_versioned_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contracts.interfaces_versioned = false;
  assert.equal(evaluate(m).verdict, "ADR_NOT_COMPLETE");
});

test("test_contract_errors_not_defined_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contracts.errors_defined = false;
  assert.equal(evaluate(m).verdict, "ADR_NOT_COMPLETE");
});

test("test_adr_not_numbered_fails", () => {
  const m = clone(COMPLETE) as any;
  m.adr.numbered = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(v.sections["adr_format"], "fail");
});

test("test_consequences_risks_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.adr.consequences_risks_stated = false;
  assert.equal(evaluate(m).verdict, "ADR_NOT_COMPLETE");
});

test("test_status_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.adr.status_stated = false;
  assert.equal(evaluate(m).verdict, "ADR_NOT_COMPLETE");
});

test("test_irreversible_decision_deferred_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.reversibility.irreversible_decisions_deferred = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(v.sections["reversibility_and_security"], "fail");
});

test("test_expensive_choices_not_isolated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.reversibility.expensive_choices_isolated_behind_interfaces = false;
  assert.equal(evaluate(m).verdict, "ADR_NOT_COMPLETE");
});

test("test_data_flows_not_mapped_fails", () => {
  const m = clone(COMPLETE) as any;
  m.security.data_flows_mapped = false;
  assert.equal(evaluate(m).verdict, "ADR_NOT_COMPLETE");
});

test("test_new_dependency_without_reason_fails", () => {
  const m = clone(COMPLETE) as any;
  m.dependencies.new_dependency_reason_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(v.sections["lifecycle_and_dependencies"], "fail");
});

test("test_no_new_dependency_passes_reason_as_not_applicable", () => {
  const m = clone(COMPLETE) as any;
  m.dependencies.new_dependency_introduced = false;
  delete m.dependencies.new_dependency_reason_stated;
  assert.equal(evaluate(m).verdict, "ADR_COMPLETE");
});

test("test_superseded_adr_without_link_fails", () => {
  const m = clone(COMPLETE) as any;
  m.supersession.superseded_adrs_linked_to_replacements = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ADR_NOT_COMPLETE");
  assert.equal(v.sections["lifecycle_and_dependencies"], "fail");
});

test("test_no_superseded_adrs_passes_link_as_not_applicable", () => {
  const m = clone(COMPLETE) as any;
  m.supersession.has_superseded_adrs = false;
  delete m.supersession.superseded_adrs_linked_to_replacements;
  assert.equal(evaluate(m).verdict, "ADR_COMPLETE");
});

test("test_silently_rewritten_superseded_adr_fails", () => {
  const m = clone(COMPLETE) as any;
  m.supersession.superseded_silently_rewritten = true;
  assert.equal(evaluate(m).verdict, "ADR_NOT_COMPLETE");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.security;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["reversibility_and_security"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.alternatives_count, null);
  assert.equal(v.page_count_over_limit, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: ADR_COMPLETE"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types — the Python
// MalformedTypeTests, ported.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.decision = 12345;
  assert.throws(() => evaluate(m), fieldError("decision"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ nfrs: "should-be-an-object" }),
    fieldError("nfrs"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.options.alternatives = "postgres-or-sqlite";
  assert.throws(() => evaluate(m), fieldError("options.alternatives"));
});

test("malformed: list entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.options.alternatives = ["postgres", "sqlite"];
  assert.throws(
    () => evaluate(m),
    fieldError("options.alternatives[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.nfrs.written = "yes";
  assert.throws(() => evaluate(m), fieldError("nfrs.written"));
});

test("malformed: boolean leaf in list entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.options.alternatives[0].serious = "yes";
  assert.throws(
    () => evaluate(m),
    fieldError("options.alternatives[0].serious"),
  );
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.adr.page_count = "one";
  assert.throws(() => evaluate(m), fieldError("adr.page_count"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.security = null;
  assert.throws(() => evaluate(m), fieldError("security"));
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
  .filter((f) => f.startsWith("architecture-decision-record--") && f.endsWith(".json"))
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
