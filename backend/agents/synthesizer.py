"""Decision synthesizer: produces ADR JSON (Bedrock)."""

import json
import logging
import re

from models.state import ADROutput, AgentMessage, DebateRound, DebateState
from utils.llm_client import complete

logger = logging.getLogger(__name__)

SYNTH_SYSTEM = """You are the Decision Synthesizer. You read the full debate and produce a
justified Architecture Decision Record (ADR).

Your job is NOT to pick a winner based on who argued best. Your job is to apply the
validated constraints to every position and choose the architecture that best fits the
ACTUAL requirements — even if that architecture's advocate argued poorly.

Score each architecture 0-1 against: constraint compatibility, scalability fit, team fit,
operational complexity, and long-term maintainability. Put these in architecture_scores with
keys: microservices, monolith, event_driven, serverless.

Produce a complete ADR with: title, context (summary of requirements), decision (chosen arch
with justification), consequences (pros and cons of the choice), and rejected alternatives
(each with a specific reason tied to the constraints, not generic).

For mermaid_diagram: use a SINGLE LINE of text in the JSON string (use semicolons between
mermaid statements; do NOT put raw line breaks inside the JSON string — they break parsing).
Keep the diagram small (under 400 characters).

Respond ONLY with valid JSON. No preamble. No markdown fences around the JSON."""

REPAIR_SYSTEM = """You fix broken JSON. Output ONLY a single valid JSON object, no markdown,
no explanation. Preserve all meaningful content from the broken input; fix quotes, commas,
and truncation if needed. If mermaid_diagram is truncated, replace with a minimal one-line
flowchart like: flowchart LR; A[Client] --> B[API]; B --> C[DB];"""


def _extract_balanced_json(raw: str) -> str | None:
    """Find first `{`...`}` balancing braces and respecting JSON string rules (double quotes)."""
    start = raw.find("{")
    if start < 0:
        return None
    depth = 0
    i = start
    in_string = False
    escape = False
    while i < len(raw):
        c = raw[i]
        if not in_string:
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return raw[start : i + 1]
            elif c == '"':
                in_string = True
        else:
            if escape:
                escape = False
            elif c == "\\":
                escape = True
            elif c == '"':
                in_string = False
        i += 1
    return None


def _parse_json_response(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        if len(parts) >= 2:
            raw = parts[1]
            if raw.startswith("json"):
                raw = raw[4:]
    raw = raw.strip()
    last_err: Exception | None = None
    for candidate in (raw, _extract_balanced_json(raw) or ""):
        if not candidate:
            continue
        try:
            return json.loads(candidate)
        except json.JSONDecodeError as e:
            last_err = e
            continue
    if last_err:
        raise last_err
    raise ValueError("No JSON object found in model output")


def _fallback_adr(state: DebateState, reason: str) -> ADROutput:
    return ADROutput(
        title="Architecture decision (recovery)",
        status="Proposed",
        context=(state.requirements[:800] if state.requirements else "—"),
        decision=(
            "The synthesizer could not parse the model JSON output (often due to truncation "
            "or unescaped characters in the diagram field). Use a shorter debate or retry. "
            f"Details: {reason[:300]}"
        ),
        chosen_architecture="monolith",
        consequences=[
            "Recovery record — not a full model synthesis.",
            "Retry the debate or increase Bedrock max output tokens.",
        ],
        rejected_alternatives=[
            {"name": "Other patterns", "reason": "Not evaluated — synthesis parse failed."}
        ],
        confidence_score=0.15,
        mermaid_diagram="flowchart LR; U[Users] --> API[API]; API --> DB[(Data)];",
        architecture_scores={
            "microservices": 0.25,
            "monolith": 0.35,
            "event_driven": 0.2,
            "serverless": 0.2,
        },
    )


def run_synthesizer(state: DebateState) -> tuple[AgentMessage, ADROutput]:
    transcript = "\n\n".join(
        [f"[{m.agent_label} - Round {m.round}]: {m.content}" for m in state.messages]
    )
    constraints_json = (
        state.constraints.model_dump_json(indent=2)
        if state.constraints
        else "None extracted"
    )

    user = f"""FULL DEBATE TRANSCRIPT:
{transcript}

VALIDATED CONSTRAINTS:
{constraints_json}

Produce the ADR as JSON with keys:
- title (string)
- status ("Accepted")
- context (string, 2-3 sentences)
- decision (string, 3-4 sentences explaining the choice)
- chosen_architecture (string: one of microservices/monolith/event_driven/serverless/hybrid)
- consequences (list of strings, mix of positive and negative)
- rejected_alternatives (list of objects with "name" and "reason" keys)
- confidence_score (float 0-1)
- architecture_scores (object with keys microservices, monolith, event_driven, serverless and float values 0-1)
- mermaid_diagram (ONE LINE string, semicolon-separated mermaid; no raw newlines inside the JSON string)

Keep the entire JSON under ~8k characters if possible."""

    text = complete(SYNTH_SYSTEM, user, max_tokens=8192)
    adr: ADROutput | None = None
    try:
        data = _parse_json_response(text)
        if "architecture_scores" not in data:
            data["architecture_scores"] = {}
        adr = ADROutput(**data)
    except Exception as first_err:
        logger.warning("Synthesizer JSON parse failed, attempting repair: %s", first_err)
        try:
            repair_in = text[:24000]
            repaired = complete(
                REPAIR_SYSTEM,
                f"Parse error: {first_err}\n\nBroken output:\n{repair_in}",
                max_tokens=4096,
            )
            data = _parse_json_response(repaired)
            if "architecture_scores" not in data:
                data["architecture_scores"] = {}
            adr = ADROutput(**data)
        except Exception as repair_err:
            logger.exception("Synthesizer repair failed: %s", repair_err)
            adr = _fallback_adr(state, f"{first_err}; repair: {repair_err}")

    message = AgentMessage(
        agent_id="synthesizer",
        agent_label="Decision Synthesizer",
        agent_color="#444441",
        round=DebateRound.SYNTHESIS,
        content=(
            f"Decision reached: **{adr.chosen_architecture.title()}** architecture. "
            f"Confidence: {round(adr.confidence_score * 100)}%. See ADR panel for full justification."
        ),
        score=adr.confidence_score,
    )

    return message, adr
