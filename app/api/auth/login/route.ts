import { NextResponse } from 'next/server'
import { authenticateUser, authCookieOptions, AUTH_COOKIE } from '@/lib/auth'
import { clientIp, rateLimit, resetRateLimit, tooManyRequests } from '@/lib/rate-limit'
import { readJson } from '@/lib/api-error'

export async function POST(request: Request) {
  const body = await readJson<{ username?: unknown; password?: unknown }>(request)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!username || !password) {
    return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 })
  }

  const ip = clientIp(request)
  // 同时按 IP 和按账号限流：前者挡撞库，后者挡针对单个账号的爆破
  const ipLimit = rateLimit(`login:ip:${ip}`, 10, 15 * 60 * 1000)
  if (!ipLimit.ok) {
    return NextResponse.json(tooManyRequests(ipLimit, '尝试过于频繁'), { status: 429 })
  }
  const userLimit = rateLimit(`login:user:${username.toLowerCase()}`, 5, 15 * 60 * 1000)
  if (!userLimit.ok) {
    return NextResponse.json(tooManyRequests(userLimit, '该账号尝试次数过多'), { status: 429 })
  }

  try {
    const token = await authenticateUser(username, password)
    if (!token) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // 登录成功清掉计数，避免正常用户被之前的失败次数拖累
    resetRateLimit(`login:user:${username.toLowerCase()}`)

    const response = NextResponse.json({ success: true })
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions())
    return response
  } catch (err) {
    console.error('[api:auth.login]', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
