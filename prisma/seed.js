const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'admin123'

  const existing = await prisma.user.findUnique({ where: { username } })
  if (!existing) {
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: { username, password: hashed, name: '管理员', role: 'ADMIN' },
    })
    console.log(`Admin user "${username}" created.`)
  } else {
    console.log(`Admin user "${username}" already exists.`)
  }

  const postCount = await prisma.post.count()
  if (postCount === 0) {
    await prisma.post.create({
      data: {
        title: '欢迎来到我的博客',
        slug: 'welcome',
        content: `# 欢迎来到我的博客\n\n这是你的第一篇博客文章。你可以通过管理后台来创建、编辑和删除文章。\n\n## 功能特性\n\n- **Markdown 支持**：使用 Markdown 语法编写文章\n- **后台管理**：登录管理后台管理文章\n- **响应式设计**：在手机和电脑上都能完美显示\n- **深色模式**：支持深色/浅色主题切换\n- **评论互动**：注册后可以参与讨论\n\n## 如何使用\n\n1. 访问 \`/admin\` 进入管理后台\n2. 使用管理员账号登录\n3. 创建、编辑你的博客文章`,
        excerpt: '欢迎来到你的个人博客，这里介绍了博客的基本功能和使用方法。',
        published: true,
        tags: '入门,博客',
      },
    })
    console.log('Sample post created.')
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
