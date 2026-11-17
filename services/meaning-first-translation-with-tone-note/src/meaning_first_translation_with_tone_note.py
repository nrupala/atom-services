#!/usr/bin/env python3
"""Meaning-first translation with tone note — deterministic core.

Built from the bound skill `translation`: "Translate messages,
documents, and travel text with meaning first — register, tone,
and idiom preserved and ambiguity flagged, not flattened."

This atom is an AUDIT of a declared translation record: it
validates the record a caller declares against the skill's
sections — context and meaning-first method, register / tone and
send readiness, idiom / ambiguity / uncertainty handling, exact
carryover and segment coverage, and sensitive documents and the
red lines. It does not translate anything, call a model, read
the source or target text, or judge linguistic quality — it
checks that the record the skill requires is present and
internally complete and consistent on the declared evidence.

The caller submits a translation manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- segments: the declared `segments` list must be non-empty, and
  every declared segment row must have a translation, declare
  its meaning preserved, declare its idiom/ambiguity handling
  complete, and declare its exact-carryover check done;
- carryover items: every declared `carryover_items` row must
  declare a kind from the skill's own set (name / number / date
  / place / figure — principles: "Names, numbers, dates, and
  places are carried across exactly"; method step 5: "names,
  numbers, dates, and figures") and declare that it matches the
  original exactly. An explicitly declared empty carryover list
  passes vacuously (the record declares there was nothing to
  carry over); an absent list is missing evidence.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold — no accuracy, BLEU or
fluency score, no word or segment count, no coverage percentage
below completeness over the declared rows, no tone scale — so
no numeric threshold check is invented; those quantities are
caller attestations at most, and quantities here are computed
and reported, with completeness (every declared row) as the
only bar, exactly as stated above.

Verdict:
- any fail             -> MEANING_FIRST_TRANSLATION_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> MEANING_FIRST_TRANSLATION_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "context_and_meaning_first_method",
    "register_tone_and_send_readiness",
    "idiom_ambiguity_and_uncertainty",
    "exact_carryover_and_segment_coverage",
    "sensitive_documents_and_red_lines",
)

CARRYOVER_KINDS = ("name", "number", "date", "place", "figure")

MANIFEST_SPEC = {
    "document": "string",
    "context": {
        "source_language_identified": "boolean",
        "target_language_identified": "boolean",
        "purpose_identified": "boolean",
        "whole_text_read_before_translation": "boolean",
        "translated_for_meaning_not_word_for_word": "boolean",
        "everyday_scope_not_software_localisation": "boolean",
    },
    "tone": {
        "register_preserved": "boolean",
        "tone_and_intent_preserved": "boolean",
        "tone_note_provided_for_sends": "boolean",
        "tone_variant_offered_only_when_real_choice": "boolean",
        "could_offend_or_mislead_phrases_flagged_first": "boolean",
        "honorifics_and_family_terms_matched_to_relationship": "boolean",
        "voice_preserved": "boolean",
        "translation_ready_to_paste_or_speak_for_sends": "boolean",
    },
    "handling": {
        "idioms_flagged_and_explained": "boolean",
        "ambiguities_named_with_both_readings": "boolean",
        "flagged_items_given_short_note_not_lecture": "boolean",
        "uncertain_or_illegible_passages_marked_as_uncertain": "boolean",
        "source_unclear_uncertainty_and_reason_stated": "boolean",
    },
    "segments": [{
        "name": "string",
        "has_translation": "boolean",
        "meaning_preserved": "boolean",
        "idiom_ambiguity_handling_complete": "boolean",
        "exact_carryover_checked": "boolean",
    }],
    "carryover": {
        "names_numbers_dates_figures_checked_one_by_one": "boolean",
    },
    "carryover_items": [{
        "name": "string",
        "kind": "string",
        "matches_original_exactly": "boolean",
    }],
    "sensitive": {
        "sensitive_category_identified": "boolean",
        "translated_faithfully_and_completely_when_sensitive": "boolean",
        "nothing_summarised_away_when_sensitive": "boolean",
        "certified_translation_flag_raised_when_sensitive": "boolean",
    },
    "red_lines": {
        "draft_upgraded_to_official_present": "boolean",
        "idiom_flattened_or_firm_message_softened_silently_present": "boolean",
        "illegible_text_guessed_present": "boolean",
        "name_number_date_or_figure_changed_present": "boolean",
        "meaning_added_beyond_original_present": "boolean",
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
    """Return the verdict dict for a translation-record manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    segments, has_segments = _get(manifest, "segments")
    segments_is_list = has_segments and isinstance(segments, list)
    segments_count = len(segments) if segments_is_list else None
    rows = segments if segments_is_list else []

    items, has_items = _get(manifest, "carryover_items")
    items_is_list = has_items and isinstance(items, list)
    items_count = len(items) if items_is_list else None
    item_rows = items if items_is_list else []

    segments_without_translation = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "has_translation" in c
         and c.get("has_translation") is not True]
        if segments_is_list else None
    )
    segments_without_meaning_preserved = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "meaning_preserved" in c
         and c.get("meaning_preserved") is not True]
        if segments_is_list else None
    )
    segments_without_idiom_ambiguity_handling = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "idiom_ambiguity_handling_complete" in c
         and c.get("idiom_ambiguity_handling_complete") is not True]
        if segments_is_list else None
    )
    segments_without_exact_carryover_check = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "exact_carryover_checked" in c
         and c.get("exact_carryover_checked") is not True]
        if segments_is_list else None
    )
    carryover_items_not_matching = (
        [_row_name(c) for c in item_rows
         if isinstance(c, dict)
         and "matches_original_exactly" in c
         and c.get("matches_original_exactly") is not True]
        if items_is_list else None
    )
    carryover_items_with_invalid_kind = (
        [_row_name(c) for c in item_rows
         if isinstance(c, dict)
         and "kind" in c
         and c.get("kind") not in CARRYOVER_KINDS]
        if items_is_list else None
    )
    translation_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("has_translation") is True)
        / segments_count
        if segments_is_list and segments_count > 0 else None
    )
    meaning_preserved_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("meaning_preserved") is True)
        / segments_count
        if segments_is_list and segments_count > 0 else None
    )
    idiom_ambiguity_handling_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("idiom_ambiguity_handling_complete") is True)
        / segments_count
        if segments_is_list and segments_count > 0 else None
    )
    exact_carryover_check_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("exact_carryover_checked") is True)
        / segments_count
        if segments_is_list and segments_count > 0 else None
    )
    exact_match_coverage = (
        sum(1 for c in item_rows
            if isinstance(c, dict)
            and c.get("matches_original_exactly") is True)
        / items_count
        if items_is_list and items_count > 0 else None
    )
    valid_kind_coverage = (
        sum(1 for c in item_rows
            if isinstance(c, dict)
            and c.get("kind") in CARRYOVER_KINDS)
        / items_count
        if items_is_list and items_count > 0 else None
    )

    # ---- Section 1: context_and_meaning_first_method (skill
    #      method steps 1-3 and principles — source / target /
    #      purpose identified, whole text read first, meaning
    #      first not word for word, everyday scope) ----
    _bool_check(results, "context_and_meaning_first_method",
                "source_language_identified", manifest,
                ("context", "source_language_identified"),
                "context: the source language is identified")
    _bool_check(results, "context_and_meaning_first_method",
                "target_language_identified", manifest,
                ("context", "target_language_identified"),
                "context: the target language is identified")
    _bool_check(results, "context_and_meaning_first_method",
                "purpose_identified", manifest,
                ("context", "purpose_identified"),
                "context: what the text is for is identified")
    _bool_check(results, "context_and_meaning_first_method",
                "whole_text_read_before_translation", manifest,
                ("context", "whole_text_read_before_translation"),
                "method: the whole text was read before "
                "translating any of it — context sets every line")
    _bool_check(results, "context_and_meaning_first_method",
                "translated_for_meaning_not_word_for_word", manifest,
                ("context", "translated_for_meaning_not_word_for_word"),
                "meaning first: the translation renders what the "
                "writer intends, not word for word")
    _bool_check(results, "context_and_meaning_first_method",
                "everyday_scope_not_software_localisation", manifest,
                ("context", "everyday_scope_not_software_localisation"),
                "scope: this is everyday translation, distinct "
                "from software localisation work")
    meaning_present = (
        segments_is_list
        and all(isinstance(c, dict) and "meaning_preserved" in c
                for c in rows)
    )
    _check(results, "context_and_meaning_first_method",
           "every_segment_meaning_preserved", segments,
           meaning_present,
           segments_is_list and segments_count > 0
           and all(isinstance(c, dict)
                   and c.get("meaning_preserved") is True
                   for c in rows),
           "meaning first: every declared segment row declares "
           "its meaning preserved")

    # ---- Section 2: register_tone_and_send_readiness (skill
    #      principles, method steps 6-7 and 'For text you will
    #      send' — register and tone preserved, tone note for
    #      sends, variants only on a real choice, offensive or
    #      misleading phrases flagged, honorifics matched, the
    #      sender's voice preserved, ready to paste or speak) ----
    _bool_check(results, "register_tone_and_send_readiness",
                "register_preserved", manifest,
                ("tone", "register_preserved"),
                "register preserved: formal stays formal, casual "
                "stays casual, family stays family")
    _bool_check(results, "register_tone_and_send_readiness",
                "tone_and_intent_preserved", manifest,
                ("tone", "tone_and_intent_preserved"),
                "tone: register, tone and intent are kept intact "
                "throughout — a warm message lands warm, a firm "
                "one firm")
    _bool_check(results, "register_tone_and_send_readiness",
                "tone_note_provided_for_sends", manifest,
                ("tone", "tone_note_provided_for_sends"),
                "tone note: for anything the caller will send, "
                "the translation carries a one-line note on its "
                "tone — warm, neutral, formal, firm — as it will "
                "be received")
    _bool_check(results, "register_tone_and_send_readiness",
                "tone_variant_offered_only_when_real_choice", manifest,
                ("tone", "tone_variant_offered_only_when_real_choice"),
                "tone: a softer or firmer variant is offered "
                "only when tone is a real choice in the reply")
    _bool_check(results, "register_tone_and_send_readiness",
                "could_offend_or_mislead_phrases_flagged_first",
                manifest,
                ("tone", "could_offend_or_mislead_phrases_flagged_first"),
                "for sends: any phrase that could offend or "
                "mislead in the target culture is flagged first")
    _bool_check(results, "register_tone_and_send_readiness",
                "honorifics_and_family_terms_matched_to_relationship",
                manifest,
                ("tone",
                 "honorifics_and_family_terms_matched_to_relationship"),
                "for sends: honorifics and family terms are "
                "matched to the relationship, not guessed")
    _bool_check(results, "register_tone_and_send_readiness",
                "voice_preserved", manifest,
                ("tone", "voice_preserved"),
                "for sends: the sender's voice stays theirs — "
                "the translation does not sound like a stranger")
    _bool_check(results, "register_tone_and_send_readiness",
                "translation_ready_to_paste_or_speak_for_sends",
                manifest,
                ("tone", "translation_ready_to_paste_or_speak_for_sends"),
                "for sends: the finished translation is ready "
                "to paste or speak")

    # ---- Section 3: idiom_ambiguity_and_uncertainty (skill
    #      principles, method steps 4 and 9 and quality gates —
    #      idioms flagged and explained, ambiguity named with
    #      both readings, short notes, uncertain passages
    #      marked, unclear source stated with its reason) ----
    _bool_check(results, "idiom_ambiguity_and_uncertainty",
                "idioms_flagged_and_explained", manifest,
                ("handling", "idioms_flagged_and_explained"),
                "idiom: idioms are flagged and explained, never "
                "silently flattened into something bland")
    _bool_check(results, "idiom_ambiguity_and_uncertainty",
                "ambiguities_named_with_both_readings", manifest,
                ("handling", "ambiguities_named_with_both_readings"),
                "ambiguity is named: a line that can be read two "
                "ways carries both readings")
    _bool_check(results, "idiom_ambiguity_and_uncertainty",
                "flagged_items_given_short_note_not_lecture", manifest,
                ("handling", "flagged_items_given_short_note_not_lecture"),
                "flagging: idioms, honorifics and ambiguous lines "
                "carry a short note, not a lecture")
    _bool_check(results, "idiom_ambiguity_and_uncertainty",
                "uncertain_or_illegible_passages_marked_as_uncertain",
                manifest,
                ("handling",
                 "uncertain_or_illegible_passages_marked_as_uncertain"),
                "uncertainty: uncertain or illegible passages "
                "are marked as uncertain")
    _bool_check(results, "idiom_ambiguity_and_uncertainty",
                "source_unclear_uncertainty_and_reason_stated", manifest,
                ("handling",
                 "source_unclear_uncertainty_and_reason_stated"),
                "uncertainty: where the source is unclear, "
                "garbled or partly illegible, what is uncertain "
                "and why is stated")
    handling_present = (
        segments_is_list
        and all(isinstance(c, dict)
                and "idiom_ambiguity_handling_complete" in c
                for c in rows)
    )
    _check(results, "idiom_ambiguity_and_uncertainty",
           "every_segment_idiom_ambiguity_handling_complete",
           segments, handling_present,
           segments_is_list and segments_count > 0
           and all(isinstance(c, dict)
                   and c.get("idiom_ambiguity_handling_complete")
                   is True
                   for c in rows),
           "handling: every declared segment row declares its "
           "idiom and ambiguity handling complete")

    # ---- Section 4: exact_carryover_and_segment_coverage
    #      (skill principles, method step 5 and quality gate —
    #      names, numbers, dates and figures checked against
    #      the original one by one and carried across exactly;
    #      every declared segment translated and checked) ----
    _bool_check(results, "exact_carryover_and_segment_coverage",
                "names_numbers_dates_figures_checked_one_by_one",
                manifest,
                ("carryover",
                 "names_numbers_dates_figures_checked_one_by_one"),
                "exact carryover: names, numbers, dates and "
                "figures are checked against the original one "
                "by one")
    _check(results, "exact_carryover_and_segment_coverage",
           "segments_declared", segments, segments_is_list,
           segments_is_list and segments_count > 0,
           "the declared record names its segments — the "
           "segments list is present and non-empty")
    translation_present = (
        segments_is_list
        and all(isinstance(c, dict) and "has_translation" in c
                for c in rows)
    )
    _check(results, "exact_carryover_and_segment_coverage",
           "every_segment_has_translation", segments,
           translation_present,
           segments_is_list and segments_count > 0
           and all(isinstance(c, dict)
                   and c.get("has_translation") is True
                   for c in rows),
           "segment coverage: every declared segment row has "
           "a translation")
    carryover_check_present = (
        segments_is_list
        and all(isinstance(c, dict)
                and "exact_carryover_checked" in c for c in rows)
    )
    _check(results, "exact_carryover_and_segment_coverage",
           "every_segment_exact_carryover_checked", segments,
           carryover_check_present,
           segments_is_list and segments_count > 0
           and all(isinstance(c, dict)
                   and c.get("exact_carryover_checked") is True
                   for c in rows),
           "exact carryover: every declared segment row "
           "declares its exact-carryover check done")
    _check(results, "exact_carryover_and_segment_coverage",
           "carryover_items_declared", items, items_is_list,
           items_is_list,
           "the declared record names its carryover items — "
           "the carryover_items list is present (an explicitly "
           "empty list declares there was nothing to carry over)")
    match_present = (
        items_is_list
        and all(isinstance(c, dict)
                and "matches_original_exactly" in c
                for c in item_rows)
    )
    _check(results, "exact_carryover_and_segment_coverage",
           "every_carryover_item_matches_exactly", items,
           match_present,
           items_is_list
           and all(isinstance(c, dict)
                   and c.get("matches_original_exactly") is True
                   for c in item_rows),
           "exact carryover: every declared carryover item "
           "matches the original exactly, never localised away")
    kind_present = (
        items_is_list
        and all(isinstance(c, dict) and "kind" in c
                for c in item_rows)
    )
    _check(results, "exact_carryover_and_segment_coverage",
           "every_carryover_kind_valid", items, kind_present,
           items_is_list
           and all(isinstance(c, dict)
                   and c.get("kind") in CARRYOVER_KINDS
                   for c in item_rows),
           "exact carryover: every declared carryover item "
           "declares a kind from the skill's set — name / "
           "number / date / place / figure")

    # ---- Section 5: sensitive_documents_and_red_lines (skill
    #      method step 8, 'Sensitive documents' and red lines —
    #      legal / medical / immigration text faithful and
    #      complete, nothing summarised away, the certified
    #      flag raised plainly; never upgrade a draft, flatten
    #      silently, guess illegible text, change an exact
    #      item, or add meaning) ----
    _bool_check(results, "sensitive_documents_and_red_lines",
                "sensitive_category_identified", manifest,
                ("sensitive", "sensitive_category_identified"),
                "sensitive documents: legal, medical or "
                "immigration character is identified where present")
    _bool_check(results, "sensitive_documents_and_red_lines",
                "translated_faithfully_and_completely_when_sensitive",
                manifest,
                ("sensitive",
                 "translated_faithfully_and_completely_when_sensitive"),
                "sensitive documents: legal, medical and "
                "immigration texts are translated faithfully "
                "and completely")
    _bool_check(results, "sensitive_documents_and_red_lines",
                "nothing_summarised_away_when_sensitive", manifest,
                ("sensitive", "nothing_summarised_away_when_sensitive"),
                "sensitive documents: nothing is summarised away "
                "in a document where every clause can matter")
    _bool_check(results, "sensitive_documents_and_red_lines",
                "certified_translation_flag_raised_when_sensitive",
                manifest,
                ("sensitive",
                 "certified_translation_flag_raised_when_sensitive"),
                "sensitive documents: the flag is raised plainly "
                "— an official use may need a certified translation")
    _false_check(results, "sensitive_documents_and_red_lines",
                 "no_draft_upgraded_to_official", manifest,
                 ("red_lines", "draft_upgraded_to_official_present"),
                 "red line: no draft translation is silently "
                 "upgraded into an official document")
    _false_check(results, "sensitive_documents_and_red_lines",
                 "no_idiom_flattened_or_firm_message_softened_silently",
                 manifest,
                 ("red_lines",
                  "idiom_flattened_or_firm_message_softened_silently_present"),
                 "red line: no idiom is flattened and no firm "
                 "message is softened without telling the caller")
    _false_check(results, "sensitive_documents_and_red_lines",
                 "no_illegible_text_guessed", manifest,
                 ("red_lines", "illegible_text_guessed_present"),
                 "red line: no illegible text is guessed at — "
                 "it is marked and asked about")
    _false_check(results, "sensitive_documents_and_red_lines",
                 "no_name_number_date_or_figure_changed", manifest,
                 ("red_lines",
                  "name_number_date_or_figure_changed_present"),
                 "red line: no name, number, date or figure is "
                 "changed in translation")
    _false_check(results, "sensitive_documents_and_red_lines",
                 "no_meaning_added_beyond_original", manifest,
                 ("red_lines", "meaning_added_beyond_original_present"),
                 "red line: no meaning the original does not "
                 "carry is added, however helpful it seems")

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
        verdict = "MEANING_FIRST_TRANSLATION_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "MEANING_FIRST_TRANSLATION_SOUND"

    computed_names = (
        "every_segment_meaning_preserved",
        "every_segment_idiom_ambiguity_handling_complete",
        "segments_declared",
        "every_segment_has_translation",
        "every_segment_exact_carryover_checked",
        "carryover_items_declared",
        "every_carryover_item_matches_exactly",
        "every_carryover_kind_valid",
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
        "service": "meaning-first-translation-with-tone-note",
        "atom_version": "0.1.0",
        "document": manifest.get("document"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "segments_count": segments_count,
        "segments_without_translation": segments_without_translation,
        "translation_coverage": _fmt6(translation_coverage),
        "segments_without_meaning_preserved":
            segments_without_meaning_preserved,
        "meaning_preserved_coverage": _fmt6(meaning_preserved_coverage),
        "segments_without_idiom_ambiguity_handling":
            segments_without_idiom_ambiguity_handling,
        "idiom_ambiguity_handling_coverage":
            _fmt6(idiom_ambiguity_handling_coverage),
        "segments_without_exact_carryover_check":
            segments_without_exact_carryover_check,
        "exact_carryover_check_coverage":
            _fmt6(exact_carryover_check_coverage),
        "carryover_items_count": items_count,
        "carryover_items_not_matching": carryover_items_not_matching,
        "exact_match_coverage": _fmt6(exact_match_coverage),
        "carryover_items_with_invalid_kind":
            carryover_items_with_invalid_kind,
        "valid_kind_coverage": _fmt6(valid_kind_coverage),
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
        "MEANING FIRST TRANSLATION WITH TONE NOTE",
        f"document: {verdict.get('document')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: meaning_first_translation_with_tone_note.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "MEANING_FIRST_TRANSLATION_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
