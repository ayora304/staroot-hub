import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_THEME, THEME_STORAGE_KEY, type ThemeName } from './tokens'
import { THEMES } from './themes'

interface ThemeState {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
  toggle: () => void
}
const ThemeContext = createContext<ThemeState | null>(null)

function readStored(): ThemeName {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    if (v === 'dark' || v === 'light') return v
    // Migrate the previous theme key while preserving existing users' preference.
    if (v === 'gold-dark') return 'dark'
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_THEME
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(readStored)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEMES[theme].themeColor)
    document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default')
  }, [theme])

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t) // UI preference only, nothing sensitive
    } catch {
      /* ignore */
    }
  }, [])
  const toggle = useCallback(() => setTheme(theme === 'light' ? 'dark' : 'light'), [theme, setTheme])

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
