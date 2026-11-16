# Condition monitoring triage — `condition-monitoring-triage`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Condition monitoring for motors, drives, and transformers — vibration, thermography, ESA, DGA, and trending rules.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Electrical & energy who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **EE asset monitoring reviews**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the condition-monitoring evidence manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`TRIAGE_UNSOUND`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `asset` (string; carried into the verdict output, not itself checked) | — |
| `baseline.exists` | baseline |
| `baseline.captured_under_known_load` | baseline |
| `baseline.repair_since_baseline` (gates the post-repair check below) | baseline |
| `baseline.post_repair_baseline_captured` (required when a repair is declared; otherwise the check passes as not applicable) | baseline |
| `monitoring.techniques_match_asset` | technique_coverage |
| `monitoring.fixed_route_points` | technique_coverage |
| `monitoring.same_instrument_class` | technique_coverage |
| `context.load_recorded` | context |
| `context.ambient_recorded` | context |
| `context.speed_recorded` | context |
| `trending.deltas_vs_baseline_computed` | trending |
| `trending.rate_of_change_considered` | trending |
| `trending.repair_events_annotated` | trending |
| `bands.defined_per_standard_or_oem` | alert_bands_and_triage |
| `readings[]` (list of readings, see below) | alert_bands_and_triage |
| `alarms[]` (list of triage records, see below) | alert_bands_and_triage |
| `escalation.findings_sent_with_trend_pack` | escalation |
| `escalation.alarm_closed_without_triage_note` (must be `false` to pass) | escalation |
| `escalation.condemned_or_cleared_on_single_reading` (must be `false` to pass) | escalation |

Each `readings[]` entry is `{parameter, value, watch_limit,
warning_limit, action_limit}` (numbers; limits are exceedance
thresholds and must satisfy watch <= warning <= action). Every reading
is classified against its bands and the output reports the computed
`highest_band` (normal / watch / warning / action). Each `alarms[]`
entry is `{id, disposition (noise / watch / act), reasoning_recorded,
recheck_interval_set, work_request_raised}`: a `watch` disposition
requires a recheck interval, an `act` disposition requires a raised
work request, and a reading at or beyond its action limit requires an
`act` triage on record.

The verdict is one of `TRIAGE_SOUND` (all 19 checks pass),
`TRIAGE_UNSOUND` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across six sections:
baseline, technique_coverage, context, trending,
alert_bands_and_triage, escalation.

## Status

Tier A · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.

## Named doubt (from the register)

Safety-adjacent; SME makes calls
