import type { Metadata } from 'next'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { ALLOW_REGISTRATION } from '@/lib/env'
import { RegisterForm } from './RegisterForm'

export const metadata: Metadata = {
  title: '注册',
  robots: { index: false, follow: false },
}

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-[75vh] items-center justify-center px-5 py-16">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]"
      />

      <div className="relative w-full max-w-sm">
        {ALLOW_REGISTRATION ? (
          <RegisterForm />
        ) : (
          <div className="card-surface px-8 py-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Lock size={26} />
            </div>
            <h1 className="mt-5 text-xl font-bold tracking-tight">本站已关闭注册</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              目前不接受自助注册。如需账号，请联系站长开通。
            </p>
            <div className="mt-7 flex justify-center gap-3">
              <Link href="/" className="btn btn-ghost btn-md">
                回到首页
              </Link>
              <Link href="/admin/login" className="btn btn-primary btn-md">
                去登录
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
