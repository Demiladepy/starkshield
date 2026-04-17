import { registerWalletResources } from "./wallet.js";
import { registerMarketResources } from "./markets.js";
import { registerPriceResources } from "./prices.js";
import { registerQuantumResources } from "./quantum.js";
export function registerResources(server) {
    registerWalletResources(server);
    registerMarketResources(server);
    registerPriceResources(server);
    registerQuantumResources(server);
}
//# sourceMappingURL=index.js.map