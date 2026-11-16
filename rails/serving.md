# Rails — Serving

How an atom in this repo is served. Facts about Conduit are from
reading `~/workspace/conduit` on 2026-11-15. Anything Conduit does not
do today is marked **SPEC** and named as a gap — it is not described
as if it existed.

## Design target (owner, 2026-11-15)

**Fully functional, open to everyone.** Atoms are skills sold per API
call on Conduit. Usage is public and self-serve: anyone can sign up,
get keys, and call. There is no gated pilot and no invite list. The
capacity guard for open usage is the **per-key rate limit**, not a
gate on who may sign up.

## What Conduit actually is today (fact)

- A managed connector marketplace whose one live connector
  (Filings & Fundamentals) is a **Cloudflare Worker** serving MCP
  over Streamable HTTP: `GET /health` ungated, `POST /mcp` key-gated,
  JSON-RPC `initialize` / `tools/list` / `tools/call` / `ping`.
- Auth: `Authorization: Bearer <key>` (or `?key=` fallback). Keys come
  from one comma-separated `CONDUIT_API_KEY` Worker secret; missing
  configuration fails closed (500), an invalid key gets 401.
- Logging is structured JSON; only a SHA-256 hash prefix of the key
  (`key_hash`) is ever logged, never the raw key.
- Discovery: an Official MCP Registry listing
  (`registry/server.json`, schema
  `static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`)
  with a `streamable-http` remote and an Authorization header
  descriptor. Atom listing packages in this repo copy that shape.

## How an atom is served (the pattern atoms follow)

1. **One service, one deployment.** Each atom deploys as its own
   endpoint set (its own Worker, following the `m1/worker` pattern),
   never as part of another product. Per-user specificity lives in
   keys and entitlements, never in per-user deployments.
2. **MCP face (primary for agents):** `POST /mcp` in Conduit's exact
   envelope — one tool per atom service call, input schema = the
   atom's contract inputs, output = the atom's artifact (verdict /
   check / map / stamp / report) in the contract's output shape.
3. **API face:** `POST /v1/<service-name>` with the same input/output
   contract, for non-MCP callers. **SPEC** — Conduit today exposes
   MCP only; the plain-HTTP face is an atoms-side addition following
   the same key gate.
4. **Human face:** the atom's page on the storefront (pipavia.com)
   renders the listing content from the atom's `listing/` package and
   a try-it form that calls the same endpoint with the user's key.
5. **Health:** `GET /health` ungated, as Conduit does.

## Key gate (per-atom keys — see billing.md for issuance)

- Every atom has its **own key namespace** (recorded in its
  `contract.yaml` under `keys:`). A request verifies against the
  atom's own namespace only; a key minted for one atom is invalid at
  every other atom.
- Verification is by regeneration: the gate recomputes the HMAC from
  the stored issuance record (email, atom, issued_at) and compares —
  keys are never stored (design: `ATOMS-APP-AND-KEY-DESIGN.md` §3).
- **SPEC / GAP G1+G2:** Conduit's live gate checks a static
  comma-separated secret list. Per-user, per-atom HMAC keys need a
  key-issuance and verification service Conduit does not have yet.

## Rate limits (the capacity guard)

- Per key, per atom: defaults in every `contract.yaml`
  (`rate_limit:` — 60/minute, 10,000/day, marked SPEC) until an
  atom's build-out tunes them from its measured production cost.
- Over-limit → 429 with the limit named; the call is not metered.
- **SPEC / GAP G5:** Conduit's architecture doc lists shared rate
  limiting + KV-backed metering as not-yet-built. Per-key limiting
  lands with the metering work, not before it is claimed.

## Internal caller (R2)

Wright calls atoms on the same endpoints with an internal key in the
atom's namespace (namespace suffix `_internal`), zero price, metered
to the internal cost ledger. Same contract, same code path — the
internal caller is how each atom's production cost gets measured.
**SPEC / GAP G7:** Conduit logs cannot yet distinguish an internal
cost ledger entry; the ledger is part of the metering build.
