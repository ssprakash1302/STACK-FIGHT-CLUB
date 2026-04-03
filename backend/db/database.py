"""SQLite connection path and schema initialization."""

import os
import sqlite3
import threading
from pathlib import Path

_lock = threading.Lock()

DEFAULT_DB_NAME = "stack_fight_club.db"


def _project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def get_db_path() -> Path:
    raw = os.environ.get("SQLITE_PATH", "").strip()
    if raw:
        return Path(raw).expanduser().resolve()
    data_dir = _project_root() / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / DEFAULT_DB_NAME


def init_db() -> None:
    path = get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with _lock:
        conn = sqlite3.connect(str(path))
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS debate_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    created_at TEXT NOT NULL,
                    title TEXT NOT NULL,
                    status TEXT NOT NULL,
                    requirements TEXT NOT NULL,
                    constraints_json TEXT,
                    messages_json TEXT NOT NULL,
                    adr_json TEXT,
                    error_message TEXT
                )
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_debate_sessions_created ON debate_sessions (created_at DESC)"
            )
            conn.commit()
        finally:
            conn.close()


def connect() -> sqlite3.Connection:
    """Single-threaded use per connection; wrap writes with _lock in repo."""
    return sqlite3.connect(str(get_db_path()), check_same_thread=False)
