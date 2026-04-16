"""
LLM service with two backends:
1. Anthropic API (if ANTHROPIC_API_KEY is set)
2. `claude -p` CLI pipe mode (fallback, uses Max account)

Supports both single-shot prompts and multi-turn conversations.
"""

import asyncio
import json
import logging
import re
import shutil

from app.config import ANTHROPIC_API_KEY

logger = logging.getLogger(__name__)

# Detect which backend to use at startup
_use_api = bool(ANTHROPIC_API_KEY)
_claude_cli_path = shutil.which("claude")

if _use_api:
    from anthropic import AsyncAnthropic
    _client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    logger.info("LLM backend: Anthropic API")
elif _claude_cli_path:
    _client = None
    logger.info("LLM backend: claude -p CLI (%s)", _claude_cli_path)
else:
    _client = None
    logger.warning("No LLM backend available! Set ANTHROPIC_API_KEY or install claude CLI.")


async def _call_api(
    messages: list[dict],
    system: str = "",
    max_tokens: int = 2000,
) -> str:
    """Call Claude via the Anthropic SDK with full message history."""
    kwargs = {
        "model": "claude-sonnet-4-20250514",
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if system:
        kwargs["system"] = system
    response = await _client.messages.create(**kwargs)
    return response.content[0].text


async def _call_cli(
    messages: list[dict],
    system: str = "",
) -> str:
    """Call Claude via `claude -p` pipe mode.

    Since the CLI only accepts a single text prompt, we format the
    conversation into a structured prompt with system instructions.
    """
    parts = []
    if system:
        parts.append(f"<system>\n{system}\n</system>\n")
    for msg in messages:
        role = msg["role"].upper()
        parts.append(f"<{role}>\n{msg['content']}\n</{role}>")
    parts.append("\nRespond as the ASSISTANT:")
    prompt = "\n".join(parts)

    proc = await asyncio.create_subprocess_exec(
        _claude_cli_path, "-p",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await asyncio.wait_for(
        proc.communicate(input=prompt.encode()),
        timeout=120,
    )
    if proc.returncode != 0:
        err = stderr.decode().strip()
        raise RuntimeError(f"claude -p failed (exit {proc.returncode}): {err}")
    return stdout.decode().strip()


async def ask(prompt: str, max_tokens: int = 2000) -> str:
    """Single-shot prompt (no conversation history)."""
    messages = [{"role": "user", "content": prompt}]
    return await chat(messages, max_tokens=max_tokens)


async def chat(
    messages: list[dict],
    system: str = "",
    max_tokens: int = 2000,
) -> str:
    """Multi-turn conversation. Messages are [{role, content}, ...]."""
    if _use_api and _client:
        return await _call_api(messages, system, max_tokens)
    if _claude_cli_path:
        return await _call_cli(messages, system)
    raise RuntimeError(
        "No LLM backend configured. Set ANTHROPIC_API_KEY in .env or install the claude CLI."
    )


def parse_json_response(text: str) -> dict:
    """Extract JSON from an LLM response, stripping markdown fences if present."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def get_backend_info() -> dict:
    """Return info about which LLM backend is active."""
    if _use_api:
        return {"backend": "anthropic_api", "model": "claude-sonnet-4-20250514"}
    if _claude_cli_path:
        return {"backend": "claude_cli", "path": _claude_cli_path}
    return {"backend": "none"}
