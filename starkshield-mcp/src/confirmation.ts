import { randomBytes } from "node:crypto";

export type PendingKind =
  | "swap_execute"
  | "transfer_send"
  | "transfer_batch"
  | "lending_deposit"
  | "lending_borrow"
  | "lending_repay"
  | "lending_withdraw"
  | "staking_enter"
  | "staking_claim"
  | "staking_exit_intent"
  | "staking_exit"
  | "confidential_fund"
  | "confidential_send"
  | "confidential_withdraw";

interface Pending {
  kind: PendingKind;
  payload: unknown;
  createdAt: number;
}

const store = new Map<string, Pending>();
const TTL_MS = 10 * 60 * 1000;

function cleanup(): void {
  const now = Date.now();
  for (const [k, v] of store) {
    if (now - v.createdAt > TTL_MS) store.delete(k);
  }
}

export function createPreview(kind: PendingKind, payload: unknown): string {
  cleanup();
  const id = randomBytes(16).toString("hex");
  store.set(id, { kind, payload, createdAt: Date.now() });
  return id;
}

export function consumePreview<T>(id: string, kind: PendingKind): T | null {
  cleanup();
  const p = store.get(id);
  if (!p || p.kind !== kind) return null;
  store.delete(id);
  return p.payload as T;
}
