/**
 * 环境变量的唯一入口。
 *
 * 这里刻意采用「模块加载即校验」的策略：配置缺失时构建/启动直接失败，
 * 而不是悄悄退化成一个公开在源码里的兜底值。
 */

function required(name: string, minLength = 1): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `[env] 缺少必需的环境变量 ${name}。请参考 .env.example 完成配置。`
    )
  }
  if (value.length < minLength) {
    throw new Error(
      `[env] 环境变量 ${name} 长度不足，至少需要 ${minLength} 个字符（当前 ${value.length}）。`
    )
  }
  return value
}

/** JWT 签名密钥。绝不允许有兜底值，否则任何人都能伪造管理员令牌。 */
export const JWT_SECRET = required('JWT_SECRET', 32)

/**
 * 站点对外地址，用于 sitemap、robots 和 Open Graph。
 *
 * 优先用显式配置；没配时回退到 Vercel 自动注入的域名，
 * 否则 sitemap 和分享卡片会指向 http://localhost:3000。
 * VERCEL_PROJECT_PRODUCTION_URL 是稳定的生产域名，
 * VERCEL_URL 是当前这次部署的域名（预览环境用得上）。
 */
function resolveSiteUrl(): string {
  const explicit = process.env.SITE_URL
  if (explicit) return explicit.replace(/\/+$/, '')

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  if (vercelHost) return `https://${vercelHost}`

  return 'http://localhost:3000'
}

export const SITE_URL = resolveSiteUrl()

/** 站点名称，用于 metadata 与页脚。 */
export const SITE_NAME = process.env.SITE_NAME || 'My Blog'

/** 是否开放注册。个人博客建议设为 false，改由管理员在后台建号。 */
export const ALLOW_REGISTRATION = process.env.ALLOW_REGISTRATION !== 'false'
