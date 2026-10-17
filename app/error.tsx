'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 上报到控制台/日志服务，方便定位；不要把堆栈渲染给用户
    console.error('[app] 渲染出错', error)
  }, [error])

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle size={28} />
      </div>
      <h1 className="mt-8 text-2xl font-bold tracking-tight sm:text-3xl">页面出错了</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        服务端渲染时发生了异常，通常是数据库连接问题。可以重试，或者稍后再来。
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/70">
          错误编号 {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn btn-primary btn-md">
          <RotateCcw size={15} />
          重新加载
        </button>
        <Link href="/" className="btn btn-ghost btn-md">
          <Home size={15} />
          回到首页
        </Link>
      </div>
    </div>
  )
}
