import Link from 'next/link'
import { Compass, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/10 text-accent">
        <Compass size={28} />
      </div>
      <p className="mt-8 font-mono text-sm font-medium text-accent">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">页面走丢了</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        你访问的地址不存在，或者这篇文章已经被作者删除、改成了草稿。
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary btn-md">
          <Home size={15} />
          回到首页
        </Link>
        <Link href="/posts" className="btn btn-ghost btn-md">
          浏览全部文章
        </Link>
      </div>
    </div>
  )
}
