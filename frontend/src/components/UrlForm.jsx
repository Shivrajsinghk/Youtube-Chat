import PropTypes from 'prop-types'

/** Initial form for indexing a YouTube video. */
export default function UrlForm({ url, onChange, onSubmit, loading, error }) {
  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-[0_24px_80px_-45px_rgba(0,0,0,.3)] sm:p-8 dark:border-white/[0.09] dark:bg-[#121215] dark:shadow-[0_24px_80px_-45px_rgba(0,0,0,.9)]">
      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500 text-white shadow-glow">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.7V8.3l6.3 3.7-6.3 3.7Z" /></svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-red-500">Video intelligence</p>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Your video, ready for a conversation</p>
        </div>
      </div>
      <label htmlFor="youtube-url" className="mb-2 block text-sm font-semibold">YouTube URL</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id="youtube-url" type="url" required value={url} onChange={(event) => onChange(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." disabled={loading} className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-red-400 focus:ring-4 focus:ring-red-500/10 disabled:opacity-60 dark:border-white/10 dark:bg-black/20 dark:placeholder:text-zinc-600" />
        <button type="submit" disabled={loading || !url.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-500/25 disabled:cursor-not-allowed disabled:opacity-55">
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />}
          {loading ? 'Loading…' : 'Load video'}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">{error}</p>}
      {loading ? <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />Fetching transcript and building index... this can take 10-30 seconds.</p> : <p className="mt-4 text-xs leading-5 text-zinc-400">Paste a public YouTube link. We’ll find the transcript and prepare it for questions.</p>}
    </form>
  )
}

UrlForm.propTypes = { url: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired, onSubmit: PropTypes.func.isRequired, loading: PropTypes.bool, error: PropTypes.string }
