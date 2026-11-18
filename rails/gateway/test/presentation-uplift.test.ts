// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** AxiomCode-standard uplift (2026-11-18): (1) the fleet SKILL.md
 *  is served at GET /SKILL.md, mechanically the repo-root file
 *  (src/skill.generated.ts via tools/sync-skill.mjs); (2) every live
 *  catalogue row and feed row carries the atom's generated
 *  does-not-cover line (tools/sync-limits.mjs, verbatim from the
 *  atom's SERVICE.md) and its measured trace (tools/sync-traces.mjs,
 *  from the recorded verification runs) with the not-run /
 *  not-covered / excluded buckets; (3) a kill-switch-disabled atom
 *  keeps the takedown presentation — absent from the HTML, and its
 *  feed row carries NEITHER field. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { MemoryStore } from "../src/store.js";
import { catalogueHtml, feedJson } from "../src/catalogue.js";
import { handleRequest, type Env } from "../src/index.js";
import { SKILL_MD } from "../src/skill.generated.js";
import { LIMITS } from "../src/limits.generated.js";
import { TRACES } from "../src/traces.generated.js";

const ORIGIN = "https://atoms.pipavia.com";
const LIVE_ATOM = "release-readiness-verdict";
const DISABLED_ATOM = "difficult-conversation-coaching";
const BATCH23_ATOM = "markdown-sanitizer";
const EXCLUDED_ATOM = "zero-knowledge-system-design-pack";


function env(): Env {
  return {
    ATOMS_MASTER_SECRET: ["test", "master"].join("-"),
    RESEND_API_KEY: ["test", "resend"].join("-"),
    STRIPE_MODE: "test",
    PUBLIC_BASE_URL: ORIGIN,
  } as Env;
}

function storeWithDisabled(): MemoryStore {
  const store = new MemoryStore();
  store.config.set(`atom_enabled:${DISABLED_ATOM}`, "0");
  return store;
}

interface FeedAtom {
  name: string;
  status: string;
  does_not_cover?: string;
  measured_trace?: {
    summary: string;
    not_run: string[];
    not_covered: string | null;
    excluded: { leg: string; reason: string }[];
  };
}

// ---- (1) the served SKILL.md ------------------------------------------------

test("skill: GET /SKILL.md serves the repo file verbatim", async () => {
  const res = await handleRequest(
    new Request(`${ORIGIN}/SKILL.md`, { method: "GET" }),
    env(),
    new MemoryStore(),
  );
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /text\/markdown/);
  const body = await res.text();
  assert.equal(body, SKILL_MD);
  // The onboarding claims an arriving agent depends on.
  for (const needle of [
    "/api.json",
    "POST /v1/signup",
    "/v1/auth/redeem",
    "POST /v1/keys",
    "scope_required",
    "rate_limit",
    "atom_disabled",
    "INSUFFICIENT_EVIDENCE",
    "org.aimlds/atom-",
  ]) {
    assert.ok(body.includes(needle), `SKILL.md must mention ${needle}`);
  }
});

// ---- (2) the feed ------------------------------------------------------------

test("feed: live rows carry does_not_cover + measured_trace; disabled rows carry neither", async () => {
  const feed = await feedJson(ORIGIN, storeWithDisabled());
  assert.equal(feed.skill, `${ORIGIN}/SKILL.md`);
  const atoms = feed.atoms as FeedAtom[];
  const live = atoms.find((a) => a.name === LIVE_ATOM);
  assert.ok(live && live.status === "live");
  assert.equal(live.does_not_cover, LIMITS[LIVE_ATOM]);
  assert.ok(live.measured_trace);
  assert.equal(live.measured_trace.summary, TRACES[LIVE_ATOM].summary);
  assert.ok(
    live.measured_trace.not_run.includes("Guardian Mesh disposition"),
    "the GM not-run bucket is named on every atom",
  );
  assert.equal(live.measured_trace.not_covered, LIMITS[LIVE_ATOM]);

  const disabled = atoms.find((a) => a.name === DISABLED_ATOM);
  assert.ok(disabled && disabled.status === "disabled");
  assert.equal(disabled.does_not_cover, undefined);
  assert.equal(disabled.measured_trace, undefined);

  // Every live row with a generated record carries both fields; no
  // disabled row carries either. (On this master tree the registry
  // also lists the six U-13-held atoms: they have limits lines but
  // no trace — HELD_NO_TRACE in tools/sync-traces.mjs — and they
  // are absent from the deploy registry entirely, so the deployed
  // fleet is universal.)
  for (const a of atoms) {
    if (a.status === "live") {
      assert.ok(a.does_not_cover, `${a.name}: live row must carry does_not_cover`);
      if (TRACES[a.name]) {
        assert.ok(a.measured_trace, `${a.name}: live row with a trace record must carry measured_trace`);
      }
    } else {
      assert.equal(a.does_not_cover, undefined, `${a.name}: disabled row must not carry does_not_cover`);
      assert.equal(a.measured_trace, undefined, `${a.name}: disabled row must not carry measured_trace`);
    }
  }
});

test("feed: batch 23 trace names the external battery as not run", async () => {
  const feed = await feedJson(ORIGIN, new MemoryStore());
  const atoms = feed.atoms as FeedAtom[];
  const b23 = atoms.find((a) => a.name === BATCH23_ATOM);
  assert.ok(b23?.measured_trace);
  assert.ok(
    b23.measured_trace.not_run.some((s) => s.includes("External verification battery")),
    "a Batch 23 atom must name its un-run external battery",
  );
  assert.match(b23.measured_trace.summary, /gate verdict PASS WITH FINDINGS/);
});

test("feed: excluded bucket comes from the atom's gate record", async () => {
  const feed = await feedJson(ORIGIN, new MemoryStore());
  const atoms = feed.atoms as FeedAtom[];
  const zk = atoms.find((a) => a.name === EXCLUDED_ATOM);
  assert.ok(zk?.measured_trace);
  const zkLeg = zk.measured_trace.excluded.find((e) => e.leg === "Zero-knowledge");
  assert.ok(zkLeg, "zero-knowledge-system-design-pack must carry its recorded N/A leg");
  assert.match(zkLeg.reason, /No zero-knowledge proofs are produced/);
});

// ---- (3) the catalogue HTML ----------------------------------------------------

test("catalogue: live rows render the line + trace; disabled atoms are absent", async () => {
  const html = await catalogueHtml(ORIGIN, storeWithDisabled());
  assert.ok(html.includes(`href="/SKILL.md"`), "catalogue links the onboarding file");
  assert.ok(html.includes("Does not cover —"), "rows render the does-not-cover line");
  assert.ok(html.includes(LIMITS[LIVE_ATOM]), "the rendered line is the generated clause");
  assert.ok(html.includes("Measured trace —"), "rows render the measured trace");
  assert.ok(html.includes("Not run: Guardian Mesh disposition"), "the GM bucket renders by name");
  assert.ok(html.includes("Excluded: Zero-knowledge (N/A —"), "recorded N/A legs render as excluded");
  assert.ok(!html.includes(DISABLED_ATOM), "a disabled atom is absent from the catalogue HTML");
});
