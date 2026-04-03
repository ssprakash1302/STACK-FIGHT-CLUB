import { AGENT_COLORS, initialsFromLabel } from '../utils/agentMeta'

const LABELS = {
  microservices_advocate: 'Microservices Advocate',
  monolith_advocate: 'Monolith Advocate',
  event_driven_advocate: 'Event-Driven Advocate',
  serverless_advocate: 'Serverless Advocate',
  constraint_validator: 'Constraint Validator',
  devils_advocate: "Devil's Advocate",
  synthesizer: 'Decision Synthesizer',
}

export default function AgentStatusBar({ activeAgent, isStreaming, isReplaying }) {
  const label = activeAgent ? LABELS[activeAgent] || activeAgent : null
  const color = activeAgent ? AGENT_COLORS[activeAgent] || '#888780' : '#555550'

  if (isReplaying) {
    return (
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-raised px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Replay</span>
          <span className="text-sm text-secondary">Replaying transcript…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] bg-raised px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Live debate</span>
        {isStreaming && activeAgent ? (
          <>
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full animate-pulse-dot"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {initialsFromLabel(label)}
              </div>
              <span className="text-sm font-medium text-primary">{label}</span>
              <span className="text-xs text-muted">speaking…</span>
            </div>
          </>
        ) : (
          <span className="text-sm text-muted">
            {isStreaming ? 'Running…' : 'Idle — start a debate or replay'}
          </span>
        )}
      </div>
    </div>
  )
}
