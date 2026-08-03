'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, Plus, Users, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const links = [
  { href: '/admin', label: '概览', icon: LayoutDashboard },
  { href: '/admin/posts', label: '文章管理', icon: FileText },
  { href: '/admin/posts/new', label: '写文章', icon: Plus },
  { href: '/admin/users', label: '用户管理', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className={`fixed left-0 top-0 h-full bg-[hsl(var(--card))] border-r flex flex-col transition-all duration-300 z-40 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {!collapsed && <Link href="/" className="text-lg font-bold tracking-tight">My Blog</Link>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link key={link.href} href={link.href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive ? 'bg-[hsl(var(--accent))/10] text-[hsl(var(--accent))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
              )}>
              <link.icon size={20} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--destructive))]">
          <LogOut size={20} />
          {!collapsed && <span>退出登录</span>}
        </button>
      </div>
    </aside>
  )
}
