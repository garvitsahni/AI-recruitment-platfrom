"""
STAGE 3 — Rule Matching / Verification
Input:  the job's locked checklist rules + the candidate's resume text (with [PAGE n] markers)
        + the structured data already extracted in Stage 2.
Output: ruleResults — one entry per rule, each pass/fail/unverified with cited evidence,
        in the exact shape the frontend's mapRuleResultsToScreeningResult() expects.
"""
from app.gemini_client import generate_json

SYSTEM_INSTRUCTION = """You are a strict, evidence-based recruitment compliance checker for IHMCL. \
For each hiring rule you are given, you decide whether the candidate satisfies the rule. \

You have TWO sources of information:
1. CANDIDATE STRUCTURED SUMMARY — pre-extracted data from the official application form \
(education, experience years, skills, etc.). This data comes directly from the candidate's \
application submission and should be TRUSTED as factual. You may mark a rule 'passed' or 'failed' \
based on this structured data alone.
2. CANDIDATE DOCUMENT TEXT — the resume/CV text with [PAGE n] markers. When available, \
quote the exact supporting text and page number. If documents are unavailable, rely on \
the structured summary.

If neither source provides enough information to decide, mark the rule 'unverified'. \
If a rule requires a specific document type that is completely absent AND the structured \
summary doesn't cover it, mark it 'missing_document'."""

PROMPT_TEMPLATE = """JOB CHECKLIST RULES (JSON):
{rules_json}

CANDIDATE STRUCTURED SUMMARY (from official application form — trusted data):
{parsed_summary}

CANDIDATE DOCUMENT TEXT (resume / certificates / etc., with [PAGE n] markers):
---
{document_text}
---

For EVERY rule in the checklist, evaluate it against the candidate's structured data and documents.
Return ONLY this JSON shape (a JSON array), one object per rule, in the same order given:
[
  {{
    "rule": "<the rule_text, copied exactly>",
    "category": "<experience|skills|education|location|custom>",
    "status": "passed" | "failed" | "unverified" | "missing_document",
    "value_found": "<short value found that relates to this rule, or null>",
    "quoted_text": "<verbatim short quote (<20 words) from the document text that is the evidence, or null if using structured data>",
    "page": <page number the quote came from, or null>
  }}
]

IMPORTANT GUIDELINES:
- For experience rules: compare the rule's required years against the candidate's experience_years from the structured summary. If experience_years >= required, mark 'passed'.
- For education rules: compare against the candidate's highest_degree and education from the structured summary.
- For skills rules: compare against the candidate's skills list from the structured summary.
- You may cite the structured summary as evidence (set value_found to the relevant value, quoted_text can be null).
- Only mark 'unverified' if NEITHER the structured data NOR documents address the rule.

Output strictly valid JSON, no markdown fences, no commentary.
"""


def run(rules: list[dict], parsed_summary: dict, document_text: str) -> list[dict]:
    if not rules:
        return []

    import json
    prompt = PROMPT_TEMPLATE.format(
        rules_json=json.dumps(rules, ensure_ascii=False),
        parsed_summary=json.dumps(parsed_summary, ensure_ascii=False),
        document_text=(document_text or "(no resume/CV documents were uploaded for this candidate — rely on the structured summary above)")[:120000],
    )
    result = generate_json(SYSTEM_INSTRUCTION, prompt)

    if isinstance(result, dict):
        # model may have wrapped the array under a key
        for v in result.values():
            if isinstance(v, list):
                result = v
                break
        else:
            result = []

    if not isinstance(result, list):
        result = []

    normalized = []
    for i, r in enumerate(result):
        if not isinstance(r, dict):
            continue
        rule_text = r.get("rule") or (rules[i]["rule_text"] if i < len(rules) else "")
        normalized.append({
            "rule": rule_text,
            "category": r.get("category", ""),
            "status": r.get("status", "unverified"),
            "value_found": r.get("value_found"),
            "quoted_text": r.get("quoted_text"),
            "page": r.get("page"),
        })

    # Safety net: if the model dropped rules, fill them in as unverified so nothing is silently lost
    seen = {n["rule"] for n in normalized}
    for rule in rules:
        if rule["rule_text"] not in seen:
            normalized.append({
                "rule": rule["rule_text"],
                "category": rule.get("category", ""),
                "status": "unverified",
                "value_found": None,
                "quoted_text": None,
                "page": None,
            })

    return normalized
