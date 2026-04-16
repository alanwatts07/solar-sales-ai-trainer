from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.assessor import assess_session

router = APIRouter()


class AssessRequest(BaseModel):
    transcript: list[dict]
    grading_context: dict


@router.post("/assess")
async def assess(req: AssessRequest):
    if not req.transcript or len(req.transcript) < 3:
        raise HTTPException(400, "Transcript too short to assess")
    if not req.grading_context:
        raise HTTPException(400, "Missing grading context")

    result = await assess_session(req.transcript, req.grading_context)
    return result
