// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

// Markdown sanitizer — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/markdown-sanitizer/src/markdown_sanitizer.py
// (evaluate() + stamp()). No logic changes: every count, the
// sanitized text and the summary string are byte-identical to the
// Python output for the same input on the fixture corpus. Character
// counts use code points ([...s].length), matching Python len().

import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  text: "string",
  options: {
    strip_html: "boolean",
    strip_images: "boolean",
    collapse_blank_lines: "boolean",
  },
};

const DANGEROUS_SCHEMES = ["javascript", "data", "vbscript", "file"];

export interface SanitizeCounts {
  active_blocks_removed: number;
  html_comments_removed: number;
  html_tags_removed: number;
  images_removed: number;
  links_neutralized: number;
  blank_line_runs_collapsed: number;
  lines_trimmed: number;
}

export interface SanitizationResult {
  sanitized_text: string;
  changed: boolean;
  counts: SanitizeCounts;
  input_chars: number;
  output_chars: number;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cpLen(s: string): number {
  return [...s].length;
}

const FENCE_RE = /(^|\n)(```|~~~)[^\n]*\n.*?\n\2[^\n]*(?=\n|$)/gs;
const INLINE_CODE_RE = /`[^`\n]+`/g;

// Split text into [segment, isCode] parts: fenced blocks and inline
// code spans are code; everything else is prose.
function splitProtected(text: string): Array<[string, boolean]> {
  const parts: Array<[string, boolean]> = [];
  let pos = 0;
  while (pos < text.length) {
    FENCE_RE.lastIndex = pos;
    INLINE_CODE_RE.lastIndex = pos;
    const fence = FENCE_RE.exec(text);
    const inline = INLINE_CODE_RE.exec(text);
    let nxt: RegExpExecArray | null;
    if (inline && (!fence || inline.index < fence.index)) {
      nxt = inline;
    } else {
      nxt = fence;
    }
    if (nxt === null) {
      parts.push([text.slice(pos), false]);
      break;
    }
    if (nxt.index > pos) {
      parts.push([text.slice(pos, nxt.index), false]);
    }
    parts.push([nxt[0], true]);
    pos = nxt.index + nxt[0].length;
  }
  if (text.length === 0) {
    parts.push(["", false]);
  }
  return parts;
}

const ACTIVE_BLOCK_RE =
  /<(script|style|iframe|object|embed|form)\b[^>]*>.*?<\/\1\s*>/gis;
const ACTIVE_OPEN_RE = /<(script|style|iframe|object|embed|form)\b[^>]*>.*/gis;
const COMMENT_RE = /<!--.*?-->/gs;
const MD_IMAGE_RE =
  /!\[[^\]]*\]\((?:[^()\s]|\([^()]*\))+(?:\s+"[^"]*")?\s*\)/g;
const MD_LINK_RE =
  /(!?)\[([^\]]*)\]\(\s*((?:[^()\s]|\([^()]*\))+)((?:\s+"[^"]*")?)\s*\)/g;
const ATTR_URL_RE = /((?:href|src)\s*=\s*")([^"]*)(")/gi;
const TAG_RE = /<[^>]*>/g;

function schemeOf(target: string): string {
  const idx = target.indexOf(":");
  if (idx === -1) return "";
  return target.slice(0, idx).trim().toLowerCase();
}

interface Options {
  strip_html: boolean;
  strip_images: boolean;
  collapse_blank_lines: boolean;
}

function sanitizeProse(
  segment: string,
  opts: Options,
  counts: SanitizeCounts,
): string {
  // 1. Active blocks, whole; an unclosed active tag removes to the
  // end of the segment.
  segment = segment.replace(ACTIVE_BLOCK_RE, () => {
    counts.active_blocks_removed += 1;
    return "";
  });
  segment = segment.replace(ACTIVE_OPEN_RE, () => {
    counts.active_blocks_removed += 1;
    return "";
  });
  // 2. HTML comments.
  segment = segment.replace(COMMENT_RE, () => {
    counts.html_comments_removed += 1;
    return "";
  });
  // 3. Images, when the option is on.
  if (opts.strip_images) {
    segment = segment.replace(MD_IMAGE_RE, () => {
      counts.images_removed += 1;
      return "";
    });
  }
  // 4. Dangerous link targets (markdown form, then attribute form).
  segment = segment.replace(
    MD_LINK_RE,
    (whole, bang: string, label: string, target: string, title: string) => {
      if (DANGEROUS_SCHEMES.includes(schemeOf(target))) {
        counts.links_neutralized += 1;
        return `${bang}[${label}](#${title})`;
      }
      return whole;
    },
  );
  segment = segment.replace(
    ATTR_URL_RE,
    (whole, pre: string, value: string, post: string) => {
      if (DANGEROUS_SCHEMES.includes(schemeOf(value))) {
        counts.links_neutralized += 1;
        return `${pre}#${post}`;
      }
      return whole;
    },
  );
  // 5. Raw HTML tags, inner text kept.
  if (opts.strip_html) {
    segment = segment.replace(TAG_RE, () => {
      counts.html_tags_removed += 1;
      return "";
    });
  }
  return segment;
}

export function evaluate(manifest: unknown): SanitizationResult {
  if (!isPyDict(manifest)) {
    throw new TypeError("payload must be an object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  if (!Object.prototype.hasOwnProperty.call(manifest, "text")) {
    throw new TypeError("text is required");
  }
  const text = manifest.text as string;
  const rawOpts = (manifest.options ?? {}) as Record<string, unknown>;
  const opts: Options = {
    strip_html: (rawOpts.strip_html as boolean | undefined) ?? true,
    strip_images: (rawOpts.strip_images as boolean | undefined) ?? false,
    collapse_blank_lines:
      (rawOpts.collapse_blank_lines as boolean | undefined) ?? true,
  };
  const counts: SanitizeCounts = {
    active_blocks_removed: 0,
    html_comments_removed: 0,
    html_tags_removed: 0,
    images_removed: 0,
    links_neutralized: 0,
    blank_line_runs_collapsed: 0,
    lines_trimmed: 0,
  };
  let resultText = splitProtected(text)
    .map(([segment, isCode]) =>
      isCode ? segment : sanitizeProse(segment, opts, counts),
    )
    .join("");
  // 6. Whitespace tidy on prose segments only.
  if (opts.collapse_blank_lines) {
    const parts: string[] = [];
    for (const [segment, isCode] of splitProtected(resultText)) {
      if (isCode) {
        parts.push(segment);
        continue;
      }
      const lines = segment.split("\n");
      const trimmed = lines.map((ln) => ln.replace(/\s+$/, ""));
      trimmed.forEach((t, i) => {
        if (t !== lines[i]) counts.lines_trimmed += 1;
      });
      let seg = trimmed.join("\n");
      const runs = seg.match(/\n{3,}/g);
      if (runs) {
        counts.blank_line_runs_collapsed += runs.length;
        seg = seg.replace(/\n{3,}/g, "\n\n");
      }
      parts.push(seg);
    }
    resultText = parts.join("");
  }
  const changed = resultText !== text;
  return {
    sanitized_text: resultText,
    changed,
    counts,
    input_chars: cpLen(text),
    output_chars: cpLen(resultText),
    summary:
      `${changed ? "Sanitized" : "No change"}: ` +
      `${counts.active_blocks_removed} active block(s), ` +
      `${counts.html_tags_removed} HTML tag(s), ` +
      `${counts.html_comments_removed} comment(s), ` +
      `${counts.images_removed} image(s) removed; ` +
      `${counts.links_neutralized} dangerous link target(s) neutralized; ` +
      `${cpLen(text)} -> ${cpLen(resultText)} chars.`,
  };
}

export function stamp(result: SanitizationResult): string {
  const lines = [
    "MARKDOWN SANITIZER",
    `changed: ${result.changed ? "True" : "False"}`,
  ];
  for (const [key, value] of Object.entries(result.counts)) {
    lines.push(`  ${key.padEnd(28)} ${value}`);
  }
  lines.push(result.summary);
  return lines.join("\n");
}
