/**
 * Edge Runtime 可用的常量与类型。
 *
 * middleware.ts 跑在 Edge 上，不能 import lib/auth.ts（那里 import 了
 * Prisma）。把纯常量拆出来，两边共用同一份定义，避免字符串写错。
 */

export const AUTH_COOKIE = 'auth_token'

export interface JWTPayload {
  userId: string
  username: string
  name: string
  role: string
}
