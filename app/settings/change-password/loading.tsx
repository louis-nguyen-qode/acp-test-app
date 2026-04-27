export default function ChangePasswordLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-4">
          <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
          <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
              <div className="h-9 w-full rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
          <div className="h-9 w-full rounded bg-gray-200 animate-pulse" />
        </div>
      </main>
    </div>
  )
}
