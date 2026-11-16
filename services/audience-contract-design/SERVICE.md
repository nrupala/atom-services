# Audience contract design — `audience-contract-design`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Design for four user classes — humans, agents, hybrid systems, software — with progressive contracts.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product surface design audits**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the audience-contract manifest

The caller submits one JSON manifest: a declared audience-contract
design record for one artifact. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false = the check
fails (`AUDIENCE_CONTRACT_INCOMPLETE`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `artifact` (string; carried into the verdict output, not itself checked) | — |
| `classes.human_path_defined` | classes_and_paths |
| `classes.agent_path_defined` | classes_and_paths |
| `classes.system_path_defined` | classes_and_paths |
| `classes.software_path_defined` | classes_and_paths |
| `classes.single_class_only_shipment` (must be `false` to pass — skill red line) | classes_and_paths |
| `single_truth.canonical_source_declared` | single_truth |
| `single_truth.renderings_generated_not_maintained` | single_truth |
| `single_truth.truth_forked_per_class` (must be `false` to pass — skill red line) | single_truth |
| `progressive_formality.formality_progressive_declared` | progressive_formality_and_failure |
| `failure.human_failure_defined` | progressive_formality_and_failure |
| `failure.agent_failure_defined` | progressive_formality_and_failure |
| `failure.system_failure_defined` | progressive_formality_and_failure |
| `failure.software_failure_defined` | progressive_formality_and_failure |
| `authority.dangerous_actions_present` (gates the four lattice checks below) | authority_lattice |
| `authority.capability_required` (required when dangerous actions are present; otherwise the check passes as not applicable) | authority_lattice |
| `authority.human_approval_required` (required when dangerous actions are present; otherwise not applicable) | authority_lattice |
| `authority.software_determinism_required` (required when dangerous actions are present; otherwise not applicable) | authority_lattice |
| `authority.system_audit_required` (required when dangerous actions are present; otherwise not applicable) | authority_lattice |
| `authority.dangerous_path_skips_lattice` (must be `false` to pass — skill red line) | authority_lattice |
| `verification.agents_verified_by_software` | verification_by_class |
| `verification.humans_verified_by_evidence` | verification_by_class |
| `verification.software_verified_by_spec_tests` | verification_by_class |
| `verification.systems_verified_by_audit_trails` | verification_by_class |
| `identity.human_passkey_or_mfa` | identity_by_class |
| `identity.agent_scoped_short_lived_tokens` | identity_by_class |
| `identity.system_policy_engine` | identity_by_class |
| `identity.software_service_creds_or_mtls` | identity_by_class |

Two things are computed from the declared values, using only the
skill's own structure — no outside threshold is imported:

- **Classes with a path (count):** the skill names exactly four
  user classes (humans, agents, systems, software) and its first
  quality gate requires all four to have a named, working path.
  `classes_with_path_count` reports how many of the four declared
  path fields are `true` (null when none of the four is declared).
- **Authority lattice (conditional):** the skill's method step 5
  states dangerous actions need capability (agent) + approval
  (human) + determinism (software) + audit (system) — "Miss one →
  no action." Each lattice element is therefore required only when
  `authority.dangerous_actions_present` is declared `true`; when
  no dangerous actions are declared, each lattice check passes as
  not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the four class-path checks cannot be completed).

The verdict is one of `AUDIENCE_CONTRACT_COMPLETE` (all 26 checks
pass), `AUDIENCE_CONTRACT_INCOMPLETE` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: classes_and_paths, single_truth,
progressive_formality_and_failure, authority_lattice,
verification_by_class, identity_by_class.

## Honest scoping

This atom audits a **declared** audience-contract design record —
it does not design the interface, render any class's view, or
verify that a declared path actually works. A design is complete
*on the caller's declared evidence*: a manifest that declares four
paths, a canonical source, and a full lattice passes those checks
even if the underlying contracts were never built. It is a
completeness audit of the record the skill requires, **not a
usability or API review**: it never judges whether a class's path
is good, whether the renderings are faithful, or whether the
progressive formality is well judged — only that the record
contains what the skill's method, quality gates, and red lines
demand.

Named exclusions: no check of any rendering's content or fidelity
(the skill requires renderings be generated from one canonical
source, not that any particular rendering is correct, and states
no test for it, so none is invented); no per-class needs beyond
the skill's method step 1 descriptions; no live verification of
any declared path, identity mechanism, or audit trail.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
