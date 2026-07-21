'use client'

import { useEffect, useState, FormEvent } from 'react'
import { MessageSquare, Send, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface CommentUser {
  name: string
  username: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: CommentUser
}

export function CommentsSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [session, setSession] = useState<{ name: string; username: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(`/api/posts/${slug}/comments`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {})

    fetch('/api/auth/me')
      .then((r) => r.json().then((d) => { if (d.authenticated) setSession(d.user) }))
      .catch(() => {})
  }, [slug])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (!res.ok) return
      const comment = await res.json()
      setComments((prev) => [...prev, comment])
      setContent('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t pt-10 mt-10">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare size={20} /> 评论 ({comments.length})
      </h2>

      {session ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-3">
            <User size={14} /> <span className="font-medium text-[hsl(var(--foreground))]">{session.name}</span>
            <span className="text-xs">发表评论</span>
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all resize-none"
            placeholder="写下你的想法..." required />
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={sending || !content.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--accent))] text-white text-sm font-medium hover:brightness-110 disabled:opacity-50 transition-all">
              <Send size={14} />{sending ? '发送中...' : '发送'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 rounded-xl bg-[hsl(var(--muted))/50] text-center text-sm text-[hsl(var(--muted-foreground))]">
          <a href="/admin/login" className="text-[hsl(var(--accent))] hover:underline font-medium">登录</a> 或 <a href="/register" className="text-[hsl(var(--accent))] hover:underline font-medium">注册</a> 后发表评论
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">暂无评论，来写第一条吧</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 rounded-xl border bg-[hsl(var(--card))]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-[hsl(var(--accent))/10] flex items-center justify-center">
                  <User size={14} className="text-[hsl(var(--accent))]" />
                </div>
                <span className="text-sm font-medium">{comment.user.name}</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
