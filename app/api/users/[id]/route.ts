import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isAdmin } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  try {
    const { role } = await request.json()
    if (role !== 'ADMIN' && role !== 'USER') {
      return NextResponse.json({ error: '角色无效' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }
    if (user.id === session.userId && role !== 'ADMIN') {
      return NextResponse.json({ error: '不能取消自己的管理员权限' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { role },
    })

    return NextResponse.json({ success: true, role: updated.role })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } })
  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }
  if (user.id === session.userId) {
    return NextResponse.json({ error: '不能删除自己' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { userId: user.id } }),
    prisma.file.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ])

  return NextResponse.json({ success: true })
}
