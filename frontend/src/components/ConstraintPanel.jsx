import { motion } from 'framer-motion'

export default function ConstraintPanel({ constraints }) {
  if (!constraints) {
    return (
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Constraints appear here after <span className="font-semibold text-secondary">Round 1</span> (Constraint
        Validator).
      </p>
    )
  }

  const entries = [
    ['team_size', constraints.team_size],
    ['budget', constraints.budget],
    ['latency_sla', constraints.latency_sla],
    ['existing_infra', constraints.existing_infra],
    ['traffic_expectation', constraints.traffic_expectation],
  ].filter(([, v]) => v != null && v !== '')

  const compliance = constraints.compliance || []
  const blockers = constraints.hard_blockers || []

  return (
    <div className="mt-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Extracted constraints</p>
      <div className="flex flex-wrap gap-2">
        {entries.map(([k, v], i) => (
          <motion.span
            key={k}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ scale: 1.03 }}
            className="rounded-lg border border-amber-800/45 bg-gradient-to-br from-amber-950/50 to-amber-950/25 px-2.5 py-1.5 text-[11px] text-amber-100/92 shadow-sm"
          >
            {k.replace(/_/g, ' ')}: {String(v)}
          </motion.span>
        ))}
        {compliance.map((c, i) => (
          <motion.span
            key={c}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (entries.length + i) * 0.04 }}
            className="rounded-lg border border-amber-800/45 bg-gradient-to-br from-amber-950/50 to-amber-950/25 px-2.5 py-1.5 text-[11px] text-amber-100/92"
          >
            compliance: {c}
          </motion.span>
        ))}
      </div>
      {blockers.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold text-red-300/95">Hard blockers</p>
          <div className="flex flex-col gap-2">
            {blockers.map((b, i) => (
              <motion.div
                key={b}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-red-900/55 bg-red-950/45 px-2.5 py-1.5 text-[11px] text-red-100/95"
              >
                {b}
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
