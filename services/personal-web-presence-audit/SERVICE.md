# Personal web presence audit — `personal-web-presence-audit`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Run a personal brand web estate - canonical identity hub, spoke redirects, structured data, consistent bio.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Everyday life who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **nrupalakolkar.com brand estate operations**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the personal web presence manifest

The caller submits one JSON manifest: a declared personal
web-presence record for one person, made from the estate the
caller operates. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`PERSONAL_PRESENCE_INCONSISTENT`). All fields
are booleans unless noted.

| Field | Read by |
|---|---|
| `person` (string; carried into the verdict output, not itself checked) | — |
| `hub.primary_domain_designated` (boolean) | hub_and_spokes |
| `hub.single_canonical_hub` (boolean) | hub_and_spokes |
| `hub.redirect_map_in_version_control` (boolean) | hub_and_spokes |
| `hub.spoke_redirects_tested` (boolean) | hub_and_spokes |
| `spokes` (list of spoke-row objects, each with the entry fields below; computed, see below) | hub_and_spokes |
| `spokes[].domain` (string; names the row in the computed outputs) | hub_and_spokes |
| `spokes[].redirects_to_hub_or_purpose_page` (boolean) | hub_and_spokes |
| `spokes[].title_description_consistent_with_hub` (boolean) | hub_and_spokes |
| `identity.canonical_bio_defined` (boolean) | identity_facts_and_structured_data |
| `identity.canonical_facts_defined` (boolean; the canonical facts — name spelling, credentials, role line, location granularity — are defined once) | identity_facts_and_structured_data |
| `identity.bio_reused_byte_for_byte` (boolean) | identity_facts_and_structured_data |
| `identity.bio_consistent_across_hub_profiles_signatures` (boolean) | identity_facts_and_structured_data |
| `structured_data.json_ld_person_present` (boolean) | identity_facts_and_structured_data |
| `structured_data.json_ld_validates` (boolean) | identity_facts_and_structured_data |
| `structured_data.json_ld_same_as_lists_profiles` (boolean) | identity_facts_and_structured_data |
| `structured_data.opengraph_cards_present_per_page` (boolean) | identity_facts_and_structured_data |
| `structured_data.opengraph_cards_render_on_major_platforms` (boolean) | identity_facts_and_structured_data |
| `profiles` (list of profile-row objects, each with the entry fields below; computed, see below) | identity_facts_and_structured_data |
| `profiles[].platform` (string; names the row in the computed outputs) | identity_facts_and_structured_data |
| `profiles[].bio_matches_canonical` (boolean) | identity_facts_and_structured_data |
| `profiles[].links_to_hub` (boolean) | identity_facts_and_structured_data |
| `content.content_sections_present` (boolean) | content_standards_and_name_seo |
| `content.claims_verifiable` (boolean) | content_standards_and_name_seo |
| `content.claims_dated` (boolean) | content_standards_and_name_seo |
| `content.claims_linked` (boolean) | content_standards_and_name_seo |
| `name_seo.first_page_for_name_owned` (boolean) | content_standards_and_name_seo |
| `name_seo.disambiguation_against_similar_names` (boolean) | content_standards_and_name_seo |
| `name_seo.profiles_linked_reciprocally` (boolean) | content_standards_and_name_seo |
| `name_seo.rel_me_declared_where_supported` (boolean) | content_standards_and_name_seo |
| `cadence.quarterly_refresh_of_bio_and_projects` (boolean) | cadence_contact_and_measurement |
| `cadence.prior_versions_archived_publicly` (boolean) | cadence_contact_and_measurement |
| `contact.stable_contact_path_present` (boolean) | cadence_contact_and_measurement |
| `contact.contact_path_works` (boolean) | cadence_contact_and_measurement |
| `contact.alias_strategy_defined` (boolean) | cadence_contact_and_measurement |
| `contact.forms_preferred_over_raw_email` (boolean) | cadence_contact_and_measurement |
| `contact.spam_controls_present` (boolean) | cadence_contact_and_measurement |
| `measurement.periodic_name_search_check_performed` (boolean) | cadence_contact_and_measurement |
| `measurement.referrer_review_performed` (boolean) | cadence_contact_and_measurement |
| `measurement.vanity_metrics_ignored` (boolean) | cadence_contact_and_measurement |
| `measurement.impersonation_and_typosquat_watch` (boolean) | cadence_contact_and_measurement |
| `red_lines.unverifiable_claims_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.impersonation_confusable_profiles_unfixed_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.family_privacy_boundaries_violated_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.brand_domain_lapsed_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.inflated_titles_present` (boolean; must be `false` to pass — skill standard) | red_lines |
| `red_lines.borrowed_prestige_present` (boolean; must be `false` to pass — skill standard) | red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **Spokes declared:** the declared `spokes` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Redirect per spoke:** every declared spoke row must declare
  `redirects_to_hub_or_purpose_page: true` (the skill: variant
  domains 301 to the hub or to purpose pages). A row with the
  field absent is missing evidence.
- **Consistent title/description per spoke:** every declared
  spoke row must declare
  `title_description_consistent_with_hub: true` (the skill:
  consistent `<title>`/description across spokes). A row with
  the field absent is missing evidence.
- **No spoke domain duplicated:** no declared spoke `domain`
  may appear on more than one spoke row. A row with `domain`
  absent is missing evidence for this check.
- **Profiles declared:** the declared `profiles` list passes
  only when it is present and non-empty; an absent list is
  missing evidence, an empty list fails.
- **Canonical bio per profile:** every declared profile row
  must declare `bio_matches_canonical: true` (the skill: one
  canonical bio reused everywhere). A row with the field absent
  is missing evidence.
- **Hub link per profile:** every declared profile row must
  declare `links_to_hub: true` (the skill: link profiles
  reciprocally). A row with the field absent is missing
  evidence.
- **No profile platform duplicated:** no declared profile
  `platform` may appear on more than one profile row. A row
  with `platform` absent is missing evidence for this check.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the eight primary computed checks above cannot be completed),
`spokes_count` and `profiles_count` (the declared list lengths,
or null when a list is not declared — counts are reported as
integers, exactly), the row-name lists
`spokes_without_redirect` (spokes whose field is present but
not true; a spoke with the field absent is missing evidence and
does not appear), `spokes_without_consistent_title_description`,
`duplicate_spoke_domains` (spoke domains declared on more than
one row, in the order their second occurrence appears),
`profiles_without_matching_bio`, `profiles_without_hub_link`
and `duplicate_profile_platforms`, and the four coverage ratios
`redirect_coverage` (spokes redirecting ÷ declared spokes),
`title_description_consistency_coverage`,
`bio_match_coverage` (profiles carrying the canonical bio ÷
declared profiles) and `hub_link_coverage`.
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric pass/fail threshold — its presence
demands are qualitative declarations the record makes, not bars
the atom can set. Quantities are computed and reported; the
only bar on the computed rows is completeness over the caller's
own declared rows, exactly as stated above. Declined
thresholds, named: a number or share of first-page name-search
results the person must own beyond the skill's qualitative
"own the first page for your name" (no count or percentage is
stated); a number of spoke domains or profiles an estate must
have beyond the two declared lists being non-empty; a
bio-similarity percentage or text-diff bar for "consistent" or
"byte-for-byte" (those are caller declarations, never measured
here); a redirect latency, uptime, or chain-length bar beyond
the declared 301-to-hub-or-purpose-page fact; a JSON-LD
validation score or an OG-render success rate across platforms;
a refresh overdue-days bar beyond the skill's stated quarterly
cadence; a spam-control effectiveness rate, an impersonation or
typosquat count, or a referrer/traffic figure (measurement is
checked as performed, never as a number); a domain-renewal
lead-time bar for the never-lapse red line.

The verdict is one of `PERSONAL_PRESENCE_CONSISTENT` (all 46
checks pass), `PERSONAL_PRESENCE_INCONSISTENT` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence
is missing), across five sections: hub_and_spokes,
identity_facts_and_structured_data,
content_standards_and_name_seo,
cadence_contact_and_measurement, red_lines.

## Distinct ground

The nearest sibling is the deployed `honest-seo-audit-intent-map`
(bound skill `seo`), which audits a declared SEO record for a
**site or product**: crawlability and Core Web Vitals, a
per-page search-intent map, schema.org and entity clarity for
the site, earned authority / link building and Search Console
measurement, and white-hat SEO red lines. This atom's ground is
a **person's** web-presence record: a canonical identity hub
and its spoke domains, one person's canonical bio and identity
facts, that person's profiles, name search for a person's name,
bio/project refresh cadence, a personal contact path, and
personal red lines (unverifiable personal claims,
impersonation-confusable profiles, family privacy, a lapsed
personal domain). The two atoms share **zero checks**: no check
name, manifest field, or row type here appears there, and none
of its checks (crawl, intent-per-page, link authority, Search
Console) appears here. The boundary is: SEO performance of a
site/product there; identity consistency of a person's estate
here. No other live or staged sibling audits a personal
web-presence record.

## Honest scoping

This atom audits a **declared** personal web-presence record —
it fetches nothing, browses nothing, crawls no domain, runs no
search, validates no live JSON-LD, tests no live redirect, and
does not verify that any declared fact is true on the live web.
A presence is consistent *on the caller's declared evidence*: a
record that declares one canonical hub, tested redirects, and a
byte-for-byte bio passes those checks even if the real estate
does none of it. It is a completeness and consistency audit of
the presence record the skill requires, **not a branding,
SEO, or reputation service**: it never judges whether the bio
is well written, whether the hub is the right domain, whether
a claim is actually true, or whether the person's name should
rank differently — only that the record contains what the
skill's method, quality gates, and red lines demand, and that
its declared spoke and profile rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds beyond
the skill's own stated rules (see the declined list above); no
live verification of any declared fact; no verification of any
credential, client, or affiliation named in a bio — the red
line is checked only as the caller's declaration that no
unverifiable claims are present; no judgment of writing quality
or personal-brand strategy; domain registration, renewal, and
lapse prevention itself is `domain-portfolio-ops`' ground —
this atom checks only the caller's declaration that no brand
domain has lapsed.

## U-13 regulatory screen

No — this atom's output could not read as regulated
professional advice (engineering, financial, medical, or
legal): it reports only the completeness and consistency of a
declared personal web-presence record and makes no professional
judgment about any regulated subject; credentials are mentioned
only as facts the caller's own canonical bio defines, never
verified or advised on.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built and
parity-proven locally; no endpoint is live. Release happens one
by one, by the owner's GO, per the approved queue.
