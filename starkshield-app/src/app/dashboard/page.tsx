"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { assessQuantumRisk, type QuantumRiskResult } from "@/lib/quantum";
import { readErc20BalanceSafe, type BalanceReadErrorKind } from "@/lib/readErc20Balance";

const ASSETS = ["STRK", "USDC", "ETH", "WBTC"] as const;

function riskScore(r: QuantumRiskResult["overallRisk"]): number {
  switch (r) {
    case "LOW":
      return 90;
    case "MEDIUM":
      return 65;
    case "HIGH":
      return 40;
    case "CRITICAL":
      return 15;
    default:
      return 50;
  }
}

function badgeClass(r: QuantumRiskResult["overallRisk"]): string {
  if (r === "LOW") return "bg-emerald-safe/15 text-emerald-safe";
  if (r === "MEDIUM") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-danger";
}

export default function DashboardPage() {
  const { displayAddress, network, canTransact } = useWallet();
  const [rows, setRows] = useState<
    { symbol: string; balance: string | null; scan: QuantumRiskResult; balanceError: BalanceReadErrorKind | null }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!displayAddress) {
        setRows([]);
        return;
      }
      setLoading(true);
      try {
        const next: typeof rows = [];
        for (const sym of ASSETS) {
          const bal = await readErc20BalanceSafe(network, displayAddress, sym);
          const scan = assessQuantumRisk(
            `${sym} on Starknet`,
            "starknet",
            canTransact ? "account_abstraction" : "account_abstraction",
          );
          next.push({ symbol: sym, balance: bal.balance, balanceError: bal.errorKind, scan });
        }
        if (!cancelled) setRows(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [displayAddress, network, canTransact]);

  const overall = useMemo(() => {
    if (!rows.length) return null;
    const avg = rows.reduce((a, r) => a + riskScore(r.scan.overallRisk), 0) / rows.length;
    return Math.round(avg);
  }, [rows]);

  const failedBalanceReads = useMemo(
    () => rows.filter((r) => r.balance === null).map((r) => `${r.symbol} (${r.balanceError ?? "unknown"})`),
    [rows],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Quantum safety score</h2>
        <p className="mt-1 text-sm text-gray-600">
          Derived from the same deterministic <code className="rounded bg-gray-100 px-1">assessQuantumRisk</code>{" "}
          function as the MCP tool (no LLM inside the scorer).
        </p>
        {!displayAddress ? (
          <p className="mt-4 text-sm text-gray-600">Connect a wallet to compute balances and per-asset cards.</p>
        ) : loading ? (
          <p className="mt-4 text-sm text-gray-600">Loading balances…</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div
              className={`text-5xl font-bold ${
                overall !== null && overall >= 75
                  ? "text-emerald-safe"
                  : overall !== null && overall >= 50
                    ? "text-amber-600"
                    : "text-danger"
              }`}
            >
              {overall ?? "—"}
            </div>
            <p className="max-w-md text-sm text-gray-600">
              Higher means lower modeled quantum protocol risk for these Starknet-held assets, based on STARK proof
              layer facts and account abstraction upgrade paths — not investment advice.
            </p>
          </div>
        )}
        {!!failedBalanceReads.length && (
          <p className="mt-4 text-xs text-amber-700">
            Balance unavailable for {failedBalanceReads.join(", ")}. Check RPC availability and token support on{" "}
            {network}.
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <article key={row.symbol} className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{row.symbol}</h3>
                <p className="text-sm text-gray-600">Balance: {row.balance ?? "—"}</p>
                {row.balanceError && (
                  <p className="text-xs text-amber-700">Balance read issue: {row.balanceError.replace("_", " ")}</p>
                )}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(row.scan.overallRisk)}`}>
                {row.scan.overallRisk}
              </span>
            </div>
            <dl className="mt-4 space-y-2 text-sm text-gray-700">
              <div className="flex justify-between gap-2">
                <dt>Proof system</dt>
                <dd className="font-medium text-right">{row.scan.proofSystem}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Signature upgradable</dt>
                <dd className="font-medium">{row.scan.signatureUpgradable ? "Yes" : "No"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Hash layer</dt>
                <dd className="max-w-[60%] text-right text-xs text-gray-600">{row.scan.hashFunction}</dd>
              </div>
            </dl>
            <button
              type="button"
              disabled={!canTransact}
              className="mt-4 w-full rounded-xl border border-indigo/30 bg-indigo/5 py-2 text-sm font-semibold text-indigo disabled:cursor-not-allowed disabled:opacity-40"
              title={canTransact ? "" : "Connect Cartridge or Privy to shield via Starkzap in this app."}
            >
              Shield (Tongo via MCP)
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
