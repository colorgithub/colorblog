import { NextResponse } from 'next/server'

/**
 * 自助注册已停用。
 *
 * 账号统一由 MemoVault 创建。保留路由是为了给旧客户端一个明确的说明。
 */
export async function POST() {
  return NextResponse.json(
    {
      error: '本站已改用 MemoVault 统一账号，请先在 MemoVault 注册后再登录本站。',
      loginUrl: '/admin/login',
    },
    { status: 410 },
  )
}
