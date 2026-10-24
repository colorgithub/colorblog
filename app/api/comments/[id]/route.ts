import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'
import { requireLogin } from '@/lib/guard'
import { handleApiError } from '@/lib/api-error'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Next 15 起 route handler 的 params 是 Promise，必须 await
  const { id } = await params

  const guard = await requireLogin()
  if (!guard.ok) return guard.response
  const { session } = guard

  try {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })
    if (!comment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 })
    }

    // 作者本人或管理员才能删
    if (comment.userId !== session.userId && !isAdmin(session)) {
      return NextResponse.json({ error: '无权删除此评论' }, { status: 403 })
    }

    await prisma.comment.delete({ where: { id: comment.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err, 'comments.delete')
  }
}
