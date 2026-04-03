import { useCallback, useEffect, useRef } from 'react'
import AgentBubble from './AgentBubble'
import AgentStatusBar from './AgentStatusBar'
import RoundDivider from './RoundDivider'

const ROUND_ORDER = ['constraints', 'opening', 'cross_examination', 'rebuttal', 'synthesis']

/** Pixels from bottom — if user is within this, new messages keep the view pinned to bottom. */
const STICK_THRESHOLD_PX = 140

function roundIndex(r) {
  const i = ROUND_ORDER.indexOf(r)
  return i >= 0 ? i : 0
}

export default function DebateArena({
  messages,
  activeAgent,
  isStreaming,
  isReplaying,
}) {
  const scrollRef = useRef(null)
  const stickToBottomRef = useRef(true)

  useEffect(() => {
    if (messages.length === 0) stickToBottomRef.current = true
  }, [messages.length])

  const updateStickToBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distance < STICK_THRESHOLD_PX
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || messages.length === 0) return
    if (!stickToBottomRef.current) return

    const run = () => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: isStreaming || isReplaying ? 'auto' : 'smooth',
      })
    }
    requestAnimationFrame(() => requestAnimationFrame(run))
  }, [messages, isStreaming, isReplaying])

  let lastRound = null
  const items = []
  messages.forEach((m, idx) => {
    if (m.round !== lastRound) {
      lastRound = m.round
      items.push(
        <RoundDivider key={`div-${m.round}-${idx}`} round={m.round} index={roundIndex(m.round)} />
      )
    }
    items.push(<AgentBubble key={`${m.agent_id}-${idx}`} message={m} />)
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <AgentStatusBar
        activeAgent={activeAgent}
        isStreaming={isStreaming}
        isReplaying={isReplaying}
      />
      <div
        ref={scrollRef}
        onScroll={updateStickToBottom}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3 [scrollbar-gutter:stable]"
      >
        {messages.length === 0 && !isReplaying ? (
          <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted">
            The debate arena — messages stream here in real time.
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-3 pb-4">{items}</div>
        )}
      </div>
    </div>
  )
}
