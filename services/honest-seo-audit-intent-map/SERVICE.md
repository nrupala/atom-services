# Honest seo audit intent map — `honest-seo-audit-intent-map`

**Deliverable type:** MAP. This atom sells the map it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Earn search traffic honestly — technical SEO, content strategy, structured data, measurement, white-hat only.

A caller submits the inputs the bound skill works on and receives one map back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this map on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Growing content and product sites**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the SEO audit / intent-map manifest

The caller submits one JSON manifest: a declared SEO record and
intent map for one site. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`HONEST_SEO_MAP_NOT_SOUND`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `site` (string; carried into the verdict output, not itself checked) | — |
| `technical.crawlable_robots_and_sitemap` (boolean) | technical_foundation |
| `technical.core_web_vitals_targets_addressed` (boolean) | technical_foundation |
| `technical.mobile_first` (boolean) | technical_foundation |
| `technical.https_enabled` (boolean) | technical_foundation |
| `technical.canonical_tags_correct` (boolean) | technical_foundation |
| `technical.accidental_noindex_or_blocked_paths_present` (boolean; must be `false` to pass) | technical_foundation |
| `technical.clean_url_structure` (boolean) | technical_foundation |
| `technical.not_found_404s_handled` (boolean) | technical_foundation |
| `intent.audience_questions_mapped` (boolean) | intent_map_and_on_page_craft |
| `intent.intent_type_assigned_per_question` (boolean) | intent_map_and_on_page_craft |
| `intent.prioritization_by_relevance_and_feasibility` (boolean) | intent_map_and_on_page_craft |
| `on_page.titles_and_descriptions_specific_and_honest` (boolean) | intent_map_and_on_page_craft |
| `on_page.heading_hierarchy_present` (boolean) | intent_map_and_on_page_craft |
| `on_page.internal_links_with_descriptive_anchors` (boolean) | intent_map_and_on_page_craft |
| `on_page.clickbait_mismatch_present` (boolean; must be `false` to pass) | intent_map_and_on_page_craft |
| `on_page.word_count_padding_present` (boolean; must be `false` to pass) | intent_map_and_on_page_craft |
| `pages` (list of page-row objects, each with the entry fields below; computed, see below) | intent_map_and_on_page_craft |
| `pages[].name` (string; names the row in the computed outputs) | intent_map_and_on_page_craft |
| `pages[].intent` (string; the specific intent the page owns; duplicate ownership is computed, see below) | intent_map_and_on_page_craft |
| `pages[].intent_type` (string; must be one of `informational`, `commercial`, `transactional` — the skill's own set) | intent_map_and_on_page_craft |
| `pages[].has_single_intent` (boolean) | intent_map_and_on_page_craft |
| `pages[].fully_answers_question` (boolean) | intent_map_and_on_page_craft |
| `structured_data.schema_org_applied_as_applicable` (boolean) | structured_data_and_entity_clarity |
| `structured_data.rich_results_validated` (boolean) | structured_data_and_entity_clarity |
| `entity.brand_name_contact_consistent` (boolean) | structured_data_and_entity_clarity |
| `entity.real_author_identity_for_professional_content` (boolean) | structured_data_and_entity_clarity |
| `entity.credentials_carried_where_appropriate` (boolean) | structured_data_and_entity_clarity |
| `entity.public_content_sanitization_applied` (boolean) | structured_data_and_entity_clarity |
| `authority.useful_assets_created_to_attract_links` (boolean) | earned_authority_and_measurement |
| `authority.relevant_human_outreach_only` (boolean) | earned_authority_and_measurement |
| `measurement.search_console_and_analytics_wired` (boolean) | earned_authority_and_measurement |
| `measurement.search_console_baseline_captured` (boolean) | earned_authority_and_measurement |
| `measurement.impressions_clicks_conversions_tracked` (boolean) | earned_authority_and_measurement |
| `measurement.queries_gained_lost_tracked` (boolean) | earned_authority_and_measurement |
| `measurement.monthly_iteration_cadence` (boolean) | earned_authority_and_measurement |
| `measurement.decaying_pages_refreshed_on_schedule` (boolean) | earned_authority_and_measurement |
| `ai_era.structure_and_canonical_answers_designed_for_extraction` (boolean) | earned_authority_and_measurement |
| `red_lines.cloaking_present` (boolean; must be `false` to pass — skill red line) | white_hat_red_lines |
| `red_lines.pbn_present` (boolean; must be `false` to pass — skill red line) | white_hat_red_lines |
| `red_lines.bought_links_present` (boolean; must be `false` to pass — skill red line) | white_hat_red_lines |
| `red_lines.link_schemes_present` (boolean; must be `false` to pass — skill red line) | white_hat_red_lines |
| `red_lines.keyword_spam_present` (boolean; must be `false` to pass — skill red line) | white_hat_red_lines |
| `red_lines.misleading_metadata_present` (boolean; must be `false` to pass — skill red line) | white_hat_red_lines |
| `red_lines.fake_urgency_present` (boolean; must be `false` to pass — skill red line) | white_hat_red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Pages declared:** the declared `pages` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Single intent per page:** every declared page row must
  declare `has_single_intent: true` (the skill: "one intent
  per page"). A row with the field absent is missing evidence.
- **Intent type per page:** every declared page row must
  declare `intent_type` from the skill's own set —
  `informational`, `commercial`, `transactional`. A row with
  the field absent is missing evidence; a row declaring any
  other value fails and is named.
- **No intent owned by multiple pages:** no declared `intent`
  string may appear on more than one page row (quality gate:
  "each key page owns one intent"). A row with `intent` absent
  is missing evidence for this check.
- **Fully answers per page:** every declared page row must
  declare `fully_answers_question: true` (the skill: content
  that "fully answers the question").

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the five primary computed checks above cannot be completed),
`pages_count` (the declared list length, or null when the list
is not declared — counts are reported as integers, exactly),
the row-name lists `pages_without_single_intent` (pages whose
field is present but not true; a page with the field absent is
missing evidence and does not appear),
`pages_with_invalid_intent_type` (pages whose `intent_type` is
present but not in the skill's set), `duplicate_intents` (intent
strings declared on more than one page, in the order their
second occurrence appears) and `pages_not_fully_answering`
(pages whose field is present but not true), and the three
coverage ratios `single_intent_coverage` (pages with a single
intent ÷ declared pages), `valid_intent_type_coverage` (pages
with a valid intent type ÷ declared pages) and
`full_answer_coverage` (pages fully answering ÷ declared pages).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric pass/fail threshold — no speed,
ranking or traffic bar: its targets are qualitative attestations
the record declares addressed, not bars the atom can set.
Quantities are computed and reported; the only bar on the
computed rows is completeness over the caller's own declared
rows, exactly as stated above. Declined thresholds, named: a
Core Web Vitals millisecond, LCP / INP / CLS or score cutoff
(the skill says "fast (Core Web Vitals targets)" but states no
number — caller attestation only); a traffic, impression,
click, click-through-rate, ranking-position or conversion
target; a word count or content-depth minimum (the skill
explicitly rejects word-count padding); a number of internal
or external links, a link-acquisition count, or an outreach
volume; a number of pages, questions or intents a map must
contain; a schema-type quota beyond "as applicable" (the skill
lists Article, FAQ, Product, LocalBusiness as applicable, not
mandatory); a refresh interval other than the skill's stated
monthly iteration and scheduled refresh (no day count is
stated); a coverage percentage below completeness.

The verdict is one of `HONEST_SEO_MAP_SOUND` (all 43 checks
pass), `HONEST_SEO_MAP_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across five sections: technical_foundation,
intent_map_and_on_page_craft, structured_data_and_entity_clarity,
earned_authority_and_measurement, white_hat_red_lines.

## Distinct ground

No live or staged sibling atom audits a declared SEO record or
intent map. The nearest sibling, `efficient-web-build-standard`,
audits a web build's publish-time precompute and on-site
search/filter index (its "search" is a site's own search over
its dataset, not search-engine visibility) — zero checks are
shared with this atom; the boundary is: build mechanics and
on-site search there, search-engine crawl / intent / authority /
measurement and white-hat red lines here.

## Honest scoping

This atom audits a **declared** SEO record and intent map — it
crawls no site, runs no speed test, reads no Search Console or
analytics data, validates no live rich result, and does not
verify that a declared control actually works. A record is sound
*on the caller's declared evidence*: a manifest that declares
HTTPS enabled, canonicals correct and no bought links passes
those checks even if the real site does none of it. It is a
completeness and consistency audit of the record the skill
requires, **not an SEO service, a ranking guarantee, or a
penalty certification**: it never judges whether a page really
answers its question well, whether an intent assignment is the
right strategy, whether schema markup is correct in detail, or
whether outreach is genuinely relevant — only that the record
contains what the skill's sections and red lines demand, and
that its declared rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds beyond
the skill's own stated rules (see the declined list above); no
live verification of any declared fact; no text inspection —
clickbait, misleading metadata, keyword spam and fake urgency
are caller-declared present/absent flags, the atom reads no
copy; content quality and strategic fit of an intent map are
caller declarations — the atom checks only that questions,
types and single-intent ownership are declared and consistent;
E-E-A-T quality in substance (whether credentials or author
identity genuinely establish expertise) is a caller declaration
— only its declared presence is checked.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Commodity despite audit shape
