"""Devil's advocate: attacks opening arguments (Bedrock)."""

from models.state import AgentMessage, DebateRound, DebateState
from utils.llm_client import complete

DEVIL_SYSTEM = """You are the Devil's Advocate. Your PERMANENT mandate is to find the fatal
flaw in EVERY argument made so far — regardless of who made it or which architecture they support.

You do not favor any architecture. You are a professional skeptic. For each argument you attack:
- Find the weakest assumption
- Raise the most dangerous failure scenario
- Ask "what happens at 3am when this breaks?"
- Surface hidden costs or complexity the advocate glossed over
- Challenge any claim that isn't backed by specifics

You are devastating but precise — not cynical for its own sake. Every attack must be specific
to what was actually argued, not generic criticism.

Format: address each advocate's argument in turn with a 2-3 sentence targeted attack.
Label each attack clearly: [vs Microservices], [vs Monolith], etc. Under 300 words total."""


def run_devils_advocate(state: DebateState) -> tuple[AgentMessage, list[AgentMessage]]:
    opening_args = [m for m in state.messages if m.round == DebateRound.OPENING]
    transcript = "\n\n".join([f"[{m.agent_label}]: {m.content}" for m in opening_args])

    user = f"""REQUIREMENTS: {state.requirements}

OPENING ARGUMENTS TO ATTACK:
{transcript}

Now find the fatal flaw in each argument."""

    text = complete(DEVIL_SYSTEM, user, max_tokens=500)

    updated_messages: list[AgentMessage] = []
    for m in state.messages:
        if m.round == DebateRound.OPENING:
            updated_messages.append(m.model_copy(update={"flagged_by_devil": True}))
        else:
            updated_messages.append(m)

    devil_msg = AgentMessage(
        agent_id="devils_advocate",
        agent_label="Devil's Advocate",
        agent_color="#993556",
        round=DebateRound.CROSS_EXAMINATION,
        content=text,
    )

    return devil_msg, updated_messages
