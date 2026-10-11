import type { ThemeName } from './tokens'

export const THEMES: Record<ThemeName, { label: string; themeColor: string }> = {
  'gold-dark': { label: 'Luxury Gold (dark)', themeColor: '#0c0b09' },
  light: { label: 'Daylight (light)', themeColor: '#faf8f2' },
}
