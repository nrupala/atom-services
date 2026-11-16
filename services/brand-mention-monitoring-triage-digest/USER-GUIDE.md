# Brand mention monitoring triage digest — user guide

## What it does

You run a watch for mentions of your brand across the web. This atom reads one declared monitoring setup — inventory and coverage, triage rubric, response policy, alert hygiene and evidence, and digest reporting — and returns one deterministic verdict across six sections: **TRIAGE_DIGEST_READY**, **TRIAGE_DIGEST_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Computed checks: the declared triage dimensions must cover all three the method names (severity, reach, authenticity); the declared triage routes must cover all five (ignore, monitor, reply, escalate, legal); and evidence must be archived for every action taken, with coherent counts. It audits your declared setup only — it does not listen to live feeds or verify that a declared value is true. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "brand-mention-monitoring-triage-digest"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/brand-mention-monitoring-triage-digest` — tool name `brand_mention_monitoring_triage_digest`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/brand-mention-monitoring-triage-digest` — body = the manifest object; same `Authorization` header.

## Input — the brand-mention-monitoring-triage-digest manifest

| Field | Meaning |
|---|---|
| `brand` | brand text (string; carried into the output, not checked) |
| `inventory.names_handles_products_listed` / `misspellings_and_variants_included` / `owned_vs_third_party_distinguished` | inventory evidence |
| `coverage.sources_listed` / `blind_spots_acknowledged` / `mechanism_configured_per_source` / `cadence_defined` / `crisis_cadence_realtime` / `routine_cadence_daily_digest` | coverage evidence |
| `triage.rubric_documented` / `escalation_path_documented` / `false_positives_tracked` | triage-rubric evidence |
| `triage.dimensions` (list of strings) | computed: must contain all three — `severity`, `reach`, `authenticity`; omitted ones reported as `triage_dimensions_missing` |
| `triage.routes` (list of strings) | computed: must contain all five — `ignore`, `monitor`, `reply`, `escalate`, `legal`; omitted ones reported as `triage_routes_missing` |
| `response.authority_to_speak_defined` / `tone_rules_defined` / `dm_move_criteria_defined` / `statement_criteria_defined` / `templates_approved` | response-policy evidence |
| `alerts.thresholds_defined` / `dedupe_enabled` / `quiet_hours_defined` / `tested_after_setup` | alert-hygiene evidence |
| `evidence.archiving_required_before_response` | evidence-archiving evidence |
| `counts.total_mentions` (number), `counts.actions_taken` (number), `counts.actions_with_evidence_archived` (number) | computed: archived must equal actions taken, counts coherent (none negative, actions taken no more than total mentions); reported as `actions_without_archived_evidence` (actions taken minus archived) |
| `digest.weekly_cadence` / `includes_notable_mentions` / `includes_trend_notes` / `sentiment_included` / `sentiment_caveats_stated` / `actions_taken_listed` / `signal_separated_from_noise` | digest-reporting evidence |
| `conduct.astroturfing_fake_reviews_or_manufactured_engagement` / `public_argument_without_policy_backing` / `retaliation_against_mentioners` / `private_data_of_individuals_exposed` / `defamation_or_impersonation_fought_publicly_instead_of_counsel` | all must be `false` to pass (red lines) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward TRIAGE_DIGEST_NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/brand-mention-monitoring-triage-digest`:

```json
{
  "brand": "Nrupal",
  "inventory": {
    "names_handles_products_listed": true,
    "misspellings_and_variants_included": true,
    "owned_vs_third_party_distinguished": true
  },
  "coverage": {
    "sources_listed": true,
    "blind_spots_acknowledged": true,
    "mechanism_configured_per_source": true,
    "cadence_defined": true,
    "crisis_cadence_realtime": true,
    "routine_cadence_daily_digest": true
  },
  "triage": {
    "rubric_documented": true,
    "dimensions": [
      "severity",
      "reach",
      "authenticity"
    ],
    "routes": [
      "ignore",
      "monitor",
      "reply",
      "escalate",
      "legal"
    ],
    "escalation_path_documented": true,
    "false_positives_tracked": true
  },
  "response": {
    "authority_to_speak_defined": true,
    "tone_rules_defined": true,
    "dm_move_criteria_defined": true,
    "statement_criteria_defined": true,
    "templates_approved": true
  },
  "alerts": {
    "thresholds_defined": true,
    "dedupe_enabled": true,
    "quiet_hours_defined": true,
    "tested_after_setup": true
  },
  "evidence": {
    "archiving_required_before_response": true
  },
  "counts": {
    "total_mentions": 10,
    "actions_taken": 5,
    "actions_with_evidence_archived": 5
  },
  "digest": {
    "weekly_cadence": true,
    "includes_notable_mentions": true,
    "includes_trend_notes": true,
    "sentiment_included": true,
    "sentiment_caveats_stated": true,
    "actions_taken_listed": true,
    "signal_separated_from_noise": true
  },
  "conduct": {
    "astroturfing_fake_reviews_or_manufactured_engagement": false,
    "public_argument_without_policy_backing": false,
    "retaliation_against_mentioners": false,
    "private_data_of_individuals_exposed": false,
    "defamation_or_impersonation_fought_publicly_instead_of_counsel": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 37 checks and a text stamp of the verdict):

```json
{
  "service": "brand-mention-monitoring-triage-digest",
  "atom_version": "0.1.0",
  "brand": "Nrupal",
  "verdict": "TRIAGE_DIGEST_READY",
  "sections": {
    "inventory_and_coverage": "pass",
    "triage_rubric": "pass",
    "response_policy": "pass",
    "alert_hygiene_and_evidence": "pass",
    "digest_reporting": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "triage_dimensions_missing": [],
  "triage_routes_missing": [],
  "actions_without_archived_evidence": 0,
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across six sections."
}
```

## Verdicts

- **TRIAGE_DIGEST_READY** — every check passes; the monitoring setup is ready on the declared evidence.
- **TRIAGE_DIGEST_NOT_READY** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `triage_dimensions_missing` (omitted stated dimensions, or null when no list is declared), `triage_routes_missing` (omitted stated routes, or null when no list is declared), `actions_without_archived_evidence` (actions taken minus actions with evidence archived, or null when either count cannot be read) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
