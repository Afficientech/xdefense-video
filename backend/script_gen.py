import os
import sys
import time
import httpx

OLLAMA_URL   = os.environ.get("OLLAMA_URL",   "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")

_LANG = {"en": "English", "ar": "Arabic"}


def _log(msg: str):
    print(msg, file=sys.stderr, flush=True)


async def generate_narration_script(video_prompt: str, tone_hints: str, language: str, duration: int = 10) -> str:
    lang      = _LANG.get(language, "English")
    tone_line = f" Tone and style: {tone_hints.strip()}." if tone_hints and tone_hints.strip() else ""
    word_target = "40–55" if duration <= 5 else "80–100"

    prompt = (
        f"Write a narration script in {lang} for a {duration}-second children's story video.\n"
        f"The video shows: {video_prompt}.{tone_line}\n"
        "Structure it in exactly three parts — no labels or numbers in the output:\n"
        "1. Opening hook — one vivid sentence that sets the scene and pulls the listener in.\n"
        "2. Adventure beat — one or two sentences of action, discovery, or magic.\n"
        "3. Closing line — one warm sentence that gives the story a satisfying landing "
        "(a lesson, an emotion, or a callback to the opening image).\n"
        f"Target: {word_target} words total, paced for calm storytelling.\n"
        "Output only the narration text — no titles, labels, headings, or extra formatting."
    )

    _log(f"[OLLAMA] model={OLLAMA_MODEL} lang={language} duration={duration}s tone={tone_hints!r} words={word_target}")
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
            f"Once upon a time, an extraordinary adventure began{tone_part} "
            "The world shimmered with possibility, and every moment held a new wonder. "
            "And at the end of it all, one thing was certain — this story belonged to you."
        )
        _log(f"[OLLAMA] Fallback: {fallback}")
        return fallback
