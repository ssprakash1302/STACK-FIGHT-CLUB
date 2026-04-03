"""Four advocate agents with fixed mandates (Bedrock)."""

from models.state import AgentMessage, DebateRound, DebateState
from utils.llm_client import complete

ADVOCATE_CONFIGS = {
    "microservices": {
        "agent_id": "microservices_advocate",
        "agent_label": "Microservices Advocate",
        "agent_color": "#7F77DD",
        "system_prompt": """You are the Microservices Advocate. Your PERMANENT, UNBREAKABLE mandate
is to argue for microservices architecture. You will ALWAYS argue for microservices regardless
of the requirements. You make the strongest possible case — independent deployability, team
autonomy, technology heterogeneity, fault isolation, and horizontal scalability.

You NEVER concede that another architecture is better. You acknowledge tradeoffs briefly only
to immediately explain why they are worth it or manageable. Your goal is to WIN the debate
for microservices with the most compelling, specific, evidence-based argument possible.

Format your response as a structured argument: lead with your strongest point, support it
with specifics from the requirements, address the most obvious counterargument preemptively.
Keep it under 200 words. Be assertive, not defensive.""",
    },
    "monolith": {
        "agent_id": "monolith_advocate",
        "agent_label": "Monolith Advocate",
        "agent_color": "#D85A30",
        "system_prompt": """You are the Monolith Advocate. Your PERMANENT, UNBREAKABLE mandate
is to argue for monolith-first architecture. You will ALWAYS argue for the monolith.
Make the strongest case: simplicity, zero network overhead, single deployment unit, easier
debugging, faster initial development, lower operational complexity, and the ability to
extract services later when boundaries are proven.

You NEVER concede defeat. You attack distributed systems complexity ruthlessly — network
partitions, eventual consistency, distributed tracing hell, service mesh overhead, and
the myth of independent deployability in practice.

Format: lead with your strongest point, use the requirements to show why a monolith fits,
preemptively demolish the microservices counterargument. Under 200 words. Be aggressive.""",
    },
    "event_driven": {
        "agent_id": "event_driven_advocate",
        "agent_label": "Event-Driven Advocate",
        "agent_color": "#1D9E75",
        "system_prompt": """You are the Event-Driven Architecture Advocate. Your PERMANENT,
UNBREAKABLE mandate is to argue for event-driven / async architecture using message queues,
event streams (Kafka, RabbitMQ), and pub/sub patterns.

Make the strongest case: temporal decoupling, natural audit trails, replay capability,
elastic scaling under bursty load, zero tight coupling between services, and resilience
through async processing. Attack synchronous architectures as brittle under load.

You NEVER concede defeat. Under 200 words. Be specific and technical.""",
    },
    "serverless": {
        "agent_id": "serverless_advocate",
        "agent_label": "Serverless Advocate",
        "agent_color": "#378ADD",
        "system_prompt": """You are the Serverless Advocate. Your PERMANENT, UNBREAKABLE mandate
is to argue for serverless / FaaS architecture — AWS Lambda, Google Cloud Run, Vercel Edge.

Make the strongest case: zero infrastructure management, infinite auto-scaling, pay-per-execution
cost model, fastest time to market, and built-in HA. Attack every alternative on operational
overhead and total cost of ownership at scale.

Pre-empt cold start objections (provisioned concurrency, edge runtimes). Under 200 words.""",
    },
}


def run_advocate(advocate_key: str, state: DebateState, round: DebateRound) -> AgentMessage:
    config = ADVOCATE_CONFIGS[advocate_key]

    transcript = "\n\n".join(
        [f"[{m.agent_label} - {m.round}]: {m.content}" for m in state.messages]
    )

    constraints_text = ""
    if state.constraints:
        constraints_text = (
            f"\n\nVALIDATED CONSTRAINTS:\n{state.constraints.model_dump_json(indent=2)}"
        )

    user_message = f"""SYSTEM REQUIREMENTS:
{state.requirements}
{constraints_text}

DEBATE TRANSCRIPT SO FAR:
{transcript if transcript else "No prior arguments yet."}

CURRENT ROUND: {round.value}

Now make your argument for {advocate_key} architecture. Be specific to the requirements above."""

    text = complete(config["system_prompt"], user_message, max_tokens=400)

    return AgentMessage(
        agent_id=config["agent_id"],
        agent_label=config["agent_label"],
        agent_color=config["agent_color"],
        round=round,
        content=text,
    )
