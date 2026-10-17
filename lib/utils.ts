import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 固定时区，避免服务端（通常是 UTC）与客户端（用户本地时区）
 * 对同一个时间戳算出不同日期，触发 hydration 不一致。
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai',
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai',
  })
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/** 把 "技术, 生活 ,, 技术" 解析成去重后的标签数组。 */
export function parseTagList(tags: string | null | undefined): string[] {
  if (!tags) return []
  return [...new Set(tags.split(',').map((t) => t.trim()).filter(Boolean))]
}

/** 估算阅读时长：中文按字数、英文按词数，取一个粗略的合计。 */
export function readingTime(content: string): number {
  const cjk = (content.match(/[\u4e00-\u9fa5]/g) || []).length
  const words = content.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(Boolean).length
  // 中文 400 字/分钟，英文 200 词/分钟
  return Math.max(1, Math.round(cjk / 400 + words / 200))
}

/** 取正文纯文本用于摘要。 */
export function plainExcerpt(markdown: string, length = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return truncate(text, length)
}
