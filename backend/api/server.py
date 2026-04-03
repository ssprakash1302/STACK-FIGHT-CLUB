"""FastAPI server with SSE streaming for the debate and SQLite session history."""

import asyncio
import json
import logging
import queue
import threading
from contextlib import asynccontextmanager
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from db.database import get_db_path, init_db
from db.sessions_repo import delete_session, get_session, insert_session, list_sessions
from graph.debate_graph import build_debate_graph

load_dotenv()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("SQLite sessions DB: %s", get_db_path())
    yield


app = FastAPI(title="Architecture Decision Maker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_debate_graph()


class DebateRequest(BaseModel):
    requirements: str = Field(..., min_length=1)


class SessionCreate(BaseModel):
    """Client-side save (e.g. after stopping the stream mid-flight)."""

    requirements: str = ""
    messages: list[dict[str, Any]] = Field(default_factory=list)
    constraints: Optional[dict[str, Any]] = None
    adr: Optional[dict[str, Any]] = None
    status: str = "partial"
    error_message: Optional[str] = None


def _json_dumps_event(data) -> str:
    if isinstance(data, dict):
        return json.dumps(data)
    return json.dumps(data)


def _persist_async(**kwargs):
    """Run SQLite insert in a thread pool."""
    return insert_session(**kwargs)


async def _maybe_save_session(
    *,
    requirements: str,
    accumulated: dict[str, Any],
    status: str,
    error_message: Optional[str] = None,
) -> None:
    if not accumulated["messages"] and not accumulated["constraints"] and not accumulated["adr"]:
        return
    try:
        await asyncio.to_thread(
            _persist_async,
            requirements=requirements,
            messages=accumulated["messages"],
            constraints=accumulated["constraints"],
            adr=accumulated["adr"],
            status=status,
            error_message=error_message,
        )
    except Exception:
        logger.exception("Failed to persist debate session")


@app.post("/debate/stream")
async def stream_debate(request: DebateRequest):
    initial = {
        "requirements": request.requirements,
        "messages": [],
        "current_round": "constraints",
        "architecture_scores": {},
        "stream_events": [],
    }

    accumulated: dict[str, Any] = {"messages": [], "constraints": None, "adr": None}

    async def event_generator():
        q: queue.Queue = queue.Queue(maxsize=500)
        sentinel = object()

        def run_graph():
            try:
                prev_len = 0
                for state in graph.stream(initial, stream_mode="values"):
                    events = state.get("stream_events") or []
                    for ev in events[prev_len:]:
                        q.put(ev)
                    prev_len = len(events)
                q.put(sentinel)
            except Exception as e:
                logger.exception("Debate graph failed")
                q.put(("__error__", str(e)))

        threading.Thread(target=run_graph, daemon=True).start()

        while True:
            item = await asyncio.to_thread(q.get)
            if item is sentinel:
                st = "complete" if accumulated["adr"] else "partial"
                await _maybe_save_session(
                    requirements=request.requirements,
                    accumulated=accumulated,
                    status=st,
                    error_message=None,
                )
                break
            if isinstance(item, tuple) and item[0] == "__error__":
                await _maybe_save_session(
                    requirements=request.requirements,
                    accumulated=accumulated,
                    status="error",
                    error_message=item[1],
                )
                yield {
                    "event": "error",
                    "data": json.dumps({"message": item[1]}),
                }
                break
            ev = item
            et = ev.get("type")
            data = ev.get("data")
            if et == "message" and isinstance(data, dict):
                accumulated["messages"].append(data)
            elif et == "constraints" and isinstance(data, dict):
                accumulated["constraints"] = data
            elif et == "adr" and isinstance(data, dict):
                accumulated["adr"] = data
            yield {
                "event": et,
                "data": _json_dumps_event(data),
            }
            await asyncio.sleep(0.02)

        yield {"event": "done", "data": "{}"}

    return EventSourceResponse(event_generator())


@app.post("/sessions", status_code=201)
async def create_session(body: SessionCreate):
    """Save a session from the client (partial runs, manual backup)."""
    sid = await asyncio.to_thread(
        insert_session,
        requirements=body.requirements,
        messages=body.messages,
        constraints=body.constraints,
        adr=body.adr,
        status=body.status,
        error_message=body.error_message,
    )
    return {"id": sid, "created": True}


@app.get("/sessions")
async def sessions_list(limit: int = 50):
    rows = await asyncio.to_thread(list_sessions, limit)
    return rows


@app.get("/sessions/{session_id}")
async def sessions_get(session_id: int):
    row = await asyncio.to_thread(get_session, session_id)
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return row


@app.delete("/sessions/{session_id}")
async def sessions_delete(session_id: int):
    ok = await asyncio.to_thread(delete_session, session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True, "id": session_id}


@app.get("/health")
async def health():
    return {"status": "ok", "db": str(get_db_path())}
