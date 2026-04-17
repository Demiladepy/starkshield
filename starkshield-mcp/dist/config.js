export function getNetwork() {
    const n = (process.env.STARKNET_NETWORK || "mainnet").toLowerCase();
    if (n === "sepolia" || n === "testnet")
        return "sepolia";
    return "mainnet";
}
export function getHttpPort() {
    const raw = process.env.STARKSHIELD_HTTP_PORT;
    if (!raw)
        return undefined;
    const p = Number(raw);
    return Number.isFinite(p) && p > 0 ? p : undefined;
}
//# sourceMappingURL=config.js.map