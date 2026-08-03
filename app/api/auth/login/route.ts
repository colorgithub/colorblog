import { NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 })
    }

    const result = await authenticateUser(username, password)
    if (result.error) {
      return NextResponse.json({ error: result.error, emailVerified: result.emailVerified }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('auth_token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
