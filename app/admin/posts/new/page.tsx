import { getSession, isAdmin } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/Sidebar'
import { redirect } from 'next/navigation'
import { PostEditor } from '@/components/admin/PostEditor'

export default async function NewPostPage() {
  const session = await getSession()
  if (!session || !isAdmin(session)) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <AdminSidebar />
      <div className="pl-60 transition-all">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold mb-8">写文章</h1>
          <PostEditor />
        </div>
      </div>
    </div>
  )
}
