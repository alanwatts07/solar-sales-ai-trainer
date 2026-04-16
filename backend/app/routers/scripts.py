from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.script_grader import grade_script

router = APIRouter()

# In-memory store for MVP
_scripts: dict[str, str] = {}


class ScriptUpload(BaseModel):
    content: str
    title: str = "Untitled"


class GradeRequest(BaseModel):
    golden_script: str
    transcript: str


@router.post("/scripts")
async def upload_script(payload: ScriptUpload):
    script_id = str(len(_scripts) + 1)
    _scripts[script_id] = payload.content
    return {"id": script_id, "title": payload.title, "word_count": len(payload.content.split())}


@router.get("/scripts")
async def list_scripts():
    return [{"id": k, "content": v} for k, v in _scripts.items()]


@router.post("/scripts/grade")
async def grade(payload: GradeRequest):
    if not payload.golden_script.strip():
        raise HTTPException(400, "Golden script is empty")
    if not payload.transcript.strip():
        raise HTTPException(400, "Transcript is empty")

    result = await grade_script(payload.golden_script, payload.transcript)
    return result
