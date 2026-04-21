from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.assessor import assess_session
from app.services.db import update_assessment, get_session

router = APIRouter()


class AssessRequest(BaseModel):
    session_id: str | None = None
    transcript: list[dict]
    grading_context: dict


@router.post("/assess")
async def assess(req: AssessRequest):
    if not req.transcript or len(req.transcript) < 3:
        raise HTTPException(400, "Transcript too short to assess")
    if not req.grading_context:
        raise HTTPException(400, "Missing grading context")

    result = await assess_session(req.transcript, req.grading_context)

    # Save assessment to DB if session_id provided
    if req.session_id:
        try:
            await update_assessment(req.session_id, result)
        except Exception:
            pass

    return result


@router.post("/assess/retry/{session_id}")
async def retry_assessment(session_id: str):
    """Re-run assessment for a saved session (useful if grading timed out)."""
    session = await get_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    result = await assess_session(session["transcript"], session["grading_context"])

    try:
        await update_assessment(session_id, result)
    except Exception:
        pass

    return result
