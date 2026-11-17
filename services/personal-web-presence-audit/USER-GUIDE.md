# Personal web presence audit — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You run a personal web estate — one canonical identity hub, spoke domains pointing to it, one canonical bio and identity facts reused everywhere — and you have a record of that estate. This atom reads one declared manifest and returns one deterministic verdict across five sections (hub_and_spokes, identity_facts_and_structured_data, content_standards_and_name_seo, cadence_contact_and_measurement, red_lines): **PERSONAL_PRESENCE_CONSISTENT**, **PERSONAL_PRESENCE_INCONSISTENT**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 46 checks. It audits the declared record's completeness and consistency only — it fetches nothing, browses nothing, crawls no domain, runs no search, validates no live JSON-LD, tests no live redirect, and does not verify that any declared fact is true on the live web. A presence is consistent *on your declared evidence*: it never judges whether the bio is well written, whether the hub is the right domain, whether a claim is actually true, or whether the person's name should rank differently. The eight computed checks: the declared `spokes` list must be present and non-empty; every spoke row must redirect to the hub or a purpose page and carry a title/description consistent with the hub; no spoke `domain` may be duplicated; the declared `profiles` list must be present and non-empty; every profile row must carry the canonical bio and link to the hub; and no profile `platform` may be duplicated. Note: every `red_lines.*_present` field must be `false` to pass. No numeric threshold is imposed — no number or share of first-page name-search results beyond the skill's qualitative "own the first page for your name", no number of spoke domains or profiles beyond the two declared lists being non-empty, no bio-similarity percentage or text-diff bar, no redirect latency, uptime or chain-length bar, no JSON-LD validation score or OG-render success rate, no refresh overdue-days bar beyond the stated quarterly cadence, no spam-control effectiveness rate, impersonation or typosquat count, or referrer/traffic figure, and no domain-renewal lead-time bar; those declined thresholds are named in the service definition. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "personal-web-presence-audit"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/personal-web-presence-audit` — tool name `personal_web_presence_audit`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/personal-web-presence-audit` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `person` | person name (string; carried into the output, not checked) |
| `hub.primary_domain_designated` | hub evidence: one primary domain is designated as the identity hub |
| `hub.single_canonical_hub` | hub evidence: there is one canonical hub for the person |
| `hub.redirect_map_in_version_control` | hub evidence: the redirect map is kept in version control |
| `hub.spoke_redirects_tested` | hub evidence: all spoke redirects are tested |
| `spokes` (list of spoke-row objects) | computed: must be present and non-empty; reported as `spokes_count` |
| `spokes[].domain` (string) | names the row in the computed outputs; computed: no domain may appear on more than one row (reported in `duplicate_spoke_domains`) |
| `spokes[].redirects_to_hub_or_purpose_page` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `spokes_without_redirect` |
| `spokes[].title_description_consistent_with_hub` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `spokes_without_consistent_title_description` |
| `identity.canonical_bio_defined` | identity evidence: one canonical bio is defined |
| `identity.canonical_facts_defined` | identity evidence: the canonical facts — name spelling, credentials, role line, location granularity — are defined once |
| `identity.bio_reused_byte_for_byte` | identity evidence: the canonical bio is reused everywhere byte-for-byte |
| `identity.bio_consistent_across_hub_profiles_signatures` | identity evidence: the bio is consistent across the hub, profiles, and signatures |
| `structured_data.json_ld_person_present` | structured-data evidence: JSON-LD Person is present |
| `structured_data.json_ld_validates` | structured-data evidence: the JSON-LD validates |
| `structured_data.json_ld_same_as_lists_profiles` | structured-data evidence: the JSON-LD Person carries sameAs to the person's profiles |
| `structured_data.opengraph_cards_present_per_page` | structured-data evidence: OpenGraph cards are present per page |
| `structured_data.opengraph_cards_render_on_major_platforms` | structured-data evidence: OG cards render on major platforms |
| `profiles` (list of profile-row objects) | computed: must be present and non-empty; reported as `profiles_count` |
| `profiles[].platform` (string) | names the row in the computed outputs; computed: no platform may appear on more than one row (reported in `duplicate_profile_platforms`) |
| `profiles[].bio_matches_canonical` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `profiles_without_matching_bio` |
| `profiles[].links_to_hub` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `profiles_without_hub_link` |
| `content.content_sections_present` | content evidence: the content sections — projects built, writing, speaking — are present |
| `content.claims_verifiable` | content evidence: each claim is verifiable |
| `content.claims_dated` | content evidence: each claim is dated |
| `content.claims_linked` | content evidence: each claim is linked |
| `name_seo.first_page_for_name_owned` | name-SEO evidence: the first page for the person's name is owned |
| `name_seo.disambiguation_against_similar_names` | name-SEO evidence: the person is disambiguated against similar names |
| `name_seo.profiles_linked_reciprocally` | name-SEO evidence: profiles are linked reciprocally |
| `name_seo.rel_me_declared_where_supported` | name-SEO evidence: rel=me is declared where supported |
| `cadence.quarterly_refresh_of_bio_and_projects` | cadence evidence: bio and projects are refreshed quarterly |
| `cadence.prior_versions_archived_publicly` | cadence evidence: prior versions are archived publicly |
| `contact.stable_contact_path_present` | contact evidence: a stable contact path is present |
| `contact.contact_path_works` | contact evidence: the contact path works |
| `contact.alias_strategy_defined` | contact evidence: an email alias strategy is defined |
| `contact.forms_preferred_over_raw_email` | contact evidence: forms are used over raw email |
| `contact.spam_controls_present` | contact evidence: spam controls are present |
| `measurement.periodic_name_search_check_performed` | measurement evidence: a periodic name-search check is performed |
| `measurement.referrer_review_performed` | measurement evidence: a referrer review is performed |
| `measurement.vanity_metrics_ignored` | measurement evidence: vanity metrics are ignored |
| `measurement.impersonation_and_typosquat_watch` | measurement evidence: impersonation and typosquats are watched for |
| `red_lines.unverifiable_claims_present` | must be `false` to pass (red line: no unverifiable claims) |
| `red_lines.impersonation_confusable_profiles_unfixed_present` | must be `false` to pass (red line: no impersonation-confusable profiles left unfixed) |
| `red_lines.family_privacy_boundaries_violated_present` | must be `false` to pass (red line: family privacy boundaries respected) |
| `red_lines.brand_domain_lapsed_present` | must be `false` to pass (red line: no brand domain has lapsed) |
| `red_lines.inflated_titles_present` | must be `false` to pass (red line: no inflated titles) |
| `red_lines.borrowed_prestige_present` | must be `false` to pass (red line: no borrowed prestige) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward PERSONAL_PRESENCE_INCONSISTENT). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/personal-web-presence-audit`:

```json
{
  "person": "Jane Doe",
  "hub": {
    "primary_domain_designated": true,
    "single_canonical_hub": true,
    "redirect_map_in_version_control": true,
    "spoke_redirects_tested": true
  },
  "spokes": [
    {
      "domain": "janedoe.net",
      "redirects_to_hub_or_purpose_page": true,
      "title_description_consistent_with_hub": true
    }
  ],
  "identity": {
    "canonical_bio_defined": true,
    "canonical_facts_defined": true,
    "bio_reused_byte_for_byte": true,
    "bio_consistent_across_hub_profiles_signatures": true
  },
  "structured_data": {
    "json_ld_person_present": true,
    "json_ld_validates": true,
    "json_ld_same_as_lists_profiles": true,
    "opengraph_cards_present_per_page": true,
    "opengraph_cards_render_on_major_platforms": true
  },
  "profiles": [
    {
      "platform": "linkedin",
      "bio_matches_canonical": true,
      "links_to_hub": true
    }
  ],
  "content": {
    "content_sections_present": true,
    "claims_verifiable": true,
    "claims_dated": true,
    "claims_linked": true
  },
  "name_seo": {
    "first_page_for_name_owned": true,
    "disambiguation_against_similar_names": true,
    "profiles_linked_reciprocally": true,
    "rel_me_declared_where_supported": true
  },
  "cadence": {
    "quarterly_refresh_of_bio_and_projects": true,
    "prior_versions_archived_publicly": true
  },
  "contact": {
    "stable_contact_path_present": true,
    "contact_path_works": true,
    "alias_strategy_defined": true,
    "forms_preferred_over_raw_email": true,
    "spam_controls_present": true
  },
  "measurement": {
    "periodic_name_search_check_performed": true,
    "referrer_review_performed": true,
    "vanity_metrics_ignored": true,
    "impersonation_and_typosquat_watch": true
  },
  "red_lines": {
    "unverifiable_claims_present": false,
    "impersonation_confusable_profiles_unfixed_present": false,
    "family_privacy_boundaries_violated_present": false,
    "brand_domain_lapsed_present": false,
    "inflated_titles_present": false,
    "borrowed_prestige_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 46 checks and a text stamp of the verdict):

```json
{
  "service": "personal-web-presence-audit",
  "atom_version": "0.1.0",
  "person": "Jane Doe",
  "verdict": "PERSONAL_PRESENCE_CONSISTENT",
  "sections": {
    "hub_and_spokes": "pass",
    "identity_facts_and_structured_data": "pass",
    "content_standards_and_name_seo": "pass",
    "cadence_contact_and_measurement": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "spokes_count": 1,
  "spokes_without_redirect": [],
  "redirect_coverage": "1.000000",
  "spokes_without_consistent_title_description": [],
  "title_description_consistency_coverage": "1.000000",
  "duplicate_spoke_domains": [],
  "profiles_count": 1,
  "profiles_without_matching_bio": [],
  "bio_match_coverage": "1.000000",
  "profiles_without_hub_link": [],
  "hub_link_coverage": "1.000000",
  "duplicate_profile_platforms": [],
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across five sections."
}
```

## Verdicts

- **PERSONAL_PRESENCE_CONSISTENT** — every check passes; the declared personal web-presence record is complete and consistent with the skill's checklist and red lines.
- **PERSONAL_PRESENCE_INCONSISTENT** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `spokes_count` and `profiles_count` (the declared list lengths as integers, or null when a list is not declared), the row-name lists `spokes_without_redirect`, `spokes_without_consistent_title_description`, `duplicate_spoke_domains`, `profiles_without_matching_bio`, `profiles_without_hub_link` and `duplicate_profile_platforms` (null when the relevant list is not declared; a row with the relevant field absent is missing evidence and does not appear in these lists), the coverage values `redirect_coverage`, `title_description_consistency_coverage`, `bio_match_coverage` and `hub_link_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the eight primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
