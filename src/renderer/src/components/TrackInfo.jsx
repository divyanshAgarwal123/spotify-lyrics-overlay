/**
 * TrackInfo — Album art + track name + artist display
 *
 * Shows at the bottom-left of the overlay: small round album art
 * with the track title and artist name beside it.
 */

import { motion } from 'framer-motion'

export default function TrackInfo({ track }) {
  if (!track) return null

  return (
    <motion.div
      className="track-info"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      key={track.trackId}
    >
      {/* Album art thumbnail — 48px circle */}
      {track.albumArt && (
        <motion.img
          src={track.albumArt}
          alt={track.albumName}
          className="album-art"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />
      )}

      <div className="track-details">
        <p className="track-name">{track.trackName}</p>
        <p className="artist-name">{track.artistName}</p>
      </div>
    </motion.div>
  )
}
