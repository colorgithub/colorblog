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
      data: { username, password: hashed },
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
        content: `# 欢迎来到我的博客

这是你的第一篇博客文章。你可以通过管理后台来创建、编辑和删除文章。

## 功能特性

- **Markdown 支持**：使用 Markdown 语法编写文章
- **后台管理**：登录管理后台管理文章
- **响应式设计**：在手机和电脑上都能完美显示
- **深色模式**：支持深色/浅色主题切换

## 如何使用

1. 访问 \`/admin\` 进入管理后台
2. 使用默认账号 \`admin / admin123\` 登录
3. 创建、编辑你的博客文章

祝你在博客世界中玩得开心！🎉`,
        excerpt: '欢迎来到你的个人博客，这里介绍了博客的基本功能和使用方法。',
        published: true,
        tags: '入门,博客',
      },
    })
    console.log('Sample post created.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
