import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MCP_TIMEOUT_MS = 5000;

type McpStatusResponse = {
  ok: boolean;
  message: string;
  data?: unknown;
};

function json(body: McpStatusResponse, status: number) {
  return NextResponse.json(body, { status });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("MCP status request timed out")), ms)),
  ]);
}

export async function GET() {
  const url = process.env.MCP_STATUS_URL || process.env.NEXT_PUBLIC_MCP_STATUS_URL;
  if (!url) {
    return json(
      {
        ok: false,
        message:
          "Set MCP_STATUS_URL (server) or NEXT_PUBLIC_MCP_STATUS_URL to your starkshield-mcp GET /status endpoint.",
      },
      400,
    );
  }
  try {
    const r = await withTimeout(fetch(url, { cache: "no-store" }), MCP_TIMEOUT_MS);
    const body: unknown = await r.json();
    if (!r.ok) {
      return json({ ok: false, message: "Upstream MCP status endpoint returned non-OK.", data: body }, 502);
    }
    const normalizedOk =
      typeof body === "object" &&
      body !== null &&
      "ok" in body &&
      typeof (body as { ok?: unknown }).ok === "boolean"
        ? (body as { ok: boolean }).ok
        : true;
    return json({ ok: normalizedOk, message: "MCP status fetched.", data: body }, 200);
  } catch (e) {
    return json({ ok: false, message: e instanceof Error ? e.message : String(e) }, 502);
  }
}
