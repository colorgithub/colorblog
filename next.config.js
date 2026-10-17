/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

/**
 * 内容安全策略。
 *
 * 说明：script-src 里的 'unsafe-inline' 是妥协 —— Next.js 的运行时和
 * 主题初始化脚本都需要内联执行。即便如此，下面几条仍然实打实地堵住了
 * 本次审查发现的注入利用链：
 *   - base-uri 'self'    → 阻止注入 <base> 劫持全站相对链接
 *   - form-action 'self' → 阻止注入外部 <form> 做钓鱼
 *   - frame-src 'none'   → 阻止注入 <iframe srcdoc> 执行脚本
 *   - object-src 'none'  → 阻止 <object>/<embed>
 * 后续如果要做严格 CSP，可以改成 middleware 下发 nonce 的方案。
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(isDev
    ? []
    : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 不再放开 remotePatterns：之前 hostname: '**' 等于把图片优化器
  // 开成任意 HTTPS 源的代理。项目并未使用 next/image。
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
