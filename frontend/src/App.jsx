import { useState, useCallback } from 'react'
import Upload from './components/Upload'
import StoryPicker from './components/StoryPicker'
import StatusPoller from './components/StatusPoller'
import VideoPlayer from './components/VideoPlayer'
import './App.css'

const API = import.meta.env.VITE_API_URL

export default function App() {
  const [step, setStep]           = useState('upload')
  const [photo, setPhoto]         = useState(null)
  const [childName, setChildName] = useState('')
  const [choice, setChoice]       = useState(null)
  const [jobId, setJobId]         = useState(null)
  const [result, setResult]       = useState(null)
  const [failureMsg, setFailureMsg] = useState('')

  const handlePhotoSelected = useCallback((file, name) => {
    setPhoto(file)
    setChildName(name || '')
    setStep('pick')
  }, [])

  const handleStorySubmit = useCallback(async ({ storyId, language, customPrompt, customTone, customScript, customDuration }) => {
    const form = new FormData()
    form.append('photo', photo)
    form.append('story_id', storyId)
    form.append('language', language)
    if (customPrompt  !== undefined) form.append('custom_prompt',   customPrompt)
    if (customTone    !== undefined) form.append('custom_tone',     customTone)
    if (customScript  !== undefined) form.append('custom_script',   customScript)
    if (customDuration !== undefined) form.append('custom_duration', customDuration)

    const res  = await fetch(`${API}/jobs`, { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Failed to create job')

    setChoice({
      storyId,
      language,
      isCustom:   storyId === 'custom',
      verbatim:   !!customScript,
      duration:   customDuration,
    })
    setJobId(data.job_id)
    setFailureMsg('')
    setStep('processing')
  }, [photo])

  const handleJobDone = useCallback((job) => {
    setResult({ video_url: job.video_url, audio_url: job.audio_url })
    setStep('done')
  }, [])

  const handleJobFailed = useCallback((msg) => {
    setFailureMsg(msg)
    setStep('pick')
  }, [])

  const handleReset = useCallback(() => {
    setStep('upload')
    setPhoto(null)
    setChildName('')
    setChoice(null)
    setJobId(null)
    setResult(null)
    setFailureMsg('')
  }, [])

  const doneHeadline = childName
    ? `${childName}'s story is ready.`
    : 'Their story is ready.'

  return (
    <div className="sl-shell">
      <header className="sl-header">
        <div className="sl-header-capsule">
          <a href="#" className="sl-brand" onClick={(e) => { e.preventDefault(); handleReset() }}>
            <img src="/assets/logo-mark.svg" width="32" height="32" alt="" />
            <span className="sl-brand-name">Storyling</span>
          </a>
        </div>
      </header>

      <main className={`sl-main${step === 'pick' ? ' sl-main--wide' : ''}`}>
        {step === 'upload' && (
          <Upload onPhotoSelected={handlePhotoSelected} />
        )}
        {step === 'pick' && (
          <StoryPicker
            photo={photo}
            childName={childName}
            failureMsg={failureMsg}
            onSubmit={handleStorySubmit}
            onBack={() => setStep('upload')}
          />
        )}
        {step === 'processing' && (
          <StatusPoller
            jobId={jobId}
            isCustom={choice?.isCustom}
            verbatim={choice?.verbatim}
            onDone={handleJobDone}
            onFailed={handleJobFailed}
          />
        )}
        {step === 'done' && (
          <VideoPlayer
            videoUrl={result.video_url}
            audioUrl={`${API}${result.audio_url}`}
            headline={doneHeadline}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="sl-footer">
        <span>Made with love for parents.</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <a href="#">How it works</a>
        <a href="#">Privacy</a>
        <a href="#">Support</a>
      </footer>
    </div>
  )
}
