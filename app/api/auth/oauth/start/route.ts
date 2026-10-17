import { NextResponse } from 'next/server'

import {
  buildAuthorizeUrl,
  createFlowSecrets,
  getOAuthConfig,
  isOAuthConfigured,
  OAUTH_FLOW_MAX_AGE,
  STATE_COOKIE,
  VERIFIER_COOKIE,
} from '@/lib/oauth-client'
import { safeReturnPath } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/**
 * 发起 OAuth 登录：生成 state + PKCE，写临时 Cookie，跳转到 vault 授权页。
 *
 * state 里同时带上登录成功后要回到的站内路径，这样回调时不需要额外的
 * Cookie，也不会被篡改成外部地址。
 */
/**
 * 出错时回到登录页并带错误码，而不是在浏览器里甩一段 JSON。
 * 这个端点只会被登录按钮命中，用户看到的应该是页面而不是原始报文。
 */
function backToLogin(request: Request, reason: string, next: string) {
  const url = new URL('/admin/login', request.url)
  url.searchParams.set('error', reason)
  if (next !== '/') url.searchParams.set('next', next)
  return NextResponse.redirect(url, 303)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const next = safeReturnPath(searchParams.get('next'), '/')

  if (!isOAuthConfigured()) {
    return backToLogin(request, 'not_configured', next)
  }

  try {
    const config = getOAuthConfig()
    const { verifier, challenge, state } = createFlowSecrets()

    const response = NextResponse.redirect(
      buildAuthorizeUrl({ config, state, codeChallenge: challenge }),
      303,
    )

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: OAUTH_FLOW_MAX_AGE,
    }

    // 用 `|` 分隔，路径里不会出现这个字符（URL 里会被编码成 %7C）
    response.cookies.set(STATE_COOKIE, `${state}|${next}`, cookieOptions)
    response.cookies.set(VERIFIER_COOKIE, verifier, cookieOptions)

    return response
  } catch (err) {
    console.error('[oauth] 发起登录失败', err)
    return backToLogin(request, 'invalid_client', next)
  }
}
