import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isAdmin } from '@/lib/auth'
import { requireLogin } from '@/lib/guard'
import { handleApiError, readJson } from '@/lib/api-error'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { COMMENT_MAX_LENGTH } from '@/lib/constants'

const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 100

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: params.slug },
      select: { id: true, published: true },
    })

    const session = await getSession()
    // 草稿的评论同样只有管理员能看
    if (!post || (!post.published && !isAdmin(session))) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(searchParams.get('limit')) || DEFAULT_PAGE_SIZE)
    )
    const offset = Math.max(0, Number(searchParams.get('offset')) || 0)

    const [total, comments] = await Promise.all([
      prisma.comment.count({ where: { postId: post.id } }),
      prisma.comment.findMany({
        where: { postId: post.id },
        include: { user: { select: { name: true, username: true } } },
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit,
      }),
    ])

    return NextResponse.json({
      data: comments,
      total,
      hasMore: offset + comments.length < total,
    })
  } catch (err) {
    return handleApiError(err, 'comments.list')
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const guard = await requireLogin()
  if (!guard.ok) return guard.response
  const { session } = guard

  // 按用户限流，避免单账号刷屏
  const limit = rateLimit(`comment:${session.userId}`, 5, 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json(tooManyRequests(limit, '发言过于频繁'), { status: 429 })
  }

  const body = await readJson<{ content?: unknown }>(request)
  const content = typeof body?.content === 'string' ? body.content.trim() : ''

  if (!content) {
    return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 })
  }
  if (content.length > COMMENT_MAX_LENGTH) {
    return NextResponse.json(
      { error: `评论不能超过 ${COMMENT_MAX_LENGTH} 个字符` },
      { status: 400 }
    )
  }

  try {
    const post = await prisma.post.findUnique({
      where: { slug: params.slug },
      select: { id: true, published: true },
    })
    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: { content, userId: session.userId, postId: post.id },
      include: { user: { select: { name: true, username: true } } },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    return handleApiError(err, 'comments.create')
  }
}
