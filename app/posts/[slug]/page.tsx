import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { ArrowLeft, Calendar, Tag, Clock } from 'lucide-react'

export const revalidate = 60

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true },
  })
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function PostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug, published: true },
  })

  if (!post) notFound()

  const readingTime = Math.ceil(post.content.split(/\s+/).length / 200)

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        返回首页
      </Link>

      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[hsl(var(--muted-foreground))] mb-4">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            {formatDate(post.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} />
            {readingTime} 分钟阅读
          </span>
          {post.tags && (
            <span className="inline-flex items-center gap-1.5">
              <Tag size={14} />
              {post.tags.split(',').map((tag) => tag.trim()).join(' / ')}
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] leading-relaxed">
            {post.excerpt}
          </p>
        )}
      </header>

      <div className="border-t pt-10">
        <MarkdownRenderer content={post.content} />
      </div>
    </article>
  )
}
