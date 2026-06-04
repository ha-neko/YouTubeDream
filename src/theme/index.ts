import defaultTheme from './themes/default.json'

// Static default for backward compatibility
export const theme = defaultTheme.colors

export { useTheme, ThemeProvider } from './ThemeProvider'
export type { Theme, ThemeColors, ThemeKey } from './types'
export * as ThemeManager from './manager'
export { getAllThemes, saveUserTheme, deleteUserTheme, importThemeFromUri } from './manager'
