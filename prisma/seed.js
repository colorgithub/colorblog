const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const MIN_PASSWORD_LENGTH = 12

async function main() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  // 绝不提供默认口令：原实现是 `|| 'admin123'`，只要环境变量漏配
  // 就会凭空造出一个弱口令管理员账号。
  if (!username) {
    console.error('[seed] 缺少环境变量 ADMIN_USERNAME')
    process.exit(1)
  }
  if (!password) {
    console.error('[seed] 缺少环境变量 ADMIN_PASSWORD')
    process.exit(1)
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`[seed] ADMIN_PASSWORD 至少需要 ${MIN_PASSWORD_LENGTH} 位`)
    process.exit(1)
  }

  const hashed = await bcrypt.hash(password, 12)

  const existing = await prisma.user.findUnique({ where: { username } })
  if (!existing) {
    await prisma.user.create({
      data: { username, password: hashed, name: '管理员', role: 'ADMIN' },
    })
    console.log(`[seed] 已创建管理员账号 "${username}"`)
  } else if (existing.role !== 'ADMIN') {
    await prisma.user.update({
      where: { username },
      data: { role: 'ADMIN', password: hashed },
    })
    console.log(`[seed] 已将 "${username}" 提升为管理员并重置密码`)
  } else {
    console.log(`[seed] 管理员 "${username}" 已存在，跳过`)
  }

  const postCount = await prisma.post.count()
  if (postCount === 0) {
    await prisma.post.create({
      data: {
        title: '欢迎来到我的博客',
        slug: 'welcome',
        content: [
          '# 欢迎来到我的博客',
          '',
          '这是你的第一篇文章。登录后台即可创建、编辑和删除内容。',
          '',
          '## 功能特性',
          '',
          '- **Markdown 支持**：用 Markdown 语法写作，支持代码高亮',
          '- **后台管理**：`/admin` 管理文章与用户',
          '- **响应式设计**：手机和桌面端都能正常阅读',
          '- **深色模式**：右上角切换主题',
          '- **评论互动**：注册后参与讨论，支持贴图',
          '',
          '## 开始使用',
          '',
          '1. 访问 `/admin` 进入管理后台',
          '2. 用管理员账号登录',
          '3. 写下你的第一篇博客',
        ].join('\n'),
        excerpt: '欢迎来到你的个人博客，这里介绍了博客的基本功能和使用方法。',
        published: true,
        tags: '入门,博客',
      },
    })
    console.log('[seed] 已创建示例文章')
  }
}

main()
  .catch((e) => {
    console.error('[seed] 执行失败：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
