import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL

const STATUS_TO_IDX = {
  template: { PENDING: 0, PROCESSING: 1, NARRATION: 2, COMPLETED: 3 },
  customAI: { PENDING: 1, PROCESSING: 2, NARRATION: 3, COMPLETED: 4 },
  verbatim: { PENDING: 0, PROCESSING: 1, NARRATION: 2, COMPLETED: 3 },
}

export default function StatusPoller({ jobId, isCustom, verbatim, onDone, onFailed }) {
  const [status, setStatus]   = useState('PENDING')
  const [message, setMessage] = useState('')

  const mode = isCustom && !verbatim ? 'customAI' : 'template'
  const STEPS = mode === 'customAI'
    ? ['Photo received', 'Drafting your script', 'Weaving the story…', 'Adding narration', 'Final touches']
    : ['Photo received', 'Weaving the story…', 'Adding narration', 'Final touches']

  const activeIdx = STATUS_TO_IDX[mode][status] ?? 0

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/jobs/${jobId}`)
        const job = await res.json()
        setStatus(job.status)
        setMessage(job.message || '')
        if (job.status === 'COMPLETED') { clearInterval(interval); onDone(job) }
        if (job.status === 'FAILED')    { clearInterval(interval); onFailed(job.message) }
      } catch { /* network hiccup — keep polling */ }
    }, 4000)
    return () => clearInterval(interval)
  }, [jobId, onDone, onFailed])

  return (
    <div className="sl-screen">
      <div className="sl-kicker">Step 3 of 3</div>
      <h1 className="sl-h1">Weaving the story…</h1>
      <p className="sl-lede">Grab a tea — this takes a minute or two.</p>

      {/* Stepper card */}
      <div style={{
        background: 'var(--surface)', borderRadius: 24, padding: 24,
        border: '1px solid var(--paper-300)', boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {STEPS.map((label, i) => {
            const state = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'todo'
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 999, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14,
                  ...(state === 'done'   && { background: 'var(--moss-400)', color: '#fff' }),
                  ...(state === 'active' && { background: 'var(--cobalt-400)', color: '#fff', boxShadow: '0 0 0 4px rgba(42, 77, 189, 0.22)' }),
                  ...(state === 'todo'   && { background: 'var(--paper-200)', color: 'var(--ink-300)', border: '1px solid var(--paper-300)' }),
                }}>
                  {state === 'done' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12l5 5 9-10"/>
                    </svg>
                  )}
                  {state === 'active' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden
                         style={{ animation: 'sl-spin 1.6s linear infinite' }}>
                      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
                      <path d="M19 16l.6 1.7L21 18.3l-1.4.6L19 21l-.6-2.1L17 18.3l1.4-.6z"/>
                    </svg>
                  )}
                  {state === 'todo' && <span>{i + 1}</span>}
                </div>
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 15.5,
                  color: state === 'todo' ? 'var(--ink-300)' : 'var(--ink-700)',
                  fontWeight: state === 'active' ? 700 : 400,
                }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {message && (
        <div style={{ fontSize: 13, color: 'var(--ink-400)', textAlign: 'center' }}>{message}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-hand)', fontSize: 22, color: 'var(--cobalt-400)' }}>
          drawing the first scene…
        </span>
      </div>
    </div>
  )
}
