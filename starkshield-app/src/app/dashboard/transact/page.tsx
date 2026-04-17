"use client";

import { useMemo, useState } from "react";
import { Amount, fromAddress, mainnetTokens, sepoliaTokens, type Token } from "starkzap";
import { useWallet } from "@/context/WalletContext";
import { txExplorerUrl } from "@/lib/explorer";
import { telemetryError, telemetryInfo } from "@/lib/telemetry";
import { tokenBySymbol, validateHexAddress, validatePositiveAmount, validateTokenSymbol } from "@/lib/validation";

type TxState = "idle" | "pending" | "success" | "error";

const TX_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Transaction timed out. You can retry safely.")), ms);
    }),
  ]);
}

export default function TransactPage() {
  const { wallet, canTransact, network } = useWallet();
  const [confidential, setConfidential] = useState(false);
  const [tab, setTab] = useState<"send" | "swap">("send");
  const [symbol, setSymbol] = useState("STRK");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenOut, setTokenOut] = useState("USDC");
  const [log, setLog] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<"send" | "swap" | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txState, setTxState] = useState<TxState>("idle");

  const tokenMap = useMemo(() => {
    const map = network === "mainnet" ? mainnetTokens : sepoliaTokens;
    return map as unknown as Record<string, Token>;
  }, [network]);
  const knownSymbols = useMemo(() => Object.keys(tokenMap).sort().join(", "), [tokenMap]);

  function currentValidation(forAction: "send" | "swap"): string | null {
    const symbolErr = validateTokenSymbol(symbol, tokenMap, forAction === "send" ? "symbol" : "in");
    if (symbolErr) return symbolErr;
    const amountErr = validatePositiveAmount(amount);
    if (amountErr) return amountErr;
    if (forAction === "send") {
      const addrErr = validateHexAddress(to);
      if (addrErr) return addrErr;
      return null;
    }
    const outErr = validateTokenSymbol(tokenOut, tokenMap, "out");
    if (outErr) return outErr;
    return null;
  }

  async function runWithLifecycle(action: "send" | "swap", fn: () => Promise<{ hash: string }>) {
    setLastAction(action);
    setError(null);
    setLog(null);
    setTxHash(null);
    setTxState("pending");
    try {
      const tx = await withTimeout(fn(), TX_TIMEOUT_MS);
      setTxHash(tx.hash);
      setTxState("success");
      setLog(`${action === "send" ? "Sent" : "Swapped"} successfully.`);
      telemetryInfo("transaction_success", { action, network, txHash: tx.hash });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTxState("error");
      setError(msg);
      setLog("Transaction failed. Fix the issue and retry.");
      telemetryError("transaction_failed", { action, network, reason: msg });
    }
  }

  async function send() {
    const validationError = currentValidation("send");
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!wallet) {
      const msg = "Connect Cartridge or Privy to run Starkzap transfers in the browser.";
      setError(msg);
      return;
    }
    await runWithLifecycle("send", async () => {
      const token = tokenBySymbol(symbol, tokenMap);
      if (!token) throw new Error("Unknown token symbol.");
      const tx = await wallet.transfer(token, [
        { to: fromAddress(to.trim()), amount: Amount.parse(amount.trim(), token) },
      ]);
      await withTimeout(tx.wait(), TX_TIMEOUT_MS);
      return { hash: tx.hash };
    });
  }

  async function swap() {
    const validationError = currentValidation("swap");
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!wallet) {
      const msg = "Connect Cartridge or Privy to run swaps.";
      setError(msg);
      return;
    }
    await runWithLifecycle("swap", async () => {
      const a = tokenBySymbol(symbol, tokenMap);
      const b = tokenBySymbol(tokenOut, tokenMap);
      if (!a || !b) throw new Error("Unknown token pair.");
      const tx = await wallet.swap({
        tokenIn: a,
        tokenOut: b,
        amountIn: Amount.parse(amount.trim(), a),
      });
      await withTimeout(tx.wait(), TX_TIMEOUT_MS);
      return { hash: tx.hash };
    });
  }

  const submitDisabled = txState === "pending" || !canTransact;
  const badgeClass =
    txState === "success"
      ? "bg-emerald-safe/15 text-emerald-safe"
      : txState === "error"
        ? "bg-red-100 text-danger"
        : txState === "pending"
          ? "bg-amber-100 text-amber-700"
          : "bg-gray-100 text-gray-700";

  function retryLast() {
    if (txState === "pending") return;
    if (lastAction === "send") {
      void send();
      return;
    }
    if (lastAction === "swap") {
      void swap();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("send")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "send" ? "bg-indigo text-white" : "border border-gray-200 bg-white text-gray-800"
          }`}
        >
          Send
        </button>
        <button
          type="button"
          onClick={() => setTab("swap")}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            tab === "swap" ? "bg-indigo text-white" : "border border-gray-200 bg-white text-gray-800"
          }`}
        >
          Swap
        </button>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <input
          type="checkbox"
          checked={confidential}
          onChange={(e) => setConfidential(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo"
        />
        <div>
          <div className="text-sm font-semibold text-gray-900">Confidential (Tongo)</div>
          <div className="text-xs text-gray-600">
            Browser transactions here are standard Starknet send/swap calls. Confidential execution must run via
            <code className="mx-1 rounded bg-gray-100 px-1">starkshield-mcp</code>
            confidential tools.
          </div>
        </div>
      </label>
      {confidential && (
        <div className="rounded-2xl border border-emerald-safe/30 bg-emerald-safe/10 p-4 text-sm text-emerald-safe">
          Confidential mode selected. To actually shield amounts, execute the operation via MCP
          <code className="mx-1 rounded bg-emerald-safe/20 px-1">confidential_*</code>
          tools in your assistant session.
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        {!canTransact && (
          <p className="mb-4 text-sm text-amber-800">
            Read-only or extension mode: connect Cartridge or Privy to sign Starkzap transactions here.
          </p>
        )}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-semibold ${badgeClass}`}>
            {txState === "idle" ? "Idle" : txState === "pending" ? "Pending" : txState === "success" ? "Success" : "Error"}
          </span>
          <span className="text-gray-500">Supported symbols: {knownSymbols}</span>
        </div>
        {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {tab === "send" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Token symbol" hint="Example: STRK, ETH, USDC" value={symbol} onChange={setSymbol} />
            <Field label="Recipient (hex)" hint="0x-prefixed Starknet address" value={to} onChange={setTo} />
            <Field label="Amount" hint="Use decimal format, e.g. 1.25" value={amount} onChange={setAmount} />
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void send()}
                disabled={submitDisabled}
                className="w-full rounded-xl bg-indigo py-2.5 text-sm font-semibold text-white hover:bg-indigo/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {txState === "pending" && lastAction === "send" ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Token in" hint="Example: STRK" value={symbol} onChange={setSymbol} />
            <Field label="Token out" hint="Example: USDC" value={tokenOut} onChange={setTokenOut} />
            <Field label="Amount in" hint="Use decimal format, e.g. 0.5" value={amount} onChange={setAmount} />
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void swap()}
                disabled={submitDisabled}
                className="w-full rounded-xl bg-indigo py-2.5 text-sm font-semibold text-white hover:bg-indigo/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {txState === "pending" && lastAction === "swap" ? "Swapping..." : "Swap"}
              </button>
            </div>
          </div>
        )}
        {txState === "error" && lastAction && (
          <button
            type="button"
            onClick={retryLast}
            className="mt-3 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Retry last {lastAction}
          </button>
        )}
        {log && <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-xs text-gray-800">{log}</pre>}
        {txHash && (
          <a
            className="mt-3 inline-block text-xs font-semibold text-indigo hover:underline"
            href={txExplorerUrl(network, txHash)}
            target="_blank"
            rel="noreferrer"
          >
            View transaction on Starkscan
          </a>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
      <input
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
