import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isAdmin } from '@/lib/auth'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const comment = await prisma.comment.findUnique({ where: { id: params.id } })
  if (!comment) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 })
  }

  if (comment.userId !== session.userId && !isAdmin(session)) {
    return NextResponse.json({ error: '无权删除此评论' }, { status: 403 })
  }

  await prisma.comment.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
