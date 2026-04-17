import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Amount } from "starkzap";
import { getOrCreateWallet } from "../wallet-manager.js";
import { resolvePresetToken } from "../tokens.js";
import { getNetwork } from "../config.js";
import { jsonToolResult } from "../util/json-tool.js";
import { logToolCall } from "../tool-log.js";
import { consumePreview, createPreview } from "../confirmation.js";

const autoConfirm = () => process.env.STARKSHIELD_AUTO_CONFIRM === "1";

export function registerSwapTools(server: McpServer): void {
  server.registerTool(
    "swap_quote",
    {
      description: "Get a swap quote via the default Starkzap swap provider (AVNU).",
      inputSchema: {
        tokenIn: z.string(),
        tokenOut: z.string(),
        amountIn: z.string().describe('Amount of tokenIn to sell, human units, e.g. "10"'),
        slippageBps: z.coerce.bigint().optional(),
      },
    },
    async ({ tokenIn, tokenOut, amountIn, slippageBps }) => {
      logToolCall("swap_quote", `${tokenIn} -> ${tokenOut}`);
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const net = getNetwork();
      const a = resolvePresetToken(net, tokenIn);
      const b = resolvePresetToken(net, tokenOut);
      if (!a || !b) {
        return jsonToolResult({ error: "Unknown tokenIn and/or tokenOut preset symbol." });
      }
      const quote = await w.getQuote({
        tokenIn: a,
        tokenOut: b,
        amountIn: Amount.parse(amountIn, a),
        slippageBps,
      });
      return jsonToolResult({
        amountInBase: quote.amountInBase.toString(),
        amountOutBase: quote.amountOutBase.toString(),
        priceImpactBps: quote.priceImpactBps?.toString() ?? null,
        provider: quote.provider ?? null,
      });
    },
  );

  server.registerTool(
    "swap_execute",
    {
      description:
        "Execute a swap via AVNU (default). Destructive: returns preview unless STARKSHIELD_AUTO_CONFIRM=1.",
      inputSchema: {
        tokenIn: z.string(),
        tokenOut: z.string(),
        amountIn: z.string(),
        slippageBps: z.coerce.bigint().optional(),
        previewId: z.string().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      const { tokenIn, tokenOut, amountIn, slippageBps, previewId, confirm } = args;
      logToolCall("swap_execute", `${tokenIn} -> ${tokenOut}`);
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const net = getNetwork();
      const a = resolvePresetToken(net, tokenIn);
      const b = resolvePresetToken(net, tokenOut);
      if (!a || !b) {
        return jsonToolResult({ error: "Unknown tokenIn and/or tokenOut preset symbol." });
      }

      const swapPayload = {
        tokenIn,
        tokenOut,
        amountIn,
        slippageBps: slippageBps?.toString() ?? null,
      };

      if (!autoConfirm() && !confirm) {
        const quote = await w.getQuote({
          tokenIn: a,
          tokenOut: b,
          amountIn: Amount.parse(amountIn, a),
          slippageBps,
        });
        const id = createPreview("swap_execute", swapPayload);
        return jsonToolResult({
          preview: true,
          previewId: id,
          quote: {
            amountInBase: quote.amountInBase.toString(),
            amountOutBase: quote.amountOutBase.toString(),
            priceImpactBps: quote.priceImpactBps?.toString() ?? null,
          },
          next: "Call swap_execute again with the same parameters plus confirm:true and previewId.",
        });
      }

      if (!autoConfirm()) {
        const payload = consumePreview<typeof swapPayload>(previewId ?? "", "swap_execute");
        const same =
          payload &&
          payload.tokenIn === swapPayload.tokenIn &&
          payload.tokenOut === swapPayload.tokenOut &&
          payload.amountIn === swapPayload.amountIn &&
          (payload.slippageBps ?? null) === (swapPayload.slippageBps ?? null);
        if (!same) {
          return jsonToolResult({ error: "Invalid or expired previewId for swap_execute." });
        }
      }

      const tx = await w.swap({
        tokenIn: a,
        tokenOut: b,
        amountIn: Amount.parse(amountIn, a),
        slippageBps,
      });
      await tx.wait();
      return jsonToolResult({ transactionHash: tx.hash, explorerUrl: tx.explorerUrl });
    },
  );
}
