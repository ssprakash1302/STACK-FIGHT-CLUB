import { motion, AnimatePresence } from 'framer-motion'
import ConstraintPanel from './ConstraintPanel'
import KnockoutBanner from './KnockoutBanner'
import ScoreTracker from './ScoreTracker'
import SessionsPanel from './SessionsPanel'

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
  onStopDebate,
  onSessionLoaded,
  sessionsRefresh = 0,
  isStreaming,
  currentRound,
  constraints,
  architectureScores,
  streamError,
}) {
  const stopNotice = streamError?.startsWith?.('Debate stopped')
  return (
    /*
      h-full fills the grid cell.
      Split into two zones:
        1. Input zone  (shrink-0) — header, presets, textarea, CTA, status
        2. Data zone   (flex-1 min-h-0 overflow-y-auto) — constraints, scores, blockers
    */
    <div className="flex h-full flex-col overflow-hidden bg-surface/95 backdrop-blur-sm">

      {/* ── Zone 1: Input (fixed, no scroll) ── */}
      <div className="shrink-0 space-y-3 border-b border-border p-4 md:p-5">

        {/* Heading */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold/85">Briefing room</p>
          <h2 className="mt-0.5 font-display text-2xl tracking-[0.12em] text-primary">Requirements</h2>
          <p className="mt-1.5 text-[11px] leading-relaxed text-secondary">
            Describe the system in plain language. The constraint validator runs first, then four advocates
            debate — the synthesizer delivers the final ADR.
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'early', label: 'Early startup' },
            { key: 'scale', label: 'Scale-up' },
            { key: 'enterprise', label: 'Enterprise' },
          ].map(({ key, label }, i) => (
            <motion.button
              key={key}
              type="button"
              disabled={isStreaming}
              onClick={() => onChange(PRESETS[key])}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-lg border border-border bg-raised/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-secondary shadow-inset transition hover:border-gold-dim/45 hover:text-primary focus:outline-none focus:ring-2 focus:ring-gold/25 disabled:opacity-40"
            >
              {label}
            </motion.button>
          ))}
        </div>

        {/* Textarea — fixed height, no flex-1 fighting with outer flex */}
        <textarea
          value={requirements}
          onChange={(e) => onChange(e.target.value)}
          disabled={isStreaming}
          placeholder="Plain-English system description — team, traffic, budget, compliance, latency…"
          className="h-36 w-full resize-none rounded-xl border border-border bg-depth/80 p-3.5 text-sm leading-relaxed text-primary shadow-inset placeholder:text-muted transition-[border-color,box-shadow] duration-200 focus:border-gold-dim/50 focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:opacity-50 md:h-40"
        />
        <p className="text-[10px] leading-snug text-muted">
          <span className="tabular-nums">{requirements.length.toLocaleString()}</span> characters ·{' '}
          <span className="tabular-nums">
            {requirements.trim() ? requirements.trim().split(/\s+/).filter(Boolean).length.toLocaleString() : '0'}
          </span>{' '}
          words
          <span className="text-muted/70"> · </span>
          <kbd className="rounded border border-border bg-depth px-1 py-0.5 font-mono text-[9px] text-secondary">
            Ctrl
          </kbd>
          <span className="mx-0.5 text-muted/70">+</span>
          <kbd className="rounded border border-border bg-depth px-1 py-0.5 font-mono text-[9px] text-secondary">
            Enter
          </kbd>
          <span className="text-muted/70"> to start debate</span>
        </p>

        {/* CTA */}
        <div className="space-y-2">
          <div className="border-gradient-cta p-px">
            <motion.button
              type="button"
              onClick={onSubmit}
              disabled={isStreaming || !requirements.trim()}
              whileHover={{ scale: isStreaming || !requirements.trim() ? 1 : 1.015 }}
              whileTap={{ scale: isStreaming || !requirements.trim() ? 1 : 0.985 }}
              className="relative w-full overflow-hidden rounded-[11px] bg-gradient-to-br from-gold via-gold-mid to-gold-dim py-3 text-sm font-bold uppercase tracking-[0.18em] text-canvas shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isStreaming ? (
                <span className="flex items-center justify-center gap-2.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-canvas/80"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                    />
                  ))}
                  <span>Debate live</span>
                </span>
              ) : (
                'Start debate'
              )}
              {isStreaming && (
                <motion.span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </motion.button>
          </div>
          {isStreaming && onStopDebate ? (
            <button
              type="button"
              onClick={onStopDebate}
              className="w-full rounded-xl border border-red-800/55 bg-red-950/25 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-red-200/95 transition hover:bg-red-950/45"
            >
              Stop debate
            </button>
          ) : null}
        </div>

        {/* Error */}
        <AnimatePresence>
          {streamError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`overflow-hidden rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed ${
                stopNotice
                  ? 'border-amber-800/45 bg-amber-950/20 text-amber-100/95'
                  : 'border-red-900/50 bg-red-950/35 text-red-100/95'
              }`}
            >
              {!stopNotice ? <span className="font-bold text-red-300">Error: </span> : null}
              {streamError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase indicator */}
        <AnimatePresence>
          {currentRound && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-gold"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/70">Phase</span>
              <span className="rounded-md bg-raised px-2 py-0.5 text-[11px] font-medium text-secondary">
                {currentRound.replace(/_/g, ' ')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Zone 2: Live data (scrollable, grows to fill remaining height) ── */}
      <div className="scrollbar-sfc min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
        <AnimatePresence>
          {constraints?.hard_blockers?.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4"
            >
              <KnockoutBanner blockers={constraints.hard_blockers} />
            </motion.div>
          )}
        </AnimatePresence>

        <ConstraintPanel constraints={constraints} />
        <ScoreTracker scores={architectureScores} />

        <div className="mt-6 border-t border-border pt-4">
          <SessionsPanel onSessionLoaded={onSessionLoaded} refreshKey={sessionsRefresh} />
        </div>
      </div>
    </div>
  )
}
