# Review — DeepSeek

Reviewer: DeepSeek (deepseek-chat) via ~/workspace/custom-connectors/custom.legacy-deepseek/bin/ds_chat.py. Date: 2026-11-15. Packet: reviews/REVIEW-PACKET.md (identical for all lanes). Response below is verbatim.

---

# Review: atoms monetization on Conduit

## 1. Will this sell per call on Conduit?

**Model as a whole: no, not as designed.** The per-call micro-rate model is structurally mismatched to the buyer set. Per-call pricing at $0.005–$0.01 only works when (a) the call is embedded in an automated loop the buyer already runs at high volume, and (b) the buyer's alternative is meaningfully worse or more expensive. Conduit is a small marketplace with no distribution; the 11,000-server MCP ecosystem is <5% monetized precisely because most servers are free and buyers have no habit of paying per call for a connector. A buyer who wants a release gate will more plausibly wire it into CI once and pay a flat subscription, or just write the 200-line deterministic check themselves — atom #1 is stdlib Python with no model call, so the moat is the *judgment encoded*, not the compute.

**Atom #1 specifically: it will not generate repeat per-call revenue at micro-rates.** Who pays per call for a deterministic verdict? Realistically: (i) agent pipelines that call it as a tool inside a loop — but a release-readiness verdict is called *once per release*, not per request; (ii) CI systems — which call it per pipeline run, i.e., tens to low hundreds of times per month per team, not millions; (iii) the builder's own self-use — which is not revenue. The doctrine "millions of calls" is false for this atom: the natural call frequency is *per release*, and releases are infrequent. Repeat calling only matters at micro-rates if the atom is on a hot path (per-request guardrails, per-query retrieval eval). Atom #1 is a cold-path, low-frequency, high-stakes judgment. For repeat calling to be the only kind that matters, the atom must be embedded in a per-request or per-document loop — atom #1 is not.

**What has to be true:** the buyer must be an agent pipeline (not a human team) that calls it on every candidate release *and* trusts an external verdict over its own gate *and* the per-call price must be below the buyer's cost of maintaining the check. That is a narrow, unproven segment.

## 2. Is the unit right?

**Atom #1: per call is defensible but weak.** A verdict is a discrete deliverable; per-call and per-verdict are the same thing here. Keep per call, but note the frequency problem above.

**Tier A units I would change:**

- **assumption-audit** — currently "tokens." Change to **per deliverable (audit report)**. Token-metered pricing on an audit deliverable invites buyers to game input size and makes the price unpredictable; the value is the report, not the tokens.
- **deep-research-synthesis** — "deliverable" is right; do **not** move to tokens. Same reasoning.
- **calculation-rederivation, defined-flow-auditor, provenance-stamper** — "call" is fine for cheap deterministic units, but these are low-frequency; consider **per deliverable** if output is a report, per call only if truly one-shot.
- **codebase-graph-analysis, codebase-structural-query, company-fundamentals-report, portfolio-risk-analytics-report, seven-step-equity-research-brief, link-rot-scan-and-notarized-archive, one-line-diagram-to-data** — "query" is acceptable but ambiguous; standardize to **per query = per billed request**, and cap by output size, otherwise a single "query" can be a 10-minute graph build. Add a **per-query size tier**.
- **lean4-formal-proof, code-with-verification-proof, correctness-verification-certificate** — "deliverable" is right; these are high-value, low-frequency, and should never be per call.
- **agent-evaluation-scorecard, agent-safety-guardrail-audit, rag-retrieval-evaluation-tuning** — "deliverable" is right, but these are the *only* Tier A atoms with plausible high-frequency repeat use (eval runs). Consider a **per-eval-run** unit distinct from per deliverable.

Net: keep per-call only for genuinely cheap, hot-path, deterministic units (release-readiness-verdict, calculation-rederivation, defined-flow-auditor, provenance-stamper). Move token-priced atoms to deliverable. Add size tiers to "query" atoms.

## 3. Rates

**(a) Atom #1 per-call rate: $0.01/call.**

Defense: measured marginal compute is ≈$0 (0.1166 ms, 0 tokens), so cost gives no floor — protocol step 1 is uninformative, and the $0-token fallback (step 3) would price it at $0, which is not a business. The market band is $0.005–$0.01. Price at the **top of the band ($0.01)** because: (i) the output is a high-stakes verdict, not a commodity lookup; (ii) the buyer's alternative (a human release gate or a bespoke check) costs orders of magnitude more per release; (iii) at $0.01, a team doing 100 releases/month pays $1/month — trivially below procurement friction, which is the real constraint, not the rate. Do **not** price below $0.005: it signals commodity and destroys the 85/15 economics (at $0.005, the platform's 15% is $0.00075/call — below Stripe's per-transaction floor once aggregated, and the builder nets $0.00425/call, which cannot fund support). $0.01 is defensible against cost (infinite margin on compute, but the real cost is maintenance/support, which $0.01/call at realistic volumes does not cover — see Q4).

**(b) Tier A rate guidance by unit class:**

- **Per call (cheap deterministic):** $0.005–$0.01/call. Use $0.01 for verdicts/audits with judgment, $0.005 for pure re-derivation/stamping.
- **Per query:** $0.02–$0.10/query, tiered by output size (small $0.02, medium $0.05, large $0.10). Query atoms (graph analysis, fundamentals, portfolio risk) have real compute and data costs; $0.005 is below cost.
- **Per deliverable:** $0.50–$5.00/deliverable, scaled by complexity. Formal proofs, verification certificates, safety audits, and research briefs are hours of encoded judgment; pricing them at micro-rates is value destruction. Anchor to the buyer's alternative (a consultant hour is $100–$300), not to the call band.
- **Per 1M tokens (if any remain):** pass through at underlying model rate + 15–25% margin; do not use for audit deliverables.

**(c) Where per-call cannot work:** **per deliverable atoms** (formal proof, verification certificate, safety audit, research synthesis, equity brief, migration map) cannot work per call — the natural unit is the report, and per-call pricing either overcharges trivial calls or undercharges the deliverable. Replace with **per-deliverable fixed price + optional per-call for re-checks**. Also, **query atoms with unbounded compute** cannot work per call without size tiers; replace with **per-query tiers**.

## 4. What breaks the model (ordered by lethality)

1. **No repeat-call volume (demand failure).** Per-call micro-rates need millions of calls; the buyer set calls cold-path atoms tens of times per month. *Earliest signal:* median calls per key per month < 50 after 60 days; >80% of keys used once.
2. **Free-rider / self-host substitution.** Atom #1 is stdlib Python with no network — a buyer can reimplement it or run it locally for free once they see the logic. *Earliest signal:* high trial usage, near-zero conversion to paid; support tickets asking for the check logic/spec.
3. **Settlement economics collapse.** Aggregated prepay + 85/15 + Stripe fees means small balances are unprofitable; per-call at $0.01 with 15% platform share nets the builder $0.0085/call, and Stripe's effective per-charge cost on small top-ups eats the margin. *Earliest signal:* average prepaid balance < $20; Stripe fee as % of revenue > 5%.
4. **Key/namespace operational burden.** Per-atom key namespaces × 162 atoms × HMAC issuance is a support and security surface; a key leak or issuance bug is a trust event. *Earliest signal:* key-issuance error rate > 0.1%; support tickets per 1,000 keys rising.
5. **Marketplace distribution failure.** Conduit is small; the 11,000-server ecosystem is <5% monetized, meaning buyers do not pay per call as a habit. *Earliest signal:* <10 paying buyers after 90 days; zero inbound from marketplace search.
6. **Quality/liability event.** A wrong READY verdict on a real release is a reputational and possibly contractual event; deterministic does not mean correct. *Earliest signal:* first disputed verdict / refund request; buyer asking for indemnity.

## 5. One change

**Kill per-call as the primary unit for the launch and lead with per-deliverable pricing for the judgment atoms, keeping per-call only as an optional metered add-on for hot-path atoms.** Concretely: launch atom #1 at a **flat per-verdict price (e.g., $2/verdict, volume-tiered down to $0.50 at 1,000+/month)** rather than $0.01/call, and reserve per-call micro-rates for the handful of genuinely hot-path deterministic atoms. Rationale: the measured cost is ≈$0, so cost cannot justify micro-rates; the market band is for commodity connectors, not high-stakes verdicts; and the only thing that makes per-call work — millions of calls — is exactly what this buyer set will not produce. Pricing the verdict at its value (a release gate) funds support and survives the demand failure in Q4.1.
