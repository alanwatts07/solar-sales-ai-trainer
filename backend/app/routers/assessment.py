from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.assessor import assess_session
from app.services.db import update_assessment

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
            pass  # Don't fail the request if DB update fails

    return result
