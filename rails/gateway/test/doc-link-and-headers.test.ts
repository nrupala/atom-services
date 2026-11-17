// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** Batch 14 deploy integration: (1) the catalogue documentation
 *  link (staged change documentation/CATALOGUE-DOC-LINK-STAGED-CHANGE.md)
 *  integrated with the takedown-presentation patch — the feed and
 *  catalogue link a doc only for a LIVE atom with an emitted doc,
 *  and /docs/<atom> 404s for unknown, not-yet-documented and
 *  kill-switch-disabled atoms alike; (2) F-G3 security headers on
 *  every gateway response, HTML and non-HTML surfaces, success and
 *  error alike. */

import assert from "node:assert/strict";
import { test } from "node:test";

import { MemoryStore } from "../src/store.js";
import { catalogueHtml, feedJson } from "../src/catalogue.js";
import { handleRequest, type Env } from "../src/index.js";

const ORIGIN = "https://atoms.pipavia.com";
const DOCUMENTED_LIVE = "release-readiness-verdict";
const DOCUMENTED_DISABLED = "difficult-conversation-coaching";
const UNDOCUMENTED_LIVE = "validated-simulation-scenario-pack"; // Batch 23 rotation (2026-11-17): localization-readiness-review's WS1 doc has landed and is emitted — the fleet's live atoms are now fully documented, and the only registered atom still undocumented is this U-13-held one (documentation is a precondition of its publish ruling; in a fresh store it reads live with no emitted doc, which is exactly the surface this test pins)
const UNDOCUMENTED_WAIVED = "electrical-machines-expert-advice"; // U-13 disabled, N-10 waived

const TEST_MASTER = ["test", "master"].join("-");
const TEST_RESEND = ["test", "resend"].join("-");

function env(): Env {
  return {
    ATOMS_MASTER_SECRET: TEST_MASTER,
    RESEND_API_KEY: TEST_RESEND,
    STRIPE_MODE: "test",
    PUBLIC_BASE_URL: ORIGIN,
  } as Env;
}

function storeWithDisabled(): MemoryStore {
  const store = new MemoryStore();
  store.config.set(`atom_enabled:${DOCUMENTED_DISABLED}`, "0");
  store.config.set(`atom_enabled:${UNDOCUMENTED_WAIVED}`, "0");
  return store;
}

async function get(store: MemoryStore, path: string): Promise<Response> {
  return handleRequest(new Request(`${ORIGIN}${path}`, { method: "GET" }), env(), store);
}

interface FeedAtom {
  name: string;
  status: string;
  documentation?: string;
}

// ---- (1) the feed -----------------------------------------------------------

test("feed: documentation field only for a live atom with an emitted doc", async () => {
  const feed = await feedJson(ORIGIN, storeWithDisabled());
  const atoms = feed.atoms as FeedAtom[];
  const byName = new Map(atoms.map((a) => [a.name, a]));

  const live = byName.get(DOCUMENTED_LIVE);
  assert.ok(live);
  assert.equal(live.status, "live");
  assert.equal(live.documentation, `${ORIGIN}/docs/${DOCUMENTED_LIVE}`);

  const disabled = byName.get(DOCUMENTED_DISABLED);
  assert.ok(disabled);
  assert.equal(disabled.status, "disabled");
  assert.ok(!("documentation" in disabled), "a disabled atom must not gain a doc link");

  const pending = byName.get(UNDOCUMENTED_LIVE);
  assert.ok(pending);
  assert.equal(pending.status, "live");
  assert.ok(!("documentation" in pending), "an undocumented atom must not link at a missing doc");

  const waived = byName.get(UNDOCUMENTED_WAIVED);
  assert.ok(waived);
  assert.equal(waived.status, "disabled");
  assert.ok(!("documentation" in waived));
});

test("feed: the same documented atom links its doc while it is live", async () => {
  const feed = await feedJson(ORIGIN, new MemoryStore());
  const atoms = feed.atoms as FeedAtom[];
  const entry = atoms.find((a) => a.name === DOCUMENTED_DISABLED);
  assert.ok(entry);
  assert.equal(entry.status, "live");
  assert.equal(entry.documentation, `${ORIGIN}/docs/${DOCUMENTED_DISABLED}`);
});

// ---- (2) the catalogue page ---------------------------------------------------

test("catalogue: Documentation link in a documented live atom's row; none for an undocumented live atom", async () => {
  const html = await catalogueHtml(ORIGIN, new MemoryStore());
  assert.ok(html.includes(`<a href="/docs/${DOCUMENTED_LIVE}">Documentation</a>`));
  assert.ok(html.includes(UNDOCUMENTED_LIVE), "the Batch 14 atom's row is present");
  assert.ok(!html.includes(`/docs/${UNDOCUMENTED_LIVE}`), "no link at a missing doc");
});

// ---- (3) the /docs route ------------------------------------------------------

test("GET /docs/<documented live atom> serves the rendered DOCUMENTATION.md", async () => {
  const res = await get(new MemoryStore(), `/docs/${DOCUMENTED_LIVE}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") || "", /text\/html/);
  const body = await res.text();
  assert.ok(body.includes("<title>Release-readiness verdict"), "page title is the doc's H1");
  assert.ok(body.includes("Sold by 2351485 ALBERTA INC. (AIMLDS)"), "seller strip present");
});

test("GET /docs/<disabled atom> is 404 — a disabled atom is down on the docs surface too", async () => {
  const res = await get(storeWithDisabled(), `/docs/${DOCUMENTED_DISABLED}`);
  assert.equal(res.status, 404);
  const live = await get(new MemoryStore(), `/docs/${DOCUMENTED_DISABLED}`);
  assert.equal(live.status, 200, "the same page serves while the atom is live");
});

test("GET /docs/<registered but undocumented atom> is 404", async () => {
  assert.equal((await get(new MemoryStore(), `/docs/${UNDOCUMENTED_LIVE}`)).status, 404);
  assert.equal((await get(new MemoryStore(), `/docs/${UNDOCUMENTED_WAIVED}`)).status, 404);
});

test("GET /docs/<unknown atom> is 404", async () => {
  assert.equal((await get(new MemoryStore(), "/docs/no-such-atom")).status, 404);
});

// ---- (4) F-G3 security headers --------------------------------------------------

const COMMON_HEADERS: Record<string, string> = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

function assertHeaders(res: Response, html: boolean) {
  for (const [k, v] of Object.entries(COMMON_HEADERS)) {
    assert.equal(res.headers.get(k), v, `${k} on ${res.url || "response"}`);
  }
  const csp = res.headers.get("content-security-policy") || "";
  assert.ok(csp.includes("frame-ancestors 'none'"), "CSP denies framing");
  if (html) {
    assert.ok(csp.includes("default-src 'self'"), "HTML CSP is the self+inline policy");
    assert.ok(csp.includes("script-src 'unsafe-inline'"), "catalogue/docs inline script allowed by design");
  } else {
    assert.ok(csp.includes("default-src 'none'"), "non-HTML CSP is the no-content policy");
  }
}

test("security headers: JSON surfaces (health, feed, 404, 401)", async () => {
  assertHeaders(await get(new MemoryStore(), "/health"), false);
  assertHeaders(await get(new MemoryStore(), "/api.json"), false);
  assertHeaders(await get(new MemoryStore(), "/no-such-path"), false);
  const keyless = await handleRequest(
    new Request(`${ORIGIN}/v1/${DOCUMENTED_LIVE}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }),
    env(),
    new MemoryStore()
  );
  assert.equal(keyless.status, 401);
  assertHeaders(keyless, false);
});

test("security headers: HTML surfaces (catalogue, docs page)", async () => {
  assertHeaders(await get(new MemoryStore(), "/"), true);
  assertHeaders(await get(new MemoryStore(), `/docs/${DOCUMENTED_LIVE}`), true);
});
