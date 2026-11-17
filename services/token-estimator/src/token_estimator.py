"""Token estimator — a deterministic estimate of the token count of
a text or chat payload, with the method and its uncertainty stated
on the result.

Method (skill: token-estimation, v1; factor table v1). Exact token
counts belong to each model's own tokenizer. This estimator segments
the text into classes and weights each class, using integer
arithmetic in hundredths of a token so the result is exact to
reproduce:

  - word runs (letters, with internal apostrophes/hyphens): the
    family word factor (gpt 133, claude 130, llama 135, generic 133);
  - number runs: digits tokenize in ~3-digit groups — each started
    group of up to 3 digits costs 100;
  - CJK characters (Han, Hiragana, Katakana, Hangul): 100 each;
  - punctuation / symbol runs: 100 per started pair of characters;
  - whitespace runs: 10 for a single space, 25 otherwise;
  - any other single character: 100.

The estimate is the ceiling of the summed hundredths. The reported
range is the estimate -15% (floor) and +15% (ceiling). A chat payload
(a messages list) is estimated per message content plus a fixed
per-message overhead for role/framing (gpt 400, claude 300,
llama 400, generic 400 hundredths).

The result always states that it is an estimate, not a tokenizer
count. Deterministic: same input and family, same numbers.
"""

import json
import math
import re
import sys

FACTOR_TABLE_VERSION = "1"
WORD_FACTOR = {"gpt": 133, "claude": 130, "llama": 135, "generic": 133}
MESSAGE_OVERHEAD = {"gpt": 400, "claude": 300, "llama": 400, "generic": 400}
FAMILIES = tuple(WORD_FACTOR)

MANIFEST_SPEC = {
    "text": "string",
    "messages": [{"role": "string", "content": "string"}],
    "model_family": "string",
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


_SEGMENT_RE = re.compile(
    r"(?P<cjk>[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af])"
    r"|(?P<word>[^\W\d_]+(?:['\u2019\-][^\W\d_]+)*)"
    r"|(?P<number>\d+(?:[.,]\d+)*)"
    r"|(?P<punct>[^\w\s\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]+)"
    r"|(?P<space>\s+)"
    r"|(?P<other>.)",
    re.DOTALL,
)


def _estimate_hundredths(text, family):
    total = 0
    words = 0
    for m in _SEGMENT_RE.finditer(text):
        kind = m.lastgroup
        seg = m.group(0)
        if kind == "cjk":
            total += 100
        elif kind == "word":
            total += WORD_FACTOR[family]
            words += 1
        elif kind == "number":
            digits = sum(1 for ch in seg if ch.isdigit())
            total += ((digits + 2) // 3) * 100
        elif kind == "punct":
            total += ((len(seg) + 1) // 2) * 100
        elif kind == "space":
            total += 10 if seg == " " else 25
        else:
            total += 100
    return total, words


def evaluate(manifest):
    """Return the estimate dict for {"text": str} or
    {"messages": [{"role": str, "content": str}]}, with an optional
    "model_family" (gpt | claude | llama | generic)."""
    if not isinstance(manifest, dict):
        raise ValueError("payload must be an object")
    _validate_manifest(manifest)
    family = manifest.get("model_family", "generic")
    if family not in WORD_FACTOR:
        raise ValueError(
            f"model_family must be one of {', '.join(FAMILIES)}"
        )
    has_text = "text" in manifest
    has_messages = "messages" in manifest
    if has_text and has_messages:
        raise ValueError("give text or messages, not both")
    if not has_text and not has_messages:
        raise ValueError("text or messages is required")
    if has_text:
        hundredths, words = _estimate_hundredths(manifest["text"], family)
        chars = len(manifest["text"])
        message_count = 0
    else:
        hundredths = 0
        words = 0
        chars = 0
        message_count = len(manifest["messages"])
        for msg in manifest["messages"]:
            if not isinstance(msg, dict) or "content" not in msg:
                raise ValueError("each message must carry content")
            h, w = _estimate_hundredths(msg["content"], family)
            hundredths += h + MESSAGE_OVERHEAD[family]
            words += w
            chars += len(msg["content"])
    estimated = math.ceil(hundredths / 100)
    range_low = (estimated * 85) // 100
    range_high = math.ceil(estimated * 115 / 100)
    return {
        "estimated_tokens": estimated,
        "range_low": range_low,
        "range_high": range_high,
        "chars": chars,
        "words": words,
        "message_count": message_count,
        "model_family": family,
        "method": (
            f"segment-weighted heuristic, factor table v{FACTOR_TABLE_VERSION} "
            "— estimate, not a tokenizer count"
        ),
        "summary": (
            f"Estimated {estimated} tokens (range {range_low}-{range_high}) "
            f"for the {family} family over {chars} chars"
            + (f" in {message_count} message(s)." if message_count else ".")
        ),
    }


def stamp(result):
    """Human-readable stamp of an estimate dict."""
    lines = [
        "TOKEN ESTIMATOR",
        f"estimated_tokens: {result['estimated_tokens']} "
        f"(range {result['range_low']}-{result['range_high']})",
        f"model_family: {result['model_family']}  chars: {result['chars']}  "
        f"words: {result['words']}  messages: {result['message_count']}",
        result["method"],
        result["summary"],
    ]
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: token_estimator.py <payload.json>", file=sys.stderr)
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
