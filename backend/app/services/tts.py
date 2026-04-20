"""
Text-to-speech service using OpenAI TTS API.
Maps female names to female voices, male names to male voices.
Falls back to browser TTS if no API key.
"""

import logging
from openai import AsyncOpenAI
from app.config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# OpenAI TTS voices
# Female voices: alloy, nova, shimmer
# Male voices: echo, fable, onyx
FEMALE_VOICES = ["nova", "shimmer", "alloy"]
MALE_VOICES = ["echo", "fable", "onyx"]

FEMALE_NAMES = {
    "sarah", "linda", "maria", "karen", "angela", "diane", "patricia",
    "susan", "jennifer", "lisa", "barbara", "helen", "mary", "donna",
    "nancy", "betty", "dorothy", "sandra", "ruth", "sharon",
}


def _pick_voice(customer_name: str) -> str:
    """Pick a voice based on the customer's name (gender matching)."""
    name_lower = customer_name.lower().split()[0] if customer_name else ""
    if name_lower in FEMALE_NAMES:
        # Use a consistent voice per name
        idx = hash(name_lower) % len(FEMALE_VOICES)
        return FEMALE_VOICES[idx]
    else:
        idx = hash(name_lower) % len(MALE_VOICES)
        return MALE_VOICES[idx]


async def synthesize(text: str, customer_name: str = "") -> bytes | None:
    """Convert text to speech audio bytes (mp3) using OpenAI TTS.

    Returns audio bytes if API key available, None for browser TTS fallback.
    """
    if not _client:
        return None

    voice = _pick_voice(customer_name)
    logger.info("TTS: voice=%s for customer=%s", voice, customer_name)

    try:
        response = await _client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
            response_format="mp3",
            speed=1.1,  # Slightly faster for conversational feel
        )
        return response.content
    except Exception as e:
        logger.error("TTS failed: %s", e)
        return None


def is_available() -> bool:
    return _client is not None


def get_backend_name() -> str:
    return "openai_tts" if _client else "browser"
