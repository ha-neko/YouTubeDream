import * as FileSystem from 'expo-file-system'
import type { Theme } from './types'
import defaultTheme from './themes/default.json'
import pastelPink from './themes/pastel-pink.json'
import synthwave from './themes/synthwave.json'

const THEMES_DIR = `${FileSystem.documentDirectory}themes/`

const builtInThemes: Theme[] = [
  defaultTheme as Theme,
  pastelPink as Theme,
  synthwave as Theme,
]

let cachedThemes: Theme[] | null = null

export function getBuiltInThemes(): Theme[] {
  return builtInThemes
}

export async function getUserThemes(): Promise<Theme[]> {
  try {
    const info = await FileSystem.getInfoAsync(THEMES_DIR)
    if (!info.exists) return []

    const files = await FileSystem.readDirectoryAsync(THEMES_DIR)
    const themes: Theme[] = []

    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const content = await FileSystem.readAsStringAsync(`${THEMES_DIR}${file}`)
        const theme = JSON.parse(content) as Theme
        if (theme?.id && theme?.name && theme?.colors) {
          themes.push(theme)
        }
      } catch { }
    }

    return themes
  } catch {
    return []
  }
}

export async function getAllThemes(): Promise<Theme[]> {
  if (cachedThemes) return cachedThemes
  const user = await getUserThemes()
  cachedThemes = [...builtInThemes, ...user]
  return cachedThemes
}

export function clearCache() {
  cachedThemes = null
}

export async function saveUserTheme(theme: Theme): Promise<void> {
  const info = await FileSystem.getInfoAsync(THEMES_DIR)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(THEMES_DIR, { intermediates: true })
  }
  const path = `${THEMES_DIR}${theme.id}.json`
  await FileSystem.writeAsStringAsync(path, JSON.stringify(theme, null, 2))
  clearCache()
}

export async function deleteUserTheme(id: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(`${THEMES_DIR}${id}.json`, { idempotent: true })
    clearCache()
  } catch { }
}

export async function importThemeFromUri(uri: string): Promise<Theme | null> {
  try {
    const content = await FileSystem.readAsStringAsync(uri)
    const theme = JSON.parse(content) as Theme
    if (!theme?.id || !theme?.name || !theme?.colors) return null
    await saveUserTheme(theme)
    return theme
  } catch {
    return null
  }
}
