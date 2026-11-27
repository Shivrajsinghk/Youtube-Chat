import PropTypes from 'prop-types'
import { formatTime } from '../utils/time.js'

/** Clickable video timestamp. */
export default function TimestampChip({ seconds, label, onSeek, className = '' }) {
  return (
    <button
      type="button"
      aria-label={`Seek to ${label || formatTime(seconds)}`}
      onClick={() => onSeek(seconds)}
      className={`inline-flex items-center rounded-md border border-red-500/20 bg-red-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-red-600 transition hover:border-red-500/40 hover:bg-red-500/15 focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:text-red-300 ${className}`}
    >
      {label || formatTime(seconds)}
    </button>
  )
}

TimestampChip.propTypes = {
  seconds: PropTypes.number.isRequired,
  label: PropTypes.string,
  onSeek: PropTypes.func.isRequired,
  className: PropTypes.string,
}
