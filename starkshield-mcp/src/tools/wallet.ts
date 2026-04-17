import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getOrCreateWallet } from "../wallet-manager.js";
import { resolvePresetToken } from "../tokens.js";
import { getNetwork } from "../config.js";
import { jsonToolResult } from "../util/json-tool.js";
import { logToolCall } from "../tool-log.js";

export function registerWalletTools(server: McpServer): void {
  server.registerTool(
    "wallet_address",
    {
      description: "Return the configured Starknet wallet address (no private material).",
    },
    async () => {
      logToolCall("wallet_address", "read address");
      const w = await getOrCreateWallet();
      return jsonToolResult({ address: w.address });
    },
  );

  server.registerTool(
    "wallet_create",
    {
      description:
        "Ensure the wallet account is deployed on-chain (account abstraction deploy if needed).",
      inputSchema: {
        feeMode: z
          .enum(["user_pays", "sponsored"])
          .optional()
          .describe("Fee payer mode for deployment, if deployment is required."),
      },
    },
    async ({ feeMode }) => {
      logToolCall("wallet_create", "ensureReady");
      const w = await getOrCreateWallet();
      await w.ensureReady({
        deploy: "if_needed",
        feeMode: feeMode ?? w.getFeeMode(),
      });
      const deployed = await w.isDeployed();
      return jsonToolResult({
        address: w.address,
        deployed,
        classHash: w.getClassHash(),
      });
    },
  );

  server.registerTool(
    "wallet_balance",
    {
      description: "Read ERC20 balance for a preset token symbol (Starkzap mainnet/sepolia presets).",
      inputSchema: {
        symbol: z.string().describe("Token symbol, e.g. STRK, USDC, WBTC, ETH"),
      },
    },
    async ({ symbol }) => {
      logToolCall("wallet_balance", symbol);
      const w = await getOrCreateWallet();
      const token = resolvePresetToken(getNetwork(), symbol);
      if (!token) {
        return jsonToolResult({
          error: `Unknown preset token symbol: ${symbol}`,
          hint: "Try STRK, USDC, ETH, WBTC, USDT, or USDC_E on this network.",
        });
      }
      const bal = await w.balanceOf(token);
      return jsonToolResult({
        symbol: token.symbol,
        balance: bal.toFormatted(),
        raw: bal.toBase().toString(),
      });
    },
  );
}
