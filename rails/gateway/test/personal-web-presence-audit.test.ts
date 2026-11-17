import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/personal-web-presence-audit.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  person: "example-person",
  hub: { primary_domain_designated: true,
         single_canonical_hub: true,
         redirect_map_in_version_control: true,
         spoke_redirects_tested: true },
  spokes: [
    { domain: "exampleperson.com",
      redirects_to_hub_or_purpose_page: true,
      title_description_consistent_with_hub: true },
    { domain: "example-person.ca",
      redirects_to_hub_or_purpose_page: true,
      title_description_consistent_with_hub: true },
    { domain: "eperson.example",
      redirects_to_hub_or_purpose_page: true,
      title_description_consistent_with_hub: true },
  ],
  identity: { canonical_bio_defined: true,
              canonical_facts_defined: true,
              bio_reused_byte_for_byte: true,
              bio_consistent_across_hub_profiles_signatures: true },
  structured_data: { json_ld_person_present: true,
                     json_ld_validates: true,
                     json_ld_same_as_lists_profiles: true,
                     opengraph_cards_present_per_page: true,
                     opengraph_cards_render_on_major_platforms: true },
  profiles: [
    { platform: "linkedin", bio_matches_canonical: true, links_to_hub: true },
    { platform: "github", bio_matches_canonical: true, links_to_hub: true },
    { platform: "substack", bio_matches_canonical: true, links_to_hub: true },
  ],
  content: { content_sections_present: true,
             claims_verifiable: true,
             claims_dated: true,
             claims_linked: true },
  name_seo: { first_page_for_name_owned: true,
              disambiguation_against_similar_names: true,
              profiles_linked_reciprocally: true,
              rel_me_declared_where_supported: true },
  cadence: { quarterly_refresh_of_bio_and_projects: true,
             prior_versions_archived_publicly: true },
  contact: { stable_contact_path_present: true,
             contact_path_works: true,
             alias_strategy_defined: true,
             forms_preferred_over_raw_email: true,
             spam_controls_present: true },
  measurement: { periodic_name_search_check_performed: true,
                 referrer_review_performed: true,
                 vanity_metrics_ignored: true,
                 impersonation_and_typosquat_watch: true },
  red_lines: { unverifiable_claims_present: false,
               impersonation_confusable_profiles_unfixed_present: false,
               family_privacy_boundaries_violated_present: false,
               brand_domain_lapsed_present: false,
               inflated_titles_present: false,
               borrowed_prestige_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_consistent", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "PERSONAL_PRESENCE_CONSISTENT");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 46);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.spokes_count, 3);
  assert.deepEqual(v.spokes_without_redirect, []);
  assert.equal(v.redirect_coverage, "1.000000");
  assert.deepEqual(v.spokes_without_consistent_title_description, []);
  assert.equal(v.title_description_consistency_coverage, "1.000000");
  assert.deepEqual(v.duplicate_spoke_domains, []);
  assert.equal(v.profiles_count, 3);
  assert.deepEqual(v.profiles_without_matching_bio, []);
  assert.equal(v.bio_match_coverage, "1.000000");
  assert.deepEqual(v.profiles_without_hub_link, []);
  assert.equal(v.hub_link_coverage, "1.000000");
  assert.deepEqual(v.duplicate_profile_platforms, []);
});

test("test_no_single_hub_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.hub.single_canonical_hub = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PERSONAL_PRESENCE_INCONSISTENT");
  assert.equal(v.sections["hub_and_spokes"], "fail");
  assert.equal(checkStatus(v, "single_canonical_hub"), "fail");
});

test("test_spoke_without_redirect_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.spokes[0].redirects_to_hub_or_purpose_page = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PERSONAL_PRESENCE_INCONSISTENT");
  assert.equal(checkStatus(v, "every_spoke_redirects_to_hub_or_purpose_page"), "fail");
  assert.deepEqual(v.spokes_without_redirect, ["exampleperson.com"]);
  assert.equal(v.redirect_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_spoke_missing_redirect_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.spokes[0].redirects_to_hub_or_purpose_page;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_spoke_redirects_to_hub_or_purpose_page"), "missing");
  assert.deepEqual(v.spokes_without_redirect, []);
});

test("test_spoke_inconsistent_title_description_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.spokes[1].title_description_consistent_with_hub = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_spoke_title_description_consistent_with_hub"), "fail");
  assert.deepEqual(v.spokes_without_consistent_title_description, ["example-person.ca"]);
  assert.equal(v.title_description_consistency_coverage, "0.666667");
});

test("test_duplicate_spoke_domain_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.spokes[2].domain = "exampleperson.com";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_spoke_domain_duplicated"), "fail");
  assert.deepEqual(v.duplicate_spoke_domains, ["exampleperson.com"]);
});

test("test_spoke_missing_domain_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.spokes[2].domain;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_spoke_domain_duplicated"), "missing");
  assert.deepEqual(v.duplicate_spoke_domains, []);
});

test("test_empty_spokes_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.spokes = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "spokes_declared"), "fail");
  assert.equal(v.spokes_count, 0);
  assert.equal(v.redirect_coverage, null);
  assert.equal(v.title_description_consistency_coverage, null);
  assert.deepEqual(v.duplicate_spoke_domains, []);
});

test("test_bio_not_reused_fails_section2", () => {
  const m = clone(COMPLETE) as any;
  m.identity.bio_reused_byte_for_byte = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PERSONAL_PRESENCE_INCONSISTENT");
  assert.equal(v.sections["identity_facts_and_structured_data"], "fail");
});

test("test_json_ld_not_validating_fails", () => {
  const m = clone(COMPLETE) as any;
  m.structured_data.json_ld_validates = false;
  assert.equal(checkStatus(evaluate(m), "json_ld_validates"), "fail");
});

test("test_profile_bio_mismatch_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.profiles[0].bio_matches_canonical = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_profile_bio_matches_canonical"), "fail");
  assert.deepEqual(v.profiles_without_matching_bio, ["linkedin"]);
  assert.equal(v.bio_match_coverage, "0.666667");
});

test("test_profile_without_hub_link_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.profiles[1].links_to_hub = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_profile_links_to_hub"), "fail");
  assert.deepEqual(v.profiles_without_hub_link, ["github"]);
  assert.equal(v.hub_link_coverage, "0.666667");
});

test("test_profile_missing_bio_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.profiles[2].bio_matches_canonical;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_profile_bio_matches_canonical"), "missing");
  assert.deepEqual(v.profiles_without_matching_bio, []);
});

test("test_duplicate_profile_platform_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.profiles[2].platform = "linkedin";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_profile_platform_duplicated"), "fail");
  assert.deepEqual(v.duplicate_profile_platforms, ["linkedin"]);
});

test("test_empty_profiles_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.profiles = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "profiles_declared"), "fail");
  assert.equal(v.profiles_count, 0);
  assert.equal(v.bio_match_coverage, null);
  assert.equal(v.hub_link_coverage, null);
});

test("test_undated_claims_fail_section3", () => {
  const m = clone(COMPLETE) as any;
  m.content.claims_dated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PERSONAL_PRESENCE_INCONSISTENT");
  assert.equal(v.sections["content_standards_and_name_seo"], "fail");
});

test("test_no_rel_me_fails", () => {
  const m = clone(COMPLETE) as any;
  m.name_seo.rel_me_declared_where_supported = false;
  assert.equal(checkStatus(evaluate(m), "rel_me_declared_where_supported"), "fail");
});

test("test_no_quarterly_refresh_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.cadence.quarterly_refresh_of_bio_and_projects = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PERSONAL_PRESENCE_INCONSISTENT");
  assert.equal(v.sections["cadence_contact_and_measurement"], "fail");
});

test("test_contact_path_not_working_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contact.contact_path_works = false;
  assert.equal(checkStatus(evaluate(m), "contact_path_works"), "fail");
});

test("test_no_impersonation_watch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.measurement.impersonation_and_typosquat_watch = false;
  assert.equal(checkStatus(evaluate(m), "impersonation_and_typosquat_watch"), "fail");
});

test("test_unverifiable_claims_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unverifiable_claims_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unverifiable_claims"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "PERSONAL_PRESENCE_INCONSISTENT");
});

test("test_domain_lapsed_and_impersonation_red_lines_fail", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.brand_domain_lapsed_present = true;
  m.red_lines.impersonation_confusable_profiles_unfixed_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_brand_domain_lapsed"), "fail");
  assert.equal(checkStatus(v, "no_impersonation_confusable_profiles_unfixed"), "fail");
});

test("test_borrowed_prestige_and_inflated_titles_fail", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.borrowed_prestige_present = true;
  m.red_lines.inflated_titles_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_borrowed_prestige"), "fail");
  assert.equal(checkStatus(v, "no_inflated_titles"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.contact;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["cadence_contact_and_measurement"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.spokes_count, null);
  assert.equal(v.spokes_without_redirect, null);
  assert.equal(v.redirect_coverage, null);
  assert.equal(v.spokes_without_consistent_title_description, null);
  assert.equal(v.title_description_consistency_coverage, null);
  assert.equal(v.duplicate_spoke_domains, null);
  assert.equal(v.profiles_count, null);
  assert.equal(v.profiles_without_matching_bio, null);
  assert.equal(v.bio_match_coverage, null);
  assert.equal(v.profiles_without_hub_link, null);
  assert.equal(v.hub_link_coverage, null);
  assert.equal(v.duplicate_profile_platforms, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: PERSONAL_PRESENCE_CONSISTENT"));
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
  m.person = 12345;
  assert.throws(() => evaluate(m), fieldError("person"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ hub: "should-be-an-object" }), fieldError("hub"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ spokes: { domain: "exampleperson.com" } }), fieldError("spokes"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ spokes: ["exampleperson.com"] }), fieldError("spokes[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.hub.single_canonical_hub = "yes";
  assert.throws(() => evaluate(m), fieldError("hub.single_canonical_hub"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.spokes[0].domain = 42;
  assert.throws(() => evaluate(m), fieldError("spokes[0].domain"));
});

test("malformed: nested list entry boolean as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.profiles[1].bio_matches_canonical = "true";
  assert.throws(() => evaluate(m), fieldError("profiles[1].bio_matches_canonical"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.identity = null;
  assert.throws(() => evaluate(m), fieldError("identity"));
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
  .filter((f) => f.startsWith("personal-web-presence-audit--") && f.endsWith(".json"))
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
