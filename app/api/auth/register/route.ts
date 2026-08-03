import { NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { username, email, password, name } = await request.json()

    if (!username || !email || !password || !name) {
      return NextResponse.json({ error: '用户名、邮箱、密码和显示名称为必填项' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }
    if (username.length < 3) {
      return NextResponse.json({ error: '用户名至少3个字符' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6个字符' }, { status: 400 })
    }

    const result = await registerUser(username, email.toLowerCase(), password, name)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    const emailSent = await sendVerificationEmail(email.toLowerCase(), result.token!)

    return NextResponse.json({
      success: true,
      emailSent,
    })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
