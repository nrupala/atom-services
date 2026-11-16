# Decision ready research brief — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a research effort and a record of how it was run — scoping, questions, source strategy, declared sources, evidence notes, claims, synthesis, report structure, reuse, tooling and disclosure. This atom reads one declared manifest and returns one deterministic verdict across four sections: **RESEARCH_BRIEF_DECISION_READY**, **RESEARCH_BRIEF_NOT_DECISION_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared evidence's completeness and consistency only — it performs no research, fetches no source, opens no link, reads no notes, and does not verify that a declared source exists, says what its quote claims, or supports the claim that names it; nor does it judge whether a source is actually good, independent or correctly typed, whether the synthesis is sound, or whether the stated confidence is warranted. Computed checks: each declared list (`questions`, `sources`, `claims`) must be present and non-empty; every declared source row must carry a complete provenance triple (non-empty `link`, `date` and `quote`), a non-empty `source_type` and `incentives_noted: true`; every material claim must name at least one supporting source that is actually declared; every important claim must name at least two distinct supporting sources that are actually declared; every claim must declare `confidence_stated: true` and a non-empty `kind`; and `report_sections` must equal the skill's report format exactly and in order — `bluf`, `findings`, `evidence`, `risks`, `open_questions`, `sources`. Four checks are conditional: AI summaries must cite sources and be spot-checked only when AI summaries are declared in use; scraped/automated data must be quality-checked only when such data is declared in use; conflicts must be disclosed only when conflicts are declared present. No numeric threshold is imposed — no minimum source/claim/question count, no confidence scale, no timebox duration, and no freshness limit (date strings are never parsed or compared to a clock). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "decision-ready-research-brief"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/decision-ready-research-brief` — tool name `decision_ready_research_brief`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/decision-ready-research-brief` — body = the manifest object; same `Authorization` header.

## Input — the decision-ready-research-brief manifest

| Field | Meaning |
|---|---|
| `brief` | brief name (string; carried into the output, not checked) |
| `scope.decision_named` / `questions_ranked` / `timebox_declared` / `timebox_respected` / `enough_criteria_defined` | scoping evidence: the decision is named, questions are ranked, a timebox is declared and respected, "enough" criteria are defined |
| `questions` (list of `{name}` objects) | computed: must be present and non-empty; reported as `questions_count` |
| `questions[].name` (string) | names the question row |
| `source_strategy.primary_preferred_over_secondary_and_tertiary` | source strategy: primary sources preferred over secondary, and secondary over tertiary |
| `sources` (list of source-row objects) | computed: must be present and non-empty; reported as `sources_count` |
| `sources[].name` (string) | the name a claim's `supporting_source_names` entry must equal for that source to count |
| `sources[].link` / `date` / `quote` (strings) | provenance triple: each must be a non-empty string for the row to pass (an empty string fails; an absent field is missing evidence) |
| `sources[].source_type` (string) | must be a non-empty string; no vocabulary is imposed |
| `sources[].incentives_noted` | the source's incentives are noted |
| `evidence.notes_question_oriented` / `evidence_table_present` / `fact_estimate_opinion_separated` / `gaps_recorded` | evidence and notes evidence |
| `claims` (list of claim-row objects) | computed: must be present and non-empty; reported as `claims_count` |
| `claims[].name` (string) | names the claim row in the computed output lists |
| `claims[].kind` (string) | must be a non-empty string; no vocabulary is imposed (fact / estimate / opinion separation is checked as each claim being labelled) |
| `claims[].material` | gates the sourcing check: only material claims must name a supporting source |
| `claims[].important` | gates the triangulation check: only important claims must name two distinct supporting sources |
| `claims[].supporting_source_names` (list of strings) | entries count only when they equal a declared source's `name`; distinct matching names are counted |
| `claims[].confidence_stated` | the claim's confidence is stated |
| `synthesis.structured_by_question` / `opposing_view_steelmanned` / `quantified_where_possible` / `confidence_stated` / `unknowns_stated_explicitly` | synthesis evidence |
| `report_sections` (list of strings) | computed: must equal exactly, in order, `bluf`, `findings`, `evidence`, `risks`, `open_questions`, `sources` |
| `report.version` / `report.date` (strings) | each must be a non-empty string (never parsed or compared to a clock) |
| `report.open_questions_listed` | open questions are listed |
| `reuse.notes_archived_for_reuse` / `updates_via_changelog` | reuse evidence: notes archived for reuse; updates via changelog |
| `reuse.silent_edits_present` | must be `false` to pass (anti-pattern: no silent edits) |
| `tooling.automation_does_not_replace_verification` / `seo_spam_and_content_farms_screened` | tooling evidence |
| `tooling.ai_summaries_used` | gates the two AI-summary checks below |
| `tooling.ai_summaries_cite_sources` / `ai_summaries_spot_checked` | required only when `ai_summaries_used` is `true`; otherwise the checks pass as not applicable |
| `tooling.scraped_or_automated_data_used` | gates the quality check below |
| `tooling.scraped_or_automated_data_quality_checked` | required only when `scraped_or_automated_data_used` is `true`; otherwise the check passes as not applicable |
| `disclosure.conflicts_present` | gates the disclosure check below |
| `disclosure.conflicts_disclosed` | required only when `conflicts_present` is `true`; otherwise the check passes as not applicable |
| `disclosure.unsourced_claims_present` | must be `false` to pass (red line: no unsourced claims) |
| `disclosure.single_source_conclusions_on_important_facts_present` | must be `false` to pass (red line: no single-source conclusions on important facts) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward RESEARCH_BRIEF_NOT_DECISION_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/decision-ready-research-brief`:

```json
{
  "brief": "Market entry strategy",
  "scope": {
    "decision_named": true,
    "questions_ranked": true,
    "timebox_declared": true,
    "timebox_respected": true,
    "enough_criteria_defined": true
  },
  "questions": [
    {
      "name": "Q1"
    }
  ],
  "source_strategy": {
    "primary_preferred_over_secondary_and_tertiary": true
  },
  "sources": [
    {
      "name": "S1",
      "link": "http://a.com",
      "date": "2023-01-01",
      "quote": "A",
      "source_type": "primary",
      "incentives_noted": true
    },
    {
      "name": "S2",
      "link": "http://b.com",
      "date": "2023-01-01",
      "quote": "B",
      "source_type": "primary",
      "incentives_noted": true
    }
  ],
  "evidence": {
    "notes_question_oriented": true,
    "evidence_table_present": true,
    "fact_estimate_opinion_separated": true,
    "gaps_recorded": true
  },
  "claims": [
    {
      "name": "C1",
      "kind": "fact",
      "material": true,
      "important": true,
      "supporting_source_names": [
        "S1",
        "S2"
      ],
      "confidence_stated": true
    }
  ],
  "synthesis": {
    "structured_by_question": true,
    "opposing_view_steelmanned": true,
    "quantified_where_possible": true,
    "confidence_stated": true,
    "unknowns_stated_explicitly": true
  },
  "report_sections": [
    "bluf",
    "findings",
    "evidence",
    "risks",
    "open_questions",
    "sources"
  ],
  "report": {
    "version": "1.0",
    "date": "2023-01-02",
    "open_questions_listed": true
  },
  "reuse": {
    "notes_archived_for_reuse": true,
    "updates_via_changelog": true,
    "silent_edits_present": false
  },
  "tooling": {
    "automation_does_not_replace_verification": true,
    "ai_summaries_used": false,
    "seo_spam_and_content_farms_screened": true,
    "scraped_or_automated_data_used": false
  },
  "disclosure": {
    "conflicts_present": false,
    "unsourced_claims_present": false,
    "single_source_conclusions_on_important_facts_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 42 checks and a text stamp of the verdict):

```json
{
  "service": "decision-ready-research-brief",
  "atom_version": "0.1.0",
  "brief": "Market entry strategy",
  "verdict": "RESEARCH_BRIEF_DECISION_READY",
  "sections": {
    "scoping_and_sources": "pass",
    "evidence_and_notes": "pass",
    "synthesis_and_report_structure": "pass",
    "reuse_verification_and_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "questions_count": 1,
  "sources_count": 2,
  "sources_without_complete_provenance": [],
  "source_provenance_coverage": "1.0000",
  "claims_count": 1,
  "material_claims_without_sources": [],
  "material_claim_source_coverage": "1.0000",
  "important_claims_not_triangulated": [],
  "important_claim_triangulation_coverage": "1.0000",
  "summary": "42 pass, 0 fail, 0 missing of 42 checks across four sections."
}
```

## Verdicts

- **RESEARCH_BRIEF_DECISION_READY** — every check passes; the declared research-brief evidence is complete and consistent with the skill's method, quality gates and red lines.
- **RESEARCH_BRIEF_NOT_DECISION_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `questions_count`, `sources_count` and `claims_count` (the declared list lengths as integers, or null when the list is not declared), `sources_without_complete_provenance`, `material_claims_without_sources` and `important_claims_not_triangulated` (row-name lists, or null when an underlying list is not declared), the three coverage ratios `source_provenance_coverage`, `material_claim_source_coverage` and `important_claim_triangulation_coverage` (strings with exactly four decimal places, or null when the denominator is absent or empty) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the six primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
