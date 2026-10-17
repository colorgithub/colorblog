'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Search, Trash2, Shield, ShieldOff, Mail, Loader2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatDate } from '@/lib/utils'

interface User {
  id: string
  username: string
  email: string | null
  name: string
  role: string
  createdAt: string
  commentCount: number
  fileCount: number
}

export function UsersClient({
  users,
  currentUserId,
}: {
  users: User[]
  currentUserId: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return users
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(keyword) ||
        (u.email ?? '').toLowerCase().includes(keyword) ||
        u.name.toLowerCase().includes(keyword)
    )
  }, [users, search])

  const handleRoleChange = async (user: User) => {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
    if (
      user.role === 'ADMIN' &&
      !confirm(`确定要取消「${user.username}」的管理员权限吗？对方当前的登录状态会立即失效。`)
    ) {
      return
    }

    setBusyId(user.id)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || '操作失败')
        return
      }
      toast.success(nextRole === 'ADMIN' ? '已设为管理员' : '已取消管理员')
      router.refresh()
    } catch {
      toast.error('操作失败，请检查网络')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (user: User) => {
    if (
      !confirm(`确定要删除用户「${user.username}」吗？其 ${user.commentCount} 条评论和 ${user.fileCount} 个文件会一并删除，不可撤销。`)
    ) {
      return
    }

    setBusyId(user.id)
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || '删除失败')
        return
      }
      toast.success('用户已删除')
      router.refresh()
    } catch {
      toast.error('删除失败，请检查网络')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-border p-4">
        <div className="relative sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户名、邮箱或昵称…"
            className="input-field h-9 pl-9 text-sm"
            aria-label="搜索用户"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <Users size={22} className="mx-auto text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">没有匹配的用户</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((user) => {
            const isSelf = user.id === currentUserId
            const busy = busyId === user.id

            return (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                    {(user.name || user.username).slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {user.name || user.username}
                      </p>
                      {user.role === 'ADMIN' && (
                        <span className="shrink-0 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                          管理员
                        </span>
                      )}
                      {isSelf && (
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          你
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">@{user.username}</span>
                      {user.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail size={10} />
                          {user.email}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                      注册于 {formatDate(user.createdAt)} · 评论 {user.commentCount} · 文件{' '}
                      {user.fileCount}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  {isSelf ? (
                    <span className="px-2 text-xs text-muted-foreground">当前账号</span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRoleChange(user)}
                        disabled={busy}
                        className={cn(
                          'btn btn-icon',
                          user.role === 'ADMIN'
                            ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                            : 'text-muted-foreground hover:bg-accent/10 hover:text-accent'
                        )}
                        title={user.role === 'ADMIN' ? '取消管理员' : '设为管理员'}
                        aria-label={user.role === 'ADMIN' ? '取消管理员' : '设为管理员'}
                      >
                        {user.role === 'ADMIN' ? <ShieldOff size={16} /> : <Shield size={16} />}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={busy}
                        className="btn btn-danger btn-icon"
                        title="删除用户"
                        aria-label="删除用户"
                      >
                        {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
