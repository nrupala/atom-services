# Agent interoperability design — `agent-interoperability-design`

**Display name:** Agent interoperability design · **Slug:** `agent-interoperability-design` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "agent-interoperability-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the interoperability design manifest.** Fill every group in the [Input reference](#input-reference): the identifier field `design` plus one object per section. Declare values truthfully — the atom judges declared evidence (see Explanation). The recorded run's manifest is example 1 below.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/agent-interoperability-design` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `DESIGN_SOUND` — 36 pass, 0 fail, 0 missing of 36 checks across eight sections. The single declared integration pairs counterparty `agent_to_agent` with protocol `acp_rest` — the skill's protocol for that class — so both computed protocol checks pass and `protocol_status` reports `sound_on_declared_evidence` with `integration_count` 1. Remote/untrusted agents are declared absent (`gateway.remote_or_untrusted_agents_present: false`), so the five gated gateway checks pass as not applicable.
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "agent-interoperability-design"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/agent-interoperability-design` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/agent-interoperability-design` with the same `Authorization: Bearer <key>` header and call the tool `agent_interoperability_design` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `DESIGN_NOT_SOUND` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples), eight checks fail — including `protocols_match_counterparty_per_skill` (declared protocol does not match the skill's protocol for its counterparty), `no_business_logic_per_protocol`, the four broker checks and `no_direct_doors_to_remote_agents`, and `no_shared_forever_keys`. Fix = re-pair each integration with the skill's protocol for its counterparty class, put a single authenticated, audited, rate-limited broker in front of remote agents with no direct doors, replace shared forever keys with per-agent credentials — then declare the true values and resubmit. That run also left 23 checks `missing`; supply the omitted sections (handoff, discovery, audit, testing, red_lines were absent) as well.
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `integrations` with detail "integrations must be a list" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/agent-interoperability-design` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/agent-interoperability-design` — tool name `agent_interoperability_design`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks. Types are from SERVICE.md's field table (all fields are booleans unless noted), corroborated by contract.yaml and the recorded evidence input schema. An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `design` | string | — | string; carried into the verdict output, not itself checked |
| `integrations` | array | protocol_selection | list of objects, see below |
| `integrations[].counterparty_type` | string | protocol_selection | string; one of `tools_for_models`, `editor_agent_session`, `agent_to_agent`, `human_or_script` — computed, see below |
| `integrations[].protocol` | string | protocol_selection | string; one of `mcp`, `acp_stdio`, `acp_rest`, `a2a`, `rest_cli_web` — computed, see below |
| `integrations[].rationale_documented` | boolean | protocol_selection |  |
| `architecture.single_core` | boolean | bridge_architecture |  |
| `architecture.protocol_adapters` | boolean | bridge_architecture |  |
| `architecture.business_logic_per_protocol` | boolean | bridge_architecture | must be `false` to pass — "never implement business logic per protocol" |
| `gateway.remote_or_untrusted_agents_present` | boolean | gateway_and_remote_access | gates the five gateway checks below |
| `gateway.single_authenticated_broker` | boolean | gateway_and_remote_access | required when remote/untrusted agents are present; otherwise the check passes as not applicable |
| `gateway.broker_authenticated` | boolean | gateway_and_remote_access | required when remote/untrusted agents are present; otherwise not applicable |
| `gateway.broker_audited` | boolean | gateway_and_remote_access | required when remote/untrusted agents are present; otherwise not applicable |
| `gateway.broker_rate_limited` | boolean | gateway_and_remote_access | required when remote/untrusted agents are present; otherwise not applicable |
| `gateway.direct_doors_to_remote_agents` | boolean | gateway_and_remote_access | must be `false` to pass when remote/untrusted agents are present; otherwise not applicable |
| `handoff.contracts_used_for_non_trivial_coordination` | boolean | handoff_contracts |  |
| `handoff.contract_states_goal` | boolean | handoff_contracts |  |
| `handoff.contract_states_constraints` | boolean | handoff_contracts |  |
| `handoff.contract_states_acceptance_criteria` | boolean | handoff_contracts |  |
| `handoff.contract_states_report_back_location` | boolean | handoff_contracts |  |
| `identity.each_agent_own_credential` | boolean | identity_and_credentials |  |
| `identity.credentials_least_privilege` | boolean | identity_and_credentials |  |
| `identity.credentials_short_lived` | boolean | identity_and_credentials |  |
| `identity.credentials_revocable` | boolean | identity_and_credentials |  |
| `identity.shared_forever_keys_present` | boolean | identity_and_credentials | must be `false` to pass — no shared "service-to-service forever" keys |
| `discovery.capabilities_published` | boolean | versioning_and_discovery |  |
| `discovery.version_published` | boolean | versioning_and_discovery |  |
| `discovery.negotiation_supported` | boolean | versioning_and_discovery |  |
| `discovery.graceful_degradation_declared` | boolean | versioning_and_discovery |  |
| `audit.message_log_kept` | boolean | audit_and_provenance |  |
| `audit.log_records_who_asked` | boolean | audit_and_provenance |  |
| `audit.log_records_what_ran` | boolean | audit_and_provenance |  |
| `audit.log_records_what_changed` | boolean | audit_and_provenance |  |
| `testing.handshake_tests_exist` | boolean | handshake_testing_and_red_lines |  |
| `testing.handshake_tests_pass` | boolean | handshake_testing_and_red_lines |  |
| `testing.handshake_tests_both_directions` | boolean | handshake_testing_and_red_lines |  |
| `testing.handshake_tests_per_protocol` | boolean | handshake_testing_and_red_lines |  |
| `red_lines.unsandboxed_third_party_agents_present` | boolean | handshake_testing_and_red_lines | must be `false` to pass — skill red line |
| `red_lines.secrets_or_private_data_in_messages_by_default` | boolean | handshake_testing_and_red_lines | must be `false` to pass — skill red line |

### Checks

All 36 checks, exactly as named in the recorded full-pass REST response, grouped by section/bar. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence (a gated check whose gate is closed also reports `pass`, as not applicable); `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. There is no separate not-applicable status value in the output.

#### Section: `protocol_selection` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `integrations_declared` | the design declares its integrations — protocol choice is made per integration, by counterparty |
| `counterparty_types_in_skill_vocabulary` | Method step 1 names four counterparty classes: tools/resources for models, editor <-> agent sessions, agent <-> agent runs/services, humans/scripts/anything |
| `protocols_match_counterparty_per_skill` | Method step 1: tools/resources for models -> MCP; editor <-> agent sessions -> ACP (stdio); agent <-> agent runs/services -> ACP (REST) or A2A; humans, scripts, anything -> REST/CLI/web |
| `protocol_choice_documented_with_why_per_integration` | quality gate: protocol choice documented per integration + why |
#### Section: `bridge_architecture` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `single_core_declared` | bridge, don't fork: one core, many protocol adapters (the multi-surface pattern) |
| `protocol_adapters_declared` | bridge, don't fork: many protocol adapters over the one core |
| `no_business_logic_per_protocol` | never implement business logic per protocol |
#### Section: `gateway_and_remote_access` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `single_authenticated_broker_in_front` | no remote or untrusted agents declared — the gateway pattern is not applicable |
| `broker_authenticated` | no remote or untrusted agents declared — the gateway pattern is not applicable |
| `broker_audited` | no remote or untrusted agents declared — the gateway pattern is not applicable |
| `broker_rate_limited` | no remote or untrusted agents declared — the gateway pattern is not applicable |
| `no_direct_doors_to_remote_agents` | no remote or untrusted agents declared — the gateway pattern is not applicable |
#### Section: `handoff_contracts` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `contracts_used_for_non_trivial_coordination` | quality gate: handoff contracts used for non-trivial coordination |
| `contract_states_goal` | every cross-agent message states the goal |
| `contract_states_constraints` | every cross-agent message states the constraints |
| `contract_states_acceptance_criteria` | every cross-agent message states the acceptance criteria |
| `contract_states_report_back_location` | every cross-agent message states the report-back location |
#### Section: `identity_and_credentials` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `each_agent_has_own_credential` | identity between agents: each agent has its own credential |
| `credentials_least_privilege` | identity between agents: least privilege — credentials are scoped |
| `credentials_short_lived` | identity between agents: credentials are short-lived |
| `credentials_revocable` | identity between agents: credentials are revocable (quality gate: scoped + revocable) |
| `no_shared_forever_keys` | no shared 'service-to-service forever' keys |
#### Section: `versioning_and_discovery` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `capabilities_published` | versioning + discovery: publish capabilities (tools list, agent card, version) |
| `version_published` | versioning + discovery: the version is published with the capabilities |
| `negotiation_supported` | versioning + discovery: negotiate with the counterparty |
| `graceful_degradation_declared` | degrade gracefully when the counterparty is older/newer |
#### Section: `audit_and_provenance` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `message_log_kept` | audit everything: a message log is kept — history is the dispute resolver |
| `log_records_who_asked` | provenance: the log records who asked |
| `log_records_what_ran` | provenance: the log records what ran |
| `log_records_what_changed` | provenance: the log records what changed |
#### Section: `handshake_testing_and_red_lines` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `handshake_tests_exist` | test the handshake: scripted counterparty tests per protocol — not just 'it worked once in the demo' (quality gate: handshake test exists) |
| `handshake_tests_pass` | quality gate: the handshake test passes |
| `handshake_tests_both_directions` | quality gate: the handshake test passes in both directions |
| `handshake_tests_per_protocol` | test the handshake: scripted counterparty tests exist per protocol |
| `no_unsandboxed_third_party_agents` | red line: no unsandboxed third-party agents hitting your systems |
| `no_secrets_or_private_data_in_messages_by_default` | red line: no secrets or private data in agent-to-agent messages by default |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug.
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `design` — The caller's identifier value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 36 per-check results: `section`, `check`, `status`, `evidence`.
- `protocol_status` — `sound_on_declared_evidence` when both computed protocol checks (vocabulary + counterparty match) complete and pass; `not_sound_on_declared_evidence` when either completes and fails; `null` when either computed check cannot be completed.
- `integration_count` — The number of declared integrations (integer); `null` when no integration list is declared.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, identifier, verdict, per-section statuses, summary) for logs and tickets.

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `DESIGN_SOUND` — All 36 checks pass.
- `DESIGN_NOT_SOUND` — At least one check fails.
- `INSUFFICIENT_EVIDENCE` — Nothing fails, but at least one check is `missing` — evidence was not declared.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks. Gated/not-applicable checks report `pass` when their gate is closed; there is no distinct not-applicable value.

**Computed fields:**

- `protocol_status` — `sound_on_declared_evidence` when both computed protocol checks (vocabulary + counterparty match) complete and pass; `not_sound_on_declared_evidence` when either completes and fails; `null` when either computed check cannot be completed.
- `integration_count` — The number of declared integrations (integer); `null` when no integration list is declared.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key. No verdict is produced.
- **403** — the key lacks this atom's scope. Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "integrations", "detail": "integrations must be a list"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); prices are set only from measured production cost per unit.

## Explanation

The atom judges a declared agent-interoperability design across eight sections. Protocol selection is computed, using only the skill's own mapping — 'pick by counterparty, not fashion': tools/resources for models → MCP (`mcp`); editor ↔ agent sessions → ACP over stdio (`acp_stdio`); agent ↔ agent runs/services → ACP over REST (`acp_rest`) or A2A (`a2a`); humans, scripts, anything → REST/CLI/web (`rest_cli_web`). A `counterparty_type` outside the skill's four classes fails the vocabulary check; a `protocol` that is not the skill's protocol for its counterparty fails the match check; a missing value on any integration is missing evidence, not a failure. `gateway.remote_or_untrusted_agents_present` gates the five gateway checks (single authenticated broker, broker authenticated/audited/rate-limited, no direct doors).

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is the not-passing verdict). Any single `fail` decides the verdict immediately in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns the passing verdict. Where a check is gated, a closed gate makes it pass as not applicable rather than missing: the gate field itself carries the evidence that the check does not apply.

**What it does NOT do.** It evaluates **declared** evidence only — it does not connect to any agent, speak any protocol, run a handshake test, inspect credentials or traffic, or verify that a declared value is true. It is a design verdict over a manifest, **not** a live interoperability test or a security audit. Named exclusions: no check of *how* a protocol adapter, broker, or sandbox is implemented; no credential lifetime, rate-limit, or audit-retention thresholds (the skill states none); no judgment of whether MCP, ACP, or A2A is the 'best' protocol beyond the skill's own counterparty mapping; no live verification of any declared fact.

**Buyer / use context.** Teams and agents connecting agents across protocols who need a deterministic design verdict before building the bridges — the house's own workflow is connecting agents across protocols. One unit of sale = one delivered result. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/agent_interoperability_design.py` — `evaluate(manifest) -> verdict dict`; tests: tests/test_agent_interoperability_design.py — 32 tests, all passing 2026-11-15). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/agent-interoperability-design` and MCP `POST /mcp/agent-interoperability-design` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-15T23:59:26.168368+00:00 against gateway v1.1.0, external verification lane, source `verification/work/agent-interoperability-design/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

```json
{
  "design": "Standard A2A bridge",
  "integrations": [
    {
      "counterparty_type": "agent_to_agent",
      "protocol": "acp_rest",
      "rationale_documented": true
    }
  ],
  "architecture": {
    "single_core": true,
    "protocol_adapters": true,
    "business_logic_per_protocol": false
  },
  "gateway": {
    "remote_or_untrusted_agents_present": false
  },
  "handoff": {
    "contracts_used_for_non_trivial_coordination": true,
    "contract_states_goal": true,
    "contract_states_constraints": true,
    "contract_states_acceptance_criteria": true,
    "contract_states_report_back_location": true
  },
  "identity": {
    "each_agent_own_credential": true,
    "credentials_least_privilege": true,
    "credentials_short_lived": true,
    "credentials_revocable": true,
    "shared_forever_keys_present": false
  },
  "discovery": {
    "capabilities_published": true,
    "version_published": true,
    "negotiation_supported": true,
    "graceful_degradation_declared": true
  },
  "audit": {
    "message_log_kept": true,
    "log_records_who_asked": true,
    "log_records_what_ran": true,
    "log_records_what_changed": true
  },
  "testing": {
    "handshake_tests_exist": true,
    "handshake_tests_pass": true,
    "handshake_tests_both_directions": true,
    "handshake_tests_per_protocol": true
  },
  "red_lines": {
    "unsandboxed_third_party_agents_present": false,
    "secrets_or_private_data_in_messages_by_default": false
  }
}
```

Response (`response_text`):

```json
{
  "service": "agent-interoperability-design",
  "atom_version": "0.1.0",
  "design": "Standard A2A bridge",
  "verdict": "DESIGN_SOUND",
  "sections": {
    "protocol_selection": "pass",
    "bridge_architecture": "pass",
    "gateway_and_remote_access": "pass",
    "handoff_contracts": "pass",
    "identity_and_credentials": "pass",
    "versioning_and_discovery": "pass",
    "audit_and_provenance": "pass",
    "handshake_testing_and_red_lines": "pass"
  },
  "checks": [
    {
      "section": "protocol_selection",
      "check": "integrations_declared",
      "status": "pass",
      "evidence": "the design declares its integrations \u2014 protocol choice is made per integration, by counterparty"
    },
    {
      "section": "protocol_selection",
      "check": "counterparty_types_in_skill_vocabulary",
      "status": "pass",
      "evidence": "Method step 1 names four counterparty classes: tools/resources for models, editor <-> agent sessions, agent <-> agent runs/services, humans/scripts/anything"
    },
    {
      "section": "protocol_selection",
      "check": "protocols_match_counterparty_per_skill",
      "status": "pass",
      "evidence": "Method step 1: tools/resources for models -> MCP; editor <-> agent sessions -> ACP (stdio); agent <-> agent runs/services -> ACP (REST) or A2A; humans, scripts, anything -> REST/CLI/web"
    },
    {
      "section": "protocol_selection",
      "check": "protocol_choice_documented_with_why_per_integration",
      "status": "pass",
      "evidence": "quality gate: protocol choice documented per integration + why"
    },
    {
      "section": "bridge_architecture",
      "check": "single_core_declared",
      "status": "pass",
      "evidence": "bridge, don't fork: one core, many protocol adapters (the multi-surface pattern)"
    },
    {
      "section": "bridge_architecture",
      "check": "protocol_adapters_declared",
      "status": "pass",
      "evidence": "bridge, don't fork: many protocol adapters over the one core"
    },
    {
      "section": "bridge_architecture",
      "check": "no_business_logic_per_protocol",
      "status": "pass",
      "evidence": "never implement business logic per protocol"
    },
    {
      "section": "gateway_and_remote_access",
      "check": "single_authenticated_broker_in_front",
      "status": "pass",
      "evidence": "no remote or untrusted agents declared \u2014 the gateway pattern is not applicable"
    },
    {
      "section": "gateway_and_remote_access",
      "check": "broker_authenticated",
      "status": "pass",
      "evidence": "no remote or untrusted agents declared \u2014 the gateway pattern is not applicable"
    },
    {
      "section": "gateway_and_remote_access",
      "check": "broker_audited",
      "status": "pass",
      "evidence": "no remote or untrusted agents declared \u2014 the gateway pattern is not applicable"
    },
    {
      "section": "gateway_and_remote_access",
      "check": "broker_rate_limited",
      "status": "pass",
      "evidence": "no remote or untrusted agents declared \u2014 the gateway pattern is not applicable"
    },
    {
      "section": "gateway_and_remote_access",
      "check": "no_direct_doors_to_remote_agents",
      "status": "pass",
      "evidence": "no remote or untrusted agents declared \u2014 the gateway pattern is not applicable"
    },
    {
      "section": "handoff_contracts",
      "check": "contracts_used_for_non_trivial_coordination",
      "status": "pass",
      "evidence": "quality gate: handoff contracts used for non-trivial coordination"
    },
    {
      "section": "handoff_contracts",
      "check": "contract_states_goal",
      "status": "pass",
      "evidence": "every cross-agent message states the goal"
    },
    {
      "section": "handoff_contracts",
      "check": "contract_states_constraints",
      "status": "pass",
      "evidence": "every cross-agent message states the constraints"
    },
    {
      "section": "handoff_contracts",
      "check": "contract_states_acceptance_criteria",
      "status": "pass",
      "evidence": "every cross-agent message states the acceptance criteria"
    },
    {
      "section": "handoff_contracts",
      "check": "contract_states_report_back_location",
      "status": "pass",
      "evidence": "every cross-agent message states the report-back location"
    },
    {
      "section": "identity_and_credentials",
      "check": "each_agent_has_own_credential",
      "status": "pass",
      "evidence": "identity between agents: each agent has its own credential"
    },
    {
      "section": "identity_and_credentials",
      "check": "credentials_least_privilege",
      "status": "pass",
      "evidence": "identity between agents: least privilege \u2014 credentials are scoped"
    },
    {
      "section": "identity_and_credentials",
      "check": "credentials_short_lived",
      "status": "pass",
      "evidence": "identity between agents: credentials are short-lived"
    },
    {
      "section": "identity_and_credentials",
      "check": "credentials_revocable",
      "status": "pass",
      "evidence": "identity between agents: credentials are revocable (quality gate: scoped + revocable)"
    },
    {
      "section": "identity_and_credentials",
      "check": "no_shared_forever_keys",
      "status": "pass",
      "evidence": "no shared 'service-to-service forever' keys"
    },
    {
      "section": "versioning_and_discovery",
      "check": "capabilities_published",
      "status": "pass",
      "evidence": "versioning + discovery: publish capabilities (tools list, agent card, version)"
    },
    {
      "section": "versioning_and_discovery",
      "check": "version_published",
      "status": "pass",
      "evidence": "versioning + discovery: the version is published with the capabilities"
    },
    {
      "section": "versioning_and_discovery",
      "check": "negotiation_supported",
      "status": "pass",
      "evidence": "versioning + discovery: negotiate with the counterparty"
    },
    {
      "section": "versioning_and_discovery",
      "check": "graceful_degradation_declared",
      "status": "pass",
      "evidence": "degrade gracefully when the counterparty is older/newer"
    },
    {
      "section": "audit_and_provenance",
      "check": "message_log_kept",
      "status": "pass",
      "evidence": "audit everything: a message log is kept \u2014 history is the dispute resolver"
    },
    {
      "section": "audit_and_provenance",
      "check": "log_records_who_asked",
      "status": "pass",
      "evidence": "provenance: the log records who asked"
    },
    {
      "section": "audit_and_provenance",
      "check": "log_records_what_ran",
      "status": "pass",
      "evidence": "provenance: the log records what ran"
    },
    {
      "section": "audit_and_provenance",
      "check": "log_records_what_changed",
      "status": "pass",
      "evidence": "provenance: the log records what changed"
    },
    {
      "section": "handshake_testing_and_red_lines",
      "check": "handshake_tests_exist",
      "status": "pass",
      "evidence": "test the handshake: scripted counterparty tests per protocol \u2014 not just 'it worked once in the demo' (quality gate: handshake test exists)"
    },
    {
      "section": "handshake_testing_and_red_lines",
      "check": "handshake_tests_pass",
      "status": "pass",
      "evidence": "quality gate: the handshake test passes"
    },
    {
      "section": "handshake_testing_and_red_lines",
      "check": "handshake_tests_both_directions",
      "status": "pass",
      "evidence": "quality gate: the handshake test passes in both directions"
    },
    {
      "section": "handshake_testing_and_red_lines",
      "check": "handshake_tests_per_protocol",
      "status": "pass",
      "evidence": "test the handshake: scripted counterparty tests exist per protocol"
    },
    {
      "section": "handshake_testing_and_red_lines",
      "check": "no_unsandboxed_third_party_agents",
      "status": "pass",
      "evidence": "red line: no unsandboxed third-party agents hitting your systems"
    },
    {
      "section": "handshake_testing_and_red_lines",
      "check": "no_secrets_or_private_data_in_messages_by_default",
      "status": "pass",
      "evidence": "red line: no secrets or private data in agent-to-agent messages by default"
    }
  ],
  "protocol_status": "sound_on_declared_evidence",
  "integration_count": 1,
  "summary": "36 pass, 0 fail, 0 missing of 36 checks across eight sections.",
  "stamp": "AGENT INTEROPERABILITY DESIGN VERDICT\ndesign: Standard A2A bridge\nVERDICT: DESIGN_SOUND\n  protocol_selection               pass\n  bridge_architecture              pass\n  gateway_and_remote_access        pass\n  handoff_contracts                pass\n  identity_and_credentials         pass\n  versioning_and_discovery         pass\n  audit_and_provenance             pass\n  handshake_testing_and_red_lines  pass\n36 pass, 0 fail, 0 missing of 36 checks across eight sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "design": "Broken architecture",
  "integrations": [
    {
      "counterparty_type": "tools_for_models",
      "protocol": "acp_rest",
      "rationale_documented": true
    }
  ],
  "architecture": {
    "single_core": true,
    "protocol_adapters": true,
    "business_logic_per_protocol": true
  },
  "gateway": {
    "remote_or_untrusted_agents_present": true,
    "single_authenticated_broker": false,
    "broker_authenticated": false,
    "broker_audited": false,
    "broker_rate_limited": false,
    "direct_doors_to_remote_agents": true
  },
  "identity": {
    "shared_forever_keys_present": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "agent-interoperability-design",
  "atom_version": "0.1.0",
  "design": "Broken architecture",
  "verdict": "DESIGN_NOT_SOUND",
  "sections": {
    "protocol_selection": "fail",
    "bridge_architecture": "fail",
    "gateway_and_remote_access": "fail",
    "handoff_contracts": "insufficient_evidence",
    "identity_and_credentials": "fail",
    "versioning_and_discovery": "insufficient_evidence",
    "audit_and_provenance": "insufficient_evidence",
    "handshake_testing_and_red_lines": "insufficient_evidence"
  },
  "checks": [
    {
      "section": "protocol_selection",
      "check": "integrations_declared",
      "status": "pass",
      "evidence": "the design declares its integrations \u2014 protocol choice is made per integration, by counterparty"
    },
    {
      "section": "protocol_selection",
      "check": "counterparty_types_in_skill_vocabulary",
      "status": "pass",
      "evidence": "Method step 1 names four counterparty classes: tools/resources for models, editor <-> agent sessions, agent <-> agent runs/services, humans/scripts/anything"
    },
    {
      "section": "protocol_selection",
      "check": "protocols_match_counterparty_per_skill",
      "status": "fail",
      "evidence": "Method step 1: tools/resources for models -> MCP; editor <-> agent sessions -> ACP (stdio); agent <-> agent runs/services -> ACP (REST) or A2A; humans, scripts, anything -> REST/CLI/web"
    },
    {
      "section": "protocol_selection",
      "check": "protocol_choice_documented_with_why_per_integration",
      "status": "pass",
      "evidence": "quality gate: protocol choice documented per integration + why"
    },
    {
      "section": "bridge_architecture",
      "check": "single_core_declared",
      "status": "pass",
      "evidence": "bridge, don't fork: one core, many protocol adapters (the multi-surface pattern)"
    },
    {
      "section": "bridge_architecture",
      "check": "protocol_adapters_declared",
      "status": "pass",
      "evidence": "bridge, don't fork: many protocol adapters over the one core"
    },
    {
      "section": "bridge_architecture",
      "check": "no_business_logic_per_protocol",
      "status": "fail",
      "evidence": "never implement business logic per protocol"
    },
    {
      "section": "gateway_and_remote_access",
      "check": "single_authenticated_broker_in_front",
      "status": "fail",
      "evidence": "gateway pattern for remote/untrusted agents: a single authenticated broker in front of remote paths \u2014 not N direct doors"
    },
    {
      "section": "gateway_and_remote_access",
      "check": "broker_authenticated",
      "status": "fail",
      "evidence": "the broker is authenticated (mTLS/tokens)"
    },
    {
      "section": "gateway_and_remote_access",
      "check": "broker_audited",
      "status": "fail",
      "evidence": "the broker is audited"
    },
    {
      "section": "gateway_and_remote_access",
      "check": "broker_rate_limited",
      "status": "fail",
      "evidence": "the broker is rate-limited"
    },
    {
      "section": "gateway_and_remote_access",
      "check": "no_direct_doors_to_remote_agents",
      "status": "fail",
      "evidence": "gateway pattern: not N direct doors to remote agents"
    },
    {
      "section": "handoff_contracts",
      "check": "contracts_used_for_non_trivial_coordination",
      "status": "missing",
      "evidence": "quality gate: handoff contracts used for non-trivial coordination"
    },
    {
      "section": "handoff_contracts",
      "check": "contract_states_goal",
      "status": "missing",
      "evidence": "every cross-agent message states the goal"
    },
    {
      "section": "handoff_contracts",
      "check": "contract_states_constraints",
      "status": "missing",
      "evidence": "every cross-agent message states the constraints"
    },
    {
      "section": "handoff_contracts",
      "check": "contract_states_acceptance_criteria",
      "status": "missing",
      "evidence": "every cross-agent message states the acceptance criteria"
    },
    {
      "section": "handoff_contracts",
      "check": "contract_states_report_back_location",
      "status": "missing",
      "evidence": "every cross-agent message states the report-back location"
    },
    {
      "section": "identity_and_credentials",
      "check": "each_agent_has_own_credential",
      "status": "missing",
      "evidence": "identity between agents: each agent has its own credential"
    },
    {
      "section": "identity_and_credentials",
      "check": "credentials_least_privilege",
      "status": "missing",
      "evidence": "identity between agents: least privilege \u2014 credentials are scoped"
    },
    {
      "section": "identity_and_credentials",
      "check": "credentials_short_lived",
      "status": "missing",
      "evidence": "identity between agents: credentials are short-lived"
    },
    {
      "section": "identity_and_credentials",
      "check": "credentials_revocable",
      "status": "missing",
      "evidence": "identity between agents: credentials are revocable (quality gate: scoped + revocable)"
    },
    {
      "section": "identity_and_credentials",
      "check": "no_shared_forever_keys",
      "status": "fail",
      "evidence": "no shared 'service-to-service forever' keys"
    },
    {
      "section": "versioning_and_discovery",
      "check": "capabilities_published",
      "status": "missing",
      "evidence": "versioning + discovery: publish capabilities (tools list, agent card, version)"
    },
    {
      "section": "versioning_and_discovery",
      "check": "version_published",
      "status": "missing",
      "evidence": "versioning + discovery: the version is published with the capabilities"
    },
    {
      "section": "versioning_and_discovery",
      "check": "negotiation_supported",
      "status": "missing",
      "evidence": "versioning + discovery: negotiate with the counterparty"
    },
    {
      "section": "versioning_and_discovery",
      "check": "graceful_degradation_declared",
      "status": "missing",
      "evidence": "degrade gracefully when the counterparty is older/newer"
    },
    {
      "section": "audit_and_provenance",
      "check": "message_log_kept",
      "status": "missing",
      "evidence": "audit everything: a message log is kept \u2014 history is the dispute resolver"
    },
    {
      "section": "audit_and_provenance",
      "check": "log_records_who_asked",
      "status": "missing",
      "evidence": "provenance: the log records who asked"
    },
    {
      "section": "audit_and_provenance",
      "check": "log_records_what_ran",
      "status": "missing",
      "evidence": "provenance: the log records what ran"
    },
    {
      "section": "audit_and_provenance",
      "check": "log_records_what_changed",
      "status": "missing",
      "evidence": "provenance: the log records what changed"
    },
    {
      "section": "handshake_testing_and_red_lines",
      "check": "handshake_tests_exist",
      "status": "missing",
      "evidence": "test the handshake: scripted counterparty tests per protocol \u2014 not just 'it worked once in the demo' (quality gate: handshake test exists)"
    },
    {
      "section": "handshake_testing_and_red_lines",
      "check": "handshake_tests_pass",
      "status": "missing",
      "evidence": "quality gate: the handshake test passes"
    },
    {
      "section": "handshake_testing_and_red_lines",
      "check": "handshake_tests_both_directions",
      "status": "missing",
      "evidence": "quality gate: the handshake test passes in both directions"
    },
    {
      "section": "handshake_testing_and_red_lines",
      "check": "handshake_tests_per_protocol",
      "status": "missing",
      "evidence": "test the handshake: scripted counterparty tests exist per protocol"
    },
    {
      "section": "handshake_testing_and_red_lines",
      "check": "no_unsandboxed_third_party_agents",
      "status": "missing",
      "evidence": "red line: no unsandboxed third-party agents hitting your systems"
    },
    {
      "section": "handshake_testing_and_red_lines",
      "check": "no_secrets_or_private_data_in_messages_by_default",
      "status": "missing",
      "evidence": "red line: no secrets or private data in agent-to-agent messages by default"
    }
  ],
  "protocol_status": "not_sound_on_declared_evidence",
  "integration_count": 1,
  "summary": "5 pass, 8 fail, 23 missing of 36 checks across eight sections.",
  "stamp": "AGENT INTEROPERABILITY DESIGN VERDICT\ndesign: Broken architecture\nVERDICT: DESIGN_NOT_SOUND\n  protocol_selection               fail\n  bridge_architecture              fail\n  gateway_and_remote_access        fail\n  handoff_contracts                insufficient_evidence\n  identity_and_credentials         fail\n  versioning_and_discovery         insufficient_evidence\n  audit_and_provenance             insufficient_evidence\n  handshake_testing_and_red_lines  insufficient_evidence\n5 pass, 8 fail, 23 missing of 36 checks across eight sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "design": "Malformed input",
  "integrations": "not_a_list",
  "architecture": 123
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "integrations",
  "detail": "integrations must be a list"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 36 / 36 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses, and computed-field values listed |
| Input reference typed | Yes — 38 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom is an engineering/design review over declared evidence; its verdict is not itself compliance or audit evidence and its domain is not a regulated one (finance, security, licensing, privacy), so no regulator role view is included.
