'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { Menu, X, Moon, Sun, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'
import { useRouter, usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/posts/welcome', label: '博客' },
]

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [session, setSession] = useState<{ name: string; username: string; role: string } | null>(null)
  const { theme, toggleTheme } = useTheme()

  const checkSession = useCallback(() => {
    fetch('/api/auth/me')
      .then((r) => r.json().then((d) => { if (d.authenticated) setSession(d.user); else setSession(null) }))
      .catch(() => setSession(null))
  }, [])

  useEffect(() => { checkSession() }, [checkSession, pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setSession(null)
    router.refresh()
  }

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled ? 'bg-[hsl(var(--background))/80] backdrop-blur-xl border-b' : 'bg-transparent'
    )}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold tracking-tight hover:text-[hsl(var(--accent))] transition-colors">
            My Blog
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                {link.label}
              </Link>
            ))}

            {session ? (
              <div className="flex items-center gap-2">
                {session.role === 'ADMIN' && (
                  <Link href="/admin"
                    className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    title="管理后台">
                    <LayoutDashboard size={18} />
                  </Link>
                )}
                <span className="text-sm text-[hsl(var(--muted-foreground))]">{session.name}</span>
                <button onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors"
                  title="退出">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/admin/login"
                  className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                  登录
                </Link>
                <Link href="/register"
                  className="text-sm font-medium px-4 py-1.5 rounded-lg bg-[hsl(var(--accent))] text-white hover:brightness-110 transition-all">
                  注册
                </Link>
              </div>
            )}

            <button onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors" aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-[hsl(var(--background))] animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                {link.label}
              </Link>
            ))}
            {session ? (
              <>
                <div className="py-2 text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                  <User size={16} />{session.name}
                </div>
                {session.role === 'ADMIN' && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}
                    className="block py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                    管理后台
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setMobileOpen(false) }}
                  className="block py-2 text-sm font-medium text-[hsl(var(--destructive))] transition-colors">
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link href="/admin/login" onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                  登录
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm font-medium text-[hsl(var(--accent))] transition-colors">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
