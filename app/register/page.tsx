'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '', name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '注册失败'); return }
      router.push('/')
      router.refresh()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[hsl(var(--accent))/10] mb-4">
            <UserPlus className="w-7 h-7 text-[hsl(var(--accent))]" />
          </div>
          <h1 className="text-2xl font-bold">注册账号</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">创建账号后可以发表评论</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-xl">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">用户名</label>
            <input type="text" value={form.username} onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all"
              placeholder="至少3个字符" required minLength={3} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">显示名称</label>
            <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all"
              placeholder="你希望别人怎么称呼你" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">密码</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all"
                placeholder="至少6个字符" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[hsl(var(--accent))] text-white font-medium hover:brightness-110 disabled:opacity-50 transition-all">
            {loading ? '注册中...' : '注册'}
          </button>

          <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
            已有账号？<Link href="/admin/login" className="text-[hsl(var(--accent))] hover:underline">登录</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
