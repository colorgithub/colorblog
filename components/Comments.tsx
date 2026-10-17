'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { MessageSquare, Send, Trash2, ImageIcon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatDateTime } from '@/lib/utils'
import { CommentMarkdown } from '@/components/MarkdownRenderer'
import { FileUploader, type UploadResult } from '@/components/FileUploader'
import { COMMENT_MAX_LENGTH } from '@/lib/constants'

interface CommentUser {
  name: string
  username: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  userId: string
  user: CommentUser
}

interface SessionUser {
  userId: string
  username: string
  name: string
  role: string
}

interface CommentsResponse {
  data: Comment[]
  total: number
  hasMore: boolean
}

export function CommentsSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [content, setContent] = useState('')
  const [session, setSession] = useState<SessionUser | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [sending, setSending] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(
    async (offset: number) => {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/comments?offset=${offset}`)
      if (!res.ok) return null
      return (await res.json()) as CommentsResponse
    },
    [slug]
  )

  useEffect(() => {
    let cancelled = false

    load(0)
      .then((result) => {
        if (cancelled || !result) return
        setComments(result.data)
        setTotal(result.total)
        setHasMore(result.hasMore)
      })
      .catch(() => {})

    fetch('/api/auth/me')
      .then((r) => r.json().then((d) => !cancelled && setSession(d.authenticated ? d.user : null)))
      .catch(() => {})
      .finally(() => !cancelled && setSessionLoaded(true))

    return () => {
      cancelled = true
    }
  }, [load])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const result = await load(comments.length)
      if (!result) {
        toast.error('加载失败，请重试')
        return
      }
      setComments((prev) => [...prev, ...result.data])
      setHasMore(result.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }

  const insertAtCursor = (snippet: string) => {
    const ta = textRef.current
    if (!ta) {
      setContent((prev) => prev + (prev ? '\n' : '') + snippet)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const next = content.slice(0, start) + snippet + content.slice(end)
    setContent(next)
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + snippet.length
      ta.focus()
    })
  }

  const handleUpload = ({ url, name, inline }: UploadResult) => {
    const alt = name.replace(/\.[^.]+$/, '')
    // 图片用 ![]() 内联展示，其余附件用 []() 作为下载链接
    insertAtCursor(inline ? `![${alt}](${url})` : `[${name}](${url})`)
    toast.success('已插入')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || sending) return

    if (trimmed.length > COMMENT_MAX_LENGTH) {
      toast.error(`评论不能超过 ${COMMENT_MAX_LENGTH} 个字符`)
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data.error || '发表失败')
        return
      }

      setComments((prev) => [...prev, data as Comment])
      setTotal((prev) => prev + 1)
      setContent('')
      toast.success('评论已发表')
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || '删除失败')
        return
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setTotal((prev) => Math.max(0, prev - 1))
      toast.success('评论已删除')
    } catch {
      toast.error('删除失败，请检查网络')
    }
  }

  const canDelete = (comment: Comment) => {
    if (!session) return false
    if (session.role === 'ADMIN') return true
    return comment.userId === session.userId
  }

  const remaining = COMMENT_MAX_LENGTH - content.length

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
        <MessageSquare size={18} className="text-accent" />
        评论
        {total > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {total}
          </span>
        )}
      </h2>

      {/* 发表评论 */}
      {!sessionLoaded ? (
        <div className="skeleton mt-6 h-28 w-full" />
      ) : session ? (
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent">
                {(session.name || session.username).slice(0, 1).toUpperCase()}
              </span>
              <span className="font-medium">{session.name || session.username}</span>
              <span className="text-xs text-muted-foreground">支持 Markdown 与图片</span>
            </div>

            <textarea
              ref={textRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="写下你的想法…"
              className="w-full resize-none border-0 bg-transparent px-4 py-3.5 text-sm leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5">
              <div className="flex items-center gap-1">
                <FileUploader onInsert={handleUpload} />
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  图片 / PDF / ZIP，最大 4MB
                </span>
              </div>

              <div className="flex items-center gap-3">
                {content.length > COMMENT_MAX_LENGTH * 0.8 && (
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      remaining < 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}
                  >
                    {remaining}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={sending || !content.trim() || remaining < 0}
                  className="btn btn-primary btn-sm"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {sending ? '发送中' : '发表'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-8 text-center">
          <ImageIcon size={20} className="text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">登录后即可参与讨论</p>
          <div className="flex gap-2">
            <Link href="/admin/login" className="btn btn-ghost btn-sm">
              登录
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm">
              注册
            </Link>
          </div>
        </div>
      )}

      {/* 评论列表 */}
      <div className="mt-8 space-y-4">
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            还没有评论，来写第一条吧
          </p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="group animate-fade-in rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent/25"
            >
              <header className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                    {(comment.user.name || comment.user.username).slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {comment.user.name || comment.user.username}
                    </p>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={new Date(comment.createdAt).toISOString()}
                    >
                      {formatDateTime(comment.createdAt)}
                    </time>
                  </div>
                </div>

                {canDelete(comment) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="btn btn-danger btn-icon opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                    title="删除评论"
                    aria-label="删除评论"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </header>

              {/* 这里刻意不解析原始 HTML —— 见 MarkdownRenderer 里的说明 */}
              <CommentMarkdown content={comment.content} />
            </article>
          ))
        )}

        {hasMore && (
          <div className="pt-2 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="btn btn-ghost btn-md"
            >
              {loadingMore && <Loader2 size={14} className="animate-spin" />}
              {loadingMore ? '加载中…' : `加载更多评论（还有 ${total - comments.length} 条）`}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
