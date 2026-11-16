# Architecture decision record — `architecture-decision-record`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Make and record architecture decisions (ADRs) with interface contracts and honest trade-offs before code.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Architecture reviews before builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the architecture-decision manifest

The caller submits one JSON manifest: a declared ADR pack for one
architecture decision. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`ADR_NOT_COMPLETE`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `decision` (string; carried into the verdict output, not itself checked) | — |
| `nfrs.written` | nfrs_first |
| `nfrs.quantified_where_possible` | nfrs_first |
| `nfrs.agreed_before_design_freeze` | nfrs_first |
| `boundaries.contexts_drawn` | boundaries_and_contracts |
| `boundaries.core_kept_small` | boundaries_and_contracts |
| `boundaries.hidden_coupling_present` (must be `false` to pass — skill red line) | boundaries_and_contracts |
| `boundaries.backdoor_paths_present` (must be `false` to pass — skill red line) | boundaries_and_contracts |
| `contracts.interfaces_documented` | boundaries_and_contracts |
| `contracts.interfaces_versioned` | boundaries_and_contracts |
| `contracts.inputs_outputs_defined` | boundaries_and_contracts |
| `contracts.errors_defined` | boundaries_and_contracts |
| `contracts.defined_before_code` | boundaries_and_contracts |
| `options.alternatives` (list of `{name (string), serious, tradeoffs_stated}`; computed, see below) | options_and_tradeoffs |
| `options.prefers_boring_replaceable_tech` | options_and_tradeoffs |
| `adr.numbered` | adr_format |
| `adr.context_stated` | adr_format |
| `adr.decision_stated` | adr_format |
| `adr.consequences_positive_stated` | adr_format |
| `adr.consequences_negative_stated` | adr_format |
| `adr.consequences_risks_stated` | adr_format |
| `adr.status_stated` | adr_format |
| `adr.page_count` (number; must be ≤ 1 to pass — computed, see below) | adr_format |
| `reversibility.assessed` | reversibility_and_security |
| `reversibility.expensive_choices_isolated_behind_interfaces` | reversibility_and_security |
| `reversibility.irreversible_decisions_deferred` (must be `false` to pass — skill red line) | reversibility_and_security |
| `security.data_flows_mapped` | reversibility_and_security |
| `security.encryption_verification_addressed` | reversibility_and_security |
| `dependencies.new_dependency_introduced` (gates the reason check below) | lifecycle_and_dependencies |
| `dependencies.new_dependency_reason_stated` (required when a dependency is introduced; otherwise the check passes as not applicable) | lifecycle_and_dependencies |
| `supersession.has_superseded_adrs` (gates the link check below) | lifecycle_and_dependencies |
| `supersession.superseded_adrs_linked_to_replacements` (required when superseded ADRs exist; otherwise the check passes as not applicable) | lifecycle_and_dependencies |
| `supersession.superseded_silently_rewritten` (must be `false` to pass) | lifecycle_and_dependencies |

Three checks are computed from the declared alternatives list, and
one from the declared page count, using only what the skill itself
states — no outside threshold is imported:

- **Alternatives count:** the skill's method step 4 states "list
  2–3 real alternatives". The declared `options.alternatives` list
  therefore passes only when it holds between two and three entries
  inclusive; fewer or more fails. A missing or non-list value is
  missing evidence, not a failure; an empty list is present and
  fails.
- **Trade-offs per alternative:** the same step requires the
  alternatives be listed "with trade-offs" — every entry must
  declare `tradeoffs_stated: true`.
- **Serious alternative:** the skill's quality gate requires "at
  least one serious alternative considered per major decision" —
  at least one entry must declare `serious: true`.
- **One page max:** the skill's ADR format states "One page max."
  The declared `adr.page_count` passes at or below 1 and fails
  above it; equality passes, because the skill states a maximum,
  not a margin below it. An absent value is missing evidence,
  not a failure; a present value of the wrong type is rejected
  as invalid input.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when either
primary computed check — alternatives count, page limit — cannot
be completed), `alternatives_count` (the declared list length, or
null), and `page_count_over_limit` — the declared page count minus
the stated maximum of 1 (null when no numeric count is declared).
**Fixed serialization rule:** the excess is reported as a string
with exactly four decimal places, produced in both implementations
by the same rule — round half up to 4dp,
`floor(v * 10000 + 0.5) / 10000`, then format with exactly four
decimals; comparisons use the unrounded values. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The verdict is one of `ADR_COMPLETE` (all 32 checks pass),
`ADR_NOT_COMPLETE` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across six sections:
nfrs_first, boundaries_and_contracts, options_and_tradeoffs,
adr_format, reversibility_and_security,
lifecycle_and_dependencies.

## Honest scoping

This atom audits a **declared** ADR pack — it does not write the
ADR, choose the technology, read the repository, or verify that a
declared value is true. A record is complete *on the caller's
declared evidence*: a manifest that declares quantified NFRs,
versioned contracts, and three alternatives with trade-offs passes
those checks even if the underlying design work was never done. It
is a completeness audit of the record the skill requires, **not an
architecture review**: it never judges whether the decision itself
is wise, whether the chosen option is the right one, or whether the
stated trade-offs are accurate — only that the record contains
what the skill's method, quality gates, and red lines demand.

Named exclusions: no check of the ADR's prose (context quality,
consequence honesty, NFR realism are judgment, and the skill
states no vocabulary for grading them, so none is invented); no
status vocabulary is imposed (the skill requires a Status field
but names no allowed values, so only its presence is checked); no
verification that a numbered ADR file exists at
`docs/adr/NNNN-title.md`, only that numbering is declared; no
live verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
