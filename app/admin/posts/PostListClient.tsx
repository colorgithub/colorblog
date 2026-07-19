'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, ExternalLink, Search } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { useState } from 'react'
import toast from 'react-hot-toast'

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
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除「${title}」吗？此操作不可撤销。`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('文章已删除')
      router.refresh()
    } catch {
      toast.error('删除失败')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="rounded-2xl border bg-[hsl(var(--card))] overflow-hidden">
      <div className="p-4 border-b">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索文章..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {posts.length === 0 ? '还没有文章，去写一篇吧' : '没有匹配的文章'}
        </div>
      ) : (
        <div className="divide-y">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between p-4 hover:bg-[hsl(var(--muted))/50] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    post.published ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                  title={post.published ? '已发布' : '草稿'}
                />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{post.title}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {formatDate(post.createdAt)}
                    {post.tags && ` · ${post.tags.split(',').map(t => t.trim()).join(', ')}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/posts/${post.slug}`}
                  target="_blank"
                  className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all"
                  title="查看"
                >
                  <ExternalLink size={16} />
                </Link>
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all"
                  title="编辑"
                >
                  <Edit size={16} />
                </Link>
                <button
                  onClick={() => handleDelete(post.id, post.title)}
                  disabled={deleting === post.id}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-[hsl(var(--muted-foreground))] hover:text-red-600 transition-all disabled:opacity-50"
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
