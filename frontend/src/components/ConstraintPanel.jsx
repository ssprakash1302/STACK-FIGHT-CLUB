export default function ConstraintPanel({ constraints }) {
  if (!constraints) {
    return (
      <p className="mt-3 text-xs text-muted">
        Constraints appear here after Round 1 (Constraint Validator).
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
      <p className="text-xs font-medium uppercase tracking-wider text-muted">Extracted constraints</p>
      <div className="flex flex-wrap gap-2">
        {entries.map(([k, v]) => (
          <span
            key={k}
            className="rounded-md border border-amber-900/50 bg-amber-950/40 px-2 py-1 text-[11px] text-amber-100/90"
          >
            {k.replace(/_/g, ' ')}: {String(v)}
          </span>
        ))}
        {compliance.map((c) => (
          <span
            key={c}
            className="rounded-md border border-amber-900/50 bg-amber-950/40 px-2 py-1 text-[11px] text-amber-100/90"
          >
            compliance: {c}
          </span>
        ))}
      </div>
      {blockers.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium text-red-300/90">Hard blockers</p>
          <div className="flex flex-col gap-2">
            {blockers.map((b) => (
              <div
                key={b}
                className="rounded-md border border-red-900/60 bg-red-950/50 px-2 py-1.5 text-[11px] text-red-100/95"
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
