import type { ThemeName } from './tokens'

export const THEMES: Record<ThemeName, { label: string; themeColor: string }> = {
  dark: { label: 'Dark', themeColor: '#011025' },
  light: { label: 'Light', themeColor: '#FFFFFF' },
}
