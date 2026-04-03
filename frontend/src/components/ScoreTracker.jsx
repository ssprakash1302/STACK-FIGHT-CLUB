import { motion } from 'framer-motion'

const ORDER = [
  { key: 'microservices', label: 'Microservices', color: '#7F77DD' },
  { key: 'monolith', label: 'Monolith', color: '#D85A30' },
  { key: 'event_driven', label: 'Event-driven', color: '#1D9E75' },
  { key: 'serverless', label: 'Serverless', color: '#378ADD' },
]

export default function ScoreTracker({ scores }) {
  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Live stack scores</p>
      <div className="space-y-3">
        {ORDER.map(({ key, label, color }, i) => {
          const v = scores[key] ?? 0
          const pct = Math.round(v * 100)
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <div className="mb-1 flex justify-between text-[11px]">
                <span className="font-semibold" style={{ color }}>
                  {label}
                </span>
                <span className="tabular-nums text-secondary">{pct}%</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-depth shadow-inset">
                <motion.div
                  className="relative z-0 h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${color}99, ${color})`,
                    boxShadow: `0 0 12px -2px ${color}`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                />
                <motion.div
                  className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 opacity-25"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
                  }}
                  animate={{ x: ['-100%', '350%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', delay: i * 0.2 }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>
      <p className="mt-3 text-[10px] leading-snug text-muted">
        Heuristic during debate; synthesizer scores replace on verdict.
      </p>
    </div>
  )
}
