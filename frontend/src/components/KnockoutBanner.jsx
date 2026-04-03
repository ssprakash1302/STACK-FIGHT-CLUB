import { motion } from 'framer-motion'

/** Surfaces hard-blocker text as prominent banners (evaluator-facing). */
export default function KnockoutBanner({ blockers }) {
  if (!blockers || !blockers.length) return null
  return (
    <div className="space-y-2">
      {blockers.map((b, i) => (
        <motion.div
          key={b}
          initial={{ opacity: 0, scale: 0.98, x: -6 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25, delay: i * 0.06 }}
          className="rounded-xl border border-red-800/60 bg-gradient-to-r from-red-950/60 to-red-950/30 px-3 py-2.5 text-xs font-medium leading-snug text-red-100/95 shadow-[0_0_20px_-8px_rgba(220,38,38,0.5)]"
        >
          <span className="mr-2 inline-flex rounded-md bg-red-900/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-50">
            Knockout
          </span>
          {b}
        </motion.div>
      ))}
    </div>
  )
}
