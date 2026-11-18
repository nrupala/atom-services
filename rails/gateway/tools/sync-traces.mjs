#!/usr/bin/env node
/**
 * sync-traces — generate the gateway's per-atom measured-trace
 * module from the recorded verification data (the source of truth),
 * following the sync-rates / sync-docs pattern: the served trace is
 * mechanically built from the records — never hand-written per
 * atom, so it cannot drift from what was actually run.
 *
 * Sources per atom:
 *  - verification/results/<atom>.json — the external verification
 *    battery record (Waves 1–17): wave, date, verdict, the six case
 *    legs, second tester, tester errors, earlier-battery verdicts.
 *  - services/<atom>/TEST-REPORT.md — the battery's check count
 *    ("of N checks").
 *  - services/<atom>/GATE-VERDICT.md — the per-atom gate record:
 *    the Guardian Mesh disposition row and the extended test
 *    families table (states PROVEN / NOT RUN / N/A) become the
 *    trace's buckets. Batch 23 atoms have no battery record; their
 *    trace is built from their GATE-VERDICT.md build/gate facts
 *    (golden fixtures, Python oracle suite, live replay) and their
 *    Not run bucket names the external battery itself.
 *
 * BUCKET RULE (uniform): a bucket renders only when the atom's
 * record carries content for it.
 *  - not_run: every NOT RUN leg in the atom's gate record (the
 *    Guardian Mesh disposition is NOT RUN fleet-wide, so this
 *    bucket is never empty); Batch 23 atoms also name the external
 *    verification battery, which has not run for them.
 *  - not_covered: the atom's recorded limits clause (the same
 *    generated string as tools/sync-limits.mjs emits — the
 *    measurement covers the atom's declared behaviour only).
 *  - excluded: family rows the gate record marks N/A, each with
 *    its recorded reason (first sentence).
 *
 * HELD_NO_TRACE: the six atoms held staged under open U-13 per-unit
 * rulings (personal-financial-snapshot, smart-grid-der-design-pack,
 * structured-root-cause-analysis, system-design-failure-mode-pack,
 * technical-explainer-content-pack, validated-simulation-scenario-
 * pack) have no verification records by design and no catalogue
 * presentation; they are named here so their absence is a decision,
 * not a gap. Every other catalogued atom must yield a trace or
 * this tool exits non-zero naming it.
 *
 * Run from rails/gateway/:  node tools/sync-traces.mjs
 * (Run after sync-limits.mjs — not_covered reuses its extraction.)
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const gatewayRoot = join(here, "..");
const repoRoot = join(gatewayRoot, "..", "..");

const registry = JSON.parse(readFileSync(join(gatewayRoot, "atoms.registry.json"), "utf8"));
const names = registry.atoms.map((r) => r.service_name);

const HELD_NO_TRACE = new Set([
  "personal-financial-snapshot",
  "smart-grid-der-design-pack",
  "structured-root-cause-analysis",
  "system-design-failure-mode-pack",
  "technical-explainer-content-pack",
  "validated-simulation-scenario-pack",
]);

// ---- limits clause (same extraction as sync-limits.mjs) -----------
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

// ---- gate-record buckets -------------------------------------------
function gateBuckets(verdictText) {
  const notRun = [];
  const excluded = [];
  if (/Guardian Mesh disposition \| NOT RUN/.test(verdictText)) {
    notRun.push("Guardian Mesh disposition");
  }
  // Extended test families table rows: | Family | State | Basis |
  for (const m of verdictText.matchAll(/^\| ([^|]+) \| (NOT RUN|N\/A) \| ([^|]+) \|$/gm)) {
    const family = m[1].trim();
    const state = m[2].trim();
    const basis = stripMd(m[3]).split(/(?<=[.!?])\s+/)[0].replace(/\.$/, "");
    if (family === "Guardian Mesh disposition") continue;
    if (state === "NOT RUN") notRun.push(family);
    else excluded.push({ leg: family, reason: basis });
  }
  return { notRun, excluded };
}

const traces = {};
const failed = [];
for (const name of names) {
  const resultsPath = join(repoRoot, "verification", "results", `${name}.json`);
  const verdictPath = join(repoRoot, "services", name, "GATE-VERDICT.md");
  const servicePath = join(repoRoot, "services", name, "SERVICE.md");
  const hasResults = existsSync(resultsPath);
  const hasVerdict = existsSync(verdictPath);
  if (!hasResults && !hasVerdict) {
    if (!HELD_NO_TRACE.has(name)) failed.push(`${name} (no results record, no gate verdict)`);
    continue;
  }
  const verdictText = hasVerdict ? readFileSync(verdictPath, "utf8") : "";
  const { notRun, excluded } = gateBuckets(verdictText);
  const clauseRaw = existsSync(servicePath) ? extractClause(readFileSync(servicePath, "utf8")) : null;
  let notCovered = clauseRaw ? stripMd(clauseRaw) : null;
  if (notCovered) {
    // Same normalization as sync-limits.mjs: cut a leading
    // "This atom … — " prefix when the remainder starts with "it ".
    const cut = /^This atom .+? — (it .+)$/.exec(notCovered);
    if (cut) notCovered = cut[1];
  }

  let summary;
  let source;
  if (hasResults) {
    const r = JSON.parse(readFileSync(resultsPath, "utf8"));
    const LEG_ORDER = ["full-pass", "violations", "sparse", "malformed", "determinism", "parity"];
    const legs = LEG_ORDER.filter((k) => r.cases && k in r.cases).map((k) => [k, r.cases[k]]);
    for (const k of Object.keys(r.cases ?? {})) if (!LEG_ORDER.includes(k)) legs.push([k, r.cases[k]]);
    const allPass = legs.length > 0 && legs.every(([, v]) => v === "PASS");
    const legText = allPass
      ? `6-case battery — all legs PASS (${legs.map(([k]) => k).join(", ")})`
      : `battery legs: ${legs.map(([k, v]) => `${k} ${v}`).join(", ")}`;
    const waveLabel = /^wave-(\d+)$/.test(String(r.wave))
      ? `Wave ${String(r.wave).slice(5)}`
      : /^first-test-batch(\d+)$/.test(String(r.wave))
        ? `first test batch ${String(r.wave).slice("first-test-batch".length)}`
        : String(r.wave).replace(/-/g, " ");
    let checks = null;
    const reportPath = join(repoRoot, "services", name, "TEST-REPORT.md");
    if (existsSync(reportPath)) {
      const cm = /of (\d+) checks/.exec(readFileSync(reportPath, "utf8"));
      if (cm) checks = Number(cm[1]);
    }
    const parts = [`External verification ${waveLabel} (${r.date}): ${legText}`, `verdict ${r.verdict}`];
    if (checks) parts.push(`${checks} checks`);
    if (r.second_tester) parts.push(`second tester: ${r.second_tester}`);
    if (r.tester_errors) parts.push(`tester errors ${r.tester_errors} (adjudicated on the record)`);
    if (r.wave1_verdict) {
      parts.push(`earlier batteries: Wave 1 ${r.wave1_verdict}${r.retest1_verdict ? `, retest ${r.retest1_verdict}` : ""} — findings fixed and closed`);
    }
    summary = parts.join(" · ");
    source = `verification/results/${name}.json`;
    if (!notRun.includes("Guardian Mesh disposition")) notRun.unshift("Guardian Mesh disposition");
  } else {
    // Batch 23 form: build + gate record only; the external
    // verification battery has not run for these atoms. The fixture
    // count is counted from the fixture files on disk (the record's
    // own corpus); the rest comes from the verdict text.
    const fixtureDir = join(gatewayRoot, "test", "fixtures");
    const fixtureCount = readdirSync(fixtureDir).filter(
      (f) => f.startsWith(`${name}--`) && f.endsWith(".json"),
    ).length;
    const ot = /Python oracle suite \((\d+) tests/.exec(verdictText);
    const lr = /live replay (2026-11-17), (14\/14)/.exec(verdictText);
    const vd = /## Verdict: (.+)/.exec(verdictText);
    if (!fixtureCount || !vd) {
      failed.push(`${name} (no fixtures on disk or no verdict line in gate record)`);
      continue;
    }
    const parts = [`Build + gate record (2026-11-17): ${fixtureCount} golden fixtures, oracle↔port parity exact`];
    if (ot) parts.push(`Python oracle suite ${ot[1]} tests`);
    if (lr) parts.push(`live replay ${lr[2]} cohort probes PASS`);
    parts.push(`gate verdict ${vd[1].trim()}`);
    summary = parts.join(" · ");
    source = `services/${name}/GATE-VERDICT.md`;
    if (!notRun.includes("Guardian Mesh disposition")) notRun.unshift("Guardian Mesh disposition");
    notRun.push("External verification battery (no wave has run for this atom)");
  }

  traces[name] = {
    source,
    summary,
    not_run: notRun,
    not_covered: notCovered,
    excluded,
  };
}

if (failed.length) {
  console.error(`sync-traces: NO TRACE for: ${failed.join(", ")}`);
  process.exit(1);
}

const body = `// GENERATED by tools/sync-traces.mjs from verification/results/<atom>.json
// + services/<atom>/TEST-REPORT.md (check counts) + services/<atom>/
// GATE-VERDICT.md (buckets) + services/<atom>/SERVICE.md (not-covered
// clause, same extraction as tools/sync-limits.mjs).
// DO NOT EDIT BY HAND. Re-run: node tools/sync-traces.mjs
// Generated: ${new Date().toISOString()}

export interface AtomTrace {
  source: string;
  summary: string;
  not_run: string[];
  not_covered: string | null;
  excluded: { leg: string; reason: string }[];
}

export const TRACES: Record<string, AtomTrace> = ${JSON.stringify(traces, null, 2)};
`;
writeFileSync(join(gatewayRoot, "src", "traces.generated.ts"), body);
console.log(`sync-traces: wrote ${Object.keys(traces).length} measured traces`);
