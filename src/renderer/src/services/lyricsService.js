/**
 * Lyrics Service
 *
 * Fetches synced (LRC) or plain lyrics from lrclib.net — a free,
 * no-API-key-needed lyrics database.
 */

const LRCLIB_BASE = 'https://lrclib.net/api'

/**
 * Parse an LRC-format string into an array of { time, text } objects.
 * LRC format: [mm:ss.xx] Lyric text
 *
 * @param {string} lrcString - Raw LRC content
 * @returns {Array<{time: number, text: string}>} Parsed lyrics sorted by time (ms)
 */
export function parseLRC(lrcString) {
  if (!lrcString) return []

  const lines = lrcString.split('\n')
  const lyrics = []

  for (const line of lines) {
    // Match [mm:ss.xx] or [mm:ss.xxx] patterns
    const match = line.match(/\[(\d+):(\d+)\.(\d+)\]\s*(.*)/)
    if (match) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      // Handle both .xx and .xxx precision
      const msStr = match[3].padEnd(3, '0').slice(0, 3)
      const ms = parseInt(msStr, 10)
      const text = match[4].trim()

      // Skip empty lines (instrumental breaks)
      if (text) {
        lyrics.push({
          time: minutes * 60000 + seconds * 1000 + ms,
          text
        })
      }
    }
  }

  // Sort by timestamp to ensure correct order
  return lyrics.sort((a, b) => a.time - b.time)
}

/**
 * Fetch lyrics for a given track from lrclib.net.
 *
 * @param {string} trackName
 * @param {string} artistName
 * @param {string} albumName
 * @returns {Object} { synced: [{time, text}], plain: string|null, hasSynced: boolean }
 */
export async function fetchLyrics(trackName, artistName, albumName) {
  try {
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
      album_name: albumName
    })

    const response = await fetch(`${LRCLIB_BASE}/get?${params.toString()}`)

    if (!response.ok) {
      // Try searching without album name as fallback
      if (albumName) {
        return fetchLyrics(trackName, artistName, '')
      }
      return { synced: [], plain: null, hasSynced: false }
    }

    const data = await response.json()

    // Prefer synced lyrics, fallback to plain text
    if (data.syncedLyrics) {
      return {
        synced: parseLRC(data.syncedLyrics),
        plain: data.plainLyrics || null,
        hasSynced: true
      }
    }

    // If only plain lyrics available, create a slow scroll version
    if (data.plainLyrics) {
      const lines = data.plainLyrics
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      return {
        synced: [],
        plain: data.plainLyrics,
        plainLines: lines,
        hasSynced: false
      }
    }

    return { synced: [], plain: null, hasSynced: false }
  } catch (err) {
    console.error('Failed to fetch lyrics:', err)
    return { synced: [], plain: null, hasSynced: false }
  }
}

/**
 * Find the current active lyric line index based on playback progress.
 *
 * @param {Array<{time: number, text: string}>} lyrics - Sorted lyrics array
 * @param {number} progressMs - Current playback position in milliseconds
 * @returns {number} Index of the active lyric line (-1 if before first line)
 */
export function findActiveLine(lyrics, progressMs) {
  if (!lyrics.length) return -1

  // Binary search for the last line whose timestamp <= progressMs
  let low = 0
  let high = lyrics.length - 1
  let result = -1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (lyrics[mid].time <= progressMs) {
      result = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return result
}
