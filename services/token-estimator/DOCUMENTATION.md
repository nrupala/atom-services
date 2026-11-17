# Token estimator — `token-estimator`

**Display name:** Token estimator · **Slug:** `token-estimator` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** built-locally — gateway port complete, deploy follows the fleet pipeline

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md)

This document follows the house documentation standard: Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked example is a real recorded run of the atom's core, reproduced verbatim.

## Tutorial

A first call, walked through end to end.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email), open the emailed sign-in link, then issue a key for this atom: `POST /v1/keys` with `{"atom": "token-estimator"}`. Keep the key; you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides, below.)

**Step 2 — Assemble the payload.** Either `text` (one string) or `messages` (a chat list of `{role, content}` objects) — never both — plus an optional `model_family`. The worked example below estimates a two-message chat payload for the `gpt` family.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/token-estimator` with the payload as the JSON body and the `Authorization` header set.

**Step 4 — Read the result.** The response carries `estimated_tokens`, the `range_low` / `range_high` bracket (±15%), the measured `chars` and `words`, the `model_family` used, the `method` statement, a one-line `summary`, and a human-readable `stamp`. In the worked example: 44 estimated tokens (range 37–51) over 130 chars in 2 messages.

**Step 5 — Use the range, not the point.** Budget against `range_high` when the question is "will this fit / what will this cost at most"; use `estimated_tokens` for planning. The estimate is a heuristic with its method printed on it — for a billing-exact count, run the model's own tokenizer.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "token-estimator"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. This atom's key scope (namespace) is `token_estimator` — a key without this scope gets a 403 (see Errors).
3. Call `POST https://atoms.pipavia.com/v1/token-estimator` with the payload object as the JSON body and the header `Authorization: Bearer <key>`.
4. Read the JSON response: `estimated_tokens`, `range_low`, `range_high`, `chars`, `words`, `message_count`, `model_family`, `method`, `summary`, and the text `stamp`.

### Call via MCP

1. Get a key exactly as above (the MCP surface is key-gated on this gateway too).
2. Send JSON-RPC to `POST https://atoms.pipavia.com/mcp/token-estimator` with the same `Authorization: Bearer <key>` header.
3. Call `tools/call` for the tool `token_estimator`; the call arguments are the payload object itself (the same object you would POST to REST).
4. The tool's `structuredContent` is the same result object the REST face returns.

### Estimate a chat payload

Send `messages` instead of `text`. Each message's `content` is estimated with the same segmentation, and a fixed per-message overhead for role/framing is added (gpt 400, claude 300, llama 400, generic 400 hundredths of a token). A message without `content` is a 422. Extra fields on a message (e.g. `name`) are ignored.

### Choose a model family

`model_family` selects the word factor and the message overhead: `gpt` (133), `claude` (130), `llama` (135), `generic` (133, the default). An unknown family is a 422 — the estimator never silently falls back, because a silent fallback would print one family's method on another family's number.

### Handle a 422 invalid_input

A type-violating payload is rejected before evaluation — you get HTTP 422, never an estimate computed over garbage:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "text",
  "detail": "text must be a string"
}
```

Giving both `text` and `messages`, giving neither, an unknown `model_family`, or a message without `content` are also 422s. Fix the payload and re-submit; a 422 is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/token-estimator`
- **MCP:** `POST https://atoms.pipavia.com/mcp/token-estimator` — tool `token_estimator`

### Input reference

| Field | Type | Meaning |
|---|---|---|
| `text` | string | the text to estimate — give this or `messages`, not both |
| `messages` | list of `{role, content}` | a chat payload; `content` is estimated per message plus the family overhead |
| `model_family` | string, default `generic` | one of `gpt`, `claude`, `llama`, `generic` |

### Method — factor table v1

The text is segmented into classes; each class is weighted in integer hundredths of a token; the estimate is the ceiling of the sum.

| Segment class | Cost (hundredths) |
|---|---|
| word run (letters, internal apostrophes/hyphens) | family word factor: gpt 133, claude 130, llama 135, generic 133 |
| number run | 100 per started 3-digit group |
| CJK character (Han, Hiragana, Katakana, Hangul) | 100 each |
| punctuation / symbol run | 100 per started pair of characters |
| whitespace run | 10 if a single space, else 25 |
| any other character | 100 |
| per chat message (overhead) | gpt 400, claude 300, llama 400, generic 400 |

`range_low` is the estimate × 0.85 (floor); `range_high` is the estimate × 1.15 (ceiling).

### Output reference

| Field | Meaning |
|---|---|
| `estimated_tokens` | the estimate |
| `range_low`, `range_high` | the ±15% bracket |
| `chars`, `words` | measured input sizes (chars = Unicode code points) |
| `message_count` | messages estimated (0 for a text payload) |
| `model_family` | the family whose factors were used |
| `method` | the method statement, including "estimate, not a tokenizer count" |
| `summary` | one-line human summary |
| `stamp` | the same result as a short text block |

### Errors

- **401** — no key, or an unrecognized key.
- **403** — the key carries no scope for this atom.
- **422** — `invalid_input`: wrong field type; both `text` and `messages`; neither; unknown `model_family`; a message without `content`.
- **429** — per-key rate limit (60/minute, 10,000/day).

## Explanation

Exact token counts belong to each model's own tokenizer, and tokenizers differ across families and versions. What a caller needs before inference — a budget check, a context-window fit check, a cost pre-flight — is a fast estimate that is honest about being one. This atom implements the house token-estimation method: segment the text into classes whose token costs are stable across BPE-style tokenizers, weight them by a small published factor table, and print the method and the range on the result so the number can never be mistaken for an exact count downstream.

Limits, stated plainly: the factors are averages — text heavy in code, URLs, or rare words will sit nearer the top of the range, and a family whose tokenizer differs sharply from the BPE norm can fall outside it. The range is a planning bracket, not a confidence interval. When money or a hard context limit turns on the exact number, use the model's tokenizer; this atom's job is to make the pre-flight check cheap, deterministic, and honestly labelled.

## Worked example

Recorded run of the atom's core (Python oracle, CLI), 2026-11-17. Input:

```json
{"messages": [{"role": "system", "content": "You are a careful reviewer. Answer with evidence, never guesses."}, {"role": "user", "content": "Review order 1234567 and summarise the three risks in plain words."}], "model_family": "gpt"}
```

Output, verbatim:

```json
{
  "estimated_tokens": 44,
  "range_low": 37,
  "range_high": 51,
  "chars": 130,
  "words": 20,
  "message_count": 2,
  "model_family": "gpt",
  "method": "segment-weighted heuristic, factor table v1 — estimate, not a tokenizer count",
  "summary": "Estimated 44 tokens (range 37-51) for the gpt family over 130 chars in 2 message(s)."
}
```
