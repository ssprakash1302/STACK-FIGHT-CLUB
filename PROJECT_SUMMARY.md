# Project summary — client conversation guide

**Purpose of this document:** A short, non-technical briefing you can use with stakeholders or clients to explain *what this repository is for*, *why it exists*, and *what they get out of it*.

---

## The problem

Teams often struggle to compare architecture options in a structured way. Discussions can drift toward habit (“we always use microservices”) or single-expert bias, and the rationale behind a choice is rarely captured in a reusable form. Early-phase requirements are also messy: constraints (team size, compliance, latency, budget signals) are easy to miss when jumping straight to a diagram.

## What this project does

This application is an **architecture decision workshop in software form**. The user describes **system requirements in natural language**. The system then:

1. **Surfaces constraints** — Highlights facts and “hard blockers” that might rule out certain approaches.
2. **Stages a structured debate** — Four fixed perspectives argue in favor of different high-level styles (microservices, monolith, event-driven, serverless), so no single style is assumed up front.
3. **Stress-tests arguments** — A separate critic role attacks weaknesses across all sides, reducing blind spots.
4. **Delivers a synthesized decision** — Outputs a **draft Architecture Decision Record (ADR)**–style result: recommended direction, tradeoffs, rejected alternatives, and scores—tied back to **requirements and constraints**, not to “who won the debate.”

The UI streams the debate so stakeholders can follow the reasoning as it unfolds.

## Value for a client or organization

| Benefit | Explanation |
|--------|-------------|
| **Structured comparison** | Forces explicit comparison of major architectural styles against the same requirements. |
| **Constraint-first thinking** | Encourages validating assumptions (scale, compliance, team, ops) before committing. |
| **Documented rationale** | Produces ADR-oriented content suitable for internal review, onboarding, or governance checkpoints. |
| **Faster alignment** | Useful in discovery workshops, proposal phases, or internal “option A vs B” conversations. |

## What this is *not*

- **Not a substitute** for architects, security reviews, or your organization’s reference architectures.
- **Not infallible** — LLM outputs can be wrong or overly generic; output should be **reviewed and adapted** by qualified people.
- **Not a deployment blueprint** — It focuses on high-level architectural *style* and rationale, not detailed infrastructure or vendor choices unless you reflect those in the requirements.

## Typical use cases

- **Early project or product discovery** — Compare directions before heavy investment.
- **Training and discussion** — Make tradeoffs visible to mixed technical and business audiences.
- **Drafting decision records** — Use the ADR output as a starting point for formal documentation.

## Suggested one-minute pitch

> “We feed in plain-language requirements. The tool extracts constraints, runs a multi-perspective debate between architectural styles, challenges weak arguments, and produces a structured recommendation with a draft ADR. It’s meant to improve alignment and documentation—not to replace your architects.”

---

*For setup, tech stack, and run instructions, see `README.md`.*
