# Correctness verification certificate — `correctness-verification-certificate`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Verify and certify software correctness - specs, model checking, deductive proofs, certificates, honest scope.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product correctness claim checks**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the correctness-verification evidence manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_CERTIFIED`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `component` (string; carried into the verdict output, not itself checked) | — |
| `register.exists` | claims_register |
| `register.property_named` | claims_register |
| `register.scope_named` | claims_register |
| `register.evidence_level_assigned` | claims_register |
| `register.expiry_set` | claims_register |
| `ladder.cheapest_sufficient_level_selected` | evidence_ladder |
| `ladder.claim_exceeds_evidence_level` (must be `false` to pass) | evidence_ladder |
| `ladder.tests_presented_as_proof` (must be `false` to pass) | evidence_ladder |
| `specs.invariants_written` | specs_before_tools |
| `specs.pre_post_conditions_written` | specs_before_tools |
| `specs.liveness_properties_written` | specs_before_tools |
| `specs.written_before_tools_run` | specs_before_tools |
| `artifacts.machine_checkable_per_claim` | evidence_artifacts |
| `artifacts.proof_scripts_or_solver_logs_retained` | evidence_artifacts |
| `artifacts.counterexample_suppressed` (must be `false` to pass) | evidence_artifacts |
| `artifacts.reproduction_recipe_present` | evidence_artifacts |
| `scope.exclusions_written` | scope_honesty |
| `scope.claims_versioned` | scope_honesty |
| `scope.reverification_triggers_defined` | scope_honesty |
| `scope.verified_at_current_version` | scope_honesty |
| `ci.verification_in_pipeline` | ci_integration |
| `ci.broken_proof_fails_build` | ci_integration |
| `review.independent_review_done` | adversarial_and_certification |
| `review.counterexample_found` (gates the disclosure check below) | adversarial_and_certification |
| `review.counterexample_disclosed` (required when a counterexample was found; otherwise the check passes as not applicable) | adversarial_and_certification |
| `certificate.signed_attestation_binds_claim_artifact_commit` | adversarial_and_certification |
| `certificate.independently_reproducible` | adversarial_and_certification |

The verdict is one of `CERTIFIED` (all 26 checks pass),
`NOT_CERTIFIED` (any check fails — one failure breaks the claim), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across seven sections: claims_register, evidence_ladder,
specs_before_tools, evidence_artifacts, scope_honesty,
ci_integration, adversarial_and_certification.

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
