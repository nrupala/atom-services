<!-- HAND-BUILT: complete listing for release slot #1. The generator never overwrites this file. -->
# Listing — Release-Readiness Verdict (atom)

**Status: built locally, NOT deployed.** This is the complete public
listing package for Conduit, ready to submit when the endpoint is
live and the release gate has passed. The URL in `server.json` is
the proposed endpoint; it does not resolve yet.

**Which atom:** `release-readiness-verdict` — an independent atom
service (Tier A, queue position #1), listed on Conduit. Atoms are
skills sold per API call; this one is the release gate.

**What it delivers:** one verdict per call. Submit a
release-evidence manifest for a release you are about to ship; get
back `READY`, `NOT_READY`, or `INSUFFICIENT_EVIDENCE` across five
bars (control, understanding, management, lifecycle, stability),
with the evidence for every one of the 19 checks. Deterministic —
no model call; the same manifest always yields the same verdict.
The atom sells the verdict, never the underlying knowledge.

**Its own API key:** yes — namespace `release_readiness_verdict`,
prefix `atm_1_release_readiness_verdict_`. Keys are issued **per
user, per atom**: sign up, open this atom, and issue your key. If
you lose it, sign in and re-display the same key (keys are derived,
never stored). This atom's key works for no other atom, and no
other atom's key works here.

**Endpoints:**
- MCP (streamable HTTP): `https://atoms.pipavia.com/mcp/release-readiness-verdict` — tool `release_readiness_verdict`, input = the evidence manifest, output = the verdict object.
- API: `POST https://atoms.pipavia.com/v1/release-readiness-verdict` — same input, same verdict.
- Human: this page's try-it form, using your key.
- Auth on all endpoints: `Authorization: Bearer <your key for this atom>`.
- Rate limits (capacity guard): 60 calls/minute and 10,000 calls/day per key (SPEC defaults).

**Its rate:** pricing unit = **per call**. Rate status:
**pending** — under the house pricing protocol the rate comes from
measured production cost first (measured 2026-11-15: 0.1166 ms of
compute per call, zero tokens — the hosted per-request cost is what
remains to measure), then three-model consensus (ran 2026-11-15:
inputs $0.0005 and $0.01 per call, third lane blocked — no
consensus yet), then the prompt-rate fallback. No rate is published
until the protocol produces one; when set, the rate on Conduit is
the same as everywhere else — no channel markup. Free trial units
come first when the atom opens; trial is the discount.

**Internal caller:** the builder (Wright) calls this atom on the
same endpoints at zero price, metered to an internal cost ledger —
our own release gates are its first workload.
