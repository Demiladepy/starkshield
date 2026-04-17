import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWalletTools } from "./tools/wallet.js";
import { registerCoreTools } from "./tools/core.js";
import { registerTransferTools } from "./tools/transfer.js";
import { registerSwapTools } from "./tools/swap.js";
import { registerLendingTools } from "./tools/lending.js";
import { registerStakingTools } from "./tools/staking.js";
import { registerConfidentialTools } from "./tools/confidential.js";
import { registerQuantumTools } from "./tools/quantum.js";
import { registerResources } from "./resources/index.js";
export function createStarkshieldMcpServer() {
    const server = new McpServer({ name: "starkshield", version: "1.0.0" }, {
        instructions: "StarkShield executes Starknet operations via Starkzap inside this MCP process. Private keys never leave the server. Destructive tools return previews until confirm:true with previewId (unless STARKSHIELD_AUTO_CONFIRM=1). Use quantum_risk_scan for deterministic risk facts.",
    });
    registerWalletTools(server);
    registerCoreTools(server);
    registerTransferTools(server);
    registerSwapTools(server);
    registerLendingTools(server);
    registerStakingTools(server);
    registerConfidentialTools(server);
    registerQuantumTools(server);
    registerResources(server);
    return server;
}
//# sourceMappingURL=create-server.js.map