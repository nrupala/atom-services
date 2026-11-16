import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/decision-ready-research-brief.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The RESEARCH_BRIEF_DECISION_READY manifest, copied from the
// Python VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  brief: "vendor-selection-brief",
  scope: { decision_named: true, questions_ranked: true,
           timebox_declared: true, timebox_respected: true,
           enough_criteria_defined: true },
  questions: [
    { name: "which_vendor" },
    { name: "what_risks" },
  ],
  source_strategy: {
    primary_preferred_over_secondary_and_tertiary: true },
  sources: [
    { name: "vendor_filing", link: "https://example.test/filing",
      date: "2026-11-01", quote: "filing quote",
      source_type: "primary", incentives_noted: true },
    { name: "trade_review", link: "https://example.test/review",
      date: "2026-11-03", quote: "review quote",
      source_type: "secondary", incentives_noted: true },
  ],
  evidence: { notes_question_oriented: true,
              evidence_table_present: true,
              fact_estimate_opinion_separated: true,
              gaps_recorded: true },
  claims: [
    { name: "vendor_is_reliable", kind: "fact",
      material: true, important: true,
      supporting_source_names: ["vendor_filing", "trade_review"],
      confidence_stated: true },
    { name: "price_is_fair", kind: "estimate",
      material: true, important: false,
      supporting_source_names: ["trade_review"],
      confidence_stated: true },
  ],
  synthesis: { structured_by_question: true,
               opposing_view_steelmanned: true,
               quantified_where_possible: true,
               confidence_stated: true,
               unknowns_stated_explicitly: true },
  report: { version: "1.0", date: "2026-11-10",
            open_questions_listed: true },
  report_sections: ["bluf", "findings", "evidence", "risks",
                    "open_questions", "sources"],
  reuse: { notes_archived_for_reuse: true,
           updates_via_changelog: true,
           silent_edits_present: false },
  tooling: { automation_does_not_replace_verification: true,
             ai_summaries_used: true,
             ai_summaries_cite_sources: true,
             ai_summaries_spot_checked: true,
             seo_spam_and_content_farms_screened: true,
             scraped_or_automated_data_used: true,
             scraped_or_automated_data_quality_checked: true },
  disclosure: { conflicts_present: true,
                conflicts_disclosed: true,
                unsourced_claims_present: false,
                single_source_conclusions_on_important_facts_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 33 Python VerdictTests, ported ----

test("test_complete_manifest_is_decision_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "RESEARCH_BRIEF_DECISION_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 42);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.questions_count, 2);
  assert.equal(v.sources_count, 2);
  assert.deepEqual(v.sources_without_complete_provenance, []);
  assert.equal(v.source_provenance_coverage, "1.0000");
  assert.equal(v.claims_count, 2);
  assert.deepEqual(v.material_claims_without_sources, []);
  assert.equal(v.material_claim_source_coverage, "1.0000");
  assert.deepEqual(v.important_claims_not_triangulated, []);
  assert.equal(v.important_claim_triangulation_coverage, "1.0000");
});

test("test_decision_not_named_fails_scoping_section", () => {
  const m = clone(COMPLETE) as any;
  m.scope.decision_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RESEARCH_BRIEF_NOT_DECISION_READY");
  assert.equal(v.sections["scoping_and_sources"], "fail");
});

test("test_empty_questions_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.questions = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "questions_declared"), "fail");
  assert.equal(v.questions_count, 0);
});

test("test_source_without_link_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.sources[1].link = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "RESEARCH_BRIEF_NOT_DECISION_READY");
  assert.equal(checkStatus(v, "every_source_has_link"), "fail");
  assert.deepEqual(v.sources_without_complete_provenance, ["trade_review"]);
  assert.equal(v.source_provenance_coverage, "0.5000");
});

test("test_source_missing_date_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.sources[0].date;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_source_has_date"), "missing");
  assert.deepEqual(v.sources_without_complete_provenance, ["vendor_filing"]);
});

test("test_source_incentives_not_noted_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sources[0].incentives_noted = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_source_incentives_noted"), "fail");
});

test("test_material_claim_without_matching_source_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.claims[1].supporting_source_names = ["undeclared_source"];
  const v = evaluate(m);
  assert.equal(v.verdict, "RESEARCH_BRIEF_NOT_DECISION_READY");
  assert.equal(checkStatus(v, "every_material_claim_sourced_from_declared_sources"), "fail");
  assert.deepEqual(v.material_claims_without_sources, ["price_is_fair"]);
  assert.equal(v.material_claim_source_coverage, "0.5000");
});

test("test_material_claim_missing_supporting_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.claims[0].supporting_source_names;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_material_claim_sourced_from_declared_sources"), "missing");
  assert.deepEqual(v.material_claims_without_sources, []);
});

test("test_non_material_claim_needs_no_source", () => {
  const m = clone(COMPLETE) as any;
  m.claims[1].material = false;
  delete m.claims[1].supporting_source_names;
  const v = evaluate(m);
  assert.equal(v.verdict, "RESEARCH_BRIEF_DECISION_READY");
  assert.equal(v.material_claim_source_coverage, "1.0000");
});

test("test_important_claim_with_one_source_is_not_triangulated", () => {
  const m = clone(COMPLETE) as any;
  m.claims[0].supporting_source_names = ["vendor_filing"];
  const v = evaluate(m);
  assert.equal(v.verdict, "RESEARCH_BRIEF_NOT_DECISION_READY");
  assert.equal(checkStatus(v, "every_important_claim_triangulated_across_declared_sources"), "fail");
  assert.deepEqual(v.important_claims_not_triangulated, ["vendor_is_reliable"]);
  assert.equal(v.important_claim_triangulation_coverage, "0.0000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_duplicate_supporting_source_does_not_triangulate", () => {
  const m = clone(COMPLETE) as any;
  m.claims[0].supporting_source_names = ["vendor_filing", "vendor_filing"];
  const v = evaluate(m);
  assert.deepEqual(v.important_claims_not_triangulated, ["vendor_is_reliable"]);
});

test("test_claim_without_confidence_fails", () => {
  const m = clone(COMPLETE) as any;
  m.claims[1].confidence_stated = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_claim_confidence_stated"), "fail");
});

test("test_claim_without_kind_fails", () => {
  const m = clone(COMPLETE) as any;
  m.claims[0].kind = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_claim_kind_declared"), "fail");
});

test("test_opposing_view_not_steelmanned_fails", () => {
  const m = clone(COMPLETE) as any;
  m.synthesis.opposing_view_steelmanned = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RESEARCH_BRIEF_NOT_DECISION_READY");
  assert.equal(v.sections["synthesis_and_report_structure"], "fail");
});

test("test_report_sections_out_of_order_fail", () => {
  const m = clone(COMPLETE) as any;
  m.report_sections = ["findings", "bluf", "evidence", "risks", "open_questions", "sources"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "report_sections_in_skill_order"), "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_report_section_missing_fails_order_check", () => {
  const m = clone(COMPLETE) as any;
  m.report_sections = ["bluf", "findings", "evidence", "open_questions", "sources"];
  assert.equal(checkStatus(evaluate(m), "report_sections_in_skill_order"), "fail");
});

test("test_empty_report_version_fails", () => {
  const m = clone(COMPLETE) as any;
  m.report.version = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "report_version_declared"), "fail");
});

test("test_absent_report_date_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.report.date;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "report_date_declared"), "missing");
});

test("test_silent_edits_fail", () => {
  const m = clone(COMPLETE) as any;
  m.reuse.silent_edits_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "RESEARCH_BRIEF_NOT_DECISION_READY");
  assert.equal(v.sections["reuse_verification_and_red_lines"], "fail");
});

test("test_ai_summary_not_spot_checked_fails_when_used", () => {
  const m = clone(COMPLETE) as any;
  m.tooling.ai_summaries_spot_checked = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "ai_summaries_spot_checked_when_used"), "fail");
});

test("test_no_ai_summaries_passes_ai_checks_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.tooling.ai_summaries_used = false;
  delete m.tooling.ai_summaries_cite_sources;
  delete m.tooling.ai_summaries_spot_checked;
  const v = evaluate(m);
  assert.equal(v.verdict, "RESEARCH_BRIEF_DECISION_READY");
  assert.equal(checkStatus(v, "ai_summaries_cite_sources_when_used"), "pass");
});

test("test_ai_spot_check_missing_when_used", () => {
  const m = clone(COMPLETE) as any;
  delete m.tooling.ai_summaries_spot_checked;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "ai_summaries_spot_checked_when_used"), "missing");
});

test("test_scraped_data_not_quality_checked_fails_when_used", () => {
  const m = clone(COMPLETE) as any;
  m.tooling.scraped_or_automated_data_quality_checked = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "scraped_or_automated_data_quality_checked_when_used"), "fail");
});

test("test_no_scraped_data_passes_quality_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.tooling.scraped_or_automated_data_used = false;
  delete m.tooling.scraped_or_automated_data_quality_checked;
  const v = evaluate(m);
  assert.equal(v.verdict, "RESEARCH_BRIEF_DECISION_READY");
});

test("test_conflicts_not_disclosed_fail_when_present", () => {
  const m = clone(COMPLETE) as any;
  m.disclosure.conflicts_disclosed = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "conflicts_disclosed_when_present"), "fail");
});

test("test_no_conflicts_passes_disclosure_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.disclosure.conflicts_present = false;
  delete m.disclosure.conflicts_disclosed;
  const v = evaluate(m);
  assert.equal(v.verdict, "RESEARCH_BRIEF_DECISION_READY");
});

test("test_unsourced_claims_present_fails", () => {
  const m = clone(COMPLETE) as any;
  m.disclosure.unsourced_claims_present = true;
  assert.equal(evaluate(m).verdict, "RESEARCH_BRIEF_NOT_DECISION_READY");
});

test("test_single_source_conclusions_present_fails", () => {
  const m = clone(COMPLETE) as any;
  m.disclosure.single_source_conclusions_on_important_facts_present = true;
  assert.equal(evaluate(m).verdict, "RESEARCH_BRIEF_NOT_DECISION_READY");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.evidence;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["evidence_and_notes"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.questions_count, null);
  assert.equal(v.sources_count, null);
  assert.equal(v.sources_without_complete_provenance, null);
  assert.equal(v.source_provenance_coverage, null);
  assert.equal(v.material_claims_without_sources, null);
  assert.equal(v.material_claim_source_coverage, null);
  assert.equal(v.important_claims_not_triangulated, null);
  assert.equal(v.important_claim_triangulation_coverage, null);
});

test("test_no_material_or_important_claims_ratios_are_null", () => {
  const m = clone(COMPLETE) as any;
  for (const c of m.claims) { c.material = false; c.important = false; }
  const v = evaluate(m);
  assert.equal(v.verdict, "RESEARCH_BRIEF_DECISION_READY");
  assert.equal(v.material_claim_source_coverage, null);
  assert.equal(v.important_claim_triangulation_coverage, null);
  assert.deepEqual(v.material_claims_without_sources, []);
  assert.deepEqual(v.important_claims_not_triangulated, []);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: RESEARCH_BRIEF_DECISION_READY"));
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

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.brief = 12345;
  assert.throws(() => evaluate(m), fieldError("brief"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ scope: "should-be-an-object" }),
    fieldError("scope"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ sources: { name: "vendor_filing" } }),
    fieldError("sources"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ sources: ["vendor_filing"] }),
    fieldError("sources[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.scope.decision_named = "yes";
  assert.throws(() => evaluate(m), fieldError("scope.decision_named"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sources[1].link = 42;
  assert.throws(() => evaluate(m), fieldError("sources[1].link"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sources[0].incentives_noted = "yes";
  assert.throws(() => evaluate(m), fieldError("sources[0].incentives_noted"));
});

test("malformed: supporting names list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.claims[0].supporting_source_names = [123];
  assert.throws(() => evaluate(m), fieldError("claims[0].supporting_source_names[0]"));
});

test("malformed: supporting names as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.claims[0].supporting_source_names = "vendor_filing";
  assert.throws(() => evaluate(m), fieldError("claims[0].supporting_source_names"));
});

test("malformed: report sections entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.report_sections = ["bluf", 42];
  assert.throws(() => evaluate(m), fieldError("report_sections[1]"));
});

test("malformed: claim entry field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.claims[0].confidence_stated = "yes";
  assert.throws(() => evaluate(m), fieldError("claims[0].confidence_stated"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tooling = null;
  assert.throws(() => evaluate(m), fieldError("tooling"));
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
  .filter((f) => f.startsWith("decision-ready-research-brief--") && f.endsWith(".json"))
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
