# Claim verification fact check stamp — `claim-verification-fact-check-stamp`

**Deliverable type:** STAMP. This atom sells the stamp it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Verify claims before publishing - source triangulation, provenance checks, uncertainty labels, corrections.

A caller submits the inputs the bound skill works on and receives one stamp back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this stamp on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Fact-checking content before publishing**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the claim-verification manifest

The caller submits one JSON manifest: the declared claims, each with
its label, source record and re-check record, plus the publication
process record. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_STAMPED`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `document` (string; carried into the stamp output, not itself checked) | — |
| `process.claims_extracted` | extraction |
| `process.units_and_dates_checked` | compute_rechecks |
| `process.counter_case_considered` | uncertainty_language |
| `process.evidence_published_inline` | publication_and_corrections |
| `process.methodology_visible_for_big_claims` | publication_and_corrections |
| `process.corrections_policy_published` | publication_and_corrections |
| `process.versions_retained` | publication_and_corrections |
| `process.silent_edits_made` (must be `false` to pass) | publication_and_corrections |
| `claims[]` (list of claim rows, see below) | extraction, source_ladder, triangulation, compute_rechecks, uncertainty_language |

Each `claims[]` row is `{id (string), material, label,
independent_sources (number), primary_source (boolean), sources_archived,
source_metadata_recorded, independence_checked, has_numbers,
math_rechecked, language_weakest_supported}`. The per-claim checks are
aggregates that name the offending claim ids: a **material** claim is
triangulated when it has >= 2 independent sources, or one primary
source plus >= 1 independent source; a claim with `has_numbers` true
must have `math_rechecked` true; every label must be in the vocabulary
(verified / likely / contested / unverified); every material claim's
sources must be archived. Non-material claims are exempt from
triangulation and archiving. The output also carries the computed
`claims_summary` counts (claims_total / material_claims /
verified_claims).

The verdict is one of `STAMPED` (all 16 checks pass), `NOT_STAMPED`
(any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across six sections: extraction, source_ladder,
triangulation, compute_rechecks, uncertainty_language,
publication_and_corrections.

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
