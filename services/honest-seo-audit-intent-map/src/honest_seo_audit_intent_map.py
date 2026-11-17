#!/usr/bin/env python3
"""Honest SEO audit intent map — deterministic core.

Built from the bound skill `seo`: "Earn search traffic honestly
— technical SEO, content strategy, structured data, measurement,
white-hat only."

This atom is an AUDIT of a declared SEO record and intent map:
it validates the record a caller declares against the skill's
sections — the technical foundation, the intent map and on-page
craft, structured data and entity clarity, earned authority and
measurement, and the white-hat red lines. It does not crawl a
site, read live search data, measure speed, or verify that a
declared control actually works — it checks that the record the
skill requires is present and internally complete and consistent
on the declared evidence.

The caller submits an SEO manifest (a dict, or JSON on the CLI).
Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- pages: the declared `pages` list must be non-empty, and every
  declared page row must own a single intent, declare an intent
  type from the skill's own set (informational / commercial /
  transactional), and fully answer its question;
- intent ownership: no declared intent string may be owned by
  more than one page row (the skill: "one intent per page";
  quality gate: "each key page owns one intent").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states no numeric threshold — no Core Web Vitals
millisecond or score cutoff, no traffic, ranking, click-through
or conversion target, no word count, no link count, no coverage
percentage — so no numeric threshold check is invented; those
quantities are caller attestations at most, and quantities here
are computed and reported, with completeness (every declared
page) as the only bar, exactly as stated above.

Verdict:
- any fail             -> HONEST_SEO_MAP_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> HONEST_SEO_MAP_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "technical_foundation",
    "intent_map_and_on_page_craft",
    "structured_data_and_entity_clarity",
    "earned_authority_and_measurement",
    "white_hat_red_lines",
)

INTENT_TYPES = ("informational", "commercial", "transactional")

MANIFEST_SPEC = {
    "site": "string",
    "technical": {
        "crawlable_robots_and_sitemap": "boolean",
        "core_web_vitals_targets_addressed": "boolean",
        "mobile_first": "boolean",
        "https_enabled": "boolean",
        "canonical_tags_correct": "boolean",
        "accidental_noindex_or_blocked_paths_present": "boolean",
        "clean_url_structure": "boolean",
        "not_found_404s_handled": "boolean",
    },
    "intent": {
        "audience_questions_mapped": "boolean",
        "intent_type_assigned_per_question": "boolean",
        "prioritization_by_relevance_and_feasibility": "boolean",
    },
    "on_page": {
        "titles_and_descriptions_specific_and_honest": "boolean",
        "heading_hierarchy_present": "boolean",
        "internal_links_with_descriptive_anchors": "boolean",
        "clickbait_mismatch_present": "boolean",
        "word_count_padding_present": "boolean",
    },
    "pages": [{
        "name": "string",
        "intent": "string",
        "intent_type": "string",
        "has_single_intent": "boolean",
        "fully_answers_question": "boolean",
    }],
    "structured_data": {
        "schema_org_applied_as_applicable": "boolean",
        "rich_results_validated": "boolean",
    },
    "entity": {
        "brand_name_contact_consistent": "boolean",
        "real_author_identity_for_professional_content": "boolean",
        "credentials_carried_where_appropriate": "boolean",
        "public_content_sanitization_applied": "boolean",
    },
    "authority": {
        "useful_assets_created_to_attract_links": "boolean",
        "relevant_human_outreach_only": "boolean",
    },
    "measurement": {
        "search_console_and_analytics_wired": "boolean",
        "search_console_baseline_captured": "boolean",
        "impressions_clicks_conversions_tracked": "boolean",
        "queries_gained_lost_tracked": "boolean",
        "monthly_iteration_cadence": "boolean",
        "decaying_pages_refreshed_on_schedule": "boolean",
    },
    "ai_era": {
        "structure_and_canonical_answers_designed_for_extraction": "boolean",
    },
    "red_lines": {
        "cloaking_present": "boolean",
        "pbn_present": "boolean",
        "bought_links_present": "boolean",
        "link_schemes_present": "boolean",
        "keyword_spam_present": "boolean",
        "misleading_metadata_present": "boolean",
        "fake_urgency_present": "boolean",
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


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for an SEO audit / intent-map manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    pages, has_pages = _get(manifest, "pages")
    pages_is_list = has_pages and isinstance(pages, list)
    pages_count = len(pages) if pages_is_list else None
    rows = pages if pages_is_list else []

    pages_without_single_intent = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "has_single_intent" in c
         and c.get("has_single_intent") is not True]
        if pages_is_list else None
    )
    pages_with_invalid_intent_type = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "intent_type" in c
         and c.get("intent_type") not in INTENT_TYPES]
        if pages_is_list else None
    )
    pages_not_fully_answering = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "fully_answers_question" in c
         and c.get("fully_answers_question") is not True]
        if pages_is_list else None
    )
    duplicate_intents = None
    if pages_is_list:
        seen = []
        duplicate_intents = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("intent"), str):
                intent = c["intent"]
                if intent in seen and intent not in duplicate_intents:
                    duplicate_intents.append(intent)
                seen.append(intent)
    single_intent_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("has_single_intent") is True)
        / pages_count
        if pages_is_list and pages_count > 0 else None
    )
    valid_intent_type_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("intent_type") in INTENT_TYPES)
        / pages_count
        if pages_is_list and pages_count > 0 else None
    )
    full_answer_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("fully_answers_question") is True)
        / pages_count
        if pages_is_list and pages_count > 0 else None
    )

    # ---- Section 1: technical_foundation (skill step 1 —
    #      crawlable, fast, mobile-first, HTTPS, canonicals
    #      correct, no accidental noindex/blocked paths, clean
    #      URL structure, 404s handled) ----
    _bool_check(results, "technical_foundation",
                "crawlable_robots_and_sitemap", manifest,
                ("technical", "crawlable_robots_and_sitemap"),
                "technical foundation: crawlable — robots.txt and "
                "sitemap are in place")
    _bool_check(results, "technical_foundation",
                "core_web_vitals_targets_addressed", manifest,
                ("technical", "core_web_vitals_targets_addressed"),
                "technical foundation: fast — Core Web Vitals "
                "targets are addressed")
    _bool_check(results, "technical_foundation",
                "mobile_first", manifest,
                ("technical", "mobile_first"),
                "technical foundation: mobile-first")
    _bool_check(results, "technical_foundation",
                "https_enabled", manifest,
                ("technical", "https_enabled"),
                "technical foundation: HTTPS is enabled")
    _bool_check(results, "technical_foundation",
                "canonical_tags_correct", manifest,
                ("technical", "canonical_tags_correct"),
                "technical foundation: canonical tags are correct")
    _false_check(results, "technical_foundation",
                 "no_accidental_noindex_or_blocked_paths", manifest,
                 ("technical",
                  "accidental_noindex_or_blocked_paths_present"),
                 "technical foundation: no accidental noindex or "
                 "blocked paths are present")
    _bool_check(results, "technical_foundation",
                "clean_url_structure", manifest,
                ("technical", "clean_url_structure"),
                "technical foundation: URL structure is clean")
    _bool_check(results, "technical_foundation",
                "not_found_404s_handled", manifest,
                ("technical", "not_found_404s_handled"),
                "technical foundation: 404s are handled")

    # ---- Section 2: intent_map_and_on_page_craft (skill steps
    #      2-3 — audience questions mapped to an intent type, one
    #      intent per page, relevance x feasibility over vanity
    #      volume; titles/descriptions specific and honest,
    #      heading hierarchy, descriptive internal anchors,
    #      content that fully answers, no padding) ----
    _bool_check(results, "intent_map_and_on_page_craft",
                "audience_questions_mapped", manifest,
                ("intent", "audience_questions_mapped"),
                "intent map: audience questions are mapped")
    _bool_check(results, "intent_map_and_on_page_craft",
                "intent_type_assigned_per_question", manifest,
                ("intent", "intent_type_assigned_per_question"),
                "intent map: an intent type — informational / "
                "commercial / transactional — is assigned per "
                "question")
    _bool_check(results, "intent_map_and_on_page_craft",
                "prioritization_by_relevance_and_feasibility", manifest,
                ("intent", "prioritization_by_relevance_and_feasibility"),
                "intent map: prioritization is by relevance x "
                "feasibility over big-volume vanity terms")
    _bool_check(results, "intent_map_and_on_page_craft",
                "titles_and_descriptions_specific_and_honest", manifest,
                ("on_page", "titles_and_descriptions_specific_and_honest"),
                "on-page craft: titles and descriptions are "
                "specific and honest")
    _bool_check(results, "intent_map_and_on_page_craft",
                "heading_hierarchy_present", manifest,
                ("on_page", "heading_hierarchy_present"),
                "on-page craft: a heading hierarchy is present")
    _bool_check(results, "intent_map_and_on_page_craft",
                "internal_links_with_descriptive_anchors", manifest,
                ("on_page", "internal_links_with_descriptive_anchors"),
                "on-page craft: internal links use descriptive "
                "anchors")
    _false_check(results, "intent_map_and_on_page_craft",
                 "no_clickbait_mismatch", manifest,
                 ("on_page", "clickbait_mismatch_present"),
                 "on-page craft: no clickbait mismatch is present")
    _false_check(results, "intent_map_and_on_page_craft",
                 "no_word_count_padding", manifest,
                 ("on_page", "word_count_padding_present"),
                 "on-page craft: no word-count padding is present "
                 "— depth where it matters")
    _check(results, "intent_map_and_on_page_craft",
           "pages_declared", pages, pages_is_list,
           pages_is_list and pages_count > 0,
           "the declared record names its pages — the pages "
           "list is present and non-empty")
    single_present = (
        pages_is_list
        and all(isinstance(c, dict) and "has_single_intent" in c
                for c in rows)
    )
    _check(results, "intent_map_and_on_page_craft",
           "every_page_has_single_intent", pages, single_present,
           pages_is_list and pages_count > 0
           and all(isinstance(c, dict)
                   and c.get("has_single_intent") is True
                   for c in rows),
           "intent map: every declared page row owns a single "
           "intent")
    type_present = (
        pages_is_list
        and all(isinstance(c, dict) and "intent_type" in c
                for c in rows)
    )
    _check(results, "intent_map_and_on_page_craft",
           "every_page_intent_type_valid", pages, type_present,
           pages_is_list and pages_count > 0
           and all(isinstance(c, dict)
                   and c.get("intent_type") in INTENT_TYPES
                   for c in rows),
           "intent map: every declared page row declares an "
           "intent type from the skill's set — informational / "
           "commercial / transactional")
    intent_present = (
        pages_is_list
        and all(isinstance(c, dict) and "intent" in c for c in rows)
    )
    _check(results, "intent_map_and_on_page_craft",
           "no_intent_owned_by_multiple_pages", pages,
           intent_present,
           pages_is_list and duplicate_intents is not None
           and len(duplicate_intents) == 0,
           "intent map: no declared intent is owned by more "
           "than one page — each key page owns one intent")
    answer_present = (
        pages_is_list
        and all(isinstance(c, dict)
                and "fully_answers_question" in c for c in rows)
    )
    _check(results, "intent_map_and_on_page_craft",
           "every_page_fully_answers_question", pages,
           answer_present,
           pages_is_list and pages_count > 0
           and all(isinstance(c, dict)
                   and c.get("fully_answers_question") is True
                   for c in rows),
           "on-page craft: every declared page row fully "
           "answers its question")

    # ---- Section 3: structured_data_and_entity_clarity (skill
    #      steps 4 and 6 — schema.org as applicable, rich results
    #      validated; consistent brand/name/contact, real author
    #      identity, credentials where appropriate, public
    #      sanitization discipline) ----
    _bool_check(results, "structured_data_and_entity_clarity",
                "schema_org_applied_as_applicable", manifest,
                ("structured_data", "schema_org_applied_as_applicable"),
                "structured data: schema.org — Article, FAQ, "
                "Product, LocalBusiness as applicable — is applied")
    _bool_check(results, "structured_data_and_entity_clarity",
                "rich_results_validated", manifest,
                ("structured_data", "rich_results_validated"),
                "structured data: rich results are validated")
    _bool_check(results, "structured_data_and_entity_clarity",
                "brand_name_contact_consistent", manifest,
                ("entity", "brand_name_contact_consistent"),
                "entity/author clarity: brand, name and contact "
                "info are consistent")
    _bool_check(results, "structured_data_and_entity_clarity",
                "real_author_identity_for_professional_content",
                manifest,
                ("entity",
                 "real_author_identity_for_professional_content"),
                "entity/author clarity: real author identity is "
                "carried for professional content — E-E-A-T spirit")
    _bool_check(results, "structured_data_and_entity_clarity",
                "credentials_carried_where_appropriate", manifest,
                ("entity", "credentials_carried_where_appropriate"),
                "entity/author clarity: professional pages carry "
                "credentials where appropriate")
    _bool_check(results, "structured_data_and_entity_clarity",
                "public_content_sanitization_applied", manifest,
                ("entity", "public_content_sanitization_applied"),
                "entity/author clarity: public content follows "
                "privacy / sanitization discipline")

    # ---- Section 4: earned_authority_and_measurement (skill
    #      steps 5, 7 and 8 — useful assets and human outreach
    #      earn links; Search Console + analytics, impressions
    #      to conversions, queries gained/lost, monthly
    #      iteration, scheduled refresh; clean structure and
    #      canonical answers designed for extraction) ----
    _bool_check(results, "earned_authority_and_measurement",
                "useful_assets_created_to_attract_links", manifest,
                ("authority", "useful_assets_created_to_attract_links"),
                "authority the earned way: genuinely useful "
                "assets — tools, data, guides — attract links")
    _bool_check(results, "earned_authority_and_measurement",
                "relevant_human_outreach_only", manifest,
                ("authority", "relevant_human_outreach_only"),
                "authority the earned way: outreach is relevant "
                "and human")
    _bool_check(results, "earned_authority_and_measurement",
                "search_console_and_analytics_wired", manifest,
                ("measurement", "search_console_and_analytics_wired"),
                "measurement: Search Console and analytics are "
                "wired")
    _bool_check(results, "earned_authority_and_measurement",
                "search_console_baseline_captured", manifest,
                ("measurement", "search_console_baseline_captured"),
                "measurement: a Search Console baseline is "
                "captured")
    _bool_check(results, "earned_authority_and_measurement",
                "impressions_clicks_conversions_tracked", manifest,
                ("measurement",
                 "impressions_clicks_conversions_tracked"),
                "measurement: impressions to clicks to "
                "conversions are tracked")
    _bool_check(results, "earned_authority_and_measurement",
                "queries_gained_lost_tracked", manifest,
                ("measurement", "queries_gained_lost_tracked"),
                "measurement: queries gained and lost are tracked")
    _bool_check(results, "earned_authority_and_measurement",
                "monthly_iteration_cadence", manifest,
                ("measurement", "monthly_iteration_cadence"),
                "measurement: iteration is monthly")
    _bool_check(results, "earned_authority_and_measurement",
                "decaying_pages_refreshed_on_schedule", manifest,
                ("measurement", "decaying_pages_refreshed_on_schedule"),
                "measurement: decaying pages are refreshed on "
                "schedule")
    _bool_check(results, "earned_authority_and_measurement",
                "structure_and_canonical_answers_designed_for_extraction",
                manifest,
                ("ai_era",
                 "structure_and_canonical_answers_designed_for_extraction"),
                "AI-era note: clean structure and canonical "
                "answers are designed for extraction — no tricks "
                "that decay")

    # ---- Section 5: white_hat_red_lines (skill red lines and
    #      step 5 — no cloaking, PBNs, bought links, schemes or
    #      keyword spam; never misleading metadata or fake
    #      urgency) ----
    _false_check(results, "white_hat_red_lines",
                 "no_cloaking", manifest,
                 ("red_lines", "cloaking_present"),
                 "red line: no cloaking is present")
    _false_check(results, "white_hat_red_lines",
                 "no_pbn", manifest,
                 ("red_lines", "pbn_present"),
                 "red line: no PBNs are present")
    _false_check(results, "white_hat_red_lines",
                 "no_bought_links", manifest,
                 ("red_lines", "bought_links_present"),
                 "red line: no bought links are present — no "
                 "link buying")
    _false_check(results, "white_hat_red_lines",
                 "no_link_schemes", manifest,
                 ("red_lines", "link_schemes_present"),
                 "red line: no link schemes are present")
    _false_check(results, "white_hat_red_lines",
                 "no_keyword_spam", manifest,
                 ("red_lines", "keyword_spam_present"),
                 "red line: no keyword spam is present")
    _false_check(results, "white_hat_red_lines",
                 "no_misleading_metadata", manifest,
                 ("red_lines", "misleading_metadata_present"),
                 "red line: no misleading metadata is present")
    _false_check(results, "white_hat_red_lines",
                 "no_fake_urgency", manifest,
                 ("red_lines", "fake_urgency_present"),
                 "red line: no fake urgency is present")

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
        verdict = "HONEST_SEO_MAP_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "HONEST_SEO_MAP_SOUND"

    computed_names = (
        "pages_declared",
        "every_page_has_single_intent",
        "every_page_intent_type_valid",
        "no_intent_owned_by_multiple_pages",
        "every_page_fully_answers_question",
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
        "service": "honest-seo-audit-intent-map",
        "atom_version": "0.1.0",
        "site": manifest.get("site"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "pages_count": pages_count,
        "pages_without_single_intent": pages_without_single_intent,
        "single_intent_coverage": _fmt6(single_intent_coverage),
        "pages_with_invalid_intent_type": pages_with_invalid_intent_type,
        "valid_intent_type_coverage": _fmt6(valid_intent_type_coverage),
        "duplicate_intents": duplicate_intents,
        "pages_not_fully_answering": pages_not_fully_answering,
        "full_answer_coverage": _fmt6(full_answer_coverage),
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
        "HONEST SEO AUDIT INTENT MAP",
        f"site: {verdict.get('site')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: honest_seo_audit_intent_map.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "HONEST_SEO_MAP_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
