import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Secure bridge: only expose specific IPC channels to the renderer
const overlayAPI = {
  // Toggle click-through mode on/off
  toggleClickThrough: (enabled) => ipcRenderer.invoke('toggle-click-through', enabled),
  // Open a URL in the user's default browser (for Spotify OAuth)
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  // Window dragging helpers
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
  setWindowPosition: (x, y) => ipcRenderer.invoke('set-window-position', x, y),
  setWindowSize: (w, h) => ipcRenderer.invoke('set-window-size', w, h)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', overlayAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = overlayAPI
}
