'use client'

import { Suspense, useState, FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Eye, EyeOff, MailCheck, Mail } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Email binding state
  const [needsEmail, setNeedsEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState('')

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
      if (!res.ok) {
        if (data.needsEmail) {
          setNeedsEmail(true)
          return
        }
        setError(data.error || '登录失败')
        return
      }
      const from = searchParams.get('from') || '/'
      window.location.href = from
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkEmail = async (e: FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setEmailSending(true)

    try {
      const res = await fetch('/api/auth/link-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email }),
      })
      const data = await res.json()
      if (!res.ok) { setEmailError(data.error || '操作失败'); return }
      setEmailError(data.emailError || '')
      setEmailSent(true)
    } catch {
      setEmailError('网络错误，请重试')
    } finally {
      setEmailSending(false)
    }
  }

  if (needsEmail) {
    if (emailSent) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 mb-4">
              <MailCheck className="w-7 h-7 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3">验证邮件已发送</h1>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">
              验证链接已发送到 <span className="font-medium text-[hsl(var(--foreground))]">{email}</span>，
              点击邮件中的链接完成验证后即可登录。
            </p>
            {emailError && (
              <div className="p-3 mb-4 text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400 rounded-xl text-left">
                邮件发送遇到问题：{emailError}
              </div>
            )}
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              已验证？<Link href="/admin/login" className="text-[hsl(var(--accent))] hover:underline">重新登录</Link>
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
              <Mail className="w-7 h-7 text-[hsl(var(--accent))]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">绑定邮箱</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              账号 <span className="font-medium text-[hsl(var(--foreground))]">{username}</span> 还没有绑定邮箱。
              <br />输入邮箱并验证后即可登录。
            </p>
          </div>

          <form onSubmit={handleLinkEmail} className="space-y-4">
            {emailError && <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400 rounded-xl">{emailError}</div>}

            <div>
              <label className="block text-sm font-medium mb-1.5">邮箱</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all"
                placeholder="输入你的邮箱" required />
            </div>

            <button type="submit" disabled={emailSending}
              className="w-full py-2.5 px-4 rounded-xl bg-[hsl(var(--accent))] text-white font-medium hover:brightness-110 disabled:opacity-50 transition-all">
              {emailSending ? '发送中...' : '发送验证邮件'}
            </button>

            <button type="button" onClick={() => setNeedsEmail(false)}
              className="w-full text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
              返回登录
            </button>
          </form>
        </div>
      </div>
    )
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
