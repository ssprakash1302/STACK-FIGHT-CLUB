"""LangGraph state machine: four debate rounds + synthesis."""

from typing import Optional, TypedDict

from langgraph.graph import END, START, StateGraph

from agents.advocates import ADVOCATE_CONFIGS, run_advocate
from agents.constraint_validator import run_constraint_validator
from agents.devils_advocate import run_devils_advocate
from agents.synthesizer import run_synthesizer
from models.state import ADROutput, AgentMessage, DebateRound, DebateState, ExtractedConstraints


class DebateGraphState(TypedDict, total=False):
    """Serializable graph state (JSON-friendly)."""

    requirements: str
    constraints: Optional[dict]
    messages: list[dict]
    current_round: str
    architecture_scores: dict[str, float]
    adr: Optional[dict]
    stream_events: list[dict]


def _to_debate(state: DebateGraphState) -> DebateState:
    msgs = [AgentMessage.model_validate(m) for m in state.get("messages", [])]
    cons_raw = state.get("constraints")
    adr_raw = state.get("adr")
    return DebateState(
        requirements=state.get("requirements", ""),
        constraints=ExtractedConstraints.model_validate(cons_raw) if cons_raw else None,
        messages=msgs,
        current_round=DebateRound(state.get("current_round", "constraints")),
        architecture_scores=dict(state.get("architecture_scores", {})),
        adr=ADROutput.model_validate(adr_raw) if adr_raw else None,
        stream_events=list(state.get("stream_events", [])),
    )


def _from_debate(ds: DebateState) -> DebateGraphState:
    return DebateGraphState(
        requirements=ds.requirements,
        constraints=ds.constraints.model_dump(mode="json") if ds.constraints else None,
        messages=[m.model_dump(mode="json") for m in ds.messages],
        current_round=ds.current_round.value,
        architecture_scores=dict(ds.architecture_scores),
        adr=ds.adr.model_dump(mode="json") if ds.adr else None,
        stream_events=list(ds.stream_events),
    )


def extract_constraints_node(state: DebateGraphState) -> DebateGraphState:
    ds = _to_debate(state)
    message, constraints = run_constraint_validator(ds.requirements)
    ds.messages.append(message)
    ds.constraints = constraints
    ds.current_round = DebateRound.OPENING
    ds.stream_events.append({"type": "message", "data": message.model_dump(mode="json")})
    ds.stream_events.append({"type": "constraints", "data": constraints.model_dump(mode="json")})
    return _from_debate(ds)


def opening_arguments_node(state: DebateGraphState) -> DebateGraphState:
    ds = _to_debate(state)
    for key in ADVOCATE_CONFIGS:
        msg = run_advocate(key, ds, DebateRound.OPENING)
        ds.messages.append(msg)
        ds.stream_events.append({"type": "message", "data": msg.model_dump(mode="json")})
    ds.current_round = DebateRound.CROSS_EXAMINATION
    return _from_debate(ds)


def cross_examination_node(state: DebateGraphState) -> DebateGraphState:
    ds = _to_debate(state)
    devil_msg, updated = run_devils_advocate(ds)
    ds.messages = updated
    ds.messages.append(devil_msg)
    ds.stream_events.append({"type": "message", "data": devil_msg.model_dump(mode="json")})
    ds.current_round = DebateRound.REBUTTAL
    return _from_debate(ds)


def rebuttal_node(state: DebateGraphState) -> DebateGraphState:
    ds = _to_debate(state)
    for key in ADVOCATE_CONFIGS:
        msg = run_advocate(key, ds, DebateRound.REBUTTAL)
        ds.messages.append(msg)
        ds.stream_events.append({"type": "message", "data": msg.model_dump(mode="json")})
    ds.current_round = DebateRound.SYNTHESIS
    return _from_debate(ds)


def synthesis_node(state: DebateGraphState) -> DebateGraphState:
    ds = _to_debate(state)
    message, adr = run_synthesizer(ds)
    ds.messages.append(message)
    ds.adr = adr
    ds.architecture_scores = adr.architecture_scores
    ds.current_round = DebateRound.DONE
    ds.stream_events.append({"type": "message", "data": message.model_dump(mode="json")})
    ds.stream_events.append({"type": "adr", "data": adr.model_dump(mode="json")})
    return _from_debate(ds)


def build_debate_graph():
    graph = StateGraph(DebateGraphState)
    graph.add_node("extract_constraints", extract_constraints_node)
    graph.add_node("opening_arguments", opening_arguments_node)
    graph.add_node("cross_examination", cross_examination_node)
    graph.add_node("rebuttal", rebuttal_node)
    graph.add_node("synthesis", synthesis_node)
    graph.add_edge(START, "extract_constraints")
    graph.add_edge("extract_constraints", "opening_arguments")
    graph.add_edge("opening_arguments", "cross_examination")
    graph.add_edge("cross_examination", "rebuttal")
    graph.add_edge("rebuttal", "synthesis")
    graph.add_edge("synthesis", END)
    return graph.compile()
