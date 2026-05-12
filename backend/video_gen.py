import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
import time

_HF = shutil.which("higgsfield") or shutil.which("higgsfield.cmd") or "higgsfield"


def _log(msg: str):
    print(msg, file=sys.stderr, flush=True)


def _run_sync(*args: str, timeout: int = 600) -> str:
    cmd = [_HF, *args]
    _log(f"[HF] CLI » {' '.join(cmd)}")
    t0 = time.monotonic()
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    elapsed = time.monotonic() - t0
    if result.returncode != 0:
        _log(f"[HF] FAILED in {elapsed:.1f}s (exit {result.returncode})")
        _log(f"[HF] stdout: {result.stdout.strip()}")
        _log(f"[HF] stderr: {result.stderr.strip()}")
        err_detail = result.stderr.strip() or result.stdout.strip() or "(no output — CLI crashed)"
        raise RuntimeError(f"higgsfield command failed (exit {result.returncode}): {err_detail}")
    _log(f"[HF] Done in {elapsed:.1f}s | stdout: {result.stdout.strip()[:300]}")
    return result.stdout.strip()


async def _run(*args: str, timeout: int = 600) -> str:
    return await asyncio.to_thread(_run_sync, *args, timeout=timeout)


def _parse_json(raw: str):
    candidates = list(re.finditer(r'(\{[\s\S]*\}|\[[\s\S]*\])', raw))
    for m in reversed(candidates):
        try:
            return json.loads(m.group())
        except json.JSONDecodeError:
            continue
    raise ValueError(f"No valid JSON found in output: {raw[:300]}")


def _extract_job(data) -> dict:
    job = data[0] if isinstance(data, list) else data
    return job if isinstance(job, dict) else {}


def _assert_completed(job: dict, model: str):
    status = job.get("status", "unknown")
    if status == "failed":
        raise RuntimeError(
            f"Higgsfield {model} generation failed on their servers. "
            "Common causes: image too small/blurry, content policy, or temporary outage. "
            "Try a larger, clearer photo."
        )
    if status != "completed":
        raise RuntimeError(f"Higgsfield {model} ended with unexpected status '{status}'.")
    result_url = job.get("result_url", "")
    if not result_url:
        raise RuntimeError(f"Higgsfield {model} completed but returned no video URL.")
    return result_url


async def generate_video(photo_path: str, prompt: str, duration: int = 10) -> str:
    abs_path = os.path.abspath(photo_path)
    raw = await _run(
        "generate", "create", "kling3_0",
        "--image", abs_path,
        "--prompt", prompt,
        "--duration", str(duration),
        "--wait", "--json",
        timeout=600,
    )
    data = _parse_json(raw)
    job = _extract_job(data)

    if isinstance(job, str):
        raw2 = await _run("generate", "get", job, "--json")
        job = _parse_json(raw2)

    return _assert_completed(job, "kling3_0")


async def train_soul_id(name: str, image_paths: list[str]) -> str:
    image_args = []
    for p in image_paths:
        image_args += ["--image", p]

    raw = await _run(
        "soul-id", "create",
        "--name", name,
        "--soul-2",
        *image_args,
        "--json",
        timeout=60,
    )
    data = _parse_json(raw)
    soul_id = data.get("id") or (data[0] if isinstance(data, list) else None)
    if not soul_id:
        raise RuntimeError(f"Could not parse soul_id from: {raw[:300]}")

    await _run("soul-id", "wait", soul_id, "--json", timeout=600)
    return soul_id


async def generate_video_with_soul(soul_id: str, prompt: str) -> str:
    raw = await _run(
        "generate", "create", "soul_cast",
        "--soul-id", soul_id,
        "--prompt", prompt,
        "--wait", "--json",
        timeout=600,
    )
    data = _parse_json(raw)
    job = _extract_job(data)
    if isinstance(job, str):
        raw2 = await _run("generate", "get", job, "--json")
        job = _parse_json(raw2)
    return _assert_completed(job, "soul_cast")
