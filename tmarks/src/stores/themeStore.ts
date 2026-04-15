import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'
type ColorTheme = 'default' | 'violet' | 'green' | 'orange'

interface ThemeStore {
  theme: Theme
  colorTheme: ColorTheme
  isAutoTheme: boolean
  setTheme: (theme: Theme) => void
  setColorTheme: (colorTheme: ColorTheme) => void
  toggleTheme: () => void
}

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: getSystemTheme(),
      colorTheme: 'default',
      isAutoTheme: true,
      setTheme: (theme) => set({ theme, isAutoTheme: false }),
      setColorTheme: (colorTheme) => set({ colorTheme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
          isAutoTheme: false,
        })),
    }),
    {
      name: 'theme-storage',
    }
  )
)

if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleThemeChange = (e: MediaQueryListEvent) => {
    if (useThemeStore.getState().isAutoTheme) {
      useThemeStore.setState({ theme: e.matches ? 'dark' : 'light' })
    }
  }

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleThemeChange)
  } else {
    mediaQuery.addListener(handleThemeChange)
  }
}
