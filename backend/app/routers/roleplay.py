"""
Role-play session endpoints.

Sessions are stored in-memory for MVP. Each session tracks:
- Personality, difficulty, selected objections
- Full conversation history (for context)
- Turn count
"""

import uuid
import base64
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.llm import chat
from app.services.tts import synthesize, is_available as tts_available
from app.services.objections import (
    PERSONALITIES,
    DIFFICULTY_CONFIG,
    select_objections,
    build_system_prompt,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory session store
_sessions: dict[str, dict] = {}


class StartSessionRequest(BaseModel):
    personality: str = "skeptical_steve"
    difficulty: str = "medium"


class TurnRequest(BaseModel):
    session_id: str
    text: str


class StartSessionResponse(BaseModel):
    session_id: str
    personality: dict
    difficulty: str
    greeting: str
    greeting_audio: str | None = None  # base64 mp3 if ElevenLabs available
    tts_mode: str


class TurnResponse(BaseModel):
    reply: str
    reply_audio: str | None = None  # base64 mp3
    turn_number: int
    session_ended: bool
    tts_mode: str


@router.get("/roleplay/personalities")
async def list_personalities():
    return {
        "personalities": [
            {"id": k, **v} for k, v in PERSONALITIES.items()
        ],
        "difficulties": list(DIFFICULTY_CONFIG.keys()),
        "tts_available": tts_available(),
    }


@router.post("/roleplay/start", response_model=StartSessionResponse)
async def start_session(req: StartSessionRequest):
    if req.personality not in PERSONALITIES:
        raise HTTPException(400, f"Unknown personality: {req.personality}")
    if req.difficulty not in DIFFICULTY_CONFIG:
        raise HTTPException(400, f"Unknown difficulty: {req.difficulty}")

    persona = PERSONALITIES[req.personality]
    objections = select_objections(req.difficulty)
    system_prompt = build_system_prompt(req.personality, req.difficulty, objections)

    # Get the AI's opening line (the customer answering the door/phone)
    greeting = await chat(
        messages=[{"role": "user", "content": "(The salesperson knocks on the door or calls. You answer.)"}],
        system=system_prompt,
    )

    session_id = str(uuid.uuid4())[:8]
    _sessions[session_id] = {
        "personality": req.personality,
        "difficulty": req.difficulty,
        "system_prompt": system_prompt,
        "objections": objections,
        "messages": [
            {"role": "user", "content": "(The salesperson knocks on the door or calls. You answer.)"},
            {"role": "assistant", "content": greeting},
        ],
        "turn_count": 0,
    }

    # Generate TTS for greeting
    audio_bytes = await synthesize(greeting, req.personality)
    audio_b64 = base64.b64encode(audio_bytes).decode() if audio_bytes else None

    return StartSessionResponse(
        session_id=session_id,
        personality={"id": req.personality, **persona},
        difficulty=req.difficulty,
        greeting=greeting,
        greeting_audio=audio_b64,
        tts_mode="elevenlabs" if audio_bytes else "browser",
    )


@router.post("/roleplay/turn", response_model=TurnResponse)
async def take_turn(req: TurnRequest):
    session = _sessions.get(req.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    session["turn_count"] += 1
    session["messages"].append({"role": "user", "content": req.text})

    # Get AI response
    reply = await chat(
        messages=session["messages"],
        system=session["system_prompt"],
    )
    session["messages"].append({"role": "assistant", "content": reply})

    # Check if session should end (after ~12 turns or AI signals end)
    session_ended = session["turn_count"] >= 15
    end_signals = ["have a good", "goodbye", "not interested", "don't call", "leave me alone", "gotta go"]
    if any(signal in reply.lower() for signal in end_signals) and session["turn_count"] >= 5:
        session_ended = True

    # Generate TTS
    audio_bytes = await synthesize(reply, session["personality"])
    audio_b64 = base64.b64encode(audio_bytes).decode() if audio_bytes else None

    return TurnResponse(
        reply=reply,
        reply_audio=audio_b64,
        turn_number=session["turn_count"],
        session_ended=session_ended,
        tts_mode="elevenlabs" if audio_bytes else "browser",
    )


@router.get("/roleplay/session/{session_id}")
async def get_session(session_id: str):
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return {
        "personality": session["personality"],
        "difficulty": session["difficulty"],
        "turn_count": session["turn_count"],
        "messages": session["messages"],
        "objections": session["objections"],
    }


@router.post("/roleplay/end/{session_id}")
async def end_session(session_id: str):
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    # Return transcript for assessment
    transcript = session["messages"]
    del _sessions[session_id]
    return {"transcript": transcript, "turn_count": session["turn_count"]}
