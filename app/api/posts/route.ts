import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isAdmin } from '@/lib/auth'
import { requireAdmin } from '@/lib/guard'
import { handleApiError, readJson } from '@/lib/api-error'
import { parsePostInput } from '@/lib/post-input'

/** 列表接口只返回卡片需要的字段，不把正文全文吐出去。 */
const LIST_FIELDS = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  tags: true,
  published: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function GET(request: Request) {
  try {
    const session = await getSession()
    const admin = isAdmin(session)

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 10))

    // 未发布文章只有管理员可见。这是原实现最大的漏洞：任何人都能
    // 直接 curl 到这个接口拿到全部草稿正文。
    const where = admin ? {} : { published: true }

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: LIST_FIELDS,
      }),
    ])

    return NextResponse.json({
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (err) {
    return handleApiError(err, 'posts.list')
  }
}

export async function POST(request: Request) {
  // 只有管理员能建文章
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await readJson(request)
  const parsed = parsePostInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    const post = await prisma.post.create({ data: parsed.data })
    return NextResponse.json(post, { status: 201 })
  } catch (err) {
    return handleApiError(err, 'posts.create')
  }
}
