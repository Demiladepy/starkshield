import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWalletResources } from "./wallet.js";
import { registerMarketResources } from "./markets.js";
import { registerPriceResources } from "./prices.js";
import { registerQuantumResources } from "./quantum.js";

export function registerResources(server: McpServer): void {
  registerWalletResources(server);
  registerMarketResources(server);
  registerPriceResources(server);
  registerQuantumResources(server);
}
