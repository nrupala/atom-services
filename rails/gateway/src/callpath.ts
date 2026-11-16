// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** The metered call path shared by the MCP face and the /v1 face,
 *  plus the MCP streamable-HTTP envelope (Conduit pattern:
 *  initialize / ping / tools/list / tools/call, JSON-RPC errors,
 *  notifications acknowledged with 202).
 *
 *  Order of fences (contracts.md): 401 unknown key → 403 missing
 *  scope → 503 atom disabled (kill switch) → 429 rate limit (not
 *  metered) → 402 balance exhausted when the atom's rate is priced
 *  (not metered) → run → meter + draw. Internal keys run the same
 *  path with the rate forced to zero and land in the internal
 *  ledger.
 */

import { authenticateKey, bearerKey, log, type GatewayEnv } from "./auth.js";
import { resolveAtom, InputError, type AtomHandler } from "./atoms-registry.js";
import { RATES, type AtomRate } from "./generated.js";
import type { Store } from "./store.js";
import type { KeyRecord } from "./keys.js";
import { sha256Hex } from "./crypto.js";

export const RATE_LIMIT_MINUTE = 60;
export const RATE_LIMIT_DAY = 10_000;

export interface CallOutcome {
  status: number;
  body: Record<string, unknown>;
}

async function atomEnabled(store: Store, serviceName: string): Promise<boolean> {
  const v = await store.getConfig(`atom_enabled:${serviceName}`);
  return v !== "0";
}

export async function executeCall(
  store: Store,
  env: GatewayEnv,
  atom: AtomHandler,
  record: KeyRecord,
  input: Record<string, unknown>,
  now: Date,
  callId: string,
  rates: Record<string, AtomRate> = RATES
): Promise<CallOutcome> {
  if (!record.scopes.includes(atom.namespace)) {
    return {
      status: 403,
      body: { ok: false, error: "scope_required", detail: `this key does not hold the ${atom.namespace} scope; issue it for this atom first` },
    };
  }
  if (!(await atomEnabled(store, atom.serviceName))) {
    return { status: 503, body: { ok: false, error: "atom_disabled", detail: `${atom.serviceName} is currently disabled` } };
  }

  // Rate limits: per key, per atom (contract SPEC defaults).
  const minuteWindow = now.toISOString().slice(0, 16);
  const dayWindow = now.toISOString().slice(0, 10);
  const perMinute = await store.bumpCounter(record.fingerprint, atom.serviceName, "minute", minuteWindow);
  if (perMinute > RATE_LIMIT_MINUTE) {
    return { status: 429, body: { ok: false, error: "rate_limit", detail: `per-key limit ${RATE_LIMIT_MINUTE}/minute for ${atom.serviceName} exceeded` } };
  }
  const perDay = await store.bumpCounter(record.fingerprint, atom.serviceName, "day", dayWindow);
  if (perDay > RATE_LIMIT_DAY) {
    return { status: 429, body: { ok: false, error: "rate_limit", detail: `per-key limit ${RATE_LIMIT_DAY}/day for ${atom.serviceName} exceeded` } };
  }

  // Rate: config-generated from the atom's contract. Internal keys
  // always run at zero. An unset (null) rate meters at zero —
  // the free-trial posture.
  // TEMPORARY TEST LEVER (billing-proof cycle, 2026-11-15): a D1
  // config row `rate_override:<service>` holding integer micro-USD
  // overrides the generated rate for non-internal keys. Absent row
  // = generated rate applies. The contract is never edited for
  // this; deleting the row restores the contract rate immediately.
  let rateMicro = record.isInternal ? 0 : (rates[atom.serviceName]?.rateMicro ?? null);
  if (!record.isInternal) {
    const overrideRaw = await store.getConfig(`rate_override:${atom.serviceName}`);
    if (overrideRaw !== null) {
      const parsed = Number(overrideRaw);
      if (Number.isFinite(parsed) && parsed >= 0) rateMicro = Math.round(parsed);
    }
  }
  const chargeMicro = rateMicro ?? 0;

  if (chargeMicro > 0) {
    const balance = await store.getBalance(record.email);
    if (balance < chargeMicro) {
      return { status: 402, body: { ok: false, error: "balance_exhausted", detail: "prepaid balance is below this atom's per-call rate; buy a balance pack to continue" } };
    }
  }

  let artifact: Record<string, unknown>;
  try {
    artifact = atom.run(input);
  } catch (e) {
    if (e instanceof InputError) {
      return { status: 422, body: { ok: false, error: "invalid_input", field: e.field, detail: e.message } };
    }
    log("error", { event: "atom_run_failed", atom: atom.serviceName, err: String(e) });
    return { status: 500, body: { ok: false, error: "internal_error", detail: "the atom failed to run" } };
  }

  // Settle: draw (when priced) + metering row. The draw's
  // idempotency key is the call id, so a retried settle moves
  // money at most once.
  let balanceAfter: number | null = null;
  if (chargeMicro > 0) {
    const drawn = await store.appendLedger({
      email: record.email,
      kind: "draw",
      atom: atom.serviceName,
      amountMicro: -chargeMicro,
      idempotencyKey: `call:${callId}`,
      ref: callId,
      now: now.toISOString(),
    });
    balanceAfter = drawn.balanceAfter;
  } else {
    balanceAfter = await store.getBalance(record.email);
  }
  const scopeMarker = record.isInternal ? `${atom.namespace}_internal` : atom.namespace;
  await store.appendUsage(record.isInternal, {
    keyFingerprint: record.fingerprint,
    email: record.email,
    atom: atom.serviceName,
    scope: scopeMarker,
    rateChargedMicro: chargeMicro,
    balanceAfterMicro: balanceAfter,
    createdAt: now.toISOString(),
  });
  log("info", {
    event: "atom_call",
    atom: atom.serviceName,
    key_fp: record.fingerprint.slice(0, 8),
    internal: record.isInternal,
    rate_charged_micro: chargeMicro,
  });
  return { status: 200, body: artifact };
}

/** Authenticate + dispatch one atom call (REST face). */
export async function restCall(
  store: Store,
  env: GatewayEnv,
  serviceName: string,
  request: Request,
  input: Record<string, unknown>,
  now: Date
): Promise<CallOutcome> {
  const atom = resolveAtom(serviceName);
  if (!atom) return { status: 404, body: { ok: false, error: "unknown_atom", detail: serviceName } };
  if (!env.ATOMS_MASTER_SECRET) return { status: 500, body: { ok: false, error: "server_misconfigured", detail: "key verification is not configured" } };
  const record = await authenticateKey(store, env.ATOMS_MASTER_SECRET, bearerKey(request));
  if (!record) return { status: 401, body: { ok: false, error: "unauthorized", detail: "missing or invalid gateway API key" } };
  return executeCall(store, env, atom, record, input, now, crypto.randomUUID());
}

// ---------------------------------------------------------------------------
// MCP envelope
// ---------------------------------------------------------------------------

const MCP_PROTOCOL = "2025-06-18";

function rpcResult(id: unknown, result: unknown): Record<string, unknown> {
  return { jsonrpc: "2.0", id: id ?? null, result };
}
function rpcError(id: unknown, code: number, message: string): Record<string, unknown> {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

export async function mcpCall(
  store: Store,
  env: GatewayEnv,
  serviceName: string,
  request: Request,
  payload: unknown,
  now: Date
): Promise<{ status: number; body: unknown }> {
  const atom = resolveAtom(serviceName);
  if (!atom) return { status: 404, body: { error: "unknown atom" } };
  if (!env.ATOMS_MASTER_SECRET) return { status: 500, body: { error: "server misconfigured: key verification is not configured" } };
  // The whole MCP surface is key-gated on this gateway (brief:
  // initialize / tools/list without a key are refused too).
  const record = await authenticateKey(store, env.ATOMS_MASTER_SECRET, bearerKey(request));
  if (!record) return { status: 401, body: { error: "missing or invalid gateway API key" } };
  if (!record.scopes.includes(atom.namespace)) {
    return { status: 403, body: { error: `this key does not hold the ${atom.namespace} scope` } };
  }

  const handleOne = async (msg: Record<string, unknown>): Promise<{ status: number; body: unknown }> => {
    const hasId = Object.prototype.hasOwnProperty.call(msg, "id");
    const id = hasId ? msg["id"] : null;
    const method = msg["method"];
    const params = (msg["params"] as Record<string, unknown>) ?? {};
    const isNotification = !hasId || id === null || id === undefined;
    switch (method) {
      case "initialize":
        return {
          status: 200,
          body: rpcResult(id, {
            protocolVersion: (params["protocolVersion"] as string) || MCP_PROTOCOL,
            capabilities: { tools: {} },
            serverInfo: { name: `atoms-${atom.serviceName}`, version: atom.atomVersion },
          }),
        };
      case "ping":
        return { status: 200, body: rpcResult(id, {}) };
      case "tools/list":
        return { status: 200, body: rpcResult(id, { tools: [atom.tool] }) };
      case "tools/call": {
        const name = params["name"];
        if (name !== atom.tool.name) {
          return { status: 200, body: rpcError(id, -32602, `unknown tool: ${String(name)}`) };
        }
        const args = (params["arguments"] as Record<string, unknown>) ?? {};
        const outcome = await executeCall(store, env, atom, record, args, now, crypto.randomUUID());
        if (outcome.status !== 200) {
          const code = outcome.status === 429 ? -32029 : outcome.status === 402 ? -32002 : -32602;
          return { status: 200, body: rpcError(id, code, String(outcome.body["detail"] ?? outcome.body["error"] ?? "call failed")) };
        }
        return {
          status: 200,
          body: rpcResult(id, {
            content: [{ type: "text", text: JSON.stringify(outcome.body, null, 2) }],
            structuredContent: outcome.body,
            isError: false,
          }),
        };
      }
      default:
        if (isNotification) return { status: 202, body: null };
        return { status: 200, body: rpcError(id, -32601, `method not found: ${String(method)}`) };
    }
  };

  if (Array.isArray(payload)) {
    const out: unknown[] = [];
    for (const msg of payload) {
      const r = await handleOne(msg as Record<string, unknown>);
      if (r.body !== null) out.push(r.body);
    }
    return { status: 200, body: out };
  }
  if (payload && typeof payload === "object") {
    return handleOne(payload as Record<string, unknown>);
  }
  return { status: 400, body: rpcError(null, -32700, "parse error: expected a JSON-RPC object") };
}

export async function keyHashForLog(key: string | null): Promise<string> {
  if (!key) return "none";
  return (await sha256Hex(key)).slice(0, 16);
}
