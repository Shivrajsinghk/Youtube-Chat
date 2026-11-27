import PropTypes from 'prop-types'
import SourceCard from './SourceCard.jsx'
import TimestampChip from './TimestampChip.jsx'
import { parseTimestamp } from '../utils/time.js'

const TIMESTAMP_PARTS = /(\[(?:\d{1,2}:)?\d{1,2}:\d{2}\])/g
const TIMESTAMP_TOKEN = /^\[(?:\d{1,2}:)?\d{1,2}:\d{2}\]$/

function AnswerText({ text, onSeek }) {
  return text.split(TIMESTAMP_PARTS).map((part, index) => {
    if (TIMESTAMP_TOKEN.test(part)) {
      const seconds = parseTimestamp(part)
      if (seconds !== null) return <TimestampChip key={`${part}-${index}`} seconds={seconds} label={part.slice(1, -1)} onSeek={onSeek} className="mx-0.5 align-baseline" />
    }
    return <span key={`text-${index}`}>{part}</span>
  })
}

AnswerText.propTypes = { text: PropTypes.string.isRequired, onSeek: PropTypes.func.isRequired }

/** Renders a user, assistant, or error message. */
export default function MessageBubble({ message, onSeek, currentTime }) {
  if (message.role === 'user') {
    return <div className="flex justify-end"><div className="max-w-[88%] rounded-2xl rounded-br-md bg-zinc-900 px-4 py-3 text-sm leading-6 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">{message.text}</div></div>
  }
  if (message.role === 'error') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[92%] rounded-2xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm leading-6 text-red-700 dark:text-red-200">
          <p>{message.text}</p>
          {message.retry && <button type="button" onClick={message.retry} className="mt-2 inline-flex rounded-lg border border-red-500/25 px-3 py-1 text-xs font-semibold hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/40">Retry</button>}
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start">
      <div className="min-w-0 max-w-[96%] rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-3.5 shadow-sm dark:border-white/[0.07] dark:bg-[#131316]">
        <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300"><AnswerText text={message.text} onSeek={onSeek} /></div>
        {!!message.sources?.length && (
          <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-white/[0.07]">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-zinc-400">Sources</p>
            <div className="grid gap-2">{message.sources.map((source, index) => {
              const active = currentTime >= source.start && currentTime <= source.end
              return <SourceCard key={`${source.start}-${index}`} source={source} active={active} onSeek={onSeek} />
            })}</div>
          </div>
        )}
      </div>
    </div>
  )
}

MessageBubble.propTypes = {
  message: PropTypes.shape({ role: PropTypes.string.isRequired, text: PropTypes.string.isRequired, sources: PropTypes.array, retry: PropTypes.func }),
  onSeek: PropTypes.func.isRequired,
  currentTime: PropTypes.number,
}
