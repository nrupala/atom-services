# Agent interoperability design — `agent-interoperability-design`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Work with all sorts of agents — MCP/ACP/A2A landscape, bridge patterns, handoff contracts, agent auth.

A caller submits a declared agent-interoperability design manifest and receives one deterministic verdict back: is this design sound *on its declared evidence*, judged against the bound skill's own method, quality gates, and red lines? One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in How Milo works who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Connecting agents across protocols**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the interoperability design manifest

The caller submits one JSON manifest: a declared design pack for one
agent-interoperability design. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`DESIGN_NOT_SOUND`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `design` (string; carried into the verdict output, not itself checked) | — |
| `integrations` (list of objects, see below) | protocol_selection |
| `integrations[].counterparty_type` (string; one of `tools_for_models`, `editor_agent_session`, `agent_to_agent`, `human_or_script` — computed, see below) | protocol_selection |
| `integrations[].protocol` (string; one of `mcp`, `acp_stdio`, `acp_rest`, `a2a`, `rest_cli_web` — computed, see below) | protocol_selection |
| `integrations[].rationale_documented` | protocol_selection |
| `architecture.single_core` | bridge_architecture |
| `architecture.protocol_adapters` | bridge_architecture |
| `architecture.business_logic_per_protocol` (must be `false` to pass — "never implement business logic per protocol") | bridge_architecture |
| `gateway.remote_or_untrusted_agents_present` (gates the five gateway checks below) | gateway_and_remote_access |
| `gateway.single_authenticated_broker` (required when remote/untrusted agents are present; otherwise the check passes as not applicable) | gateway_and_remote_access |
| `gateway.broker_authenticated` (required when remote/untrusted agents are present; otherwise not applicable) | gateway_and_remote_access |
| `gateway.broker_audited` (required when remote/untrusted agents are present; otherwise not applicable) | gateway_and_remote_access |
| `gateway.broker_rate_limited` (required when remote/untrusted agents are present; otherwise not applicable) | gateway_and_remote_access |
| `gateway.direct_doors_to_remote_agents` (must be `false` to pass when remote/untrusted agents are present; otherwise not applicable) | gateway_and_remote_access |
| `handoff.contracts_used_for_non_trivial_coordination` | handoff_contracts |
| `handoff.contract_states_goal` | handoff_contracts |
| `handoff.contract_states_constraints` | handoff_contracts |
| `handoff.contract_states_acceptance_criteria` | handoff_contracts |
| `handoff.contract_states_report_back_location` | handoff_contracts |
| `identity.each_agent_own_credential` | identity_and_credentials |
| `identity.credentials_least_privilege` | identity_and_credentials |
| `identity.credentials_short_lived` | identity_and_credentials |
| `identity.credentials_revocable` | identity_and_credentials |
| `identity.shared_forever_keys_present` (must be `false` to pass — no shared "service-to-service forever" keys) | identity_and_credentials |
| `discovery.capabilities_published` | versioning_and_discovery |
| `discovery.version_published` | versioning_and_discovery |
| `discovery.negotiation_supported` | versioning_and_discovery |
| `discovery.graceful_degradation_declared` | versioning_and_discovery |
| `audit.message_log_kept` | audit_and_provenance |
| `audit.log_records_who_asked` | audit_and_provenance |
| `audit.log_records_what_ran` | audit_and_provenance |
| `audit.log_records_what_changed` | audit_and_provenance |
| `testing.handshake_tests_exist` | handshake_testing_and_red_lines |
| `testing.handshake_tests_pass` | handshake_testing_and_red_lines |
| `testing.handshake_tests_both_directions` | handshake_testing_and_red_lines |
| `testing.handshake_tests_per_protocol` | handshake_testing_and_red_lines |
| `red_lines.unsandboxed_third_party_agents_present` (must be `false` to pass — skill red line) | handshake_testing_and_red_lines |
| `red_lines.secrets_or_private_data_in_messages_by_default` (must be `false` to pass — skill red line) | handshake_testing_and_red_lines |

One section is computed from the declared values, using only what
the skill itself states — no outside criterion is imported:

- **Protocol match (Method step 1, "pick by counterparty, not
  fashion"):** the skill assigns protocols by counterparty class —
  tools/resources for models → MCP (`"mcp"`); editor ↔ agent
  sessions → Agent Client Protocol over stdio (`"acp_stdio"`);
  agent ↔ agent runs / services → Agent Communication Protocol
  over REST (`"acp_rest"`) or A2A (`"a2a"`); humans, scripts,
  anything → REST/CLI/web (`"rest_cli_web"`). A declared
  `counterparty_type` outside the skill's four classes fails the
  vocabulary check; a declared `protocol` that is not the skill's
  protocol for its counterparty fails the match check. A missing
  `counterparty_type` or `protocol` on any integration is missing
  evidence, not a failure.

The output also reports the computed `protocol_status`
(`sound_on_declared_evidence` / `not_sound_on_declared_evidence`
/ null when either computed check cannot be completed) and
`integration_count` — the number of declared integrations (null
when no integration list is declared). Both are exact integers /
fixed strings in both implementations, so the Python and
TypeScript outputs are byte-identical.

The verdict is one of `DESIGN_SOUND` (all 36 checks pass),
`DESIGN_NOT_SOUND` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across eight sections:
protocol_selection, bridge_architecture, gateway_and_remote_access,
handoff_contracts, identity_and_credentials,
versioning_and_discovery, audit_and_provenance,
handshake_testing_and_red_lines.

## Honest scoping

This atom evaluates **declared** evidence about a design — it does
not connect to any agent, speak any protocol, run a handshake test,
inspect credentials or traffic, or verify that a declared value is
true. A design is sound *on the caller's declared evidence*: a
design that declares scoped, short-lived, revocable credentials
passes those checks even if the deployed agents share a forever
key. It is a design verdict over a manifest, **not** a live
interoperability test or a security audit.

Named exclusions: no check of *how* a protocol adapter, broker, or
sandbox is implemented (the skill names the patterns and their
properties, not implementations, so none are invented); no
credential lifetime, rate-limit, or audit-retention thresholds
(the skill states none, so none are checked — only that
credentials are declared short-lived and the broker declared
rate-limited); no judgment of whether MCP, ACP, or A2A is the
"best" protocol beyond the skill's own counterparty mapping; no
live verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python oracle
and TypeScript port built and parity-proven locally; no endpoint is
live. Release happens one by one, by the owner's GO, per the approved
queue.
