/**
 * OverlayPanel — Main glassmorphism container
 *
 * Wraps all overlay content in a glass panel with:
 * - Draggable top handle
 * - Resizable bottom-right corner
 * - Click-through mode toggle
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function OverlayPanel({ children, onClickThroughChange }) {
  const [isClickThrough, setIsClickThrough] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, winX: 0, winY: 0 })
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 })

  // ── Custom Drag Implementation ────────────────────────────────
  // We use IPC to move the native window because CSS drag doesn't
  // work well with transparent Electron windows.
  const handleDragStart = useCallback(async (e) => {
    e.preventDefault()
    setIsDragging(true)

    const bounds = await window.api.getWindowBounds()
    dragStartRef.current = {
      x: e.screenX,
      y: e.screenY,
      winX: bounds.x,
      winY: bounds.y
    }

    const handleDragMove = (e) => {
      const dx = e.screenX - dragStartRef.current.x
      const dy = e.screenY - dragStartRef.current.y
      window.api.setWindowPosition(
        dragStartRef.current.winX + dx,
        dragStartRef.current.winY + dy
      )
    }

    const handleDragEnd = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
    }

    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
  }, [])

  // ── Custom Resize Implementation ──────────────────────────────
  const handleResizeStart = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    const bounds = await window.api.getWindowBounds()
    resizeStartRef.current = {
      x: e.screenX,
      y: e.screenY,
      w: bounds.width,
      h: bounds.height
    }

    const handleResizeMove = (e) => {
      const dx = e.screenX - resizeStartRef.current.x
      const dy = e.screenY - resizeStartRef.current.y
      window.api.setWindowSize(
        Math.max(300, resizeStartRef.current.w + dx),
        Math.max(200, resizeStartRef.current.h + dy)
      )
    }

    const handleResizeEnd = () => {
      setIsResizing(false)
      window.removeEventListener('mousemove', handleResizeMove)
      window.removeEventListener('mouseup', handleResizeEnd)
    }

    window.addEventListener('mousemove', handleResizeMove)
    window.addEventListener('mouseup', handleResizeEnd)
  }, [])

  // ── Click-through toggle ──────────────────────────────────────
  const toggleClickThrough = useCallback(async () => {
    const newState = !isClickThrough
    setIsClickThrough(newState)
    if (window.api?.toggleClickThrough) {
      await window.api.toggleClickThrough(newState)
    }
    onClickThroughChange?.(newState)
  }, [isClickThrough, onClickThroughChange])

  // ── Keyboard shortcut for click-through (Ctrl+Shift+C) ────────
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        toggleClickThrough()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleClickThrough])

  return (
    <div className="overlay-panel">
      {/* Glassmorphism container */}
      <div className="glass-container">
        {/* Drag handle — top bar pill */}
        <div
          className="drag-handle"
          onMouseDown={handleDragStart}
          title="Drag to move"
        >
          <div className="drag-pill" />

          {/* Click-through toggle button */}
          <button
            className={`click-through-btn ${isClickThrough ? 'active' : ''}`}
            onClick={toggleClickThrough}
            title={isClickThrough ? 'Click-through ON (clicks pass through)' : 'Click-through OFF'}
          >
            {isClickThrough ? '👻' : '🖱️'}
          </button>
        </div>

        {/* Main content area */}
        <div className="overlay-content">
          {children}
        </div>
      </div>

      {/* Resize handle — bottom-right corner */}
      <div
        className="resize-handle"
        onMouseDown={handleResizeStart}
        title="Drag to resize"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M11 1L1 11M11 5L5 11M11 9L9 11" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  )
}
