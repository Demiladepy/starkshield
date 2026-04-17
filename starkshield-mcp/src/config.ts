export type StarkshieldNetwork = "mainnet" | "sepolia";

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
