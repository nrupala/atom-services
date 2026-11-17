# Sourced visual reference search — documentation

**Sourced visual reference search** · slug `sourced-visual-reference-search` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment ac6ddba696934ceb84596876507fc08c; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared visual-reference search record for completeness and consistency only. It surfaces two faces: REST `POST /v1/sourced-visual-reference-search` and MCP `POST /mcp/sourced-visual-reference-search`. It performs no live search, fetches no image or source page, and identifies no person — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/sourced-visual-reference-search/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment ac6ddba696934ceb84596876507fc08c). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the search "Golden Retriever in autumn leaves"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "sourced-visual-reference-search"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the visual-reference search manifest.** You declare a visual-reference search record for one search, made from the search as actually carried out — the atom audits the declared record, it does not search or fetch any image (see Explanation). The recorded full-pass manifest declares the search `Golden Retriever in autumn leaves`: all five brief flags `true` (target restated in searchable terms, subject stated, setting stated, angle or style stated, and must-have and must-avoid details stated); `search.terms_adjusted_when_first_pass_off_topic` `true`; three results `r1` / `r2` / `r3` (direct image URLs `https://example.com/img1.jpg` / `img2.jpg` / `img3.jpg`, source pages `https://example.com/page1` / `page2` / `page3`, every row source-page verified, matching the brief by viewing, showing the subject clearly and at a usable declared resolution, with no misleading cropping, watermark or caption/product mismatch, and depiction, publisher and caption/date/credit context all noted; licence note present and credit noted on every row; licence statuses `explicitly_licensed` with `claimed_cleared_for_commercial_use` `true` on `r1` only, `reference_only_no_licence_stated` on `r2` and `licence_unknown` on `r3`); both quality flags `true` (relevance checked by viewing not title alone, weak/duplicate/misleading results filtered out); selection with `involves_choice` `true`, the strongest match called out first, similar candidates grouped and evidence use paired with facts `true`; the licensing caution stated plainly `true`; and all five red-line flags `false` (no person identified, no found image presented as own or generated, none presented as licensed without an explicit grant, no unsourced image returned, no altered image passed as original).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/sourced-visual-reference-search` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `VISUAL_REFERENCE_SET_SOUND`: "34 pass, 0 fail, 0 missing of 34 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `visual_reference_results_count` is 3, and `sourced_pair_coverage_ratio`, `licence_attribution_coverage_ratio` and `visual_reference_match_ratio` are each `"1.000000"`, with every row-name list empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `VISUAL_REFERENCE_SET_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "sourced-visual-reference-search"}`.
3. Call: `POST https://atoms.pipavia.com/v1/sourced-visual-reference-search` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/sourced-visual-reference-search` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `sourced_visual_reference_search`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `VISUAL_REFERENCE_SET_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 2 checks fail: `every_visual_reference_result_matches_brief_by_viewing` and `no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch`, and the summary reads "32 pass, 2 fail, 0 missing of 34 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `results[0].matches_brief_by_viewing` is declared `false`, failing `every_visual_reference_result_matches_brief_by_viewing`, with `visual_reference_match_ratio` `"0.666667"`; and `results[0].misleading_cropping_present` is declared `true`, failing `no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch`; the other computed outputs are unchanged — `visual_reference_results_count` 3, `sourced_pair_coverage_ratio` and `licence_attribution_coverage_ratio` each `"1.000000"`, and `duplicate_visual_reference_result_ids`, `duplicate_visual_reference_direct_image_urls`, `visual_reference_results_missing_source_pair` and `visual_reference_results_with_incomplete_licence_attribution` each `[]`; section `relevance_and_quality` reports `fail`, the other five sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "brief",
  "detail": "brief must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/sourced-visual-reference-search` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/sourced-visual-reference-search` — tool name `sourced_visual_reference_search`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `sourced_visual_reference_search` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `search_title` and the row fields `result_id`, `direct_image_url`, `source_page_url` and `licence_status` are noted as strings there (the two URL fields as non-empty strings), and `results` as a list there. Where SERVICE.md states no type — the section container objects (`brief`, `search`, `quality`, `selection`, `licensing`, `red_lines`) and the result-row object (`results[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and the `results` list, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and `results` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `VISUAL_REFERENCE_SET_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them; the `results` list and its row fields are read by four sections, and each row field is grouped under the first section SERVICE.md names for it.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `search_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: search_brief_and_query

| Field | Type | Notes |
|---|---|---|
| `brief` | object | The search-brief section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `brief.target_restated_in_searchable_terms` | boolean | — |
| `brief.subject_stated` | boolean | — |
| `brief.setting_stated` | boolean | — |
| `brief.angle_or_style_stated` | boolean | — |
| `brief.must_have_and_must_avoid_details_stated` | boolean | — |
| `search` | object | The search-adjustment section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `search.terms_adjusted_when_first_pass_off_topic` | boolean | Declared where it applied (type stated in SERVICE.md) |

#### Read by: source_provenance (the `results` rows are also read by relevance_and_quality, context_and_selection and licensing_and_attribution)

| Field | Type | Notes |
|---|---|---|
| `results` | list | list of result-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `results[]` | object | One declared result row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `results[].result_id` | string | Must be unique per row; names the row in the computed outputs (type stated in SERVICE.md) |
| `results[].direct_image_url` | string (non-empty) | Must be unique per row, computed (type stated in SERVICE.md) |
| `results[].source_page_url` | string (non-empty) | The page the image came from (type stated in SERVICE.md) |
| `results[].source_page_verified` | boolean | — |

#### Read by: relevance_and_quality (row fields)

| Field | Type | Notes |
|---|---|---|
| `results[].matches_brief_by_viewing` | boolean | Must be `true` per row |
| `results[].shows_subject_clearly` | boolean | Must be `true` per row |
| `results[].usable_resolution_declared` | boolean | Must be `true` per row |
| `results[].misleading_cropping_present` | boolean | Must be `false` per row |
| `results[].watermark_present` | boolean | Must be `false` per row |
| `results[].caption_product_mismatch_present` | boolean | Must be `false` per row |

#### Read by: relevance_and_quality

| Field | Type | Notes |
|---|---|---|
| `quality` | object | The relevance-and-quality section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `quality.relevance_checked_by_viewing_not_title_alone` | boolean | — |
| `quality.weak_duplicate_or_misleading_filtered_out` | boolean | — |

#### Read by: context_and_selection (row fields)

| Field | Type | Notes |
|---|---|---|
| `results[].depiction_noted` | boolean | Must be `true` per row |
| `results[].publisher_noted` | boolean | Must be `true` per row |
| `results[].caption_date_or_credit_noted` | boolean | Must be `true` per row |

#### Read by: context_and_selection

| Field | Type | Notes |
|---|---|---|
| `selection` | object | The selection section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `selection.involves_choice` | boolean | Gates the choice-set computed check (see Checks); it has no attestation check of its own |
| `selection.strongest_match_called_out_first` | boolean | — |
| `selection.similar_candidates_grouped` | boolean | — |
| `selection.evidence_use_paired_with_facts_where_used_as_evidence` | boolean | Declared where it applied (type stated in SERVICE.md) |

#### Read by: licensing_and_attribution (row fields)

| Field | Type | Notes |
|---|---|---|
| `results[].licence_status` | string | One of `explicitly_licensed`, `reference_only_no_licence_stated`, `licence_unknown` (type and vocabulary stated in SERVICE.md) |
| `results[].licence_note_present` | boolean | Must be `true` per row |
| `results[].credit_noted` | boolean | Must be `true` per row |
| `results[].claimed_cleared_for_commercial_use` | boolean | May be `true` only when `licence_status` is `explicitly_licensed`, computed |

#### Read by: licensing_and_attribution

| Field | Type | Notes |
|---|---|---|
| `licensing` | object | The licensing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `licensing.licensing_caution_stated_plainly` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.person_identified_in_found_photo_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.found_image_presented_as_own_or_generated_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.found_image_presented_as_licensed_without_explicit_grant_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unsourced_image_returned_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.altered_image_passed_as_original_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 34 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Seventeen of the 34 checks are computed from the declared result rows (SERVICE.md); the other seventeen are attestation checks over a single declared boolean.

#### Section: search_brief_and_query

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `visual_reference_target_restated_in_searchable_terms` | brief: the target is restated in searchable terms before searching | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `visual_reference_subject_stated` | brief: the subject the images must show is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `visual_reference_setting_stated` | brief: the setting the subject must appear in is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `visual_reference_angle_or_style_stated` | brief: the angle or style the images must show is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `visual_reference_must_have_and_must_avoid_details_stated` | brief: the must-have and must-avoid details are stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `visual_reference_search_terms_adjusted_when_first_pass_off_topic` | search: the search terms were broadened or narrowed when the first pass returned off-topic, stocky or low-quality results, where that applied | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: source_provenance

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `visual_reference_results_list_declared` | the declared record names its visual reference results — the results list is present and names at least one result; an absent list is missing evidence and an empty list declares no reference set at all | Computed over the declared record. Pass: the `results` list is present and names at least one result. Fail: the list is present but empty — it declares no reference set at all. Missing: the list is absent. |
| `every_visual_reference_result_id_unique` | visual reference results: no declared result_id is owned by more than one row | Computed over the declared record. Pass: no declared `result_id` appears on more than one row. Fail: a `result_id` is declared on more than one row (duplicates are named in `duplicate_visual_reference_result_ids`, in the order their second occurrence appears). Missing: the list is absent, or a row has `result_id` absent. |
| `every_visual_reference_result_has_direct_image_and_source_page_links` | visual reference results: every declared result carries both a non-empty direct image link and a non-empty source page link together | Computed over the declared record. Pass: every declared row declares both `direct_image_url` and `source_page_url`, neither empty. Fail: a row declares an empty link (offending rows are named in `visual_reference_results_missing_source_pair`). Missing: the list is absent, or a row has a link field absent. |
| `every_visual_reference_result_source_page_verified` | visual reference results: every declared result's source page was opened or verified | Computed over the declared record. Pass: every declared row declares `source_page_verified` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `every_visual_reference_direct_image_url_unique` | visual reference results: no declared direct image URL is owned by more than one row — duplicate results were filtered out | Computed over the declared record. Pass: no declared `direct_image_url` appears on more than one row. Fail: a `direct_image_url` is declared on more than one row (duplicates are named in `duplicate_visual_reference_direct_image_urls`), or a row declares an empty URL. Missing: the list is absent, or a row has the field absent. |

#### Section: relevance_and_quality

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `visual_reference_relevance_checked_by_viewing_not_title_alone` | quality: relevance was checked by looking at each candidate, not by title alone | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_visual_reference_result_matches_brief_by_viewing` | visual reference results: every declared result actually matches the description, checked by viewing | Computed over the declared record. Pass: every declared row declares `matches_brief_by_viewing` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `every_visual_reference_result_shows_subject_clearly` | visual reference results: every declared result shows the subject clearly | Computed over the declared record. Pass: every declared row declares `shows_subject_clearly` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `every_visual_reference_result_usable_resolution_declared` | visual reference results: every declared result is declared to be at a usable resolution | Computed over the declared record. Pass: every declared row declares `usable_resolution_declared` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch` | visual reference results: no declared result carries misleading cropping, a watermark, or a different product than its caption claims | Computed over the declared record. Pass: no declared row declares `misleading_cropping_present`, `watermark_present` or `caption_product_mismatch_present` `true`. Fail: a row declares any of the three `true`. Missing: the list is absent, or a row has any of the three fields absent. |
| `visual_reference_weak_duplicate_or_misleading_results_filtered_out` | quality: weak, duplicate or misleading results were filtered out before presenting | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: context_and_selection

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `every_visual_reference_result_depiction_noted` | visual reference results: every declared result notes what the image depicts, from its source page | Computed over the declared record. Pass: every declared row declares `depiction_noted` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `every_visual_reference_result_publisher_noted` | visual reference results: every declared result notes who published it, from its source page | Computed over the declared record. Pass: every declared row declares `publisher_noted` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `every_visual_reference_result_caption_date_or_credit_context_noted` | visual reference results: every declared result notes any caption, date or credit information present on its source page | Computed over the declared record. Pass: every declared row declares `caption_date_or_credit_noted` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `visual_reference_strongest_match_called_out_first` | selection: the strongest match is called out first, so choosing takes seconds | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `visual_reference_similar_candidates_grouped` | selection: similar candidates are grouped together | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `visual_reference_choice_set_several_distinct_candidates_when_choice_involved` | selection: when the request involves a choice, several distinct candidates are offered — at least three distinct declared direct image URLs, the minimum of the skill's stated three-to-six range; otherwise at least one distinct candidate | Computed over the declared record. Pass: where `selection.involves_choice` is declared `true`, the set carries at least three distinct declared direct image URLs; where no choice is involved, at least one distinct candidate. Fail: fewer distinct candidates than the applicable minimum. Missing: the `involves_choice` field is absent, the list is absent, or a row has `direct_image_url` absent. |
| `visual_reference_evidence_use_paired_with_facts_where_used_as_evidence` | selection: where images are used as evidence, the set is paired with the underlying facts and handed off to deeper verification, never a photo standing alone as proof, where that applied | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: licensing_and_attribution

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `visual_reference_licensing_caution_stated_plainly` | licensing: the licensing caution is stated plainly — these are references found on the web, not images cleared for republication or commercial use, unless a licence on the source page explicitly says otherwise | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_visual_reference_result_licence_note_present` | visual reference results: every declared result carries a licence note | Computed over the declared record. Pass: every declared row declares `licence_note_present` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `every_visual_reference_result_licence_status_recognised` | visual reference results: every declared result's licence status is one of explicitly_licensed, reference_only_no_licence_stated or licence_unknown | Computed over the declared record. Pass: every declared row's `licence_status` is one of `explicitly_licensed`, `reference_only_no_licence_stated` or `licence_unknown`. Fail: a row declares a `licence_status` outside that vocabulary. Missing: the list is absent, or a row has the field absent. |
| `every_visual_reference_result_credit_noted` | visual reference results: every declared result notes any explicit licence or credit from its source | Computed over the declared record. Pass: every declared row declares `credit_noted` `true`. Fail: a row declares it `false`. Missing: the list is absent, or a row has the field absent. |
| `no_visual_reference_result_claimed_cleared_without_explicit_licence` | visual reference results: no declared result is claimed cleared for commercial use unless its declared licence status is explicitly_licensed | Computed over the declared record. Pass: no declared row declares `claimed_cleared_for_commercial_use` `true` while its `licence_status` is not `explicitly_licensed`. Fail: a row is claimed cleared while its declared `licence_status` is not `explicitly_licensed`. Missing: the list is absent, or a row has `claimed_cleared_for_commercial_use` or `licence_status` absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `visual_reference_free_of_person_identification` | red line: no person in a found photo is identified — no naming, guessing or biographical claims — in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `visual_reference_free_of_found_image_presented_as_own_or_generated` | red line: no found image is presented as the caller's own, as the owner's own, or as generated for them in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `visual_reference_free_of_found_image_presented_as_licensed_without_grant` | red line: no found image is presented as licensed for commercial use or republication without the source page granting that right explicitly in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `visual_reference_free_of_unsourced_image_returned` | red line: no image without its source page is returned in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `visual_reference_free_of_altered_image_passed_as_original` | red line: no altered found image is passed off as the original evidence in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"sourced-visual-reference-search"`), `atom_version` (`"0.1.0"`), and `search_title` (the manifest's declared search title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `visual_reference_results_count` (the declared list length as an integer, or null when the list is not declared); the row lists `duplicate_visual_reference_result_ids` (ids declared on more than one row, in the order their second occurrence appears), `duplicate_visual_reference_direct_image_urls` (URLs declared on more than one row, in the order their second occurrence appears), `visual_reference_results_missing_source_pair` (rows without both a non-empty direct image URL and a non-empty source page URL) and `visual_reference_results_with_incomplete_licence_attribution` (rows whose licence note, recognised licence status and credit note are not all present and true) — each null when the `results` list is not declared, as recorded in the sparse case; and the ratios `sourced_pair_coverage_ratio` (rows with both links present ÷ declared rows), `licence_attribution_coverage_ratio` (rows with complete licence/attribution declarations ÷ declared rows) and `visual_reference_match_ratio` (rows declared to match the brief by viewing ÷ declared rows) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; comparisons use the unrounded values — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "34 pass, 0 fail, 0 missing of 34 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared search title value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `VISUAL_REFERENCE_SET_SOUND` — all 34 checks pass: the declared visual-reference search record is complete and consistent with the bound skill's method, quality gates and red lines.
- `VISUAL_REFERENCE_SET_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the seventeen computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `visual_reference_results_count`, `duplicate_visual_reference_result_ids`, `duplicate_visual_reference_direct_image_urls`, `visual_reference_results_missing_source_pair`, `visual_reference_results_with_incomplete_licence_attribution`, `sourced_pair_coverage_ratio`, `licence_attribution_coverage_ratio`, `visual_reference_match_ratio` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"brief","detail":"brief must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = query (one query = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Search the web by description for images — returning each image with its source page so it can be judged, cited, and used as a reliable reference (the bound capability, from the skill). The skill is a finding skill, not a creation skill: the results are existing images from the web, with their provenance kept, framed honestly about what they prove and what rights they carry. You submit one declared record — the visual-reference search manifest, made from the search as actually carried out — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 6 sections (`search_brief_and_query`, `source_provenance`, `relevance_and_quality`, `context_and_selection`, `licensing_and_attribution`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest siblings `link-rot-scan-and-notarized-archive` and `brand-mention-monitoring-triage-digest` and with every other atom (SERVICE.md, Distinct ground); it asks visual-reference questions only — sourced pairing, viewed relevance, noted context, a plainly stated licensing caution and the image-search red lines.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* (seventeen) read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* (seventeen) are calculated from the declared result rows themselves — the `results` list must be present and name at least one result (an empty list fails), result ids and direct image URLs must be unique per row, every row must pair a non-empty direct image link with a non-empty source page link with the source page verified, match the brief by viewing, show the subject clearly, declare usable resolution, carry no misleading cropping, watermark or caption/product mismatch, note its depiction, publisher and caption/date/credit context, carry a licence note, a licence status in the recognised vocabulary and a noted credit, no row may be claimed cleared for commercial use without an `explicitly_licensed` status, and where a choice is involved the set must carry at least three distinct declared direct image URLs — using only the skill's own stated method and quality gates plus the consistency of the declared record itself, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `VISUAL_REFERENCE_SET_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `VISUAL_REFERENCE_SET_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states its choice-set size as a typical range and no other numeric threshold at all — its demands are sourced pairing, viewed relevance, noted context, a plainly stated licensing caution and the red lines, not bars the atom can set. Declined, named: a maximum choice-set size of six as a hard cap (the skill says "typically three to six" — the six is a typical upper end, not a bar, so a larger distinct set does not fail); a minimum or exact resolution in pixels, megapixels or file size for "usable resolution" (the skill states none, so usability is a caller declaration, never re-measured — the atom fetches no image); a relevance, similarity or quality score for a candidate (checked by viewing is a declaration, never scored); a search-result rank, search-engine or source-domain whitelist or blacklist (the skill names no source as authoritative or forbidden); a licence-validity, licence-compatibility or fair-use determination (the atom checks only that a status is declared in its recognised vocabulary, a note is present and a credit is noted — whether a declared licence actually applies to an image or a use is a legal question it does not answer); an attribution-text format or completeness standard beyond a credit being noted; a freshness or publication-date window for results; a count of searches, query reformulations or sources searched beyond the declared terms-adjustment attestation; any judgment that a returned image is in fact the strongest match (only that a strongest match is declared called out first is checked). Quantities are computed and reported; the only bars on the computed rows are the minimum of the skill's own stated choice range and completeness and consistency over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** visual-reference search record: a verdict of `VISUAL_REFERENCE_SET_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares every source page verified, every image matching by viewing and every licence noted passes those checks even if the real search did none of it. It is a completeness and consistency audit of the search record the skill requires, **not a search engine, an image verifier, a rights-clearance service, or a guarantee that any image may be republished or used commercially**. Specifically: it searches nothing itself, fetches no image or source page, opens no link, runs no image recognition, and does not verify that any declared check (of source verification, viewed relevance, resolution, context or licensing) was ever actually carried out; it does not fetch or view any image at all, and licensing status is judged only as declared. It never judges whether a declared image actually shows the subject, whether a declared licence status is correct for that image, whether a source page says what the record claims, or whether a chosen image is the right reference for the brief — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: live web or image search by any engine (the skill's Method step 2 — excluded by name; the atom receives the search's declared record only); opening, fetching or verifying any image or source page (Method step 3's verification is a caller declaration, never performed here); identifying any person in a found photo (excluded absolutely — it is a red line, not a capability); generating, altering or editing any image (the skill is a finding skill, not a creation skill, and an altered image passed as original evidence is a red line); determining that any image is licensed, cleared or safe for any use (see the declined licence-validity threshold); no numeric thresholds beyond the minimum of the skill's stated choice range (see the declined list above); no live verification of any declared fact; no judgment of search *quality* — whether the search found the best references is the caller's work, checked only for declared presence and internal consistency.

**Buyer and use context.** Teams and agents working in Thinking & decisions who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Research brief visual reference sourcing (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was deployed census-style under a U-13 regulatory screen classified **(b) screen-NO — flag-with-controls (census class)**, exactly as SERVICE.md's U-13 section records it. SERVICE.md records the basis: this atom is image-licensing- and copyright-adjacent by keyword and by substance — its bound skill requires a licensing note on every set, a credit noted from the source, and a refusal to present any found image as licensed without an explicit grant — so the screen was applied strictly: what matters is not the keyword but what the artifact could be read as doing, and an artifact that pronounced an image "cleared" would read as a rights determination; a row claimed cleared without a declared `explicitly_licensed` status fails. The atom is flagged for the owner's per-unit ruling queue under U-13 on that adjacency. The named controls, exactly as SERVICE.md records them: (1) the atom audits a caller-declared search record for completeness and internal consistency only — source pairing, row identity and dedupe, declared relevance/quality/context attestations, and declared licence/attribution completeness; every output is a pass / fail / missing verdict on the record or a ratio recomputed from the caller's own declared rows; (2) it gives no legal advice, no licence determination, no rights clearance and no permission — it never says an image is licensed, may be republished, or may be used commercially; the computed bar runs the other way: a row claimed cleared *without* a declared `explicitly_licensed` status fails, and the licence-validity determination is named as a declined threshold; (3) it fetches and reproduces nothing — no image, thumbnail or source page is retrieved, stored or served, so the artifact itself carries no copyrighted image; (4) the record's images are whatever the caller declares — the atom takes no position on any image's ownership, licence or permitted use, and no output is addressed to one. SERVICE.md also records the residual risk plainly: a caller could paste the verdict into their own publishing work as if it cleared an image — that is their misreading, contradicted by the verdict's own scoping; the artifact clears nothing; and it records this atom as the same class as the quant-math-derivation-sanity-check precedent (declared-record audit, advice-shaped skill steps excluded as controls), not the genuinely-open personal-financial-snapshot class, because no personal position is handled and the skill carries no advice-shaped step that this atom performs — its one rights-shaped step (presenting an image as licensed) is a red line this atom checks *against*, never performs. Flagging never blocks authoring; no deploy happens on this atom without the owner's explicit per-unit ruling after the screen. The flag stays open for the Director's review: the screen-NO classification and its controls stand as recorded, and the census flag is not closed by this document.

### For integrators (Users)

You need: a gateway key with the `sourced_visual_reference_search` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/sourced_visual_reference_search.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_sourced_visual_reference_search.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/sourced-visual-reference-search` (REST) and `POST /mcp/sourced-visual-reference-search` (MCP, tool `sourced_visual_reference_search`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment ac6ddba696934ceb84596876507fc08c; RC soak to 2026-11-22). Key scope: `sourced_visual_reference_search`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment ac6ddba696934ceb84596876507fc08c) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** every recorded check name differs from the leaf name of the field or fields it reads — none matches verbatim. In `search_brief_and_query` the six attestation checks prefix the leaf field name with `visual_reference_`: `visual_reference_target_restated_in_searchable_terms` (input `brief.target_restated_in_searchable_terms`), `visual_reference_subject_stated` (input `brief.subject_stated`), `visual_reference_setting_stated` (input `brief.setting_stated`), `visual_reference_angle_or_style_stated` (input `brief.angle_or_style_stated`), `visual_reference_must_have_and_must_avoid_details_stated` (input `brief.must_have_and_must_avoid_details_stated`) and `visual_reference_search_terms_adjusted_when_first_pass_off_topic` (input `search.terms_adjusted_when_first_pass_off_topic`). In `source_provenance` the five computed checks rename the `results` rows they read: `visual_reference_results_list_declared` (the `results` list), `every_visual_reference_result_id_unique` (rows' `result_id`), `every_visual_reference_result_has_direct_image_and_source_page_links` (rows' `direct_image_url` and `source_page_url`), `every_visual_reference_result_source_page_verified` (rows' `source_page_verified`) and `every_visual_reference_direct_image_url_unique` (rows' `direct_image_url`). In `relevance_and_quality`: `visual_reference_relevance_checked_by_viewing_not_title_alone` (input `quality.relevance_checked_by_viewing_not_title_alone`), `every_visual_reference_result_matches_brief_by_viewing` (rows' `matches_brief_by_viewing`), `every_visual_reference_result_shows_subject_clearly` (rows' `shows_subject_clearly`), `every_visual_reference_result_usable_resolution_declared` (rows' `usable_resolution_declared`), `no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch` (rows' `misleading_cropping_present`, `watermark_present` and `caption_product_mismatch_present` together) and `visual_reference_weak_duplicate_or_misleading_results_filtered_out` (input `quality.weak_duplicate_or_misleading_filtered_out` — the check name inserts `results`). In `context_and_selection`: `every_visual_reference_result_depiction_noted` (rows' `depiction_noted`), `every_visual_reference_result_publisher_noted` (rows' `publisher_noted`), `every_visual_reference_result_caption_date_or_credit_context_noted` (rows' `caption_date_or_credit_noted` — the check name adds `context`), `visual_reference_strongest_match_called_out_first` (input `selection.strongest_match_called_out_first`), `visual_reference_similar_candidates_grouped` (input `selection.similar_candidates_grouped`), `visual_reference_choice_set_several_distinct_candidates_when_choice_involved` (computed from `selection.involves_choice` and the rows' `direct_image_url` values; no single field of that name) and `visual_reference_evidence_use_paired_with_facts_where_used_as_evidence` (input `selection.evidence_use_paired_with_facts_where_used_as_evidence`). In `licensing_and_attribution`: `visual_reference_licensing_caution_stated_plainly` (input `licensing.licensing_caution_stated_plainly`), `every_visual_reference_result_licence_note_present` (rows' `licence_note_present`), `every_visual_reference_result_licence_status_recognised` (rows' `licence_status`), `every_visual_reference_result_credit_noted` (rows' `credit_noted`) and `no_visual_reference_result_claimed_cleared_without_explicit_licence` (rows' `claimed_cleared_for_commercial_use` read against rows' `licence_status`). In `red_lines` all five recorded check names differ from their fields: `visual_reference_free_of_person_identification` (input `red_lines.person_identified_in_found_photo_present`), `visual_reference_free_of_found_image_presented_as_own_or_generated` (input `red_lines.found_image_presented_as_own_or_generated_present`), `visual_reference_free_of_found_image_presented_as_licensed_without_grant` (input `red_lines.found_image_presented_as_licensed_without_explicit_grant_present`), `visual_reference_free_of_unsourced_image_returned` (input `red_lines.unsourced_image_returned_present`) and `visual_reference_free_of_altered_image_passed_as_original` (input `red_lines.altered_image_passed_as_original_present`). Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`brief`, `search`, `quality`, `selection`, `licensing`, `red_lines`) or for a row object (`results[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the `results` list, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 34 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, `visual_reference_results_count` and the coverage ratios, but does not state a null rule for the row lists `duplicate_visual_reference_result_ids`, `duplicate_visual_reference_direct_image_urls`, `visual_reference_results_missing_source_pair` and `visual_reference_results_with_incomplete_licence_attribution`. The recorded sparse response returns all four as `null` when the `results` list is not declared (as the Output format section records); this document follows the recording.
6. **Section grouping vs input objects:** the recorded sections do not map one-to-one onto input objects, and the `results` rows are shared across four sections. `search_brief_and_query` merges two separate input objects, `brief` and `search`; `source_provenance` reads the `results` rows alone; `relevance_and_quality` merges the `quality` object with the `results` rows it reads; `context_and_selection` merges the `selection` object with the `results` rows it reads; `licensing_and_attribution` merges the `licensing` object with the `results` rows it reads; only `red_lines` maps one-to-one onto its input object (`red_lines` → `red_lines`). A related grouping fact: `selection.involves_choice` has no attestation check of its own — it gates the computed choice-set check. This document groups the Input reference and the Checks by the recorded section names.
7. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (6 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named the prose labels `Every result matches the brief by viewing` and `No result carries a quality defect` instead of exact check names (R1 ×2); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); the designed violations input was not a full manifest — it was missing the `brief`, `search`, `quality`, `selection`, `licensing` and `red_lines` key paths present in the full-pass manifest (R3 ×1); and the designed malformed input carried 2 type violations (`search_title` as a number and `results` as a string) instead of exactly one (R4 ×1). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.

## Worked examples

Provenance: recorded 2026-11-16T12:26:48.658501+00:00 against gateway v1.1.0, external verification battery Wave 15, source `verification/work/sourced-visual-reference-search/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T12:26:48.658501+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/sourced-visual-reference-search/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "search_brief_and_query",
      "check": "visual_reference_target_restated_in_searchable_terms",
      "status": "pass",
      "evidence": "brief: the target is restated in searchable terms before searching"
    },
    {
      "section": "search_brief_and_query",
      "check": "visual_reference_subject_stated",
      "status": "pass",
      "evidence": "brief: the subject the images must show is stated"
    },
    {
      "section": "search_brief_and_query",
      "check": "visual_reference_setting_stated",
      "status": "pass",
      "evidence": "brief: the setting the subject must appear in is stated"
    },
    {
      "section": "search_brief_and_query",
      "check": "visual_reference_angle_or_style_stated",
      "status": "pass",
      "evidence": "brief: the angle or style the images must show is stated"
    },
    {
      "section": "search_brief_and_query",
      "check": "visual_reference_must_have_and_must_avoid_details_stated",
      "status": "pass",
      "evidence": "brief: the must-have and must-avoid details are stated"
    },
    {
      "section": "search_brief_and_query",
      "check": "visual_reference_search_terms_adjusted_when_first_pass_off_topic",
      "status": "pass",
      "evidence": "search: the search terms were broadened or narrowed when the first pass returned off-topic, stocky or low-quality results, where that applied"
    },
    {
      "section": "source_provenance",
      "check": "visual_reference_results_list_declared",
      "status": "pass",
      "evidence": "the declared record names its visual reference results — the results list is present and names at least one result; an absent list is missing evidence and an empty list declares no reference set at all"
    },
    {
      "section": "source_provenance",
      "check": "every_visual_reference_result_id_unique",
      "status": "pass",
      "evidence": "visual reference results: no declared result_id is owned by more than one row"
    },
    {
      "section": "source_provenance",
      "check": "every_visual_reference_result_has_direct_image_and_source_page_links",
      "status": "pass",
      "evidence": "visual reference results: every declared result carries both a non-empty direct image link and a non-empty source page link together"
    },
    {
      "section": "source_provenance",
      "check": "every_visual_reference_result_source_page_verified",
      "status": "pass",
      "evidence": "visual reference results: every declared result's source page was opened or verified"
    },
    {
      "section": "source_provenance",
      "check": "every_visual_reference_direct_image_url_unique",
      "status": "pass",
      "evidence": "visual reference results: no declared direct image URL is owned by more than one row — duplicate results were filtered out"
    },
    {
      "section": "relevance_and_quality",
      "check": "visual_reference_relevance_checked_by_viewing_not_title_alone",
      "status": "pass",
      "evidence": "quality: relevance was checked by looking at each candidate, not by title alone"
    },
    {
      "section": "relevance_and_quality",
      "check": "every_visual_reference_result_matches_brief_by_viewing",
      "status": "pass",
      "evidence": "visual reference results: every declared result actually matches the description, checked by viewing"
    },
    {
      "section": "relevance_and_quality",
      "check": "every_visual_reference_result_shows_subject_clearly",
      "status": "pass",
      "evidence": "visual reference results: every declared result shows the subject clearly"
    },
    {
      "section": "relevance_and_quality",
      "check": "every_visual_reference_result_usable_resolution_declared",
      "status": "pass",
      "evidence": "visual reference results: every declared result is declared to be at a usable resolution"
    },
    {
      "section": "relevance_and_quality",
      "check": "no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch",
      "status": "pass",
      "evidence": "visual reference results: no declared result carries misleading cropping, a watermark, or a different product than its caption claims"
    },
    {
      "section": "relevance_and_quality",
      "check": "visual_reference_weak_duplicate_or_misleading_results_filtered_out",
      "status": "pass",
      "evidence": "quality: weak, duplicate or misleading results were filtered out before presenting"
    },
    {
      "section": "context_and_selection",
      "check": "every_visual_reference_result_depiction_noted",
      "status": "pass",
      "evidence": "visual reference results: every declared result notes what the image depicts, from its source page"
    },
    {
      "section": "context_and_selection",
      "check": "every_visual_reference_result_publisher_noted",
      "status": "pass",
      "evidence": "visual reference results: every declared result notes who published it, from its source page"
    },
    {
      "section": "context_and_selection",
      "check": "every_visual_reference_result_caption_date_or_credit_context_noted",
      "status": "pass",
      "evidence": "visual reference results: every declared result notes any caption, date or credit information present on its source page"
    },
    {
      "section": "context_and_selection",
      "check": "visual_reference_strongest_match_called_out_first",
      "status": "pass",
      "evidence": "selection: the strongest match is called out first, so choosing takes seconds"
    },
    {
      "section": "context_and_selection",
      "check": "visual_reference_similar_candidates_grouped",
      "status": "pass",
      "evidence": "selection: similar candidates are grouped together"
    },
    {
      "section": "context_and_selection",
      "check": "visual_reference_choice_set_several_distinct_candidates_when_choice_involved",
      "status": "pass",
      "evidence": "selection: when the request involves a choice, several distinct candidates are offered — at least three distinct declared direct image URLs, the minimum of the skill's stated three-to-six range; otherwise at least one distinct candidate"
    },
    {
      "section": "context_and_selection",
      "check": "visual_reference_evidence_use_paired_with_facts_where_used_as_evidence",
      "status": "pass",
      "evidence": "selection: where images are used as evidence, the set is paired with the underlying facts and handed off to deeper verification, never a photo standing alone as proof, where that applied"
    },
    {
      "section": "licensing_and_attribution",
      "check": "visual_reference_licensing_caution_stated_plainly",
      "status": "pass",
      "evidence": "licensing: the licensing caution is stated plainly — these are references found on the web, not images cleared for republication or commercial use, unless a licence on the source page explicitly says otherwise"
    },
    {
      "section": "licensing_and_attribution",
      "check": "every_visual_reference_result_licence_note_present",
      "status": "pass",
      "evidence": "visual reference results: every declared result carries a licence note"
    },
    {
      "section": "licensing_and_attribution",
      "check": "every_visual_reference_result_licence_status_recognised",
      "status": "pass",
      "evidence": "visual reference results: every declared result's licence status is one of explicitly_licensed, reference_only_no_licence_stated or licence_unknown"
    },
    {
      "section": "licensing_and_attribution",
      "check": "every_visual_reference_result_credit_noted",
      "status": "pass",
      "evidence": "visual reference results: every declared result notes any explicit licence or credit from its source"
    },
    {
      "section": "licensing_and_attribution",
      "check": "no_visual_reference_result_claimed_cleared_without_explicit_licence",
      "status": "pass",
      "evidence": "visual reference results: no declared result is claimed cleared for commercial use unless its declared licence status is explicitly_licensed"
    },
    {
      "section": "red_lines",
      "check": "visual_reference_free_of_person_identification",
      "status": "pass",
      "evidence": "red line: no person in a found photo is identified — no naming, guessing or biographical claims — in the record"
    },
    {
      "section": "red_lines",
      "check": "visual_reference_free_of_found_image_presented_as_own_or_generated",
      "status": "pass",
      "evidence": "red line: no found image is presented as the caller's own, as the owner's own, or as generated for them in the record"
    },
    {
      "section": "red_lines",
      "check": "visual_reference_free_of_found_image_presented_as_licensed_without_grant",
      "status": "pass",
      "evidence": "red line: no found image is presented as licensed for commercial use or republication without the source page granting that right explicitly in the record"
    },
    {
      "section": "red_lines",
      "check": "visual_reference_free_of_unsourced_image_returned",
      "status": "pass",
      "evidence": "red line: no image without its source page is returned in the record"
    },
    {
      "section": "red_lines",
      "check": "visual_reference_free_of_altered_image_passed_as_original",
      "status": "pass",
      "evidence": "red line: no altered found image is passed off as the original evidence in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "visual_reference_results_count": 3,
  "duplicate_visual_reference_result_ids": [],
  "duplicate_visual_reference_direct_image_urls": [],
  "visual_reference_results_missing_source_pair": [],
  "visual_reference_results_with_incomplete_licence_attribution": [],
  "sourced_pair_coverage_ratio": "1.000000",
  "licence_attribution_coverage_ratio": "1.000000",
  "visual_reference_match_ratio": "1.000000",
  "summary": "34 pass, 0 fail, 0 missing of 34 checks across six sections.",
  "stamp": "SOURCED VISUAL REFERENCE SEARCH\nsearch_title: Golden Retriever in autumn leaves\nVERDICT: VISUAL_REFERENCE_SET_SOUND\n  search_brief_and_query                       pass\n  source_provenance                            pass\n  relevance_and_quality                        pass\n  context_and_selection                        pass\n  licensing_and_attribution                    pass\n  red_lines                                    pass\n34 pass, 0 fail, 0 missing of 34 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T12:26:48.658501+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/sourced-visual-reference-search/evidence.json`.

Input:

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
      "matches_brief_by_viewing": false,
      "shows_subject_clearly": true,
      "usable_resolution_declared": true,
      "misleading_cropping_present": true,
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

Response (HTTP 200):

```json
{
  "service": "sourced-visual-reference-search",
  "atom_version": "0.1.0",
  "search_title": "Golden Retriever in autumn leaves",
  "verdict": "VISUAL_REFERENCE_SET_NOT_SOUND",
  "sections": {
    "search_brief_and_query": "pass",
    "source_provenance": "pass",
    "relevance_and_quality": "fail",
    "context_and_selection": "pass",
    "licensing_and_attribution": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "search_brief_and_query",
      "check": "visual_reference_target_restated_in_searchable_terms",
      "status": "pass",
      "evidence": "brief: the target is restated in searchable terms before searching"
    },
    {
      "section": "search_brief_and_query",
      "check": "visual_reference_subject_stated",
      "status": "pass",
      "evidence": "brief: the subject the images must show is stated"
    },
    {
      "section": "search_brief_and_query",
      "check": "visual_reference_setting_stated",
      "status": "pass",
      "evidence": "brief: the setting the subject must appear in is stated"
    },
    {
      "section": "search_brief_and_query",
      "check": "visual_reference_angle_or_style_stated",
      "status": "pass",
      "evidence": "brief: the angle or style the images must show is stated"
    },
    {
      "section": "search_brief_and_query",
      "check": "visual_reference_must_have_and_must_avoid_details_stated",
      "status": "pass",
      "evidence": "brief: the must-have and must-avoid details are stated"
    },
    {
      "section": "search_brief_and_query",
      "check": "visual_reference_search_terms_adjusted_when_first_pass_off_topic",
      "status": "pass",
      "evidence": "search: the search terms were broadened or narrowed when the first pass returned off-topic, stocky or low-quality results, where that applied"
    },
    {
      "section": "source_provenance",
      "check": "visual_reference_results_list_declared",
      "status": "pass",
      "evidence": "the declared record names its visual reference results — the results list is present and names at least one result; an absent list is missing evidence and an empty list declares no reference set at all"
    },
    {
      "section": "source_provenance",
      "check": "every_visual_reference_result_id_unique",
      "status": "pass",
      "evidence": "visual reference results: no declared result_id is owned by more than one row"
    },
    {
      "section": "source_provenance",
      "check": "every_visual_reference_result_has_direct_image_and_source_page_links",
      "status": "pass",
      "evidence": "visual reference results: every declared result carries both a non-empty direct image link and a non-empty source page link together"
    },
    {
      "section": "source_provenance",
      "check": "every_visual_reference_result_source_page_verified",
      "status": "pass",
      "evidence": "visual reference results: every declared result's source page was opened or verified"
    },
    {
      "section": "source_provenance",
      "check": "every_visual_reference_direct_image_url_unique",
      "status": "pass",
      "evidence": "visual reference results: no declared direct image URL is owned by more than one row — duplicate results were filtered out"
    },
    {
      "section": "relevance_and_quality",
      "check": "visual_reference_relevance_checked_by_viewing_not_title_alone",
      "status": "pass",
      "evidence": "quality: relevance was checked by looking at each candidate, not by title alone"
    },
    {
      "section": "relevance_and_quality",
      "check": "every_visual_reference_result_matches_brief_by_viewing",
      "status": "fail",
      "evidence": "visual reference results: every declared result actually matches the description, checked by viewing"
    },
    {
      "section": "relevance_and_quality",
      "check": "every_visual_reference_result_shows_subject_clearly",
      "status": "pass",
      "evidence": "visual reference results: every declared result shows the subject clearly"
    },
    {
      "section": "relevance_and_quality",
      "check": "every_visual_reference_result_usable_resolution_declared",
      "status": "pass",
      "evidence": "visual reference results: every declared result is declared to be at a usable resolution"
    },
    {
      "section": "relevance_and_quality",
      "check": "no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch",
      "status": "fail",
      "evidence": "visual reference results: no declared result carries misleading cropping, a watermark, or a different product than its caption claims"
    },
    {
      "section": "relevance_and_quality",
      "check": "visual_reference_weak_duplicate_or_misleading_results_filtered_out",
      "status": "pass",
      "evidence": "quality: weak, duplicate or misleading results were filtered out before presenting"
    },
    {
      "section": "context_and_selection",
      "check": "every_visual_reference_result_depiction_noted",
      "status": "pass",
      "evidence": "visual reference results: every declared result notes what the image depicts, from its source page"
    },
    {
      "section": "context_and_selection",
      "check": "every_visual_reference_result_publisher_noted",
      "status": "pass",
      "evidence": "visual reference results: every declared result notes who published it, from its source page"
    },
    {
      "section": "context_and_selection",
      "check": "every_visual_reference_result_caption_date_or_credit_context_noted",
      "status": "pass",
      "evidence": "visual reference results: every declared result notes any caption, date or credit information present on its source page"
    },
    {
      "section": "context_and_selection",
      "check": "visual_reference_strongest_match_called_out_first",
      "status": "pass",
      "evidence": "selection: the strongest match is called out first, so choosing takes seconds"
    },
    {
      "section": "context_and_selection",
      "check": "visual_reference_similar_candidates_grouped",
      "status": "pass",
      "evidence": "selection: similar candidates are grouped together"
    },
    {
      "section": "context_and_selection",
      "check": "visual_reference_choice_set_several_distinct_candidates_when_choice_involved",
      "status": "pass",
      "evidence": "selection: when the request involves a choice, several distinct candidates are offered — at least three distinct declared direct image URLs, the minimum of the skill's stated three-to-six range; otherwise at least one distinct candidate"
    },
    {
      "section": "context_and_selection",
      "check": "visual_reference_evidence_use_paired_with_facts_where_used_as_evidence",
      "status": "pass",
      "evidence": "selection: where images are used as evidence, the set is paired with the underlying facts and handed off to deeper verification, never a photo standing alone as proof, where that applied"
    },
    {
      "section": "licensing_and_attribution",
      "check": "visual_reference_licensing_caution_stated_plainly",
      "status": "pass",
      "evidence": "licensing: the licensing caution is stated plainly — these are references found on the web, not images cleared for republication or commercial use, unless a licence on the source page explicitly says otherwise"
    },
    {
      "section": "licensing_and_attribution",
      "check": "every_visual_reference_result_licence_note_present",
      "status": "pass",
      "evidence": "visual reference results: every declared result carries a licence note"
    },
    {
      "section": "licensing_and_attribution",
      "check": "every_visual_reference_result_licence_status_recognised",
      "status": "pass",
      "evidence": "visual reference results: every declared result's licence status is one of explicitly_licensed, reference_only_no_licence_stated or licence_unknown"
    },
    {
      "section": "licensing_and_attribution",
      "check": "every_visual_reference_result_credit_noted",
      "status": "pass",
      "evidence": "visual reference results: every declared result notes any explicit licence or credit from its source"
    },
    {
      "section": "licensing_and_attribution",
      "check": "no_visual_reference_result_claimed_cleared_without_explicit_licence",
      "status": "pass",
      "evidence": "visual reference results: no declared result is claimed cleared for commercial use unless its declared licence status is explicitly_licensed"
    },
    {
      "section": "red_lines",
      "check": "visual_reference_free_of_person_identification",
      "status": "pass",
      "evidence": "red line: no person in a found photo is identified — no naming, guessing or biographical claims — in the record"
    },
    {
      "section": "red_lines",
      "check": "visual_reference_free_of_found_image_presented_as_own_or_generated",
      "status": "pass",
      "evidence": "red line: no found image is presented as the caller's own, as the owner's own, or as generated for them in the record"
    },
    {
      "section": "red_lines",
      "check": "visual_reference_free_of_found_image_presented_as_licensed_without_grant",
      "status": "pass",
      "evidence": "red line: no found image is presented as licensed for commercial use or republication without the source page granting that right explicitly in the record"
    },
    {
      "section": "red_lines",
      "check": "visual_reference_free_of_unsourced_image_returned",
      "status": "pass",
      "evidence": "red line: no image without its source page is returned in the record"
    },
    {
      "section": "red_lines",
      "check": "visual_reference_free_of_altered_image_passed_as_original",
      "status": "pass",
      "evidence": "red line: no altered found image is passed off as the original evidence in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "visual_reference_results_count": 3,
  "duplicate_visual_reference_result_ids": [],
  "duplicate_visual_reference_direct_image_urls": [],
  "visual_reference_results_missing_source_pair": [],
  "visual_reference_results_with_incomplete_licence_attribution": [],
  "sourced_pair_coverage_ratio": "1.000000",
  "licence_attribution_coverage_ratio": "1.000000",
  "visual_reference_match_ratio": "0.666667",
  "summary": "32 pass, 2 fail, 0 missing of 34 checks across six sections.",
  "stamp": "SOURCED VISUAL REFERENCE SEARCH\nsearch_title: Golden Retriever in autumn leaves\nVERDICT: VISUAL_REFERENCE_SET_NOT_SOUND\n  search_brief_and_query                       pass\n  source_provenance                            pass\n  relevance_and_quality                        fail\n  context_and_selection                        pass\n  licensing_and_attribution                    pass\n  red_lines                                    pass\n32 pass, 2 fail, 0 missing of 34 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T12:26:48.658501+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/sourced-visual-reference-search/evidence.json`.

Input:

```json
{
  "search_title": "Golden Retriever in autumn leaves",
  "brief": "should_be_an_object",
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

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "brief",
  "detail": "brief must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — this atom was deployed census-style under a U-13 screen classified (b) screen-NO — flag-with-controls (census class), with the four named controls recorded in SERVICE.md's U-13 section; the flag stays open for the Director's review (see Role views, For regulators) |
| Checks named | 34 documented / 34 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`visual_reference_results_count`, the four row lists, and the three coverage ratios) |
| Input reference typed | Yes — 44 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/sourced-visual-reference-search/evidence.json` |
