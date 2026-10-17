/**
 * 服务端环境变量的唯一入口。
 *
 * ⚠️ 本文件**只能被服务端代码导入**（Server Component、Route Handler、
 * middleware）。它含有「模块加载即校验」的顶层代码，一旦被打进浏览器
 * bundle，process.env.JWT_SECRET 在浏览器里是 undefined，会立刻抛错并让
 * 整个页面崩溃（表现为 "Application error: a client-side exception"）。
 *
 * 客户端需要用的常量请放到 lib/site.ts。
 * 首行的 server-only 导入会让这种误用变成构建错误，而不是线上崩溃。
 */
import 'server-only'

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

/** 是否开放注册。个人博客建议设为 false，改由管理员在后台建号。 */
export const ALLOW_REGISTRATION = process.env.ALLOW_REGISTRATION !== 'false'
