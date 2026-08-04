import { NextResponse } from 'next/server'
import { registerUser, signToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { username, password, name } = await request.json()

    if (!username || !password || !name) {
      return NextResponse.json({ error: '用户名、密码和显示名称为必填项' }, { status: 400 })
    }
    if (username.length < 3) {
      return NextResponse.json({ error: '用户名至少3个字符' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6个字符' }, { status: 400 })
    }

    const result = await registerUser(username, password, name)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    // Find the created user to sign the token
    const user = await prisma.user.findUnique({ where: { username } })
    const token = signToken({ userId: user!.id, username: user!.username, name: user!.name, role: user!.role })

    const response = NextResponse.json({ success: true })
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })
    return response
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
