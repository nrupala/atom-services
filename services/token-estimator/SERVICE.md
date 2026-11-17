# Token estimator — `token-estimator`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — the token estimate with its method stated — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Estimate the token count of text or chat payloads before inference, with the method and its uncertainty stated on the result.

A caller submits text, or a chat messages list, and receives a deterministic estimate: the estimated token count, a ±15% range, the character and word counts, and the factor-table version. The estimate is a segment-weighted heuristic — it is never a tokenizer count, and the result says so on its face. One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): agent builders and LLM pipeline operators who need pre-flight budget and context-fit checks per call, without taking a tokenizer dependency for every model family they route to.

## Self-use (R3 — passed)

Our own workflow that calls it: **Pre-flight payload sizing for bench model calls**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — Python oracle and test suite complete (15 tests passing, 2026-11-17); gateway port and deploy follow the fleet pipeline.

## Inputs — the estimation payload

| Field | Read by |
|---|---|
| `text` (string) | the estimator — give this or `messages`, not both |
| `messages` (list of `{role, content}`) | the estimator — each message's content is estimated, plus a per-message overhead |
| `model_family` (string, default `generic`) | the factor table — one of `gpt`, `claude`, `llama`, `generic` |

Method (factor table v1, integer hundredths of a token): word runs cost the family word factor (gpt 133, claude 130, llama 135, generic 133); number runs cost 100 per started 3-digit group; CJK characters cost 100 each; punctuation runs cost 100 per started pair; whitespace runs cost 10 (single space) or 25; any other character costs 100. Per-message overhead: gpt 400, claude 300, llama 400, generic 400. The estimate is the ceiling of the summed hundredths.

## Outputs — the estimate

| Field | Meaning |
|---|---|
| `estimated_tokens` | the estimate |
| `range_low`, `range_high` | the estimate −15% (floor) and +15% (ceiling) |
| `chars`, `words` | measured input sizes |
| `message_count` | messages estimated (0 for a text payload) |
| `model_family` | the family whose factors were used |
| `method` | the method statement, including "estimate, not a tokenizer count" |
| `summary` | one-line human summary |

## Named doubt (from the register)

Estimate only — never represented as an exact tokenizer count.
