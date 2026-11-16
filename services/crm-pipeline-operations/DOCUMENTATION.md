# Crm pipeline operations — `crm-pipeline-operations`

**Display name:** Crm pipeline operations · **Slug:** `crm-pipeline-operations` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run for this atom; the exact request and response are reproduced verbatim under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up and issue a gateway key scoped to `crm-pipeline-operations` (the full flow is in the first how-to guide below). Every call sends it as `Authorization: Bearer <key>`.
2. **Assemble the manifest.** Build one JSON object declaring the evidence the atom checks. In the recorded run the entity is `Acme Corp`. Fill every group the Input reference lists — an absent field is not a neutral omission: it is recorded as missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`.
3. **Send it.** `POST https://atoms.pipavia.com/v1/crm-pipeline-operations` with the manifest as the body (or call the MCP tool `crm_pipeline_operations` with the same object as its arguments).
4. **Read the verdict first.** The recorded response returns HTTP 200 with verdict `CRM_PIPELINE_READY` — the strongest verdict this atom gives. Its `summary` reads: "38 pass, 0 fail, 0 missing of 38 checks across eight sections."
5. **Read the sections, then the checks.** All 8 sections report `pass` (`single_source_of_truth`, `contact_rules_and_privacy`, `pipeline_stages_and_deals`, `follow_up_cadence_and_logging`, `reporting_and_forecasts`, `consent_and_comms`, `win_loss_discipline`, `minimal_data_and_retention`), and all 38 entries in `checks` report `status: pass`, each carrying the `evidence` string that states the requirement it checked.
6. **Read the computed fields.** The manifest declares all six stated pipeline stages (`lead`, `qualified`, `proposal`, `decision`, `won`, `lost`) and one complete open deal row that carries a next step and a next-step date and is younger than the caller-declared stale threshold — so the stage-coverage, next-step and staleness computations all pass, and the computed open and pipeline value totals agree with the declared rows. The response's `computed_status` is `within_stated_limits_on_declared_evidence`, and its `stamp` field carries a plain-text rendering of the same verdict for logs and tickets.
7. **Keep the response.** It is the deliverable: one bounded judgment artifact for that one manifest. Same manifest in → same response out (the verification battery confirmed byte-identical repeat REST responses and MCP/REST parity for the full-pass manifest).

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "crm-pipeline-operations"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -X POST https://atoms.pipavia.com/v1/crm-pipeline-operations \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

A well-formed manifest returns HTTP 200 and a verdict body (see Reference — Output format). Authentication and shape failures return the error shapes listed under Reference — Errors, never a verdict.

### Call via MCP

POST to `https://atoms.pipavia.com/mcp/crm-pipeline-operations` with the same `Authorization: Bearer <key>` header and call the tool named `crm_pipeline_operations`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same report core as the REST response (parity was verified in the recorded battery: the full-pass manifest's MCP `structuredContent` was deep-equal to the REST artifact).

### Read a failing verdict and fix the manifest

A failing verdict is still HTTP 200 — it is a result, not a transport error. Work it in this order:

1. **Read `verdict`.** `CRM_PIPELINE_NOT_READY` means at least one check failed. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. The passing verdict here is `CRM_PIPELINE_READY`.
2. **Read `sections`.** A section reports `fail` if any of its checks failed, `insufficient_evidence` if none failed but at least one is missing, and `pass` only when all of its checks pass. Start with the failing sections.
3. **Read `checks`.** Filter to `status: fail` for breaches and `status: missing` for gaps. Each entry names its `section`, its `check`, and an `evidence` string stating the requirement. `fail` means the field was present but false, invalid, or arithmetically inconsistent; `missing` means the field (or a value a computation needs) was absent.
4. **Fix the underlying facts, then resubmit.** In the recorded violations run the failing checks were exactly: `no_unapproved_outreach`, `pipeline_stages_cover_stated_stages`, `every_open_deal_has_next_step_and_date`, `no_open_deal_stale_beyond_declared_threshold` (34 pass, 4 fail, 0 missing of 38 checks across eight sections.) In the recorded violations run the stage list covered only `lead`, the single open deal had no next step/date and was older than the declared stale threshold, and unapproved outreach was declared sent. Fixing the verdict means fixing the underlying operations facts those declarations report — cover the stated stages, give every open deal a next step and date, work or close stale deals, and stop unapproved outreach — then resubmit a manifest that declares the corrected facts.
5. **Do not confuse a verdict with a 422.** A failing verdict means the manifest was well-typed and was judged. A 422 means the manifest was not well-typed and was never judged — see the next guide.

### Handle a 422 invalid_input

A type violation returns HTTP 422 with a body naming the offending field — it never returns a verdict. The recorded malformed run for this atom sent a value of the wrong type and received:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "pipeline.stale_threshold_days",
  "detail": "pipeline.stale_threshold_days must be a number"
}
```

To handle it: read `field` (`pipeline.stale_threshold_days`) and `detail` ("pipeline.stale_threshold_days must be a number"), correct the value's type in your manifest at exactly that path, and resubmit the whole manifest. Do not drop the field to silence the error — an absent field is missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`. One 422 reports one field; if several fields are mistyped, fix and resubmit iteratively.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/crm-pipeline-operations` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/crm-pipeline-operations` — tool name `crm_pipeline_operations`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` (email; sign-in link emailed), then `POST /v1/keys` with `{"atom": "crm-pipeline-operations"}` after opening the link. A key for one atom never verifies for another: scope is per atom.

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table (which states: all fields are booleans unless noted) and corroborated by `contract.yaml` and the recorded MCP `inputSchema`. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them). An absent field = missing evidence; a present-but-false/invalid field = a failed check, except where a note says otherwise.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `entity` | string | (string; carried into the verdict output, not itself checked) |

#### Read by: single_source_of_truth

| Field | Type | Notes |
|---|---|---|
| `source.single_system_maintained` | boolean | — |
| `source.contacts_carry_who_what_context_minimum` | boolean | — |
| `source.dedupe_cadence_set` | boolean | — |
| `source.stale_contacts_flagged_not_trusted` | boolean | — |

#### Read by: contact_rules_and_privacy

| Field | Type | Notes |
|---|---|---|
| `contact_rules.sensitivity_flags_honored` | boolean | — |
| `contact_rules.sensitivity_flags_override_everything` | boolean | — |
| `contact_rules.outreach_drafted_for_review_never_auto_sent` | boolean | — |
| `contact_rules.nothing_personal_shared_beyond_purpose` | boolean | — |
| `contact_rules.unapproved_outreach_sent` | boolean | (must be `false` to pass — skill quality gate) |
| `contact_rules.bulk_unsolicited_outreach_sent` | boolean | (must be `false` to pass — skill red line) |
| `contact_rules.personal_contacts_uploaded_to_third_parties_without_purpose_and_consent` | boolean | (must be `false` to pass — skill red line) |

#### Read by: pipeline_stages_and_deals

| Field | Type | Notes |
|---|---|---|
| `pipeline.stages_used` | array | (list of strings; computed, see below) |
| `pipeline.entry_criteria_defined_for_each_stage` | boolean | — |
| `pipeline.exit_criteria_defined_for_each_stage` | boolean | — |
| `pipeline.deals_advance_on_evidence_not_optimism` | boolean | — |
| `pipeline.stale_threshold_days` | number | (number; caller-declared staleness window, computed, see below) |
| `pipeline.deals` | array | (list of deal-row objects; computed, see below) |
| `pipeline.deals[].stage` | string | (string; deal-row field) |
| `pipeline.deals[].value` | number | (number; deal-row field) |
| `pipeline.deals[].age_days` | number | (number; deal-row field) |
| `pipeline.deals[].has_next_step` | boolean | (boolean; deal-row field) |
| `pipeline.deals[].has_next_step_date` | boolean | (boolean; deal-row field) |
| `pipeline.deals[].open` | boolean | (boolean; deal-row field) |

#### Read by: follow_up_cadence_and_logging

| Field | Type | Notes |
|---|---|---|
| `follow_up.cadence_scheduled` | boolean | — |
| `follow_up.every_touch_carries_value` | boolean | — |
| `follow_up.every_interaction_logged_with_what_said_promised_next` | boolean | — |
| `follow_up.promises_tracked_until_delivered` | boolean | — |

#### Read by: reporting_and_forecasts

| Field | Type | Notes |
|---|---|---|
| `reporting.pipeline_reported_by_stage_and_age` | boolean | — |
| `reporting.conversion_rates_by_stage_reported` | boolean | — |
| `reporting.stuck_deal_list_maintained` | boolean | — |
| `reporting.stuck_deal_review_held_on_cadence` | boolean | — |
| `reporting.forecasts_use_honest_probabilities` | boolean | — |

#### Read by: consent_and_comms

| Field | Type | Notes |
|---|---|---|
| `consent.marketing_consent_recorded` | boolean | — |
| `consent.consent_flags_current` | boolean | — |
| `consent.unsubscribe_honored_instantly` | boolean | — |
| `consent.segmentation_per_consent` | boolean | — |
| `consent.scraped_third_party_personal_data_into_crm` | boolean | (must be `false` to pass — skill method step 6) |

#### Read by: win_loss_discipline

| Field | Type | Notes |
|---|---|---|
| `win_loss.reasons_captured` | boolean | — |
| `win_loss.reasons_include_yours_and_theirs` | boolean | — |
| `win_loss.feeds_messaging_product_and_process_improvements` | boolean | — |

#### Read by: minimal_data_and_retention

| Field | Type | Notes |
|---|---|---|
| `minimal_data.only_relationship_needed_data_collected` | boolean | — |
| `minimal_data.retention_for_dead_leads_defined` | boolean | — |

Total typed input fields documented: 43 (each SERVICE.md field-table row; nested row-entry fields are listed individually where SERVICE.md lists them).

### Checks

All 38 checks, named exactly as in the recorded full-pass REST response's `checks` array (cross-checked against SERVICE.md; the counts agree). For each check, the Requirement column is the recorded `evidence` string, which states what must hold to pass.

**Per-check status semantics (all checks):** `pass` = the requirement held on the declared evidence; `fail` = the field was present but false/invalid, or a computed comparison did not hold; `missing` = the field, list, or a value a computation needs was absent, so the check could not be evaluated. There is no separate not-applicable status in the recorded responses: where a check is conditional and its gate is not declared, it is recorded as `pass` with evidence stating that no such case was declared (see the notes on the individual conditional checks, where this atom has them).

#### Section: single_source_of_truth

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `single_system_maintained` | method step 1: one system (or structured folder) is the single source of truth for contacts and interactions | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `contacts_carry_who_what_context_minimum` | method step 1: contacts carry the who/what/context minimum | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `dedupe_cadence_set` | quality gate: a dedupe cadence is set — dedupe happens on a schedule | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `stale_contacts_flagged_not_trusted` | method step 1: stale contacts are flagged, not trusted | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: contact_rules_and_privacy

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `sensitivity_flags_honored` | quality gate: sensitivity flags are honored | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `sensitivity_flags_override_everything` | red line: sensitivity flags override everything | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `outreach_drafted_for_review_never_auto_sent` | method step 2: outreach is drafted for review, never auto-sent | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `nothing_personal_shared_beyond_purpose` | method step 2: nothing personal is shared beyond its purpose | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_unapproved_outreach` | quality gate: no unapproved outreach is sent | Pass requires `contact_rules.unapproved_outreach_sent` to be declared `false` (skill quality gate). Declared `true` fails; absent is `missing`. |
| `no_bulk_unsolicited_outreach` | red line: never bulk unsolicited outreach (spam) | Pass requires `contact_rules.bulk_unsolicited_outreach_sent` to be declared `false` (skill red line). Declared `true` fails; absent is `missing`. |
| `no_personal_contacts_uploaded_without_purpose_and_consent` | red line: personal contacts are never uploaded to third parties without purpose and consent | Pass requires `contact_rules.personal_contacts_uploaded_to_third_parties_without_purpose_and_consent` to be declared `false` (skill red line). Declared `true` fails; absent is `missing`. |
#### Section: pipeline_stages_and_deals

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `pipeline_stages_cover_stated_stages` | method step 3: the stages used cover every stage the skill names — lead, qualified, proposal, decision, won, lost | Computed. Pass requires declared `pipeline.stages_used` to contain all six stated entries (`lead`, `qualified`, `proposal`, `decision`, `won`, `lost`); unknown entries do not count toward coverage. Absent list is `missing`; an empty list is present and fails. |
| `entry_criteria_defined_for_each_stage` | method step 3: entry criteria are defined for each pipeline stage | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `exit_criteria_defined_for_each_stage` | method step 3: exit criteria are defined for each pipeline stage — deals advance on evidence, not optimism | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `deals_advance_on_evidence_not_optimism` | method step 3: deals advance on evidence (call happened, proposal sent), not optimism | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `deal_rows_complete` | method step 3: every declared deal row carries a stage, a value, an age in days, a next-step flag, a next-step-date flag, and an open flag | Computed. Pass requires every declared deal row to carry `stage`, `value`, `age_days`, `has_next_step`, `has_next_step_date` and `open`. An incomplete row makes the row-derived checks `missing`; an empty deals list is present and fails. |
| `deal_stages_are_stated_stages` | method step 3: every declared deal row's stage is one of the stages the skill names — lead, qualified, proposal, decision, won, lost | Computed. Pass requires every complete row's `stage` to be one of the six stated stages. |
| `every_open_deal_has_next_step_and_date` | quality gate: every open deal carries a next step and a next-step date — the declared open rows all declare both (a zero open-deal count fails: no open pipeline exists to prove this over) | Computed. Pass requires every row with `open = true` to declare both next-step flags. A zero open-deal count fails — no open pipeline exists to prove this over. |
| `no_open_deal_stale_beyond_declared_threshold` | method step 1: stale is flagged, not trusted — no declared open deal's age in days exceeds the caller-declared stale_threshold_days; the skill states no day count, so only the caller's own declared threshold is applied (a zero open-deal count fails: no open pipeline exists to prove this over) | Computed. Pass requires no open row's `age_days` to exceed the caller-declared `pipeline.stale_threshold_days` (an age exactly equal to the threshold is not stale). The skill states no day count, so only the caller's threshold is applied. A zero open-deal count fails, as above. |
#### Section: follow_up_cadence_and_logging

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `follow_up_cadence_scheduled` | method step 4: follow-up touches are scheduled on a cadence | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `every_follow_up_touch_carries_value` | method step 4: every scheduled touch carries value — an insight, a result, a useful link | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `every_interaction_logged_with_what_said_promised_next` | method step 4: every interaction is logged — what was said, what was promised, what is next | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `promises_tracked_until_delivered` | method step 4: what was promised is tracked until delivered | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: reporting_and_forecasts

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `pipeline_reported_by_stage_and_age` | method step 5: the pipeline is reported by stage and age | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `conversion_rates_by_stage_reported` | method step 5: conversion rates by stage are reported — base rates, not impressions | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `stuck_deal_list_maintained` | method step 5: a stuck-deal list is maintained | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `stuck_deal_review_held_on_cadence` | quality gate: the stuck-deal review is held on cadence | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `forecasts_use_honest_probabilities` | method step 5: reporting feeds revenue-management forecasts with honest probabilities | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: consent_and_comms

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `marketing_consent_recorded` | method step 6: marketing consent is recorded | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `consent_flags_current` | quality gate: consent flags are current | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `unsubscribe_honored_instantly` | method step 6: unsubscribe is honored instantly | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `segmentation_per_consent` | method step 6: segmentation is per consent | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_scraping_third_party_personal_data` | method step 6: no third-party personal data is scraped into the CRM | Pass requires `consent.scraped_third_party_personal_data_into_crm` to be declared `false`. Declared `true` fails; absent is `missing`. |
#### Section: win_loss_discipline

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `win_loss_reasons_captured` | quality gate: win/loss reasons are captured | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `win_loss_reasons_include_yours_and_theirs` | method step 7: the captured reason includes yours and theirs | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `win_loss_feeds_improvements` | method step 7: win/loss reasons feed messaging, product, and process improvements | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: minimal_data_and_retention

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `only_relationship_needed_data_collected` | method step 8: only what the relationship needs is collected, not everything possible | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `retention_for_dead_leads_defined` | method step 8: retention for dead leads is defined | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |

### Output format

HTTP 200 returns one JSON object. Fields observed in the recorded full-pass response, in recorded order:

| Field | Type (as recorded) | Meaning |
|---|---|---|
| `service` | string | Atom slug. |
| `atom_version` | string | Atom version that produced the verdict. |
| `entity` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `verdict` | string | The verdict (see Verdict vocabulary). |
| `sections` | object | Per-section statuses keyed by section name. |
| `checks` | array | Array of `{section, check, status, evidence}` objects — one per check. |
| `computed_status` | string | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when a computed check cannot be completed. |
| `pipeline_stages_not_covered` | array | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `deal_count` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `open_deal_count` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `stale_deal_count` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `open_deals_without_next_step_or_date_count` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `stage_distribution` | object | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `computed_open_value_total` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `computed_pipeline_value_total` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `summary` | string | One-line pass/fail/missing count summary. |
| `stamp` | string | Plain-text rendering of the verdict, sections and summary. |

Computed numeric fields follow the fixed serialization rule stated in SERVICE.md (fixed-decimal strings where SERVICE.md specifies them), shared by both implementations so repeat calls are byte-identical.

### Verdict vocabulary

- **`CRM_PIPELINE_READY`** — Every check passes (38 pass, 0 fail, 0 missing of 38 checks across eight sections.) The declared evidence is complete and consistent with the bound skill's method, quality gates and red lines.
- **`CRM_PIPELINE_NOT_READY`** — At least one check fails. The failing checks name the breached requirement and the evidence against it.
- **`INSUFFICIENT_EVIDENCE`** — Nothing failed, but at least one check is `missing`. The missing checks say exactly what to supply.

- **Section statuses:** `pass` (all checks in the section pass) · `fail` (at least one check in the section fails) · `insufficient_evidence` (no check fails but at least one is missing).
- **Per-check statuses:** `pass` · `fail` · `missing` (see Checks). No other per-check status occurs in the recorded responses; conditional checks that do not apply are recorded as `pass`, as documented above.
- **`computed_status` values:** `within_stated_limits_on_declared_evidence` (every computed check that could be completed held) · `outside_stated_limits_on_declared_evidence` (at least one computed check failed) · `null` (at least one computed check could not be completed).

### Errors

Only the shapes evidenced in the repo/gateway docs are listed; no other error payload is documented, and none should be assumed.

- **401 — unauthenticated:** missing or invalid key (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 401; do not assume one. Fix: send a valid key as `Authorization: Bearer <key>`.
- **403 — scope:** the key lacks this atom's scope (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 403; do not assume one. Fix: issue this atom's scope on your key via `POST /v1/keys`.
- **422 — `invalid_input`:** a field has the wrong type. Recorded body shape (verbatim from the recorded malformed run):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "pipeline.stale_threshold_days",
  "detail": "pipeline.stale_threshold_days must be a number"
}
```

  Here `field` is `pipeline.stale_threshold_days` and `detail` is "pipeline.stale_threshold_days must be a number". A 422 never carries a verdict.
- **429 — rate limit:** the per-key rate limit was exceeded (60/min, 10,000/day per key; USER-GUIDE.md and `contract.yaml`). No error body shape is evidenced in the repo for 429; do not assume one. Fix: slow down and retry within the limits.

### Rate limits + pricing status

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- **Pricing:** unit = deliverable; `pricing.rate` is null (rate_status: pending). **Free during trial — rate pending.** No price is set; per SERVICE.md, prices are set only from measured production cost per unit.

## Explanation

This atom is a deterministic completeness-and-consistency audit of a **declared** CRM pipeline-operations artifact — it operates no CRM, contacts nobody, and moves no deals. Its 38 checks across eight sections cover the single source of truth, contact rules and privacy, pipeline stages and deals, follow-up cadence and logging, reporting and forecasts, consent and communications, win/loss discipline, and minimal data and retention. Five checks are computed from the declared rows: stage coverage against the six stages the skill names; deal-row completeness; deal stages being stated stages; every open deal carrying a next step and a next-step date (a zero open-deal count fails, because no open pipeline exists to prove the rule over); and staleness judged only against the caller's own declared `stale_threshold_days`, because the skill states no day count. Conversion rates are checked only as a declared reporting boolean: a per-stage rate cannot be re-derived from current-stage deal rows, and the skill states no target rate.

The verdict is decided mechanically. Each check ends `pass`, `fail`, or `missing`. Any `fail` makes the verdict `CRM_PIPELINE_NOT_READY`. Otherwise any `missing` makes it `INSUFFICIENT_EVIDENCE`. Only when all 38 checks pass is the verdict `CRM_PIPELINE_READY`. Computed money totals are serialized as strings with exactly six decimal places by a fixed round-half-up rule shared by both implementations; counts and the stage distribution are plain integers.

A ready verdict means the declared artifact is complete and consistent — it does **not** mean the real pipeline is well run. The atom verifies no declared value and judges no quality: not whether a next step is meaningful, a follow-up touch really carried value, a forecast probability is actually honest, entry/exit criteria are well written, or a win/loss reason is insightful. On privacy: the artifact declares counts, deal-row facts and process facts only — no contact's personal data is an input, and the core reads none. Thresholds the skill does not state are declined, not invented: no dedupe frequency, no follow-up or review interval, no retention period length, no minimum deal count or pipeline value, and no forecast calibration threshold.

**Buyer / use context.** Buyers are teams and agents running consulting and sales pipelines who want the same discipline check applied to their pipeline-operations record on demand, per use. The house's own consulting pipeline follow-ups are an internal caller. What is sold is the deliverable — the readiness verdict with per-check evidence and computed pipeline totals — never the underlying CRM knowledge itself. Note the privacy-adjacent declarations (consent recorded, sensitivity flags honored) are process declarations inside an operations audit; they do not turn this verdict into compliance evidence — see the regulators decision under Role views.

## Role views

### For integrators (Users)

Integrate against the two endpoints above with one scoped key per atom. Treat HTTP 200 as a judged result (read `verdict`, then `sections`, then `checks`), HTTP 422 as a client-side type bug (read `field`/`detail`, fix, resubmit), and 401/403/429 as auth/scope/rate problems respectively. Cache nothing about a verdict across manifests: the verdict is a pure function of the manifest you sent, so re-send after any manifest change. The worked examples below are real recorded request/response pairs — use example 1 as your golden-path fixture and example 3 as your 422-handling fixture.

### For developers

Manifest authoring: declare facts, do not target the verdict — computed checks re-derive totals, coverage and vocabulary membership from the declared values themselves, so inconsistent declarations fail on their own arithmetic. Determinism: the core is deterministic (Python oracle and TypeScript port, parity-proven locally per SERVICE.md); the same manifest returns a byte-identical REST response, and MCP structured content equals the REST report core. Implementation pointers: `src/` holds the atom's core, `tests/` its test suite, `SERVICE.md` is the normative field/check specification, and `contract.yaml` the machine-readable contract (key namespace/prefix, rate limits, pricing status). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract binding rule R1).

### For ops

Endpoints: REST `POST /v1/crm-pipeline-operations` and MCP `POST /mcp/crm-pipeline-operations` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope is per atom — a 403 spike means clients are calling with keys that lack this atom's scope, not an outage. Rate limits: 60/min and 10,000/day per key; watch 429s per key before raising limits. Error monitoring: alert on 5xx (none are part of this atom's documented behavior) and on 422 rate by `field` (a rising 422 rate on one field usually means a client manifest generator changed shape). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing is still pending (free during trial), so metering is for the cost ledger, not billing.

## Worked examples

Provenance: recorded 2026-11-16T02:44:00.657096+00:00 against gateway v1.1.0, external verification lane, source `verification/work/crm-pipeline-operations/evidence.json`. Inputs and REST responses below are reproduced verbatim (pretty-printed with indent 2 only) and were verified mechanically against that evidence file after writing: each fenced block parses to a JSON value identical to the recorded value.

### Example 1 — Full-pass

Recorded expectation: HTTP 200, verdict `CRM_PIPELINE_READY`.

Input (recorded `input`):

```json
{
  "entity": "Acme Corp",
  "source": {
    "single_system_maintained": true,
    "contacts_carry_who_what_context_minimum": true,
    "dedupe_cadence_set": true,
    "stale_contacts_flagged_not_trusted": true
  },
  "contact_rules": {
    "sensitivity_flags_honored": true,
    "sensitivity_flags_override_everything": true,
    "outreach_drafted_for_review_never_auto_sent": true,
    "nothing_personal_shared_beyond_purpose": true,
    "unapproved_outreach_sent": false,
    "bulk_unsolicited_outreach_sent": false,
    "personal_contacts_uploaded_to_third_parties_without_purpose_and_consent": false
  },
  "pipeline": {
    "stages_used": [
      "lead",
      "qualified",
      "proposal",
      "decision",
      "won",
      "lost"
    ],
    "entry_criteria_defined_for_each_stage": true,
    "exit_criteria_defined_for_each_stage": true,
    "deals_advance_on_evidence_not_optimism": true,
    "stale_threshold_days": 30,
    "deals": [
      {
        "stage": "lead",
        "value": 1000.0,
        "age_days": 10,
        "has_next_step": true,
        "has_next_step_date": true,
        "open": true
      }
    ]
  },
  "follow_up": {
    "cadence_scheduled": true,
    "every_touch_carries_value": true,
    "every_interaction_logged_with_what_said_promised_next": true,
    "promises_tracked_until_delivered": true
  },
  "reporting": {
    "pipeline_reported_by_stage_and_age": true,
    "conversion_rates_by_stage_reported": true,
    "stuck_deal_list_maintained": true,
    "stuck_deal_review_held_on_cadence": true,
    "forecasts_use_honest_probabilities": true
  },
  "consent": {
    "marketing_consent_recorded": true,
    "consent_flags_current": true,
    "unsubscribe_honored_instantly": true,
    "segmentation_per_consent": true,
    "scraped_third_party_personal_data_into_crm": false
  },
  "win_loss": {
    "reasons_captured": true,
    "reasons_include_yours_and_theirs": true,
    "feeds_messaging_product_and_process_improvements": true
  },
  "minimal_data": {
    "only_relationship_needed_data_collected": true,
    "retention_for_dead_leads_defined": true
  }
}
```

REST response (recorded `response_text`):

```json
{
  "service": "crm-pipeline-operations",
  "atom_version": "0.1.0",
  "entity": "Acme Corp",
  "verdict": "CRM_PIPELINE_READY",
  "sections": {
    "single_source_of_truth": "pass",
    "contact_rules_and_privacy": "pass",
    "pipeline_stages_and_deals": "pass",
    "follow_up_cadence_and_logging": "pass",
    "reporting_and_forecasts": "pass",
    "consent_and_comms": "pass",
    "win_loss_discipline": "pass",
    "minimal_data_and_retention": "pass"
  },
  "checks": [
    {
      "section": "single_source_of_truth",
      "check": "single_system_maintained",
      "status": "pass",
      "evidence": "method step 1: one system (or structured folder) is the single source of truth for contacts and interactions"
    },
    {
      "section": "single_source_of_truth",
      "check": "contacts_carry_who_what_context_minimum",
      "status": "pass",
      "evidence": "method step 1: contacts carry the who/what/context minimum"
    },
    {
      "section": "single_source_of_truth",
      "check": "dedupe_cadence_set",
      "status": "pass",
      "evidence": "quality gate: a dedupe cadence is set — dedupe happens on a schedule"
    },
    {
      "section": "single_source_of_truth",
      "check": "stale_contacts_flagged_not_trusted",
      "status": "pass",
      "evidence": "method step 1: stale contacts are flagged, not trusted"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "sensitivity_flags_honored",
      "status": "pass",
      "evidence": "quality gate: sensitivity flags are honored"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "sensitivity_flags_override_everything",
      "status": "pass",
      "evidence": "red line: sensitivity flags override everything"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "outreach_drafted_for_review_never_auto_sent",
      "status": "pass",
      "evidence": "method step 2: outreach is drafted for review, never auto-sent"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "nothing_personal_shared_beyond_purpose",
      "status": "pass",
      "evidence": "method step 2: nothing personal is shared beyond its purpose"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "no_unapproved_outreach",
      "status": "pass",
      "evidence": "quality gate: no unapproved outreach is sent"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "no_bulk_unsolicited_outreach",
      "status": "pass",
      "evidence": "red line: never bulk unsolicited outreach (spam)"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "no_personal_contacts_uploaded_without_purpose_and_consent",
      "status": "pass",
      "evidence": "red line: personal contacts are never uploaded to third parties without purpose and consent"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "pipeline_stages_cover_stated_stages",
      "status": "pass",
      "evidence": "method step 3: the stages used cover every stage the skill names — lead, qualified, proposal, decision, won, lost"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "entry_criteria_defined_for_each_stage",
      "status": "pass",
      "evidence": "method step 3: entry criteria are defined for each pipeline stage"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "exit_criteria_defined_for_each_stage",
      "status": "pass",
      "evidence": "method step 3: exit criteria are defined for each pipeline stage — deals advance on evidence, not optimism"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "deals_advance_on_evidence_not_optimism",
      "status": "pass",
      "evidence": "method step 3: deals advance on evidence (call happened, proposal sent), not optimism"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "deal_rows_complete",
      "status": "pass",
      "evidence": "method step 3: every declared deal row carries a stage, a value, an age in days, a next-step flag, a next-step-date flag, and an open flag"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "deal_stages_are_stated_stages",
      "status": "pass",
      "evidence": "method step 3: every declared deal row's stage is one of the stages the skill names — lead, qualified, proposal, decision, won, lost"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "every_open_deal_has_next_step_and_date",
      "status": "pass",
      "evidence": "quality gate: every open deal carries a next step and a next-step date — the declared open rows all declare both (a zero open-deal count fails: no open pipeline exists to prove this over)"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "no_open_deal_stale_beyond_declared_threshold",
      "status": "pass",
      "evidence": "method step 1: stale is flagged, not trusted — no declared open deal's age in days exceeds the caller-declared stale_threshold_days; the skill states no day count, so only the caller's own declared threshold is applied (a zero open-deal count fails: no open pipeline exists to prove this over)"
    },
    {
      "section": "follow_up_cadence_and_logging",
      "check": "follow_up_cadence_scheduled",
      "status": "pass",
      "evidence": "method step 4: follow-up touches are scheduled on a cadence"
    },
    {
      "section": "follow_up_cadence_and_logging",
      "check": "every_follow_up_touch_carries_value",
      "status": "pass",
      "evidence": "method step 4: every scheduled touch carries value — an insight, a result, a useful link"
    },
    {
      "section": "follow_up_cadence_and_logging",
      "check": "every_interaction_logged_with_what_said_promised_next",
      "status": "pass",
      "evidence": "method step 4: every interaction is logged — what was said, what was promised, what is next"
    },
    {
      "section": "follow_up_cadence_and_logging",
      "check": "promises_tracked_until_delivered",
      "status": "pass",
      "evidence": "method step 4: what was promised is tracked until delivered"
    },
    {
      "section": "reporting_and_forecasts",
      "check": "pipeline_reported_by_stage_and_age",
      "status": "pass",
      "evidence": "method step 5: the pipeline is reported by stage and age"
    },
    {
      "section": "reporting_and_forecasts",
      "check": "conversion_rates_by_stage_reported",
      "status": "pass",
      "evidence": "method step 5: conversion rates by stage are reported — base rates, not impressions"
    },
    {
      "section": "reporting_and_forecasts",
      "check": "stuck_deal_list_maintained",
      "status": "pass",
      "evidence": "method step 5: a stuck-deal list is maintained"
    },
    {
      "section": "reporting_and_forecasts",
      "check": "stuck_deal_review_held_on_cadence",
      "status": "pass",
      "evidence": "quality gate: the stuck-deal review is held on cadence"
    },
    {
      "section": "reporting_and_forecasts",
      "check": "forecasts_use_honest_probabilities",
      "status": "pass",
      "evidence": "method step 5: reporting feeds revenue-management forecasts with honest probabilities"
    },
    {
      "section": "consent_and_comms",
      "check": "marketing_consent_recorded",
      "status": "pass",
      "evidence": "method step 6: marketing consent is recorded"
    },
    {
      "section": "consent_and_comms",
      "check": "consent_flags_current",
      "status": "pass",
      "evidence": "quality gate: consent flags are current"
    },
    {
      "section": "consent_and_comms",
      "check": "unsubscribe_honored_instantly",
      "status": "pass",
      "evidence": "method step 6: unsubscribe is honored instantly"
    },
    {
      "section": "consent_and_comms",
      "check": "segmentation_per_consent",
      "status": "pass",
      "evidence": "method step 6: segmentation is per consent"
    },
    {
      "section": "consent_and_comms",
      "check": "no_scraping_third_party_personal_data",
      "status": "pass",
      "evidence": "method step 6: no third-party personal data is scraped into the CRM"
    },
    {
      "section": "win_loss_discipline",
      "check": "win_loss_reasons_captured",
      "status": "pass",
      "evidence": "quality gate: win/loss reasons are captured"
    },
    {
      "section": "win_loss_discipline",
      "check": "win_loss_reasons_include_yours_and_theirs",
      "status": "pass",
      "evidence": "method step 7: the captured reason includes yours and theirs"
    },
    {
      "section": "win_loss_discipline",
      "check": "win_loss_feeds_improvements",
      "status": "pass",
      "evidence": "method step 7: win/loss reasons feed messaging, product, and process improvements"
    },
    {
      "section": "minimal_data_and_retention",
      "check": "only_relationship_needed_data_collected",
      "status": "pass",
      "evidence": "method step 8: only what the relationship needs is collected, not everything possible"
    },
    {
      "section": "minimal_data_and_retention",
      "check": "retention_for_dead_leads_defined",
      "status": "pass",
      "evidence": "method step 8: retention for dead leads is defined"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "pipeline_stages_not_covered": [],
  "deal_count": 1,
  "open_deal_count": 1,
  "stale_deal_count": 0,
  "open_deals_without_next_step_or_date_count": 0,
  "stage_distribution": {
    "lead": 1,
    "qualified": 0,
    "proposal": 0,
    "decision": 0,
    "won": 0,
    "lost": 0
  },
  "computed_open_value_total": "1000.000000",
  "computed_pipeline_value_total": "1000.000000",
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across eight sections.",
  "stamp": "CRM PIPELINE OPERATIONS\nentity: Acme Corp\nVERDICT: CRM_PIPELINE_READY\n  single_source_of_truth           pass\n  contact_rules_and_privacy        pass\n  pipeline_stages_and_deals        pass\n  follow_up_cadence_and_logging    pass\n  reporting_and_forecasts          pass\n  consent_and_comms                pass\n  win_loss_discipline              pass\n  minimal_data_and_retention       pass\n38 pass, 0 fail, 0 missing of 38 checks across eight sections."
}
```

### Example 2 — Violations

Recorded expectation: HTTP 200, verdict `CRM_PIPELINE_NOT_READY`.

Input (recorded `input`):

```json
{
  "entity": "Acme Corp",
  "source": {
    "single_system_maintained": true,
    "contacts_carry_who_what_context_minimum": true,
    "dedupe_cadence_set": true,
    "stale_contacts_flagged_not_trusted": true
  },
  "contact_rules": {
    "sensitivity_flags_honored": true,
    "sensitivity_flags_override_everything": true,
    "outreach_drafted_for_review_never_auto_sent": true,
    "nothing_personal_shared_beyond_purpose": true,
    "unapproved_outreach_sent": true,
    "bulk_unsolicited_outreach_sent": false,
    "personal_contacts_uploaded_to_third_parties_without_purpose_and_consent": false
  },
  "pipeline": {
    "stages_used": [
      "lead"
    ],
    "entry_criteria_defined_for_each_stage": true,
    "exit_criteria_defined_for_each_stage": true,
    "deals_advance_on_evidence_not_optimism": true,
    "stale_threshold_days": 30,
    "deals": [
      {
        "stage": "lead",
        "value": 100.0,
        "age_days": 50,
        "has_next_step": false,
        "has_next_step_date": false,
        "open": true
      }
    ]
  },
  "follow_up": {
    "cadence_scheduled": true,
    "every_touch_carries_value": true,
    "every_interaction_logged_with_what_said_promised_next": true,
    "promises_tracked_until_delivered": true
  },
  "reporting": {
    "pipeline_reported_by_stage_and_age": true,
    "conversion_rates_by_stage_reported": true,
    "stuck_deal_list_maintained": true,
    "stuck_deal_review_held_on_cadence": true,
    "forecasts_use_honest_probabilities": true
  },
  "consent": {
    "marketing_consent_recorded": true,
    "consent_flags_current": true,
    "unsubscribe_honored_instantly": true,
    "segmentation_per_consent": true,
    "scraped_third_party_personal_data_into_crm": false
  },
  "win_loss": {
    "reasons_captured": true,
    "reasons_include_yours_and_theirs": true,
    "feeds_messaging_product_and_process_improvements": true
  },
  "minimal_data": {
    "only_relationship_needed_data_collected": true,
    "retention_for_dead_leads_defined": true
  }
}
```

REST response (recorded `response_text`):

```json
{
  "service": "crm-pipeline-operations",
  "atom_version": "0.1.0",
  "entity": "Acme Corp",
  "verdict": "CRM_PIPELINE_NOT_READY",
  "sections": {
    "single_source_of_truth": "pass",
    "contact_rules_and_privacy": "fail",
    "pipeline_stages_and_deals": "fail",
    "follow_up_cadence_and_logging": "pass",
    "reporting_and_forecasts": "pass",
    "consent_and_comms": "pass",
    "win_loss_discipline": "pass",
    "minimal_data_and_retention": "pass"
  },
  "checks": [
    {
      "section": "single_source_of_truth",
      "check": "single_system_maintained",
      "status": "pass",
      "evidence": "method step 1: one system (or structured folder) is the single source of truth for contacts and interactions"
    },
    {
      "section": "single_source_of_truth",
      "check": "contacts_carry_who_what_context_minimum",
      "status": "pass",
      "evidence": "method step 1: contacts carry the who/what/context minimum"
    },
    {
      "section": "single_source_of_truth",
      "check": "dedupe_cadence_set",
      "status": "pass",
      "evidence": "quality gate: a dedupe cadence is set — dedupe happens on a schedule"
    },
    {
      "section": "single_source_of_truth",
      "check": "stale_contacts_flagged_not_trusted",
      "status": "pass",
      "evidence": "method step 1: stale contacts are flagged, not trusted"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "sensitivity_flags_honored",
      "status": "pass",
      "evidence": "quality gate: sensitivity flags are honored"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "sensitivity_flags_override_everything",
      "status": "pass",
      "evidence": "red line: sensitivity flags override everything"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "outreach_drafted_for_review_never_auto_sent",
      "status": "pass",
      "evidence": "method step 2: outreach is drafted for review, never auto-sent"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "nothing_personal_shared_beyond_purpose",
      "status": "pass",
      "evidence": "method step 2: nothing personal is shared beyond its purpose"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "no_unapproved_outreach",
      "status": "fail",
      "evidence": "quality gate: no unapproved outreach is sent"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "no_bulk_unsolicited_outreach",
      "status": "pass",
      "evidence": "red line: never bulk unsolicited outreach (spam)"
    },
    {
      "section": "contact_rules_and_privacy",
      "check": "no_personal_contacts_uploaded_without_purpose_and_consent",
      "status": "pass",
      "evidence": "red line: personal contacts are never uploaded to third parties without purpose and consent"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "pipeline_stages_cover_stated_stages",
      "status": "fail",
      "evidence": "method step 3: the stages used cover every stage the skill names — lead, qualified, proposal, decision, won, lost"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "entry_criteria_defined_for_each_stage",
      "status": "pass",
      "evidence": "method step 3: entry criteria are defined for each pipeline stage"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "exit_criteria_defined_for_each_stage",
      "status": "pass",
      "evidence": "method step 3: exit criteria are defined for each pipeline stage — deals advance on evidence, not optimism"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "deals_advance_on_evidence_not_optimism",
      "status": "pass",
      "evidence": "method step 3: deals advance on evidence (call happened, proposal sent), not optimism"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "deal_rows_complete",
      "status": "pass",
      "evidence": "method step 3: every declared deal row carries a stage, a value, an age in days, a next-step flag, a next-step-date flag, and an open flag"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "deal_stages_are_stated_stages",
      "status": "pass",
      "evidence": "method step 3: every declared deal row's stage is one of the stages the skill names — lead, qualified, proposal, decision, won, lost"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "every_open_deal_has_next_step_and_date",
      "status": "fail",
      "evidence": "quality gate: every open deal carries a next step and a next-step date — the declared open rows all declare both (a zero open-deal count fails: no open pipeline exists to prove this over)"
    },
    {
      "section": "pipeline_stages_and_deals",
      "check": "no_open_deal_stale_beyond_declared_threshold",
      "status": "fail",
      "evidence": "method step 1: stale is flagged, not trusted — no declared open deal's age in days exceeds the caller-declared stale_threshold_days; the skill states no day count, so only the caller's own declared threshold is applied (a zero open-deal count fails: no open pipeline exists to prove this over)"
    },
    {
      "section": "follow_up_cadence_and_logging",
      "check": "follow_up_cadence_scheduled",
      "status": "pass",
      "evidence": "method step 4: follow-up touches are scheduled on a cadence"
    },
    {
      "section": "follow_up_cadence_and_logging",
      "check": "every_follow_up_touch_carries_value",
      "status": "pass",
      "evidence": "method step 4: every scheduled touch carries value — an insight, a result, a useful link"
    },
    {
      "section": "follow_up_cadence_and_logging",
      "check": "every_interaction_logged_with_what_said_promised_next",
      "status": "pass",
      "evidence": "method step 4: every interaction is logged — what was said, what was promised, what is next"
    },
    {
      "section": "follow_up_cadence_and_logging",
      "check": "promises_tracked_until_delivered",
      "status": "pass",
      "evidence": "method step 4: what was promised is tracked until delivered"
    },
    {
      "section": "reporting_and_forecasts",
      "check": "pipeline_reported_by_stage_and_age",
      "status": "pass",
      "evidence": "method step 5: the pipeline is reported by stage and age"
    },
    {
      "section": "reporting_and_forecasts",
      "check": "conversion_rates_by_stage_reported",
      "status": "pass",
      "evidence": "method step 5: conversion rates by stage are reported — base rates, not impressions"
    },
    {
      "section": "reporting_and_forecasts",
      "check": "stuck_deal_list_maintained",
      "status": "pass",
      "evidence": "method step 5: a stuck-deal list is maintained"
    },
    {
      "section": "reporting_and_forecasts",
      "check": "stuck_deal_review_held_on_cadence",
      "status": "pass",
      "evidence": "quality gate: the stuck-deal review is held on cadence"
    },
    {
      "section": "reporting_and_forecasts",
      "check": "forecasts_use_honest_probabilities",
      "status": "pass",
      "evidence": "method step 5: reporting feeds revenue-management forecasts with honest probabilities"
    },
    {
      "section": "consent_and_comms",
      "check": "marketing_consent_recorded",
      "status": "pass",
      "evidence": "method step 6: marketing consent is recorded"
    },
    {
      "section": "consent_and_comms",
      "check": "consent_flags_current",
      "status": "pass",
      "evidence": "quality gate: consent flags are current"
    },
    {
      "section": "consent_and_comms",
      "check": "unsubscribe_honored_instantly",
      "status": "pass",
      "evidence": "method step 6: unsubscribe is honored instantly"
    },
    {
      "section": "consent_and_comms",
      "check": "segmentation_per_consent",
      "status": "pass",
      "evidence": "method step 6: segmentation is per consent"
    },
    {
      "section": "consent_and_comms",
      "check": "no_scraping_third_party_personal_data",
      "status": "pass",
      "evidence": "method step 6: no third-party personal data is scraped into the CRM"
    },
    {
      "section": "win_loss_discipline",
      "check": "win_loss_reasons_captured",
      "status": "pass",
      "evidence": "quality gate: win/loss reasons are captured"
    },
    {
      "section": "win_loss_discipline",
      "check": "win_loss_reasons_include_yours_and_theirs",
      "status": "pass",
      "evidence": "method step 7: the captured reason includes yours and theirs"
    },
    {
      "section": "win_loss_discipline",
      "check": "win_loss_feeds_improvements",
      "status": "pass",
      "evidence": "method step 7: win/loss reasons feed messaging, product, and process improvements"
    },
    {
      "section": "minimal_data_and_retention",
      "check": "only_relationship_needed_data_collected",
      "status": "pass",
      "evidence": "method step 8: only what the relationship needs is collected, not everything possible"
    },
    {
      "section": "minimal_data_and_retention",
      "check": "retention_for_dead_leads_defined",
      "status": "pass",
      "evidence": "method step 8: retention for dead leads is defined"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "pipeline_stages_not_covered": [
    "qualified",
    "proposal",
    "decision",
    "won",
    "lost"
  ],
  "deal_count": 1,
  "open_deal_count": 1,
  "stale_deal_count": 1,
  "open_deals_without_next_step_or_date_count": 1,
  "stage_distribution": {
    "lead": 1,
    "qualified": 0,
    "proposal": 0,
    "decision": 0,
    "won": 0,
    "lost": 0
  },
  "computed_open_value_total": "100.000000",
  "computed_pipeline_value_total": "100.000000",
  "summary": "34 pass, 4 fail, 0 missing of 38 checks across eight sections.",
  "stamp": "CRM PIPELINE OPERATIONS\nentity: Acme Corp\nVERDICT: CRM_PIPELINE_NOT_READY\n  single_source_of_truth           pass\n  contact_rules_and_privacy        fail\n  pipeline_stages_and_deals        fail\n  follow_up_cadence_and_logging    pass\n  reporting_and_forecasts          pass\n  consent_and_comms                pass\n  win_loss_discipline              pass\n  minimal_data_and_retention       pass\n34 pass, 4 fail, 0 missing of 38 checks across eight sections."
}
```

### Example 3 — Malformed

Recorded expectation: HTTP 422, error `invalid_input` — never a verdict.

Input (recorded `input`):

```json
{
  "entity": "Acme Corp",
  "source": {
    "single_system_maintained": true,
    "contacts_carry_who_what_context_minimum": true,
    "dedupe_cadence_set": true,
    "stale_contacts_flagged_not_trusted": true
  },
  "contact_rules": {
    "sensitivity_flags_honored": true,
    "sensitivity_flags_override_everything": true,
    "outreach_drafted_for_review_never_auto_sent": true,
    "nothing_personal_shared_beyond_purpose": true,
    "unapproved_outreach_sent": false,
    "bulk_unsolicited_outreach_sent": false,
    "personal_contacts_uploaded_to_third_parties_without_purpose_and_consent": false
  },
  "pipeline": {
    "stages_used": [
      "lead",
      "qualified",
      "proposal",
      "decision",
      "won",
      "lost"
    ],
    "entry_criteria_defined_for_each_stage": true,
    "exit_criteria_defined_for_each_stage": true,
    "deals_advance_on_evidence_not_optimism": true,
    "stale_threshold_days": "thirty",
    "deals": [
      {
        "stage": "lead",
        "value": 1000.0,
        "age_days": 10,
        "has_next_step": true,
        "has_next_step_date": true,
        "open": true
      }
    ]
  },
  "follow_up": {
    "cadence_scheduled": true,
    "every_touch_carries_value": true,
    "every_interaction_logged_with_what_said_promised_next": true,
    "promises_tracked_until_delivered": true
  },
  "reporting": {
    "pipeline_reported_by_stage_and_age": true,
    "conversion_rates_by_stage_reported": true,
    "stuck_deal_list_maintained": true,
    "stuck_deal_review_held_on_cadence": true,
    "forecasts_use_honest_probabilities": true
  },
  "consent": {
    "marketing_consent_recorded": true,
    "consent_flags_current": true,
    "unsubscribe_honored_instantly": true,
    "segmentation_per_consent": true,
    "scraped_third_party_personal_data_into_crm": false
  },
  "win_loss": {
    "reasons_captured": true,
    "reasons_include_yours_and_theirs": true,
    "feeds_messaging_product_and_process_improvements": true
  },
  "minimal_data": {
    "only_relationship_needed_data_collected": true,
    "retention_for_dead_leads_defined": true
  }
}
```

REST response (recorded `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "pipeline.stale_threshold_days",
  "detail": "pipeline.stale_threshold_days must be a number"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Output format | CommonMark markdown |
| Role views present | Integrators (Users): Yes · Developers: Yes · Ops: Yes · Regulators: N/A — although the manifest carries consent/privacy process declarations, the verdict is a pipeline-operations readiness audit of declared facts, not a privacy-compliance determination; SERVICE.md names no regulation and claims no audit-evidence status. |
| Checks named: documented / recorded | 38 / 38 |
| Verdict vocabulary complete | Yes — all 3 verdict values (CRM_PIPELINE_NOT_READY, CRM_PIPELINE_READY, INSUFFICIENT_EVIDENCE), section statuses, per-check statuses and `computed_status` values listed |
| Input reference typed | Yes — 43 fields, each with a type, grouped as SERVICE.md groups them |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/crm-pipeline-operations/evidence.json` after writing |
