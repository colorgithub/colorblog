import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: '文件不能超过 4MB（Vercel 免费版限制）' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const dataUri = `${file.type};base64,${base64}`

    const record = await prisma.file.create({
      data: {
        name: file.name,
        type: file.type,
        data: dataUri,
        size: file.size,
        userId: session.userId,
      },
    })

    return NextResponse.json({
      id: record.id,
      name: record.name,
      size: record.size,
      url: `/api/files/${record.id}`,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
