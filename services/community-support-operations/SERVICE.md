# Community support operations — `community-support-operations`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Run support and community well — intake/SLAs, help docs, triage loops, release comms, moderation.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Everyday life who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product support channel operations**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the community-support manifest

This atom does not run a support desk or a community and exercises
no judgment of its own. The caller submits one JSON manifest
declaring a support/community operations artifact — its intake
channels and SLA targets, its declared intake and triage counts,
its help-doc and top-theme record, its triage categories, its
response-craft and red-line record, its release and incident
comms record, its community norms, and its measurement record —
and the atom validates that artifact deterministically. Every
field below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a field
present but false / invalid = the check fails
(`COMMUNITY_SUPPORT_NOT_READY`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `entity` (string; carried into the verdict output, not itself checked) | — |
| `intake.channels_defined` | intake_and_slas |
| `intake.sla_targets_documented` | intake_and_slas |
| `intake.outage_target_hours` (number; computed, see below) | intake_and_slas |
| `intake.broken_target_hours` (number; computed, see below) | intake_and_slas |
| `intake.question_target_hours` (number; computed, see below) | intake_and_slas |
| `intake.messages_received` (number; computed, see below) | intake_and_slas |
| `intake.messages_tracked` (number; computed, see below) | intake_and_slas |
| `intake.support_messages_left_untracked_in_dms` (must be `false` to pass — skill method step 1) | intake_and_slas |
| `help_docs.faq_covers_top_recurring_questions` | help_docs_and_deflection |
| `help_docs.docs_updated_from_actual_tickets` | help_docs_and_deflection |
| `help_docs.fixes_link_doc_where_possible` | help_docs_and_deflection |
| `help_docs.top_theme_count` (number; computed, see below) | help_docs_and_deflection |
| `help_docs.themes_with_doc_or_backlog_count` (number; computed, see below) | help_docs_and_deflection |
| `triage.categories_used` (list of strings; computed, see below) | triage_loop |
| `triage.bugs_require_reproduction` | triage_loop |
| `triage.bugs_filed_in_tracker_with_evidence` | triage_loop |
| `triage.features_routed_to_backlog` | triage_loop |
| `triage.threads_total` (number; computed, see below) | triage_loop |
| `triage.threads_closed_with_resolution_or_tracked_item` (number; computed, see below) | triage_loop |
| `triage.obvious_issues_left_unanswered` (must be `false` to pass — skill red line) | triage_loop |
| `triage.triage_then_prioritize_deliberately` | triage_loop |
| `response.acknowledge_expectation_deliver_confirm_followed` | response_craft_and_red_lines |
| `response.mistakes_owned_plainly` | response_craft_and_red_lines |
| `response.argues_publicly_with_users` (must be `false` to pass — skill method step 4) | response_craft_and_red_lines |
| `response.unshipped_dates_or_features_promised` (must be `false` to pass — skill red line) | response_craft_and_red_lines |
| `response.reporter_privacy_leaked_in_public_threads` (must be `false` to pass — skill red line) | response_craft_and_red_lines |
| `comms.changelog_highlights_for_users_published` | release_and_incident_comms |
| `comms.incident_templates_ready` | release_and_incident_comms |
| `comms.incident_templates_include_honesty_rules` | release_and_incident_comms |
| `comms.incident_status_honest_no_fake_precision` | release_and_incident_comms |
| `comms.follow_up_after_resolution_sent` | release_and_incident_comms |
| `community.code_of_conduct_exists` | community_norms |
| `community.moderation_process_documented` | community_norms |
| `community.moderation_applied_consistently` | community_norms |
| `community.contributors_celebrated` | community_norms |
| `community.spaces_spam_free_without_hostility` | community_norms |
| `measurement.first_response_time_measured` | measurement |
| `measurement.resolution_time_measured` | measurement |
| `measurement.recurring_themes_tracked` | measurement |
| `measurement.satisfaction_signals_observed` | measurement |
| `measurement.monthly_review_held` | measurement |
| `measurement.themes_feed_product` | measurement |

Six checks are computed from the declared values, using only
what the skill itself states plus the arithmetic of the declared
numbers — no outside threshold is imported:

- **SLA severity order:** the skill's method step 1 sets
  "response-time targets by severity (outage > broken >
  question)". The declared targets therefore pass only when the
  outage target is shorter than the broken target, which is
  shorter than the question target — the severity order the
  skill names, read as response-time order. The skill states no
  hour values, so **no target value is judged** — only the
  ordering of the three declared numbers.
- **Intake tracking:** the skill's method step 1 states "every
  message lands somewhere tracked". The declared
  `intake.messages_tracked` therefore passes only when it equals
  `intake.messages_received`, with a positive received count (a
  zero received count fails — no intake exists to prove tracking
  over). The output reports `computed_tracked_share` (tracked ÷
  received, null when it cannot be computed) and
  `tracked_difference` (tracked minus received, null likewise).
- **Top-ten themes:** the skill's quality gate is "Top-10 themes
  have help docs or backlog entries". The declared
  `help_docs.top_theme_count` therefore passes the count check
  only when it is the 10 the skill names, and the coverage check
  only when `help_docs.themes_with_doc_or_backlog_count` equals
  it. The output reports `computed_theme_coverage_ratio`
  (covered ÷ top-theme count, null when it cannot be computed)
  and `theme_coverage_difference` (covered minus top-theme
  count, null likewise).
- **Triage categories:** the skill's method step 3 names the
  classification — bug / feature / usage / noise. The declared
  `triage.categories_used` list therefore passes only when it
  contains all four stated entries (`bug`, `feature`, `usage`,
  `noise`); unknown entries do not count toward coverage. A
  missing list is missing evidence; an empty list is present and
  fails. The output reports the omitted stated entries as
  `triage_categories_not_covered` (null when no list is
  declared). Entries are validated as strings only, never
  enum-checked — coverage is a verdict check, not a type error.
- **Thread closure:** the skill's method step 3 states "every
  thread ends with a resolution or a tracked item". The declared
  `triage.threads_closed_with_resolution_or_tracked_item`
  therefore passes only when it equals `triage.threads_total`,
  with a positive total (a zero total fails — no threads exist
  to prove closure over). The output reports
  `computed_thread_closure_share` (closed ÷ total, null when it
  cannot be computed) and `thread_closure_difference` (closed
  minus total, null likewise).

**Fixed serialization rule:** computed amounts and ratios are
reported as strings with exactly six decimal places, produced in
both implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the six computed checks cannot be completed).

The verdict is one of `COMMUNITY_SUPPORT_READY` (all 38 checks
pass), `COMMUNITY_SUPPORT_NOT_READY` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across seven sections: intake_and_slas,
help_docs_and_deflection, triage_loop,
response_craft_and_red_lines, release_and_incident_comms,
community_norms, measurement.

## Honest scoping

This atom audits a **declared** support/community operations
artifact — it does not staff or run a support channel, answer a
ticket, moderate a community, verify that a declared value is
true, or judge whether users are actually well served. The
register's named doubt for this atom — touches user messages —
is answered by this framing: the artifact declares counts and
process facts only; no user message content is an input, and
this core reads none. An artifact is ready *on the caller's
declared evidence* even if its actual support is poor. It is a
completeness and consistency audit, **not a support-quality
review**: it never decides whether an SLA target is fast enough,
whether a help doc is any good, whether moderation calls were
right, or whether users are satisfied.

**Thresholds declined (named explicitly):** the skill states no
SLA hour values, so none are imposed — only the severity
ordering of the three declared targets is checked; the skill
says to *measure* first response time and resolution time but
states no target values for either, so no response-time or
resolution-time pass mark is imposed; the skill names "quiet
satisfaction signals" but no satisfaction metric or score, so
none is imposed; the skill states no spam rate, moderation
volume, message volume, or staffing threshold, so none are
imposed. The skill's quality gate scopes community guidelines
and moderation to "where a community runs" — this core carries
no conditional waiver: an operation that runs no community
leaves those fields absent and receives
`INSUFFICIENT_EVIDENCE` on that section rather than a pass, and
that limitation is stated here rather than hidden.

Named exclusions: no reading or handling of actual user
messages; no verification of any declared count, target, or
process claim; no SLA-adequacy, help-doc-quality,
moderation-correctness, or satisfaction judgment; no live
verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Touches user messages
