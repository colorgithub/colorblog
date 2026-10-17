import Link from 'next/link'
import { ArrowUpRight, Calendar, Clock } from 'lucide-react'
import { cn, formatDate, parseTagList, readingTime } from '@/lib/utils'

export interface PostCardData {
  id: string
  title: string
  slug: string
  excerpt: string
  tags: string
  createdAt: Date | string
  content?: string
}

interface PostCardProps {
  post: PostCardData
  featured?: boolean
  className?: string
}

export function PostCard({ post, featured = false, className }: PostCardProps) {
  const tags = parseTagList(post.tags)

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={cn(
        'card-interactive group flex flex-col overflow-hidden p-6',
        featured && 'sm:p-8',
        className
      )}
    >
      {/* 悬停时右上角浮现的箭头 */}
      <span className="absolute right-5 top-5 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent">
        <ArrowUpRight size={18} />
      </span>

      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 pr-8 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={13} />
          <time dateTime={new Date(post.createdAt).toISOString()}>{formatDate(post.createdAt)}</time>
        </span>
        {post.content && (
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} />
            {readingTime(post.content)} 分钟
          </span>
        )}
      </div>

      <h2
        className={cn(
          'font-semibold leading-snug tracking-tight transition-colors group-hover:text-accent',
          featured ? 'text-2xl sm:text-3xl' : 'text-lg'
        )}
      >
        {post.title}
      </h2>

      {post.excerpt && (
        <p
          className={cn(
            'mt-2.5 leading-relaxed text-muted-foreground',
            featured ? 'line-clamp-3 text-base' : 'line-clamp-2 text-sm'
          )}
        >
          {post.excerpt}
        </p>
      )}

      {tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {tags.slice(0, featured ? 5 : 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors group-hover:bg-accent/10 group-hover:text-accent"
            >
              {tag}
            </span>
          ))}
          {tags.length > (featured ? 5 : 3) && (
            <span className="rounded-full px-2 py-1 text-[11px] text-muted-foreground">
              +{tags.length - (featured ? 5 : 3)}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

/** 列表页 / 首页共用的空状态。 */
export function EmptyPosts({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card-surface flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <h3 className="mt-5 text-base font-semibold">{title}</h3>
      {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
    </div>
  )
}
