import { redirect } from 'next/navigation'
import { getSession, isAdmin } from '@/lib/auth'
import { AdminShell } from '@/components/admin/AdminShell'

/**
 * 后台整体强制动态渲染。
 *
 * 不能依赖「调用了 cookies() 就会被自动判定为动态」这种隐式推断 ——
 * 后台页面同时依赖会话和实时数据，一旦被预渲染成静态页面，既会泄漏
 * 数据快照，也会在构建期因为连不上数据库而让整个部署失败。
 */
export const dynamic = 'force-dynamic'

/**
 * 后台受保护区的唯一授权入口。
 *
 * 这里以数据库为准判断角色（getSession 会回查 User 表），
 * 而不是信任中间件或令牌里的角色快照。
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session || !isAdmin(session)) {
    redirect('/admin/login')
  }

  return (
    <AdminShell user={{ name: session.name, username: session.username }}>{children}</AdminShell>
  )
}
