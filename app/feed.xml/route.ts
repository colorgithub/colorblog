import { prisma } from '@/lib/prisma'
import { SITE_NAME } from '@/lib/site'
import { SITE_URL } from '@/lib/env'
import { plainExcerpt } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  let posts: Array<{ title: string; slug: string; content: string; excerpt: string; createdAt: Date }> = []

  try {
    posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { title: true, slug: true, content: true, excerpt: true, createdAt: true },
    })
  } catch (err) {
    console.error('[feed] 读取文章失败', err)
  }

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/posts/${post.slug}`
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${post.createdAt.toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt || plainExcerpt(post.content))}</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>记录技术、生活和思考。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${SITE_URL}/feed.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    },
  })
}
