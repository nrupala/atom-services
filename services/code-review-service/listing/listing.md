# Listing — Code review service

**Status: built-locally — NOT deployed; do not submit.** Built and parity-proven locally; the remote URL in `server.json` is the proposed endpoint shape, not a live endpoint.

**Which atom:** `code-review-service` (Tier B), an independent atom service listed on Conduit.

**What it delivers:** one REVIEW per call — see `../SERVICE.md`. The atom sells the artifact, never the underlying knowledge.

**Gateway key + scope:** one Conduit Atoms gateway key works across atoms; it must hold this atom's scope (`code_review_service`). Sign up at https://atoms.pipavia.com, open this atom, and issue your key. A key without this atom's scope does not verify for this atom.

**Endpoints:** MCP (streamable HTTP, proposed `https://atoms.pipavia.com/mcp/code-review-service`) plus the register's endpoint fit: agent.

**Rate:** pricing unit = deliverable; **rate: null, rate_status: pending** — no rate is published until the pricing protocol in `rails/billing.md` produces one (measured cost → three-model consensus → prompt-rate fallback). The rate, when set, is the same on Conduit as everywhere else.
