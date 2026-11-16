# Condition Monitoring Triage — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You monitor motors, drives or transformers — vibration,
thermography, electrical signature, oil analysis. This atom reads a
short evidence manifest describing how the monitoring was done — a
baseline captured under known load (and re-captured after repairs),
techniques matched to the asset on fixed routes, load/ambient/speed
recorded with the readings, deltas and rate of change trended,
readings classified against standard/OEM bands, every alarm triaged
with a note, suspicious findings escalated with a trend pack — and
returns one deterministic verdict across six sections with per-check
evidence: **TRIAGE_SOUND**, **TRIAGE_UNSOUND**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). It also computes `highest_band`
(normal / watch / warning / action) from the readings you submit.
Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "condition-monitoring-triage"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/condition-monitoring-triage`
  — tool name `condition_monitoring_triage`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/condition-monitoring-triage`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `asset` (string) | asset name; carried into the output, not itself checked |
| `baseline.exists`, `baseline.captured_under_known_load`, `baseline.repair_since_baseline`, `baseline.post_repair_baseline_captured` | baseline (post-repair capture is required when a repair is declared; otherwise that check passes as not applicable) |
| `monitoring.techniques_match_asset`, `monitoring.fixed_route_points`, `monitoring.same_instrument_class` | technique coverage |
| `context.load_recorded`, `context.ambient_recorded`, `context.speed_recorded` | reading context |
| `trending.deltas_vs_baseline_computed`, `trending.rate_of_change_considered`, `trending.repair_events_annotated` | trending |
| `bands.defined_per_standard_or_oem` | alert bands defined per standard or OEM |
| `readings[]` | readings `{parameter, value, watch_limit, warning_limit, action_limit}` (numbers; limits must satisfy watch ≤ warning ≤ action). Every reading is classified against its bands; the output reports the computed `highest_band`. |
| `alarms[]` | triage records `{id, disposition (noise / watch / act), reasoning_recorded, recheck_interval_set, work_request_raised}`: a `watch` disposition requires a recheck interval, an `act` disposition requires a raised work request, and a reading at or beyond its action limit requires an `act` triage on record. |
| `escalation.findings_sent_with_trend_pack`, `escalation.alarm_closed_without_triage_note` (must be `false`), `escalation.condemned_or_cleared_on_single_reading` (must be `false`) | escalation |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = the
section fails (counts toward TRIAGE_UNSOUND).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/condition-monitoring-triage`:

```json
{
  "asset": "Motor-001",
  "baseline": {
    "exists": true,
    "captured_under_known_load": true,
    "repair_since_baseline": true,
    "post_repair_baseline_captured": true
  },
  "monitoring": {
    "techniques_match_asset": true,
    "fixed_route_points": true,
    "same_instrument_class": true
  },
  "context": {
    "load_recorded": true,
    "ambient_recorded": true,
    "speed_recorded": true
  },
  "trending": {
    "deltas_vs_baseline_computed": true,
    "rate_of_change_considered": true,
    "repair_events_annotated": true
  },
  "bands": {
    "defined_per_standard_or_oem": true
  },
  "readings": [
    {
      "parameter": "vibration",
      "value": 2.5,
      "watch_limit": 3.0,
      "warning_limit": 5.0,
      "action_limit": 8.0
    }
  ],
  "alarms": [
    {
      "id": "A1",
      "disposition": "noise",
      "reasoning_recorded": true,
      "recheck_interval_set": false,
      "work_request_raised": false
    }
  ],
  "escalation": {
    "findings_sent_with_trend_pack": true,
    "alarm_closed_without_triage_note": false,
    "condemned_or_cleared_on_single_reading": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries every check
and a text stamp of the verdict):

```json
{
  "service": "condition-monitoring-triage",
  "atom_version": "0.1.0",
  "asset": "Motor-001",
  "verdict": "TRIAGE_SOUND",
  "sections": {"baseline": "pass", "technique_coverage": "pass", "context": "pass", "trending": "pass", "alert_bands_and_triage": "pass", "escalation": "pass"},
  "highest_band": "normal",
  "summary": "19 pass, 0 fail, 0 missing of 19 checks across six sections."
}
```

## Verdicts

- **TRIAGE_SOUND** — every check passes; the triage clears all six sections.
- **TRIAGE_UNSOUND** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
