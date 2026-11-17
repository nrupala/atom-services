# Meaning-first translation with tone note — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are translating messages, documents and travel text with meaning first — register, tone and idiom preserved and ambiguity flagged, not flattened — and you have a record of how the translation was done. This atom reads one declared manifest and returns one deterministic verdict across five sections: **MEANING_FIRST_TRANSLATION_SOUND**, **MEANING_FIRST_TRANSLATION_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it performs no translation, calls no model, reads neither the source text nor the translation, and does not verify that a declared control actually happened. A record is sound *on your declared evidence*: it never judges whether a rendering is actually faithful, idiomatic or well-toned, whether a flagged ambiguity truly has two readings, or whether an honorific truly fits the relationship. It is not a translation service, a translation-quality judgment, or a certification — the certified-translation flag is a declared attestation that the flag was raised; this atom certifies nothing and its verdict is never a certified translation. Computed checks: the declared `segments` list must be present and non-empty; every segment row must declare a translation, meaning preserved, idiom/ambiguity handling complete and exact-carryover checked; the declared `carryover_items` list must be present (an explicitly empty list declares there was nothing to carry over and passes vacuously); every carryover item must match the original exactly and must declare a `kind` from the skill's own set (`name`, `number`, `date`, `place`, `figure`). No numeric threshold is imposed — no translation accuracy, adequacy, fluency, BLEU / COMET or any other MT quality score cutoff, no word, character or segment count, no coverage percentage below completeness over the declared rows, no tone or register scale or numeric tone rating, no number of idioms, ambiguities or uncertain passages that must be flagged, no reading-level or length-ratio bound, and no turnaround time. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "meaning-first-translation-with-tone-note"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/meaning-first-translation-with-tone-note` — tool name `meaning_first_translation_with_tone_note`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/meaning-first-translation-with-tone-note` — body = the manifest object; same `Authorization` header.

## Input — the translation-record manifest

| Field | Meaning |
|---|---|
| `document` | document name (string; carried into the output, not checked) |
| `context.source_language_identified` | context evidence: the source language is identified |
| `context.target_language_identified` | context evidence: the target language is identified |
| `context.purpose_identified` | context evidence: what the text is for is identified |
| `context.whole_text_read_before_translation` | method evidence: the whole text was read before translating any of it |
| `context.translated_for_meaning_not_word_for_word` | method evidence: translated for meaning, not word for word |
| `context.everyday_scope_not_software_localisation` | scope evidence: everyday translation, distinct from software localisation |
| `tone.register_preserved` | tone evidence: register preserved (formal stays formal, casual stays casual, family stays family) |
| `tone.tone_and_intent_preserved` | tone evidence: tone and intent preserved throughout |
| `tone.tone_note_provided_for_sends` | tone evidence: a one-line tone note (warm, neutral, formal, firm — as it will be received) is provided for anything the caller will send |
| `tone.tone_variant_offered_only_when_real_choice` | tone evidence: a softer/firmer variant is offered only when there is a real choice |
| `tone.could_offend_or_mislead_phrases_flagged_first` | tone evidence: phrases that could offend or mislead are flagged first |
| `tone.honorifics_and_family_terms_matched_to_relationship` | tone evidence: honorifics and family terms are matched to the relationship |
| `tone.voice_preserved` | tone evidence: the writer's voice is preserved |
| `tone.translation_ready_to_paste_or_speak_for_sends` | tone evidence: the translation is ready to paste or speak for sends |
| `handling.idioms_flagged_and_explained` | handling evidence: idioms are flagged and explained |
| `handling.ambiguities_named_with_both_readings` | handling evidence: ambiguities are named with both readings |
| `handling.flagged_items_given_short_note_not_lecture` | handling evidence: flagged items get a short note, not a lecture |
| `handling.uncertain_or_illegible_passages_marked_as_uncertain` | handling evidence: uncertain or illegible passages are marked as uncertain |
| `handling.source_unclear_uncertainty_and_reason_stated` | handling evidence: where the source is unclear, the uncertainty and its reason are stated |
| `segments` (list of segment-row objects) | computed: must be present and non-empty; reported as `segments_count` |
| `segments[].name` (string) | names the row in the computed outputs |
| `segments[].has_translation` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `segments_without_translation` |
| `segments[].meaning_preserved` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `segments_without_meaning_preserved` |
| `segments[].idiom_ambiguity_handling_complete` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `segments_without_idiom_ambiguity_handling` |
| `segments[].exact_carryover_checked` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `segments_without_exact_carryover_check` |
| `carryover.names_numbers_dates_figures_checked_one_by_one` | carryover evidence: names, numbers, dates and figures were checked against the original one by one |
| `carryover_items` (list of carryover-item objects) | computed: must be present (any length; an empty list passes vacuously); reported as `carryover_items_count` |
| `carryover_items[].name` (string) | names the row in the computed outputs |
| `carryover_items[].kind` (string) | computed: must be one of `name`, `number`, `date`, `place`, `figure`; rows declaring any other value are reported in `carryover_items_with_invalid_kind` |
| `carryover_items[].matches_original_exactly` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `carryover_items_not_matching` |
| `sensitive.sensitive_category_identified` | sensitive evidence: the sensitive category is identified |
| `sensitive.translated_faithfully_and_completely_when_sensitive` | sensitive evidence: translated faithfully and completely when sensitive |
| `sensitive.nothing_summarised_away_when_sensitive` | sensitive evidence: nothing is summarised away when sensitive |
| `sensitive.certified_translation_flag_raised_when_sensitive` | sensitive evidence: the certified-translation flag is raised when sensitive |
| `red_lines.draft_upgraded_to_official_present` | must be `false` to pass (red line: no draft upgraded to official) |
| `red_lines.idiom_flattened_or_firm_message_softened_silently_present` | must be `false` to pass (red line: no idiom flattened or firm message softened silently) |
| `red_lines.illegible_text_guessed_present` | must be `false` to pass (red line: no illegible text guessed) |
| `red_lines.name_number_date_or_figure_changed_present` | must be `false` to pass (red line: no name, number, date or figure changed) |
| `red_lines.meaning_added_beyond_original_present` | must be `false` to pass (red line: no meaning added beyond the original) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward MEANING_FIRST_TRANSLATION_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/meaning-first-translation-with-tone-note`:

```json
{
  "document": "Travel itinerary translation",
  "context": {
    "source_language_identified": true,
    "target_language_identified": true,
    "purpose_identified": true,
    "whole_text_read_before_translation": true,
    "translated_for_meaning_not_word_for_word": true,
    "everyday_scope_not_software_localisation": true
  },
  "tone": {
    "register_preserved": true,
    "tone_and_intent_preserved": true,
    "tone_note_provided_for_sends": true,
    "tone_variant_offered_only_when_real_choice": true,
    "could_offend_or_mislead_phrases_flagged_first": true,
    "honorifics_and_family_terms_matched_to_relationship": true,
    "voice_preserved": true,
    "translation_ready_to_paste_or_speak_for_sends": true
  },
  "handling": {
    "idioms_flagged_and_explained": true,
    "ambiguities_named_with_both_readings": true,
    "flagged_items_given_short_note_not_lecture": true,
    "uncertain_or_illegible_passages_marked_as_uncertain": true,
    "source_unclear_uncertainty_and_reason_stated": true
  },
  "segments": [
    {
      "name": "seg1",
      "has_translation": true,
      "meaning_preserved": true,
      "idiom_ambiguity_handling_complete": true,
      "exact_carryover_checked": true
    }
  ],
  "carryover": {
    "names_numbers_dates_figures_checked_one_by_one": true
  },
  "carryover_items": [
    {
      "name": "date1",
      "kind": "date",
      "matches_original_exactly": true
    }
  ],
  "sensitive": {
    "sensitive_category_identified": true,
    "translated_faithfully_and_completely_when_sensitive": true,
    "nothing_summarised_away_when_sensitive": true,
    "certified_translation_flag_raised_when_sensitive": true
  },
  "red_lines": {
    "draft_upgraded_to_official_present": false,
    "idiom_flattened_or_firm_message_softened_silently_present": false,
    "illegible_text_guessed_present": false,
    "name_number_date_or_figure_changed_present": false,
    "meaning_added_beyond_original_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 37 checks and a text stamp of the verdict):

```json
{
  "service": "meaning-first-translation-with-tone-note",
  "atom_version": "0.1.0",
  "document": "Travel itinerary translation",
  "verdict": "MEANING_FIRST_TRANSLATION_SOUND",
  "sections": {
    "context_and_meaning_first_method": "pass",
    "register_tone_and_send_readiness": "pass",
    "idiom_ambiguity_and_uncertainty": "pass",
    "exact_carryover_and_segment_coverage": "pass",
    "sensitive_documents_and_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "segments_count": 1,
  "segments_without_translation": [],
  "translation_coverage": "1.000000",
  "segments_without_meaning_preserved": [],
  "meaning_preserved_coverage": "1.000000",
  "segments_without_idiom_ambiguity_handling": [],
  "idiom_ambiguity_handling_coverage": "1.000000",
  "segments_without_exact_carryover_check": [],
  "exact_carryover_check_coverage": "1.000000",
  "carryover_items_count": 1,
  "carryover_items_not_matching": [],
  "exact_match_coverage": "1.000000",
  "carryover_items_with_invalid_kind": [],
  "valid_kind_coverage": "1.000000",
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across five sections."
}
```

## Verdicts

- **MEANING_FIRST_TRANSLATION_SOUND** — every check passes; the declared translation record is complete and consistent with the skill's checklist and red lines.
- **MEANING_FIRST_TRANSLATION_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `segments_count` and `carryover_items_count` (the declared list lengths as integers, or null when a list is not declared), the row-name lists `segments_without_translation`, `segments_without_meaning_preserved`, `segments_without_idiom_ambiguity_handling`, `segments_without_exact_carryover_check`, `carryover_items_not_matching` and `carryover_items_with_invalid_kind` (null when the relevant list is not declared; a row with the relevant field absent is missing evidence and does not appear in the first five lists), the coverage values `translation_coverage`, `meaning_preserved_coverage`, `idiom_ambiguity_handling_coverage`, `exact_carryover_check_coverage`, `exact_match_coverage` and `valid_kind_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the eight primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
