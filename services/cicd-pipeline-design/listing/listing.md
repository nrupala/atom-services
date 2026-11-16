# Listing (STUB) — Cicd pipeline design

**Status: built-locally — NOT deployed; do not submit.** The remote URL in `server.json` is the proposed endpoint shape, not a live endpoint.

**Which atom:** `cicd-pipeline-design` (Tier B), an independent atom service listed on Conduit.

**What it delivers:** one DELIVERABLE per call — see `../SERVICE.md`. The atom sells the artifact, never the underlying knowledge.

**Gateway key:** one Conduit Atoms gateway key works across atoms; it must hold this atom's scope — namespace `cicd_pipeline_design`, prefix `atm_1_cicd_pipeline_design_`. Sign up at https://atoms.pipavia.com, open this atom, and issue your key. Keys are HMAC-derived from your account + this atom + issuance time, regenerated on demand if you lose yours, and never work for any other atom.

**Endpoints:** MCP (streamable HTTP, proposed `https://atoms.pipavia.com/mcp/cicd-pipeline-design`) plus the register's endpoint fit: agent.

**Rate:** pricing unit = deliverable; **rate_status: pending** — no rate is published until the pricing protocol in `rails/billing.md` produces one (measured cost → three-model consensus → prompt-rate fallback). The rate, when set, is the same on Conduit as everywhere else.
