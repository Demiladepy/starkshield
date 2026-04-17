import { mainnetTokens, sepoliaTokens, } from "starkzap";
const ALIASES = {
    USDC_E: "USDC_E",
    "USDC.E": "USDC_E",
    "USDC-E": "USDC_E",
    WBTC: "WBTC",
    BTC: "WBTC",
    STRK: "STRK",
    USDC: "USDC",
    ETH: "ETH",
    USDT: "USDT",
};
export function resolvePresetToken(network, symbol) {
    const map = network === "mainnet" ? mainnetTokens : sepoliaTokens;
    const key = (ALIASES[symbol.toUpperCase()] ?? symbol.toUpperCase());
    const t = map[key];
    return t ?? null;
}
//# sourceMappingURL=tokens.js.map