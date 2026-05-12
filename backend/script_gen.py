import os
import sys
import time
import httpx

OLLAMA_URL   = os.environ.get("OLLAMA_URL",   "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")

_LANG = {"en": "English", "ar": "Arabic"}


def _log(msg: str):
    print(msg, file=sys.stderr, flush=True)


async def generate_narration_script(video_prompt: str, tone_hints: str, language: str) -> str:
    lang      = _LANG.get(language, "English")
    tone_line = f" Tone and style: {tone_hints.strip()}." if tone_hints and tone_hints.strip() else ""

    prompt = (
        f"Write a short narration script ({lang}) for a children's personalised story video. "
        f"The video shows: {video_prompt}.{tone_line} "
        "Keep it to 3-5 sentences, vivid and age-appropriate. "
        "Output only the narration text — no titles, labels, or extra formatting."
    )

    _log(f"[OLLAMA] model={OLLAMA_MODEL} lang={language} tone={tone_hints!r}")
    _log(f"[OLLAMA] Prompt: {prompt}")

    t0 = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model":    OLLAMA_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "stream":   False,
                },
            )
            resp.raise_for_status()
            script = resp.json()["message"]["content"].strip()
            _log(f"[OLLAMA] Done in {time.monotonic()-t0:.1f}s | words={len(script.split())}")
            _log(f"[OLLAMA] Generated: {script}")
            return script

    except Exception as exc:
        _log(f"[OLLAMA] Unavailable ({time.monotonic()-t0:.1f}s): {exc} — using fallback")
        tone_part = f" {tone_hints.strip()}." if tone_hints and tone_hints.strip() else "."
        fallback = (
            f"Once upon a time, a magical adventure began{tone_part} "
            f"{video_prompt} "
            "The world was full of wonder, and every moment sparkled with excitement. "
            "This is a story just for you."
        )
        _log(f"[OLLAMA] Fallback: {fallback}")
        return fallback
