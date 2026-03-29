/**
 * LyricsDisplay — Antigravity lyrics animation component
 *
 * Renders 5 lyric lines (2 past, 1 active, 2 upcoming) with Framer Motion
 * spring-physics animations that create a weightless, floating feel.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'

// ── Animation Variants ──────────────────────────────────────────

// Active line: springs into center with slight overshoot
const activeVariants = {
  initial: {
    y: 40,
    opacity: 0.2,
    scale: 0.9,
    filter: 'blur(4px)'
  },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1.05,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1] // springy overshoot
    }
  },
  exit: {
    y: -60,
    opacity: 0,
    scale: 0.95,
    filter: 'blur(2px)',
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1] // smooth float away
    }
  }
}

// Past lines: fading upward
const pastVariants = {
  initial: { y: 0, opacity: 0.4 },
  animate: (distance) => ({
    y: -30 * distance,
    opacity: Math.max(0.15, 0.4 - distance * 0.15),
    scale: 0.95,
    filter: `blur(${distance * 1.5}px)`,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1]
    }
  }),
  exit: {
    y: -80,
    opacity: 0,
    transition: { duration: 0.4 }
  }
}

// Upcoming lines: rising from below, blurred
const upcomingVariants = {
  initial: {
    y: 50,
    opacity: 0,
    scale: 0.9,
    filter: 'blur(5px)'
  },
  animate: (distance) => ({
    y: 20 + distance * 15,
    opacity: Math.max(0.1, 0.25 - distance * 0.08),
    scale: 0.9,
    filter: `blur(${3 + distance}px)`,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }),
  exit: {
    y: 0,
    opacity: 0.4,
    transition: { duration: 0.3 }
  }
}

export default function LyricsDisplay({ lyrics, activeIndex, hasSynced, plainLines }) {
  // ── Build the visible 5-line window ────────────────────────────
  const visibleLines = useMemo(() => {
    if (!hasSynced || !lyrics.length) return []

    const lines = []

    // 2 past lines
    for (let i = 2; i >= 1; i--) {
      const idx = activeIndex - i
      if (idx >= 0 && idx < lyrics.length) {
        lines.push({ ...lyrics[idx], type: 'past', distance: i, idx })
      }
    }

    // Active line
    if (activeIndex >= 0 && activeIndex < lyrics.length) {
      lines.push({ ...lyrics[activeIndex], type: 'active', distance: 0, idx: activeIndex })
    }

    // 2 upcoming lines
    for (let i = 1; i <= 2; i++) {
      const idx = activeIndex + i
      if (idx >= 0 && idx < lyrics.length) {
        lines.push({ ...lyrics[idx], type: 'upcoming', distance: i, idx })
      }
    }

    return lines
  }, [lyrics, activeIndex, hasSynced])

  // ── Unsynced lyrics fallback (slow scroll) ─────────────────────
  if (!hasSynced && plainLines && plainLines.length > 0) {
    return (
      <div className="lyrics-container lyrics-unsynced">
        <div className="unsynced-scroll">
          {plainLines.map((line, i) => (
            <motion.p
              key={i}
              className="lyric-line lyric-unsynced"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.6, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              {line}
            </motion.p>
          ))}
        </div>
      </div>
    )
  }

  // ── No lyrics at all ───────────────────────────────────────────
  if (!hasSynced && (!plainLines || plainLines.length === 0)) {
    return (
      <div className="lyrics-container lyrics-empty">
        <WaveformPlaceholder />
        <p className="no-lyrics-text">No lyrics available</p>
      </div>
    )
  }

  // ── Synced lyrics with antigravity animation ───────────────────
  return (
    <motion.div
      className="lyrics-container"
      // Beat pulse: scales gently on each line change
      key={`pulse-${activeIndex}`}
      initial={{ scale: 1.0 }}
      animate={{ scale: [1.0, 1.02, 1.0] }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <AnimatePresence mode="popLayout">
        {visibleLines.map((line) => {
          const variantSet =
            line.type === 'active'
              ? activeVariants
              : line.type === 'past'
                ? pastVariants
                : upcomingVariants

          return (
            <motion.p
              key={`${line.idx}-${line.text}`}
              className={`lyric-line lyric-${line.type}`}
              custom={line.distance}
              variants={variantSet}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
            >
              {line.text}
            </motion.p>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Waveform Placeholder ────────────────────────────────────────
// Animated bars that show when no lyrics are available
function WaveformPlaceholder() {
  const bars = [0.4, 0.7, 1.0, 0.6, 0.85, 0.5, 0.9, 0.3, 0.75, 0.55]

  return (
    <div className="waveform">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="waveform-bar"
          animate={{
            scaleY: [height * 0.3, height, height * 0.5, height * 0.8, height * 0.3],
            opacity: [0.3, 0.7, 0.5, 0.6, 0.3]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}
