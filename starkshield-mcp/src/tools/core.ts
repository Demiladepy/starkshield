import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getHttpPort, getNetwork, getSignerMode, isConfidentialConfigured } from "../config.js";
import { getOrCreateWallet } from "../wallet-manager.js";
import { jsonToolResult } from "../util/json-tool.js";
import { logToolCall } from "../tool-log.js";

export function registerCoreTools(server: McpServer): void {
  server.registerTool(
    "server_health",
    {
      description: "Return MCP runtime health, config mode, and feature readiness.",
    },
    async () => {
      logToolCall("server_health", "runtime summary");
      const signerMode = getSignerMode();
      const walletReady = signerMode !== "unconfigured";
      return jsonToolResult({
        ok: true,
        service: "starkshield-mcp",
        network: getNetwork(),
        transport: getHttpPort() ? "http+stdio-capable" : "stdio",
        signerMode,
        walletConfigured: walletReady,
        confidentialConfigured: isConfidentialConfigured(),
        autoConfirm: process.env.STARKSHIELD_AUTO_CONFIRM === "1",
      });
    },
  );

  server.registerTool(
    "wallet_health",
    {
      description: "Validate wallet connectivity and optionally ensure account deployment.",
      inputSchema: {
        ensureDeployed: z.boolean().optional().describe("If true, runs ensureReady(deploy:if_needed)."),
      },
    },
    async ({ ensureDeployed }) => {
      logToolCall("wallet_health", ensureDeployed ? "ensure deployed" : "read only");
      try {
        const wallet = await getOrCreateWallet();
        if (ensureDeployed) {
          await wallet.ensureReady({ deploy: "if_needed" });
        }
        const deployed = await wallet.isDeployed();
        return jsonToolResult({
          ok: true,
          address: wallet.address,
          deployed,
          classHash: wallet.getClassHash(),
          network: getNetwork(),
        });
      } catch (e) {
        return jsonToolResult({
          ok: false,
          network: getNetwork(),
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
  );
}
