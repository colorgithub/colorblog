'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { UserPlus, Eye, EyeOff, MailCheck } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

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
      setRegistered(true)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 mb-4">
            <MailCheck className="w-7 h-7 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">注册成功</h1>
          <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-6">
            验证邮件已发送到 <span className="font-medium text-[hsl(var(--foreground))]">{form.email}</span>，
            请查收邮箱并点击验证链接完成注册。
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            已验证？<Link href="/admin/login" className="text-[hsl(var(--accent))] hover:underline">去登录</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[hsl(var(--accent))/10] mb-4">
            <UserPlus className="w-7 h-7 text-[hsl(var(--accent))]" />
          </div>
          <h1 className="text-2xl font-bold">注册账号</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">注册后需验证邮箱才能发表评论</p>
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
            <label className="block text-sm font-medium mb-1.5">邮箱</label>
            <input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all"
              placeholder="用于接收验证邮件" required />
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
