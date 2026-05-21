export type Theme = 'dark' | 'light'
export type ThemePreference = Theme | 'auto'

const STORAGE_KEY = 'aifindr-theme'

function detectByTime(): Theme {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  if (import.meta.client) {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

export function useTheme() {
  const preference = useState<ThemePreference>('themePreference', () => 'auto')
  const theme = useState<Theme>('theme', () => 'dark')

  function resolve(): Theme {
    return preference.value === 'auto' ? detectByTime() : preference.value
  }

  function setPreference(p: ThemePreference) {
    preference.value = p
    theme.value = p === 'auto' ? detectByTime() : p
    applyTheme(theme.value)
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, p)
    }
  }

  function toggle() {
    const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
    setPreference(next)
  }

  // Initialize on mount
  onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemePreference | null
    if (saved) {
      preference.value = saved
    }
    theme.value = resolve()
    applyTheme(theme.value)
  })

  return {
    preference: readonly(preference),
    theme: readonly(theme),
    setPreference,
    toggle,
  }
}
