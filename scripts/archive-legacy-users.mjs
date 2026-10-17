/**
 * 归档历史密码账户。
 *
 * 背景：本站已改用 MemoVault（vault）OAuth 统一登录，不再提供密码登录。
 * 旧账户需要「归档」——保留 User 行与全部评论（评论外键指向 User），
 * 只是禁止再登录。
 *
 * 做法：给尚未绑定 OAuth 的账户写入 archivedAt。
 * 登录链路里 getSession() 会把 archivedAt 非空的用户视为未登录，
 * 所以归档会立即生效，不必等旧令牌过期。
 *
 * 用法：
 *   node scripts/archive-legacy-users.mjs           # 预演，只统计不写库
 *   node scripts/archive-legacy-users.mjs --apply   # 真正执行
 *
 * 安全提示：执行前请先确认已经能用 MemoVault 登录并拿到管理员权限，
 * 否则归档之后可能没有人能进后台。
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const apply = process.argv.includes('--apply')

async function main() {
  const legacy = await prisma.user.findMany({
    where: { archivedAt: null, oauthSubject: null },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      _count: { select: { comments: true, files: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const alreadyArchived = await prisma.user.count({
    where: { NOT: { archivedAt: null } },
  })
  const oauthUsers = await prisma.user.count({
    where: { NOT: { oauthSubject: null } },
  })

  console.log('=== 当前用户构成 ===')
  console.log(`  已绑定 OAuth   : ${oauthUsers}`)
  console.log(`  已归档         : ${alreadyArchived}`)
  console.log(`  待归档（旧账号）: ${legacy.length}`)
  console.log('')

  if (legacy.length === 0) {
    console.log('没有需要归档的旧账号。')
    return
  }

  const totalComments = legacy.reduce((sum, u) => sum + u._count.comments, 0)
  const totalFiles = legacy.reduce((sum, u) => sum + u._count.files, 0)
  const admins = legacy.filter((u) => u.role === 'ADMIN')

  console.log('=== 待归档账户 ===')
  for (const user of legacy) {
    console.log(
      `  ${user.username.padEnd(20)} ${(user.name || '-').padEnd(12)} ` +
        `评论 ${String(user._count.comments).padStart(3)}  文件 ${String(user._count.files).padStart(2)}` +
        `${user.role === 'ADMIN' ? '  [管理员]' : ''}`,
    )
  }
  console.log('')
  console.log(`合计：${totalComments} 条评论、${totalFiles} 个文件会被保留（不删除）。`)

  if (admins.length > 0) {
    console.log('')
    console.log('⚠️  注意：以下管理员账号将被归档，归档后无法再登录：')
    for (const admin of admins) console.log(`     ${admin.username}`)
    console.log(
      '    请确认你已经能用 MemoVault 登录并成为管理员（ADMIN_EMAILS 里包含你的邮箱），',
    )
    console.log('    否则归档后后台将没有人能进入。')
  }

  if (!apply) {
    console.log('')
    console.log('这是预演。确认无误后加上 --apply 真正执行：')
    console.log('  node scripts/archive-legacy-users.mjs --apply')
    return
  }

  const result = await prisma.user.updateMany({
    where: { archivedAt: null, oauthSubject: null },
    data: { archivedAt: new Date() },
  })

  console.log('')
  console.log(`✅ 已归档 ${result.count} 个账户。评论与文件全部保留。`)
  console.log('   这些账户的旧会话已立即失效（getSession 会把归档视为未登录）。')
}

main()
  .catch((err) => {
    console.error('归档失败：', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
