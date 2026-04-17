export type StarkshieldNetwork = "mainnet" | "sepolia";
export type SignerMode = "privy" | "private_key" | "unconfigured";

export function getNetwork(): StarkshieldNetwork {
  const n = (process.env.STARKNET_NETWORK || "mainnet").toLowerCase();
  if (n === "sepolia" || n === "testnet") return "sepolia";
  return "mainnet";
}

export function getHttpPort(): number | undefined {
  const raw = process.env.STARKSHIELD_HTTP_PORT;
  if (!raw) return undefined;
  const p = Number(raw);
  return Number.isFinite(p) && p > 0 ? p : undefined;
}

export function getSignerMode(): SignerMode {
  if (process.env.PRIVY_WALLET_ID && process.env.PRIVY_PUBLIC_KEY) return "privy";
  if (process.env.STARKNET_PRIVATE_KEY) return "private_key";
  return "unconfigured";
}

export function isConfidentialConfigured(): boolean {
  return Boolean(process.env.TONGO_PRIVATE_KEY && process.env.TONGO_CONTRACT);
}
