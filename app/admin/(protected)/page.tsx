import Link from 'next/link'
import { FileText, Eye, Clock, ArrowRight, Plus, MessageSquare } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export default async function AdminDashboard() {
  const [totalPosts, publishedPosts, totalUsers, totalComments, recentPosts] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.user.count(),
    prisma.comment.count(),
    prisma.post.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
  ])

  const stats = [
    {
      label: '全部文章',
      value: totalPosts,
      hint: `${publishedPosts} 篇已发布`,
      icon: FileText,
      tone: 'text-accent bg-accent/10',
    },
    {
      label: '草稿',
      value: totalPosts - publishedPosts,
      hint: '尚未发布',
      icon: Clock,
      tone: 'text-warning bg-warning/10',
    },
    {
      label: '注册用户',
      value: totalUsers,
      hint: '含管理员',
      icon: Eye,
      tone: 'text-success bg-success/10',
    },
    {
      label: '评论',
      value: totalComments,
      hint: '全站累计',
      icon: MessageSquare,
      tone: 'text-accent bg-accent/10',
    },
  ]

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">概览</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">站点的整体运行情况</p>
        </div>
        <Link href="/admin/posts/new" className="btn btn-primary btn-md">
          <Plus size={16} />
          写文章
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-surface p-5">
            <div className="flex items-start justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span className={`grid h-8 w-8 place-items-center rounded-lg ${stat.tone}`}>
                <stat.icon size={15} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </div>

      <section className="card-surface mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">最近文章</h2>
          <Link
            href="/admin/posts"
            className="group inline-flex items-center gap-1 text-sm text-accent"
          >
            查看全部
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-muted-foreground">还没有文章</p>
            <Link href="/admin/posts/new" className="btn btn-primary btn-sm mt-4">
              <Plus size={14} />
              写第一篇
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentPosts.map((post) => (
              <li
                key={post.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      post.published ? 'bg-success' : 'bg-warning'
                    }`}
                    title={post.published ? '已发布' : '草稿'}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{post.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="btn btn-ghost btn-sm shrink-0"
                >
                  编辑
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
