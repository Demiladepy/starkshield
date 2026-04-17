"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { telemetryError, telemetryInfo } from "@/lib/telemetry";

export default function McpStatusPage() {
  const [data, setData] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let failCount = 0;
    async function load() {
      try {
        const r = await fetch("/api/mcp-status", { cache: "no-store" });
        const j = await r.json();
        if (!cancelled) {
          setData(j);
          setErr(null);
          failCount = 0;
        }
        telemetryInfo("mcp_status_fetch_ok", { status: r.status });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setErr(msg);
        failCount += 1;
        telemetryError("mcp_status_fetch_failed", { reason: msg, failures: failCount });
      }
    }
    void load();
    const id = setInterval(() => void load(), 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const install = JSON.stringify(
    {
      mcpServers: {
        starkshield: {
          command: "npx",
          args: ["-y", "starkshield-mcp"],
          env: {
            STARKNET_NETWORK: "mainnet",
            STARKNET_PRIVATE_KEY: "0xYOUR_DEV_KEY",
          },
        },
      },
    },
    null,
    2,
  );

  const statusUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/mcp-status`
      : "https://your-host/api/mcp-status";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">MCP connection</h2>
        <p className="mt-1 text-sm text-gray-600">
          This page reads <code className="rounded bg-gray-100 px-1">/api/mcp-status</code>, which proxies to your
          separate <code className="rounded bg-gray-100 px-1">starkshield-mcp</code> process via{" "}
          <code className="rounded bg-gray-100 px-1">GET /status</code> when{" "}
          <code className="rounded bg-gray-100 px-1">MCP_STATUS_URL</code> is set on the Next server.
        </p>
        {err && <p className="mt-3 text-sm text-danger">{err}</p>}
        <pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-gray-50 p-4 text-xs text-gray-800">
          {JSON.stringify(data, null, 2)}
        </pre>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-md font-semibold text-gray-900">Claude Desktop snippet</h3>
        <pre className="mt-3 overflow-auto rounded-xl bg-gray-900 p-4 text-xs text-gray-100">{install}</pre>
        <button
          type="button"
          className="mt-3 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          onClick={async () => {
            await navigator.clipboard.writeText(install);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied" : "Copy install JSON"}
        </button>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-md font-semibold text-gray-900">Mobile / HTTP MCP</h3>
        <p className="mt-2 text-sm text-gray-600">
          QR encodes this app&apos;s status proxy URL (not your raw MCP port). Point{" "}
          <code className="rounded bg-gray-100 px-1">MCP_STATUS_URL</code> at{" "}
          <code className="rounded bg-gray-100 px-1">http://host:port/status</code> from starkshield-mcp HTTP mode.
        </p>
        <div className="mt-4 inline-block rounded-xl border border-gray-100 p-3">
          <QRCodeSVG value={statusUrl} size={160} />
        </div>
      </section>
    </div>
  );
}
