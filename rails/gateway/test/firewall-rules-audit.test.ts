import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/firewall-rules-audit.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  system: "edge-fw-01",
  environment: "production",
  default_policy: { inbound: "deny", outbound: "deny" },
  layers_consistent: true,
  rules: [
    { id: "web-https", direction: "inbound", source: "203.0.113.0/24", destination: "10.0.1.10/32", port_start: 443, port_end: 443, protocol: "tcp", action: "allow", owner: "netsec", reason: "public web", date: "2026-10-01", service: "web" },
    { id: "ssh-admin", direction: "inbound", source: "198.51.100.10/32", destination: "10.0.1.10/32", port_start: 22, port_end: 22, protocol: "tcp", action: "allow", owner: "netsec", reason: "admin ssh from jump host", date: "2026-10-01", service: "ssh" },
    { id: "dns-egress", direction: "outbound", source: "10.0.1.10/32", destination: "1.1.1.1/32", port_start: 53, port_end: 53, protocol: "udp", action: "allow", owner: "netsec", reason: "dns resolver", date: "2026-10-01", service: "dns" },
    { id: "deny-all-in", direction: "inbound", source: "any", destination: "any", port_start: 0, port_end: 65535, protocol: "any", action: "deny" },
    { id: "deny-all-out", direction: "outbound", source: "any", destination: "any", port_start: 0, port_end: 65535, protocol: "any", action: "deny" },
  ],
  egress: { explicit_allowlist: true, alert_on_denies: true },
  change_control: { changes_reviewed: true, old_rules_retired_on_schedule: true },
  logging: { denials_logged: true, rate_limited: true },
  testing: { allowed_and_disallowed_paths_verified: true, smoke_matrix_per_service: true },
  review: { cadence_days: 30 },
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
});

test("test_any_any_allow_is_a_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.rules.splice(3, 0, { id: "bad-any", direction: "inbound", source: "any", destination: "any", port_start: 443, port_end: 443, protocol: "tcp", action: "allow", owner: "netsec", reason: "debug", date: "2026-10-01", service: "web" });
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  const c = checkOf(v, "no_any_any_allow_rules");
  assert.equal(c.status, "fail");
  assert.ok(c.evidence.includes("bad-any"));
});

test("test_shadowed_rule_fails", () => {
  const m = clone(SOUND) as any;
  const dupe = clone(m.rules[0]);
  dupe.id = "web-https-dupe";
  m.rules.splice(1, 0, dupe);
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  const c = checkOf(v, "no_shadowed_rules");
  assert.equal(c.status, "fail");
  assert.ok(c.evidence.includes("web-https-dupe shadowed by web-https"));
});

test("test_overly_broad_port_range_fails", () => {
  const m = clone(SOUND) as any;
  m.rules[0].port_start = 1000;
  m.rules[0].port_end = 3000;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(checkOf(v, "no_overly_broad_port_ranges").status, "fail");
});

test("test_direct_database_exposure_fails", () => {
  const m = clone(SOUND) as any;
  m.rules.splice(3, 0, { id: "db-open", direction: "inbound", source: "any", destination: "10.0.2.20/32", port_start: 5432, port_end: 5432, protocol: "tcp", action: "allow", owner: "netsec", reason: "db access", date: "2026-10-01", service: "database" });
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  const c = checkOf(v, "no_direct_sensitive_exposure");
  assert.equal(c.status, "fail");
  assert.ok(c.evidence.includes("db-open"));
});

test("test_open_default_policy_fails_baseline", () => {
  const m = clone(SOUND) as any;
  m.default_policy.inbound = "allow";
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["baseline"], "fail");
});

test("test_missing_explicit_default_deny_rule_fails", () => {
  const m = clone(SOUND) as any;
  m.rules = m.rules.filter((r: any) => r.action === "allow");
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(checkOf(v, "explicit_default_deny_rule_present").status, "fail");
});

test("test_undocumented_allow_rule_fails", () => {
  const m = clone(SOUND) as any;
  delete m.rules[0].owner;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  const c = checkOf(v, "every_allow_rule_documented");
  assert.equal(c.status, "fail");
  assert.ok(c.evidence.includes("web-https"));
});

test("test_temporary_rule_without_ticket_fails", () => {
  const m = clone(SOUND) as any;
  m.rules[1].temporary = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(checkOf(v, "temporary_rules_have_ticket_and_expiry").status, "fail");
});

test("test_temporary_rule_with_ticket_and_expiry_passes", () => {
  const m = clone(SOUND) as any;
  m.rules[1].temporary = true;
  m.rules[1].ticket = "SEC-123";
  m.rules[1].expiry_date = "2026-12-01";
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
});

test("test_unreviewed_port_forward_fails", () => {
  const m = clone(SOUND) as any;
  m.rules[0].port_forward = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(checkOf(v, "no_port_forwards_without_review").status, "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.logging;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["assurance"], "insufficient_evidence");
});

test("test_review_cadence_over_31_days_fails", () => {
  const m = clone(SOUND) as any;
  m.review.cadence_days = 90;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["assurance"], "fail");
});

test("test_non_explicit_egress_fails", () => {
  const m = clone(SOUND) as any;
  m.egress.explicit_allowlist = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["egress"], "fail");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.checks.length, 20);
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
    () => evaluate({ system: "malformed-test", review: { cadence_days: "thirty" } }),
    fieldError("review.cadence_days"),
  );
});

test("malformed: cadence_days as string rejected", () => {
  assert.throws(
    () => evaluate({ review: { cadence_days: "thirty" } }),
    fieldError("review.cadence_days"),
  );
});

test("malformed: nested leaf as number rejected", () => {
  const m = clone(SOUND) as any;
  m.default_policy.inbound = 123;
  assert.throws(() => evaluate(m), fieldError("default_policy.inbound"));
});

test("malformed: rules as string rejected", () => {
  const m = clone(SOUND) as any;
  m.rules = "not-a-list";
  assert.throws(() => evaluate(m), fieldError("rules"));
});

test("malformed: rule entry field as number rejected", () => {
  const m = clone(SOUND) as any;
  m.rules[0].action = 42;
  assert.throws(() => evaluate(m), fieldError("rules[0].action"));
});

test("malformed: null field rejected", () => {
  const m = clone(SOUND) as any;
  m.review = null;
  assert.throws(() => evaluate(m), fieldError("review"));
});

test("malformed: documented port fallback not rejected", () => {
  const m = clone(SOUND) as any;
  m.rules[0].port_start = "443";
  const v = evaluate(m);
  assert.ok(["SOUND", "UNSOUND", "INSUFFICIENT_EVIDENCE"].includes(v.verdict));
});

// ---- Golden-fixture parity against the Python oracle ----

// Compiled output lives in dist/test/, fixtures in test/fixtures/.
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
  .filter((f) => f.startsWith("firewall-rules-audit--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for firewall-rules-audit");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
