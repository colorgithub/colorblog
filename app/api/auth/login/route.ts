import { NextResponse } from 'next/server'

/**
 * 密码登录已停用。
 *
 * 保留这个路由（而不是直接删掉）是为了让旧书签、旧客户端拿到一个
 * 可读的说明，而不是莫名其妙的 404。
 */
export async function POST() {
  return NextResponse.json(
    {
      error: '本站已改用 MemoVault 统一登录，密码登录已停用。',
      loginUrl: '/admin/login',
    },
    { status: 410 },
  )
}
