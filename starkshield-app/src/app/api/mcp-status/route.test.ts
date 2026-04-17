import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/mcp-status/route";

describe("/api/mcp-status GET", () => {
  const oldEnv = process.env;

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...oldEnv };
  });

  it("returns guidance when MCP status URL is not set", async () => {
    process.env = { ...oldEnv, MCP_STATUS_URL: "", NEXT_PUBLIC_MCP_STATUS_URL: "" };
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(String(body.message)).toContain("Set MCP_STATUS_URL");
  });

  it("normalizes JSON payload from configured status endpoint", async () => {
    process.env = { ...oldEnv, MCP_STATUS_URL: "http://127.0.0.1:8787/status" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ ok: true, mode: "http", network: "mainnet" }),
      })),
    );

    const res = await GET();
    const body = await res.json();

    expect(global.fetch).toHaveBeenCalledWith("http://127.0.0.1:8787/status", { cache: "no-store" });
    expect(res.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      message: "MCP status fetched.",
      data: { ok: true, mode: "http", network: "mainnet" },
    });
  });

  it("maps upstream non-ok responses to 502 schema", async () => {
    process.env = { ...oldEnv, MCP_STATUS_URL: "http://127.0.0.1:8787/status" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ ok: false, reason: "service unavailable" }),
      })),
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.message).toContain("Upstream MCP status endpoint returned non-OK.");
  });

  it("returns timeout/network failures as 502", async () => {
    process.env = { ...oldEnv, MCP_STATUS_URL: "http://127.0.0.1:8787/status" };
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("network down"))));
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.message).toContain("network down");
  });
});
