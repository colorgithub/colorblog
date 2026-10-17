import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * 博客作为 OAuth 客户端，对接 MemoVault（vault）的授权服务器。
 *
 * 流程：授权码 + PKCE(S256)。博客只在登录那一刻调用一次 userinfo，
 * 之后用自己签发的会话 Cookie，所以 access_token 不需要长期保存。
 *
 * 配置刻意做成「用时才校验」而不是模块加载时校验：
 * 这样即使环境变量没配好，`next build` 依然能通过，只在真正发起登录时
 * 报出可读的错误。之前把 JWT_SECRET 做成模块级校验，结果构建直接挂掉。
 */

export const OAUTH_PROVIDER = 'vault'

const STATE_COOKIE = 'oauth_state'
const VERIFIER_COOKIE = 'oauth_verifier'
/** 授权流程的临时 Cookie 有效期，10 分钟足够走完登录。 */
export const OAUTH_FLOW_MAX_AGE = 10 * 60

export { STATE_COOKIE, VERIFIER_COOKIE }

export interface OAuthConfig {
  issuer: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface VaultProfile {
  sub: string
  email: string
  name: string
  emailVerified: boolean
}

function readEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `[oauth] 缺少环境变量 ${name}。请参考 .env.example 配置 VAULT_ISSUER / OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET / OAUTH_REDIRECT_URI。`,
    )
  }
  return value
}

export function isOAuthConfigured(): boolean {
  return Boolean(
    process.env.VAULT_ISSUER?.trim() &&
      process.env.OAUTH_CLIENT_ID?.trim() &&
      process.env.OAUTH_CLIENT_SECRET?.trim() &&
      process.env.OAUTH_REDIRECT_URI?.trim(),
  )
}

export function getOAuthConfig(): OAuthConfig {
  return {
    issuer: readEnv('VAULT_ISSUER').replace(/\/+$/, ''),
    clientId: readEnv('OAUTH_CLIENT_ID'),
    clientSecret: readEnv('OAUTH_CLIENT_SECRET'),
    redirectUri: readEnv('OAUTH_REDIRECT_URI'),
  }
}

function base64url(buffer: Buffer): string {
  return buffer.toString('base64url')
}

/** 恒定时间比较，用于 state 校验。 */
export function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/** 生成 PKCE 的 verifier 与 S256 challenge，以及一次性 state。 */
export function createFlowSecrets() {
  const verifier = base64url(randomBytes(32))
  const challenge = base64url(createHash('sha256').update(verifier).digest())
  const state = base64url(randomBytes(24))
  return { verifier, challenge, state }
}

export function buildAuthorizeUrl(params: {
  config: OAuthConfig
  state: string
  codeChallenge: string
}): string {
  const url = new URL(`${params.config.issuer}/oauth/authorize`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', params.config.clientId)
  url.searchParams.set('redirect_uri', params.config.redirectUri)
  url.searchParams.set('scope', 'profile email')
  url.searchParams.set('state', params.state)
  url.searchParams.set('code_challenge', params.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  return url.toString()
}

async function fetchJson(
  url: string,
  init: RequestInit,
  label: string,
): Promise<Record<string, unknown>> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new Error(`[oauth] 无法连接授权服务器（${label}）`)
  }

  const text = await response.text()
  let parsed: unknown = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    /* 非 JSON 响应，下面按状态码处理 */
  }

  if (!response.ok) {
    const detail =
      parsed && typeof parsed === 'object'
        ? String(
            (parsed as Record<string, unknown>).error_description ??
              (parsed as Record<string, unknown>).error ??
              '',
          )
        : ''
    throw new Error(
      `[oauth] ${label} 失败（HTTP ${response.status}）${detail ? `：${detail}` : ''}`,
    )
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`[oauth] ${label} 返回的不是 JSON`)
  }
  return parsed as Record<string, unknown>
}

/** 用授权码换 access_token。 */
export async function exchangeCode(params: {
  config: OAuthConfig
  code: string
  codeVerifier: string
}): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: params.config.redirectUri,
    client_id: params.config.clientId,
    client_secret: params.config.clientSecret,
    code_verifier: params.codeVerifier,
  })

  const data = await fetchJson(
    `${params.config.issuer}/api/oauth/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    },
    '令牌交换',
  )

  const accessToken = data.access_token
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new Error('[oauth] 令牌响应里没有 access_token')
  }
  return accessToken
}

/** 用 access_token 取用户身份。 */
export async function fetchProfile(params: {
  config: OAuthConfig
  accessToken: string
}): Promise<VaultProfile> {
  const data = await fetchJson(
    `${params.config.issuer}/api/oauth/userinfo`,
    { headers: { Authorization: `Bearer ${params.accessToken}` } },
    '获取用户信息',
  )

  const sub = typeof data.sub === 'string' ? data.sub : ''
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  const name = typeof data.name === 'string' ? data.name.trim() : ''

  if (!sub || !email) {
    throw new Error('[oauth] 用户信息缺少 sub 或 email')
  }

  return {
    sub,
    email,
    name: name || email.split('@')[0],
    emailVerified: data.email_verified === true,
  }
}
