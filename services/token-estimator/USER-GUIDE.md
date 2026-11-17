# Token estimator — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You hand this atom text — or a chat payload of messages — and a model family, and it hands back a token estimate you can budget against before you pay for inference. It segments the text into classes (word runs, number runs, CJK characters, punctuation runs, whitespace runs, anything else) and weights each class by a small published factor table (factor table v1: a word costs a little over one token — 133 hundredths for gpt and generic, 130 for claude, 135 for llama; digits cost one token per started 3-digit group; a CJK character costs one token; a punctuation run costs one token per started pair; whitespace is nearly free), sums in integer hundredths so the arithmetic is exact to reproduce, and reports the ceiling as `estimated_tokens` with a ±15% bracket (`range_low` / `range_high`). For a messages payload it estimates each message's content and adds a fixed per-message overhead for role and framing (300–400 hundredths by family). The result also carries the measured `chars` and `words`, the family used, and a `method` string that says, on the face of the result, "estimate, not a tokenizer count" — because exact counts belong to each model's own tokenizer and this atom never pretends otherwise. Use the range for decisions: budget against the high end, plan against the point estimate. It calls no model, loads no tokenizer, and stores nothing. Same payload in → same numbers out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "token-estimator"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/token-estimator` — tool name `token_estimator`; `tools/call` arguments = the payload object below.
- **REST:** `POST https://atoms.pipavia.com/v1/token-estimator` — body = the payload object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `text` (string) | the text to estimate — give this or `messages`, not both |
| `messages` (list of `{role, content}`) | a chat payload; each message's `content` is estimated, plus the family overhead |
| `model_family` (string, default `generic`) | one of `gpt`, `claude`, `llama`, `generic` — selects the factor row |

## Output

| Field | Meaning |
|---|---|
| `estimated_tokens` | the estimate |
| `range_low`, `range_high` | the ±15% bracket |
| `chars`, `words` | measured input sizes |
| `message_count` | messages estimated (0 for a text payload) |
| `model_family` | the family whose factors were used |
| `method` | the method statement, including "estimate, not a tokenizer count" |
| `summary` | one-line human summary |
| `stamp` | the same result as a short text block |

## Errors

- **401 / 403** — missing key, or a key without this atom's scope.
- **422** — `invalid_input`: wrong field type; both `text` and `messages`; neither; unknown `model_family`; a message without `content`.
- **429** — per-key rate limit (60/minute, 10,000/day).
