# Honest seo audit intent map — documentation

**Honest seo audit intent map** · slug `honest-seo-audit-intent-map` · deliverable type MAP · atom version 0.1.0 · status: live — release candidate, RC soak to 2026-11-22 (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally** — “no endpoint is live”. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/honest-seo-audit-intent-map/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment fe07be725c5a4817ad7b7e341310a97b). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `site` "example.com"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "honest-seo-audit-intent-map"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the SEO audit / intent-map manifest.** You declare a record of a site's SEO state and intent map — the atom audits the declared record, it does not crawl the site or do the SEO (see Explanation). The recorded full-pass manifest declares the site `example.com`: all eight technical declarations in passing polarity (crawlable robots and sitemap, Core Web Vitals targets addressed, mobile-first, HTTPS enabled, canonical tags correct, no accidental noindex or blocked paths, clean URL structure, 404s handled); audience questions mapped with an intent type assigned per question and prioritization by relevance and feasibility; titles and descriptions specific and honest, a heading hierarchy present, internal links with descriptive anchors, and neither clickbait mismatch nor word-count padding present; one page row, `home`, owning intent `buy_service` with `intent_type` `transactional`, `has_single_intent: true` and `fully_answers_question: true`; schema.org applied as applicable and rich results validated; brand, name and contact consistent, real author identity for professional content, credentials carried where appropriate and public content sanitization applied; useful assets created to attract links and relevant human outreach only; Search Console and analytics wired, a baseline captured, impressions / clicks / conversions and queries gained / lost tracked, a monthly iteration cadence and decaying pages refreshed on schedule; structure and canonical answers designed for extraction; and all seven red-line flags `false` (no cloaking, PBN, bought links, link schemes, keyword spam, misleading metadata or fake urgency).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/honest-seo-audit-intent-map` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `HONEST_SEO_MAP_SOUND`: "43 pass, 0 fail, 0 missing of 43 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `pages_count` is 1, and `single_intent_coverage`, `valid_intent_type_coverage` and `full_answer_coverage` are each `"1.000000"`, with all four row-name / intent lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `HONEST_SEO_MAP_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "honest-seo-audit-intent-map"}`.
3. Call: `POST https://atoms.pipavia.com/v1/honest-seo-audit-intent-map` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/honest-seo-audit-intent-map` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `honest_seo_audit_intent_map`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `HONEST_SEO_MAP_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `every_page_has_single_intent`, `no_cloaking`, and the summary reads "41 pass, 2 fail, 0 missing of 43 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `pages_without_single_intent` names `home` — that row declares `has_single_intent: false` — `single_intent_coverage` is `"0.000000"`, and `red_lines.cloaking_present` is declared `true`, failing `no_cloaking`; sections `intent_map_and_on_page_craft` and `white_hat_red_lines` report `fail`, the other three `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "technical.crawlable_robots_and_sitemap",
  "detail": "technical.crawlable_robots_and_sitemap must be a boolean"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/honest-seo-audit-intent-map` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/honest-seo-audit-intent-map` — tool name `honest_seo_audit_intent_map`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `honest_seo_audit_intent_map` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `site` and the `pages[]` string fields are noted as strings and `pages` as a list there. Where SERVICE.md states no type — the section container objects (`technical`, `intent`, `on_page`, `structured_data`, `entity`, `authority`, `measurement`, `ai_era`, `red_lines`) and a `pages[]` row object — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `pages` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `HONEST_SEO_MAP_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `site` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: technical_foundation

| Field | Type | Notes |
|---|---|---|
| `technical` | object | The technical section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `technical.crawlable_robots_and_sitemap` | boolean | — |
| `technical.core_web_vitals_targets_addressed` | boolean | — |
| `technical.mobile_first` | boolean | — |
| `technical.https_enabled` | boolean | — |
| `technical.canonical_tags_correct` | boolean | — |
| `technical.accidental_noindex_or_blocked_paths_present` | boolean | must be `false` to pass |
| `technical.clean_url_structure` | boolean | — |
| `technical.not_found_404s_handled` | boolean | — |

#### Read by: intent_map_and_on_page_craft

| Field | Type | Notes |
|---|---|---|
| `intent` | object | The intent section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `intent.audience_questions_mapped` | boolean | — |
| `intent.intent_type_assigned_per_question` | boolean | — |
| `intent.prioritization_by_relevance_and_feasibility` | boolean | — |
| `on_page` | object | The on-page section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `on_page.titles_and_descriptions_specific_and_honest` | boolean | — |
| `on_page.heading_hierarchy_present` | boolean | — |
| `on_page.internal_links_with_descriptive_anchors` | boolean | — |
| `on_page.clickbait_mismatch_present` | boolean | must be `false` to pass |
| `on_page.word_count_padding_present` | boolean | must be `false` to pass |
| `pages` | list | list of page-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `pages[]` | object | One declared page row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `pages[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `pages[].intent` | string | The specific intent the page owns; duplicate ownership is computed, see below (type stated in SERVICE.md) |
| `pages[].intent_type` | string | Must be one of `informational`, `commercial`, `transactional` — the skill's own set (type and set stated in SERVICE.md) |
| `pages[].has_single_intent` | boolean | — |
| `pages[].fully_answers_question` | boolean | — |

#### Read by: structured_data_and_entity_clarity

| Field | Type | Notes |
|---|---|---|
| `structured_data` | object | The structured-data section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `structured_data.schema_org_applied_as_applicable` | boolean | — |
| `structured_data.rich_results_validated` | boolean | — |
| `entity` | object | The entity section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `entity.brand_name_contact_consistent` | boolean | — |
| `entity.real_author_identity_for_professional_content` | boolean | — |
| `entity.credentials_carried_where_appropriate` | boolean | — |
| `entity.public_content_sanitization_applied` | boolean | — |

#### Read by: earned_authority_and_measurement

| Field | Type | Notes |
|---|---|---|
| `authority` | object | The authority section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `authority.useful_assets_created_to_attract_links` | boolean | — |
| `authority.relevant_human_outreach_only` | boolean | — |
| `measurement` | object | The measurement section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `measurement.search_console_and_analytics_wired` | boolean | — |
| `measurement.search_console_baseline_captured` | boolean | — |
| `measurement.impressions_clicks_conversions_tracked` | boolean | — |
| `measurement.queries_gained_lost_tracked` | boolean | — |
| `measurement.monthly_iteration_cadence` | boolean | — |
| `measurement.decaying_pages_refreshed_on_schedule` | boolean | — |
| `ai_era` | object | The AI-era section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `ai_era.structure_and_canonical_answers_designed_for_extraction` | boolean | — |

#### Read by: white_hat_red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.cloaking_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.pbn_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.bought_links_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.link_schemes_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.keyword_spam_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.misleading_metadata_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.fake_urgency_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 43 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: technical_foundation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `crawlable_robots_and_sitemap` | technical foundation: crawlable — robots.txt and sitemap are in place | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `core_web_vitals_targets_addressed` | technical foundation: fast — Core Web Vitals targets are addressed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `mobile_first` | technical foundation: mobile-first | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `https_enabled` | technical foundation: HTTPS is enabled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `canonical_tags_correct` | technical foundation: canonical tags are correct | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_accidental_noindex_or_blocked_paths` | technical foundation: no accidental noindex or blocked paths are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `clean_url_structure` | technical foundation: URL structure is clean | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `not_found_404s_handled` | technical foundation: 404s are handled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: intent_map_and_on_page_craft

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `audience_questions_mapped` | intent map: audience questions are mapped | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `intent_type_assigned_per_question` | intent map: an intent type — informational / commercial / transactional — is assigned per question | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `prioritization_by_relevance_and_feasibility` | intent map: prioritization is by relevance x feasibility over big-volume vanity terms | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `titles_and_descriptions_specific_and_honest` | on-page craft: titles and descriptions are specific and honest | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `heading_hierarchy_present` | on-page craft: a heading hierarchy is present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `internal_links_with_descriptive_anchors` | on-page craft: internal links use descriptive anchors | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_clickbait_mismatch` | on-page craft: no clickbait mismatch is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_word_count_padding` | on-page craft: no word-count padding is present — depth where it matters | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `pages_declared` | the declared record names its pages — the pages list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_page_has_single_intent` | intent map: every declared page row owns a single intent | Computed over the declared record. Pass: every declared page row declares `has_single_intent: true`. Fail: a row declares `has_single_intent` present but not `true` (offending rows are named in `pages_without_single_intent`). Missing: the list is absent, or a row has `has_single_intent` absent (such a row is missing evidence and does not appear in `pages_without_single_intent`). |
| `every_page_intent_type_valid` | intent map: every declared page row declares an intent type from the skill's set — informational / commercial / transactional | Computed over the declared record. Pass: every declared page row declares `intent_type` from the skill's set — `informational`, `commercial`, `transactional`. Fail: a row declares `intent_type` present but not in that set (offending rows are named in `pages_with_invalid_intent_type`). Missing: the list is absent, or a row has `intent_type` absent (such a row is missing evidence and does not appear in `pages_with_invalid_intent_type`). |
| `no_intent_owned_by_multiple_pages` | intent map: no declared intent is owned by more than one page — each key page owns one intent | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_page_fully_answers_question` | on-page craft: every declared page row fully answers its question | Computed over the declared record. Pass: every declared page row declares `fully_answers_question: true`. Fail: a row declares `fully_answers_question` present but not `true` (offending rows are named in `pages_not_fully_answering`). Missing: the list is absent, or a row has `fully_answers_question` absent (such a row is missing evidence and does not appear in `pages_not_fully_answering`). |

#### Section: structured_data_and_entity_clarity

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `schema_org_applied_as_applicable` | structured data: schema.org — Article, FAQ, Product, LocalBusiness as applicable — is applied | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `rich_results_validated` | structured data: rich results are validated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `brand_name_contact_consistent` | entity/author clarity: brand, name and contact info are consistent | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `real_author_identity_for_professional_content` | entity/author clarity: real author identity is carried for professional content — E-E-A-T spirit | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `credentials_carried_where_appropriate` | entity/author clarity: professional pages carry credentials where appropriate | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `public_content_sanitization_applied` | entity/author clarity: public content follows privacy / sanitization discipline | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: earned_authority_and_measurement

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `useful_assets_created_to_attract_links` | authority the earned way: genuinely useful assets — tools, data, guides — attract links | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `relevant_human_outreach_only` | authority the earned way: outreach is relevant and human | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `search_console_and_analytics_wired` | measurement: Search Console and analytics are wired | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `search_console_baseline_captured` | measurement: a Search Console baseline is captured | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `impressions_clicks_conversions_tracked` | measurement: impressions to clicks to conversions are tracked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `queries_gained_lost_tracked` | measurement: queries gained and lost are tracked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `monthly_iteration_cadence` | measurement: iteration is monthly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `decaying_pages_refreshed_on_schedule` | measurement: decaying pages are refreshed on schedule | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structure_and_canonical_answers_designed_for_extraction` | AI-era note: clean structure and canonical answers are designed for extraction — no tricks that decay | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: white_hat_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_cloaking` | red line: no cloaking is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_pbn` | red line: no PBNs are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_bought_links` | red line: no bought links are present — no link buying | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_link_schemes` | red line: no link schemes are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_keyword_spam` | red line: no keyword spam is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_misleading_metadata` | red line: no misleading metadata is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_fake_urgency` | red line: no fake urgency is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"honest-seo-audit-intent-map"`), `atom_version` (`"0.1.0"`), and `site` (the manifest's declared site value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `pages_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `pages_without_single_intent` (pages whose `has_single_intent` field is present but not `true`; a page with the field absent is missing evidence and does not appear), `pages_with_invalid_intent_type` (pages whose `intent_type` is present but not in the skill's set) and `pages_not_fully_answering` (pages whose `fully_answers_question` field is present but not `true`), and the intent list `duplicate_intents` (intent strings declared on more than one page, in the order their second occurrence appears) — all four lists are null when the `pages` list is not declared, as recorded in the sparse case; and the ratios `single_intent_coverage` (pages with a single intent ÷ declared pages), `valid_intent_type_coverage` (pages with a valid intent type ÷ declared pages) and `full_answer_coverage` (pages fully answering ÷ declared pages) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "43 pass, 0 fail, 0 missing of 43 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared site value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `HONEST_SEO_MAP_SOUND` — all 43 checks pass: the declared SEO record and intent map are complete and consistent with the bound skill's checklist and red lines.
- `HONEST_SEO_MAP_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the five primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `pages_count`, `pages_without_single_intent`, `single_intent_coverage`, `pages_with_invalid_intent_type`, `valid_intent_type_coverage`, `duplicate_intents`, `pages_not_fully_answering`, `full_answer_coverage` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"technical.crawlable_robots_and_sitemap","detail":"technical.crawlable_robots_and_sitemap must be a boolean"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type MAP — this atom sells the map it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Earn search traffic honestly — technical SEO, content strategy, structured data, measurement, white-hat only (the bound capability, from the skill). You submit one declared record — the SEO audit / intent-map manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`technical_foundation`, `intent_map_and_on_page_craft`, `structured_data_and_entity_clarity`, `earned_authority_and_measurement`, `white_hat_red_lines`). The atom sells that map — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `pages` list must be present and non-empty, every page row must declare `has_single_intent: true`, must declare an `intent_type` from the skill's own set (`informational`, `commercial`, `transactional`), and must declare `fully_answers_question: true`, and no declared `intent` string may appear on more than one page row — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `HONEST_SEO_MAP_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `HONEST_SEO_MAP_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a Core Web Vitals millisecond, LCP / INP / CLS or score cutoff (the skill says "fast (Core Web Vitals targets)" but states no number — caller attestation only); a traffic, impression, click, click-through-rate, ranking-position or conversion target; a word count or content-depth minimum (the skill explicitly rejects word-count padding); a number of internal or external links, a link-acquisition count, or an outreach volume; a number of pages, questions or intents a map must contain; a schema-type quota beyond "as applicable" (the skill lists Article, FAQ, Product, LocalBusiness as applicable, not mandatory); a refresh interval other than the skill's stated monthly iteration and scheduled refresh (no day count is stated); a coverage percentage below completeness. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** SEO record and intent map: a verdict of `HONEST_SEO_MAP_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares HTTPS enabled, canonicals correct and no bought links passes those checks even if the real site does none of it. It is a completeness and consistency audit of the record the skill requires, **not an SEO service, a ranking guarantee, or a penalty certification**. Specifically: it crawls no site, runs no speed test, reads no Search Console or analytics data, validates no live rich result, and does not verify that a declared control actually works. It never judges whether a page really answers its question well, whether an intent assignment is the right strategy, whether schema markup is correct in detail, or whether outreach is genuinely relevant — only that the record contains what the skill's sections and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no text inspection — clickbait, misleading metadata, keyword spam and fake urgency are caller-declared present / absent flags, the atom reads no copy; content quality and strategic fit of an intent map are caller declarations — the atom checks only that questions, types and single-intent ownership are declared and consistent; E-E-A-T quality in substance (whether credentials or author identity genuinely establish expertise) is a caller declaration — only its declared presence is checked.

**Buyer and use context.** Teams and agents working in Money & markets who need this map on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Growing content and product sites (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared SEO record and intent map; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly that it is not an SEO service, a ranking guarantee, or a penalty certification, and that it crawls no site and verifies no live fact. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `honest_seo_audit_intent_map` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/honest_seo_audit_intent_map.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_honest_seo_audit_intent_map.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/honest-seo-audit-intent-map` (REST) and `POST /mcp/honest-seo-audit-intent-map` (MCP, tool `honest_seo_audit_intent_map`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment fe07be725c5a4817ad7b7e341310a97b). Key scope: `honest_seo_audit_intent_map`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md stale:** SERVICE.md says Tier B · status: **built-locally**, “no endpoint is live”. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b) shows the atom live. This document follows the evidenced live state: live — release candidate, RC soak to 2026-11-22.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the anti-pattern / red-line checks and the computed checks. Recorded check names used verbatim in the Checks section include `no_accidental_noindex_or_blocked_paths` (input `technical.accidental_noindex_or_blocked_paths_present`), `no_clickbait_mismatch` (input `on_page.clickbait_mismatch_present`), `no_word_count_padding` (input `on_page.word_count_padding_present`), `no_cloaking` (input `red_lines.cloaking_present`), `no_pbn` (input `red_lines.pbn_present`), `no_bought_links` (input `red_lines.bought_links_present`), `no_link_schemes` (input `red_lines.link_schemes_present`), `no_keyword_spam` (input `red_lines.keyword_spam_present`), `no_misleading_metadata` (input `red_lines.misleading_metadata_present`) and `no_fake_urgency` (input `red_lines.fake_urgency_present`), plus the computed checks `pages_declared`, `every_page_has_single_intent`, `every_page_intent_type_valid`, `no_intent_owned_by_multiple_pages` and `every_page_fully_answers_question`, which read the `pages` rows rather than any single input field.
3. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field. The recorded REST response carries all 43 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
4. **Testing date presentation:** USER-GUIDE.md describes its worked example as “from external testing 2026-11-15” and TEST-REPORT.md is dated 2026-11-15, while evidence.json records `tested_at_utc` as `2026-11-16T06:30:23.901349+00:00`. The provenance lines in this document use the recorded UTC timestamp and gateway version from evidence.json.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects — `structured_data` and `entity` inputs are read by the single recorded section `structured_data_and_entity_clarity`, and `authority`, `measurement` and `ai_era` inputs are read by the single recorded section `earned_authority_and_measurement`. This document groups the Input reference and the Checks by the recorded section names.
6. **Null lists on an undeclared `pages` list:** SERVICE.md's output paragraph states the null rules for `computed_status`, `pages_count` and the coverage ratios, but does not state a null rule for the four row-name / intent lists. The recorded sparse response returns all four lists as `null` when `pages` is not declared (as USER-GUIDE.md also states); this document follows the recording.

## Worked examples

Provenance: recorded 2026-11-16T06:30:23.901349+00:00 against gateway v1.1.0, external verification lane, source `verification/work/honest-seo-audit-intent-map/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T06:30:23.901349+00:00 · gateway v1.1.0 · source `verification/work/honest-seo-audit-intent-map/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "technical_foundation",
      "check": "crawlable_robots_and_sitemap",
      "status": "pass",
      "evidence": "technical foundation: crawlable — robots.txt and sitemap are in place"
    },
    {
      "section": "technical_foundation",
      "check": "core_web_vitals_targets_addressed",
      "status": "pass",
      "evidence": "technical foundation: fast — Core Web Vitals targets are addressed"
    },
    {
      "section": "technical_foundation",
      "check": "mobile_first",
      "status": "pass",
      "evidence": "technical foundation: mobile-first"
    },
    {
      "section": "technical_foundation",
      "check": "https_enabled",
      "status": "pass",
      "evidence": "technical foundation: HTTPS is enabled"
    },
    {
      "section": "technical_foundation",
      "check": "canonical_tags_correct",
      "status": "pass",
      "evidence": "technical foundation: canonical tags are correct"
    },
    {
      "section": "technical_foundation",
      "check": "no_accidental_noindex_or_blocked_paths",
      "status": "pass",
      "evidence": "technical foundation: no accidental noindex or blocked paths are present"
    },
    {
      "section": "technical_foundation",
      "check": "clean_url_structure",
      "status": "pass",
      "evidence": "technical foundation: URL structure is clean"
    },
    {
      "section": "technical_foundation",
      "check": "not_found_404s_handled",
      "status": "pass",
      "evidence": "technical foundation: 404s are handled"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "audience_questions_mapped",
      "status": "pass",
      "evidence": "intent map: audience questions are mapped"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "intent_type_assigned_per_question",
      "status": "pass",
      "evidence": "intent map: an intent type — informational / commercial / transactional — is assigned per question"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "prioritization_by_relevance_and_feasibility",
      "status": "pass",
      "evidence": "intent map: prioritization is by relevance x feasibility over big-volume vanity terms"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "titles_and_descriptions_specific_and_honest",
      "status": "pass",
      "evidence": "on-page craft: titles and descriptions are specific and honest"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "heading_hierarchy_present",
      "status": "pass",
      "evidence": "on-page craft: a heading hierarchy is present"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "internal_links_with_descriptive_anchors",
      "status": "pass",
      "evidence": "on-page craft: internal links use descriptive anchors"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "no_clickbait_mismatch",
      "status": "pass",
      "evidence": "on-page craft: no clickbait mismatch is present"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "no_word_count_padding",
      "status": "pass",
      "evidence": "on-page craft: no word-count padding is present — depth where it matters"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "pages_declared",
      "status": "pass",
      "evidence": "the declared record names its pages — the pages list is present and non-empty"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "every_page_has_single_intent",
      "status": "pass",
      "evidence": "intent map: every declared page row owns a single intent"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "every_page_intent_type_valid",
      "status": "pass",
      "evidence": "intent map: every declared page row declares an intent type from the skill's set — informational / commercial / transactional"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "no_intent_owned_by_multiple_pages",
      "status": "pass",
      "evidence": "intent map: no declared intent is owned by more than one page — each key page owns one intent"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "every_page_fully_answers_question",
      "status": "pass",
      "evidence": "on-page craft: every declared page row fully answers its question"
    },
    {
      "section": "structured_data_and_entity_clarity",
      "check": "schema_org_applied_as_applicable",
      "status": "pass",
      "evidence": "structured data: schema.org — Article, FAQ, Product, LocalBusiness as applicable — is applied"
    },
    {
      "section": "structured_data_and_entity_clarity",
      "check": "rich_results_validated",
      "status": "pass",
      "evidence": "structured data: rich results are validated"
    },
    {
      "section": "structured_data_and_entity_clarity",
      "check": "brand_name_contact_consistent",
      "status": "pass",
      "evidence": "entity/author clarity: brand, name and contact info are consistent"
    },
    {
      "section": "structured_data_and_entity_clarity",
      "check": "real_author_identity_for_professional_content",
      "status": "pass",
      "evidence": "entity/author clarity: real author identity is carried for professional content — E-E-A-T spirit"
    },
    {
      "section": "structured_data_and_entity_clarity",
      "check": "credentials_carried_where_appropriate",
      "status": "pass",
      "evidence": "entity/author clarity: professional pages carry credentials where appropriate"
    },
    {
      "section": "structured_data_and_entity_clarity",
      "check": "public_content_sanitization_applied",
      "status": "pass",
      "evidence": "entity/author clarity: public content follows privacy / sanitization discipline"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "useful_assets_created_to_attract_links",
      "status": "pass",
      "evidence": "authority the earned way: genuinely useful assets — tools, data, guides — attract links"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "relevant_human_outreach_only",
      "status": "pass",
      "evidence": "authority the earned way: outreach is relevant and human"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "search_console_and_analytics_wired",
      "status": "pass",
      "evidence": "measurement: Search Console and analytics are wired"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "search_console_baseline_captured",
      "status": "pass",
      "evidence": "measurement: a Search Console baseline is captured"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "impressions_clicks_conversions_tracked",
      "status": "pass",
      "evidence": "measurement: impressions to clicks to conversions are tracked"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "queries_gained_lost_tracked",
      "status": "pass",
      "evidence": "measurement: queries gained and lost are tracked"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "monthly_iteration_cadence",
      "status": "pass",
      "evidence": "measurement: iteration is monthly"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "decaying_pages_refreshed_on_schedule",
      "status": "pass",
      "evidence": "measurement: decaying pages are refreshed on schedule"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "structure_and_canonical_answers_designed_for_extraction",
      "status": "pass",
      "evidence": "AI-era note: clean structure and canonical answers are designed for extraction — no tricks that decay"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_cloaking",
      "status": "pass",
      "evidence": "red line: no cloaking is present"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_pbn",
      "status": "pass",
      "evidence": "red line: no PBNs are present"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_bought_links",
      "status": "pass",
      "evidence": "red line: no bought links are present — no link buying"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_link_schemes",
      "status": "pass",
      "evidence": "red line: no link schemes are present"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_keyword_spam",
      "status": "pass",
      "evidence": "red line: no keyword spam is present"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_misleading_metadata",
      "status": "pass",
      "evidence": "red line: no misleading metadata is present"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_fake_urgency",
      "status": "pass",
      "evidence": "red line: no fake urgency is present"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "pages_count": 1,
  "pages_without_single_intent": [],
  "single_intent_coverage": "1.000000",
  "pages_with_invalid_intent_type": [],
  "valid_intent_type_coverage": "1.000000",
  "duplicate_intents": [],
  "pages_not_fully_answering": [],
  "full_answer_coverage": "1.000000",
  "summary": "43 pass, 0 fail, 0 missing of 43 checks across five sections.",
  "stamp": "HONEST SEO AUDIT INTENT MAP\nsite: example.com\nVERDICT: HONEST_SEO_MAP_SOUND\n  technical_foundation                 pass\n  intent_map_and_on_page_craft         pass\n  structured_data_and_entity_clarity   pass\n  earned_authority_and_measurement     pass\n  white_hat_red_lines                  pass\n43 pass, 0 fail, 0 missing of 43 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T06:30:23.901349+00:00 · gateway v1.1.0 · source `verification/work/honest-seo-audit-intent-map/evidence.json`.

Input:

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
      "has_single_intent": false,
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
    "cloaking_present": true,
    "pbn_present": false,
    "bought_links_present": false,
    "link_schemes_present": false,
    "keyword_spam_present": false,
    "misleading_metadata_present": false,
    "fake_urgency_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "honest-seo-audit-intent-map",
  "atom_version": "0.1.0",
  "site": "example.com",
  "verdict": "HONEST_SEO_MAP_NOT_SOUND",
  "sections": {
    "technical_foundation": "pass",
    "intent_map_and_on_page_craft": "fail",
    "structured_data_and_entity_clarity": "pass",
    "earned_authority_and_measurement": "pass",
    "white_hat_red_lines": "fail"
  },
  "checks": [
    {
      "section": "technical_foundation",
      "check": "crawlable_robots_and_sitemap",
      "status": "pass",
      "evidence": "technical foundation: crawlable — robots.txt and sitemap are in place"
    },
    {
      "section": "technical_foundation",
      "check": "core_web_vitals_targets_addressed",
      "status": "pass",
      "evidence": "technical foundation: fast — Core Web Vitals targets are addressed"
    },
    {
      "section": "technical_foundation",
      "check": "mobile_first",
      "status": "pass",
      "evidence": "technical foundation: mobile-first"
    },
    {
      "section": "technical_foundation",
      "check": "https_enabled",
      "status": "pass",
      "evidence": "technical foundation: HTTPS is enabled"
    },
    {
      "section": "technical_foundation",
      "check": "canonical_tags_correct",
      "status": "pass",
      "evidence": "technical foundation: canonical tags are correct"
    },
    {
      "section": "technical_foundation",
      "check": "no_accidental_noindex_or_blocked_paths",
      "status": "pass",
      "evidence": "technical foundation: no accidental noindex or blocked paths are present"
    },
    {
      "section": "technical_foundation",
      "check": "clean_url_structure",
      "status": "pass",
      "evidence": "technical foundation: URL structure is clean"
    },
    {
      "section": "technical_foundation",
      "check": "not_found_404s_handled",
      "status": "pass",
      "evidence": "technical foundation: 404s are handled"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "audience_questions_mapped",
      "status": "pass",
      "evidence": "intent map: audience questions are mapped"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "intent_type_assigned_per_question",
      "status": "pass",
      "evidence": "intent map: an intent type — informational / commercial / transactional — is assigned per question"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "prioritization_by_relevance_and_feasibility",
      "status": "pass",
      "evidence": "intent map: prioritization is by relevance x feasibility over big-volume vanity terms"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "titles_and_descriptions_specific_and_honest",
      "status": "pass",
      "evidence": "on-page craft: titles and descriptions are specific and honest"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "heading_hierarchy_present",
      "status": "pass",
      "evidence": "on-page craft: a heading hierarchy is present"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "internal_links_with_descriptive_anchors",
      "status": "pass",
      "evidence": "on-page craft: internal links use descriptive anchors"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "no_clickbait_mismatch",
      "status": "pass",
      "evidence": "on-page craft: no clickbait mismatch is present"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "no_word_count_padding",
      "status": "pass",
      "evidence": "on-page craft: no word-count padding is present — depth where it matters"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "pages_declared",
      "status": "pass",
      "evidence": "the declared record names its pages — the pages list is present and non-empty"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "every_page_has_single_intent",
      "status": "fail",
      "evidence": "intent map: every declared page row owns a single intent"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "every_page_intent_type_valid",
      "status": "pass",
      "evidence": "intent map: every declared page row declares an intent type from the skill's set — informational / commercial / transactional"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "no_intent_owned_by_multiple_pages",
      "status": "pass",
      "evidence": "intent map: no declared intent is owned by more than one page — each key page owns one intent"
    },
    {
      "section": "intent_map_and_on_page_craft",
      "check": "every_page_fully_answers_question",
      "status": "pass",
      "evidence": "on-page craft: every declared page row fully answers its question"
    },
    {
      "section": "structured_data_and_entity_clarity",
      "check": "schema_org_applied_as_applicable",
      "status": "pass",
      "evidence": "structured data: schema.org — Article, FAQ, Product, LocalBusiness as applicable — is applied"
    },
    {
      "section": "structured_data_and_entity_clarity",
      "check": "rich_results_validated",
      "status": "pass",
      "evidence": "structured data: rich results are validated"
    },
    {
      "section": "structured_data_and_entity_clarity",
      "check": "brand_name_contact_consistent",
      "status": "pass",
      "evidence": "entity/author clarity: brand, name and contact info are consistent"
    },
    {
      "section": "structured_data_and_entity_clarity",
      "check": "real_author_identity_for_professional_content",
      "status": "pass",
      "evidence": "entity/author clarity: real author identity is carried for professional content — E-E-A-T spirit"
    },
    {
      "section": "structured_data_and_entity_clarity",
      "check": "credentials_carried_where_appropriate",
      "status": "pass",
      "evidence": "entity/author clarity: professional pages carry credentials where appropriate"
    },
    {
      "section": "structured_data_and_entity_clarity",
      "check": "public_content_sanitization_applied",
      "status": "pass",
      "evidence": "entity/author clarity: public content follows privacy / sanitization discipline"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "useful_assets_created_to_attract_links",
      "status": "pass",
      "evidence": "authority the earned way: genuinely useful assets — tools, data, guides — attract links"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "relevant_human_outreach_only",
      "status": "pass",
      "evidence": "authority the earned way: outreach is relevant and human"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "search_console_and_analytics_wired",
      "status": "pass",
      "evidence": "measurement: Search Console and analytics are wired"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "search_console_baseline_captured",
      "status": "pass",
      "evidence": "measurement: a Search Console baseline is captured"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "impressions_clicks_conversions_tracked",
      "status": "pass",
      "evidence": "measurement: impressions to clicks to conversions are tracked"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "queries_gained_lost_tracked",
      "status": "pass",
      "evidence": "measurement: queries gained and lost are tracked"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "monthly_iteration_cadence",
      "status": "pass",
      "evidence": "measurement: iteration is monthly"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "decaying_pages_refreshed_on_schedule",
      "status": "pass",
      "evidence": "measurement: decaying pages are refreshed on schedule"
    },
    {
      "section": "earned_authority_and_measurement",
      "check": "structure_and_canonical_answers_designed_for_extraction",
      "status": "pass",
      "evidence": "AI-era note: clean structure and canonical answers are designed for extraction — no tricks that decay"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_cloaking",
      "status": "fail",
      "evidence": "red line: no cloaking is present"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_pbn",
      "status": "pass",
      "evidence": "red line: no PBNs are present"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_bought_links",
      "status": "pass",
      "evidence": "red line: no bought links are present — no link buying"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_link_schemes",
      "status": "pass",
      "evidence": "red line: no link schemes are present"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_keyword_spam",
      "status": "pass",
      "evidence": "red line: no keyword spam is present"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_misleading_metadata",
      "status": "pass",
      "evidence": "red line: no misleading metadata is present"
    },
    {
      "section": "white_hat_red_lines",
      "check": "no_fake_urgency",
      "status": "pass",
      "evidence": "red line: no fake urgency is present"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "pages_count": 1,
  "pages_without_single_intent": [
    "home"
  ],
  "single_intent_coverage": "0.000000",
  "pages_with_invalid_intent_type": [],
  "valid_intent_type_coverage": "1.000000",
  "duplicate_intents": [],
  "pages_not_fully_answering": [],
  "full_answer_coverage": "1.000000",
  "summary": "41 pass, 2 fail, 0 missing of 43 checks across five sections.",
  "stamp": "HONEST SEO AUDIT INTENT MAP\nsite: example.com\nVERDICT: HONEST_SEO_MAP_NOT_SOUND\n  technical_foundation                 pass\n  intent_map_and_on_page_craft         fail\n  structured_data_and_entity_clarity   pass\n  earned_authority_and_measurement     pass\n  white_hat_red_lines                  fail\n41 pass, 2 fail, 0 missing of 43 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T06:30:23.901349+00:00 · gateway v1.1.0 · source `verification/work/honest-seo-audit-intent-map/evidence.json`.

Input:

```json
{
  "site": "malformed.com",
  "technical": {
    "crawlable_robots_and_sitemap": "NOT_A_BOOLEAN"
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "technical.crawlable_robots_and_sitemap",
  "detail": "technical.crawlable_robots_and_sitemap must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared SEO record and intent map; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not an SEO service, a ranking guarantee or a penalty certification, and it verifies no live fact. |
| Checks named | 43 documented / 43 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`pages_count`, the four row-name / intent lists and the three coverage ratios) |
| Input reference typed | Yes — 55 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/honest-seo-audit-intent-map/evidence.json` |
