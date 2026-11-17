# Honest SEO audit intent map — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are trying to earn search traffic honestly — technical SEO, content strategy, structured data, measurement, white-hat only — and you have a record of your site's SEO state and intent map. This atom reads one declared manifest and returns one deterministic verdict across five sections: **HONEST_SEO_MAP_SOUND**, **HONEST_SEO_MAP_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it crawls no site, runs no speed test, reads no Search Console or analytics data, validates no live rich result, and does not verify that a declared control actually works. A record is sound *on your declared evidence*: it never judges whether a page really answers its question well, whether an intent assignment is the right strategy, whether schema markup is correct in detail, or whether outreach is genuinely relevant. Computed checks: the declared `pages` list must be present and non-empty; every page row must own a single intent, must declare an intent type from the skill's own set (`informational`, `commercial`, `transactional`), and must fully answer its question; and no declared `intent` string may be owned by more than one page row. No numeric threshold is imposed — no Core Web Vitals millisecond, LCP / INP / CLS or score cutoff, no traffic, impression, click, click-through-rate, ranking-position or conversion target, no word count or content-depth minimum, no number of internal or external links, link-acquisition count or outreach volume, no number of pages, questions or intents a map must contain, no schema-type quota beyond "as applicable", no refresh interval other than the stated monthly iteration and scheduled refresh, and no coverage percentage below completeness. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "honest-seo-audit-intent-map"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/honest-seo-audit-intent-map` — tool name `honest_seo_audit_intent_map`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/honest-seo-audit-intent-map` — body = the manifest object; same `Authorization` header.

## Input — the SEO audit / intent-map manifest

| Field | Meaning |
|---|---|
| `site` | site name (string; carried into the output, not checked) |
| `technical.crawlable_robots_and_sitemap` | technical evidence: robots.txt and sitemap are in place (crawlable) |
| `technical.core_web_vitals_targets_addressed` | technical evidence: Core Web Vitals targets are addressed |
| `technical.mobile_first` | technical evidence: the site is mobile-first |
| `technical.https_enabled` | technical evidence: HTTPS is enabled |
| `technical.canonical_tags_correct` | technical evidence: canonical tags are correct |
| `technical.accidental_noindex_or_blocked_paths_present` | must be `false` to pass (technical line: no accidental noindex or blocked paths) |
| `technical.clean_url_structure` | technical evidence: URL structure is clean |
| `technical.not_found_404s_handled` | technical evidence: 404s are handled |
| `intent.audience_questions_mapped` | intent-map evidence: audience questions are mapped |
| `intent.intent_type_assigned_per_question` | intent-map evidence: an intent type is assigned per question |
| `intent.prioritization_by_relevance_and_feasibility` | intent-map evidence: prioritization is by relevance and feasibility |
| `on_page.titles_and_descriptions_specific_and_honest` | on-page evidence: titles and descriptions are specific and honest |
| `on_page.heading_hierarchy_present` | on-page evidence: a heading hierarchy is present |
| `on_page.internal_links_with_descriptive_anchors` | on-page evidence: internal links use descriptive anchors |
| `on_page.clickbait_mismatch_present` | must be `false` to pass (on-page line: no clickbait mismatch) |
| `on_page.word_count_padding_present` | must be `false` to pass (on-page line: no word-count padding) |
| `pages` (list of page-row objects) | computed: must be present and non-empty; reported as `pages_count` |
| `pages[].name` (string) | names the row in the computed outputs |
| `pages[].intent` (string) | the specific intent the page owns; computed: no intent string may appear on more than one row (reported in `duplicate_intents`) |
| `pages[].intent_type` (string) | computed: must be one of `informational`, `commercial`, `transactional`; rows declaring any other value are reported in `pages_with_invalid_intent_type` |
| `pages[].has_single_intent` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `pages_without_single_intent` |
| `pages[].fully_answers_question` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `pages_not_fully_answering` |
| `structured_data.schema_org_applied_as_applicable` | structured-data evidence: schema.org is applied as applicable |
| `structured_data.rich_results_validated` | structured-data evidence: rich results are validated |
| `entity.brand_name_contact_consistent` | entity evidence: brand, name and contact info are consistent |
| `entity.real_author_identity_for_professional_content` | entity evidence: real author identity is carried for professional content |
| `entity.credentials_carried_where_appropriate` | entity evidence: credentials are carried where appropriate |
| `entity.public_content_sanitization_applied` | entity evidence: public content sanitization is applied |
| `authority.useful_assets_created_to_attract_links` | authority evidence: useful assets are created to attract links |
| `authority.relevant_human_outreach_only` | authority evidence: outreach is relevant and human only |
| `measurement.search_console_and_analytics_wired` | measurement evidence: Search Console and analytics are wired |
| `measurement.search_console_baseline_captured` | measurement evidence: a Search Console baseline is captured |
| `measurement.impressions_clicks_conversions_tracked` | measurement evidence: impressions, clicks and conversions are tracked |
| `measurement.queries_gained_lost_tracked` | measurement evidence: queries gained and lost are tracked |
| `measurement.monthly_iteration_cadence` | measurement evidence: iteration runs on a monthly cadence |
| `measurement.decaying_pages_refreshed_on_schedule` | measurement evidence: decaying pages are refreshed on schedule |
| `ai_era.structure_and_canonical_answers_designed_for_extraction` | AI-era evidence: structure and canonical answers are designed for extraction |
| `red_lines.cloaking_present` | must be `false` to pass (white-hat red line: no cloaking) |
| `red_lines.pbn_present` | must be `false` to pass (white-hat red line: no private blog networks) |
| `red_lines.bought_links_present` | must be `false` to pass (white-hat red line: no bought links) |
| `red_lines.link_schemes_present` | must be `false` to pass (white-hat red line: no link schemes) |
| `red_lines.keyword_spam_present` | must be `false` to pass (white-hat red line: no keyword spam) |
| `red_lines.misleading_metadata_present` | must be `false` to pass (white-hat red line: no misleading metadata) |
| `red_lines.fake_urgency_present` | must be `false` to pass (white-hat red line: no fake urgency) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward HONEST_SEO_MAP_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/honest-seo-audit-intent-map`:

```json
{
  "site": "example.com",
  "technical": {
    "crawlable_robots_and_sitemap": true,
    "core_web_vitals_targets_addressed": true,
    "mobile_first": true,
    "https_enabled": true,
    "canonical_tags_correct": true,
    "accidental_noindex_or_blocked_paths_present": false,
    "clean_url_structure": true,
    "not_found_404s_handled": true
  },
  "intent": {
    "audience_questions_mapped": true,
    "intent_type_assigned_per_question": true,
    "prioritization_by_relevance_and_feasibility": true
  },
  "on_page": {
    "titles_and_descriptions_specific_and_honest": true,
    "heading_hierarchy_present": true,
    "internal_links_with_descriptive_anchors": true,
    "clickbait_mismatch_present": false,
    "word_count_padding_present": false
  },
  "pages": [
    {
      "name": "home",
      "intent": "buy_service",
      "intent_type": "transactional",
      "has_single_intent": true,
      "fully_answers_question": true
    }
  ],
  "structured_data": {
    "schema_org_applied_as_applicable": true,
    "rich_results_validated": true
  },
  "entity": {
    "brand_name_contact_consistent": true,
    "real_author_identity_for_professional_content": true,
    "credentials_carried_where_appropriate": true,
    "public_content_sanitization_applied": true
  },
  "authority": {
    "useful_assets_created_to_attract_links": true,
    "relevant_human_outreach_only": true
  },
  "measurement": {
    "search_console_and_analytics_wired": true,
    "search_console_baseline_captured": true,
    "impressions_clicks_conversions_tracked": true,
    "queries_gained_lost_tracked": true,
    "monthly_iteration_cadence": true,
    "decaying_pages_refreshed_on_schedule": true
  },
  "ai_era": {
    "structure_and_canonical_answers_designed_for_extraction": true
  },
  "red_lines": {
    "cloaking_present": false,
    "pbn_present": false,
    "bought_links_present": false,
    "link_schemes_present": false,
    "keyword_spam_present": false,
    "misleading_metadata_present": false,
    "fake_urgency_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 43 checks and a text stamp of the verdict):

```json
{
  "service": "honest-seo-audit-intent-map",
  "atom_version": "0.1.0",
  "site": "example.com",
  "verdict": "HONEST_SEO_MAP_SOUND",
  "sections": {
    "technical_foundation": "pass",
    "intent_map_and_on_page_craft": "pass",
    "structured_data_and_entity_clarity": "pass",
    "earned_authority_and_measurement": "pass",
    "white_hat_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "pages_count": 1,
  "pages_without_single_intent": [],
  "single_intent_coverage": "1.000000",
  "pages_with_invalid_intent_type": [],
  "valid_intent_type_coverage": "1.000000",
  "duplicate_intents": [],
  "pages_not_fully_answering": [],
  "full_answer_coverage": "1.000000",
  "summary": "43 pass, 0 fail, 0 missing of 43 checks across five sections."
}
```

## Verdicts

- **HONEST_SEO_MAP_SOUND** — every check passes; the declared SEO record and intent map are complete and consistent with the skill's checklist and red lines.
- **HONEST_SEO_MAP_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `pages_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `pages_without_single_intent`, `pages_with_invalid_intent_type` and `pages_not_fully_answering` and the intent list `duplicate_intents` (null when the `pages` list is not declared; a page with the relevant field absent is missing evidence and does not appear in the first, second and fourth lists), the coverage values `single_intent_coverage`, `valid_intent_type_coverage` and `full_answer_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
