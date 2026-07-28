'use client'

import { useEffect, useState, FormEvent, useCallback, useRef } from 'react'
import { MessageSquare, Send, User, Trash2, ImageIcon } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { FileUploader } from '@/components/FileUploader'

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

function renderCommentContent(text: string) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g
  let match: RegExpExecArray | null

  while ((match = imgRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex} className="whitespace-pre-wrap">{text.slice(lastIndex, match.index)}</span>)
    }
    parts.push(
      <img key={match.index} src={match[2]} alt={match[1]}
        className="max-w-full max-h-64 rounded-xl my-2 object-contain border"
        loading="lazy" />
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex} className="whitespace-pre-wrap">{text.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{text}</span>
}

export function CommentsSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [session, setSession] = useState<{ userId: string; name: string; username: string; role: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const fetchComments = useCallback(() => {
    fetch(`/api/posts/${slug}/comments`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {})
  }, [slug])

  useEffect(() => {
    fetchComments()
    fetch('/api/auth/me')
      .then((r) => r.json().then((d) => { if (d.authenticated) setSession(d.user) }))
      .catch(() => {})
  }, [fetchComments])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('请选择图片文件'); return }
    if (file.size > 5 * 1024 * 1024) { alert('图片不能超过 5MB'); return }

    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const alt = file.name.replace(/\.[^.]+$/, '')
      const imgMd = `![${alt}](${dataUrl})`

      const ta = textRef.current
      if (ta) {
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const before = content.slice(0, start)
        const after = content.slice(end)
        const newText = before + imgMd + after
        setContent(newText)
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + imgMd.length
          ta.focus()
        })
      } else {
        setContent((prev) => prev + (prev ? '\n' : '') + imgMd)
      }

      setUploading(false)
    }
    reader.onerror = () => { alert('图片读取失败'); setUploading(false) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

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

  const handleDelete = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
      if (!res.ok) return
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch {}
  }

  const canDelete = (comment: Comment) => {
    if (!session) return false
    if (session.role === 'ADMIN') return true
    return comment.userId === session.userId
  }

  return (
    <div className="border-t pt-10 mt-10">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare size={20} /> 评论 ({comments.length})
      </h2>

      {session ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-3">
            <User size={14} /> <span className="font-medium text-[hsl(var(--foreground))]">{session.name || session.username}</span>
            <span className="text-xs">发表评论</span>
          </div>

          <div className="relative">
            <textarea ref={textRef} value={content} onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 pr-12 rounded-xl border bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all resize-none"
              placeholder="写下你的想法... 支持 Markdown 和图片" required />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all disabled:opacity-50"
                title="上传图片">
                <ImageIcon size={18} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <FileUploader onInsert={({ url, name }) => {
                const md = `[${name}](${url})`
                setContent((prev) => prev + (prev ? '\n' : '') + md)
              }} />
              <button type="submit" disabled={sending || !content.trim()}
                className="p-1.5 rounded-lg text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))/10] transition-all disabled:opacity-50"
                title="发送">
                <Send size={18} />
              </button>
            </div>
          </div>
          {uploading && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">正在处理图片...</p>}
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[hsl(var(--accent))/10] flex items-center justify-center">
                    <User size={14} className="text-[hsl(var(--accent))]" />
                  </div>
                  <span className="text-sm font-medium">{comment.user.name || comment.user.username}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(comment.createdAt)}</span>
                </div>
                {canDelete(comment) && (
                  <button onClick={() => handleDelete(comment.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-[hsl(var(--muted-foreground))] hover:text-red-600 transition-all"
                    title="删除评论">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="text-sm leading-relaxed">{renderCommentContent(comment.content)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
