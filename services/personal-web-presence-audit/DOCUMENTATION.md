# Personal web presence audit — documentation

**Personal web presence audit** · slug `personal-web-presence-audit` · deliverable type CHECK · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment c64bdc48fce84cd4817fe3a293be6ae5).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/personal-web-presence-audit/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment c64bdc48fce84cd4817fe3a293be6ae5). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `person` "Jane Doe"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "personal-web-presence-audit"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the personal web presence manifest.** You declare a record of a person's public web presence — the atom audits the declared record, it does not fetch, browse or crawl the live estate (see Explanation). The recorded full-pass manifest declares the person `Jane Doe`: one primary domain designated, one single canonical hub, a redirect map in version control and spoke redirects tested; one spoke row, `janedoe.net`, redirecting to the hub or a purpose page with a title/description consistent with the hub; a canonical bio and canonical facts defined once, the bio reused byte-for-byte and consistent across hub, profiles and signatures; JSON-LD Person present, validating, and carrying sameAs to the profiles, and OpenGraph cards present per page and rendering on major platforms; one profile row, `linkedin`, carrying the canonical bio and linking to the hub; content sections present with claims verifiable, dated and linked; the first page for the person's name owned, disambiguation against similar names, profiles linked reciprocally and rel=me declared where supported; a quarterly refresh of bio and projects with prior versions archived publicly; a stable contact path that works, an alias strategy defined, forms preferred over raw email and spam controls present; periodic name-search checks and referrer reviews performed, vanity metrics ignored and an impersonation and typosquat watch; and all six red-line flags `false` (no unverifiable claims, no impersonation-confusable profiles unfixed, no family privacy boundaries violated, no brand domain lapsed, no inflated titles, no borrowed prestige).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/personal-web-presence-audit` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `PERSONAL_PRESENCE_CONSISTENT`: "46 pass, 0 fail, 0 missing of 46 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `spokes_count` and `profiles_count` are each 1, and `redirect_coverage`, `title_description_consistency_coverage`, `bio_match_coverage` and `hub_link_coverage` are each `"1.000000"`, with all six row-name / domain / platform lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `PERSONAL_PRESENCE_INCONSISTENT` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "personal-web-presence-audit"}`.
3. Call: `POST https://atoms.pipavia.com/v1/personal-web-presence-audit` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/personal-web-presence-audit` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `personal_web_presence_audit`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `PERSONAL_PRESENCE_INCONSISTENT` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `claims_verifiable`, `every_profile_links_to_hub`, `every_spoke_redirects_to_hub_or_purpose_page`, `no_unverifiable_claims`, and the summary reads "42 pass, 4 fail, 0 missing of 46 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `spokes_without_redirect` names `janedoe.net` — that row declares `redirects_to_hub_or_purpose_page: false` — `redirect_coverage` is `"0.000000"`, `profiles_without_hub_link` names `linkedin` — that row declares `links_to_hub: false` — `hub_link_coverage` is `"0.000000"`, `content.claims_verifiable` is declared `false`, failing `claims_verifiable`, and `red_lines.unverifiable_claims_present` is declared `true`, failing `no_unverifiable_claims`; sections `hub_and_spokes`, `identity_facts_and_structured_data`, `content_standards_and_name_seo` and `red_lines` report `fail`, `cadence_contact_and_measurement` reports `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "hub",
  "detail": "hub must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/personal-web-presence-audit` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/personal-web-presence-audit` — tool name `personal_web_presence_audit`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `personal_web_presence_audit` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `person` and the `spokes[]` / `profiles[]` string fields are noted as strings and `spokes` and `profiles` as lists there. Where SERVICE.md states no type — the section container objects (`hub`, `identity`, `structured_data`, `content`, `name_seo`, `cadence`, `contact`, `measurement`, `red_lines`) and the `spokes[]` and `profiles[]` row objects — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `spokes` / `profiles` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `PERSONAL_PRESENCE_INCONSISTENT`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `person` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: hub_and_spokes

| Field | Type | Notes |
|---|---|---|
| `hub` | object | The hub section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `hub.primary_domain_designated` | boolean | — |
| `hub.single_canonical_hub` | boolean | — |
| `hub.redirect_map_in_version_control` | boolean | — |
| `hub.spoke_redirects_tested` | boolean | — |
| `spokes` | list | list of spoke-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `spokes[]` | object | One declared spoke row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `spokes[].domain` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `spokes[].redirects_to_hub_or_purpose_page` | boolean | — |
| `spokes[].title_description_consistent_with_hub` | boolean | — |

#### Read by: identity_facts_and_structured_data

| Field | Type | Notes |
|---|---|---|
| `identity` | object | The identity section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `identity.canonical_bio_defined` | boolean | — |
| `identity.canonical_facts_defined` | boolean | The canonical facts — name spelling, credentials, role line, location granularity — are defined once |
| `identity.bio_reused_byte_for_byte` | boolean | — |
| `identity.bio_consistent_across_hub_profiles_signatures` | boolean | — |
| `structured_data` | object | The structured-data section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `structured_data.json_ld_person_present` | boolean | — |
| `structured_data.json_ld_validates` | boolean | — |
| `structured_data.json_ld_same_as_lists_profiles` | boolean | — |
| `structured_data.opengraph_cards_present_per_page` | boolean | — |
| `structured_data.opengraph_cards_render_on_major_platforms` | boolean | — |
| `profiles` | list | list of profile-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `profiles[]` | object | One declared profile row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `profiles[].platform` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `profiles[].bio_matches_canonical` | boolean | — |
| `profiles[].links_to_hub` | boolean | — |

#### Read by: content_standards_and_name_seo

| Field | Type | Notes |
|---|---|---|
| `content` | object | The content section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `content.content_sections_present` | boolean | — |
| `content.claims_verifiable` | boolean | — |
| `content.claims_dated` | boolean | — |
| `content.claims_linked` | boolean | — |
| `name_seo` | object | The name-SEO section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `name_seo.first_page_for_name_owned` | boolean | — |
| `name_seo.disambiguation_against_similar_names` | boolean | — |
| `name_seo.profiles_linked_reciprocally` | boolean | — |
| `name_seo.rel_me_declared_where_supported` | boolean | — |

#### Read by: cadence_contact_and_measurement

| Field | Type | Notes |
|---|---|---|
| `cadence` | object | The cadence section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `cadence.quarterly_refresh_of_bio_and_projects` | boolean | — |
| `cadence.prior_versions_archived_publicly` | boolean | — |
| `contact` | object | The contact section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `contact.stable_contact_path_present` | boolean | — |
| `contact.contact_path_works` | boolean | — |
| `contact.alias_strategy_defined` | boolean | — |
| `contact.forms_preferred_over_raw_email` | boolean | — |
| `contact.spam_controls_present` | boolean | — |
| `measurement` | object | The measurement section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `measurement.periodic_name_search_check_performed` | boolean | — |
| `measurement.referrer_review_performed` | boolean | — |
| `measurement.vanity_metrics_ignored` | boolean | — |
| `measurement.impersonation_and_typosquat_watch` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.unverifiable_claims_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.impersonation_confusable_profiles_unfixed_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.family_privacy_boundaries_violated_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.brand_domain_lapsed_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.inflated_titles_present` | boolean | must be `false` to pass — SERVICE.md labels this field “skill standard” (see Discrepancies) |
| `red_lines.borrowed_prestige_present` | boolean | must be `false` to pass — SERVICE.md labels this field “skill standard” (see Discrepancies) |

### Checks

All 46 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: hub_and_spokes

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `primary_domain_designated` | hub: one primary domain is designated as the identity hub | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `single_canonical_hub` | hub: there is one canonical hub for the person | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `redirect_map_in_version_control` | hub: the redirect map is kept in version control | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `spoke_redirects_tested` | hub: all spoke redirects are tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `spokes_declared` | the declared record names its spoke domains — the spokes list is present and non-empty | Computed over the declared record. Pass: the `spokes` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_spoke_redirects_to_hub_or_purpose_page` | spokes: every declared spoke domain 301-redirects to the hub or to a purpose page | Computed over the declared record. Pass: every declared spoke row declares `redirects_to_hub_or_purpose_page: true`. Fail: a row declares the field present but not `true` (offending rows are named in `spokes_without_redirect`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `spokes_without_redirect`). |
| `every_spoke_title_description_consistent_with_hub` | spokes: every declared spoke carries a title and description consistent with the hub | Computed over the declared record. Pass: every declared spoke row declares `title_description_consistent_with_hub: true`. Fail: a row declares the field present but not `true` (offending rows are named in `spokes_without_consistent_title_description`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `spokes_without_consistent_title_description`). |
| `no_spoke_domain_duplicated` | spokes: no declared spoke domain appears on more than one spoke row | Computed over the declared record. Pass: no declared `domain` string appears on more than one spoke row. Fail: a `domain` string is declared on more than one row (offending domains are named in `duplicate_spoke_domains`). Missing: the list is absent, or a row has `domain` absent (such a row is missing evidence for this check). |

#### Section: identity_facts_and_structured_data

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `canonical_bio_defined` | identity: one canonical bio is defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `canonical_facts_defined` | identity: the canonical facts — name spelling, credentials, role line, location granularity — are defined once | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `bio_reused_byte_for_byte` | identity: the canonical bio is reused everywhere byte-for-byte | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `bio_consistent_across_hub_profiles_signatures` | identity: the bio is consistent across the hub, profiles, and signatures | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `json_ld_person_present` | structured data: JSON-LD Person is present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `json_ld_validates` | structured data: the JSON-LD validates | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `json_ld_same_as_lists_profiles` | structured data: the JSON-LD Person carries sameAs to the person's profiles | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `opengraph_cards_present_per_page` | structured data: OpenGraph cards are present per page | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `opengraph_cards_render_on_major_platforms` | structured data: OG cards render on major platforms | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `profiles_declared` | the declared record names its profiles — the profiles list is present and non-empty | Computed over the declared record. Pass: the `profiles` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_profile_bio_matches_canonical` | profiles: every declared profile carries the canonical bio | Computed over the declared record. Pass: every declared profile row declares `bio_matches_canonical: true`. Fail: a row declares the field present but not `true` (offending rows are named in `profiles_without_matching_bio`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `profiles_without_matching_bio`). |
| `every_profile_links_to_hub` | profiles: every declared profile links to the hub | Computed over the declared record. Pass: every declared profile row declares `links_to_hub: true`. Fail: a row declares the field present but not `true` (offending rows are named in `profiles_without_hub_link`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `profiles_without_hub_link`). |
| `no_profile_platform_duplicated` | profiles: no declared profile platform appears on more than one profile row | Computed over the declared record. Pass: no declared `platform` string appears on more than one profile row. Fail: a `platform` string is declared on more than one row (offending platforms are named in `duplicate_profile_platforms`). Missing: the list is absent, or a row has `platform` absent (such a row is missing evidence for this check). |

#### Section: content_standards_and_name_seo

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `content_sections_present` | content: the content sections — projects built, writing, speaking — are present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `claims_verifiable` | content: each claim is verifiable | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `claims_dated` | content: each claim is dated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `claims_linked` | content: each claim is linked | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `first_page_for_name_owned` | name SEO: the first page for the person's name is owned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `disambiguation_against_similar_names` | name SEO: the person is disambiguated against similar names | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `profiles_linked_reciprocally` | name SEO: profiles are linked reciprocally | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `rel_me_declared_where_supported` | name SEO: rel=me is declared where supported | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: cadence_contact_and_measurement

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `quarterly_refresh_of_bio_and_projects` | cadence: bio and projects are refreshed quarterly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `prior_versions_archived_publicly` | cadence: prior versions are archived publicly — change is normal; inconsistency is the failure | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `stable_contact_path_present` | contact: a stable contact path is present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `contact_path_works` | contact: the contact path works | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `alias_strategy_defined` | contact: an email alias strategy is defined | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `forms_preferred_over_raw_email` | contact: forms are used over raw email | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `spam_controls_present` | contact: spam controls are present — the contact path is spam-resistant | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `periodic_name_search_check_performed` | measurement: a periodic name-search check is performed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `referrer_review_performed` | measurement: a referrer review is performed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `vanity_metrics_ignored` | measurement: vanity metrics are ignored | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `impersonation_and_typosquat_watch` | measurement: impersonation and typosquats are watched for | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_unverifiable_claims` | red line: no unverifiable claims — especially credentials, clients, or affiliations — are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_impersonation_confusable_profiles_unfixed` | red line: no impersonation-confusable profiles are left unfixed | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_family_privacy_boundary_violations` | red line: family privacy boundaries are respected | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_brand_domain_lapsed` | red line: no brand domain has lapsed | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_inflated_titles` | red line: no inflated titles are present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_borrowed_prestige` | red line: no borrowed prestige is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"personal-web-presence-audit"`), `atom_version` (`"0.1.0"`), and `person` (the manifest's declared person value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `spokes_count` and `profiles_count` (the declared list lengths as integers, or null when the relevant list is not declared); the row-name lists `spokes_without_redirect` (spokes whose `redirects_to_hub_or_purpose_page` field is present but not `true`; a spoke with the field absent is missing evidence and does not appear), `spokes_without_consistent_title_description` (spokes whose `title_description_consistent_with_hub` field is present but not `true`), `profiles_without_matching_bio` (profiles whose `bio_matches_canonical` field is present but not `true`) and `profiles_without_hub_link` (profiles whose `links_to_hub` field is present but not `true`), and the duplicate lists `duplicate_spoke_domains` (spoke domains declared on more than one row, in the order their second occurrence appears) and `duplicate_profile_platforms` (profile platforms declared on more than one row, in the order their second occurrence appears) — all six lists are null when the relevant list is not declared, as recorded in the sparse case (the spokes lists when `spokes` is not declared, the profiles lists when `profiles` is not declared); and the ratios `redirect_coverage` (spokes redirecting ÷ declared spokes), `title_description_consistency_coverage` (spokes with a consistent title/description ÷ declared spokes), `bio_match_coverage` (profiles carrying the canonical bio ÷ declared profiles) and `hub_link_coverage` (profiles linking to the hub ÷ declared profiles) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "46 pass, 0 fail, 0 missing of 46 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared person value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `PERSONAL_PRESENCE_CONSISTENT` — all 46 checks pass: the declared personal web-presence record is complete and consistent with the bound skill's checklist and red lines.
- `PERSONAL_PRESENCE_INCONSISTENT` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the eight primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `spokes_count`, `profiles_count`, `spokes_without_redirect`, `redirect_coverage`, `spokes_without_consistent_title_description`, `title_description_consistency_coverage`, `duplicate_spoke_domains`, `profiles_without_matching_bio`, `bio_match_coverage`, `profiles_without_hub_link`, `hub_link_coverage`, `duplicate_profile_platforms` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"hub","detail":"hub must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type CHECK — this atom sells the check it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Run a personal brand web estate — canonical identity hub, spoke redirects, structured data, consistent bio (the bound capability, from the skill). You submit one declared record — the personal web presence manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`hub_and_spokes`, `identity_facts_and_structured_data`, `content_standards_and_name_seo`, `cadence_contact_and_measurement`, `red_lines`). The atom sells that check — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `spokes` list must be present and non-empty, every spoke row must declare `redirects_to_hub_or_purpose_page: true` and `title_description_consistent_with_hub: true`, and no declared `domain` string may appear on more than one spoke row, and the declared `profiles` list must be present and non-empty, every profile row must declare `bio_matches_canonical: true` and `links_to_hub: true`, and no declared `platform` string may appear on more than one profile row — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `PERSONAL_PRESENCE_INCONSISTENT`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `PERSONAL_PRESENCE_CONSISTENT`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a number or share of first-page name-search results the person must own beyond the skill's qualitative "own the first page for your name"; a number of spoke domains or profiles an estate must have beyond the two declared lists being non-empty; a bio-similarity percentage or text-diff bar for "consistent" or "byte-for-byte"; a redirect latency, uptime, or chain-length bar beyond the declared 301-to-hub-or-purpose-page fact; a JSON-LD validation score or an OG-render success rate across platforms; a refresh overdue-days bar beyond the skill's stated quarterly cadence; a spam-control effectiveness rate, an impersonation or typosquat count, or a referrer/traffic figure; a domain-renewal lead-time bar for the never-lapse red line. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** personal web-presence record: a verdict of `PERSONAL_PRESENCE_CONSISTENT` means the record is complete and consistent *on the caller's declared evidence* — a record that declares one canonical hub, tested redirects, and a byte-for-byte bio passes those checks even if the real estate does none of it. It is a completeness and consistency audit of the record the skill requires, **not a branding, SEO, or reputation service**. Specifically: it fetches nothing, browses nothing, crawls no domain, runs no search, validates no live JSON-LD, tests no live redirect, and does not verify that any declared fact is true on the live web. It never judges whether the bio is well written, whether the hub is the right domain, whether a claim is actually true, or whether the person's name should rank differently — only that the record contains what the skill's sections and red lines demand, and that its declared spoke and profile rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no verification of any credential, client, or affiliation named in a bio — the red line is checked only as the caller's declaration that no unverifiable claims are present; no judgment of writing quality or personal-brand strategy; domain registration, renewal, and lapse prevention itself is `domain-portfolio-ops`' ground — this atom checks only the caller's declaration that no brand domain has lapsed.

**Buyer and use context.** Teams and agents working in Everyday life who need this check on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: nrupalakolkar.com brand estate operations (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared personal web-presence record for consistency and verifiability of declared claims; its verdict is a declared-record consistency judgment, not compliance evidence in a regulated domain, and SERVICE.md's U-13 screen states its output could not read as regulated professional advice and that it verifies no credential or live fact. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `personal_web_presence_audit` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/personal_web_presence_audit.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_personal_web_presence_audit.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/personal-web-presence-audit` (REST) and `POST /mcp/personal-web-presence-audit` (MCP, tool `personal_web_presence_audit`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment c64bdc48fce84cd4817fe3a293be6ae5). Key scope: `personal_web_presence_audit`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally — NOT deployed**, “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment c64bdc48fce84cd4817fe3a293be6ae5) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the red-line checks and the computed checks. Recorded check names used verbatim in the Checks section include `no_unverifiable_claims` (input `red_lines.unverifiable_claims_present`), `no_impersonation_confusable_profiles_unfixed` (input `red_lines.impersonation_confusable_profiles_unfixed_present`), `no_family_privacy_boundary_violations` (input `red_lines.family_privacy_boundaries_violated_present` — also singular/plural and noun-form differences), `no_brand_domain_lapsed` (input `red_lines.brand_domain_lapsed_present`), `no_inflated_titles` (input `red_lines.inflated_titles_present`) and `no_borrowed_prestige` (input `red_lines.borrowed_prestige_present`), plus the computed checks `spokes_declared`, `every_spoke_redirects_to_hub_or_purpose_page`, `every_spoke_title_description_consistent_with_hub`, `no_spoke_domain_duplicated`, `profiles_declared`, `every_profile_bio_matches_canonical`, `every_profile_links_to_hub` and `no_profile_platform_duplicated`, which read the `spokes` / `profiles` rows rather than any single input field.
3. **Types unstated in SERVICE.md:** SERVICE.md's field table states no type for the container objects (`hub`, `identity`, `structured_data`, `content`, `name_seo`, `cadence`, `contact`, `measurement`, `red_lines`) or for a `spokes[]` / `profiles[]` row object. The Input reference types them `object` (and the lists as stated there), grounded in the recorded evidence inputs and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, and says so in each row's Notes.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field. The recorded REST response carries all 46 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects — `hub` and `spokes` inputs are read by the single recorded section `hub_and_spokes`, `identity`, `structured_data` and `profiles` inputs are read by the single recorded section `identity_facts_and_structured_data`, `content` and `name_seo` inputs are read by the single recorded section `content_standards_and_name_seo`, and `cadence`, `contact` and `measurement` inputs are read by the single recorded section `cadence_contact_and_measurement`. (`red_lines` is the one section that reads a single input object of the same name.) This document groups the Input reference and the Checks by the recorded section names.
6. **Null lists on undeclared `spokes` / `profiles` lists:** SERVICE.md's output paragraph states the null rules for `computed_status`, `spokes_count`, `profiles_count` and the coverage ratios, but does not state a null rule for the six row-name / domain / platform lists. The recorded sparse response returns all six lists as `null` when the relevant lists are not declared (as USER-GUIDE.md also states); this document follows the recording.
7. **Case-design prose notes in cases.json differ from the recorded executions (unscored prose; responses govern):** the sparse case's note in `cases.json` (and in evidence.json's `expect.notes`) says “Only the identity field present; every check missing”, but the recorded sparse input is only `{"person": "Jane Doe"}` — no `identity` object or field is present. The violations case's note, “Violates red line and spoke redirect consistency”, mentions only two of the four planted failures, omitting the `claims_verifiable` and profile hub-link failures. These are case-design prose notes, not scored expectations; the recorded inputs and responses govern.
8. **Red-line label for two fields:** SERVICE.md's field table labels `red_lines.inflated_titles_present` and `red_lines.borrowed_prestige_present` as “skill standard”, while the other four `red_lines` fields are labelled “skill red line” and the recorded evidence text for their checks (`no_inflated_titles`, `no_borrowed_prestige`) reads “red line: …”. This document follows the recording in the Checks section and notes the SERVICE.md label in the Input reference.

## Worked examples

Provenance: recorded 2026-11-16T08:31:40.621331+00:00 against gateway v1.1.0, external verification lane, source `verification/work/personal-web-presence-audit/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T08:31:40.621331+00:00 · gateway v1.1.0 · source `verification/work/personal-web-presence-audit/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "hub_and_spokes",
      "check": "primary_domain_designated",
      "status": "pass",
      "evidence": "hub: one primary domain is designated as the identity hub"
    },
    {
      "section": "hub_and_spokes",
      "check": "single_canonical_hub",
      "status": "pass",
      "evidence": "hub: there is one canonical hub for the person"
    },
    {
      "section": "hub_and_spokes",
      "check": "redirect_map_in_version_control",
      "status": "pass",
      "evidence": "hub: the redirect map is kept in version control"
    },
    {
      "section": "hub_and_spokes",
      "check": "spoke_redirects_tested",
      "status": "pass",
      "evidence": "hub: all spoke redirects are tested"
    },
    {
      "section": "hub_and_spokes",
      "check": "spokes_declared",
      "status": "pass",
      "evidence": "the declared record names its spoke domains — the spokes list is present and non-empty"
    },
    {
      "section": "hub_and_spokes",
      "check": "every_spoke_redirects_to_hub_or_purpose_page",
      "status": "pass",
      "evidence": "spokes: every declared spoke domain 301-redirects to the hub or to a purpose page"
    },
    {
      "section": "hub_and_spokes",
      "check": "every_spoke_title_description_consistent_with_hub",
      "status": "pass",
      "evidence": "spokes: every declared spoke carries a title and description consistent with the hub"
    },
    {
      "section": "hub_and_spokes",
      "check": "no_spoke_domain_duplicated",
      "status": "pass",
      "evidence": "spokes: no declared spoke domain appears on more than one spoke row"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "canonical_bio_defined",
      "status": "pass",
      "evidence": "identity: one canonical bio is defined"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "canonical_facts_defined",
      "status": "pass",
      "evidence": "identity: the canonical facts — name spelling, credentials, role line, location granularity — are defined once"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "bio_reused_byte_for_byte",
      "status": "pass",
      "evidence": "identity: the canonical bio is reused everywhere byte-for-byte"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "bio_consistent_across_hub_profiles_signatures",
      "status": "pass",
      "evidence": "identity: the bio is consistent across the hub, profiles, and signatures"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "json_ld_person_present",
      "status": "pass",
      "evidence": "structured data: JSON-LD Person is present"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "json_ld_validates",
      "status": "pass",
      "evidence": "structured data: the JSON-LD validates"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "json_ld_same_as_lists_profiles",
      "status": "pass",
      "evidence": "structured data: the JSON-LD Person carries sameAs to the person's profiles"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "opengraph_cards_present_per_page",
      "status": "pass",
      "evidence": "structured data: OpenGraph cards are present per page"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "opengraph_cards_render_on_major_platforms",
      "status": "pass",
      "evidence": "structured data: OG cards render on major platforms"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "profiles_declared",
      "status": "pass",
      "evidence": "the declared record names its profiles — the profiles list is present and non-empty"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "every_profile_bio_matches_canonical",
      "status": "pass",
      "evidence": "profiles: every declared profile carries the canonical bio"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "every_profile_links_to_hub",
      "status": "pass",
      "evidence": "profiles: every declared profile links to the hub"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "no_profile_platform_duplicated",
      "status": "pass",
      "evidence": "profiles: no declared profile platform appears on more than one profile row"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "content_sections_present",
      "status": "pass",
      "evidence": "content: the content sections — projects built, writing, speaking — are present"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "claims_verifiable",
      "status": "pass",
      "evidence": "content: each claim is verifiable"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "claims_dated",
      "status": "pass",
      "evidence": "content: each claim is dated"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "claims_linked",
      "status": "pass",
      "evidence": "content: each claim is linked"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "first_page_for_name_owned",
      "status": "pass",
      "evidence": "name SEO: the first page for the person's name is owned"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "disambiguation_against_similar_names",
      "status": "pass",
      "evidence": "name SEO: the person is disambiguated against similar names"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "profiles_linked_reciprocally",
      "status": "pass",
      "evidence": "name SEO: profiles are linked reciprocally"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "rel_me_declared_where_supported",
      "status": "pass",
      "evidence": "name SEO: rel=me is declared where supported"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "quarterly_refresh_of_bio_and_projects",
      "status": "pass",
      "evidence": "cadence: bio and projects are refreshed quarterly"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "prior_versions_archived_publicly",
      "status": "pass",
      "evidence": "cadence: prior versions are archived publicly — change is normal; inconsistency is the failure"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "stable_contact_path_present",
      "status": "pass",
      "evidence": "contact: a stable contact path is present"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "contact_path_works",
      "status": "pass",
      "evidence": "contact: the contact path works"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "alias_strategy_defined",
      "status": "pass",
      "evidence": "contact: an email alias strategy is defined"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "forms_preferred_over_raw_email",
      "status": "pass",
      "evidence": "contact: forms are used over raw email"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "spam_controls_present",
      "status": "pass",
      "evidence": "contact: spam controls are present — the contact path is spam-resistant"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "periodic_name_search_check_performed",
      "status": "pass",
      "evidence": "measurement: a periodic name-search check is performed"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "referrer_review_performed",
      "status": "pass",
      "evidence": "measurement: a referrer review is performed"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "vanity_metrics_ignored",
      "status": "pass",
      "evidence": "measurement: vanity metrics are ignored"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "impersonation_and_typosquat_watch",
      "status": "pass",
      "evidence": "measurement: impersonation and typosquats are watched for"
    },
    {
      "section": "red_lines",
      "check": "no_unverifiable_claims",
      "status": "pass",
      "evidence": "red line: no unverifiable claims — especially credentials, clients, or affiliations — are present"
    },
    {
      "section": "red_lines",
      "check": "no_impersonation_confusable_profiles_unfixed",
      "status": "pass",
      "evidence": "red line: no impersonation-confusable profiles are left unfixed"
    },
    {
      "section": "red_lines",
      "check": "no_family_privacy_boundary_violations",
      "status": "pass",
      "evidence": "red line: family privacy boundaries are respected"
    },
    {
      "section": "red_lines",
      "check": "no_brand_domain_lapsed",
      "status": "pass",
      "evidence": "red line: no brand domain has lapsed"
    },
    {
      "section": "red_lines",
      "check": "no_inflated_titles",
      "status": "pass",
      "evidence": "red line: no inflated titles are present"
    },
    {
      "section": "red_lines",
      "check": "no_borrowed_prestige",
      "status": "pass",
      "evidence": "red line: no borrowed prestige is present"
    }
  ],
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
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across five sections.",
  "stamp": "PERSONAL WEB PRESENCE AUDIT\nperson: Jane Doe\nVERDICT: PERSONAL_PRESENCE_CONSISTENT\n  hub_and_spokes                               pass\n  identity_facts_and_structured_data           pass\n  content_standards_and_name_seo               pass\n  cadence_contact_and_measurement              pass\n  red_lines                                    pass\n46 pass, 0 fail, 0 missing of 46 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T08:31:40.621331+00:00 · gateway v1.1.0 · source `verification/work/personal-web-presence-audit/evidence.json`.

Input:

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
      "redirects_to_hub_or_purpose_page": false,
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
      "links_to_hub": false
    }
  ],
  "content": {
    "content_sections_present": true,
    "claims_verifiable": false,
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
    "unverifiable_claims_present": true,
    "impersonation_confusable_profiles_unfixed_present": false,
    "family_privacy_boundaries_violated_present": false,
    "brand_domain_lapsed_present": false,
    "inflated_titles_present": false,
    "borrowed_prestige_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "personal-web-presence-audit",
  "atom_version": "0.1.0",
  "person": "Jane Doe",
  "verdict": "PERSONAL_PRESENCE_INCONSISTENT",
  "sections": {
    "hub_and_spokes": "fail",
    "identity_facts_and_structured_data": "fail",
    "content_standards_and_name_seo": "fail",
    "cadence_contact_and_measurement": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "hub_and_spokes",
      "check": "primary_domain_designated",
      "status": "pass",
      "evidence": "hub: one primary domain is designated as the identity hub"
    },
    {
      "section": "hub_and_spokes",
      "check": "single_canonical_hub",
      "status": "pass",
      "evidence": "hub: there is one canonical hub for the person"
    },
    {
      "section": "hub_and_spokes",
      "check": "redirect_map_in_version_control",
      "status": "pass",
      "evidence": "hub: the redirect map is kept in version control"
    },
    {
      "section": "hub_and_spokes",
      "check": "spoke_redirects_tested",
      "status": "pass",
      "evidence": "hub: all spoke redirects are tested"
    },
    {
      "section": "hub_and_spokes",
      "check": "spokes_declared",
      "status": "pass",
      "evidence": "the declared record names its spoke domains — the spokes list is present and non-empty"
    },
    {
      "section": "hub_and_spokes",
      "check": "every_spoke_redirects_to_hub_or_purpose_page",
      "status": "fail",
      "evidence": "spokes: every declared spoke domain 301-redirects to the hub or to a purpose page"
    },
    {
      "section": "hub_and_spokes",
      "check": "every_spoke_title_description_consistent_with_hub",
      "status": "pass",
      "evidence": "spokes: every declared spoke carries a title and description consistent with the hub"
    },
    {
      "section": "hub_and_spokes",
      "check": "no_spoke_domain_duplicated",
      "status": "pass",
      "evidence": "spokes: no declared spoke domain appears on more than one spoke row"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "canonical_bio_defined",
      "status": "pass",
      "evidence": "identity: one canonical bio is defined"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "canonical_facts_defined",
      "status": "pass",
      "evidence": "identity: the canonical facts — name spelling, credentials, role line, location granularity — are defined once"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "bio_reused_byte_for_byte",
      "status": "pass",
      "evidence": "identity: the canonical bio is reused everywhere byte-for-byte"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "bio_consistent_across_hub_profiles_signatures",
      "status": "pass",
      "evidence": "identity: the bio is consistent across the hub, profiles, and signatures"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "json_ld_person_present",
      "status": "pass",
      "evidence": "structured data: JSON-LD Person is present"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "json_ld_validates",
      "status": "pass",
      "evidence": "structured data: the JSON-LD validates"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "json_ld_same_as_lists_profiles",
      "status": "pass",
      "evidence": "structured data: the JSON-LD Person carries sameAs to the person's profiles"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "opengraph_cards_present_per_page",
      "status": "pass",
      "evidence": "structured data: OpenGraph cards are present per page"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "opengraph_cards_render_on_major_platforms",
      "status": "pass",
      "evidence": "structured data: OG cards render on major platforms"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "profiles_declared",
      "status": "pass",
      "evidence": "the declared record names its profiles — the profiles list is present and non-empty"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "every_profile_bio_matches_canonical",
      "status": "pass",
      "evidence": "profiles: every declared profile carries the canonical bio"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "every_profile_links_to_hub",
      "status": "fail",
      "evidence": "profiles: every declared profile links to the hub"
    },
    {
      "section": "identity_facts_and_structured_data",
      "check": "no_profile_platform_duplicated",
      "status": "pass",
      "evidence": "profiles: no declared profile platform appears on more than one profile row"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "content_sections_present",
      "status": "pass",
      "evidence": "content: the content sections — projects built, writing, speaking — are present"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "claims_verifiable",
      "status": "fail",
      "evidence": "content: each claim is verifiable"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "claims_dated",
      "status": "pass",
      "evidence": "content: each claim is dated"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "claims_linked",
      "status": "pass",
      "evidence": "content: each claim is linked"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "first_page_for_name_owned",
      "status": "pass",
      "evidence": "name SEO: the first page for the person's name is owned"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "disambiguation_against_similar_names",
      "status": "pass",
      "evidence": "name SEO: the person is disambiguated against similar names"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "profiles_linked_reciprocally",
      "status": "pass",
      "evidence": "name SEO: profiles are linked reciprocally"
    },
    {
      "section": "content_standards_and_name_seo",
      "check": "rel_me_declared_where_supported",
      "status": "pass",
      "evidence": "name SEO: rel=me is declared where supported"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "quarterly_refresh_of_bio_and_projects",
      "status": "pass",
      "evidence": "cadence: bio and projects are refreshed quarterly"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "prior_versions_archived_publicly",
      "status": "pass",
      "evidence": "cadence: prior versions are archived publicly — change is normal; inconsistency is the failure"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "stable_contact_path_present",
      "status": "pass",
      "evidence": "contact: a stable contact path is present"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "contact_path_works",
      "status": "pass",
      "evidence": "contact: the contact path works"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "alias_strategy_defined",
      "status": "pass",
      "evidence": "contact: an email alias strategy is defined"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "forms_preferred_over_raw_email",
      "status": "pass",
      "evidence": "contact: forms are used over raw email"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "spam_controls_present",
      "status": "pass",
      "evidence": "contact: spam controls are present — the contact path is spam-resistant"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "periodic_name_search_check_performed",
      "status": "pass",
      "evidence": "measurement: a periodic name-search check is performed"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "referrer_review_performed",
      "status": "pass",
      "evidence": "measurement: a referrer review is performed"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "vanity_metrics_ignored",
      "status": "pass",
      "evidence": "measurement: vanity metrics are ignored"
    },
    {
      "section": "cadence_contact_and_measurement",
      "check": "impersonation_and_typosquat_watch",
      "status": "pass",
      "evidence": "measurement: impersonation and typosquats are watched for"
    },
    {
      "section": "red_lines",
      "check": "no_unverifiable_claims",
      "status": "fail",
      "evidence": "red line: no unverifiable claims — especially credentials, clients, or affiliations — are present"
    },
    {
      "section": "red_lines",
      "check": "no_impersonation_confusable_profiles_unfixed",
      "status": "pass",
      "evidence": "red line: no impersonation-confusable profiles are left unfixed"
    },
    {
      "section": "red_lines",
      "check": "no_family_privacy_boundary_violations",
      "status": "pass",
      "evidence": "red line: family privacy boundaries are respected"
    },
    {
      "section": "red_lines",
      "check": "no_brand_domain_lapsed",
      "status": "pass",
      "evidence": "red line: no brand domain has lapsed"
    },
    {
      "section": "red_lines",
      "check": "no_inflated_titles",
      "status": "pass",
      "evidence": "red line: no inflated titles are present"
    },
    {
      "section": "red_lines",
      "check": "no_borrowed_prestige",
      "status": "pass",
      "evidence": "red line: no borrowed prestige is present"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "spokes_count": 1,
  "spokes_without_redirect": [
    "janedoe.net"
  ],
  "redirect_coverage": "0.000000",
  "spokes_without_consistent_title_description": [],
  "title_description_consistency_coverage": "1.000000",
  "duplicate_spoke_domains": [],
  "profiles_count": 1,
  "profiles_without_matching_bio": [],
  "bio_match_coverage": "1.000000",
  "profiles_without_hub_link": [
    "linkedin"
  ],
  "hub_link_coverage": "0.000000",
  "duplicate_profile_platforms": [],
  "summary": "42 pass, 4 fail, 0 missing of 46 checks across five sections.",
  "stamp": "PERSONAL WEB PRESENCE AUDIT\nperson: Jane Doe\nVERDICT: PERSONAL_PRESENCE_INCONSISTENT\n  hub_and_spokes                               fail\n  identity_facts_and_structured_data           fail\n  content_standards_and_name_seo               fail\n  cadence_contact_and_measurement              pass\n  red_lines                                    fail\n42 pass, 4 fail, 0 missing of 46 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T08:31:40.621331+00:00 · gateway v1.1.0 · source `verification/work/personal-web-presence-audit/evidence.json`.

Input:

```json
{
  "person": "Jane Doe",
  "hub": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "hub",
  "detail": "hub must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared personal web-presence record for consistency and verifiability of declared claims; its verdict is a declared-record consistency judgment, not compliance evidence in a regulated domain, and SERVICE.md's U-13 screen states its output could not read as regulated professional advice. |
| Checks named | 46 documented / 46 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`spokes_count`, `profiles_count`, the six row-name / domain / platform lists and the four coverage ratios) |
| Input reference typed | Yes — 58 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/personal-web-presence-audit/evidence.json` |
