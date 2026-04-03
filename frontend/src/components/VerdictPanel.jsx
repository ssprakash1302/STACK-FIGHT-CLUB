import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  buildAdrMarkdown,
  downloadMarkdown,
  buildVerdictSummaryText,
  buildTranscriptMarkdown,
  copyTextToClipboard,
} from '../utils/exportAdr'

/* ─── Confidence ring ──────────────────────────────────── */
function ConfidenceRing({ score }) {
  const pct = Math.round((score || 0) * 100)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  const color = pct >= 80 ? '#1D9E75' : pct >= 60 ? '#d4af37' : '#D85A30'

  return (
    <div className="relative mx-auto h-32 w-32">
      <svg className="-rotate-90" viewBox="0 0 100 100" aria-label={`Confidence: ${pct}%`}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-3xl font-bold tabular-nums leading-none text-primary">{pct}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">confidence</span>
      </div>
    </div>
  )
}

/* ─── Waiting state ────────────────────────────────────── */
function WaitingState({ isStreaming }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.div
        animate={
          isStreaming
            ? { scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }
            : { rotate: [0, 6, -6, 0], opacity: [0.2, 0.35, 0.2] }
        }
        transition={{ duration: isStreaming ? 1.8 : 7, repeat: Infinity, ease: 'easeInOut' }}
        className="font-display text-7xl text-gold/30"
        aria-hidden
      >
        {isStreaming ? '◆' : '⚖'}
      </motion.div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-secondary">
          {isStreaming ? 'Debate is live — synthesizer queued' : 'Waiting for the debate to start'}
        </p>
        <p className="text-xs leading-relaxed text-muted">
          {isStreaming
            ? 'The verdict appears here after synthesis. You can stop early from the header or briefing room and still download the partial transcript below.'
            : 'Set your requirements and press Start debate. The championship verdict lands here.'}
        </p>
      </div>
      {isStreaming && (
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              className="h-1 w-1 rounded-full bg-gold/60"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Section wrapper ──────────────────────────────────── */
function Section({ title, accent, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        {accent && <span className="h-3.5 w-0.5 rounded-full" style={{ background: accent }} />}
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">{title}</p>
      </div>
      {children}
    </motion.section>
  )
}

/* ─── Main verdict content ─────────────────────────────── */
function VerdictContent({ adr, pros, cons }) {
  const archName = adr.chosen_architecture?.replace(/_/g, ' ') || '—'

  return (
    <div className="space-y-7 p-5">

      {/* Champion block */}
      <div className="rounded-2xl border border-gold-dim/30 bg-gradient-to-br from-raised/80 via-depth/60 to-raised/40 p-5 text-center shadow-glow">
        <ConfidenceRing score={adr.confidence_score} />
        <div className="mt-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/80">Recommended stack</p>
          <p className="font-display text-4xl capitalize tracking-[0.1em] text-gradient-gold">{archName}</p>
        </div>
      </div>

      {/* Reasoning */}
      <Section title="Decision reasoning" accent="#d4af37">
        <div className="rounded-xl border border-border bg-depth/70 p-4">
          <p className="text-sm leading-[1.75] text-secondary">{adr.decision}</p>
        </div>
      </Section>

      {/* Rejected alternatives */}
      {(adr.rejected_alternatives || []).length > 0 && (
        <Section title="Rejected alternatives" accent="#D85A30">
          <div className="space-y-3">
            {(adr.rejected_alternatives || []).map((alt, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-border bg-raised/50 p-4"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className="rounded bg-[#D85A30]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#e8855e]"
                  >
                    rejected
                  </span>
                  <span className="text-sm font-bold text-primary">{alt.name}</span>
                </div>
                <p className="text-xs leading-relaxed text-secondary">{alt.reason}</p>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Consequences */}
      {(pros.length > 0 || cons.length > 0) && (
        <Section title="Consequences">
          <div className="space-y-3">
            {pros.length > 0 && (
              <div className="rounded-xl border border-emerald-900/35 bg-emerald-950/20 p-4">
                <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Benefits
                </p>
                <ul className="space-y-2.5">
                  {pros.map((x, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.04 * i }}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-emerald-100/85"
                    >
                      <span className="mt-0.5 shrink-0 text-base leading-none text-emerald-400">+</span>
                      <span>{x.replace(/^(\+\s*|POSITIVE:\s*|pro:\s*)/i, '')}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
            {cons.length > 0 && (
              <div className="rounded-xl border border-red-900/35 bg-red-950/20 p-4">
                <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  Risks &amp; trade-offs
                </p>
                <ul className="space-y-2.5">
                  {cons.map((x, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.04 * i }}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-red-100/80"
                    >
                      <span className="mt-0.5 shrink-0 text-base leading-none text-red-400">−</span>
                      <span>{x.replace(/^(−\s*|-\s*|NEGATIVE:\s*|con:\s*)/i, '')}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {adr.mermaid_diagram?.trim() ? (
        <Section title="Architecture sketch (Mermaid)" accent="#378ADD">
          <details className="group rounded-xl border border-border bg-depth/70 open:border-gold-dim/30">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-secondary">
              <span className="mr-2 inline-block transition-transform group-open:rotate-90">▸</span>
              View diagram source
            </summary>
            <pre className="max-h-56 overflow-auto border-t border-border px-4 py-3 font-mono text-[11px] leading-relaxed text-secondary">
              {adr.mermaid_diagram.trim()}
            </pre>
          </details>
        </Section>
      ) : null}

      {/* Spacer so last section isn't flush against footer */}
      <div className="h-2" />
    </div>
  )
}

/* ─── Export function ──────────────────────────────────── */
export function exportAdrFile(adr, transcript, requirements) {
  const md = buildAdrMarkdown(adr, transcript, requirements)
  const safe = (adr.title || 'ADR').replace(/[^\w\s-]/g, '').slice(0, 64) || 'ADR'
  downloadMarkdown(`${safe}.md`, md)
}

export function exportTranscriptFile(messages, requirements) {
  const md = buildTranscriptMarkdown(messages, requirements)
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  downloadMarkdown(`stack-fight-transcript-${stamp}.md`, md)
}

/* ─── Panel ────────────────────────────────────────────── */
export default function VerdictPanel({
  adr,
  isStreaming,
  onExport,
  onReplay,
  canReplay,
  messages = [],
  requirements = '',
  replayDelayMs = 600,
  onReplayDelayChange,
}) {
  const [pros, setPros] = useState([])
  const [cons, setCons] = useState([])
  const [copyBanner, setCopyBanner] = useState('')
  const copyTimerRef = useRef(null)

  useEffect(() => {
    if (!adr?.consequences) { setPros([]); setCons([]); return }
    const p = []
    const c = []
    adr.consequences.forEach((line) => {
      const t = line.toLowerCase()
      const isPositive =
        t.startsWith('pro:') ||
        t.startsWith('+ ') ||
        t.startsWith('positive:') ||
        t.includes('benefit') ||
        t.includes('advantage')
      const isNegative =
        t.startsWith('con:') ||
        t.startsWith('- ') ||
        t.startsWith('negative:') ||
        t.includes('risk') ||
        t.includes('trade-off') ||
        t.includes('downside')

      if (isPositive) p.push(line)
      else if (isNegative) c.push(line)
      else p.push(line)
    })
    if (p.length === 0 && c.length === 0) {
      const half = Math.ceil(adr.consequences.length / 2)
      setPros(adr.consequences.slice(0, half))
      setCons(adr.consequences.slice(half))
    } else {
      setPros(p)
      setCons(c)
    }
  }, [adr])

  const flashCopy = (msg) => {
    setCopyBanner(msg)
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
    copyTimerRef.current = window.setTimeout(() => setCopyBanner(''), 2600)
  }
  const onCopySummary = async () => {
    if (!adr) return
    const ok = await copyTextToClipboard(buildVerdictSummaryText(adr))
    flashCopy(ok ? 'Summary copied to clipboard' : 'Copy failed — try again or use Export')
  }
  const onCopyMermaid = async () => {
    if (!adr?.mermaid_diagram?.trim()) return
    const ok = await copyTextToClipboard(adr.mermaid_diagram.trim())
    flashCopy(ok ? 'Mermaid copied' : 'Copy failed')
  }

  return (
    /*
      h-full fills the grid cell.
      flex-col: header (shrink-0) + body (scrollable) + footer (shrink-0).
      The body is the ONLY scrollable element — no nested max-h scroll boxes.
    */
    <div className="flex h-full flex-col overflow-hidden bg-surface/95 backdrop-blur-sm">

      {/* ── Fixed header ── */}
      <div className="shrink-0 border-b border-border px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/85">Championship</p>
        <h2 className="mt-0.5 font-display text-2xl tracking-[0.14em] text-primary">Verdict</h2>
      </div>

      {/* ── Scrollable body (THE only scroll surface here) ── */}
      <div className="scrollbar-sfc flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!adr ? (
            <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <WaitingState isStreaming={isStreaming} />
            </motion.div>
          ) : (
            <motion.div
              key="verdict"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <VerdictContent adr={adr} pros={pros} cons={cons} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {messages?.length > 0 && !adr ? (
        <div className="shrink-0 border-t border-border bg-depth/25 px-4 py-3">
          <p className="mb-2 text-center text-[10px] leading-snug text-muted">
            Verdict not ready — save the debate so far as Markdown for notes or tickets.
          </p>
          <button
            type="button"
            onClick={() => exportTranscriptFile(messages, requirements)}
            className="w-full rounded-xl border border-gold-dim/35 bg-raised/80 py-2.5 text-[11px] font-bold uppercase tracking-wide text-gold/90 transition hover:border-gold/50"
          >
            Download transcript (.md)
          </button>
        </div>
      ) : null}

      {/* ── Fixed footer buttons (only visible once verdict arrives) ── */}
      <AnimatePresence>
        {adr && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="shrink-0 space-y-2 border-t border-border p-4"
          >
            {copyBanner ? (
              <p className="text-center text-[11px] font-medium text-gold" role="status" aria-live="polite">
                {copyBanner}
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onCopySummary}
                className="rounded-xl border border-border bg-raised/80 py-2.5 text-[11px] font-bold uppercase tracking-wide text-primary transition hover:border-gold-dim/45 hover:text-gold-glow"
              >
                Copy summary
              </button>
              <button
                type="button"
                onClick={() => exportTranscriptFile(messages, requirements)}
                disabled={!messages?.length}
                className="rounded-xl border border-border bg-raised/80 py-2.5 text-[11px] font-bold uppercase tracking-wide text-primary transition hover:border-gold-dim/45 hover:text-gold-glow disabled:cursor-not-allowed disabled:opacity-35"
              >
                Transcript .md
              </button>
            </div>

            {adr.mermaid_diagram?.trim() ? (
              <button
                type="button"
                onClick={onCopyMermaid}
                className="w-full rounded-xl border border-[#378ADD]/35 bg-[#378ADD]/10 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#7eb8ea] transition hover:bg-[#378ADD]/18"
              >
                Copy Mermaid
              </button>
            ) : null}

            <motion.button
              type="button"
              onClick={onExport}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full overflow-hidden rounded-xl border border-gold-dim/50 bg-gradient-to-b from-raised to-depth py-3 text-sm font-bold uppercase tracking-[0.15em] text-primary shadow-inset transition hover:border-gold/50 hover:text-gold-glow"
            >
              Export ADR
              <motion.span
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
            </motion.button>
            <div className="space-y-1.5">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Replay speed</p>
              <div className="flex justify-center gap-1.5">
                {[
                  { label: 'Fast', ms: 400 },
                  { label: 'Normal', ms: 600 },
                  { label: 'Slow', ms: 900 },
                ].map(({ label, ms }) => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => onReplayDelayChange?.(ms)}
                    className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${
                      replayDelayMs === ms
                        ? 'border-gold/45 bg-gold/10 text-gold'
                        : 'border-border text-secondary hover:border-gold-dim/40 hover:text-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <motion.button
              type="button"
              onClick={onReplay}
              disabled={!canReplay}
              whileHover={{ scale: canReplay ? 1.01 : 1 }}
              whileTap={{ scale: canReplay ? 0.99 : 1 }}
              className="w-full rounded-xl py-2.5 text-sm font-medium text-secondary transition hover:bg-raised/70 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
            >
              Replay debate
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
