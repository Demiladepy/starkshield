import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getOrCreateWallet } from "../wallet-manager.js";
import { resolvePresetToken } from "../tokens.js";
import { getNetwork } from "../config.js";

export function registerWalletResources(server: McpServer): void {
  server.registerResource(
    "wallet-address",
    "starknet://wallet/address",
    {
      title: "Wallet address",
      description: "Connected Starknet address for this MCP server process.",
      mimeType: "application/json",
    },
    async () => {
      const w = await getOrCreateWallet();
      return {
        contents: [
          {
            uri: "starknet://wallet/address",
            mimeType: "application/json",
            text: JSON.stringify({ address: w.address }),
          },
        ],
      };
    },
  );

  server.registerResource(
    "wallet-balances",
    "starknet://wallet/balances",
    {
      title: "Wallet balances",
      description: "Preset token balances (STRK, USDC, ETH, WBTC when available).",
      mimeType: "application/json",
    },
    async () => {
      const w = await getOrCreateWallet();
      const net = getNetwork();
      const symbols = ["STRK", "USDC", "ETH", "WBTC", "USDT"];
      const out: Record<string, string | null> = {};
      for (const s of symbols) {
        const t = resolvePresetToken(net, s);
        if (!t) {
          out[s] = null;
          continue;
        }
        try {
          const b = await w.balanceOf(t);
          out[s] = b.toFormatted();
        } catch {
          out[s] = "error";
        }
      }
      return {
        contents: [
          {
            uri: "starknet://wallet/balances",
            mimeType: "application/json",
            text: JSON.stringify(out, null, 2),
          },
        ],
      };
    },
  );
}
