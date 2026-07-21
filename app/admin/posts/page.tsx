import { prisma } from '@/lib/prisma'
import { getSession, isAdmin } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/Sidebar'
import { redirect } from 'next/navigation'
import { PostListClient } from './PostListClient'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function AdminPostsPage() {
  const session = await getSession()
  if (!session || !isAdmin(session)) redirect('/admin/login')

  const posts = await prisma.post.findMany({ orderBy: { updatedAt: 'desc' } })
  const serialized = posts.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <AdminSidebar />
      <div className="pl-60 transition-all">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">文章管理</h1>
            <Link href="/admin/posts/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--accent))] text-white text-sm font-medium hover:brightness-110 transition-all">
              <Plus size={18} />写文章
            </Link>
          </div>
          <PostListClient posts={serialized} />
        </div>
      </div>
    </div>
  )
}
