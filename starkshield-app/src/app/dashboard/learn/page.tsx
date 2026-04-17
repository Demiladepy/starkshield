"use client";

import { useState } from "react";
import { assessQuantumRisk, type QuantumChain, type QuantumWalletType } from "@/lib/quantum";

export default function LearnPage() {
  const [asset, setAsset] = useState("STRK on Starknet");
  const [chain, setChain] = useState<QuantumChain>("starknet");
  const [walletType, setWalletType] = useState<QuantumWalletType>("account_abstraction");

  const scan = assessQuantumRisk(asset, chain, walletType);

  return (
    <div className="space-y-10">
      <article className="max-w-none space-y-3 text-sm leading-relaxed text-gray-800">
        <h2 className="text-xl font-semibold text-gray-900">Why quantum risk matters</h2>
        <p>
          Quantum algorithms can change the cost of attacking certain cryptographic assumptions. STARK-based validity
          proofs lean on hash functions with different asymptotics than ECDSA on elliptic curves. StarkShield separates{" "}
          <strong>facts encoded in the tool</strong> from <strong>natural-language explanation</strong> in the
          assistant.
        </p>
        <h3 className="text-lg font-semibold text-gray-900">Timeline (verify at sources)</h3>
        <ul>
          <li>Google research discussions (March 2026) — check Google Research channels.</li>
          <li>Osuntokun commentary (April 2026) — check primary blog or mailing list archives.</li>
          <li>StarkWare / Starknet quantum messaging (April 2026) — check official StarkWare posts.</li>
        </ul>
      </article>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Check any model (deterministic)</h3>
        <p className="mt-1 text-sm text-gray-600">
          This uses the shared <code className="rounded bg-gray-100 px-1">assessQuantumRisk</code> library — the same
          core as MCP <code className="rounded bg-gray-100 px-1">quantum_risk_scan</code> (browser build without RPC
          add-ons).
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium text-gray-700">Asset label</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-gray-700">Chain</span>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              value={chain}
              onChange={(e) => setChain(e.target.value as QuantumChain)}
            >
              <option value="starknet">Starknet</option>
              <option value="bitcoin">Bitcoin</option>
              <option value="ethereum">Ethereum L1</option>
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="font-medium text-gray-700">Wallet / output model</span>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              value={walletType}
              onChange={(e) => setWalletType(e.target.value as QuantumWalletType)}
            >
              <option value="account_abstraction">account_abstraction</option>
              <option value="eoa">eoa</option>
              <option value="p2pkh">p2pkh</option>
              <option value="p2tr">p2tr</option>
            </select>
          </label>
        </div>
        <pre className="mt-6 max-h-96 overflow-auto rounded-xl bg-gray-50 p-4 text-xs text-gray-900">
          {JSON.stringify(scan, null, 2)}
        </pre>
      </section>
    </div>
  );
}
