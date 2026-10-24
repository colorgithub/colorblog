import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { SITE_NAME } from '@/lib/site'
import { PostCard, EmptyPosts, type PostCardData } from '@/components/PostCard'

// 首页原先走 ISR（revalidate = 60）。升级到 Next 15 + React 19 后，预渲染出来的
// 静态 HTML 在 hydration 时稳定报 React #418（<html> 不匹配），而同样的 layout
// 在动态页面上完全正常 —— 差别只在于静态页把 title/og/twitter 等 metadata 全部
// 写进了首屏 HTML，动态页则是流式补上的。改成按请求渲染以消除这个不匹配；
// 个人博客的查询量下这点开销可以忽略。
export const dynamic = 'force-dynamic'

const HOME_LIMIT = 7

interface HomeData {
  posts: PostCardData[]
  total: number
  /** 数据库暂时不可用时为 true，用于给访客一个诚实的提示，而不是假装「还没有文章」 */
  failed: boolean
}

async function getPosts(): Promise<HomeData> {
  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: HOME_LIMIT,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          tags: true,
          createdAt: true,
        },
      }),
      prisma.post.count({ where: { published: true } }),
    ])
    return { posts, total, failed: false }
  } catch (err) {
    // 首页是 ISR 页面，会在构建期预渲染。这里如果不兜住，数据库抖动
    // 会直接让整个部署失败。记日志 + 降级展示，比让构建挂掉更合理。
    console.error('[home] 加载文章失败', err)
    return { posts: [], total: 0, failed: true }
  }
}

export default async function HomePage() {
  const { posts, total, failed } = await getPosts()
  const [featured, ...rest] = posts

  return (
    <div>
      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden">
        {/* 装饰层：网格 + 光晕 */}
        <div
          aria-hidden
          className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]"
        />
        <div
          aria-hidden
          className="absolute -top-32 left-1/2 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]"
        />

        <div className="container-page relative pb-16 pt-20 sm:pb-20 sm:pt-28">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
              <Sparkles size={13} className="text-accent" />
              {failed ? '内容加载中' : `共 ${total} 篇文章`}
            </span>

            <h1
              className="mt-6 animate-fade-up text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
              style={{ animationDelay: '60ms' }}
            >
              {SITE_NAME}
            </h1>

            <p
              className="mx-auto mt-5 max-w-xl animate-fade-up text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ animationDelay: '120ms' }}
            >
              记录技术、生活和思考。用文字沉淀知识，用分享连接世界。
            </p>

            <div
              className="mt-9 flex animate-fade-up flex-wrap items-center justify-center gap-3"
              style={{ animationDelay: '180ms' }}
            >
              <Link href="/posts" className="btn btn-primary btn-md">
                浏览全部文章
                <ArrowRight size={16} />
              </Link>
              <Link href="/feed.xml" className="btn btn-ghost btn-md">
                订阅 RSS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 文章列表 ============ */}
      <section className="container-page pb-20">
        {posts.length === 0 ? (
          failed ? (
            <EmptyPosts
              title="内容暂时无法加载"
              hint="数据库连接异常，请稍后刷新重试"
            />
          ) : (
            <EmptyPosts title="还没有文章" hint="登录管理后台，写下第一篇博客吧" />
          )
        ) : (
          <>
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">最新文章</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  持续更新中，共 {total} 篇
                </p>
              </div>
              {total > HOME_LIMIT && (
                <Link
                  href="/posts"
                  className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent"
                >
                  全部文章
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {featured && <PostCard post={featured} featured className="md:col-span-2" />}
              {rest.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
