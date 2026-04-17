import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Amount } from "starkzap";
import type { LendingActionInput } from "starkzap";
import { getOrCreateWallet } from "../wallet-manager.js";
import { resolvePresetToken } from "../tokens.js";
import { getNetwork } from "../config.js";
import { jsonToolResult } from "../util/json-tool.js";
import { logToolCall } from "../tool-log.js";
import { consumePreview, createPreview } from "../confirmation.js";

const autoConfirm = () => process.env.STARKSHIELD_AUTO_CONFIRM === "1";

function tokens(net: ReturnType<typeof getNetwork>, collateral: string, debt: string) {
  const ct = resolvePresetToken(net, collateral);
  const dt = resolvePresetToken(net, debt);
  if (!ct || !dt) return { error: "Unknown collateral and/or debt token symbol." as const };
  return { ct, dt };
}

export function registerLendingTools(server: McpServer): void {
  server.registerTool(
    "lending_markets",
    {
      description: "List Vesu (default) lending markets via Starkzap.",
    },
    async () => {
      logToolCall("lending_markets", "list");
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const markets = await w.lending().getMarkets();
      return jsonToolResult(
        markets.map((m) => ({
          protocol: m.protocol,
          poolAddress: m.poolAddress,
          poolName: m.poolName,
          asset: m.asset.symbol,
          vTokenSymbol: m.vTokenSymbol,
          canBeBorrowed: m.canBeBorrowed,
        })),
      );
    },
  );

  server.registerTool(
    "lending_position",
    {
      description: "Read a Vesu borrow position for a collateral/debt pair.",
      inputSchema: {
        collateralToken: z.string(),
        debtToken: z.string(),
      },
    },
    async ({ collateralToken, debtToken }) => {
      logToolCall("lending_position", `${collateralToken}/${debtToken}`);
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const net = getNetwork();
      const t = tokens(net, collateralToken, debtToken);
      if ("error" in t) return jsonToolResult(t);
      const pos = await w.lending().getPosition({
        collateralToken: t.ct,
        debtToken: t.dt,
      });
      return jsonToolResult({
        collateralShares: pos.collateralShares.toString(),
        nominalDebt: pos.nominalDebt.toString(),
        collateralAmount: pos.collateralAmount?.toString() ?? null,
        debtAmount: pos.debtAmount?.toString() ?? null,
        collateralValue: pos.collateralValue.toString(),
        debtValue: pos.debtValue.toString(),
        isCollateralized: pos.isCollateralized,
      });
    },
  );

  server.registerTool(
    "lending_health",
    {
      description: "Read current lending health for a collateral/debt pair.",
      inputSchema: {
        collateralToken: z.string(),
        debtToken: z.string(),
      },
    },
    async ({ collateralToken, debtToken }) => {
      logToolCall("lending_health", `${collateralToken}/${debtToken}`);
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const net = getNetwork();
      const t = tokens(net, collateralToken, debtToken);
      if ("error" in t) return jsonToolResult(t);
      const h = await w.lending().getHealth({
        collateralToken: t.ct,
        debtToken: t.dt,
      });
      return jsonToolResult({
        isCollateralized: h.isCollateralized,
        collateralValue: h.collateralValue.toString(),
        debtValue: h.debtValue.toString(),
      });
    },
  );

  server.registerTool(
    "lending_simulate",
    {
      description:
        "Simulate a lending action and return provider preflight + optional projected health (quoteHealth).",
      inputSchema: {
        action: z.enum(["deposit", "withdraw", "borrow", "repay"]),
        collateralToken: z.string(),
        debtToken: z.string(),
        amount: z.string().optional().describe("Human amount for deposit/borrow/repay/withdraw"),
      },
    },
    async ({ action, collateralToken, debtToken, amount }) => {
      logToolCall("lending_simulate", action);
      const w = await getOrCreateWallet();
      await w.ensureReady({ deploy: "if_needed" });
      const net = getNetwork();
      const t = tokens(net, collateralToken, debtToken);
      if ("error" in t) return jsonToolResult(t);
      if (!amount) {
        return jsonToolResult({ error: "amount is required for lending_simulate." });
      }

      let actionInput: LendingActionInput;
      if (action === "deposit") {
        actionInput = {
          action: "deposit",
          request: { token: t.ct, amount: Amount.parse(amount, t.ct) },
        };
      } else if (action === "borrow") {
        actionInput = {
          action: "borrow",
          request: {
            collateralToken: t.ct,
            debtToken: t.dt,
            amount: Amount.parse(amount, t.dt),
          },
        };
      } else if (action === "repay") {
        actionInput = {
          action: "repay",
          request: {
            collateralToken: t.ct,
            debtToken: t.dt,
            amount: Amount.parse(amount, t.dt),
          },
        };
      } else {
        actionInput = {
          action: "withdraw",
          request: { token: t.ct, amount: Amount.parse(amount, t.ct) },
        };
      }

      const q = await w.lending().quoteHealth({
        action: actionInput,
        health: { collateralToken: t.ct, debtToken: t.dt },
      });
      return jsonToolResult({
        current: {
          isCollateralized: q.current.isCollateralized,
          collateralValue: q.current.collateralValue.toString(),
          debtValue: q.current.debtValue.toString(),
        },
        projected: q.projected
          ? {
              isCollateralized: q.projected.isCollateralized,
              collateralValue: q.projected.collateralValue.toString(),
              debtValue: q.projected.debtValue.toString(),
            }
          : null,
        simulation: q.simulation,
        prepared: {
          providerId: q.prepared.providerId,
          action: q.prepared.action,
        },
      });
    },
  );

  const lendingMut = (
    name: "lending_deposit" | "lending_borrow" | "lending_repay",
    kind: "lending_deposit" | "lending_borrow" | "lending_repay",
    describe: string,
  ) => {
    server.registerTool(
      name,
      {
        description: describe,
        inputSchema: {
          collateralToken: z.string().optional(),
          debtToken: z.string().optional(),
          token: z.string().optional(),
          amount: z.string(),
          poolAddress: z.string().optional(),
          previewId: z.string().optional(),
          confirm: z.boolean().optional(),
        },
      },
      async (args) => {
        const { amount, poolAddress, previewId, confirm, collateralToken, debtToken, token } = args;
        logToolCall(name, amount);
        const w = await getOrCreateWallet();
        await w.ensureReady({ deploy: "if_needed" });
        const net = getNetwork();

        const payloadBase = {
          collateralToken: collateralToken ?? null,
          debtToken: debtToken ?? null,
          token: token ?? null,
          amount,
          poolAddress: poolAddress ?? null,
        };

        if (!autoConfirm() && !confirm) {
          const id = createPreview(kind, payloadBase);
          return jsonToolResult({
            preview: true,
            previewId: id,
            summary: `${name} amount ${amount}`,
            next: `Call ${name} again with the same fields plus confirm:true and previewId.`,
          });
        }

        if (!autoConfirm()) {
          const stored = consumePreview<Record<string, unknown>>(previewId ?? "", kind);
          if (!stored || JSON.stringify(stored) !== JSON.stringify(payloadBase)) {
            return jsonToolResult({ error: "Invalid or expired previewId for lending action." });
          }
        }

        if (kind === "lending_deposit") {
          const sym = token ?? collateralToken;
          if (!sym) return jsonToolResult({ error: "token (or collateralToken) is required for deposit." });
          const tok = resolvePresetToken(net, sym);
          if (!tok) return jsonToolResult({ error: `Unknown token ${sym}` });
          const tx = await w.lending().deposit({
            token: tok,
            amount: Amount.parse(amount, tok),
            poolAddress: poolAddress as import("starkzap").Address | undefined,
          });
          await tx.wait();
          return jsonToolResult({ transactionHash: tx.hash, explorerUrl: tx.explorerUrl });
        }

        const ctSym = collateralToken;
        const dtSym = debtToken;
        if (!ctSym || !dtSym) {
          return jsonToolResult({ error: "collateralToken and debtToken are required for borrow/repay." });
        }
        const t = tokens(net, ctSym, dtSym);
        if ("error" in t) return jsonToolResult(t);

        if (kind === "lending_borrow") {
          const tx = await w.lending().borrow({
            collateralToken: t.ct,
            debtToken: t.dt,
            amount: Amount.parse(amount, t.dt),
            poolAddress: poolAddress as import("starkzap").Address | undefined,
          });
          await tx.wait();
          return jsonToolResult({ transactionHash: tx.hash, explorerUrl: tx.explorerUrl });
        }

        const tx = await w.lending().repay({
          collateralToken: t.ct,
          debtToken: t.dt,
          amount: Amount.parse(amount, t.dt),
          poolAddress: poolAddress as import("starkzap").Address | undefined,
        });
        await tx.wait();
        return jsonToolResult({ transactionHash: tx.hash, explorerUrl: tx.explorerUrl });
      },
    );
  };

  lendingMut(
    "lending_deposit",
    "lending_deposit",
    "Deposit into Vesu. Destructive: preview + confirm (or STARKSHIELD_AUTO_CONFIRM=1).",
  );
  lendingMut(
    "lending_borrow",
    "lending_borrow",
    "Borrow against collateral in Vesu. Destructive: preview + confirm.",
  );
  lendingMut(
    "lending_repay",
    "lending_repay",
    "Repay debt in Vesu. Destructive: preview + confirm.",
  );
}
