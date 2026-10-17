'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Edit, Trash2, ExternalLink, Search, Loader2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatDate, parseTagList } from '@/lib/utils'

interface Post {
  id: string
  title: string
  slug: string
  published: boolean
  createdAt: string
  updatedAt: string
  tags: string
}

export function PostListClient({ posts }: { posts: Post[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return posts.filter((post) => {
      if (filter === 'published' && !post.published) return false
      if (filter === 'draft' && post.published) return false
      if (!keyword) return true
      return (
        post.title.toLowerCase().includes(keyword) || post.slug.toLowerCase().includes(keyword)
      )
    })
  }, [posts, search, filter])

  const handleDelete = async (post: Post) => {
    if (!confirm(`确定要删除「${post.title}」吗？此操作不可撤销。`)) return

    setDeleting(post.id)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || '删除失败')
        return
      }
      toast.success('文章已删除')
      router.refresh()
    } catch {
      toast.error('删除失败，请检查网络')
    } finally {
      setDeleting(null)
    }
  }

  const filters = [
    { key: 'all' as const, label: '全部', count: posts.length },
    {
      key: 'published' as const,
      label: '已发布',
      count: posts.filter((p) => p.published).length,
    },
    { key: 'draft' as const, label: '草稿', count: posts.filter((p) => !p.published).length },
  ]

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题或 Slug…"
            className="input-field h-9 pl-9 text-sm"
            aria-label="搜索文章"
          />
        </div>

        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                filter === f.key
                  ? 'bg-card text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f.label}
              <span className="ml-1.5 opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <FileText size={22} className="mx-auto text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            {posts.length === 0 ? '还没有文章，去写一篇吧' : '没有匹配的文章'}
          </p>
          {posts.length === 0 && (
            <Link href="/admin/posts/new" className="btn btn-primary btn-sm mt-4">
              写第一篇
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((post) => (
            <li
              key={post.id}
              className="group flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted/60 sm:px-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    post.published ? 'bg-success' : 'bg-warning'
                  )}
                  title={post.published ? '已发布' : '草稿'}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{post.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-mono">/{post.slug}</span>
                    <span>·</span>
                    <span>{formatDate(post.updatedAt)}</span>
                    {parseTagList(post.tags).length > 0 && (
                      <>
                        <span>·</span>
                        <span className="truncate">{parseTagList(post.tags).join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <Link
                  href={`/posts/${post.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-subtle btn-icon"
                  title="查看"
                  aria-label="查看"
                >
                  <ExternalLink size={15} />
                </Link>
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="btn btn-subtle btn-icon"
                  title="编辑"
                  aria-label="编辑"
                >
                  <Edit size={15} />
                </Link>
                <button
                  onClick={() => handleDelete(post)}
                  disabled={deleting === post.id}
                  className="btn btn-danger btn-icon"
                  title="删除"
                  aria-label="删除"
                >
                  {deleting === post.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
