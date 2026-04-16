"""
Speech-to-text with three backends (tried in order):
1. OpenAI Whisper API (if OPENAI_API_KEY is set)
2. Local faster-whisper (free, no API key, runs on CPU)
3. Fail with descriptive error
"""

import tempfile
import os
import logging

from app.config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

# --- Backend 1: OpenAI Whisper API ---
_use_whisper_api = bool(OPENAI_API_KEY)
_openai_client = None

if _use_whisper_api:
    from openai import AsyncOpenAI
    _openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    logger.info("STT backend: OpenAI Whisper API")

# --- Backend 2: Local faster-whisper ---
_local_model = None
try:
    from faster_whisper import WhisperModel
    # Use tiny model for speed on CPU; downloads ~75MB on first run
    _local_model = WhisperModel("tiny", device="cpu", compute_type="int8")
    logger.info("STT backend: local faster-whisper (tiny model, CPU)")
except Exception as e:
    logger.info("Local faster-whisper not available: %s", e)


async def transcribe(audio_bytes: bytes, filename: str) -> str:
    """Transcribe audio bytes to text."""
    suffix = os.path.splitext(filename)[1] or ".webm"

    # Write to temp file (both backends need a file path)
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio_bytes)
        f.flush()
        tmp_path = f.name

    try:
        # Try OpenAI Whisper API first
        if _use_whisper_api and _openai_client:
            logger.info("Transcribing with Whisper API (%d bytes)", len(audio_bytes))
            with open(tmp_path, "rb") as audio_file:
                response = await _openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text",
                )
            return response.strip()

        # Fall back to local faster-whisper
        if _local_model:
            logger.info("Transcribing locally with faster-whisper (%d bytes)", len(audio_bytes))
            segments, info = _local_model.transcribe(
                tmp_path,
                language="en",
                beam_size=5,
                vad_filter=True,
            )
            text = " ".join(seg.text.strip() for seg in segments)
            logger.info("Local transcription done: language=%s, duration=%.1fs", info.language, info.duration)
            return text.strip()

        raise RuntimeError("No STT backend available")
    finally:
        os.unlink(tmp_path)


def is_available() -> bool:
    """True if any server-side STT backend is ready."""
    return _use_whisper_api or _local_model is not None


def get_backend_name() -> str:
    if _use_whisper_api:
        return "whisper_api"
    if _local_model:
        return "local_whisper"
    return "none"
