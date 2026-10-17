import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PostListClient } from './PostListClient'

export default async function AdminPostsPage() {
  // 权限校验已由 app/admin/(protected)/layout.tsx 统一完成
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const serialized = posts.map((post) => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }))

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">文章管理</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            共 {posts.length} 篇，其中 {posts.filter((p) => p.published).length} 篇已发布
          </p>
        </div>
        <Link href="/admin/posts/new" className="btn btn-primary btn-md">
          <Plus size={16} />
          写文章
        </Link>
      </header>

      <PostListClient posts={serialized} />
    </div>
  )
}
