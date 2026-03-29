/**
 * useLyricsSync — React hook for real-time lyric synchronization
 *
 * Manages the active lyric line based on Spotify playback progress.
 * Uses local timer interpolation between API polls for smooth tracking.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { getCurrentlyPlaying } from '../services/spotifyPlayer'
import { fetchLyrics, findActiveLine } from '../services/lyricsService'

/**
 * @param {boolean} isAuthenticated - Whether Spotify auth is complete
 * @returns {Object} { track, lyrics, activeIndex, isLoading, error }
 */
export function useLyricsSync(isAuthenticated) {
  const [track, setTrack] = useState(null)
  const [lyrics, setLyrics] = useState({ synced: [], plain: null, hasSynced: false })
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Refs for timer-based interpolation between API polls
  const progressRef = useRef(0)
  const lastPollTimeRef = useRef(0)
  const isPlayingRef = useRef(false)
  const rafRef = useRef(null)
  const pollIntervalRef = useRef(null)
  const currentTrackIdRef = useRef(null)

  // ── Lyrics fetching ───────────────────────────────────────────
  const loadLyrics = useCallback(async (trackName, artistName, albumName) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchLyrics(trackName, artistName, albumName)
      setLyrics(result)
    } catch (err) {
      setError('Failed to load lyrics')
      setLyrics({ synced: [], plain: null, hasSynced: false })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Spotify polling loop ──────────────────────────────────────
  const pollNowPlaying = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const data = await getCurrentlyPlaying()

      if (!data) {
        setTrack(null)
        isPlayingRef.current = false
        return
      }

      setTrack(data)
      isPlayingRef.current = data.isPlaying

      // Update progress reference for interpolation
      progressRef.current = data.progress_ms
      lastPollTimeRef.current = performance.now()

      // If track changed, fetch new lyrics
      if (data.trackId !== currentTrackIdRef.current) {
        currentTrackIdRef.current = data.trackId
        await loadLyrics(data.trackName, data.artistName, data.albumName)
      }
    } catch (err) {
      console.error('Polling error:', err)
    }
  }, [isAuthenticated, loadLyrics])

  // ── requestAnimationFrame loop for smooth line tracking ───────
  // Interpolates progress between 1s API polls so lyric transitions
  // feel seamless rather than jumping once per second.
  const updateActiveIndex = useCallback(() => {
    if (lyrics.hasSynced && lyrics.synced.length > 0 && isPlayingRef.current) {
      // Calculate interpolated progress: last known + elapsed time since last poll
      const elapsed = performance.now() - lastPollTimeRef.current
      const currentProgress = progressRef.current + elapsed

      const newIndex = findActiveLine(lyrics.synced, currentProgress)
      setActiveIndex((prev) => {
        if (prev !== newIndex) return newIndex
        return prev
      })
    }

    rafRef.current = requestAnimationFrame(updateActiveIndex)
  }, [lyrics])

  // ── Start/stop polling and rAF based on auth state ────────────
  useEffect(() => {
    if (!isAuthenticated) return

    // Start polling every 1 second
    pollNowPlaying() // Initial poll
    pollIntervalRef.current = setInterval(pollNowPlaying, 1000)

    // Start rAF loop for smooth lyric tracking
    rafRef.current = requestAnimationFrame(updateActiveIndex)

    return () => {
      clearInterval(pollIntervalRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isAuthenticated, pollNowPlaying, updateActiveIndex])

  return {
    track,
    lyrics,
    activeIndex,
    isLoading,
    error
  }
}
