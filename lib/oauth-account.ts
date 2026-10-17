import 'server-only'
import { randomBytes } from 'node:crypto'

import { prisma } from './prisma'
import { OAUTH_PROVIDER, type VaultProfile } from './oauth-client'

/**
 * 把 vault 身份映射成本地 User。
 *
 * 匹配顺序：
 *   1. 已绑定过 oauthSubject → 直接用
 *   2. 邮箱相同 → 绑定到已有账号（若该账号处于归档状态，则凭已验证邮箱认领并恢复）
 *   3. 都没有 → 新建
 *
 * 关于「归档」：旧账户的密码登录被停用、`archivedAt` 被置位，但用户行和
 * 全部评论都保留。若同一个人用同一邮箱从 vault 登录回来，就恢复原账号，
 * 这样历史评论的归属不会断掉。
 */

export interface OAuthUserResult {
  user: {
    id: string
    username: string
    email: string | null
    name: string
    role: string
  }
  created: boolean
  /** 本次登录是否认领了一个此前被归档的账号 */
  restoredFromArchive: boolean
}

const MAX_USERNAME_LENGTH = 32

function sanitizeHandle(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function baseUsername(email: string, name: string): string {
  const local = sanitizeHandle(email.split('@')[0] ?? '')
  if (local.length >= 3) return local.slice(0, MAX_USERNAME_LENGTH)

  const fromName = sanitizeHandle(name)
  if (fromName.length >= 3) return fromName.slice(0, MAX_USERNAME_LENGTH)

  return 'user'
}

async function allocateUsername(email: string, name: string): Promise<string> {
  const base = baseUsername(email, name)

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate =
      attempt === 0
        ? base
        : `${base.slice(0, MAX_USERNAME_LENGTH - 4)}-${attempt + 1}`

    const taken = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    })
    if (!taken) return candidate
  }

  return `user-${randomBytes(4).toString('hex')}`
}

/** ADMIN_EMAILS 中的邮箱登录后自动获得管理员权限（只授予，不回收）。 */
export function roleForEmail(email: string): 'ADMIN' | 'USER' {
  const configured = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  return configured.includes(email.trim().toLowerCase()) ? 'ADMIN' : 'USER'
}

export async function findOrCreateOAuthUser(
  profile: VaultProfile,
): Promise<OAuthUserResult> {
  // 1. 已绑定过
  //
  // 用 findFirst 而不是 findUnique：oauthSubject 上没有数据库唯一约束
  //（原因见 schema.prisma 里的说明），唯一性由下面的写入逻辑保证 ——
  // 只有当 oauthSubject 为空或恰好等于当前 subject 时才会写入。
  const bySubject = await prisma.user.findFirst({
    where: { oauthSubject: profile.sub },
  })

  if (bySubject) {
    if (bySubject.archivedAt) {
      throw new Error('该账号已被归档，无法登录。请联系站长处理。')
    }

    const user = await prisma.user.update({
      where: { id: bySubject.id },
      data: {
        // 同步 vault 侧的最新昵称与邮箱
        name: profile.name || bySubject.name,
        email: profile.email,
        role: roleForEmail(profile.email) === 'ADMIN' ? 'ADMIN' : bySubject.role,
      },
    })

    return { user, created: false, restoredFromArchive: false }
  }

  // 2. 邮箱相同 → 认领已有账号
  const byEmail = await prisma.user.findUnique({
    where: { email: profile.email },
  })

  if (byEmail) {
    if (byEmail.oauthSubject && byEmail.oauthSubject !== profile.sub) {
      throw new Error('该邮箱已绑定到另一个 MemoVault 账号，请联系站长处理。')
    }

    const wasArchived = Boolean(byEmail.archivedAt)
    const user = await prisma.user.update({
      where: { id: byEmail.id },
      data: {
        oauthProvider: OAUTH_PROVIDER,
        oauthSubject: profile.sub,
        // 凭已验证的邮箱认领并解除归档，历史评论的归属得以保留
        archivedAt: null,
        name: profile.name || byEmail.name,
        role:
          roleForEmail(profile.email) === 'ADMIN' ? 'ADMIN' : byEmail.role,
      },
    })

    return { user, created: false, restoredFromArchive: wasArchived }
  }

  // 3. 全新用户
  const username = await allocateUsername(profile.email, profile.name)
  const user = await prisma.user.create({
    data: {
      username,
      email: profile.email,
      name: profile.name,
      role: roleForEmail(profile.email),
      oauthProvider: OAUTH_PROVIDER,
      oauthSubject: profile.sub,
    },
  })

  return { user, created: true, restoredFromArchive: false }
}
