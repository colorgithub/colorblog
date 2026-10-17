import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PostEditor } from '@/components/admin/PostEditor'

export default function NewPostPage() {
  return (
    <div>
      <Link
        href="/admin/posts"
        className="group mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
        返回文章管理
      </Link>

      <h1 className="mb-8 text-2xl font-bold tracking-tight">写文章</h1>
      <PostEditor />
    </div>
  )
}
