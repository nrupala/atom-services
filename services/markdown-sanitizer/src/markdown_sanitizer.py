"""Markdown sanitizer — deterministic removal of active content from
markdown text, with a full report of everything removed.

Method (skill: markdown-sanitization, v1). The sanitizer treats its
input as untrusted. It never edits wording; it removes active
constructs and tidies whitespace, in this fixed order:

  1. Active blocks (script, style, iframe, object, embed, form) are
     removed whole, contents included — never unwrapped.
  2. HTML comments are removed.
  3. Markdown images are removed whole when the strip_images option
     is on (default off).
  4. Dangerous link targets are neutralized: a markdown link or image
     target, or an href/src attribute value, whose scheme is
     javascript:, data:, vbscript: or file: is replaced with "#".
     The visible text stays; the payload does not.
  5. Remaining raw HTML tags are removed, inner text kept, when the
     strip_html option is on (default on). Tag removal takes event
     handlers and inline styles with it, by construction.
  6. Whitespace is tidied when collapse_blank_lines is on (default
     on): runs of 3+ newlines collapse to one blank line and trailing
     whitespace is trimmed per line.

Fenced code blocks (``` or ~~~) and inline code spans are inert in
every renderer — their contents display as text and never execute —
so they are protected: no rule touches text inside them.

Deterministic: same input and options, byte-identical output. The
result reports counts per rule, whether anything changed, and the
input/output character counts.
"""

import json
import re
import sys

ACTIVE_TAGS = ("script", "style", "iframe", "object", "embed", "form")
DANGEROUS_SCHEMES = ("javascript", "data", "vbscript", "file")

MANIFEST_SPEC = {
    "text": "string",
    "options": {
        "strip_html": "boolean",
        "strip_images": "boolean",
        "collapse_blank_lines": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


_FENCE_RE = re.compile(r"(^|\n)(```|~~~)[^\n]*\n.*?\n\2[^\n]*(?=\n|$)", re.DOTALL)
_INLINE_CODE_RE = re.compile(r"`[^`\n]+`")


def _split_protected(text):
    """Split text into (segment, is_code) parts: fenced blocks and
    inline code spans are code; everything else is prose."""
    parts = []
    pos = 0
    while pos < len(text):
        fence = _FENCE_RE.search(text, pos)
        inline = _INLINE_CODE_RE.search(text, pos)
        nxt = None
        for cand in (fence, inline):
            if cand is not None and (nxt is None or cand.start() < nxt.start()):
                nxt = cand
        if nxt is None:
            parts.append((text[pos:], False))
            break
        if nxt.start() > pos:
            parts.append((text[pos:nxt.start()], False))
        parts.append((nxt.group(0), True))
        pos = nxt.end()
    return parts


_ACTIVE_BLOCK_RE = re.compile(
    r"<(script|style|iframe|object|embed|form)\b[^>]*>.*?</\1\s*>",
    re.IGNORECASE | re.DOTALL,
)
_ACTIVE_OPEN_RE = re.compile(
    r"<(script|style|iframe|object|embed|form)\b[^>]*>.*",
    re.IGNORECASE | re.DOTALL,
)
_COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)
_MD_IMAGE_RE = re.compile(
    r"!\[[^\]]*\]\((?:[^()\s]|\([^()]*\))+(?:\s+\"[^\"]*\")?\s*\)"
)
_MD_LINK_RE = re.compile(
    r"(!?)\[([^\]]*)\]\(\s*((?:[^()\s]|\([^()]*\))+)"
    r"((?:\s+\"[^\"]*\")?)\s*\)"
)
_ATTR_URL_RE = re.compile(
    r"((?:href|src)\s*=\s*\")([^\"]*)(\")", re.IGNORECASE
)
_TAG_RE = re.compile(r"<[^>]*>")


def _scheme_of(target):
    head = target.split(":", 1)
    if len(head) == 1:
        return ""
    return head[0].strip().lower()


def _sanitize_prose(segment, opts, counts):
    # 1. Active blocks, whole. An unclosed active tag removes to the
    # end of the segment — conservative on doubt.
    segment, n = _ACTIVE_BLOCK_RE.subn("", segment)
    counts["active_blocks_removed"] += n
    segment, n = _ACTIVE_OPEN_RE.subn("", segment)
    counts["active_blocks_removed"] += n
    # 2. HTML comments.
    segment, n = _COMMENT_RE.subn("", segment)
    counts["html_comments_removed"] += n
    # 3. Images, when the option is on.
    if opts["strip_images"]:
        segment, n = _MD_IMAGE_RE.subn("", segment)
        counts["images_removed"] += n

    # 4. Dangerous link targets (markdown form, then attribute form).
    def _link_sub(m):
        bang, label, target, title = m.groups()
        if _scheme_of(target) in DANGEROUS_SCHEMES:
            counts["links_neutralized"] += 1
            return f"{bang}[{label}](#{title})"
        return m.group(0)

    segment = _MD_LINK_RE.sub(_link_sub, segment)

    def _attr_sub(m):
        pre, value, post = m.groups()
        if _scheme_of(value) in DANGEROUS_SCHEMES:
            counts["links_neutralized"] += 1
            return f"{pre}#{post}"
        return m.group(0)

    segment = _ATTR_URL_RE.sub(_attr_sub, segment)
    # 5. Raw HTML tags, inner text kept.
    if opts["strip_html"]:
        segment, n = _TAG_RE.subn("", segment)
        counts["html_tags_removed"] += n
    return segment


def evaluate(manifest):
    """Return the sanitization result dict for an input payload of
    the shape {"text": str, "options": {...}}."""
    if not isinstance(manifest, dict):
        raise ValueError("payload must be an object")
    _validate_manifest(manifest)
    if "text" not in manifest:
        raise ValueError("text is required")
    text = manifest["text"]
    raw_opts = manifest.get("options") or {}
    opts = {
        "strip_html": raw_opts.get("strip_html", True),
        "strip_images": raw_opts.get("strip_images", False),
        "collapse_blank_lines": raw_opts.get("collapse_blank_lines", True),
    }
    counts = {
        "active_blocks_removed": 0,
        "html_comments_removed": 0,
        "html_tags_removed": 0,
        "images_removed": 0,
        "links_neutralized": 0,
        "blank_line_runs_collapsed": 0,
        "lines_trimmed": 0,
    }
    out = []
    for segment, is_code in _split_protected(text):
        out.append(segment if is_code else _sanitize_prose(segment, opts, counts))
    result_text = "".join(out)
    # 6. Whitespace tidy (never inside fenced code: re-split and apply
    # to prose segments only; inline spans ride along untouched).
    if opts["collapse_blank_lines"]:
        parts = []
        for segment, is_code in _split_protected(result_text):
            if is_code:
                parts.append(segment)
                continue
            lines = segment.split("\n")
            trimmed = [ln.rstrip() for ln in lines]
            counts["lines_trimmed"] += sum(
                1 for a, b in zip(lines, trimmed) if a != b
            )
            seg = "\n".join(trimmed)
            seg, n = re.subn(r"\n{3,}", "\n\n", seg)
            counts["blank_line_runs_collapsed"] += n
            parts.append(seg)
        result_text = "".join(parts)
    changed = result_text != text
    return {
        "sanitized_text": result_text,
        "changed": changed,
        "counts": counts,
        "input_chars": len(text),
        "output_chars": len(result_text),
        "summary": (
            f"{'Sanitized' if changed else 'No change'}: "
            f"{counts['active_blocks_removed']} active block(s), "
            f"{counts['html_tags_removed']} HTML tag(s), "
            f"{counts['html_comments_removed']} comment(s), "
            f"{counts['images_removed']} image(s) removed; "
            f"{counts['links_neutralized']} dangerous link target(s) neutralized; "
            f"{len(text)} -> {len(result_text)} chars."
        ),
    }


def stamp(result):
    """Human-readable stamp of a sanitization result dict."""
    lines = [
        "MARKDOWN SANITIZER",
        f"changed: {result['changed']}",
    ]
    for key, value in result["counts"].items():
        lines.append(f"  {key:<28} {value}")
    lines.append(result["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: markdown_sanitizer.py <payload.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        payload = json.load(fh)
    result = evaluate(payload)
    print(json.dumps(result, indent=2))
    print()
    print(stamp(result))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
