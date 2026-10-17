import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { prisma } from './prisma'
import { JWT_SECRET } from './env'
import { AUTH_COOKIE, type JWTPayload } from './auth-edge'
import { PASSWORD_MAX } from './constants'

export { AUTH_COOKIE }
export type { JWTPayload }

/** 与 cookie maxAge 保持一致，7 天。 */
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60

export const BCRYPT_ROUNDS = 12
/** bcrypt 只处理前 72 字节，超出部分会被静默丢弃，因此显式限制。 */
export const PASSWORD_MAX_LENGTH = PASSWORD_MAX

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password.slice(0, PASSWORD_MAX_LENGTH), BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password.slice(0, PASSWORD_MAX_LENGTH), hash)
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_MAX_AGE })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (typeof decoded === 'string') return null
    return {
      userId: String(decoded.userId),
      username: String(decoded.username),
      name: String(decoded.name ?? ''),
      role: String(decoded.role),
    }
  } catch {
    return null
  }
}

/**
 * 读取当前会话。
 *
 * 两个关键点：
 * 1. 角色以数据库为准，而不是信任令牌里的快照。否则管理员在后台取消
 *    某人的权限后，对方手里的令牌在过期前依然是 ADMIN。
 * 2. 归档账户（archivedAt 非空）一律视为未登录。这样归档动作会立即生效，
 *    不必等令牌自然过期。
 *
 * 用 React 的 cache 做单次请求内的去重，避免同一请求里重复查库。
 */
export const getSession = cache(async (): Promise<JWTPayload | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, name: true, role: true, archivedAt: true },
  })

  // 用户已被删除，或已被归档，令牌立即失效
  if (!user || user.archivedAt) return null

  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  }
})

export function isAdmin(session: JWTPayload | null): boolean {
  return session?.role === 'ADMIN'
}

/** 会话对应的 cookie 选项。 */
export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}
