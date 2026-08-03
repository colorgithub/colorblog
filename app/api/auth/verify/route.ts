import { NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: '缺少验证令牌' }, { status: 400 })
  }

  const ok = await verifyEmailToken(token)
  if (!ok) {
    return NextResponse.json({ error: '验证链接无效或已过期' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
