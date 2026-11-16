# Finance content compliance check — user guide

## What it does

You are about to publish finance-education content. This atom reads a short evidence manifest describing the content — advice-vs-education boundary, dated and primary-sourced figures, risk framing, calculator honesty, commercial disclosures, privacy and corrections practice — and returns one deterministic verdict across six sections (advice_boundary, accuracy_and_sourcing, risk_framing, calculators_and_tools, commercial_honesty, compliance_and_corrections) with per-check evidence: **COMPLIANT**, **NON_COMPLIANT**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "finance-content-compliance-check"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/finance-content-compliance-check`
  — tool name `finance_content_compliance_check`; `tools/call` arguments = the input object below.
- **REST:** `POST https://atoms.pipavia.com/v1/finance-content-compliance-check`
  — body = the input object; same `Authorization` header.

## Input

The full field table lives in the atom's `SERVICE.md`; the fields are:

| Field |
|---|
| `advice_boundary.teaches_frameworks_not_recommendations` |
| `advice_boundary.education_not_advice_disclaimer_present` |
| `advice_boundary.checklist_passed` |
| `accuracy.primary_sources_linked` |
| `accuracy.rates_and_limits_dated` |
| `accuracy.recheck_cadence_set` |
| `risk.risk_before_upside` |
| `risk.fees_visible` |
| `risk.taxes_visible` |
| `commercial.conflicts_disclosed` |
| `commercial.editorial_separated_from_sales` |
| `compliance.jurisdiction_notes_file_kept` |
| `corrections.correction_log_maintained` |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE / gaps). A field present but false/invalid = the
check fails (counts toward the FAIL verdict).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/finance-content-compliance-check`:

```json
{
  "content": "Investment basics for beginners.",
  "jurisdiction": "US",
  "advice_boundary": {
    "teaches_frameworks_not_recommendations": true,
    "personalized_recommendations_present": false,
    "education_not_advice_disclaimer_present": true,
    "checklist_passed": true,
    "advice_like_content_present": false,
    "advice_like_flagged_for_review": true
  },
  "figures": [
    {
      "label": "S&P 500 Avg Return",
      "as_of": "2023-12-31",
      "source": "SEC.gov",
      "source_is_primary": true,
      "rederived": true
    }
  ],
  "accuracy": {
    "primary_sources_linked": true,
    "rates_and_limits_dated": true,
    "recheck_cadence_set": true
  },
  "risk": {
    "risk_before_upside": true,
    "uses_past_performance": false,
    "past_performance_caveat_present": true,
    "fees_visible": true,
    "taxes_visible": true,
    "return_promises_present": false,
    "forecasts_presented_as_fact": false,
    "survivorship_examples_used": false
  },
  "calculators": {
    "includes_calculator": false,
    "spec_with_formulas_present": true,
    "boundary_cases_tested": true,
    "assumptions_visible_in_ui": true,
    "dark_patterns_present": false
  },
  "commercial": {
    "has_sponsored_or_affiliate_content": false,
    "sponsored_affiliate_hard_labeled": true,
    "conflicts_disclosed": true,
    "editorial_separated_from_sales": true,
    "recommendations_for_undisclosed_compensation": false,
    "fear_based_selling_present": false
  },
  "compliance": {
    "jurisdiction_notes_file_kept": true,
    "tools_collect_user_data": false,
    "privacy_rules_applied": true,
    "user_data_leaves_device_without_consent": false
  },
  "corrections": {
    "correction_log_maintained": true,
    "corrections_made": false,
    "correction_note_visible_and_dated": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries every check
and a text stamp of the verdict):

```json
{
  "service": "finance-content-compliance-check",
  "atom_version": "0.1.0",
  "content": "Investment basics for beginners.",
  "verdict": "COMPLIANT",
  "sections": {
    "advice_boundary": "pass",
    "accuracy_and_sourcing": "pass",
    "risk_framing": "pass",
    "calculators_and_tools": "pass",
    "commercial_honesty": "pass",
    "compliance_and_corrections": "pass"
  },
  "summary": "32 pass, 0 fail, 0 missing of 32 checks across six sections.",
  "checks": [
    {
      "section": "advice_boundary",
      "check": "teaches_frameworks_and_criteria",
      "status": "pass",
      "evidence": "education, not advice: teach frameworks, math, and how-to-choose criteria"
    },
    {
      "section": "advice_boundary",
      "check": "no_personalized_recommendations",
      "status": "pass",
      "evidence": "red line: no personalized recommendations, ever \u2014 personalized advice is licensed activity"
    }
  ]
}
```

## Verdicts

- **COMPLIANT** — every check passes (32/32); the content clears all six sections.
- **NON_COMPLIANT** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
