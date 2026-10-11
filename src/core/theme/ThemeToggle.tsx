import { useTheme } from './ThemeProvider'
import { Icon } from '../ui/Icons'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const next = theme === 'light' ? 'dark gold' : 'light'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      className="grid size-11 place-items-center rounded-xl text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
    >
      <Icon name={theme === 'light' ? 'moon' : 'sun'} className="size-5" />
    </button>
  )
}
