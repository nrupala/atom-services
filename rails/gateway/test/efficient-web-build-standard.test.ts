import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/efficient-web-build-standard.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The EFFICIENT_WEB_BUILD_STANDARD_MET manifest, copied from the
// Python VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  site: "product-landing",
  plan: { call_count_stated: true,
          per_request_work_stated: true,
          cheaper_alternative_stated: true,
          fragility_named: true },
  precompute: { rebuild_triggered_by_publish_event: true,
                timer_or_per_visitor_primary_rebuild_present: false,
                live_render_fallback_present: true },
  calls: { await_in_loop_present: false,
           independent_calls_batched_or_avoided: true,
           duplicate_upstream_fetches_coalesced: true },
  search: { has_search_or_filter: true,
            uses_single_publish_time_index_blob: true },
  pages: [
    { name: "home", content_same_for_all_visitors: true,
      rendered_at_publish: true, calls_per_load: 1 },
    { name: "docs-index", content_same_for_all_visitors: true,
      rendered_at_publish: true, calls_per_load: 1 },
    { name: "account-dashboard", content_same_for_all_visitors: false,
      rendered_at_publish: false, calls_per_load: 3 },
  ],
  caching: { edge_cache_configured: true,
             stale_while_revalidate_configured: true,
             app_cache_scoped_to_authenticated_personalized: true,
             db_cache_scoped_to_genuinely_dynamic: true,
             hashed_static_assets_used: true,
             hashed_asset_max_age_seconds: 31536000,
             stale_served_on_upstream_failure: true },
  payload: { text_compression_brotli_gzip_fallback: true,
             already_compressed_media_recompressed_present: false,
             js_css_minified_at_build: true,
             dead_code_removed: true,
             client_js_limited_to_needed_interactivity: true,
             critical_css_inlined_rest_deferred: true,
             images_efficient_formats_responsive_lazy: true,
             static_assets_highest_compression_level: true,
             on_the_fly_compression_low_level: true,
             interactive_js_gzipped_kb: 120 },
  delivery: { edge_first_delivery: true,
              static_shell_first_slow_parts_deferred: true,
              content_page_cpu_p99_ms: 0.4 },
  security: { csp_header_present: true,
              hsts_header_present: true,
              content_type_options_nosniff_present: true,
              frame_protection_present: true,
              referrer_policy_present: true,
              https_only: true,
              secrets_in_client_code_or_repos_present: false,
              write_endpoints_bearer_token_protected: true,
              user_derived_output_escaped: true,
              undefined_field_guards_present: true,
              least_privilege_tokens_and_bindings: true },
  process: { staging_deployed_first: true,
             staging_speed_and_correctness_verified: true,
             production_promoted_only_on_explicit_go: true,
             post_ship_efficiency_confirmed_with_numbers: true,
             testing_done_on_live_site_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 29 Python VerdictTests, ported ----

test("test_complete_manifest_meets_standard", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "EFFICIENT_WEB_BUILD_STANDARD_MET");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 49);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.pages_count, 3);
  assert.deepEqual(v.shared_pages_not_precomputed, []);
  assert.deepEqual(v.precomputed_pages_over_single_read, []);
  assert.equal(v.total_calls_per_load, 5);
  assert.equal(v.max_calls_per_load, 3);
  assert.equal(v.precomputed_page_coverage, "0.666667");
  assert.equal(v.single_read_page_coverage, "0.666667");
  assert.equal(v.interactive_js_gzipped_kb, 120);
  assert.equal(v.content_page_cpu_p99_ms, 0.4);
});

test("test_plan_without_call_count_fails_section_1", () => {
  const m = clone(COMPLETE) as any;
  m.plan.call_count_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET");
  assert.equal(v.sections["publish_time_precompute_and_calls"], "fail");
});

test("test_timer_primary_rebuild_fails", () => {
  const m = clone(COMPLETE) as any;
  m.precompute.timer_or_per_visitor_primary_rebuild_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_timer_or_per_visitor_primary_rebuild"), "fail");
});

test("test_await_in_loop_fails", () => {
  const m = clone(COMPLETE) as any;
  m.calls.await_in_loop_present = true;
  assert.equal(evaluate(m).verdict, "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET");
});

test("test_search_without_single_index_fails", () => {
  const m = clone(COMPLETE) as any;
  m.search.uses_single_publish_time_index_blob = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "search_uses_single_publish_time_index"), "fail");
});

test("test_no_search_passes_index_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.search.has_search_or_filter = false;
  delete m.search.uses_single_publish_time_index_blob;
  const v = evaluate(m);
  assert.equal(v.verdict, "EFFICIENT_WEB_BUILD_STANDARD_MET");
  assert.equal(checkStatus(v, "search_uses_single_publish_time_index"), "pass");
});

test("test_empty_pages_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.pages = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "pages_declared"), "fail");
  assert.equal(v.pages_count, 0);
  assert.equal(v.precomputed_page_coverage, null);
  assert.equal(v.total_calls_per_load, null);
});

test("test_shared_page_not_precomputed_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.pages[0].rendered_at_publish = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_shared_content_page_rendered_at_publish"), "fail");
  assert.deepEqual(v.shared_pages_not_precomputed, ["home"]);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_shared_page_missing_rendered_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.pages[0].rendered_at_publish;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_shared_content_page_rendered_at_publish"), "missing");
  assert.deepEqual(v.shared_pages_not_precomputed, []);
});

test("test_precomputed_page_with_two_calls_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.pages[1].calls_per_load = 2;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_precomputed_page_serves_single_read"), "fail");
  assert.deepEqual(v.precomputed_pages_over_single_read, ["docs-index"]);
});

test("test_precomputed_page_missing_calls_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.pages[1].calls_per_load;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_precomputed_page_serves_single_read"), "missing");
});

test("test_dynamic_page_with_many_calls_passes", () => {
  const m = clone(COMPLETE) as any;
  m.pages[2].calls_per_load = 9;
  const v = evaluate(m);
  assert.equal(v.verdict, "EFFICIENT_WEB_BUILD_STANDARD_MET");
  assert.equal(v.max_calls_per_load, 9);
});

test("test_edge_cache_off_fails_caching_section", () => {
  const m = clone(COMPLETE) as any;
  m.caching.edge_cache_configured = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET");
  assert.equal(v.sections["caching_layers"], "fail");
});

test("test_hashed_assets_with_wrong_max_age_fails", () => {
  const m = clone(COMPLETE) as any;
  m.caching.hashed_asset_max_age_seconds = 86400;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "hashed_assets_use_immutable_year_cache"), "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_hashed_assets_missing_max_age_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.caching.hashed_asset_max_age_seconds;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "hashed_assets_use_immutable_year_cache"), "missing");
});

test("test_no_hashed_assets_passes_max_age_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.caching.hashed_static_assets_used = false;
  delete m.caching.hashed_asset_max_age_seconds;
  const v = evaluate(m);
  assert.equal(v.verdict, "EFFICIENT_WEB_BUILD_STANDARD_MET");
  assert.equal(checkStatus(v, "hashed_assets_use_immutable_year_cache"), "pass");
});

test("test_media_recompression_fails_bytes_section", () => {
  const m = clone(COMPLETE) as any;
  m.payload.already_compressed_media_recompressed_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["bytes_compression_and_client_code"], "fail");
});

test("test_interactive_js_over_budget_fails", () => {
  const m = clone(COMPLETE) as any;
  m.payload.interactive_js_gzipped_kb = 450;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "interactive_js_within_stated_budget"), "fail");
  assert.equal(v.verdict, "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET");
});

test("test_interactive_js_at_budget_boundary_passes", () => {
  const m = clone(COMPLETE) as any;
  m.payload.interactive_js_gzipped_kb = 400;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "interactive_js_within_stated_budget"), "pass");
});

test("test_interactive_js_absent_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.payload.interactive_js_gzipped_kb;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.interactive_js_gzipped_kb, null);
});

test("test_cpu_p99_at_one_ms_fails_sub_millisecond", () => {
  const m = clone(COMPLETE) as any;
  m.delivery.content_page_cpu_p99_ms = 1.0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "content_page_cpu_p99_sub_millisecond"), "fail");
});

test("test_cpu_p99_multi_ms_fails_delivery_section", () => {
  const m = clone(COMPLETE) as any;
  m.delivery.content_page_cpu_p99_ms = 4.2;
  const v = evaluate(m);
  assert.equal(v.sections["delivery_security_and_process"], "fail");
});

test("test_missing_csp_header_fails", () => {
  const m = clone(COMPLETE) as any;
  m.security.csp_header_present = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "csp_header_present"), "fail");
  assert.equal(v.verdict, "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET");
});

test("test_secrets_in_client_code_fail", () => {
  const m = clone(COMPLETE) as any;
  m.security.secrets_in_client_code_or_repos_present = true;
  assert.equal(evaluate(m).verdict, "EFFICIENT_WEB_BUILD_STANDARD_NOT_MET");
});

test("test_testing_on_live_site_fails", () => {
  const m = clone(COMPLETE) as any;
  m.process.testing_done_on_live_site_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_testing_on_live_site"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.process;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["delivery_security_and_process"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.pages_count, null);
  assert.equal(v.shared_pages_not_precomputed, null);
  assert.equal(v.precomputed_pages_over_single_read, null);
  assert.equal(v.total_calls_per_load, null);
  assert.equal(v.max_calls_per_load, null);
  assert.equal(v.precomputed_page_coverage, null);
  assert.equal(v.single_read_page_coverage, null);
  assert.equal(v.interactive_js_gzipped_kb, null);
  assert.equal(v.content_page_cpu_p99_ms, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: EFFICIENT_WEB_BUILD_STANDARD_MET"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types — the Python
// MalformedTypeTests, ported.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.site = 12345;
  assert.throws(() => evaluate(m), fieldError("site"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ caching: "should-be-an-object" }),
    fieldError("caching"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ pages: { name: "home" } }),
    fieldError("pages"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ pages: ["home"] }),
    fieldError("pages[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.plan.call_count_stated = "yes";
  assert.throws(() => evaluate(m), fieldError("plan.call_count_stated"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pages[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("pages[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pages[0].rendered_at_publish = "yes";
  assert.throws(() => evaluate(m), fieldError("pages[0].rendered_at_publish"));
});

test("malformed: calls per load as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pages[0].calls_per_load = "1";
  assert.throws(() => evaluate(m), fieldError("pages[0].calls_per_load"));
});

test("malformed: calls per load as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pages[0].calls_per_load = true;
  assert.throws(() => evaluate(m), fieldError("pages[0].calls_per_load"));
});

test("malformed: max age as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.caching.hashed_asset_max_age_seconds = "31536000";
  assert.throws(() => evaluate(m), fieldError("caching.hashed_asset_max_age_seconds"));
});

test("malformed: cpu p99 as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.delivery.content_page_cpu_p99_ms = "0.4";
  assert.throws(() => evaluate(m), fieldError("delivery.content_page_cpu_p99_ms"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.process = null;
  assert.throws(() => evaluate(m), fieldError("process"));
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
  .filter((f) => f.startsWith("efficient-web-build-standard--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
