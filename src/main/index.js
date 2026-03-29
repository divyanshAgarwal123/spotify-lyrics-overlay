import { app, shell, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow = null

function createWindow() {
  // Create transparent, frameless, always-on-top overlay window
  mainWindow = new BrowserWindow({
    width: 420,
    height: 320,
    minWidth: 300,
    minHeight: 200,
    transparent: true,
    frame: false,
    hasShadow: false,
    // Always on top — 'screen-saver' level works over fullscreen apps
    alwaysOnTop: true,
    // Skip the taskbar on Windows so it acts as a true overlay
    skipTaskbar: true,
    // Allow resizing from the renderer's custom resize handle
    resizable: true,
    // Start visible
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // Allow CORS requests to Spotify/lrclib APIs
      webSecurity: false
    }
  })

  // Set always-on-top to 'screen-saver' level for macOS fullscreen overlay
  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  // Make sure the window is visible on all workspaces/desktops
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer based on electron-vite cli
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.spotify-lyrics-overlay')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ── IPC Handlers ─────────────────────────────────────────────

  // Toggle click-through mode — when enabled, clicks pass through to apps behind
  ipcMain.handle('toggle-click-through', (_, enabled) => {
    if (mainWindow) {
      mainWindow.setIgnoreMouseEvents(enabled, { forward: true })
      return enabled
    }
    return false
  })

  // Open URL in system browser (used for Spotify OAuth)
  ipcMain.handle('open-external', (_, url) => {
    shell.openExternal(url)
  })

  // Get window bounds for drag calculations
  ipcMain.handle('get-window-bounds', () => {
    if (mainWindow) return mainWindow.getBounds()
    return null
  })

  // Set window position (for custom drag)
  ipcMain.handle('set-window-position', (_, x, y) => {
    if (mainWindow) mainWindow.setPosition(Math.round(x), Math.round(y))
  })

  // Set window size (for custom resize)
  ipcMain.handle('set-window-size', (_, w, h) => {
    if (mainWindow) mainWindow.setSize(Math.round(w), Math.round(h))
  })

  // ── Global Shortcuts ─────────────────────────────────────────

  // Ctrl+Shift+L (or Cmd+Shift+L on macOS) to toggle overlay visibility
  globalShortcut.register('CommandOrControl+Shift+L', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
      }
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Unregister shortcuts on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
