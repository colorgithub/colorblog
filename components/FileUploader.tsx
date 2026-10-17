'use client'

import { useRef, useState } from 'react'
import { Paperclip, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export interface UploadResult {
  id: string
  url: string
  name: string
  size: number
  type: string
  inline: boolean
}

/** 与服务端 lib/file-type.ts 的白名单保持一致。 */
export const ACCEPTED_UPLOADS =
  'image/jpeg,image/png,image/gif,image/webp,application/pdf,application/zip'

const MAX_SIZE = 4 * 1024 * 1024

interface FileUploaderProps {
  onInsert: (result: UploadResult) => void
  className?: string
  label?: string
  title?: string
}

export function FileUploader({
  onInsert,
  className,
  label,
  title = '上传图片或附件',
}: FileUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_SIZE) {
      toast.error('文件不能超过 4MB')
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/files', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data.error || '上传失败')
        return
      }

      onInsert(data as UploadResult)
    } catch {
      toast.error('上传失败，请检查网络')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title={title}
        aria-label={title}
        className={cn(
          label ? 'btn btn-ghost btn-sm' : 'btn btn-subtle btn-icon',
          'disabled:opacity-50',
          className
        )}
      >
        {uploading ? (
          <Loader2 size={label ? 14 : 17} className="animate-spin" />
        ) : (
          <Paperclip size={label ? 14 : 17} />
        )}
        {label && <span>{uploading ? '上传中…' : label}</span>}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_UPLOADS}
        onChange={handleFile}
        className="hidden"
      />
    </>
  )
}
