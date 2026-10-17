import Link from 'next/link'
import { PenLine, Rss } from 'lucide-react'
import { SITE_NAME } from '@/lib/site'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-border bg-surface/60">
      <div className="container-page py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-foreground">
                <PenLine size={14} strokeWidth={2.5} />
              </span>
              {SITE_NAME}
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              记录技术、生活和思考。用文字沉淀知识，用分享连接世界。
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                浏览
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-muted-foreground transition-colors hover:text-accent">
                    首页
                  </Link>
                </li>
                <li>
                  <Link href="/posts" className="text-muted-foreground transition-colors hover:text-accent">
                    全部文章
                  </Link>
                </li>
                <li>
                  <Link href="/feed.xml" className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-accent">
                    <Rss size={13} />
                    RSS 订阅
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                关于
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/admin/login" className="text-muted-foreground transition-colors hover:text-accent">
                    登录
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {SITE_NAME}. All rights reserved.</p>
          <p>Built with Next.js · Prisma · Tailwind CSS</p>
        </div>
      </div>
    </footer>
  )
}
