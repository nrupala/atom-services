# Grpc service design — documentation

**Grpc service design** · slug `grpc-service-design` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "test-service"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "grpc-service-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the gRPC service design manifest.** You declare a record of a service already designed — the atom audits the record, it does not do the design (see Explanation). The recorded full-pass manifest declares the project `test-service`: a proto3 contract with removed fields reserved, backward/forward compatibility rules documented, buf lint and the breaking-change check in CI, codegen pinned and generated in CI, and neither red line present (`hand_generated_stubs_present: false`, `field_number_reuse_present: false`); two proto fields in message `User` — `id` (1) and `name` (2), sharing no number; streaming choices documented by flow, cancellation propagation configured, a rich error model used and metadata limited to transport concerns; one method, `GetUser`, with `streaming_mode` `unary` and `deadline_set: true` (a unary row, so the bounded-stream check passes as not applicable to it); the health service exposed, reflection not enabled (`reflection_enabled: false`, so the reflection-restriction check passes as not applicable), interceptors for auth, logging, metrics and tracing, keepalive and pool tuning configured and explicit max message sizes set; no cross-host traffic (`cross_host_traffic_present: false`, so the mTLS, per-service-identity and no-plaintext checks pass as not applicable), authorization via an interceptor or external policy, and no public surfaces (`public_surfaces_present: false`, so the public-surface rate-limit check passes as not applicable); trace and request-id propagation, per-method metrics and structured errors logged once; in-process integration tests, contract tests passing against clients and load smoke on hot paths; and no REST consumers and no browser clients (`rest_consumers_present: false`, `browser_clients_present: false`, so the gateway/JSON-adapter and gRPC-Web checks pass as not applicable), packages versioned v1, and deprecated fields announced then removed on schedule.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/grpc-service-design` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `GRPC_SERVICE_SOUND`: "39 pass, 0 fail, 0 missing of 39 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `methods_count` is 1, `proto_fields_count` is 2, `deadline_coverage` is `"1.000000"`, and `streaming_boundedness_coverage` is `null` (no streaming methods — `GetUser` is unary).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `GRPC_SERVICE_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "grpc-service-design"}`.
3. Call: `POST https://atoms.pipavia.com/v1/grpc-service-design` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/grpc-service-design` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `grpc_service_design`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `GRPC_SERVICE_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 5 checks fail: `no_hand_generated_stubs`, `no_field_number_reuse`, `no_duplicate_field_number_within_message`, `every_method_has_deadline`, `every_streaming_method_bounded`, and the summary reads "34 pass, 5 fail, 0 missing of 39 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `fields_sharing_a_duplicate_number` names `id` and `name` — both declared with number 1 in message `User` — and `methods_without_deadline` and `unbounded_streaming_methods` both name `GetUser`: a method changed to `streaming_mode` `server` with `deadline_set` declared `false` and `stream_bounded` declared `false`; the run also declares `hand_generated_stubs_present` and `field_number_reuse_present` as `true`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where a number, list, object or boolean is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "contract",
  "detail": "contract must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/grpc-service-design` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/grpc-service-design` — tool name `grpc_service_design`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `grpc_service_design` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `GRPC_SERVICE_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked |

#### Read by: contract_and_compatibility

| Field | Type | Notes |
|---|---|---|
| `contract` | object | The contract section object — a present non-object value is rejected before evaluation |
| `contract.proto3_used` | boolean | — |
| `contract.removed_fields_reserved` | boolean | — |
| `contract.backward_forward_compatibility_rules_documented` | boolean | — |
| `contract.buf_lint_in_ci` | boolean | — |
| `contract.breaking_change_check_in_ci` | boolean | — |
| `contract.codegen_pinned` | boolean | — |
| `contract.codegen_generated_in_ci` | boolean | — |
| `contract.hand_generated_stubs_present` | boolean | must be `false` to pass — skill red line |
| `contract.field_number_reuse_present` | boolean | must be `false` to pass — skill red line |
| `proto_fields` | list | list of field-row objects, each with the entry fields below; computed, see below |
| `proto_fields[]` | object | One declared proto-field row — a present non-object entry is rejected before evaluation |
| `proto_fields[].message` | string | Groups the row for the duplicate-number check below |
| `proto_fields[].name` | string | Names the row in the computed outputs |
| `proto_fields[].number` | number | Compared for equality within the same declared message for the duplicate-number check below |

#### Read by: api_shape_and_deadlines

| Field | Type | Notes |
|---|---|---|
| `api_shape` | object | The API-shape section object — a present non-object value is rejected before evaluation |
| `api_shape.streaming_choices_documented_by_flow` | boolean | — |
| `methods` | list | list of method-row objects, each with the entry fields below; computed, see below |
| `methods[]` | object | One declared method row — a present non-object entry is rejected before evaluation |
| `methods[].name` | string | Names the row in the computed outputs |
| `methods[].streaming_mode` | string | Must be a non-empty string for the row to pass the computed mode check; the exact value `unary` gates the bounded-stream check below, no other value is imposed (see the declined vocabulary note in Explanation) |
| `methods[].deadline_set` | boolean | — |
| `methods[].stream_bounded` | boolean | required when the row's streaming mode is not `unary`; otherwise the check passes as not applicable to that row |
| `api_shape.cancellation_propagation_configured` | boolean | — |
| `api_shape.rich_error_model_used` | boolean | — |
| `api_shape.metadata_limited_to_transport_concerns` | boolean | — |

#### Read by: server_hygiene

| Field | Type | Notes |
|---|---|---|
| `server` | object | The server section object — a present non-object value is rejected before evaluation |
| `server.health_service_exposed` | boolean | — |
| `server.reflection_enabled` | boolean (gate) | gates the reflection-restriction check below |
| `server.reflection_restricted_to_dev_or_authenticated` | boolean | required when reflection is declared enabled; otherwise the check passes as not applicable |
| `server.interceptors_for_auth_logging_metrics_tracing` | boolean | — |
| `server.keepalive_and_pool_tuning_configured` | boolean | — |
| `server.explicit_max_message_sizes_set` | boolean | — |

#### Read by: security_and_transport

| Field | Type | Notes |
|---|---|---|
| `security` | object | The security section object — a present non-object value is rejected before evaluation |
| `security.cross_host_traffic_present` | boolean (gate) | gates the three cross-host checks below |
| `security.mtls_enabled` | boolean | required when cross-host traffic is declared present; otherwise the check passes as not applicable |
| `security.per_service_identities_used` | boolean | required when cross-host traffic is declared present; otherwise not applicable |
| `security.plaintext_across_hosts_present` | boolean | must be `false` when cross-host traffic is declared present — skill red line; otherwise the check passes as not applicable |
| `security.authorization_via_interceptor_or_external_policy` | boolean | — |
| `security.public_surfaces_present` | boolean (gate) | gates the rate-limit check below |
| `security.rate_limits_on_public_surfaces` | boolean | required when public surfaces are declared present; otherwise the check passes as not applicable |

#### Read by: observability_testing_and_interop

| Field | Type | Notes |
|---|---|---|
| `observability` | object | The observability section object — a present non-object value is rejected before evaluation |
| `observability.trace_and_request_id_propagation_configured` | boolean | — |
| `observability.per_method_metrics_collected` | boolean | — |
| `observability.structured_errors_logged_once` | boolean | — |
| `testing` | object | The testing section object — a present non-object value is rejected before evaluation |
| `testing.in_process_integration_tests_present` | boolean | — |
| `testing.contract_tests_pass_against_clients` | boolean | — |
| `testing.load_smoke_on_hot_paths_run` | boolean | — |
| `interop` | object | The interop section object — a present non-object value is rejected before evaluation |
| `interop.rest_consumers_present` | boolean (gate) | gates the gateway/JSON adapter check below |
| `interop.gateway_json_adapters_provided` | boolean | required when REST consumers are declared present; otherwise the check passes as not applicable |
| `interop.browser_clients_present` | boolean (gate) | gates the gRPC-Web check below |
| `interop.grpc_web_enabled` | boolean | required when browser clients are declared present; otherwise the check passes as not applicable |
| `interop.packages_versioned_v1` | boolean | — |
| `interop.deprecated_fields_announced_then_removed_on_schedule` | boolean | — |

### Checks

All 39 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: contract_and_compatibility

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `proto3_used` | contract first: the contract is proto3 | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `removed_fields_reserved` | quality gate: removed fields are reserved — their numbers and names are never recycled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `backward_forward_compatibility_rules_documented` | contract first: backward/forward compatibility rules are documented | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `buf_lint_in_ci` | contract first: buf lint runs in CI | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `breaking_change_check_in_ci` | quality gate: the breaking-change check is green in CI | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `codegen_pinned` | contract first: codegen is pinned | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `codegen_generated_in_ci` | contract first: stubs are generated in CI, not by hand | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `no_hand_generated_stubs` | red line: no hand-generated stubs | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_field_number_reuse` | red line: proto field numbers are never reused, including numbers of removed fields | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `proto_fields_declared` | contract first: the declared record names its proto fields — the proto_fields list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `no_duplicate_field_number_within_message` | red line: no two declared fields in the same message share a field number — a shared number is a reuse on the declared evidence | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |

#### Section: api_shape_and_deadlines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `streaming_choices_documented_by_flow` | API shape: unary vs server/client/bidi streaming is chosen by flow for each method | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `methods_declared` | API shape: the declared record names its methods — the methods list is present and non-empty | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_method_names_streaming_mode` | API shape: every declared method row names its streaming mode — a non-empty streaming_mode string | Computed over the declared record. Pass: the rule holds over the declared rows. Fail: the declared record breaks the rule — an empty list where a non-empty list is required, an invalid value, or a declared row violating the rule (offending rows are named in the computed outputs). Missing: the list, or a field the rule reads, is absent. |
| `every_method_has_deadline` | quality gate: every declared method row declares a deadline set — deadlines on every call | Computed over the declared record. Pass: every declared method row declares `deadline_set: true`. Fail: a row declares `deadline_set` present but not `true` (offending rows are named in `methods_without_deadline`). Missing: the list is absent, or a row has `deadline_set` absent (such a row is missing evidence and does not appear in `methods_without_deadline`). |
| `every_streaming_method_bounded` | red line: no unbounded streams — every streaming method row declares its stream bounded | Computed over the declared record, conditional per row on the row's `streaming_mode` not being exactly `unary`. Pass: every streaming row declares `stream_bounded: true` — or there are no streaming rows, in which case the check passes as not applicable to those rows. Fail: a streaming row declares `stream_bounded` present but not `true` (offending rows are named in `unbounded_streaming_methods`). Missing: the list is absent, or a streaming row has `stream_bounded` absent (such a row is missing evidence and does not appear in `unbounded_streaming_methods`). |
| `cancellation_propagation_configured` | quality gate: cancellation propagation is configured alongside deadlines | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `rich_error_model_used` | API shape: a rich error model is used — status codes plus typed details | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `metadata_limited_to_transport_concerns` | API shape: metadata is kept for transport concerns | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: server_hygiene

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `health_service_exposed` | quality gate: the grpc.health.v1 health service is exposed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `reflection_restricted_to_dev_or_authenticated` | reflection not enabled | Conditional on `server.reflection_enabled`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "reflection not enabled"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `interceptors_for_auth_logging_metrics_tracing` | server hygiene: interceptors cover auth, logging, metrics and tracing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `keepalive_and_pool_tuning_configured` | server hygiene: keepalive and pool tuning are configured | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `explicit_max_message_sizes_set` | server hygiene: max message sizes are explicit | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: security_and_transport

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `mtls_on_cross_host_paths` | no cross-host traffic declared | Conditional on `security.cross_host_traffic_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no cross-host traffic declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `per_service_identities_used` | no cross-host traffic declared | Conditional on `security.cross_host_traffic_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no cross-host traffic declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `no_plaintext_across_hosts` | no cross-host traffic declared | Conditional on `security.cross_host_traffic_present`. Pass: the gate is declared and the anti-pattern field is declared `false` — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no cross-host traffic declared"). Fail: the gate is declared and the anti-pattern field is declared `true`. Missing: the gate is declared and the required field is absent. |
| `authorization_via_interceptor_or_external_policy` | quality gate: authorization runs via an interceptor or an external policy (policy-as-code) | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `rate_limits_on_public_surfaces` | no public surfaces declared | Conditional on `security.public_surfaces_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no public surfaces declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |

#### Section: observability_testing_and_interop

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `trace_and_request_id_propagation_configured` | observability: trace and request-id propagation are configured | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `per_method_metrics_collected` | observability: per-method metrics are collected | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `structured_errors_logged_once` | observability: structured errors are logged once | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `in_process_integration_tests_present` | testing: in-process integration tests (bufconn-style) are present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `contract_tests_pass_against_clients` | quality gate: contract tests pass against real clients | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `load_smoke_on_hot_paths_run` | testing: load smoke runs on hot paths | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `gateway_json_adapters_for_rest_consumers` | no REST consumers declared | Conditional on `interop.rest_consumers_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no REST consumers declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `grpc_web_where_browsers_connect` | no browser clients declared | Conditional on `interop.browser_clients_present`. Pass: the gate is declared and the requirement is declared met — or the gate is not triggered, in which case the check passes as not applicable and its evidence says so (as in the recorded full-pass run, where the evidence reads "no browser clients declared"). Fail: the gate is declared and the requirement is declared unmet. Missing: the gate is declared and the required field is absent. |
| `packages_versioned_v1` | interop & versioning: packages carry v1 versions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deprecated_fields_announced_then_removed_on_schedule` | interop & versioning: deprecated fields are announced, then removed on schedule | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"grpc-service-design"`), `atom_version` (`"0.1.0"`), and `project` (the manifest's declared project value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `methods_count` and `proto_fields_count` (the declared list lengths as integers, or null when a list is not declared); the row-name lists `methods_without_streaming_mode`, `methods_without_deadline` (methods whose `deadline_set` field is present but not `true`; a method with the field absent is missing evidence and does not appear), `unbounded_streaming_methods` (streaming methods whose `stream_bounded` field is present but not `true`) and `fields_sharing_a_duplicate_number` (fields whose declared message + number pair is shared by another declared field; all four lists are null when their list is not declared); and the ratios `deadline_coverage` (methods declaring a deadline set ÷ declared methods) and `streaming_boundedness_coverage` (streaming methods declaring their stream bounded ÷ streaming methods) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty, and `streaming_boundedness_coverage` is also null when no method is declared with a non-`unary` streaming mode. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "39 pass, 0 fail, 0 missing of 39 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `GRPC_SERVICE_SOUND` — all 39 checks pass: the declared gRPC service design record is complete and consistent with the bound skill's checklist and red lines.
- `GRPC_SERVICE_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one primary computed check cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

### Errors

Error bodies are the gateway's recorded shapes (`rails/gateway/src/callpath.ts`); a failed call is not metered.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or the key does not verify. On the MCP face the body is `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the grpc_service_design scope; issue it for this atom first"}` | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. On the MCP face the body is `{"error": "this key does not hold the grpc_service_design scope"}`. |
| 422 | `{"ok":false,"error":"invalid_input","field":"contract","detail":"contract must be an object"}` (this atom's recorded malformed run; the shape is `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<field> must be a <type>"}`) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. Via MCP `tools/call`, the same failure surfaces as a JSON-RPC error with code `-32602` carrying the detail message. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for grpc-service-design exceeded"}` (or the `10000/day` variant) | Per-key rate limit exceeded for this atom; the call is not metered. Via MCP `tools/call` it surfaces as a JSON-RPC error with code `-32029`. |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Build gRPC services well — protobuf contracts, streaming, deadlines, health, mTLS, breaking-change checks (the bound capability, from the `grpc-service-engineering` skill). You submit one declared record — the gRPC service design manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 5 sections (`contract_and_compatibility`, `api_shape_and_deadlines`, `server_hygiene`, `security_and_transport`, `observability_testing_and_interop`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `methods` list must be present and non-empty, every method must name a non-empty `streaming_mode` and declare a deadline set, and every non-`unary` method must declare its stream bounded; the declared `proto_fields` list must be present and non-empty, and no two fields in the same declared `message` may share a `number` — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies — reflection restriction is required only when `server.reflection_enabled` is declared `true`; mTLS, per-service identities and the no-plaintext rule are required only when `security.cross_host_traffic_present` is declared `true`; rate limits only when `security.public_surfaces_present` is declared `true`; gateway/JSON adapters only when `interop.rest_consumers_present` is declared `true`; and gRPC-Web only when `interop.browser_clients_present` is declared `true`; when a gate is not triggered those checks pass as not applicable, and their evidence text says so. Aggregation is strict: any `fail` anywhere produces `GRPC_SERVICE_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `GRPC_SERVICE_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a deadline duration in milliseconds or seconds (the skill says "deadlines on every call" but states no duration — caller attestation only); a max message size in bytes (the skill says sizes are "explicit" but states no number); a keepalive interval or connection-pool size; a stream bound or flow-control window size (boundedness is attested per method, no bound value is stated); a rate-limit threshold for public surfaces; a load-smoke throughput or latency bar; a coverage percentage below completeness; a field-number range or reserved range (the skill states the no-reuse rule but no numeric range — proto's own reserved ranges are outside the skill and are not imported); a minimum TLS version or cipher rule for mTLS (the skill requires mTLS with per-service identities, and states no version); and a streaming-mode vocabulary (the skill names unary vs server/client/bidi streaming, but only the exact value `unary` gates the bounded-stream check — any other declared non-empty mode string is treated as a streaming mode rather than failed against a vocabulary the atom would have to enforce beyond the skill's gating use). Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** gRPC service design record: a verdict of `GRPC_SERVICE_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares deadlines on every method, mTLS on cross-host paths, and contract tests passing passes those checks even if the real service does none of it. It is a completeness and consistency audit of the record the skill requires, **not a gRPC engineering service or a live posture certification**. Specifically: it performs no service design, reads no .proto file, runs no buf lint or breaking-change check, generates no stubs, probes no live server, and does not verify that a declared control actually works. It never judges whether a streaming mode is the right choice for a flow, whether a declared deadline is long enough, whether mTLS identities are correctly scoped, or whether a declared error model is well designed — only that the record contains what the skill's sections and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no .proto, code or repository inspection (hand-generated stubs and field-number reuse of retired numbers are caller declarations, the atom reads no proto file and no repo — the duplicate-number check catches only reuse visible inside the declared field list itself); no CI inspection (buf lint, breaking-change and codegen-in-CI are declared, their real pipeline state is not read); API-shape judgment (which streaming mode a method *should* use, whether an error detail type is the right one) is a caller declaration — the atom checks only that the choice is declared per method and that no streaming method is declared unbounded, never which mode a method ought to use; the skill's cross-reference to a sibling discipline (`policy-as-code` for the external authorization policy) is carried as the caller's own attestation in this record, not re-audited here.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Conduit agent infrastructure service builds (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulator view: N/A — this atom audits a declared gRPC service design record; its verdict is a completeness and consistency judgment on the declared evidence, not compliance or audit evidence and not a live posture certification (SERVICE.md states this explicitly), and gRPC API design is not a regulated domain. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `grpc_service_design` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/grpc_service_design.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_grpc_service_design.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/grpc-service-design` (REST) and `POST /mcp/grpc-service-design` (MCP, tool `grpc_service_design`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `grpc_service_design`. Rate limits: 60/minute, 10,000/day per key per atom (429 `rate_limit`, not metered). Error monitoring: watch 401 `unauthorized` (key problems), 403 `scope_required` (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, one-week RC soak to 2026-11-22; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T05:39:23.861847+00:00 against gateway v1.1.0, external verification lane, source `verification/work/grpc-service-design/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Input:

```json
{
  "project": "test-service",
  "contract": {
    "proto3_used": true,
    "removed_fields_reserved": true,
    "backward_forward_compatibility_rules_documented": true,
    "buf_lint_in_ci": true,
    "breaking_change_check_in_ci": true,
    "codegen_pinned": true,
    "codegen_generated_in_ci": true,
    "hand_generated_stubs_present": false,
    "field_number_reuse_present": false
  },
  "proto_fields": [
    {
      "message": "User",
      "name": "id",
      "number": 1
    },
    {
      "message": "User",
      "name": "name",
      "number": 2
    }
  ],
  "api_shape": {
    "streaming_choices_documented_by_flow": true,
    "cancellation_propagation_configured": true,
    "rich_error_model_used": true,
    "metadata_limited_to_transport_concerns": true
  },
  "methods": [
    {
      "name": "GetUser",
      "streaming_mode": "unary",
      "deadline_set": true
    }
  ],
  "server": {
    "health_service_exposed": true,
    "reflection_enabled": false,
    "interceptors_for_auth_logging_metrics_tracing": true,
    "keepalive_and_pool_tuning_configured": true,
    "explicit_max_message_sizes_set": true
  },
  "security": {
    "cross_host_traffic_present": false,
    "authorization_via_interceptor_or_external_policy": true,
    "public_surfaces_present": false
  },
  "observability": {
    "trace_and_request_id_propagation_configured": true,
    "per_method_metrics_collected": true,
    "structured_errors_logged_once": true
  },
  "testing": {
    "in_process_integration_tests_present": true,
    "contract_tests_pass_against_clients": true,
    "load_smoke_on_hot_paths_run": true
  },
  "interop": {
    "rest_consumers_present": false,
    "browser_clients_present": false,
    "packages_versioned_v1": true,
    "deprecated_fields_announced_then_removed_on_schedule": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "grpc-service-design",
  "atom_version": "0.1.0",
  "project": "test-service",
  "verdict": "GRPC_SERVICE_SOUND",
  "sections": {
    "contract_and_compatibility": "pass",
    "api_shape_and_deadlines": "pass",
    "server_hygiene": "pass",
    "security_and_transport": "pass",
    "observability_testing_and_interop": "pass"
  },
  "checks": [
    {
      "section": "contract_and_compatibility",
      "check": "proto3_used",
      "status": "pass",
      "evidence": "contract first: the contract is proto3"
    },
    {
      "section": "contract_and_compatibility",
      "check": "removed_fields_reserved",
      "status": "pass",
      "evidence": "quality gate: removed fields are reserved — their numbers and names are never recycled"
    },
    {
      "section": "contract_and_compatibility",
      "check": "backward_forward_compatibility_rules_documented",
      "status": "pass",
      "evidence": "contract first: backward/forward compatibility rules are documented"
    },
    {
      "section": "contract_and_compatibility",
      "check": "buf_lint_in_ci",
      "status": "pass",
      "evidence": "contract first: buf lint runs in CI"
    },
    {
      "section": "contract_and_compatibility",
      "check": "breaking_change_check_in_ci",
      "status": "pass",
      "evidence": "quality gate: the breaking-change check is green in CI"
    },
    {
      "section": "contract_and_compatibility",
      "check": "codegen_pinned",
      "status": "pass",
      "evidence": "contract first: codegen is pinned"
    },
    {
      "section": "contract_and_compatibility",
      "check": "codegen_generated_in_ci",
      "status": "pass",
      "evidence": "contract first: stubs are generated in CI, not by hand"
    },
    {
      "section": "contract_and_compatibility",
      "check": "no_hand_generated_stubs",
      "status": "pass",
      "evidence": "red line: no hand-generated stubs"
    },
    {
      "section": "contract_and_compatibility",
      "check": "no_field_number_reuse",
      "status": "pass",
      "evidence": "red line: proto field numbers are never reused, including numbers of removed fields"
    },
    {
      "section": "contract_and_compatibility",
      "check": "proto_fields_declared",
      "status": "pass",
      "evidence": "contract first: the declared record names its proto fields — the proto_fields list is present and non-empty"
    },
    {
      "section": "contract_and_compatibility",
      "check": "no_duplicate_field_number_within_message",
      "status": "pass",
      "evidence": "red line: no two declared fields in the same message share a field number — a shared number is a reuse on the declared evidence"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "streaming_choices_documented_by_flow",
      "status": "pass",
      "evidence": "API shape: unary vs server/client/bidi streaming is chosen by flow for each method"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "methods_declared",
      "status": "pass",
      "evidence": "API shape: the declared record names its methods — the methods list is present and non-empty"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "every_method_names_streaming_mode",
      "status": "pass",
      "evidence": "API shape: every declared method row names its streaming mode — a non-empty streaming_mode string"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "every_method_has_deadline",
      "status": "pass",
      "evidence": "quality gate: every declared method row declares a deadline set — deadlines on every call"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "every_streaming_method_bounded",
      "status": "pass",
      "evidence": "red line: no unbounded streams — every streaming method row declares its stream bounded"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "cancellation_propagation_configured",
      "status": "pass",
      "evidence": "quality gate: cancellation propagation is configured alongside deadlines"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "rich_error_model_used",
      "status": "pass",
      "evidence": "API shape: a rich error model is used — status codes plus typed details"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "metadata_limited_to_transport_concerns",
      "status": "pass",
      "evidence": "API shape: metadata is kept for transport concerns"
    },
    {
      "section": "server_hygiene",
      "check": "health_service_exposed",
      "status": "pass",
      "evidence": "quality gate: the grpc.health.v1 health service is exposed"
    },
    {
      "section": "server_hygiene",
      "check": "reflection_restricted_to_dev_or_authenticated",
      "status": "pass",
      "evidence": "reflection not enabled"
    },
    {
      "section": "server_hygiene",
      "check": "interceptors_for_auth_logging_metrics_tracing",
      "status": "pass",
      "evidence": "server hygiene: interceptors cover auth, logging, metrics and tracing"
    },
    {
      "section": "server_hygiene",
      "check": "keepalive_and_pool_tuning_configured",
      "status": "pass",
      "evidence": "server hygiene: keepalive and pool tuning are configured"
    },
    {
      "section": "server_hygiene",
      "check": "explicit_max_message_sizes_set",
      "status": "pass",
      "evidence": "server hygiene: max message sizes are explicit"
    },
    {
      "section": "security_and_transport",
      "check": "mtls_on_cross_host_paths",
      "status": "pass",
      "evidence": "no cross-host traffic declared"
    },
    {
      "section": "security_and_transport",
      "check": "per_service_identities_used",
      "status": "pass",
      "evidence": "no cross-host traffic declared"
    },
    {
      "section": "security_and_transport",
      "check": "no_plaintext_across_hosts",
      "status": "pass",
      "evidence": "no cross-host traffic declared"
    },
    {
      "section": "security_and_transport",
      "check": "authorization_via_interceptor_or_external_policy",
      "status": "pass",
      "evidence": "quality gate: authorization runs via an interceptor or an external policy (policy-as-code)"
    },
    {
      "section": "security_and_transport",
      "check": "rate_limits_on_public_surfaces",
      "status": "pass",
      "evidence": "no public surfaces declared"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "trace_and_request_id_propagation_configured",
      "status": "pass",
      "evidence": "observability: trace and request-id propagation are configured"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "per_method_metrics_collected",
      "status": "pass",
      "evidence": "observability: per-method metrics are collected"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "structured_errors_logged_once",
      "status": "pass",
      "evidence": "observability: structured errors are logged once"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "in_process_integration_tests_present",
      "status": "pass",
      "evidence": "testing: in-process integration tests (bufconn-style) are present"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "contract_tests_pass_against_clients",
      "status": "pass",
      "evidence": "quality gate: contract tests pass against real clients"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "load_smoke_on_hot_paths_run",
      "status": "pass",
      "evidence": "testing: load smoke runs on hot paths"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "gateway_json_adapters_for_rest_consumers",
      "status": "pass",
      "evidence": "no REST consumers declared"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "grpc_web_where_browsers_connect",
      "status": "pass",
      "evidence": "no browser clients declared"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "packages_versioned_v1",
      "status": "pass",
      "evidence": "interop & versioning: packages carry v1 versions"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "deprecated_fields_announced_then_removed_on_schedule",
      "status": "pass",
      "evidence": "interop & versioning: deprecated fields are announced, then removed on schedule"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "methods_count": 1,
  "proto_fields_count": 2,
  "methods_without_streaming_mode": [],
  "methods_without_deadline": [],
  "unbounded_streaming_methods": [],
  "fields_sharing_a_duplicate_number": [],
  "deadline_coverage": "1.000000",
  "streaming_boundedness_coverage": null,
  "summary": "39 pass, 0 fail, 0 missing of 39 checks across five sections.",
  "stamp": "GRPC SERVICE DESIGN\nproject: test-service\nVERDICT: GRPC_SERVICE_SOUND\n  contract_and_compatibility           pass\n  api_shape_and_deadlines              pass\n  server_hygiene                       pass\n  security_and_transport               pass\n  observability_testing_and_interop    pass\n39 pass, 0 fail, 0 missing of 39 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Input:

```json
{
  "project": "test-service",
  "contract": {
    "proto3_used": true,
    "removed_fields_reserved": true,
    "backward_forward_compatibility_rules_documented": true,
    "buf_lint_in_ci": true,
    "breaking_change_check_in_ci": true,
    "codegen_pinned": true,
    "codegen_generated_in_ci": true,
    "hand_generated_stubs_present": true,
    "field_number_reuse_present": true
  },
  "proto_fields": [
    {
      "message": "User",
      "name": "id",
      "number": 1
    },
    {
      "message": "User",
      "name": "name",
      "number": 1
    }
  ],
  "api_shape": {
    "streaming_choices_documented_by_flow": true,
    "cancellation_propagation_configured": true,
    "rich_error_model_used": true,
    "metadata_limited_to_transport_concerns": true
  },
  "methods": [
    {
      "name": "GetUser",
      "streaming_mode": "server",
      "deadline_set": false,
      "stream_bounded": false
    }
  ],
  "server": {
    "health_service_exposed": true,
    "reflection_enabled": false,
    "interceptors_for_auth_logging_metrics_tracing": true,
    "keepalive_and_pool_tuning_configured": true,
    "explicit_max_message_sizes_set": true
  },
  "security": {
    "cross_host_traffic_present": false,
    "authorization_via_interceptor_or_external_policy": true,
    "public_surfaces_present": false
  },
  "observability": {
    "trace_and_request_id_propagation_configured": true,
    "per_method_metrics_collected": true,
    "structured_errors_logged_once": true
  },
  "testing": {
    "in_process_integration_tests_present": true,
    "contract_tests_pass_against_clients": true,
    "load_smoke_on_hot_paths_run": true
  },
  "interop": {
    "rest_consumers_present": false,
    "browser_clients_present": false,
    "packages_versioned_v1": true,
    "deprecated_fields_announced_then_removed_on_schedule": true
  }
}
```

Response (HTTP 200):

```json
{
  "service": "grpc-service-design",
  "atom_version": "0.1.0",
  "project": "test-service",
  "verdict": "GRPC_SERVICE_NOT_SOUND",
  "sections": {
    "contract_and_compatibility": "fail",
    "api_shape_and_deadlines": "fail",
    "server_hygiene": "pass",
    "security_and_transport": "pass",
    "observability_testing_and_interop": "pass"
  },
  "checks": [
    {
      "section": "contract_and_compatibility",
      "check": "proto3_used",
      "status": "pass",
      "evidence": "contract first: the contract is proto3"
    },
    {
      "section": "contract_and_compatibility",
      "check": "removed_fields_reserved",
      "status": "pass",
      "evidence": "quality gate: removed fields are reserved — their numbers and names are never recycled"
    },
    {
      "section": "contract_and_compatibility",
      "check": "backward_forward_compatibility_rules_documented",
      "status": "pass",
      "evidence": "contract first: backward/forward compatibility rules are documented"
    },
    {
      "section": "contract_and_compatibility",
      "check": "buf_lint_in_ci",
      "status": "pass",
      "evidence": "contract first: buf lint runs in CI"
    },
    {
      "section": "contract_and_compatibility",
      "check": "breaking_change_check_in_ci",
      "status": "pass",
      "evidence": "quality gate: the breaking-change check is green in CI"
    },
    {
      "section": "contract_and_compatibility",
      "check": "codegen_pinned",
      "status": "pass",
      "evidence": "contract first: codegen is pinned"
    },
    {
      "section": "contract_and_compatibility",
      "check": "codegen_generated_in_ci",
      "status": "pass",
      "evidence": "contract first: stubs are generated in CI, not by hand"
    },
    {
      "section": "contract_and_compatibility",
      "check": "no_hand_generated_stubs",
      "status": "fail",
      "evidence": "red line: no hand-generated stubs"
    },
    {
      "section": "contract_and_compatibility",
      "check": "no_field_number_reuse",
      "status": "fail",
      "evidence": "red line: proto field numbers are never reused, including numbers of removed fields"
    },
    {
      "section": "contract_and_compatibility",
      "check": "proto_fields_declared",
      "status": "pass",
      "evidence": "contract first: the declared record names its proto fields — the proto_fields list is present and non-empty"
    },
    {
      "section": "contract_and_compatibility",
      "check": "no_duplicate_field_number_within_message",
      "status": "fail",
      "evidence": "red line: no two declared fields in the same message share a field number — a shared number is a reuse on the declared evidence"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "streaming_choices_documented_by_flow",
      "status": "pass",
      "evidence": "API shape: unary vs server/client/bidi streaming is chosen by flow for each method"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "methods_declared",
      "status": "pass",
      "evidence": "API shape: the declared record names its methods — the methods list is present and non-empty"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "every_method_names_streaming_mode",
      "status": "pass",
      "evidence": "API shape: every declared method row names its streaming mode — a non-empty streaming_mode string"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "every_method_has_deadline",
      "status": "fail",
      "evidence": "quality gate: every declared method row declares a deadline set — deadlines on every call"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "every_streaming_method_bounded",
      "status": "fail",
      "evidence": "red line: no unbounded streams — every streaming method row declares its stream bounded"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "cancellation_propagation_configured",
      "status": "pass",
      "evidence": "quality gate: cancellation propagation is configured alongside deadlines"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "rich_error_model_used",
      "status": "pass",
      "evidence": "API shape: a rich error model is used — status codes plus typed details"
    },
    {
      "section": "api_shape_and_deadlines",
      "check": "metadata_limited_to_transport_concerns",
      "status": "pass",
      "evidence": "API shape: metadata is kept for transport concerns"
    },
    {
      "section": "server_hygiene",
      "check": "health_service_exposed",
      "status": "pass",
      "evidence": "quality gate: the grpc.health.v1 health service is exposed"
    },
    {
      "section": "server_hygiene",
      "check": "reflection_restricted_to_dev_or_authenticated",
      "status": "pass",
      "evidence": "reflection not enabled"
    },
    {
      "section": "server_hygiene",
      "check": "interceptors_for_auth_logging_metrics_tracing",
      "status": "pass",
      "evidence": "server hygiene: interceptors cover auth, logging, metrics and tracing"
    },
    {
      "section": "server_hygiene",
      "check": "keepalive_and_pool_tuning_configured",
      "status": "pass",
      "evidence": "server hygiene: keepalive and pool tuning are configured"
    },
    {
      "section": "server_hygiene",
      "check": "explicit_max_message_sizes_set",
      "status": "pass",
      "evidence": "server hygiene: max message sizes are explicit"
    },
    {
      "section": "security_and_transport",
      "check": "mtls_on_cross_host_paths",
      "status": "pass",
      "evidence": "no cross-host traffic declared"
    },
    {
      "section": "security_and_transport",
      "check": "per_service_identities_used",
      "status": "pass",
      "evidence": "no cross-host traffic declared"
    },
    {
      "section": "security_and_transport",
      "check": "no_plaintext_across_hosts",
      "status": "pass",
      "evidence": "no cross-host traffic declared"
    },
    {
      "section": "security_and_transport",
      "check": "authorization_via_interceptor_or_external_policy",
      "status": "pass",
      "evidence": "quality gate: authorization runs via an interceptor or an external policy (policy-as-code)"
    },
    {
      "section": "security_and_transport",
      "check": "rate_limits_on_public_surfaces",
      "status": "pass",
      "evidence": "no public surfaces declared"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "trace_and_request_id_propagation_configured",
      "status": "pass",
      "evidence": "observability: trace and request-id propagation are configured"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "per_method_metrics_collected",
      "status": "pass",
      "evidence": "observability: per-method metrics are collected"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "structured_errors_logged_once",
      "status": "pass",
      "evidence": "observability: structured errors are logged once"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "in_process_integration_tests_present",
      "status": "pass",
      "evidence": "testing: in-process integration tests (bufconn-style) are present"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "contract_tests_pass_against_clients",
      "status": "pass",
      "evidence": "quality gate: contract tests pass against real clients"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "load_smoke_on_hot_paths_run",
      "status": "pass",
      "evidence": "testing: load smoke runs on hot paths"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "gateway_json_adapters_for_rest_consumers",
      "status": "pass",
      "evidence": "no REST consumers declared"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "grpc_web_where_browsers_connect",
      "status": "pass",
      "evidence": "no browser clients declared"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "packages_versioned_v1",
      "status": "pass",
      "evidence": "interop & versioning: packages carry v1 versions"
    },
    {
      "section": "observability_testing_and_interop",
      "check": "deprecated_fields_announced_then_removed_on_schedule",
      "status": "pass",
      "evidence": "interop & versioning: deprecated fields are announced, then removed on schedule"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "methods_count": 1,
  "proto_fields_count": 2,
  "methods_without_streaming_mode": [],
  "methods_without_deadline": [
    "GetUser"
  ],
  "unbounded_streaming_methods": [
    "GetUser"
  ],
  "fields_sharing_a_duplicate_number": [
    "id",
    "name"
  ],
  "deadline_coverage": "0.000000",
  "streaming_boundedness_coverage": "0.000000",
  "summary": "34 pass, 5 fail, 0 missing of 39 checks across five sections.",
  "stamp": "GRPC SERVICE DESIGN\nproject: test-service\nVERDICT: GRPC_SERVICE_NOT_SOUND\n  contract_and_compatibility           fail\n  api_shape_and_deadlines              fail\n  server_hygiene                       pass\n  security_and_transport               pass\n  observability_testing_and_interop    pass\n34 pass, 5 fail, 0 missing of 39 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Input:

```json
{
  "project": "malformed-service",
  "contract": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "contract",
  "detail": "contract must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — N/A — this atom audits a declared gRPC service design record; its verdict is a completeness and consistency judgment, not compliance or audit evidence and not a live posture certification, and gRPC API design is not a regulated domain. |
| Checks named | 39 documented / 39 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`) |
| Input reference typed | Yes — 57 fields, each with its type from SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/grpc-service-design/evidence.json` |
