export function buildAdrMarkdown(adr, transcript, requirements) {
  const d = new Date()
  const iso = d.toISOString().slice(0, 10)
  const lines = [
    `# ${adr.title}`,
    '',
    `- **Date:** ${iso}`,
    `- **Status:** ${adr.status}`,
    '- **Deciders:** Architecture Decision Maker',
    '',
    '## Context',
    '',
    adr.context,
    '',
    '## Decision',
    '',
    adr.decision,
    '',
    `**Chosen architecture:** ${adr.chosen_architecture}`,
    '',
    `**Confidence:** ${Math.round((adr.confidence_score || 0) * 100)}%`,
    '',
    '## Consequences',
    '',
  ]
  ;(adr.consequences || []).forEach((c) => lines.push(`- ${c}`))
  lines.push('', '## Rejected alternatives', '')
  ;(adr.rejected_alternatives || []).forEach((alt) => {
    lines.push(`- **${alt.name || ''}:** ${alt.reason || ''}`)
  })
  lines.push('', '## Architecture diagram (Mermaid)', '', '```mermaid', adr.mermaid_diagram || '', '```', '')
  if (requirements) {
    lines.push('## Original requirements', '', '```', requirements, '```', '')
  }
  if (transcript && transcript.length) {
    lines.push('## Appendix: Debate transcript', '')
    transcript.forEach((m) => {
      const text = (m.content || '').replace(/\n/g, ' ')
      lines.push(`- **[${m.agent_label} — ${m.round}]** ${text}`)
    })
  }
  return lines.join('\n')
}

export function downloadMarkdown(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
