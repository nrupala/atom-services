# Rails — Billing, keys, and the pricing protocol

## Settlement (fact + doctrine)

- **One Stripe account** settles everything: 2351485 ALBERTA INC.,
  public name AIMLDS. Conduit's own ADR-0004 already rules this
  shape: Conduit rides borrowed payment rails (Stripe; x402 optional
  later), builds the policy + audit layer, and never takes custody
  or escrow.
- **Aggregated settlement, always.** Callers buy a prepaid balance
  (or a pack) once; each call draws the balance down by the atom's
  rate. Never a card charge per call — fixed transaction fees would
  eat micro-rates whole.
- **Trial is the discount:** free units first, full service, refill
  at the posted rate.
- **SPEC / GAP G3+G4:** Conduit today carries **no payment code at
  all** (ADR-0004: M1/M2 carry no payment code; the billing core is
  the unbuilt M4). There is no balance store, no usage ledger, and
  no Stripe metering yet. Tool calls are logged with a `key_hash`,
  which is the seed the metering ledger is built from — a log line
  is not a bill.

## Per-atom API keys (owner, 2026-11-15)

- **Each atom has its OWN key namespace.** A key is issued per user
  **per atom**: holding a key for atom A grants nothing at atom B.
  The namespace and prefix live in each atom's `contract.yaml`
  (`keys:`), e.g. `release-readiness-verdict` →
  namespace `release_readiness_verdict`, prefix
  `atm_1_release_readiness_verdict_`.
- **Derivation (the owner's design + the master-secret fix):**
  `key = "atm_" + version + "_" + namespace + "_" +
  HMAC-SHA256(master_secret, email | atom_service | issued_at)`.
  Email + atom + time alone would be forgeable; the server master
  secret (vault-held, never in this repo) is what makes it a key.
- **Never stored.** The per-user record holds (email, atom,
  issued_at, key fingerprint). A user who loses a key authenticates
  and is re-shown the same key, regenerated on demand. Revocation =
  mark the issuance revoked and issue a new `issued_at`.
- **Self-serve issuance (owner, 2026-11-15):** anyone can sign up,
  open an atom, and issue its key — no approval step. The per-key
  rate limit (see `serving.md`) is the capacity guard.
- Reference implementation + tests: atom #1's
  `services/release-readiness-verdict/src/keys.py`.
- **SPEC / GAP G1+G2:** Conduit's live key gate is a static secret
  list for one connector. Self-serve per-atom issuance and HMAC
  verification are a named build, not a configuration change.

## The pricing protocol (owner, 2026-11-15 — binding)

Rates are decided in this order, and the outcome is recorded in every
atom's `contract.yaml` as
`pricing: {unit, rate, rate_status}` where `rate_status` is one of
`measured | consensus | prompt-rate-fallback | pending`:

1. **Measured production cost first.** Wright's first price comes
   from the atom's measured production cost per unit (standing
   doctrine: the floor is measured, never guessed). When a measured
   cost supports a rate, `rate_status: measured`.
2. **Consensus if undecided.** If pricing cannot be decided from
   cost, the SAME pricing question goes to OpenAI + DeepSeek +
   Gemini (the review packet in `reviews/`), and the rate is decided
   by consensus of their inputs. `rate_status: consensus`.
3. **Prompt-rate fallback.** If still not decided, the atom prices
   at the underlying prompt/token rate — the raw model cost of the
   call, nothing extra added. `rate_status: prompt-rate-fallback`.
   (For a deterministic atom with zero tokens, this fallback yields
   zero and therefore no rate; the atom stays `pending` rather than
   publishing a $0 or invented rate.)
4. **One rate everywhere.** The same pricing applies on Conduit as
   everywhere else — no Conduit-specific markup, nothing extra.
5. **The metric is TOTAL API CALLS on Conduit.** Volume is the
   scoreboard (volume doctrine: cheap per call, millions of calls),
   not margin per call.

Until a step produces a rate, the atom's rate is **pending** and its
listing says so. No rate is ever invented to fill the field.

## Atom #1 pricing status (2026-11-15)

- **Step 1 — measured:** production cost measured locally
  (`src/bench.py`, 20,000 iterations): verdict compute 0.1166 ms/call,
  key derivation 0.0122 ms/call, 0 LLM tokens, 0 network calls.
  Marginal compute cost is effectively zero; the real marginal cost
  once hosted is the serving platform's per-request charge, which
  cannot be measured until deployment. Cost alone therefore does
  not decide a rate yet.
- **Step 2 — consensus:** the pricing question went out in the
  review packet (`reviews/REVIEW-PACKET.md`) on 2026-11-15. Gemini
  returned **$0.0005/call**; DeepSeek returned **$0.01/call**; the
  OpenAI lane could not run (no OpenAI model on OpenRouter carries
  live 0/0 pricing, and the owner's strict free rule bars the
  substitutes — named in `reviews/openai-review-STATUS.md`). Two
  inputs 20× apart with the third missing is **not a consensus**,
  so no rate was set and none was averaged into existence. Recorded
  input range: $0.0005–$0.01/call (`reviews/README.md`).
- **Step 3 — fallback:** 0 tokens → $0. Not a publishable rate.
- **Status: pending.** The rate decision returns to the owner with
  the two model inputs, or completes when the OpenAI lane runs.
