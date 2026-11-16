#!/usr/bin/env python3
"""gRPC service design — deterministic core.

Built from the bound skill `grpc-service-engineering`: "Protobuf
contracts are forever: field numbers never get reused, breaking
changes get caught in CI, and every call carries a deadline."

This atom is an AUDIT of a declared gRPC service design record:
it validates the record a caller declares against the skill's
method sections — contract-first proto3, API shape, server
hygiene, security, observability, testing, interop & versioning —
plus its quality gates and red lines. It does not design a
service, read a .proto file, run buf, probe a live server, or
verify that a declared control actually works — it checks that
the record the skill requires is present and internally complete
and consistent on the declared evidence.

The caller submits a gRPC service design manifest (a dict, or
JSON on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- methods: the declared `methods` list must be non-empty, and
  every declared method row must name its streaming mode and
  declare a deadline set (the skill: "deadlines on every call");
- bounded streams: every method row whose declared streaming
  mode is not exactly `unary` must declare its stream bounded
  (the skill's red line: "no unbounded streams");
- field numbers: the declared `proto_fields` list must be
  non-empty, and no two rows in the same declared message may
  share a field number (the skill's red line: "Never reuse proto
  field numbers" — a number appearing twice in one message is a
  reuse on the declared evidence itself).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states no numeric threshold — no deadline duration, no
max message size in bytes, no keepalive interval, no rate-limit
number, no coverage percentage — so no numeric threshold check is
invented; those quantities are caller attestations, and
quantities are computed and reported, with completeness (every
declared row) as the only bar, exactly as stated above.

Verdict:
- any fail             -> GRPC_SERVICE_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> GRPC_SERVICE_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "contract_and_compatibility",
    "api_shape_and_deadlines",
    "server_hygiene",
    "security_and_transport",
    "observability_testing_and_interop",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (TypeError naming the
# field path), never evidence: F1 remedy, external verification
# Wave 1. Absent fields are not validated — absence is missing
# evidence, decided by the checks below.
MANIFEST_SPEC = {
    "project": "string",
    "contract": {
        "proto3_used": "boolean",
        "removed_fields_reserved": "boolean",
        "backward_forward_compatibility_rules_documented": "boolean",
        "buf_lint_in_ci": "boolean",
        "breaking_change_check_in_ci": "boolean",
        "codegen_pinned": "boolean",
        "codegen_generated_in_ci": "boolean",
        "hand_generated_stubs_present": "boolean",
        "field_number_reuse_present": "boolean",
    },
    "methods": [{
        "name": "string",
        "streaming_mode": "string",
        "deadline_set": "boolean",
        "stream_bounded": "boolean",
    }],
    "proto_fields": [{
        "message": "string",
        "name": "string",
        "number": "number",
    }],
    "api_shape": {
        "streaming_choices_documented_by_flow": "boolean",
        "cancellation_propagation_configured": "boolean",
        "rich_error_model_used": "boolean",
        "metadata_limited_to_transport_concerns": "boolean",
    },
    "server": {
        "health_service_exposed": "boolean",
        "reflection_enabled": "boolean",
        "reflection_restricted_to_dev_or_authenticated": "boolean",
        "interceptors_for_auth_logging_metrics_tracing": "boolean",
        "keepalive_and_pool_tuning_configured": "boolean",
        "explicit_max_message_sizes_set": "boolean",
    },
    "security": {
        "cross_host_traffic_present": "boolean",
        "mtls_enabled": "boolean",
        "per_service_identities_used": "boolean",
        "plaintext_across_hosts_present": "boolean",
        "authorization_via_interceptor_or_external_policy": "boolean",
        "public_surfaces_present": "boolean",
        "rate_limits_on_public_surfaces": "boolean",
    },
    "observability": {
        "trace_and_request_id_propagation_configured": "boolean",
        "per_method_metrics_collected": "boolean",
        "structured_errors_logged_once": "boolean",
    },
    "testing": {
        "in_process_integration_tests_present": "boolean",
        "contract_tests_pass_against_clients": "boolean",
        "load_smoke_on_hot_paths_run": "boolean",
    },
    "interop": {
        "rest_consumers_present": "boolean",
        "gateway_json_adapters_provided": "boolean",
        "browser_clients_present": "boolean",
        "grpc_web_enabled": "boolean",
        "packages_versioned_v1": "boolean",
        "deprecated_fields_announced_then_removed_on_schedule": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _gated_false_check(results, section, name, manifest, gate_path,
                       target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is False, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _nonempty_str(entry, field):
    return (
        isinstance(entry, dict)
        and isinstance(entry.get(field), str)
        and len(entry[field]) > 0
    )


def _is_streaming(entry):
    return (
        isinstance(entry, dict)
        and isinstance(entry.get("streaming_mode"), str)
        and len(entry["streaming_mode"]) > 0
        and entry["streaming_mode"] != "unary"
    )


def evaluate(manifest):
    """Return the verdict dict for a gRPC service design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    methods, has_methods = _get(manifest, "methods")
    methods_is_list = has_methods and isinstance(methods, list)
    methods_count = len(methods) if methods_is_list else None
    mrows = methods if methods_is_list else []

    methods_without_streaming_mode = (
        [_row_name(c) for c in mrows
         if not _nonempty_str(c, "streaming_mode")]
        if methods_is_list else None
    )
    methods_without_deadline = (
        [_row_name(c) for c in mrows
         if isinstance(c, dict) and "deadline_set" in c
         and c.get("deadline_set") is not True]
        if methods_is_list else None
    )
    deadline_coverage = (
        sum(1 for c in mrows
            if isinstance(c, dict)
            and c.get("deadline_set") is True) / methods_count
        if methods_is_list and methods_count > 0 else None
    )
    streaming_rows = [c for c in mrows if _is_streaming(c)]
    unbounded_streaming_methods = (
        [_row_name(c) for c in streaming_rows
         if "stream_bounded" in c
         and c.get("stream_bounded") is not True]
        if methods_is_list else None
    )
    streaming_boundedness_coverage = (
        sum(1 for c in streaming_rows
            if c.get("stream_bounded") is True) / len(streaming_rows)
        if methods_is_list and len(streaming_rows) > 0 else None
    )

    fields, has_fields = _get(manifest, "proto_fields")
    fields_is_list = has_fields and isinstance(fields, list)
    proto_fields_count = len(fields) if fields_is_list else None
    frows = fields if fields_is_list else []

    number_counts = {}
    for c in frows:
        if (isinstance(c, dict) and isinstance(c.get("message"), str)
                and "number" in c):
            key = (c["message"], c["number"])
            number_counts[key] = number_counts.get(key, 0) + 1
    duplicate_rows = [
        c for c in frows
        if isinstance(c, dict) and isinstance(c.get("message"), str)
        and "number" in c
        and number_counts.get((c["message"], c["number"]), 0) > 1
    ]
    fields_sharing_a_duplicate_number = (
        [_row_name(c) for c in duplicate_rows]
        if fields_is_list else None
    )

    # ---- Section 1: contract_and_compatibility (skill: contract
    #      first, proto3 — field numbering discipline (never reuse
    #      numbers — reserved them); backward/forward
    #      compatibility rules; buf lint + breaking-change checks
    #      in CI; codegen pinned and generated in CI, not by hand.
    #      Quality gate — breaking-change check green in CI;
    #      reserved fields for removals. Red lines — never reuse
    #      proto field numbers; no hand-generated stubs) ----
    _bool_check(results, "contract_and_compatibility",
                "proto3_used", manifest,
                ("contract", "proto3_used"),
                "contract first: the contract is proto3")
    _bool_check(results, "contract_and_compatibility",
                "removed_fields_reserved", manifest,
                ("contract", "removed_fields_reserved"),
                "quality gate: removed fields are reserved — their "
                "numbers and names are never recycled")
    _bool_check(results, "contract_and_compatibility",
                "backward_forward_compatibility_rules_documented",
                manifest,
                ("contract",
                 "backward_forward_compatibility_rules_documented"),
                "contract first: backward/forward compatibility "
                "rules are documented")
    _bool_check(results, "contract_and_compatibility",
                "buf_lint_in_ci", manifest,
                ("contract", "buf_lint_in_ci"),
                "contract first: buf lint runs in CI")
    _bool_check(results, "contract_and_compatibility",
                "breaking_change_check_in_ci", manifest,
                ("contract", "breaking_change_check_in_ci"),
                "quality gate: the breaking-change check is green "
                "in CI")
    _bool_check(results, "contract_and_compatibility",
                "codegen_pinned", manifest,
                ("contract", "codegen_pinned"),
                "contract first: codegen is pinned")
    _bool_check(results, "contract_and_compatibility",
                "codegen_generated_in_ci", manifest,
                ("contract", "codegen_generated_in_ci"),
                "contract first: stubs are generated in CI, not "
                "by hand")
    _false_check(results, "contract_and_compatibility",
                 "no_hand_generated_stubs", manifest,
                 ("contract", "hand_generated_stubs_present"),
                 "red line: no hand-generated stubs")
    _false_check(results, "contract_and_compatibility",
                 "no_field_number_reuse", manifest,
                 ("contract", "field_number_reuse_present"),
                 "red line: proto field numbers are never reused, "
                 "including numbers of removed fields")
    _check(results, "contract_and_compatibility",
           "proto_fields_declared", fields, fields_is_list,
           fields_is_list and proto_fields_count > 0,
           "contract first: the declared record names its proto "
           "fields — the proto_fields list is present and "
           "non-empty")
    duplicate_present = (
        fields_is_list
        and all(isinstance(c, dict) and "message" in c
                and "number" in c for c in frows)
    )
    _check(results, "contract_and_compatibility",
           "no_duplicate_field_number_within_message", fields,
           duplicate_present,
           fields_is_list and len(duplicate_rows) == 0,
           "red line: no two declared fields in the same message "
           "share a field number — a shared number is a reuse on "
           "the declared evidence")

    # ---- Section 2: api_shape_and_deadlines (skill: API shape —
    #      unary vs server/client/bidi streaming chosen by flow;
    #      deadlines on every call + cancellation propagation;
    #      rich error model (status codes + typed details),
    #      metadata kept for transport concerns. Quality gate —
    #      deadlines/cancellation on all calls. Red line — no
    #      unbounded streams) ----
    _bool_check(results, "api_shape_and_deadlines",
                "streaming_choices_documented_by_flow", manifest,
                ("api_shape", "streaming_choices_documented_by_flow"),
                "API shape: unary vs server/client/bidi streaming "
                "is chosen by flow for each method")
    _check(results, "api_shape_and_deadlines",
           "methods_declared", methods, methods_is_list,
           methods_is_list and methods_count > 0,
           "API shape: the declared record names its methods — "
           "the methods list is present and non-empty")
    mode_present = (
        methods_is_list
        and all(isinstance(c, dict) and "streaming_mode" in c
                for c in mrows)
    )
    _check(results, "api_shape_and_deadlines",
           "every_method_names_streaming_mode", methods,
           mode_present,
           methods_is_list and methods_count > 0
           and len(methods_without_streaming_mode) == 0,
           "API shape: every declared method row names its "
           "streaming mode — a non-empty streaming_mode string")
    deadline_present = (
        methods_is_list
        and all(isinstance(c, dict) and "deadline_set" in c
                for c in mrows)
    )
    _check(results, "api_shape_and_deadlines",
           "every_method_has_deadline", methods, deadline_present,
           methods_is_list and methods_count > 0
           and all(isinstance(c, dict)
                   and c.get("deadline_set") is True for c in mrows),
           "quality gate: every declared method row declares a "
           "deadline set — deadlines on every call")
    bounded_present = (
        methods_is_list
        and all(isinstance(c, dict) and "streaming_mode" in c
                for c in mrows)
        and all("stream_bounded" in c for c in streaming_rows)
    )
    _check(results, "api_shape_and_deadlines",
           "every_streaming_method_bounded", methods,
           bounded_present,
           methods_is_list
           and all(c.get("stream_bounded") is True
                   for c in streaming_rows),
           "red line: no unbounded streams — every streaming "
           "method row declares its stream bounded")
    _bool_check(results, "api_shape_and_deadlines",
                "cancellation_propagation_configured", manifest,
                ("api_shape", "cancellation_propagation_configured"),
                "quality gate: cancellation propagation is "
                "configured alongside deadlines")
    _bool_check(results, "api_shape_and_deadlines",
                "rich_error_model_used", manifest,
                ("api_shape", "rich_error_model_used"),
                "API shape: a rich error model is used — status "
                "codes plus typed details")
    _bool_check(results, "api_shape_and_deadlines",
                "metadata_limited_to_transport_concerns", manifest,
                ("api_shape",
                 "metadata_limited_to_transport_concerns"),
                "API shape: metadata is kept for transport "
                "concerns")

    # ---- Section 3: server_hygiene (skill: server hygiene —
    #      grpc.health.v1 health, reflection only in dev (or
    #      authenticated), interceptors for auth/logging/metrics/
    #      tracing, keepalive + pool tuning, explicit max message
    #      sizes. Quality gate — health service exposed) ----
    _bool_check(results, "server_hygiene",
                "health_service_exposed", manifest,
                ("server", "health_service_exposed"),
                "quality gate: the grpc.health.v1 health service "
                "is exposed")
    _gated_bool_check(
        results, "server_hygiene",
        "reflection_restricted_to_dev_or_authenticated", manifest,
        ("server", "reflection_enabled"),
        ("server", "reflection_restricted_to_dev_or_authenticated"),
        "server hygiene: reflection is only in dev, or "
        "authenticated",
        "reflection not enabled")
    _bool_check(results, "server_hygiene",
                "interceptors_for_auth_logging_metrics_tracing",
                manifest,
                ("server",
                 "interceptors_for_auth_logging_metrics_tracing"),
                "server hygiene: interceptors cover auth, logging, "
                "metrics and tracing")
    _bool_check(results, "server_hygiene",
                "keepalive_and_pool_tuning_configured", manifest,
                ("server", "keepalive_and_pool_tuning_configured"),
                "server hygiene: keepalive and pool tuning are "
                "configured")
    _bool_check(results, "server_hygiene",
                "explicit_max_message_sizes_set", manifest,
                ("server", "explicit_max_message_sizes_set"),
                "server hygiene: max message sizes are explicit")

    # ---- Section 4: security_and_transport (skill: security —
    #      mTLS between services with per-service identities;
    #      authorization interceptor or external policy
    #      (policy-as-code); no plaintext gRPC across hosts; rate
    #      limits on public-ish surfaces. Quality gate — mTLS +
    #      authz on cross-host paths. Red line — no plaintext
    #      off-box) ----
    _gated_bool_check(
        results, "security_and_transport",
        "mtls_on_cross_host_paths", manifest,
        ("security", "cross_host_traffic_present"),
        ("security", "mtls_enabled"),
        "quality gate: mTLS is enabled on cross-host paths",
        "no cross-host traffic declared")
    _gated_bool_check(
        results, "security_and_transport",
        "per_service_identities_used", manifest,
        ("security", "cross_host_traffic_present"),
        ("security", "per_service_identities_used"),
        "security: mTLS uses per-service identities",
        "no cross-host traffic declared")
    _gated_false_check(
        results, "security_and_transport",
        "no_plaintext_across_hosts", manifest,
        ("security", "cross_host_traffic_present"),
        ("security", "plaintext_across_hosts_present"),
        "red line: no plaintext gRPC across hosts",
        "no cross-host traffic declared")
    _bool_check(results, "security_and_transport",
                "authorization_via_interceptor_or_external_policy",
                manifest,
                ("security",
                 "authorization_via_interceptor_or_external_policy"),
                "quality gate: authorization runs via an "
                "interceptor or an external policy (policy-as-code)")
    _gated_bool_check(
        results, "security_and_transport",
        "rate_limits_on_public_surfaces", manifest,
        ("security", "public_surfaces_present"),
        ("security", "rate_limits_on_public_surfaces"),
        "security: rate limits are set on public-ish surfaces",
        "no public surfaces declared")

    # ---- Section 5: observability_testing_and_interop (skill:
    #      observability — trace + request-id propagation,
    #      per-method metrics, structured errors logged once.
    #      Testing — in-process integration tests (bufconn-style),
    #      contract tests against real clients, load smoke on hot
    #      paths. Quality gate — contract tests pass against
    #      clients. Interop & versioning — gateway/JSON adapters
    #      for REST consumers, gRPC-Web where browsers must
    #      connect; v1 package versions; deprecated fields
    #      announced then removed on schedule) ----
    _bool_check(results, "observability_testing_and_interop",
                "trace_and_request_id_propagation_configured",
                manifest,
                ("observability",
                 "trace_and_request_id_propagation_configured"),
                "observability: trace and request-id propagation "
                "are configured")
    _bool_check(results, "observability_testing_and_interop",
                "per_method_metrics_collected", manifest,
                ("observability", "per_method_metrics_collected"),
                "observability: per-method metrics are collected")
    _bool_check(results, "observability_testing_and_interop",
                "structured_errors_logged_once", manifest,
                ("observability", "structured_errors_logged_once"),
                "observability: structured errors are logged once")
    _bool_check(results, "observability_testing_and_interop",
                "in_process_integration_tests_present", manifest,
                ("testing", "in_process_integration_tests_present"),
                "testing: in-process integration tests "
                "(bufconn-style) are present")
    _bool_check(results, "observability_testing_and_interop",
                "contract_tests_pass_against_clients", manifest,
                ("testing", "contract_tests_pass_against_clients"),
                "quality gate: contract tests pass against real "
                "clients")
    _bool_check(results, "observability_testing_and_interop",
                "load_smoke_on_hot_paths_run", manifest,
                ("testing", "load_smoke_on_hot_paths_run"),
                "testing: load smoke runs on hot paths")
    _gated_bool_check(
        results, "observability_testing_and_interop",
        "gateway_json_adapters_for_rest_consumers", manifest,
        ("interop", "rest_consumers_present"),
        ("interop", "gateway_json_adapters_provided"),
        "interop: gateway/JSON adapters are provided for REST "
        "consumers",
        "no REST consumers declared")
    _gated_bool_check(
        results, "observability_testing_and_interop",
        "grpc_web_where_browsers_connect", manifest,
        ("interop", "browser_clients_present"),
        ("interop", "grpc_web_enabled"),
        "interop: gRPC-Web is enabled where browsers must "
        "connect",
        "no browser clients declared")
    _bool_check(results, "observability_testing_and_interop",
                "packages_versioned_v1", manifest,
                ("interop", "packages_versioned_v1"),
                "interop & versioning: packages carry v1 versions")
    _bool_check(results, "observability_testing_and_interop",
                "deprecated_fields_announced_then_removed_on_schedule",
                manifest,
                ("interop",
                 "deprecated_fields_announced_then_removed_on_schedule"),
                "interop & versioning: deprecated fields are "
                "announced, then removed on schedule")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "GRPC_SERVICE_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "GRPC_SERVICE_SOUND"

    computed_names = (
        "proto_fields_declared",
        "no_duplicate_field_number_within_message",
        "methods_declared",
        "every_method_names_streaming_mode",
        "every_method_has_deadline",
        "every_streaming_method_bounded",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "grpc-service-design",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "methods_count": methods_count,
        "proto_fields_count": proto_fields_count,
        "methods_without_streaming_mode":
            methods_without_streaming_mode,
        "methods_without_deadline": methods_without_deadline,
        "unbounded_streaming_methods": unbounded_streaming_methods,
        "fields_sharing_a_duplicate_number":
            fields_sharing_a_duplicate_number,
        "deadline_coverage": _fmt6(deadline_coverage),
        "streaming_boundedness_coverage":
            _fmt6(streaming_boundedness_coverage),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "GRPC SERVICE DESIGN",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: grpc_service_design.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "GRPC_SERVICE_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
