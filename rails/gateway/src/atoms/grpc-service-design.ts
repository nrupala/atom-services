// gRPC service design — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/grpc-service-design/src/grpc_service_design.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  project: "string",
  contract: {
    proto3_used: "boolean",
    removed_fields_reserved: "boolean",
    backward_forward_compatibility_rules_documented: "boolean",
    buf_lint_in_ci: "boolean",
    breaking_change_check_in_ci: "boolean",
    codegen_pinned: "boolean",
    codegen_generated_in_ci: "boolean",
    hand_generated_stubs_present: "boolean",
    field_number_reuse_present: "boolean",
  },
  methods: [{
    name: "string",
    streaming_mode: "string",
    deadline_set: "boolean",
    stream_bounded: "boolean",
  }],
  proto_fields: [{
    message: "string",
    name: "string",
    number: "number",
  }],
  api_shape: {
    streaming_choices_documented_by_flow: "boolean",
    cancellation_propagation_configured: "boolean",
    rich_error_model_used: "boolean",
    metadata_limited_to_transport_concerns: "boolean",
  },
  server: {
    health_service_exposed: "boolean",
    reflection_enabled: "boolean",
    reflection_restricted_to_dev_or_authenticated: "boolean",
    interceptors_for_auth_logging_metrics_tracing: "boolean",
    keepalive_and_pool_tuning_configured: "boolean",
    explicit_max_message_sizes_set: "boolean",
  },
  security: {
    cross_host_traffic_present: "boolean",
    mtls_enabled: "boolean",
    per_service_identities_used: "boolean",
    plaintext_across_hosts_present: "boolean",
    authorization_via_interceptor_or_external_policy: "boolean",
    public_surfaces_present: "boolean",
    rate_limits_on_public_surfaces: "boolean",
  },
  observability: {
    trace_and_request_id_propagation_configured: "boolean",
    per_method_metrics_collected: "boolean",
    structured_errors_logged_once: "boolean",
  },
  testing: {
    in_process_integration_tests_present: "boolean",
    contract_tests_pass_against_clients: "boolean",
    load_smoke_on_hot_paths_run: "boolean",
  },
  interop: {
    rest_consumers_present: "boolean",
    gateway_json_adapters_provided: "boolean",
    browser_clients_present: "boolean",
    grpc_web_enabled: "boolean",
    packages_versioned_v1: "boolean",
    deprecated_fields_announced_then_removed_on_schedule: "boolean",
  },
};

export const SECTIONS = [
  "contract_and_compatibility",
  "api_shape_and_deadlines",
  "server_hygiene",
  "security_and_transport",
  "observability_testing_and_interop",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  project: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  methods_count: number | null;
  proto_fields_count: number | null;
  methods_without_streaming_mode: string[] | null;
  methods_without_deadline: string[] | null;
  unbounded_streaming_methods: string[] | null;
  fields_sharing_a_duplicate_number: string[] | null;
  deadline_coverage: string | null;
  streaming_boundedness_coverage: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pyTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPyDict(value)) return Object.keys(value).length > 0;
  return Boolean(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function gatedFalseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      target === false, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function nonemptyStr(entry: unknown, field: string): boolean {
  return isPyDict(entry) && typeof entry[field] === "string" &&
    (entry[field] as string).length > 0;
}

function isStreaming(entry: unknown): boolean {
  return isPyDict(entry) && typeof entry["streaming_mode"] === "string" &&
    (entry["streaming_mode"] as string).length > 0 &&
    entry["streaming_mode"] !== "unary";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [methodsRaw, hasMethods] = getPath(manifest, "methods");
  const methodsIsList = hasMethods && Array.isArray(methodsRaw);
  const mrows: unknown[] = methodsIsList ? (methodsRaw as unknown[]) : [];
  const methodsCount: number | null = methodsIsList ? mrows.length : null;

  const methodsWithoutStreamingMode: string[] | null = methodsIsList
    ? mrows.filter((c) => !nonemptyStr(c, "streaming_mode")).map(rowName)
    : null;
  const methodsWithoutDeadline: string[] | null = methodsIsList
    ? mrows.filter((c) => hasField(c, "deadline_set") &&
        (c as Record<string, unknown>)["deadline_set"] !== true).map(rowName)
    : null;
  const deadlineCoverage: number | null =
    methodsIsList && methodsCount !== null && methodsCount > 0
      ? mrows.filter((c) => isPyDict(c) && c["deadline_set"] === true).length /
        methodsCount
      : null;
  const streamingRows = mrows.filter(isStreaming);
  const unboundedStreamingMethods: string[] | null = methodsIsList
    ? streamingRows.filter((c) => hasField(c, "stream_bounded") &&
        (c as Record<string, unknown>)["stream_bounded"] !== true)
        .map(rowName)
    : null;
  const streamingBoundednessCoverage: number | null =
    methodsIsList && streamingRows.length > 0
      ? streamingRows.filter(
          (c) => (c as Record<string, unknown>)["stream_bounded"] === true,
        ).length / streamingRows.length
      : null;

  const [fieldsRaw, hasFields] = getPath(manifest, "proto_fields");
  const fieldsIsList = hasFields && Array.isArray(fieldsRaw);
  const frows: unknown[] = fieldsIsList ? (fieldsRaw as unknown[]) : [];
  const protoFieldsCount: number | null = fieldsIsList ? frows.length : null;

  const numberCounts = new Map<string, number>();
  for (const c of frows) {
    if (isPyDict(c) && typeof c["message"] === "string" &&
        hasField(c, "number")) {
      const key = `${c["message"] as string}\u0000${String(c["number"])}`;
      numberCounts.set(key, (numberCounts.get(key) ?? 0) + 1);
    }
  }
  const duplicateRows = frows.filter((c) => isPyDict(c) &&
    typeof c["message"] === "string" && hasField(c, "number") &&
    (numberCounts.get(
      `${c["message"] as string}\u0000${String(c["number"])}`) ?? 0) > 1);
  const fieldsSharingDuplicate: string[] | null = fieldsIsList
    ? duplicateRows.map(rowName)
    : null;

  // ---- Section 1: contract_and_compatibility ----
  boolCheck(results, "contract_and_compatibility",
    "proto3_used", manifest,
    ["contract", "proto3_used"],
    "contract first: the contract is proto3");
  boolCheck(results, "contract_and_compatibility",
    "removed_fields_reserved", manifest,
    ["contract", "removed_fields_reserved"],
    "quality gate: removed fields are reserved — their numbers and names are never recycled");
  boolCheck(results, "contract_and_compatibility",
    "backward_forward_compatibility_rules_documented", manifest,
    ["contract", "backward_forward_compatibility_rules_documented"],
    "contract first: backward/forward compatibility rules are documented");
  boolCheck(results, "contract_and_compatibility",
    "buf_lint_in_ci", manifest,
    ["contract", "buf_lint_in_ci"],
    "contract first: buf lint runs in CI");
  boolCheck(results, "contract_and_compatibility",
    "breaking_change_check_in_ci", manifest,
    ["contract", "breaking_change_check_in_ci"],
    "quality gate: the breaking-change check is green in CI");
  boolCheck(results, "contract_and_compatibility",
    "codegen_pinned", manifest,
    ["contract", "codegen_pinned"],
    "contract first: codegen is pinned");
  boolCheck(results, "contract_and_compatibility",
    "codegen_generated_in_ci", manifest,
    ["contract", "codegen_generated_in_ci"],
    "contract first: stubs are generated in CI, not by hand");
  falseCheck(results, "contract_and_compatibility",
    "no_hand_generated_stubs", manifest,
    ["contract", "hand_generated_stubs_present"],
    "red line: no hand-generated stubs");
  falseCheck(results, "contract_and_compatibility",
    "no_field_number_reuse", manifest,
    ["contract", "field_number_reuse_present"],
    "red line: proto field numbers are never reused, including numbers of removed fields");
  check(results, "contract_and_compatibility", "proto_fields_declared",
    fieldsRaw, fieldsIsList,
    fieldsIsList && (protoFieldsCount as number) > 0,
    "contract first: the declared record names its proto fields — the proto_fields list is present and non-empty");
  const duplicatePresent = fieldsIsList &&
    frows.every((c) => hasField(c, "message") && hasField(c, "number"));
  check(results, "contract_and_compatibility",
    "no_duplicate_field_number_within_message", fieldsRaw, duplicatePresent,
    fieldsIsList && duplicateRows.length === 0,
    "red line: no two declared fields in the same message share a field number — a shared number is a reuse on the declared evidence");

  // ---- Section 2: api_shape_and_deadlines ----
  boolCheck(results, "api_shape_and_deadlines",
    "streaming_choices_documented_by_flow", manifest,
    ["api_shape", "streaming_choices_documented_by_flow"],
    "API shape: unary vs server/client/bidi streaming is chosen by flow for each method");
  check(results, "api_shape_and_deadlines", "methods_declared",
    methodsRaw, methodsIsList,
    methodsIsList && (methodsCount as number) > 0,
    "API shape: the declared record names its methods — the methods list is present and non-empty");
  const modePresent = methodsIsList &&
    mrows.every((c) => hasField(c, "streaming_mode"));
  check(results, "api_shape_and_deadlines",
    "every_method_names_streaming_mode", methodsRaw, modePresent,
    methodsIsList && (methodsCount as number) > 0 &&
      methodsWithoutStreamingMode !== null &&
      methodsWithoutStreamingMode.length === 0,
    "API shape: every declared method row names its streaming mode — a non-empty streaming_mode string");
  const deadlinePresent = methodsIsList &&
    mrows.every((c) => hasField(c, "deadline_set"));
  check(results, "api_shape_and_deadlines",
    "every_method_has_deadline", methodsRaw, deadlinePresent,
    methodsIsList && (methodsCount as number) > 0 &&
      mrows.every((c) => isPyDict(c) && c["deadline_set"] === true),
    "quality gate: every declared method row declares a deadline set — deadlines on every call");
  const boundedPresent = methodsIsList &&
    mrows.every((c) => hasField(c, "streaming_mode")) &&
    streamingRows.every((c) => hasField(c, "stream_bounded"));
  check(results, "api_shape_and_deadlines",
    "every_streaming_method_bounded", methodsRaw, boundedPresent,
    methodsIsList &&
      streamingRows.every(
        (c) => (c as Record<string, unknown>)["stream_bounded"] === true),
    "red line: no unbounded streams — every streaming method row declares its stream bounded");
  boolCheck(results, "api_shape_and_deadlines",
    "cancellation_propagation_configured", manifest,
    ["api_shape", "cancellation_propagation_configured"],
    "quality gate: cancellation propagation is configured alongside deadlines");
  boolCheck(results, "api_shape_and_deadlines",
    "rich_error_model_used", manifest,
    ["api_shape", "rich_error_model_used"],
    "API shape: a rich error model is used — status codes plus typed details");
  boolCheck(results, "api_shape_and_deadlines",
    "metadata_limited_to_transport_concerns", manifest,
    ["api_shape", "metadata_limited_to_transport_concerns"],
    "API shape: metadata is kept for transport concerns");

  // ---- Section 3: server_hygiene ----
  boolCheck(results, "server_hygiene",
    "health_service_exposed", manifest,
    ["server", "health_service_exposed"],
    "quality gate: the grpc.health.v1 health service is exposed");
  gatedBoolCheck(results, "server_hygiene",
    "reflection_restricted_to_dev_or_authenticated", manifest,
    ["server", "reflection_enabled"],
    ["server", "reflection_restricted_to_dev_or_authenticated"],
    "server hygiene: reflection is only in dev, or authenticated",
    "reflection not enabled");
  boolCheck(results, "server_hygiene",
    "interceptors_for_auth_logging_metrics_tracing", manifest,
    ["server", "interceptors_for_auth_logging_metrics_tracing"],
    "server hygiene: interceptors cover auth, logging, metrics and tracing");
  boolCheck(results, "server_hygiene",
    "keepalive_and_pool_tuning_configured", manifest,
    ["server", "keepalive_and_pool_tuning_configured"],
    "server hygiene: keepalive and pool tuning are configured");
  boolCheck(results, "server_hygiene",
    "explicit_max_message_sizes_set", manifest,
    ["server", "explicit_max_message_sizes_set"],
    "server hygiene: max message sizes are explicit");

  // ---- Section 4: security_and_transport ----
  gatedBoolCheck(results, "security_and_transport",
    "mtls_on_cross_host_paths", manifest,
    ["security", "cross_host_traffic_present"],
    ["security", "mtls_enabled"],
    "quality gate: mTLS is enabled on cross-host paths",
    "no cross-host traffic declared");
  gatedBoolCheck(results, "security_and_transport",
    "per_service_identities_used", manifest,
    ["security", "cross_host_traffic_present"],
    ["security", "per_service_identities_used"],
    "security: mTLS uses per-service identities",
    "no cross-host traffic declared");
  gatedFalseCheck(results, "security_and_transport",
    "no_plaintext_across_hosts", manifest,
    ["security", "cross_host_traffic_present"],
    ["security", "plaintext_across_hosts_present"],
    "red line: no plaintext gRPC across hosts",
    "no cross-host traffic declared");
  boolCheck(results, "security_and_transport",
    "authorization_via_interceptor_or_external_policy", manifest,
    ["security", "authorization_via_interceptor_or_external_policy"],
    "quality gate: authorization runs via an interceptor or an external policy (policy-as-code)");
  gatedBoolCheck(results, "security_and_transport",
    "rate_limits_on_public_surfaces", manifest,
    ["security", "public_surfaces_present"],
    ["security", "rate_limits_on_public_surfaces"],
    "security: rate limits are set on public-ish surfaces",
    "no public surfaces declared");

  // ---- Section 5: observability_testing_and_interop ----
  boolCheck(results, "observability_testing_and_interop",
    "trace_and_request_id_propagation_configured", manifest,
    ["observability", "trace_and_request_id_propagation_configured"],
    "observability: trace and request-id propagation are configured");
  boolCheck(results, "observability_testing_and_interop",
    "per_method_metrics_collected", manifest,
    ["observability", "per_method_metrics_collected"],
    "observability: per-method metrics are collected");
  boolCheck(results, "observability_testing_and_interop",
    "structured_errors_logged_once", manifest,
    ["observability", "structured_errors_logged_once"],
    "observability: structured errors are logged once");
  boolCheck(results, "observability_testing_and_interop",
    "in_process_integration_tests_present", manifest,
    ["testing", "in_process_integration_tests_present"],
    "testing: in-process integration tests (bufconn-style) are present");
  boolCheck(results, "observability_testing_and_interop",
    "contract_tests_pass_against_clients", manifest,
    ["testing", "contract_tests_pass_against_clients"],
    "quality gate: contract tests pass against real clients");
  boolCheck(results, "observability_testing_and_interop",
    "load_smoke_on_hot_paths_run", manifest,
    ["testing", "load_smoke_on_hot_paths_run"],
    "testing: load smoke runs on hot paths");
  gatedBoolCheck(results, "observability_testing_and_interop",
    "gateway_json_adapters_for_rest_consumers", manifest,
    ["interop", "rest_consumers_present"],
    ["interop", "gateway_json_adapters_provided"],
    "interop: gateway/JSON adapters are provided for REST consumers",
    "no REST consumers declared");
  gatedBoolCheck(results, "observability_testing_and_interop",
    "grpc_web_where_browsers_connect", manifest,
    ["interop", "browser_clients_present"],
    ["interop", "grpc_web_enabled"],
    "interop: gRPC-Web is enabled where browsers must connect",
    "no browser clients declared");
  boolCheck(results, "observability_testing_and_interop",
    "packages_versioned_v1", manifest,
    ["interop", "packages_versioned_v1"],
    "interop & versioning: packages carry v1 versions");
  boolCheck(results, "observability_testing_and_interop",
    "deprecated_fields_announced_then_removed_on_schedule", manifest,
    ["interop", "deprecated_fields_announced_then_removed_on_schedule"],
    "interop & versioning: deprecated fields are announced, then removed on schedule");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "GRPC_SERVICE_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "GRPC_SERVICE_SOUND";
  }

  const computedNames = [
    "proto_fields_declared",
    "no_duplicate_field_number_within_message",
    "methods_declared",
    "every_method_names_streaming_mode",
    "every_method_has_deadline",
    "every_streaming_method_bounded",
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "grpc-service-design",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    methods_count: methodsCount,
    proto_fields_count: protoFieldsCount,
    methods_without_streaming_mode: methodsWithoutStreamingMode,
    methods_without_deadline: methodsWithoutDeadline,
    unbounded_streaming_methods: unboundedStreamingMethods,
    fields_sharing_a_duplicate_number: fieldsSharingDuplicate,
    deadline_coverage: fmt6(deadlineCoverage),
    streaming_boundedness_coverage: fmt6(streamingBoundednessCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "GRPC SERVICE DESIGN",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
