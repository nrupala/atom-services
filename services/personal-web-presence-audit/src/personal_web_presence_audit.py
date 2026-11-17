#!/usr/bin/env python3
"""Personal web presence audit — deterministic core.

Built from the bound skill `personal-web-presence`: "Run a
personal web estate — one canonical hub, consistent facts and
spokes that point to it." ("The internet's default answer to
'who is this person?' is noise. A personal estate should answer
with one canonical, verifiable hub — and every spoke domain
pointing at it with consistent facts.")

This atom is an AUDIT of a declared personal web-presence
record: it audits the record a caller declares against the
estate the skill defines — one canonical identity hub with
tested spoke redirects and a version-controlled redirect map,
one canonical bio and identity facts reused everywhere with
JSON-LD `Person` and OpenGraph cards, content whose claims are
verifiable, dated and linked, name SEO, a quarterly refresh
cadence with prior versions archived, a stable spam-resistant
contact path, periodic name-search and impersonation
measurement, and the skill's red lines refused. It fetches
nothing, browses nothing, and does not verify that a declared
fact is true on the live web — it checks that the presence
record the skill requires is present and internally complete
and consistent on the declared evidence.

Distinct ground: the nearest sibling is the deployed
`honest-seo-audit-intent-map` (bound skill `seo`), which audits
a declared SEO record for a SITE or PRODUCT — crawlability and
Core Web Vitals, a per-page search-intent map, schema.org and
entity clarity for the site, earned authority / link building
and Search Console measurement, and white-hat SEO red lines.
This atom's ground is a PERSON's web-presence record: a
canonical identity hub and its spoke domains, one person's
canonical bio and identity facts, that person's profiles, name
search for a person's name, bio/project refresh cadence, and
personal red lines (unverifiable personal claims, impersonation-
confusable profiles, family privacy, a lapsed personal domain).
Zero checks are shared with that atom: no check name, manifest
field, or row type here appears there, and none of its checks
(crawl, intent-per-page, link authority, Search Console) appears
here. The boundary is: SEO performance of a site/product there;
identity consistency of a person's estate here.

The caller submits a presence manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- spokes: the declared `spokes` list must be non-empty, and
  every declared spoke row must redirect (301) to the hub or a
  purpose page and carry a title/description consistent with
  the hub (the skill: "variant domains 301 to it (or to purpose
  pages); consistent <title>/description across spokes");
- spoke-domain ownership: no declared spoke domain may appear
  on more than one spoke row (internal consistency);
- profiles: the declared `profiles` list must be non-empty, and
  every declared profile row must carry the canonical bio
  (bio matches canonical) and link to the hub (the skill: one
  canonical bio "reused everywhere"; "link profiles
  reciprocally");
- profile-platform ownership: no declared profile platform may
  appear on more than one profile row (internal consistency).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold — no search-result count
or ranking position, no number of spokes or profiles beyond the
declared lists being non-empty, no bio-similarity percentage,
no redirect latency, no spam or impersonation rate — so no
numeric threshold check is invented; quantities are computed
and reported, with completeness (every declared spoke and
profile row) as the only bar, exactly as stated above.

Verdict:
- any fail             -> PERSONAL_PRESENCE_INCONSISTENT
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> PERSONAL_PRESENCE_CONSISTENT

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "hub_and_spokes",
    "identity_facts_and_structured_data",
    "content_standards_and_name_seo",
    "cadence_contact_and_measurement",
    "red_lines",
)

MANIFEST_SPEC = {
    "person": "string",
    "hub": {
        "primary_domain_designated": "boolean",
        "single_canonical_hub": "boolean",
        "redirect_map_in_version_control": "boolean",
        "spoke_redirects_tested": "boolean",
    },
    "spokes": [{
        "domain": "string",
        "redirects_to_hub_or_purpose_page": "boolean",
        "title_description_consistent_with_hub": "boolean",
    }],
    "identity": {
        "canonical_bio_defined": "boolean",
        "canonical_facts_defined": "boolean",
        "bio_reused_byte_for_byte": "boolean",
        "bio_consistent_across_hub_profiles_signatures": "boolean",
    },
    "structured_data": {
        "json_ld_person_present": "boolean",
        "json_ld_validates": "boolean",
        "json_ld_same_as_lists_profiles": "boolean",
        "opengraph_cards_present_per_page": "boolean",
        "opengraph_cards_render_on_major_platforms": "boolean",
    },
    "profiles": [{
        "platform": "string",
        "bio_matches_canonical": "boolean",
        "links_to_hub": "boolean",
    }],
    "content": {
        "content_sections_present": "boolean",
        "claims_verifiable": "boolean",
        "claims_dated": "boolean",
        "claims_linked": "boolean",
    },
    "name_seo": {
        "first_page_for_name_owned": "boolean",
        "disambiguation_against_similar_names": "boolean",
        "profiles_linked_reciprocally": "boolean",
        "rel_me_declared_where_supported": "boolean",
    },
    "cadence": {
        "quarterly_refresh_of_bio_and_projects": "boolean",
        "prior_versions_archived_publicly": "boolean",
    },
    "contact": {
        "stable_contact_path_present": "boolean",
        "contact_path_works": "boolean",
        "alias_strategy_defined": "boolean",
        "forms_preferred_over_raw_email": "boolean",
        "spam_controls_present": "boolean",
    },
    "measurement": {
        "periodic_name_search_check_performed": "boolean",
        "referrer_review_performed": "boolean",
        "vanity_metrics_ignored": "boolean",
        "impersonation_and_typosquat_watch": "boolean",
    },
    "red_lines": {
        "unverifiable_claims_present": "boolean",
        "impersonation_confusable_profiles_unfixed_present": "boolean",
        "family_privacy_boundaries_violated_present": "boolean",
        "brand_domain_lapsed_present": "boolean",
        "inflated_titles_present": "boolean",
        "borrowed_prestige_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_key(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for a personal web presence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    spokes, has_spokes = _get(manifest, "spokes")
    spokes_is_list = has_spokes and isinstance(spokes, list)
    spokes_count = len(spokes) if spokes_is_list else None
    spoke_rows = spokes if spokes_is_list else []

    spokes_without_redirect = (
        [_row_key(c, "domain") for c in spoke_rows
         if isinstance(c, dict)
         and "redirects_to_hub_or_purpose_page" in c
         and c.get("redirects_to_hub_or_purpose_page") is not True]
        if spokes_is_list else None
    )
    spokes_without_consistent_title_description = (
        [_row_key(c, "domain") for c in spoke_rows
         if isinstance(c, dict)
         and "title_description_consistent_with_hub" in c
         and c.get("title_description_consistent_with_hub") is not True]
        if spokes_is_list else None
    )
    duplicate_spoke_domains = None
    if spokes_is_list:
        seen = []
        duplicate_spoke_domains = []
        for c in spoke_rows:
            if isinstance(c, dict) and isinstance(c.get("domain"), str):
                nm = c["domain"]
                if nm in seen and nm not in duplicate_spoke_domains:
                    duplicate_spoke_domains.append(nm)
                seen.append(nm)
    redirect_coverage = (
        sum(1 for c in spoke_rows
            if isinstance(c, dict)
            and c.get("redirects_to_hub_or_purpose_page") is True)
        / spokes_count
        if spokes_is_list and spokes_count > 0 else None
    )
    title_description_consistency_coverage = (
        sum(1 for c in spoke_rows
            if isinstance(c, dict)
            and c.get("title_description_consistent_with_hub") is True)
        / spokes_count
        if spokes_is_list and spokes_count > 0 else None
    )

    profiles, has_profiles = _get(manifest, "profiles")
    profiles_is_list = has_profiles and isinstance(profiles, list)
    profiles_count = len(profiles) if profiles_is_list else None
    profile_rows = profiles if profiles_is_list else []

    profiles_without_matching_bio = (
        [_row_key(c, "platform") for c in profile_rows
         if isinstance(c, dict)
         and "bio_matches_canonical" in c
         and c.get("bio_matches_canonical") is not True]
        if profiles_is_list else None
    )
    profiles_without_hub_link = (
        [_row_key(c, "platform") for c in profile_rows
         if isinstance(c, dict)
         and "links_to_hub" in c
         and c.get("links_to_hub") is not True]
        if profiles_is_list else None
    )
    duplicate_profile_platforms = None
    if profiles_is_list:
        seen = []
        duplicate_profile_platforms = []
        for c in profile_rows:
            if isinstance(c, dict) and isinstance(c.get("platform"), str):
                nm = c["platform"]
                if nm in seen and nm not in duplicate_profile_platforms:
                    duplicate_profile_platforms.append(nm)
                seen.append(nm)
    bio_match_coverage = (
        sum(1 for c in profile_rows
            if isinstance(c, dict)
            and c.get("bio_matches_canonical") is True)
        / profiles_count
        if profiles_is_list and profiles_count > 0 else None
    )
    hub_link_coverage = (
        sum(1 for c in profile_rows
            if isinstance(c, dict)
            and c.get("links_to_hub") is True)
        / profiles_count
        if profiles_is_list and profiles_count > 0 else None
    )

    # ---- Section 1: hub_and_spokes (skill Method 1 "Hub &
    #      spokes" and Quality gate "One canonical hub; all
    #      spoke redirects tested" — one primary domain as the
    #      identity hub, variant domains 301 to it or to purpose
    #      pages, consistent title/description across spokes,
    #      the redirect map in version control; plus the
    #      computed spoke rows) ----
    _bool_check(results, "hub_and_spokes",
                "primary_domain_designated", manifest,
                ("hub", "primary_domain_designated"),
                "hub: one primary domain is designated as the "
                "identity hub")
    _bool_check(results, "hub_and_spokes",
                "single_canonical_hub", manifest,
                ("hub", "single_canonical_hub"),
                "hub: there is one canonical hub for the person")
    _bool_check(results, "hub_and_spokes",
                "redirect_map_in_version_control", manifest,
                ("hub", "redirect_map_in_version_control"),
                "hub: the redirect map is kept in version control")
    _bool_check(results, "hub_and_spokes",
                "spoke_redirects_tested", manifest,
                ("hub", "spoke_redirects_tested"),
                "hub: all spoke redirects are tested")
    _check(results, "hub_and_spokes",
           "spokes_declared", spokes, spokes_is_list,
           spokes_is_list and spokes_count > 0,
           "the declared record names its spoke domains — the "
           "spokes list is present and non-empty")
    redirect_present = (
        spokes_is_list
        and all(isinstance(c, dict)
                and "redirects_to_hub_or_purpose_page" in c
                for c in spoke_rows)
    )
    _check(results, "hub_and_spokes",
           "every_spoke_redirects_to_hub_or_purpose_page", spokes,
           redirect_present,
           spokes_is_list and spokes_count > 0
           and all(isinstance(c, dict)
                   and c.get("redirects_to_hub_or_purpose_page") is True
                   for c in spoke_rows),
           "spokes: every declared spoke domain 301-redirects "
           "to the hub or to a purpose page")
    title_present = (
        spokes_is_list
        and all(isinstance(c, dict)
                and "title_description_consistent_with_hub" in c
                for c in spoke_rows)
    )
    _check(results, "hub_and_spokes",
           "every_spoke_title_description_consistent_with_hub",
           spokes, title_present,
           spokes_is_list and spokes_count > 0
           and all(isinstance(c, dict)
                   and c.get("title_description_consistent_with_hub")
                   is True
                   for c in spoke_rows),
           "spokes: every declared spoke carries a title and "
           "description consistent with the hub")
    domain_present = (
        spokes_is_list
        and all(isinstance(c, dict) and "domain" in c
                for c in spoke_rows)
    )
    _check(results, "hub_and_spokes",
           "no_spoke_domain_duplicated", spokes, domain_present,
           spokes_is_list and duplicate_spoke_domains is not None
           and len(duplicate_spoke_domains) == 0,
           "spokes: no declared spoke domain appears on more "
           "than one spoke row")

    # ---- Section 2: identity_facts_and_structured_data (skill
    #      Method 2 "Identity facts" and Quality gates "JSON-LD
    #      validates; OG cards render" and "Bio consistent
    #      across hub, profiles, and signatures" — one canonical
    #      bio reused byte-for-byte, JSON-LD Person with sameAs,
    #      OpenGraph cards per page; plus the computed profile
    #      rows) ----
    _bool_check(results, "identity_facts_and_structured_data",
                "canonical_bio_defined", manifest,
                ("identity", "canonical_bio_defined"),
                "identity: one canonical bio is defined")
    _bool_check(results, "identity_facts_and_structured_data",
                "canonical_facts_defined", manifest,
                ("identity", "canonical_facts_defined"),
                "identity: the canonical facts — name spelling, "
                "credentials, role line, location granularity — "
                "are defined once")
    _bool_check(results, "identity_facts_and_structured_data",
                "bio_reused_byte_for_byte", manifest,
                ("identity", "bio_reused_byte_for_byte"),
                "identity: the canonical bio is reused everywhere "
                "byte-for-byte")
    _bool_check(results, "identity_facts_and_structured_data",
                "bio_consistent_across_hub_profiles_signatures",
                manifest,
                ("identity",
                 "bio_consistent_across_hub_profiles_signatures"),
                "identity: the bio is consistent across the hub, "
                "profiles, and signatures")
    _bool_check(results, "identity_facts_and_structured_data",
                "json_ld_person_present", manifest,
                ("structured_data", "json_ld_person_present"),
                "structured data: JSON-LD Person is present")
    _bool_check(results, "identity_facts_and_structured_data",
                "json_ld_validates", manifest,
                ("structured_data", "json_ld_validates"),
                "structured data: the JSON-LD validates")
    _bool_check(results, "identity_facts_and_structured_data",
                "json_ld_same_as_lists_profiles", manifest,
                ("structured_data", "json_ld_same_as_lists_profiles"),
                "structured data: the JSON-LD Person carries "
                "sameAs to the person's profiles")
    _bool_check(results, "identity_facts_and_structured_data",
                "opengraph_cards_present_per_page", manifest,
                ("structured_data", "opengraph_cards_present_per_page"),
                "structured data: OpenGraph cards are present "
                "per page")
    _bool_check(results, "identity_facts_and_structured_data",
                "opengraph_cards_render_on_major_platforms", manifest,
                ("structured_data",
                 "opengraph_cards_render_on_major_platforms"),
                "structured data: OG cards render on major "
                "platforms")
    _check(results, "identity_facts_and_structured_data",
           "profiles_declared", profiles, profiles_is_list,
           profiles_is_list and profiles_count > 0,
           "the declared record names its profiles — the "
           "profiles list is present and non-empty")
    bio_present = (
        profiles_is_list
        and all(isinstance(c, dict) and "bio_matches_canonical" in c
                for c in profile_rows)
    )
    _check(results, "identity_facts_and_structured_data",
           "every_profile_bio_matches_canonical", profiles,
           bio_present,
           profiles_is_list and profiles_count > 0
           and all(isinstance(c, dict)
                   and c.get("bio_matches_canonical") is True
                   for c in profile_rows),
           "profiles: every declared profile carries the "
           "canonical bio")
    link_present = (
        profiles_is_list
        and all(isinstance(c, dict) and "links_to_hub" in c
                for c in profile_rows)
    )
    _check(results, "identity_facts_and_structured_data",
           "every_profile_links_to_hub", profiles, link_present,
           profiles_is_list and profiles_count > 0
           and all(isinstance(c, dict)
                   and c.get("links_to_hub") is True
                   for c in profile_rows),
           "profiles: every declared profile links to the hub")
    platform_present = (
        profiles_is_list
        and all(isinstance(c, dict) and "platform" in c
                for c in profile_rows)
    )
    _check(results, "identity_facts_and_structured_data",
           "no_profile_platform_duplicated", profiles,
           platform_present,
           profiles_is_list and duplicate_profile_platforms is not None
           and len(duplicate_profile_platforms) == 0,
           "profiles: no declared profile platform appears on "
           "more than one profile row")

    # ---- Section 3: content_standards_and_name_seo (skill
    #      Method 3 "Content with standards" and Method 4 "Name
    #      SEO" — projects / writing / speaking, each claim
    #      verifiable, dated, and linked; own the first page for
    #      the name, disambiguate against similar names, link
    #      profiles reciprocally, rel=me where supported) ----
    _bool_check(results, "content_standards_and_name_seo",
                "content_sections_present", manifest,
                ("content", "content_sections_present"),
                "content: the content sections — projects built, "
                "writing, speaking — are present")
    _bool_check(results, "content_standards_and_name_seo",
                "claims_verifiable", manifest,
                ("content", "claims_verifiable"),
                "content: each claim is verifiable")
    _bool_check(results, "content_standards_and_name_seo",
                "claims_dated", manifest,
                ("content", "claims_dated"),
                "content: each claim is dated")
    _bool_check(results, "content_standards_and_name_seo",
                "claims_linked", manifest,
                ("content", "claims_linked"),
                "content: each claim is linked")
    _bool_check(results, "content_standards_and_name_seo",
                "first_page_for_name_owned", manifest,
                ("name_seo", "first_page_for_name_owned"),
                "name SEO: the first page for the person's name "
                "is owned")
    _bool_check(results, "content_standards_and_name_seo",
                "disambiguation_against_similar_names", manifest,
                ("name_seo", "disambiguation_against_similar_names"),
                "name SEO: the person is disambiguated against "
                "similar names")
    _bool_check(results, "content_standards_and_name_seo",
                "profiles_linked_reciprocally", manifest,
                ("name_seo", "profiles_linked_reciprocally"),
                "name SEO: profiles are linked reciprocally")
    _bool_check(results, "content_standards_and_name_seo",
                "rel_me_declared_where_supported", manifest,
                ("name_seo", "rel_me_declared_where_supported"),
                "name SEO: rel=me is declared where supported")

    # ---- Section 4: cadence_contact_and_measurement (skill
    #      Method 5 "Cadence", Method 6 "Contact & email",
    #      Method 7 "Measurement" and Quality gates "Contact
    #      path works and is spam-resistant" and "Prior versions
    #      archived publicly" — quarterly refresh, published
    #      archive, stable contact path with alias strategy and
    #      forms over raw email, periodic name-search check and
    #      referrer review, vanity metrics ignored, watch for
    #      impersonation and typosquats) ----
    _bool_check(results, "cadence_contact_and_measurement",
                "quarterly_refresh_of_bio_and_projects", manifest,
                ("cadence", "quarterly_refresh_of_bio_and_projects"),
                "cadence: bio and projects are refreshed quarterly")
    _bool_check(results, "cadence_contact_and_measurement",
                "prior_versions_archived_publicly", manifest,
                ("cadence", "prior_versions_archived_publicly"),
                "cadence: prior versions are archived publicly — "
                "change is normal; inconsistency is the failure")
    _bool_check(results, "cadence_contact_and_measurement",
                "stable_contact_path_present", manifest,
                ("contact", "stable_contact_path_present"),
                "contact: a stable contact path is present")
    _bool_check(results, "cadence_contact_and_measurement",
                "contact_path_works", manifest,
                ("contact", "contact_path_works"),
                "contact: the contact path works")
    _bool_check(results, "cadence_contact_and_measurement",
                "alias_strategy_defined", manifest,
                ("contact", "alias_strategy_defined"),
                "contact: an email alias strategy is defined")
    _bool_check(results, "cadence_contact_and_measurement",
                "forms_preferred_over_raw_email", manifest,
                ("contact", "forms_preferred_over_raw_email"),
                "contact: forms are used over raw email")
    _bool_check(results, "cadence_contact_and_measurement",
                "spam_controls_present", manifest,
                ("contact", "spam_controls_present"),
                "contact: spam controls are present — the "
                "contact path is spam-resistant")
    _bool_check(results, "cadence_contact_and_measurement",
                "periodic_name_search_check_performed", manifest,
                ("measurement", "periodic_name_search_check_performed"),
                "measurement: a periodic name-search check is "
                "performed")
    _bool_check(results, "cadence_contact_and_measurement",
                "referrer_review_performed", manifest,
                ("measurement", "referrer_review_performed"),
                "measurement: a referrer review is performed")
    _bool_check(results, "cadence_contact_and_measurement",
                "vanity_metrics_ignored", manifest,
                ("measurement", "vanity_metrics_ignored"),
                "measurement: vanity metrics are ignored")
    _bool_check(results, "cadence_contact_and_measurement",
                "impersonation_and_typosquat_watch", manifest,
                ("measurement", "impersonation_and_typosquat_watch"),
                "measurement: impersonation and typosquats are "
                "watched for")

    # ---- Section 5: red_lines (skill "Red lines" and Method 3
    #      standards — no unverifiable claims, especially
    #      credentials, clients, or affiliations; no
    #      impersonation-confusable profiles left unfixed;
    #      family privacy boundaries respected; never let a
    #      brand domain lapse; no borrowed prestige, no
    #      inflated titles) ----
    _false_check(results, "red_lines",
                 "no_unverifiable_claims", manifest,
                 ("red_lines", "unverifiable_claims_present"),
                 "red line: no unverifiable claims — especially "
                 "credentials, clients, or affiliations — are "
                 "present")
    _false_check(results, "red_lines",
                 "no_impersonation_confusable_profiles_unfixed",
                 manifest,
                 ("red_lines",
                  "impersonation_confusable_profiles_unfixed_present"),
                 "red line: no impersonation-confusable profiles "
                 "are left unfixed")
    _false_check(results, "red_lines",
                 "no_family_privacy_boundary_violations", manifest,
                 ("red_lines",
                  "family_privacy_boundaries_violated_present"),
                 "red line: family privacy boundaries are respected")
    _false_check(results, "red_lines",
                 "no_brand_domain_lapsed", manifest,
                 ("red_lines", "brand_domain_lapsed_present"),
                 "red line: no brand domain has lapsed")
    _false_check(results, "red_lines",
                 "no_inflated_titles", manifest,
                 ("red_lines", "inflated_titles_present"),
                 "red line: no inflated titles are present")
    _false_check(results, "red_lines",
                 "no_borrowed_prestige", manifest,
                 ("red_lines", "borrowed_prestige_present"),
                 "red line: no borrowed prestige is present")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "PERSONAL_PRESENCE_INCONSISTENT"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "PERSONAL_PRESENCE_CONSISTENT"

    computed_names = (
        "spokes_declared",
        "every_spoke_redirects_to_hub_or_purpose_page",
        "every_spoke_title_description_consistent_with_hub",
        "no_spoke_domain_duplicated",
        "profiles_declared",
        "every_profile_bio_matches_canonical",
        "every_profile_links_to_hub",
        "no_profile_platform_duplicated",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "personal-web-presence-audit",
        "atom_version": "0.1.0",
        "person": manifest.get("person"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "spokes_count": spokes_count,
        "spokes_without_redirect": spokes_without_redirect,
        "redirect_coverage": _fmt6(redirect_coverage),
        "spokes_without_consistent_title_description":
            spokes_without_consistent_title_description,
        "title_description_consistency_coverage":
            _fmt6(title_description_consistency_coverage),
        "duplicate_spoke_domains": duplicate_spoke_domains,
        "profiles_count": profiles_count,
        "profiles_without_matching_bio": profiles_without_matching_bio,
        "bio_match_coverage": _fmt6(bio_match_coverage),
        "profiles_without_hub_link": profiles_without_hub_link,
        "hub_link_coverage": _fmt6(hub_link_coverage),
        "duplicate_profile_platforms": duplicate_profile_platforms,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "PERSONAL WEB PRESENCE AUDIT",
        f"person: {verdict.get('person')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: personal_web_presence_audit.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "PERSONAL_PRESENCE_CONSISTENT" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
