import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/Sidebar'
import { redirect } from 'next/navigation'
import { FileText, Eye, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function AdminDashboard() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const totalPosts = await prisma.post.count()
  const publishedPosts = await prisma.post.count({ where: { published: true } })
  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const stats = [
    { label: '全部文章', value: totalPosts, icon: FileText, color: 'from-blue-500 to-blue-600' },
    { label: '已发布', value: publishedPosts, icon: Eye, color: 'from-emerald-500 to-emerald-600' },
    { label: '草稿', value: totalPosts - publishedPosts, icon: Clock, color: 'from-amber-500 to-amber-600' },
    { label: '月更新', value: '---', icon: TrendingUp, color: 'from-violet-500 to-violet-600' },
  ]

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <AdminSidebar />
      <div className="pl-60 transition-all">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold mb-8">概览</h1>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border bg-[hsl(var(--card))] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">{stat.label}</span>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon size={16} className="text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-[hsl(var(--card))]">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold">最近文章</h2>
              <Link
                href="/admin/posts"
                className="text-sm text-[hsl(var(--accent))] hover:underline"
              >
                查看全部
              </Link>
            </div>
            <div className="divide-y">
              {recentPosts.length === 0 ? (
                <div className="p-5 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  还没有文章，去写一篇吧
                </div>
              ) : (
                recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-5 hover:bg-[hsl(var(--muted))/50] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${post.published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <div>
                        <p className="font-medium text-sm">{post.title}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="text-xs text-[hsl(var(--accent))] hover:underline"
                    >
                      编辑
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
