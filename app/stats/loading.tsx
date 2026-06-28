
export default function StatsLoading() {
  return (
    <div className="min-h-screen p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Skeleton */}
            <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mb-8" />

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 h-32 animate-pulse" />
                 ))}
            </div>
            
             {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-[400px] animate-pulse" />
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-[400px] animate-pulse" />
            </div>
        </div>
    </div>
  );
}
