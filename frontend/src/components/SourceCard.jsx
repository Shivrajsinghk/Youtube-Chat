import PropTypes from 'prop-types'
import TimestampChip from './TimestampChip.jsx'

/** Transcript excerpt linked to its video position. */
export default function SourceCard({ source, active, onSeek }) {
  return (
    <button
      type="button"
      aria-label={`Jump to source at ${source.timestamp}`}
      onClick={() => onSeek(source.start)}
      className={`group block w-full rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-red-500/40 ${active ? 'border-red-500/50 bg-red-500/[0.07]' : 'border-zinc-200 bg-white/70 hover:border-zinc-300 dark:border-white/[0.08] dark:bg-white/[0.025] dark:hover:border-white/15'}`}
    >
      <span className="mb-2 flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-red-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
        <span className="text-[10px] font-bold uppercase tracking-[.16em] text-zinc-400">Video source</span>
        <TimestampChip seconds={source.start} label={source.timestamp} onSeek={onSeek} className="ml-auto" />
      </span>
      <span className="line-clamp-3 block text-xs leading-5 text-zinc-600 transition-colors group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-300">{source.text}</span>
    </button>
  )
}

SourceCard.propTypes = {
  source: PropTypes.shape({ start: PropTypes.number.isRequired, end: PropTypes.number.isRequired, timestamp: PropTypes.string.isRequired, text: PropTypes.string.isRequired }).isRequired,
  active: PropTypes.bool,
  onSeek: PropTypes.func.isRequired,
}
