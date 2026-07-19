import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate, cn } from '@/lib/utils'
import { ArrowRight, Calendar, Tag } from 'lucide-react'

export const revalidate = 60
export const dynamic = 'force-dynamic'

async function getPosts() {
  try {
    return await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return []
  }
}

export default async function HomePage() {
  const posts = await getPosts()

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent))/5] via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              我的博客
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[hsl(var(--muted-foreground))] leading-relaxed">
              记录技术、生活和思考。用文字沉淀知识，用分享连接世界。
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] mb-6">
              <svg className="w-8 h-8 text-[hsl(var(--muted-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">还没有文章</h3>
            <p className="text-[hsl(var(--muted-foreground))]">去管理后台写第一篇博客吧</p>
          </div>
        ) : (
          <div className={cn('grid gap-6', posts.length === 1 ? 'max-w-xl' : 'md:grid-cols-2 lg:grid-cols-3')}>
            {posts.map((post, i) => (
              <Link key={post.id} href={`/posts/${post.slug}`}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border bg-[hsl(var(--card))] p-6',
                  'hover:shadow-lg hover:shadow-[hsl(var(--accent))/5] hover:border-[hsl(var(--accent))/30]',
                  'transition-all duration-300', i === 0 && posts.length > 1 && 'md:col-span-2'
                )}
                style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] mb-3">
                    <Calendar size={14} /><time>{formatDate(post.createdAt)}</time>
                    {post.tags && <><span>·</span><Tag size={14} /><span>{post.tags.split(',')[0].trim()}</span></>}
                  </div>
                  <h2 className={cn('font-bold tracking-tight group-hover:text-[hsl(var(--accent))] transition-colors', i === 0 && posts.length > 1 ? 'text-2xl' : 'text-lg')}>
                    {post.title}
                  </h2>
                  {post.excerpt && <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">{post.excerpt}</p>}
                  <div className="mt-auto pt-4">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--accent))]">
                      阅读更多 <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
