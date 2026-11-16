import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/network-exposure-audit.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  system: "home-server-01",
  environment: "production",
  inventory: { current: true },
  endpoints: [
    { id: "web", host: "example.com", port: 443, protocol: "https", public: true, listed: true, owner: "netsec", service: "web", zone: "public-edge", via: "direct", tls_cert_valid: true, auth_required: false },
    { id: "api", host: "api.example.com", port: 443, protocol: "https", public: true, listed: true, owner: "platform", service: "api", zone: "app", via: "direct", tls_cert_valid: true, auth_required: true },
    { id: "admin-tunnel", host: "admin.internal", port: 8443, protocol: "https", public: false, listed: true, owner: "netsec", service: "admin", zone: "admin", via: "tunnel", tls_cert_valid: true, auth_required: true },
    { id: "db-internal", host: "db.internal", port: 5432, protocol: "tls", public: false, listed: true, owner: "platform", service: "database", zone: "data", via: "direct", tls_cert_valid: true, auth_required: true },
  ],
  segmentation: { zones_separated: true, admin_plane_separate: true, default_deny: true, loopback_by_default: true },
  tls: { cert_expiry_monitored: true, hsts_on_web: true, min_version: "1.2" },
  dns: { registrar_lock: true, registrar_2fa: true, dnssec_enabled: true },
  domains: [
    { name: "example.com", sending: true, spf: true, dkim: true, dmarc: true },
    { name: "example.org", sending: false, spf: false, dkim: false, dmarc: false },
  ],
  email: { dmarc_reports_monitored: true },
  edge: { waf_or_cdn_in_front_of_web: true, rate_limits_enabled: true },
  access: { admin_authenticated_path_only: true, no_default_credentials: true },
  egress: { outbound_allowlist: true, unexpected_egress_logged: true },
  evidence: { events_logged_denied_and_accepted: true, reviewed_on_change_and_incident: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkOf(v: any, name: string) {
  return v.checks.find((c: any) => c.check === name);
}

// ---- The Python VerdictTests, ported ----

test("test_sound_manifest_is_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 27);
});

test("test_plaintext_endpoint_is_a_fail", () => {
  const m = clone(SOUND) as any;
  m.endpoints[0].protocol = "http";
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  const c = checkOf(v, "no_plaintext_protocol_endpoints");
  assert.equal(c.status, "fail");
  assert.ok(c.evidence.includes("web"));
});

test("test_public_admin_endpoint_is_a_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.endpoints[2].public = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  const c = checkOf(v, "no_admin_or_db_endpoint_public");
  assert.equal(c.status, "fail");
  assert.ok(c.evidence.includes("admin-tunnel"));
});

test("test_public_database_port_is_a_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.endpoints[3].public = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(checkOf(v, "no_admin_or_db_endpoint_public").status, "fail");
});

test("test_unlisted_public_endpoint_fails", () => {
  const m = clone(SOUND) as any;
  m.endpoints[0].listed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(checkOf(v, "no_unlisted_public_endpoints").status, "fail");
});

test("test_unowned_public_endpoint_fails", () => {
  const m = clone(SOUND) as any;
  delete m.endpoints[1].owner;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  const c = checkOf(v, "every_public_endpoint_owned");
  assert.equal(c.status, "fail");
  assert.ok(c.evidence.includes("api"));
});

test("test_private_endpoint_without_owner_passes", () => {
  const m = clone(SOUND) as any;
  delete m.endpoints[3].owner;
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
});

test("test_invalid_cert_on_encrypted_endpoint_fails", () => {
  const m = clone(SOUND) as any;
  m.endpoints[0].tls_cert_valid = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(checkOf(v, "encrypted_endpoints_have_valid_certs").status, "fail");
});

test("test_old_tls_min_version_fails", () => {
  const m = clone(SOUND) as any;
  m.tls.min_version = "1.1";
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(checkOf(v, "modern_tls_min_version").status, "fail");
});

test("test_tls_13_min_version_passes", () => {
  const m = clone(SOUND) as any;
  m.tls.min_version = "1.3";
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
});

test("test_sending_domain_without_dmarc_fails", () => {
  const m = clone(SOUND) as any;
  m.domains[0].dmarc = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  const c = checkOf(v, "every_sending_domain_has_spf_dkim_dmarc");
  assert.equal(c.status, "fail");
  assert.ok(c.evidence.includes("example.com"));
});

test("test_non_sending_domain_without_auth_passes", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(checkOf(v, "every_sending_domain_has_spf_dkim_dmarc").status, "pass");
});

test("test_unauthenticated_tunnel_is_a_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.endpoints[2].auth_required = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(checkOf(v, "no_unauthenticated_tunnels").status, "fail");
});

test("test_stale_inventory_fails", () => {
  const m = clone(SOUND) as any;
  m.inventory.current = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["inventory"], "fail");
});

test("test_open_segmentation_posture_fails", () => {
  const m = clone(SOUND) as any;
  m.segmentation.default_deny = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["segmentation"], "fail");
});

test("test_no_egress_allowlist_fails", () => {
  const m = clone(SOUND) as any;
  m.egress.outbound_allowlist = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["egress_evidence"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.dns;
  delete m.email;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["dns_email"], "insufficient_evidence");
});

test("test_absent_endpoints_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.endpoints;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkOf(v, "no_plaintext_protocol_endpoints").status, "missing");
});

test("test_non_list_endpoints_rejected", () => {
  // F1 test correction (coordinator ruling, 2026-11-15): this test
  // previously asserted an in-band UNSOUND verdict over endpoints
  // as a string — a wrong-typed documented field. That assertion
  // encoded the F1 defect itself: endpoints is documented as a
  // list, so the manifest is rejected with FieldTypeError naming
  // the field.
  const m = clone(SOUND) as any;
  m.endpoints = "all-of-them";
  assert.throws(
    () => evaluate(m),
    (err: unknown) =>
      err instanceof FieldTypeError && err.field === "endpoints",
  );
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.checks.length, 27);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(SOUND));
  assert.ok(stamp(v).includes("VERDICT: SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types (external verification
// Wave 1) — the Python MalformedTypeTests, ported. A documented
// field present with the wrong JSON type raises FieldTypeError
// naming the field — never a verdict over garbage.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: recorded external case rejected", () => {
  assert.throws(
    () => evaluate({ inventory: { current: "not-a-boolean" } }),
    fieldError("inventory.current"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  assert.throws(
    () => evaluate({ inventory: { current: "not-a-boolean" } }),
    fieldError("inventory.current"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ inventory: "current" }),
    fieldError("inventory"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.endpoints = "all-of-them";
  assert.throws(() => evaluate(m), fieldError("endpoints"));
});

test("malformed: list entry field as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.endpoints[0].port = "443";
  assert.throws(() => evaluate(m), fieldError("endpoints[0].port"));
});

test("malformed: domain entry field as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.domains[0].spf = "yes";
  assert.throws(() => evaluate(m), fieldError("domains[0].spf"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.tls = null;
  assert.throws(() => evaluate(m), fieldError("tls"));
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
  .filter((f) => f.startsWith("network-exposure-audit--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for network-exposure-audit");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
