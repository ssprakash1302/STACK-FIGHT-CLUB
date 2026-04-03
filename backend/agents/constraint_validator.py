"""Constraint extraction from requirements (Bedrock)."""

import json
import re

from models.state import AgentMessage, DebateRound, ExtractedConstraints
from utils.llm_client import complete

CONSTRAINT_SYSTEM = """You are the Constraint Validator. You have NO architectural preference.
Your ONLY job is to extract hard constraints from the requirements and identify which constraints
would DISQUALIFY certain architectures entirely.

Extract: team size, budget signals, latency SLAs, compliance requirements (GDPR, HIPAA, SOC2),
existing infrastructure lock-in, expected traffic patterns, and any explicit hard blockers.

Hard blockers are constraints that would make an architecture genuinely unsuitable — not just
suboptimal. For example: "2-person team" is a hard blocker for complex microservices.
"Must process 1M events/sec" may be a hard blocker for synchronous monolith.

Respond ONLY with valid JSON matching this schema exactly. No preamble, no explanation."""


def _scalar_to_str(value) -> str:
    """Coerce model output (int, dict, list, etc.) into a display string."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def _normalize_constraints_payload(data: dict) -> dict:
    """LLMs often return nested JSON or numbers; our schema uses strings + string lists."""
    out = dict(data)
    for key in ("team_size", "budget", "latency_sla", "existing_infra", "traffic_expectation"):
        if key not in out or out[key] is None:
            continue
        coerced = _scalar_to_str(out[key]).strip()
        out[key] = coerced if coerced else None

    comp = out.get("compliance")
    if comp is None:
        out["compliance"] = []
    elif not isinstance(comp, list):
        out["compliance"] = [_scalar_to_str(comp)]
    else:
        out["compliance"] = [_scalar_to_str(x) for x in comp if x is not None]

    blockers = out.get("hard_blockers")
    if blockers is None:
        out["hard_blockers"] = []
    elif not isinstance(blockers, list):
        out["hard_blockers"] = [_scalar_to_str(blockers)]
    else:
        out["hard_blockers"] = [_scalar_to_str(x) for x in blockers if x is not None]

    return out


def _parse_json_response(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        if len(parts) >= 2:
            raw = parts[1]
            if raw.startswith("json"):
                raw = raw[4:]
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", raw)
        if m:
            return json.loads(m.group(0))
        raise


def run_constraint_validator(requirements: str) -> tuple[AgentMessage, ExtractedConstraints]:
    user = f"""Extract constraints from these requirements and return JSON:

{requirements}

Return JSON with keys: team_size, budget, latency_sla, compliance (list of strings),
existing_infra, traffic_expectation, hard_blockers (list of strings explaining why
certain architectures are disqualified). Use plain strings for team_size, budget,
latency_sla, existing_infra, and traffic_expectation (not nested objects). All fields
optional except hard_blockers."""

    text = complete(CONSTRAINT_SYSTEM, user, max_tokens=600)
    data = _parse_json_response(text)
    if "hard_blockers" not in data:
        data["hard_blockers"] = []
    data = _normalize_constraints_payload(data)
    constraints = ExtractedConstraints(**data)

    blockers = (
        ", ".join(constraints.hard_blockers)
        if constraints.hard_blockers
        else "None — all architectures eligible."
    )
    message = AgentMessage(
        agent_id="constraint_validator",
        agent_label="Constraint Validator",
        agent_color="#BA7517",
        round=DebateRound.CONSTRAINTS,
        content=f"Constraints extracted. Hard blockers identified: {blockers}",
    )

    return message, constraints
