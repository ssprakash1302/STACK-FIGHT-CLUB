import { AGENT_COLORS, initialsFromLabel } from '../utils/agentMeta'

export default function AgentBubble({ message }) {
  const { agent_id, agent_label, agent_color, content, round, flagged_by_devil } = message
  const color = agent_color || AGENT_COLORS[agent_id] || '#888780'
  const isDevil = agent_id === 'devils_advocate'

  return (
    <div
      className={`rounded-lg border border-[rgba(255,255,255,0.08)] p-3 pl-4 ${
        isDevil ? 'bg-[#1a0d12]' : 'bg-surface'
      }`}
      style={{ borderLeftWidth: 3, borderLeftColor: color, borderLeftStyle: 'solid' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {initialsFromLabel(agent_label)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-primary" style={{ color: isDevil ? '#e8b4c8' : undefined }}>
              {agent_label}
            </span>
            <span className="text-xs text-muted">· {round?.replace(/_/g, ' ')}</span>
            {flagged_by_devil ? (
              <span className="rounded bg-[#993556]/25 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#e8a0b8]">
                challenged
              </span>
            ) : null}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-secondary [&_strong]:text-primary">
            {content.split('**').map((chunk, i) =>
              i % 2 === 1 ? (
                <strong key={i}>{chunk}</strong>
              ) : (
                <span key={i}>{chunk}</span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
