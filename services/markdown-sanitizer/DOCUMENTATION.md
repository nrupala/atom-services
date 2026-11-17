# Markdown sanitizer — `markdown-sanitizer`

**Display name:** Markdown sanitizer · **Slug:** `markdown-sanitizer` · **Deliverable type:** DELIVERABLE · **Atom version:** 0.1.0 · **Status:** built-locally — gateway port complete, deploy follows the fleet pipeline

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md)

This document follows the house documentation standard: Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked example is a real recorded run of the atom's core, reproduced verbatim.

## Tutorial

A first call, walked through end to end.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email), open the emailed sign-in link, then issue a key for this atom: `POST /v1/keys` with `{"atom": "markdown-sanitizer"}`. Keep the key; you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides, below.)

**Step 2 — Assemble the payload.** One JSON object: `text` (the raw markdown) and optionally `options`. The worked example below sanitizes a fetched page fragment carrying a script block, rendered HTML with an event handler, and a `javascript:` download link — plus a fenced code example that documents a script tag and must survive untouched.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/markdown-sanitizer` with the payload as the JSON body and the `Authorization` header set.

**Step 4 — Read the result.** The response carries `sanitized_text`, `changed`, the per-rule `counts`, `input_chars` / `output_chars`, a one-line `summary`, and a human-readable `stamp`. In the worked example the script block is gone, the rendered HTML is reduced to its text, the download link points at `#`, and the fenced example is byte-identical to the input.

**Step 5 — Trust the report, not the silence.** Every removal the atom makes is counted in `counts`. If a category is zero, that construct was not present (or was protected inside code). `changed: false` means the input was already clean under the active options.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "markdown-sanitizer"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. This atom's key scope (namespace) is `markdown_sanitizer` — a key without this scope gets a 403 (see Errors).
3. Call `POST https://atoms.pipavia.com/v1/markdown-sanitizer` with the payload object as the JSON body and the header `Authorization: Bearer <key>`.
4. Read the JSON response: `sanitized_text`, `changed`, `counts`, `input_chars`, `output_chars`, `summary`, and the text `stamp`.

### Call via MCP

1. Get a key exactly as above (the MCP surface is key-gated on this gateway too).
2. Send JSON-RPC to `POST https://atoms.pipavia.com/mcp/markdown-sanitizer` with the same `Authorization: Bearer <key>` header.
3. Call `tools/call` for the tool `markdown_sanitizer`; the call arguments are the payload object itself (the same object you would POST to REST).
4. The tool's `structuredContent` is the same result object the REST face returns.

### Keep images, or keep raw HTML

The defaults are the safe posture: HTML stripped, images kept (their targets are still scheme-checked), blank lines collapsed. To remove markdown images entirely, set `options.strip_images: true`. To keep raw HTML tags (for a trusted source you are only link-checking), set `options.strip_html: false` — active blocks and dangerous link targets are still removed and neutralized; only the tag-stripping rule is skipped.

### Handle a 422 invalid_input

A type-violating payload is rejected before evaluation — you get HTTP 422, never a result computed over garbage:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "text",
  "detail": "text must be a string"
}
```

Read `field` as the dotted path of the offending field and `detail` as the expected type. A missing `text` is also a 422 (`text is required`). Fix the payload and re-submit; a 422 is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/markdown-sanitizer`
- **MCP:** `POST https://atoms.pipavia.com/mcp/markdown-sanitizer` — tool `markdown_sanitizer`

### Input reference

| Field | Type | Meaning |
|---|---|---|
| `text` | string, required | the raw markdown to sanitize |
| `options.strip_html` | boolean, default true | rule 5 — strip raw HTML tags, inner text kept |
| `options.strip_images` | boolean, default false | rule 3 — remove markdown images whole |
| `options.collapse_blank_lines` | boolean, default true | rule 6 — collapse 3+ newlines to one blank line, trim trailing whitespace per line |

### The rules, in fixed order

1. **Active blocks removed whole** — `script`, `style`, `iframe`, `object`, `embed`, `form`, contents included; an unclosed active tag removes to the end of the text.
2. **HTML comments removed.**
3. **Markdown images removed** when `strip_images` is on.
4. **Dangerous link targets neutralized** — a markdown link/image target or an `href`/`src` value whose scheme is `javascript:`, `data:`, `vbscript:` or `file:` is replaced with `#`; the visible text stays.
5. **Raw HTML tags removed**, inner text kept, when `strip_html` is on. Event handlers and inline styles go with the tag, by construction.
6. **Whitespace tidied** when `collapse_blank_lines` is on.

Fenced code blocks (``` or ~~~) and inline code spans are protected: no rule touches text inside them, because renderers treat that text as inert.

### Output reference

| Field | Meaning |
|---|---|
| `sanitized_text` | the cleaned text |
| `changed` | whether the output differs from the input |
| `counts.active_blocks_removed` | rule 1 removals |
| `counts.html_comments_removed` | rule 2 removals |
| `counts.html_tags_removed` | rule 5 removals |
| `counts.images_removed` | rule 3 removals |
| `counts.links_neutralized` | rule 4 neutralizations |
| `counts.blank_line_runs_collapsed`, `counts.lines_trimmed` | rule 6 effects |
| `input_chars`, `output_chars` | character counts (Unicode code points) before and after |
| `summary` | one-line human summary |
| `stamp` | the same result as a short text block |

### Errors

- **401** — no key, or an unrecognized key.
- **403** — the key carries no scope for this atom.
- **422** — `invalid_input`: the payload violates the input reference (wrong field type, or `text` missing).
- **429** — per-key rate limit (60/minute, 10,000/day).

## Explanation

The sanitizer is a deterministic text transform implementing the house markdown-sanitization method: outside markdown is treated as untrusted, active constructs are removed in a fixed rule order, and every removal is reported. It never edits wording — the only characters it changes are the constructs its rules name and the whitespace its tidy rule names. It does not fetch, render, or execute anything, and it makes no judgment about the text's truth or quality: a clean result means "no active constructs under these rules", not "this content is safe to believe".

Limits, stated plainly: sanitization is rule-based, not parser-complete — an exotic construct outside the six rules can survive, which is why the counts report exists (a zero where you expected a removal is a signal to look). Content inside code fences is protected by design; if your source is hostile even there, pre-extract the prose before calling.

## Worked example

Recorded run of the atom's core (Python oracle, CLI), 2026-11-17. Input:

```json
{"text": "# Draft notes\n\nRead the [spec](https://example.com/spec) first.\n\n<script>alert('xss')</script>\n\n<p onclick=\"steal()\">Rendered <b>HTML</b> from a fetched page.</p>\n\n[Download](javascript:run_me())\n\n```html\n<script>this example is documentation, not markup</script>\n```\n"}
```

Output, verbatim:

```json
{
  "sanitized_text": "# Draft notes\n\nRead the [spec](https://example.com/spec) first.\n\nRendered HTML from a fetched page.\n\n[Download](#)\n\n```html\n<script>this example is documentation, not markup</script>\n```\n",
  "changed": true,
  "counts": {
    "active_blocks_removed": 1,
    "html_comments_removed": 0,
    "html_tags_removed": 4,
    "images_removed": 0,
    "links_neutralized": 1,
    "blank_line_runs_collapsed": 1,
    "lines_trimmed": 0
  },
  "input_chars": 268,
  "output_chars": 188,
  "summary": "Sanitized: 1 active block(s), 4 HTML tag(s), 0 comment(s), 0 image(s) removed; 1 dangerous link target(s) neutralized; 268 -> 188 chars."
}
```

The script block and the event handler are gone; the `javascript:` target is `#`; the fenced example — a script tag that is documentation, not markup — is untouched.
