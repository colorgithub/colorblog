import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-error'

/** 只有确认安全、可以内联展示的类型才 inline，其余强制下载。 */
const INLINE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

/** RFC 5987 的 filename* 用单引号做分隔符，encodeURIComponent 不转义单引号。 */
function encodeFilename(name: string): string {
  return encodeURIComponent(name).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Next 15 起 route handler 的 params 是 Promise，必须 await
  const { id } = await params

  try {
    const file = await prisma.file.findUnique({
      where: { id },
      select: { name: true, type: true, data: true },
    })
    if (!file) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 })
    }

    const separator = file.data.indexOf(';base64,')
    if (separator === -1) {
      return NextResponse.json({ error: '文件数据损坏' }, { status: 500 })
    }

    const buffer = Buffer.from(file.data.slice(separator + 8), 'base64')
    const mime = file.type
    const inline = INLINE_TYPES.has(mime)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mime,
        'Content-Length': String(buffer.length),
        // nosniff 让浏览器严格按上面的 Content-Type 处理，不做嗅探
        'X-Content-Type-Options': 'nosniff',
        // 即使被直接打开，也用 CSP 把页面锁死，杜绝内联脚本执行
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeFilename(file.name)}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    return handleApiError(err, 'files.get')
  }
}
