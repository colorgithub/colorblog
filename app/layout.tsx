import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import { SITE_NAME, SITE_URL } from '@/lib/env'
import './globals.css'

/**
 * 字体改为 next/font 自托管。
 * 原来是在 globals.css 里用 @import 拉 Google Fonts —— 那是渲染阻塞请求，
 * 首屏必须等 fonts.googleapis.com 响应才能画字，且把第三方域名写进了 CSP。
 * next/font 会在构建期把字体下载到本地并自动内联 font-face 与 preload。
 */
const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: '记录技术、生活和思考。用文字沉淀知识，用分享连接世界。',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: '记录技术、生活和思考。',
    url: SITE_URL,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f19' },
  ],
}

/**
 * 在首次绘制之前决定主题。
 * 原来的实现是在 useEffect 里加 dark 类，也就是等 React 挂载完才切换，
 * 用户必然会看到一次白→黑的闪烁。
 */
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                padding: '10px 16px',
                fontSize: '14px',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 8px 24px -8px hsl(var(--shadow-color) / 0.25)',
              },
              success: { iconTheme: { primary: 'hsl(var(--success))', secondary: '#fff' } },
              error: { iconTheme: { primary: 'hsl(var(--destructive))', secondary: '#fff' } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
