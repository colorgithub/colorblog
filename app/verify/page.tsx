'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

function VerifyContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    fetch(`/api/auth/verify?token=${token}`)
      .then((r) => r.json().then((d) => setStatus(d.success ? 'success' : 'error')))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {status === 'loading' && (
          <>
            <Loader2 size={40} className="mx-auto text-[hsl(var(--accent))] animate-spin mb-4" />
            <p className="text-[hsl(var(--muted-foreground))]">正在验证...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">邮箱验证成功</h1>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">现在可以登录并发表评论了</p>
            <Link href="/admin/login"
              className="inline-flex px-6 py-2.5 rounded-xl bg-[hsl(var(--accent))] text-white font-medium hover:brightness-110 transition-all">
              去登录
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">验证失败</h1>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">验证链接无效或已过期</p>
            <Link href="/register"
              className="inline-flex px-6 py-2.5 rounded-xl bg-[hsl(var(--accent))] text-white font-medium hover:brightness-110 transition-all">
              重新注册
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 size={32} className="text-[hsl(var(--accent))] animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
