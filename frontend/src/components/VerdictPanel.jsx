import { useEffect, useState } from 'react'
import { buildAdrMarkdown, downloadMarkdown } from '../utils/exportAdr'

function ConfidenceRing({ score }) {
  const pct = Math.round((score || 0) * 100)
  const radius = 40
  const c = 2 * Math.PI * radius
  const offset = c - (pct / 100) * c

  return (
    <div className="relative mx-auto h-28 w-28">
      <svg className="-rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#222" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#7F77DD"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-primary">{pct}%</span>
        <span className="text-[10px] uppercase tracking-wide text-muted">confidence</span>
      </div>
    </div>
  )
}

export default function VerdictPanel({
  adr,
  isStreaming,
  onExport,
  onReplay,
  canReplay,
}) {
  const [pros, setPros] = useState([])
  const [cons, setCons] = useState([])

  useEffect(() => {
    if (!adr?.consequences) {
      setPros([])
      setCons([])
      return
    }
    const p = []
    const c = []
    adr.consequences.forEach((line) => {
      const t = line.toLowerCase()
      if (
        t.startsWith('pro:') ||
        t.startsWith('+') ||
        t.includes('benefit') ||
        t.includes('advantage')
      ) {
        p.push(line.replace(/^(pro:\s*)/i, ''))
      } else if (t.startsWith('con:') || t.startsWith('-') || t.includes('risk') || t.includes('cost')) {
        c.push(line.replace(/^(con:\s*)/i, ''))
      } else {
        p.push(line)
      }
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

  return (
    <div className="flex h-full flex-col border-l border-[rgba(255,255,255,0.08)] bg-surface p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">Verdict</h2>

      {!adr && (
        <p className="text-sm text-muted">Waiting for debate…</p>
      )}

      {adr && (
        <>
          <ConfidenceRing score={adr.confidence_score} />
          <p className="mt-4 text-center text-xs uppercase tracking-widest text-muted">Chosen</p>
          <p className="text-center text-xl font-bold capitalize text-primary">
            {adr.chosen_architecture?.replace(/_/g, ' ')}
          </p>

          <div className="mt-4 max-h-28 overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#141414] p-2 text-xs leading-relaxed text-secondary">
            {adr.decision}
          </div>

          <p className="mt-4 text-xs font-medium uppercase text-muted">Rejected alternatives</p>
          <ul className="mt-1 max-h-32 space-y-2 overflow-y-auto text-xs text-secondary">
            {(adr.rejected_alternatives || []).map((a, i) => (
              <li key={i} className="border-b border-[rgba(255,255,255,0.06)] pb-2 last:border-0">
                <span className="font-medium text-primary">{a.name}</span>
                <span className="text-muted"> — </span>
                {a.reason}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs font-medium uppercase text-muted">Consequences</p>
          <div className="mt-1 grid max-h-40 grid-cols-1 gap-2 overflow-y-auto text-xs">
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase text-emerald-500/90">Pros</p>
              <ul className="space-y-1 text-emerald-100/85">
                {pros.map((x, i) => (
                  <li key={i}>+ {x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase text-red-400/90">Cons</p>
              <ul className="space-y-1 text-red-100/80">
                {cons.map((x, i) => (
                  <li key={i}>− {x}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-4">
            <button
              type="button"
              className="w-full rounded-lg border border-[rgba(255,255,255,0.15)] bg-raised py-2 text-sm font-medium text-primary hover:bg-[#2a2a2a]"
              onClick={onExport}
            >
              Export ADR
            </button>
            <button
              type="button"
              className="w-full rounded-lg py-2 text-sm font-medium text-secondary hover:text-primary disabled:opacity-40"
              onClick={onReplay}
              disabled={!canReplay}
            >
              Replay debate
            </button>
          </div>
        </>
      )}

      {isStreaming && !adr && (
        <p className="mt-4 animate-pulse text-xs text-muted">Synthesizer running…</p>
      )}
    </div>
  )
}

export function exportAdrFile(adr, transcript, requirements) {
  const md = buildAdrMarkdown(adr, transcript, requirements)
  const safe = (adr.title || 'ADR').replace(/[^\w\s-]/g, '').slice(0, 64) || 'ADR'
  downloadMarkdown(`${safe}.md`, md)
}
