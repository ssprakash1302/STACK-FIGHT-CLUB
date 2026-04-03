import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import DebateArena from './components/DebateArena'
import RequirementsForm from './components/RequirementsForm'
import VerdictPanel, { exportAdrFile } from './components/VerdictPanel'
import { useDebateStream } from './hooks/useDebateStream'
import { saveSessionSnapshot } from './api/sessionsApi'

const REQUIREMENTS_DRAFT_KEY = 'sfc-requirements-draft'

const EXAMPLE_REQUIREMENTS = `We are a 6-person startup building a B2B SaaS analytics platform.
Expected traffic: 10k DAU at launch, targeting 500k DAU in 18 months.
Team: 3 backend engineers, 2 frontend, 1 DevOps.
Budget: $8k/month infrastructure max.
Compliance: SOC2 Type II required within 12 months.
Existing infra: AWS, Postgres RDS, basic EC2 setup.
Latency SLA: dashboard queries under 500ms at p95.
We need to ship the MVP in 3 months.`

export default function App() {
  const [requirements, setRequirements] = useState(() => {
    try {
      const saved = localStorage.getItem(REQUIREMENTS_DRAFT_KEY)
      if (saved != null && saved.trim().length > 0) return saved
    } catch {
      /* private mode / quota */
    }
    return EXAMPLE_REQUIREMENTS
  })
  const [replayDelayMs, setReplayDelayMs] = useState(600)
  const [sessionsRefresh, setSessionsRefresh] = useState(0)
  const {
    messages,
    constraints,
    adr,
    activeAgent,
    isStreaming,
    currentRound,
    architectureScores,
    replayVisible,
    isReplaying,
    streamError,
    startDebate,
    startReplay,
    resetSession,
    cancelDebate,
    hydrateSession,
  } = useDebateStream()

  const handleStopDebate = async () => {
    const snapshot = {
      requirements,
      messages,
      constraints,
      adr,
      status: 'partial',
      error_message: null,
    }
    cancelDebate()
    try {
      if (snapshot.messages?.length || snapshot.constraints || snapshot.adr) {
        await saveSessionSnapshot(snapshot)
        setSessionsRefresh((k) => k + 1)
      }
    } catch (e) {
      console.warn('Could not save session to SQLite', e)
    }
  }

  const handleSessionLoaded = (rec) => {
    setRequirements(rec.requirements ?? '')
    hydrateSession(rec)
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(REQUIREMENTS_DRAFT_KEY, requirements)
      } catch {
        /* ignore */
      }
    }, 500)
    return () => window.clearTimeout(id)
  }, [requirements])

  const prevStreamingRef = useRef(false)
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming && adr) {
      setSessionsRefresh((k) => k + 1)
    }
    prevStreamingRef.current = isStreaming
  }, [isStreaming, adr])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!isStreaming && !isReplaying && requirements.trim()) {
          startDebate(requirements)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isStreaming, isReplaying, requirements, startDebate])

  const displayMessages = useMemo(
    () => (isReplaying ? replayVisible : messages),
    [isReplaying, replayVisible, messages]
  )

  return (
    /* Full viewport, flex column, nothing overflows the shell */
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">

      {/* Ambient background gradients */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-80"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212,175,55,0.10), transparent 55%),' +
            'radial-gradient(ellipse 55% 40% at 100% 50%, rgba(139,41,66,0.07), transparent 50%),' +
            'radial-gradient(ellipse 45% 50% at 0% 80%, rgba(55,138,221,0.05), transparent 45%)',
        }}
      />

      {/* ─── Header ─── */}
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative z-20 flex shrink-0 items-center justify-between border-b border-border px-5 py-3 backdrop-blur-md md:px-8"
        style={{ background: 'linear-gradient(180deg, rgba(14,14,17,0.95) 0%, rgba(7,7,8,0.80) 100%)' }}
      >
        <div>
          <h1 className="font-display text-3xl leading-none tracking-[0.18em] text-gradient-gold md:text-4xl">
            STACK FIGHT CLUB
          </h1>
          <p className="mt-1 text-[11px] font-medium tracking-wide text-secondary md:text-xs">
            Requirements in · Four stacks enter · One recommendation leaves — with a draft ADR you can ship to review
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-2.5">
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopDebate}
              className="rounded-lg border border-red-800/50 bg-red-950/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-100 transition hover:bg-red-950/55"
            >
              Stop debate
            </button>
          ) : null}
          <button
            type="button"
            disabled={isStreaming || isReplaying}
            onClick={resetSession}
            title="Clear debate, verdict, and scores"
            className="rounded-lg border border-border bg-raised/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-secondary transition hover:border-gold-dim/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            New session
          </button>
          <span className="rounded-full border border-gold-dim/35 bg-raised/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gold/85">
            Live debate engine
          </span>
          {isStreaming ? (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-gold"
              style={{ boxShadow: '0 0 10px rgba(212,175,55,0.9)' }}
            />
          ) : (
            <span className="h-2 w-2 rounded-full bg-muted/50" />
          )}
        </div>
      </motion.header>

      {/* ─── Three-panel grid ─── */}
      {/*
          Each motion.div is a CSS Grid cell — grid stretches cells to fill
          the container's height. Children need h-full to use that height.
      */}
      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(280px,26%)_minmax(0,1fr)_minmax(270px,23%)]">

        {/* Left — Briefing room */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
          className="h-full overflow-hidden border-b border-border lg:border-b-0 lg:border-r"
        >
          <RequirementsForm
            requirements={requirements}
            onChange={setRequirements}
            onSubmit={() => startDebate(requirements)}
            onStopDebate={handleStopDebate}
            onSessionLoaded={handleSessionLoaded}
            sessionsRefresh={sessionsRefresh}
            isStreaming={isStreaming}
            currentRound={currentRound}
            constraints={constraints}
            architectureScores={architectureScores}
            streamError={streamError}
          />
        </motion.div>

        {/* Centre — Debate arena */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="relative h-full overflow-hidden"
          style={{ minHeight: '320px' }}
        >
          {/* Corner decorations */}
          <div className="arena-corner-tl pointer-events-none absolute inset-3 z-20 rounded-lg opacity-50" aria-hidden />
          <DebateArena
            messages={displayMessages}
            activeAgent={isReplaying ? null : activeAgent}
            isStreaming={isStreaming}
            isReplaying={isReplaying}
            currentRound={currentRound}
          />
        </motion.div>

        {/* Right — Championship verdict */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
          className="h-full overflow-hidden border-t border-border lg:border-l lg:border-t-0"
        >
          <VerdictPanel
            adr={adr}
            isStreaming={isStreaming}
            messages={messages}
            requirements={requirements}
            replayDelayMs={replayDelayMs}
            onReplayDelayChange={setReplayDelayMs}
            onExport={() => adr && exportAdrFile(adr, messages, requirements)}
            onReplay={() => startReplay(messages, replayDelayMs)}
            canReplay={messages.length > 0 && !isStreaming && !isReplaying}
          />
        </motion.div>
      </div>
    </div>
  )
}
