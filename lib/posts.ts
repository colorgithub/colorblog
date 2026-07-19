import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'posts')

export interface PostMeta {
  slug: string
  title: string
  excerpt: string
  tags: string
  date: string
  published: boolean
}

export interface Post extends PostMeta {
  content: string
}

function readFile(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    return {
      slug,
      title: data.title || slug,
      excerpt: data.excerpt || '',
      tags: data.tags || '',
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      published: data.published !== false,
      content,
    }
  } catch {
    return null
  }
}

export function getPostBySlug(slug: string): Post | null {
  return readFile(slug)
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDirectory)) return []

  const fileNames = fs.readdirSync(postsDirectory)
  const posts = fileNames
    .filter((fn) => fn.endsWith('.md'))
    .map((fn) => readFile(fn.replace(/\.md$/, '')))
    .filter((p): p is Post => p !== null && p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return posts
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) return []

  return fs
    .readdirSync(postsDirectory)
    .filter((fn) => fn.endsWith('.md'))
    .map((fn) => fn.replace(/\.md$/, ''))
}


