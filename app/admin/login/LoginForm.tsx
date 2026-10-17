'use client'

import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * 只接受站内的相对路径，避免 ?from=https://evil.com 这种开放重定向。
 * `//evil.com` 会被浏览器当作协议相对 URL，同样要拦掉。
 */
function safeRedirect(target: string | null): string {
  if (!target) return '/'
  if (!target.startsWith('/')) return '/'
  if (target.startsWith('//')) return '/'
  return target
}

export function LoginForm() {
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
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || '登录失败')
        return
      }

      toast.success('登录成功')
      window.location.href = safeRedirect(searchParams.get('from'))
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
          <LogIn size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">登录</h1>
        <p className="mt-2 text-sm text-muted-foreground">登录后即可评论，管理员可进入后台</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="username" className="label-field">
            用户名
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
            placeholder="用户名或邮箱"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="label-field">
            密码
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-11"
              placeholder="输入密码"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-md w-full">
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? '登录中…' : '登录'}
        </button>

        <p className="pt-1 text-center text-sm text-muted-foreground">
          没有账号？
          <Link href="/register" className="ml-1 font-medium text-accent hover:underline">
            去注册
          </Link>
        </p>
      </form>
    </div>
  )
}
