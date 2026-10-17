import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, Calendar, Clock, EyeOff } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getSession, isAdmin } from '@/lib/auth'
import { formatDate, parseTagList, plainExcerpt, readingTime } from '@/lib/utils'
import { SITE_NAME } from '@/lib/site'
import { SITE_URL } from '@/lib/env'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { ReadingProgress } from '@/components/ReadingProgress'
import { CommentsSection } from '@/components/Comments'

async function getPost(slug: string) {
  // 用 findFirst 而不是 findUnique：这里要按 slug 取，且未发布时还要
  // 判断访问者身份，逻辑放在页面里更清楚。
  return prisma.post.findFirst({ where: { slug } })
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post || !post.published) {
    return { title: '文章不存在' }
  }

  const description = post.excerpt || plainExcerpt(post.content)
  const url = `${SITE_URL}/posts/${post.slug}`

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url,
      siteName: SITE_NAME,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: parseTagList(post.tags),
      images: post.coverImage ? [post.coverImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
    },
  }
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  // 草稿只对管理员可见，普通访客按「不存在」处理
  if (!post.published) {
    const session = await getSession()
    if (!isAdmin(session)) notFound()
  }

  const tags = parseTagList(post.tags)
  const minutes = readingTime(post.content)

  return (
    <>
      <ReadingProgress />

      <article className="container-prose py-12 sm:py-16">
        <Link
          href="/posts"
          className="group mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
        >
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
          返回文章列表
        </Link>

        <header className="mb-10">
          {!post.published && (
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
              <EyeOff size={12} />
              草稿 · 仅管理员可见
            </span>
          )}

          {tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link key={tag} href={`/posts?tag=${encodeURIComponent(tag)}`} className="chip">
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem]">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {post.excerpt}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} />
              <time dateTime={post.createdAt.toISOString()}>{formatDate(post.createdAt)}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} />
              {minutes} 分钟阅读
            </span>
            {post.updatedAt.getTime() - post.createdAt.getTime() > 60_000 && (
              <span className="text-xs">最后更新于 {formatDate(post.updatedAt)}</span>
            )}
          </div>
        </header>

        <MarkdownRenderer content={post.content} />

        <div className="mt-16 border-t border-border pt-8">
          <Link href="/posts" className="btn btn-ghost btn-md">
            <ArrowLeft size={15} />
            浏览更多文章
          </Link>
        </div>

        <CommentsSection slug={post.slug} />
      </article>
    </>
  )
}
