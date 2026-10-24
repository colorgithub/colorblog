import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, X, ChevronLeft, ChevronRight, Tag as TagIcon } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { cn, parseTagList } from '@/lib/utils'
import { PostCard, EmptyPosts, type PostCardData } from '@/components/PostCard'

export const metadata: Metadata = {
  title: '全部文章',
  description: '按时间浏览全部已发布的文章，支持关键词搜索和标签筛选。',
}

const PAGE_SIZE = 9

interface PageProps {
  // Next 15 起 searchParams 是 Promise
  searchParams: Promise<{ q?: string; tag?: string; page?: string }>
}

function buildQuery(params: { q?: string; tag?: string; page?: number }) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.tag) search.set('tag', params.tag)
  if (params.page && params.page > 1) search.set('page', String(params.page))
  const qs = search.toString()
  return qs ? `/posts?${qs}` : '/posts'
}

async function getArchive({ q, tag, page }: { q: string; tag: string; page: number }) {
  const where = {
    published: true,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { excerpt: { contains: q, mode: 'insensitive' as const } },
            { content: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    // tags 目前是逗号分隔字符串，只能做包含匹配
    ...(tag ? { tags: { contains: tag } } : {}),
  }

  const [posts, total, tagRows] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        tags: true,
        createdAt: true,
      },
    }),
    prisma.post.count({ where }),
    // 标签云基于全部已发布文章统计，不受当前筛选影响
    prisma.post.findMany({ where: { published: true }, select: { tags: true } }),
  ])

  const counts = new Map<string, number>()
  for (const row of tagRows) {
    for (const t of parseTagList(row.tags)) {
      counts.set(t, (counts.get(t) ?? 0) + 1)
    }
  }
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  return { posts: posts as PostCardData[], total, tags }
}

export default async function PostsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim()
  const tag = (sp.tag ?? '').trim()
  const page = Math.max(1, Number(sp.page) || 1)

  const { posts, total, tags } = await getArchive({ q, tag, page })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filtering = Boolean(q || tag)

  return (
    <div className="container-page py-14 sm:py-20">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">全部文章</h1>
        <p className="mt-3 text-muted-foreground">
          {filtering ? (
            <>
              找到 <span className="font-medium text-foreground">{total}</span> 篇匹配的文章
            </>
          ) : (
            <>
              共 <span className="font-medium text-foreground">{total}</span> 篇文章，按发布时间倒序
            </>
          )}
        </p>
      </header>

      {/* 搜索 */}
      <form action="/posts" method="get" className="mb-6">
        {tag && <input type="hidden" name="tag" value={tag} />}
        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="搜索标题、摘要或正文…"
            className="input-field h-11 pl-10 pr-24"
            aria-label="搜索文章"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {q && (
              <Link
                href={buildQuery({ tag })}
                className="btn btn-subtle btn-sm"
                aria-label="清除搜索"
              >
                <X size={14} />
              </Link>
            )}
            <button type="submit" className="btn btn-primary btn-sm">
              搜索
            </button>
          </div>
        </div>
      </form>

      {/* 标签筛选 */}
      {tags.length > 0 && (
        <div className="mb-9 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <TagIcon size={13} />
            标签
          </span>
          <Link
            href={buildQuery({ q })}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              tag
                ? 'border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-accent'
                : 'border-accent bg-accent/10 text-accent'
            )}
          >
            全部
          </Link>
          {tags.map(([name, count]) => (
            <Link
              key={name}
              href={buildQuery({ q, tag: name })}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                tag === name
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-accent'
              )}
            >
              {name}
              <span className="ml-1.5 opacity-60">{count}</span>
            </Link>
          ))}
        </div>
      )}

      {/* 列表 */}
      {posts.length === 0 ? (
        <EmptyPosts
          title={filtering ? '没有匹配的文章' : '还没有文章'}
          hint={filtering ? '换个关键词或标签试试' : '登录管理后台，写下第一篇博客吧'}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <nav
          className="mt-12 flex items-center justify-center gap-1.5"
          aria-label="分页导航"
        >
          <PagerLink
            href={buildQuery({ q, tag, page: page - 1 })}
            disabled={page <= 1}
            label="上一页"
          >
            <ChevronLeft size={16} />
          </PagerLink>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-1.5">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="px-1 text-sm text-muted-foreground">…</span>
                )}
                <Link
                  href={buildQuery({ q, tag, page: p })}
                  aria-current={p === page ? 'page' : undefined}
                  className={cn(
                    'grid h-9 min-w-9 place-items-center rounded-xl border px-3 text-sm font-medium transition-colors',
                    p === page
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-accent'
                  )}
                >
                  {p}
                </Link>
              </span>
            ))}

          <PagerLink
            href={buildQuery({ q, tag, page: page + 1 })}
            disabled={page >= totalPages}
            label="下一页"
          >
            <ChevronRight size={16} />
          </PagerLink>
        </nav>
      )}
    </div>
  )
}

function PagerLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  const className =
    'grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors'
  if (disabled) {
    return (
      <span className={cn(className, 'cursor-not-allowed opacity-40')} aria-disabled="true">
        {children}
      </span>
    )
  }
  return (
    <Link href={href} className={cn(className, 'hover:border-accent/40 hover:text-accent')} aria-label={label}>
      {children}
    </Link>
  )
}
