import { useRef, useEffect, useState } from 'react'

export default function VideoPlayer({ videoUrl, audioUrl, headline, onReset }) {
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    const a = audioRef.current
    if (!v || !a) return
    const onPlay   = () => { a.play().catch(() => {}); setPlaying(true) }
    const onPause  = () => { a.pause(); setPlaying(false) }
    const onSeeked = () => { a.currentTime = v.currentTime }
    v.addEventListener('play',   onPlay)
    v.addEventListener('pause',  onPause)
    v.addEventListener('seeked', onSeeked)
    return () => {
      v.removeEventListener('play',   onPlay)
      v.removeEventListener('pause',  onPause)
      v.removeEventListener('seeked', onSeeked)
    }
  }, [])

  return (
    <div className="sl-screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="sl-kicker">Ready</div>
        <span style={{ fontFamily: 'var(--font-hand)', fontSize: 22, color: 'var(--cobalt-400)' }}>✦ all done!</span>
      </div>

      <h1 className="sl-h1">{headline}</h1>
      <p className="sl-lede">Press play to watch and listen along.</p>

      {/* Player card */}
      <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', background: '#1A2233' }}>
        <div style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            src={videoUrl}
            style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}
          />
          {/* play overlay shown only when paused */}
          {!playing && (
            <div
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(14,19,34,0.25)',
                cursor: 'pointer',
              }}
              onClick={() => videoRef.current?.play()}
            >
              <div style={{
                width: 72, height: 72, borderRadius: 999,
                background: 'rgba(255,247,236,0.92)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(14,19,34,0.3)',
                backdropFilter: 'blur(8px)',
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="var(--ink-700)" aria-hidden>
                  <path d="M7 5l12 7-12 7z"/>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', color: 'var(--paper-200)',
        }}>
          <button
            onClick={() => playing ? videoRef.current?.pause() : videoRef.current?.play()}
            style={{ background: 'none', border: 'none', color: 'var(--paper-200)', cursor: 'pointer', opacity: 0.85, padding: 4 }}
          >
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <rect x="7" y="5" width="3.5" height="14" rx="1"/>
                <rect x="13.5" y="5" width="3.5" height="14" rx="1"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 5l12 7-12 7z"/>
              </svg>
            )}
          </button>
          <div style={{ flex: 1, height: 6, background: 'rgba(255,247,236,0.15)', borderRadius: 999 }}>
            <div style={{ width: playing ? '100%' : '0%', height: '100%', background: 'var(--cobalt-400)', borderRadius: 999, transition: 'width 0.4s linear' }} />
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }} aria-hidden>
            <path d="M4 10v4a1 1 0 0 0 1 1h3l4 4V5L8 9H5a1 1 0 0 0-1 1z"/>
            <path d="M16 8a6 6 0 0 1 0 8"/>
          </svg>
        </div>
      </div>

      <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />

      <div className="sl-actions">
        <a
          href={videoUrl}
          download="story-video.mp4"
          className="sl-btn sl-btn--secondary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/>
          </svg>
          Save the video
        </a>
        <div style={{ flex: 1 }} />
        <button className="sl-btn sl-btn--primary" onClick={onReset}>
          Make another
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
            <path d="M19 16l.6 1.7L21 18.3l-1.4.6L19 21l-.6-2.1L17 18.3l1.4-.6z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
