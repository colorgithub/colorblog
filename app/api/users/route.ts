import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, isAdmin } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { comments: true, files: true } },
    },
  })

  return NextResponse.json(users)
}
