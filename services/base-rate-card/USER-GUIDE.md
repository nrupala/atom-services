# Base-rate card — user guide

## What it does

You are working a single claim through a critical-thinking card, with the base-rate step at its centre. This atom reads one declared judgment card — claim and evidence, base rates, steelman, fallacy spot-check, calibration, and second-order judgment — and returns one deterministic verdict across six sections: **CARD_COMPLETE**, **CARD_NOT_COMPLETE**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Computed checks: the stated base rate must equal the rate implied by the declared reference-class counts (successes / size); the fallacy check must cover all seven stated fallacies; and the stated confidence must be a probability between zero and one. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "base-rate-card"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/base-rate-card` — tool name `base_rate_card`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/base-rate-card` — body = the manifest object; same `Authorization` header.

## Input — the base-rate-card manifest

| Field | Meaning |
|---|---|
| `claim` | claim text (string; carried into the output, not checked) |
| `evidence.claim_restated_precisely` / `supporting_evidence_sought` / `refuting_evidence_sought` / `hierarchy_applied` / `conflicts_noted_with_reasons` | claim and evidence evidence |
| `base_rate.reference_class_defined` / `considered_first` | base-rate evidence |
| `base_rate.reference_class_size` (number), `base_rate.reference_class_successes` (number), `base_rate.stated` (number) | computed: stated must equal successes / size, counts coherent, stated a probability; reported as `reference_rate` and `base_rate_difference` (6 decimal places) |
| `steelman.strongest_counterargument_built` / `counterargument_engaged` | steelman evidence |
| `steelman.opposing_view_strawmanned` | must be `false` to pass |
| `fallacies.spot_check_performed` | fallacy spot-check evidence |
| `fallacies.checked` (list of strings) | computed: must contain all seven — `ad_hominem`, `straw_man`, `false_dilemma`, `appeal_to_authority_or_antiquity`, `survivorship`, `motivated_reasoning`, `cherry_picked_windows`; omitted ones reported as `fallacies_not_checked` |
| `calibration.confidence_stated` / `outcomes_reviewed` / `hit_rate_tracked_by_confidence_band` | calibration evidence |
| `calibration.confidence_value` (number) | computed: must be between zero and one inclusive |
| `judgment.second_order_effects_considered` / `written` / `includes_confidence` / `includes_key_uncertainties` | second-order and judgment evidence |
| `judgment.conclusion_from_vibes_or_authority_alone` / `certainty_outruns_evidence` | both must be `false` to pass |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward CARD_NOT_COMPLETE).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/base-rate-card`:

```json
{
  "claim": "The project will launch on time.",
  "evidence": {
    "claim_restated_precisely": true,
    "supporting_evidence_sought": true,
    "refuting_evidence_sought": true,
    "hierarchy_applied": true,
    "conflicts_noted_with_reasons": true
  },
  "base_rate": {
    "reference_class_defined": true,
    "considered_first": true,
    "reference_class_size": 100,
    "reference_class_successes": 50,
    "stated": 0.5
  },
  "steelman": {
    "strongest_counterargument_built": true,
    "counterargument_engaged": true,
    "opposing_view_strawmanned": false
  },
  "fallacies": {
    "spot_check_performed": true,
    "checked": [
      "ad_hominem",
      "straw_man",
      "false_dilemma",
      "appeal_to_authority_or_antiquity",
      "survivorship",
      "motivated_reasoning",
      "cherry_picked_windows"
    ]
  },
  "calibration": {
    "confidence_stated": true,
    "confidence_value": 0.8,
    "outcomes_reviewed": true,
    "hit_rate_tracked_by_confidence_band": true
  },
  "judgment": {
    "second_order_effects_considered": true,
    "written": true,
    "includes_confidence": true,
    "includes_key_uncertainties": true,
    "conclusion_from_vibes_or_authority_alone": false,
    "certainty_outruns_evidence": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 23 checks and a text stamp of the verdict):

```json
{
  "service": "base-rate-card",
  "atom_version": "0.1.0",
  "claim": "The project will launch on time.",
  "verdict": "CARD_COMPLETE",
  "sections": {
    "claim_and_evidence": "pass",
    "base_rates": "pass",
    "steelman": "pass",
    "fallacy_spot_check": "pass",
    "calibration": "pass",
    "second_order_and_judgment": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "reference_rate": "0.500000",
  "base_rate_difference": "0.000000",
  "fallacies_not_checked": [],
  "summary": "23 pass, 0 fail, 0 missing of 23 checks across six sections."
}
```

## Verdicts

- **CARD_COMPLETE** — every check passes; the card is complete on the declared evidence.
- **CARD_NOT_COMPLETE** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `reference_rate` (implied rate, string with exactly six decimals, or null), `base_rate_difference` (stated minus implied, six decimals, or null), `fallacies_not_checked` (omitted stated fallacies, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
