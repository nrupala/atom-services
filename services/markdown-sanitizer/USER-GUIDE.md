# Markdown sanitizer — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You hand this atom raw markdown that came from somewhere you do not control — a fetched page, a user submission, another tool's output — and it hands back the same document with the active content taken out and a count of everything it removed. It removes active blocks whole (`script`, `style`, `iframe`, `object`, `embed`, `form`, contents included; an unclosed active tag removes to the end of the text), removes HTML comments, strips the remaining raw HTML tags while keeping their inner text (which takes event handlers and inline styles with it, by construction), and neutralizes dangerous link targets — any markdown link or image target, or `href`/`src` value, whose scheme is `javascript:`, `data:`, `vbscript:` or `file:` becomes `#`, with the visible text left in place. With options it can also remove markdown images whole, and by default it tidies whitespace (runs of 3+ newlines collapse to one blank line, trailing whitespace trimmed per line). Fenced code blocks and inline code spans are never touched: renderers treat their contents as inert text, so a script tag inside a code fence is documentation, not markup, and survives byte-identical. The atom never edits wording — no character outside the named constructs and the whitespace rule is changed — and it reports per-rule counts (`active_blocks_removed`, `html_comments_removed`, `html_tags_removed`, `images_removed`, `links_neutralized`, `blank_line_runs_collapsed`, `lines_trimmed`), whether anything changed, and the before/after character counts, so a zero where you expected a removal is visible instead of silent. It fetches nothing, renders nothing, executes nothing, and judges nothing about the content's truth: a clean result means no active constructs under these six rules, not that the text is safe to believe. Same payload in → same result out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "markdown-sanitizer"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/markdown-sanitizer` — tool name `markdown_sanitizer`; `tools/call` arguments = the payload object below.
- **REST:** `POST https://atoms.pipavia.com/v1/markdown-sanitizer` — body = the payload object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `text` (string, required) | the raw markdown to sanitize |
| `options.strip_html` (boolean, default true) | strip raw HTML tags, inner text kept |
| `options.strip_images` (boolean, default false) | remove markdown images whole |
| `options.collapse_blank_lines` (boolean, default true) | collapse 3+ newlines to one blank line; trim trailing whitespace per line |

## Output

| Field | Meaning |
|---|---|
| `sanitized_text` | the cleaned text |
| `changed` | whether the output differs from the input |
| `counts` | per-rule removal/neutralization counts (see "What it does") |
| `input_chars`, `output_chars` | character counts before and after |
| `summary` | one-line human summary |
| `stamp` | the same result as a short text block |

## Errors

- **401 / 403** — missing key, or a key without this atom's scope.
- **422** — `invalid_input`: a field has the wrong type, or `text` is missing. The response names the `field` and the expected type in `detail`.
- **429** — per-key rate limit (60/minute, 10,000/day).
