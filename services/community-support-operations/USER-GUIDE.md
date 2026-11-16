# Community support operations — user guide

## What it does

You have a support/community operations artifact — its intake channels and SLA targets, its declared intake and triage counts, its help-doc and top-theme record, its triage categories, its response-craft and red-line record, its release and incident comms record, its community norms, and its measurement record. This atom reads one declared manifest and returns one deterministic verdict across seven sections: **COMMUNITY_SUPPORT_READY**, **COMMUNITY_SUPPORT_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not run a support desk or a community, answer a ticket, moderate a community, verify that a declared value is true, or judge whether users are actually well served. Computed checks: the SLA targets must respect severity order (outage target shorter than broken, broken shorter than question — no hour value itself is judged); the tracked message count must equal the received count, with a positive received count; the top-theme count must be the 10 the skill names and the themes with a doc or backlog entry must equal it; the triage categories used must contain all four stated entries — `bug`, `feature`, `usage`, `noise`; and the threads closed with a resolution or tracked item must equal the thread total, with a positive total. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "community-support-operations"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/community-support-operations` — tool name `community_support_operations`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/community-support-operations` — body = the manifest object; same `Authorization` header.

## Input — the community-support-operations manifest

| Field | Meaning |
|---|---|
| `entity` | entity name (string; carried into the output, not checked) |
| `intake.channels_defined` / `sla_targets_documented` | intake channel and SLA documentation evidence |
| `intake.outage_target_hours` (number), `intake.broken_target_hours` (number), `intake.question_target_hours` (number) | computed: targets must respect severity order — outage < broken < question; no target value itself is judged |
| `intake.messages_received` (number), `intake.messages_tracked` (number) | computed: tracked must equal received, with a positive received count; reported as `computed_tracked_share` and `tracked_difference` (6 decimal places) |
| `intake.support_messages_left_untracked_in_dms` | must be `false` to pass |
| `help_docs.faq_covers_top_recurring_questions` / `docs_updated_from_actual_tickets` / `fixes_link_doc_where_possible` | help-doc evidence |
| `help_docs.top_theme_count` (number), `help_docs.themes_with_doc_or_backlog_count` (number) | computed: top count must be 10 and covered count must equal it; reported as `computed_theme_coverage_ratio` and `theme_coverage_difference` (6 decimal places) |
| `triage.categories_used` (list of strings) | computed: must contain all four stated entries — `bug`, `feature`, `usage`, `noise`; omitted stated entries reported as `triage_categories_not_covered` |
| `triage.bugs_require_reproduction` / `bugs_filed_in_tracker_with_evidence` / `features_routed_to_backlog` | triage evidence |
| `triage.threads_total` (number), `triage.threads_closed_with_resolution_or_tracked_item` (number) | computed: closed must equal total, with a positive total; reported as `computed_thread_closure_share` and `thread_closure_difference` (6 decimal places) |
| `triage.obvious_issues_left_unanswered` | must be `false` to pass |
| `triage.triage_then_prioritize_deliberately` | triage prioritisation evidence |
| `response.acknowledge_expectation_deliver_confirm_followed` / `mistakes_owned_plainly` | response-craft evidence |
| `response.argues_publicly_with_users` / `unshipped_dates_or_features_promised` / `reporter_privacy_leaked_in_public_threads` | each must be `false` to pass |
| `comms.changelog_highlights_for_users_published` / `incident_templates_ready` / `incident_templates_include_honesty_rules` / `incident_status_honest_no_fake_precision` / `follow_up_after_resolution_sent` | release and incident comms evidence |
| `community.code_of_conduct_exists` / `moderation_process_documented` / `moderation_applied_consistently` / `contributors_celebrated` / `spaces_spam_free_without_hostility` | community-norms evidence |
| `measurement.first_response_time_measured` / `resolution_time_measured` / `recurring_themes_tracked` / `satisfaction_signals_observed` / `monthly_review_held` / `themes_feed_product` | measurement evidence |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward COMMUNITY_SUPPORT_NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/community-support-operations`:

```json
{
  "entity": "test-org",
  "intake": {
    "channels_defined": true,
    "sla_targets_documented": true,
    "outage_target_hours": 1.0,
    "broken_target_hours": 2.0,
    "question_target_hours": 3.0,
    "messages_received": 100,
    "messages_tracked": 100,
    "support_messages_left_untracked_in_dms": false
  },
  "help_docs": {
    "faq_covers_top_recurring_questions": true,
    "docs_updated_from_actual_tickets": true,
    "fixes_link_doc_where_possible": true,
    "top_theme_count": 10,
    "themes_with_doc_or_backlog_count": 10
  },
  "triage": {
    "categories_used": [
      "bug",
      "feature",
      "usage",
      "noise"
    ],
    "bugs_require_reproduction": true,
    "bugs_filed_in_tracker_with_evidence": true,
    "features_routed_to_backlog": true,
    "threads_total": 50,
    "threads_closed_with_resolution_or_tracked_item": 50,
    "obvious_issues_left_unanswered": false,
    "triage_then_prioritize_deliberately": true
  },
  "response": {
    "acknowledge_expectation_deliver_confirm_followed": true,
    "mistakes_owned_plainly": true,
    "argues_publicly_with_users": false,
    "unshipped_dates_or_features_promised": false,
    "reporter_privacy_leaked_in_public_threads": false
  },
  "comms": {
    "changelog_highlights_for_users_published": true,
    "incident_templates_ready": true,
    "incident_templates_include_honesty_rules": true,
    "incident_status_honest_no_fake_precision": true,
    "follow_up_after_resolution_sent": true
  },
  "community": {
    "code_of_conduct_exists": true,
    "moderation_process_documented": true,
    "moderation_applied_consistently": true,
    "contributors_celebrated": true,
    "spaces_spam_free_without_hostility": true
  },
  "measurement": {
    "first_response_time_measured": true,
    "resolution_time_measured": true,
    "recurring_themes_tracked": true,
    "satisfaction_signals_observed": true,
    "monthly_review_held": true,
    "themes_feed_product": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 38 checks and a text stamp of the verdict):

```json
{
  "service": "community-support-operations",
  "atom_version": "0.1.0",
  "entity": "test-org",
  "verdict": "COMMUNITY_SUPPORT_READY",
  "sections": {
    "intake_and_slas": "pass",
    "help_docs_and_deflection": "pass",
    "triage_loop": "pass",
    "response_craft_and_red_lines": "pass",
    "release_and_incident_comms": "pass",
    "community_norms": "pass",
    "measurement": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "computed_tracked_share": "1.000000",
  "tracked_difference": "0.000000",
  "computed_theme_coverage_ratio": "1.000000",
  "theme_coverage_difference": "0.000000",
  "triage_categories_not_covered": [],
  "computed_thread_closure_share": "1.000000",
  "thread_closure_difference": "0.000000",
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across seven sections."
}
```

## Verdicts

- **COMMUNITY_SUPPORT_READY** — every check passes; the support operations artifact is complete and internally consistent on the declared evidence.
- **COMMUNITY_SUPPORT_NOT_READY** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_tracked_share` and `tracked_difference`, `computed_theme_coverage_ratio` and `theme_coverage_difference`, `computed_thread_closure_share` and `thread_closure_difference` (computed amounts as strings with exactly six decimals, or null when they cannot be computed), `triage_categories_not_covered` (omitted stated triage categories, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
