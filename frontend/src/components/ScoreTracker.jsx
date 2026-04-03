const ORDER = [
  { key: 'microservices', label: 'Microservices', color: '#7F77DD' },
  { key: 'monolith', label: 'Monolith', color: '#D85A30' },
  { key: 'event_driven', label: 'Event-driven', color: '#1D9E75' },
  { key: 'serverless', label: 'Serverless', color: '#378ADD' },
]

export default function ScoreTracker({ scores }) {
  return (
    <div className="mt-4 border-t border-[rgba(255,255,255,0.08)] pt-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">Live architecture scores</p>
      <div className="space-y-2">
        {ORDER.map(({ key, label, color }) => {
          const v = scores[key] ?? 0
          const pct = Math.round(v * 100)
          return (
            <div key={key}>
              <div className="mb-0.5 flex justify-between text-[11px] text-secondary">
                <span style={{ color }}>{label}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#111]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.85 }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] leading-snug text-muted">
        Heuristic during debate; synthesizer scores replace on verdict.
      </p>
    </div>
  )
}
