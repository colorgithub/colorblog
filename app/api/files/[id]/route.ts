import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const file = await prisma.file.findUnique({ where: { id: params.id } })
  if (!file) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 })
  }

  const [mime, base64] = file.data.split(';base64,')
  const buffer = Buffer.from(base64, 'base64')
  const filename = encodeURIComponent(file.name)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mime || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
