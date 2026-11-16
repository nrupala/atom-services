# Reviews — independent monetization review of the atoms model

The owner directed (2026-11-15) that the atoms be reviewed by other
models with one specific question: **monetization by API calls on
Conduit** — will this sell per call, is the unit right, is the rate
defensible, what breaks the model. The identical packet
(`REVIEW-PACKET.md`) went to every lane.

| Lane | File | Ran | Rate proposed for atom #1 |
|---|---|---|---|
| Gemini (gemini-3.1-flash-lite, fleet lane) | `gemini-review-2026-11-15.md` | yes, 2026-11-15 | **$0.0005 / call** |
| DeepSeek (deepseek-chat) | `deepseek-review-2026-11-15.md` | yes, 2026-11-15 | **$0.01 / call** |
| OpenAI (via OpenRouter) | `openai-review-STATUS.md` | **no — route blocked, named in the file** | — |

Responses are filed verbatim. Reviewer output is an input to be
checked, never the final word.

## Consensus record (pricing protocol step 2)

- Gemini argues cost ≈ 0 + trivial reimplementation risk → price
  below the market band at $0.0005/call so paying beats rebuilding.
- DeepSeek argues the verdict's value + procurement friction → price
  at the top of the band, $0.01/call, and warns micro-rates cannot
  fund support; its "one change" would lead with per-deliverable
  pricing ($2/verdict tiered down) for judgment atoms.
- The two inputs differ 20× and the third input (OpenAI) is missing.
  **That is not a consensus.** Under the protocol, atom #1's rate
  therefore stays `rate_status: pending` with the recorded input
  range **$0.0005–$0.01 per call**. No averaged or invented rate was
  substituted. The rate decision returns to the owner with these
  inputs, or completes when the OpenAI lane runs.

## Points both reviewers raised independently (signal, not verdict)

- Atom #1's natural frequency is per-release, not per-request —
  "millions of calls" does not come from this atom; repeat calling
  requires CI/agent-pipeline embedding.
- Deterministic logic is reimplementable; the moat is the encoded
  judgment and the maintained evidence standard, not the code.
- Settlement economics (85/15 + Stripe on small balances) and
  distribution on a small marketplace are named failure modes, with
  observable early signals listed in each review.
