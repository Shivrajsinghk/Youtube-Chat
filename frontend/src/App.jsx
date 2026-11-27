import { useCallback, useEffect, useRef, useState } from 'react'
import { askQuestion, indexVideo, ApiError } from './api.js'
import ChatPanel from './components/ChatPanel.jsx'
import Player from './components/Player.jsx'
import UrlForm from './components/UrlForm.jsx'
import useYouTubePlayer from './hooks/useYouTubePlayer.js'

const FRIENDLY_ERRORS = {
  invalid_url: "That doesn't look like a valid YouTube link.",
  no_transcript: 'This video has no available transcript.',
  video_unavailable: 'This video is unavailable or private.',
  youtube_blocked: 'YouTube is blocking the server right now. Try again later.',
  rate_limited: 'Too many requests. Wait a moment and try again.',
  video_not_indexed: 'This video needs to be indexed again. Retrying now…',
}

function readSavedUrl() {
  try { return window.localStorage.getItem('youtube-chat-last-url') || '' } catch { return '' }
}

function saveUrl(url) {
  try { window.localStorage.setItem('youtube-chat-last-url', url) } catch { /* Storage can be disabled by the browser. */ }
}

export default function App() {
  const [url, setUrl] = useState(readSavedUrl)
  const [loadedUrl, setLoadedUrl] = useState('')
  const [videoId, setVideoId] = useState('')
  const [indexing, setIndexing] = useState(false)
  const [formError, setFormError] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [embedError, setEmbedError] = useState(false)
  const retryQuestion = useRef('')
  const playerSectionRef = useRef(null)
  const onPosition = useCallback((time) => setCurrentTime(time), [])
  const onEmbedError = useCallback(() => setEmbedError(true), [])
  const player = useYouTubePlayer(videoId, onPosition, onEmbedError)

  useEffect(() => { if (url) saveUrl(url) }, [url])

  const scrollToPlayer = useCallback(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      playerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const seek = useCallback((seconds) => {
    player.seekTo(seconds)
    scrollToPlayer()
  }, [player.seekTo, scrollToPlayer])

  async function loadVideo(targetUrl = url) {
    setIndexing(true)
    setFormError('')
    try {
      const result = await indexVideo(targetUrl)
      setUrl(targetUrl)
      saveUrl(targetUrl)
      setLoadedUrl(targetUrl)
      setVideoId(result.video_id)
      setMessages([])
      setInput('')
      setCurrentTime(0)
      setEmbedError(false)
    } catch (error) {
      setFormError(FRIENDLY_ERRORS[error.code] || 'Could not load this video. Check your connection and try again.')
    } finally {
      setIndexing(false)
    }
  }

  async function sendQuestion(question = input, isRetry = false) {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || chatLoading) return
    if (!isRetry) {
      const userMessage = { id: `${Date.now()}-user`, role: 'user', text: cleanQuestion }
      setMessages((current) => [...current, userMessage])
    }
    setInput('')
    setChatLoading(true)
    retryQuestion.current = cleanQuestion
    try {
      let result
      try {
        result = await askQuestion(videoId, cleanQuestion)
      } catch (error) {
        if (error instanceof ApiError && error.code === 'video_not_indexed') {
          await indexVideo(loadedUrl)
          result = await askQuestion(videoId, cleanQuestion)
        } else {
          throw error
        }
      }
      setMessages((current) => [...current, { id: `${Date.now()}-assistant`, role: 'assistant', text: result.answer, sources: result.sources || [] }])
    } catch (error) {
      const friendly = FRIENDLY_ERRORS[error.code]
      const canRetry = !friendly || ['network_error', 'unknown', 'llm_error'].includes(error.code)
      setMessages((current) => [...current, {
        id: `${Date.now()}-error`, role: 'error',
        text: friendly || 'Something went wrong. Please try again.',
        retry: canRetry ? () => sendQuestion(cleanQuestion, true) : undefined,
      }])
    } finally {
      setChatLoading(false)
    }
  }

  function resetApp() {
    setVideoId('')
    setLoadedUrl('')
    setMessages([])
    setInput('')
    setCurrentTime(0)
    setEmbedError(false)
    setFormError('')
    setUrl('')
    try { window.localStorage.removeItem('youtube-chat-last-url') } catch { /* Storage can be disabled by the browser. */ }
  }

  return (
    <main className="min-h-screen bg-zinc-50 transition-colors dark:bg-[#09090b]">
      <header className="border-b border-zinc-200/80 bg-white/75 dark:border-white/[0.06] dark:bg-[#09090b]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/40" aria-label="YouTube Chat home">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500 text-white"><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.7V8.3l6.3 3.7-6.3 3.7Z" /></svg></span>
            <span className="font-display text-sm font-extrabold tracking-tight">YouTube <span className="text-zinc-400">Chat</span></span>
          </a>
          <span className="hidden items-center gap-2 text-xs text-zinc-400 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Transcript-powered answers</span>
          {videoId && <button type="button" aria-label="Start over" onClick={resetApp} className="rounded-lg px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:hover:bg-white/[0.06] dark:hover:text-white">Start over</button>}
        </div>
      </header>

      {!videoId ? (
        <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/[0.04] blur-[100px] dark:bg-red-500/[0.07]" />
          <div className="relative flex w-full flex-col items-center text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Understand any video</div>
            <h1 className="font-display text-4xl font-extrabold tracking-[-.05em] sm:text-5xl lg:text-6xl">The conversation<br className="sm:hidden" /> starts <span className="text-red-500">here.</span></h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-500 sm:text-base dark:text-zinc-400">Drop in a YouTube link. Get clear answers, grounded in the video, with moments you can jump right to.</p>
            <div className="mt-9"><UrlForm url={url} onChange={setUrl} onSubmit={(event) => { event.preventDefault(); loadVideo() }} loading={indexing} error={formError} /></div>
            <p className="mt-5 flex items-center gap-1.5 text-[10px] text-zinc-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5" aria-hidden="true"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></svg>Answers are grounded in transcript sources</p>
          </div>
        </section>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-5 flex items-center gap-2 text-xs text-zinc-400"><span>Workspace</span><span className="text-zinc-300 dark:text-zinc-700">/</span><span className="font-medium text-zinc-600 dark:text-zinc-300">Video chat</span></div>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(390px,.85fr)] lg:items-start">
            <div ref={playerSectionRef} className="scroll-mt-4"><Player videoId={videoId} hostRef={player.hostRef} isReady={player.isReady} onChangeVideo={resetApp} currentTime={currentTime} embedError={embedError} onSeek={seek} /></div>
            <ChatPanel messages={messages} input={input} setInput={setInput} onSend={sendQuestion} loading={chatLoading} onSeek={seek} currentTime={currentTime} />
          </div>
        </div>
      )}
    </main>
  )
}
