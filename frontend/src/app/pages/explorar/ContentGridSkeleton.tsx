export function ContentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" aria-label="A carregar conteúdos">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl border border-orange-100/50 shadow-xs overflow-hidden flex flex-col"
        >
          <div className="h-48 bg-slate-200 animate-pulse" />
          <div className="p-6">
            <div className="flex gap-2 mb-4">
              <div className="h-4 w-16 rounded-md bg-orange-100 animate-pulse" />
              <div className="h-4 w-20 rounded-md bg-orange-100 animate-pulse" />
            </div>
            <div className="h-5 w-4/5 rounded bg-slate-200 animate-pulse" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-11/12 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-slate-100 animate-pulse" />
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-orange-100 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
                <div className="h-2.5 w-32 rounded bg-slate-100 animate-pulse" />
              </div>
            </div>
            <div className="mt-5 h-10 w-full rounded-xl bg-slate-200 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
