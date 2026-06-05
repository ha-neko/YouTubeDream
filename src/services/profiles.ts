import { Platform } from 'react-native'

const isWeb = Platform.OS === 'web'

export interface Profile {
  id: string
  name: string
  avatar: string
  createdAt: number
  subscriptions: string[] // channel IDs
  history: string[] // video IDs
  playlists: string[] // playlist IDs
}

const STORAGE_KEY = 'ytdream_profiles'
const ACTIVE_KEY = 'ytdream_active_profile'

function storage() {
  return {
    getAll: (): Profile[] => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
    },
    save: (items: Profile[]) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    },
    getActive: (): string | null => {
      return localStorage.getItem(ACTIVE_KEY)
    },
    setActive: (id: string | null) => {
      if (id) localStorage.setItem(ACTIVE_KEY, id)
      else localStorage.removeItem(ACTIVE_KEY)
    },
  }
}

export function createProfile(name: string): Profile {
  const profiles = storage().getAll()
  const profile: Profile = {
    id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    avatar: name.charAt(0).toUpperCase(),
    createdAt: Date.now(),
    subscriptions: [],
    history: [],
    playlists: [],
  }
  storage().save([...profiles, profile])
  storage().setActive(profile.id)
  return profile
}

export function getProfiles(): Profile[] {
  return storage().getAll()
}

export function getActiveProfile(): Profile | null {
  const id = storage().getActive()
  if (!id) return null
  return storage().getAll().find(p => p.id === id) ?? null
}

export function switchProfile(id: string): Profile | null {
  const profile = storage().getAll().find(p => p.id === id)
  if (profile) storage().setActive(id)
  return profile ?? null
}

export function deleteProfile(id: string): void {
  const profiles = storage().getAll().filter(p => p.id !== id)
  storage().save(profiles)
  if (storage().getActive() === id) {
    const next = profiles[0] ?? null
    storage().setActive(next?.id ?? null)
  }
}

export function updateProfile(id: string, updates: Partial<Profile>): Profile | null {
  const profiles = storage().getAll()
  const idx = profiles.findIndex(p => p.id === id)
  if (idx === -1) return null
  profiles[idx] = { ...profiles[idx], ...updates }
  storage().save(profiles)
  return profiles[idx]
}

export function addToHistory(videoId: string): void {
  const profile = getActiveProfile()
  if (!profile) return
  const history = [videoId, ...profile.history.filter(id => id !== videoId)].slice(0, 200)
  updateProfile(profile.id, { history })
}

export function toggleSubscription(channelId: string): boolean {
  const profile = getActiveProfile()
  if (!profile) return false
  const subs = profile.subscriptions.includes(channelId)
    ? profile.subscriptions.filter(id => id !== channelId)
    : [...profile.subscriptions, channelId]
  updateProfile(profile.id, { subscriptions: subs })
  return !profile.subscriptions.includes(channelId)
}

export function isSubscribed(channelId: string): boolean {
  const profile = getActiveProfile()
  return profile?.subscriptions.includes(channelId) ?? false
}

export function renameProfile(id: string, name: string): void {
  updateProfile(id, { name, avatar: name.charAt(0).toUpperCase() })
}
