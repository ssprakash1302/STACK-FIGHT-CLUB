# Stack Fight Club

*Multi-agent architecture debate → draft ADR.*

A small full-stack app that turns **plain-language system requirements** into a **structured architecture debate** and a **draft Architecture Decision Record (ADR)**. Specialized LLM agents argue fixed positions, stress-test assumptions, and a synthesizer produces a justified recommendation.

## Repository layout

| Path | Purpose |
|------|---------|
| `backend/` | FastAPI API, LangGraph debate flow, AWS Bedrock LLM calls |
| `frontend/` | React + Vite + Tailwind UI; streams debate events over SSE |

## Prerequisites

- **Python 3.10+** (recommended)
- **Node.js 18+** (for the frontend)
- **AWS account** with access to **Amazon Bedrock** and a configured model (see `backend/.env.example`)
- AWS credentials available to the SDK (environment variables, `~/.aws/credentials`, or IAM role)

## Backend setup

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set AWS_REGION, BEDROCK_MODEL_ID, and credentials if needed
```

Run the API **from the `backend/` directory** so imports resolve:

```bash
uvicorn api.server:app --reload --host 127.0.0.1 --port 8000
```

- Health/docs: OpenAPI at `http://127.0.0.1:8000/docs`
- Main endpoint: `POST /debate/stream` — Server-Sent Events (SSE) stream of debate messages and final ADR payload

### Session history (SQLite)

Completed debates are persisted automatically. Stopped (partial) runs are saved when you use **Stop debate**. The database file defaults to `backend/data/stack_fight_club.db` (gitignored). Set **`SQLITE_PATH`** in `.env` to use another path. REST: `GET /sessions`, `GET /sessions/{id}`, `POST /sessions`, `DELETE /sessions/{id}` — the UI lists and restores sessions under **Saved sessions** in the left panel.

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # optional; defaults to backend at http://127.0.0.1:8000
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`). Ensure the backend is running and CORS allows your origin (`http://localhost:5173` is configured in `backend/api/server.py`).

## Configuration notes

- **`BEDROCK_MODEL_ID`**: Must match a model enabled for your account in the chosen `AWS_REGION` (see AWS Bedrock console).
- **Port conflicts**: If port `8000` is in use, run uvicorn on another port and set `VITE_BACKEND_URL` in `frontend/.env` to match.

## What the system does (high level)

1. **Constraint extraction** — Pulls structured constraints and hard blockers from requirements.
2. **Opening & rebuttal** — Four advocates (microservices, monolith, event-driven, serverless) argue in turn.
3. **Cross-examination** — A devil’s-advocate agent challenges weak points across positions.
4. **Synthesis** — Produces scores, a recommended architecture aligned to constraints, and ADR-style output (including optional Mermaid diagram text).

For a **client-facing narrative** (value proposition and use cases), see **`PROJECT_SUMMARY.md`**.

## License / disclaimer

This tool produces **draft** architectural guidance for discussion; it does not replace human review, security assessment, or organizational standards. Validate all decisions before production use.
