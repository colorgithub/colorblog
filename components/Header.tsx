'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  LayoutDashboard,
  PenLine,
  ChevronDown,
} from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'
import { SITE_NAME } from '@/lib/site'

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/posts', label: '文章' },
]

interface SessionUser {
  userId: string
  username: string
  name: string
  role: string
}

export function Header() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [session, setSession] = useState<SessionUser | null>(null)
  const { theme, toggleTheme } = useTheme()
  const menuRef = useRef<HTMLDivElement>(null)

  const checkSession = useCallback(() => {
    fetch('/api/auth/me')
      .then((r) => r.json().then((d) => setSession(d.authenticated ? d.user : null)))
      .catch(() => setSession(null))
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession, pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 路由切换时收起所有浮层
  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [pathname])

  // 点击外部关闭用户菜单
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'glass border-b border-border/80' : 'border-b border-transparent'
      )}
    >
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 font-semibold tracking-tight"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-foreground shadow-soft transition-transform duration-300 group-hover:scale-105">
              <PenLine size={16} strokeWidth={2.5} />
            </span>
            <span className="text-[15px]">{SITE_NAME}</span>
          </Link>

          {/* 桌面导航 */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="btn btn-subtle btn-icon"
              aria-label={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
              title={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
            >
              <Sun size={17} className="hidden dark:block" />
              <Moon size={17} className="block dark:hidden" />
            </button>

            {session ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-muted"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                    {(session.name || session.username).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[7rem] truncate text-sm font-medium sm:block">
                    {session.name || session.username}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      'text-muted-foreground transition-transform duration-200',
                      menuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.5rem)] w-48 origin-top-right animate-fade-in overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-lift"
                  >
                    <div className="px-2.5 py-2">
                      <p className="truncate text-sm font-medium">
                        {session.name || session.username}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{session.username}
                        {session.role === 'ADMIN' && ' · 管理员'}
                      </p>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    {session.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <LayoutDashboard size={15} />
                        管理后台
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut size={15} />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/admin/login" className="btn btn-ghost btn-md">
                  登录
                </Link>
                <Link href="/register" className="btn btn-primary btn-md">
                  注册
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="btn btn-subtle btn-icon md:hidden"
              aria-label="打开菜单"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      {mobileOpen && (
        <div className="animate-fade-in border-t border-border bg-card md:hidden">
          <nav className="container-page flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive(link.href)
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}

            {!session && (
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <Link href="/admin/login" className="btn btn-ghost btn-md">
                  登录
                </Link>
                <Link href="/register" className="btn btn-primary btn-md">
                  注册
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
