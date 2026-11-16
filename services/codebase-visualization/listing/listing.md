# Listing — Codebase visualization

**Status: built-locally — NOT deployed; do not submit.** The remote URL in `server.json` is the proposed endpoint shape, not a live endpoint.

**Which atom:** `codebase-visualization` (Tier B), an independent atom service listed on Conduit Atoms.

**What it delivers:** one DELIVERABLE per call — see `../SERVICE.md`. The atom sells the artifact, never the underlying knowledge. It validates a declared visualization artifact record; it renders no graphics and reads no actual code.

**Gateway key + scope:** one Conduit Atoms gateway key works across atoms; it must hold this atom's scope (`codebase_visualization`). Sign up at https://atoms.pipavia.com, open this atom, and issue your key. A key's scope is per atom — holding the gateway key alone does not grant this atom unless the `codebase_visualization` scope is on it.

**Endpoints:** MCP (streamable HTTP, proposed `https://atoms.pipavia.com/mcp/codebase-visualization`) plus the register's endpoint fit: agent.

**Rate:** pricing unit = deliverable; **rate: null, rateStatus: pending** — no rate is published until the pricing protocol in `rails/billing.md` produces one (measured cost → three-model consensus → prompt-rate fallback). The rate, when set, is the same on Conduit as everywhere else.
