import { NextResponse } from 'next/server'
import { bindEmailToUser } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { username, password, email } = await request.json()

    if (!username || !password || !email) {
      return NextResponse.json({ error: '用户名、密码和邮箱为必填项' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()
    const result = await bindEmailToUser(username, password, normalizedEmail)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const emailResult = await sendVerificationEmail(normalizedEmail, result.token!)

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      emailError: emailResult.success ? undefined : emailResult.error,
    })
  } catch (err) {
    console.error('Link email error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
