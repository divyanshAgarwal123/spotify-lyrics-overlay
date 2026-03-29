# 🎵 Spotify Lyrics Overlay

A stunning desktop overlay that displays **real-time synced lyrics** for the currently playing Spotify track, with antigravity floating animations, dynamic album-art color gradients, and glassmorphism effects.

![Electron](https://img.shields.io/badge/Electron-39+-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-11+-0055FF)

## ✨ Features

- **Real-time Lyrics Sync** — Lyrics from [lrclib.net](https://lrclib.net) synced to Spotify playback
- **Antigravity Animation** — Active line glows and floats center-stage; past lines drift up and fade; upcoming lines rise from below
- **Dynamic Color Palette** — Album art colors extracted in real-time to create gradient mesh backgrounds
- **Glassmorphism UI** — Frosted glass overlay with `backdrop-blur`, soft borders, and subtle shadows
- **Particle System** — Floating musical notes & dots that pulse on beat changes
- **Always-On-Top** — Works over fullscreen apps (`screen-saver` level)
- **Draggable & Resizable** — Move and resize the overlay anywhere on screen
- **Click-Through Mode** — Toggle to click apps behind the overlay (🖱️ button or `Ctrl+Shift+C`)
- **Show/Hide Hotkey** — `Ctrl+Shift+L` (or `Cmd+Shift+L` on macOS)
- **Graceful Fallback** — Animated waveform placeholder when no lyrics are found

## 🚀 Setup

### 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Set **Redirect URI** to: `http://localhost:5173/callback`
4. Note your **Client ID**

### 2. Install & Run

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/spotify-lyrics-overlay.git
cd spotify-lyrics-overlay

# Install dependencies
npm install

# Start development mode
npm run dev
```

### 3. Connect to Spotify

1. The overlay opens with a login screen
2. Paste your **Spotify Client ID**
3. Click **Connect to Spotify** — authorize in your browser
4. Play a track in Spotify — lyrics appear automatically!

## 🎨 Architecture

```
src/
├── main/
│   └── index.js              # Electron main process (transparent window, hotkeys)
├── preload/
│   └── index.js              # Secure IPC bridge
└── renderer/
    ├── index.html             # Entry HTML with CSP config
    └── src/
        ├── App.jsx            # Root component (auth + orchestration)
        ├── App.css            # Glassmorphism styles + Playfair Display font
        ├── services/
        │   ├── spotifyAuth.js     # PKCE OAuth 2.0 flow
        │   ├── spotifyPlayer.js   # Currently-playing polling
        │   ├── lyricsService.js   # lrclib.net fetch + LRC parser
        │   └── colorExtractor.js  # node-vibrant palette extraction
        ├── hooks/
        │   └── useLyricsSync.js   # rAF-driven lyric sync hook
        └── components/
            ├── LyricsDisplay.jsx      # Antigravity Framer Motion lyrics
            ├── DynamicBackground.jsx  # Gradient mesh + particle canvas
            ├── OverlayPanel.jsx       # Glass container + drag/resize
            └── TrackInfo.jsx          # Album art + track metadata
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+L` | Show / hide overlay |
| `Ctrl+Shift+C` | Toggle click-through mode |

## 🔧 Tech Stack

- **Electron** + **electron-vite** — Desktop overlay runtime
- **React 18** — UI framework
- **Framer Motion** — Spring-physics animations
- **node-vibrant** — Album art color extraction
- **lrclib.net** — Free synced lyrics API (no key needed)
- **Spotify Web API** — OAuth 2.0 PKCE + currently-playing endpoint

## 📝 License

MIT
