# Claim evaluation review — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a claim-evaluation artifact — a declared claim set with its evidence-hierarchy and conflict record, base-rate / reference-class record, steelman and fallacy spot-check record, calibration record, and second-order and written-judgment record. This atom reads one declared manifest and returns one deterministic verdict across six sections: **CLAIM_EVALUATION_COMPLETE**, **CLAIM_EVALUATION_NOT_COMPLETE**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared artifact's completeness and internal consistency only — it does not read the underlying claims or evidence, and it never decides whether any claim is true, well-supported, or worth acting on. Computed checks: every claim entry must be complete (non-empty `label` plus all four entry booleans) and every complete entry must declare restatement, supporting AND refuting evidence sought, and evidence presence assessed; the declared base rate and the stated confidence must each lie inside 0–100 (the definition of a percent — no level is imposed; the skill's "80% sure" is an example, not a threshold); the fallacy screen must cover all eight stated fallacies — `ad_hominem`, `straw_man`, `false_dilemma`, `appeal_to_authority`, `appeal_to_antiquity`, `survivorship_stories`, `motivated_reasoning`, `cherry_picked_windows`; and the declared calibration hit rate must equal outcomes correct ÷ outcomes total × 100, with a positive total (no hit-rate level or minimum outcome count is imposed). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "claim-evaluation-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/claim-evaluation-review` — tool name `claim_evaluation_review`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/claim-evaluation-review` — body = the manifest object; same `Authorization` header.

## Input — the claim-evaluation-review manifest

| Field | Meaning |
|---|---|
| `entity` | entity name (string; carried into the output, not checked) |
| `claims` (list of claim entries) | computed: absent / not a list / empty = all four claim-set checks missing; each entry needs a non-empty `label` (string) and the four booleans below; an incomplete entry makes all four claim-set checks missing; reported as `claims_evaluated` (count of complete entries) |
| `claims[].label` (string) | claim label; must be non-empty for the entry to be complete |
| `claims[].restated_precisely` | computed: every complete entry must declare it true |
| `claims[].supporting_evidence_sought` / `claims[].refuting_evidence_sought` | computed: every complete entry must declare both true (supporting AND refuting evidence sought) |
| `claims[].evidence_presence_assessed` | computed: every complete entry must declare it true (whether evidence is present was assessed, per claim) |
| `hierarchy.evidence_ranked_by_hierarchy` / `conflicts_noted` / `conflict_reasons_and_incentives_examined` | evidence-hierarchy and conflict evidence |
| `hierarchy.conclusions_from_vibes_or_authority_alone` | must be `false` to pass (red line) |
| `base_rates.considered_first` / `reference_class_identified` / `used_where_applicable` | base-rate / reference-class evidence |
| `base_rates.base_rate_percent` (number) | computed: must lie inside 0–100 inclusive; reported as `base_rate_percent` (6 decimal places, or null when no number is declared); no base-rate level is imposed |
| `steelman.strongest_counterargument_constructed` / `strongest_counterargument_engaged` | steelman evidence |
| `steelman.straw_manning_in_own_favor` | must be `false` to pass (red line) |
| `fallacy_screen.fallacies_checked` (list of strings) | computed: must contain all eight stated fallacies — `ad_hominem`, `straw_man`, `false_dilemma`, `appeal_to_authority`, `appeal_to_antiquity`, `survivorship_stories`, `motivated_reasoning`, `cherry_picked_windows`; omitted ones reported as `fallacies_not_checked` (or null when no list is declared); entries are validated as strings only, never enum-checked |
| `calibration.confidence_stated` | confidence-stated evidence |
| `calibration.confidence_percent` (number) | computed: must lie inside 0–100 inclusive; reported as `confidence_percent` (6 decimal places, or null likewise); no confidence level is imposed |
| `calibration.outcomes_reviewed` / `hit_rate_tracked_by_confidence_band` | calibration record evidence |
| `calibration.outcomes_correct` (number), `calibration.outcomes_total` (number), `calibration.declared_hit_rate_percent` (number) | computed: declared hit rate must equal outcomes correct ÷ outcomes total × 100, with a positive total; reported as `computed_hit_rate_percent` and `hit_rate_difference` (6 decimal places, or null when either cannot be computed) |
| `calibration.certainty_outruns_evidence` | must be `false` to pass (red line) |
| `second_order.second_order_thinking_applied` | second-order thinking evidence |
| `judgment.judgment_written` / `judgment_includes_key_uncertainties` / `judgment_checkable_later` | written-judgment evidence |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward CLAIM_EVALUATION_NOT_COMPLETE).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/claim-evaluation-review`:

```json
{
  "entity": "Test Entity",
  "claims": [
    {
      "label": "Claim A",
      "restated_precisely": true,
      "supporting_evidence_sought": true,
      "refuting_evidence_sought": true,
      "evidence_presence_assessed": true
    }
  ],
  "hierarchy": {
    "evidence_ranked_by_hierarchy": true,
    "conflicts_noted": true,
    "conflict_reasons_and_incentives_examined": true,
    "conclusions_from_vibes_or_authority_alone": false
  },
  "base_rates": {
    "considered_first": true,
    "reference_class_identified": true,
    "used_where_applicable": true,
    "base_rate_percent": 50.0
  },
  "steelman": {
    "strongest_counterargument_constructed": true,
    "strongest_counterargument_engaged": true,
    "straw_manning_in_own_favor": false
  },
  "fallacy_screen": {
    "fallacies_checked": [
      "ad_hominem",
      "straw_man",
      "false_dilemma",
      "appeal_to_authority",
      "appeal_to_antiquity",
      "survivorship_stories",
      "motivated_reasoning",
      "cherry_picked_windows"
    ]
  },
  "calibration": {
    "confidence_stated": true,
    "confidence_percent": 80.0,
    "outcomes_reviewed": true,
    "hit_rate_tracked_by_confidence_band": true,
    "outcomes_correct": 8,
    "outcomes_total": 10,
    "declared_hit_rate_percent": 80.0,
    "certainty_outruns_evidence": false
  },
  "second_order": {
    "second_order_thinking_applied": true
  },
  "judgment": {
    "judgment_written": true,
    "judgment_includes_key_uncertainties": true,
    "judgment_checkable_later": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 26 checks and a text stamp of the verdict):

```json
{
  "service": "claim-evaluation-review",
  "atom_version": "0.1.0",
  "entity": "Test Entity",
  "verdict": "CLAIM_EVALUATION_COMPLETE",
  "sections": {
    "claim_set_and_evidence": "pass",
    "evidence_hierarchy_and_conflicts": "pass",
    "base_rates_and_reference_class": "pass",
    "steelman_and_fallacy_screen": "pass",
    "calibration": "pass",
    "second_order_and_judgment": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "claims_evaluated": 1,
  "base_rate_percent": "50.000000",
  "confidence_percent": "80.000000",
  "computed_hit_rate_percent": "80.000000",
  "hit_rate_difference": "0.000000",
  "fallacies_not_checked": [],
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across six sections."
}
```

## Verdicts

- **CLAIM_EVALUATION_COMPLETE** — every check passes; the claim-evaluation artifact is complete and internally consistent on the declared evidence.
- **CLAIM_EVALUATION_NOT_COMPLETE** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `claims_evaluated` (count of complete claim entries), `base_rate_percent` and `confidence_percent`, `computed_hit_rate_percent` and `hit_rate_difference` (computed amounts as strings with exactly six decimals, or null when they cannot be computed), `fallacies_not_checked` (stated fallacies not declared checked, or null when no list is declared) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
