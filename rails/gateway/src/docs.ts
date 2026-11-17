// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

/** Per-atom documentation pages (catalogue doc-link, Batch 14
 *  deploy 2026-11-15; staged change:
 *  documentation/CATALOGUE-DOC-LINK-STAGED-CHANGE.md): GET
 *  /docs/<atom> renders the atom's repo DOCUMENTATION.md — carried
 *  in the build by tools/sync-docs.mjs into src/docs.generated.ts,
 *  so the served doc is mechanically the repo doc. Rendering is a
 *  small CommonMark subset (headings, paragraphs, lists, tables,
 *  fenced code, blockquotes, links, inline code/emphasis) — the
 *  docs are authored to that subset. Proven in a scratch tree
 *  before wiring (guard + emit + renderer + route + tests,
 *  4014/4014, rendered pages verified). */

import { DOCS } from "./docs.generated.js";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(text: string): string {
  // Code spans first: placeholder them so emphasis/link rules skip them.
  const spans: string[] = [];
  let t = esc(text).replace(/`([^`]+)`/g, (_m, code) => {
    spans.push(`<code>${code}</code>`);
    return `\u0001${spans.length - 1}\u0002`;
  });
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) =>
    `<a href="${href}">${label}</a>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  t = t.replace(/\u0001(\d+)\u0002/g, (_m, i) => spans[Number(i)]);
  return t;
}

export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  const isBlockStart = (l: string) =>
    /^#{1,6}\s/.test(l) || /^```/.test(l) || /^\s*[-*]\s/.test(l) ||
    /^\s*\d+\.\s/.test(l) || /^>\s?/.test(l) || /^\|/.test(l) || /^\s*$/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }
    const fence = /^```(\w*)/.exec(line);
    if (fence) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++; // closing fence
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
      i++;
      continue;
    }
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const cells = (l: string) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const bodyRows: string[][] = [];
      while (i < lines.length && /^\|/.test(lines[i])) { bodyRows.push(cells(lines[i])); i++; }
      const thead = head.map((c) => `<th>${inline(c)}</th>`).join("");
      const tbody = bodyRows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("\n");
      out.push(`<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote>${buf.map((b) => `<p>${inline(b)}</p>`).join("")}</blockquote>`);
      continue;
    }
    if (/^\s*[-*]\s/.test(line) || /^\s*\d+\.\s/.test(line)) {
      const ordered = /^\s*\d+\.\s/.test(line);
      const buf: string[] = [];
      while (i < lines.length && (ordered ? /^\s*\d+\.\s/.test(lines[i]) : /^\s*[-*]\s/.test(lines[i]))) {
        buf.push(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s/, ""));
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${buf.map((b) => `<li>${inline(b)}</li>`).join("")}</${tag}>`);
      continue;
    }
    // paragraph: gather until a blank line or another block start
    const buf: string[] = [line];
    i++;
    while (i < lines.length && !isBlockStart(lines[i])) { buf.push(lines[i]); i++; }
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}

export function docPageHtml(serviceName: string, baseUrl: string): string | null {
  const doc = DOCS[serviceName];
  if (!doc) return null;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(doc.title)}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 880px; padding: 0 1rem; color: #111; line-height: 1.5; }
  .dim { color: #666; font-size: .85em; } .mono, code { font-family: ui-monospace, monospace; font-size: .9em; }
  pre { background: #f6f6f6; padding: 1rem; overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border-bottom: 1px solid #ddd; padding: .45rem .5rem; text-align: left; vertical-align: top; }
  blockquote { border-left: 3px solid #ddd; margin-left: 0; padding-left: 1rem; color: #444; }
</style>
</head>
<body>
<p><a href="/">← Conduit Atoms catalogue</a></p>
${renderMarkdown(doc.markdown)}
<p class="dim">Sold by 2351485 ALBERTA INC. (AIMLDS) · Payments by Stripe · <a href="https://pipavia.com">pipavia.com</a></p>
</body>
</html>`;
}
