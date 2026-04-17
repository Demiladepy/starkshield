export function registerPriceResources(server) {
    server.registerResource("prices-btc", "starknet://prices/btc", {
        title: "BTC price note",
        mimeType: "text/plain",
    }, async () => ({
        contents: [
            {
                uri: "starknet://prices/btc",
                mimeType: "text/plain",
                text: "StarkShield does not stream live market prices in this MCP build.\n" +
                    "Use your exchange, indexer, or oracle integration for BTC/USD.\n" +
                    "This resource exists as a stable URI anchor for assistants.",
            },
        ],
    }));
    server.registerResource("prices-eth", "starknet://prices/eth", {
        title: "ETH price note",
        mimeType: "text/plain",
    }, async () => ({
        contents: [
            {
                uri: "starknet://prices/eth",
                mimeType: "text/plain",
                text: "StarkShield does not stream live market prices in this MCP build.\n" +
                    "Use your exchange, indexer, or oracle integration for ETH/USD.\n",
            },
        ],
    }));
}
//# sourceMappingURL=prices.js.map