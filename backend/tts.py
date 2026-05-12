import asyncio
import os
import sys
import time
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings

_client: ElevenLabs | None = None


def _log(msg: str):
    print(msg, file=sys.stderr, flush=True)


def _get_client() -> ElevenLabs:
    global _client
    if _client is None:
        _client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
    return _client


VOICES = {
    "en": os.environ.get("VOICE_EN", "21m00Tcm4TlvDq8ikWAM"),
    "ar": os.environ.get("VOICE_AR", "21m00Tcm4TlvDq8ikWAM"),
}


def _generate_sync(job_id: str, text: str, language: str) -> str:
    voice_id = VOICES.get(language, VOICES["en"])
    _log(f"[JOB {job_id}] ElevenLabs » voice={voice_id} lang={language} words={len(text.split())}")
    _log(f"[JOB {job_id}] Script: {text}")

    client = _get_client()
    t0 = time.monotonic()
    audio_iter = client.text_to_speech.convert(
        text=text,
        voice_id=voice_id,
        model_id="eleven_multilingual_v2",
        voice_settings=VoiceSettings(stability=0.5, similarity_boost=0.75),
    )

    os.makedirs("audio", exist_ok=True)
    path = f"audio/{job_id}.mp3"
    total_bytes = 0
    with open(path, "wb") as f:
        for chunk in audio_iter:
            f.write(chunk)
            total_bytes += len(chunk)

    _log(f"[JOB {job_id}] ElevenLabs done in {time.monotonic()-t0:.1f}s | {path} {total_bytes} bytes")
    return path


async def generate_narration(job_id: str, text: str, language: str) -> str:
    return await asyncio.to_thread(_generate_sync, job_id, text, language)
