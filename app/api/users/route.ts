import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/guard'
import { handleApiError } from '@/lib/api-error'

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  try {
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
  } catch (err) {
    return handleApiError(err, 'users.list')
  }
}
