# ACP protocol integration review — `acp-protocol-integration-review`

**Display name:** ACP protocol integration review · **Slug:** `acp-protocol-integration-review` · **Deliverable type:** REVIEW · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run; the verbatim request and response live under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "acp-protocol-integration-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
2. **Assemble the ACP integration manifest.** Fill every group in the [Input reference](#input-reference): the identifier field `implementation` plus one object per section. Declare values truthfully — the atom judges declared evidence (see Explanation). The recorded run's manifest is example 1 below.
3. **Call REST.** `POST https://atoms.pipavia.com/v1/acp-protocol-integration-review` with header `Authorization: Bearer <key>` and the manifest as the JSON body.
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `INTEGRATION_SOUND` — 31 pass, 0 fail, 0 missing of 31 checks across seven sections. The manifest declares flavour `ACP-client`, so the two ACP-client surface checks apply and the two ACP-comm surface checks pass as not applicable. Remote endpoints are declared present and authenticated, so the gated authentication check applies and passes.
5. **Act on it.** A passing verdict needs no action. For any other verdict, work through the `fail` and `missing` checks in the response (see *Read a failing verdict and fix the manifest* below) and resubmit — the atom is deterministic, so the same manifest always returns the same verdict.

## How-to guides

### Get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email; open the emailed sign-in link to mint your session.
2. `POST /v1/keys` with `{"atom": "acp-protocol-integration-review"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/acp-protocol-integration-review` with `Authorization: Bearer <key>` and the manifest JSON as the body. HTTP 200 returns the verdict object (see Output format); errors are covered below and in Reference.

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/acp-protocol-integration-review` with the same `Authorization: Bearer <key>` header and call the tool `acp_protocol_integration_review` with the manifest object as its arguments. The MCP `structuredContent` is deep-equal to the REST verdict object — the recorded battery verified REST/MCP parity on the full-pass case (see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

1. Look at `verdict`: `INTEGRATION_NOT_SOUND` means at least one check failed; `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. A section reports `fail` if any of its checks fail, else `insufficient_evidence` if any is `missing`, else `pass`.
2. Work the `checks` array: each entry names its `section`, the `check`, its `status` (`pass` / `fail` / `missing`) and an `evidence` line stating the requirement. Fix every `fail` by changing the underlying practice/design and declaring the true new value; fix every `missing` by supplying the field.
3. In the recorded violations run (Worked examples), `adapter.business_logic_in_wire_layer: true`, `lifecycle.state_leaks_across_sessions: true` and `honesty.unsupported_features_faked: true` fail `no_business_logic_in_wire_layer`, `no_state_leak_across_sessions` and `unsupported_features_not_faked`. Fix = declare the true state once the underlying defect is fixed: move business logic out of the wire layer, stop state leaking across sessions, and stop faking unsupported features — then resubmit.
4. Resubmit the corrected manifest. Determinism is verified in the recorded battery (the full-pass manifest submitted twice returned byte-identical responses), so a changed verdict reflects your changed manifest, not noise.

### Handle a 422 invalid_input

A type or shape error is rejected before evaluation with HTTP 422 and body `{"ok": false, "error": "invalid_input", "field": ..., "detail": ...}`. The recorded malformed case for this atom returned field `protocol.flavor` with detail "protocol.flavor must be a string" (verbatim in Worked examples, example 3). Fix the named field to the type given in the Input reference, then resubmit. Note the distinction: a *wrong-typed* value is a 422; a well-typed but false/invalid value is evaluated and fails its check; an *absent* field is not an error — it is scored `missing`.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/acp-protocol-integration-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/acp-protocol-integration-review` — tool name `acp_protocol_integration_review`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Gateway base: `https://atoms.pipavia.com` (recorded gateway version 1.1.0).

### Input reference

One JSON manifest per call. Every field below is read by the named section's checks. Types are from SERVICE.md's field table (all fields are booleans unless noted), corroborated by contract.yaml and the recorded evidence input schema. An **absent** field = evidence missing; a field **present but false / invalid** = the check fails. Gates and conditionals are preserved in the Notes column.

| Field | Type | Read by (section) | Notes |
|---|---|---|---|
| `implementation` | string | — | string; carried into the verdict output, not itself checked |
| `protocol.flavor` | string | disambiguation_and_scope | string; must be `"ACP-client"` or `"ACP-comm"` to pass — computed, see below |
| `protocol.disambiguated_naming` | boolean | disambiguation_and_scope |  |
| `protocol.spec_version_documented` | boolean | disambiguation_and_scope |  |
| `protocol.supported_subset_documented` | boolean | disambiguation_and_scope |  |
| `adapter.thin` | boolean | adapter_architecture |  |
| `adapter.single_core_protocol_at_edge` | boolean | adapter_architecture |  |
| `adapter.business_logic_in_wire_layer` | boolean | adapter_architecture | must be `false` to pass |
| `surface.client_flow_complete` | boolean | protocol_surface | required only when the flavour is `ACP-client`; otherwise the check passes as not applicable |
| `surface.client_permissions_handled` | boolean | protocol_surface | required only when the flavour is `ACP-client`; otherwise not applicable |
| `surface.comm_endpoints_complete` | boolean | protocol_surface | required only when the flavour is `ACP-comm`; otherwise not applicable |
| `surface.comm_message_parts_typed` | boolean | protocol_surface | required only when the flavour is `ACP-comm`; otherwise not applicable |
| `lifecycle.unknown_sessions_or_runs_handled` | boolean | lifecycle_correctness |  |
| `lifecycle.cancels_handled` | boolean | lifecycle_correctness |  |
| `lifecycle.errors_handled` | boolean | lifecycle_correctness |  |
| `lifecycle.reconnects_handled` | boolean | lifecycle_correctness |  |
| `lifecycle.state_leaks_across_sessions` | boolean | lifecycle_correctness | must be `false` to pass |
| `streaming.updates_ordered` | boolean | streaming_discipline |  |
| `streaming.chunk_sizes_bounded` | boolean | streaming_discipline |  |
| `streaming.backpressure_addressed` | boolean | streaming_discipline |  |
| `streaming.terminal_states_clear` | boolean | streaming_discipline |  |
| `security.remote_endpoints_present` | boolean | security | gates the authentication check below |
| `security.remote_endpoints_authenticated` | boolean | security | required when remote endpoints are present — skill red line; otherwise the check passes as not applicable |
| `security.inputs_validated` | boolean | security |  |
| `security.output_sizes_capped` | boolean | security |  |
| `security.tool_execution_sandboxed` | boolean | security |  |
| `honesty.unimplemented_modes_noted` | boolean | honesty_tests_and_upgrade_path |  |
| `honesty.unsupported_features_faked` | boolean | honesty_tests_and_upgrade_path | must be `false` to pass — skill red line |
| `tests.scripted_client_handshake_covered` | boolean | honesty_tests_and_upgrade_path |  |
| `tests.lifecycle_happy_error_cancel_covered` | boolean | honesty_tests_and_upgrade_path |  |
| `tests.contract_tests_in_ci_per_protocol` | boolean | honesty_tests_and_upgrade_path |  |
| `upgrade.sdk_upgrade_path_documented` | boolean | honesty_tests_and_upgrade_path |  |
| `upgrade.adapter_tests_kept_for_sdk_swap` | boolean | honesty_tests_and_upgrade_path |  |

### Checks

All 31 checks, exactly as named in the recorded full-pass REST response, grouped by section/bar. The *Requires* text is the recorded per-check `evidence` line — what the check requires to pass, on declared evidence.

Per-check statuses: `pass` — the requirement is met on the declared evidence (a gated check whose gate is closed also reports `pass`, as not applicable); `fail` — the field is present but false/invalid, or a computed condition is breached; `missing` — the field is absent, so there is no evidence to judge. There is no separate not-applicable status value in the output.

#### Section: `disambiguation_and_scope` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `disambiguated_naming_in_docs_and_code` | quality gate: disambiguated naming in docs/code ('ACP-client' vs 'ACP-comm') — always disambiguate which ACP is meant |
| `flavor_recognized` | the declared flavour is one of the skill's two ACPs: 'ACP-client' (Agent Client Protocol) or 'ACP-comm' (Agent Communication Protocol) |
| `spec_version_documented` | minimal-but-honest: label spec versions supported |
| `supported_subset_documented` | quality gate: spec version + supported subset documented |
#### Section: `adapter_architecture` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `adapter_thin` | protocol adapters stay thin: protocol sits at the edge |
| `single_core_protocol_at_edge` | one core, protocol sits at the edge ('agent-commands'-style mapping) |
| `no_business_logic_in_wire_layer` | no business logic in the wire layer |
#### Section: `protocol_surface` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `client_flow_complete_when_client_flavor` | ACP-client surface: initialize -> session/new -> session/prompt with streamed session/update chunks, over stdio JSON-RPC |
| `client_permissions_handled_when_client_flavor` | ACP-client surface: permissions are handled |
| `comm_endpoints_complete_when_comm_flavor` | not an ACP-comm integration |
| `comm_message_parts_typed_when_comm_flavor` | not an ACP-comm integration |
#### Section: `lifecycle_correctness` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `unknown_sessions_or_runs_handled` | lifecycle: handle unknown sessions/runs |
| `cancels_handled` | lifecycle: handle cancels |
| `errors_handled` | lifecycle: handle errors |
| `reconnects_handled` | lifecycle: handle reconnects |
| `no_state_leak_across_sessions` | lifecycle: never leak state across sessions |
#### Section: `streaming_discipline` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `updates_ordered` | streaming discipline: order updates |
| `chunk_sizes_bounded` | streaming discipline: bounded chunk sizes (the skill states bounded, and states no number — the bound is declared, not computed) |
| `backpressure_addressed` | streaming discipline: backpressure awareness |
| `terminal_states_clear` | streaming discipline: clear terminal states (stopReason / run status) |
#### Section: `security` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `remote_endpoints_authenticated_when_remote` | red line: no unauthenticated remote endpoints — remote ACP endpoints require auth (tokens/mTLS) |
| `inputs_validated` | security: validate all inputs (quality gate: remote endpoints authenticated; inputs validated) |
| `output_sizes_capped` | security: cap output sizes (the skill states a cap, and states no number — the cap is declared, not computed) |
| `prompt_triggered_tool_execution_sandboxed` | security: sandbox any tool execution triggered via prompts |
#### Section: `honesty_tests_and_upgrade_path` — recorded full-pass section status: `pass`

| Check | Requires (recorded evidence line) |
|---|---|
| `unimplemented_modes_noted` | minimal-but-honest: note unimplemented modes (e.g. stream) |
| `unsupported_features_not_faked` | red line: never fake compliance — no pretending unsupported features work |
| `scripted_client_handshake_covered` | contract tests: scripted client covering handshake |
| `lifecycle_happy_error_cancel_covered` | quality gate / contract tests: lifecycle tests — session/run happy + error + cancel |
| `contract_tests_in_ci_per_protocol` | contract tests: in CI, per protocol |
| `sdk_upgrade_path_documented` | production upgrade path: official SDKs when the surface grows |
| `adapter_tests_kept_for_sdk_swap` | production upgrade path: keep the adapter tests so swaps are safe |

### Output format

HTTP 200 returns one JSON object (REST body; the same object is the MCP `structuredContent`):

- `service` — The atom slug.
- `atom_version` — Atom version that produced the verdict (`0.1.0` in the recorded runs).
- `implementation` — The caller's identifier value, carried through from the manifest (not itself checked).
- `verdict` — The overall verdict — see Verdict vocabulary.
- `sections` — Per-section statuses keyed by section name — see Verdict vocabulary.
- `checks` — All 31 per-check results: `section`, `check`, `status`, `evidence`.
- `flavor_status` — `acp_client` when `protocol.flavor` is exactly `"ACP-client"`; `acp_comm` when exactly `"ACP-comm"`; `unrecognized` for any other declared value; `null` when no flavour is declared.
- `summary` — One-line counts, e.g. the recorded full-pass summary quoted in the Tutorial.
- `stamp` — A plain-text rendering of the verdict (title, identifier, verdict, per-section statuses, summary) for logs and tickets.

### Verdict vocabulary

**Overall verdicts** — every value this atom can return:

- `INTEGRATION_SOUND` — All 31 checks pass.
- `INTEGRATION_NOT_SOUND` — At least one check fails; the failing sections name the breached discipline.
- `INSUFFICIENT_EVIDENCE` — Nothing fails, but at least one check is `missing` — evidence was not declared.

**Section statuses** (values of each entry in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check fails but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks. Gated/not-applicable checks report `pass` when their gate is closed; there is no distinct not-applicable value.

**Computed fields:**

- `flavor_status` — `acp_client` when `protocol.flavor` is exactly `"ACP-client"`; `acp_comm` when exactly `"ACP-comm"`; `unrecognized` for any other declared value; `null` when no flavour is declared.

### Errors

Only the shapes evidenced in the repo / gateway docs are listed; no other payloads are promised.

- **401** — missing or invalid key. No verdict is produced.
- **403** — the key lacks this atom's scope. Issue the atom's scope on your key (`POST /v1/keys` with this atom's slug) and retry.
- **422** — invalid input: `{"ok": false, "error": "invalid_input", "field": "protocol.flavor", "detail": "protocol.flavor must be a string"}` is this atom's recorded malformed-case shape (verbatim in Worked examples, example 3); `field` names the offending field and `detail` states the expected type.
- **429** — rate limit exceeded (see Rate limits). Back off and retry; do not parallel-retry.

### Rate limits + pricing status

- **Rate limits:** 60 requests/minute and 10,000 requests/day per key (contract.yaml `rate_limit`; SPEC default — the per-key limit is the capacity guard for open public usage).
- **Pricing:** Free during trial — rate pending. contract.yaml `pricing.rate` is `null` (`rate_status: pending`); prices are set only from measured production cost per unit.

## Explanation

The atom reviews a declared ACP (Agent Client Protocol / Agent Communication Protocol) integration against the bound skill's disciplines across seven sections. One check is computed, not merely declared: flavour recognition. The skill speaks exactly two ACPs and requires disambiguated naming, so `protocol.flavor` passes only as exactly `"ACP-client"` (initialize → session/new → session/prompt, streamed session/update chunks, permissions, stdio JSON-RPC) or exactly `"ACP-comm"` (REST — GET /agents, POST /runs, GET /runs/:id, cancel; typed message parts). The flavour also gates the protocol-surface checks, and `security.remote_endpoints_present` gates the authentication check. Two skill statements are deliberately not turned into arithmetic: chunk sizes are bounded and output sizes are capped, but the skill states no number for either, so both remain declared booleans.

**How the verdict is decided.** The core is deterministic: same manifest in → same verdict out, byte-identical on repeat calls and identical across the REST and MCP faces (both verified in the recorded battery). Every check reads declared fields only. The three-way distinction is the heart of the semantics: an **absent** field is *missing evidence* (check `missing`; the verdict can be at most `INSUFFICIENT_EVIDENCE`), while a field **present but false / invalid** is a *failure* (check `fail`; the verdict is the not-passing verdict). Any single `fail` decides the verdict immediately in effect — failures outrank missing evidence — and only a manifest with no fails and no missing checks earns the passing verdict. Where a check is gated, a closed gate makes it pass as not applicable rather than missing: the gate field itself carries the evidence that the check does not apply.

**What it does NOT do.** It reviews **declared** evidence only — it does not connect to, probe, or run the integration, speak either protocol to it, execute its contract tests, or verify that a declared value is true. Named exclusions: no check of *which* spec version is documented or *which* subset is supported, only that both are documented; no numeric bound on chunk or output sizes; no assessment of the business logic behind the adapter, only that none is declared in the wire layer; no live verification of any declared fact.

**Buyer / use context.** Teams and agents integrating an agent protocol who need a bounded, repeatable soundness review of an integration design before or after building it — the house's own workflow is agent protocol integration builds. One unit of sale = one delivered review. The atom sells its deliverable — the bounded judgment artifact — never the underlying knowledge itself.

## Role views

### For integrators (Users)

You need: the endpoints and tool name above, one key with this atom's scope, and a manifest that declares your evidence truthfully. Read `verdict` first, then `sections` to localize a problem, then the individual `fail`/`missing` checks to fix it. Budget for the 60/min, 10,000/day per-key limits; price is free during trial (rate pending). Status is release candidate — pin to the recorded behaviour in TEST-REPORT.md and expect the RC soak to 2026-11-22.

### For developers

Manifest authoring: follow the Input reference exactly — field names, nesting and types are the contract; a wrong type is a 422, an omitted field is `missing`, a false value is a `fail`. Determinism: the evaluation core is a pure function of the manifest (Python oracle `src/acp_protocol_integration_review.py` — `evaluate(manifest) -> verdict dict`; tests: tests/test_acp_protocol_integration_review.py — 37 tests, all passing 2026-11-15). Fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps (contract.yaml binding rule R1).

### For ops

Endpoints: REST `POST /v1/acp-protocol-integration-review` and MCP `POST /mcp/acp-protocol-integration-review` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope: per-atom scope on the gateway key; 401 = missing/invalid key, 403 = scope missing — separate those two in alerting. Error monitoring: 422s indicate caller-side manifest type errors (field + detail are in the body); 429s indicate the 60/min or 10,000/day per-key limit. RC status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples

Provenance: recorded 2026-11-15T23:51:58.696662+00:00 against gateway v1.1.0, external verification lane, source `verification/work/acp-protocol-integration-review/evidence.json`. Each example is the case's recorded `input` followed by the REST execution's recorded `response_text`, reproduced verbatim as JSON values (pretty-printed with indent 2 for readability; verified mechanically against the evidence after writing).

### Example 1 — Full-pass (recorded case `full-pass`, HTTP 200)

Input:

```json
{
  "implementation": "v1.0.0-stable",
  "protocol": {
    "flavor": "ACP-client",
    "disambiguated_naming": true,
    "spec_version_documented": true,
    "supported_subset_documented": true
  },
  "adapter": {
    "thin": true,
    "single_core_protocol_at_edge": true,
    "business_logic_in_wire_layer": false
  },
  "surface": {
    "client_flow_complete": true,
    "client_permissions_handled": true
  },
  "lifecycle": {
    "unknown_sessions_or_runs_handled": true,
    "cancels_handled": true,
    "errors_handled": true,
    "reconnects_handled": true,
    "state_leaks_across_sessions": false
  },
  "streaming": {
    "updates_ordered": true,
    "chunk_sizes_bounded": true,
    "backpressure_addressed": true,
    "terminal_states_clear": true
  },
  "security": {
    "remote_endpoints_present": true,
    "remote_endpoints_authenticated": true,
    "inputs_validated": true,
    "output_sizes_capped": true,
    "tool_execution_sandboxed": true
  },
  "honesty": {
    "unimplemented_modes_noted": true,
    "unsupported_features_faked": false
  },
  "upgrade": {
    "sdk_upgrade_path_documented": true,
    "adapter_tests_kept_for_sdk_swap": true
  },
  "tests": {
    "scripted_client_handshake_covered": true,
    "lifecycle_happy_error_cancel_covered": true,
    "contract_tests_in_ci_per_protocol": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "acp-protocol-integration-review",
  "atom_version": "0.1.0",
  "implementation": "v1.0.0-stable",
  "verdict": "INTEGRATION_SOUND",
  "sections": {
    "disambiguation_and_scope": "pass",
    "adapter_architecture": "pass",
    "protocol_surface": "pass",
    "lifecycle_correctness": "pass",
    "streaming_discipline": "pass",
    "security": "pass",
    "honesty_tests_and_upgrade_path": "pass"
  },
  "checks": [
    {
      "section": "disambiguation_and_scope",
      "check": "disambiguated_naming_in_docs_and_code",
      "status": "pass",
      "evidence": "quality gate: disambiguated naming in docs/code ('ACP-client' vs 'ACP-comm') \u2014 always disambiguate which ACP is meant"
    },
    {
      "section": "disambiguation_and_scope",
      "check": "flavor_recognized",
      "status": "pass",
      "evidence": "the declared flavour is one of the skill's two ACPs: 'ACP-client' (Agent Client Protocol) or 'ACP-comm' (Agent Communication Protocol)"
    },
    {
      "section": "disambiguation_and_scope",
      "check": "spec_version_documented",
      "status": "pass",
      "evidence": "minimal-but-honest: label spec versions supported"
    },
    {
      "section": "disambiguation_and_scope",
      "check": "supported_subset_documented",
      "status": "pass",
      "evidence": "quality gate: spec version + supported subset documented"
    },
    {
      "section": "adapter_architecture",
      "check": "adapter_thin",
      "status": "pass",
      "evidence": "protocol adapters stay thin: protocol sits at the edge"
    },
    {
      "section": "adapter_architecture",
      "check": "single_core_protocol_at_edge",
      "status": "pass",
      "evidence": "one core, protocol sits at the edge ('agent-commands'-style mapping)"
    },
    {
      "section": "adapter_architecture",
      "check": "no_business_logic_in_wire_layer",
      "status": "pass",
      "evidence": "no business logic in the wire layer"
    },
    {
      "section": "protocol_surface",
      "check": "client_flow_complete_when_client_flavor",
      "status": "pass",
      "evidence": "ACP-client surface: initialize -> session/new -> session/prompt with streamed session/update chunks, over stdio JSON-RPC"
    },
    {
      "section": "protocol_surface",
      "check": "client_permissions_handled_when_client_flavor",
      "status": "pass",
      "evidence": "ACP-client surface: permissions are handled"
    },
    {
      "section": "protocol_surface",
      "check": "comm_endpoints_complete_when_comm_flavor",
      "status": "pass",
      "evidence": "not an ACP-comm integration"
    },
    {
      "section": "protocol_surface",
      "check": "comm_message_parts_typed_when_comm_flavor",
      "status": "pass",
      "evidence": "not an ACP-comm integration"
    },
    {
      "section": "lifecycle_correctness",
      "check": "unknown_sessions_or_runs_handled",
      "status": "pass",
      "evidence": "lifecycle: handle unknown sessions/runs"
    },
    {
      "section": "lifecycle_correctness",
      "check": "cancels_handled",
      "status": "pass",
      "evidence": "lifecycle: handle cancels"
    },
    {
      "section": "lifecycle_correctness",
      "check": "errors_handled",
      "status": "pass",
      "evidence": "lifecycle: handle errors"
    },
    {
      "section": "lifecycle_correctness",
      "check": "reconnects_handled",
      "status": "pass",
      "evidence": "lifecycle: handle reconnects"
    },
    {
      "section": "lifecycle_correctness",
      "check": "no_state_leak_across_sessions",
      "status": "pass",
      "evidence": "lifecycle: never leak state across sessions"
    },
    {
      "section": "streaming_discipline",
      "check": "updates_ordered",
      "status": "pass",
      "evidence": "streaming discipline: order updates"
    },
    {
      "section": "streaming_discipline",
      "check": "chunk_sizes_bounded",
      "status": "pass",
      "evidence": "streaming discipline: bounded chunk sizes (the skill states bounded, and states no number \u2014 the bound is declared, not computed)"
    },
    {
      "section": "streaming_discipline",
      "check": "backpressure_addressed",
      "status": "pass",
      "evidence": "streaming discipline: backpressure awareness"
    },
    {
      "section": "streaming_discipline",
      "check": "terminal_states_clear",
      "status": "pass",
      "evidence": "streaming discipline: clear terminal states (stopReason / run status)"
    },
    {
      "section": "security",
      "check": "remote_endpoints_authenticated_when_remote",
      "status": "pass",
      "evidence": "red line: no unauthenticated remote endpoints \u2014 remote ACP endpoints require auth (tokens/mTLS)"
    },
    {
      "section": "security",
      "check": "inputs_validated",
      "status": "pass",
      "evidence": "security: validate all inputs (quality gate: remote endpoints authenticated; inputs validated)"
    },
    {
      "section": "security",
      "check": "output_sizes_capped",
      "status": "pass",
      "evidence": "security: cap output sizes (the skill states a cap, and states no number \u2014 the cap is declared, not computed)"
    },
    {
      "section": "security",
      "check": "prompt_triggered_tool_execution_sandboxed",
      "status": "pass",
      "evidence": "security: sandbox any tool execution triggered via prompts"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "unimplemented_modes_noted",
      "status": "pass",
      "evidence": "minimal-but-honest: note unimplemented modes (e.g. stream)"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "unsupported_features_not_faked",
      "status": "pass",
      "evidence": "red line: never fake compliance \u2014 no pretending unsupported features work"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "scripted_client_handshake_covered",
      "status": "pass",
      "evidence": "contract tests: scripted client covering handshake"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "lifecycle_happy_error_cancel_covered",
      "status": "pass",
      "evidence": "quality gate / contract tests: lifecycle tests \u2014 session/run happy + error + cancel"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "contract_tests_in_ci_per_protocol",
      "status": "pass",
      "evidence": "contract tests: in CI, per protocol"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "sdk_upgrade_path_documented",
      "status": "pass",
      "evidence": "production upgrade path: official SDKs when the surface grows"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "adapter_tests_kept_for_sdk_swap",
      "status": "pass",
      "evidence": "production upgrade path: keep the adapter tests so swaps are safe"
    }
  ],
  "flavor_status": "acp_client",
  "summary": "31 pass, 0 fail, 0 missing of 31 checks across seven sections.",
  "stamp": "ACP PROTOCOL INTEGRATION REVIEW\nimplementation: v1.0.0-stable\nVERDICT: INTEGRATION_SOUND\n  disambiguation_and_scope         pass\n  adapter_architecture             pass\n  protocol_surface                 pass\n  lifecycle_correctness            pass\n  streaming_discipline             pass\n  security                         pass\n  honesty_tests_and_upgrade_path   pass\n31 pass, 0 fail, 0 missing of 31 checks across seven sections."
}
```

### Example 2 — Violations (recorded case `violations`, HTTP 200)

Input:

```json
{
  "implementation": "v1.0.0-broken",
  "protocol": {
    "flavor": "ACP-client",
    "disambiguated_naming": true,
    "spec_version_documented": true,
    "supported_subset_documented": true
  },
  "adapter": {
    "thin": true,
    "single_core_protocol_at_edge": true,
    "business_logic_in_wire_layer": true
  },
  "surface": {
    "client_flow_complete": true,
    "client_permissions_handled": true
  },
  "lifecycle": {
    "unknown_sessions_or_runs_handled": true,
    "cancels_handled": true,
    "errors_handled": true,
    "reconnects_handled": true,
    "state_leaks_across_sessions": true
  },
  "streaming": {
    "updates_ordered": true,
    "chunk_sizes_bounded": true,
    "backpressure_addressed": true,
    "terminal_states_clear": true
  },
  "security": {
    "remote_endpoints_present": true,
    "remote_endpoints_authenticated": true,
    "inputs_validated": true,
    "output_sizes_capped": true,
    "tool_execution_sandboxed": true
  },
  "honesty": {
    "unimplemented_modes_noted": true,
    "unsupported_features_faked": true
  },
  "upgrade": {
    "sdk_upgrade_path_documented": true,
    "adapter_tests_kept_for_sdk_swap": true
  },
  "tests": {
    "scripted_client_handshake_covered": true,
    "lifecycle_happy_error_cancel_covered": true,
    "contract_tests_in_ci_per_protocol": true
  }
}
```

Response (`response_text`):

```json
{
  "service": "acp-protocol-integration-review",
  "atom_version": "0.1.0",
  "implementation": "v1.0.0-broken",
  "verdict": "INTEGRATION_NOT_SOUND",
  "sections": {
    "disambiguation_and_scope": "pass",
    "adapter_architecture": "fail",
    "protocol_surface": "pass",
    "lifecycle_correctness": "fail",
    "streaming_discipline": "pass",
    "security": "pass",
    "honesty_tests_and_upgrade_path": "fail"
  },
  "checks": [
    {
      "section": "disambiguation_and_scope",
      "check": "disambiguated_naming_in_docs_and_code",
      "status": "pass",
      "evidence": "quality gate: disambiguated naming in docs/code ('ACP-client' vs 'ACP-comm') \u2014 always disambiguate which ACP is meant"
    },
    {
      "section": "disambiguation_and_scope",
      "check": "flavor_recognized",
      "status": "pass",
      "evidence": "the declared flavour is one of the skill's two ACPs: 'ACP-client' (Agent Client Protocol) or 'ACP-comm' (Agent Communication Protocol)"
    },
    {
      "section": "disambiguation_and_scope",
      "check": "spec_version_documented",
      "status": "pass",
      "evidence": "minimal-but-honest: label spec versions supported"
    },
    {
      "section": "disambiguation_and_scope",
      "check": "supported_subset_documented",
      "status": "pass",
      "evidence": "quality gate: spec version + supported subset documented"
    },
    {
      "section": "adapter_architecture",
      "check": "adapter_thin",
      "status": "pass",
      "evidence": "protocol adapters stay thin: protocol sits at the edge"
    },
    {
      "section": "adapter_architecture",
      "check": "single_core_protocol_at_edge",
      "status": "pass",
      "evidence": "one core, protocol sits at the edge ('agent-commands'-style mapping)"
    },
    {
      "section": "adapter_architecture",
      "check": "no_business_logic_in_wire_layer",
      "status": "fail",
      "evidence": "no business logic in the wire layer"
    },
    {
      "section": "protocol_surface",
      "check": "client_flow_complete_when_client_flavor",
      "status": "pass",
      "evidence": "ACP-client surface: initialize -> session/new -> session/prompt with streamed session/update chunks, over stdio JSON-RPC"
    },
    {
      "section": "protocol_surface",
      "check": "client_permissions_handled_when_client_flavor",
      "status": "pass",
      "evidence": "ACP-client surface: permissions are handled"
    },
    {
      "section": "protocol_surface",
      "check": "comm_endpoints_complete_when_comm_flavor",
      "status": "pass",
      "evidence": "not an ACP-comm integration"
    },
    {
      "section": "protocol_surface",
      "check": "comm_message_parts_typed_when_comm_flavor",
      "status": "pass",
      "evidence": "not an ACP-comm integration"
    },
    {
      "section": "lifecycle_correctness",
      "check": "unknown_sessions_or_runs_handled",
      "status": "pass",
      "evidence": "lifecycle: handle unknown sessions/runs"
    },
    {
      "section": "lifecycle_correctness",
      "check": "cancels_handled",
      "status": "pass",
      "evidence": "lifecycle: handle cancels"
    },
    {
      "section": "lifecycle_correctness",
      "check": "errors_handled",
      "status": "pass",
      "evidence": "lifecycle: handle errors"
    },
    {
      "section": "lifecycle_correctness",
      "check": "reconnects_handled",
      "status": "pass",
      "evidence": "lifecycle: handle reconnects"
    },
    {
      "section": "lifecycle_correctness",
      "check": "no_state_leak_across_sessions",
      "status": "fail",
      "evidence": "lifecycle: never leak state across sessions"
    },
    {
      "section": "streaming_discipline",
      "check": "updates_ordered",
      "status": "pass",
      "evidence": "streaming discipline: order updates"
    },
    {
      "section": "streaming_discipline",
      "check": "chunk_sizes_bounded",
      "status": "pass",
      "evidence": "streaming discipline: bounded chunk sizes (the skill states bounded, and states no number \u2014 the bound is declared, not computed)"
    },
    {
      "section": "streaming_discipline",
      "check": "backpressure_addressed",
      "status": "pass",
      "evidence": "streaming discipline: backpressure awareness"
    },
    {
      "section": "streaming_discipline",
      "check": "terminal_states_clear",
      "status": "pass",
      "evidence": "streaming discipline: clear terminal states (stopReason / run status)"
    },
    {
      "section": "security",
      "check": "remote_endpoints_authenticated_when_remote",
      "status": "pass",
      "evidence": "red line: no unauthenticated remote endpoints \u2014 remote ACP endpoints require auth (tokens/mTLS)"
    },
    {
      "section": "security",
      "check": "inputs_validated",
      "status": "pass",
      "evidence": "security: validate all inputs (quality gate: remote endpoints authenticated; inputs validated)"
    },
    {
      "section": "security",
      "check": "output_sizes_capped",
      "status": "pass",
      "evidence": "security: cap output sizes (the skill states a cap, and states no number \u2014 the cap is declared, not computed)"
    },
    {
      "section": "security",
      "check": "prompt_triggered_tool_execution_sandboxed",
      "status": "pass",
      "evidence": "security: sandbox any tool execution triggered via prompts"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "unimplemented_modes_noted",
      "status": "pass",
      "evidence": "minimal-but-honest: note unimplemented modes (e.g. stream)"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "unsupported_features_not_faked",
      "status": "fail",
      "evidence": "red line: never fake compliance \u2014 no pretending unsupported features work"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "scripted_client_handshake_covered",
      "status": "pass",
      "evidence": "contract tests: scripted client covering handshake"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "lifecycle_happy_error_cancel_covered",
      "status": "pass",
      "evidence": "quality gate / contract tests: lifecycle tests \u2014 session/run happy + error + cancel"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "contract_tests_in_ci_per_protocol",
      "status": "pass",
      "evidence": "contract tests: in CI, per protocol"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "sdk_upgrade_path_documented",
      "status": "pass",
      "evidence": "production upgrade path: official SDKs when the surface grows"
    },
    {
      "section": "honesty_tests_and_upgrade_path",
      "check": "adapter_tests_kept_for_sdk_swap",
      "status": "pass",
      "evidence": "production upgrade path: keep the adapter tests so swaps are safe"
    }
  ],
  "flavor_status": "acp_client",
  "summary": "28 pass, 3 fail, 0 missing of 31 checks across seven sections.",
  "stamp": "ACP PROTOCOL INTEGRATION REVIEW\nimplementation: v1.0.0-broken\nVERDICT: INTEGRATION_NOT_SOUND\n  disambiguation_and_scope         pass\n  adapter_architecture             fail\n  protocol_surface                 pass\n  lifecycle_correctness            fail\n  streaming_discipline             pass\n  security                         pass\n  honesty_tests_and_upgrade_path   fail\n28 pass, 3 fail, 0 missing of 31 checks across seven sections."
}
```

### Example 3 — Malformed (recorded case `malformed`, HTTP 422)

Input:

```json
{
  "implementation": "malformed-test",
  "protocol": {
    "flavor": 123
  }
}
```

Response (`response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "protocol.flavor",
  "detail": "protocol.flavor must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — see checklist note below |
| Checks named: documented vs recorded | 31 / 31 |
| Verdict vocabulary complete | Yes — all overall verdicts, section statuses, per-check statuses, and computed-field values listed |
| Input reference typed | Yes — 33 fields, each with a type |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed compared as JSON values against `evidence.json` after writing |

Regulators view decision: **N/A** — this atom is an engineering/design review over declared evidence; its verdict is not itself compliance or audit evidence and its domain is not a regulated one (finance, security, licensing, privacy), so no regulator role view is included.
