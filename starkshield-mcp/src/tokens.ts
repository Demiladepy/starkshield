import {
  mainnetTokens,
  sepoliaTokens,
  type Token,
} from "starkzap";
import type { StarkshieldNetwork } from "./config.js";

const ALIASES: Record<string, string> = {
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

export function resolvePresetToken(
  network: StarkshieldNetwork,
  symbol: string,
): Token | null {
  const map = network === "mainnet" ? mainnetTokens : sepoliaTokens;
  const key = (ALIASES[symbol.toUpperCase()] ?? symbol.toUpperCase()) as keyof typeof mainnetTokens;
  const t = (map as Record<string, Token | undefined>)[key];
  return t ?? null;
}
