import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

export async function authenticateUser(usernameOrEmail: string, password: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }] },
  })
  if (!user) return null

  const valid = await verifyPassword(password, user.password)
  if (!valid) return null

  return signToken({ userId: user.id, username: user.username, name: user.name, role: user.role })
}

export function isAdmin(session: JWTPayload | null): boolean {
  return session?.role === 'ADMIN'
}

export async function registerUser(
  username: string,
  password: string,
  name: string
): Promise<{ error?: string; user?: { username: string; name: string } }> {
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) return { error: '用户名已存在' }

  const hashed = await hashPassword(password)
  const user = await prisma.user.create({
    data: { username, password: hashed, name, role: 'USER' },
  })

  return { user: { username: user.username, name: user.name } }
}
