import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getSession } from '@/lib/auth'
import { isOAuthConfigured } from '@/lib/oauth-client'
import { safeReturnPath } from '@/lib/utils'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: '登录',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  // Next 15 起 searchParams 是 Promise
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const sp = await searchParams
  const next = safeReturnPath(sp.next, '/')

  // 已登录就没必要再看登录页
  const session = await getSession()
  if (session) redirect(next)

  const configured = isOAuthConfigured()
  const issuer = configured
    ? (process.env.VAULT_ISSUER ?? '').replace(/\/+$/, '') || null
    : null

  return (
    <div className="relative flex min-h-[75vh] items-center justify-center px-5 py-16">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]"
      />
      <div className="relative w-full max-w-sm">
        <LoginForm
          next={next}
          errorCode={sp.error}
          issuer={issuer}
          configured={configured}
        />
      </div>
    </div>
  )
}
