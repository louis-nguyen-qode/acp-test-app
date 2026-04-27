export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-lg bg-white border border-gray-200 p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
