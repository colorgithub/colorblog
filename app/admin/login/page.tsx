'use client'

import { Suspense, useState, FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '登录失败'); return }
      const from = searchParams.get('from') || '/'
      window.location.href = from
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
            <LogIn className="w-7 h-7 text-[hsl(var(--accent))]" />
          </div>
          <h1 className="text-2xl font-bold">登录</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">登录后可以发表评论</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-xl">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-1.5">用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all"
              placeholder="输入用户名" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">密码</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all"
                placeholder="输入密码" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[hsl(var(--accent))] text-white font-medium hover:brightness-110 disabled:opacity-50 transition-all">
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
            没有账号？<Link href="/register" className="text-[hsl(var(--accent))] hover:underline">注册</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--accent))] border-t-transparent rounded-full" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
