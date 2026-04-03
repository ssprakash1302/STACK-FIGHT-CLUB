import ConstraintPanel from './ConstraintPanel'
import KnockoutBanner from './KnockoutBanner'
import ScoreTracker from './ScoreTracker'

export const PRESETS = {
  early: `We are a 2-person startup building a niche B2B tool.
Budget: under $2k/month total infra.
Team: 1 full-stack engineer, 1 designer who scripts.
Need to ship an MVP in 6 weeks. No compliance requirements yet.
Traffic: hundreds of users at most in year one.`,

  scale: `We are a 6-person startup building a B2B SaaS analytics platform.
Expected traffic: 10k DAU at launch, targeting 500k DAU in 18 months.
Team: 3 backend engineers, 2 frontend, 1 DevOps.
Budget: $8k/month infrastructure max.
Compliance: SOC2 Type II required within 12 months.
Existing infra: AWS, Postgres RDS, basic EC2 setup.
Latency SLA: dashboard queries under 500ms at p95.
We need to ship the MVP in 3 months.`,

  enterprise: `We are a regulated enterprise building a customer data platform.
Team: 40+ engineers across platform, data, and security.
Compliance: HIPAA + GDPR; all data residency in EU.
Traffic: batch and streaming; peak 50k RPS API, 2M events/min pipelines.
Existing: Kubernetes on AWS, Kafka, Snowflake, strict change management.
Latency: sub-100ms for critical synchronous paths; async elsewhere.`,
}

export default function RequirementsForm({
  requirements,
  onChange,
  onSubmit,
  isStreaming,
  currentRound,
  constraints,
  architectureScores,
  streamError,
}) {
  return (
    <div className="flex h-full flex-col border-r border-[rgba(255,255,255,0.08)] bg-surface p-4">
      <h1 className="mb-1 text-lg font-semibold tracking-tight text-primary">Requirements</h1>
      <p className="mb-3 text-xs text-muted">Describe the system. Agents debate; only the synthesizer decides.</p>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-[rgba(255,255,255,0.12)] bg-raised px-2 py-1 text-[11px] text-secondary hover:border-[rgba(255,255,255,0.2)] hover:text-primary"
          onClick={() => onChange(PRESETS.early)}
        >
          Early Startup
        </button>
        <button
          type="button"
          className="rounded-md border border-[rgba(255,255,255,0.12)] bg-raised px-2 py-1 text-[11px] text-secondary hover:border-[rgba(255,255,255,0.2)] hover:text-primary"
          onClick={() => onChange(PRESETS.scale)}
        >
          Scale-up
        </button>
        <button
          type="button"
          className="rounded-md border border-[rgba(255,255,255,0.12)] bg-raised px-2 py-1 text-[11px] text-secondary hover:border-[rgba(255,255,255,0.2)] hover:text-primary"
          onClick={() => onChange(PRESETS.enterprise)}
        >
          Enterprise
        </button>
      </div>

      <textarea
        className="min-h-[180px] flex-1 resize-none rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#111] p-3 text-sm text-primary placeholder:text-muted focus:border-[rgba(255,255,255,0.2)] focus:outline-none"
        value={requirements}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Plain-English system description…"
        disabled={isStreaming}
      />

      <button
        type="button"
        className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-canvas transition hover:opacity-90 disabled:opacity-40"
        style={{ color: '#0f0f0f' }}
        onClick={onSubmit}
        disabled={isStreaming || !requirements.trim()}
      >
        {isStreaming ? 'Debate running…' : 'Start Debate'}
      </button>

      {streamError ? (
        <div className="mt-3 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs leading-relaxed text-red-100/95">
          <span className="font-semibold text-red-300">Error: </span>
          {streamError}
        </div>
      ) : null}

      {currentRound ? (
        <p className="mt-2 text-xs text-muted">
          Phase: <span className="text-secondary">{currentRound.replace(/_/g, ' ')}</span>
        </p>
      ) : null}

      {constraints?.hard_blockers?.length ? (
        <div className="mt-4">
          <KnockoutBanner blockers={constraints.hard_blockers} />
        </div>
      ) : null}

      <ConstraintPanel constraints={constraints} />
      <ScoreTracker scores={architectureScores} />
    </div>
  )
}
