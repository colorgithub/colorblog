import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, ArrowRight, Info } from 'lucide-react'

import { isOAuthConfigured } from '@/lib/oauth-client'
import { safeReturnPath } from '@/lib/utils'

export const metadata: Metadata = {
  title: '注册',
  robots: { index: false, follow: false },
}

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  const next = safeReturnPath(searchParams.next, '/')
  const issuer = isOAuthConfigured()
    ? (process.env.VAULT_ISSUER ?? '').replace(/\/+$/, '') || null
    : null

  return (
    <div className="relative flex min-h-[75vh] items-center justify-center px-5 py-16">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
            <ShieldCheck size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">账号统一管理</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            本站已改用 MemoVault 账号登录
          </p>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-start gap-2.5">
            <Info size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>本站不再单独提供注册入口，账号由 MemoVault 统一创建和保管。</p>
              <p>
                这样你只需要记住一套密码，本站也不会再存储任何密码哈希。
              </p>
              <p>原有的历史评论全部保留，不会因为切换登录方式而丢失。</p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          <Link
            href={`/admin/login?next=${encodeURIComponent(next)}`}
            className="btn btn-primary btn-md w-full"
          >
            去登录
            <ArrowRight size={16} />
          </Link>

          {issuer && (
            <a
              href={`${issuer}/register`}
              rel="noreferrer"
              className="btn btn-ghost btn-md w-full"
            >
              还没有 MemoVault 账号？去注册
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
