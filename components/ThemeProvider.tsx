'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

/** 服务端渲染阶段没有 DOM，用 useEffect 兜底，避免 useLayoutEffect 的 SSR 警告。 */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/** 与 app/layout.tsx 里的内联脚本保持同一套判断逻辑。 */
function resolveInitialTheme(): Theme {
  let stored: string | null = null
  try {
    stored = localStorage.getItem('theme')
  } catch {
    // 隐私模式下 localStorage 可能不可用
  }
  if (stored === 'dark') return 'dark'
  if (stored === 'light') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

/**
 * 主题状态。
 *
 * 「首屏决定主题」由 app/layout.tsx 里的内联脚本在绘制前完成；这里负责在
 * hydration 之后重新应用一次。
 *
 * 为什么必须重新应用：React 19 在 hydrate <html> 时会按属性重建它，把脚本
 * 已经写上去的 dark 类名和 color-scheme 样式抹掉（实测 DOMContentLoaded 时
 * 类名还在，hydration 完成就被清空）。不补这一下，暗色模式会整个失效。
 * 用 layout effect 是为了赶在浏览器绘制前把状态还原，避免闪一下浅色。
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useIsomorphicLayoutEffect(() => {
    const initial = resolveInitialTheme()
    applyTheme(initial)
    setTheme(initial)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      applyTheme(next)
      try {
        localStorage.setItem('theme', next)
      } catch {
        // 隐私模式下 localStorage 可能不可用，忽略即可
      }
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  )
}
