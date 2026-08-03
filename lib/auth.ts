import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me'

export interface JWTPayload {
  userId: string
  username: string
  name: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
}

export interface AuthResult {
  error?: string
  token?: string
  emailVerified?: boolean
  needsEmail?: boolean
  userId?: string
  username?: string
}

export async function authenticateUser(usernameOrEmail: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
  })
  if (!user) return { error: '用户名或密码错误' }

  const valid = await verifyPassword(password, user.password)
  if (!valid) return { error: '用户名或密码错误' }

  if (!user.email) {
    return {
      error: '该账号尚未绑定邮箱，请先完成邮箱验证',
      needsEmail: true,
      userId: user.id,
      username: user.username,
      emailVerified: false,
    }
  }

  if (!user.emailVerified) return { error: '邮箱尚未验证，请先查收邮件完成验证', emailVerified: false }

  return {
    token: signToken({ userId: user.id, username: user.username, name: user.name, role: user.role }),
    emailVerified: true,
  }
}

export function isAdmin(session: JWTPayload | null): boolean {
  return session?.role === 'ADMIN'
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
  name: string
): Promise<{ error?: string; token?: string }> {
  const existingUsername = await prisma.user.findUnique({ where: { username } })
  if (existingUsername) return { error: '用户名已存在' }

  const existingEmail = await prisma.user.findUnique({ where: { email } })
  if (existingEmail) return { error: '邮箱已被注册' }

  const hashed = await hashPassword(password)
  const verificationToken = crypto.randomBytes(32).toString('hex')

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashed,
      name,
      role: 'USER',
      emailVerified: false,
      verificationToken,
    },
  })

  return {
    token: verificationToken,
  }
}

export async function bindEmailToUser(
  username: string,
  password: string,
  email: string
): Promise<{ error?: string; token?: string }> {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return { error: '用户名或密码错误' }

  const valid = await verifyPassword(password, user.password)
  if (!valid) return { error: '用户名或密码错误' }

  if (user.email) return { error: '该账号已绑定邮箱，请直接登录' }

  const existingEmail = await prisma.user.findUnique({ where: { email } })
  if (existingEmail) return { error: '该邮箱已被其他账号使用' }

  const verificationToken = crypto.randomBytes(32).toString('hex')

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email,
      emailVerified: false,
      verificationToken,
    },
  })

  return { token: verificationToken }
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  const user = await prisma.user.findFirst({ where: { verificationToken: token } })
  if (!user) return false

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: '' },
  })

  return true
}
