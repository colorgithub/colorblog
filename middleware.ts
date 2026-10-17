import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// 只导入 verify 子路径。从 'jose' 桶文件导入会把 JWE 解密（内部用到
// CompressionStream/DecompressionStream）一起打进 Edge bundle，构建时
// 会报两条「A Node.js API is used ... not supported in the Edge Runtime」。
import { jwtVerify } from 'jose/jwt/verify'
import { JWT_SECRET } from '@/lib/env'
import { AUTH_COOKIE } from '@/lib/auth-edge'

/**
 * 后台的粗筛防线。
 *
 * 这里只做「令牌是否有效」的验签，不做角色判断 —— 角色必须由
 * app/admin/(protected)/layout.tsx 以数据库为准来判断。
 * 中间件跑在 Edge Runtime，不能依赖 Prisma，也不该作为唯一的授权边界。
 *
 * 用 jose 而不是 jsonwebtoken：后者依赖 Node 内置模块，Edge 上跑不起来。
 */
const secret = new TextEncoder().encode(JWT_SECRET)

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/admin/login', request.url)
  loginUrl.searchParams.set('from', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export async function middleware(request: NextRequest) {
  // 登录页自身不拦截，否则会无限重定向
  if (request.nextUrl.pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value
  if (!token) return redirectToLogin(request)

  try {
    await jwtVerify(token, secret)
  } catch {
    // 令牌无效或已过期：清掉它，避免反复带着坏 cookie 跳转
    const response = redirectToLogin(request)
    response.cookies.set(AUTH_COOKIE, '', { path: '/', maxAge: 0 })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
