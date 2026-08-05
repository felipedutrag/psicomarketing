'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'

const ThemeContext = createContext({
  theme: 'system' as 'light' | 'dark' | 'system',
  resolvedTheme: 'light' as 'light' | 'dark',
  setTheme: (nextTheme: 'light' | 'dark' | 'system') => {},
})

const STORAGE_KEY = 'psicomarketing-theme'

const emptySubscribe = () => () => {}

function useClientTheme(): 'light' | 'dark' | 'system' {
  return useSyncExternalStore(
    emptySubscribe,
    () => {
      if (typeof window === 'undefined') return 'light'
      const stored = localStorage.getItem(STORAGE_KEY) || 'light'
      return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'light'
    },
    () => 'light'
  )
}

function useSystemTheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {}
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', callback)
      return () => media.removeEventListener('change', callback)
    },
    () => {
      if (typeof window === 'undefined') return 'light'
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    },
    () => 'light'
  )
}

function applyThemeClass(resolvedTheme: 'light' | 'dark', attribute = 'class') {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (attribute === 'class') {
    root.classList.toggle('dark', resolvedTheme === 'dark')
  }
  root.style.colorScheme = resolvedTheme
}

interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: 'class' | 'data-theme'
  defaultTheme?: 'light' | 'dark' | 'system'
  enableSystem?: boolean
}

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
}: ThemeProviderProps) {
  const systemTheme = useSystemTheme()
  const [themeState, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEY) as any) || defaultTheme
    }
    return defaultTheme
  })

  const resolvedTheme: 'light' | 'dark' = themeState === 'system' ? (enableSystem ? systemTheme : 'light') : themeState

  useEffect(() => {
    applyThemeClass(resolvedTheme, attribute)
  }, [attribute, resolvedTheme])

  const setTheme = useCallback((nextTheme: 'light' | 'dark' | 'system') => {
    setThemeState(nextTheme)
    localStorage.setItem(STORAGE_KEY, nextTheme)
  }, [])

  const value = useMemo(
    () => ({
      theme: themeState,
      resolvedTheme,
      setTheme,
    }),
    [themeState, resolvedTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
