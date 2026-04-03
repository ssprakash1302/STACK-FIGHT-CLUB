import { motion } from 'framer-motion'
import { AGENT_COLORS, initialsFromLabel } from '../utils/agentMeta'

export default function AgentBubble({ message, index = 0 }) {
  const { agent_id, agent_label, agent_color, content, round, flagged_by_devil } = message
  const color = agent_color || AGENT_COLORS[agent_id] || '#888780'
  const isDevil = agent_id === 'devils_advocate'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 28,
        delay: Math.min(index * 0.02, 0.15),
      }}
      whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
      className={`group rounded-xl border border-border p-3 pl-4 shadow-inset transition-shadow hover:shadow-glow-sm ${
        isDevil ? 'bg-[#120a10]' : 'bg-surface/90 backdrop-blur-sm'
      }`}
      style={{ borderLeftWidth: 3, borderLeftColor: color, borderLeftStyle: 'solid' }}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg"
          style={{
            backgroundColor: color,
            boxShadow: `0 4px 20px -4px ${color}66`,
          }}
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          {initialsFromLabel(agent_label)}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className="font-semibold text-primary"
              style={{ color: isDevil ? '#e8b4c8' : undefined }}
            >
              {agent_label}
            </span>
            <span className="text-xs text-muted">· {round?.replace(/_/g, ' ')}</span>
            {flagged_by_devil ? (
              <motion.span
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-md border border-blood/40 bg-blood/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#e8a0b8]"
              >
                challenged
              </motion.span>
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
    </motion.article>
  )
}
