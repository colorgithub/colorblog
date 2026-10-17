'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/

export function RegisterForm() {
  const [form, setForm] = useState({ username: '', password: '', name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // 前端先挡一道，规则与 lib/auth.ts 的 validateRegisterInput 保持一致
    if (!USERNAME_PATTERN.test(form.username)) {
      setError('用户名只能包含字母、数字、下划线和连字符，长度 3-32 位')
      return
    }
    if (form.password.length < 8) {
      setError('密码至少 8 个字符')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || '注册失败')
        return
      }
      toast.success('注册成功')
      window.location.href = '/'
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
          <UserPlus size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">注册账号</h1>
        <p className="mt-2 text-sm text-muted-foreground">创建账号后即可参与讨论</p>
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
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            className="input-field"
            placeholder="3-32 位字母、数字、_ 或 -"
            required
          />
        </div>

        <div>
          <label htmlFor="name" className="label-field">
            显示名称
          </label>
          <input
            id="name"
            type="text"
            autoComplete="nickname"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="input-field"
            placeholder="别人怎么称呼你"
            maxLength={32}
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
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="input-field pr-11"
              placeholder="至少 8 位"
              minLength={8}
              maxLength={72}
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
          {loading ? '注册中…' : '注册'}
        </button>

        <p className="pt-1 text-center text-sm text-muted-foreground">
          已有账号？
          <Link href="/admin/login" className="ml-1 font-medium text-accent hover:underline">
            去登录
          </Link>
        </p>
      </form>
    </div>
  )
}
