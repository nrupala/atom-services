// Multiplatform core design — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/multiplatform-core-design/src/multiplatform_core_design.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  project: "string",
  core: {
    core_holds_logic: "boolean",
    core_holds_crypto: "boolean",
    core_holds_data_model: "boolean",
    core_in_portable_language: "boolean",
    single_internal_api_defined: "boolean",
  },
  web: {
    web_installable: "boolean",
    web_offline_capable_service_worker: "boolean",
    web_responsive: "boolean",
  },
  mobile: {
    mobile_pwa_first_where_sufficient: "boolean",
    mobile_native_only_when_truly_needed: "boolean",
  },
  desktop_cli: {
    desktop_single_static_binary_where_possible: "boolean",
    cli_good_help: "boolean",
    cli_correct_exit_codes: "boolean",
    cli_pipe_friendly_output: "boolean",
  },
  api: {
    api_one_typed_contract: "boolean",
  },
  surfaces: [{
    name: "string",
    kind: "string",
    consumes_core_contract: "boolean",
    platform_code_isolated: "boolean",
    core_logic_reimplemented: "boolean",
  }],
  local_first: {
    source_of_truth_on_device: "boolean",
    sync_is_enhancement_not_requirement: "boolean",
    user_data_and_keys_stay_on_device_hardware: "boolean",
  },
  portability: {
    platform_specific_code_behind_interfaces: "boolean",
    per_platform_forks_minimized: "boolean",
    one_design_system_across_surfaces: "boolean",
    each_platform_conventions_respected: "boolean",
  },
  packaging: {
    reproducible_builds: "boolean",
    signed_builds: "boolean",
    docker_used: "boolean",
    distribution_route_decided_per_surface: "boolean",
  },
  testing: {
    shared_core_tested_thoroughly_once: "boolean",
    each_surface_smoke_tested: "boolean",
  },
  red_lines: {
    core_logic_rewritten_per_platform_present: "boolean",
    lowest_common_denominator_ux_present: "boolean",
    platform_conventions_ignored_present: "boolean",
    online_only_where_offline_matters_present: "boolean",
  },
};

export const SECTIONS = [
  "core_architecture",
  "surfaces_and_thin_adapters",
  "local_first_and_portability",
  "packaging_and_testing",
  "anti_pattern_red_lines",
] as const;

const SURFACE_KINDS = ["web_pwa", "mobile", "desktop_cli", "api"];

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
  surfaces_count: number | null;
  surfaces_with_invalid_kind: string[] | null;
  valid_kind_coverage: string | null;
  surfaces_not_consuming_core_contract: string[] | null;
  core_contract_coverage: string | null;
  surfaces_without_isolated_platform_code: string[] | null;
  isolated_platform_code_coverage: string | null;
  surfaces_reimplementing_core_logic: string[] | null;
  no_core_reimplementation_coverage: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [surfacesRaw, hasSurfaces] = getPath(manifest, "surfaces");
  const surfacesIsList = hasSurfaces && Array.isArray(surfacesRaw);
  const rows: unknown[] = surfacesIsList ? (surfacesRaw as unknown[]) : [];
  const surfacesCount: number | null = surfacesIsList ? rows.length : null;

  const surfacesWithInvalidKind: string[] | null = surfacesIsList
    ? rows.filter((c) => hasField(c, "kind") &&
        !SURFACE_KINDS.includes((c as Record<string, unknown>)["kind"] as string))
        .map(rowName)
    : null;
  const surfacesNotConsumingCoreContract: string[] | null = surfacesIsList
    ? rows.filter((c) => hasField(c, "consumes_core_contract") &&
        (c as Record<string, unknown>)["consumes_core_contract"] !== true)
        .map(rowName)
    : null;
  const surfacesWithoutIsolatedPlatformCode: string[] | null = surfacesIsList
    ? rows.filter((c) => hasField(c, "platform_code_isolated") &&
        (c as Record<string, unknown>)["platform_code_isolated"] !== true)
        .map(rowName)
    : null;
  const surfacesReimplementingCoreLogic: string[] | null = surfacesIsList
    ? rows.filter((c) => hasField(c, "core_logic_reimplemented") &&
        (c as Record<string, unknown>)["core_logic_reimplemented"] !== false)
        .map(rowName)
    : null;
  const validKindCoverage: number | null =
    surfacesIsList && surfacesCount !== null && surfacesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          SURFACE_KINDS.includes(c["kind"] as string)).length / surfacesCount
      : null;
  const coreContractCoverage: number | null =
    surfacesIsList && surfacesCount !== null && surfacesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["consumes_core_contract"] === true).length / surfacesCount
      : null;
  const isolatedPlatformCodeCoverage: number | null =
    surfacesIsList && surfacesCount !== null && surfacesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["platform_code_isolated"] === true).length / surfacesCount
      : null;
  const noCoreReimplementationCoverage: number | null =
    surfacesIsList && surfacesCount !== null && surfacesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["core_logic_reimplemented"] === false).length / surfacesCount
      : null;

  // ---- Section 1: core_architecture ----
  boolCheck(results, "core_architecture",
    "core_holds_logic", manifest,
    ["core", "core_holds_logic"],
    "core architecture: the portable core holds the logic");
  boolCheck(results, "core_architecture",
    "core_holds_crypto", manifest,
    ["core", "core_holds_crypto"],
    "core architecture: the portable core holds the crypto");
  boolCheck(results, "core_architecture",
    "core_holds_data_model", manifest,
    ["core", "core_holds_data_model"],
    "core architecture: the portable core holds the data model");
  boolCheck(results, "core_architecture",
    "core_in_portable_language", manifest,
    ["core", "core_in_portable_language"],
    "core architecture: the core is in a portable language");
  boolCheck(results, "core_architecture",
    "single_internal_api_defined", manifest,
    ["core", "single_internal_api_defined"],
    "core architecture: one internal API the core exposes is defined");

  // ---- Section 2: surfaces_and_thin_adapters ----
  boolCheck(results, "surfaces_and_thin_adapters",
    "web_installable", manifest,
    ["web", "web_installable"],
    "surfaces: the web / PWA surface is installable");
  boolCheck(results, "surfaces_and_thin_adapters",
    "web_offline_capable_service_worker", manifest,
    ["web", "web_offline_capable_service_worker"],
    "surfaces: the web / PWA surface is offline-capable via a service worker");
  boolCheck(results, "surfaces_and_thin_adapters",
    "web_responsive", manifest,
    ["web", "web_responsive"],
    "surfaces: the web / PWA surface is responsive");
  boolCheck(results, "surfaces_and_thin_adapters",
    "mobile_pwa_first_where_sufficient", manifest,
    ["mobile", "mobile_pwa_first_where_sufficient"],
    "surfaces: mobile is PWA-first where it suffices");
  boolCheck(results, "surfaces_and_thin_adapters",
    "mobile_native_only_when_truly_needed", manifest,
    ["mobile", "mobile_native_only_when_truly_needed"],
    "surfaces: mobile is native / APK only when truly needed");
  boolCheck(results, "surfaces_and_thin_adapters",
    "desktop_single_static_binary_where_possible", manifest,
    ["desktop_cli", "desktop_single_static_binary_where_possible"],
    "surfaces: desktop / CLI is a single static binary where possible");
  boolCheck(results, "surfaces_and_thin_adapters",
    "cli_good_help", manifest,
    ["desktop_cli", "cli_good_help"],
    "surfaces: the CLI has good --help");
  boolCheck(results, "surfaces_and_thin_adapters",
    "cli_correct_exit_codes", manifest,
    ["desktop_cli", "cli_correct_exit_codes"],
    "surfaces: the CLI uses correct exit codes");
  boolCheck(results, "surfaces_and_thin_adapters",
    "cli_pipe_friendly_output", manifest,
    ["desktop_cli", "cli_pipe_friendly_output"],
    "surfaces: the CLI output is pipe-friendly");
  boolCheck(results, "surfaces_and_thin_adapters",
    "api_one_typed_contract", manifest,
    ["api", "api_one_typed_contract"],
    "surfaces: the API is one typed contract any surface consumes");
  check(results, "surfaces_and_thin_adapters",
    "surfaces_declared", surfacesRaw, surfacesIsList,
    surfacesIsList && (surfacesCount as number) > 0,
    "the declared record names its surfaces — the surfaces list is present and non-empty");
  const kindPresent = surfacesIsList &&
    rows.every((c) => hasField(c, "kind"));
  check(results, "surfaces_and_thin_adapters",
    "every_surface_kind_valid", surfacesRaw, kindPresent,
    surfacesIsList && (surfacesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        SURFACE_KINDS.includes(c["kind"] as string)),
    "surfaces: every declared surface row declares a kind from the skill's set — web_pwa / mobile / desktop_cli / api");
  const consumesPresent = surfacesIsList &&
    rows.every((c) => hasField(c, "consumes_core_contract"));
  check(results, "surfaces_and_thin_adapters",
    "every_surface_consumes_core_contract", surfacesRaw, consumesPresent,
    surfacesIsList && (surfacesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["consumes_core_contract"] === true),
    "surfaces: every declared surface row consumes the same core contract — surfaces are thin adapters, not rewrites");
  const isolatedPresent = surfacesIsList &&
    rows.every((c) => hasField(c, "platform_code_isolated"));
  check(results, "surfaces_and_thin_adapters",
    "every_surface_platform_code_isolated", surfacesRaw, isolatedPresent,
    surfacesIsList && (surfacesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["platform_code_isolated"] === true),
    "surfaces: every declared surface row isolates its platform-specific code behind interfaces");
  const reimplPresent = surfacesIsList &&
    rows.every((c) => hasField(c, "core_logic_reimplemented"));
  check(results, "surfaces_and_thin_adapters",
    "no_surface_reimplements_core_logic", surfacesRaw, reimplPresent,
    surfacesIsList && surfacesReimplementingCoreLogic !== null &&
      surfacesReimplementingCoreLogic.length === 0,
    "surfaces: no declared surface row reimplements core logic — the core is shared, not rewritten per platform");

  // ---- Section 3: local_first_and_portability ----
  boolCheck(results, "local_first_and_portability",
    "source_of_truth_on_device", manifest,
    ["local_first", "source_of_truth_on_device"],
    "local-first: the source of truth is on the device");
  boolCheck(results, "local_first_and_portability",
    "sync_is_enhancement_not_requirement", manifest,
    ["local_first", "sync_is_enhancement_not_requirement"],
    "local-first: sync is an enhancement, not a requirement");
  boolCheck(results, "local_first_and_portability",
    "user_data_and_keys_stay_on_device_hardware", manifest,
    ["local_first", "user_data_and_keys_stay_on_device_hardware"],
    "local-first: the user's data and keys stay on their hardware");
  boolCheck(results, "local_first_and_portability",
    "platform_specific_code_behind_interfaces", manifest,
    ["portability", "platform_specific_code_behind_interfaces"],
    "portability discipline: platform-specific code is isolated behind interfaces");
  boolCheck(results, "local_first_and_portability",
    "per_platform_forks_minimized", manifest,
    ["portability", "per_platform_forks_minimized"],
    "portability discipline: per-platform forks are minimized");
  boolCheck(results, "local_first_and_portability",
    "one_design_system_across_surfaces", manifest,
    ["portability", "one_design_system_across_surfaces"],
    "portability discipline: one design system runs across surfaces");
  boolCheck(results, "local_first_and_portability",
    "each_platform_conventions_respected", manifest,
    ["portability", "each_platform_conventions_respected"],
    "portability discipline: each platform's conventions are respected");

  // ---- Section 4: packaging_and_testing ----
  boolCheck(results, "packaging_and_testing",
    "reproducible_builds", manifest,
    ["packaging", "reproducible_builds"],
    "packaging: builds are reproducible");
  boolCheck(results, "packaging_and_testing",
    "signed_builds", manifest,
    ["packaging", "signed_builds"],
    "packaging: builds are signed");
  falseCheck(results, "packaging_and_testing",
    "no_docker", manifest,
    ["packaging", "docker_used"],
    "packaging: no Docker is used");
  boolCheck(results, "packaging_and_testing",
    "distribution_route_decided_per_surface", manifest,
    ["packaging", "distribution_route_decided_per_surface"],
    "packaging: store vs sideload vs direct is decided per surface");
  boolCheck(results, "packaging_and_testing",
    "shared_core_tested_thoroughly_once", manifest,
    ["testing", "shared_core_tested_thoroughly_once"],
    "testing: the shared core is tested thoroughly once");
  boolCheck(results, "packaging_and_testing",
    "each_surface_smoke_tested", manifest,
    ["testing", "each_surface_smoke_tested"],
    "testing: each surface is smoke-tested for integration and platform quirks");

  // ---- Section 5: anti_pattern_red_lines ----
  falseCheck(results, "anti_pattern_red_lines",
    "no_core_logic_rewritten_per_platform", manifest,
    ["red_lines", "core_logic_rewritten_per_platform_present"],
    "red line: core logic is not rewritten per platform");
  falseCheck(results, "anti_pattern_red_lines",
    "no_lowest_common_denominator_ux", manifest,
    ["red_lines", "lowest_common_denominator_ux_present"],
    "red line: no lowest-common-denominator UX is shipped");
  falseCheck(results, "anti_pattern_red_lines",
    "no_platform_conventions_ignored", manifest,
    ["red_lines", "platform_conventions_ignored_present"],
    "red line: platform conventions are not ignored");
  falseCheck(results, "anti_pattern_red_lines",
    "no_online_only_where_offline_matters", manifest,
    ["red_lines", "online_only_where_offline_matters_present"],
    "red line: the design is not online-only where offline genuinely matters");

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
    verdict = "MULTIPLATFORM_CORE_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "MULTIPLATFORM_CORE_SOUND";
  }

  const computedNames = [
    "surfaces_declared",
    "every_surface_kind_valid",
    "every_surface_consumes_core_contract",
    "every_surface_platform_code_isolated",
    "no_surface_reimplements_core_logic",
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
    service: "multiplatform-core-design",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    surfaces_count: surfacesCount,
    surfaces_with_invalid_kind: surfacesWithInvalidKind,
    valid_kind_coverage: fmt6(validKindCoverage),
    surfaces_not_consuming_core_contract: surfacesNotConsumingCoreContract,
    core_contract_coverage: fmt6(coreContractCoverage),
    surfaces_without_isolated_platform_code: surfacesWithoutIsolatedPlatformCode,
    isolated_platform_code_coverage: fmt6(isolatedPlatformCodeCoverage),
    surfaces_reimplementing_core_logic: surfacesReimplementingCoreLogic,
    no_core_reimplementation_coverage: fmt6(noCoreReimplementationCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "MULTIPLATFORM CORE DESIGN",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
