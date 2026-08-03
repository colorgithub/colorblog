'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Trash2, Shield, ShieldOff, Mail } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  email: string | null
  name: string
  role: string
  emailVerified: boolean
  createdAt: string
  commentCount: number
  fileCount: number
}

export function UsersClient({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleRoleChange = async (user: User) => {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
    if (user.role === 'ADMIN' && !confirm(`确定要取消 ${user.username} 的管理员权限吗？`)) return
    setBusyId(user.id)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '操作失败'); return }
      toast.success(data.role === 'ADMIN' ? '已设为管理员' : '已取消管理员')
      router.refresh()
    } catch { toast.error('操作失败') } finally { setBusyId(null) }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`确定要删除用户「${user.username}」吗？其评论和文件将一并删除，此操作不可撤销。`)) return
    setBusyId(user.id)
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '删除失败'); return }
      toast.success('用户已删除')
      router.refresh()
    } catch { toast.error('删除失败') } finally { setBusyId(null) }
  }

  return (
    <div className="rounded-2xl border bg-[hsl(var(--card))] overflow-hidden">
      <div className="p-4 border-b">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">没有匹配的用户</div>
      ) : (
        <div className="divide-y">
          {filtered.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-[hsl(var(--muted))/50] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[hsl(var(--accent))/10] flex items-center justify-center text-sm font-bold text-[hsl(var(--accent))] shrink-0">
                  {(user.name || user.username)[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{user.name || user.username}</p>
                    {user.role === 'ADMIN' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-violet-500/10 text-violet-500">管理员</span>
                    )}
                    {!user.emailVerified && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-500/10 text-amber-500">未验证</span>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    @{user.username}{user.email && <span className="inline-flex items-center gap-0.5"><Mail size={10} />{user.email}</span>}
                  </p>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                    注册于 {formatDate(user.createdAt)} · 评论 {user.commentCount} · 文件 {user.fileCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {user.id !== currentUserId && (
                  <>
                    <button onClick={() => handleRoleChange(user)} disabled={busyId === user.id}
                      className={cn(
                        'p-2 rounded-lg transition-all disabled:opacity-50',
                        user.role === 'ADMIN'
                          ? 'text-[hsl(var(--muted-foreground))] hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:text-violet-600'
                          : 'text-[hsl(var(--muted-foreground))] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600'
                      )}
                      title={user.role === 'ADMIN' ? '取消管理员' : '设为管理员'}>
                      {user.role === 'ADMIN' ? <ShieldOff size={16} /> : <Shield size={16} />}
                    </button>
                    <button onClick={() => handleDelete(user)} disabled={busyId === user.id}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-[hsl(var(--muted-foreground))] hover:text-red-600 transition-all disabled:opacity-50"
                      title="删除用户">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
