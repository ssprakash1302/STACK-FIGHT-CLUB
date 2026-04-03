/** REST helpers for persisted debate sessions (SQLite via FastAPI). */

const API = ''

export async function fetchSessionList(limit = 50) {
  const r = await fetch(`${API}/sessions?limit=${limit}`)
  if (!r.ok) throw new Error(`Sessions list failed: HTTP ${r.status}`)
  return r.json()
}

export async function fetchSessionDetail(id) {
  const r = await fetch(`${API}/sessions/${id}`)
  if (!r.ok) throw new Error(`Session ${id} not found`)
  return r.json()
}

export async function deleteSession(id) {
  const r = await fetch(`${API}/sessions/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error(`Delete failed: HTTP ${r.status}`)
  return r.json()
}

/** Save partial or manual snapshot (e.g. after Stop debate). */
export async function saveSessionSnapshot(payload) {
  const r = await fetch(`${API}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`Save failed: HTTP ${r.status}`)
  return r.json()
}
