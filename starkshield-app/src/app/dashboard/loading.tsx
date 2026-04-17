export default function DashboardLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-8 w-64 animate-pulse rounded bg-gray-100" />
      <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
}
