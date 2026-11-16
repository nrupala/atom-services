# Listing — Cost estimate preparation

**Status: built-locally — NOT deployed; do not submit.** The deterministic core, Python oracle and TypeScript port are built and parity-proven locally; the remote URL in `server.json` is the proposed endpoint shape, not a live endpoint.

**Which atom:** `cost-estimate-preparation` (Tier B), an independent atom service listed on Conduit.

**What it delivers:** one DELIVERABLE per call — see `../SERVICE.md`. The atom sells the artifact, never the underlying knowledge.

**Gateway key + scope:** one Conduit Atoms gateway key works across atoms; it must hold this atom's scope (`cost_estimate_preparation`). Sign up at https://atoms.pipavia.com, open this atom, and issue your key. A key without this atom's scope does not verify for this atom.

**Endpoints:** MCP (streamable HTTP, proposed `https://atoms.pipavia.com/mcp/cost-estimate-preparation`) plus the register's endpoint fit: agent, human.

**Rate:** pricing unit = deliverable; **rate_status: pending** — no rate is published until the pricing protocol in `rails/billing.md` produces one (measured cost → three-model consensus → prompt-rate fallback). The rate, when set, is the same on Conduit as everywhere else.
