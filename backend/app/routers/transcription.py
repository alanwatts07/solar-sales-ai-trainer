import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.stt import transcribe, is_available

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    if not is_available():
        raise HTTPException(503, "No STT backend available. Check server logs.")

    if not audio.filename:
        raise HTTPException(400, "No audio file provided")

    audio_bytes = await audio.read()
    logger.info("Received audio: %s, %d bytes", audio.filename, len(audio_bytes))

    if len(audio_bytes) == 0:
        raise HTTPException(400, "Empty audio file")

    if len(audio_bytes) < 1000:
        raise HTTPException(400, f"Audio too short ({len(audio_bytes)} bytes). Record for longer.")

    try:
        text = await transcribe(audio_bytes, audio.filename)
        logger.info("Transcription result: %s", text[:200] if text else "(empty)")
        return {"text": text}
    except Exception as e:
        logger.error("Transcription failed: %s", e)
        raise HTTPException(500, f"Transcription error: {e}")
