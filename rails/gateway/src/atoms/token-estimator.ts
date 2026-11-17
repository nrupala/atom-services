// Copyright (C) 2026 2351485 ALBERTA INC. — All rights reserved.
// SPDX-License-Identifier: LicenseRef-Proprietary
// Proprietary — see LICENSE.

// Token estimator — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/token-estimator/src/token_estimator.py
// (evaluate() + stamp()). No logic changes: the estimate, range and
// counts are identical to the Python output for the same input on
// the fixture corpus. The word class uses \p{L} where the Python
// oracle uses [^\W\d_] (letters plus combining marks); the classes
// agree on the fixture corpus (Latin, CJK, digits, punctuation).

import { validateManifest, type FieldSpec } from "./validate.js";

const FACTOR_TABLE_VERSION = "1";
const WORD_FACTOR: { [family: string]: number } = {
  gpt: 133,
  claude: 130,
  llama: 135,
  generic: 133,
};
const MESSAGE_OVERHEAD: { [family: string]: number } = {
  gpt: 400,
  claude: 300,
  llama: 400,
  generic: 400,
};
const FAMILIES = Object.keys(WORD_FACTOR);

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  text: "string",
  messages: [{ role: "string", content: "string" }],
  model_family: "string",
};

export interface EstimateResult {
  estimated_tokens: number;
  range_low: number;
  range_high: number;
  chars: number;
  words: number;
  message_count: number;
  model_family: string;
  method: string;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cpLen(s: string): number {
  return [...s].length;
}

const SEGMENT_RE =
  /(?<cjk>[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af])|(?<word>\p{L}+(?:['\u2019-]\p{L}+)*)|(?<number>\p{Nd}+(?:[.,]\p{Nd}+)*)|(?<punct>[^\p{L}\p{N}\s\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af_]+)|(?<space>\s+)|(?<other>.)/gsu;

function estimateHundredths(text: string, family: string): [number, number] {
  let total = 0;
  let words = 0;
  for (const m of text.matchAll(SEGMENT_RE)) {
    const groups = m.groups ?? {};
    const seg = m[0];
    if (groups.cjk !== undefined) {
      total += 100;
    } else if (groups.word !== undefined) {
      total += WORD_FACTOR[family];
      words += 1;
    } else if (groups.number !== undefined) {
      const digits = [...seg].filter((ch) => /\p{Nd}/u.test(ch)).length;
      total += Math.floor((digits + 2) / 3) * 100;
    } else if (groups.punct !== undefined) {
      total += Math.floor((cpLen(seg) + 1) / 2) * 100;
    } else if (groups.space !== undefined) {
      total += seg === " " ? 10 : 25;
    } else {
      total += 100;
    }
  }
  return [total, words];
}

export function evaluate(manifest: unknown): EstimateResult {
  if (!isPyDict(manifest)) {
    throw new TypeError("payload must be an object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const family = (manifest.model_family as string | undefined) ?? "generic";
  if (!Object.prototype.hasOwnProperty.call(WORD_FACTOR, family)) {
    throw new TypeError(
      `model_family must be one of ${FAMILIES.join(", ")}`,
    );
  }
  const hasText = Object.prototype.hasOwnProperty.call(manifest, "text");
  const hasMessages = Object.prototype.hasOwnProperty.call(
    manifest,
    "messages",
  );
  if (hasText && hasMessages) {
    throw new TypeError("give text or messages, not both");
  }
  if (!hasText && !hasMessages) {
    throw new TypeError("text or messages is required");
  }
  let hundredths = 0;
  let words = 0;
  let chars = 0;
  let messageCount = 0;
  if (hasText) {
    const text = manifest.text as string;
    [hundredths, words] = estimateHundredths(text, family);
    chars = cpLen(text);
  } else {
    const messages = manifest.messages as Array<Record<string, unknown>>;
    messageCount = messages.length;
    for (const msg of messages) {
      if (!isPyDict(msg) ||
          !Object.prototype.hasOwnProperty.call(msg, "content")) {
        throw new TypeError("each message must carry content");
      }
      const content = msg.content as string;
      const [h, w] = estimateHundredths(content, family);
      hundredths += h + MESSAGE_OVERHEAD[family];
      words += w;
      chars += cpLen(content);
    }
  }
  const estimated = Math.ceil(hundredths / 100);
  const rangeLow = Math.floor((estimated * 85) / 100);
  const rangeHigh = Math.ceil((estimated * 115) / 100);
  return {
    estimated_tokens: estimated,
    range_low: rangeLow,
    range_high: rangeHigh,
    chars,
    words,
    message_count: messageCount,
    model_family: family,
    method:
      `segment-weighted heuristic, factor table v${FACTOR_TABLE_VERSION} ` +
      "— estimate, not a tokenizer count",
    summary:
      `Estimated ${estimated} tokens (range ${rangeLow}-${rangeHigh}) ` +
      `for the ${family} family over ${chars} chars` +
      (messageCount ? ` in ${messageCount} message(s).` : "."),
  };
}

export function stamp(result: EstimateResult): string {
  return [
    "TOKEN ESTIMATOR",
    `estimated_tokens: ${result.estimated_tokens} ` +
      `(range ${result.range_low}-${result.range_high})`,
    `model_family: ${result.model_family}  chars: ${result.chars}  ` +
      `words: ${result.words}  messages: ${result.message_count}`,
    result.method,
    result.summary,
  ].join("\n");
}
