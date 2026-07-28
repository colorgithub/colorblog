import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-lg max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSlug, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
