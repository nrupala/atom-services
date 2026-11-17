# Markdown sanitizer — `markdown-sanitizer`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — the sanitized text and its removal report — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Strip active and dangerous content from markdown text while preserving its document structure, and report everything removed.

A caller submits raw markdown text and receives the sanitized text plus a per-rule report of everything removed or neutralized. Wording is never edited. One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): agent builders and content pipelines that ingest untrusted markdown — fetched pages, user submissions, tool output — and need it made safe before rendering or model context, per use, rather than building the sanitizer themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Sanitizing external content before it enters agent context**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — Python oracle and test suite complete (19 tests passing, 2026-11-17); gateway port and deploy follow the fleet pipeline.

## Inputs — the sanitization payload

| Field | Read by |
|---|---|
| `text` (string, required) | the sanitizer |
| `options.strip_html` (boolean, default true) | rule 5 — raw HTML tags stripped, inner text kept |
| `options.strip_images` (boolean, default false) | rule 3 — markdown images removed whole |
| `options.collapse_blank_lines` (boolean, default true) | rule 6 — whitespace tidy |

Rules, in fixed order: (1) active blocks — `script`, `style`, `iframe`, `object`, `embed`, `form` — removed whole with contents, an unclosed active tag removes to the end of the text; (2) HTML comments removed; (3) markdown images removed when the option is on; (4) dangerous link targets neutralized — markdown link/image targets and `href`/`src` values whose scheme is `javascript:`, `data:`, `vbscript:` or `file:` are replaced with `#`; (5) remaining raw HTML tags removed, inner text kept; (6) runs of 3+ newlines collapse to one blank line, trailing whitespace trimmed per line. Fenced code blocks and inline code spans are protected — no rule touches text inside them, because renderers treat that text as inert.

## Outputs — the sanitization result

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
| `input_chars`, `output_chars` | sizes before and after |
| `summary` | one-line human summary of the run |

## Named doubt (from the register)

Rules stay conservative — strip on doubt, report every removal.
