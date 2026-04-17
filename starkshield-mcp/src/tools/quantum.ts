import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  assessQuantumRisk,
  type QuantumChain,
  type QuantumWalletType,
} from "@starkshield/shared";
import { fromAddress } from "starkzap";
import { getReadonlyStarkZap } from "../wallet-manager.js";
import { jsonToolResult } from "../util/json-tool.js";
import { logToolCall } from "../tool-log.js";

async function starknetOnChainChecks(input: {
  starknetTokenAddress?: string;
  starknetAddress?: string;
}): Promise<{
  starknetTokenContractFound?: boolean | null;
  starknetAddressHasNonce?: boolean | null;
}> {
  const out: {
    starknetTokenContractFound?: boolean | null;
    starknetAddressHasNonce?: boolean | null;
  } = {};
  const sdk = getReadonlyStarkZap();
  const provider = sdk.getProvider();

  if (input.starknetTokenAddress) {
    try {
      const cls = await provider.getClassAt(fromAddress(input.starknetTokenAddress));
      out.starknetTokenContractFound = cls !== null && cls !== undefined;
    } catch {
      out.starknetTokenContractFound = null;
    }
  }

  if (input.starknetAddress) {
    try {
      const nonce = await provider.getNonceForAddress(fromAddress(input.starknetAddress));
      out.starknetAddressHasNonce = BigInt(nonce) > 0n;
    } catch {
      out.starknetAddressHasNonce = null;
    }
  }

  return out;
}

export function registerQuantumTools(server: McpServer): void {
  server.registerTool(
    "quantum_risk_scan",
    {
      description:
        "Deterministic quantum-risk facts + optional Starknet RPC checks (no model inference in tool code).",
      inputSchema: {
        asset: z.string().describe("Human label for the asset being discussed"),
        chain: z.enum(["starknet", "bitcoin", "ethereum"]),
        walletType: z.enum(["account_abstraction", "eoa", "p2pkh", "p2tr"]),
        starknetTokenAddress: z
          .string()
          .optional()
          .describe("Optional Starknet ERC20 contract to verify deployment via RPC"),
        starknetAddress: z
          .string()
          .optional()
          .describe("Optional Starknet address to read nonce via RPC"),
      },
    },
    async ({ asset, chain, walletType, starknetTokenAddress, starknetAddress }) => {
      logToolCall("quantum_risk_scan", `${chain}/${walletType}`);
      const onChain =
        chain === "starknet"
          ? await starknetOnChainChecks({ starknetTokenAddress, starknetAddress })
          : undefined;
      const result = assessQuantumRisk(
        asset,
        chain as QuantumChain,
        walletType as QuantumWalletType,
        onChain,
      );
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    "quantum_report",
    {
      description: "Return the same structured scan as quantum_risk_scan (alias for reporting workflows).",
      inputSchema: {
        asset: z.string(),
        chain: z.enum(["starknet", "bitcoin", "ethereum"]),
        walletType: z.enum(["account_abstraction", "eoa", "p2pkh", "p2tr"]),
        starknetTokenAddress: z.string().optional(),
        starknetAddress: z.string().optional(),
      },
    },
    async (args) => {
      logToolCall("quantum_report", args.chain);
      const onChain =
        args.chain === "starknet"
          ? await starknetOnChainChecks({
              starknetTokenAddress: args.starknetTokenAddress,
              starknetAddress: args.starknetAddress,
            })
          : undefined;
      const result = assessQuantumRisk(
        args.asset,
        args.chain as QuantumChain,
        args.walletType as QuantumWalletType,
        onChain,
      );
      return jsonToolResult({ report: true, ...result });
    },
  );
}
