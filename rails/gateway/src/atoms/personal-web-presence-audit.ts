// Personal web presence audit — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/personal-web-presence-audit/src/personal_web_presence_audit.py
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
  person: "string",
  hub: {
    primary_domain_designated: "boolean",
    single_canonical_hub: "boolean",
    redirect_map_in_version_control: "boolean",
    spoke_redirects_tested: "boolean",
  },
  spokes: [{
    domain: "string",
    redirects_to_hub_or_purpose_page: "boolean",
    title_description_consistent_with_hub: "boolean",
  }],
  identity: {
    canonical_bio_defined: "boolean",
    canonical_facts_defined: "boolean",
    bio_reused_byte_for_byte: "boolean",
    bio_consistent_across_hub_profiles_signatures: "boolean",
  },
  structured_data: {
    json_ld_person_present: "boolean",
    json_ld_validates: "boolean",
    json_ld_same_as_lists_profiles: "boolean",
    opengraph_cards_present_per_page: "boolean",
    opengraph_cards_render_on_major_platforms: "boolean",
  },
  profiles: [{
    platform: "string",
    bio_matches_canonical: "boolean",
    links_to_hub: "boolean",
  }],
  content: {
    content_sections_present: "boolean",
    claims_verifiable: "boolean",
    claims_dated: "boolean",
    claims_linked: "boolean",
  },
  name_seo: {
    first_page_for_name_owned: "boolean",
    disambiguation_against_similar_names: "boolean",
    profiles_linked_reciprocally: "boolean",
    rel_me_declared_where_supported: "boolean",
  },
  cadence: {
    quarterly_refresh_of_bio_and_projects: "boolean",
    prior_versions_archived_publicly: "boolean",
  },
  contact: {
    stable_contact_path_present: "boolean",
    contact_path_works: "boolean",
    alias_strategy_defined: "boolean",
    forms_preferred_over_raw_email: "boolean",
    spam_controls_present: "boolean",
  },
  measurement: {
    periodic_name_search_check_performed: "boolean",
    referrer_review_performed: "boolean",
    vanity_metrics_ignored: "boolean",
    impersonation_and_typosquat_watch: "boolean",
  },
  red_lines: {
    unverifiable_claims_present: "boolean",
    impersonation_confusable_profiles_unfixed_present: "boolean",
    family_privacy_boundaries_violated_present: "boolean",
    brand_domain_lapsed_present: "boolean",
    inflated_titles_present: "boolean",
    borrowed_prestige_present: "boolean",
  },
};

export const SECTIONS = [
  "hub_and_spokes",
  "identity_facts_and_structured_data",
  "content_standards_and_name_seo",
  "cadence_contact_and_measurement",
  "red_lines",
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
  person: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  spokes_count: number | null;
  spokes_without_redirect: string[] | null;
  redirect_coverage: string | null;
  spokes_without_consistent_title_description: string[] | null;
  title_description_consistency_coverage: string | null;
  duplicate_spoke_domains: string[] | null;
  profiles_count: number | null;
  profiles_without_matching_bio: string[] | null;
  bio_match_coverage: string | null;
  profiles_without_hub_link: string[] | null;
  hub_link_coverage: string | null;
  duplicate_profile_platforms: string[] | null;
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

function rowKey(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [spokesRaw, hasSpokes] = getPath(manifest, "spokes");
  const spokesIsList = hasSpokes && Array.isArray(spokesRaw);
  const spokeRows: unknown[] = spokesIsList ? (spokesRaw as unknown[]) : [];
  const spokesCount: number | null = spokesIsList ? spokeRows.length : null;

  const spokesWithoutRedirect: string[] | null = spokesIsList
    ? spokeRows.filter((c) => hasField(c, "redirects_to_hub_or_purpose_page") &&
        (c as Record<string, unknown>)["redirects_to_hub_or_purpose_page"] !== true)
        .map((c) => rowKey(c, "domain"))
    : null;
  const spokesWithoutConsistentTitleDescription: string[] | null = spokesIsList
    ? spokeRows.filter((c) => hasField(c, "title_description_consistent_with_hub") &&
        (c as Record<string, unknown>)["title_description_consistent_with_hub"] !== true)
        .map((c) => rowKey(c, "domain"))
    : null;
  let duplicateSpokeDomains: string[] | null = null;
  if (spokesIsList) {
    const seen: string[] = [];
    duplicateSpokeDomains = [];
    for (const c of spokeRows) {
      if (isPyDict(c) && typeof c["domain"] === "string") {
        const nm = c["domain"] as string;
        if (seen.includes(nm) && !duplicateSpokeDomains.includes(nm)) {
          duplicateSpokeDomains.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const redirectCoverage: number | null =
    spokesIsList && spokesCount !== null && spokesCount > 0
      ? spokeRows.filter((c) => isPyDict(c) &&
          c["redirects_to_hub_or_purpose_page"] === true).length / spokesCount
      : null;
  const titleDescriptionConsistencyCoverage: number | null =
    spokesIsList && spokesCount !== null && spokesCount > 0
      ? spokeRows.filter((c) => isPyDict(c) &&
          c["title_description_consistent_with_hub"] === true).length / spokesCount
      : null;

  const [profilesRaw, hasProfiles] = getPath(manifest, "profiles");
  const profilesIsList = hasProfiles && Array.isArray(profilesRaw);
  const profileRows: unknown[] = profilesIsList ? (profilesRaw as unknown[]) : [];
  const profilesCount: number | null = profilesIsList ? profileRows.length : null;

  const profilesWithoutMatchingBio: string[] | null = profilesIsList
    ? profileRows.filter((c) => hasField(c, "bio_matches_canonical") &&
        (c as Record<string, unknown>)["bio_matches_canonical"] !== true)
        .map((c) => rowKey(c, "platform"))
    : null;
  const profilesWithoutHubLink: string[] | null = profilesIsList
    ? profileRows.filter((c) => hasField(c, "links_to_hub") &&
        (c as Record<string, unknown>)["links_to_hub"] !== true)
        .map((c) => rowKey(c, "platform"))
    : null;
  let duplicateProfilePlatforms: string[] | null = null;
  if (profilesIsList) {
    const seen: string[] = [];
    duplicateProfilePlatforms = [];
    for (const c of profileRows) {
      if (isPyDict(c) && typeof c["platform"] === "string") {
        const nm = c["platform"] as string;
        if (seen.includes(nm) && !duplicateProfilePlatforms.includes(nm)) {
          duplicateProfilePlatforms.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const bioMatchCoverage: number | null =
    profilesIsList && profilesCount !== null && profilesCount > 0
      ? profileRows.filter((c) => isPyDict(c) &&
          c["bio_matches_canonical"] === true).length / profilesCount
      : null;
  const hubLinkCoverage: number | null =
    profilesIsList && profilesCount !== null && profilesCount > 0
      ? profileRows.filter((c) => isPyDict(c) &&
          c["links_to_hub"] === true).length / profilesCount
      : null;

  // ---- Section 1: hub_and_spokes ----
  boolCheck(results, "hub_and_spokes",
    "primary_domain_designated", manifest,
    ["hub", "primary_domain_designated"],
    "hub: one primary domain is designated as the identity hub");
  boolCheck(results, "hub_and_spokes",
    "single_canonical_hub", manifest,
    ["hub", "single_canonical_hub"],
    "hub: there is one canonical hub for the person");
  boolCheck(results, "hub_and_spokes",
    "redirect_map_in_version_control", manifest,
    ["hub", "redirect_map_in_version_control"],
    "hub: the redirect map is kept in version control");
  boolCheck(results, "hub_and_spokes",
    "spoke_redirects_tested", manifest,
    ["hub", "spoke_redirects_tested"],
    "hub: all spoke redirects are tested");
  check(results, "hub_and_spokes",
    "spokes_declared", spokesRaw, spokesIsList,
    spokesIsList && (spokesCount as number) > 0,
    "the declared record names its spoke domains — the spokes list is present and non-empty");
  const redirectPresent = spokesIsList &&
    spokeRows.every((c) => hasField(c, "redirects_to_hub_or_purpose_page"));
  check(results, "hub_and_spokes",
    "every_spoke_redirects_to_hub_or_purpose_page", spokesRaw, redirectPresent,
    spokesIsList && (spokesCount as number) > 0 &&
      spokeRows.every((c) => isPyDict(c) && c["redirects_to_hub_or_purpose_page"] === true),
    "spokes: every declared spoke domain 301-redirects to the hub or to a purpose page");
  const titlePresent = spokesIsList &&
    spokeRows.every((c) => hasField(c, "title_description_consistent_with_hub"));
  check(results, "hub_and_spokes",
    "every_spoke_title_description_consistent_with_hub", spokesRaw, titlePresent,
    spokesIsList && (spokesCount as number) > 0 &&
      spokeRows.every((c) => isPyDict(c) && c["title_description_consistent_with_hub"] === true),
    "spokes: every declared spoke carries a title and description consistent with the hub");
  const domainPresent = spokesIsList &&
    spokeRows.every((c) => hasField(c, "domain"));
  check(results, "hub_and_spokes",
    "no_spoke_domain_duplicated", spokesRaw, domainPresent,
    spokesIsList && duplicateSpokeDomains !== null &&
      duplicateSpokeDomains.length === 0,
    "spokes: no declared spoke domain appears on more than one spoke row");

  // ---- Section 2: identity_facts_and_structured_data ----
  boolCheck(results, "identity_facts_and_structured_data",
    "canonical_bio_defined", manifest,
    ["identity", "canonical_bio_defined"],
    "identity: one canonical bio is defined");
  boolCheck(results, "identity_facts_and_structured_data",
    "canonical_facts_defined", manifest,
    ["identity", "canonical_facts_defined"],
    "identity: the canonical facts — name spelling, credentials, role line, location granularity — are defined once");
  boolCheck(results, "identity_facts_and_structured_data",
    "bio_reused_byte_for_byte", manifest,
    ["identity", "bio_reused_byte_for_byte"],
    "identity: the canonical bio is reused everywhere byte-for-byte");
  boolCheck(results, "identity_facts_and_structured_data",
    "bio_consistent_across_hub_profiles_signatures", manifest,
    ["identity", "bio_consistent_across_hub_profiles_signatures"],
    "identity: the bio is consistent across the hub, profiles, and signatures");
  boolCheck(results, "identity_facts_and_structured_data",
    "json_ld_person_present", manifest,
    ["structured_data", "json_ld_person_present"],
    "structured data: JSON-LD Person is present");
  boolCheck(results, "identity_facts_and_structured_data",
    "json_ld_validates", manifest,
    ["structured_data", "json_ld_validates"],
    "structured data: the JSON-LD validates");
  boolCheck(results, "identity_facts_and_structured_data",
    "json_ld_same_as_lists_profiles", manifest,
    ["structured_data", "json_ld_same_as_lists_profiles"],
    "structured data: the JSON-LD Person carries sameAs to the person's profiles");
  boolCheck(results, "identity_facts_and_structured_data",
    "opengraph_cards_present_per_page", manifest,
    ["structured_data", "opengraph_cards_present_per_page"],
    "structured data: OpenGraph cards are present per page");
  boolCheck(results, "identity_facts_and_structured_data",
    "opengraph_cards_render_on_major_platforms", manifest,
    ["structured_data", "opengraph_cards_render_on_major_platforms"],
    "structured data: OG cards render on major platforms");
  check(results, "identity_facts_and_structured_data",
    "profiles_declared", profilesRaw, profilesIsList,
    profilesIsList && (profilesCount as number) > 0,
    "the declared record names its profiles — the profiles list is present and non-empty");
  const bioPresent = profilesIsList &&
    profileRows.every((c) => hasField(c, "bio_matches_canonical"));
  check(results, "identity_facts_and_structured_data",
    "every_profile_bio_matches_canonical", profilesRaw, bioPresent,
    profilesIsList && (profilesCount as number) > 0 &&
      profileRows.every((c) => isPyDict(c) && c["bio_matches_canonical"] === true),
    "profiles: every declared profile carries the canonical bio");
  const linkPresent = profilesIsList &&
    profileRows.every((c) => hasField(c, "links_to_hub"));
  check(results, "identity_facts_and_structured_data",
    "every_profile_links_to_hub", profilesRaw, linkPresent,
    profilesIsList && (profilesCount as number) > 0 &&
      profileRows.every((c) => isPyDict(c) && c["links_to_hub"] === true),
    "profiles: every declared profile links to the hub");
  const platformPresent = profilesIsList &&
    profileRows.every((c) => hasField(c, "platform"));
  check(results, "identity_facts_and_structured_data",
    "no_profile_platform_duplicated", profilesRaw, platformPresent,
    profilesIsList && duplicateProfilePlatforms !== null &&
      duplicateProfilePlatforms.length === 0,
    "profiles: no declared profile platform appears on more than one profile row");

  // ---- Section 3: content_standards_and_name_seo ----
  boolCheck(results, "content_standards_and_name_seo",
    "content_sections_present", manifest,
    ["content", "content_sections_present"],
    "content: the content sections — projects built, writing, speaking — are present");
  boolCheck(results, "content_standards_and_name_seo",
    "claims_verifiable", manifest,
    ["content", "claims_verifiable"],
    "content: each claim is verifiable");
  boolCheck(results, "content_standards_and_name_seo",
    "claims_dated", manifest,
    ["content", "claims_dated"],
    "content: each claim is dated");
  boolCheck(results, "content_standards_and_name_seo",
    "claims_linked", manifest,
    ["content", "claims_linked"],
    "content: each claim is linked");
  boolCheck(results, "content_standards_and_name_seo",
    "first_page_for_name_owned", manifest,
    ["name_seo", "first_page_for_name_owned"],
    "name SEO: the first page for the person's name is owned");
  boolCheck(results, "content_standards_and_name_seo",
    "disambiguation_against_similar_names", manifest,
    ["name_seo", "disambiguation_against_similar_names"],
    "name SEO: the person is disambiguated against similar names");
  boolCheck(results, "content_standards_and_name_seo",
    "profiles_linked_reciprocally", manifest,
    ["name_seo", "profiles_linked_reciprocally"],
    "name SEO: profiles are linked reciprocally");
  boolCheck(results, "content_standards_and_name_seo",
    "rel_me_declared_where_supported", manifest,
    ["name_seo", "rel_me_declared_where_supported"],
    "name SEO: rel=me is declared where supported");

  // ---- Section 4: cadence_contact_and_measurement ----
  boolCheck(results, "cadence_contact_and_measurement",
    "quarterly_refresh_of_bio_and_projects", manifest,
    ["cadence", "quarterly_refresh_of_bio_and_projects"],
    "cadence: bio and projects are refreshed quarterly");
  boolCheck(results, "cadence_contact_and_measurement",
    "prior_versions_archived_publicly", manifest,
    ["cadence", "prior_versions_archived_publicly"],
    "cadence: prior versions are archived publicly — change is normal; inconsistency is the failure");
  boolCheck(results, "cadence_contact_and_measurement",
    "stable_contact_path_present", manifest,
    ["contact", "stable_contact_path_present"],
    "contact: a stable contact path is present");
  boolCheck(results, "cadence_contact_and_measurement",
    "contact_path_works", manifest,
    ["contact", "contact_path_works"],
    "contact: the contact path works");
  boolCheck(results, "cadence_contact_and_measurement",
    "alias_strategy_defined", manifest,
    ["contact", "alias_strategy_defined"],
    "contact: an email alias strategy is defined");
  boolCheck(results, "cadence_contact_and_measurement",
    "forms_preferred_over_raw_email", manifest,
    ["contact", "forms_preferred_over_raw_email"],
    "contact: forms are used over raw email");
  boolCheck(results, "cadence_contact_and_measurement",
    "spam_controls_present", manifest,
    ["contact", "spam_controls_present"],
    "contact: spam controls are present — the contact path is spam-resistant");
  boolCheck(results, "cadence_contact_and_measurement",
    "periodic_name_search_check_performed", manifest,
    ["measurement", "periodic_name_search_check_performed"],
    "measurement: a periodic name-search check is performed");
  boolCheck(results, "cadence_contact_and_measurement",
    "referrer_review_performed", manifest,
    ["measurement", "referrer_review_performed"],
    "measurement: a referrer review is performed");
  boolCheck(results, "cadence_contact_and_measurement",
    "vanity_metrics_ignored", manifest,
    ["measurement", "vanity_metrics_ignored"],
    "measurement: vanity metrics are ignored");
  boolCheck(results, "cadence_contact_and_measurement",
    "impersonation_and_typosquat_watch", manifest,
    ["measurement", "impersonation_and_typosquat_watch"],
    "measurement: impersonation and typosquats are watched for");

  // ---- Section 5: red_lines ----
  falseCheck(results, "red_lines",
    "no_unverifiable_claims", manifest,
    ["red_lines", "unverifiable_claims_present"],
    "red line: no unverifiable claims — especially credentials, clients, or affiliations — are present");
  falseCheck(results, "red_lines",
    "no_impersonation_confusable_profiles_unfixed", manifest,
    ["red_lines", "impersonation_confusable_profiles_unfixed_present"],
    "red line: no impersonation-confusable profiles are left unfixed");
  falseCheck(results, "red_lines",
    "no_family_privacy_boundary_violations", manifest,
    ["red_lines", "family_privacy_boundaries_violated_present"],
    "red line: family privacy boundaries are respected");
  falseCheck(results, "red_lines",
    "no_brand_domain_lapsed", manifest,
    ["red_lines", "brand_domain_lapsed_present"],
    "red line: no brand domain has lapsed");
  falseCheck(results, "red_lines",
    "no_inflated_titles", manifest,
    ["red_lines", "inflated_titles_present"],
    "red line: no inflated titles are present");
  falseCheck(results, "red_lines",
    "no_borrowed_prestige", manifest,
    ["red_lines", "borrowed_prestige_present"],
    "red line: no borrowed prestige is present");

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
    verdict = "PERSONAL_PRESENCE_INCONSISTENT";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "PERSONAL_PRESENCE_CONSISTENT";
  }

  const computedNames = [
    "spokes_declared",
    "every_spoke_redirects_to_hub_or_purpose_page",
    "every_spoke_title_description_consistent_with_hub",
    "no_spoke_domain_duplicated",
    "profiles_declared",
    "every_profile_bio_matches_canonical",
    "every_profile_links_to_hub",
    "no_profile_platform_duplicated",
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
    service: "personal-web-presence-audit",
    atom_version: "0.1.0",
    person: manifest["person"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    spokes_count: spokesCount,
    spokes_without_redirect: spokesWithoutRedirect,
    redirect_coverage: fmt6(redirectCoverage),
    spokes_without_consistent_title_description:
      spokesWithoutConsistentTitleDescription,
    title_description_consistency_coverage:
      fmt6(titleDescriptionConsistencyCoverage),
    duplicate_spoke_domains: duplicateSpokeDomains,
    profiles_count: profilesCount,
    profiles_without_matching_bio: profilesWithoutMatchingBio,
    bio_match_coverage: fmt6(bioMatchCoverage),
    profiles_without_hub_link: profilesWithoutHubLink,
    hub_link_coverage: fmt6(hubLinkCoverage),
    duplicate_profile_platforms: duplicateProfilePlatforms,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PERSONAL WEB PRESENCE AUDIT",
    `person: ${pyStr(verdict.person ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
