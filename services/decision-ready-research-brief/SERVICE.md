# Decision ready research brief — `decision-ready-research-brief`

**Deliverable type:** REPORT. This atom sells the report it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Run research rigorously — question scoping, source triangulation, evidence notes, decision-ready reports.

A caller submits the inputs the bound skill works on and receives one report back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this report on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Deep research for product decisions**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the research-brief manifest

The caller submits one JSON manifest: a declared research-brief
record for one brief. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`RESEARCH_BRIEF_NOT_DECISION_READY`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `brief` (string; carried into the verdict output, not itself checked) | — |
| `scope.decision_named` | scoping_and_sources |
| `scope.questions_ranked` | scoping_and_sources |
| `scope.timebox_declared` | scoping_and_sources |
| `scope.timebox_respected` | scoping_and_sources |
| `scope.enough_criteria_defined` | scoping_and_sources |
| `questions` (list of question-row objects, each `{name}` — see the entry field below; computed, see below) | scoping_and_sources |
| `questions[].name` (string; names the question row — the row's presence in the list is what the computed questions check counts) | scoping_and_sources |
| `source_strategy.primary_preferred_over_secondary_and_tertiary` | scoping_and_sources |
| `sources` (list of source-row objects, each `{name, link, date, quote, source_type, incentives_noted}` — see the six entry fields below; computed, see below) | scoping_and_sources |
| `sources[].name` (string; the name a claim's `supporting_source_names` entry must equal for that source to count as supporting the claim) | scoping_and_sources |
| `sources[].link` (string; must be a non-empty string for the row to pass the computed link check — an absent field is missing evidence, an empty string fails) | scoping_and_sources |
| `sources[].date` (string; must be a non-empty string for the row to pass the computed date check — an absent field is missing evidence, an empty string fails; the string is never parsed or compared to any clock, see the freshness note below) | scoping_and_sources |
| `sources[].quote` (string; must be a non-empty string for the row to pass the computed quote check — an absent field is missing evidence, an empty string fails) | scoping_and_sources |
| `sources[].source_type` (string; must be a non-empty string for the row to pass the computed source-type check — no vocabulary is imposed: the skill ranks primary > secondary > tertiary as a strategy, and names no allowed values for a row, so only that a type is declared is checked) | scoping_and_sources |
| `sources[].incentives_noted` | scoping_and_sources |
| `evidence.notes_question_oriented` | evidence_and_notes |
| `evidence.evidence_table_present` | evidence_and_notes |
| `evidence.fact_estimate_opinion_separated` | evidence_and_notes |
| `evidence.gaps_recorded` | evidence_and_notes |
| `claims` (list of claim-row objects, each `{name, kind, material, important, supporting_source_names, confidence_stated}` — see the six entry fields below; computed, see below) | evidence_and_notes |
| `claims[].name` (string; names the row in the computed `material_claims_without_sources` and `important_claims_not_triangulated` outputs) | evidence_and_notes |
| `claims[].kind` (string; must be a non-empty string for the row to pass the computed kind check — no vocabulary is imposed: the skill requires fact / estimate / opinion be separated, and only that each claim is labelled is checked) | evidence_and_notes |
| `claims[].material` (gates the computed sourcing check below: only material claims are required to name a supporting source) | evidence_and_notes |
| `claims[].important` (gates the computed triangulation check below: only important claims are required to name two distinct supporting sources) | evidence_and_notes |
| `claims[].supporting_source_names` (list of strings; each entry counts only when it equals a declared source's `name`, and distinct matching names are counted — an absent field on a material or important claim is missing evidence; an absent field on a claim that is neither is not required) | evidence_and_notes |
| `claims[].confidence_stated` | evidence_and_notes |
| `synthesis.structured_by_question` | synthesis_and_report_structure |
| `synthesis.opposing_view_steelmanned` | synthesis_and_report_structure |
| `synthesis.quantified_where_possible` | synthesis_and_report_structure |
| `synthesis.confidence_stated` | synthesis_and_report_structure |
| `synthesis.unknowns_stated_explicitly` | synthesis_and_report_structure |
| `report_sections` (list of strings; computed, see below — must equal the skill's report format exactly and in order: `bluf`, `findings`, `evidence`, `risks`, `open_questions`, `sources`) | synthesis_and_report_structure |
| `report.version` (string; must be a non-empty string to pass the computed version check — an absent field is missing evidence, an empty string fails) | synthesis_and_report_structure |
| `report.date` (string; must be a non-empty string to pass the computed date check — an absent field is missing evidence, an empty string fails; the string is never parsed or compared to any clock) | synthesis_and_report_structure |
| `report.open_questions_listed` | synthesis_and_report_structure |
| `reuse.notes_archived_for_reuse` | reuse_verification_and_red_lines |
| `reuse.updates_via_changelog` | reuse_verification_and_red_lines |
| `reuse.silent_edits_present` (must be `false` to pass — skill anti-pattern) | reuse_verification_and_red_lines |
| `tooling.automation_does_not_replace_verification` | reuse_verification_and_red_lines |
| `tooling.ai_summaries_used` (gates the two AI-summary checks below) | reuse_verification_and_red_lines |
| `tooling.ai_summaries_cite_sources` (required when AI summaries are declared in use; otherwise the check passes as not applicable) | reuse_verification_and_red_lines |
| `tooling.ai_summaries_spot_checked` (required when AI summaries are declared in use; otherwise the check passes as not applicable) | reuse_verification_and_red_lines |
| `tooling.seo_spam_and_content_farms_screened` | reuse_verification_and_red_lines |
| `tooling.scraped_or_automated_data_used` (gates the quality check below) | reuse_verification_and_red_lines |
| `tooling.scraped_or_automated_data_quality_checked` (required when scraped or automated data is declared in use; otherwise the check passes as not applicable) | reuse_verification_and_red_lines |
| `disclosure.conflicts_present` (gates the disclosure check below) | reuse_verification_and_red_lines |
| `disclosure.conflicts_disclosed` (required when conflicts are declared present; otherwise the check passes as not applicable) | reuse_verification_and_red_lines |
| `disclosure.unsourced_claims_present` (must be `false` to pass — skill red line) | reuse_verification_and_red_lines |
| `disclosure.single_source_conclusions_on_important_facts_present` (must be `false` to pass — skill red line) | reuse_verification_and_red_lines |

Nine checks are computed from the declared rows, using only the
consistency of the declared record itself — no outside threshold
is imported:

- **Questions, sources and claims declared:** each declared list
  passes only when it is present and non-empty; an absent list is
  missing evidence, an empty list fails.
- **Provenance per source:** every declared source row must name
  a non-empty `link`, a non-empty `date` and a non-empty `quote`
  (the skill's provenance triple: link + date + quote), declare a
  non-empty `source_type`, and declare `incentives_noted: true`.
  A row with a field absent is missing evidence for that field's
  check; a row naming an empty string fails it.
- **Sourcing per material claim:** every claim declared
  `material: true` must name at least one supporting source that
  is actually declared — an entry in `supporting_source_names`
  counts only when it equals a declared source's `name`. A
  material claim with the field absent is missing evidence.
- **Triangulation per important claim:** every claim declared
  `important: true` must name at least **two distinct**
  supporting sources that are actually declared. Two is the
  skill's own bar, not an imported threshold: the skill requires
  important claims be triangulated across independent sources
  and its red line forbids single-source conclusions on
  important facts, so one matching source cannot pass. Duplicate
  entries of the same source name count once. An important claim
  with the field absent is missing evidence.
- **Confidence and kind per claim:** every declared claim row
  must declare `confidence_stated: true` and a non-empty `kind`
  string. A row with the field absent is missing evidence.
- **Report sections in skill order:** the declared
  `report_sections` list passes only when it equals the skill's
  report format exactly and in order — `bluf`, `findings`,
  `evidence`, `risks`, `open_questions`, `sources`.
- **Report version and date declared:** the declared `report`
  record must name a non-empty `version` string and a non-empty
  `date` string (the skill: version + date on every report). An
  absent field is missing evidence; an empty string fails.

Four check groups are conditional, following the skill's own
scoping — computed from the declared gate fields:

- **AI summaries cite sources / are spot-checked:** the skill
  binds both rules to AI summaries ("AI summaries must cite
  sources and get spot-checked"). Both target fields are
  therefore required only when `tooling.ai_summaries_used` is
  declared `true`; when no AI summaries are declared, both
  checks pass as not applicable.
- **Scraped / automated data quality-checked:** the skill binds
  its quality-check rule to scraped and automated data
  ("quality-check scraped/automated data before use").
  `scraped_or_automated_data_quality_checked` is therefore
  required only when `tooling.scraped_or_automated_data_used`
  is declared `true`; otherwise the check passes as not
  applicable.
- **Conflicts disclosed:** the skill's red line is "disclose
  conflicts". `conflicts_disclosed` is therefore required only
  when `disclosure.conflicts_present` is declared `true`; when
  no conflicts are declared present, the check passes as not
  applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the six primary computed checks — questions declared, sources
declared, claims declared, material-claim sourcing,
important-claim triangulation, report sections in skill order —
cannot be completed), `questions_count`, `sources_count` and
`claims_count` (the declared list lengths, or null when the list
is not declared — counts are reported as integers, exactly), the
row-name lists `sources_without_complete_provenance` (null when
the sources list is not declared),
`material_claims_without_sources` and
`important_claims_not_triangulated` (null when either underlying
list — claims or sources — is not declared; a material or
important claim whose `supporting_source_names` field is absent
is missing evidence and does not appear in these lists), and the
three coverage ratios `source_provenance_coverage` (sources
with a complete link + date + quote provenance triple ÷ declared
sources), `material_claim_source_coverage` (material claims
naming at least one matching declared source ÷ declared material
claims) and `important_claim_triangulation_coverage` (important
claims naming at least two distinct matching declared sources ÷
declared important claims).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly four decimal places, produced in both
implementations by the same rule — round half up to 4dp,
`floor(v * 10000 + 0.5) / 10000`, then format with exactly four
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty (and, for the claim
ratios, when the sources list is absent, or when no claim is
declared material / important respectively). That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric threshold — no source count, claim
count, or question count, no confidence level, no timebox
duration, no source-age or freshness limit for a source's
declared date, and no rate at which findings must be quantified
— so no numeric threshold check is invented. Quantities are
computed and reported; the only bars on the computed rows are
completeness over the caller's own declared rows (every declared
source, every material claim, every important claim) and the
skill's own two-source triangulation bar, exactly as stated
above. Declined thresholds, named: a minimum or maximum
source/claim/question count; a minimum confidence level or a
confidence vocabulary (the skill requires confidence be
*stated*, and names no scale or allowed values, so only that
attestation and the per-claim stated flag are checked); a
numeric timebox duration or a measured overrun (only that a
timebox is declared and respected is checked); a maximum source
age / freshness window — source and report `date` strings are
declared evidence of provenance only, never parsed and never
compared to a clock, because the skill states no freshness
limit and this core has no clock dependence; a numeric
quantification rate for "quantify where possible"; a
source-type vocabulary (primary / secondary / tertiary is the
skill's preference order, checked as the strategy attestation,
not imposed as row values); a claim-kind vocabulary (fact /
estimate / opinion names the separation the skill requires,
checked as the separation attestation plus each claim being
labelled, not imposed as row values).

The verdict is one of `RESEARCH_BRIEF_DECISION_READY` (all 42 checks
pass), `RESEARCH_BRIEF_NOT_DECISION_READY` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across four sections: scoping_and_sources, evidence_and_notes,
synthesis_and_report_structure, reuse_verification_and_red_lines.

## Honest scoping

This atom audits a **declared** research-brief record — it
performs no research, fetches no source, opens no link, reads no
notes, and does not verify that a declared source exists, says
what its quote claims, or supports the claim that names it. A
brief is decision-ready *on the caller's declared evidence*: a
manifest that declares triangulated claims, complete provenance,
and a steelmanned opposing view passes those checks even if the
real brief does none of it. It is a completeness and consistency
audit of the record the skill requires, **not a research service
or a truth certification**: it never judges whether a source is
actually good, independent, or correctly typed (source quality
is a caller declaration only — the declared `source_type` string
and the preference-order attestation are all that is checked),
whether two declared sources are genuinely independent of each
other (independence is asserted by the caller's triangulation
declaration; only that two *distinct declared names* are cited
is computed), whether the synthesis is actually sound or the
steelman actually strong (synthesis judgment is a caller
declaration only), whether a claim is truly material or
important (those flags are the caller's declarations and gate
the computed checks), or whether the stated confidence is
warranted — only that the record contains what the skill's
sections, quality gates and red lines demand, and that its
declared rows are internally consistent.

Named exclusions: no numeric thresholds (see the declined list
above); no fetching, resolving or spot-checking of any declared
link, quote or source; no date parsing or freshness comparison
against any clock; no independence verification between declared
sources beyond distinct declared names; no check that a named
supporting source's content actually supports the claim; the
skill's conditional scope rule — "No decision → question the
research" — is not reduced to a separate gated check, because
the record's `decision_named` attestation already covers the
decision being named and the record declares no separate
decision-absent flag to gate a questioning attestation on, so
it is excluded rather than force-fit; research quality,
source quality and synthesis quality beyond the declarations
above.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
