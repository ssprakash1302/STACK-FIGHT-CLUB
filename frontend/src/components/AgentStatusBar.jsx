import { motion } from 'framer-motion'
import { AGENT_COLORS, initialsFromLabel } from '../utils/agentMeta'

const ROUND_STEPS = [
  { key: 'constraints', label: 'Constraints' },
  { key: 'opening', label: 'Opening' },
  { key: 'cross_examination', label: 'Cross-exam' },
  { key: 'rebuttal', label: 'Rebuttal' },
  { key: 'synthesis', label: 'Synthesis' },
]

function RoundProgress({ currentRound }) {
  const idx = ROUND_STEPS.findIndex((s) => s.key === currentRound)
  const active = idx >= 0 ? idx : -1
  return (
    <div
      className="mt-3 flex w-full items-center gap-1 border-t border-border/80 pt-2.5"
      role="status"
      aria-label={currentRound ? `Debate phase: ${currentRound.replace(/_/g, ' ')}` : 'Debate phases'}
    >
      {ROUND_STEPS.map((step, i) => {
        const done = active > i
        const here = active === i
        return (
          <div key={step.key} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={step.label}>
            <div
              className={`h-1 w-full max-w-[48px] rounded-full transition-colors ${
                done || here ? 'bg-gold/70' : 'bg-border'
              } ${here ? 'shadow-[0_0_8px_-1px_rgba(212,175,55,0.6)]' : ''}`}
            />
            <span
              className={`hidden truncate text-[9px] font-semibold uppercase tracking-wider sm:block ${
                here ? 'text-gold' : done ? 'text-secondary' : 'text-muted/80'
              }`}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const LABELS = {
  microservices_advocate: 'Microservices Advocate',
  monolith_advocate: 'Monolith Advocate',
  event_driven_advocate: 'Event-Driven Advocate',
  serverless_advocate: 'Serverless Advocate',
  constraint_validator: 'Constraint Validator',
  devils_advocate: "Devil's Advocate",
  synthesizer: 'Decision Synthesizer',
}

export default function AgentStatusBar({ activeAgent, isStreaming, isReplaying, currentRound }) {
  const label = activeAgent ? LABELS[activeAgent] || activeAgent : null
  const color = activeAgent ? AGENT_COLORS[activeAgent] || '#888780' : '#555550'

  if (isReplaying) {
    return (
      <div className="relative overflow-hidden border-b border-border bg-depth/90 px-4 py-3 backdrop-blur-sm md:px-6">
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)',
            width: '40%',
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/90">Replay</span>
          <span className="text-sm text-secondary">Replaying transcript…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden border-b border-border bg-depth/90 px-4 py-3 backdrop-blur-sm md:px-6">
      {isStreaming ? (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      ) : null}
      {isStreaming ? (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]"
          aria-hidden
        >
          <motion.div
            className="absolute left-0 right-0 h-8 bg-gradient-to-b from-gold/40 to-transparent"
            animate={{ top: ['-100%', '200%'] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : null}

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dim">Live arena</span>
          {isStreaming && activeAgent ? (
            <>
              <motion.span
                className="inline-block h-2 w-2 shrink-0 rounded-full animate-pulse-dot"
                style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
              />
              <div className="flex items-center gap-2">
                <motion.div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: color, boxShadow: `0 0 16px -2px ${color}` }}
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                >
                  {initialsFromLabel(label)}
                </motion.div>
                <span className="text-sm font-semibold text-primary">{label}</span>
                <motion.span
                  className="text-xs text-gold/80"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  speaking…
                </motion.span>
              </div>
            </>
          ) : (
            <span className="text-sm text-muted">
              {isStreaming ? 'Preparing next speaker…' : 'Idle — arm the debate from the left panel'}
            </span>
          )}
        </div>
        {isStreaming ? (
          <motion.div
            className="hidden items-center gap-1 sm:flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1 w-1 rounded-full bg-gold"
                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
              />
            ))}
          </motion.div>
        ) : null}
      </div>
      {(isStreaming || currentRound) ? <RoundProgress currentRound={currentRound} /> : null}
    </div>
  )
}
