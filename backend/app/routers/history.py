from fastapi import APIRouter, HTTPException
from app.services.db import get_sessions, get_session, get_stats

router = APIRouter()


@router.get("/history")
async def list_sessions(limit: int = 50, offset: int = 0):
    sessions = await get_sessions(limit, offset)
    return {"sessions": sessions}


@router.get("/history/stats")
async def session_stats():
    return await get_stats()


@router.get("/history/{session_id}")
async def session_detail(session_id: str):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session
