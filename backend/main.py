import os
import sys
import time
import traceback
import uuid
import asyncio
from contextlib import asynccontextmanager


def log(msg: str):
    print(msg, file=sys.stderr, flush=True)

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, Form, BackgroundTasks, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from db import init_db, create_job, get_job, update_job
from video_gen import generate_video
from tts import generate_narration
from script_gen import generate_narration_script
from templates import TEMPLATES

DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("audio", exist_ok=True)
    log(f"[SERVER] Ready — templates loaded: {list(TEMPLATES.keys())}")
    yield


app = FastAPI(title="AI Story Video Bot", lifespan=lifespan)

app.mount("/audio", StaticFiles(directory="audio"), name="audio")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/templates")
async def list_templates():
    return [
        {
            "id": t["id"],
            "name": t["name"],
            "description": t["description"],
            "thumbnail_emoji": t["thumbnail_emoji"],
        }
        for t in TEMPLATES.values()
    ]


@app.post("/jobs")
async def create_job_endpoint(
    background_tasks: BackgroundTasks,
    photo: UploadFile,
    story_id: str = Form(...),
    language: str = Form(...),
    custom_prompt: str = Form(None),
    custom_tone: str = Form(None),
    custom_script: str = Form(None),
    custom_duration: int = Form(10),
):
    if story_id != "custom" and story_id not in TEMPLATES:
        raise HTTPException(status_code=400, detail=f"Unknown story_id: {story_id}")
    if story_id == "custom":
        if not custom_prompt or not custom_prompt.strip():
            raise HTTPException(status_code=400, detail="custom_prompt is required for custom stories")
        if custom_duration not in (5, 10):
            raise HTTPException(status_code=400, detail="duration must be 5 or 10")
    if language not in ("en", "ar"):
        raise HTTPException(status_code=400, detail="language must be 'en' or 'ar'")
    if not photo.content_type or not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    content = await photo.read()
    job_id = str(uuid.uuid4())
    ext = os.path.splitext(photo.filename or "photo.jpg")[1] or ".jpg"
    photo_path = f"uploads/{job_id}{ext}"

    with open(photo_path, "wb") as f:
        f.write(content)

    duration = custom_duration if story_id == "custom" else TEMPLATES[story_id]["duration"]

    log(f"[JOB {job_id}] Created | story={story_id} lang={language} duration={duration}s photo={photo.filename} size={len(content)} bytes")
    if story_id == "custom":
        log(f"[JOB {job_id}] prompt: {custom_prompt}")
        if custom_tone:
            log(f"[JOB {job_id}] tone: {custom_tone}")
        if custom_script:
            log(f"[JOB {job_id}] verbatim script ({len(custom_script.split())} words): {custom_script}")

    create_job(job_id, story_id, language, photo_path)
    background_tasks.add_task(
        _run_pipeline, job_id, story_id, language, photo_path,
        custom_prompt, custom_tone, custom_script, duration,
    )

    return {"job_id": job_id}


@app.get("/jobs/{job_id}")
async def get_job_endpoint(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# ── Pipeline ──────────────────────────────────────────────────────────────────

async def _run_pipeline(
    job_id: str,
    story_id: str,
    language: str,
    photo_path: str,
    custom_prompt: str = None,
    custom_tone: str = None,
    custom_script: str = None,
    duration: int = 10,
):
    pipeline_start = time.monotonic()

    _MOTION_SUFFIX = (
        ", camera gently pulling back to reveal the scene, "
        "everything slowly coming to life from stillness, cinematic"
    )

    if story_id == "custom":
        video_prompt = custom_prompt.strip().rstrip(".,") + _MOTION_SUFFIX
        if custom_script and custom_script.strip():
            narration_script = custom_script.strip()
            log(f"[JOB {job_id}] Using verbatim script ({len(narration_script)} chars)")
        else:
            log(f"[JOB {job_id}] Generating script via Ollama | tone={custom_tone!r}")
            narration_script = await generate_narration_script(video_prompt, custom_tone or "", language, duration)
            log(f"[JOB {job_id}] Script generated: {narration_script[:120]}")
    else:
        template = TEMPLATES[story_id]
        video_prompt = template["prompt"]
        narration_script = template[f"script_{language}"]
        log(f"[JOB {job_id}] Template prompt: {video_prompt}")
        log(f"[JOB {job_id}] Template narration ({language}, {len(narration_script.split())} words): {narration_script}")

    try:
        t0 = time.monotonic()
        log(f"[JOB {job_id}] Step 1/2 — Video generation starting | duration={duration}s prompt: {video_prompt[:80]}")
        update_job(job_id, status="PROCESSING", message="Generating your story video with AI… (1–3 min)")

        video_url = await generate_video(photo_path, video_prompt, duration)
        log(f"[JOB {job_id}] Step 1/2 — Video ready in {time.monotonic()-t0:.1f}s | url={video_url}")

        t1 = time.monotonic()
        log(f"[JOB {job_id}] Step 2/2 — ElevenLabs starting | lang={language} chars={len(narration_script)}")
        update_job(job_id, status="NARRATION", message="Adding voice narration…")

        await generate_narration(job_id, narration_script, language)
        log(f"[JOB {job_id}] Step 2/2 — Narration done in {time.monotonic()-t1:.1f}s")

        audio_url = f"/audio/{job_id}.mp3"
        log(f"[JOB {job_id}] COMPLETED in {time.monotonic()-pipeline_start:.1f}s total")

        update_job(
            job_id,
            status="COMPLETED",
            message="Your story video is ready!",
            video_url=video_url,
            audio_url=audio_url,
        )

    except Exception as exc:
        elapsed = time.monotonic() - pipeline_start
        log(f"[JOB {job_id}] FAILED after {elapsed:.1f}s:\n{traceback.format_exc()}")
        msg = str(exc).strip() or f"{type(exc).__name__} (no details)"
        update_job(job_id, status="FAILED", message=msg)


# ── Frontend static files (must be last) ──────────────────────────────────────

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    file = os.path.join(DIST, full_path)
    if full_path and os.path.isfile(file):
        return FileResponse(file)
    return FileResponse(os.path.join(DIST, "index.html"))
