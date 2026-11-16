# Condition monitoring triage — documentation

**Condition monitoring triage** · slug `condition-monitoring-triage` · deliverable type: CHECK · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. All worked examples are real recorded trial runs — see the provenance line under Worked examples.

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run — a monitored motor, `Motor-001` — whose verbatim request and response appear as Worked example 1 below.

1. **Get a key.** Sign up at `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session; then issue a key for this atom with `POST /v1/keys` and body `{"atom": "condition-monitoring-triage"}`. Keep the returned key — you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides.)
2. **Assemble the manifest.** Build one JSON object: a condition-monitoring evidence manifest: baseline, monitoring technique and context discipline, trending, declared alert bands with readings, the alarm triage record, and escalation. In the recorded run the manifest names `asset: "Motor-001"` and declares every field `true` in the passing sense (every must-be-false field `false`), with the supporting rows the computed checks read.
3. **Send it.** `POST https://atoms.pipavia.com/v1/condition-monitoring-triage` with the manifest as the body and the `Authorization` header set.
4. **Read the verdict.** The recorded response is HTTP 200 with verdict `TRIAGE_SOUND`. Its `summary` reads: “19 pass, 0 fail, 0 missing of 19 checks across six sections.” Every section in `sections` is `pass`, and every entry in `checks` carries `status: "pass"` with its evidence line.
5. **Read the computed block.** `highest_band` — computed from the `readings[]` rows against their declared limits: one of `normal` / `watch` / `warning` / `action`, or `null` when no readings are declared. In the recorded run it reads `{"highest_band": "normal"}` — recomputed by the atom from the submitted rows, never taken from the caller's word.
6. **Keep the stamp.** The response's `stamp` field is the same verdict as a plain-text block, suitable for pasting into a change record or review note.

You now have the deliverable: one deterministic verdict. Same manifest in → same verdict out (the recorded battery proves byte-identical repeat responses and MCP/REST parity — see TEST-REPORT.md).

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "condition-monitoring-triage"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Keys are per user, per atom in scope: a key never verifies for an atom outside its granted scope (contract.yaml: key = HMAC-SHA256 over email | atom service | issued-at, version-prefixed, regenerated on demand after authentication, never stored).
3. Call:

```bash
curl -X POST https://atoms.pipavia.com/v1/condition-monitoring-triage \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

The body is the manifest object itself (see Reference — Input reference). HTTP 200 returns the verdict object (see Reference — Output format).

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/condition-monitoring-triage`
- Tool name: `condition_monitoring_triage`
- Send the same `Authorization: Bearer <key>` header. In the `tools/call` request, the tool arguments are the manifest object — the same object you would POST as the REST body. The recorded battery proves parity: the MCP `structuredContent` is deep-equal to the REST artifact for the same manifest.

### Read a failing verdict and fix the manifest

Worked example 2 below is the recorded failing run: verdict `TRIAGE_UNSOUND`, summary “15 pass, 2 fail, 2 missing of 19 checks across six sections.”. To fix a failing verdict:

1. **Find the non-pass checks.** In the response's `checks` array, look for `status: "fail"` (present but wrong) and `status: "missing"` (not declared). In the recorded violations run the failing checks are:
   - `post_repair_baseline_captured` (section `baseline`) — evidence: “quality gate: post-repair baselines captured (verify the fix actually fixed it)”
   - `no_alarm_closed_without_triage_note` (section `escalation`) — evidence: “skill red line: no alarm closes without a triage note”
   - `readings_classified_against_bands` (section `alert_bands_and_triage`) — status `missing`, evidence: “no readings declared”
   - `action_band_readings_have_act_triage` (section `alert_bands_and_triage`) — status `missing`, evidence: “no readings declared”
2. **Note the section roll-up.** `sections` marks each affected section `fail` (or `insufficient_evidence` when nothing in it failed but evidence is missing). The verdict is `TRIAGE_UNSOUND` when any check fails, `INSUFFICIENT_EVIDENCE` when nothing fails but any check is missing, and `TRIAGE_SOUND` only when every check passes.
3. **Fix the underlying fact, then the manifest.** Each check's Reference entry names the manifest field it reads. Correct the real-world condition first (the atom reads declarations — declaring `true` for work not done defeats the purpose), set the field to the passing value, and resubmit the whole manifest. The atom is stateless: a resubmission is a fresh, complete evaluation.
4. **Re-read the new summary.** It counts pass / fail / missing across all checks; you are done when it reads all-pass and the verdict is `TRIAGE_SOUND`.

### Handle a 422 invalid_input

A type-violating manifest is rejected before evaluation — never scored. The recorded malformed run (Worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "baseline",
  "detail": "baseline must be an object"
}
```

- `field` names the offending field (`baseline` in the recorded run) and `detail` says what type was expected (`"baseline must be an object"`).
- Fix exactly that field's type in your manifest (see the types in the Input reference) and resubmit. Validation reports the first offending field it reaches, so a manifest with several type errors may need more than one fix-and-resubmit round.
- A 422 carries no verdict and no `checks` array — do not read it as a failing evaluation.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/condition-monitoring-triage` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/condition-monitoring-triage` — tool name `condition_monitoring_triage`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0). Contract endpoints: API, MCP, agent.

### Input reference

One JSON manifest per call. Types are from SERVICE.md's field table, corroborated by the recorded MCP `inputSchema` and the evidence inputs. Unless a field is marked otherwise, every boolean field follows the same rule: **absent = evidence missing** (the check it feeds is `missing`; the verdict degrades to `INSUFFICIENT_EVIDENCE`), **present but false/invalid = the check fails** (the verdict degrades to `TRIAGE_UNSOUND`). Fields marked “must be `false`” invert the passing value, as noted.

**Identity**

| Field | Type | Notes |
|---|---|---|
| `asset` | string | Asset name. Carried into the output; not itself checked. |

**`baseline` — baseline**

| Field | Type | Notes |
|---|---|---|
| `baseline.exists` | boolean | Read by section `baseline`. |
| `baseline.captured_under_known_load` | boolean | Read by section `baseline`. |
| `baseline.repair_since_baseline` | boolean | Gate: when `true`, the post-repair capture below is required. |
| `baseline.post_repair_baseline_captured` | boolean | Required when `baseline.repair_since_baseline` is `true`; otherwise the check passes as not applicable. |

**`monitoring` — technique coverage**

| Field | Type | Notes |
|---|---|---|
| `monitoring.techniques_match_asset` | boolean | Read by section `technique_coverage`. |
| `monitoring.fixed_route_points` | boolean | Read by section `technique_coverage`. |
| `monitoring.same_instrument_class` | boolean | Read by section `technique_coverage`. |

**`context` — reading context**

| Field | Type | Notes |
|---|---|---|
| `context.load_recorded` | boolean | Read by section `context`. |
| `context.ambient_recorded` | boolean | Read by section `context`. |
| `context.speed_recorded` | boolean | Read by section `context`. |

**`trending` — trending**

| Field | Type | Notes |
|---|---|---|
| `trending.deltas_vs_baseline_computed` | boolean | Read by section `trending`. |
| `trending.rate_of_change_considered` | boolean | Read by section `trending`. |
| `trending.repair_events_annotated` | boolean | Read by section `trending`. |

**`bands`, `readings[]`, `alarms[]` — alert bands and triage**

| Field | Type | Notes |
|---|---|---|
| `bands.defined_per_standard_or_oem` | boolean | Read by section `alert_bands_and_triage`. |
| `readings[]` | array of objects | Reading rows `{parameter (string), value (number), watch_limit (number), warning_limit (number), action_limit (number)}`. Limits are exceedance thresholds and must satisfy watch ≤ warning ≤ action. Every reading is classified against its bands; the output reports the computed `highest_band`. |
| `alarms[]` | array of objects | Triage rows `{id (string), disposition (string enum: noise / watch / act), reasoning_recorded (boolean), recheck_interval_set (boolean), work_request_raised (boolean)}`. A `watch` disposition requires a recheck interval; an `act` disposition requires a raised work request; a reading at or beyond its action limit requires an `act` triage on record. |

**`escalation` — escalation**

| Field | Type | Notes |
|---|---|---|
| `escalation.findings_sent_with_trend_pack` | boolean | Read by section `escalation`. |
| `escalation.alarm_closed_without_triage_note` | boolean | Read by section `escalation`. Must be `false` to pass. |
| `escalation.condemned_or_cleared_on_single_reading` | boolean | Read by section `escalation`. Must be `false` to pass. |

### Checks

The recorded full-pass REST response carries 19 checks. Every check is listed below, grouped by its `section` exactly as recorded. For each check: what it requires to pass, and its semantics — `pass` = the requirement is met on the declared evidence; `fail` = the field is present but false/invalid (or a must-be-false field is `true`, or a computed condition is breached); `missing` = the field (or the rows a computed check reads) is absent. There is no separate not-applicable status value in recorded responses: a gated check whose gate is closed reports `pass`, with its evidence line saying why (for example “no LLM judge declared”).

**Section `baseline`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `baseline_exists` | A baseline exists for the asset (quality gate: baselines exist for critical assets). Recorded full-pass evidence: “quality gate: baselines exist for critical assets” | `baseline.exists` |
| `baseline_captured_under_known_load` | The baseline was captured as-installed, under known load. Recorded full-pass evidence: “baseline as-installed, under known load” | `baseline.captured_under_known_load` |
| `post_repair_baseline_captured` | When a repair since baseline is declared, a post-repair baseline was captured (verify the fix actually fixed it). When no repair is declared, this check passes as not applicable — the recorded sparse evidence reads “no repair since baseline declared”. Recorded full-pass evidence: “quality gate: post-repair baselines captured (verify the fix actually fixed it)” | `baseline.post_repair_baseline_captured`, gated by `baseline.repair_since_baseline` |
**Section `technique_coverage`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `techniques_match_asset` | Techniques match the asset: vibration / thermography / ESA / DGA as the asset class requires. Recorded full-pass evidence: “techniques by asset: vibration / thermography / ESA / DGA as the asset class requires” | `monitoring.techniques_match_asset` |
| `fixed_routes_and_points` | Fixed routes and points: same points, same method. Recorded full-pass evidence: “fixed routes; same points, same method” | `monitoring.fixed_route_points` |
| `same_instrument_class` | The same instrument class is used — comparability is the whole game. Recorded full-pass evidence: “same instrument class — comparability is the whole game” | `monitoring.same_instrument_class` |
**Section `context`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `load_recorded_with_readings` | Readings carry load context (quality gate). Recorded full-pass evidence: “quality gate: readings carry load context” | `context.load_recorded` |
| `ambient_recorded` | Readings carry ambient context (quality gate). Recorded full-pass evidence: “quality gate: readings carry ambient context” | `context.ambient_recorded` |
| `speed_recorded` | Speed is logged with every reading. Recorded full-pass evidence: “log speed with every reading” | `context.speed_recorded` |
**Section `trending`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `deltas_vs_baseline_computed` | Deltas vs baseline are computed — deltas and rates-of-change beat absolute numbers. Recorded full-pass evidence: “deltas and rates-of-change beat absolute numbers” | `trending.deltas_vs_baseline_computed` |
| `rate_of_change_considered` | Rate of change is considered (trend + context). Recorded full-pass evidence: “trend + context: rates-of-change considered” | `trending.rate_of_change_considered` |
| `repair_events_annotated` | Charts are annotated with repair events. Recorded full-pass evidence: “annotate charts with repair events” | `trending.repair_events_annotated` |
**Section `alert_bands_and_triage`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `bands_defined_per_standard_or_oem` | Watch/warning/action bands are defined per site standard or OEM. Recorded full-pass evidence: “define watch/warning/action bands per site standard/OEM” | `bands.defined_per_standard_or_oem` |
| `readings_classified_against_bands` | Computed check: every declared reading is classified against its declared bands. With no readings declared this check is `missing` (recorded evidence: “no readings declared”). Recorded full-pass evidence: “every reading classified against its declared bands” | `readings[]` (computed) |
| `action_band_readings_have_act_triage` | Computed check: a reading at or beyond its action limit has an `act` triage (work request) on record. With no readings declared this check is `missing`. Recorded full-pass evidence: “a reading at or beyond its action limit requires an act triage (work request)” | `readings[]` together with `alarms[]` (computed) |
| `alarms_fully_triaged` | Computed check: every alarm is triaged — disposition noise / watch (recheck interval set) / act (work request raised) — with reasoning recorded. With no triage record declared this check is `missing`. Recorded full-pass evidence: “every alarm triaged — noise / watch (recheck interval) / act (work request) — with reasoning recorded” | `alarms[]` (computed) |
**Section `escalation`**

| Check | Requires to pass | Source field(s) |
|---|---|---|
| `suspicious_findings_escalated_with_trend_pack` | Suspicious findings are escalated to the responsible engineer with the full trend pack, not a single number. Recorded full-pass evidence: “suspicious findings go to the responsible engineer with the full trend pack, not a single number” | `escalation.findings_sent_with_trend_pack` |
| `no_alarm_closed_without_triage_note` | No alarm was closed without a triage note: `escalation.alarm_closed_without_triage_note` is `false` (skill red line). Recorded full-pass evidence: “skill red line: no alarm closes without a triage note” | `escalation.alarm_closed_without_triage_note` (must be `false`) |
| `no_condemn_or_clear_on_single_reading` | Equipment was never condemned or cleared on one reading without context: `escalation.condemned_or_cleared_on_single_reading` is `false` (skill red line). Recorded full-pass evidence: “skill red line: never condemn or clear equipment on one reading without context” | `escalation.condemned_or_cleared_on_single_reading` (must be `false`) |

### Output format

HTTP 200 returns one JSON object:

| Field | Content |
|---|---|
| `service` | `"condition-monitoring-triage"` |
| `atom_version` | `"0.1.0" |
| `asset` | The manifest's `asset` value, carried through |
| `verdict` | One of the verdict values below |
| `sections` | Object mapping each section to its section status (below) |
| `checks` | Array of `{section, check, status, evidence}` — one entry per check, in section order |
| (computed) | `highest_band` — computed from the `readings[]` rows against their declared limits: one of `normal` / `watch` / `warning` / `action`, or `null` when no readings are declared. |
| `summary` | One line counting pass / fail / missing across all checks and sections |
| `stamp` | The same verdict as a plain-text block |

### Verdict vocabulary

**Verdicts** (the `verdict` field — every value this atom can return):

- `TRIAGE_SOUND` — All 19 checks pass across all six sections. The monitoring and triage are sound on the evidence declared.
- `TRIAGE_UNSOUND` — At least one check fails (a field present but false/invalid, a must-be-false field true, or a computed band/triage condition breached). The failing checks name the section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — No check fails, but at least one check is `missing` — evidence (or readings/alarm rows) was not declared. The missing checks name exactly what to supply.

**Section statuses** (values in the `sections` object):

- `pass` — every check in the section passes.
- `fail` — at least one check in the section fails.
- `insufficient_evidence` — no check in the section fails, but at least one is `missing`.

**Per-check statuses** (the `status` field of each `checks[]` entry):

- `pass` — the requirement is met on the declared evidence (including gated checks whose gate is closed — see Checks).
- `fail` — the requirement is breached on present evidence.
- `missing` — the evidence the check reads was not declared.

### Errors

Only the shapes evidenced in the repo and gateway documentation are given; no payload is invented. USER-GUIDE.md evidences the four statuses; the 422 body is the recorded one.

| HTTP | Meaning | Body |
|---|---|---|
| 401 | Unauthenticated — key missing or invalid | No body shape is evidenced in the repo for this atom; treat the status itself as the signal and check the `Authorization: Bearer <key>` header. |
| 403 | Scope — the key is valid but lacks this atom's scope | No body shape is evidenced in the repo for this atom; issue this atom's scope on the key (`POST /v1/keys` with this atom) and retry. |
| 422 | `invalid_input` — the manifest violates a field type; rejected before evaluation | Recorded shape: `{"ok": false, "error": "invalid_input", "field": "baseline", "detail": "baseline must be an object"}` — `field` and `detail` name the offending field and the expected type for your submission. |
| 429 | Rate limit — per-key limit exceeded (see Rate limits) | No body shape is evidenced in the repo for this atom; back off and retry within the limits below. |

### Rate limits and pricing

- Rate limits (contract.yaml): 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- Pricing: pricing unit `deliverable`; `pricing.rate` is `null` (rate status: pending — prices are set only from measured production cost per unit). **Free during trial — rate pending.**

## Explanation

The triage verdict judges the monitoring discipline around rotating and electrical assets (motors, drives, transformers — vibration, thermography, electrical signature analysis, oil analysis), not the asset's health. Its logic is comparability and follow-through: a baseline captured under known load (and re-captured after repairs), techniques matched to the asset on fixed routes with the same instrument class, load/ambient/speed recorded with every reading, deltas and rate of change trended, readings classified against standard/OEM bands, every alarm triaged with reasoning, and suspicious findings escalated with the full trend pack. Two computed elements sit inside the verdict: the classification of each reading against its bands (reported as `highest_band`) and the cross-check that action-band readings have an `act` triage on record. The register's named doubt stands: this is safety-adjacent — the SME makes the calls; the atom checks that the calls were made under discipline.

**How the verdict is decided.** The core is deterministic: the same manifest always produces the same verdict (the recorded battery proves byte-identical repeat responses, and MCP/REST parity). Each check reads named manifest fields and resolves to `pass`, `fail`, or `missing`. The distinction that drives the verdict is *absent vs false*: a field that is **absent** is missing evidence — its check is `missing`, and if nothing fails the verdict is `INSUFFICIENT_EVIDENCE`, naming exactly what to supply. A field that is **present but false or invalid** is a breached requirement — its check fails, and any single failure makes the verdict `TRIAGE_UNSOUND`. Section statuses roll up the same way (`pass` / `fail` / `insufficient_evidence`). Gated checks follow their gate field: when the gate is closed (for example no LLM judge used, no repair declared, no NIST alignment claimed, no backdoor present), the gated check passes as not applicable rather than going missing; when the gate is open, the gated field is required. Must-be-false fields invert the test: declaring them `true` is the failure.

**What it does not do.**

- It does not take readings, inspect the asset, or diagnose its condition — `highest_band` classifies the readings the caller declares, nothing more.
- It does not verify that declared booleans are true in the world; the verdict is evidence about the declaration, in the declared shape.
- It does not set the bands: watch/warning/action limits come from the caller's standard or OEM values as declared in each reading row.
- It sells the check (the triage verdict) — never the underlying condition-monitoring knowledge itself.

**Buyer and use context.** Teams and agents working in “Electrical & energy” who need this check on demand and would rather buy it per use than build or staff the capability themselves (first buyer hypothesis from the register; not yet market-tested). House self-use: EE asset monitoring reviews — Wright is an internal caller (zero price, metered to the internal cost ledger). One unit of sale = one deliverable (the delivered verdict). The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge.

## Role views

### For integrators (Users)

You integrate one call: obtain a key, POST the manifest to the REST endpoint (or call the MCP tool `condition_monitoring_triage`), and consume `verdict`, `sections`, `checks`, `summary` and `stamp`. Treat the three verdict values as your branch points: `TRIAGE_SOUND` = proceed; `TRIAGE_UNSOUND` = stop and remediate the failing checks; `INSUFFICIENT_EVIDENCE` = collect the missing evidence named in the `missing` checks and resubmit. Handle 422 as a client bug (fix the named field's type), 401/403 as key problems, and 429 by backing off. The call is stateless and deterministic, so caching a verdict for an unchanged manifest is sound.

### For developers

Manifest authoring: declare facts, not aspirations — every boolean is a claim about work actually done, and must-be-false fields are the usual trap (declaring them `true` is an instant fail). Respect the gates: gated fields are required only when their gate field opens them. Implementation pointers: `src/condition_monitoring_triage.py` — `evaluate(manifest) -> verdict dict`; CLI prints JSON + stamp. Tests: `tests/test_condition_monitoring_triage.py — 18 tests, all passing 2026-11-15`. Determinism is contractual: no randomness, no clock, no external calls in the evaluation path — the recorded battery's byte-identical repeat and MCP/REST parity results (TEST-REPORT.md) are the regression bar. Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/condition-monitoring-triage`, MCP `POST /mcp/condition-monitoring-triage` (tool `condition_monitoring_triage`) on gateway `https://atoms.pipavia.com` (recorded gateway version 1.1.0). Key scope: per user, per atom — a 403 means the key lacks this atom's scope, a 401 means missing/invalid key. Rate limits: 60/min and 10,000/day per key; watch 429s as the capacity signal. Error monitoring: 422s indicate client manifest type bugs (the body names the field); a rising 422 rate after a client release is a client regression, not an atom fault. Status: live — release candidate (one-week RC soak to 2026-11-22); verification state PASS on the recorded battery (TEST-REPORT.md; `verification/results/condition-monitoring-triage.json`). Pricing is not yet metered for revenue: rate pending, free during trial.

## Worked examples

Provenance: recorded 2026-11-15T23:56:07.774356+00:00 against gateway v1.1.0, external verification lane, source `verification/work/condition-monitoring-triage/evidence.json`. Inputs are each case's recorded `input`; responses are the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — mechanically verified after writing).

### Example 1 — Full-pass (case `full-pass`, HTTP 200)

Input:

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

Response (REST):

```json
{
  "service": "condition-monitoring-triage",
  "atom_version": "0.1.0",
  "asset": "Motor-001",
  "verdict": "TRIAGE_SOUND",
  "sections": {
    "baseline": "pass",
    "technique_coverage": "pass",
    "context": "pass",
    "trending": "pass",
    "alert_bands_and_triage": "pass",
    "escalation": "pass"
  },
  "checks": [
    {
      "section": "baseline",
      "check": "baseline_exists",
      "status": "pass",
      "evidence": "quality gate: baselines exist for critical assets"
    },
    {
      "section": "baseline",
      "check": "baseline_captured_under_known_load",
      "status": "pass",
      "evidence": "baseline as-installed, under known load"
    },
    {
      "section": "baseline",
      "check": "post_repair_baseline_captured",
      "status": "pass",
      "evidence": "quality gate: post-repair baselines captured (verify the fix actually fixed it)"
    },
    {
      "section": "technique_coverage",
      "check": "techniques_match_asset",
      "status": "pass",
      "evidence": "techniques by asset: vibration / thermography / ESA / DGA as the asset class requires"
    },
    {
      "section": "technique_coverage",
      "check": "fixed_routes_and_points",
      "status": "pass",
      "evidence": "fixed routes; same points, same method"
    },
    {
      "section": "technique_coverage",
      "check": "same_instrument_class",
      "status": "pass",
      "evidence": "same instrument class — comparability is the whole game"
    },
    {
      "section": "context",
      "check": "load_recorded_with_readings",
      "status": "pass",
      "evidence": "quality gate: readings carry load context"
    },
    {
      "section": "context",
      "check": "ambient_recorded",
      "status": "pass",
      "evidence": "quality gate: readings carry ambient context"
    },
    {
      "section": "context",
      "check": "speed_recorded",
      "status": "pass",
      "evidence": "log speed with every reading"
    },
    {
      "section": "trending",
      "check": "deltas_vs_baseline_computed",
      "status": "pass",
      "evidence": "deltas and rates-of-change beat absolute numbers"
    },
    {
      "section": "trending",
      "check": "rate_of_change_considered",
      "status": "pass",
      "evidence": "trend + context: rates-of-change considered"
    },
    {
      "section": "trending",
      "check": "repair_events_annotated",
      "status": "pass",
      "evidence": "annotate charts with repair events"
    },
    {
      "section": "alert_bands_and_triage",
      "check": "bands_defined_per_standard_or_oem",
      "status": "pass",
      "evidence": "define watch/warning/action bands per site standard/OEM"
    },
    {
      "section": "alert_bands_and_triage",
      "check": "readings_classified_against_bands",
      "status": "pass",
      "evidence": "every reading classified against its declared bands"
    },
    {
      "section": "alert_bands_and_triage",
      "check": "action_band_readings_have_act_triage",
      "status": "pass",
      "evidence": "a reading at or beyond its action limit requires an act triage (work request)"
    },
    {
      "section": "alert_bands_and_triage",
      "check": "alarms_fully_triaged",
      "status": "pass",
      "evidence": "every alarm triaged — noise / watch (recheck interval) / act (work request) — with reasoning recorded"
    },
    {
      "section": "escalation",
      "check": "suspicious_findings_escalated_with_trend_pack",
      "status": "pass",
      "evidence": "suspicious findings go to the responsible engineer with the full trend pack, not a single number"
    },
    {
      "section": "escalation",
      "check": "no_alarm_closed_without_triage_note",
      "status": "pass",
      "evidence": "skill red line: no alarm closes without a triage note"
    },
    {
      "section": "escalation",
      "check": "no_condemn_or_clear_on_single_reading",
      "status": "pass",
      "evidence": "skill red line: never condemn or clear equipment on one reading without context"
    }
  ],
  "highest_band": "normal",
  "summary": "19 pass, 0 fail, 0 missing of 19 checks across six sections.",
  "stamp": "CONDITION-MONITORING TRIAGE\nasset: Motor-001\nVERDICT: TRIAGE_SOUND\n  baseline               pass\n  technique_coverage     pass\n  context                pass\n  trending               pass\n  alert_bands_and_triage pass\n  escalation             pass\n19 pass, 0 fail, 0 missing of 19 checks across six sections."
}
```

### Example 2 — Violations (case `violations`, HTTP 200)

Input:

```json
{
  "asset": "Motor-001",
  "baseline": {
    "exists": true,
    "captured_under_known_load": true,
    "repair_since_baseline": true,
    "post_repair_baseline_captured": false
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
  "readings": [],
  "alarms": [],
  "escalation": {
    "findings_sent_with_trend_pack": true,
    "alarm_closed_without_triage_note": true,
    "condemned_or_cleared_on_single_reading": false
  }
}
```

Response (REST):

```json
{
  "service": "condition-monitoring-triage",
  "atom_version": "0.1.0",
  "asset": "Motor-001",
  "verdict": "TRIAGE_UNSOUND",
  "sections": {
    "baseline": "fail",
    "technique_coverage": "pass",
    "context": "pass",
    "trending": "pass",
    "alert_bands_and_triage": "insufficient_evidence",
    "escalation": "fail"
  },
  "checks": [
    {
      "section": "baseline",
      "check": "baseline_exists",
      "status": "pass",
      "evidence": "quality gate: baselines exist for critical assets"
    },
    {
      "section": "baseline",
      "check": "baseline_captured_under_known_load",
      "status": "pass",
      "evidence": "baseline as-installed, under known load"
    },
    {
      "section": "baseline",
      "check": "post_repair_baseline_captured",
      "status": "fail",
      "evidence": "quality gate: post-repair baselines captured (verify the fix actually fixed it)"
    },
    {
      "section": "technique_coverage",
      "check": "techniques_match_asset",
      "status": "pass",
      "evidence": "techniques by asset: vibration / thermography / ESA / DGA as the asset class requires"
    },
    {
      "section": "technique_coverage",
      "check": "fixed_routes_and_points",
      "status": "pass",
      "evidence": "fixed routes; same points, same method"
    },
    {
      "section": "technique_coverage",
      "check": "same_instrument_class",
      "status": "pass",
      "evidence": "same instrument class — comparability is the whole game"
    },
    {
      "section": "context",
      "check": "load_recorded_with_readings",
      "status": "pass",
      "evidence": "quality gate: readings carry load context"
    },
    {
      "section": "context",
      "check": "ambient_recorded",
      "status": "pass",
      "evidence": "quality gate: readings carry ambient context"
    },
    {
      "section": "context",
      "check": "speed_recorded",
      "status": "pass",
      "evidence": "log speed with every reading"
    },
    {
      "section": "trending",
      "check": "deltas_vs_baseline_computed",
      "status": "pass",
      "evidence": "deltas and rates-of-change beat absolute numbers"
    },
    {
      "section": "trending",
      "check": "rate_of_change_considered",
      "status": "pass",
      "evidence": "trend + context: rates-of-change considered"
    },
    {
      "section": "trending",
      "check": "repair_events_annotated",
      "status": "pass",
      "evidence": "annotate charts with repair events"
    },
    {
      "section": "alert_bands_and_triage",
      "check": "bands_defined_per_standard_or_oem",
      "status": "pass",
      "evidence": "define watch/warning/action bands per site standard/OEM"
    },
    {
      "section": "alert_bands_and_triage",
      "check": "readings_classified_against_bands",
      "status": "missing",
      "evidence": "no readings declared"
    },
    {
      "section": "alert_bands_and_triage",
      "check": "action_band_readings_have_act_triage",
      "status": "missing",
      "evidence": "no readings declared"
    },
    {
      "section": "alert_bands_and_triage",
      "check": "alarms_fully_triaged",
      "status": "pass",
      "evidence": "every alarm triaged — noise / watch (recheck interval) / act (work request) — with reasoning recorded"
    },
    {
      "section": "escalation",
      "check": "suspicious_findings_escalated_with_trend_pack",
      "status": "pass",
      "evidence": "suspicious findings go to the responsible engineer with the full trend pack, not a single number"
    },
    {
      "section": "escalation",
      "check": "no_alarm_closed_without_triage_note",
      "status": "fail",
      "evidence": "skill red line: no alarm closes without a triage note"
    },
    {
      "section": "escalation",
      "check": "no_condemn_or_clear_on_single_reading",
      "status": "pass",
      "evidence": "skill red line: never condemn or clear equipment on one reading without context"
    }
  ],
  "highest_band": null,
  "summary": "15 pass, 2 fail, 2 missing of 19 checks across six sections.",
  "stamp": "CONDITION-MONITORING TRIAGE\nasset: Motor-001\nVERDICT: TRIAGE_UNSOUND\n  baseline               fail\n  technique_coverage     pass\n  context                pass\n  trending               pass\n  alert_bands_and_triage insufficient_evidence\n  escalation             fail\n15 pass, 2 fail, 2 missing of 19 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`, HTTP 422)

Input:

```json
{
  "asset": "Motor-001",
  "baseline": "NOT_A_BOOLEAN_OBJECT"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "baseline",
  "detail": "baseline must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference, Explanation sections above |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; Developers Yes; Ops Yes; Regulators N/A — The verdict checks monitoring-process discipline for industrial assets; it is not itself compliance or audit evidence for a regulated regime, and condition monitoring as documented here is not a regulated-domain verdict (it is safety-adjacent, and the SME — not the atom — makes the calls). |
| Checks named: documented vs recorded | 19 / 19 (from the recorded full-pass REST response `checks` array) |
| Verdict vocabulary complete | Yes — 3 verdict values, 3 section statuses, 3 per-check statuses |
| Input reference typed | Yes — 20 fields with types from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations, malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/condition-monitoring-triage/evidence.json` |

