# Grpc service design — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are building a gRPC service — protobuf contracts, streaming, deadlines, health, mTLS, breaking-change checks — and you have a record of how that service was designed. This atom reads one declared manifest and returns one deterministic verdict across five sections: **GRPC_SERVICE_SOUND**, **GRPC_SERVICE_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it performs no service design, reads no .proto file, runs no buf lint or breaking-change check, generates no stubs, probes no live server, and does not verify that a declared control actually works. A design is sound *on your declared evidence*: it never judges whether a streaming mode is the right choice for a flow, whether a declared deadline is long enough, whether mTLS identities are correctly scoped, or whether a declared error model is well designed. Computed checks: the declared `methods` list must be present and non-empty, every method must name a non-empty `streaming_mode` and declare a deadline set, and every non-`unary` method must declare its stream bounded; the declared `proto_fields` list must be present and non-empty, and no two fields in the same declared `message` may share a `number`. Five check groups are conditional: reflection restriction is required only when `server.reflection_enabled` is `true`; mTLS, per-service identities and the no-plaintext rule are required only when `security.cross_host_traffic_present` is `true`; rate limits only when `security.public_surfaces_present` is `true`; gateway/JSON adapters only when `interop.rest_consumers_present` is `true`; and gRPC-Web only when `interop.browser_clients_present` is `true` — otherwise those checks pass as not applicable. No numeric threshold is imposed — no deadline duration, no max message size, no keepalive interval, no rate-limit number, no coverage percentage below completeness, and no streaming-mode vocabulary beyond the exact `unary` gate on the bounded-stream check. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "grpc-service-design"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/grpc-service-design` — tool name `grpc_service_design`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/grpc-service-design` — body = the manifest object; same `Authorization` header.

## Input — the grpc-service-design manifest

| Field | Meaning |
|---|---|
| `project` | project name (string; carried into the output, not checked) |
| `contract.proto3_used` | contract evidence: the contract is proto3 |
| `contract.removed_fields_reserved` | contract evidence: removed fields are reserved — their numbers and names are never recycled |
| `contract.backward_forward_compatibility_rules_documented` | contract evidence: backward/forward compatibility rules are documented |
| `contract.buf_lint_in_ci` | contract evidence: buf lint runs in CI |
| `contract.breaking_change_check_in_ci` | contract evidence: the breaking-change check is green in CI |
| `contract.codegen_pinned` | contract evidence: codegen is pinned |
| `contract.codegen_generated_in_ci` | contract evidence: stubs are generated in CI, not by hand |
| `contract.hand_generated_stubs_present` | must be `false` to pass (red line: no hand-generated stubs) |
| `contract.field_number_reuse_present` | must be `false` to pass (red line: proto field numbers are never reused) |
| `proto_fields` (list of field-row objects) | computed: must be present and non-empty; reported as `proto_fields_count` |
| `proto_fields[].message` (string) | groups the row for the duplicate-number check |
| `proto_fields[].name` (string) | names the row in the computed outputs |
| `proto_fields[].number` (number) | computed: compared for equality within the same declared message; two rows in one message sharing a number are reported in `fields_sharing_a_duplicate_number` (the same number in different messages is not a reuse) |
| `api_shape.streaming_choices_documented_by_flow` | API-shape evidence: unary vs server/client/bidi streaming is chosen by flow for each method |
| `methods` (list of method-row objects) | computed: must be present and non-empty; reported as `methods_count` |
| `methods[].name` (string) | names the row in the computed outputs |
| `methods[].streaming_mode` (string) | computed: every row must name a non-empty string; the exact value `unary` gates the bounded-stream check below, no other value is imposed |
| `methods[].deadline_set` | computed: every row must declare `true` (deadlines on every call); rows with the field present but not `true` are reported in `methods_without_deadline` |
| `methods[].stream_bounded` | computed: required `true` when the row's streaming mode is not `unary`; otherwise passes as not applicable to that row; streaming rows with the field present but not `true` are reported in `unbounded_streaming_methods` |
| `api_shape.cancellation_propagation_configured` | API-shape evidence: cancellation propagation is configured alongside deadlines |
| `api_shape.rich_error_model_used` | API-shape evidence: a rich error model is used — status codes plus typed details |
| `api_shape.metadata_limited_to_transport_concerns` | API-shape evidence: metadata is kept for transport concerns |
| `server.health_service_exposed` | server evidence: the grpc.health.v1 health service is exposed |
| `server.reflection_enabled` | gate: declares whether reflection is enabled |
| `server.reflection_restricted_to_dev_or_authenticated` | required `true` only when `server.reflection_enabled` is `true`; otherwise passes as not applicable |
| `server.interceptors_for_auth_logging_metrics_tracing` | server evidence: interceptors cover auth, logging, metrics and tracing |
| `server.keepalive_and_pool_tuning_configured` | server evidence: keepalive and pool tuning are configured |
| `server.explicit_max_message_sizes_set` | server evidence: max message sizes are explicit |
| `security.cross_host_traffic_present` | gate: declares whether cross-host traffic is present |
| `security.mtls_enabled` | required `true` only when `security.cross_host_traffic_present` is `true`; otherwise passes as not applicable |
| `security.per_service_identities_used` | required `true` only when cross-host traffic is declared present; otherwise passes as not applicable |
| `security.plaintext_across_hosts_present` | must be `false` when cross-host traffic is declared present (red line: no plaintext gRPC across hosts); otherwise passes as not applicable |
| `security.authorization_via_interceptor_or_external_policy` | security evidence: authorization runs via an interceptor or an external policy |
| `security.public_surfaces_present` | gate: declares whether public surfaces are present |
| `security.rate_limits_on_public_surfaces` | required `true` only when `security.public_surfaces_present` is `true`; otherwise passes as not applicable |
| `observability.trace_and_request_id_propagation_configured` | observability evidence: trace and request-id propagation are configured |
| `observability.per_method_metrics_collected` | observability evidence: per-method metrics are collected |
| `observability.structured_errors_logged_once` | observability evidence: structured errors are logged once |
| `testing.in_process_integration_tests_present` | testing evidence: in-process integration tests are present |
| `testing.contract_tests_pass_against_clients` | testing evidence: contract tests pass against real clients |
| `testing.load_smoke_on_hot_paths_run` | testing evidence: load smoke runs on hot paths |
| `interop.rest_consumers_present` | gate: declares whether REST consumers are present |
| `interop.gateway_json_adapters_provided` | required `true` only when `interop.rest_consumers_present` is `true`; otherwise passes as not applicable |
| `interop.browser_clients_present` | gate: declares whether browser clients are present |
| `interop.grpc_web_enabled` | required `true` only when `interop.browser_clients_present` is `true`; otherwise passes as not applicable |
| `interop.packages_versioned_v1` | interop evidence: packages carry v1 versions |
| `interop.deprecated_fields_announced_then_removed_on_schedule` | interop evidence: deprecated fields are announced, then removed on schedule |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward GRPC_SERVICE_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/grpc-service-design`:

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

Response — HTTP 200 (trimmed; the full response carries all 39 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "methods_count": 1,
  "proto_fields_count": 2,
  "methods_without_streaming_mode": [],
  "methods_without_deadline": [],
  "unbounded_streaming_methods": [],
  "fields_sharing_a_duplicate_number": [],
  "deadline_coverage": "1.000000",
  "streaming_boundedness_coverage": null,
  "summary": "39 pass, 0 fail, 0 missing of 39 checks across five sections."
}
```

## Verdicts

- **GRPC_SERVICE_SOUND** — every check passes; the declared gRPC service design record is complete and consistent with the skill's checklist and red lines.
- **GRPC_SERVICE_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `methods_count` and `proto_fields_count` (the declared list lengths as integers, or null when a list is not declared), the row-name lists `methods_without_streaming_mode`, `methods_without_deadline` (methods whose `deadline_set` field is present but not `true`; a method with the field absent is missing evidence and does not appear), `unbounded_streaming_methods` (streaming methods whose `stream_bounded` field is present but not `true`) and `fields_sharing_a_duplicate_number` (fields whose declared message + number pair is shared by another declared field; all four lists are null when their list is not declared), the coverage values `deadline_coverage` (methods declaring a deadline set ÷ declared methods) and `streaming_boundedness_coverage` (streaming methods declaring their stream bounded ÷ streaming methods) as strings with exactly six decimal places (a ratio is null when its denominator list is absent or empty, and `streaming_boundedness_coverage` is also null when no method is declared with a non-`unary` streaming mode), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the six primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
