import { type Token } from "starkzap";

export function validateHexAddress(value: string): string | null {
  const v = value.trim();
  if (!v) return "Recipient address is required.";
  if (!/^0x[0-9a-fA-F]+$/.test(v)) return "Recipient must be a 0x-prefixed hex address.";
  if (v.length < 10) return "Recipient address looks too short.";
  return null;
}

export function validatePositiveAmount(value: string): string | null {
  const v = value.trim();
  if (!v) return "Amount is required.";
  const n = Number(v);
  if (!Number.isFinite(n)) return "Amount must be a valid number.";
  if (n <= 0) return "Amount must be greater than 0.";
  return null;
}

export function tokenBySymbol(symbol: string, map: Record<string, Token>): Token | null {
  const normalized = symbol.trim().toUpperCase();
  return map[normalized] ?? null;
}

export function validateTokenSymbol(symbol: string, map: Record<string, Token>, label = "symbol"): string | null {
  if (!symbol.trim()) return `Token ${label} is required.`;
  if (!tokenBySymbol(symbol, map)) return `Unknown token ${label.toLowerCase()}.`;
  return null;
}
