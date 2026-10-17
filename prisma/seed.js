const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * 种子数据。
 *
 * 注意：这里**不再创建管理员账号**。
 * 本站已改用 MemoVault（vault）统一登录，用户由 OAuth 首次登录时自动建立，
 * 管理员权限通过环境变量 ADMIN_EMAILS 授予。
 * 旧的 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 已经废弃，不要再往库里写密码账号，
 * 否则它们只会是「已归档」状态的历史数据。
 */
async function main() {
  const postCount = await prisma.post.count()
  if (postCount > 0) {
    console.log('[seed] 已有文章，跳过示例文章创建')
    return
  }

  await prisma.post.create({
    data: {
      title: '欢迎来到我的博客',
      slug: 'welcome',
      content: [
        '# 欢迎来到我的博客',
        '',
        '这是你的第一篇文章。登录后台即可创建、编辑和删除内容。',
        '',
        '## 关于登录',
        '',
        '本站使用 **MemoVault 统一账号**登录，不再单独保存密码。',
        '首次通过 MemoVault 登录时会自动创建本地账号。',
        '',
        '## 功能特性',
        '',
        '- **Markdown 支持**：用 Markdown 语法写作，支持代码高亮',
        '- **后台管理**：`/admin` 管理文章与用户',
        '- **响应式设计**：手机和桌面端都能正常阅读',
        '- **深色模式**：右上角切换主题',
        '- **评论互动**：登录后参与讨论，支持贴图',
      ].join('\n'),
      excerpt: '欢迎来到你的个人博客，这里介绍了博客的基本功能与登录方式。',
      published: true,
      tags: '入门,博客',
    },
  })
  console.log('[seed] 已创建示例文章')

  if (!process.env.ADMIN_EMAILS?.trim()) {
    console.warn(
      '[seed] 提醒：ADMIN_EMAILS 未配置。通过 OAuth 登录的用户都会是普通用户，' +
        '没有任何人能进入后台。请在环境变量里填入你的 MemoVault 邮箱。',
    )
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
