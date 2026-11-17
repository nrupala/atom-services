# Sourced podcast episode production — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are producing one podcast episode or narrated briefing and you keep a production record for it in which every claim traces to a source in the notes. This atom reads one declared episode production record and returns one deterministic verdict across seven sections (episode_scoping_and_outline, sources_and_claim_traceability, script_for_listening, narration_and_assembly_qc, show_notes_and_rights, publishing_and_disclosure, red_lines): **EPISODE_PRODUCTION_SOUND**, **EPISODE_PRODUCTION_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 52 checks. It audits the declared production record's completeness and internal consistency only — it researches nothing, writes no script, narrates nothing, assembles no audio, fetches or opens no source, verifies no citation, quote or statistic against the world, listens to nothing, and publishes or schedules nothing. An episode is sound *on your declared evidence*: a record that declares its claims traced, its joins listened back and its publishing authorized passes those checks even if the real production did none of it. It is not a production service, a fact-check, or a guarantee that the episode is accurate or good: it never judges whether a declared citation actually supports the claim that cites it, whether the script is well written, whether the narration sounds right, or whether the episode should be published — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. The skill's red lines are checks here, not features: no fabricated quote, statistic or source, no words attributed beyond what a source shows, no publishing beyond the authorized scope, no AI narration presented as human without disclosure, and no copyrighted audio without a clear right are ever performed — the atom audits the record of the production you have already carried out. The computed checks: the declared `episode_sections` list must be present and name at least one section, with unique `section_id` values, a non-empty `purpose` on every row, and every row declared to support the main point; the declared `sources` list must be present and name at least one source, with unique `source_id` values and a non-empty `citation` on every row; the declared `claims` list must be present and name at least one row, with unique `claim_id` values, every `claim_kind` one of `quote` or `statistic`, every claim's `source_id` naming a declared source, and every claim declared marked with its source in the script; and the declared `show_notes.source_ids_included` list must be exactly the declared source ids — none missing, none extra. Six further checks are gated on the record's own declared gate fields — when the gate is declared `false` the check passes as not applicable, when the gate field is absent the check is missing evidence, and when the gate is `true` the target declaration is required: a clear right is required only where copyrighted audio or music use is declared, guest releases only where guest voices are declared, publishing authorization, destination and timing each only where publishing or scheduling is declared planned, and AI-narration disclosure only where AI narration is declared. No numeric threshold is imposed — no target episode length in minutes or words, or a tolerance around it (length is checked as scoped, never measured); no minimum or maximum number of sources, claims or outline sections beyond at least one each; no source-quality, authority or recency bar for declared sources (a citation is checked as recorded, never graded); no quote/statistic accuracy bar beyond declared traceability to a declared source (the atom receives no source text and verifies nothing against the world); no sentence-length, signpost-density or reading-level bar for "written for the ear" (checked as declarations only); no loudness, sample-rate, bitrate or any other audio-quality bar for the assembled audio; no listen-back coverage bar beyond the opening and the section joins the skill names; no narration pace in words per minute; no publishing-window or scheduling-lead-time bar; and no judgment that the episode is good, interesting or worth publishing (only that its declared production record contains what the skill requires). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "sourced-podcast-episode-production"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/sourced-podcast-episode-production` — tool name `sourced_podcast_episode_production`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/sourced-podcast-episode-production` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `episode_title` | Episode title (string; carried into the output, not checked) |
| `scoping.topic_scoped` | episode-scoping evidence: the episode topic was scoped before writing |
| `scoping.audience_scoped` | episode-scoping evidence: the episode audience was scoped before writing |
| `scoping.target_length_scoped` | episode-scoping evidence: the episode target length was scoped before writing |
| `scoping.main_point_scoped` | episode-scoping evidence: the episode's single main point was scoped before writing |
| `scoping.distribution_intent_confirmed` | episode-scoping evidence: whether the episode is for the caller alone or for publishing later was confirmed |
| `scoping.scoped_before_writing` | episode-scoping evidence: topic, audience, length and main point were scoped before writing began |
| `episode_sections` (list of section objects) | computed: must be present and name at least one section; reported as `episode_outline_sections_count` |
| `episode_sections[].section_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `episode_sections[].purpose` (string) | computed: must be present and non-empty on every row |
| `episode_sections[].supports_main_point` | computed: must be `true` on every row |
| `source_work.sources_collected_before_writing` | source evidence: sources were collected before writing anything |
| `source_work.source_list_kept_beside_draft` | source evidence: the source list was kept beside the draft |
| `source_work.script_checked_claim_by_claim_against_sources` | source evidence: the script was checked claim by claim against the source list |
| `source_work.unsupported_claims_cut_or_softened` | source evidence: anything no collected source supports was cut or softened |
| `sources` (list of source objects) | computed: must be present and name at least one source; reported as `podcast_sources_count` |
| `sources[].source_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `sources[].citation` (string) | computed: must be present and non-empty on every row — the citation or link as recorded |
| `claims` (list of claim objects) | computed: must be present and name at least one quote/statistic claim row; reported as `podcast_claims_count` |
| `claims[].claim_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `claims[].claim_kind` (string) | computed: must be one of `quote`, `statistic` |
| `claims[].source_id` (string) | computed: must name one of the declared sources |
| `claims[].source_marked_in_script` | computed: must be `true` on every row |
| `script.written_for_the_ear` | script evidence: the script was written for listening, not adapted from dense prose |
| `script.uses_short_sentences` | script evidence: the script uses short sentences written for the ear |
| `script.uses_signposts` | script evidence: the script uses signposts written for the ear |
| `script.has_no_visual_references` | script evidence: the script contains no visual references |
| `script.opens_with_main_point` | script evidence: the script opens with the point |
| `script.supports_point_in_order` | script evidence: the script supports the point in order |
| `script.closes_with_what_matters` | script evidence: the script closes with what matters |
| `script.approved_before_narration` | script evidence: the script was approved before narration |
| `narration.voice_confirmed` | narration evidence: the narration voice was confirmed before narration |
| `narration.pace_confirmed` | narration evidence: the narration pace was confirmed before narration |
| `narration.long_script_chunked_at_section_breaks_where_long` | narration evidence: a long script was chunked at section breaks, where the script is long |
| `narration.audio_assembled` | narration evidence: the episode audio was assembled |
| `narration.opening_listen_back_checked` | narration evidence: narration was checked by listening back to the opening |
| `narration.section_joins_listen_back_checked` | narration evidence: narration was checked by listening back at the section joins |
| `narration.misreads_and_awkward_joins_fixed` | narration evidence: misreads and awkward joins found on listen-back were fixed |
| `narration.ai_narrated` | gates the AI-narration disclosure check: disclosure is required only where AI narration is declared |
| `show_notes.summary_included` | show-notes evidence: the show notes include a short summary |
| `show_notes.main_points_included` | show-notes evidence: the show notes include the main points |
| `show_notes.complete_source_list_included` | show-notes evidence: the show notes include the complete source list |
| `show_notes.source_ids_included` (list of strings) | computed: must be exactly the declared source ids — none missing, none extra |
| `rights.copyrighted_audio_or_music_used` | gates the rights check: a clear right is required only where copyrighted audio/music use is declared |
| `rights.right_to_copyrighted_audio_or_music_cleared` | required when `rights.copyrighted_audio_or_music_used` is `true`; otherwise the check passes as not applicable |
| `guests.guest_voices_present` | gates the guest-release check: releases are required only where guest voices are declared present |
| `guests.releases_recorded_for_all_guests` | required when `guests.guest_voices_present` is `true`; otherwise the check passes as not applicable |
| `publishing.publishing_or_scheduling_planned` | gates the three publishing checks: each is required only where publishing/scheduling is declared planned |
| `publishing.authorization_recorded_for_this_episode` | required when `publishing.publishing_or_scheduling_planned` is `true`; otherwise the check passes as not applicable |
| `publishing.destination_matches_authorized_scope` | gated as above: the publishing destination matches the authorization exactly |
| `publishing.timing_matches_authorized_scope` | gated as above: the publishing timing matches the authorization exactly |
| `publishing.ai_narration_disclosure_made` | required when `narration.ai_narrated` is `true`; otherwise the check passes as not applicable |
| `red_lines.fabricated_quote_statistic_or_source_present` | must be `false` to pass (red line: no fabricated quote, statistic or source) |
| `red_lines.words_attributed_beyond_source_present` | must be `false` to pass (red line: no words attributed to a person that the source does not show them saying) |
| `red_lines.publishing_beyond_authorized_scope_present` | must be `false` to pass (red line: no publishing or scheduling beyond the authorized scope) |
| `red_lines.ai_narration_presented_as_human_without_disclosure_present` | must be `false` to pass (red line: no AI-narrated episode presented as a human recording without disclosure) |
| `red_lines.copyrighted_audio_without_clear_right_present` | must be `false` to pass (red line: no copyrighted audio or music used without a clear right) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward EPISODE_PRODUCTION_NOT_SOUND). All fields are booleans or strings unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/sourced-podcast-episode-production`:

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

Response — HTTP 200 (trimmed; the full response carries all 52 checks and a text stamp of the verdict):

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
  "summary": "52 pass, 0 fail, 0 missing of 52 checks across seven sections."
}
```

## Verdicts

- **EPISODE_PRODUCTION_SOUND** — every check passes; the declared episode production record is complete and internally consistent with the skill's method, quality gates and red lines.
- **EPISODE_PRODUCTION_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `episode_outline_sections_count`, `podcast_sources_count` and `podcast_claims_count` (integers, exactly; null when the corresponding list is not declared), `duplicate_episode_outline_section_ids`, `duplicate_podcast_source_ids` and `duplicate_podcast_claim_ids` (ids carried by more than one row; each null when its list is not declared), `episode_outline_sections_without_purpose`, `episode_outline_sections_not_supporting_main_point`, `podcast_sources_without_citation`, `podcast_claims_with_invalid_kind`, `podcast_claims_with_unknown_source_reference`, `podcast_claims_with_unmarked_source`, `podcast_sources_missing_from_show_notes` and `show_notes_source_ids_not_declared_as_sources` (the offending rows for each computed rule; each null when its underlying list is not declared), `outline_section_support_ratio` (sections declared to support the main point ÷ declared sections), `source_citation_ratio` (sources with a recorded citation ÷ declared sources), `traced_claim_ratio` (claims both traced to a declared source and marked in the script ÷ declared claims) and `show_notes_source_coverage_ratio` (declared sources appearing in the show-notes source list ÷ declared sources; each ratio a string with exactly six decimal places, and null when its denominator list is absent or empty — the show-notes coverage ratio is also null when the show-notes source list is not declared), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the thirteen primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
