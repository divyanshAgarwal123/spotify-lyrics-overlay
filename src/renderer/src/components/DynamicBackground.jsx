/**
 * DynamicBackground — Album-art-reactive gradient mesh + particle system
 *
 * Creates an animated background using colors extracted from the current
 * album art, with floating particle dots for visual depth.
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'

export default function DynamicBackground({ colors, isPlaying }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const rafRef = useRef(null)

  // ── Gradient mesh background styles ───────────────────────────
  const gradientStyle = useMemo(
    () => ({
      background: `
        radial-gradient(ellipse at 20% 50%, ${colors.vibrant}44 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, ${colors.lightVibrant}33 0%, transparent 50%),
        radial-gradient(ellipse at 50% 80%, ${colors.muted}44 0%, transparent 50%),
        radial-gradient(ellipse at 90% 90%, ${colors.darkVibrant}55 0%, transparent 40%),
        linear-gradient(135deg, ${colors.darkMuted} 0%, ${colors.darkVibrant} 100%)
      `
    }),
    [colors]
  )

  // ── Particle system on canvas ─────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    // Size canvas to container
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
    resize()

    // Initialize particles — floating dots / musical notes
    const PARTICLE_COUNT = 20
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      return {
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -(Math.random() * 0.4 + 0.1), // Float upward (antigravity!)
        opacity: Math.random() * 0.4 + 0.1,
        // Musical note symbols for some particles
        isNote: Math.random() > 0.7,
        noteType: ['♪', '♫', '♩', '♬'][Math.floor(Math.random() * 4)],
        pulse: 0 // For beat reaction
      }
    })

    // Animation loop
    const animate = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      for (const p of particlesRef.current) {
        // Move particle (always float upward for antigravity effect)
        p.x += p.speedX
        p.y += p.speedY

        // Decay beat pulse
        if (p.pulse > 0) p.pulse *= 0.95

        // Wrap around edges
        if (p.y < -10) p.y = rect.height + 10
        if (p.x < -10) p.x = rect.width + 10
        if (p.x > rect.width + 10) p.x = -10

        const currentSize = p.size + p.pulse * 3

        if (p.isNote) {
          // Draw musical note symbol
          ctx.font = `${12 + p.pulse * 8}px serif`
          ctx.fillStyle = `${colors.lightVibrant}${Math.floor(p.opacity * 255)
            .toString(16)
            .padStart(2, '0')}`
          ctx.fillText(p.noteType, p.x, p.y)
        } else {
          // Draw glowing dot
          ctx.beginPath()
          ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2)
          ctx.fillStyle = `${colors.vibrant}${Math.floor(p.opacity * 255)
            .toString(16)
            .padStart(2, '0')}`
          ctx.fill()
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [colors])

  // ── Trigger particle pulse (called externally on lyric change) ─
  useEffect(() => {
    // Make particles react — pulse up when a new beat/line hits
    if (isPlaying) {
      for (const p of particlesRef.current) {
        p.pulse = Math.random() * 0.5 + 0.5
      }
    }
  }, [isPlaying])

  return (
    <div className="dynamic-background">
      {/* Animated gradient mesh layer */}
      <motion.div
        className="gradient-mesh"
        style={gradientStyle}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Particle canvas layer */}
      <canvas ref={canvasRef} className="particle-canvas" />
    </div>
  )
}

/**
 * Trigger a beat pulse on the particle system.
 * Call this from the parent when the active lyric line changes.
 */
export function triggerBeatPulse(particlesRef) {
  if (!particlesRef?.current) return
  for (const p of particlesRef.current) {
    p.pulse = Math.random() * 0.8 + 0.4
  }
}
