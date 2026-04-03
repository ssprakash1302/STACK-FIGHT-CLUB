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

/** Plain-text verdict for Slack, email, or issue comments. */
export function buildVerdictSummaryText(adr) {
  if (!adr) return ''
  const pct = Math.round((adr.confidence_score || 0) * 100)
  const arch = (adr.chosen_architecture || '').replace(/_/g, ' ')
  const lines = [
    'STACK FIGHT CLUB — Verdict summary',
    '',
    `Recommended architecture: ${arch}`,
    `Confidence: ${pct}%`,
    '',
    'Decision:',
    adr.decision || '',
    '',
  ]
  if (adr.consequences?.length) {
    lines.push('Consequences:')
    adr.consequences.forEach((c) => lines.push(`• ${c}`))
    lines.push('')
  }
  if (adr.rejected_alternatives?.length) {
    lines.push('Rejected alternatives:')
    adr.rejected_alternatives.forEach((a) => {
      lines.push(`• ${a.name || ''}: ${a.reason || ''}`)
    })
    lines.push('')
  }
  if (adr.mermaid_diagram?.trim()) {
    lines.push('Mermaid (diagram):', adr.mermaid_diagram.trim(), '')
  }
  return lines.join('\n').trim()
}

/** Debate transcript only (no ADR template). */
export function buildTranscriptMarkdown(messages, requirements) {
  const when = new Date().toISOString()
  const lines = [
    '# Stack Fight Club — Debate transcript',
    '',
    `- **Captured:** ${when}`,
    '',
  ]
  if (requirements?.trim()) {
    lines.push('## Requirements input', '', '```', requirements.trim(), '```', '')
  }
  lines.push('## Messages', '')
  ;(messages || []).forEach((m) => {
    const who = m.agent_label || m.agent_id || 'Agent'
    const round = (m.round || '').replace(/_/g, ' ')
    lines.push(`### ${who} · ${round}`, '', m.content || '', '')
  })
  return lines.join('\n')
}

/** Copy helper with clipboard API + execCommand fallback. */
export async function copyTextToClipboard(text) {
  if (!text) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    try {
      return document.execCommand('copy')
    } finally {
      document.body.removeChild(ta)
    }
  }
}
