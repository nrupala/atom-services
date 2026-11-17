# Sourced podcast episode production — documentation

**Sourced podcast episode production** · slug `sourced-podcast-episode-production` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment ac6ddba696934ceb84596876507fc08c; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared podcast episode production record for completeness and consistency only. It surfaces two faces: REST `POST /v1/sourced-podcast-episode-production` and MCP `POST /mcp/sourced-podcast-episode-production`, tool name `sourced_podcast_episode_production`. It produces no audio, writes no script, fetches no source and publishes nothing — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/sourced-podcast-episode-production/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment ac6ddba696934ceb84596876507fc08c). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the episode "The Future of AI"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "sourced-podcast-episode-production"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the episode production manifest.** You declare an episode production record for one episode, made from the production as actually carried out — the atom audits the declared record, it does not research, script, narrate or publish anything (see Explanation). The recorded full-pass manifest declares the episode `The Future of AI`: all six scoping flags `true` (topic, audience, target length, main point and distribution intent scoped, and scoped before writing); one outline section `s1` with purpose `Introduce the main point` and `supports_main_point` `true`; all four source-work flags `true` (sources collected before writing, source list kept beside the draft, script checked claim by claim against the sources, unsupported claims cut or softened); one source `src1` with citation `https://example.com/report`; one claim `c1` of kind `statistic`, tracing to `src1`, with its source marked in the script; all eight script flags `true` (written for the ear, short sentences, signposts, no visual references, opens with the main point, supports the point in order, closes with what matters, approved before narration); all seven narration and assembly QC flags `true` with `ai_narrated` `false`; all three show-notes flags `true` with `source_ids_included` `["src1"]`; `rights.copyrighted_audio_or_music_used` `false`, `guests.guest_voices_present` `false` and `publishing.publishing_or_scheduling_planned` `false` (so the gated rights, guest-release, publishing and AI-disclosure target fields are not required in this record and their checks pass as not applicable); and all five red-line flags `false` (no fabricated quote, statistic or source, no words attributed beyond a source, no publishing beyond the authorized scope, no AI narration presented as human without disclosure, no copyrighted audio without a clear right).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/sourced-podcast-episode-production` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `EPISODE_PRODUCTION_SOUND`: "52 pass, 0 fail, 0 missing of 52 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `episode_outline_sections_count` is 1, `podcast_sources_count` is 1 and `podcast_claims_count` is 1, all eleven duplicate / row-name lists are empty (`[]`), and `outline_section_support_ratio`, `source_citation_ratio`, `traced_claim_ratio` and `show_notes_source_coverage_ratio` are each `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `EPISODE_PRODUCTION_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "sourced-podcast-episode-production"}`.
3. Call: `POST https://atoms.pipavia.com/v1/sourced-podcast-episode-production` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/sourced-podcast-episode-production` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `sourced_podcast_episode_production`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `EPISODE_PRODUCTION_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_podcast_episode_outline_section_supports_main_point`, `every_podcast_claim_kind_recognised`, `every_podcast_claim_traced_to_declared_source` and `podcast_episode_free_of_fabricated_quote_statistic_or_source`, and the summary reads "48 pass, 4 fail, 0 missing of 52 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `episode_sections[0].supports_main_point` is declared `false`, failing `every_podcast_episode_outline_section_supports_main_point`, with `episode_outline_sections_not_supporting_main_point` naming `["s1"]` and `outline_section_support_ratio` `"0.000000"`; `claims[0].claim_kind` is declared `invalid_kind`, failing `every_podcast_claim_kind_recognised`, with `podcast_claims_with_invalid_kind` naming `["c1"]`; `claims[0].source_id` is declared `src2`, which is not a declared source, failing `every_podcast_claim_traced_to_declared_source`, with `podcast_claims_with_unknown_source_reference` naming `["c1"]` and `traced_claim_ratio` `"0.000000"`; and `red_lines.fabricated_quote_statistic_or_source_present` is declared `true`, failing `podcast_episode_free_of_fabricated_quote_statistic_or_source`; sections `episode_scoping_and_outline`, `sources_and_claim_traceability` and `red_lines` report `fail`, the other four sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scoping",
  "detail": "scoping must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/sourced-podcast-episode-production` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/sourced-podcast-episode-production` — tool name `sourced_podcast_episode_production`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `sourced_podcast_episode_production` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `episode_title` and the row id / purpose / citation / kind / source-reference fields are noted as strings (purpose and citation as non-empty strings), and `episode_sections`, `sources` and `claims` as lists there, and `show_notes.source_ids_included` as a list of strings there. Where SERVICE.md states no type — the section container objects (`scoping`, `source_work`, `script`, `narration`, `show_notes`, `rights`, `guests`, `publishing`, `red_lines`) and the row objects (`episode_sections[]`, `sources[]`, `claims[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and the lists, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and `episode_sections`, `sources` and `claims` as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `EPISODE_PRODUCTION_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|

| `episode_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |



#### Read by: episode_scoping_and_outline

| Field | Type | Notes |
|---|---|---|

| `scoping` | object | The scoping section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |

| `scoping.topic_scoped` | boolean | — |

| `scoping.audience_scoped` | boolean | — |

| `scoping.target_length_scoped` | boolean | — |

| `scoping.main_point_scoped` | boolean | — |

| `scoping.distribution_intent_confirmed` | boolean | — |

| `scoping.scoped_before_writing` | boolean | — |

| `episode_sections` | list | list of outline-section-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |

| `episode_sections[]` | object | One declared outline-section row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |

| `episode_sections[].section_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |

| `episode_sections[].purpose` | non-empty string | Must be non-empty per row (type stated in SERVICE.md) |

| `episode_sections[].supports_main_point` | boolean | Must be `true` per row |



#### Read by: sources_and_claim_traceability

| Field | Type | Notes |
|---|---|---|

| `source_work` | object | The source-work section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |

| `source_work.sources_collected_before_writing` | boolean | — |

| `source_work.source_list_kept_beside_draft` | boolean | — |

| `source_work.script_checked_claim_by_claim_against_sources` | boolean | — |

| `source_work.unsupported_claims_cut_or_softened` | boolean | — |

| `sources` | list | list of source-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |

| `sources[]` | object | One declared source row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |

| `sources[].source_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |

| `sources[].citation` | non-empty string | The citation or link as recorded; must be non-empty per row (type stated in SERVICE.md) |

| `claims` | list | list of claim-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |

| `claims[]` | object | One declared claim row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |

| `claims[].claim_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |

| `claims[].claim_kind` | string | One of `quote`, `statistic` (type stated in SERVICE.md) |

| `claims[].source_id` | string | Computed — must name a declared source (type stated in SERVICE.md) |

| `claims[].source_marked_in_script` | boolean | Must be `true` per row |



#### Read by: script_for_listening

| Field | Type | Notes |
|---|---|---|

| `script` | object | The script section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |

| `script.written_for_the_ear` | boolean | — |

| `script.uses_short_sentences` | boolean | — |

| `script.uses_signposts` | boolean | — |

| `script.has_no_visual_references` | boolean | — |

| `script.opens_with_main_point` | boolean | — |

| `script.supports_point_in_order` | boolean | — |

| `script.closes_with_what_matters` | boolean | — |

| `script.approved_before_narration` | boolean | — |



#### Read by: narration_and_assembly_qc

| Field | Type | Notes |
|---|---|---|

| `narration` | object | The narration section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |

| `narration.voice_confirmed` | boolean | — |

| `narration.pace_confirmed` | boolean | — |

| `narration.long_script_chunked_at_section_breaks_where_long` | boolean | — |

| `narration.audio_assembled` | boolean | — |

| `narration.opening_listen_back_checked` | boolean | — |

| `narration.section_joins_listen_back_checked` | boolean | — |

| `narration.misreads_and_awkward_joins_fixed` | boolean | — |



#### Read by: show_notes_and_rights

| Field | Type | Notes |
|---|---|---|

| `show_notes` | object | The show-notes section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |

| `show_notes.summary_included` | boolean | — |

| `show_notes.main_points_included` | boolean | — |

| `show_notes.complete_source_list_included` | boolean | — |

| `show_notes.source_ids_included` | list of strings | Computed — must be exactly the declared source ids (type stated in SERVICE.md) |

| `rights` | object | The rights section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |

| `rights.copyrighted_audio_or_music_used` | boolean | Gates the rights check below |

| `rights.right_to_copyrighted_audio_or_music_cleared` | boolean | Required when copyrighted audio/music use is declared; otherwise the check passes as not applicable |

| `guests` | object | The guests section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |

| `guests.guest_voices_present` | boolean | Gates the guest-release check below |

| `guests.releases_recorded_for_all_guests` | boolean | Required when guest voices are declared present; otherwise the check passes as not applicable |



#### Read by: publishing_and_disclosure

| Field | Type | Notes |
|---|---|---|

| `narration.ai_narrated` | boolean | Gates the AI-narration disclosure check below; the `narration` container itself is listed under narration_and_assembly_qc above (type stated in SERVICE.md for the field) |

| `publishing` | object | The publishing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |

| `publishing.publishing_or_scheduling_planned` | boolean | Gates the three publishing checks below |

| `publishing.authorization_recorded_for_this_episode` | boolean | Required when publishing/scheduling is declared planned; otherwise the check passes as not applicable |

| `publishing.destination_matches_authorized_scope` | boolean | Gated as above |

| `publishing.timing_matches_authorized_scope` | boolean | Gated as above |

| `publishing.ai_narration_disclosure_made` | boolean | Required when AI narration is declared; otherwise the check passes as not applicable |



#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|

| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |

| `red_lines.fabricated_quote_statistic_or_source_present` | boolean | must be `false` to pass — skill red line |

| `red_lines.words_attributed_beyond_source_present` | boolean | must be `false` to pass — skill red line |

| `red_lines.publishing_beyond_authorized_scope_present` | boolean | must be `false` to pass — skill red line |

| `red_lines.ai_narration_presented_as_human_without_disclosure_present` | boolean | must be `false` to pass — skill red line |

| `red_lines.copyrighted_audio_without_clear_right_present` | boolean | must be `false` to pass — skill red line |



### Checks

All 52 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: episode_scoping_and_outline

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|

| `podcast_episode_topic_scoped` | scoping: the episode topic was scoped before writing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_audience_scoped` | scoping: the episode audience was scoped before writing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_target_length_scoped` | scoping: the episode target length was scoped before writing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_main_point_scoped` | scoping: the episode's single main point was scoped before writing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_distribution_intent_confirmed` | scoping: whether the episode is for the caller alone or for publishing later was confirmed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_scoped_before_writing` | scoping / quality gate: topic, audience, length and main point were scoped before writing began | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_outline_sections_list_declared` | outline: the declared record names its episode outline sections — the list is present and names at least one section; an absent list is missing evidence and an empty list declares no outline at all | Computed over the declared record. Pass: the `episode_sections` list is present and names at least one section. Fail: the list is empty — it declares no outline at all. Missing: the list is absent. |

| `every_podcast_episode_outline_section_id_unique` | outline sections: no declared section_id is owned by more than one row | Computed over the declared record. Pass: no declared `section_id` appears on more than one row. Fail: a `section_id` is declared on more than one row (duplicates are named in `duplicate_episode_outline_section_ids`). Missing: the list is absent, or a row has `section_id` absent. |

| `every_podcast_episode_outline_section_purpose_declared` | outline: every declared section declares a non-empty purpose — each section earns its place | Computed over the declared record. Pass: every declared section row declares a non-empty `purpose`. Fail: a row declares an empty `purpose` (offending rows are named in `episode_outline_sections_without_purpose`). Missing: the list is absent, or a row has `purpose` absent. |

| `every_podcast_episode_outline_section_supports_main_point` | outline: every declared section is declared to support the episode's single main point | Computed over the declared record. Pass: every declared section row declares `supports_main_point` `true`. Fail: a row declares it `false` (offending rows are named in `episode_outline_sections_not_supporting_main_point`). Missing: the list is absent, or a row has the field absent. |



#### Section: sources_and_claim_traceability

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|

| `podcast_episode_sources_collected_before_writing` | research: sources were collected before writing anything | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_source_list_kept_beside_draft` | research: the source list was kept beside the draft from the first line onward | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_script_checked_claim_by_claim` | claim check: the script was checked claim by claim against the source list | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_unsupported_claims_cut_or_softened` | claim check: anything no collected source supports was cut or softened | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_sources_list_declared` | sources: the declared record names its sources — the list is present and names at least one source; an absent list is missing evidence and an empty list declares no sourced episode at all | Computed over the declared record. Pass: the `sources` list is present and names at least one source. Fail: the list is empty — it declares no sourced episode at all. Missing: the list is absent. |

| `every_podcast_source_id_unique` | sources: no declared source_id is owned by more than one row | Computed over the declared record. Pass: no declared `source_id` appears on more than one source row. Fail: a `source_id` is declared on more than one row (duplicates are named in `duplicate_podcast_source_ids`). Missing: the list is absent, or a row has `source_id` absent. |

| `every_podcast_source_citation_recorded` | sources: every declared source declares a non-empty citation or link as recorded | Computed over the declared record. Pass: every declared source row declares a non-empty `citation`. Fail: a row declares an empty `citation` (offending rows are named in `podcast_sources_without_citation`). Missing: the list is absent, or a row has `citation` absent. |

| `podcast_episode_claims_list_declared` | claims: the declared record names its quote and statistic claim rows — the list is present and names at least one claim; an absent list is missing evidence and an empty list declares no traced claims at all | Computed over the declared record. Pass: the `claims` list is present and names at least one claim row. Fail: the list is empty — it declares no traced claims at all. Missing: the list is absent. |

| `every_podcast_claim_id_unique` | claims: no declared claim_id is owned by more than one row | Computed over the declared record. Pass: no declared `claim_id` appears on more than one claim row. Fail: a `claim_id` is declared on more than one row (duplicates are named in `duplicate_podcast_claim_ids`). Missing: the list is absent, or a row has `claim_id` absent. |

| `every_podcast_claim_kind_recognised` | claims: every declared claim's kind is one of quote, statistic — the two kinds the skill requires to be marked with a source | Computed over the declared record. Pass: every declared claim's `claim_kind` is one of `quote`, `statistic`. Fail: a claim declares any other value (offending claims are named in `podcast_claims_with_invalid_kind`). Missing: the list is absent, or a row has `claim_kind` absent. |

| `every_podcast_claim_traced_to_declared_source` | claims / quality gate: every declared quote and statistic traces to a source_id named in the declared source list | Computed over the declared record. Pass: every declared claim's `source_id` names one of the declared sources. Fail: a claim names an undeclared source (offending claims are named in `podcast_claims_with_unknown_source_reference`). Missing: the list is absent, a claim has `source_id` absent, or the `sources` list is absent. |

| `every_podcast_claim_source_marked_in_script` | claims: every declared quote and statistic is marked in the script with the source it came from | Computed over the declared record. Pass: every declared claim row declares `source_marked_in_script` `true`. Fail: a row declares it `false` (offending claims are named in `podcast_claims_with_unmarked_source`). Missing: the list is absent, or a row has the field absent. |



#### Section: script_for_listening

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|

| `podcast_episode_script_written_for_the_ear` | script / quality gate: the script was written for listening, not adapted from dense prose | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_script_uses_short_sentences` | script: the script uses short sentences written for the ear | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_script_uses_signposts` | script: the script uses signposts written for the ear | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_script_has_no_visual_references` | script: the script contains no visual references | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_script_opens_with_main_point` | outline / script: the script opens with the point | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_script_supports_point_in_order` | outline / script: the script supports the point in order | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_script_closes_with_what_matters` | outline / script: the script closes with what matters | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_script_approved_before_narration` | script: the script was approved before narration — narration is of the approved script | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |



#### Section: narration_and_assembly_qc

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|

| `podcast_episode_narration_voice_confirmed` | narration: the narration voice was confirmed before narration | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_narration_pace_confirmed` | narration: the narration pace was confirmed before narration | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_long_script_chunked_at_section_breaks` | narration: a long script was chunked at section breaks, where the script is long | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_audio_assembled` | assembly: the episode audio was assembled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_opening_listen_back_checked` | assembly / quality gate: narration was checked by listening back to the opening | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_section_joins_listen_back_checked` | assembly / quality gate: narration was checked by listening back at the section joins | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_misreads_and_awkward_joins_fixed` | assembly: misreads and awkward joins found on listen-back were fixed before the episode was called done | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |



#### Section: show_notes_and_rights

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|

| `podcast_episode_show_notes_include_summary` | show notes: the show notes include a short summary | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_show_notes_include_main_points` | show notes: the show notes include the main points | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_show_notes_include_complete_source_list` | show notes / quality gate: the show notes include the complete source list | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

| `podcast_episode_show_notes_source_ids_match_declared_sources` | show notes: the source ids declared included in the show notes are exactly the declared source ids — none missing, none extra | Computed over the declared record. Pass: `show_notes.source_ids_included` is exactly the declared source ids — none missing, none extra. Fail: a declared source is missing from the show-notes list (named in `podcast_sources_missing_from_show_notes`) or a show-notes id is not a declared source (named in `show_notes_source_ids_not_declared_as_sources`). Missing: either list is absent, or a source row has `source_id` absent. |

| `podcast_episode_copyrighted_audio_rights_cleared_where_used` | no copyrighted audio or music use declared | Gated over the declared record. Pass: `rights.copyrighted_audio_or_music_used` is declared `false` — the check passes as not applicable (the recorded full-pass evidence text is the not-applicable text quoted here) — or the gate is `true` and `rights.right_to_copyrighted_audio_or_music_cleared` is declared `true`. Fail: the gate is `true` and the cleared field is declared `false`. Missing: the gate field is absent, or the gate is `true` and the cleared field is absent. |

| `podcast_episode_guest_releases_recorded_where_guests_present` | no guest voices declared | Gated over the declared record. Pass: `guests.guest_voices_present` is declared `false` — the check passes as not applicable (the recorded full-pass evidence text is the not-applicable text quoted here) — or the gate is `true` and `guests.releases_recorded_for_all_guests` is declared `true`. Fail: the gate is `true` and the releases field is declared `false`. Missing: the gate field is absent, or the gate is `true` and the releases field is absent. |



#### Section: publishing_and_disclosure

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|

| `podcast_episode_publishing_authorization_recorded_where_planned` | no publishing or scheduling declared planned | Gated over the declared record. Pass: `publishing.publishing_or_scheduling_planned` is declared `false` — the check passes as not applicable (the recorded full-pass evidence text is the not-applicable text quoted here) — or the gate is `true` and `publishing.authorization_recorded_for_this_episode` is declared `true`. Fail: the gate is `true` and the authorization field is declared `false`. Missing: the gate field is absent, or the gate is `true` and the authorization field is absent. |

| `podcast_episode_publishing_destination_matches_authorization_where_planned` | no publishing or scheduling declared planned | Gated over the declared record. Pass: `publishing.publishing_or_scheduling_planned` is declared `false` — the check passes as not applicable (the recorded full-pass evidence text is the not-applicable text quoted here) — or the gate is `true` and `publishing.destination_matches_authorized_scope` is declared `true`. Fail: the gate is `true` and the destination field is declared `false`. Missing: the gate field is absent, or the gate is `true` and the destination field is absent. |

| `podcast_episode_publishing_timing_matches_authorization_where_planned` | no publishing or scheduling declared planned | Gated over the declared record. Pass: `publishing.publishing_or_scheduling_planned` is declared `false` — the check passes as not applicable (the recorded full-pass evidence text is the not-applicable text quoted here) — or the gate is `true` and `publishing.timing_matches_authorized_scope` is declared `true`. Fail: the gate is `true` and the timing field is declared `false`. Missing: the gate field is absent, or the gate is `true` and the timing field is absent. |

| `podcast_episode_ai_narration_disclosed_where_ai_narrated` | no AI narration declared | Gated over the declared record. Pass: `narration.ai_narrated` is declared `false` — the check passes as not applicable (the recorded full-pass evidence text is the not-applicable text quoted here) — or the gate is `true` and `publishing.ai_narration_disclosure_made` is declared `true`. Fail: the gate is `true` and the disclosure field is declared `false`. Missing: the gate field is absent, or the gate is `true` and the disclosure field is absent. |



#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|

| `podcast_episode_free_of_fabricated_quote_statistic_or_source` | red line: no fabricated quote, statistic or source is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

| `podcast_episode_free_of_words_attributed_beyond_source` | red line: no words are attributed to a person that the source does not show them saying | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

| `podcast_episode_free_of_publishing_beyond_authorized_scope` | red line: no publishing or scheduling beyond the scope authorized for this episode is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

| `podcast_episode_free_of_ai_narration_presented_as_human_without_disclosure` | red line: no AI-narrated episode presented as a human recording without disclosure is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

| `podcast_episode_free_of_copyrighted_audio_without_clear_right` | red line: no copyrighted audio or music used without a clear right to it is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |



### Output format

HTTP 200 returns one JSON object:

- `service` (`"sourced-podcast-episode-production"`), `atom_version` (`"0.1.0"`), and `episode_title` (the manifest's declared episode title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `episode_outline_sections_count`, `podcast_sources_count` and `podcast_claims_count` (each the declared list length as an integer, or null when the list is not declared); the duplicate-id lists `duplicate_episode_outline_section_ids`, `duplicate_podcast_source_ids` and `duplicate_podcast_claim_ids` (ids declared on more than one row, in the order their second occurrence appears); the row-name lists `episode_outline_sections_without_purpose`, `episode_outline_sections_not_supporting_main_point`, `podcast_sources_without_citation`, `podcast_claims_with_invalid_kind`, `podcast_claims_with_unknown_source_reference`, `podcast_claims_with_unmarked_source`, `podcast_sources_missing_from_show_notes` and `show_notes_source_ids_not_declared_as_sources` (rows whose field is present but not satisfied; a row with the field absent is missing evidence and does not appear in the corresponding purpose / support / citation / kind / traced / marked lists) — the duplicate and row-name lists are null when the list they are computed from is not declared, as recorded in the sparse case (SERVICE.md states no null rule for these lists; this document follows the recorded sparse response where SERVICE.md is silent); and the ratios `outline_section_support_ratio` (sections declared to support the main point ÷ declared sections), `source_citation_ratio` (sources with a recorded citation ÷ declared sources), `traced_claim_ratio` (claims both traced to a declared source and marked in the script ÷ declared claims) and `show_notes_source_coverage_ratio` (declared sources appearing in the show-notes source list ÷ declared sources) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty, and the show-notes coverage ratio is also null when the show-notes source list is not declared. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; comparisons use the unrounded values — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "52 pass, 0 fail, 0 missing of 52 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared episode title value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `EPISODE_PRODUCTION_SOUND` — all 52 checks pass: the declared episode production record is complete and consistent with the bound skill's method, quality gates and red lines.
- `EPISODE_PRODUCTION_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the thirteen primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for a gated check, the gate being declared `false` also passes, as not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `episode_outline_sections_count`, `podcast_sources_count`, `podcast_claims_count`, `duplicate_episode_outline_section_ids`, `duplicate_podcast_source_ids`, `duplicate_podcast_claim_ids`, `episode_outline_sections_without_purpose`, `episode_outline_sections_not_supporting_main_point`, `podcast_sources_without_citation`, `podcast_claims_with_invalid_kind`, `podcast_claims_with_unknown_source_reference`, `podcast_claims_with_unmarked_source`, `podcast_sources_missing_from_show_notes`, `show_notes_source_ids_not_declared_as_sources`, `outline_section_support_ratio`, `source_citation_ratio`, `traced_claim_ratio`, `show_notes_source_coverage_ratio` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"scoping","detail":"scoping must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Research, script, and produce a podcast episode or narrated briefing grounded in traceable sources — scope, script, narrate, and document an episode where every claim traces to a source in the notes (the bound capability, from the skill). You submit one declared record — the episode production manifest, made from the production as actually carried out — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 7 sections (`episode_scoping_and_outline`, `sources_and_claim_traceability`, `script_for_listening`, `narration_and_assembly_qc`, `show_notes_and_rights`, `publishing_and_disclosure`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest siblings `long-form-authoring-pipeline`, `local-voice-stack-engineering-pack` and `meeting-decisions-and-actions-extract` (SERVICE.md, Distinct ground).

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* (33) read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* (13) are calculated from the declared rows themselves — the `episode_sections`, `sources` and `claims` lists must each be present and name at least one row, every id must be unique, every section must declare a non-empty purpose and support for the main point, every source a non-empty citation, every claim a recognised kind (`quote` / `statistic`), a `source_id` naming a declared source and its source marked in the script, and the show-notes source list must be exactly the declared source ids — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *Gated checks* (6) follow the record's own declared gate fields: when the gate is declared `false` the check passes as not applicable; when the gate field is absent the check is `missing`; when the gate is `true` the target declaration is required — copyrighted-audio rights, guest releases, publishing authorization / destination / timing, and AI-narration disclosure. Aggregation is strict: any `fail` anywhere produces `EPISODE_PRODUCTION_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `EPISODE_PRODUCTION_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are scoping, traceability, listening-form, listen-back QC, complete show notes and authorized publishing, not bars the atom can set. Declined, named: a target episode length in minutes or words, or a tolerance around it (length is checked as scoped, never measured); a minimum or maximum number of sources, claims or outline sections beyond at least one each; a source-quality, authority or recency bar for declared sources (a citation is checked as recorded, never graded); a quote/statistic accuracy bar beyond declared traceability to a declared source (the atom receives no source text and verifies nothing against the world); a sentence-length, signpost-density or reading-level bar for "written for the ear" (checked as declarations only); a loudness, sample-rate, bitrate or any other audio-quality bar for the assembled audio; a listen-back coverage bar beyond the opening and the section joins the skill names; a narration pace in words per minute; a publishing-window or scheduling-lead-time bar; any judgment that the episode is good, interesting or worth publishing (only that its declared production record contains what the skill requires). Quantities are computed and reported; the only bars on the computed rows are exact traceability and completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** episode production record: a verdict of `EPISODE_PRODUCTION_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its claims traced, its joins listened back and its publishing authorized passes those checks even if the real production did none of it. It is a completeness and consistency audit of the production record the skill requires, **not a production service, a fact-check, or a guarantee that the episode is accurate or good**. Specifically: it researches nothing, writes no script, narrates nothing, assembles no audio, fetches or opens no source, verifies no citation, quote or statistic against the world, listens to nothing, and publishes or schedules nothing. It never judges whether a declared citation actually supports the claim that cites it, whether the script is well written, whether the narration sounds right, or whether the episode should be published — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: the skill's research step itself; script writing itself; narration generation itself; audio assembly and editing itself; working through long source documents; and publishing or scheduling execution itself — each is excluded by name, carried as caller declarations only. Boundary cases, named: an episode with genuinely no quote and no statistic cannot pass this record format's claims-declared check (the format requires at least one traced claim row — such an episode is outside this atom's computed reach, not failed on its merits); guest releases are a gated declaration in this record (the bound skill names no guest step — releases are required only where the caller declares guest voices present, and the atom judges no release's legal sufficiency); rights clearances likewise are declared presence only, never a legal judgment.

**Buyer and use context.** Teams and agents working in Writing & documents who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Narrated briefings for content sites (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared episode production record; SERVICE.md's U-13 screen is (a) No outright, stating that its output could not read as regulated professional advice — it audits a declared record for completeness and consistency against a podcast-production skill, offering no engineering-practice, financial, securities or psychology-adjacent advice, and its rights, guest-release and AI-disclosure checks judge declared presence only, never legal sufficiency. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `sourced_podcast_episode_production` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/sourced_podcast_episode_production.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_sourced_podcast_episode_production.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/sourced-podcast-episode-production` (REST) and `POST /mcp/sourced-podcast-episode-production` (MCP, tool `sourced_podcast_episode_production`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment ac6ddba696934ceb84596876507fc08c; RC soak to 2026-11-22). Key scope: `sourced_podcast_episode_production`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment ac6ddba696934ceb84596876507fc08c) shows the atom live. This document follows the evidenced live state: live.

2. **Check names differ from input field names:** all 52 recorded check names differ from the leaf name of the input field they read — none matches a field leaf exactly. The attestation checks carry a `podcast_episode_` (and, for script / narration / show-notes checks, a further section) prefix and in places a rewording (for example `podcast_episode_topic_scoped` reads `scoping.topic_scoped`; `podcast_episode_script_checked_claim_by_claim` reads `source_work.script_checked_claim_by_claim_against_sources`; `podcast_episode_long_script_chunked_at_section_breaks` reads `narration.long_script_chunked_at_section_breaks_where_long`; `podcast_episode_show_notes_include_summary` reads `show_notes.summary_included`). The 13 computed checks read the declared rows rather than any single input field of the same name (for example `every_podcast_claim_kind_recognised` reads rows' `claim_kind`, and `podcast_episode_show_notes_source_ids_match_declared_sources` reads `show_notes.source_ids_included` against the `sources` rows). The 6 gated checks name their gate and target jointly (for example `podcast_episode_ai_narration_disclosed_where_ai_narrated` reads gate `narration.ai_narrated` and target `publishing.ai_narration_disclosure_made`). In `red_lines` all five recorded check names are `podcast_episode_free_of_…` forms of their `…_present` fields. Recorded check names are used verbatim in the Checks section.

3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`scoping`, `source_work`, `script`, `narration`, `show_notes`, `rights`, `guests`, `publishing`, `red_lines`) or for a row object (`episode_sections[]`, `sources[]`, `claims[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the lists, in the recorded MCP `inputSchema`, and are said so there.

4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 52 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.

5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, the three counts (`episode_outline_sections_count`, `podcast_sources_count`, `podcast_claims_count`) and the four ratios, but does not state a null rule for the duplicate-id lists (`duplicate_episode_outline_section_ids`, `duplicate_podcast_source_ids`, `duplicate_podcast_claim_ids`) or for the eight row-name lists. The recorded sparse response returns all of them as `null` when the list they are computed from is not declared (as the Output format section records); this document follows the recording.

6. **Section grouping vs input objects:** four recorded sections each merge more than one input object — `scoping` and `episode_sections` inputs are both read by the single recorded section `episode_scoping_and_outline`; `source_work`, `sources` and `claims` inputs by `sources_and_claim_traceability`; `show_notes`, `rights` and `guests` inputs by `show_notes_and_rights`; and `publishing_and_disclosure` reads the `publishing` object plus the gate field `narration.ai_narrated`, whose `narration` object is otherwise read by `narration_and_assembly_qc`. The other three recorded sections map one-to-one onto their input objects (`script` → `script_for_listening`, `narration` (except `ai_narrated`) → `narration_and_assembly_qc`, `red_lines` → `red_lines`). This document groups the Input reference and the Checks by the recorded section names.

7. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (7 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named three computed row-name lists — `episode_outline_sections_not_supporting_main_point`, `podcast_claims_with_invalid_kind` and `podcast_claims_with_unknown_source_reference` — and a section name, `red_lines`, instead of exact check names (R1 ×4); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); and the designed violations input was missing key paths present in the full-pass manifest (R3 ×1). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.

## Worked examples

Provenance: recorded 2026-11-16T12:27:05.600305+00:00 against gateway v1.1.0, external verification battery Wave 15, source `verification/work/sourced-podcast-episode-production/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T12:27:05.600305+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/sourced-podcast-episode-production/evidence.json`.

Input:

```json
{
  "episode_title": "The Future of AI",
  "scoping": {
    "topic_scoped": true,
    "audience_scoped": true,
    "target_length_scoped": true,
    "main_point_scoped": true,
    "distribution_intent_confirmed": true,
    "scoped_before_writing": true
  },
  "episode_sections": [
    {
      "section_id": "s1",
      "purpose": "Introduce the main point",
      "supports_main_point": true
    }
  ],
  "source_work": {
    "sources_collected_before_writing": true,
    "source_list_kept_beside_draft": true,
    "script_checked_claim_by_claim_against_sources": true,
    "unsupported_claims_cut_or_softened": true
  },
  "sources": [
    {
      "source_id": "src1",
      "citation": "https://example.com/report"
    }
  ],
  "claims": [
    {
      "claim_id": "c1",
      "claim_kind": "statistic",
      "source_id": "src1",
      "source_marked_in_script": true
    }
  ],
  "script": {
    "written_for_the_ear": true,
    "uses_short_sentences": true,
    "uses_signposts": true,
    "has_no_visual_references": true,
    "opens_with_main_point": true,
    "supports_point_in_order": true,
    "closes_with_what_matters": true,
    "approved_before_narration": true
  },
  "narration": {
    "voice_confirmed": true,
    "pace_confirmed": true,
    "long_script_chunked_at_section_breaks_where_long": true,
    "audio_assembled": true,
    "opening_listen_back_checked": true,
    "section_joins_listen_back_checked": true,
    "misreads_and_awkward_joins_fixed": true,
    "ai_narrated": false
  },
  "show_notes": {
    "summary_included": true,
    "main_points_included": true,
    "complete_source_list_included": true,
    "source_ids_included": [
      "src1"
    ]
  },
  "rights": {
    "copyrighted_audio_or_music_used": false
  },
  "guests": {
    "guest_voices_present": false
  },
  "publishing": {
    "publishing_or_scheduling_planned": false
  },
  "red_lines": {
    "fabricated_quote_statistic_or_source_present": false,
    "words_attributed_beyond_source_present": false,
    "publishing_beyond_authorized_scope_present": false,
    "ai_narration_presented_as_human_without_disclosure_present": false,
    "copyrighted_audio_without_clear_right_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "sourced-podcast-episode-production",
  "atom_version": "0.1.0",
  "episode_title": "The Future of AI",
  "verdict": "EPISODE_PRODUCTION_SOUND",
  "sections": {
    "episode_scoping_and_outline": "pass",
    "sources_and_claim_traceability": "pass",
    "script_for_listening": "pass",
    "narration_and_assembly_qc": "pass",
    "show_notes_and_rights": "pass",
    "publishing_and_disclosure": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_topic_scoped",
      "status": "pass",
      "evidence": "scoping: the episode topic was scoped before writing"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_audience_scoped",
      "status": "pass",
      "evidence": "scoping: the episode audience was scoped before writing"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_target_length_scoped",
      "status": "pass",
      "evidence": "scoping: the episode target length was scoped before writing"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_main_point_scoped",
      "status": "pass",
      "evidence": "scoping: the episode's single main point was scoped before writing"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_distribution_intent_confirmed",
      "status": "pass",
      "evidence": "scoping: whether the episode is for the caller alone or for publishing later was confirmed"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_scoped_before_writing",
      "status": "pass",
      "evidence": "scoping / quality gate: topic, audience, length and main point were scoped before writing began"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_outline_sections_list_declared",
      "status": "pass",
      "evidence": "outline: the declared record names its episode outline sections — the list is present and names at least one section; an absent list is missing evidence and an empty list declares no outline at all"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "every_podcast_episode_outline_section_id_unique",
      "status": "pass",
      "evidence": "outline sections: no declared section_id is owned by more than one row"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "every_podcast_episode_outline_section_purpose_declared",
      "status": "pass",
      "evidence": "outline: every declared section declares a non-empty purpose — each section earns its place"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "every_podcast_episode_outline_section_supports_main_point",
      "status": "pass",
      "evidence": "outline: every declared section is declared to support the episode's single main point"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "podcast_episode_sources_collected_before_writing",
      "status": "pass",
      "evidence": "research: sources were collected before writing anything"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "podcast_episode_source_list_kept_beside_draft",
      "status": "pass",
      "evidence": "research: the source list was kept beside the draft from the first line onward"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "podcast_episode_script_checked_claim_by_claim",
      "status": "pass",
      "evidence": "claim check: the script was checked claim by claim against the source list"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "podcast_episode_unsupported_claims_cut_or_softened",
      "status": "pass",
      "evidence": "claim check: anything no collected source supports was cut or softened"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "podcast_episode_sources_list_declared",
      "status": "pass",
      "evidence": "sources: the declared record names its sources — the list is present and names at least one source; an absent list is missing evidence and an empty list declares no sourced episode at all"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "every_podcast_source_id_unique",
      "status": "pass",
      "evidence": "sources: no declared source_id is owned by more than one row"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "every_podcast_source_citation_recorded",
      "status": "pass",
      "evidence": "sources: every declared source declares a non-empty citation or link as recorded"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "podcast_episode_claims_list_declared",
      "status": "pass",
      "evidence": "claims: the declared record names its quote and statistic claim rows — the list is present and names at least one claim; an absent list is missing evidence and an empty list declares no traced claims at all"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "every_podcast_claim_id_unique",
      "status": "pass",
      "evidence": "claims: no declared claim_id is owned by more than one row"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "every_podcast_claim_kind_recognised",
      "status": "pass",
      "evidence": "claims: every declared claim's kind is one of quote, statistic — the two kinds the skill requires to be marked with a source"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "every_podcast_claim_traced_to_declared_source",
      "status": "pass",
      "evidence": "claims / quality gate: every declared quote and statistic traces to a source_id named in the declared source list"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "every_podcast_claim_source_marked_in_script",
      "status": "pass",
      "evidence": "claims: every declared quote and statistic is marked in the script with the source it came from"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_written_for_the_ear",
      "status": "pass",
      "evidence": "script / quality gate: the script was written for listening, not adapted from dense prose"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_uses_short_sentences",
      "status": "pass",
      "evidence": "script: the script uses short sentences written for the ear"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_uses_signposts",
      "status": "pass",
      "evidence": "script: the script uses signposts written for the ear"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_has_no_visual_references",
      "status": "pass",
      "evidence": "script: the script contains no visual references"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_opens_with_main_point",
      "status": "pass",
      "evidence": "outline / script: the script opens with the point"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_supports_point_in_order",
      "status": "pass",
      "evidence": "outline / script: the script supports the point in order"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_closes_with_what_matters",
      "status": "pass",
      "evidence": "outline / script: the script closes with what matters"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_approved_before_narration",
      "status": "pass",
      "evidence": "script: the script was approved before narration — narration is of the approved script"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_narration_voice_confirmed",
      "status": "pass",
      "evidence": "narration: the narration voice was confirmed before narration"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_narration_pace_confirmed",
      "status": "pass",
      "evidence": "narration: the narration pace was confirmed before narration"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_long_script_chunked_at_section_breaks",
      "status": "pass",
      "evidence": "narration: a long script was chunked at section breaks, where the script is long"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_audio_assembled",
      "status": "pass",
      "evidence": "assembly: the episode audio was assembled"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_opening_listen_back_checked",
      "status": "pass",
      "evidence": "assembly / quality gate: narration was checked by listening back to the opening"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_section_joins_listen_back_checked",
      "status": "pass",
      "evidence": "assembly / quality gate: narration was checked by listening back at the section joins"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_misreads_and_awkward_joins_fixed",
      "status": "pass",
      "evidence": "assembly: misreads and awkward joins found on listen-back were fixed before the episode was called done"
    },
    {
      "section": "show_notes_and_rights",
      "check": "podcast_episode_show_notes_include_summary",
      "status": "pass",
      "evidence": "show notes: the show notes include a short summary"
    },
    {
      "section": "show_notes_and_rights",
      "check": "podcast_episode_show_notes_include_main_points",
      "status": "pass",
      "evidence": "show notes: the show notes include the main points"
    },
    {
      "section": "show_notes_and_rights",
      "check": "podcast_episode_show_notes_include_complete_source_list",
      "status": "pass",
      "evidence": "show notes / quality gate: the show notes include the complete source list"
    },
    {
      "section": "show_notes_and_rights",
      "check": "podcast_episode_show_notes_source_ids_match_declared_sources",
      "status": "pass",
      "evidence": "show notes: the source ids declared included in the show notes are exactly the declared source ids — none missing, none extra"
    },
    {
      "section": "show_notes_and_rights",
      "check": "podcast_episode_copyrighted_audio_rights_cleared_where_used",
      "status": "pass",
      "evidence": "no copyrighted audio or music use declared"
    },
    {
      "section": "show_notes_and_rights",
      "check": "podcast_episode_guest_releases_recorded_where_guests_present",
      "status": "pass",
      "evidence": "no guest voices declared"
    },
    {
      "section": "publishing_and_disclosure",
      "check": "podcast_episode_publishing_authorization_recorded_where_planned",
      "status": "pass",
      "evidence": "no publishing or scheduling declared planned"
    },
    {
      "section": "publishing_and_disclosure",
      "check": "podcast_episode_publishing_destination_matches_authorization_where_planned",
      "status": "pass",
      "evidence": "no publishing or scheduling declared planned"
    },
    {
      "section": "publishing_and_disclosure",
      "check": "podcast_episode_publishing_timing_matches_authorization_where_planned",
      "status": "pass",
      "evidence": "no publishing or scheduling declared planned"
    },
    {
      "section": "publishing_and_disclosure",
      "check": "podcast_episode_ai_narration_disclosed_where_ai_narrated",
      "status": "pass",
      "evidence": "no AI narration declared"
    },
    {
      "section": "red_lines",
      "check": "podcast_episode_free_of_fabricated_quote_statistic_or_source",
      "status": "pass",
      "evidence": "red line: no fabricated quote, statistic or source is present in the record"
    },
    {
      "section": "red_lines",
      "check": "podcast_episode_free_of_words_attributed_beyond_source",
      "status": "pass",
      "evidence": "red line: no words are attributed to a person that the source does not show them saying"
    },
    {
      "section": "red_lines",
      "check": "podcast_episode_free_of_publishing_beyond_authorized_scope",
      "status": "pass",
      "evidence": "red line: no publishing or scheduling beyond the scope authorized for this episode is present in the record"
    },
    {
      "section": "red_lines",
      "check": "podcast_episode_free_of_ai_narration_presented_as_human_without_disclosure",
      "status": "pass",
      "evidence": "red line: no AI-narrated episode presented as a human recording without disclosure is present in the record"
    },
    {
      "section": "red_lines",
      "check": "podcast_episode_free_of_copyrighted_audio_without_clear_right",
      "status": "pass",
      "evidence": "red line: no copyrighted audio or music used without a clear right to it is present in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "episode_outline_sections_count": 1,
  "podcast_sources_count": 1,
  "podcast_claims_count": 1,
  "duplicate_episode_outline_section_ids": [],
  "duplicate_podcast_source_ids": [],
  "duplicate_podcast_claim_ids": [],
  "episode_outline_sections_without_purpose": [],
  "episode_outline_sections_not_supporting_main_point": [],
  "podcast_sources_without_citation": [],
  "podcast_claims_with_invalid_kind": [],
  "podcast_claims_with_unknown_source_reference": [],
  "podcast_claims_with_unmarked_source": [],
  "podcast_sources_missing_from_show_notes": [],
  "show_notes_source_ids_not_declared_as_sources": [],
  "outline_section_support_ratio": "1.000000",
  "source_citation_ratio": "1.000000",
  "traced_claim_ratio": "1.000000",
  "show_notes_source_coverage_ratio": "1.000000",
  "summary": "52 pass, 0 fail, 0 missing of 52 checks across seven sections.",
  "stamp": "SOURCED PODCAST EPISODE PRODUCTION\nepisode_title: The Future of AI\nVERDICT: EPISODE_PRODUCTION_SOUND\n  episode_scoping_and_outline                  pass\n  sources_and_claim_traceability               pass\n  script_for_listening                         pass\n  narration_and_assembly_qc                    pass\n  show_notes_and_rights                        pass\n  publishing_and_disclosure                    pass\n  red_lines                                    pass\n52 pass, 0 fail, 0 missing of 52 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T12:27:05.600305+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/sourced-podcast-episode-production/evidence.json`.

Input:

```json
{
  "episode_title": "The Future of AI",
  "scoping": {
    "topic_scoped": true,
    "audience_scoped": true,
    "target_length_scoped": true,
    "main_point_scoped": true,
    "distribution_intent_confirmed": true,
    "scoped_before_writing": true
  },
  "episode_sections": [
    {
      "section_id": "s1",
      "purpose": "Introduce the main point",
      "supports_main_point": false
    }
  ],
  "source_work": {
    "sources_collected_before_writing": true,
    "source_list_kept_beside_draft": true,
    "script_checked_claim_by_claim_against_sources": true,
    "unsupported_claims_cut_or_softened": true
  },
  "sources": [
    {
      "source_id": "src1",
      "citation": "https://example.com/report"
    }
  ],
  "claims": [
    {
      "claim_id": "c1",
      "claim_kind": "invalid_kind",
      "source_id": "src2",
      "source_marked_in_script": true
    }
  ],
  "script": {
    "written_for_the_ear": true,
    "uses_short_sentences": true,
    "uses_signposts": true,
    "has_no_visual_references": true,
    "opens_with_main_point": true,
    "supports_point_in_order": true,
    "closes_with_what_matters": true,
    "approved_before_narration": true
  },
  "narration": {
    "voice_confirmed": true,
    "pace_confirmed": true,
    "long_script_chunked_at_section_breaks_where_long": true,
    "audio_assembled": true,
    "opening_listen_back_checked": true,
    "section_joins_listen_back_checked": true,
    "misreads_and_awkward_joins_fixed": true,
    "ai_narrated": false
  },
  "show_notes": {
    "summary_included": true,
    "main_points_included": true,
    "complete_source_list_included": true,
    "source_ids_included": [
      "src1"
    ]
  },
  "rights": {
    "copyrighted_audio_or_music_used": false
  },
  "guests": {
    "guest_voices_present": false
  },
  "publishing": {
    "publishing_or_scheduling_planned": false
  },
  "red_lines": {
    "fabricated_quote_statistic_or_source_present": true,
    "words_attributed_beyond_source_present": false,
    "publishing_beyond_authorized_scope_present": false,
    "ai_narration_presented_as_human_without_disclosure_present": false,
    "copyrighted_audio_without_clear_right_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "sourced-podcast-episode-production",
  "atom_version": "0.1.0",
  "episode_title": "The Future of AI",
  "verdict": "EPISODE_PRODUCTION_NOT_SOUND",
  "sections": {
    "episode_scoping_and_outline": "fail",
    "sources_and_claim_traceability": "fail",
    "script_for_listening": "pass",
    "narration_and_assembly_qc": "pass",
    "show_notes_and_rights": "pass",
    "publishing_and_disclosure": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_topic_scoped",
      "status": "pass",
      "evidence": "scoping: the episode topic was scoped before writing"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_audience_scoped",
      "status": "pass",
      "evidence": "scoping: the episode audience was scoped before writing"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_target_length_scoped",
      "status": "pass",
      "evidence": "scoping: the episode target length was scoped before writing"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_main_point_scoped",
      "status": "pass",
      "evidence": "scoping: the episode's single main point was scoped before writing"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_distribution_intent_confirmed",
      "status": "pass",
      "evidence": "scoping: whether the episode is for the caller alone or for publishing later was confirmed"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_scoped_before_writing",
      "status": "pass",
      "evidence": "scoping / quality gate: topic, audience, length and main point were scoped before writing began"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "podcast_episode_outline_sections_list_declared",
      "status": "pass",
      "evidence": "outline: the declared record names its episode outline sections — the list is present and names at least one section; an absent list is missing evidence and an empty list declares no outline at all"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "every_podcast_episode_outline_section_id_unique",
      "status": "pass",
      "evidence": "outline sections: no declared section_id is owned by more than one row"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "every_podcast_episode_outline_section_purpose_declared",
      "status": "pass",
      "evidence": "outline: every declared section declares a non-empty purpose — each section earns its place"
    },
    {
      "section": "episode_scoping_and_outline",
      "check": "every_podcast_episode_outline_section_supports_main_point",
      "status": "fail",
      "evidence": "outline: every declared section is declared to support the episode's single main point"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "podcast_episode_sources_collected_before_writing",
      "status": "pass",
      "evidence": "research: sources were collected before writing anything"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "podcast_episode_source_list_kept_beside_draft",
      "status": "pass",
      "evidence": "research: the source list was kept beside the draft from the first line onward"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "podcast_episode_script_checked_claim_by_claim",
      "status": "pass",
      "evidence": "claim check: the script was checked claim by claim against the source list"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "podcast_episode_unsupported_claims_cut_or_softened",
      "status": "pass",
      "evidence": "claim check: anything no collected source supports was cut or softened"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "podcast_episode_sources_list_declared",
      "status": "pass",
      "evidence": "sources: the declared record names its sources — the list is present and names at least one source; an absent list is missing evidence and an empty list declares no sourced episode at all"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "every_podcast_source_id_unique",
      "status": "pass",
      "evidence": "sources: no declared source_id is owned by more than one row"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "every_podcast_source_citation_recorded",
      "status": "pass",
      "evidence": "sources: every declared source declares a non-empty citation or link as recorded"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "podcast_episode_claims_list_declared",
      "status": "pass",
      "evidence": "claims: the declared record names its quote and statistic claim rows — the list is present and names at least one claim; an absent list is missing evidence and an empty list declares no traced claims at all"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "every_podcast_claim_id_unique",
      "status": "pass",
      "evidence": "claims: no declared claim_id is owned by more than one row"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "every_podcast_claim_kind_recognised",
      "status": "fail",
      "evidence": "claims: every declared claim's kind is one of quote, statistic — the two kinds the skill requires to be marked with a source"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "every_podcast_claim_traced_to_declared_source",
      "status": "fail",
      "evidence": "claims / quality gate: every declared quote and statistic traces to a source_id named in the declared source list"
    },
    {
      "section": "sources_and_claim_traceability",
      "check": "every_podcast_claim_source_marked_in_script",
      "status": "pass",
      "evidence": "claims: every declared quote and statistic is marked in the script with the source it came from"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_written_for_the_ear",
      "status": "pass",
      "evidence": "script / quality gate: the script was written for listening, not adapted from dense prose"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_uses_short_sentences",
      "status": "pass",
      "evidence": "script: the script uses short sentences written for the ear"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_uses_signposts",
      "status": "pass",
      "evidence": "script: the script uses signposts written for the ear"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_has_no_visual_references",
      "status": "pass",
      "evidence": "script: the script contains no visual references"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_opens_with_main_point",
      "status": "pass",
      "evidence": "outline / script: the script opens with the point"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_supports_point_in_order",
      "status": "pass",
      "evidence": "outline / script: the script supports the point in order"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_closes_with_what_matters",
      "status": "pass",
      "evidence": "outline / script: the script closes with what matters"
    },
    {
      "section": "script_for_listening",
      "check": "podcast_episode_script_approved_before_narration",
      "status": "pass",
      "evidence": "script: the script was approved before narration — narration is of the approved script"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_narration_voice_confirmed",
      "status": "pass",
      "evidence": "narration: the narration voice was confirmed before narration"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_narration_pace_confirmed",
      "status": "pass",
      "evidence": "narration: the narration pace was confirmed before narration"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_long_script_chunked_at_section_breaks",
      "status": "pass",
      "evidence": "narration: a long script was chunked at section breaks, where the script is long"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_audio_assembled",
      "status": "pass",
      "evidence": "assembly: the episode audio was assembled"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_opening_listen_back_checked",
      "status": "pass",
      "evidence": "assembly / quality gate: narration was checked by listening back to the opening"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_section_joins_listen_back_checked",
      "status": "pass",
      "evidence": "assembly / quality gate: narration was checked by listening back at the section joins"
    },
    {
      "section": "narration_and_assembly_qc",
      "check": "podcast_episode_misreads_and_awkward_joins_fixed",
      "status": "pass",
      "evidence": "assembly: misreads and awkward joins found on listen-back were fixed before the episode was called done"
    },
    {
      "section": "show_notes_and_rights",
      "check": "podcast_episode_show_notes_include_summary",
      "status": "pass",
      "evidence": "show notes: the show notes include a short summary"
    },
    {
      "section": "show_notes_and_rights",
      "check": "podcast_episode_show_notes_include_main_points",
      "status": "pass",
      "evidence": "show notes: the show notes include the main points"
    },
    {
      "section": "show_notes_and_rights",
      "check": "podcast_episode_show_notes_include_complete_source_list",
      "status": "pass",
      "evidence": "show notes / quality gate: the show notes include the complete source list"
    },
    {
      "section": "show_notes_and_rights",
      "check": "podcast_episode_show_notes_source_ids_match_declared_sources",
      "status": "pass",
      "evidence": "show notes: the source ids declared included in the show notes are exactly the declared source ids — none missing, none extra"
    },
    {
      "section": "show_notes_and_rights",
      "check": "podcast_episode_copyrighted_audio_rights_cleared_where_used",
      "status": "pass",
      "evidence": "no copyrighted audio or music use declared"
    },
    {
      "section": "show_notes_and_rights",
      "check": "podcast_episode_guest_releases_recorded_where_guests_present",
      "status": "pass",
      "evidence": "no guest voices declared"
    },
    {
      "section": "publishing_and_disclosure",
      "check": "podcast_episode_publishing_authorization_recorded_where_planned",
      "status": "pass",
      "evidence": "no publishing or scheduling declared planned"
    },
    {
      "section": "publishing_and_disclosure",
      "check": "podcast_episode_publishing_destination_matches_authorization_where_planned",
      "status": "pass",
      "evidence": "no publishing or scheduling declared planned"
    },
    {
      "section": "publishing_and_disclosure",
      "check": "podcast_episode_publishing_timing_matches_authorization_where_planned",
      "status": "pass",
      "evidence": "no publishing or scheduling declared planned"
    },
    {
      "section": "publishing_and_disclosure",
      "check": "podcast_episode_ai_narration_disclosed_where_ai_narrated",
      "status": "pass",
      "evidence": "no AI narration declared"
    },
    {
      "section": "red_lines",
      "check": "podcast_episode_free_of_fabricated_quote_statistic_or_source",
      "status": "fail",
      "evidence": "red line: no fabricated quote, statistic or source is present in the record"
    },
    {
      "section": "red_lines",
      "check": "podcast_episode_free_of_words_attributed_beyond_source",
      "status": "pass",
      "evidence": "red line: no words are attributed to a person that the source does not show them saying"
    },
    {
      "section": "red_lines",
      "check": "podcast_episode_free_of_publishing_beyond_authorized_scope",
      "status": "pass",
      "evidence": "red line: no publishing or scheduling beyond the scope authorized for this episode is present in the record"
    },
    {
      "section": "red_lines",
      "check": "podcast_episode_free_of_ai_narration_presented_as_human_without_disclosure",
      "status": "pass",
      "evidence": "red line: no AI-narrated episode presented as a human recording without disclosure is present in the record"
    },
    {
      "section": "red_lines",
      "check": "podcast_episode_free_of_copyrighted_audio_without_clear_right",
      "status": "pass",
      "evidence": "red line: no copyrighted audio or music used without a clear right to it is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "episode_outline_sections_count": 1,
  "podcast_sources_count": 1,
  "podcast_claims_count": 1,
  "duplicate_episode_outline_section_ids": [],
  "duplicate_podcast_source_ids": [],
  "duplicate_podcast_claim_ids": [],
  "episode_outline_sections_without_purpose": [],
  "episode_outline_sections_not_supporting_main_point": [
    "s1"
  ],
  "podcast_sources_without_citation": [],
  "podcast_claims_with_invalid_kind": [
    "c1"
  ],
  "podcast_claims_with_unknown_source_reference": [
    "c1"
  ],
  "podcast_claims_with_unmarked_source": [],
  "podcast_sources_missing_from_show_notes": [],
  "show_notes_source_ids_not_declared_as_sources": [],
  "outline_section_support_ratio": "0.000000",
  "source_citation_ratio": "1.000000",
  "traced_claim_ratio": "0.000000",
  "show_notes_source_coverage_ratio": "1.000000",
  "summary": "48 pass, 4 fail, 0 missing of 52 checks across seven sections.",
  "stamp": "SOURCED PODCAST EPISODE PRODUCTION\nepisode_title: The Future of AI\nVERDICT: EPISODE_PRODUCTION_NOT_SOUND\n  episode_scoping_and_outline                  fail\n  sources_and_claim_traceability               fail\n  script_for_listening                         pass\n  narration_and_assembly_qc                    pass\n  show_notes_and_rights                        pass\n  publishing_and_disclosure                    pass\n  red_lines                                    fail\n48 pass, 4 fail, 0 missing of 52 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T12:27:05.600305+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/sourced-podcast-episode-production/evidence.json`.

Input:

```json
{
  "episode_title": "Malformed",
  "scoping": "not_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scoping",
  "detail": "scoping must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|

| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |

| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — a declared-record audit; SERVICE.md's U-13 screen is (a) No outright (declared-record audit; screen states No outright), so no regulator role view is provided for this atom (see Role views) |

| Checks named | 52 documented / 52 recorded in the full-pass response |

| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (the three counts, the three duplicate-id lists, the eight row-name lists and the four ratios) |

| Input reference typed | Yes — 69 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |

| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/sourced-podcast-episode-production/evidence.json` |
