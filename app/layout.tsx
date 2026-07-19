import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'My Blog', template: '%s | My Blog' },
  description: 'A personal blog built with Next.js',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster position="top-right"
            toastOptions={{ duration: 3000, style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' } }} />
        </ThemeProvider>
      </body>
    </html>
  )
}
