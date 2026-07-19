import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/Sidebar'
import { redirect, notFound } from 'next/navigation'
import { PostEditor } from '@/components/admin/PostEditor'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const post = await prisma.post.findUnique({ where: { id: params.id } })
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <AdminSidebar />
      <div className="pl-60 transition-all">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold mb-8">编辑文章</h1>
          <PostEditor initialData={post} isEditing />
        </div>
      </div>
    </div>
  )
}
