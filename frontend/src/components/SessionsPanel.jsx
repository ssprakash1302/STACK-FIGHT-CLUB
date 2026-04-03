import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { deleteSession, fetchSessionDetail, fetchSessionList } from '../api/sessionsApi'

/**
 * Lists SQLite-backed debate sessions; load restores requirements + debate state.
 */
export default function SessionsPanel({ onSessionLoaded, refreshKey = 0 }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await fetchSessionList(40)
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setErr(e?.message || 'Could not load sessions')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload, refreshKey])

  const loadOne = async (id) => {
    setBusyId(id)
    try {
      const rec = await fetchSessionDetail(id)
      onSessionLoaded?.(rec)
    } catch (e) {
      setErr(e?.message || 'Load failed')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this saved session?')) return
    setBusyId(id)
    try {
      await deleteSession(id)
      await reload()
    } catch (err2) {
      setErr(err2?.message || 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold/80">Saved sessions</p>
        <button
          type="button"
          onClick={() => reload()}
          className="text-[10px] font-semibold uppercase tracking-wide text-muted hover:text-gold/80"
        >
          Refresh
        </button>
      </div>
      <p className="text-[10px] leading-snug text-muted">
        SQLite file on the API machine (default <code className="rounded bg-depth px-1 text-[9px]">backend/data/</code>).
        Finished debates save automatically; stopping mid-run also saves a snapshot.
      </p>

      {loading ? (
        <p className="text-xs text-muted">Loading…</p>
      ) : err ? (
        <p className="text-xs text-amber-200/90">{err}</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted">No sessions yet — finish or stop a debate.</p>
      ) : (
        <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1 scrollbar-sfc">
          {rows.map((row) => (
            <motion.li
              key={row.id}
              layout
              className="group rounded-lg border border-border bg-depth/40 transition hover:border-gold-dim/35"
            >
              <div className="flex items-start gap-2 p-2">
                <button
                  type="button"
                  onClick={() => loadOne(row.id)}
                  disabled={busyId === row.id}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="line-clamp-2 text-xs font-semibold text-primary">{row.title}</span>
                  <span className="mt-0.5 block text-[10px] text-muted">
                    {row.created_at?.replace('T', ' ').slice(0, 19)} ·{' '}
                    <span className="uppercase">{row.status}</span>
                  </span>
                </button>
                <button
                  type="button"
                  title="Delete"
                  onClick={(e) => remove(row.id, e)}
                  disabled={busyId === row.id}
                  className="shrink-0 rounded p-1 text-[10px] text-muted opacity-70 hover:bg-red-950/40 hover:text-red-200 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}
