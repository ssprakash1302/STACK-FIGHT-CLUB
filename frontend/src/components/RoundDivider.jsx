import { motion } from 'framer-motion'
import { ROUND_LABELS } from '../utils/agentMeta'

const ORDER = ['constraints', 'opening', 'cross_examination', 'rebuttal', 'synthesis']

export default function RoundDivider({ round, index }) {
  const label = ROUND_LABELS[round] || String(round || '').toUpperCase()
  const num = index >= 0 ? index + 1 : ORDER.indexOf(round) + 1
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex items-center gap-3 py-5 select-none"
    >
      <motion.div
        className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-gold-dim/40"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ transformOrigin: 'right' }}
      />
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.35em] text-gold/85">
        Round {num} · {label}
      </span>
      <motion.div
        className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-gold-dim/40"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ transformOrigin: 'left' }}
      />
    </motion.div>
  )
}
