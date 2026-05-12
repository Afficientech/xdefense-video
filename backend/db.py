import sqlite3
from datetime import datetime, timezone

DB_PATH = "jobs.db"


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _conn() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id          TEXT PRIMARY KEY,
                status      TEXT    NOT NULL DEFAULT 'PENDING',
                message     TEXT    NOT NULL DEFAULT '',
                story_id    TEXT    NOT NULL,
                language    TEXT    NOT NULL,
                photo_path  TEXT    NOT NULL,
                video_url   TEXT    NOT NULL DEFAULT '',
                audio_url   TEXT    NOT NULL DEFAULT '',
                created_at  TEXT    NOT NULL,
                updated_at  TEXT    NOT NULL
            )
        """)


def _now():
    return datetime.now(timezone.utc).isoformat()


def create_job(job_id: str, story_id: str, language: str, photo_path: str):
    now = _now()
    with _conn() as c:
        c.execute(
            "INSERT INTO jobs VALUES (?,?,?,?,?,?,?,?,?,?)",
            (job_id, "PENDING", "Job queued", story_id, language, photo_path, "", "", now, now),
        )


def get_job(job_id: str) -> dict | None:
    with _conn() as c:
        row = c.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
        return dict(row) if row else None


def update_job(job_id: str, **fields):
    fields["updated_at"] = _now()
    set_clause = ", ".join(f"{k}=?" for k in fields)
    values = list(fields.values()) + [job_id]
    with _conn() as c:
        c.execute(f"UPDATE jobs SET {set_clause} WHERE id=?", values)
