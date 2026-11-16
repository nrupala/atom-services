# Grpc service design — `grpc-service-design`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build gRPC services well — protobuf contracts, streaming, deadlines, health, mTLS, breaking-change checks.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Conduit agent infrastructure service builds**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the gRPC service design manifest

The caller submits one JSON manifest: a declared gRPC service
design record for one project. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`GRPC_SERVICE_NOT_SOUND`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `project` (string; carried into the verdict output, not itself checked) | — |
| `contract.proto3_used` (boolean) | contract_and_compatibility |
| `contract.removed_fields_reserved` (boolean) | contract_and_compatibility |
| `contract.backward_forward_compatibility_rules_documented` (boolean) | contract_and_compatibility |
| `contract.buf_lint_in_ci` (boolean) | contract_and_compatibility |
| `contract.breaking_change_check_in_ci` (boolean) | contract_and_compatibility |
| `contract.codegen_pinned` (boolean) | contract_and_compatibility |
| `contract.codegen_generated_in_ci` (boolean) | contract_and_compatibility |
| `contract.hand_generated_stubs_present` (boolean; must be `false` to pass — skill red line) | contract_and_compatibility |
| `contract.field_number_reuse_present` (boolean; must be `false` to pass — skill red line) | contract_and_compatibility |
| `proto_fields` (list of field-row objects, each with the entry fields below; computed, see below) | contract_and_compatibility |
| `proto_fields[].message` (string; groups the row for the duplicate-number check below) | contract_and_compatibility |
| `proto_fields[].name` (string; names the row in the computed outputs) | contract_and_compatibility |
| `proto_fields[].number` (number; compared for equality within the same declared message for the duplicate-number check below) | contract_and_compatibility |
| `api_shape.streaming_choices_documented_by_flow` (boolean) | api_shape_and_deadlines |
| `methods` (list of method-row objects, each with the entry fields below; computed, see below) | api_shape_and_deadlines |
| `methods[].name` (string; names the row in the computed outputs) | api_shape_and_deadlines |
| `methods[].streaming_mode` (string; must be a non-empty string for the row to pass the computed mode check; the exact value `unary` gates the bounded-stream check below, no other value is imposed, see the declined vocabulary note below) | api_shape_and_deadlines |
| `methods[].deadline_set` (boolean) | api_shape_and_deadlines |
| `methods[].stream_bounded` (boolean; required when the row's streaming mode is not `unary`; otherwise the check passes as not applicable to that row) | api_shape_and_deadlines |
| `api_shape.cancellation_propagation_configured` (boolean) | api_shape_and_deadlines |
| `api_shape.rich_error_model_used` (boolean) | api_shape_and_deadlines |
| `api_shape.metadata_limited_to_transport_concerns` (boolean) | api_shape_and_deadlines |
| `server.health_service_exposed` (boolean) | server_hygiene |
| `server.reflection_enabled` (boolean; gates the reflection-restriction check below) | server_hygiene |
| `server.reflection_restricted_to_dev_or_authenticated` (boolean; required when reflection is declared enabled; otherwise the check passes as not applicable) | server_hygiene |
| `server.interceptors_for_auth_logging_metrics_tracing` (boolean) | server_hygiene |
| `server.keepalive_and_pool_tuning_configured` (boolean) | server_hygiene |
| `server.explicit_max_message_sizes_set` (boolean) | server_hygiene |
| `security.cross_host_traffic_present` (boolean; gates the three cross-host checks below) | security_and_transport |
| `security.mtls_enabled` (boolean; required when cross-host traffic is declared present; otherwise the check passes as not applicable) | security_and_transport |
| `security.per_service_identities_used` (boolean; required when cross-host traffic is declared present; otherwise not applicable) | security_and_transport |
| `security.plaintext_across_hosts_present` (boolean; must be `false` when cross-host traffic is declared present — skill red line; otherwise the check passes as not applicable) | security_and_transport |
| `security.authorization_via_interceptor_or_external_policy` (boolean) | security_and_transport |
| `security.public_surfaces_present` (boolean; gates the rate-limit check below) | security_and_transport |
| `security.rate_limits_on_public_surfaces` (boolean; required when public surfaces are declared present; otherwise the check passes as not applicable) | security_and_transport |
| `observability.trace_and_request_id_propagation_configured` (boolean) | observability_testing_and_interop |
| `observability.per_method_metrics_collected` (boolean) | observability_testing_and_interop |
| `observability.structured_errors_logged_once` (boolean) | observability_testing_and_interop |
| `testing.in_process_integration_tests_present` (boolean) | observability_testing_and_interop |
| `testing.contract_tests_pass_against_clients` (boolean) | observability_testing_and_interop |
| `testing.load_smoke_on_hot_paths_run` (boolean) | observability_testing_and_interop |
| `interop.rest_consumers_present` (boolean; gates the gateway/JSON adapter check below) | observability_testing_and_interop |
| `interop.gateway_json_adapters_provided` (boolean; required when REST consumers are declared present; otherwise the check passes as not applicable) | observability_testing_and_interop |
| `interop.browser_clients_present` (boolean; gates the gRPC-Web check below) | observability_testing_and_interop |
| `interop.grpc_web_enabled` (boolean; required when browser clients are declared present; otherwise the check passes as not applicable) | observability_testing_and_interop |
| `interop.packages_versioned_v1` (boolean) | observability_testing_and_interop |
| `interop.deprecated_fields_announced_then_removed_on_schedule` (boolean) | observability_testing_and_interop |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Methods declared:** the declared `methods` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **Streaming mode per method:** every declared method row must
  name a non-empty `streaming_mode` string. A row with the field
  absent is missing evidence; a row naming an empty string fails.
- **Deadline per method:** every declared method row must declare
  `deadline_set: true` (the skill's quality gate: "Deadlines/
  cancellation on all calls").
- **Bounded streams:** every row whose declared streaming mode
  is not exactly `unary` must declare `stream_bounded: true`
  (the skill's red line: "no unbounded streams"). A streaming
  row with the field absent is missing evidence; unary rows pass
  as not applicable.
- **Proto fields declared:** the declared `proto_fields` list
  passes only when it is present and non-empty; an absent list
  is missing evidence, an empty list fails.
- **No duplicate field number within a message:** no two rows
  in the same declared `message` may share a `number` (the
  skill's red line: "Never reuse proto field numbers" — a number
  appearing twice in one message is a reuse on the declared
  evidence itself). The same number in different messages is not
  a reuse. A row with `message` or `number` absent is missing
  evidence.

Five check groups are conditional, following the skill's own
scoping — computed from the declared gate field:

- **Reflection restriction:** required only when
  `server.reflection_enabled` is declared `true` (the skill:
  "reflection only in dev (or authenticated)"); when reflection
  is not enabled, the check passes as not applicable.
- **Cross-host security:** `mtls_enabled`,
  `per_service_identities_used` and the no-plaintext rule are
  required only when `security.cross_host_traffic_present` is
  declared `true` (the skill binds mTLS and the plaintext ban to
  cross-host paths); otherwise all three pass as not applicable.
- **Public-surface rate limits:** required only when
  `security.public_surfaces_present` is declared `true` (the
  skill: "rate limits on public-ish surfaces").
- **Gateway/JSON adapters:** required only when
  `interop.rest_consumers_present` is declared `true`.
- **gRPC-Web:** required only when
  `interop.browser_clients_present` is declared `true` (the
  skill: "gRPC-Web where browsers must connect").

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the six primary computed checks above cannot be completed),
`methods_count` and `proto_fields_count` (the declared list
lengths, or null when a list is not declared — counts are
reported as integers, exactly), the row-name lists
`methods_without_streaming_mode`, `methods_without_deadline`
(methods whose `deadline_set` field is present but not true; a
method with the field absent is missing evidence and does not
appear), `unbounded_streaming_methods` (streaming methods whose
`stream_bounded` field is present but not true) and
`fields_sharing_a_duplicate_number` (fields whose declared
message + number pair is shared by another declared field; all
four lists are null when their list is not declared), and the
two coverage ratios `deadline_coverage` (methods declaring a
deadline set ÷ declared methods) and
`streaming_boundedness_coverage` (streaming methods declaring
their stream bounded ÷ streaming methods).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty (and, for streaming
boundedness coverage, when no method is declared with a
non-`unary` streaming mode). That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.

The skill states no numeric pass/fail threshold — no deadline
duration, no max message size, no keepalive interval, no
rate-limit number, no coverage percentage: its deadline, message
size and tuning requirements are facts the record attests to
setting, not bars the atom can set. Quantities are computed and
reported; the only bar on the computed rows is completeness over
the caller's own declared rows, exactly as stated above. Declined
thresholds, named: a deadline duration in milliseconds or seconds
(the skill says "deadlines on every call" but states no duration
— caller attestation only); a max message size in bytes (the
skill says sizes are "explicit" but states no number); a
keepalive interval or connection-pool size; a stream bound or
flow-control window size (boundedness is attested per method, no
bound value is stated); a rate-limit threshold for public
surfaces; a load-smoke throughput or latency bar; a coverage
percentage below completeness; a field-number range or reserved
range (the skill states the no-reuse rule but no numeric range —
proto's own reserved ranges are outside the skill and are not
imported); a minimum TLS version or cipher rule for mTLS (the
skill requires mTLS with per-service identities, and states no
version); a streaming-mode vocabulary (the skill names unary vs
server/client/bidi streaming, but only the exact value `unary`
gates the bounded-stream check — any other declared non-empty
mode string is treated as a streaming mode rather than failed
against a vocabulary the atom would have to enforce beyond the
skill's gating use).

The verdict is one of `GRPC_SERVICE_SOUND` (all 39 checks pass),
`GRPC_SERVICE_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across five sections: contract_and_compatibility,
api_shape_and_deadlines, server_hygiene, security_and_transport,
observability_testing_and_interop.

## Honest scoping

This atom audits a **declared** gRPC service design record — it
performs no service design, reads no .proto file, runs no buf
lint or breaking-change check, generates no stubs, probes no
live server, and does not verify that a declared control
actually works. A design is sound *on the caller's declared
evidence*: a manifest that declares deadlines on every method,
mTLS on cross-host paths, and contract tests passing passes
those checks even if the real service does none of it. It is a
completeness and consistency audit of the record the skill
requires, **not a gRPC engineering service or a live posture
certification**: it never judges whether a streaming mode is the
right choice for a flow, whether a declared deadline is long
enough, whether mTLS identities are correctly scoped, or whether
a declared error model is well designed — only that the record
contains what the skill's sections and red lines demand, and
that its declared rows are internally consistent.

Named exclusions: no numeric thresholds beyond the skill's own
stated rules (see the declined list above); no live verification
of any declared fact; no .proto, code or repository inspection
(hand-generated stubs and field-number reuse of retired numbers
are caller declarations, the atom reads no proto file and no
repo — the duplicate-number check catches only reuse visible
inside the declared field list itself); no CI inspection (buf
lint, breaking-change and codegen-in-CI are declared, their real
pipeline state is not read); API-shape judgment (which streaming
mode a method *should* use, whether an error detail type is the
right one) is a caller declaration — the atom checks only that
the choice is declared per method and that no streaming method
is declared unbounded, never which mode a method ought to use;
the skill's cross-reference to a sibling discipline
(`policy-as-code` for the external authorization policy) is
carried as the caller's own attestation in this record, not
re-audited here.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
