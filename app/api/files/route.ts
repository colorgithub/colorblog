import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireLogin } from '@/lib/guard'
import { handleApiError } from '@/lib/api-error'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'
import {
  detectFileType,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILES_PER_USER,
  MAX_TOTAL_BYTES_PER_USER,
} from '@/lib/file-type'

export async function POST(request: Request) {
  const guard = await requireLogin()
  if (!guard.ok) return guard.response
  const { session } = guard

  const limit = rateLimit(`upload:${session.userId}`, 20, 10 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json(tooManyRequests(limit, '上传过于频繁'), { status: 429 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }
    if (file.size === 0) {
      return NextResponse.json({ error: '文件为空' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // 关键：用文件头判断真实类型，而不是信任客户端传来的 file.type
    const detected = detectFileType(buffer)
    if (!detected) {
      return NextResponse.json(
        { error: `不支持的文件类型，仅允许 ${ALLOWED_EXTENSIONS.join(' / ')}` },
        { status: 400 }
      )
    }

    const usage = await prisma.file.aggregate({
      where: { userId: session.userId },
      _count: { _all: true },
      _sum: { size: true },
    })
    if (usage._count._all >= MAX_FILES_PER_USER) {
      return NextResponse.json(
        { error: `最多保存 ${MAX_FILES_PER_USER} 个文件，请先删除一些` },
        { status: 413 }
      )
    }
    if ((usage._sum.size ?? 0) + file.size > MAX_TOTAL_BYTES_PER_USER) {
      return NextResponse.json({ error: '存储空间已满，请先删除一些文件' }, { status: 413 })
    }

    const record = await prisma.file.create({
      data: {
        // 文件名只保留展示用途，长度做裁剪，不参与任何路径拼接
        name: file.name.slice(0, 200),
        // 存服务端判定的 MIME，不存客户端给的
        type: detected.mime,
        data: `${detected.mime};base64,${buffer.toString('base64')}`,
        size: file.size,
        userId: session.userId,
      },
    })

    return NextResponse.json({
      id: record.id,
      name: record.name,
      size: record.size,
      type: record.type,
      url: `/api/files/${record.id}`,
      inline: detected.inline,
    })
  } catch (err) {
    return handleApiError(err, 'files.upload')
  }
}
