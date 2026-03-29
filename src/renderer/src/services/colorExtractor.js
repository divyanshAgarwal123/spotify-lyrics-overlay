/**
 * Color Extraction Service
 *
 * Extracts dominant colors from album art using node-vibrant.
 * Returns a palette used for dynamic background gradients.
 */

import Vibrant from 'node-vibrant'

// Cache the last extracted palette to avoid re-processing the same image
let cachedUrl = null
let cachedPalette = null

/**
 * Extract a color palette from an album art URL.
 *
 * @param {string} imageUrl - URL of the album art
 * @returns {Object} { vibrant, muted, darkVibrant, darkMuted, lightVibrant, lightMuted }
 *                   Each is a hex color string, with sensible defaults if extraction fails.
 */
export async function extractColors(imageUrl) {
  if (!imageUrl) return getDefaultPalette()

  // Return cached result if same image
  if (imageUrl === cachedUrl && cachedPalette) {
    return cachedPalette
  }

  try {
    const palette = await Vibrant.from(imageUrl)
      .quality(1) // Fast extraction (1 = lowest quality, fastest)
      .getPalette()

    const result = {
      vibrant: palette.Vibrant?.hex || '#6366f1',
      muted: palette.Muted?.hex || '#4b5563',
      darkVibrant: palette.DarkVibrant?.hex || '#1e1b4b',
      darkMuted: palette.DarkMuted?.hex || '#1f2937',
      lightVibrant: palette.LightVibrant?.hex || '#a5b4fc',
      lightMuted: palette.LightMuted?.hex || '#9ca3af'
    }

    cachedUrl = imageUrl
    cachedPalette = result
    return result
  } catch (err) {
    console.warn('Color extraction failed:', err)
    return getDefaultPalette()
  }
}

/** Default purple/indigo palette when no album art is available */
function getDefaultPalette() {
  return {
    vibrant: '#6366f1',
    muted: '#4b5563',
    darkVibrant: '#1e1b4b',
    darkMuted: '#1f2937',
    lightVibrant: '#a5b4fc',
    lightMuted: '#9ca3af'
  }
}
