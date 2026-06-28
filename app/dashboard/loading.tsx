
export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Stats Skeleton */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`bg-white/5 border border-white/10 rounded-xl p-4 h-[88px] ${i === 1 ? 'md:col-span-2' : ''} animate-pulse`} />
        ))}
      </div>

      {/* Toolbar Skeleton */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-wrap">
        <div className="h-10 bg-white/5 rounded-lg w-[300px] animate-pulse" />
        <div className="flex gap-4">
            <div className="h-10 bg-white/5 rounded-lg w-40 animate-pulse" />
            <div className="h-10 bg-white/5 rounded-lg w-40 animate-pulse" />
            <div className="h-10 bg-white/5 rounded-lg w-40 animate-pulse" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="max-w-7xl mx-auto glass rounded-2xl overflow-hidden border border-white/10">
        <div className="p-4 border-b border-white/10 bg-white/5">
            <div className="flex justify-between">
                <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
                <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
            </div>
        </div>
        <div className="divide-y divide-white/5">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 flex justify-between items-center">
                    <div className="h-5 w-48 bg-white/5 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
                    <div className="h-5 w-32 bg-white/5 rounded animate-pulse" />
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
