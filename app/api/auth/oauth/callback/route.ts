import { NextResponse, type NextRequest } from 'next/server'

import { AUTH_COOKIE, authCookieOptions, signToken } from '@/lib/auth'
import {
  constantTimeEqual,
  exchangeCode,
  fetchProfile,
  getOAuthConfig,
  STATE_COOKIE,
  VERIFIER_COOKIE,
} from '@/lib/oauth-client'
import { findOrCreateOAuthUser } from '@/lib/oauth-account'
import { safeReturnPath } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function redirectToLogin(request: NextRequest, reason: string) {
  const url = new URL('/admin/login', request.url)
  url.searchParams.set('error', reason)
  return url
}

/**
 * OAuth 回调：校验 state → 用授权码换令牌 → 取用户信息 → 建立本地会话。
 *
 * 任何一步失败都回到登录页并带上错误码，不把内部错误直接暴露给用户。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const oauthError = searchParams.get('error')

  const stateCookie = request.cookies.get(STATE_COOKIE)?.value ?? ''
  const verifier = request.cookies.get(VERIFIER_COOKIE)?.value ?? ''

  const clearFlowCookies = (response: NextResponse) => {
    response.cookies.set(STATE_COOKIE, '', { path: '/', maxAge: 0 })
    response.cookies.set(VERIFIER_COOKIE, '', { path: '/', maxAge: 0 })
    return response
  }

  if (oauthError) {
    return clearFlowCookies(NextResponse.redirect(redirectToLogin(request, oauthError), 303))
  }

  const [expectedState = '', rawNext = '/'] = stateCookie.split('|')

  if (!state || !expectedState || !constantTimeEqual(state, expectedState)) {
    console.warn('[oauth] state 校验失败')
    return clearFlowCookies(NextResponse.redirect(redirectToLogin(request, 'invalid_state'), 303))
  }

  if (!code || !verifier) {
    return clearFlowCookies(NextResponse.redirect(redirectToLogin(request, 'missing_code'), 303))
  }

  const next = safeReturnPath(rawNext, '/')

  try {
    const config = getOAuthConfig()
    const accessToken = await exchangeCode({ config, code, codeVerifier: verifier })
    const profile = await fetchProfile({ config, accessToken })
    const { user, created, restoredFromArchive } = await findOrCreateOAuthUser(profile)

    if (created) console.info('[oauth] 新建用户', user.username)
    if (restoredFromArchive) console.info('[oauth] 认领已归档账号', user.username)

    const token = signToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    })

    const response = NextResponse.redirect(new URL(next, request.url), 303)
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions())
    return clearFlowCookies(response)
  } catch (err) {
    // 不把 err.message 回显给浏览器：里面可能含授权服务器的内部细节
    console.error('[oauth] 回调处理失败', err)
    return clearFlowCookies(NextResponse.redirect(redirectToLogin(request, 'oauth_failed'), 303))
  }
}
