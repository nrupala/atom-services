// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** Takedown-presentation patch (owner directive 2026-11-15 21:50 MST):
 *  the kill-switch-disabled atoms come down on every PRESENTATION
 *  surface, derived from LIVE D1 config (atom_enabled:<atom>) at
 *  request time — no hardcoded list in the code under test. The
 *  seven names below are the test FIXTURE (the production state
 *  this patch was built for); the flip test at the end proves the
 *  presentation follows the config, not the fixture.
 *
 *  Forms covered: (1) catalogue rows removed, (2) /api.json status
 *  fields, (3) /health serving list + disabled_atoms, (4) MCP
 *  tools/list empty for disabled / intact for live, (5) MCP
 *  tools/call to a disabled atom → literal HTTP 503 (REST face
 *  already refused 503 via callpath and still does). */

import assert from "node:assert/strict";
import { test } from "node:test";

import { MemoryStore } from "../src/store.js";
import { issueKeyForAtom } from "../src/auth.js";
import { catalogueHtml, feedJson } from "../src/catalogue.js";
import { handleRequest, type Env } from "../src/index.js";

const MASTER = "test-master-secret-not-a-real-one";
const NOW = new Date("2026-11-15T12:00:00.000Z");
const ORIGIN = "https://atoms.pipavia.com";

const SEVEN = [
  "electrical-machines-expert-advice",
  "portfolio-risk-analytics-report",
  "reconciled-portfolio-performance-report",
  "strategy-backtest-validation",
  "behavioral-finance-bias-check",
  "behavioral-finance-debiasing",
  "difficult-conversation-coaching",
];
const LIVE = "release-readiness-verdict";
const DISABLED = "difficult-conversation-coaching";

const READY = {
  product: "example-app",
  version: "1.2.0",
  version_bump_locations: ["VERSION"],
  tag: { name: "v1.2.0", annotated: true, moved: false },
  changelog: { has_entry_for_version: true, unreleased_section_moved: true },
  release_notes: { present: true, breaking_changes: [], migration_steps: [] },
  approver: "release-owner",
  approval: { hitl_recorded: true },
  rollout_plan: { present: true },
  rollback_plan: { present: true, testable: true },
  health_check: { window_hours: 36 },
  artifacts: { sealed: true, checksum_manifest: true, verified_before_announcement: true },
  tests: { passing: true },
};

function env(): Env {
  return {
    ATOMS_MASTER_SECRET: MASTER,
    RESEND_API_KEY: "test-resend-key",
    STRIPE_MODE: "test",
    PUBLIC_BASE_URL: ORIGIN,
  } as Env;
}

function storeWithSevenDisabled(): MemoryStore {
  const store = new MemoryStore();
  for (const name of SEVEN) store.config.set(`atom_enabled:${name}`, "0");
  return store;
}

async function keyFor(store: MemoryStore, atom: string, email = "probe@example.com"): Promise<string> {
  const res = await issueKeyForAtom(store, MASTER, email, atom, NOW);
  assert.ok(res.ok);
  return res.key;
}

async function mcp(store: MemoryStore, atom: string, key: string | null, payload: unknown) {
  const res = await handleRequest(
    new Request(`${ORIGIN}/mcp/${atom}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(key ? { authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify(payload),
    }),
    env(),
    store
  );
  const text = await res.text();
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep raw status only */
  }
  return { status: res.status, body: body as Record<string, unknown> };
}

// ---- (1) catalogue page -----------------------------------------------------

test("catalogue page: the seven disabled atoms' rows are removed; live rows unchanged", async () => {
  const store = storeWithSevenDisabled();
  const html = await catalogueHtml(ORIGIN, store);
  for (const name of SEVEN) {
    assert.ok(!html.includes(name), `catalogue must not contain ${name}`);
  }
  assert.ok(html.includes(LIVE), "live atom row must remain");
  assert.ok(html.includes("Release-readiness verdict"), "live atom display name must remain");
  // Same through the HTTP surface.
  const res = await handleRequest(new Request(`${ORIGIN}/`), env(), store);
  assert.equal(res.status, 200);
  const served = await res.text();
  for (const name of SEVEN) assert.ok(!served.includes(name), `served catalogue must not contain ${name}`);
  assert.ok(served.includes(LIVE));
});

// ---- (2) /api.json status fields ---------------------------------------------

test("/api.json: every entry carries a status; the seven are disabled, live atoms are live", async () => {
  const store = storeWithSevenDisabled();
  const feed = (await feedJson(ORIGIN, store)) as {
    atoms: Array<{ name: string; status?: string }>;
  };
  assert.ok(feed.atoms.length > SEVEN.length);
  for (const entry of feed.atoms) {
    assert.ok(entry.status === "live" || entry.status === "disabled", `entry ${entry.name} lacks a status`);
    assert.equal(entry.status, SEVEN.includes(entry.name) ? "disabled" : "live", `wrong status for ${entry.name}`);
  }
  const res = await handleRequest(new Request(`${ORIGIN}/api.json`), env(), store);
  assert.equal(res.status, 200);
  const served = (await res.json()) as typeof feed;
  assert.equal(served.atoms.find((a) => a.name === DISABLED)?.status, "disabled");
  assert.equal(served.atoms.find((a) => a.name === LIVE)?.status, "live");
});

// ---- (3) /health shape --------------------------------------------------------

test("/health: atoms lists serving atoms only; disabled_atoms names the seven", async () => {
  const store = storeWithSevenDisabled();
  const res = await handleRequest(new Request(`${ORIGIN}/health`), env(), store);
  assert.equal(res.status, 200);
  const body = (await res.json()) as { atoms: string[]; disabled_atoms: string[] };
  for (const name of SEVEN) assert.ok(!body.atoms.includes(name), `/health atoms must exclude ${name}`);
  assert.deepEqual([...body.disabled_atoms].sort(), [...SEVEN].sort());
  assert.ok(body.atoms.includes(LIVE));
});

// ---- (4) MCP tools/list ---------------------------------------------------------

test("MCP tools/list: empty for a disabled atom, intact for a live atom; keyless still 401", async () => {
  const store = storeWithSevenDisabled();
  const disabledKey = await keyFor(store, DISABLED);
  const listDisabled = await mcp(store, DISABLED, disabledKey, { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  assert.equal(listDisabled.status, 200);
  const toolsDisabled = (listDisabled.body.result as { tools: unknown[] }).tools;
  assert.deepEqual(toolsDisabled, []);

  const liveKey = await keyFor(store, LIVE, "live@example.com");
  const listLive = await mcp(store, LIVE, liveKey, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  assert.equal(listLive.status, 200);
  const toolsLive = (listLive.body.result as { tools: Array<{ name: string }> }).tools;
  assert.equal(toolsLive.length, 1);
  assert.equal(toolsLive[0].name, "release_readiness_verdict");

  const keyless = await mcp(store, DISABLED, null, { jsonrpc: "2.0", id: 3, method: "tools/list", params: {} });
  assert.equal(keyless.status, 401);
});

// ---- (5) MCP tools/call → literal 503 -------------------------------------------

test("MCP tools/call to a disabled atom: literal HTTP 503 with the refusal body", async () => {
  const store = storeWithSevenDisabled();
  const key = await keyFor(store, DISABLED);
  const res = await mcp(store, DISABLED, key, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "difficult_conversation_coaching", arguments: {} },
  });
  assert.equal(res.status, 503);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.error, "atom_disabled");
  assert.match(String(res.body.detail), /difficult-conversation-coaching/);
  assert.equal(store.usage.length, 0); // refused calls are not metered

  const init = await mcp(store, DISABLED, key, { jsonrpc: "2.0", id: 2, method: "initialize", params: {} });
  assert.equal(init.status, 503);
  assert.equal(init.body.error, "atom_disabled");
});

test("REST face to a disabled atom still refuses literal 503 (unchanged callpath behaviour)", async () => {
  const store = storeWithSevenDisabled();
  const key = await keyFor(store, DISABLED);
  const res = await handleRequest(
    new Request(`${ORIGIN}/v1/${DISABLED}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({}),
    }),
    env(),
    store
  );
  assert.equal(res.status, 503);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "atom_disabled");
});

test("live atom golden call still returns 200 with the verdict on both faces", async () => {
  const store = storeWithSevenDisabled();
  const key = await keyFor(store, LIVE);
  const viaMcp = await mcp(store, LIVE, key, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "release_readiness_verdict", arguments: READY },
  });
  assert.equal(viaMcp.status, 200);
  const result = viaMcp.body.result as { structuredContent: { verdict: string } };
  assert.equal(result.structuredContent.verdict, "READY");

  const viaRest = await handleRequest(
    new Request(`${ORIGIN}/v1/${LIVE}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(READY),
    }),
    env(),
    store
  );
  assert.equal(viaRest.status, 200);
  assert.equal(((await viaRest.json()) as { verdict: string }).verdict, "READY");
});

// ---- flip test: presentation follows live config, no rebuild -------------------

test("flip: toggling atom_enabled in the store flips every presentation surface", async () => {
  const store = storeWithSevenDisabled();
  const liveKey = await keyFor(store, LIVE);

  // Disable the live atom at "runtime" — same process, same bundle.
  store.config.set(`atom_enabled:${LIVE}`, "0");

  const html = await catalogueHtml(ORIGIN, store);
  assert.ok(!html.includes(LIVE), "flipped-off atom must leave the catalogue");
  const feed = (await feedJson(ORIGIN, store)) as { atoms: Array<{ name: string; status?: string }> };
  assert.equal(feed.atoms.find((a) => a.name === LIVE)?.status, "disabled");
  const healthRes = await handleRequest(new Request(`${ORIGIN}/health`), env(), store);
  const health = (await healthRes.json()) as { atoms: string[]; disabled_atoms: string[] };
  assert.ok(!health.atoms.includes(LIVE));
  assert.ok(health.disabled_atoms.includes(LIVE));
  const list = await mcp(store, LIVE, liveKey, { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
  assert.deepEqual((list.body.result as { tools: unknown[] }).tools, []);
  const call = await mcp(store, LIVE, liveKey, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "release_readiness_verdict", arguments: READY },
  });
  assert.equal(call.status, 503);

  // Re-enable one of the seven — it comes back everywhere.
  store.config.set(`atom_enabled:${DISABLED}`, "1");
  const html2 = await catalogueHtml(ORIGIN, store);
  assert.ok(html2.includes(DISABLED), "re-enabled atom must return to the catalogue");
  const feed2 = (await feedJson(ORIGIN, store)) as { atoms: Array<{ name: string; status?: string }> };
  assert.equal(feed2.atoms.find((a) => a.name === DISABLED)?.status, "live");
  const health2 = (await (await handleRequest(new Request(`${ORIGIN}/health`), env(), store)).json()) as {
    atoms: string[];
    disabled_atoms: string[];
  };
  assert.ok(health2.atoms.includes(DISABLED));
  assert.ok(!health2.disabled_atoms.includes(DISABLED));
  const disabledKey = await keyFor(store, DISABLED, "flip@example.com");
  const list2 = await mcp(store, DISABLED, disabledKey, { jsonrpc: "2.0", id: 3, method: "tools/list", params: {} });
  assert.equal((list2.body.result as { tools: unknown[] }).tools.length, 1);
});
