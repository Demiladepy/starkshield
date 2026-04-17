export default function TransactLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-10 w-48 animate-pulse rounded-full bg-gray-100" />
      <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
      <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
    </div>
  );
}
