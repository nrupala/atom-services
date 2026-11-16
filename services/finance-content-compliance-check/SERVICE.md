# Finance content compliance check — `finance-content-compliance-check`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Publish finance education safely - advice-vs-education boundaries, dated figures, disclosures, no return promises.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Writing & documents who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Think With Finance compliance content review**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the finance-content evidence manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NON_COMPLIANT`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `content` (string; carried into the verdict output, not itself checked) | — |
| `jurisdiction` (non-empty string; the stated CA/US/other context) | advice_boundary |
| `advice_boundary.teaches_frameworks_not_recommendations` | advice_boundary |
| `advice_boundary.personalized_recommendations_present` (must be `false` to pass) | advice_boundary |
| `advice_boundary.education_not_advice_disclaimer_present` | advice_boundary |
| `advice_boundary.checklist_passed` | advice_boundary |
| `advice_boundary.advice_like_content_present` (gates the flagged check below) | advice_boundary |
| `advice_boundary.advice_like_flagged_for_review` (required when advice-like content is present; otherwise the check passes as not applicable) | advice_boundary |
| `figures` (list of figures; absent / not a list / empty = both computed checks missing) | accuracy_and_sourcing |
| `figures[].label` (non-empty string) | accuracy_and_sourcing |
| `figures[].as_of` (non-empty string; the figure's as-of date) | accuracy_and_sourcing |
| `figures[].source` (non-empty string) | accuracy_and_sourcing |
| `figures[].source_is_primary` (must be `true` for a complete figure to pass) | accuracy_and_sourcing |
| `figures[].rederived` (must be `true` for a complete figure to pass) | accuracy_and_sourcing |
| `accuracy.primary_sources_linked` | accuracy_and_sourcing |
| `accuracy.rates_and_limits_dated` | accuracy_and_sourcing |
| `accuracy.recheck_cadence_set` | accuracy_and_sourcing |
| `risk.risk_before_upside` | risk_framing |
| `risk.uses_past_performance` (gates the caveat check below) | risk_framing |
| `risk.past_performance_caveat_present` (required when past performance is used; otherwise the check passes as not applicable) | risk_framing |
| `risk.fees_visible` | risk_framing |
| `risk.taxes_visible` | risk_framing |
| `risk.return_promises_present` (must be `false` to pass) | risk_framing |
| `risk.forecasts_presented_as_fact` (must be `false` to pass) | risk_framing |
| `risk.survivorship_examples_used` (must be `false` to pass) | risk_framing |
| `calculators.includes_calculator` (gates all four calculator checks below) | calculators_and_tools |
| `calculators.spec_with_formulas_present` (required when a calculator is included; otherwise the check passes as not applicable) | calculators_and_tools |
| `calculators.boundary_cases_tested` (required when a calculator is included; otherwise the check passes as not applicable) | calculators_and_tools |
| `calculators.assumptions_visible_in_ui` (required when a calculator is included; otherwise the check passes as not applicable) | calculators_and_tools |
| `calculators.dark_patterns_present` (must be `false` when a calculator is included; otherwise the check passes as not applicable) | calculators_and_tools |
| `commercial.has_sponsored_or_affiliate_content` (gates the labeling check below) | commercial_honesty |
| `commercial.sponsored_affiliate_hard_labeled` (required when sponsored/affiliate content exists; otherwise the check passes as not applicable) | commercial_honesty |
| `commercial.conflicts_disclosed` | commercial_honesty |
| `commercial.editorial_separated_from_sales` | commercial_honesty |
| `commercial.recommendations_for_undisclosed_compensation` (must be `false` to pass) | commercial_honesty |
| `commercial.fear_based_selling_present` (must be `false` to pass) | commercial_honesty |
| `compliance.jurisdiction_notes_file_kept` | compliance_and_corrections |
| `compliance.tools_collect_user_data` (gates the privacy check below) | compliance_and_corrections |
| `compliance.privacy_rules_applied` (required when tools collect user data; otherwise the check passes as not applicable) | compliance_and_corrections |
| `compliance.user_data_leaves_device_without_consent` (must be `false` to pass) | compliance_and_corrections |
| `corrections.correction_log_maintained` | compliance_and_corrections |
| `corrections.corrections_made` (gates the correction-note check below) | compliance_and_corrections |
| `corrections.correction_note_visible_and_dated` (required when corrections were made; otherwise the check passes as not applicable) | compliance_and_corrections |

Two checks are computed, not declared: every declared figure is
checked for completeness (label, as-of date, source, primary-source
flag, re-derivation flag), and every complete figure is checked for a
primary source and a re-derived number, exactly as the skill's accuracy
discipline requires. The verdict dict also reports `figures_evaluated`
and `figures_incomplete` counts. No figure, rate or threshold is
invented by the atom — it checks the caller's declared evidence only.

The verdict is one of `COMPLIANT` (all 32 checks pass),
`NON_COMPLIANT` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across six sections:
advice_boundary, accuracy_and_sourcing, risk_framing,
calculators_and_tools, commercial_honesty, compliance_and_corrections.

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
