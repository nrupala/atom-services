# Brand mention monitoring triage digest — `brand-mention-monitoring-triage-digest`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Track mentions and reputation across the web - monitoring coverage, alert triage, response policy, reporting.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Everyday life who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Monitoring Nrupal and product mentions**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the brand-mention-monitoring manifest

The caller submits one JSON manifest: one declared monitoring /
triage / digest setup — the watch the caller declares they run
for a brand — worked through the bound skill's method. Every
field below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a field
present but false / invalid = the check fails
(`TRIAGE_DIGEST_NOT_READY`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `brand` (string; carried into the verdict output, not itself checked) | — |
| `inventory.names_handles_products_listed` | inventory_and_coverage |
| `inventory.misspellings_and_variants_included` | inventory_and_coverage |
| `inventory.owned_vs_third_party_distinguished` | inventory_and_coverage |
| `coverage.sources_listed` | inventory_and_coverage |
| `coverage.blind_spots_acknowledged` | inventory_and_coverage |
| `coverage.mechanism_configured_per_source` | inventory_and_coverage |
| `coverage.cadence_defined` | inventory_and_coverage |
| `coverage.crisis_cadence_realtime` | inventory_and_coverage |
| `coverage.routine_cadence_daily_digest` | inventory_and_coverage |
| `triage.rubric_documented` | triage_rubric |
| `triage.dimensions` (list of strings; computed, see below) | triage_rubric |
| `triage.routes` (list of strings; computed, see below) | triage_rubric |
| `triage.escalation_path_documented` | triage_rubric |
| `triage.false_positives_tracked` | triage_rubric |
| `response.authority_to_speak_defined` | response_policy |
| `response.tone_rules_defined` | response_policy |
| `response.dm_move_criteria_defined` | response_policy |
| `response.statement_criteria_defined` | response_policy |
| `response.templates_approved` | response_policy |
| `alerts.thresholds_defined` | alert_hygiene_and_evidence |
| `alerts.dedupe_enabled` | alert_hygiene_and_evidence |
| `alerts.quiet_hours_defined` | alert_hygiene_and_evidence |
| `alerts.tested_after_setup` | alert_hygiene_and_evidence |
| `evidence.archiving_required_before_response` | alert_hygiene_and_evidence |
| `counts.total_mentions` (number; computed, see below) | alert_hygiene_and_evidence |
| `counts.actions_taken` (number; computed, see below) | alert_hygiene_and_evidence |
| `counts.actions_with_evidence_archived` (number; computed, see below) | alert_hygiene_and_evidence |
| `digest.weekly_cadence` | digest_reporting |
| `digest.includes_notable_mentions` | digest_reporting |
| `digest.includes_trend_notes` | digest_reporting |
| `digest.sentiment_included` | digest_reporting |
| `digest.sentiment_caveats_stated` | digest_reporting |
| `digest.actions_taken_listed` | digest_reporting |
| `digest.signal_separated_from_noise` | digest_reporting |
| `conduct.astroturfing_fake_reviews_or_manufactured_engagement` (must be `false` to pass — skill red line) | red_lines |
| `conduct.public_argument_without_policy_backing` (must be `false` to pass — skill red line) | red_lines |
| `conduct.retaliation_against_mentioners` (must be `false` to pass — skill red line) | red_lines |
| `conduct.private_data_of_individuals_exposed` (must be `false` to pass — skill red line) | red_lines |
| `conduct.defamation_or_impersonation_fought_publicly_instead_of_counsel` (must be `false` to pass — skill red line) | red_lines |

Three checks are computed from the declared values, using only
what the skill itself states plus the set logic and arithmetic
of the declared values — no outside threshold is imported:

- **Triage-dimension coverage:** the skill's method step 3
  defines the triage rubric as "severity × reach × authenticity
  (is it spam/astroturf?)". The declared `triage.dimensions` list
  therefore passes only when it contains all three stated
  entries (`severity`, `reach`, `authenticity`); unknown entries
  do not count toward coverage. A missing list is missing
  evidence; an empty list is present and fails. The output
  reports the omitted stated entries as
  `triage_dimensions_missing` (null when no list is declared).
  Entries are validated as strings only, never enum-checked —
  coverage is a verdict check, not a type error.
- **Triage-route coverage:** the skill's method step 3 names the
  routes — "Route: ignore / monitor / reply / escalate / legal".
  The declared `triage.routes` list therefore passes only when
  it contains all five stated entries (`ignore`, `monitor`,
  `reply`, `escalate`, `legal`); unknown entries do not count
  toward coverage. A missing list is missing evidence; an empty
  list is present and fails. The output reports the omitted
  stated entries as `triage_routes_missing` (null when no list
  is declared). Entries are validated as strings only, never
  enum-checked — coverage is a verdict check, not a type error.
- **Evidence for every action:** the skill's quality gate is
  "Evidence archived for every action taken", and method step 6
  requires archiving every actionable mention (screenshot +
  link) before responding. When the manifest declares
  `counts.total_mentions`, `counts.actions_taken`, and
  `counts.actions_with_evidence_archived`, the check passes only
  when the archived count equals the actions-taken count and
  the counts are coherent (none negative, actions taken no more
  than total mentions). If any of the three numbers is absent,
  the check is missing evidence. The output reports
  `actions_without_archived_evidence` (actions taken minus
  actions with evidence archived, null when either count cannot
  be read).

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the three computed checks cannot be completed).

The verdict is one of `TRIAGE_DIGEST_READY` (all 37 checks
pass), `TRIAGE_DIGEST_NOT_READY` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is
missing), across six sections: inventory_and_coverage,
triage_rubric, response_policy, alert_hygiene_and_evidence,
digest_reporting, red_lines.

## Honest scoping

This atom audits a **declared** monitoring setup — it does not
listen to live social feeds, fetch or search for mentions,
classify the sentiment of any real post, or verify that a
declared value is true. The caller declares its own inventory,
coverage, rubric, policy, alert hygiene, counts, and digest
shape, and this core checks only their completeness against the
skill's method and the internal consistency of the declared
counts. A setup is ready *on the caller's declared evidence*
even if the brand's actual reputation is poor or the declared
monitoring never actually runs. It is a completeness and
consistency audit, **not a reputation review**: it never decides
whether a mention is genuinely severe, whether the sentiment
reading is right, whether a reply was wise, or whether the
coverage is actually sufficient for the brand — only that the
declared setup contains what the skill's method, quality gates,
and red lines demand.

Named exclusions: no live listening, searching, or fetching of
any platform or feed (the atom audits declarations, it does not
monitor); no sentiment classification or scoring of real
mentions (the skill requires sentiment *with caveats* in the
digest but states no classifier or scale, so none is imposed);
no severity, reach, or alert threshold of any kind (the skill
requires thresholds to be defined but states no values, so only
their declared existence is checked — no numeric threshold is
invented here); no verification that archived evidence exists or
that templates, alerts, or coverage mechanisms actually work —
only the caller's declarations and their arithmetic are checked.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
