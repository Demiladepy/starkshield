import Link from "next/link";
import { DashboardNav } from "@/components/DashboardNav";
import { WalletHeader } from "@/components/WalletHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-col gap-6 border-b border-gray-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/" className="text-sm font-medium text-indigo hover:underline">
            ← StarkShield home
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Control panel</h1>
          <p className="text-sm text-gray-600">Quantum safety, wallets, and MCP visibility.</p>
        </div>
        <WalletHeader />
      </header>
      <DashboardNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
