"""
Role-play session endpoints.

Flow: Pick difficulty -> system generates a mystery customer -> conversation
The rep doesn't know the customer's hidden traits. Post-session grading
reveals what was hidden and scores how well they handled it.
"""

import uuid
import base64
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.llm import chat
from app.services.tts import synthesize, is_available as tts_available
from app.services.db import save_session
from app.services.objections import (
    DIFFICULTY_CONFIG,
    generate_personality,
    build_system_prompt,
    get_grading_context,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory session store
_sessions: dict[str, dict] = {}


class StartSessionRequest(BaseModel):
    difficulty: str = "medium"


class TurnRequest(BaseModel):
    session_id: str
    text: str


@router.get("/roleplay/config")
async def get_config():
    """Return available difficulties and TTS status."""
    return {
        "difficulties": [
            {"id": "easy", "label": "Easy", "desc": "1-2 objections, 1 hidden trait, light pushback"},
            {"id": "medium", "label": "Medium", "desc": "3 objections, 2 hidden traits, moderate pushback"},
            {"id": "hard", "label": "Hard", "desc": "5 objections, 3 hidden traits, aggressive pushback"},
        ],
        "tts_available": tts_available(),
    }


@router.post("/roleplay/start")
async def start_session(req: StartSessionRequest):
    if req.difficulty not in DIFFICULTY_CONFIG:
        raise HTTPException(400, f"Unknown difficulty: {req.difficulty}")

    # Generate a random mystery customer
    personality = generate_personality(req.difficulty)
    system_prompt = build_system_prompt(personality)

    session_id = str(uuid.uuid4())[:8]
    _sessions[session_id] = {
        "personality": personality,
        "system_prompt": system_prompt,
        "grading_context": get_grading_context(personality),
        "messages": [],  # Rep speaks first -- no AI greeting
        "turn_count": 0,
    }

    return {
        "session_id": session_id,
        "customer_name": personality["name"],
        "difficulty": req.difficulty,
    }


@router.post("/roleplay/turn")
async def take_turn(req: TurnRequest):
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    session["turn_count"] += 1
    session["messages"].append({"role": "user", "content": req.text})

    reply = await chat(
        messages=session["messages"],
        system=session["system_prompt"],
    )
    session["messages"].append({"role": "assistant", "content": reply})

    # Check if session should end
    session_ended = session["turn_count"] >= 15
    end_signals = ["have a good", "goodbye", "not interested", "don't call", "leave me alone", "gotta go"]
    if any(signal in reply.lower() for signal in end_signals) and session["turn_count"] >= 5:
        session_ended = True

    # TTS
    audio_bytes = await synthesize(reply, session["personality"]["name"])
    audio_b64 = base64.b64encode(audio_bytes).decode() if audio_bytes else None

    return {
        "reply": reply,
        "reply_audio": audio_b64,
        "turn_number": session["turn_count"],
        "session_ended": session_ended,
        "tts_mode": "elevenlabs" if audio_bytes else "browser",
    }


@router.post("/roleplay/end/{session_id}")
async def end_session(session_id: str):
    """End session, save to DB, and return the grading context."""
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    # Save to persistent storage
    await save_session(
        session_id=session_id,
        difficulty=session["personality"]["difficulty"],
        customer_name=session["personality"]["name"],
        turn_count=session["turn_count"],
        transcript=session["messages"],
        grading_context=session["grading_context"],
    )

    result = {
        "session_id": session_id,
        "transcript": session["messages"],
        "turn_count": session["turn_count"],
        "grading_context": session["grading_context"],
    }
    del _sessions[session_id]
    return result


@router.get("/roleplay/session/{session_id}")
async def get_session(session_id: str):
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return {
        "customer_name": session["personality"]["name"],
        "difficulty": session["personality"]["difficulty"],
        "turn_count": session["turn_count"],
        "message_count": len(session["messages"]),
    }
