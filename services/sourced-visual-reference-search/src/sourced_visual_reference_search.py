#!/usr/bin/env python3
"""Sourced visual reference search — deterministic core.

Built from the bound skill `image-search`: "Find images from a
plain description and bring them back usable: linked, sourced,
and framed honestly about what they prove and what rights they
carry." Its Method is this atom's method: restate the target in
searchable terms; record the direct image link and its source
page together and discard any image whose source cannot be
identified; check relevance and quality by looking, not by title
alone; note context from the source page; return several varied
candidates when choosing; add a licensing note to every set; and,
where images are used as evidence, pair them with the underlying
facts rather than letting a photo stand alone as proof. Its
Quality gates and Red lines are this atom's checks and red lines.

This atom performs NO live search, fetches NO image and
identifies NO person. The caller submits a declared
visual-reference search record (a dict, or JSON on the CLI):
the declared brief, the declared search adjustment, the declared
result rows — each with its direct image URL, its source page
URL, its source-verification, relevance, quality, context and
licence/attribution declarations — the declared quality,
selection and licensing records, and the red lines refused. The
atom audits that declared record only.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- source pairing: every declared row declares a non-empty
  direct image URL and a non-empty source page URL together
  (the skill: "Never return an image without its source page");
- identity and dedupe: no declared result_id and no declared
  direct image URL may be owned by more than one row (weak,
  duplicate or misleading results were filtered out);
- relevance and quality: every declared row is declared to
  match the brief by viewing, to show the subject clearly and
  to have usable resolution, and no row declares misleading
  cropping, a watermark or a caption/product mismatch;
- context: every declared row declares its depiction, its
  publisher and its caption/date/credit context noted;
- choice set: where the declared record says a choice is
  involved, the set carries at least three distinct declared
  direct image URLs (the skill: "typically three to six varied
  options" — the minimum of that stated range is the bar; the
  stated maximum is declined as a hard cap, see SERVICE.md);
- licensing and attribution: every declared row declares a
  licence note, a recognised licence status (one of
  `explicitly_licensed`,
  `reference_only_no_licence_stated` or `licence_unknown`) and
  a credit noted, and no row is claimed cleared for commercial
  use unless its declared licence status is
  `explicitly_licensed` (the skill: never present a found image
  as licensed unless the source page grants that right
  explicitly).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no resolution (pixel) threshold, no relevance
score, no image-quality score, no maximum choice-set size as a
hard cap and no licence-validity test — so no such check is
invented; those quantities are caller attestations at most,
and quantities here are computed and reported, with
completeness and consistency over the caller's own declared
rows as the only bars, exactly as stated above.

Verdict:
- any fail             -> VISUAL_REFERENCE_SET_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> VISUAL_REFERENCE_SET_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "search_brief_and_query",
    "source_provenance",
    "relevance_and_quality",
    "context_and_selection",
    "licensing_and_attribution",
    "red_lines",
)

LICENCE_STATUSES = (
    "explicitly_licensed",
    "reference_only_no_licence_stated",
    "licence_unknown",
)

MANIFEST_SPEC = {
    "search_title": "string",
    "brief": {
        "target_restated_in_searchable_terms": "boolean",
        "subject_stated": "boolean",
        "setting_stated": "boolean",
        "angle_or_style_stated": "boolean",
        "must_have_and_must_avoid_details_stated": "boolean",
    },
    "search": {
        "terms_adjusted_when_first_pass_off_topic": "boolean",
    },
    "results": [{
        "result_id": "string",
        "direct_image_url": "string",
        "source_page_url": "string",
        "source_page_verified": "boolean",
        "matches_brief_by_viewing": "boolean",
        "shows_subject_clearly": "boolean",
        "usable_resolution_declared": "boolean",
        "misleading_cropping_present": "boolean",
        "watermark_present": "boolean",
        "caption_product_mismatch_present": "boolean",
        "depiction_noted": "boolean",
        "publisher_noted": "boolean",
        "caption_date_or_credit_noted": "boolean",
        "licence_status": "string",
        "licence_note_present": "boolean",
        "credit_noted": "boolean",
        "claimed_cleared_for_commercial_use": "boolean",
    }],
    "quality": {
        "relevance_checked_by_viewing_not_title_alone": "boolean",
        "weak_duplicate_or_misleading_filtered_out": "boolean",
    },
    "selection": {
        "involves_choice": "boolean",
        "strongest_match_called_out_first": "boolean",
        "similar_candidates_grouped": "boolean",
        "evidence_use_paired_with_facts_where_used_as_evidence": "boolean",
    },
    "licensing": {
        "licensing_caution_stated_plainly": "boolean",
    },
    "red_lines": {
        "person_identified_in_found_photo_present": "boolean",
        "found_image_presented_as_own_or_generated_present": "boolean",
        "found_image_presented_as_licensed_without_explicit_grant_present": "boolean",
        "unsourced_image_returned_present": "boolean",
        "altered_image_passed_as_original_present": "boolean",
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


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("result_id"), str):
        return entry["result_id"]
    return "unnamed"


def _all_have(rows, *fields):
    return all(all(_has(c, f) for f in fields) for c in rows)


def _has_source_pair(entry):
    return (_nonempty_str(entry.get("direct_image_url"))
            and _nonempty_str(entry.get("source_page_url")))


def _licence_attribution_complete(entry):
    return (isinstance(entry, dict)
            and entry.get("licence_note_present") is True
            and entry.get("licence_status") in LICENCE_STATUSES
            and entry.get("credit_noted") is True)


def evaluate(manifest):
    """Return the verdict dict for a visual-reference search manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    rows_raw, has_rows = _get(manifest, "results")
    rows_is_list = has_rows and isinstance(rows_raw, list)
    rows_count = len(rows_raw) if rows_is_list else None
    rows = rows_raw if rows_is_list else []

    duplicate_result_ids = None
    duplicate_direct_image_urls = None
    if rows_is_list:
        seen_ids = []
        duplicate_result_ids = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("result_id"), str):
                nm = c["result_id"]
                if nm in seen_ids and nm not in duplicate_result_ids:
                    duplicate_result_ids.append(nm)
                seen_ids.append(nm)
        seen_urls = []
        duplicate_direct_image_urls = []
        for c in rows:
            if isinstance(c, dict) and _nonempty_str(c.get("direct_image_url")):
                url = c["direct_image_url"]
                if url in seen_urls and url not in duplicate_direct_image_urls:
                    duplicate_direct_image_urls.append(url)
                seen_urls.append(url)
    results_missing_source_pair = (
        [_row_name(c) for c in rows
         if not (isinstance(c, dict) and _has_source_pair(c))]
        if rows_is_list else None
    )
    results_with_incomplete_licence_attribution = (
        [_row_name(c) for c in rows
         if not _licence_attribution_complete(c)]
        if rows_is_list else None
    )
    sourced_pair_coverage_ratio = (
        sum(1 for c in rows if isinstance(c, dict) and _has_source_pair(c))
        / rows_count
        if rows_is_list and rows_count > 0 else None
    )
    licence_attribution_coverage_ratio = (
        sum(1 for c in rows if _licence_attribution_complete(c)) / rows_count
        if rows_is_list and rows_count > 0 else None
    )
    visual_reference_match_ratio = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("matches_brief_by_viewing") is True) / rows_count
        if rows_is_list and rows_count > 0 else None
    )

    # ---- Section 1: search_brief_and_query (skill Method 1-2 —
    #      restate the target in searchable terms: subject,
    #      setting, angle, style, must-have and must-avoid
    #      details; broaden or narrow terms if the first pass
    #      returns off-topic results) ----
    _bool_check(results, "search_brief_and_query",
                "visual_reference_target_restated_in_searchable_terms",
                manifest,
                ("brief", "target_restated_in_searchable_terms"),
                "brief: the target is restated in searchable terms "
                "before searching")
    _bool_check(results, "search_brief_and_query",
                "visual_reference_subject_stated", manifest,
                ("brief", "subject_stated"),
                "brief: the subject the images must show is stated")
    _bool_check(results, "search_brief_and_query",
                "visual_reference_setting_stated", manifest,
                ("brief", "setting_stated"),
                "brief: the setting the subject must appear in is "
                "stated")
    _bool_check(results, "search_brief_and_query",
                "visual_reference_angle_or_style_stated", manifest,
                ("brief", "angle_or_style_stated"),
                "brief: the angle or style the images must show is "
                "stated")
    _bool_check(results, "search_brief_and_query",
                "visual_reference_must_have_and_must_avoid_details_stated",
                manifest,
                ("brief", "must_have_and_must_avoid_details_stated"),
                "brief: the must-have and must-avoid details are "
                "stated")
    _bool_check(results, "search_brief_and_query",
                "visual_reference_search_terms_adjusted_when_first_pass_off_topic",
                manifest,
                ("search", "terms_adjusted_when_first_pass_off_topic"),
                "search: the search terms were broadened or narrowed "
                "when the first pass returned off-topic, stocky or "
                "low-quality results, where that applied")

    # ---- Section 2: source_provenance (skill Method 3 + Quality
    #      gates — record the direct image link and the page it
    #      came from together; discard any image whose source
    #      cannot be identified; never return an image without
    #      its source page) ----
    _check(results, "source_provenance",
           "visual_reference_results_list_declared", rows_raw, rows_is_list,
           rows_is_list and rows_count > 0,
           "the declared record names its visual reference results "
           "— the results list is present and names at least one "
           "result; an absent list is missing evidence and an empty "
           "list declares no reference set at all")
    id_present = rows_is_list and _all_have(rows, "result_id")
    _check(results, "source_provenance",
           "every_visual_reference_result_id_unique", rows_raw, id_present,
           rows_is_list and duplicate_result_ids is not None
           and len(duplicate_result_ids) == 0,
           "visual reference results: no declared result_id is owned "
           "by more than one row")
    pair_present = rows_is_list and _all_have(
        rows, "direct_image_url", "source_page_url")
    _check(results, "source_provenance",
           "every_visual_reference_result_has_direct_image_and_source_page_links",
           rows_raw, pair_present,
           rows_is_list
           and all(isinstance(c, dict) and _has_source_pair(c) for c in rows),
           "visual reference results: every declared result carries "
           "both a non-empty direct image link and a non-empty "
           "source page link together")
    verified_present = rows_is_list and _all_have(rows, "source_page_verified")
    _check(results, "source_provenance",
           "every_visual_reference_result_source_page_verified", rows_raw,
           verified_present,
           rows_is_list
           and all(isinstance(c, dict)
                   and c.get("source_page_verified") is True for c in rows),
           "visual reference results: every declared result's source "
           "page was opened or verified")
    url_present = rows_is_list and _all_have(rows, "direct_image_url")
    _check(results, "source_provenance",
           "every_visual_reference_direct_image_url_unique", rows_raw,
           url_present,
           rows_is_list and duplicate_direct_image_urls is not None
           and len(duplicate_direct_image_urls) == 0
           and all(isinstance(c, dict)
                   and _nonempty_str(c.get("direct_image_url"))
                   for c in rows),
           "visual reference results: no declared direct image URL "
           "is owned by more than one row — duplicate results were "
           "filtered out")

    # ---- Section 3: relevance_and_quality (skill Method 4 +
    #      Quality gates — each candidate actually matches the
    #      description, checked by looking, not by title alone;
    #      shows the subject clearly, at a usable resolution,
    #      without misleading cropping, watermarks, or a
    #      different product than the caption claims) ----
    _bool_check(results, "relevance_and_quality",
                "visual_reference_relevance_checked_by_viewing_not_title_alone",
                manifest,
                ("quality", "relevance_checked_by_viewing_not_title_alone"),
                "quality: relevance was checked by looking at each "
                "candidate, not by title alone")
    matches_present = rows_is_list and _all_have(rows, "matches_brief_by_viewing")
    _check(results, "relevance_and_quality",
           "every_visual_reference_result_matches_brief_by_viewing", rows_raw,
           matches_present,
           rows_is_list
           and all(isinstance(c, dict)
                   and c.get("matches_brief_by_viewing") is True
                   for c in rows),
           "visual reference results: every declared result actually "
           "matches the description, checked by viewing")
    clear_present = rows_is_list and _all_have(rows, "shows_subject_clearly")
    _check(results, "relevance_and_quality",
           "every_visual_reference_result_shows_subject_clearly", rows_raw,
           clear_present,
           rows_is_list
           and all(isinstance(c, dict)
                   and c.get("shows_subject_clearly") is True
                   for c in rows),
           "visual reference results: every declared result shows "
           "the subject clearly")
    resolution_present = rows_is_list and _all_have(
        rows, "usable_resolution_declared")
    _check(results, "relevance_and_quality",
           "every_visual_reference_result_usable_resolution_declared",
           rows_raw, resolution_present,
           rows_is_list
           and all(isinstance(c, dict)
                   and c.get("usable_resolution_declared") is True
                   for c in rows),
           "visual reference results: every declared result is "
           "declared to be at a usable resolution")
    defects_present = rows_is_list and _all_have(
        rows, "misleading_cropping_present", "watermark_present",
        "caption_product_mismatch_present")
    _check(results, "relevance_and_quality",
           "no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch",
           rows_raw, defects_present,
           rows_is_list
           and all(isinstance(c, dict)
                   and c.get("misleading_cropping_present") is False
                   and c.get("watermark_present") is False
                   and c.get("caption_product_mismatch_present") is False
                   for c in rows),
           "visual reference results: no declared result carries "
           "misleading cropping, a watermark, or a different "
           "product than its caption claims")
    _bool_check(results, "relevance_and_quality",
                "visual_reference_weak_duplicate_or_misleading_results_filtered_out",
                manifest,
                ("quality", "weak_duplicate_or_misleading_filtered_out"),
                "quality: weak, duplicate or misleading results were "
                "filtered out before presenting")

    # ---- Section 4: context_and_selection (skill Methods 5-6, 8
    #      — note context from the source page: what the image
    #      depicts, who published it, and any caption, date or
    #      credit information; return several varied candidates
    #      when choosing, strongest match first, similar
    #      candidates grouped; evidence use paired with facts) ----
    depiction_present = rows_is_list and _all_have(rows, "depiction_noted")
    _check(results, "context_and_selection",
           "every_visual_reference_result_depiction_noted", rows_raw,
           depiction_present,
           rows_is_list
           and all(isinstance(c, dict)
                   and c.get("depiction_noted") is True for c in rows),
           "visual reference results: every declared result notes "
           "what the image depicts, from its source page")
    publisher_present = rows_is_list and _all_have(rows, "publisher_noted")
    _check(results, "context_and_selection",
           "every_visual_reference_result_publisher_noted", rows_raw,
           publisher_present,
           rows_is_list
           and all(isinstance(c, dict)
                   and c.get("publisher_noted") is True for c in rows),
           "visual reference results: every declared result notes "
           "who published it, from its source page")
    context_present = rows_is_list and _all_have(
        rows, "caption_date_or_credit_noted")
    _check(results, "context_and_selection",
           "every_visual_reference_result_caption_date_or_credit_context_noted",
           rows_raw, context_present,
           rows_is_list
           and all(isinstance(c, dict)
                   and c.get("caption_date_or_credit_noted") is True
                   for c in rows),
           "visual reference results: every declared result notes "
           "any caption, date or credit information present on its "
           "source page")
    _bool_check(results, "context_and_selection",
                "visual_reference_strongest_match_called_out_first",
                manifest,
                ("selection", "strongest_match_called_out_first"),
                "selection: the strongest match is called out first, "
                "so choosing takes seconds")
    _bool_check(results, "context_and_selection",
                "visual_reference_similar_candidates_grouped", manifest,
                ("selection", "similar_candidates_grouped"),
                "selection: similar candidates are grouped together")
    involves_choice, has_involves_choice = _get(
        manifest, "selection", "involves_choice")
    distinct_urls = []
    if rows_is_list:
        for c in rows:
            if isinstance(c, dict) and _nonempty_str(c.get("direct_image_url")):
                if c["direct_image_url"] not in distinct_urls:
                    distinct_urls.append(c["direct_image_url"])
    choice_present = rows_is_list and has_involves_choice and url_present
    choice_ok = (
        rows_is_list and has_involves_choice
        and (len(distinct_urls) >= 3 if involves_choice is True
             else len(distinct_urls) >= 1)
    )
    _check(results, "context_and_selection",
           "visual_reference_choice_set_several_distinct_candidates_when_choice_involved",
           rows_raw, choice_present, choice_ok,
           "selection: when the request involves a choice, several "
           "distinct candidates are offered — at least three "
           "distinct declared direct image URLs, the minimum of "
           "the skill's stated three-to-six range; otherwise at "
           "least one distinct candidate")
    _bool_check(results, "context_and_selection",
                "visual_reference_evidence_use_paired_with_facts_where_used_as_evidence",
                manifest,
                ("selection",
                 "evidence_use_paired_with_facts_where_used_as_evidence"),
                "selection: where images are used as evidence, the "
                "set is paired with the underlying facts and handed "
                "off to deeper verification, never a photo standing "
                "alone as proof, where that applied")

    # ---- Section 5: licensing_and_attribution (skill Method 7 +
    #      Quality gates — add a licensing note to every set;
    #      licensing caution stated plainly, with any explicit
    #      licence or credit noted; no image described as owned,
    #      original or cleared for commercial use without
    #      evidence) ----
    _bool_check(results, "licensing_and_attribution",
                "visual_reference_licensing_caution_stated_plainly",
                manifest,
                ("licensing", "licensing_caution_stated_plainly"),
                "licensing: the licensing caution is stated plainly "
                "— these are references found on the web, not images "
                "cleared for republication or commercial use, unless "
                "a licence on the source page explicitly says "
                "otherwise")
    note_present = rows_is_list and _all_have(rows, "licence_note_present")
    _check(results, "licensing_and_attribution",
           "every_visual_reference_result_licence_note_present", rows_raw,
           note_present,
           rows_is_list
           and all(isinstance(c, dict)
                   and c.get("licence_note_present") is True for c in rows),
           "visual reference results: every declared result carries "
           "a licence note")
    status_present = rows_is_list and _all_have(rows, "licence_status")
    _check(results, "licensing_and_attribution",
           "every_visual_reference_result_licence_status_recognised",
           rows_raw, status_present,
           rows_is_list
           and all(isinstance(c, dict)
                   and c.get("licence_status") in LICENCE_STATUSES
                   for c in rows),
           "visual reference results: every declared result's "
           "licence status is one of explicitly_licensed, "
           "reference_only_no_licence_stated or licence_unknown")
    credit_present = rows_is_list and _all_have(rows, "credit_noted")
    _check(results, "licensing_and_attribution",
           "every_visual_reference_result_credit_noted", rows_raw,
           credit_present,
           rows_is_list
           and all(isinstance(c, dict)
                   and c.get("credit_noted") is True for c in rows),
           "visual reference results: every declared result notes "
           "any explicit licence or credit from its source")
    claimed_present = rows_is_list and _all_have(
        rows, "claimed_cleared_for_commercial_use", "licence_status")
    _check(results, "licensing_and_attribution",
           "no_visual_reference_result_claimed_cleared_without_explicit_licence",
           rows_raw, claimed_present,
           rows_is_list
           and all(not (isinstance(c, dict)
                        and c.get("claimed_cleared_for_commercial_use") is True
                        and c.get("licence_status") != "explicitly_licensed")
                   for c in rows),
           "visual reference results: no declared result is claimed "
           "cleared for commercial use unless its declared licence "
           "status is explicitly_licensed")

    # ---- Section 6: red_lines (skill "Red lines" — never
    #      identify a person in a found photo; never present a
    #      found image as your own or as generated; never present
    #      a found image as licensed without an explicit grant;
    #      never return an image without its source page; never
    #      alter a found image and pass it off as the original
    #      evidence) ----
    _false_check(results, "red_lines",
                 "visual_reference_free_of_person_identification", manifest,
                 ("red_lines", "person_identified_in_found_photo_present"),
                 "red line: no person in a found photo is identified "
                 "— no naming, guessing or biographical claims — in "
                 "the record")
    _false_check(results, "red_lines",
                 "visual_reference_free_of_found_image_presented_as_own_or_generated",
                 manifest,
                 ("red_lines",
                  "found_image_presented_as_own_or_generated_present"),
                 "red line: no found image is presented as the "
                 "caller's own, as the owner's own, or as generated "
                 "for them in the record")
    _false_check(results, "red_lines",
                 "visual_reference_free_of_found_image_presented_as_licensed_without_grant",
                 manifest,
                 ("red_lines",
                  "found_image_presented_as_licensed_without_explicit_grant_present"),
                 "red line: no found image is presented as licensed "
                 "for commercial use or republication without the "
                 "source page granting that right explicitly in the "
                 "record")
    _false_check(results, "red_lines",
                 "visual_reference_free_of_unsourced_image_returned", manifest,
                 ("red_lines", "unsourced_image_returned_present"),
                 "red line: no image without its source page is "
                 "returned in the record")
    _false_check(results, "red_lines",
                 "visual_reference_free_of_altered_image_passed_as_original",
                 manifest,
                 ("red_lines", "altered_image_passed_as_original_present"),
                 "red line: no altered found image is passed off as "
                 "the original evidence in the record")

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
        verdict = "VISUAL_REFERENCE_SET_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "VISUAL_REFERENCE_SET_SOUND"

    computed_names = (
        "visual_reference_results_list_declared",
        "every_visual_reference_result_id_unique",
        "every_visual_reference_result_has_direct_image_and_source_page_links",
        "every_visual_reference_result_source_page_verified",
        "every_visual_reference_direct_image_url_unique",
        "every_visual_reference_result_matches_brief_by_viewing",
        "every_visual_reference_result_shows_subject_clearly",
        "every_visual_reference_result_usable_resolution_declared",
        "no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch",
        "every_visual_reference_result_depiction_noted",
        "every_visual_reference_result_publisher_noted",
        "every_visual_reference_result_caption_date_or_credit_context_noted",
        "visual_reference_choice_set_several_distinct_candidates_when_choice_involved",
        "every_visual_reference_result_licence_note_present",
        "every_visual_reference_result_licence_status_recognised",
        "every_visual_reference_result_credit_noted",
        "no_visual_reference_result_claimed_cleared_without_explicit_licence",
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
        "service": "sourced-visual-reference-search",
        "atom_version": "0.1.0",
        "search_title": manifest.get("search_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "visual_reference_results_count": rows_count,
        "duplicate_visual_reference_result_ids": duplicate_result_ids,
        "duplicate_visual_reference_direct_image_urls":
            duplicate_direct_image_urls,
        "visual_reference_results_missing_source_pair":
            results_missing_source_pair,
        "visual_reference_results_with_incomplete_licence_attribution":
            results_with_incomplete_licence_attribution,
        "sourced_pair_coverage_ratio": _fmt6(sourced_pair_coverage_ratio),
        "licence_attribution_coverage_ratio":
            _fmt6(licence_attribution_coverage_ratio),
        "visual_reference_match_ratio": _fmt6(visual_reference_match_ratio),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "SOURCED VISUAL REFERENCE SEARCH",
        f"search_title: {verdict.get('search_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: sourced_visual_reference_search.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "VISUAL_REFERENCE_SET_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
