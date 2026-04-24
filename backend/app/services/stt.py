"""
Speech-to-text with automatic fallback:
1. OpenAI Whisper API (if OPENAI_API_KEY set and not quota-exhausted)
2. Local faster-whisper (free, no API key, runs on CPU)
3. Fail with descriptive error

On quota/rate-limit errors from OpenAI, automatically switches to local
for the rest of the process lifetime (no point retrying until refill).
"""

import tempfile
import os
import logging

from app.config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

# --- Backend 1: OpenAI Whisper API ---
_use_whisper_api = bool(OPENAI_API_KEY)
_openai_client = None
_api_disabled = False  # Flips to True on quota/rate-limit errors

if _use_whisper_api:
    from openai import AsyncOpenAI
    _openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    logger.info("STT backend: OpenAI Whisper API (with local fallback)")

# --- Backend 2: Local faster-whisper ---
_local_model = None
try:
    from faster_whisper import WhisperModel
    # Use tiny model for speed on CPU; downloads ~75MB on first run
    _local_model = WhisperModel("tiny", device="cpu", compute_type="int8")
    logger.info("STT backend: local faster-whisper (tiny model, CPU)")
except Exception as e:
    logger.info("Local faster-whisper not available: %s", e)


def _transcribe_local(tmp_path: str) -> str:
    """Run local faster-whisper transcription."""
    if not _local_model:
        raise RuntimeError("Local whisper not available")
    logger.info("Transcribing locally with faster-whisper")
    segments, info = _local_model.transcribe(
        tmp_path,
        language="en",
        beam_size=5,
        vad_filter=True,
    )
    text = " ".join(seg.text.strip() for seg in segments)
    logger.info("Local transcription done: language=%s, duration=%.1fs", info.language, info.duration)
    return text.strip()


async def transcribe(audio_bytes: bytes, filename: str) -> str:
    """Transcribe audio bytes to text with automatic fallback."""
    global _api_disabled

    suffix = os.path.splitext(filename)[1] or ".webm"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio_bytes)
        f.flush()
        tmp_path = f.name

    try:
        # Try API unless it's been disabled due to quota errors
        if _use_whisper_api and _openai_client and not _api_disabled:
            try:
                logger.info("Transcribing with Whisper API (%d bytes)", len(audio_bytes))
                with open(tmp_path, "rb") as audio_file:
                    response = await _openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="text",
                    )
                return response.strip()
            except Exception as e:
                err_msg = str(e)
                is_quota = (
                    "insufficient_quota" in err_msg
                    or "rate_limit" in err_msg.lower()
                    or "429" in err_msg
                )
                if is_quota and _local_model:
                    logger.warning(
                        "OpenAI Whisper quota/rate-limit hit. Disabling API, using local: %s",
                        err_msg[:200],
                    )
                    _api_disabled = True
                    # Fall through to local
                elif _local_model:
                    logger.warning(
                        "Whisper API failed, falling back to local: %s",
                        err_msg[:200],
                    )
                    # Fall through to local
                else:
                    raise

        # Local fallback
        if _local_model:
            return _transcribe_local(tmp_path)

        raise RuntimeError("No STT backend available")
    finally:
        os.unlink(tmp_path)


def is_available() -> bool:
    """True if any server-side STT backend is ready."""
    return _use_whisper_api or _local_model is not None


def get_backend_name() -> str:
    if _use_whisper_api and not _api_disabled:
        return "whisper_api"
    if _local_model:
        return "local_whisper"
    return "none"
