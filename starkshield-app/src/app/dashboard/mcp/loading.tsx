export default function McpLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-36 animate-pulse rounded-2xl bg-gray-100" />
      <div className="h-36 animate-pulse rounded-2xl bg-gray-100" />
      <div className="h-36 animate-pulse rounded-2xl bg-gray-100" />
    </div>
  );
}
