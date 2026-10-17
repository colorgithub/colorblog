/** 文章页骨架。 */
export default function PostLoading() {
  return (
    <div className="container-prose py-12 sm:py-16">
      <div className="skeleton h-4 w-32" />

      <div className="mt-10 flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>

      <div className="skeleton mt-5 h-10 w-full" />
      <div className="skeleton mt-3 h-10 w-2/3" />

      <div className="skeleton mt-6 h-5 w-full" />
      <div className="skeleton mt-2 h-5 w-4/5" />

      <div className="mt-8 flex gap-5 border-t border-border pt-6">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-4 w-24" />
      </div>

      <div className="mt-10 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-4" style={{ width: `${72 + ((i * 7) % 26)}%` }} />
        ))}
      </div>
    </div>
  )
}
