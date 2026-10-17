'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Plus,
  Users,
  LogOut,
  Menu,
  X,
  PenLine,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SITE_NAME } from '@/lib/env'

const links = [
  { href: '/admin', label: '概览', icon: LayoutDashboard, exact: true },
  { href: '/admin/posts', label: '文章管理', icon: FileText, exact: false },
  { href: '/admin/posts/new', label: '写文章', icon: Plus, exact: true },
  { href: '/admin/users', label: '用户管理', icon: Users, exact: false },
]

interface AdminShellProps {
  user: { name: string; username: string }
  children: React.ReactNode
}

/**
 * 后台外壳：桌面端固定侧栏，移动端抽屉。
 *
 * 原实现是固定 `pl-60` + 固定宽度侧栏，在手机上侧栏会直接压住内容。
 */
export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // 路由变化时收起抽屉
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // 抽屉打开时锁定滚动
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  const nav = (
    <nav className="flex-1 space-y-1 p-3">
      {links.map((link) => {
        const active = isActive(link.href, link.exact)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-accent/10 text-accent'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <link.icon size={18} />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )

  const sidebarInner = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-foreground">
            <PenLine size={14} strokeWidth={2.5} />
          </span>
          <span className="text-sm">{SITE_NAME}</span>
        </Link>
        <button
          onClick={() => setOpen(false)}
          className="btn btn-subtle btn-icon lg:hidden"
          aria-label="关闭菜单"
        >
          <X size={18} />
        </button>
      </div>

      {nav}

      <div className="space-y-1 border-t border-border p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink size={18} />
          查看站点
        </Link>
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent">
            {(user.name || user.username).slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {user.name || user.username}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut size={18} />
          退出登录
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* 桌面端固定侧栏 */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        {sidebarInner}
      </aside>

      {/* 移动端抽屉 */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 animate-fade-in bg-foreground/40 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 animate-fade-in flex-col border-r border-border bg-card lg:hidden">
            {sidebarInner}
          </aside>
        </>
      )}

      <div className="lg:pl-64">
        {/* 移动端顶栏 */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="btn btn-subtle btn-icon"
            aria-label="打开菜单"
          >
            <Menu size={19} />
          </button>
          <span className="text-sm font-semibold">管理后台</span>
        </div>

        <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
