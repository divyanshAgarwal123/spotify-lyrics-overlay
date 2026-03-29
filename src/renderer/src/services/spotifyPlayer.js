/**
 * Spotify Player Service
 *
 * Provides real-time currently-playing data by polling the Spotify Web API.
 * Returns track metadata, playback progress, and album art.
 */

import { getAccessToken } from './spotifyAuth'

const CURRENTLY_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing'

/**
 * Fetch the currently playing track from Spotify.
 * Returns null if nothing is playing.
 *
 * @returns {Object|null} { trackName, artistName, albumName, albumArt, progress_ms, duration_ms, isPlaying }
 */
export async function getCurrentlyPlaying() {
  try {
    const token = await getAccessToken()

    const response = await fetch(CURRENTLY_PLAYING_URL, {
      headers: { Authorization: `Bearer ${token}` }
    })

    // 204 = no content (nothing playing)
    if (response.status === 204 || response.status === 202) {
      return null
    }

    if (!response.ok) {
      console.warn('Spotify API error:', response.status)
      return null
    }

    const data = await response.json()

    // Only handle track type (not episodes, etc.)
    if (!data.item || data.currently_playing_type !== 'track') {
      return null
    }

    return {
      trackName: data.item.name,
      artistName: data.item.artists.map((a) => a.name).join(', '),
      albumName: data.item.album.name,
      // Prefer 300px album art for color extraction, fallback to first available
      albumArt:
        data.item.album.images.find((img) => img.width === 300)?.url ||
        data.item.album.images[0]?.url ||
        '',
      progress_ms: data.progress_ms,
      duration_ms: data.item.duration_ms,
      isPlaying: data.is_playing,
      // Unique ID to detect track changes
      trackId: data.item.id
    }
  } catch (err) {
    console.error('Failed to fetch currently playing:', err)
    return null
  }
}
