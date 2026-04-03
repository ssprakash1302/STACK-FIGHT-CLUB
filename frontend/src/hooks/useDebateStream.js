import { useCallback, useState } from 'react'

const API_BASE = ''

const ARCH_KEYS = ['microservices', 'monolith', 'event_driven', 'serverless']

const AGENT_TO_ARCH = {
  microservices_advocate: 'microservices',
  monolith_advocate: 'monolith',
  event_driven_advocate: 'event_driven',
  serverless_advocate: 'serverless',
}

function initialScores() {
  const o = {}
  ARCH_KEYS.forEach((k) => {
    o[k] = 0.25
  })
  return o
}

function parseSSEBlocks(buffer) {
  const events = []
  let rest = buffer.replace(/\r\n/g, '\n')
  let idx
  while ((idx = rest.indexOf('\n\n')) >= 0) {
    const block = rest.slice(0, idx)
    rest = rest.slice(idx + 2)
    let eventType = 'message'
    let dataLine = ''
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) eventType = line.slice(6).trim()
      else if (line.startsWith('data:')) dataLine = line.slice(5).trim()
    }
    if (dataLine !== '') {
      try {
        events.push({ eventType, data: JSON.parse(dataLine) })
      } catch {
        /* skip */
      }
    }
  }
  return { events, rest }
}

export function useDebateStream() {
  const [messages, setMessages] = useState([])
  const [constraints, setConstraints] = useState(null)
  const [adr, setAdr] = useState(null)
  const [activeAgent, setActiveAgent] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentRound, setCurrentRound] = useState(null)
  const [architectureScores, setArchitectureScores] = useState(initialScores)
  const [replayVisible, setReplayVisible] = useState([])
  const [isReplaying, setIsReplaying] = useState(false)
  const [streamError, setStreamError] = useState(null)

  const bumpScore = useCallback((agentId, delta) => {
    const arch = AGENT_TO_ARCH[agentId]
    if (!arch) return
    setArchitectureScores((prev) => {
      const next = { ...prev }
      next[arch] = Math.min(1, Math.max(0, (next[arch] || 0) + delta))
      return next
    })
  }, [])

  const startDebate = useCallback(async (requirements) => {
    setMessages([])
    setConstraints(null)
    setAdr(null)
    setArchitectureScores(initialScores())
    setReplayVisible([])
    setActiveAgent(null)
    setCurrentRound(null)
    setStreamError(null)
    setIsStreaming(true)

    const response = await fetch(`${API_BASE}/debate/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirements }),
    })

    if (!response.ok) {
      setStreamError(`HTTP ${response.status}`)
      setIsStreaming(false)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parsed = parseSSEBlocks(buffer)
        buffer = parsed.rest
        for (const { eventType, data } of parsed.events) {
          if (eventType === 'constraints') {
            setConstraints(data)
          } else if (eventType === 'message') {
            setActiveAgent(data.agent_id)
            setCurrentRound(data.round)
            setMessages((prev) => [...prev, data])
            const round = data.round
            if (
              (round === 'opening' || round === 'rebuttal') &&
              AGENT_TO_ARCH[data.agent_id]
            ) {
              bumpScore(data.agent_id, 0.04)
            }
            if (data.agent_id === 'devils_advocate') {
              setArchitectureScores((prev) => {
                const next = { ...prev }
                ARCH_KEYS.forEach((k) => {
                  next[k] = Math.max(0, (next[k] || 0) - 0.02)
                })
                return next
              })
            }
          } else if (eventType === 'adr') {
            setAdr(data)
            setActiveAgent(null)
            if (data.architecture_scores && typeof data.architecture_scores === 'object') {
              setArchitectureScores((prev) => ({ ...prev, ...data.architecture_scores }))
            }
          } else if (eventType === 'error') {
            setStreamError(data.message || 'Debate failed on the server.')
            setActiveAgent(null)
          } else if (eventType === 'done') {
            setActiveAgent(null)
          }
        }
      }
    } finally {
      setIsStreaming(false)
      setActiveAgent(null)
    }
  }, [bumpScore])

  const startReplay = useCallback(
    (allMessages, delayMs = 600) => {
      if (!allMessages.length || isReplaying) return
      setIsReplaying(true)
      setReplayVisible([])
      let i = 0
      const tick = () => {
        if (i >= allMessages.length) {
          setIsReplaying(false)
          return
        }
        setReplayVisible((prev) => [...prev, allMessages[i]])
        i += 1
        setTimeout(tick, delayMs)
      }
      tick()
    },
    [isReplaying]
  )

  return {
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
  }
}
