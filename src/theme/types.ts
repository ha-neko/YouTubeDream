export interface ThemeColors {
  bg: string
  bgCard: string
  bgElevated: string
  text: string
  textSecondary: string
  accent: string
  accentDim: string
  border: string
  success: string
  tabBar: string
  tabInactive: string
  overlay: string
}

export interface ThemeFonts {
  regular?: string
  bold?: string
}

export interface Theme {
  id: string
  name: string
  author: string
  description?: string
  colors: ThemeColors
  fonts?: ThemeFonts
  borderRadius?: number
}

export type ThemeKey =
  | 'bg' | 'bgCard' | 'bgElevated'
  | 'text' | 'textSecondary'
  | 'accent' | 'accentDim'
  | 'border' | 'success'
  | 'tabBar' | 'tabInactive'
  | 'overlay'
