import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PostEditor } from '@/components/admin/PostEditor'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({ where: { id: params.id } })
  if (!post) notFound()

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link
          href="/admin/posts"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
        >
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
          返回文章管理
        </Link>
        <Link
          href={`/posts/${post.slug}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost btn-sm"
        >
          <ExternalLink size={14} />
          预览
        </Link>
      </div>

      <h1 className="mb-8 text-2xl font-bold tracking-tight">编辑文章</h1>
      <PostEditor
        initialData={{
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          tags: post.tags,
          published: post.published,
        }}
        postId={post.id}
        isEditing
      />
    </div>
  )
}
