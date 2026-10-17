'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Eye, EyeOff, ImageIcon, Loader2, Hash, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { FileUploader, type UploadResult } from '@/components/FileUploader'

interface PostData {
  title: string
  slug: string
  content: string
  excerpt: string
  tags: string
  published: boolean
}

interface PostEditorProps {
  initialData?: PostData
  /** 编辑模式下必须传文章 id，避免依赖 initialData 里混入的字段 */
  postId?: string
  isEditing?: boolean
}

export function PostEditor({ initialData, postId, isEditing }: PostEditorProps) {
  const router = useRouter()
  const textRef = useRef<HTMLTextAreaElement>(null)

  const [form, setForm] = useState<PostData>({
    title: initialData?.title ?? '',
    slug: initialData?.slug ?? '',
    content: initialData?.content ?? '',
    excerpt: initialData?.excerpt ?? '',
    tags: initialData?.tags ?? '',
    published: initialData?.published ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)
  const [dirty, setDirty] = useState(false)

  // 有未保存改动时离开页面给出提示
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const update = (patch: Partial<PostData>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setDirty(true)
  }

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled'

  const insertAtCursor = (snippet: string) => {
    const ta = textRef.current
    if (!ta) {
      update({ content: form.content + (form.content ? '\n' : '') + snippet })
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const next = form.content.slice(0, start) + snippet + form.content.slice(end)
    update({ content: next })
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + snippet.length
      ta.focus()
    })
  }

  const handleUpload = ({ url, name, inline }: UploadResult) => {
    const alt = name.replace(/\.[^.]+$/, '')
    insertAtCursor(inline ? `![${alt}](${url})` : `[${name}](${url})`)
    toast.success('已插入')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!form.title.trim()) return toast.error('请输入标题')
    if (!form.slug.trim()) return toast.error('请输入 Slug')
    if (!form.content.trim()) return toast.error('请输入正文')

    setLoading(true)
    try {
      const url = isEditing ? `/api/posts/${postId}` : '/api/posts'
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data.error || '保存失败')
        return
      }

      setDirty(false)
      toast.success(isEditing ? '文章已更新' : '文章已创建')
      router.push('/admin/posts')
      router.refresh()
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = form.title.trim() && form.slug.trim() && form.content.trim()

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* 主编辑区 */}
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="label-field">
            标题
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) =>
              update({
                title: e.target.value,
                // 新建时跟随标题自动生成 slug，编辑时不覆盖已有 slug
                ...(isEditing ? {} : { slug: generateSlug(e.target.value) }),
              })
            }
            className="input-field text-base font-medium"
            placeholder="文章标题"
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="slug" className="label-field">
            <span className="inline-flex items-center gap-1.5">
              <Hash size={13} className="text-muted-foreground" />
              Slug（URL 地址）
            </span>
          </label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 font-mono text-xs text-muted-foreground">/posts/</span>
            <input
              id="slug"
              type="text"
              value={form.slug}
              onChange={(e) => update({ slug: e.target.value })}
              className="input-field font-mono text-sm"
              placeholder="article-url-slug"
              maxLength={120}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="content" className="text-sm font-medium">
              正文（Markdown）
            </label>
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              className="btn btn-subtle btn-sm"
            >
              {preview ? <EyeOff size={14} /> : <Eye size={14} />}
              {preview ? '继续编辑' : '预览'}
            </button>
          </div>

          {preview ? (
            <div className="min-h-[26rem] rounded-xl border border-border bg-card p-6">
              {form.content.trim() ? (
                <MarkdownRenderer content={form.content} className="prose-sm sm:prose-base" />
              ) : (
                <p className="text-sm text-muted-foreground">还没有内容可预览</p>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-input bg-card transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <textarea
                id="content"
                ref={textRef}
                value={form.content}
                onChange={(e) => update({ content: e.target.value })}
                rows={20}
                className="w-full resize-y border-0 bg-transparent px-4 py-3.5 font-mono text-sm leading-relaxed focus:outline-none"
                placeholder={'# 标题\n\n用 Markdown 写正文…\n\n```js\nconsole.log("hello")\n```'}
              />
              <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
                <FileUploader onInsert={handleUpload} label="插入图片 / 附件" />
                <span className="text-xs text-muted-foreground">
                  支持 Markdown、表格、代码块
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 侧栏 */}
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="card-surface space-y-5 p-5">
          <h2 className="text-sm font-semibold">发布设置</h2>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{form.published ? '已发布' : '草稿'}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {form.published ? '所有人都能访问' : '仅自己可见'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.published}
              onClick={() => update({ published: !form.published })}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                form.published ? 'bg-accent' : 'bg-input'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  form.published ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          <div>
            <label htmlFor="excerpt" className="label-field">
              摘要
            </label>
            <textarea
              id="excerpt"
              value={form.excerpt}
              onChange={(e) => update({ excerpt: e.target.value })}
              rows={3}
              maxLength={500}
              className="input-field resize-none text-sm"
              placeholder="一句话概括这篇文章，用于列表和分享卡片"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground tabular-nums">
              {form.excerpt.length}/500
            </p>
          </div>

          <div>
            <label htmlFor="tags" className="label-field">
              标签
            </label>
            <input
              id="tags"
              type="text"
              value={form.tags}
              onChange={(e) => update({ tags: e.target.value })}
              className="input-field text-sm"
              placeholder="技术, 生活"
              maxLength={200}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">用英文逗号分隔</p>
          </div>
        </div>

        {dirty && (
          <p className="flex items-center gap-1.5 text-xs text-warning">
            <AlertCircle size={13} />
            有未保存的修改
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="btn btn-primary btn-md w-full"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {loading ? '保存中…' : isEditing ? '更新文章' : '发布文章'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/admin/posts')}
          className="btn btn-ghost btn-md w-full"
        >
          取消
        </button>
      </aside>
    </form>
  )
}
