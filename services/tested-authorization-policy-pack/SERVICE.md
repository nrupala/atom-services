# Tested authorization policy pack — `tested-authorization-policy-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Write and ship authorization policy as code — OPA/Rego-class rules, tests, decision logs, safe rollout.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Access policy for agents and products**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the tested-policy-pack manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_READY`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `pack` (string; carried into the verdict output, not itself checked) | — |
| `decision_model.decisions_enumerated` | decision_model |
| `decision_model.input_schema_defined` | decision_model |
| `decision_model.default_deny` | decision_model |
| `policies[]` (list of policy entries, see below) | decision_model, policy_code, testing |
| `policy_code.rules_small_and_composable` | policy_code |
| `policy_code.data_separated_from_logic` | policy_code |
| `policy_code.policy_data_versioned` | policy_code |
| `policy_code.decision_explanations_available` | policy_code |
| `tests[]` (list of test entries, see below) | testing |
| `testing.tests_green` | testing |
| `testing.lint_format_clean` | testing |
| `testing.key_roles_coverage_declared` | testing |
| `rollout.shadow_completed` | rollout |
| `rollout.staged_before_production` | rollout |
| `rollout.break_glass_documented_gated_audited` | rollout |
| `rollout.break_glass_tested` | rollout |
| `rollout.silent_policy_edits` (must be `false` to pass) | rollout |
| `decision_logs.record_who_decision_version_reason` | decision_logs |
| `decision_logs.retained_immutably` | decision_logs |
| `decision_logs.full_in_sensitive_flows` | decision_logs |
| `governance.second_pair_of_eyes_on_prs` | governance_and_enforcement |
| `governance.version_and_changelog` | governance_and_enforcement |
| `governance.human_summary_in_sync_with_code` | governance_and_enforcement |
| `enforcement.points_inventoried` | governance_and_enforcement |
| `enforcement.failure_mode_chosen_per_surface` | governance_and_enforcement |
| `enforcement.sensitive_surfaces_fail_closed` | governance_and_enforcement |
| `enforcement.bypass_paths_present` (must be `false` to pass — skill red line) | governance_and_enforcement |

Each `policies[]` entry is `{id, default}` — `id` a non-empty string,
`default` the policy's declared default effect. Each `tests[]` entry
is `{policy_id, kind}` with `kind` one of `"positive"`, `"negative"`,
`"edge"`. Three checks are computed from the declared entries, using
only relationships the skill itself states: every declared policy
must default to `"deny"` (method 1: default deny; red line: no
default-allow — offending policy ids are named); every declared
policy must be covered by at least one declared test (red line: no
untested policy to production — untested policy ids are named in the
evidence and in `untested_policy_ids`); every declared policy must
have a declared positive, negative and edge test (method 3: unit
tests per rule — positive, negative, edge cases). No outside
standard or threshold is imported — the skill states no numeric
coverage threshold, so none is invented.

The output also reports `coverage_status`
(`complete_on_declared_tests` / `incomplete_on_declared_tests` /
null when the computed checks cannot run), `policy_count`,
`tested_policy_count`, `test_count`, and `test_coverage_ratio` (the
tested-policy share). **Fixed serialization rule:** the ratio is
reported as a string with exactly four decimal places, produced in
both implementations by the same rule — round half up to 4dp,
`floor(v * 10000 + 0.5) / 10000`, then format with exactly four
decimals. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The verdict is one of `READY` (all 29 checks pass), `NOT_READY`
(any check fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across six sections: decision_model,
policy_code, testing, rollout, decision_logs,
governance_and_enforcement.

## Honest scoping

This atom checks **declared** evidence about a policy pack — it does
not parse or execute Rego/Cedar, run the caller's tests, read real
decision logs, or verify that a declared value is true. Readiness is
readiness *on the caller's declared evidence*: a pack whose tests
are declared green passes that check even if the tests would fail
when actually run. Named exclusions: no policy-language linting or
evaluation (the skill names `opa fmt`/`check` as the caller's CI
step; this atom checks only that it is declared clean); no coverage
percentage threshold (the skill requires tests per rule and
decision-space coverage for key roles, never a number); no live
shadow-mode observation, log inspection, or enforcement-point
probing (all checked as declared records only); the authoring of
policy code itself is generative work and is not performed here —
this atom audits a declared pack, it does not write one. Adjacent
atoms own neighbouring check sets: `defined-flow-auditor` audits
zero-trust flow properties of a running system, and
`correctness-verification-certificate` audits declared correctness
evidence for software claims; neither is duplicated here.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
