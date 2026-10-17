/** 文章字段的解析与校验，创建和更新共用。 */

import { POST_TITLE_MAX, POST_SLUG_MAX, POST_EXCERPT_MAX } from './constants'

export const POST_LIMITS = {
  title: POST_TITLE_MAX,
  slug: POST_SLUG_MAX,
  excerpt: POST_EXCERPT_MAX,
  content: 200_000,
  tags: 200,
} as const

const SLUG_PATTERN = /^[\w\u4e00-\u9fa5-]+$/

export interface PostInput {
  title: string
  slug: string
  content: string
  excerpt: string
  tags: string
  published: boolean
}

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string }

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

/**
 * 校验文章输入。
 *
 * 不带 partial 时用于创建：所有字段都会被填齐，返回完整的 PostInput。
 * 带 partial 时用于更新：只校验请求里出现的字段，缺省字段不写库。
 */
export function parsePostInput(body: unknown, partial?: false): ParseResult<PostInput>
export function parsePostInput(body: unknown, partial: true): ParseResult<Partial<PostInput>>
export function parsePostInput(
  body: unknown,
  partial = false
): ParseResult<Partial<PostInput>> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: '请求体格式不正确' }
  }
  const raw = body as Record<string, unknown>
  const data: Partial<PostInput> = {}

  const has = (key: string) => Object.prototype.hasOwnProperty.call(raw, key)

  if (has('title') || !partial) {
    const title = asString(raw.title).trim()
    if (!title) return { ok: false, error: '标题不能为空' }
    if (title.length > POST_LIMITS.title) {
      return { ok: false, error: `标题不能超过 ${POST_LIMITS.title} 个字符` }
    }
    data.title = title
  }

  if (has('slug') || !partial) {
    const slug = asString(raw.slug).trim()
    if (!slug) return { ok: false, error: 'Slug 不能为空' }
    if (slug.length > POST_LIMITS.slug) {
      return { ok: false, error: `Slug 不能超过 ${POST_LIMITS.slug} 个字符` }
    }
    if (!SLUG_PATTERN.test(slug)) {
      return { ok: false, error: 'Slug 只能包含字母、数字、中文、下划线和连字符' }
    }
    data.slug = slug
  }

  if (has('content') || !partial) {
    const content = asString(raw.content)
    if (!content.trim()) return { ok: false, error: '内容不能为空' }
    if (content.length > POST_LIMITS.content) {
      return { ok: false, error: '内容过长' }
    }
    data.content = content
  }

  if (has('excerpt')) {
    const excerpt = asString(raw.excerpt).trim()
    if (excerpt.length > POST_LIMITS.excerpt) {
      return { ok: false, error: `摘要不能超过 ${POST_LIMITS.excerpt} 个字符` }
    }
    data.excerpt = excerpt
  } else if (!partial) {
    data.excerpt = ''
  }

  if (has('tags')) {
    const tags = asString(raw.tags).trim()
    if (tags.length > POST_LIMITS.tags) {
      return { ok: false, error: `标签不能超过 ${POST_LIMITS.tags} 个字符` }
    }
    data.tags = tags
  } else if (!partial) {
    data.tags = ''
  }

  if (has('published')) {
    data.published = raw.published === true
  } else if (!partial) {
    data.published = false
  }

  return { ok: true, data }
}

/** 把 "技术, 生活 ,, 技术" 解析成去重后的标签数组。 */
export function parseTags(tags: string): string[] {
  return [...new Set(tags.split(',').map((t) => t.trim()).filter(Boolean))]
}
