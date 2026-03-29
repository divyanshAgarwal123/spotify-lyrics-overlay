/**
 * Spotify OAuth 2.0 PKCE Authentication Module
 *
 * Implements the Authorization Code with PKCE flow so no client secret
 * is exposed. Tokens are stored in localStorage for persistence.
 */

// ── Configuration ───────────────────────────────────────────────
// Users must set their own Client ID from https://developer.spotify.com/dashboard
const CLIENT_ID = localStorage.getItem('spotify_client_id') || 'YOUR_CLIENT_ID'
const REDIRECT_URI = 'http://localhost:5173/callback'
const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state'
].join(' ')

const AUTH_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'

// ── PKCE Helpers ────────────────────────────────────────────────

/** Generate a cryptographically random string for code verifier */
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

/** SHA-256 hash a string and return base64url-encoded result */
async function sha256(plain) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Initiate the Spotify OAuth flow.
 * Opens the authorization URL — in Electron we open in the system browser.
 */
export async function startAuth(clientId) {
  if (clientId) {
    localStorage.setItem('spotify_client_id', clientId)
  }
  const id = clientId || CLIENT_ID

  // Generate PKCE code verifier and challenge
  const codeVerifier = generateRandomString(128)
  const codeChallenge = await sha256(codeVerifier)

  // Store verifier for the token exchange step
  localStorage.setItem('pkce_code_verifier', codeVerifier)

  const params = new URLSearchParams({
    client_id: id,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  })

  const authUrl = `${AUTH_URL}?${params.toString()}`

  // Use Electron's IPC to open in system browser, or fallback to window.open
  if (window.api && window.api.openExternal) {
    window.api.openExternal(authUrl)
  } else {
    window.open(authUrl, '_blank')
  }
}

/**
 * Exchange the authorization code for access + refresh tokens.
 * Called after the user is redirected back with ?code=...
 */
export async function exchangeCode(code) {
  const codeVerifier = localStorage.getItem('pkce_code_verifier')
  const clientId = localStorage.getItem('spotify_client_id') || CLIENT_ID

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier
    })
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`)
  }

  const data = await response.json()

  // Persist tokens with expiry timestamp
  localStorage.setItem('spotify_access_token', data.access_token)
  localStorage.setItem('spotify_refresh_token', data.refresh_token)
  localStorage.setItem(
    'spotify_token_expiry',
    String(Date.now() + data.expires_in * 1000)
  )

  return data.access_token
}

/**
 * Refresh the access token using the stored refresh token.
 */
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('spotify_refresh_token')
  const clientId = localStorage.getItem('spotify_client_id') || CLIENT_ID

  if (!refreshToken) throw new Error('No refresh token available')

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    // If refresh fails, clear tokens to force re-auth
    clearTokens()
    throw new Error('Token refresh failed')
  }

  const data = await response.json()
  localStorage.setItem('spotify_access_token', data.access_token)
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh_token', data.refresh_token)
  }
  localStorage.setItem(
    'spotify_token_expiry',
    String(Date.now() + data.expires_in * 1000)
  )

  return data.access_token
}

/**
 * Get a valid access token, refreshing if needed.
 */
export async function getAccessToken() {
  const token = localStorage.getItem('spotify_access_token')
  const expiry = Number(localStorage.getItem('spotify_token_expiry') || 0)

  // Refresh 60s before actual expiry to avoid edge cases
  if (!token || Date.now() > expiry - 60000) {
    return await refreshAccessToken()
  }

  return token
}

/**
 * Check if the user is authenticated.
 */
export function isAuthenticated() {
  return !!localStorage.getItem('spotify_access_token')
}

/**
 * Clear all stored tokens (logout).
 */
export function clearTokens() {
  localStorage.removeItem('spotify_access_token')
  localStorage.removeItem('spotify_refresh_token')
  localStorage.removeItem('spotify_token_expiry')
  localStorage.removeItem('pkce_code_verifier')
}
