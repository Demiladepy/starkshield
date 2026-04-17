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
export function getSignerMode() {
    if (process.env.PRIVY_WALLET_ID && process.env.PRIVY_PUBLIC_KEY)
        return "privy";
    if (process.env.STARKNET_PRIVATE_KEY)
        return "private_key";
    return "unconfigured";
}
export function isConfidentialConfigured() {
    return Boolean(process.env.TONGO_PRIVATE_KEY && process.env.TONGO_CONTRACT);
}
//# sourceMappingURL=config.js.map