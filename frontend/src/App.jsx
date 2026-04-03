import { useMemo, useState } from 'react'
import DebateArena from './components/DebateArena'
import RequirementsForm from './components/RequirementsForm'
import VerdictPanel, { exportAdrFile } from './components/VerdictPanel'
import { useDebateStream } from './hooks/useDebateStream'

const EXAMPLE_REQUIREMENTS = `We are a 6-person startup building a B2B SaaS analytics platform.
Expected traffic: 10k DAU at launch, targeting 500k DAU in 18 months.
Team: 3 backend engineers, 2 frontend, 1 DevOps.
Budget: $8k/month infrastructure max.
Compliance: SOC2 Type II required within 12 months.
Existing infra: AWS, Postgres RDS, basic EC2 setup.
Latency SLA: dashboard queries under 500ms at p95.
We need to ship the MVP in 3 months.`

export default function App() {
  const [requirements, setRequirements] = useState(EXAMPLE_REQUIREMENTS)
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
  } = useDebateStream()

  const displayMessages = useMemo(
    () => (isReplaying ? replayVisible : messages),
    [isReplaying, replayVisible, messages]
  )

  return (
    <div
      className="grid h-screen overflow-hidden"
      style={{ gridTemplateColumns: '30% 50% 20%', background: '#0f0f0f', color: '#e8e6e0' }}
    >
      <RequirementsForm
        requirements={requirements}
        onChange={setRequirements}
        onSubmit={() => startDebate(requirements)}
        isStreaming={isStreaming}
        currentRound={currentRound}
        constraints={constraints}
        architectureScores={architectureScores}
        streamError={streamError}
      />
      <DebateArena
        messages={displayMessages}
        activeAgent={isReplaying ? null : activeAgent}
        isStreaming={isStreaming}
        isReplaying={isReplaying}
      />
      <VerdictPanel
        adr={adr}
        isStreaming={isStreaming}
        onExport={() => adr && exportAdrFile(adr, messages, requirements)}
        onReplay={() => startReplay(messages, 600)}
        canReplay={messages.length > 0 && !isStreaming && !isReplaying}
      />
    </div>
  )
}
