# Argument analysis review — user guide
Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are checking whether an argument analysis was actually done
properly. This atom reads a declared argument-analysis record for
one argument — anatomy and steelman, evidence weighing, base rates
and calibration, stress testing, fallacy and bias screening, razors
and countercase — and returns one deterministic verdict across six
sections: **ARGUMENT_ANALYSIS_COMPLETE**,
**ARGUMENT_ANALYSIS_DEFICIENT**, or **INSUFFICIENT_EVIDENCE**
(nothing failed, but evidence is missing — the verdict names
exactly which). Three checks are computed: the fallacy screen must
cover all nine skill-named fallacies, the bias screen all six
skill-named biases, and the declared confidence must be strictly
between 0 and 100 (0 and 100 are binary certainty and fail). Same
manifest in → same verdict out. It audits the declared record; it
does not judge whether the argument's conclusion is true.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "argument-analysis-review"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/argument-analysis-review`
  — tool name `argument_analysis_review`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/argument-analysis-review`
  — body = the manifest object; same `Authorization` header.

## Input — the argument-analysis manifest

| Field | Meaning |
|---|---|
| `argument` | argument label (string; carried into the output, not checked) |
| `anatomy.premises_identified` / `conclusion_identified` / `validity_distinguished_from_soundness` / `steelman_stated` | anatomy and steelman evidence |
| `evidence.source_quality_assessed` / `sample_size_considered` / `confounders_considered` / `replication_considered` | evidence weighing evidence |
| `evidence.anecdote_treated_as_data` | must be `false` to pass |
| `calibration.base_rate_stated` / `diagnosticity_assessed` / `known_vs_believed_separated` | base-rate and calibration evidence |
| `calibration.confidence_percent` | number; computed: passes only strictly between 0 and 100 |
| `stress_test.inversion_or_premortem_done` / `second_order_consequences_traced` / `change_mind_evidence_prestated` | stress-testing evidence |
| `screening.fallacies_screened` | list of tokens; computed: must contain all nine — `ad_hominem`, `straw_man`, `false_dichotomy`, `appeal_to_authority`, `slippery_slope`, `correlation_as_causation`, `survivorship_bias`, `base_rate_neglect`, `sunk_cost` (extra tokens ignored) |
| `screening.biases_screened` | list of tokens; computed: must contain all six — `confirmation`, `anchoring`, `availability`, `motivated_reasoning`, `recency`, `overconfidence` |
| `razors.simplest_explanation_preferred` / `malice_not_assumed_without_evidence` / `chestertons_fence_respected` / `map_territory_distinguished` | razor evidence |
| `countercase.key_assumption_named` / `strongest_countercase_offered` | countercase evidence |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check
fails (counts toward ARGUMENT_ANALYSIS_DEFICIENT).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/argument-analysis-review`:

```json
{
  "argument": "All men are mortal; Socrates is a man; therefore Socrates is mortal.",
  "anatomy": {
    "premises_identified": true,
    "conclusion_identified": true,
    "validity_distinguished_from_soundness": true,
    "steelman_stated": true
  },
  "evidence": {
    "source_quality_assessed": true,
    "sample_size_considered": true,
    "confounders_considered": true,
    "replication_considered": true,
    "anecdote_treated_as_data": false
  },
  "calibration": {
    "base_rate_stated": true,
    "diagnosticity_assessed": true,
    "confidence_percent": 75,
    "known_vs_believed_separated": true
  },
  "stress_test": {
    "inversion_or_premortem_done": true,
    "second_order_consequences_traced": true,
    "change_mind_evidence_prestated": true
  },
  "screening": {
    "fallacies_screened": [
      "ad_hominem",
      "straw_man",
      "false_dichotomy",
      "appeal_to_authority",
      "slippery_slope",
      "correlation_as_causation",
      "survivorship_bias",
      "base_rate_neglect",
      "sunk_cost"
    ],
    "biases_screened": [
      "confirmation",
      "anchoring",
      "availability",
      "motivated_reasoning",
      "recency",
      "overconfidence"
    ]
  },
  "razors": {
    "simplest_explanation_preferred": true,
    "malice_not_assumed_without_evidence": true,
    "chestertons_fence_respected": true,
    "map_territory_distinguished": true
  },
  "countercase": {
    "key_assumption_named": true,
    "strongest_countercase_offered": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 24 checks
and a text stamp of the verdict):

```json
{
  "service": "argument-analysis-review",
  "atom_version": "0.1.0",
  "argument": "All men are mortal; Socrates is a man; therefore Socrates is mortal.",
  "verdict": "ARGUMENT_ANALYSIS_COMPLETE",
  "sections": {
    "anatomy_and_steelman": "pass",
    "evidence_weighing": "pass",
    "base_rates_and_calibration": "pass",
    "stress_testing": "pass",
    "fallacy_and_bias_screening": "pass",
    "razors_and_countercase": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "missing_fallacies": [],
  "missing_biases": [],
  "confidence_percent": 75,
  "summary": "24 pass, 0 fail, 0 missing of 24 checks across six sections."
}
```

## Verdicts

- **ARGUMENT_ANALYSIS_COMPLETE** — every check passes; the analysis record is complete on the declared evidence.
- **ARGUMENT_ANALYSIS_DEFICIENT** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null), `missing_fallacies` and `missing_biases` (skill-named tokens absent from each screen, in skill order; null when a screen is not declared) and `confidence_percent` (the declared value, or null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
