import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { prisma } from './prisma'
import { JWT_SECRET } from './env'
import { AUTH_COOKIE, type JWTPayload } from './auth-edge'
import {
  USERNAME_MIN,
  USERNAME_MAX,
  PASSWORD_MIN,
  PASSWORD_MAX,
  NAME_MAX,
} from './constants'

export { AUTH_COOKIE }
export type { JWTPayload }

/** 与 cookie maxAge 保持一致，7 天。 */
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60

export const BCRYPT_ROUNDS = 12
/** bcrypt 只处理前 72 字节，超出部分会被静默丢弃，因此显式限制。 */
export const PASSWORD_MAX_LENGTH = PASSWORD_MAX

/** 用于「用户不存在」分支的占位哈希，让两条路径的耗时保持一致。 */
const DUMMY_HASH = '$2a$12$mf4k8aU1lj6D8ujvzQhHmOKoh4Q.0IgYUeHC3WKu8e09yLq62EC7.'

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
 * 关键点：角色以数据库为准，而不是信任令牌里的快照。
 * 否则管理员在后台取消某人的权限后，对方手里的令牌在过期前依然是 ADMIN。
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
    select: { id: true, username: true, name: true, role: true },
  })
  // 用户已被删除，令牌立即失效
  if (!user) return null

  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  }
})

export async function authenticateUser(
  usernameOrEmail: string,
  password: string
): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
  })

  // 用户不存在时也跑一次 bcrypt，避免通过响应耗时枚举用户名
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH)
    return null
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) return null

  return signToken({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  })
}

export function isAdmin(session: JWTPayload | null): boolean {
  return session?.role === 'ADMIN'
}

/** 会话对应的 cookie 选项，登录与注册共用。 */
export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}

export interface RegisterInput {
  username: string
  password: string
  name: string
}

export const USERNAME_PATTERN = new RegExp(`^[a-zA-Z0-9_-]{${USERNAME_MIN},${USERNAME_MAX}}$`)
export const NAME_MAX_LENGTH = NAME_MAX
export const PASSWORD_MIN_LENGTH = PASSWORD_MIN

/** 注册字段校验，返回错误信息或 null。路由与 lib 共用同一套规则。 */
export function validateRegisterInput({ username, password, name }: RegisterInput): string | null {
  if (!USERNAME_PATTERN.test(username)) {
    return `用户名只能包含字母、数字、下划线和连字符，长度 ${USERNAME_MIN}-${USERNAME_MAX} 位`
  }
  if (!name.trim()) return '请填写显示名称'
  if (name.length > NAME_MAX) return `显示名称不能超过 ${NAME_MAX} 个字符`
  if (password.length < PASSWORD_MIN) return `密码至少 ${PASSWORD_MIN} 个字符`
  if (password.length > PASSWORD_MAX) return `密码不能超过 ${PASSWORD_MAX} 个字符`
  return null
}

export async function registerUser(
  username: string,
  password: string,
  name: string
): Promise<{ error?: string; user?: { id: string; username: string; name: string; role: string } }> {
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) return { error: '用户名已存在' }

  const hashed = await hashPassword(password)
  try {
    const user = await prisma.user.create({
      data: { username, password: hashed, name: name.trim(), role: 'USER' },
      select: { id: true, username: true, name: true, role: true },
    })
    return { user }
  } catch {
    // 并发注册时唯一约束会兜住，避免把 500 抛给用户
    return { error: '用户名已存在' }
  }
}
