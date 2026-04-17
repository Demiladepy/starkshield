import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Amount } from "starkzap";
import { getConfidential, getOrCreateWallet } from "../wallet-manager.js";
import { resolvePresetToken } from "../tokens.js";
import { getNetwork } from "../config.js";
import { jsonToolResult } from "../util/json-tool.js";
import { logToolCall } from "../tool-log.js";
import { consumePreview, createPreview } from "../confirmation.js";

const autoConfirm = () => process.env.STARKSHIELD_AUTO_CONFIRM === "1";

export function registerConfidentialTools(server: McpServer): void {
  server.registerTool(
    "confidential_balance",
    {
      description: "Read decrypted Tongo confidential account state (balance, pending, nonce).",
    },
    async () => {
      logToolCall("confidential_balance", "read");
      const c = await getConfidential();
      const state = await c.getState();
      return jsonToolResult({
        balance: state.balance.toString(),
        pending: state.pending.toString(),
        nonce: state.nonce.toString(),
      });
    },
  );

  server.registerTool(
    "confidential_fund",
    {
      description:
        "Shield public ERC20 into Tongo confidential balance. Destructive: preview + confirm.",
      inputSchema: {
        symbol: z.string(),
        amount: z.string(),
        previewId: z.string().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async ({ symbol, amount, previewId, confirm }) => {
      logToolCall("confidential_fund", symbol);
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const c = await getConfidential();
      const net = getNetwork();
      const token = resolvePresetToken(net, symbol);
      if (!token) return jsonToolResult({ error: `Unknown token ${symbol}` });
      const amt = Amount.parse(amount, token);
      const payload = { symbol, amount };

      if (!autoConfirm() && !confirm) {
        const id = createPreview("confidential_fund", payload);
        return jsonToolResult({
          preview: true,
          previewId: id,
          summary: `Fund confidential balance with ${amt.toFormatted()} (${symbol})`,
          next: "Call confidential_fund again with confirm:true and previewId.",
        });
      }

      if (!autoConfirm()) {
        const stored = consumePreview<typeof payload>(previewId ?? "", "confidential_fund");
        if (!stored || stored.symbol !== symbol || stored.amount !== amount) {
          return jsonToolResult({ error: "Invalid or expired previewId for confidential_fund." });
        }
      }

      const tx = await w.tx().confidentialFund(c, { amount: amt, sender: w.address }).send();
      await tx.wait();
      return jsonToolResult({ transactionHash: tx.hash, explorerUrl: tx.explorerUrl });
    },
  );

  server.registerTool(
    "confidential_send",
    {
      description:
        "Private confidential transfer to a recipient identity {x,y}. Destructive: preview + confirm.",
      inputSchema: {
        symbol: z.string().describe("ERC20 preset used to parse amount semantics"),
        amount: z.string(),
        recipientX: z.string(),
        recipientY: z.string(),
        previewId: z.string().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async ({ symbol, amount, recipientX, recipientY, previewId, confirm }) => {
      logToolCall("confidential_send", symbol);
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const c = await getConfidential();
      const net = getNetwork();
      const token = resolvePresetToken(net, symbol);
      if (!token) return jsonToolResult({ error: `Unknown token ${symbol}` });
      const amt = Amount.parse(amount, token);
      const to = { x: recipientX, y: recipientY };
      const payload = { symbol, amount, recipientX, recipientY };

      if (!autoConfirm() && !confirm) {
        const id = createPreview("confidential_send", payload);
        return jsonToolResult({
          preview: true,
          previewId: id,
          summary: `Confidential send ${amt.toFormatted()} to Tongo recipient`,
          next: "Call confidential_send again with confirm:true and previewId.",
        });
      }

      if (!autoConfirm()) {
        const stored = consumePreview<typeof payload>(previewId ?? "", "confidential_send");
        if (!stored || JSON.stringify(stored) !== JSON.stringify(payload)) {
          return jsonToolResult({ error: "Invalid or expired previewId for confidential_send." });
        }
      }

      const tx = await w
        .tx()
        .confidentialTransfer(c, { amount: amt, to, sender: w.address })
        .send();
      await tx.wait();
      return jsonToolResult({ transactionHash: tx.hash, explorerUrl: tx.explorerUrl });
    },
  );

  server.registerTool(
    "confidential_withdraw",
    {
      description:
        "Unshield confidential balance to a public Starknet address. Destructive: preview + confirm.",
      inputSchema: {
        symbol: z.string(),
        amount: z.string(),
        to: z.string().describe("Public Starknet recipient address"),
        previewId: z.string().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async ({ symbol, amount, to, previewId, confirm }) => {
      logToolCall("confidential_withdraw", symbol);
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const c = await getConfidential();
      const net = getNetwork();
      const token = resolvePresetToken(net, symbol);
      if (!token) return jsonToolResult({ error: `Unknown token ${symbol}` });
      const amt = Amount.parse(amount, token);
      const payload = { symbol, amount, to };

      if (!autoConfirm() && !confirm) {
        const id = createPreview("confidential_withdraw", payload);
        return jsonToolResult({
          preview: true,
          previewId: id,
          summary: `Withdraw ${amt.toFormatted()} to public ${to}`,
          next: "Call confidential_withdraw again with confirm:true and previewId.",
        });
      }

      if (!autoConfirm()) {
        const stored = consumePreview<typeof payload>(previewId ?? "", "confidential_withdraw");
        if (!stored || JSON.stringify(stored) !== JSON.stringify(payload)) {
          return jsonToolResult({ error: "Invalid or expired previewId for confidential_withdraw." });
        }
      }

      const tx = await w
        .tx()
        .confidentialWithdraw(c, {
          amount: amt,
          to: to as import("starkzap").Address,
          sender: w.address,
        })
        .send();
      await tx.wait();
      return jsonToolResult({ transactionHash: tx.hash, explorerUrl: tx.explorerUrl });
    },
  );
}
