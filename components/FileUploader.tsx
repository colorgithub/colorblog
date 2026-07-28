'use client'

import { useRef, useState } from 'react'
import { Paperclip, Loader2 } from 'lucide-react'

interface UploadResult {
  url: string
  name: string
}

export function FileUploader({ onInsert }: { onInsert: (result: UploadResult) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { alert('文件不能超过 4MB'); return }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/files', { method: 'POST', body: fd })
      if (!res.ok) { const d = await res.json(); alert(d.error || '上传失败'); return }

      const data = await res.json()
      onInsert(data)
    } catch { alert('上传失败') }
    finally { setUploading(false); e.target.value = '' }
  }

  return (
    <>
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
        className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all disabled:opacity-50"
        title="上传文件">
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
      </button>
      <input ref={fileRef} type="file" onChange={handleFile} className="hidden" />
    </>
  )
}
