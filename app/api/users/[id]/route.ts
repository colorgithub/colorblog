import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/guard'
import { handleApiError, readJson } from '@/lib/api-error'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  const { session } = guard

  const body = await readJson<{ role?: unknown }>(request)
  const role = body?.role
  if (role !== 'ADMIN' && role !== 'USER') {
    return NextResponse.json({ error: '角色无效' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true },
    })
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }
    if (user.id === session.userId && role !== 'ADMIN') {
      return NextResponse.json({ error: '不能取消自己的管理员权限' }, { status: 400 })
    }

    // 不允许把最后一个管理员降级，否则后台会永久锁死
    if (user.role === 'ADMIN' && role === 'USER') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: '至少需要保留一名管理员' }, { status: 400 })
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role },
      select: { role: true },
    })
    return NextResponse.json({ success: true, role: updated.role })
  } catch (err) {
    return handleApiError(err, 'users.updateRole')
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  const { session } = guard

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true },
    })
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }
    if (user.id === session.userId) {
      return NextResponse.json({ error: '不能删除自己' }, { status: 400 })
    }
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: '至少需要保留一名管理员' }, { status: 400 })
      }
    }

    // 事务内连带清理评论与文件，避免留下孤儿记录
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { userId: user.id } }),
      prisma.file.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err, 'users.delete')
  }
}
