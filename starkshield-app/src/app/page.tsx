import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-20">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo">StarkShield</p>
      <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight text-gray-900 md:text-5xl">
        Quantum-proof your crypto with Starknet
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-gray-600">
        Deterministic quantum-risk scanning, Starkzap-powered transactions, and optional Tongo confidential flows — exposed
        to AI assistants only through a separate MCP process that never leaks private keys.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/dashboard"
          className="rounded-2xl bg-indigo px-8 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-indigo/90"
        >
          Open dashboard
        </Link>
        <a
          href="https://www.npmjs.com/package/starkshield-mcp"
          className="rounded-2xl border border-gray-200 bg-white px-8 py-3 text-center text-sm font-semibold text-gray-800 transition hover:border-indigo/40"
        >
          Install MCP package
        </a>
      </div>
      <p className="mt-8 text-sm text-gray-500">
        Developer path: run <code className="rounded bg-gray-100 px-1.5 py-0.5">starkshield-mcp</code> with stdio for
        Claude Desktop, or set <code className="rounded bg-gray-100 px-1.5 py-0.5">STARKSHIELD_HTTP_PORT</code> for HTTP
        + <code className="rounded bg-gray-100 px-1.5 py-0.5">GET /status</code>.
      </p>
    </main>
  );
}
