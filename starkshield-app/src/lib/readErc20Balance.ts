import { StarkZap, mainnetTokens, sepoliaTokens, type Token } from "starkzap";
import { telemetryError } from "@/lib/telemetry";

function tokenFor(symbol: string, network: "mainnet" | "sepolia"): Token | null {
  const map = network === "mainnet" ? mainnetTokens : sepoliaTokens;
  const k = symbol.toUpperCase() as keyof typeof mainnetTokens;
  return (map as Record<string, Token>)[k] ?? null;
}

function formatUnits(raw: bigint, decimals: number, sym: string): string {
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const frac = raw % base;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr.length ? `${whole.toString()}.${fracStr} ${sym}` : `${whole.toString()} ${sym}`;
}

export async function readErc20BalanceFormatted(
  network: "mainnet" | "sepolia",
  holder: string,
  symbol: string,
): Promise<string | null> {
  const result = await readErc20BalanceSafe(network, holder, symbol);
  return result.balance;
}

export type BalanceReadErrorKind = "timeout" | "unsupported_token" | "unknown";

export interface BalanceReadResult {
  balance: string | null;
  errorKind: BalanceReadErrorKind | null;
}

export async function readErc20BalanceSafe(
  network: "mainnet" | "sepolia",
  holder: string,
  symbol: string,
): Promise<BalanceReadResult> {
  const token = tokenFor(symbol, network);
  if (!token) return { balance: null, errorKind: "unsupported_token" };
  const sdk = new StarkZap({ network });
  const provider = sdk.getProvider();
  try {
    const res = await provider.callContract({
      contractAddress: token.address,
      entrypoint: "balanceOf",
      calldata: [holder],
    });
    const low = BigInt(res[0]);
    const high = res[1] !== undefined ? BigInt(res[1]) : 0n;
    const raw = (high << 128n) + low;
    return { balance: formatUnits(raw, token.decimals, token.symbol), errorKind: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const lower = msg.toLowerCase();
    const errorKind: BalanceReadErrorKind = lower.includes("timeout") ? "timeout" : "unknown";
    telemetryError("balance_read_failed", { symbol, network, reason: msg, errorKind });
    return { balance: null, errorKind };
  }
}
