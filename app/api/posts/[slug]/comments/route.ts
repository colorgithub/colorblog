import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const post = await prisma.post.findUnique({ where: { slug: params.slug } })
  if (!post) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 })
  }

  const comments = await prisma.comment.findMany({
    where: { postId: post.id },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(comments)
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const { content } = await request.json()
    if (!content || !content.trim()) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 })
    }

    const post = await prisma.post.findUnique({ where: { slug: params.slug } })
    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.userId,
        postId: post.id,
      },
      include: {
        user: { select: { name: true, username: true } },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch {
    return NextResponse.json({ error: '评论失败' }, { status: 500 })
  }
}
