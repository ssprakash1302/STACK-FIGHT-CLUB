"""Format ADR as markdown including optional mermaid block."""

from datetime import datetime, timezone

from models.state import ADROutput, AgentMessage, DebateRound


def format_adr_markdown(
    adr: ADROutput,
    transcript: list[AgentMessage],
    deciders: str = "Architecture Decision Maker",
) -> str:
    lines = [
        f"# {adr.title}",
        "",
        f"- **Date:** {datetime.now(timezone.utc).strftime('%Y-%m-%d')}",
        f"- **Status:** {adr.status}",
        f"- **Deciders:** {deciders}",
        "",
        "## Context",
        "",
        adr.context,
        "",
        "## Decision",
        "",
        adr.decision,
        "",
        f"**Chosen architecture:** {adr.chosen_architecture}",
        "",
        f"**Confidence:** {round(adr.confidence_score * 100)}%",
        "",
        "## Consequences",
        "",
    ]
    for c in adr.consequences:
        lines.append(f"- {c}")
    lines.extend(["", "## Rejected alternatives", ""])
    for alt in adr.rejected_alternatives:
        name = alt.get("name", "")
        reason = alt.get("reason", "")
        lines.append(f"- **{name}:** {reason}")
    lines.extend(["", "## Architecture diagram (Mermaid)", "", "```mermaid", adr.mermaid_diagram, "```", ""])
    if transcript:
        lines.extend(["", "## Appendix: Debate transcript", ""])
        for m in transcript:
            lines.append(
                f"- **[{m.agent_label} — {m.round.value}]** {m.content.replace(chr(10), ' ')}"
            )
    return "\n".join(lines)
