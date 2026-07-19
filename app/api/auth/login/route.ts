import { NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: '请输入用户名和密码' },
        { status: 400 }
      )
    }

    const token = await authenticateUser(username, password)
    if (!token) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

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
    console.error('Login error:', err)
    const message = err instanceof Error ? err.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
