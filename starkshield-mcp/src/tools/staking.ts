import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Amount, fromAddress } from "starkzap";
import { getOrCreateWallet, getReadonlyStarkZap } from "../wallet-manager.js";
import { resolvePresetToken } from "../tokens.js";
import { getNetwork } from "../config.js";
import { jsonToolResult } from "../util/json-tool.js";
import { logToolCall } from "../tool-log.js";
import { consumePreview, createPreview } from "../confirmation.js";

const autoConfirm = () => process.env.STARKSHIELD_AUTO_CONFIRM === "1";

export function registerStakingTools(server: McpServer): void {
  server.registerTool(
    "staking_pools",
    {
      description: "List delegation pools for a validator staker address (Starkzap staking API).",
      inputSchema: {
        stakerAddress: z.string().describe("Validator staker contract address (hex)"),
      },
    },
    async ({ stakerAddress }) => {
      logToolCall("staking_pools", stakerAddress);
      const sdk = getReadonlyStarkZap();
      const pools = await sdk.getStakerPools(fromAddress(stakerAddress));
      return jsonToolResult(
        pools.map((p) => ({
          poolAddress: p.poolContract,
          token: p.token.symbol,
          amount: p.amount.toFormatted(),
        })),
      );
    },
  );

  server.registerTool(
    "staking_enter",
    {
      description:
        "Enter or add to a staking pool with a preset token amount. Destructive: preview + confirm.",
      inputSchema: {
        poolAddress: z.string(),
        symbol: z.string().describe("Stake token symbol, usually STRK"),
        amount: z.string(),
        previewId: z.string().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async ({ poolAddress, symbol, amount, previewId, confirm }) => {
      logToolCall("staking_enter", poolAddress);
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const net = getNetwork();
      const token = resolvePresetToken(net, symbol);
      if (!token) return jsonToolResult({ error: `Unknown token ${symbol}` });
      const amt = Amount.parse(amount, token);
      const pool = fromAddress(poolAddress);

      const payload = { poolAddress, symbol, amount };

      if (!autoConfirm() && !confirm) {
        const id = createPreview("staking_enter", payload);
        return jsonToolResult({
          preview: true,
          previewId: id,
          summary: `Stake ${amt.toFormatted()} into pool ${poolAddress}`,
          next: "Call staking_enter again with confirm:true and previewId.",
        });
      }

      if (!autoConfirm()) {
        const stored = consumePreview<typeof payload>(previewId ?? "", "staking_enter");
        if (!stored || JSON.stringify(stored) !== JSON.stringify(payload)) {
          return jsonToolResult({ error: "Invalid or expired previewId for staking_enter." });
        }
      }

      const tx = await w.stake(pool, amt);
      await tx.wait();
      return jsonToolResult({ transactionHash: tx.hash, explorerUrl: tx.explorerUrl });
    },
  );

  server.registerTool(
    "staking_claim",
    {
      description: "Claim staking rewards from a pool. Destructive: preview + confirm.",
      inputSchema: {
        poolAddress: z.string(),
        previewId: z.string().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async ({ poolAddress, previewId, confirm }) => {
      logToolCall("staking_claim", poolAddress);
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const pool = fromAddress(poolAddress);
      const payload = { poolAddress };

      if (!autoConfirm() && !confirm) {
        const id = createPreview("staking_claim", payload);
        return jsonToolResult({
          preview: true,
          previewId: id,
          summary: `Claim rewards for pool ${poolAddress}`,
          next: "Call staking_claim again with confirm:true and previewId.",
        });
      }

      if (!autoConfirm()) {
        const stored = consumePreview<typeof payload>(previewId ?? "", "staking_claim");
        if (!stored || stored.poolAddress !== poolAddress) {
          return jsonToolResult({ error: "Invalid or expired previewId for staking_claim." });
        }
      }

      const tx = await w.claimPoolRewards(pool);
      await tx.wait();
      return jsonToolResult({ transactionHash: tx.hash, explorerUrl: tx.explorerUrl });
    },
  );
}
