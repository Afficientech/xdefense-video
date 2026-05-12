import { useRef, useState } from 'react'

export default function Upload({ onPhotoSelected }) {
  const inputRef  = useRef(null)
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)
  const [name, setName]       = useState('')
  const [hover, setHover]     = useState(false)
  const [error, setError]     = useState('')

  function handleFile(f) {
    setError('')
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Please upload an image file (JPG, PNG, WEBP).'); return }
    if (f.size > 10 * 1024 * 1024)   { setError('Image must be under 10 MB.'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  return (
    <div className="sl-screen">
      <div className="sl-kicker">Step 1 of 3</div>
      <h1 className="sl-h1">Choose a photo of your little one.</h1>
      <p className="sl-lede">
        A clear, front-facing photo with good lighting works best.
        We'll use this to make them the star of the story.
      </p>

      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setHover(true) }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => { e.preventDefault(); setHover(false); handleFile(e.dataTransfer.files?.[0]) }}
        style={{
          border: `2px dashed ${hover ? 'var(--cobalt-400)' : 'var(--paper-400)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: '36px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 12, cursor: 'pointer', minHeight: 200,
          background: hover ? 'var(--cobalt-50)' : 'var(--paper-50)',
          transition: 'all var(--dur-base) var(--ease-out)',
        }}
      >
        {preview ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <img
              src={preview}
              alt="Preview"
              style={{ width: 140, height: 140, borderRadius: 20, objectFit: 'cover', boxShadow: 'var(--shadow-md)' }}
            />
            <span style={{ fontSize: 13, color: 'var(--ink-400)' }}>
              Looks great.{' '}
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null) }}
                style={{ background: 'none', border: 'none', color: 'var(--cobalt-500)', cursor: 'pointer', textDecoration: 'underline', fontSize: 13, padding: 0 }}
              >
                Choose a different photo
              </button>
            </span>
          </div>
        ) : (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--radius-pill)',
              background: 'var(--cobalt-100)', color: 'var(--cobalt-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 16V4"/><path d="M7 9l5-5 5 5"/>
                <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--ink-700)' }}>
              Drop a photo here, or click to choose
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-400)' }}>JPG · PNG · up to 10 MB</div>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
               onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>

      {error && (
        <p style={{ color: 'var(--berry-400)', fontSize: 14 }}>{error}</p>
      )}

      {/* Name field */}
      <div>
        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 6 }}>
          Their name{' '}
          <span style={{ color: 'var(--ink-400)', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Layla"
          style={{
            width: '100%', boxSizing: 'border-box',
            fontFamily: 'var(--font-body)', fontSize: 16,
            padding: '12px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)',
            border: '1px solid var(--paper-300)',
            borderBottom: '1.5px solid var(--paper-400)',
            color: 'var(--ink-700)', outline: 'none',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--cobalt-400)'; e.target.style.boxShadow = 'var(--glow-focus)' }}
          onBlur={(e)  => { e.target.style.borderColor = 'var(--paper-300)';  e.target.style.borderBottomColor = 'var(--paper-400)'; e.target.style.boxShadow = 'none' }}
        />
        <span style={{ display: 'block', marginTop: 6, fontSize: 13, color: 'var(--ink-400)' }}>
          We'll weave this into the narration.
        </span>
      </div>

      <div className="sl-actions">
        <div style={{ flex: 1 }} />
        <button
          className="sl-btn sl-btn--primary"
          disabled={!file}
          onClick={() => file && onPhotoSelected(file, name.trim())}
        >
          Continue
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
