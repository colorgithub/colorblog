import { NextResponse } from 'next/server'
import {
  registerUser,
  signToken,
  authCookieOptions,
  validateRegisterInput,
  AUTH_COOKIE,
} from '@/lib/auth'
import { ALLOW_REGISTRATION } from '@/lib/env'
import { clientIp, rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { readJson } from '@/lib/api-error'

export async function POST(request: Request) {
  if (!ALLOW_REGISTRATION) {
    return NextResponse.json({ error: '本站已关闭注册' }, { status: 403 })
  }

  const ip = clientIp(request)
  const limit = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json(tooManyRequests(limit, '注册过于频繁'), { status: 429 })
  }

  const body = await readJson<{ username?: unknown; password?: unknown; name?: unknown }>(request)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''

  const invalid = validateRegisterInput({ username, password, name })
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 })
  }

  try {
    const result = await registerUser(username, password, name)
    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error ?? '注册失败' }, { status: 409 })
    }

    // 直接用创建结果签发令牌，不再多查一次库
    const token = signToken({
      userId: result.user.id,
      username: result.user.username,
      name: result.user.name,
      role: result.user.role,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions())
    return response
  } catch (err) {
    console.error('[api:auth.register]', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
