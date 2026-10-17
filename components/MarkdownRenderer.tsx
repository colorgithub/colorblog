import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '@/lib/utils'

/**
 * 白名单消毒规则。
 *
 * 在默认规则（GitHub 风格）基础上做两点放宽：
 *  - 允许 code/span 上的 className，否则代码高亮的 hljs-* 类会被清掉；
 *  - 允许 img 的 loading 属性。
 * 默认规则本身已经会剥掉 script / iframe / style / object / form、
 * 所有 on* 事件属性，以及 javascript: 协议。
 */
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ['className']],
    span: [...(defaultSchema.attributes?.span ?? []), ['className']],
    img: [...(defaultSchema.attributes?.img ?? []), 'loading'],
  },
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * 文章正文渲染。
 *
 * 插件顺序很关键：先 rehypeRaw 解析原始 HTML，紧接着 rehypeSanitize 消毒；
 * rehypeSlug / rehypeHighlight 放在消毒之后，它们生成的 id 和 className
 * 才不会被清掉。
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose prose-base dark:prose-invert sm:prose-lg', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeSlug, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

/**
 * 评论渲染。
 *
 * 刻意不启用 rehypeRaw —— 评论来自任意注册用户，一旦允许原始 HTML，
 * 一条 <script> 或 <iframe srcdoc> 就能在所有访客（含管理员）浏览器里
 * 执行，进而以管理员身份调用后台接口。评论只需要 Markdown 就够了。
 * 即便将来要放开 HTML，也必须像上面那样配 rehypeSanitize。
 */
export function CommentMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{content}</ReactMarkdown>
    </div>
  )
}
