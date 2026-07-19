import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const { title, slug, content, excerpt, tags, published } = await request.json()

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: '标题、Slug 和内容为必填项' },
        { status: 400 }
      )
    }

    const existing = await prisma.post.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'Slug 已存在，请换一个' },
        { status: 409 }
      )
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || '',
        tags: tags || '',
        published: published || false,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch {
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
