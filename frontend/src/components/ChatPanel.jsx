import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import MessageBubble from './MessageBubble.jsx'

const EXAMPLES = ['What is this video about?', 'What are the key points?', 'Where does the speaker talk about <topic>?']

/** Chat transcript and composer. */
export default function ChatPanel({ messages, input, setInput, onSend, loading, onSeek, currentTime }) {
  const listRef = useRef(null)
  const inputRef = useRef(null)
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, loading])

  function submit(event) {
    event.preventDefault()
    onSend(input)
  }
  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSend(input)
    }
  }

  return (
    <section className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#111114] lg:h-[calc(100vh-7rem)] lg:min-h-[620px]">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-white/[0.07]">
        <div><h2 className="font-display text-sm font-bold">Ask this video</h2><p className="mt-0.5 text-xs text-zinc-400">Answers grounded in the transcript</p></div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Ready</span>
      </header>
      <div ref={listRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5" aria-live="polite" aria-label="Conversation">
        {messages.length === 0 && <div className="flex min-h-full flex-col items-center justify-center px-2 py-8 text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true"><path d="M8 10h8M8 14h5m-8 7 3.5-3H18a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 2 2.8Z" /></svg></div><p className="font-display text-sm font-bold">Start with a question</p><p className="mt-1 max-w-xs text-xs leading-5 text-zinc-400">Pick a prompt or ask about a specific moment in the video.</p><div className="mt-5 grid w-full max-w-sm gap-2">{EXAMPLES.map((example) => <button key={example} type="button" onClick={() => { setInput(example); inputRef.current?.focus() }} className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 text-left text-xs font-medium text-zinc-600 transition hover:border-red-500/30 hover:bg-red-500/[0.04] hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:border-white/[0.08] dark:bg-white/[0.025] dark:text-zinc-300 dark:hover:text-white">{example}<span className="float-right text-zinc-400">↗</span></button>)}</div></div>}
        {messages.map((message) => <MessageBubble key={message.id} message={message} onSeek={onSeek} currentTime={currentTime} />)}
        {loading && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-zinc-200 bg-zinc-50 px-4 py-3.5 dark:border-white/[0.07] dark:bg-white/[0.03]"><div className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400" /><div className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400" /><div className="typing-dot h-1.5 w-1.5 rounded-full bg-zinc-400" /><span className="ml-1 text-xs text-zinc-400">Thinking from the transcript</span></div></div>}
      </div>
      <form onSubmit={submit} className="shrink-0 border-t border-zinc-100 p-3 sm:p-4 dark:border-white/[0.07]">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2 transition focus-within:border-red-400 focus-within:ring-4 focus-within:ring-red-500/[0.07] dark:border-white/10 dark:bg-black/20">
          <label htmlFor="chat-input" className="sr-only">Ask a question about this video</label>
          <textarea ref={inputRef} id="chat-input" rows="2" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} disabled={loading} placeholder="Ask a question about this video…" className="max-h-32 min-h-[48px] w-full resize-y bg-transparent px-2 py-1 text-sm leading-6 outline-none placeholder:text-zinc-400 disabled:opacity-60 dark:placeholder:text-zinc-600" />
          <div className="flex items-center justify-between px-1 pb-0.5"><span className="text-[10px] text-zinc-400">Enter to send · Shift + Enter for new line</span><button type="submit" disabled={loading || !input.trim()} aria-label="Send question" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-40"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path d="m5 12 14-7-4 14-3-6-7-1Zm7 1 7-8" /></svg></button></div>
        </div>
        <p className="mt-2 text-center text-[10px] text-zinc-400">Each question is answered independently.</p>
      </form>
    </section>
  )
}

ChatPanel.propTypes = { messages: PropTypes.array.isRequired, input: PropTypes.string.isRequired, setInput: PropTypes.func.isRequired, onSend: PropTypes.func.isRequired, loading: PropTypes.bool, onSeek: PropTypes.func.isRequired, currentTime: PropTypes.number }
