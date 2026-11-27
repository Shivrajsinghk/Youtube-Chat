import PropTypes from 'prop-types'
import { formatTime } from '../utils/time.js'

/** Embedded YouTube player and video controls. */
export default function Player({ videoId, hostRef, isReady, onChangeVideo, currentTime, embedError, onSeek }) {
  const youtubeUrl = `https://youtu.be/${videoId}?t=${Math.floor(currentTime)}`
  return (
    <section className="lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-xl shadow-zinc-900/10 dark:border-white/10 dark:shadow-black/30">
        <div className="relative aspect-video w-full">
          <div ref={hostRef} className="absolute inset-0 h-full w-full" />
          {!isReady && !embedError && <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-zinc-500"><span className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-red-500" /></div>}
          {embedError && <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 px-6 text-center text-white"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-red-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M12 8v4m0 4h.01M10.3 3.9 1.8 18.2A1.5 1.5 0 0 0 3.1 20.5h17.8a1.5 1.5 0 0 0 1.3-2.3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg></div><p className="max-w-xs text-sm font-semibold">This video can’t be embedded here.</p><a href={youtubeUrl} target="_blank" rel="noreferrer" className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400">Open on YouTube at {formatTime(currentTime)}</a></div>}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{isReady ? 'Video ready' : 'Loading player'}</span>
        <button type="button" aria-label="Change video" onClick={onChangeVideo} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-white/20 dark:hover:text-white">Change video</button>
      </div>
    </section>
  )
}

Player.propTypes = { videoId: PropTypes.string.isRequired, hostRef: PropTypes.object.isRequired, isReady: PropTypes.bool, onChangeVideo: PropTypes.func.isRequired, currentTime: PropTypes.number, embedError: PropTypes.bool, onSeek: PropTypes.func }
