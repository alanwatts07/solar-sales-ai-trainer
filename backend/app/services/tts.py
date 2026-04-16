"""
Text-to-speech service.
- ElevenLabs API if key is set
- Otherwise returns text for browser-side Web Speech Synthesis
"""

import logging
import httpx
from app.config import ELEVENLABS_API_KEY

logger = logging.getLogger(__name__)

_use_elevenlabs = bool(ELEVENLABS_API_KEY)

# ElevenLabs voice IDs mapped to personalities
# These are default ElevenLabs voices -- replace with custom ones if desired
VOICE_MAP = {
    "skeptical_steve": "ErXwobaYiN019PkySvjV",    # Antoni
    "busy_barbara": "MF3mGyEYCl7XYWbV9V6O",       # Elli
    "friendly_frank": "VR6AewLTigWG4xSOukaG",      # Arnold
    "hostile_helen": "pNInz6obpgDQGcFmaJgB",       # Adam (swapped for female if available)
    "analytical_alex": "yoZ06aMxZJJ28mfd3POQ",     # Sam
}


async def synthesize(text: str, personality_id: str = "skeptical_steve") -> bytes | None:
    """Convert text to speech audio bytes (mp3).

    Returns audio bytes if ElevenLabs is available, None if using browser TTS.
    """
    if not _use_elevenlabs:
        return None

    voice_id = VOICE_MAP.get(personality_id, VOICE_MAP["skeptical_steve"])

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                },
            },
            timeout=30.0,
        )
        response.raise_for_status()
        return response.content


def is_available() -> bool:
    return _use_elevenlabs


def get_backend_name() -> str:
    return "elevenlabs" if _use_elevenlabs else "browser"
