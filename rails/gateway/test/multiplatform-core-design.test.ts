import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/multiplatform-core-design.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  project: "vault-app",
  core: { core_holds_logic: true, core_holds_crypto: true,
          core_holds_data_model: true, core_in_portable_language: true,
          single_internal_api_defined: true },
  web: { web_installable: true,
         web_offline_capable_service_worker: true, web_responsive: true },
  mobile: { mobile_pwa_first_where_sufficient: true,
            mobile_native_only_when_truly_needed: true },
  desktop_cli: { desktop_single_static_binary_where_possible: true,
                 cli_good_help: true, cli_correct_exit_codes: true,
                 cli_pipe_friendly_output: true },
  api: { api_one_typed_contract: true },
  surfaces: [
    { name: "web", kind: "web_pwa", consumes_core_contract: true,
      platform_code_isolated: true, core_logic_reimplemented: false },
    { name: "android", kind: "mobile", consumes_core_contract: true,
      platform_code_isolated: true, core_logic_reimplemented: false },
    { name: "cli", kind: "desktop_cli", consumes_core_contract: true,
      platform_code_isolated: true, core_logic_reimplemented: false },
    { name: "http-api", kind: "api", consumes_core_contract: true,
      platform_code_isolated: true, core_logic_reimplemented: false },
  ],
  local_first: { source_of_truth_on_device: true,
                 sync_is_enhancement_not_requirement: true,
                 user_data_and_keys_stay_on_device_hardware: true },
  portability: { platform_specific_code_behind_interfaces: true,
                 per_platform_forks_minimized: true,
                 one_design_system_across_surfaces: true,
                 each_platform_conventions_respected: true },
  packaging: { reproducible_builds: true, signed_builds: true,
               docker_used: false,
               distribution_route_decided_per_surface: true },
  testing: { shared_core_tested_thoroughly_once: true,
             each_surface_smoke_tested: true },
  red_lines: { core_logic_rewritten_per_platform_present: false,
               lowest_common_denominator_ux_present: false,
               platform_conventions_ignored_present: false,
               online_only_where_offline_matters_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "MULTIPLATFORM_CORE_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 37);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.surfaces_count, 4);
  assert.deepEqual(v.surfaces_with_invalid_kind, []);
  assert.equal(v.valid_kind_coverage, "1.000000");
  assert.deepEqual(v.surfaces_not_consuming_core_contract, []);
  assert.equal(v.core_contract_coverage, "1.000000");
  assert.deepEqual(v.surfaces_without_isolated_platform_code, []);
  assert.equal(v.isolated_platform_code_coverage, "1.000000");
  assert.deepEqual(v.surfaces_reimplementing_core_logic, []);
  assert.equal(v.no_core_reimplementation_coverage, "1.000000");
});

test("test_core_not_holding_crypto_fails_core_section", () => {
  const m = clone(COMPLETE) as any;
  m.core.core_holds_crypto = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MULTIPLATFORM_CORE_NOT_SOUND");
  assert.equal(v.sections["core_architecture"], "fail");
  assert.equal(checkStatus(v, "core_holds_crypto"), "fail");
});

test("test_no_single_internal_api_fails", () => {
  const m = clone(COMPLETE) as any;
  m.core.single_internal_api_defined = false;
  assert.equal(evaluate(m).verdict, "MULTIPLATFORM_CORE_NOT_SOUND");
});

test("test_web_not_offline_capable_fails_surfaces_section", () => {
  const m = clone(COMPLETE) as any;
  m.web.web_offline_capable_service_worker = false;
  const v = evaluate(m);
  assert.equal(v.sections["surfaces_and_thin_adapters"], "fail");
  assert.equal(checkStatus(v, "web_offline_capable_service_worker"), "fail");
});

test("test_native_first_mobile_fails", () => {
  const m = clone(COMPLETE) as any;
  m.mobile.mobile_pwa_first_where_sufficient = false;
  assert.equal(checkStatus(evaluate(m), "mobile_pwa_first_where_sufficient"), "fail");
});

test("test_cli_wrong_exit_codes_fail", () => {
  const m = clone(COMPLETE) as any;
  m.desktop_cli.cli_correct_exit_codes = false;
  assert.equal(checkStatus(evaluate(m), "cli_correct_exit_codes"), "fail");
});

test("test_surface_with_invalid_kind_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.surfaces[1].kind = "smart_tv";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_surface_kind_valid"), "fail");
  assert.deepEqual(v.surfaces_with_invalid_kind, ["android"]);
  assert.equal(v.valid_kind_coverage, "0.750000");
});

test("test_surface_missing_kind_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.surfaces[1].kind;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_surface_kind_valid"), "missing");
  assert.deepEqual(v.surfaces_with_invalid_kind, []);
});

test("test_surface_not_consuming_contract_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.surfaces[0].consumes_core_contract = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_surface_consumes_core_contract"), "fail");
  assert.deepEqual(v.surfaces_not_consuming_core_contract, ["web"]);
  assert.equal(v.core_contract_coverage, "0.750000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_surface_missing_consumes_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.surfaces[0].consumes_core_contract;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_surface_consumes_core_contract"), "missing");
  assert.deepEqual(v.surfaces_not_consuming_core_contract, []);
});

test("test_surface_without_isolated_code_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.surfaces[2].platform_code_isolated = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_surface_platform_code_isolated"), "fail");
  assert.deepEqual(v.surfaces_without_isolated_platform_code, ["cli"]);
  assert.equal(v.isolated_platform_code_coverage, "0.750000");
});

test("test_surface_reimplementing_core_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.surfaces[3].core_logic_reimplemented = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_surface_reimplements_core_logic"), "fail");
  assert.deepEqual(v.surfaces_reimplementing_core_logic, ["http-api"]);
  assert.equal(v.no_core_reimplementation_coverage, "0.750000");
});

test("test_surface_missing_reimplemented_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.surfaces[3].core_logic_reimplemented;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_surface_reimplements_core_logic"), "missing");
  assert.deepEqual(v.surfaces_reimplementing_core_logic, []);
});

test("test_empty_surfaces_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.surfaces = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "surfaces_declared"), "fail");
  assert.equal(v.surfaces_count, 0);
  assert.equal(v.valid_kind_coverage, null);
  assert.equal(v.core_contract_coverage, null);
  assert.equal(v.isolated_platform_code_coverage, null);
  assert.equal(v.no_core_reimplementation_coverage, null);
  assert.deepEqual(v.surfaces_reimplementing_core_logic, []);
});

test("test_server_as_source_of_truth_fails_local_first", () => {
  const m = clone(COMPLETE) as any;
  m.local_first.source_of_truth_on_device = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MULTIPLATFORM_CORE_NOT_SOUND");
  assert.equal(v.sections["local_first_and_portability"], "fail");
});

test("test_platform_conventions_not_respected_fails", () => {
  const m = clone(COMPLETE) as any;
  m.portability.each_platform_conventions_respected = false;
  assert.equal(checkStatus(evaluate(m), "each_platform_conventions_respected"), "fail");
});

test("test_docker_used_fails_packaging", () => {
  const m = clone(COMPLETE) as any;
  m.packaging.docker_used = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_docker"), "fail");
  assert.equal(v.sections["packaging_and_testing"], "fail");
});

test("test_unsigned_builds_fail", () => {
  const m = clone(COMPLETE) as any;
  m.packaging.signed_builds = false;
  assert.equal(evaluate(m).verdict, "MULTIPLATFORM_CORE_NOT_SOUND");
});

test("test_core_not_tested_fails", () => {
  const m = clone(COMPLETE) as any;
  m.testing.shared_core_tested_thoroughly_once = false;
  assert.equal(checkStatus(evaluate(m), "shared_core_tested_thoroughly_once"), "fail");
});

test("test_core_rewrite_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.core_logic_rewritten_per_platform_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_core_logic_rewritten_per_platform"), "fail");
  assert.equal(v.sections["anti_pattern_red_lines"], "fail");
});

test("test_lcd_ux_and_online_only_red_lines_fail", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.lowest_common_denominator_ux_present = true;
  m.red_lines.online_only_where_offline_matters_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_lowest_common_denominator_ux"), "fail");
  assert.equal(checkStatus(v, "no_online_only_where_offline_matters"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.testing;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["packaging_and_testing"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.surfaces_count, null);
  assert.equal(v.surfaces_with_invalid_kind, null);
  assert.equal(v.valid_kind_coverage, null);
  assert.equal(v.surfaces_not_consuming_core_contract, null);
  assert.equal(v.core_contract_coverage, null);
  assert.equal(v.surfaces_without_isolated_platform_code, null);
  assert.equal(v.isolated_platform_code_coverage, null);
  assert.equal(v.surfaces_reimplementing_core_logic, null);
  assert.equal(v.no_core_reimplementation_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: MULTIPLATFORM_CORE_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.project = 12345;
  assert.throws(() => evaluate(m), fieldError("project"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ core: "should-be-an-object" }), fieldError("core"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ surfaces: { name: "web" } }), fieldError("surfaces"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ surfaces: ["web"] }), fieldError("surfaces[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.core.core_holds_logic = "yes";
  assert.throws(() => evaluate(m), fieldError("core.core_holds_logic"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.surfaces[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("surfaces[0].name"));
});

test("malformed: nested list entry kind as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.surfaces[1].kind = true;
  assert.throws(() => evaluate(m), fieldError("surfaces[1].kind"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.portability = null;
  assert.throws(() => evaluate(m), fieldError("portability"));
});

// ---- Golden-fixture parity against the Python oracle ----

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "fixtures",
);

interface Fixture {
  name: string;
  manifest: unknown;
  expected: unknown;
}

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.startsWith("multiplatform-core-design--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    const actual = evaluate(fixture.manifest);
    assert.deepStrictEqual(actual, fixture.expected);
    // Byte-compare the full JSON incl. stamp serialization parity:
    assert.equal(
      JSON.stringify(actual),
      JSON.stringify(fixture.expected),
    );
    assert.equal(typeof stamp(actual), "string");
  });
}
