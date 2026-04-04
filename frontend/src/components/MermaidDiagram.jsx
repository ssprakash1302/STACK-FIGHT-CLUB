/**
 * Renders Mermaid definition text as an SVG (dark theme, matches app).
 * Strips accidental ```mermaid fences from LLM output.
 * Click the preview to open a centered lightbox for a larger view.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

let mermaidInitialized = false

function normalizeMermaidSource(raw) {
  let s = (raw || '').trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:mermaid)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
  }
  return s.trim()
}

export default function MermaidDiagram({ code }) {
  const [svg, setSvg] = useState(null)
  const [error, setError] = useState(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const lightboxTitleId = useId()
  const closeBtnRef = useRef(null)
  const triggerRef = useRef(null)
  const hadLightboxOpenRef = useRef(false)

  useEffect(() => {
    if (!lightboxOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [lightboxOpen])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen])

  useEffect(() => {
    if (lightboxOpen) {
      hadLightboxOpenRef.current = true
      closeBtnRef.current?.focus()
      return
    }
    if (hadLightboxOpenRef.current) {
      hadLightboxOpenRef.current = false
      triggerRef.current?.focus()
    }
  }, [lightboxOpen])

  useEffect(() => {
    const normalized = normalizeMermaidSource(code)
    if (!normalized) {
      setSvg(null)
      setError(null)
      return
    }

    let alive = true
    setSvg(null)
    setError(null)

    const run = async () => {
      try {
        const mermaid = (await import('mermaid')).default

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'strict',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            themeVariables: {
              darkMode: true,
              background: '#14141a',
              primaryColor: '#1a1a22',
              primaryTextColor: '#f4f1ea',
              primaryBorderColor: 'rgba(212, 175, 55, 0.35)',
              lineColor: '#a39e92',
              secondaryColor: '#0e0e11',
              tertiaryColor: '#070708',
            },
          })
          mermaidInitialized = true
        }

        const id = `sfc-mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const { svg: out } = await mermaid.render(id, normalized)
        if (alive) setSvg(out)
      } catch (e) {
        if (alive) setError(e?.message || String(e))
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [code])

  const normalized = normalizeMermaidSource(code)
  if (!normalized) return null

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-amber-200/90">Could not render as diagram: {error}</p>
        <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-canvas p-3 font-mono text-[10px] leading-relaxed text-muted">
          {normalized}
        </pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center py-10 text-xs text-muted" aria-busy="true">
        Rendering diagram…
      </div>
    )
  }

  const lightbox =
    lightboxOpen &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
        role="presentation"
      >
        <div
          className="absolute inset-0 animate-fade-in bg-black/80 backdrop-blur-[2px]"
          aria-hidden="true"
          onClick={() => setLightboxOpen(false)}
          role="presentation"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={lightboxTitleId}
          className="animate-fade-in-up relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-[min(96vw,1400px)] flex-col overflow-hidden rounded-2xl border border-gold-dim/25 bg-depth shadow-glow"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <h2 id={lightboxTitleId} className="text-sm font-semibold tracking-wide text-secondary">
              Architecture diagram
            </h2>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="rounded-lg border border-border bg-surface/90 px-3 py-1.5 text-xs font-semibold text-secondary transition hover:border-gold-dim/40 hover:bg-raised hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold/50"
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
            <div
              className="mermaid-lightbox flex justify-center [&_svg]:h-auto [&_svg]:max-h-none [&_svg]:max-w-full [&_svg]:min-w-0"
              // eslint-disable-next-line react/no-danger -- mermaid returns trusted SVG from its parser
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
      </div>,
      document.body,
    )

  return (
    <>
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onClick={() => setLightboxOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setLightboxOpen(true)
          }
        }}
        className="group relative w-full cursor-zoom-in rounded-xl text-left outline-none ring-offset-2 ring-offset-depth transition hover:ring-2 hover:ring-gold-dim/35 focus-visible:ring-2 focus-visible:ring-gold/55"
        aria-label="Enlarge architecture diagram"
      >
        <span className="pointer-events-none absolute bottom-2 right-2 z-[1] rounded-md border border-border/80 bg-black/55 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-primary/90 opacity-0 shadow-sm transition group-hover:opacity-100">
          Click to enlarge
        </span>
        <div
          className="mermaid-host overflow-x-auto [&_svg]:max-h-[min(420px,55vh)] [&_svg]:max-w-full [&_svg]:min-w-0"
          // eslint-disable-next-line react/no-danger -- mermaid returns trusted SVG from its parser
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      {lightbox}
    </>
  )
}
