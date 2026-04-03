/** Surfaces hard-blocker text as prominent banners (evaluator-facing). */
export default function KnockoutBanner({ blockers }) {
  if (!blockers || !blockers.length) return null
  return (
    <div className="space-y-2">
      {blockers.map((b) => (
        <div
          key={b}
          className="rounded-md border border-red-800/70 bg-[#2a1010] px-3 py-2 text-xs font-medium leading-snug text-red-100/95"
        >
          <span className="mr-2 rounded bg-red-900/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-red-100">
            Knockout
          </span>
          {b}
        </div>
      ))}
    </div>
  )
}
