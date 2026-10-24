import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isAdmin } from '@/lib/auth'
import { requireAdmin } from '@/lib/guard'
import { handleApiError, readJson } from '@/lib/api-error'
import { parsePostInput } from '@/lib/post-input'

/** 支持用 slug 或 id 定位文章（后台编辑用 id，前台用 slug）。 */
async function findPost(slugOrId: string) {
  const post = await prisma.post.findUnique({ where: { slug: slugOrId } })
  if (post) return post
  return prisma.post.findUnique({ where: { id: slugOrId } })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Next 15 起 route handler 的 params 是 Promise，必须 await
  const { slug } = await params

  try {
    const post = await findPost(slug)
    // 未发布文章对非管理员一律按「不存在」处理，避免通过状态码差异探测草稿
    if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 })

    const session = await getSession()
    if (!post.published && !isAdmin(session)) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (err) {
    return handleApiError(err, 'posts.get')
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // 只有管理员能改文章。原实现只判断「是否登录」，任何注册用户都能改写全站内容。
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await readJson(request)
  const parsed = parsePostInput(body, true)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    const post = await findPost(slug)
    if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 })

    const updated = await prisma.post.update({
      where: { id: post.id },
      data: parsed.data,
    })
    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err, 'posts.update')
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
    const post = await findPost(slug)
    if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 })

    await prisma.post.delete({ where: { id: post.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err, 'posts.delete')
  }
}
