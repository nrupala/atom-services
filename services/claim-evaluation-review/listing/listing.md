# Listing — Claim evaluation review

**Status: built-locally — NOT deployed; do not submit.** The remote URL in `server.json` is the proposed endpoint shape, not a live endpoint.

**Which atom:** `claim-evaluation-review` (Tier B), an independent atom service listed on Conduit Atoms.

**What it delivers:** one REVIEW per call — see `../SERVICE.md`. The atom sells the artifact, never the underlying knowledge.

**Gateway key + scope:** one Conduit Atoms gateway key works across atoms; it must hold this atom's scope (`claim_evaluation_review`). Sign up at https://atoms.pipavia.com, open this atom, and issue your key. A key's scope for one atom never grants another atom's scope.

**Endpoints:** MCP (streamable HTTP, proposed `https://atoms.pipavia.com/mcp/claim-evaluation-review`) plus the register's endpoint fit: agent, human.

**Rate:** pricing unit = deliverable; **rate: null, rate_status: pending** — no rate is published until the pricing protocol in `rails/billing.md` produces one (measured cost → three-model consensus → prompt-rate fallback). The rate, when set, is the same on Conduit as everywhere else.
