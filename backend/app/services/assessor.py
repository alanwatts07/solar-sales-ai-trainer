"""
Post-session assessment service.

Grades the rep on how well they handled the mystery customer by analyzing
the full transcript against the hidden personality context. The rep is
scored on skills they didn't know they were being tested on.
"""

import json
import logging
from app.services.llm import ask, parse_json_response

logger = logging.getLogger(__name__)


async def assess_session(
    transcript: list[dict],
    grading_context: dict,
) -> dict:
    """Grade a completed role-play session.

    Args:
        transcript: List of {role, content} message dicts
        grading_context: The hidden personality info (traits, objections, mood)

    Returns:
        Full assessment with grades, scores, and feedback
    """
    # Format transcript for the prompt
    convo_lines = []
    for msg in transcript:
        if msg["content"].startswith("("):
            continue  # Skip the stage direction
        speaker = "SALESPERSON" if msg["role"] == "user" else "CUSTOMER"
        convo_lines.append(f"{speaker}: {msg['content']}")
    conversation = "\n".join(convo_lines)

    # Format hidden traits
    traits_desc = "\n".join(
        f"- {t['trait'].replace('_', ' ').title()}: {t['description']} (Clue: {t['hint']})"
        for t in grading_context["hidden_traits"]
    )

    # Format objections
    objections_desc = "\n".join(
        f"- \"{o['text']}\" (tests: {o['skill'].replace('_', ' ')})"
        for o in grading_context["objections"]
    )

    prompt = f"""You are a senior solar sales trainer evaluating a role-play session. The salesperson did NOT know anything about the customer's hidden traits -- they had to figure it out from conversation cues.

CUSTOMER PROFILE (hidden from salesperson):
- Name: {grading_context['customer_name']}
- Difficulty: {grading_context['difficulty']}
- Emotional State: {grading_context['emotional_state']}

HIDDEN TRAITS (the salesperson needed to discover these):
{traits_desc}

OBJECTIONS USED:
{objections_desc}

FULL CONVERSATION:
{conversation}

Grade this salesperson. Respond with valid JSON only (no markdown fences):
{{
  "overall_grade": "A/B/C/D/F",
  "overall_score": 0-100,
  "overall_summary": "2-3 sentence executive summary of performance",

  "trait_detection": {{
    "score": 0-100,
    "grade": "A-F",
    "detected": [
      {{
        "trait": "trait_name",
        "detected": true/false,
        "evidence": "what the salesperson said/did that shows they noticed or missed it",
        "handling": "how well they addressed it once detected (or failed to)"
      }}
    ],
    "feedback": "1-2 sentences on their ability to read the customer"
  }},

  "objection_handling": {{
    "score": 0-100,
    "grade": "A-F",
    "per_objection": [
      {{
        "objection": "the objection text",
        "skill_tested": "the skill category",
        "handled": true/false,
        "quality": "poor/fair/good/excellent",
        "notes": "brief note on how they handled or fumbled it"
      }}
    ],
    "feedback": "1-2 sentences on objection handling"
  }},

  "empathy": {{
    "score": 0-100,
    "grade": "A-F",
    "feedback": "Did they listen? Acknowledge feelings? Build rapport? Or just bulldoze?"
  }},

  "closing_skills": {{
    "score": 0-100,
    "grade": "A-F",
    "feedback": "Did they ask for next steps? Create urgency? Or let the customer off the hook?"
  }},

  "conversation_flow": {{
    "score": 0-100,
    "grade": "A-F",
    "feedback": "Was the conversation natural? Did they adapt? Or was it scripted and robotic?"
  }},

  "tips": [
    "Actionable tip 1 (specific to what happened in THIS conversation)",
    "Actionable tip 2",
    "Actionable tip 3"
  ],

  "highlight_moment": "The single best thing the salesperson did (or 'None' if nothing stood out)",
  "biggest_miss": "The single biggest opportunity they missed"
}}

Be honest but constructive. Reference specific moments from the conversation. A great salesperson reads between the lines, addresses the REAL concern (not just the stated one), and makes the customer feel heard."""

    raw = await ask(prompt, max_tokens=3000)
    result = parse_json_response(raw)
    return result
