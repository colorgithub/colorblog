import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

/**
 * 统一的 API 错误出口。
 *
 * 两个原则：
 * 1. 已知的数据库错误映射成明确的 4xx，而不是含糊的 500「操作失败」；
 * 2. 未知错误只写服务端日志，不把堆栈或数据库结构回传给客户端。
 */
export function handleApiError(err: unknown, context: string): NextResponse {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = err.meta?.target
        const field = Array.isArray(target) ? target.join(', ') : String(target ?? '')
        return NextResponse.json(
          { error: field.includes('slug') ? '该 Slug 已被占用，请换一个' : '该记录已存在' },
          { status: 409 }
        )
      }
      case 'P2025':
        return NextResponse.json({ error: '记录不存在' }, { status: 404 })
      case 'P2003':
        return NextResponse.json({ error: '关联数据不存在' }, { status: 400 })
      default:
        break
    }
  }

  console.error(`[api:${context}]`, err)
  return NextResponse.json({ error: '服务器错误' }, { status: 500 })
}

/** 读取 JSON body，解析失败时给出明确提示而不是抛异常。 */
export async function readJson<T = unknown>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}
