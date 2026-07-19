import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

async function findPost(slugOrId: string) {
  let post = await prisma.post.findUnique({ where: { slug: slugOrId } })
  if (!post) post = await prisma.post.findUnique({ where: { id: slugOrId } })
  return post
}

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const post = await findPost(params.slug)
  if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 })

  const session = await getSession()
  if (!post.published && !session) {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 })
  }

  return NextResponse.json(post)
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    const data = await request.json()
    const post = await findPost(params.slug)
    if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 })

    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        tags: data.tags,
        published: data.published,
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

  try {
    const post = await findPost(params.slug)
    if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 })

    await prisma.post.delete({ where: { id: post.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
