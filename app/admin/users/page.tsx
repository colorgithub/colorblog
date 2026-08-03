import { prisma } from '@/lib/prisma'
import { getSession, isAdmin } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/Sidebar'
import { redirect } from 'next/navigation'
import { UsersClient } from './UsersClient'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session || !isAdmin(session)) redirect('/admin/login')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { comments: true, files: true } },
    },
  })

  const serialized = users.map((u) => ({
    id: u.id,
    username: u.username,
    email: u.email,
    name: u.name,
    role: u.role,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    commentCount: u._count.comments,
    fileCount: u._count.files,
  }))

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <AdminSidebar />
      <div className="pl-60 transition-all">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold mb-8">用户管理</h1>
          <UsersClient users={serialized} currentUserId={session.userId} />
        </div>
      </div>
    </div>
  )
}
