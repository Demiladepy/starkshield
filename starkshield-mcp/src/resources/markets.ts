import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPresets, ChainId } from "starkzap";
import { getOrCreateWallet } from "../wallet-manager.js";
import { getNetwork } from "../config.js";

export function registerMarketResources(server: McpServer): void {
  server.registerResource(
    "markets-vesu",
    "starknet://markets/vesu",
    {
      title: "Vesu markets",
      mimeType: "application/json",
    },
    async () => {
      const w = await getOrCreateWallet();
      const markets = await w.lending().getMarkets();
      return {
        contents: [
          {
            uri: "starknet://markets/vesu",
            mimeType: "application/json",
            text: JSON.stringify(
              markets.map((m) => ({
                protocol: m.protocol,
                poolAddress: m.poolAddress,
                poolName: m.poolName,
                asset: m.asset.symbol,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerResource(
    "markets-tokens",
    "starknet://markets/tokens",
    {
      title: "Preset tokens",
      mimeType: "application/json",
    },
    async () => {
      const chainId = getNetwork() === "mainnet" ? ChainId.MAINNET : ChainId.SEPOLIA;
      const presets = getPresets(chainId);
      const keys = Object.keys(presets).sort();
      return {
        contents: [
          {
            uri: "starknet://markets/tokens",
            mimeType: "application/json",
            text: JSON.stringify(
              keys.map((k) => {
                const t = presets[k];
                return { symbol: t.symbol, address: t.address, decimals: t.decimals };
              }),
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
