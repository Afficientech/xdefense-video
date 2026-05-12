# Storyling — AI Story Video Bot

Upload a photo of a child and get back a short animated story video with an AI-generated narration, voiced in English or Arabic.

## How it works

1. **Upload** — user selects a photo and picks a story template (or writes a custom prompt)
2. **Script** — for custom stories, Ollama generates a narration script; templates use pre-written scripts
3. **Video** — the photo + prompt are sent to the Higgsfield AI CLI, which returns a 5–10 s animated clip
4. **Narration** — ElevenLabs converts the script to speech (EN or AR) and saves it as an MP3
5. **Playback** — the frontend plays the video and audio together; both are available to download

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Backend | FastAPI (Python 3.11+) |
| Database | SQLite (single file, via `db.py`) |
| Video generation | Higgsfield AI CLI (`higgsfield`) |
| Text-to-speech | ElevenLabs SDK (`elevenlabs`) |
| Script generation | Ollama HTTP API (llama3.2, local) |

---

## Project structure

```
xdefense-video/
├── backend/
│   ├── main.py          # FastAPI app, routes, pipeline orchestration
│   ├── db.py            # SQLite job CRUD
│   ├── video_gen.py     # Higgsfield CLI wrapper (async)
│   ├── tts.py           # ElevenLabs TTS wrapper (async)
│   ├── script_gen.py    # Ollama script generation + fallback
│   ├── templates.py     # Built-in story templates (prompts + scripts)
│   ├── .env             # Secret keys (not committed)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx          # Root component and page-level state machine
    │   ├── App.css          # Component styles
    │   ├── index.css        # Design tokens and global reset
    │   └── components/
    │       ├── Upload.jsx       # Step 1 — photo upload
    │       ├── StoryPicker.jsx  # Step 2 — template / custom story
    │       ├── StatusPoller.jsx # Step 3 — job progress polling
    │       └── VideoPlayer.jsx  # Step 4 — playback and download
    ├── public/
    │   └── assets/
    │       ├── favicon.svg
    │       ├── logo-mark.svg
    │       ├── logo-wordmark.svg
    │       └── icons.svg
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- [`higgsfield` CLI](https://higgsfield.ai) installed and authenticated
- [ElevenLabs](https://elevenlabs.io) account with at least two voices cloned (one EN, one AR)
- [Ollama](https://ollama.ai) running locally with `llama3.2` pulled (optional — used only for custom story script generation; templates work without it)

---

## Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
ELEVENLABS_API_KEY=your_key_here
VOICE_EN=voice_id_for_english
VOICE_AR=voice_id_for_arabic
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

---

## Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

---

## Running

### Option A — FastAPI serves everything (production-like)

```bash
cd frontend && npm run build
cd ../backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000`.

> **Do not use `--reload`** — it spawns a subprocess chain on Windows that silently drops background task logs.

### Option B — Separate dev servers (hot-reload frontend)

Terminal 1:
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Terminal 2:
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`.

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ELEVENLABS_API_KEY` | Yes | — | ElevenLabs API key |
| `VOICE_EN` | Yes | — | ElevenLabs voice ID for English narration |
| `VOICE_AR` | Yes | — | ElevenLabs voice ID for Arabic narration |
| `OLLAMA_URL` | No | `http://localhost:11434` | Ollama base URL |
| `OLLAMA_MODEL` | No | `llama3.2` | Ollama model for script generation |
| `VITE_API_URL` | Yes (frontend) | — | Backend URL, used by the React app at build time |

---

## Job lifecycle

```
PENDING → PROCESSING → NARRATION → COMPLETED
                    ↘               ↘
                     FAILED          FAILED
```

| Status | Meaning |
|---|---|
| `PENDING` | Job created, pipeline not started yet |
| `PROCESSING` | Higgsfield video generation in progress |
| `NARRATION` | ElevenLabs TTS in progress |
| `COMPLETED` | Both `video_url` and `audio_url` are set |
| `FAILED` | `message` field contains the error |

---

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/templates` | List all built-in story templates |
| `POST` | `/jobs` | Create a job (multipart form, see below) |
| `GET` | `/jobs/{job_id}` | Poll job status and retrieve result URLs |

### POST /jobs — form fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `photo` | file | Yes | Any image format |
| `story_id` | string | Yes | Template ID or `"custom"` |
| `language` | string | Yes | `"en"` or `"ar"` |
| `custom_prompt` | string | If custom | Describes the scene / action for the video |
| `custom_tone` | string | No | Guides the AI script tone (e.g. "funny", "calm") |
| `custom_script` | string | No | Verbatim narration — skips Ollama entirely |
| `custom_duration` | int | No | `5` or `10` (seconds); default `10` |

---

## Story templates

| ID | Name | Duration |
|---|---|---|
| `forest` | The Enchanted Forest | 10 s |
| `space` | Space Explorer | 10 s |
| `ocean` | Ocean Adventure | 10 s |

Each template includes a pre-written narration script in both English and Arabic — no Ollama or custom prompt needed.
