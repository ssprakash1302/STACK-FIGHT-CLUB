"""CRUD for debate_sessions."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Optional

from db.database import _lock, connect, init_db


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def derive_title(requirements: str, adr: Optional[dict]) -> str:
    if adr and isinstance(adr.get("title"), str) and adr["title"].strip():
        t = adr["title"].strip()
        return t[:200] if len(t) > 200 else t
    line = (requirements or "").strip().split("\n")[0].strip()
    if len(line) > 120:
        return line[:119] + "…"
    return line or "Untitled debate"


def insert_session(
    *,
    requirements: str,
    messages: list[dict],
    constraints: Optional[dict],
    adr: Optional[dict],
    status: str,
    error_message: Optional[str] = None,
) -> int:
    init_db()
    title = derive_title(requirements, adr)
    payload = (
        _now_iso(),
        title,
        status,
        requirements,
        json.dumps(constraints) if constraints is not None else None,
        json.dumps(messages),
        json.dumps(adr) if adr is not None else None,
        error_message,
    )
    with _lock:
        conn = connect()
        try:
            cur = conn.execute(
                """
                INSERT INTO debate_sessions
                (created_at, title, status, requirements, constraints_json, messages_json, adr_json, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                payload,
            )
            conn.commit()
            return int(cur.lastrowid)
        finally:
            conn.close()


def list_sessions(limit: int = 50) -> list[dict[str, Any]]:
    init_db()
    limit = max(1, min(limit, 200))
    with _lock:
        conn = connect()
        try:
            rows = conn.execute(
                """
                SELECT id, created_at, title, status,
                       substr(requirements, 1, 160) AS snippet
                FROM debate_sessions
                ORDER BY datetime(created_at) DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        finally:
            conn.close()
    out = []
    for r in rows:
        out.append(
            {
                "id": r[0],
                "created_at": r[1],
                "title": r[2],
                "status": r[3],
                "snippet": r[4],
            }
        )
    return out


def get_session(session_id: int) -> Optional[dict[str, Any]]:
    init_db()
    with _lock:
        conn = connect()
        try:
            row = conn.execute(
                """
                SELECT id, created_at, title, status, requirements,
                       constraints_json, messages_json, adr_json, error_message
                FROM debate_sessions WHERE id = ?
                """,
                (session_id,),
            ).fetchone()
        finally:
            conn.close()
    if not row:
        return None
    constraints = json.loads(row[5]) if row[5] else None
    messages = json.loads(row[6]) if row[6] else []
    adr = json.loads(row[7]) if row[7] else None
    return {
        "id": row[0],
        "created_at": row[1],
        "title": row[2],
        "status": row[3],
        "requirements": row[4],
        "constraints": constraints,
        "messages": messages,
        "adr": adr,
        "error_message": row[8],
    }


def delete_session(session_id: int) -> bool:
    init_db()
    with _lock:
        conn = connect()
        try:
            cur = conn.execute("DELETE FROM debate_sessions WHERE id = ?", (session_id,))
            conn.commit()
            return cur.rowcount > 0
        finally:
            conn.close()
