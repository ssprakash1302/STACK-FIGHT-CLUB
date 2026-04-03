import { ROUND_LABELS } from '../utils/agentMeta'

const ORDER = ['constraints', 'opening', 'cross_examination', 'rebuttal', 'synthesis']

export default function RoundDivider({ round, index }) {
  const label = ROUND_LABELS[round] || String(round || '').toUpperCase()
  const num = index >= 0 ? index + 1 : ORDER.indexOf(round) + 1
  return (
    <div className="flex items-center gap-3 py-4 select-none">
      <div className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
      <span className="text-xs font-semibold tracking-widest text-muted">
        ROUND {num} — {label}
      </span>
      <div className="h-px flex-1 bg-[rgba(255,255,255,0.08)]" />
    </div>
  )
}
