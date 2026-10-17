import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { UsersClient } from './UsersClient'

export default async function AdminUsersPage() {
  // 权限已由 (protected)/layout.tsx 校验；这里取 session 只是为了标记「当前用户」。
  // getSession 用 React cache 包过，同一请求内不会重复查库。
  const session = await getSession()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { comments: true, files: true } },
    },
  })

  const serialized = users.map((user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    commentCount: user._count.comments,
    fileCount: user._count.files,
  }))

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">用户管理</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          共 {users.length} 位用户，其中 {users.filter((u) => u.role === 'ADMIN').length} 位管理员
        </p>
      </header>

      <UsersClient users={serialized} currentUserId={session?.userId ?? ''} />
    </div>
  )
}
