"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";

export function WalletHeader() {
  const w = useWallet();
  const [wid, setWid] = useState("");
  const [pk, setPk] = useState("");
  const [url, setUrl] = useState("");

  return (
    <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Wallet</div>
      {w.displayAddress ? (
        <div className="mt-2 break-all font-mono text-sm text-gray-900">{w.displayAddress}</div>
      ) : (
        <div className="mt-2 text-sm text-gray-600">Not connected</div>
      )}
      <div className="mt-2 text-xs text-gray-500">
        Mode: {w.mode ?? "—"} · Starkzap txs: {w.canTransact ? "ready" : "needs Cartridge or Privy"}
      </div>
      <div className="mt-1 text-xs text-gray-500">
        Confidential shielding is executed via MCP tools, not by this browser wallet panel.
      </div>
      {w.busy && <div className="mt-2 text-sm text-indigo">{w.busy}</div>}
      {w.error && <div className="mt-2 text-sm text-danger">{w.error}</div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => w.connectCartridge()}
          className="rounded-xl bg-indigo px-3 py-2 text-xs font-semibold text-white hover:bg-indigo/90"
        >
          Cartridge
        </button>
        <button
          type="button"
          onClick={() => w.connectExtension()}
          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:border-indigo/40"
        >
          Extension
        </button>
        <button
          type="button"
          onClick={() => w.disconnectAll()}
          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          Disconnect
        </button>
      </div>
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="text-xs font-semibold text-gray-700">Privy signer (advanced)</div>
        <p className="mt-1 text-xs text-gray-500">
          Use your backend signer endpoint. The app never stores your private key in browser state.
        </p>
        <div className="mt-2 grid gap-2">
          <input
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
            placeholder="wallet id (required)"
            value={wid}
            onChange={(e) => setWid(e.target.value)}
          />
          <input
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
            placeholder="public key hex, e.g. 0x04ab..."
            value={pk}
            onChange={(e) => setPk(e.target.value)}
          />
          <input
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
            placeholder="sign URL, e.g. https://api.example.com/wallet/sign"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="button"
            onClick={() => w.connectPrivy({ walletId: wid, publicKey: pk, serverUrl: url })}
            className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
          >
            Connect Privy signer
          </button>
        </div>
      </div>
    </div>
  );
}
