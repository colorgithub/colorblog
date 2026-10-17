'use client'

import { Loader2, ShieldCheck, AlertCircle, Settings2 } from 'lucide-react'
import { useState } from 'react'

/** vault / 本站回传的错误码 → 人话 */
const ERROR_MESSAGES: Record<string, string> = {
  not_configured: '本站尚未完成 OAuth 配置，暂时无法登录。',
  access_denied: '你取消了授权。',
  invalid_state: '登录请求已失效，请重新发起。',
  missing_code: '授权服务器没有返回授权码，请重试。',
  oauth_failed: '登录失败，请稍后重试。若持续失败请联系站长。',
  invalid_client: 'OAuth 客户端配置有误，请联系站长。',
  invalid_scope: '授权范围不被支持，请联系站长。',
  unsupported_response_type: '授权服务器不支持当前的请求方式。',
  invalid_request: '授权请求参数不合法，请重新发起登录。',
  server_error: '授权服务器内部错误，请稍后重试。',
  temporarily_unavailable: '授权服务器暂时不可用，请稍后重试。',
}

interface LoginFormProps {
  /** 登录成功后要回到的站内路径 */
  next: string
  /** 回调失败时带回来的错误码 */
  errorCode?: string
  /** vault 的对外地址，用于「去注册」链接；未配置时为 null */
  issuer: string | null
  /** 服务端是否已配齐 OAuth 环境变量 */
  configured: boolean
}

export function LoginForm({ next, errorCode, issuer, configured }: LoginFormProps) {
  const [navigating, setNavigating] = useState(false)

  // 未配置时下面已经有专门的说明块，不必再重复一条一样的错误
  const showError = errorCode && !(errorCode === 'not_configured' && !configured)
  const message = showError
    ? (ERROR_MESSAGES[errorCode] ?? '登录未完成，请重试。')
    : null

  const startUrl = `/api/auth/oauth/start?next=${encodeURIComponent(next)}`

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
          <ShieldCheck size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">登录</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          本站使用 MemoVault 统一账号登录，不再单独保存密码
        </p>
      </div>

      {message && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* 配置缺失时直接说明，而不是让用户点一个必然失败的按钮 */}
      {!configured ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3.5">
          <p className="flex items-center gap-2 text-sm font-medium text-warning">
            <Settings2 size={15} />
            尚未完成 OAuth 配置
          </p>
          <p className="mt-2 text-xs leading-relaxed text-warning/90">
            站长需要先在部署环境里配好
            <code className="mx-1 rounded bg-warning/15 px-1 py-0.5 font-mono">VAULT_ISSUER</code>
            <code className="mr-1 rounded bg-warning/15 px-1 py-0.5 font-mono">OAUTH_CLIENT_ID</code>
            <code className="mr-1 rounded bg-warning/15 px-1 py-0.5 font-mono">OAUTH_CLIENT_SECRET</code>
            <code className="rounded bg-warning/15 px-1 py-0.5 font-mono">OAUTH_REDIRECT_URI</code>
            ，然后重新部署才能登录。
          </p>
        </div>
      ) : (
        <>
          <a
            href={startUrl}
            onClick={() => setNavigating(true)}
            aria-disabled={navigating}
            className="btn btn-primary btn-md w-full"
          >
            {navigating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShieldCheck size={16} />
            )}
            {navigating ? '正在跳转…' : '使用 MemoVault 登录'}
          </a>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            登录时你会被带到 MemoVault 的授权页，确认后自动返回本站。
            <br />
            本站只会获得你的邮箱和昵称，无法访问你的备忘录与验证码。
          </p>
        </>
      )}

      {issuer && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          还没有账号？
          <a
            href={`${issuer}/register`}
            className="ml-1 font-medium text-accent hover:underline"
            rel="noreferrer"
          >
            去 MemoVault 注册
          </a>
        </p>
      )}
    </div>
  )
}
