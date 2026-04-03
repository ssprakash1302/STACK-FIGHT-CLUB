/** Agent display colors (hex) — must match backend. */
export const AGENT_COLORS = {
  microservices_advocate: '#7F77DD',
  monolith_advocate: '#D85A30',
  event_driven_advocate: '#1D9E75',
  serverless_advocate: '#378ADD',
  constraint_validator: '#BA7517',
  devils_advocate: '#993556',
  synthesizer: '#444441',
}

export function initialsFromLabel(label) {
  if (!label) return '?'
  const parts = label.replace(/'/g, '').split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return label.slice(0, 2).toUpperCase()
}

export const ROUND_LABELS = {
  constraints: 'CONSTRAINTS',
  opening: 'OPENING POSITIONS',
  cross_examination: 'CROSS-EXAMINATION',
  rebuttal: 'REBUTTAL',
  synthesis: 'SYNTHESIS',
}
