# Long-form authoring pipeline — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are producing long-form work — a book, course, guide or long document — systematically, and you have a record of your authoring pipeline: an approved outline, a drafting loop, recorded review passes, versioned builds, publishing and a feedback loop. This atom reads one declared manifest and returns one deterministic verdict across six sections: **AUTHORING_PIPELINE_SOUND**, **AUTHORING_PIPELINE_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it writes, drafts and edits no prose, reads no manuscript, runs no build, checks no hash or signature, and does not verify that a declared pass, approval or changelog entry actually happened. A record is sound *on your declared evidence*: it never judges prose quality, whether an outline is the right structure, whether a unit's point is worth making, or whether a review was competent. Computed checks: the declared `units` list must be present and non-empty, every unit must have a single point and a non-empty point or outcome; the declared `review_passes` list must be present and non-empty, every pass must be recorded, every pass type must be one of the skill's own set (`structure`, `technical_accuracy`, `style_read_aloud`, `facts_attribution`), and all four required pass types must be present. No numeric threshold is imposed — no word count, page count or length minimum or maximum, no number of chapters, modules or units, no number of review passes beyond the skill's own four named types, no reviewer count or qualification bar, no drafting schedule or deadline, no readability or quality score, no accuracy error rate, no build time, hash algorithm or signing standard, no sales, enrolment or completion target, and no coverage percentage below completeness. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "long-form-authoring-pipeline"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/long-form-authoring-pipeline` — tool name `long_form_authoring_pipeline`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/long-form-authoring-pipeline` — body = the manifest object; same `Authorization` header.

## Input — the authoring-pipeline manifest

| Field | Meaning |
|---|---|
| `work` | work name (string; carried into the output, not checked) |
| `outline.toc_approved_before_drafting` | outline evidence: the TOC is approved before drafting |
| `outline.chapters_or_modules_defined` | outline evidence: chapters or modules are defined |
| `outline.scope_fences_defined` | outline evidence: scope fences — what the work won't cover — are defined |
| `units` (list of unit-row objects) | computed: must be present and non-empty; reported as `units_count` |
| `units[].name` (string) | names the row in the computed outputs |
| `units[].point_or_outcome` (string) | computed: every row must declare a non-empty string; rows declaring an empty string are reported in `units_without_point_or_outcome` |
| `units[].has_single_point` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `units_without_single_point` |
| `drafting.small_units_used` | drafting evidence: drafting proceeds in small units |
| `drafting.examples_before_abstractions` | drafting evidence: examples come before abstractions |
| `drafting.style_sheet_maintained` | drafting evidence: a running style sheet is maintained |
| `drafting.glossary_maintained` | drafting evidence: a glossary is maintained |
| `review.comments_triaged_not_blind_applied` | review evidence: comments are triaged, not blindly applied |
| `review_passes` (list of review-pass-row objects) | computed: must be present and non-empty; reported as `review_passes_count` |
| `review_passes[].name` (string) | names the row in the computed outputs |
| `review_passes[].pass_type` (string) | computed: must be one of `structure`, `technical_accuracy`, `style_read_aloud`, `facts_attribution`; rows declaring any other value are reported in `review_passes_with_invalid_type`, and types not declared by any row are reported in `missing_review_pass_types` |
| `review_passes[].recorded` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `review_passes_without_record` |
| `versioning.sources_in_git_markdown` | versioning evidence: sources are in git / Markdown |
| `versioning.research_kept_separate_from_prose` | versioning evidence: research is kept separate from prose |
| `versioning.editions_tagged` | versioning evidence: editions are tagged |
| `versioning.changelog_per_edition` | versioning evidence: a changelog is kept per edition |
| `builds.deterministic_pipeline` | build evidence: the build pipeline is deterministic |
| `builds.templates_pinned` | build evidence: templates are pinned |
| `builds.preview_builds_for_reviewers` | build evidence: preview builds are produced for reviewers |
| `builds.artifacts_hashed` | build evidence: artifacts are hashed |
| `builds.artifacts_signed` | build evidence: artifacts are signed |
| `publishing.distribution_channels_defined` | publishing evidence: distribution channels are defined |
| `publishing.metadata_or_platform_setup_complete` | publishing evidence: metadata / platform setup is complete |
| `publishing.launch_checklist_completed` | publishing evidence: the launch checklist is completed |
| `publishing.sample_and_errata_pages_published` | publishing evidence: sample and errata pages are published |
| `feedback.reader_learner_feedback_collected` | feedback evidence: reader / learner feedback is collected |
| `feedback.corrections_list_maintained` | feedback evidence: a corrections list is maintained |
| `feedback.corrections_feed_next_edition` | feedback evidence: corrections feed the next edition |
| `feedback.errata_visible` | feedback evidence: errata are visible |
| `feedback.drop_off_analytics_reviewed` | feedback evidence: drop-off analytics are reviewed |
| `red_lines.published_without_accuracy_pass_present` | must be `false` to pass (red line: nothing published without an accuracy pass) |
| `red_lines.silent_edition_edits_present` | must be `false` to pass (red line: no silent edition edits) |
| `red_lines.unverified_quotes_or_attributions_present` | must be `false` to pass (red line: no unverified quotes or attributions) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward AUTHORING_PIPELINE_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/long-form-authoring-pipeline`:

```json
{
  "work": "The Art of Authoring",
  "outline": {
    "toc_approved_before_drafting": true,
    "chapters_or_modules_defined": true,
    "scope_fences_defined": true
  },
  "units": [
    {
      "name": "Intro",
      "point_or_outcome": "Understanding the pipeline",
      "has_single_point": true
    }
  ],
  "drafting": {
    "small_units_used": true,
    "examples_before_abstractions": true,
    "style_sheet_maintained": true,
    "glossary_maintained": true
  },
  "review": {
    "comments_triaged_not_blind_applied": true
  },
  "review_passes": [
    {"name": "P1", "pass_type": "structure", "recorded": true},
    {"name": "P2", "pass_type": "technical_accuracy", "recorded": true},
    {"name": "P3", "pass_type": "style_read_aloud", "recorded": true},
    {"name": "P4", "pass_type": "facts_attribution", "recorded": true}
  ],
  "versioning": {
    "sources_in_git_markdown": true,
    "research_kept_separate_from_prose": true,
    "editions_tagged": true,
    "changelog_per_edition": true
  },
  "builds": {
    "deterministic_pipeline": true,
    "templates_pinned": true,
    "preview_builds_for_reviewers": true,
    "artifacts_hashed": true,
    "artifacts_signed": true
  },
  "publishing": {
    "distribution_channels_defined": true,
    "metadata_or_platform_setup_complete": true,
    "launch_checklist_completed": true,
    "sample_and_errata_pages_published": true
  },
  "feedback": {
    "reader_learner_feedback_collected": true,
    "corrections_list_maintained": true,
    "corrections_feed_next_edition": true,
    "errata_visible": true,
    "drop_off_analytics_reviewed": true
  },
  "red_lines": {
    "published_without_accuracy_pass_present": false,
    "silent_edition_edits_present": false,
    "unverified_quotes_or_attributions_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 36 checks and a text stamp of the verdict):

```json
{
  "service": "long-form-authoring-pipeline",
  "atom_version": "0.1.0",
  "work": "The Art of Authoring",
  "verdict": "AUTHORING_PIPELINE_SOUND",
  "sections": {
    "outline_as_contract": "pass",
    "drafting_loop": "pass",
    "review_passes": "pass",
    "versioning_and_builds": "pass",
    "publishing": "pass",
    "feedback_loop_and_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "units_count": 1,
  "units_without_single_point": [],
  "single_point_coverage": "1.000000",
  "units_without_point_or_outcome": [],
  "point_or_outcome_coverage": "1.000000",
  "review_passes_count": 4,
  "review_passes_without_record": [],
  "recorded_review_pass_coverage": "1.000000",
  "review_passes_with_invalid_type": [],
  "valid_review_pass_type_coverage": "1.000000",
  "missing_review_pass_types": [],
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections."
}
```

## Verdicts

- **AUTHORING_PIPELINE_SOUND** — every check passes; the declared authoring-pipeline record is complete and consistent with the skill's checklist and red lines.
- **AUTHORING_PIPELINE_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `units_count` and `review_passes_count` (the declared list lengths as integers, or null when a list is not declared), the row-name lists `units_without_single_point`, `units_without_point_or_outcome`, `review_passes_without_record` and `review_passes_with_invalid_type` and the type list `missing_review_pass_types` (null when the relevant list is not declared; a row with the relevant field absent is missing evidence and does not appear in the first four lists), the coverage values `single_point_coverage`, `point_or_outcome_coverage`, `recorded_review_pass_coverage` and `valid_review_pass_type_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the seven primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
