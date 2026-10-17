import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/env'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/posts`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ]

  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    })

    return [
      ...staticRoutes,
      ...posts.map((post) => ({
        url: `${SITE_URL}/posts/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ]
  } catch (err) {
    // 数据库不可用时也要能产出 sitemap，不能让构建或请求整体失败
    console.error('[sitemap] 读取文章失败', err)
    return staticRoutes
  }
}
