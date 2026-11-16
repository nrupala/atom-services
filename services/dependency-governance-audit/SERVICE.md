# Dependency governance audit — `dependency-governance-audit`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Govern third-party dependencies — minimalism, pinning, audits, license checks, SBOM, and verified sources.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Release supply-chain checks**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the dependency-governance evidence manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_GOVERNED`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `project` (string; carried into the verdict output, not itself checked) | — |
| `justification.recorded` | justification |
| `justification.alternatives_considered` | justification |
| `sources.all_official` | verified_sources |
| `sources.publisher_signing_checked` | verified_sources |
| `sources.binaries_present` | verified_sources |
| `sources.binary_checksums_verified` (checked only when `sources.binaries_present` is true; no binaries declared = pass) | verified_sources |
| `pinning.exact_versions` | pinning |
| `pinning.lockfile_committed` | pinning |
| `pinning.lockfile_updated_in_same_change` | pinning |
| `pinning.ci_installs_from_lockfile` | pinning |
| `pinning.ci_actions_images_pinned_to_hashes` | pinning |
| `audit.automated_in_workflow` | audit_and_updates |
| `audit.bot_bumps_reviewed` | audit_and_updates |
| `audit.automerge_without_green_suite` (must be `false` to pass) | audit_and_updates |
| `updates.batched` | audit_and_updates |
| `updates.stale_dependencies_flagged` | audit_and_updates |
| `updates.unused_retired` | audit_and_updates |
| `licences.checked` | licences |
| `licences.non_permissive_present` | licences |
| `licences.human_decision_recorded` (required when `licences.non_permissive_present` is true; otherwise the check passes as not applicable) | licences |
| `licences.notice_required` | licences |
| `licences.notice_updated` (required when `licences.notice_required` is true; otherwise the check passes as not applicable) | licences |
| `sbom.generated_per_release` | sbom |
| `sbom.kept_with_artifacts` | sbom |

The verdict is one of `GOVERNED` (all 21 checks pass),
`NOT_GOVERNED` (any check fails), or `INSUFFICIENT_EVIDENCE` (nothing
fails but evidence is missing), across six sections: justification,
verified_sources, pinning, audit_and_updates, licences, sbom.

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
