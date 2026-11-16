# Agent safety guardrail audit — `agent-safety-guardrail-audit`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Guard the agents — injection defense, tool least-privilege, approvals, sandboxes, kill switches.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in How Milo works who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Agent autonomy safety reviews**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Inputs — the agent-safety evidence manifest

| Field | Read by |
|---|---|
| `system`, `version` | output (echoed in the audit; not a check) |
| `guardrails_disabled` (must be `false`) | approval_gates |
| `injection_defense.external_content_treated_as_data` | injection_defense |
| `injection_defense.suspicious_imperatives_flagged` | injection_defense |
| `injection_defense.test_suite.present`, `injection_defense.test_suite.passing` | injection_defense |
| `tool_access.scoped_to_job` | tool_least_privilege |
| `tool_access.read_write_separated` | tool_least_privilege |
| `tool_access.destructive_tools_gated` | tool_least_privilege |
| `tool_access.shell_access`, `tool_access.shell_sandboxed` (sandboxed required when shell access is present) | tool_least_privilege |
| `approvals.destructive_actions_require_approval` | approval_gates |
| `approvals.verified` | approval_gates |
| `approvals.covered_actions` (list; must include `deploys`, `payments`, `deletions`, `external_sends`, `credential_changes`) | approval_gates |
| `approvals.bypassable_by_agent` (must be `false`) | approval_gates |
| `sandbox.enabled` | sandboxing |
| `sandbox.filesystem_scope_minimal` | sandboxing |
| `sandbox.egress_restricted` | sandboxing |
| `sandbox.resource_caps_enforced` | sandboxing |
| `sandbox.abuse_test_passed` | sandboxing |
| `budgets.caps_set` | budgets_and_circuit_breakers |
| `budgets.alert_before_cap` | budgets_and_circuit_breakers |
| `circuit_breakers.loop_detection_enabled` | budgets_and_circuit_breakers |
| `kill_switch.present`, `kill_switch.tested` | budgets_and_circuit_breakers |
| `output_validation.schema_checked` | output_validation |
| `output_validation.model_output_evaled` (must be `false`) | output_validation |
| `output_validation.downstream_parameterized` | output_validation |
| `secrets.values_in_context` (must be `false`) | secrets_hygiene |
| `secrets.pii_in_context` (must be `false`) | secrets_hygiene |
| `secrets.credential_handles_only` | secrets_hygiene |
| `secrets.exfiltration_paths_tested` | secrets_hygiene |
| `red_team.injection_suite_run` | red_teaming |
| `red_team.jailbreak_tested` | red_teaming |
| `red_team.canary_tokens_used` | red_teaming |
| `red_team.findings_become_regression_tests` | red_teaming |

A field **absent** = evidence missing (`INSUFFICIENT_EVIDENCE` if nothing
fails). A field present but false / invalid = the check fails
(`NOT_GUARDED`). All checks pass = `GUARDED`. 34 checks across eight
sections: injection_defense, tool_least_privilege, approval_gates,
sandboxing, budgets_and_circuit_breakers, output_validation,
secrets_hygiene, red_teaming.

## Named doubt (from the register)

Audit scope must stay advisory
