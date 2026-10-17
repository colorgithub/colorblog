import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '管理后台',
  robots: { index: false, follow: false },
}

/**
 * 后台的根布局只负责 metadata。
 *
 * 真正的权限校验放在 (protected)/layout.tsx —— 路由组不会影响 URL，
 * 但能把「登录页」排除在受保护区之外，新增后台页面时会自动继承校验，
 * 不再依赖每个页面手写 redirect。
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
