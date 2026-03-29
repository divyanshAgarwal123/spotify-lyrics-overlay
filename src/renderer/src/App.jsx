/**
 * App.jsx — Root component for Spotify Lyrics Overlay
 *
 * Orchestrates auth, track polling, lyrics sync, color extraction,
 * and composes all visual components into the overlay.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Services
import { startAuth, exchangeCode, isAuthenticated as checkAuth, clearTokens } from './services/spotifyAuth'
import { extractColors } from './services/colorExtractor'

// Hooks
import { useLyricsSync } from './hooks/useLyricsSync'

// Components
import OverlayPanel from './components/OverlayPanel'
import LyricsDisplay from './components/LyricsDisplay'
import DynamicBackground from './components/DynamicBackground'
import TrackInfo from './components/TrackInfo'

import './App.css'

export default function App() {
  const [authenticated, setAuthenticated] = useState(checkAuth())
  const [colors, setColors] = useState({
    vibrant: '#6366f1',
    muted: '#4b5563',
    darkVibrant: '#1e1b4b',
    darkMuted: '#1f2937',
    lightVibrant: '#a5b4fc',
    lightMuted: '#9ca3af'
  })
  const [clientIdInput, setClientIdInput] = useState(
    localStorage.getItem('spotify_client_id') || ''
  )
  const prevActiveIndexRef = useRef(-1)
  const [beatPulse, setBeatPulse] = useState(false)

  // ── Lyrics sync hook ──────────────────────────────────────────
  const { track, lyrics, activeIndex, isLoading } = useLyricsSync(authenticated)

  // ── Handle OAuth callback ─────────────────────────────────────
  // Check URL for ?code= on mount (redirect from Spotify auth)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      exchangeCode(code)
        .then(() => {
          setAuthenticated(true)
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname)
        })
        .catch((err) => console.error('Auth callback error:', err))
    }
  }, [])

  // ── Extract colors when album art changes ─────────────────────
  useEffect(() => {
    if (track?.albumArt) {
      extractColors(track.albumArt).then(setColors)
    }
  }, [track?.albumArt])

  // ── Beat pulse on lyric line change ───────────────────────────
  useEffect(() => {
    if (activeIndex !== prevActiveIndexRef.current && activeIndex >= 0) {
      prevActiveIndexRef.current = activeIndex
      setBeatPulse(true)
      const timer = setTimeout(() => setBeatPulse(false), 300)
      return () => clearTimeout(timer)
    }
  }, [activeIndex])

  // ── Auth handler ──────────────────────────────────────────────
  const handleConnect = useCallback(() => {
    if (!clientIdInput.trim()) {
      alert('Please enter your Spotify Client ID')
      return
    }
    startAuth(clientIdInput.trim())
  }, [clientIdInput])

  const handleLogout = useCallback(() => {
    clearTokens()
    setAuthenticated(false)
  }, [])

  // ── Login Screen ──────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="app-root">
        <DynamicBackground colors={colors} isPlaying={false} />
        <OverlayPanel>
          <div className="auth-screen">
            <motion.div
              className="auth-logo"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            >
              🎵
            </motion.div>
            <motion.h1
              className="auth-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Lyrics Overlay
            </motion.h1>
            <motion.p
              className="auth-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.4 }}
            >
              Real-time synced lyrics for Spotify
            </motion.p>

            <motion.div
              className="auth-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <input
                type="text"
                placeholder="Enter Spotify Client ID"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                className="client-id-input"
              />
              <button className="connect-btn" onClick={handleConnect}>
                Connect to Spotify
              </button>
            </motion.div>

            <motion.p
              className="auth-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 0.8 }}
            >
              Create an app at developer.spotify.com
            </motion.p>
          </div>
        </OverlayPanel>
      </div>
    )
  }

  // ── Main Overlay ──────────────────────────────────────────────
  return (
    <div className="app-root">
      <DynamicBackground colors={colors} isPlaying={beatPulse} />

      <OverlayPanel>
        <div className="main-content">
          {/* Loading state */}
          {isLoading && (
            <motion.div
              className="loading-indicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="spinner" />
              <p>Finding lyrics...</p>
            </motion.div>
          )}

          {/* Lyrics display */}
          {!isLoading && (
            <LyricsDisplay
              lyrics={lyrics.synced}
              activeIndex={activeIndex}
              hasSynced={lyrics.hasSynced}
              plainLines={lyrics.plainLines}
            />
          )}

          {/* No track playing */}
          {!track && !isLoading && (
            <motion.div
              className="no-track"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="no-track-icon">🎧</p>
              <p className="no-track-text">Play something on Spotify</p>
            </motion.div>
          )}
        </div>

        {/* Track info bar at the bottom */}
        <TrackInfo track={track} />

        {/* Logout button (subtle) */}
        <button className="logout-btn" onClick={handleLogout} title="Disconnect Spotify">
          ✕
        </button>
      </OverlayPanel>
    </div>
  )
}
