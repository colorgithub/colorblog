import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

/**
 * 当前会话探测。
 *
 * 未登录时返回 200 + { authenticated: false } 而不是 401。
 * 这个接口在每次页面加载时都会被调用一次，用 401 会让浏览器控制台
 * 在每页都标一条红色错误——语义上没错，但会把真正的错误淹没掉。
 * NextAuth 的 /api/auth/session 也是这个约定。
 */
export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      userId: session.userId,
      username: session.username,
      name: session.name,
      role: session.role,
    },
  })
}
