import { useCallback, useEffect, useRef, useState } from 'react'

let apiPromise

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve(window.YT)
      }
      if (!document.querySelector('script[data-youtube-iframe-api]')) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        script.async = true
        script.dataset.youtubeIframeApi = 'true'
        document.head.appendChild(script)
      }
    })
  }
  return apiPromise
}

/** Loads and controls one YouTube IFrame player. */
export default function useYouTubePlayer(videoId, onPosition, onEmbedError) {
  const hostRef = useRef(null)
  const playerRef = useRef(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let active = true
    setIsReady(false)
    loadYouTubeApi().then((YT) => {
      if (!active || !hostRef.current) return
      playerRef.current?.destroy()
      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onReady: () => active && setIsReady(true),
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) onPosition?.(playerRef.current.getCurrentTime())
          },
          onError: (event) => {
            if ([101, 150].includes(event.data)) onEmbedError?.()
          },
        },
      })
    })
    return () => {
      active = false
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoId, onEmbedError, onPosition])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const player = playerRef.current
      if (player?.getPlayerState && player.getPlayerState() === 1) {
        onPosition?.(player.getCurrentTime())
      }
    }, 500)
    return () => window.clearInterval(timer)
  }, [onPosition])

  const seekTo = useCallback((seconds) => {
    if (!playerRef.current || !isReady) return
    playerRef.current.seekTo(seconds, true)
    playerRef.current.playVideo()
  }, [isReady])

  const getCurrentTime = useCallback(() => playerRef.current?.getCurrentTime?.() || 0, [])
  return { hostRef, seekTo, getCurrentTime, isReady }
}
