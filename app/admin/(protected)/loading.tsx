/**
 * 后台内容骨架。
 *
 * 放在 (protected) 段内部，AdminShell（侧栏 + 顶栏）在 Suspense 边界之外，
 * 切换页面时外壳不会跟着闪一下。
 */
export default function AdminLoading() {
  return (
    <div>
      <div className="skeleton h-8 w-40" />
      <div className="skeleton mt-3 h-5 w-64 max-w-full" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-surface p-5">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton mt-4 h-8 w-16" />
            <div className="skeleton mt-3 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="card-surface mt-8 p-5">
        <div className="skeleton h-5 w-28" />
        <div className="mt-5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-2 w-2 rounded-full" />
              <div className="skeleton h-4 flex-1" />
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
