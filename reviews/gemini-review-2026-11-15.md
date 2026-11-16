# Review — Gemini (fleet verification lane)

Reviewer: Google Gemini via ~/workspace/custom-connectors/custom.gemini/bin/gemini.py (default model gemini-3.1-flash-lite per the connector doc). Date: 2026-11-15. Packet: reviews/REVIEW-PACKET.md (identical for all lanes). Response below is verbatim.

---

### 1. Will this sell per call on Conduit?
**For the model as a whole:** It will struggle. The "per call" model assumes high-frequency, automated usage. Most of the Tier A atoms (e.g., "company-fundamentals-report") are high-value, low-frequency tasks that do not naturally lend themselves to millions of calls. They are "consulting-in-a-box," not "infrastructure-as-a-service."

**For Atom #1 (release-readiness-verdict):** It will only sell if integrated into a CI/CD pipeline (e.g., GitHub Actions). A human will never pay per call for a verdict they can get for free via a linter or a checklist. For this to work, it must be "invisible" infrastructure—a gate that triggers on every commit. If it isn't automated into the developer's workflow, the friction of manually calling an API for a "verdict" is too high.

### 2. Is the unit right?
The unit is often mismatched to the value.
*   **Change "per deliverable" to "per call":** Atoms like `agent-safety-guardrail-audit` or `license-compliance-check` should be `per call`. "Deliverable" is a vague, human-centric unit that invites scope creep and billing disputes.
*   **Change "per query" to "per call":** `codebase-graph-analysis` and `company-fundamentals-report` are functionally API calls. Using different terminology creates unnecessary complexity in the billing engine.
*   **Keep "per 1M tokens" for:** `assumption-audit` and `deep-research-synthesis`. These are generative/analytical tasks where the input size varies wildly; charging per call would lead to either massive underpricing or overpricing depending on the context window size.

### 3. Rates
**(a) Atom #1 Rate:** **$0.0005 per call.**
*   **Defense:** While the market band is $0.005–$0.01, those prices usually cover LLM inference costs. Your cost is effectively zero. Charging $0.005 is "rent-seeking" that will encourage users to build their own deterministic check in 10 lines of Python. $0.0005 makes it cheaper to pay you than to maintain the code yourself.

**(b) Tier A Guidance:**
*   **Per Call (Infrastructure):** $0.001 – $0.005.
*   **Per Query (Data/Analysis):** $0.05 – $0.25 (higher value, higher compute).
*   **Per 1M Tokens (Generative):** $2.00 – $5.00 (pass-through of model costs + margin).

**(c) Replacement:** For "Deliverables," replace with **"Per Call"** to ensure the marketplace remains programmatic. If a task is too complex for a single call, it is not an "atom"—it is a workflow.

### 4. What breaks the model?
1.  **The "Wrapper" Problem (Lethality: High):** Users will call your atom once, cache the result, or reverse-engineer the deterministic logic. **Signal:** High volume of initial calls followed by a total drop-off in repeat calls from the same API keys.
2.  **Platform Disintermediation (Lethality: Medium):** Conduit takes 15%. If your atoms are useful, developers will bypass the marketplace to avoid the 15% fee or the rate limits. **Signal:** A high ratio of "human web page" traffic vs. "API/MCP" traffic, indicating users are using the UI to copy-paste results rather than integrating the API.
3.  **Latency/Cold Start (Lethality: Low):** If your Cloudflare Workers have cold starts that exceed the latency of a local function call, devs will abandon the service. **Signal:** Increased latency in P99 metrics.

### 5. One change
**Implement a "Subscription-to-Call" conversion.** Allow users to purchase a "Developer Tier" for a flat monthly fee (e.g., $49/mo) that grants a high volume of calls (e.g., 100,000). The "prepay balance" model is a friction point for enterprise developers who prefer predictable monthly OpEx over "topping up" a wallet. This ensures steady revenue while keeping the "per call" architecture for the underlying technical implementation.
