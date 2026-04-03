"""FastAPI server with SSE streaming for the debate."""

import asyncio
import json
import logging
import queue
import threading

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from graph.debate_graph import build_debate_graph

logger = logging.getLogger(__name__)

app = FastAPI(title="Architecture Decision Maker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_debate_graph()


class DebateRequest(BaseModel):
    requirements: str = Field(..., min_length=1)


def _json_dumps_event(data) -> str:
    if isinstance(data, dict):
        return json.dumps(data)
    return json.dumps(data)


@app.post("/debate/stream")
async def stream_debate(request: DebateRequest):
    initial = {
        "requirements": request.requirements,
        "messages": [],
        "current_round": "constraints",
        "architecture_scores": {},
        "stream_events": [],
    }

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
                break
            if isinstance(item, tuple) and item[0] == "__error__":
                yield {
                    "event": "error",
                    "data": json.dumps({"message": item[1]}),
                }
                break
            ev = item
            yield {
                "event": ev["type"],
                "data": _json_dumps_event(ev["data"]),
            }
            await asyncio.sleep(0.02)

        yield {"event": "done", "data": "{}"}

    return EventSourceResponse(event_generator())


@app.get("/health")
async def health():
    return {"status": "ok"}
