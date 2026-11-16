# Listing (STUB) — Poc design kill criteria verdict

**Status: scaffolded, NOT deployed.** Generated from the register; the remote URL in `server.json` is the proposed endpoint shape, not a live endpoint.

**Which atom:** `poc-design-kill-criteria-verdict` (Tier B), an independent atom service listed on Conduit.

**What it delivers:** one VERDICT per call — see `../SERVICE.md`. The atom sells the artifact, never the underlying knowledge.

**Its own API key:** yes — namespace `poc_design_kill_criteria_verdict`, prefix `atm_1_poc_design_kill_criteria_verdict_`. A key is issued per user **per atom**: sign up, open this atom, issue your key. Keys are HMAC-derived from your account + this atom + issuance time, regenerated on demand if you lose yours, and never work for any other atom.

**Endpoints:** MCP (streamable HTTP, proposed `https://atoms.pipavia.com/mcp/poc-design-kill-criteria-verdict`) plus the register's endpoint fit: agent, human.

**Rate:** pricing unit = deliverable; **rate_status: pending** — no rate is published until the pricing protocol in `rails/billing.md` produces one (measured cost → three-model consensus → prompt-rate fallback). The rate, when set, is the same on Conduit as everywhere else.
