import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

const STORY_META = {
  forest_adventure: { art: '/assets/story-forest.svg', bg: '#DBEAC6', fg: '#2C5430' },
  space_mission:    { art: '/assets/story-space.svg',  bg: '#DBCFE8', fg: '#432270' },
  ocean_quest:      { art: '/assets/story-ocean.svg',  bg: '#C9E2E8', fg: '#16505C' },
}

export default function StoryPicker({ photo, childName, failureMsg, onSubmit, onBack }) {
  const [templates, setTemplates] = useState([])
  const [selected, setSelected]   = useState(null)
  const [language, setLanguage]   = useState('en')
  const [customPrompt, setCustomPrompt]     = useState('')
  const [customTone, setCustomTone]         = useState('')
  const [customScript, setCustomScript]     = useState('')
  const [customDuration, setCustomDuration] = useState(10)
  const [verbatimMode, setVerbatimMode]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetch(`${API}/templates`)
      .then(r => r.json())
      .then(setTemplates)
      .catch(() => setError('Could not load story templates.'))
  }, [])

  const isCustom   = selected === 'custom'
  const canSubmit  = selected && (!isCustom || customPrompt.trim())

  async function handleSubmit() {
    if (!canSubmit) return
    if (isCustom && verbatimMode && !customScript.trim()) {
      setError('Please enter the narration script, or switch to "Let us write it".')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSubmit({
        storyId:        selected,
        language,
        customPrompt:   isCustom ? customPrompt : undefined,
        customTone:     isCustom && !verbatimMode ? customTone : undefined,
        customScript:   isCustom && verbatimMode ? customScript : undefined,
        customDuration: isCustom ? customDuration : undefined,
      })
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const displayError = error || failureMsg

  return (
    <div className="sl-screen">
      <div className="sl-kicker">Step 2 of 3</div>
      <h1 className="sl-h1">Pick where today's adventure happens.</h1>
      <p className="sl-lede">
        Each story is around 10 seconds, narrated in your chosen language.
        Or write your own — we'll weave it from your prompt.
      </p>

      {displayError && (
        <div style={{
          background: 'var(--cobalt-50)', border: '1px solid var(--berry-300)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          color: 'var(--berry-400)', fontSize: 14, fontWeight: 600,
        }}>
          {displayError}
        </div>
      )}

      {/* 4-card story grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {templates.map(t => {
          const meta = STORY_META[t.id] || {}
          const isSel = selected === t.id
          return (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              style={{
                border: 'none', textAlign: 'left', cursor: 'pointer',
                borderRadius: 20, padding: 14,
                background: meta.bg || 'var(--paper-200)',
                color: meta.fg || 'var(--ink-700)',
                outline: isSel ? '3px solid var(--cobalt-400)' : 'none',
                outlineOffset: 3,
                boxShadow: 'var(--shadow-sticker)',
                transform: isSel ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'all 220ms var(--ease-bounce)',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              <div style={{
                height: 130, borderRadius: 14, position: 'relative',
                backgroundImage: meta.art ? `url(${meta.art})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                background: meta.art ? undefined : 'var(--paper-300)',
              }}>
                <span style={{
                  position: 'absolute', top: 8, left: 8,
                  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 800,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 999,
                  background: 'rgba(255,247,236,0.92)', color: meta.fg || 'var(--ink-700)',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
                  </svg>
                  10s
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                {t.name}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.4, opacity: 0.78 }}>
                {t.description}
              </div>
            </button>
          )
        })}

        {/* Custom story card */}
        <button
          onClick={() => setSelected('custom')}
          style={{
            textAlign: 'left', cursor: 'pointer',
            borderRadius: 20, padding: 14,
            background: isCustom ? 'var(--cobalt-50)' : 'var(--paper-50)',
            border: isCustom ? '2px solid var(--cobalt-400)' : '2px dashed var(--paper-400)',
            outline: isCustom ? '3px solid var(--cobalt-400)' : 'none',
            outlineOffset: 3,
            boxShadow: 'var(--shadow-sticker)',
            transform: isCustom ? 'translateY(-3px)' : 'translateY(0)',
            transition: 'all 220ms var(--ease-bounce)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
          <div style={{
            height: 130, borderRadius: 14, position: 'relative',
            background: 'repeating-linear-gradient(135deg, var(--paper-200) 0 12px, var(--paper-100) 12px 24px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 999,
              background: 'var(--cobalt-400)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(42, 77, 189, 0.30)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M16 4l4 4-11 11H5v-4z"/><path d="M14 6l4 4"/>
              </svg>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, lineHeight: 1.1, color: 'var(--ink-700)' }}>
            Write your own
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.4, color: 'var(--ink-400)' }}>
            Describe a scene, set the tone.
          </div>
        </button>
      </div>

      {/* Custom story panel */}
      {isCustom && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--paper-300)',
          borderRadius: 20, padding: 22,
          display: 'flex', flexDirection: 'column', gap: 18,
          boxShadow: 'var(--shadow-sm)',
          animation: 'sl-fadein 220ms var(--ease-out)',
        }}>
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--cobalt-500)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M16 4l4 4-11 11H5v-4z"/><path d="M14 6l4 4"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Custom story
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-hand)', fontSize: 20, color: 'var(--cobalt-500)' }}>
              tell us your scene ✦
            </span>
          </div>

          {/* Scene prompt */}
          <Field label="Describe the scene" required>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="A child in a magical forest discovering a glowing door…"
              rows={3}
              style={textareaStyle}
              onFocus={e => { e.target.style.borderColor = 'var(--cobalt-400)'; e.target.style.boxShadow = 'var(--glow-focus)' }}
              onBlur={e  => { e.target.style.borderColor = 'var(--paper-300)';  e.target.style.boxShadow = 'none' }}
            />
            <FieldHint>The richer the description, the warmer the result.</FieldHint>
          </Field>

          {/* Duration */}
          <Field label="Video length">
            <div style={{ display: 'inline-flex', background: 'var(--paper-200)', padding: 4, borderRadius: 999, border: '1px solid var(--paper-300)' }}>
              {[5, 10].map(s => (
                <button key={s} onClick={() => setCustomDuration(s)} style={{
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                  padding: '7px 18px', borderRadius: 999, border: 'none',
                  background: customDuration === s ? 'var(--surface)' : 'transparent',
                  color: customDuration === s ? 'var(--ink-700)' : 'var(--ink-400)',
                  boxShadow: customDuration === s ? '0 2px 6px rgba(26, 34, 51, 0.10)' : 'none',
                  cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  transition: 'all var(--dur-fast) var(--ease-out)',
                }}>
                  {customDuration === s && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
                    </svg>
                  )}
                  {s} seconds
                </button>
              ))}
            </div>
          </Field>

          {/* Narration mode */}
          <Field label="Narration script">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { id: false, title: 'Let us write it', sub: 'From your scene + tone', icon: 'wand' },
                { id: true,  title: "I'll write it",   sub: 'Word-for-word narration', icon: 'pencil' },
              ].map(opt => (
                <button key={String(opt.id)} onClick={() => setVerbatimMode(opt.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                  background: verbatimMode === opt.id ? 'var(--cobalt-50)' : 'var(--paper-50)',
                  border: verbatimMode === opt.id ? '1.5px solid var(--cobalt-400)' : '1.5px solid var(--paper-300)',
                  boxShadow: verbatimMode === opt.id ? '0 0 0 4px rgba(42, 77, 189, 0.15)' : 'none',
                  color: 'var(--ink-700)',
                  transition: 'all var(--dur-fast) var(--ease-out)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                    background: 'var(--cobalt-100)', color: 'var(--cobalt-500)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {opt.id ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M16 4l4 4-11 11H5v-4z"/><path d="M14 6l4 4"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M4 20L16 8"/><path d="M14 6l4 4"/>
                        <path d="M19 13l.6 1.7L21 15.3l-1.4.6L19 17l-.6-1.4L17 15.3l1.4-.6z" fill="currentColor"/>
                        <path d="M7 4l.6 1.4L9 6l-1.4.6L7 8l-.6-1.4L5 6l1.4-.6z" fill="currentColor"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--ink-700)' }}>{opt.title}</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: 'var(--ink-400)' }}>{opt.sub}</span>
                  </div>
                </button>
              ))}
            </div>
          </Field>

          {/* Tone / verbatim field */}
          {!verbatimMode ? (
            <Field label="Tone & style" optional>
              <input
                type="text"
                value={customTone}
                onChange={e => setCustomTone(e.target.value)}
                placeholder="warm and magical · bedtime story for a 5-year-old"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--cobalt-400)'; e.target.style.boxShadow = 'var(--glow-focus)' }}
                onBlur={e  => { e.target.style.borderColor = 'var(--paper-300)';  e.target.style.boxShadow = 'none' }}
              />
              <FieldHint>We'll draft a 3–5 sentence narration matched to your tone.</FieldHint>
            </Field>
          ) : (
            <Field label="Exact narration script" required>
              <textarea
                value={customScript}
                onChange={e => setCustomScript(e.target.value)}
                placeholder="Type the narration word-for-word as you want it spoken…"
                rows={4}
                style={textareaStyle}
                onFocus={e => { e.target.style.borderColor = 'var(--cobalt-400)'; e.target.style.boxShadow = 'var(--glow-focus)' }}
                onBlur={e  => { e.target.style.borderColor = 'var(--paper-300)';  e.target.style.boxShadow = 'none' }}
              />
              <FieldHint>Keep it under ~60 words for a 10 second video.</FieldHint>
            </Field>
          )}
        </div>
      )}

      {/* Language + photo chip row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)', marginBottom: 8 }}>
            Narration language
          </label>
          <div style={{ display: 'inline-flex', background: 'var(--paper-200)', padding: 4, borderRadius: 999, border: '1px solid var(--paper-300)' }}>
            {[{ id: 'en', flag: '🇬🇧', label: 'English' }, { id: 'ar', flag: '🇸🇦', label: 'Arabic' }].map(o => (
              <button key={o.id} onClick={() => setLanguage(o.id)} style={{
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                padding: '8px 18px', borderRadius: 999, border: 'none',
                background: language === o.id ? 'var(--surface)' : 'transparent',
                color: language === o.id ? 'var(--ink-700)' : 'var(--ink-400)',
                boxShadow: language === o.id ? '0 2px 6px rgba(26, 34, 51, 0.10)' : 'none',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'all var(--dur-fast) var(--ease-out)',
              }}>
                <span style={{ fontSize: 16 }}>{o.flag}</span> {o.label}
              </button>
            ))}
          </div>
        </div>

        {photo && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--paper-200)', borderRadius: 999 }}>
            <img src={URL.createObjectURL(photo)} alt="" style={{ width: 28, height: 28, borderRadius: 999, objectFit: 'cover' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>{childName || 'Your photo'}</span>
          </div>
        )}
      </div>

      <div className="sl-actions">
        <button className="sl-btn sl-btn--ghost" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/>
          </svg>
          Back
        </button>
        <div style={{ flex: 1 }} />
        <button
          className="sl-btn sl-btn--primary"
          disabled={!canSubmit || loading}
          onClick={handleSubmit}
        >
          {loading ? 'Starting…' : 'Make their story'}
          {!loading && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

/* ── Helpers ── */
function Field({ label, required, optional, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: 'var(--ink-700)' }}>
        {label}
        {required && <span style={{ color: 'var(--berry-400)', marginLeft: 3 }}>*</span>}
        {optional && <span style={{ color: 'var(--ink-400)', fontWeight: 400, marginLeft: 4 }}>(optional)</span>}
      </label>
      {children}
    </div>
  )
}

function FieldHint({ children }) {
  return <span style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-400)' }}>{children}</span>
}

const inputBase = {
  width: '100%', boxSizing: 'border-box',
  fontFamily: 'var(--font-body)', fontSize: 15,
  padding: '11px 14px', borderRadius: 12,
  background: 'var(--paper-50)',
  border: '1px solid var(--paper-300)',
  borderBottom: '1.5px solid var(--paper-400)',
  color: 'var(--ink-700)', outline: 'none',
  transition: 'border-color var(--dur-fast) var(--ease-out)',
}
const inputStyle    = { ...inputBase }
const textareaStyle = { ...inputBase, resize: 'vertical', lineHeight: 1.55 }
