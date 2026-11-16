# ACP protocol integration review — `acp-protocol-integration-review`

**Deliverable type:** REVIEW. This atom sells the review it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Speak both ACPs — Agent Client Protocol sessions and Agent Communication Protocol runs, done right.

A caller submits the inputs the bound skill works on and receives one review back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in How Milo works who need this review on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Agent protocol integration builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the ACP integration manifest

The caller submits one JSON manifest: a declared review pack for one
ACP integration. Every field below is read by the named section's
checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`INTEGRATION_NOT_SOUND`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `implementation` (string; carried into the verdict output, not itself checked) | — |
| `protocol.flavor` (string; must be `"ACP-client"` or `"ACP-comm"` to pass — computed, see below) | disambiguation_and_scope |
| `protocol.disambiguated_naming` | disambiguation_and_scope |
| `protocol.spec_version_documented` | disambiguation_and_scope |
| `protocol.supported_subset_documented` | disambiguation_and_scope |
| `adapter.thin` | adapter_architecture |
| `adapter.single_core_protocol_at_edge` | adapter_architecture |
| `adapter.business_logic_in_wire_layer` (must be `false` to pass) | adapter_architecture |
| `surface.client_flow_complete` (required only when the flavour is `ACP-client`; otherwise the check passes as not applicable) | protocol_surface |
| `surface.client_permissions_handled` (required only when the flavour is `ACP-client`; otherwise not applicable) | protocol_surface |
| `surface.comm_endpoints_complete` (required only when the flavour is `ACP-comm`; otherwise not applicable) | protocol_surface |
| `surface.comm_message_parts_typed` (required only when the flavour is `ACP-comm`; otherwise not applicable) | protocol_surface |
| `lifecycle.unknown_sessions_or_runs_handled` | lifecycle_correctness |
| `lifecycle.cancels_handled` | lifecycle_correctness |
| `lifecycle.errors_handled` | lifecycle_correctness |
| `lifecycle.reconnects_handled` | lifecycle_correctness |
| `lifecycle.state_leaks_across_sessions` (must be `false` to pass) | lifecycle_correctness |
| `streaming.updates_ordered` | streaming_discipline |
| `streaming.chunk_sizes_bounded` | streaming_discipline |
| `streaming.backpressure_addressed` | streaming_discipline |
| `streaming.terminal_states_clear` | streaming_discipline |
| `security.remote_endpoints_present` (gates the authentication check below) | security |
| `security.remote_endpoints_authenticated` (required when remote endpoints are present — skill red line; otherwise the check passes as not applicable) | security |
| `security.inputs_validated` | security |
| `security.output_sizes_capped` | security |
| `security.tool_execution_sandboxed` | security |
| `honesty.unimplemented_modes_noted` | honesty_tests_and_upgrade_path |
| `honesty.unsupported_features_faked` (must be `false` to pass — skill red line) | honesty_tests_and_upgrade_path |
| `tests.scripted_client_handshake_covered` | honesty_tests_and_upgrade_path |
| `tests.lifecycle_happy_error_cancel_covered` | honesty_tests_and_upgrade_path |
| `tests.contract_tests_in_ci_per_protocol` | honesty_tests_and_upgrade_path |
| `upgrade.sdk_upgrade_path_documented` | honesty_tests_and_upgrade_path |
| `upgrade.adapter_tests_kept_for_sdk_swap` | honesty_tests_and_upgrade_path |

One check is computed from the declared values, using only the
skill's own vocabulary — no outside threshold is imported:

- **Flavour recognition:** the skill speaks exactly two ACPs and
  its quality gate requires disambiguated naming in docs/code
  ("ACP-client" vs "ACP-comm"). The declared `protocol.flavor`
  therefore passes only when it is exactly `"ACP-client"` (Agent
  Client Protocol: `initialize` → `session/new` → `session/prompt`
  with streamed `session/update` chunks; permissions; stdio
  JSON-RPC) or exactly `"ACP-comm"` (Agent Communication Protocol:
  REST — `GET /agents`, `POST /runs` (sync/async/stream),
  `GET /runs/:id`, cancel; message parts with content types). Any
  other declared value fails; a missing flavour is missing
  evidence. The output also reports the derived `flavor_status`
  (`acp_client` / `acp_comm` / `unrecognized` / null when no
  flavour is declared). The flavour also gates the
  protocol-surface checks: an ACP-client integration is checked on
  its client flow and permissions handling, an ACP-comm
  integration on its REST endpoints and typed message parts, and
  the other flavour's checks pass as not applicable.

Two skill statements are deliberately **not** turned into
arithmetic: the skill says chunk sizes are bounded and output
sizes are capped, but states no number for either, so both are
declared booleans — no bound or cap is invented here.

The verdict is one of `INTEGRATION_SOUND` (all 31 checks pass),
`INTEGRATION_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across seven sections: disambiguation_and_scope,
adapter_architecture, protocol_surface, lifecycle_correctness,
streaming_discipline, security, honesty_tests_and_upgrade_path.

## Honest scoping

This atom reviews **declared** evidence about an ACP integration —
it does not connect to, probe, or run the integration, speak
either protocol to it, execute its contract tests, or verify that
a declared value is true. An integration is sound *on the caller's
declared evidence*: an adapter that declares authenticated remote
endpoints and ordered, bounded streaming passes those checks even
if the running system does something else.

Named exclusions: no check of *which* spec version is documented
or *which* subset is supported, only that both are documented;
no numeric bound on chunk or output sizes (the skill states
none); no assessment of the business logic behind the adapter,
only that none is declared in the wire layer; no live verification
of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
