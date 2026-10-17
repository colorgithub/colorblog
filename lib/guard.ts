import { NextResponse } from 'next/server'
import { getSession, isAdmin, type JWTPayload } from './auth'

/**
 * 统一的授权守卫。
 *
 * 之所以要有这个文件：项目里原来每个路由都手写 `if (!session)`，
 * 文章接口因此漏掉了管理员校验，导致任何登录用户都能增删改文章。
 * 把判断收敛到一处，新增接口时只需要选 requireLogin 还是 requireAdmin。
 */

export type GuardResult =
  | { ok: true; session: JWTPayload }
  | { ok: false; response: NextResponse }

export async function requireLogin(): Promise<GuardResult> {
  const session = await getSession()
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: '未登录' }, { status: 401 }),
    }
  }
  return { ok: true, session }
}

export async function requireAdmin(): Promise<GuardResult> {
  const result = await requireLogin()
  if (!result.ok) return result

  if (!isAdmin(result.session)) {
    // 已登录但权限不足用 403，未登录用 401
    return {
      ok: false,
      response: NextResponse.json({ error: '无权限' }, { status: 403 }),
    }
  }
  return result
}
