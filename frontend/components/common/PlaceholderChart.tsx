export default function PlaceholderChart() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-4 w-40 rounded bg-slate-800 animate-pulse" />

        <div className="h-4 w-20 rounded bg-slate-800 animate-pulse" />
      </div>

      <div className="flex h-40 items-end gap-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="flex-1 rounded-t bg-slate-800 animate-pulse"
            style={{ height: `${20 + index * 5}%` }}
          />
        ))}
      </div>
    </div>
  )
}