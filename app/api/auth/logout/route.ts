import { NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  // 删除时必须带 path，否则同名但不同 path 的 cookie 会残留
  response.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
