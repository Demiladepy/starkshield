import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Amount, fromAddress } from "starkzap";
import { getOrCreateWallet } from "../wallet-manager.js";
import { resolvePresetToken } from "../tokens.js";
import { getNetwork } from "../config.js";
import { jsonToolResult } from "../util/json-tool.js";
import { logToolCall } from "../tool-log.js";
import { consumePreview, createPreview } from "../confirmation.js";

const autoConfirm = () => process.env.STARKSHIELD_AUTO_CONFIRM === "1";

export function registerTransferTools(server: McpServer): void {
  server.registerTool(
    "transfer_send",
    {
      description:
        "Send a single ERC20 transfer. Destructive: returns a preview first unless STARKSHIELD_AUTO_CONFIRM=1.",
      inputSchema: {
        symbol: z.string(),
        to: z.string().describe("Recipient Starknet address (hex)"),
        amount: z.string().describe('Human-readable amount, e.g. "25"'),
        previewId: z.string().optional().describe("From prior preview response"),
        confirm: z.boolean().optional().describe("Must be true with previewId to execute"),
      },
    },
    async ({ symbol, to, amount, previewId, confirm }) => {
      logToolCall("transfer_send", `${symbol} -> ${to}`);
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const token = resolvePresetToken(getNetwork(), symbol);
      if (!token) {
        return jsonToolResult({ error: `Unknown token symbol ${symbol}` });
      }
      const parsed = Amount.parse(amount, token);
      const recipient = fromAddress(to);

      if (!autoConfirm() && !confirm) {
        const id = createPreview("transfer_send", { symbol, to, amount });
        return jsonToolResult({
          preview: true,
          previewId: id,
          summary: `Send ${parsed.toFormatted()} to ${recipient}`,
          next: "Call transfer_send again with the same symbol, to, amount plus confirm:true and previewId.",
        });
      }

      if (!autoConfirm()) {
        const payload = consumePreview<{ symbol: string; to: string; amount: string }>(
          previewId ?? "",
          "transfer_send",
        );
        if (!payload || payload.symbol !== symbol || payload.to !== to || payload.amount !== amount) {
          return jsonToolResult({
            error: "Invalid or expired previewId for this transfer payload.",
          });
        }
      }

      const tx = await w.transfer(token, [{ to: recipient, amount: parsed }]);
      await tx.wait();
      return jsonToolResult({
        transactionHash: tx.hash,
        explorerUrl: tx.explorerUrl,
      });
    },
  );

  server.registerTool(
    "transfer_batch",
    {
      description:
        "Send multiple ERC20 transfers in one transaction (same token). Destructive: preview + confirm.",
      inputSchema: {
        symbol: z.string(),
        transfers: z
          .array(
            z.object({
              to: z.string(),
              amount: z.string(),
            }),
          )
          .min(1),
        previewId: z.string().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async ({ symbol, transfers, previewId, confirm }) => {
      logToolCall("transfer_batch", `${symbol} x${transfers.length}`);
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const token = resolvePresetToken(getNetwork(), symbol);
      if (!token) {
        return jsonToolResult({ error: `Unknown token symbol ${symbol}` });
      }

      const normalized = transfers.map((t) => ({
        to: fromAddress(t.to),
        amount: Amount.parse(t.amount, token),
      }));

      if (!autoConfirm() && !confirm) {
        const id = createPreview("transfer_batch", { symbol, transfers });
        return jsonToolResult({
          preview: true,
          previewId: id,
          summary: `${normalized.length} transfers totaling ${normalized
            .reduce((a, x) => a + x.amount.toBase(), 0n)
            .toString()} raw base units (sum of different decimals may be meaningless)`,
          next: "Call transfer_batch again with confirm:true and previewId.",
        });
      }

      if (!autoConfirm()) {
        const payload = consumePreview<{
          symbol: string;
          transfers: { to: string; amount: string }[];
        }>(previewId ?? "", "transfer_batch");
        if (
          !payload ||
          payload.symbol !== symbol ||
          JSON.stringify(payload.transfers) !== JSON.stringify(transfers)
        ) {
          return jsonToolResult({ error: "Invalid or expired previewId for batch transfer." });
        }
      }

      const tx = await w.transfer(
        token,
        normalized.map((x) => ({ to: x.to, amount: x.amount })),
      );
      await tx.wait();
      return jsonToolResult({ transactionHash: tx.hash, explorerUrl: tx.explorerUrl });
    },
  );
}
