"""Pydantic models for debate state, messages, constraints, and ADR output."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class DebateRound(str, Enum):
    CONSTRAINTS = "constraints"
    OPENING = "opening"
    CROSS_EXAMINATION = "cross_examination"
    REBUTTAL = "rebuttal"
    SYNTHESIS = "synthesis"
    DONE = "done"


class AgentMessage(BaseModel):
    agent_id: str
    agent_label: str
    agent_color: str
    round: DebateRound
    content: str
    score: Optional[float] = None
    flagged_by_devil: bool = False


class ExtractedConstraints(BaseModel):
    model_config = ConfigDict(extra="ignore")

    team_size: Optional[str] = None
    budget: Optional[str] = None
    latency_sla: Optional[str] = None
    compliance: list[str] = Field(default_factory=list)
    existing_infra: Optional[str] = None
    traffic_expectation: Optional[str] = None
    hard_blockers: list[str] = Field(default_factory=list)


class ADROutput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str
    status: str = "Accepted"
    context: str
    decision: str
    chosen_architecture: str
    consequences: list[str]
    rejected_alternatives: list[dict]
    confidence_score: float
    mermaid_diagram: str
    architecture_scores: dict[str, float] = Field(default_factory=dict)


class DebateState(BaseModel):
    requirements: str = ""
    constraints: Optional[ExtractedConstraints] = None
    messages: list[AgentMessage] = Field(default_factory=list)
    current_round: DebateRound = DebateRound.CONSTRAINTS
    architecture_scores: dict[str, float] = Field(default_factory=dict)
    adr: Optional[ADROutput] = None
    stream_events: list[dict] = Field(default_factory=list)
