import type { ReactNode } from 'react'
import { AuthProvider } from '../core/auth/AuthProvider'
import { ThemeProvider } from '../core/theme/ThemeProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  )
}
