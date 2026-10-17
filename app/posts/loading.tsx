/** 归档页骨架。放在 /posts 段而不是根段，避免把后台外壳也一起包进 Suspense。 */
export default function PostsLoading() {
  return (
    <div className="container-page py-14 sm:py-20">
      <div className="skeleton h-9 w-48" />
      <div className="skeleton mt-3 h-5 w-72 max-w-full" />
      <div className="skeleton mt-10 h-11 w-full" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-6 w-16 rounded-full" />
        ))}
      </div>

      <div className="mt-9 grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-surface p-6">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton mt-4 h-6 w-3/4" />
            <div className="skeleton mt-3 h-4 w-full" />
            <div className="skeleton mt-2 h-4 w-2/3" />
            <div className="mt-6 flex gap-2">
              <div className="skeleton h-6 w-14 rounded-full" />
              <div className="skeleton h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
