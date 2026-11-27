const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(code, message, status = 0) {
    super(message || 'Something went wrong.')
    this.name = 'ApiError'
    this.code = code || 'unknown'
    this.message = message || 'Something went wrong.'
    this.status = status
  }
}

async function post(path, body) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError('network_error', 'Could not connect to the server.')
  }

  let payload
  try { payload = await response.json() } catch { payload = null }
  if (!response.ok) {
    const error = payload?.error
    throw new ApiError(error?.code || 'unknown', error?.message || 'The request could not be completed.', response.status)
  }
  return payload
}

export const indexVideo = (url) => post('/api/videos', { url })
export const askQuestion = (video_id, question) => post('/api/chat', { video_id, question })
