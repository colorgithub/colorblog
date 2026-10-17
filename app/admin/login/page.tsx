import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: '登录',
  robots: { index: false, follow: false },
}

/**
 * 登录页必须动态渲染。
 *
 * 它读 ?from= 查询参数（登录后跳回原页面），而 useSearchParams 在静态
 * 预渲染时会让整棵客户端组件树退化成 Suspense 兜底 —— 服务端只吐骨架，
 * 表单要等 hydration 才出现。强制动态后表单直接进首屏 HTML。
 */
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[75vh] items-center justify-center px-5 py-16">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-accent/10 blur-[110px]"
      />
      <div className="relative w-full max-w-sm">
        <Suspense
          fallback={
            <div className="card-surface space-y-4 p-8">
              <div className="skeleton mx-auto h-14 w-14 rounded-2xl" />
              <div className="skeleton mx-auto h-6 w-32" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
