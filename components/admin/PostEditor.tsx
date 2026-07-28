'use client'

import { useState, FormEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Eye, EyeOff, ImageIcon, Paperclip } from 'lucide-react'
import toast from 'react-hot-toast'
import { FileUploader } from '@/components/FileUploader'

interface PostData {
  title: string
  slug: string
  content: string
  excerpt: string
  tags: string
  published: boolean
}

export function PostEditor({ initialData, isEditing }: {
  initialData?: PostData & { id?: string }
  isEditing?: boolean
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const [form, setForm] = useState<PostData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    excerpt: initialData?.excerpt || '',
    tags: initialData?.tags || '',
    published: initialData?.published ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled'

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('请选择图片文件'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('图片不能超过 5MB'); return }

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
        const before = form.content.slice(0, start)
        const after = form.content.slice(end)
        const newContent = before + imgMd + after
        setForm((p) => ({ ...p, content: newContent }))
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + imgMd.length
          ta.focus()
        })
      }
      setUploading(false)
    }
    reader.onerror = () => { toast.error('图片读取失败'); setUploading(false) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleFileInsert = (result: { url: string; name: string }) => {
    const ta = textRef.current
    if (!ta) return
    const linkMd = `[${result.name}](${result.url})`
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = form.content.slice(0, start)
    const after = form.content.slice(end)
    setForm((p) => ({ ...p, content: before + linkMd + after }))
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + linkMd.length
      ta.focus()
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('请输入标题'); return }
    if (!form.slug.trim()) { toast.error('请输入 Slug'); return }
    if (!form.content.trim()) { toast.error('请输入内容'); return }

    setLoading(true)
    try {
      const url = isEditing ? `/api/posts/${initialData!.id}` : '/api/posts'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存失败')
      }

      toast.success(isEditing ? '文章已更新' : '文章已发布')
      router.push('/admin/posts')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">标题</label>
            <input type="text" value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value, slug: isEditing ? p.slug : generateSlug(e.target.value) }))}
              className="w-full px-4 py-3 rounded-xl border bg-[hsl(var(--background))] text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all"
              placeholder="文章标题" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Slug</label>
            <input type="text" value={form.slug}
              onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border bg-[hsl(var(--background))] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all"
              placeholder="article-url-slug" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">内容 (Markdown)</label>
              <button type="button" onClick={() => setPreview(!preview)}
                className="text-xs text-[hsl(var(--accent))] hover:underline flex items-center gap-1">
                {preview ? <EyeOff size={14} /> : <Eye size={14} />}{preview ? '编辑' : '预览'}
              </button>
            </div>
            {preview ? (
              <div className="min-h-[400px] rounded-xl border bg-[hsl(var(--background))] p-4 prose prose-sm dark:prose-invert max-w-none overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(form.content) }} />
              </div>
            ) : (
              <div className="relative">
                <textarea ref={textRef} value={form.content}
                  onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))}
                  rows={16}
                  className="w-full px-4 py-3 pb-12 rounded-xl border bg-[hsl(var(--background))] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all resize-y"
                  placeholder="使用 Markdown 编写文章内容..." />
                <div className="absolute left-2 bottom-2 flex items-center gap-1">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--muted))] text-xs font-medium hover:bg-[hsl(var(--muted-foreground))/20] transition-all disabled:opacity-50"
                    title="上传图片">
                    <ImageIcon size={14} />{uploading ? '处理中...' : '图片'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <FileUploader onInsert={handleFileInsert} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-[hsl(var(--card))] p-5 space-y-4">
            <h3 className="text-sm font-semibold">发布设置</h3>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">发布状态</span>
              <button type="button" onClick={() => setForm(p => ({ ...p, published: !p.published }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.published ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--muted))]'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.published ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>

            <div>
              <label className="block text-sm font-medium mb-1.5">摘要</label>
              <textarea value={form.excerpt}
                onChange={(e) => setForm(p => ({ ...p, excerpt: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all resize-none"
                placeholder="文章简介..." />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">标签</label>
              <input type="text" value={form.tags}
                onChange={(e) => setForm(p => ({ ...p, tags: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-all"
                placeholder="技术, 生活" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[hsl(var(--accent))] text-white font-medium hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            <Save size={18} />{loading ? '保存中...' : isEditing ? '更新文章' : '发布文章'}
          </button>
        </div>
      </div>
    </form>
  )
}

function simpleMarkdown(md: string): string {
  const escaped = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let html = '', inCode = false
  for (const line of escaped.split('\n')) {
    if (line.startsWith('```')) {
      if (inCode) { html += '</code></pre>'; inCode = false } else { html += '<pre><code>'; inCode = true }
      continue
    }
    if (inCode) { html += line + '\n'; continue }
    if (line.startsWith('### ')) html += `<h3>${line.slice(4)}</h3>`
    else if (line.startsWith('## ')) html += `<h2>${line.slice(3)}</h2>`
    else if (line.startsWith('# ')) html += `<h1>${line.slice(2)}</h1>`
    else if (line.startsWith('- ')) html += `<li>${line.slice(2)}</li>`
    else if (line.startsWith('> ')) html += `<blockquote>${line.slice(2)}</blockquote>`
    else if (line.trim() === '') html += '<br/>'
    else {
      html += '<p>' + line
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-xl my-2" />')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>') + '</p>'
    }
  }
  if (inCode) html += '</code></pre>'
  return html
}
