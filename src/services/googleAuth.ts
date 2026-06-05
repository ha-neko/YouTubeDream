import { Platform } from 'react-native'

// Web-only Google OAuth integration
// To set up: https://console.cloud.google.com/apis/credentials
// Create an OAuth 2.0 Client ID (Web application), add your origin to Authorized JavaScript origins
const isWeb = Platform.OS === 'web'

let googleClientId: string | null = null

export function configureGoogleAuth(clientId: string) {
  googleClientId = clientId
}

export function getGoogleClientId(): string | null {
  return googleClientId
}

export function isGoogleAuthAvailable(): boolean {
  return isWeb && !!googleClientId
}

// Store Google tokens in memory/profile
let googleAccessToken: string | null = null
let googleUserInfo: any = null

export function setGoogleToken(token: string, user?: any) {
  googleAccessToken = token
  googleUserInfo = user
  // Store in session
  if (isWeb) {
    sessionStorage.setItem('google_token', token)
    if (user) sessionStorage.setItem('google_user', JSON.stringify(user))
  }
}

export function getGoogleToken(): string | null {
  if (!googleAccessToken && isWeb) {
    googleAccessToken = sessionStorage.getItem('google_token')
  }
  return googleAccessToken
}

export function getGoogleUser(): any {
  if (!googleUserInfo && isWeb) {
    try { googleUserInfo = JSON.parse(sessionStorage.getItem('google_user') || 'null') } catch {}
  }
  return googleUserInfo
}

export function clearGoogleAuth() {
  googleAccessToken = null
  googleUserInfo = null
  if (isWeb) {
    sessionStorage.removeItem('google_token')
    sessionStorage.removeItem('google_user')
  }
}
