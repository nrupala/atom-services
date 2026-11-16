# CRM pipeline operations — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a CRM pipeline-operations artifact — a single-source and hygiene record, a contact-rule and privacy record, declared pipeline stages with entry/exit criteria, declared deal rows, a follow-up cadence and logging record, a reporting and forecast record, a consent record, a win/loss record, and a minimal-data/retention record. This atom reads one declared manifest and returns one deterministic verdict across eight sections: **CRM_PIPELINE_READY**, **CRM_PIPELINE_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not operate a CRM, contact anyone, move a deal, or judge whether relationships are actually well run. Computed checks: the declared stages must cover the six stages the skill names — `lead`, `qualified`, `proposal`, `decision`, `won`, `lost`; every deal row must be complete and its stage must be a stated stage; every open deal must carry a next step and a next-step date (a zero open-deal count fails); and no open deal may be stale — its `age_days` exceeding your own declared `stale_threshold_days` (the skill states no day count, so none is imposed; an age exactly equal to the threshold is not stale). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "crm-pipeline-operations"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/crm-pipeline-operations` — tool name `crm_pipeline_operations`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/crm-pipeline-operations` — body = the manifest object; same `Authorization` header.

## Input — the crm-pipeline-operations manifest

| Field | Meaning |
|---|---|
| `entity` | entity name (string; carried into the output, not checked) |
| `source.single_system_maintained` / `contacts_carry_who_what_context_minimum` / `dedupe_cadence_set` / `stale_contacts_flagged_not_trusted` | single-source-of-truth and hygiene evidence |
| `contact_rules.sensitivity_flags_honored` / `sensitivity_flags_override_everything` / `outreach_drafted_for_review_never_auto_sent` / `nothing_personal_shared_beyond_purpose` | contact-rule and privacy evidence |
| `contact_rules.unapproved_outreach_sent` / `bulk_unsolicited_outreach_sent` / `personal_contacts_uploaded_to_third_parties_without_purpose_and_consent` | must be `false` to pass |
| `pipeline.stages_used` (list of strings) | computed: must contain all six stated stages — `lead`, `qualified`, `proposal`, `decision`, `won`, `lost`; omitted ones reported as `pipeline_stages_not_covered` |
| `pipeline.entry_criteria_defined_for_each_stage` / `exit_criteria_defined_for_each_stage` / `deals_advance_on_evidence_not_optimism` | stage-criteria evidence |
| `pipeline.stale_threshold_days` (number) | your own declared staleness window; computed: an open deal with `age_days` greater than this is stale; reported as `stale_deal_count` |
| `pipeline.deals` (list of deal-row objects) | computed: each row needs `stage` (non-empty string), `value` (number), `age_days` (number), `has_next_step`, `has_next_step_date` and `open` (booleans); every stage must be a stated stage; every open row must have next step + date; reported as `deal_count`, `open_deal_count`, `stage_distribution`, `open_deals_without_next_step_or_date_count`, `computed_open_value_total` and `computed_pipeline_value_total` (6 decimal places) |
| `follow_up.cadence_scheduled` / `every_touch_carries_value` / `every_interaction_logged_with_what_said_promised_next` / `promises_tracked_until_delivered` | follow-up cadence and logging evidence |
| `reporting.pipeline_reported_by_stage_and_age` / `conversion_rates_by_stage_reported` / `stuck_deal_list_maintained` / `stuck_deal_review_held_on_cadence` / `forecasts_use_honest_probabilities` | reporting and forecast evidence |
| `consent.marketing_consent_recorded` / `consent_flags_current` / `unsubscribe_honored_instantly` / `segmentation_per_consent` | consent evidence |
| `consent.scraped_third_party_personal_data_into_crm` | must be `false` to pass |
| `win_loss.reasons_captured` / `reasons_include_yours_and_theirs` / `feeds_messaging_product_and_process_improvements` | win/loss evidence |
| `minimal_data.only_relationship_needed_data_collected` / `retention_for_dead_leads_defined` | minimal-data and retention evidence |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward CRM_PIPELINE_NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/crm-pipeline-operations`:

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

Response — HTTP 200 (trimmed; the full response carries all 38 checks and a text stamp of the verdict):

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
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across eight sections."
}
```

## Verdicts

- **CRM_PIPELINE_READY** — every check passes; the pipeline-operations artifact is complete and internally consistent on the declared evidence.
- **CRM_PIPELINE_NOT_READY** — at least one check fails; the failing checks name the breached rule and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `pipeline_stages_not_covered` (stated stages not declared used, or null when no list is declared), `deal_count` (declared list length whenever a list is declared), `open_deal_count`, `stale_deal_count` and `open_deals_without_next_step_or_date_count` (or null when they cannot be computed), `stage_distribution` (counts per stated stage, in stated-stage order), `computed_open_value_total` and `computed_pipeline_value_total` (computed amounts as strings with exactly six decimals, or null when they cannot be computed) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
