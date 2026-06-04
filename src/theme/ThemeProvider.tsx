import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import * as FileSystem from 'expo-file-system'
import type { Theme, ThemeColors } from './types'
import { getAllThemes } from './manager'
import defaultTheme from './themes/default.json'

const CONFIG_PATH = `${FileSystem.documentDirectory}active-theme.json`

interface ThemeContextValue {
  theme: ThemeColors
  fullTheme: Theme
  setTheme: (theme: Theme) => Promise<void>
  availableThemes: Theme[]
  refreshThemes: () => Promise<void>
}

const defaultColors = (defaultTheme as Theme).colors

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultColors,
  fullTheme: defaultTheme as Theme,
  setTheme: async () => {},
  availableThemes: [],
  refreshThemes: async () => {},
})

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme as Theme)
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([])

  const loadThemes = useCallback(async () => {
    const all = await getAllThemes()
    setAvailableThemes(all)
  }, [])

  useEffect(() => {
    loadThemes()
    loadActiveTheme()
  }, [])

  const loadActiveTheme = async () => {
    try {
      const info = await FileSystem.getInfoAsync(CONFIG_PATH)
      if (!info.exists) return
      const content = await FileSystem.readAsStringAsync(CONFIG_PATH)
      const saved = JSON.parse(content)
      if (saved?.id) {
        const all = await getAllThemes()
        const found = all.find((t) => t.id === saved.id)
        if (found) setThemeState(found)
      }
    } catch { }
  }

  const setTheme = async (t: Theme) => {
    setThemeState(t)
    await FileSystem.writeAsStringAsync(CONFIG_PATH, JSON.stringify({ id: t.id }))
  }

  return (
    <ThemeContext.Provider value={{ theme: theme.colors, fullTheme: theme, setTheme, availableThemes, refreshThemes: loadThemes }}>
      {children}
    </ThemeContext.Provider>
  )
}
