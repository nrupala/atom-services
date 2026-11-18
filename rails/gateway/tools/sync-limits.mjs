#!/usr/bin/env node
/**
 * sync-limits — generate the gateway's per-atom "does not cover"
 * module from the atoms' SERVICE.md records (the source of truth),
 * following the sync-rates / sync-docs pattern: the served line is
 * mechanically extracted from the atom's own record — never
 * hand-written per atom, so it cannot drift from the record.
 *
 * Reads rails/gateway/atoms.registry.json (the catalogue set), then
 * each atom's services/<atom>/SERVICE.md, and writes
 * src/limits.generated.ts exporting LIMITS: service name -> the
 * verbatim limits clause.
 *
 * EXTRACTION (fallback chain, first hit wins — the clause is the
 * atom's own recorded boundary statement):
 *  1. "Honest scoping" section, em-dash clause ("— it does not …").
 *  2. "Honest scoping" first sentence carrying a negation.
 *  3. "Thresholds declined" list items.
 *  4. "Named doubt" first negation sentence; failing that, the
 *     section's em-dash tail ("<stance> — <limit>"), which carries
 *     the material limit when the tail has no negation keyword.
 *  5. Intro (pre-section text) first negation sentence.
 *  6. "What it delivers" first negation sentence.
 *  7. "U-13 regulatory screen" first negation sentence.
 * A leading "This atom … — " prefix is cut when the remainder starts
 * with "it ", so the line reads uniformly after the catalogue's
 * "Does not cover — " label.
 *
 * TRUTH CHECK: every emitted clause is asserted to be a verbatim
 * substring of the atom's markdown-stripped SERVICE.md text. If any
 * atom yields no clause, or a clause fails the substring check,
 * this tool exits non-zero and names the atoms — a catalogue line
 * can therefore never state a boundary the record does not state.
 *
 * GUARD_NO_SERVICE_RECORD: electrical-machines-expert-advice —
 * disabled by owner ruling under process line U-13; its service
 * record predates the SERVICE.md form and it renders nothing on
 * any surface while disabled. Every other catalogued atom must
 * yield a clause.
 *
 * Run from rails/gateway/:  node tools/sync-limits.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const gatewayRoot = join(here, "..");
const repoRoot = join(gatewayRoot, "..", "..");

const registry = JSON.parse(readFileSync(join(gatewayRoot, "atoms.registry.json"), "utf8"));
const names = registry.atoms.map((r) => r.service_name);

const GUARD_NO_SERVICE_RECORD = new Set(["electrical-machines-expert-advice"]);

const NEG = /\b(does not|do not|did not|never|no [a-z]+|not |cannot|refuses? to|without)\b/i;

function stripMd(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function sentences(text) {
  return text
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function section(text, title) {
  // Terminator: the next "## " heading or the absolute end of the
  // input ((?![\s\S])). A trailing "\Z" here would be a literal "Z"
  // in a JS RegExp — it truncated any section at its first capital
  // Z (e.g. "EXPLAIN ANALYZE") and made a file-final section (the
  // usual place of "Named doubt") unreachable.
  const re = new RegExp(`^## ${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*?\\n+([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m");
  const m = re.exec(text);
  return m ? m[1].trim() : null;
}

function extractClause(rawInput) {
  const raw = rawInput.replace(/<!--[\s\S]*?-->/g, " ");
  const hs = section(raw, "Honest scoping");
  if (hs) {
    const para = hs.split(/\n\s*\n/)[0];
    const dash = /—\s*(it .+?)(?:\.\s|\.$)/s.exec(para);
    if (dash && NEG.test(dash[1])) return dash[1];
    for (const s of sentences(para)) {
      if (NEG.test(s) && s.length > 25) return s.replace(/\.$/, "");
    }
  }
  const td = section(raw, "Thresholds declined");
  if (td) {
    const items = td
      .split("\n")
      .filter((l) => /^\s*[-*]/.test(l))
      .map((l) => stripMd(l.replace(/^\s*[-*]\s*/, "")));
    if (items.length) return `thresholds declined: ${items.join("; ")}`;
  }
  const nd = section(raw, "Named doubt (from the register)") ?? section(raw, "Named doubt");
  if (nd) {
    const ndPara = nd.split(/\n\s*\n/)[0];
    for (const s of sentences(ndPara)) {
      if (NEG.test(s) && s.length > 25) return s.replace(/\.$/, "");
    }
    // Em-dash tail (mirrors the Honest scoping dash rule): a Named
    // doubt stated as "<stance> — <limit>" carries its material
    // limit in the tail even when the tail has no negation keyword
    // (e.g. "strip on doubt, report every removal").
    const ndDash = /—\s*(.+?)(?:\.\s|\.$)/s.exec(ndPara.replace(/\n/g, " "));
    if (ndDash && ndDash[1].length > 25) return ndDash[1];
  }
  const intro = raw.split(/\n## /)[0];
  for (const s of sentences(intro)) {
    if (NEG.test(s) && s.length > 25) return s.replace(/\.$/, "");
  }
  const wd = section(raw, "What it delivers");
  if (wd) {
    for (const s of sentences(wd)) {
      if (NEG.test(s) && s.length > 25) return s.replace(/\.$/, "");
    }
  }
  const u13 = section(raw, "U-13 regulatory screen");
  if (u13) {
    for (const s of sentences(u13)) {
      if (NEG.test(s) && s.length > 25) return s.replace(/\.$/, "");
    }
  }
  return null;
}

const limits = {};
const failed = [];
const notVerbatim = [];
for (const name of names) {
  const p = join(repoRoot, "services", name, "SERVICE.md");
  if (!existsSync(p)) {
    if (!GUARD_NO_SERVICE_RECORD.has(name)) failed.push(`${name} (no SERVICE.md)`);
    continue;
  }
  const raw = readFileSync(p, "utf8");
  let clause = extractClause(raw);
  if (!clause) {
    failed.push(`${name} (no clause extracted)`);
    continue;
  }
  clause = stripMd(clause);
  // Cut a leading "This atom … — " prefix when the remainder starts
  // with "it ", for a uniform read after the "Does not cover — " label.
  const cut = /^This atom .+? — (it .+)$/.exec(clause);
  if (cut) clause = cut[1];
  if (!stripMd(raw).includes(clause)) {
    notVerbatim.push(name);
    continue;
  }
  limits[name] = clause;
}

if (failed.length || notVerbatim.length) {
  if (failed.length) console.error(`sync-limits: NO CLAUSE for: ${failed.join(", ")}`);
  if (notVerbatim.length) console.error(`sync-limits: CLAUSE NOT VERBATIM IN RECORD for: ${notVerbatim.join(", ")}`);
  process.exit(1);
}

const body = `// GENERATED by tools/sync-limits.mjs from services/<atom>/SERVICE.md
// (the atom's recorded limits — source of truth) + atoms.registry.json
// (catalogue set). Each clause is a verbatim substring of the atom's
// own SERVICE.md, asserted at generation time.
// DO NOT EDIT BY HAND. Re-run: node tools/sync-limits.mjs
// Generated: ${new Date().toISOString()}

export const LIMITS: Record<string, string> = ${JSON.stringify(limits, null, 2)};
`;
writeFileSync(join(gatewayRoot, "src", "limits.generated.ts"), body);
console.log(`sync-limits: wrote ${Object.keys(limits).length} limits lines`);
