# Community support operations — `community-support-operations`

**Display name:** Community support operations · **Slug:** `community-support-operations` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "community-support-operations"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the manifest.** Fill every group in the [Input reference](#input-reference) — one JSON object declaring the artifact this atom audits. Declare values truthfully: the atom judges declared evidence only (see Explanation). The recorded run's manifest (example 1 below) declares `entity` = "test-org" and supplies every section's fields.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/community-support-operations` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `COMMUNITY_SUPPORT_READY` — 38 pass, 0 fail, 0 missing of 38 checks across seven sections. Recorded computed values: `computed_tracked_share = 1.000000 (100 / 100)`; `tracked_difference = 0.000000 (100 - 100)`; `computed_theme_coverage_ratio = 1.000000 (10 / 10)`; `theme_coverage_difference = 0.000000 (10 - 10)`; `triage_categories_not_covered = []`; `computed_thread_closure_share = 1.000000 (50 / 50)`; `thread_closure_difference = 0.000000 (50 - 50)`; `computed_status = within_stated_limits_on_declared_evidence`.
   Why it passes, in the tester's recorded words: All fields present and valid. computed_spot_checks: computed_tracked_share=1.000000, computed_thread_closure_share=1.000000, computed_theme_coverage_ratio=1.000000
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "community-support-operations"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/community-support-operations` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/community-support-operations` with the same `Authorization: Bearer <key>` header and call the tool `community_support_operations` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `COMMUNITY_SUPPORT_NOT_READY` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing (the recorded sparse run — a manifest carrying only `entity` — returned exactly that: 1 pass, 0 fail, 37 missing of 38 checks across seven sections). A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples, example 2), the verdict was `COMMUNITY_SUPPORT_NOT_READY` — 33 pass, 5 fail, 0 missing of 38 checks across seven sections. The failing checks were exactly: `sla_targets_respect_severity_order`, `every_message_tracked`, `all_top_themes_have_doc_or_backlog`, `triage_categories_cover_stated_categories`, `every_thread_ends_with_resolution_or_tracked_item`. Recorded case notes: Violates SLA ordering (5 > 2), intake tracking (50/100), theme coverage (5/10, top count itself is 10 so top_ten_themes_identified passes), category coverage (missing usage/noise), and thread closure (5/10).
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `intake.channels_defined` with detail "intake.channels_defined must be a boolean" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/community-support-operations` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/community-support-operations` — tool name `community_support_operations`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks, grouped as SERVICE.md groups them (by the section that reads the field). Types are from SERVICE.md's field table — all fields are booleans unless noted in the table — corroborated by contract.yaml and the recorded evidence input schema (`inputSchema` in the MCP tool definition). An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `entity` | string | — | string; carried into the verdict output, not itself checked |
| `intake.channels_defined` | boolean | intake_and_slas |  |
| `intake.sla_targets_documented` | boolean | intake_and_slas |  |
| `intake.outage_target_hours` | number | intake_and_slas | number; computed, see below |
| `intake.broken_target_hours` | number | intake_and_slas | number; computed, see below |
| `intake.question_target_hours` | number | intake_and_slas | number; computed, see below |
| `intake.messages_received` | number | intake_and_slas | number; computed, see below |
| `intake.messages_tracked` | number | intake_and_slas | number; computed, see below |
| `intake.support_messages_left_untracked_in_dms` | boolean | intake_and_slas | must be `false` to pass — skill method step 1 |
| `help_docs.faq_covers_top_recurring_questions` | boolean | help_docs_and_deflection |  |
| `help_docs.docs_updated_from_actual_tickets` | boolean | help_docs_and_deflection |  |
| `help_docs.fixes_link_doc_where_possible` | boolean | help_docs_and_deflection |  |
| `help_docs.top_theme_count` | number | help_docs_and_deflection | number; computed, see below |
| `help_docs.themes_with_doc_or_backlog_count` | number | help_docs_and_deflection | number; computed, see below |
| `triage.categories_used` | list of strings | triage_loop | list of strings; computed, see below |
| `triage.bugs_require_reproduction` | boolean | triage_loop |  |
| `triage.bugs_filed_in_tracker_with_evidence` | boolean | triage_loop |  |
| `triage.features_routed_to_backlog` | boolean | triage_loop |  |
| `triage.threads_total` | number | triage_loop | number; computed, see below |
| `triage.threads_closed_with_resolution_or_tracked_item` | number | triage_loop | number; computed, see below |
| `triage.obvious_issues_left_unanswered` | boolean | triage_loop | must be `false` to pass — skill red line |
| `triage.triage_then_prioritize_deliberately` | boolean | triage_loop |  |
| `response.acknowledge_expectation_deliver_confirm_followed` | boolean | response_craft_and_red_lines |  |
| `response.mistakes_owned_plainly` | boolean | response_craft_and_red_lines |  |
| `response.argues_publicly_with_users` | boolean | response_craft_and_red_lines | must be `false` to pass — skill method step 4 |
| `response.unshipped_dates_or_features_promised` | boolean | response_craft_and_red_lines | must be `false` to pass — skill red line |
| `response.reporter_privacy_leaked_in_public_threads` | boolean | response_craft_and_red_lines | must be `false` to pass — skill red line |
| `comms.changelog_highlights_for_users_published` | boolean | release_and_incident_comms |  |
| `comms.incident_templates_ready` | boolean | release_and_incident_comms |  |
| `comms.incident_templates_include_honesty_rules` | boolean | release_and_incident_comms |  |
| `comms.incident_status_honest_no_fake_precision` | boolean | release_and_incident_comms |  |
| `comms.follow_up_after_resolution_sent` | boolean | release_and_incident_comms |  |
| `community.code_of_conduct_exists` | boolean | community_norms |  |
| `community.moderation_process_documented` | boolean | community_norms |  |
| `community.moderation_applied_consistently` | boolean | community_norms |  |
| `community.contributors_celebrated` | boolean | community_norms |  |
| `community.spaces_spam_free_without_hostility` | boolean | community_norms |  |
| `measurement.first_response_time_measured` | boolean | measurement |  |
| `measurement.resolution_time_measured` | boolean | measurement |  |
| `measurement.recurring_themes_tracked` | boolean | measurement |  |
| `measurement.satisfaction_signals_observed` | boolean | measurement |  |
| `measurement.monthly_review_held` | boolean | measurement |  |
| `measurement.themes_feed_product` | boolean | measurement |  |

### Checks

All 38 checks, exactly as named in the recorded full-pass REST response, grouped by section. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence; `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. Across all recorded cases for this atom the only per-check status values observed are `pass`, `fail` and `missing`; there is no separate not-applicable status value in the output — where a check is gated by another declared field (see the gated checks' evidence lines), the gate's declared value decides whether the requirement is held, as the evidence line states.

#### Section: `intake_and_slas` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `channels_defined` | method step 1: support channels are defined |
| `sla_targets_documented` | quality gate: channels and SLA response-time targets are documented |
| `sla_targets_respect_severity_order` | method step 1: the declared response-time targets respect the severity order the skill names — outage shorter than broken, broken shorter than question (outage > broken > question); no target value itself is judged, the skill states none |
| `every_message_tracked` | method step 1: every message lands somewhere tracked — the declared tracked count equals the declared received count |
| `no_support_messages_left_untracked_in_dms` | method step 1: no support DMs vanish into history untracked |

#### Section: `help_docs_and_deflection` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `faq_covers_top_recurring_questions` | method step 2: FAQ/help docs cover the top recurring questions |
| `docs_updated_from_actual_tickets` | method step 2: help docs are updated from actual tickets |
| `fixes_link_doc_where_possible` | method step 2: fixes link a help doc where possible |
| `top_ten_themes_identified` | quality gate: the top themes are the top 10 the skill names — the declared top-theme count is 10 |
| `all_top_themes_have_doc_or_backlog` | quality gate: every top theme has a help doc or a backlog entry — the declared covered count equals the declared top-theme count |

#### Section: `triage_loop` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `triage_categories_cover_stated_categories` | method step 3: the categories used cover every category the skill names — bug, feature, usage, noise |
| `bugs_require_reproduction` | method step 3: bugs need reproductions |
| `bugs_filed_in_tracker_with_evidence` | method step 3: bugs go to the issue tracker with evidence |
| `features_routed_to_backlog` | method step 3: features are routed to the backlog |
| `every_thread_ends_with_resolution_or_tracked_item` | method step 3: every thread ends with a resolution or a tracked item — the declared closed count equals the declared thread total |
| `no_unanswered_obvious_issues` | red line: no unanswered 'obvious' issues |
| `triage_then_prioritize_deliberately` | red line: issues are triaged, then prioritized deliberately |

#### Section: `response_craft_and_red_lines` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `acknowledge_expectation_deliver_confirm_followed` | method step 4: responses follow acknowledge, set expectation, deliver, confirm |
| `mistakes_owned_plainly` | method step 4: mistakes are owned plainly |
| `never_argues_publicly` | method step 4: never argue publicly |
| `never_promises_unshipped_dates_or_features` | red line: never promise what isn't shipped — no unshipped dates or features are promised |
| `reporter_privacy_never_leaked_in_public_threads` | red line: reporter privacy is never leaked in public threads |

#### Section: `release_and_incident_comms` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `changelog_highlights_for_users_published` | method step 5: changelog highlights for users are published |
| `incident_templates_ready` | quality gate: incident comms templates are ready |
| `incident_templates_include_honesty_rules` | quality gate: incident comms templates carry the honesty rules |
| `incident_status_honest_no_fake_precision` | method step 5: incident updates give honest status — 'investigating' is not fake precision |
| `follow_up_after_resolution_sent` | method step 5: a follow-up is sent after resolution |

#### Section: `community_norms` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `code_of_conduct_exists` | method step 6: a code of conduct exists |
| `moderation_process_documented` | quality gate: community guidelines and a documented moderation process exist where a community runs |
| `moderation_applied_consistently` | method step 6: moderation is consistent |
| `contributors_celebrated` | method step 6: contributors are celebrated |
| `spaces_spam_free_without_hostility` | method step 6: spaces are kept spam-free without turning hostile |

#### Section: `measurement` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `first_response_time_measured` | method step 7: first response time is measured |
| `resolution_time_measured` | method step 7: resolution time is measured |
| `recurring_themes_tracked` | method step 7: recurring themes are tracked |
| `satisfaction_signals_observed` | method step 7: quiet satisfaction signals are observed |
| `monthly_review_held` | method step 7: a monthly review is held |
| `themes_feed_product` | method step 7: themes feed the product |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug (`community-support-operations`).
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `entity` — The caller's `entity` value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 38 per-check results: `section`, `check`, `status`, `evidence`.
- `computed_status` — Computed/reported field; recorded full-pass value: `"within_stated_limits_on_declared_evidence"`.
- `computed_tracked_share` — Computed/reported field; recorded full-pass value: `"1.000000"`.
- `tracked_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `computed_theme_coverage_ratio` — Computed/reported field; recorded full-pass value: `"1.000000"`.
- `theme_coverage_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `triage_categories_not_covered` — Computed/reported field; recorded full-pass value: `[]`.
- `computed_thread_closure_share` — Computed/reported field; recorded full-pass value: `"1.000000"`.
- `thread_closure_difference` — Computed/reported field; recorded full-pass value: `"0.000000"`.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, entity, verdict, per-section statuses, summary) for logs and tickets.

From USER-GUIDE.md's verdict notes: The response also reports `computed_tracked_share` and `tracked_difference`, `computed_theme_coverage_ratio` and `theme_coverage_difference`, `computed_thread_closure_share` and `thread_closure_difference` (computed amounts as strings with exactly six decimals, or null when they cannot be computed), `triage_categories_not_covered` (omitted stated triage categories, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `COMMUNITY_SUPPORT_READY` — every check passes; the support operations artifact is complete and internally consistent on the declared evidence.
- `COMMUNITY_SUPPORT_NOT_READY` — at least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks.

**Computed fields:**

- `computed_status` — `within_stated_limits_on_declared_evidence` when every computed check that can be completed is within its stated limits; `outside_stated_limits_on_declared_evidence` when a computed check is breached; `null` when a computed check cannot be completed (recorded sparse-run value: `null`).
- `computed_tracked_share` — reported as in the recorded responses (full-pass value `"1.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `tracked_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_theme_coverage_ratio` — reported as in the recorded responses (full-pass value `"1.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `theme_coverage_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `triage_categories_not_covered` — reported as in the recorded responses (full-pass value `[]`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `computed_thread_closure_share` — reported as in the recorded responses (full-pass value `"1.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.
- `thread_closure_difference` — reported as in the recorded responses (full-pass value `"0.000000"`; `null` or empty where the underlying declared values cannot be computed / are absent — see the worked examples). Computed amounts are serialized as strings with exactly six decimal places where the field is a computed amount.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key (gateway DESIGN.md: unknown/revoked key = 401). No verdict is produced.
- **403** — the key lacks this atom's scope (gateway DESIGN.md: missing scope at an atom = 403). Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "intake.channels_defined", "detail": "intake.channels_defined must be a boolean"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits; gateway DESIGN.md: over limit → 429 naming the limit, and the call is not metered). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); pricing unit is the deliverable, and prices are set only from measured production cost per unit.

## Explanation

You have a support/community operations artifact — its intake channels and SLA targets, its declared intake and triage counts, its help-doc and top-theme record, its triage categories, its response-craft and red-line record, its release and incident comms record, its community norms, and its measurement record. This atom reads one declared manifest and returns one deterministic verdict across seven sections: **COMMUNITY_SUPPORT_READY**, **COMMUNITY_SUPPORT_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not run a support desk or a community, answer a ticket, moderate a community, verify that a declared value is true, or judge whether users are actually well served. Computed checks: the SLA targets must respect severity order (outage target shorter than broken, broken shorter than question — no hour value itself is judged); the tracked message count must equal the received count, with a positive received count; the top-theme count must be the 10 the skill names and the themes with a doc or backlog entry must equal it; the triage categories used must contain all four stated entries — `bug`, `feature`, `usage`, `noise`; and the threads closed with a resolution or tracked item must equal the thread total, with a positive total. Same manifest in → same verdict out.

**Computed checks.** Six checks are computed from the declared values, using only what the skill itself states plus the arithmetic of the declared numbers — no outside threshold is imported:

- **SLA severity order:** the skill's method step 1 sets "response-time targets by severity (outage > broken > question)". The declared targets therefore pass only when the outage target is shorter than the broken target, which is shorter than the question target — the severity order the skill names, read as response-time order. The skill states no hour values, so **no target value is judged** — only the ordering of the three declared numbers.
- **Intake tracking:** the skill's method step 1 states "every message lands somewhere tracked". The declared `intake.messages_tracked` therefore passes only when it equals `intake.messages_received`, with a positive received count (a zero received count fails — no intake exists to prove tracking over). The output reports `computed_tracked_share` (tracked ÷ received, null when it cannot be computed) and `tracked_difference` (tracked minus received, null likewise).
- **Top-ten themes:** the skill's quality gate is "Top-10 themes have help docs or backlog entries". The declared `help_docs.top_theme_count` therefore passes the count check only when it is the 10 the skill names, and the coverage check only when `help_docs.themes_with_doc_or_backlog_count` equals it. The output reports `computed_theme_coverage_ratio` (covered ÷ top-theme count, null when it cannot be computed) and `theme_coverage_difference` (covered minus top-theme count, null likewise).
- **Triage categories:** the skill's method step 3 names the classification — bug / feature / usage / noise. The declared `triage.categories_used` list therefore passes only when it contains all four stated entries (`bug`, `feature`, `usage`, `noise`); unknown entries do not count toward coverage. A missing list is missing evidence; an empty list is present and fails. The output reports the omitted stated entries as `triage_categories_not_covered` (null when no list is declared). Entries are validated as strings only, never enum-checked — coverage is a verdict check, not a type error.
- **Thread closure:** the skill's method step 3 states "every thread ends with a resolution or a tracked item". The declared `triage.threads_closed_with_resolution_or_tracked_item` therefore passes only when it equals `triage.threads_total`, with a positive total (a zero total fails — no threads exist to prove closure over). The output reports `computed_thread_closure_share` (closed ÷ total, null when it cannot be computed) and `thread_closure_difference` (closed minus total, null likewise).

**Fixed serialization rule:** computed amounts and ratios are reported as strings with exactly six decimal places, produced in both implementations by the same rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; computed comparisons compare the fixed-6dp difference to zero. That fixed serialization is what makes the Python and TypeScript outputs byte-identical.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is `COMMUNITY_SUPPORT_NOT_READY`) — and a wrong-*typed* value is neither: it is rejected up front as a 422. Any single `fail` decides the verdict in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns `COMMUNITY_SUPPORT_READY`. The verdict is one of `COMMUNITY_SUPPORT_READY` (all 38 checks pass), `COMMUNITY_SUPPORT_NOT_READY` (any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing), across seven sections: intake_and_slas, help_docs_and_deflection, triage_loop, response_craft_and_red_lines, release_and_incident_comms, community_norms, measurement.

**What it does NOT do.**

*Honest scoping (from SERVICE.md):*

This atom audits a **declared** support/community operations artifact — it does not staff or run a support channel, answer a ticket, moderate a community, verify that a declared value is true, or judge whether users are actually well served. The register's named doubt for this atom — touches user messages — is answered by this framing: the artifact declares counts and process facts only; no user message content is an input, and this core reads none. An artifact is ready *on the caller's declared evidence* even if its actual support is poor. It is a completeness and consistency audit, **not a support-quality review**: it never decides whether an SLA target is fast enough, whether a help doc is any good, whether moderation calls were right, or whether users are satisfied.

**Thresholds declined (named explicitly):** the skill states no SLA hour values, so none are imposed — only the severity ordering of the three declared targets is checked; the skill says to *measure* first response time and resolution time but states no target values for either, so no response-time or resolution-time pass mark is imposed; the skill names "quiet satisfaction signals" but no satisfaction metric or score, so none is imposed; the skill states no spam rate, moderation volume, message volume, or staffing threshold, so none are imposed. The skill's quality gate scopes community guidelines and moderation to "where a community runs" — this core carries no conditional waiver: an operation that runs no community leaves those fields absent and receives `INSUFFICIENT_EVIDENCE` on that section rather than a pass, and that limitation is stated here rather than hidden.

Named exclusions: no reading or handling of actual user messages; no verification of any declared count, target, or process claim; no SLA-adequacy, help-doc-quality, moderation-correctness, or satisfaction judgment; no live verification of any declared fact.

**Buyer / use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Everyday life who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves. The house's own workflow that calls it: **Product support channel operations**. One unit of sale = one delivered result. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/community_support_operations.py` — `evaluate(manifest) -> verdict dict`; tests: `tests/test_community_support_operations.py` — 46 tests; see TEST-REPORT.md for the recorded external battery). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/community-support-operations` and MCP `POST /mcp/community-support-operations` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-16T02:00:12.639737+00:00 against gateway v1.1.0, external verification lane, source `verification/work/community-support-operations/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

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

Response (`response_text`):

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
  "checks": [
    {
      "section": "intake_and_slas",
      "check": "channels_defined",
      "status": "pass",
      "evidence": "method step 1: support channels are defined"
    },
    {
      "section": "intake_and_slas",
      "check": "sla_targets_documented",
      "status": "pass",
      "evidence": "quality gate: channels and SLA response-time targets are documented"
    },
    {
      "section": "intake_and_slas",
      "check": "sla_targets_respect_severity_order",
      "status": "pass",
      "evidence": "method step 1: the declared response-time targets respect the severity order the skill names — outage shorter than broken, broken shorter than question (outage > broken > question); no target value itself is judged, the skill states none"
    },
    {
      "section": "intake_and_slas",
      "check": "every_message_tracked",
      "status": "pass",
      "evidence": "method step 1: every message lands somewhere tracked — the declared tracked count equals the declared received count"
    },
    {
      "section": "intake_and_slas",
      "check": "no_support_messages_left_untracked_in_dms",
      "status": "pass",
      "evidence": "method step 1: no support DMs vanish into history untracked"
    },
    {
      "section": "help_docs_and_deflection",
      "check": "faq_covers_top_recurring_questions",
      "status": "pass",
      "evidence": "method step 2: FAQ/help docs cover the top recurring questions"
    },
    {
      "section": "help_docs_and_deflection",
      "check": "docs_updated_from_actual_tickets",
      "status": "pass",
      "evidence": "method step 2: help docs are updated from actual tickets"
    },
    {
      "section": "help_docs_and_deflection",
      "check": "fixes_link_doc_where_possible",
      "status": "pass",
      "evidence": "method step 2: fixes link a help doc where possible"
    },
    {
      "section": "help_docs_and_deflection",
      "check": "top_ten_themes_identified",
      "status": "pass",
      "evidence": "quality gate: the top themes are the top 10 the skill names — the declared top-theme count is 10"
    },
    {
      "section": "help_docs_and_deflection",
      "check": "all_top_themes_have_doc_or_backlog",
      "status": "pass",
      "evidence": "quality gate: every top theme has a help doc or a backlog entry — the declared covered count equals the declared top-theme count"
    },
    {
      "section": "triage_loop",
      "check": "triage_categories_cover_stated_categories",
      "status": "pass",
      "evidence": "method step 3: the categories used cover every category the skill names — bug, feature, usage, noise"
    },
    {
      "section": "triage_loop",
      "check": "bugs_require_reproduction",
      "status": "pass",
      "evidence": "method step 3: bugs need reproductions"
    },
    {
      "section": "triage_loop",
      "check": "bugs_filed_in_tracker_with_evidence",
      "status": "pass",
      "evidence": "method step 3: bugs go to the issue tracker with evidence"
    },
    {
      "section": "triage_loop",
      "check": "features_routed_to_backlog",
      "status": "pass",
      "evidence": "method step 3: features are routed to the backlog"
    },
    {
      "section": "triage_loop",
      "check": "every_thread_ends_with_resolution_or_tracked_item",
      "status": "pass",
      "evidence": "method step 3: every thread ends with a resolution or a tracked item — the declared closed count equals the declared thread total"
    },
    {
      "section": "triage_loop",
      "check": "no_unanswered_obvious_issues",
      "status": "pass",
      "evidence": "red line: no unanswered 'obvious' issues"
    },
    {
      "section": "triage_loop",
      "check": "triage_then_prioritize_deliberately",
      "status": "pass",
      "evidence": "red line: issues are triaged, then prioritized deliberately"
    },
    {
      "section": "response_craft_and_red_lines",
      "check": "acknowledge_expectation_deliver_confirm_followed",
      "status": "pass",
      "evidence": "method step 4: responses follow acknowledge, set expectation, deliver, confirm"
    },
    {
      "section": "response_craft_and_red_lines",
      "check": "mistakes_owned_plainly",
      "status": "pass",
      "evidence": "method step 4: mistakes are owned plainly"
    },
    {
      "section": "response_craft_and_red_lines",
      "check": "never_argues_publicly",
      "status": "pass",
      "evidence": "method step 4: never argue publicly"
    },
    {
      "section": "response_craft_and_red_lines",
      "check": "never_promises_unshipped_dates_or_features",
      "status": "pass",
      "evidence": "red line: never promise what isn't shipped — no unshipped dates or features are promised"
    },
    {
      "section": "response_craft_and_red_lines",
      "check": "reporter_privacy_never_leaked_in_public_threads",
      "status": "pass",
      "evidence": "red line: reporter privacy is never leaked in public threads"
    },
    {
      "section": "release_and_incident_comms",
      "check": "changelog_highlights_for_users_published",
      "status": "pass",
      "evidence": "method step 5: changelog highlights for users are published"
    },
    {
      "section": "release_and_incident_comms",
      "check": "incident_templates_ready",
      "status": "pass",
      "evidence": "quality gate: incident comms templates are ready"
    },
    {
      "section": "release_and_incident_comms",
      "check": "incident_templates_include_honesty_rules",
      "status": "pass",
      "evidence": "quality gate: incident comms templates carry the honesty rules"
    },
    {
      "section": "release_and_incident_comms",
      "check": "incident_status_honest_no_fake_precision",
      "status": "pass",
      "evidence": "method step 5: incident updates give honest status — 'investigating' is not fake precision"
    },
    {
      "section": "release_and_incident_comms",
      "check": "follow_up_after_resolution_sent",
      "status": "pass",
      "evidence": "method step 5: a follow-up is sent after resolution"
    },
    {
      "section": "community_norms",
      "check": "code_of_conduct_exists",
      "status": "pass",
      "evidence": "method step 6: a code of conduct exists"
    },
    {
      "section": "community_norms",
      "check": "moderation_process_documented",
      "status": "pass",
      "evidence": "quality gate: community guidelines and a documented moderation process exist where a community runs"
    },
    {
      "section": "community_norms",
      "check": "moderation_applied_consistently",
      "status": "pass",
      "evidence": "method step 6: moderation is consistent"
    },
    {
      "section": "community_norms",
      "check": "contributors_celebrated",
      "status": "pass",
      "evidence": "method step 6: contributors are celebrated"
    },
    {
      "section": "community_norms",
      "check": "spaces_spam_free_without_hostility",
      "status": "pass",
      "evidence": "method step 6: spaces are kept spam-free without turning hostile"
    },
    {
      "section": "measurement",
      "check": "first_response_time_measured",
      "status": "pass",
      "evidence": "method step 7: first response time is measured"
    },
    {
      "section": "measurement",
      "check": "resolution_time_measured",
      "status": "pass",
      "evidence": "method step 7: resolution time is measured"
    },
    {
      "section": "measurement",
      "check": "recurring_themes_tracked",
      "status": "pass",
      "evidence": "method step 7: recurring themes are tracked"
    },
    {
      "section": "measurement",
      "check": "satisfaction_signals_observed",
      "status": "pass",
      "evidence": "method step 7: quiet satisfaction signals are observed"
    },
    {
      "section": "measurement",
      "check": "monthly_review_held",
      "status": "pass",
      "evidence": "method step 7: a monthly review is held"
    },
    {
      "section": "measurement",
      "check": "themes_feed_product",
      "status": "pass",
      "evidence": "method step 7: themes feed the product"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "computed_tracked_share": "1.000000",
  "tracked_difference": "0.000000",
  "computed_theme_coverage_ratio": "1.000000",
  "theme_coverage_difference": "0.000000",
  "triage_categories_not_covered": [],
  "computed_thread_closure_share": "1.000000",
  "thread_closure_difference": "0.000000",
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across seven sections.",
  "stamp": "COMMUNITY SUPPORT OPERATIONS\nentity: test-org\nVERDICT: COMMUNITY_SUPPORT_READY\n  intake_and_slas              pass\n  help_docs_and_deflection     pass\n  triage_loop                  pass\n  response_craft_and_red_lines pass\n  release_and_incident_comms   pass\n  community_norms              pass\n  measurement                  pass\n38 pass, 0 fail, 0 missing of 38 checks across seven sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "entity": "bad-org",
  "intake": {
    "channels_defined": true,
    "sla_targets_documented": true,
    "outage_target_hours": 5.0,
    "broken_target_hours": 2.0,
    "question_target_hours": 3.0,
    "messages_received": 100,
    "messages_tracked": 50,
    "support_messages_left_untracked_in_dms": false
  },
  "help_docs": {
    "faq_covers_top_recurring_questions": true,
    "docs_updated_from_actual_tickets": true,
    "fixes_link_doc_where_possible": true,
    "top_theme_count": 10,
    "themes_with_doc_or_backlog_count": 5
  },
  "triage": {
    "categories_used": [
      "bug",
      "feature"
    ],
    "bugs_require_reproduction": true,
    "bugs_filed_in_tracker_with_evidence": true,
    "features_routed_to_backlog": true,
    "threads_total": 10,
    "threads_closed_with_resolution_or_tracked_item": 5,
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

Response (`response_text`):

```json
{
  "service": "community-support-operations",
  "atom_version": "0.1.0",
  "entity": "bad-org",
  "verdict": "COMMUNITY_SUPPORT_NOT_READY",
  "sections": {
    "intake_and_slas": "fail",
    "help_docs_and_deflection": "fail",
    "triage_loop": "fail",
    "response_craft_and_red_lines": "pass",
    "release_and_incident_comms": "pass",
    "community_norms": "pass",
    "measurement": "pass"
  },
  "checks": [
    {
      "section": "intake_and_slas",
      "check": "channels_defined",
      "status": "pass",
      "evidence": "method step 1: support channels are defined"
    },
    {
      "section": "intake_and_slas",
      "check": "sla_targets_documented",
      "status": "pass",
      "evidence": "quality gate: channels and SLA response-time targets are documented"
    },
    {
      "section": "intake_and_slas",
      "check": "sla_targets_respect_severity_order",
      "status": "fail",
      "evidence": "method step 1: the declared response-time targets respect the severity order the skill names — outage shorter than broken, broken shorter than question (outage > broken > question); no target value itself is judged, the skill states none"
    },
    {
      "section": "intake_and_slas",
      "check": "every_message_tracked",
      "status": "fail",
      "evidence": "method step 1: every message lands somewhere tracked — the declared tracked count equals the declared received count"
    },
    {
      "section": "intake_and_slas",
      "check": "no_support_messages_left_untracked_in_dms",
      "status": "pass",
      "evidence": "method step 1: no support DMs vanish into history untracked"
    },
    {
      "section": "help_docs_and_deflection",
      "check": "faq_covers_top_recurring_questions",
      "status": "pass",
      "evidence": "method step 2: FAQ/help docs cover the top recurring questions"
    },
    {
      "section": "help_docs_and_deflection",
      "check": "docs_updated_from_actual_tickets",
      "status": "pass",
      "evidence": "method step 2: help docs are updated from actual tickets"
    },
    {
      "section": "help_docs_and_deflection",
      "check": "fixes_link_doc_where_possible",
      "status": "pass",
      "evidence": "method step 2: fixes link a help doc where possible"
    },
    {
      "section": "help_docs_and_deflection",
      "check": "top_ten_themes_identified",
      "status": "pass",
      "evidence": "quality gate: the top themes are the top 10 the skill names — the declared top-theme count is 10"
    },
    {
      "section": "help_docs_and_deflection",
      "check": "all_top_themes_have_doc_or_backlog",
      "status": "fail",
      "evidence": "quality gate: every top theme has a help doc or a backlog entry — the declared covered count equals the declared top-theme count"
    },
    {
      "section": "triage_loop",
      "check": "triage_categories_cover_stated_categories",
      "status": "fail",
      "evidence": "method step 3: the categories used cover every category the skill names — bug, feature, usage, noise"
    },
    {
      "section": "triage_loop",
      "check": "bugs_require_reproduction",
      "status": "pass",
      "evidence": "method step 3: bugs need reproductions"
    },
    {
      "section": "triage_loop",
      "check": "bugs_filed_in_tracker_with_evidence",
      "status": "pass",
      "evidence": "method step 3: bugs go to the issue tracker with evidence"
    },
    {
      "section": "triage_loop",
      "check": "features_routed_to_backlog",
      "status": "pass",
      "evidence": "method step 3: features are routed to the backlog"
    },
    {
      "section": "triage_loop",
      "check": "every_thread_ends_with_resolution_or_tracked_item",
      "status": "fail",
      "evidence": "method step 3: every thread ends with a resolution or a tracked item — the declared closed count equals the declared thread total"
    },
    {
      "section": "triage_loop",
      "check": "no_unanswered_obvious_issues",
      "status": "pass",
      "evidence": "red line: no unanswered 'obvious' issues"
    },
    {
      "section": "triage_loop",
      "check": "triage_then_prioritize_deliberately",
      "status": "pass",
      "evidence": "red line: issues are triaged, then prioritized deliberately"
    },
    {
      "section": "response_craft_and_red_lines",
      "check": "acknowledge_expectation_deliver_confirm_followed",
      "status": "pass",
      "evidence": "method step 4: responses follow acknowledge, set expectation, deliver, confirm"
    },
    {
      "section": "response_craft_and_red_lines",
      "check": "mistakes_owned_plainly",
      "status": "pass",
      "evidence": "method step 4: mistakes are owned plainly"
    },
    {
      "section": "response_craft_and_red_lines",
      "check": "never_argues_publicly",
      "status": "pass",
      "evidence": "method step 4: never argue publicly"
    },
    {
      "section": "response_craft_and_red_lines",
      "check": "never_promises_unshipped_dates_or_features",
      "status": "pass",
      "evidence": "red line: never promise what isn't shipped — no unshipped dates or features are promised"
    },
    {
      "section": "response_craft_and_red_lines",
      "check": "reporter_privacy_never_leaked_in_public_threads",
      "status": "pass",
      "evidence": "red line: reporter privacy is never leaked in public threads"
    },
    {
      "section": "release_and_incident_comms",
      "check": "changelog_highlights_for_users_published",
      "status": "pass",
      "evidence": "method step 5: changelog highlights for users are published"
    },
    {
      "section": "release_and_incident_comms",
      "check": "incident_templates_ready",
      "status": "pass",
      "evidence": "quality gate: incident comms templates are ready"
    },
    {
      "section": "release_and_incident_comms",
      "check": "incident_templates_include_honesty_rules",
      "status": "pass",
      "evidence": "quality gate: incident comms templates carry the honesty rules"
    },
    {
      "section": "release_and_incident_comms",
      "check": "incident_status_honest_no_fake_precision",
      "status": "pass",
      "evidence": "method step 5: incident updates give honest status — 'investigating' is not fake precision"
    },
    {
      "section": "release_and_incident_comms",
      "check": "follow_up_after_resolution_sent",
      "status": "pass",
      "evidence": "method step 5: a follow-up is sent after resolution"
    },
    {
      "section": "community_norms",
      "check": "code_of_conduct_exists",
      "status": "pass",
      "evidence": "method step 6: a code of conduct exists"
    },
    {
      "section": "community_norms",
      "check": "moderation_process_documented",
      "status": "pass",
      "evidence": "quality gate: community guidelines and a documented moderation process exist where a community runs"
    },
    {
      "section": "community_norms",
      "check": "moderation_applied_consistently",
      "status": "pass",
      "evidence": "method step 6: moderation is consistent"
    },
    {
      "section": "community_norms",
      "check": "contributors_celebrated",
      "status": "pass",
      "evidence": "method step 6: contributors are celebrated"
    },
    {
      "section": "community_norms",
      "check": "spaces_spam_free_without_hostility",
      "status": "pass",
      "evidence": "method step 6: spaces are kept spam-free without turning hostile"
    },
    {
      "section": "measurement",
      "check": "first_response_time_measured",
      "status": "pass",
      "evidence": "method step 7: first response time is measured"
    },
    {
      "section": "measurement",
      "check": "resolution_time_measured",
      "status": "pass",
      "evidence": "method step 7: resolution time is measured"
    },
    {
      "section": "measurement",
      "check": "recurring_themes_tracked",
      "status": "pass",
      "evidence": "method step 7: recurring themes are tracked"
    },
    {
      "section": "measurement",
      "check": "satisfaction_signals_observed",
      "status": "pass",
      "evidence": "method step 7: quiet satisfaction signals are observed"
    },
    {
      "section": "measurement",
      "check": "monthly_review_held",
      "status": "pass",
      "evidence": "method step 7: a monthly review is held"
    },
    {
      "section": "measurement",
      "check": "themes_feed_product",
      "status": "pass",
      "evidence": "method step 7: themes feed the product"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "computed_tracked_share": "0.500000",
  "tracked_difference": "-50.000000",
  "computed_theme_coverage_ratio": "0.500000",
  "theme_coverage_difference": "-5.000000",
  "triage_categories_not_covered": [
    "usage",
    "noise"
  ],
  "computed_thread_closure_share": "0.500000",
  "thread_closure_difference": "-5.000000",
  "summary": "33 pass, 5 fail, 0 missing of 38 checks across seven sections.",
  "stamp": "COMMUNITY SUPPORT OPERATIONS\nentity: bad-org\nVERDICT: COMMUNITY_SUPPORT_NOT_READY\n  intake_and_slas              fail\n  help_docs_and_deflection     fail\n  triage_loop                  fail\n  response_craft_and_red_lines pass\n  release_and_incident_comms   pass\n  community_norms              pass\n  measurement                  pass\n33 pass, 5 fail, 0 missing of 38 checks across seven sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "entity": "bad-types",
  "intake": {
    "channels_defined": "YES"
  }
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "intake.channels_defined",
  "detail": "intake.channels_defined must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 38 / 38 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses, and computed-field values listed |
| Input reference typed | Yes — 43 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom audits a declared community/support operations artifact; its verdict is an operations-readiness judgment, not compliance or audit evidence, and community support operations is not a regulated domain (finance, security, licensing, privacy).
