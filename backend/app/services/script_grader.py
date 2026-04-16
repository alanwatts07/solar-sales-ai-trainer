import re
from rapidfuzz import fuzz
from app.services.llm import ask, parse_json_response


def _extract_keywords(text: str) -> list[str]:
    """Extract significant words (3+ chars, lowercased, deduplicated)."""
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    seen: set[str] = set()
    result: list[str] = []
    for w in words:
        if w not in seen:
            seen.add(w)
            result.append(w)
    return result


def _fuzzy_score(golden: str, transcript: str) -> float:
    """Token-level fuzzy similarity between golden script and transcript."""
    return fuzz.token_sort_ratio(golden.lower(), transcript.lower())


def _keyword_analysis(golden: str, transcript: str) -> tuple[list[str], list[str]]:
    """Return (matched, missed) keyword lists."""
    golden_kw = set(_extract_keywords(golden))
    transcript_kw = set(_extract_keywords(transcript))
    matched = sorted(golden_kw & transcript_kw)
    missed = sorted(golden_kw - transcript_kw)
    return matched, missed


async def _llm_semantic_analysis(golden: str, transcript: str) -> dict:
    """Use Claude to do semantic diff and feedback."""
    prompt = f"""You are a sales script grading assistant. Compare the salesperson's attempt against the golden script.

GOLDEN SCRIPT:
{golden}

SALESPERSON'S ATTEMPT:
{transcript}

Respond with valid JSON only (no markdown fences):
{{
  "semantic_feedback": "2-3 sentence summary of how well they did and what they missed semantically",
  "incorrect_phrases": [
    {{"expected": "phrase from golden script", "actual": "what they said instead"}}
  ],
  "diff_segments": [
    {{"type": "match|missing|incorrect|extra", "text": "the text segment", "expected": "if incorrect, what was expected", "actual": "if incorrect, what was said"}}
  ]
}}

For diff_segments, break the golden script into phrases and mark each as:
- "match" if the transcript covers the same meaning
- "missing" if the transcript skipped it entirely
- "incorrect" if the transcript said something different (include expected and actual)
- "extra" for things in the transcript not in the golden script

Keep diff_segments concise (combine adjacent matches into larger chunks)."""

    raw = await ask(prompt)
    return parse_json_response(raw)


async def grade_script(golden: str, transcript: str) -> dict:
    """Full grading pipeline: fuzzy + keyword + LLM semantic."""
    fuzzy = _fuzzy_score(golden, transcript)
    matched, missed = _keyword_analysis(golden, transcript)
    llm_result = await _llm_semantic_analysis(golden, transcript)

    # Blend fuzzy score with keyword coverage
    keyword_score = (len(matched) / max(len(matched) + len(missed), 1)) * 100
    accuracy = round(fuzzy * 0.6 + keyword_score * 0.4)

    return {
        "accuracy_score": accuracy,
        "matched_keywords": matched,
        "missed_keywords": missed,
        "incorrect_phrases": llm_result.get("incorrect_phrases", []),
        "semantic_feedback": llm_result.get("semantic_feedback", ""),
        "diff_segments": llm_result.get("diff_segments", []),
    }
