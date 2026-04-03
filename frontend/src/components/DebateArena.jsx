import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AgentBubble from './AgentBubble'
import AgentStatusBar from './AgentStatusBar'
import RoundDivider from './RoundDivider'

const ROUND_ORDER = ['constraints', 'opening', 'cross_examination', 'rebuttal', 'synthesis']

const STICK_THRESHOLD_PX = 80
const JUMP_THRESHOLD_PX = 120

const STACKS = [
  { label: 'Microservices', color: '#7F77DD' },
  { label: 'Monolith', color: '#D85A30' },
  { label: 'Event-driven', color: '#1D9E75' },
  { label: 'Serverless', color: '#378ADD' },
]

function roundIndex(r) {
  const i = ROUND_ORDER.indexOf(r)
  return i >= 0 ? i : 0
}

function messageMatchesQuery(m, q) {
  if (!q) return true
  const hay = `${m.content || ''} ${m.agent_label || ''} ${m.round || ''}`.toLowerCase()
  return hay.includes(q)
}

export default function DebateArena({ messages, activeAgent, isStreaming, isReplaying, currentRound }) {
  const scrollRef = useRef(null)
  const stickToBottomRef = useRef(true)
  const [showJumpLatest, setShowJumpLatest] = useState(false)
  const [arenaSearch, setArenaSearch] = useState('')

  const searchNorm = arenaSearch.trim().toLowerCase()

  const filteredThread = useMemo(() => {
    if (!searchNorm) {
      return messages.map((m, idx) => ({ m, idx }))
    }
    return messages.map((m, idx) => ({ m, idx })).filter(({ m }) => messageMatchesQuery(m, searchNorm))
  }, [messages, searchNorm])

  useEffect(() => {
    if (messages.length === 0) stickToBottomRef.current = true
  }, [messages.length])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = fromBottom < STICK_THRESHOLD_PX
    const listLen = searchNorm ? filteredThread.length : messages.length
    setShowJumpLatest(fromBottom > JUMP_THRESHOLD_PX && listLen > 0)
  }, [messages.length, filteredThread.length, searchNorm])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || messages.length === 0 || !stickToBottomRef.current) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: isStreaming || isReplaying ? 'instant' : 'smooth' })
      })
    })
    if (stickToBottomRef.current) setShowJumpLatest(false)
  }, [messages, isStreaming, isReplaying, filteredThread.length])

  const jumpToLatest = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    stickToBottomRef.current = true
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    setShowJumpLatest(false)
  }, [])

  let lastRound = null
  const items = []
  filteredThread.forEach(({ m, idx }) => {
    if (m.round !== lastRound) {
      lastRound = m.round
      items.push(<RoundDivider key={`div-${m.round}-${idx}`} round={m.round} index={roundIndex(m.round)} />)
    }
    items.push(<AgentBubble key={`${m.agent_id}-${idx}`} message={m} index={idx} />)
  })

  const onSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setArenaSearch('')
      e.preventDefault()
    }
  }

  return (
    <div className="relative h-full flex flex-col bg-[#09090c]">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />

      <AgentStatusBar
        activeAgent={activeAgent}
        isStreaming={isStreaming}
        isReplaying={isReplaying}
        currentRound={currentRound}
      />

      {messages.length > 0 || isReplaying ? (
        <div className="z-10 shrink-0 border-b border-border bg-depth/50 px-3 py-2 backdrop-blur-sm md:px-5">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <label htmlFor="arena-search" className="sr-only">
              Search debate transcript
            </label>
            <input
              id="arena-search"
              type="search"
              value={arenaSearch}
              onChange={(e) => setArenaSearch(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search transcript…"
              className="min-w-0 flex-1 rounded-lg border border-border bg-raised/80 py-2 pl-3 pr-3 text-xs text-primary placeholder:text-muted focus:border-gold-dim/45 focus:outline-none focus:ring-1 focus:ring-gold/25"
              autoComplete="off"
            />
            {searchNorm ? (
              <span className="shrink-0 tabular-nums text-[10px] font-semibold text-gold/85">
                {filteredThread.length}/{messages.length}
              </span>
            ) : null}
            {arenaSearch ? (
              <button
                type="button"
                onClick={() => setArenaSearch('')}
                className="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted hover:text-primary"
              >
                Clear
              </button>
            ) : null}
          </div>
          {searchNorm && filteredThread.length === 0 ? (
            <p className="mx-auto mt-1.5 max-w-3xl text-center text-[11px] text-muted">No messages match.</p>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-sfc px-4 py-5 md:px-6 [scrollbar-gutter:stable]"
        >
          <AnimatePresence mode="wait">
            {messages.length === 0 && !isReplaying ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex h-full min-h-[280px] flex-col items-center justify-center gap-8 px-6 py-12 text-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="font-display text-[80px] leading-none tracking-[0.2em] md:text-[100px]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.06) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    VS
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 font-display text-[80px] leading-none tracking-[0.2em] md:text-[100px]"
                    style={{ color: 'transparent', textShadow: '0 0 60px rgba(212,175,55,0.08)' }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    VS
                  </motion.div>
                </div>

                <div className="max-w-md space-y-3">
                  <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold/70">The arena is ready</p>
                  <p className="text-sm leading-relaxed text-secondary">
                    Describe your system requirements, press{' '}
                    <span className="rounded bg-raised/80 px-1.5 py-0.5 font-semibold text-primary">
                      Start debate
                    </span>
                    , and watch four architecture advocates cross-examine each other in real time.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {STACKS.map(({ label, color }, i) => (
                    <motion.span
                      key={label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      className="flex items-center gap-2 rounded-full border border-border bg-raised/60 px-3.5 py-1.5 text-xs font-semibold text-secondary"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                      {label}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="thread"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="mx-auto flex max-w-3xl flex-col gap-2.5 pb-10"
              >
                {items}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showJumpLatest && (searchNorm ? filteredThread.length : messages.length) > 0 ? (
            <motion.button
              key="jump"
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={jumpToLatest}
              className="pointer-events-auto absolute bottom-5 right-5 z-30 rounded-full border border-gold-dim/50 bg-depth/95 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gold shadow-glow backdrop-blur-md hover:border-gold/60 hover:bg-raised"
            >
              ↓ Latest
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
