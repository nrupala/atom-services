// ACP protocol integration review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/acp-protocol-integration-review/src/acp_protocol_integration_review.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed flavour
// status and the summary string are byte-identical to the Python
// output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  implementation: "string",
  protocol: {
    flavor: "string",
    disambiguated_naming: "boolean",
    spec_version_documented: "boolean",
    supported_subset_documented: "boolean",
  },
  adapter: {
    thin: "boolean",
    single_core_protocol_at_edge: "boolean",
    business_logic_in_wire_layer: "boolean",
  },
  surface: {
    client_flow_complete: "boolean",
    client_permissions_handled: "boolean",
    comm_endpoints_complete: "boolean",
    comm_message_parts_typed: "boolean",
  },
  lifecycle: {
    unknown_sessions_or_runs_handled: "boolean",
    cancels_handled: "boolean",
    errors_handled: "boolean",
    reconnects_handled: "boolean",
    state_leaks_across_sessions: "boolean",
  },
  streaming: {
    updates_ordered: "boolean",
    chunk_sizes_bounded: "boolean",
    backpressure_addressed: "boolean",
    terminal_states_clear: "boolean",
  },
  security: {
    remote_endpoints_present: "boolean",
    remote_endpoints_authenticated: "boolean",
    inputs_validated: "boolean",
    output_sizes_capped: "boolean",
    tool_execution_sandboxed: "boolean",
  },
  honesty: {
    unimplemented_modes_noted: "boolean",
    unsupported_features_faked: "boolean",
  },
  tests: {
    scripted_client_handshake_covered: "boolean",
    lifecycle_happy_error_cancel_covered: "boolean",
    contract_tests_in_ci_per_protocol: "boolean",
  },
  upgrade: {
    sdk_upgrade_path_documented: "boolean",
    adapter_tests_kept_for_sdk_swap: "boolean",
  },
};

export const SECTIONS = [
  "disambiguation_and_scope",
  "adapter_architecture",
  "protocol_surface",
  "lifecycle_correctness",
  "streaming_discipline",
  "security",
  "honesty_tests_and_upgrade_path",
] as const;

export const RECOGNIZED_FLAVORS = ["ACP-client", "ACP-comm"] as const;

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
  implementation: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  flavor_status: string | null;
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [flavor, hasFlavor] = getPath(manifest, "protocol", "flavor");

  // ---- Section 1: disambiguation_and_scope ----
  boolCheck(results, "disambiguation_and_scope",
    "disambiguated_naming_in_docs_and_code",
    manifest, ["protocol", "disambiguated_naming"],
    "quality gate: disambiguated naming in docs/code ('ACP-client' vs 'ACP-comm') — always disambiguate which ACP is meant");
  check(results, "disambiguation_and_scope", "flavor_recognized",
    flavor, hasFlavor,
    flavor === "ACP-client" || flavor === "ACP-comm",
    "the declared flavour is one of the skill's two ACPs: 'ACP-client' (Agent Client Protocol) or 'ACP-comm' (Agent Communication Protocol)");
  boolCheck(results, "disambiguation_and_scope",
    "spec_version_documented",
    manifest, ["protocol", "spec_version_documented"],
    "minimal-but-honest: label spec versions supported");
  boolCheck(results, "disambiguation_and_scope",
    "supported_subset_documented",
    manifest, ["protocol", "supported_subset_documented"],
    "quality gate: spec version + supported subset documented");

  // ---- Section 2: adapter_architecture ----
  boolCheck(results, "adapter_architecture", "adapter_thin",
    manifest, ["adapter", "thin"],
    "protocol adapters stay thin: protocol sits at the edge");
  boolCheck(results, "adapter_architecture",
    "single_core_protocol_at_edge",
    manifest, ["adapter", "single_core_protocol_at_edge"],
    "one core, protocol sits at the edge ('agent-commands'-style mapping)");
  falseCheck(results, "adapter_architecture",
    "no_business_logic_in_wire_layer",
    manifest, ["adapter", "business_logic_in_wire_layer"],
    "no business logic in the wire layer");

  // ---- Section 3: protocol_surface ----
  if (hasFlavor && flavor === "ACP-client") {
    boolCheck(results, "protocol_surface",
      "client_flow_complete_when_client_flavor",
      manifest, ["surface", "client_flow_complete"],
      "ACP-client surface: initialize -> session/new -> session/prompt with streamed session/update chunks, over stdio JSON-RPC");
    boolCheck(results, "protocol_surface",
      "client_permissions_handled_when_client_flavor",
      manifest, ["surface", "client_permissions_handled"],
      "ACP-client surface: permissions are handled");
  } else {
    check(results, "protocol_surface",
      "client_flow_complete_when_client_flavor",
      flavor, hasFlavor, true,
      "not an ACP-client integration");
    check(results, "protocol_surface",
      "client_permissions_handled_when_client_flavor",
      flavor, hasFlavor, true,
      "not an ACP-client integration");
  }
  if (hasFlavor && flavor === "ACP-comm") {
    boolCheck(results, "protocol_surface",
      "comm_endpoints_complete_when_comm_flavor",
      manifest, ["surface", "comm_endpoints_complete"],
      "ACP-comm surface: REST — GET /agents, POST /runs (sync/async/stream), GET /runs/:id, cancel");
    boolCheck(results, "protocol_surface",
      "comm_message_parts_typed_when_comm_flavor",
      manifest, ["surface", "comm_message_parts_typed"],
      "ACP-comm surface: message parts with content types");
  } else {
    check(results, "protocol_surface",
      "comm_endpoints_complete_when_comm_flavor",
      flavor, hasFlavor, true,
      "not an ACP-comm integration");
    check(results, "protocol_surface",
      "comm_message_parts_typed_when_comm_flavor",
      flavor, hasFlavor, true,
      "not an ACP-comm integration");
  }

  // ---- Section 4: lifecycle_correctness ----
  boolCheck(results, "lifecycle_correctness",
    "unknown_sessions_or_runs_handled",
    manifest, ["lifecycle", "unknown_sessions_or_runs_handled"],
    "lifecycle: handle unknown sessions/runs");
  boolCheck(results, "lifecycle_correctness", "cancels_handled",
    manifest, ["lifecycle", "cancels_handled"],
    "lifecycle: handle cancels");
  boolCheck(results, "lifecycle_correctness", "errors_handled",
    manifest, ["lifecycle", "errors_handled"],
    "lifecycle: handle errors");
  boolCheck(results, "lifecycle_correctness", "reconnects_handled",
    manifest, ["lifecycle", "reconnects_handled"],
    "lifecycle: handle reconnects");
  falseCheck(results, "lifecycle_correctness",
    "no_state_leak_across_sessions",
    manifest, ["lifecycle", "state_leaks_across_sessions"],
    "lifecycle: never leak state across sessions");

  // ---- Section 5: streaming_discipline ----
  boolCheck(results, "streaming_discipline", "updates_ordered",
    manifest, ["streaming", "updates_ordered"],
    "streaming discipline: order updates");
  boolCheck(results, "streaming_discipline", "chunk_sizes_bounded",
    manifest, ["streaming", "chunk_sizes_bounded"],
    "streaming discipline: bounded chunk sizes (the skill states bounded, and states no number — the bound is declared, not computed)");
  boolCheck(results, "streaming_discipline",
    "backpressure_addressed",
    manifest, ["streaming", "backpressure_addressed"],
    "streaming discipline: backpressure awareness");
  boolCheck(results, "streaming_discipline",
    "terminal_states_clear",
    manifest, ["streaming", "terminal_states_clear"],
    "streaming discipline: clear terminal states (stopReason / run status)");

  // ---- Section 6: security ----
  const [remote, hasRemote] = getPath(
    manifest, "security", "remote_endpoints_present");
  const [auth, hasAuth] = getPath(
    manifest, "security", "remote_endpoints_authenticated");
  if (hasRemote && pyTruthy(remote)) {
    check(results, "security",
      "remote_endpoints_authenticated_when_remote",
      auth, hasAuth, auth === true,
      "red line: no unauthenticated remote endpoints — remote ACP endpoints require auth (tokens/mTLS)");
  } else {
    check(results, "security",
      "remote_endpoints_authenticated_when_remote",
      remote, hasRemote, true,
      "no remote endpoints declared");
  }
  boolCheck(results, "security", "inputs_validated",
    manifest, ["security", "inputs_validated"],
    "security: validate all inputs (quality gate: remote endpoints authenticated; inputs validated)");
  boolCheck(results, "security", "output_sizes_capped",
    manifest, ["security", "output_sizes_capped"],
    "security: cap output sizes (the skill states a cap, and states no number — the cap is declared, not computed)");
  boolCheck(results, "security",
    "prompt_triggered_tool_execution_sandboxed",
    manifest, ["security", "tool_execution_sandboxed"],
    "security: sandbox any tool execution triggered via prompts");

  // ---- Section 7: honesty_tests_and_upgrade_path ----
  boolCheck(results, "honesty_tests_and_upgrade_path",
    "unimplemented_modes_noted",
    manifest, ["honesty", "unimplemented_modes_noted"],
    "minimal-but-honest: note unimplemented modes (e.g. stream)");
  falseCheck(results, "honesty_tests_and_upgrade_path",
    "unsupported_features_not_faked",
    manifest, ["honesty", "unsupported_features_faked"],
    "red line: never fake compliance — no pretending unsupported features work");
  boolCheck(results, "honesty_tests_and_upgrade_path",
    "scripted_client_handshake_covered",
    manifest, ["tests", "scripted_client_handshake_covered"],
    "contract tests: scripted client covering handshake");
  boolCheck(results, "honesty_tests_and_upgrade_path",
    "lifecycle_happy_error_cancel_covered",
    manifest, ["tests", "lifecycle_happy_error_cancel_covered"],
    "quality gate / contract tests: lifecycle tests — session/run happy + error + cancel");
  boolCheck(results, "honesty_tests_and_upgrade_path",
    "contract_tests_in_ci_per_protocol",
    manifest, ["tests", "contract_tests_in_ci_per_protocol"],
    "contract tests: in CI, per protocol");
  boolCheck(results, "honesty_tests_and_upgrade_path",
    "sdk_upgrade_path_documented",
    manifest, ["upgrade", "sdk_upgrade_path_documented"],
    "production upgrade path: official SDKs when the surface grows");
  boolCheck(results, "honesty_tests_and_upgrade_path",
    "adapter_tests_kept_for_sdk_swap",
    manifest, ["upgrade", "adapter_tests_kept_for_sdk_swap"],
    "production upgrade path: keep the adapter tests so swaps are safe");

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
    verdict = "INTEGRATION_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "INTEGRATION_SOUND";
  }

  let flavorStatus: string | null;
  if (!hasFlavor) {
    flavorStatus = null;
  } else if (flavor === "ACP-client") {
    flavorStatus = "acp_client";
  } else if (flavor === "ACP-comm") {
    flavorStatus = "acp_comm";
  } else {
    flavorStatus = "unrecognized";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "acp-protocol-integration-review",
    atom_version: "0.1.0",
    implementation: manifest["implementation"] ?? null,
    verdict,
    sections,
    checks: results,
    flavor_status: flavorStatus,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ACP PROTOCOL INTEGRATION REVIEW",
    `implementation: ${pyStr(verdict.implementation ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
