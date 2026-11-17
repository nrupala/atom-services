# Meaning first translation with tone note — documentation

**Meaning first translation with tone note** · slug `meaning-first-translation-with-tone-note` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally** — “no endpoint is live”, and contract.yaml says status: scaffolded. Both are stale. TEST-REPORT.md and the recorded evidence in `verification/work/meaning-first-translation-with-tone-note/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment a15298eb9b7f40bf80d306cea4a33f80). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `document` "Travel itinerary translation"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "meaning-first-translation-with-tone-note"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the translation-record manifest.** You declare a record of how one translation was done — the atom audits the declared record, it does not translate anything (see Explanation). The recorded full-pass manifest declares the document `Travel itinerary translation`: all six context declarations in passing polarity (source and target language identified, purpose identified, whole text read before translation, translated for meaning not word for word, everyday scope not software localisation); register preserved, tone and intent preserved, a tone note provided for sends, a tone variant offered only when there is a real choice, phrases that could offend or mislead flagged first, honorifics and family terms matched to the relationship, voice preserved, and the translation ready to paste or speak for sends; idioms flagged and explained, ambiguities named with both readings, flagged items given a short note not a lecture, uncertain or illegible passages marked as uncertain, and source-unclear uncertainty and its reason stated; one segment row, `seg1`, with a translation, meaning preserved, idiom/ambiguity handling complete and exact-carryover checked; names, numbers, dates and figures checked one by one; one carryover item, `date1`, of kind `date` matching the original exactly; the sensitive category identified, translated faithfully and completely when sensitive, nothing summarised away when sensitive, and the certified-translation flag raised when sensitive; and all five red-line flags `false` (no draft upgraded to official, no idiom flattened or firm message softened silently, no illegible text guessed, no name, number, date or figure changed, no meaning added beyond the original).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/meaning-first-translation-with-tone-note` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `MEANING_FIRST_TRANSLATION_SOUND`: "37 pass, 0 fail, 0 missing of 37 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `segments_count` is 1, `carryover_items_count` is 1, and `translation_coverage`, `meaning_preserved_coverage`, `idiom_ambiguity_handling_coverage`, `exact_carryover_check_coverage`, `exact_match_coverage` and `valid_kind_coverage` are each `"1.000000"`, with all six row-name lists empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `MEANING_FIRST_TRANSLATION_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "meaning-first-translation-with-tone-note"}`.
3. Call: `POST https://atoms.pipavia.com/v1/meaning-first-translation-with-tone-note` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/meaning-first-translation-with-tone-note` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `meaning_first_translation_with_tone_note`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `MEANING_FIRST_TRANSLATION_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 5 checks fail: `every_segment_meaning_preserved`, `every_segment_has_translation`, `every_carryover_item_matches_exactly`, `every_carryover_kind_valid`, `no_illegible_text_guessed`, and the summary reads "32 pass, 5 fail, 0 missing of 37 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `segments_without_translation` and `segments_without_meaning_preserved` each name `seg1` — that row declares `has_translation: false` and `meaning_preserved: false`, so `translation_coverage` and `meaning_preserved_coverage` are each `"0.000000"`; `carryover_items_not_matching` and `carryover_items_with_invalid_kind` each name `date1` — that item declares `kind: "currency"` and `matches_original_exactly: false`, so `exact_match_coverage` and `valid_kind_coverage` are each `"0.000000"`; and `red_lines.illegible_text_guessed_present` is declared `true`, failing `no_illegible_text_guessed`; sections `context_and_meaning_first_method`, `exact_carryover_and_segment_coverage` and `sensitive_documents_and_red_lines` report `fail`, the other two `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a list is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "segments",
  "detail": "segments must be a list"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/meaning-first-translation-with-tone-note` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/meaning-first-translation-with-tone-note` — tool name `meaning_first_translation_with_tone_note`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `meaning_first_translation_with_tone_note` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `document`, the `segments[]` and `carryover_items[]` string fields are noted as strings and `segments` and `carryover_items` as lists there. Where SERVICE.md states no type — the section container objects (`context`, `tone`, `handling`, `carryover`, `sensitive`, `red_lines`) and the `segments[]` and `carryover_items[]` row objects — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `segments` / `carryover_items` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `MEANING_FIRST_TRANSLATION_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them; segment and carryover rows are listed once, under `exact_carryover_and_segment_coverage`, with their additional reading sections noted.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `document` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: context_and_meaning_first_method

| Field | Type | Notes |
|---|---|---|
| `context` | object | The context section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `context.source_language_identified` | boolean | — |
| `context.target_language_identified` | boolean | — |
| `context.purpose_identified` | boolean | — |
| `context.whole_text_read_before_translation` | boolean | — |
| `context.translated_for_meaning_not_word_for_word` | boolean | — |
| `context.everyday_scope_not_software_localisation` | boolean | — |

#### Read by: register_tone_and_send_readiness

| Field | Type | Notes |
|---|---|---|
| `tone` | object | The tone section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `tone.register_preserved` | boolean | — |
| `tone.tone_and_intent_preserved` | boolean | — |
| `tone.tone_note_provided_for_sends` | boolean | — |
| `tone.tone_variant_offered_only_when_real_choice` | boolean | — |
| `tone.could_offend_or_mislead_phrases_flagged_first` | boolean | — |
| `tone.honorifics_and_family_terms_matched_to_relationship` | boolean | — |
| `tone.voice_preserved` | boolean | — |
| `tone.translation_ready_to_paste_or_speak_for_sends` | boolean | — |

#### Read by: idiom_ambiguity_and_uncertainty

| Field | Type | Notes |
|---|---|---|
| `handling` | object | The handling section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `handling.idioms_flagged_and_explained` | boolean | — |
| `handling.ambiguities_named_with_both_readings` | boolean | — |
| `handling.flagged_items_given_short_note_not_lecture` | boolean | — |
| `handling.uncertain_or_illegible_passages_marked_as_uncertain` | boolean | — |
| `handling.source_unclear_uncertainty_and_reason_stated` | boolean | — |

#### Read by: exact_carryover_and_segment_coverage

| Field | Type | Notes |
|---|---|---|
| `carryover` | object | The carryover section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `carryover.names_numbers_dates_figures_checked_one_by_one` | boolean | — |
| `segments` | list | list of segment-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Also read by `context_and_meaning_first_method` and `idiom_ambiguity_and_uncertainty` |
| `segments[]` | object | One declared segment row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `segments[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `segments[].has_translation` | boolean | — |
| `segments[].meaning_preserved` | boolean | Also read by `context_and_meaning_first_method` |
| `segments[].idiom_ambiguity_handling_complete` | boolean | Also read by `idiom_ambiguity_and_uncertainty` |
| `segments[].exact_carryover_checked` | boolean | — |
| `carryover_items` | list | list of carryover-item objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `carryover_items[]` | object | One declared carryover item. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `carryover_items[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `carryover_items[].kind` | string | Must be one of `name`, `number`, `date`, `place`, `figure` — the skill's own set (type and set stated in SERVICE.md) |
| `carryover_items[].matches_original_exactly` | boolean | — |

#### Read by: sensitive_documents_and_red_lines

| Field | Type | Notes |
|---|---|---|
| `sensitive` | object | The sensitive section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `sensitive.sensitive_category_identified` | boolean | — |
| `sensitive.translated_faithfully_and_completely_when_sensitive` | boolean | — |
| `sensitive.nothing_summarised_away_when_sensitive` | boolean | — |
| `sensitive.certified_translation_flag_raised_when_sensitive` | boolean | — |
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.draft_upgraded_to_official_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.idiom_flattened_or_firm_message_softened_silently_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.illegible_text_guessed_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.name_number_date_or_figure_changed_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.meaning_added_beyond_original_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 37 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: context_and_meaning_first_method

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `source_language_identified` | context: the source language is identified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `target_language_identified` | context: the target language is identified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `purpose_identified` | context: what the text is for is identified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `whole_text_read_before_translation` | method: the whole text was read before translating any of it — context sets every line | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `translated_for_meaning_not_word_for_word` | meaning first: the translation renders what the writer intends, not word for word | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `everyday_scope_not_software_localisation` | scope: this is everyday translation, distinct from software localisation work | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_segment_meaning_preserved` | meaning first: every declared segment row declares its meaning preserved | Computed over the declared record. Pass: every declared segment row declares `meaning_preserved: true`. Fail: a row declares `meaning_preserved` present but not `true` (offending rows are named in `segments_without_meaning_preserved`). Missing: the list is absent, or a row has `meaning_preserved` absent (such a row is missing evidence and does not appear in `segments_without_meaning_preserved`). |

#### Section: register_tone_and_send_readiness

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `register_preserved` | register preserved: formal stays formal, casual stays casual, family stays family | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tone_and_intent_preserved` | tone: register, tone and intent are kept intact throughout — a warm message lands warm, a firm one firm | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tone_note_provided_for_sends` | tone note: for anything the caller will send, the translation carries a one-line note on its tone — warm, neutral, formal, firm — as it will be received | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `tone_variant_offered_only_when_real_choice` | tone: a softer or firmer variant is offered only when tone is a real choice in the reply | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `could_offend_or_mislead_phrases_flagged_first` | for sends: any phrase that could offend or mislead in the target culture is flagged first | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `honorifics_and_family_terms_matched_to_relationship` | for sends: honorifics and family terms are matched to the relationship, not guessed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_preserved` | for sends: the sender's voice stays theirs — the translation does not sound like a stranger | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `translation_ready_to_paste_or_speak_for_sends` | for sends: the finished translation is ready to paste or speak | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: idiom_ambiguity_and_uncertainty

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `idioms_flagged_and_explained` | idiom: idioms are flagged and explained, never silently flattened into something bland | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ambiguities_named_with_both_readings` | ambiguity is named: a line that can be read two ways carries both readings | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `flagged_items_given_short_note_not_lecture` | flagging: idioms, honorifics and ambiguous lines carry a short note, not a lecture | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uncertain_or_illegible_passages_marked_as_uncertain` | uncertainty: uncertain or illegible passages are marked as uncertain | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `source_unclear_uncertainty_and_reason_stated` | uncertainty: where the source is unclear, garbled or partly illegible, what is uncertain and why is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_segment_idiom_ambiguity_handling_complete` | handling: every declared segment row declares its idiom and ambiguity handling complete | Computed over the declared record. Pass: every declared segment row declares `idiom_ambiguity_handling_complete: true`. Fail: a row declares `idiom_ambiguity_handling_complete` present but not `true` (offending rows are named in `segments_without_idiom_ambiguity_handling`). Missing: the list is absent, or a row has `idiom_ambiguity_handling_complete` absent (such a row is missing evidence and does not appear in `segments_without_idiom_ambiguity_handling`). |

#### Section: exact_carryover_and_segment_coverage

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `names_numbers_dates_figures_checked_one_by_one` | exact carryover: names, numbers, dates and figures are checked against the original one by one | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `segments_declared` | the declared record names its segments — the segments list is present and non-empty | Computed over the declared record. Pass: the `segments` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_segment_has_translation` | segment coverage: every declared segment row has a translation | Computed over the declared record. Pass: every declared segment row declares `has_translation: true`. Fail: a row declares `has_translation` present but not `true` (offending rows are named in `segments_without_translation`). Missing: the list is absent, or a row has `has_translation` absent (such a row is missing evidence and does not appear in `segments_without_translation`). |
| `every_segment_exact_carryover_checked` | exact carryover: every declared segment row declares its exact-carryover check done | Computed over the declared record. Pass: every declared segment row declares `exact_carryover_checked: true`. Fail: a row declares `exact_carryover_checked` present but not `true` (offending rows are named in `segments_without_exact_carryover_check`). Missing: the list is absent, or a row has `exact_carryover_checked` absent (such a row is missing evidence and does not appear in `segments_without_exact_carryover_check`). |
| `carryover_items_declared` | the declared record names its carryover items — the carryover_items list is present (an explicitly empty list declares there was nothing to carry over) | Computed over the declared record. Pass: the `carryover_items` list is present at any length (an explicitly empty list passes vacuously). Missing: the list is absent. |
| `every_carryover_item_matches_exactly` | exact carryover: every declared carryover item matches the original exactly, never localised away | Computed over the declared record. Pass: every declared carryover item declares `matches_original_exactly: true`. Fail: an item declares `matches_original_exactly` present but not `true` (offending items are named in `carryover_items_not_matching`). Missing: the list is absent, or an item has `matches_original_exactly` absent (such an item is missing evidence and does not appear in `carryover_items_not_matching`). |
| `every_carryover_kind_valid` | exact carryover: every declared carryover item declares a kind from the skill's set — name / number / date / place / figure | Computed over the declared record. Pass: every declared carryover item declares `kind` from the skill's set — `name`, `number`, `date`, `place`, `figure`. Fail: an item declares `kind` present but not in that set (offending items are named in `carryover_items_with_invalid_kind`). Missing: the list is absent, or an item has `kind` absent (such an item is missing evidence and does not appear in `carryover_items_with_invalid_kind`). |

#### Section: sensitive_documents_and_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sensitive_category_identified` | sensitive documents: legal, medical or immigration character is identified where present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `translated_faithfully_and_completely_when_sensitive` | sensitive documents: legal, medical and immigration texts are translated faithfully and completely | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `nothing_summarised_away_when_sensitive` | sensitive documents: nothing is summarised away in a document where every clause can matter | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `certified_translation_flag_raised_when_sensitive` | sensitive documents: the flag is raised plainly — an official use may need a certified translation | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_draft_upgraded_to_official` | red line: no draft translation is silently upgraded into an official document | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_idiom_flattened_or_firm_message_softened_silently` | red line: no idiom is flattened and no firm message is softened without telling the caller | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_illegible_text_guessed` | red line: no illegible text is guessed at — it is marked and asked about | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_name_number_date_or_figure_changed` | red line: no name, number, date or figure is changed in translation | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_meaning_added_beyond_original` | red line: no meaning the original does not carry is added, however helpful it seems | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"meaning-first-translation-with-tone-note"`), `atom_version` (`"0.1.0"`), and `document` (the manifest's declared document value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `segments_count` and `carryover_items_count` (the declared list lengths as integers, or null when a list is not declared); the row-name lists `segments_without_translation`, `segments_without_meaning_preserved`, `segments_without_idiom_ambiguity_handling` and `segments_without_exact_carryover_check` (segments whose relevant field is present but not `true`; a segment with the field absent is missing evidence and does not appear), `carryover_items_not_matching` (items whose `matches_original_exactly` field is present but not `true`) and `carryover_items_with_invalid_kind` (items whose `kind` is present but not in the skill's set) — all six lists are null when the relevant list is not declared, as recorded in the sparse case; and the ratios `translation_coverage` (segments with a translation ÷ declared segments), `meaning_preserved_coverage`, `idiom_ambiguity_handling_coverage`, `exact_carryover_check_coverage`, `exact_match_coverage` (carryover items matching exactly ÷ declared carryover items) and `valid_kind_coverage` — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "37 pass, 0 fail, 0 missing of 37 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared document value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `MEANING_FIRST_TRANSLATION_SOUND` — all 37 checks pass: the declared translation record is complete and consistent with the bound skill's checklist and red lines.
- `MEANING_FIRST_TRANSLATION_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the eight primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `segments_count`, `carryover_items_count`, `segments_without_translation`, `translation_coverage`, `segments_without_meaning_preserved`, `meaning_preserved_coverage`, `segments_without_idiom_ambiguity_handling`, `idiom_ambiguity_handling_coverage`, `segments_without_exact_carryover_check`, `exact_carryover_check_coverage`, `carryover_items_not_matching`, `exact_match_coverage`, `carryover_items_with_invalid_kind`, `valid_kind_coverage` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"segments","detail":"segments must be a list"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Translate messages, documents, and travel text with meaning first — register, tone, and idiom preserved and ambiguity flagged, not flattened (the bound capability, from the skill). You submit one declared record — the translation-record manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`context_and_meaning_first_method`, `register_tone_and_send_readiness`, `idiom_ambiguity_and_uncertainty`, `exact_carryover_and_segment_coverage`, `sensitive_documents_and_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `segments` list must be present and non-empty, every segment row must declare `has_translation: true`, `meaning_preserved: true`, `idiom_ambiguity_handling_complete: true` and `exact_carryover_checked: true`, the declared `carryover_items` list must be present (an explicitly empty list declares there was nothing to carry over and the per-item checks pass vacuously), and every carryover item must declare `matches_original_exactly: true` and a `kind` from the skill's own set (`name`, `number`, `date`, `place`, `figure`) — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `MEANING_FIRST_TRANSLATION_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `MEANING_FIRST_TRANSLATION_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a translation accuracy, adequacy, fluency, BLEU / COMET or any other MT quality score cutoff (the skill states no score of any kind); a word, character or segment count a record must contain; a coverage percentage below completeness over the declared rows; a tone or register scale or numeric tone rating (the skill's tone note is one line — warm, neutral, formal, firm — as it will be received, not a number); a number of idioms, ambiguities or uncertain passages that must be flagged (the bar is that the ones present are flagged, as declared); a reading-level, length-ratio or expansion/contraction bound between source and translation; a turnaround time. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** translation record: a verdict of `MEANING_FIRST_TRANSLATION_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares the whole text was read first, the tone note was given and every name and figure matches passes those checks even if the real translation did none of it. It is a completeness and consistency audit of the record the skill requires, **not a translation service, a translation-quality judgment, or a certification**. Specifically: it performs no translation, calls no model, reads neither the source text nor the translation, and does not verify that a declared control actually happened. It never judges whether a rendering is actually faithful, idiomatic or well-toned, whether a flagged ambiguity truly has two readings, or whether an honorific truly fits the relationship — only that the record contains what the skill's sections and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no text inspection — the source and target texts are never submitted to or read by this atom, so flattened idioms, softened firm messages and changed figures are caller-declared present/absent flags, and segment and carryover rows are caller declarations of coverage and checking, not text the atom compared itself; linguistic quality and cultural fit are caller declarations — the atom checks only that meaning, register, tone-note, flagging and exact-carryover evidence is declared and consistent; the certified-translation flag is a declared attestation that the flag was raised — this atom certifies nothing and its verdict is never a certified translation.

**Buyer and use context.** Teams and agents working in Everyday life who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Translating family and travel messages (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared translation record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not a certified translation or compliance evidence, and SERVICE.md states explicitly that it certifies nothing, performs no translation, and verifies no declared fact. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `meaning_first_translation_with_tone_note` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation and tests are as recorded for this atom's build in SERVICE.md (deterministic core, Python oracle and TypeScript port, parity-proven locally); the external battery is recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/meaning-first-translation-with-tone-note` (REST) and `POST /mcp/meaning-first-translation-with-tone-note` (MCP, tool `meaning_first_translation_with_tone_note`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment a15298eb9b7f40bf80d306cea4a33f80). Key scope: `meaning_first_translation_with_tone_note`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live (see the status discrepancy note at the top); a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale, and disagreeing with each other:** SERVICE.md says Tier B · status: **built-locally**, “no endpoint is live”, while contract.yaml says status: scaffolded. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80) shows the atom live. This document follows the evidenced live state.
2. **Check names differ from input field names:** the recorded check names are not the input field names for the red-line checks and the computed checks. Recorded check names used verbatim in the Checks section include `no_draft_upgraded_to_official` (input `red_lines.draft_upgraded_to_official_present`), `no_idiom_flattened_or_firm_message_softened_silently` (input `red_lines.idiom_flattened_or_firm_message_softened_silently_present`), `no_illegible_text_guessed` (input `red_lines.illegible_text_guessed_present`), `no_name_number_date_or_figure_changed` (input `red_lines.name_number_date_or_figure_changed_present`) and `no_meaning_added_beyond_original` (input `red_lines.meaning_added_beyond_original_present`), plus the computed checks `segments_declared`, `every_segment_has_translation`, `every_segment_meaning_preserved`, `every_segment_idiom_ambiguity_handling_complete`, `every_segment_exact_carryover_checked`, `carryover_items_declared`, `every_carryover_item_matches_exactly` and `every_carryover_kind_valid`, which read the `segments` / `carryover_items` rows rather than any single input field.
3. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field. The recorded REST response carries all 37 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
4. **Violations-case prose notes in the verification record misdescribe the recorded response (prose-only blemish):** the `notes` text for the violations case in evidence.json (and cases.json) says “Fails due to explicit false values in required fields and invalid kind enum.” That accounts for only four of the five recorded failures; the fifth, `no_illegible_text_guessed`, fails because `red_lines.illegible_text_guessed_present` is declared `true` — a present-but-true red-line flag, not a false value and not an invalid kind. The recorded response (32 pass / 5 fail, the five checks named in the How-to guide and Worked example 2) governs; the prose note does not.
5. **Section grouping vs input objects:** the recorded sections merge separate input objects and rows — `context` inputs plus the `segments[].meaning_preserved` rows are read by the single recorded section `context_and_meaning_first_method`, `handling` inputs plus the `segments[].idiom_ambiguity_handling_complete` rows by `idiom_ambiguity_and_uncertainty`, `carryover`, `segments` and `carryover_items` inputs by `exact_carryover_and_segment_coverage`, and `sensitive` and `red_lines` inputs by `sensitive_documents_and_red_lines`. This document groups the Input reference and the Checks by the recorded section names.

## Worked examples

Provenance: recorded 2026-11-16T07:36:12.466830+00:00 against gateway v1.1.0, external verification lane, source `verification/work/meaning-first-translation-with-tone-note/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T07:36:12.466830+00:00 · gateway v1.1.0 · source `verification/work/meaning-first-translation-with-tone-note/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "context_and_meaning_first_method",
      "check": "source_language_identified",
      "status": "pass",
      "evidence": "context: the source language is identified"
    },
    {
      "section": "context_and_meaning_first_method",
      "check": "target_language_identified",
      "status": "pass",
      "evidence": "context: the target language is identified"
    },
    {
      "section": "context_and_meaning_first_method",
      "check": "purpose_identified",
      "status": "pass",
      "evidence": "context: what the text is for is identified"
    },
    {
      "section": "context_and_meaning_first_method",
      "check": "whole_text_read_before_translation",
      "status": "pass",
      "evidence": "method: the whole text was read before translating any of it \u2014 context sets every line"
    },
    {
      "section": "context_and_meaning_first_method",
      "check": "translated_for_meaning_not_word_for_word",
      "status": "pass",
      "evidence": "meaning first: the translation renders what the writer intends, not word for word"
    },
    {
      "section": "context_and_meaning_first_method",
      "check": "everyday_scope_not_software_localisation",
      "status": "pass",
      "evidence": "scope: this is everyday translation, distinct from software localisation work"
    },
    {
      "section": "context_and_meaning_first_method",
      "check": "every_segment_meaning_preserved",
      "status": "pass",
      "evidence": "meaning first: every declared segment row declares its meaning preserved"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "register_preserved",
      "status": "pass",
      "evidence": "register preserved: formal stays formal, casual stays casual, family stays family"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "tone_and_intent_preserved",
      "status": "pass",
      "evidence": "tone: register, tone and intent are kept intact throughout \u2014 a warm message lands warm, a firm one firm"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "tone_note_provided_for_sends",
      "status": "pass",
      "evidence": "tone note: for anything the caller will send, the translation carries a one-line note on its tone \u2014 warm, neutral, formal, firm \u2014 as it will be received"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "tone_variant_offered_only_when_real_choice",
      "status": "pass",
      "evidence": "tone: a softer or firmer variant is offered only when tone is a real choice in the reply"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "could_offend_or_mislead_phrases_flagged_first",
      "status": "pass",
      "evidence": "for sends: any phrase that could offend or mislead in the target culture is flagged first"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "honorifics_and_family_terms_matched_to_relationship",
      "status": "pass",
      "evidence": "for sends: honorifics and family terms are matched to the relationship, not guessed"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "voice_preserved",
      "status": "pass",
      "evidence": "for sends: the sender's voice stays theirs \u2014 the translation does not sound like a stranger"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "translation_ready_to_paste_or_speak_for_sends",
      "status": "pass",
      "evidence": "for sends: the finished translation is ready to paste or speak"
    },
    {
      "section": "idiom_ambiguity_and_uncertainty",
      "check": "idioms_flagged_and_explained",
      "status": "pass",
      "evidence": "idiom: idioms are flagged and explained, never silently flattened into something bland"
    },
    {
      "section": "idiom_ambiguity_and_uncertainty",
      "check": "ambiguities_named_with_both_readings",
      "status": "pass",
      "evidence": "ambiguity is named: a line that can be read two ways carries both readings"
    },
    {
      "section": "idiom_ambiguity_and_uncertainty",
      "check": "flagged_items_given_short_note_not_lecture",
      "status": "pass",
      "evidence": "flagging: idioms, honorifics and ambiguous lines carry a short note, not a lecture"
    },
    {
      "section": "idiom_ambiguity_and_uncertainty",
      "check": "uncertain_or_illegible_passages_marked_as_uncertain",
      "status": "pass",
      "evidence": "uncertainty: uncertain or illegible passages are marked as uncertain"
    },
    {
      "section": "idiom_ambiguity_and_uncertainty",
      "check": "source_unclear_uncertainty_and_reason_stated",
      "status": "pass",
      "evidence": "uncertainty: where the source is unclear, garbled or partly illegible, what is uncertain and why is stated"
    },
    {
      "section": "idiom_ambiguity_and_uncertainty",
      "check": "every_segment_idiom_ambiguity_handling_complete",
      "status": "pass",
      "evidence": "handling: every declared segment row declares its idiom and ambiguity handling complete"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "names_numbers_dates_figures_checked_one_by_one",
      "status": "pass",
      "evidence": "exact carryover: names, numbers, dates and figures are checked against the original one by one"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "segments_declared",
      "status": "pass",
      "evidence": "the declared record names its segments \u2014 the segments list is present and non-empty"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "every_segment_has_translation",
      "status": "pass",
      "evidence": "segment coverage: every declared segment row has a translation"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "every_segment_exact_carryover_checked",
      "status": "pass",
      "evidence": "exact carryover: every declared segment row declares its exact-carryover check done"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "carryover_items_declared",
      "status": "pass",
      "evidence": "the declared record names its carryover items \u2014 the carryover_items list is present (an explicitly empty list declares there was nothing to carry over)"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "every_carryover_item_matches_exactly",
      "status": "pass",
      "evidence": "exact carryover: every declared carryover item matches the original exactly, never localised away"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "every_carryover_kind_valid",
      "status": "pass",
      "evidence": "exact carryover: every declared carryover item declares a kind from the skill's set \u2014 name / number / date / place / figure"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "sensitive_category_identified",
      "status": "pass",
      "evidence": "sensitive documents: legal, medical or immigration character is identified where present"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "translated_faithfully_and_completely_when_sensitive",
      "status": "pass",
      "evidence": "sensitive documents: legal, medical and immigration texts are translated faithfully and completely"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "nothing_summarised_away_when_sensitive",
      "status": "pass",
      "evidence": "sensitive documents: nothing is summarised away in a document where every clause can matter"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "certified_translation_flag_raised_when_sensitive",
      "status": "pass",
      "evidence": "sensitive documents: the flag is raised plainly \u2014 an official use may need a certified translation"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "no_draft_upgraded_to_official",
      "status": "pass",
      "evidence": "red line: no draft translation is silently upgraded into an official document"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "no_idiom_flattened_or_firm_message_softened_silently",
      "status": "pass",
      "evidence": "red line: no idiom is flattened and no firm message is softened without telling the caller"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "no_illegible_text_guessed",
      "status": "pass",
      "evidence": "red line: no illegible text is guessed at \u2014 it is marked and asked about"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "no_name_number_date_or_figure_changed",
      "status": "pass",
      "evidence": "red line: no name, number, date or figure is changed in translation"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "no_meaning_added_beyond_original",
      "status": "pass",
      "evidence": "red line: no meaning the original does not carry is added, however helpful it seems"
    }
  ],
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
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across five sections.",
  "stamp": "MEANING FIRST TRANSLATION WITH TONE NOTE\ndocument: Travel itinerary translation\nVERDICT: MEANING_FIRST_TRANSLATION_SOUND\n  context_and_meaning_first_method     pass\n  register_tone_and_send_readiness     pass\n  idiom_ambiguity_and_uncertainty      pass\n  exact_carryover_and_segment_coverage pass\n  sensitive_documents_and_red_lines    pass\n37 pass, 0 fail, 0 missing of 37 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T07:36:12.466830+00:00 · gateway v1.1.0 · source `verification/work/meaning-first-translation-with-tone-note/evidence.json`.

Input:

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
      "has_translation": false,
      "meaning_preserved": false,
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
      "kind": "currency",
      "matches_original_exactly": false
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
    "illegible_text_guessed_present": true,
    "name_number_date_or_figure_changed_present": false,
    "meaning_added_beyond_original_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "meaning-first-translation-with-tone-note",
  "atom_version": "0.1.0",
  "document": "Travel itinerary translation",
  "verdict": "MEANING_FIRST_TRANSLATION_NOT_SOUND",
  "sections": {
    "context_and_meaning_first_method": "fail",
    "register_tone_and_send_readiness": "pass",
    "idiom_ambiguity_and_uncertainty": "pass",
    "exact_carryover_and_segment_coverage": "fail",
    "sensitive_documents_and_red_lines": "fail"
  },
  "checks": [
    {
      "section": "context_and_meaning_first_method",
      "check": "source_language_identified",
      "status": "pass",
      "evidence": "context: the source language is identified"
    },
    {
      "section": "context_and_meaning_first_method",
      "check": "target_language_identified",
      "status": "pass",
      "evidence": "context: the target language is identified"
    },
    {
      "section": "context_and_meaning_first_method",
      "check": "purpose_identified",
      "status": "pass",
      "evidence": "context: what the text is for is identified"
    },
    {
      "section": "context_and_meaning_first_method",
      "check": "whole_text_read_before_translation",
      "status": "pass",
      "evidence": "method: the whole text was read before translating any of it \u2014 context sets every line"
    },
    {
      "section": "context_and_meaning_first_method",
      "check": "translated_for_meaning_not_word_for_word",
      "status": "pass",
      "evidence": "meaning first: the translation renders what the writer intends, not word for word"
    },
    {
      "section": "context_and_meaning_first_method",
      "check": "everyday_scope_not_software_localisation",
      "status": "pass",
      "evidence": "scope: this is everyday translation, distinct from software localisation work"
    },
    {
      "section": "context_and_meaning_first_method",
      "check": "every_segment_meaning_preserved",
      "status": "fail",
      "evidence": "meaning first: every declared segment row declares its meaning preserved"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "register_preserved",
      "status": "pass",
      "evidence": "register preserved: formal stays formal, casual stays casual, family stays family"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "tone_and_intent_preserved",
      "status": "pass",
      "evidence": "tone: register, tone and intent are kept intact throughout \u2014 a warm message lands warm, a firm one firm"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "tone_note_provided_for_sends",
      "status": "pass",
      "evidence": "tone note: for anything the caller will send, the translation carries a one-line note on its tone \u2014 warm, neutral, formal, firm \u2014 as it will be received"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "tone_variant_offered_only_when_real_choice",
      "status": "pass",
      "evidence": "tone: a softer or firmer variant is offered only when tone is a real choice in the reply"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "could_offend_or_mislead_phrases_flagged_first",
      "status": "pass",
      "evidence": "for sends: any phrase that could offend or mislead in the target culture is flagged first"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "honorifics_and_family_terms_matched_to_relationship",
      "status": "pass",
      "evidence": "for sends: honorifics and family terms are matched to the relationship, not guessed"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "voice_preserved",
      "status": "pass",
      "evidence": "for sends: the sender's voice stays theirs \u2014 the translation does not sound like a stranger"
    },
    {
      "section": "register_tone_and_send_readiness",
      "check": "translation_ready_to_paste_or_speak_for_sends",
      "status": "pass",
      "evidence": "for sends: the finished translation is ready to paste or speak"
    },
    {
      "section": "idiom_ambiguity_and_uncertainty",
      "check": "idioms_flagged_and_explained",
      "status": "pass",
      "evidence": "idiom: idioms are flagged and explained, never silently flattened into something bland"
    },
    {
      "section": "idiom_ambiguity_and_uncertainty",
      "check": "ambiguities_named_with_both_readings",
      "status": "pass",
      "evidence": "ambiguity is named: a line that can be read two ways carries both readings"
    },
    {
      "section": "idiom_ambiguity_and_uncertainty",
      "check": "flagged_items_given_short_note_not_lecture",
      "status": "pass",
      "evidence": "flagging: idioms, honorifics and ambiguous lines carry a short note, not a lecture"
    },
    {
      "section": "idiom_ambiguity_and_uncertainty",
      "check": "uncertain_or_illegible_passages_marked_as_uncertain",
      "status": "pass",
      "evidence": "uncertainty: uncertain or illegible passages are marked as uncertain"
    },
    {
      "section": "idiom_ambiguity_and_uncertainty",
      "check": "source_unclear_uncertainty_and_reason_stated",
      "status": "pass",
      "evidence": "uncertainty: where the source is unclear, garbled or partly illegible, what is uncertain and why is stated"
    },
    {
      "section": "idiom_ambiguity_and_uncertainty",
      "check": "every_segment_idiom_ambiguity_handling_complete",
      "status": "pass",
      "evidence": "handling: every declared segment row declares its idiom and ambiguity handling complete"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "names_numbers_dates_figures_checked_one_by_one",
      "status": "pass",
      "evidence": "exact carryover: names, numbers, dates and figures are checked against the original one by one"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "segments_declared",
      "status": "pass",
      "evidence": "the declared record names its segments \u2014 the segments list is present and non-empty"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "every_segment_has_translation",
      "status": "fail",
      "evidence": "segment coverage: every declared segment row has a translation"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "every_segment_exact_carryover_checked",
      "status": "pass",
      "evidence": "exact carryover: every declared segment row declares its exact-carryover check done"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "carryover_items_declared",
      "status": "pass",
      "evidence": "the declared record names its carryover items \u2014 the carryover_items list is present (an explicitly empty list declares there was nothing to carry over)"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "every_carryover_item_matches_exactly",
      "status": "fail",
      "evidence": "exact carryover: every declared carryover item matches the original exactly, never localised away"
    },
    {
      "section": "exact_carryover_and_segment_coverage",
      "check": "every_carryover_kind_valid",
      "status": "fail",
      "evidence": "exact carryover: every declared carryover item declares a kind from the skill's set \u2014 name / number / date / place / figure"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "sensitive_category_identified",
      "status": "pass",
      "evidence": "sensitive documents: legal, medical or immigration character is identified where present"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "translated_faithfully_and_completely_when_sensitive",
      "status": "pass",
      "evidence": "sensitive documents: legal, medical and immigration texts are translated faithfully and completely"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "nothing_summarised_away_when_sensitive",
      "status": "pass",
      "evidence": "sensitive documents: nothing is summarised away in a document where every clause can matter"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "certified_translation_flag_raised_when_sensitive",
      "status": "pass",
      "evidence": "sensitive documents: the flag is raised plainly \u2014 an official use may need a certified translation"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "no_draft_upgraded_to_official",
      "status": "pass",
      "evidence": "red line: no draft translation is silently upgraded into an official document"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "no_idiom_flattened_or_firm_message_softened_silently",
      "status": "pass",
      "evidence": "red line: no idiom is flattened and no firm message is softened without telling the caller"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "no_illegible_text_guessed",
      "status": "fail",
      "evidence": "red line: no illegible text is guessed at \u2014 it is marked and asked about"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "no_name_number_date_or_figure_changed",
      "status": "pass",
      "evidence": "red line: no name, number, date or figure is changed in translation"
    },
    {
      "section": "sensitive_documents_and_red_lines",
      "check": "no_meaning_added_beyond_original",
      "status": "pass",
      "evidence": "red line: no meaning the original does not carry is added, however helpful it seems"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "segments_count": 1,
  "segments_without_translation": [
    "seg1"
  ],
  "translation_coverage": "0.000000",
  "segments_without_meaning_preserved": [
    "seg1"
  ],
  "meaning_preserved_coverage": "0.000000",
  "segments_without_idiom_ambiguity_handling": [],
  "idiom_ambiguity_handling_coverage": "1.000000",
  "segments_without_exact_carryover_check": [],
  "exact_carryover_check_coverage": "1.000000",
  "carryover_items_count": 1,
  "carryover_items_not_matching": [
    "date1"
  ],
  "exact_match_coverage": "0.000000",
  "carryover_items_with_invalid_kind": [
    "date1"
  ],
  "valid_kind_coverage": "0.000000",
  "summary": "32 pass, 5 fail, 0 missing of 37 checks across five sections.",
  "stamp": "MEANING FIRST TRANSLATION WITH TONE NOTE\ndocument: Travel itinerary translation\nVERDICT: MEANING_FIRST_TRANSLATION_NOT_SOUND\n  context_and_meaning_first_method     fail\n  register_tone_and_send_readiness     pass\n  idiom_ambiguity_and_uncertainty      pass\n  exact_carryover_and_segment_coverage fail\n  sensitive_documents_and_red_lines    fail\n32 pass, 5 fail, 0 missing of 37 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T07:36:12.466830+00:00 · gateway v1.1.0 · source `verification/work/meaning-first-translation-with-tone-note/evidence.json`.

Input:

```json
{
  "document": "Malformed input",
  "segments": "this_should_be_a_list"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "segments",
  "detail": "segments must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared translation record; its verdict is a completeness and consistency judgment on declared evidence, not a certified translation or compliance evidence, and it certifies nothing and verifies no declared fact. |
| Checks named | 37 documented / 37 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`segments_count`, `carryover_items_count`, the six row-name lists and the six coverage ratios) |
| Input reference typed | Yes — 48 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/meaning-first-translation-with-tone-note/evidence.json` |
