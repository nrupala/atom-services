# Sourced visual reference search — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have carried out a visual-reference search — searching the web by description for existing images, each kept with its source page so it can be judged, cited and used as a reliable reference — and you keep a declared record of that search. This atom reads one declared manifest and returns one deterministic verdict across six sections (search_brief_and_query, source_provenance, relevance_and_quality, context_and_selection, licensing_and_attribution, red_lines): **VISUAL_REFERENCE_SET_SOUND**, **VISUAL_REFERENCE_SET_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 34 checks, 17 of them computed from the declared result rows. It audits the declared visual-reference search record's completeness and internal consistency only — it performs no live search, fetches no image or source page, opens no link, runs no image recognition, and identifies no person. A reference set is sound *on your declared evidence*: a record that declares every source page verified, every image matching by viewing and every licence noted passes those checks even if the real search did none of it. It is not a search engine, an image verifier, a rights-clearance service, or a guarantee that any image may be republished or used commercially: it never judges whether a declared image actually shows the subject, whether a declared licence status is correct for that image, whether a source page says what the record claims, or whether a chosen image is the right reference for the brief — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. The skill's red lines are checks here, not features: no person identified in a found photo, no found image presented as one's own or generated, no found image presented as licensed without an explicit grant, no unsourced image returned, and no altered image passed as the original are ever performed — the atom audits the record of the search you have already made. The computed checks: the declared `results` list must be present and name at least one result (an empty list fails); no `result_id` may appear on more than one row; every row must declare both a non-empty `direct_image_url` and a non-empty `source_page_url` together; every row's source page must be declared verified; no `direct_image_url` may appear on more than one row; every row must declare it matches the brief by viewing, shows the subject clearly and is at a usable resolution; no row may carry misleading cropping, a watermark or a caption/product mismatch; every row must note its depiction, its publisher and its caption/date/credit context; where a choice is involved the set must carry at least three distinct declared direct image URLs (the minimum of the skill's stated "typically three to six varied options" range; otherwise at least one distinct candidate); every row must carry a licence note, a licence status in the recognised vocabulary (`explicitly_licensed`, `reference_only_no_licence_stated` or `licence_unknown`) and a noted credit; and no row may be claimed cleared for commercial use while its licence status is not `explicitly_licensed`. Declined thresholds, named: no maximum choice-set size of six as a hard cap (the six is a typical upper end, not a bar); no minimum or exact resolution in pixels, megapixels or file size for "usable resolution" (usability is a caller declaration, never re-measured — the atom fetches no image); no relevance, similarity or quality score for a candidate (checked by viewing is a declaration, never scored); no search-result rank, search-engine or source-domain whitelist or blacklist; no licence-validity, licence-compatibility or fair-use determination (whether a declared licence actually applies to an image or a use is a legal question it does not answer); no attribution-text format or completeness standard beyond a credit being noted; no freshness or publication-date window for results; no count of searches, query reformulations or sources searched beyond the declared terms-adjustment attestation; and no judgment that a returned image is in fact the strongest match (only that a strongest match is declared called out first is checked). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "sourced-visual-reference-search"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/sourced-visual-reference-search` — tool name `sourced_visual_reference_search`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/sourced-visual-reference-search` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `search_title` | Search title (string; carried into the output, not checked) |
| `brief.target_restated_in_searchable_terms` | search-brief evidence: the target is restated in searchable terms before searching |
| `brief.subject_stated` | search-brief evidence: the subject the images must show is stated |
| `brief.setting_stated` | search-brief evidence: the setting the subject must appear in is stated |
| `brief.angle_or_style_stated` | search-brief evidence: the angle or style the images must show is stated |
| `brief.must_have_and_must_avoid_details_stated` | search-brief evidence: the must-have and must-avoid details are stated |
| `search.terms_adjusted_when_first_pass_off_topic` | search evidence: the search terms were adjusted when the first pass was off-topic, where that applied |
| `results` (list of result objects) | computed: must be present and name at least one result; reported as `visual_reference_results_count` |
| `results[].result_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `results[].direct_image_url` (string) | the direct image link; computed: must be non-empty, paired with the source page, and unique per row |
| `results[].source_page_url` (string) | the page the image came from; computed: must be non-empty and paired with the direct image link |
| `results[].source_page_verified` | computed: the row's source page was opened or verified; must be `true` on every row |
| `results[].matches_brief_by_viewing` | computed: the row actually matches the description, checked by viewing; must be `true` on every row |
| `results[].shows_subject_clearly` | computed: the row shows the subject clearly; must be `true` on every row |
| `results[].usable_resolution_declared` | computed: the row is declared to be at a usable resolution; must be `true` on every row (no pixel bar is set) |
| `results[].misleading_cropping_present` | computed: must be `false` on every row (quality defect) |
| `results[].watermark_present` | computed: must be `false` on every row (quality defect) |
| `results[].caption_product_mismatch_present` | computed: must be `false` on every row (quality defect) |
| `results[].depiction_noted` | computed: what the image depicts, from its source page, is noted; must be `true` on every row |
| `results[].publisher_noted` | computed: who published the image, from its source page, is noted; must be `true` on every row |
| `results[].caption_date_or_credit_noted` | computed: any caption, date or credit information on the source page is noted; must be `true` on every row |
| `results[].licence_status` (string) | computed: must be one of `explicitly_licensed`, `reference_only_no_licence_stated` or `licence_unknown` |
| `results[].licence_note_present` | computed: the row carries a licence note; must be `true` on every row |
| `results[].credit_noted` | computed: the row's credit is noted; must be `true` on every row |
| `results[].claimed_cleared_for_commercial_use` | computed: may be `true` only when the row's `licence_status` is `explicitly_licensed` |
| `quality.relevance_checked_by_viewing_not_title_alone` | relevance evidence: relevance was checked by looking at each candidate, not by title alone |
| `quality.weak_duplicate_or_misleading_filtered_out` | relevance evidence: weak, duplicate or misleading results were filtered out before presenting |
| `selection.involves_choice` | selection evidence: the request involves a choice; gates the choice-set computed check (at least three distinct candidates when true, at least one otherwise) |
| `selection.strongest_match_called_out_first` | selection evidence: the strongest match is called out first |
| `selection.similar_candidates_grouped` | selection evidence: similar candidates are grouped together |
| `selection.evidence_use_paired_with_facts_where_used_as_evidence` | selection evidence: where images are used as evidence, the set is paired with the underlying facts, where that applied |
| `licensing.licensing_caution_stated_plainly` | licensing evidence: the licensing caution is stated plainly — these are references found on the web, not images cleared for republication or commercial use, unless a licence on the source page explicitly says otherwise |
| `red_lines.person_identified_in_found_photo_present` | must be `false` to pass (red line: no person is identified in a found photo) |
| `red_lines.found_image_presented_as_own_or_generated_present` | must be `false` to pass (red line: no found image is presented as one's own or as generated) |
| `red_lines.found_image_presented_as_licensed_without_explicit_grant_present` | must be `false` to pass (red line: no found image is presented as licensed without an explicit grant) |
| `red_lines.unsourced_image_returned_present` | must be `false` to pass (red line: no unsourced image is returned) |
| `red_lines.altered_image_passed_as_original_present` | must be `false` to pass (red line: no altered image is passed as the original) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward VISUAL_REFERENCE_SET_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/sourced-visual-reference-search`:

```json
{
  "search_title": "Golden Retriever in autumn leaves",
  "brief": {
    "target_restated_in_searchable_terms": true,
    "subject_stated": true,
    "setting_stated": true,
    "angle_or_style_stated": true,
    "must_have_and_must_avoid_details_stated": true
  },
  "search": {
    "terms_adjusted_when_first_pass_off_topic": true
  },
  "results": [
    {
      "result_id": "r1",
      "direct_image_url": "https://example.com/img1.jpg",
      "source_page_url": "https://example.com/page1",
      "source_page_verified": true,
      "matches_brief_by_viewing": true,
      "shows_subject_clearly": true,
      "usable_resolution_declared": true,
      "misleading_cropping_present": false,
      "watermark_present": false,
      "caption_product_mismatch_present": false,
      "depiction_noted": true,
      "publisher_noted": true,
      "caption_date_or_credit_noted": true,
      "licence_status": "explicitly_licensed",
      "licence_note_present": true,
      "credit_noted": true,
      "claimed_cleared_for_commercial_use": true
    },
    {
      "result_id": "r2",
      "direct_image_url": "https://example.com/img2.jpg",
      "source_page_url": "https://example.com/page2",
      "source_page_verified": true,
      "matches_brief_by_viewing": true,
      "shows_subject_clearly": true,
      "usable_resolution_declared": true,
      "misleading_cropping_present": false,
      "watermark_present": false,
      "caption_product_mismatch_present": false,
      "depiction_noted": true,
      "publisher_noted": true,
      "caption_date_or_credit_noted": true,
      "licence_status": "reference_only_no_licence_stated",
      "licence_note_present": true,
      "credit_noted": true,
      "claimed_cleared_for_commercial_use": false
    },
    {
      "result_id": "r3",
      "direct_image_url": "https://example.com/img3.jpg",
      "source_page_url": "https://example.com/page3",
      "source_page_verified": true,
      "matches_brief_by_viewing": true,
      "shows_subject_clearly": true,
      "usable_resolution_declared": true,
      "misleading_cropping_present": false,
      "watermark_present": false,
      "caption_product_mismatch_present": false,
      "depiction_noted": true,
      "publisher_noted": true,
      "caption_date_or_credit_noted": true,
      "licence_status": "licence_unknown",
      "licence_note_present": true,
      "credit_noted": true,
      "claimed_cleared_for_commercial_use": false
    }
  ],
  "quality": {
    "relevance_checked_by_viewing_not_title_alone": true,
    "weak_duplicate_or_misleading_filtered_out": true
  },
  "selection": {
    "involves_choice": true,
    "strongest_match_called_out_first": true,
    "similar_candidates_grouped": true,
    "evidence_use_paired_with_facts_where_used_as_evidence": true
  },
  "licensing": {
    "licensing_caution_stated_plainly": true
  },
  "red_lines": {
    "person_identified_in_found_photo_present": false,
    "found_image_presented_as_own_or_generated_present": false,
    "found_image_presented_as_licensed_without_explicit_grant_present": false,
    "unsourced_image_returned_present": false,
    "altered_image_passed_as_original_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 34 checks and a text stamp of the verdict):

```json
{
  "service": "sourced-visual-reference-search",
  "atom_version": "0.1.0",
  "search_title": "Golden Retriever in autumn leaves",
  "verdict": "VISUAL_REFERENCE_SET_SOUND",
  "sections": {
    "search_brief_and_query": "pass",
    "source_provenance": "pass",
    "relevance_and_quality": "pass",
    "context_and_selection": "pass",
    "licensing_and_attribution": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "visual_reference_results_count": 3,
  "duplicate_visual_reference_result_ids": [],
  "duplicate_visual_reference_direct_image_urls": [],
  "visual_reference_results_missing_source_pair": [],
  "visual_reference_results_with_incomplete_licence_attribution": [],
  "sourced_pair_coverage_ratio": "1.000000",
  "licence_attribution_coverage_ratio": "1.000000",
  "visual_reference_match_ratio": "1.000000",
  "summary": "34 pass, 0 fail, 0 missing of 34 checks across six sections."
}
```

## Verdicts

- **VISUAL_REFERENCE_SET_SOUND** — every check passes; the declared visual-reference search record is complete and internally consistent with the skill's method, quality gates and red lines.
- **VISUAL_REFERENCE_SET_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `visual_reference_results_count` (the declared list length, an integer exactly; null when the list is not declared), `duplicate_visual_reference_result_ids` (ids declared on more than one row, in the order their second occurrence appears; null when the list is not declared), `duplicate_visual_reference_direct_image_urls` (URLs declared on more than one row, in the order their second occurrence appears; null when the list is not declared), `visual_reference_results_missing_source_pair` (rows without both a non-empty direct image URL and a non-empty source page URL; null when the list is not declared), `visual_reference_results_with_incomplete_licence_attribution` (rows whose licence note, recognised licence status and credit note are not all present and true; null when the list is not declared), and the ratios `sourced_pair_coverage_ratio` (rows with both links present ÷ declared rows), `licence_attribution_coverage_ratio` (rows with complete licence/attribution declarations ÷ declared rows) and `visual_reference_match_ratio` (rows declared to match the brief by viewing ÷ declared rows) — each a string with exactly six decimal places (round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then formatted with exactly six decimals), and null when its denominator list is absent or empty — and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the seventeen computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
